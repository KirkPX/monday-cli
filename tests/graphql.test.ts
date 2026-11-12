import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClient, assertSafeEndpoint, isMutation, isMondayHost } from "../src/client.js";
import { ApiError, TimeoutError } from "../src/errors.js";

const BASE = "https://api.example.com";

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

function makeClient(extra: Partial<ConstructorParameters<typeof ApiClient>[0]> = {}): ApiClient {
  return new ApiClient({ baseUrl: BASE, apiKey: "secret-key", retryBaseDelayMs: 0, ...extra });
}

afterEach(() => vi.unstubAllGlobals());

describe("isMutation", () => {
  it.each([
    "mutation { create_item { id } }",
    'mutation M($a: Int) { x(a: $a) }',
    "  # note\n  mutation { x }",
    "query Q { a } mutation M { x }",
    "{ unbalanced",
    "# x\rmutation { delete_item(item_id: 1) { id } }",
  ])("%j counts as a mutation", (doc) => expect(isMutation(doc)).toBe(true));

  it.each([
    "{ boards { id } }",
    "query { boards { id } }",
    'query { items(name: "mutation") { id } }',
    "# mutation\nquery { a }",
    "query ($mutation: Int) { a(b: $mutation) }",
    "query { mutation { id } }",
  ])("%j is a read", (doc) => expect(isMutation(doc)).toBe(false));
});

describe("graphql transport", () => {
  it("posts to /v2 with the token as it is, and no API version", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ data: { a: 1 } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(makeClient().query("{ a }")).resolves.toEqual({ a: 1 });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.example.com/v2");
    expect(init.headers.Authorization).toBe("secret-key");
    expect(init.headers["API-Version"]).toBeUndefined();
  });

  it("sends an API version when one is set", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ data: {} }));
    vi.stubGlobal("fetch", fetchMock);
    await makeClient({ apiVersion: "2026-07" }).query("{ a }");
    expect(fetchMock.mock.calls[0]![1].headers["API-Version"]).toBe("2026-07");
  });

  it("retries a read after a 5xx", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json({}, 503)).mockResolvedValue(json({ data: { a: 1 } }));
    vi.stubGlobal("fetch", fetchMock);
    await makeClient().query("{ a }");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("never replays a mutation after a 5xx: it may have applied", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => json({}, 500));
    vi.stubGlobal("fetch", fetchMock);
    await expect(makeClient().query("mutation { a }")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("waits as long as Monday says when the budget is spent, in a 200 reply", async () => {
    const limited = { errors: [{ message: "Budget", extensions: { code: "COMPLEXITY_BUDGET_EXHAUSTED", retry_in_seconds: 0 } }] };
    const fetchMock = vi.fn().mockResolvedValueOnce(json(limited)).mockResolvedValue(json({ data: { a: 1 } }));
    vi.stubGlobal("fetch", fetchMock);
    const onRetry = vi.fn();
    await expect(makeClient({ onRetry }).query("mutation { a }")).resolves.toEqual({ a: 1 });
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ status: 429, delayMs: 0 }));
  });

  it("reads the wait from the body of a 429", async () => {
    const limited = { errors: [{ message: "Budget", extensions: { code: "COMPLEXITY_BUDGET_EXHAUSTED", retry_in_seconds: 0 } }] };
    const fetchMock = vi.fn().mockResolvedValueOnce(json(limited, 429)).mockResolvedValue(json({ data: { a: 1 } }));
    vi.stubGlobal("fetch", fetchMock);
    const onRetry = vi.fn();
    await makeClient({ retryBaseDelayMs: 60_000, onRetry }).query("{ a }");
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ delayMs: 0 }));
  });

  it("does not retry an ordinary GraphQL error", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => json({ errors: [{ message: "Column not found" }] }));
    vi.stubGlobal("fetch", fetchMock);
    const error: any = await makeClient().query("{ a }", undefined, { operation: "read a" }).catch((e: any) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("read a failed: Column not found");
    expect(error.message).not.toContain("200");
    expect(error.hint).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("gives the sign-in hint for an unauthorized GraphQL error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ errors: [{ message: "No", extensions: { code: "UNAUTHORIZED" } }] })));
    const error: any = await makeClient().query("{ a }").catch((e: any) => e);
    expect(error.status).toBe(401);
    expect(error.hint).toContain("monday login --force");
  });

  it("removes the token from a reason Monday echoes back", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ errors: [{ message: "bad secret-key here" }] })));
    const error: any = await makeClient().query("{ a }").catch((e: any) => e);
    expect(error.message).not.toContain("secret-key");
  });

  it("reads Monday's older error_message field", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ error_message: "Internal failure" }, 400)));
    const error: any = await makeClient().query("{ a }").catch((e: any) => e);
    expect(error.message).toContain("Internal failure");
  });

  it("a reply with neither data nor errors is an error, not an empty result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({})));
    await expect(makeClient().query("{ a }")).rejects.toBeInstanceOf(ApiError);
  });

  it("stops at the time limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) =>
          init.signal!.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))
        )
      )
    );
    await expect(makeClient({ timeoutMs: 20 }).query("{ a }")).rejects.toBeInstanceOf(TimeoutError);
  });
});

describe("where the token may go", () => {
  it.each(["https://api.monday.com", "https://other.example", "http://127.0.0.1:9", "http://localhost:1"])(
    "accepts %s",
    (address) => expect(() => assertSafeEndpoint(address)).not.toThrow()
  );

  it("refuses an address that is not encrypted", () => {
    expect(() => assertSafeEndpoint("http://api.monday.com")).toThrow("not HTTPS");
    expect(() => new ApiClient({ baseUrl: "http://api.monday.com", apiKey: "k" })).toThrow("not HTTPS");
  });

  it("recognises Monday's own hosts", () => {
    expect(isMondayHost("https://api.monday.com")).toBe(true);
    expect(isMondayHost("http://127.0.0.1:9")).toBe(true);
    expect(isMondayHost("https://notmonday.com")).toBe(false);
    expect(isMondayHost("https://monday.com.other.example")).toBe(false);
  });
});
