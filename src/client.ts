// HTTP client. One place that talks to Monday, so timeout, retry, auth, and error redaction are
// uniform. Every request has an explicit timeout; retries are limited and visible; errors
// carry operation + status + safe detail. The queries themselves are in monday-api.ts.

import { ApiError, NetworkError, TimeoutError, UsageError } from "./errors.js";

export type ClientOptions = {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  onRetry?: (info: RetryInfo) => void;
  apiVersion?: string;
};

export type RetryInfo = {
  attempt: number;
  maxRetries: number;
  delayMs: number;
  status: number;
  operation: string;
};

export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
  method?: RequestMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  /** Names the request in errors and retry messages. */
  operation?: string;
  /** Set when replaying the request cannot change anything, such as a GraphQL read. */
  safeToReplay?: boolean;
};

export type GraphQLError = {
  message?: string;
  extensions?: { code?: string; status_code?: number; retry_in_seconds?: number };
};

export type GraphQLResult<T> = { data: T | null; errors: GraphQLError[] };

export type GraphQLOptions = { operation?: string; apiVersion?: string };

type GraphQLBody<T> = { data?: T | null; errors?: GraphQLError[] };

/** Monday's one GraphQL address, under the base URL. */
const GRAPHQL_PATH = "/v2";

/** Monday's codes for "too much too fast". The request was refused, so nothing changed. */
const RATE_LIMIT_CODES: ReadonlySet<string> = new Set([
  "COMPLEXITY_BUDGET_EXHAUSTED",
  "ComplexityException",
  "RATE_LIMIT_EXCEEDED",
  "IP_RATE_LIMIT_EXCEEDED",
  "maxConcurrencyExceeded",
]);

/** When Monday gives no wait, one minute is the length of its budget window. */
const DEFAULT_RATE_LIMIT_WAIT_SECONDS = 60;

export type ApiResponse<T = unknown> = {
  status: number;
  data: T | null;
};

export class ApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly onRetry?: (info: RetryInfo) => void;
  private readonly apiVersion?: string;

  constructor(options: ClientOptions) {
    assertSafeEndpoint(options.baseUrl);
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? 1_000;
    this.onRetry = options.onRetry;
    this.apiVersion = options.apiVersion;
  }

  async request<T = unknown>(
    path: string,
    opts: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = "GET", body, params, headers: extraHeaders, safeToReplay = false } = opts;
    const url = buildUrl(this.baseUrl, path, params);
    const operation = opts.operation ?? `${method} ${path}`;

    for (let attempt = 1; ; attempt++) {
      const { response, data } = await this.fetchWithTimeout(url, operation, {
        method,
        headers: {
          Accept: "application/json",
          ...this.authHeader(),
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...extraHeaders,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });

      if (response.ok) {
        return { status: response.status, data: data as T | null };
      }

      if (isRetryable(response.status, method, safeToReplay) && attempt < this.maxRetries) {
        const delayMs = retryDelayMs(response, attempt, this.retryBaseDelayMs, data);
        this.onRetry?.({
          attempt,
          maxRetries: this.maxRetries,
          delayMs,
          status: response.status,
          operation,
        });
        await sleep(delayMs);
        continue;
      }

      throw new ApiError({
        status: response.status,
        statusText: response.statusText,
        operation,
        safeDetail: extractSafeDetail(data, this.apiKey),
      });
    }
  }

  /**
   * Send one request and read its reply, both inside one time limit. A reply that
   * starts quickly and then stalls is stopped too, not only one that never starts.
   */
  private async fetchWithTimeout(
    url: string,
    operation: string,
    init: RequestInit
  ): Promise<{ response: Response; data: unknown }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      return { response, data: await parseResponseBody(response) };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new TimeoutError({ operation, timeoutMs: this.timeoutMs });
      }
      // fetch reports every network failure as "fetch failed", with the reason,
      // such as ENOTFOUND, on `cause`.
      if (error instanceof TypeError) {
        throw new NetworkError({ operation, host: new URL(url).host, cause: error });
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Monday takes the token as it is, with no "Bearer" in front. fetch drops
   * Authorization on a redirect to another host, so the token cannot follow one.
   */
  private authHeader(): Record<string, string> {
    return { Authorization: this.apiKey };
  }

  // ── GraphQL ───────────────────────────────────────────────────────────────

  /**
   * Run one GraphQL document and return data and errors as Monday sent them.
   *
   * Monday refuses most requests with a 200 reply that holds `errors`, and it reports
   * a spent complexity budget the same way, so that case is retried here.
   */
  async graphql<T = unknown>(
    document: string,
    variables?: Record<string, unknown>,
    opts: GraphQLOptions = {}
  ): Promise<GraphQLResult<T>> {
    const mutation = isMutation(document);
    const operation = opts.operation ?? (mutation ? "GraphQL mutation" : "GraphQL query");
    // An API version is sent only when asked for. An expired version raises no
    // error: Monday serves its oldest supported version, with about half the fields.
    const apiVersion = opts.apiVersion ?? this.apiVersion;

    for (let attempt = 1; ; attempt++) {
      const { data: body } = await this.request<GraphQLBody<T>>(GRAPHQL_PATH, {
        method: "POST",
        body: { query: document, ...(variables ? { variables } : {}) },
        headers: apiVersion ? { "API-Version": apiVersion } : undefined,
        operation,
        safeToReplay: !mutation,
      });
      const errors = body?.errors ?? [];
      const waitSeconds = rateLimitWaitSeconds(errors);

      if (waitSeconds !== null && attempt < this.maxRetries) {
        const delayMs = waitSeconds * 1000;
        this.onRetry?.({ attempt, maxRetries: this.maxRetries, delayMs, status: 429, operation });
        await sleep(delayMs);
        continue;
      }
      return { data: body?.data ?? null, errors };
    }
  }

  /** The same, for callers that want the data or an error and nothing in between. */
  async query<T = unknown>(
    document: string,
    variables?: Record<string, unknown>,
    opts: GraphQLOptions = {}
  ): Promise<T> {
    const { data, errors } = await this.graphql<T>(document, variables, opts);
    const operation = opts.operation ?? "GraphQL request";
    if (errors.length > 0 || data === null) throw this.failure(errors, operation);
    return data;
  }

  /** The error for a reply with no usable data, with the token removed from its text. */
  failure(errors: GraphQLError[], operation: string): ApiError {
    if (errors.length > 0) return graphQLFailure(errors, operation, this.apiKey);
    return new ApiError({
      status: 200,
      statusText: "OK",
      operation,
      safeDetail: "Monday sent no data and no error",
    });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Every request carries the token, so an address that reaches other machines must
 * be encrypted. An address that cannot be read is left for buildUrl to report.
 */
export function assertSafeEndpoint(address: string): void {
  let url: URL;
  try {
    url = new URL(address);
  } catch {
    return;
  }
  if (url.protocol !== "https:" && !isLoopback(url)) {
    throw new UsageError(
      `Refusing to send your Monday sign-in to ${url.origin}: the address is not HTTPS.`,
      "Check MONDAY_BASE_URL and baseUrl in the settings file. `monday config show` prints the file."
    );
  }
}

export function isLoopback(url: URL): boolean {
  return url.hostname === "127.0.0.1" || url.hostname === "localhost" || url.hostname === "[::1]";
}

/** True for Monday's own hosts, and for a local test server. */
export function isMondayHost(address: string): boolean {
  try {
    const url = new URL(address);
    return isLoopback(url) || url.hostname === "monday.com" || url.hostname.endsWith(".monday.com");
  } catch {
    return true;
  }
}

/**
 * The full address for a request. It must stay on the signed-in service, because
 * every request carries the API key. A path such as `//other.example/x`, or a full
 * address elsewhere, would otherwise send the key to that host.
 *
 * A path with one leading slash stays under the base URL, so `/me` on
 * `https://api.example.com/v1` is `/v1/me`.
 */
export function buildUrl(
  base: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  let root: URL;
  let url: URL;
  try {
    root = new URL(base.replace(/\/*$/, "/"));
    url = new URL(/^\/(?![/\\])/.test(path) ? path.slice(1) : path, root);
  } catch {
    throw new UsageError(
      `Cannot build a request address from "${path}" on "${base}".`,
      "Check the base URL. `monday doctor` shows the one in use."
    );
  }
  if (url.origin !== root.origin) {
    throw new UsageError(
      `Refusing to send a request to ${url.host}: requests go only to ${root.host}.`,
      "Pass a path on this service, such as /me."
    );
  }
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Replaying one of these cannot create or change anything. */
const IDEMPOTENT: ReadonlySet<RequestMethod> = new Set<RequestMethod>(["GET"]);

/**
 * 429 is always safe to retry: the request was rejected, so nothing was applied.
 * 5xx is safe only on an idempotent method. A 500 from a POST may have created the
 * record before it failed to answer, so replaying it could create a duplicate.
 */
export function isRetryable(
  status: number,
  method: RequestMethod,
  safeToReplay = false
): boolean {
  if (status === 429) return true;
  if (status >= 500 && status < 600) return safeToReplay || IDEMPOTENT.has(method);
  return false;
}

/**
 * True when a GraphQL document holds a mutation. Only top-level text counts, so a
 * field, a string or a comment that says "mutation" does not. Read-only mode
 * depends on this, so a document it cannot place counts as a mutation.
 */
export function isMutation(document: string): boolean {
  const code = document.replace(/"""[\s\S]*?"""|"(?:\\.|[^"\\\n])*"|#[^\r\n]*/g, " ");
  let depth = 0;
  let topLevel = "";
  for (const ch of code) {
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (depth === 0) topLevel += ch;
  }
  if (/(?<![$\w])mutation(?!\w)/.test(topLevel)) return true;
  return depth !== 0;
}

function rateLimitWaitSeconds(errors: GraphQLError[]): number | null {
  const limited = errors.find((e) => e.extensions?.code && RATE_LIMIT_CODES.has(e.extensions.code));
  if (!limited) return null;
  const seconds = limited.extensions?.retry_in_seconds;
  return typeof seconds === "number" && seconds >= 0 ? seconds : DEFAULT_RATE_LIMIT_WAIT_SECONDS;
}

/** Monday's own status where it gives one, so a refused token gets the sign-in hint. */
function graphQLFailure(errors: GraphQLError[], operation: string, apiKey: string): ApiError {
  const first = errors[0]?.extensions;
  const code = first?.code ?? "";
  const status =
    typeof first?.status_code === "number" && first.status_code >= 400
      ? first.status_code
      : /unauthori[sz]ed|authentication/i.test(code)
        ? 401
        : 200;
  return new ApiError({
    status,
    statusText: code || "GraphQL error",
    operation,
    safeDetail: extractSafeDetail({ errors }, apiKey),
  });
}

/**
 * Retry-After wins: the server is saying when it will be ready. Otherwise back off
 * exponentially with jitter, so many clients do not retry at the same moment.
 */
function retryDelayMs(
  response: Response,
  attempt: number,
  baseMs: number,
  data?: unknown,
  capMs = 30_000
): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  }
  // Monday gives the wait in the reply body when the complexity budget is spent.
  // A short backoff would use up the retries long before the budget returns.
  const waitSeconds = rateLimitWaitSeconds((data as GraphQLBody<unknown> | null)?.errors ?? []);
  if (response.status === 429 && waitSeconds !== null) return waitSeconds * 1000;
  const backoff = Math.min(baseMs * 2 ** (attempt - 1), capMs);
  return Math.round(backoff * (0.5 + Math.random() * 0.5));
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const ct = response.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return null;
  try {
    return await response.json();
  } catch (error) {
    // A timeout while the reply arrives must reach the caller as a timeout.
    if (error instanceof Error && error.name === "AbortError") throw error;
    return null;
  }
}

/**
 * The service's own reason for a refusal. It is what tells a person which field
 * was wrong, so it is shown whole, with only the key removed. Add your API's
 * error shape here if it uses other names.
 */
export function extractSafeDetail(data: unknown, apiKey?: string): string {
  if (typeof data === "string" && data.trim() && !data.trimStart().startsWith("<")) {
    return tidy(data, apiKey);
  }
  if (!data || typeof data !== "object") return "no response detail";
  const obj = data as Record<string, unknown>;
  const parts: string[] = [];
  for (const key of ["message", "MESSAGE", "error", "error_message", "msg"]) {
    if (typeof obj[key] === "string" && obj[key]) parts.push(obj[key] as string);
  }
  if (Array.isArray(obj.errors)) {
    for (const item of obj.errors.slice(0, 3)) {
      if (typeof item === "string") parts.push(item);
      else if (item && typeof item === "object") {
        const e = item as Record<string, unknown>;
        const text = [e.title, e.detail ?? e.message].filter((x) => typeof x === "string" && x).join(": ");
        if (text) parts.push(text);
      }
    }
  }
  return parts.length ? tidy(parts.join("; "), apiKey) : "no response detail";
}

function tidy(text: string, apiKey?: string): string {
  let out = text.replace(/\s+/g, " ").trim();
  if (apiKey) out = out.split(apiKey).join("****");
  return out.length > 300 ? `${out.slice(0, 297)}...` : out;
}
