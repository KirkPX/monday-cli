// Every way a person can sign in to Monday, driven through the built CLI against a
// fake server, in a throwaway home folder.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetCredentialStore } from "../src/auth.js";
import { verify } from "../src/cli/commands/login.js";
import { runBrowserLogin } from "../src/login/server.js";
import { escapeHtml } from "../src/login/oauth.js";
import { fakeMonday, freePort } from "./fake-monday.js";
import { runCli } from "./run-cli.js";

let home: string;
let fake: Awaited<ReturnType<typeof fakeMonday>>;
let env: Record<string, string>;
let credentials: string;

beforeEach(async () => {
  home = mkdtempSync(path.join(tmpdir(), "monday home "));
  fake = await fakeMonday();
  credentials = path.join(home, "creds", "credentials.json");
  env = {
    HOME: home,
    USERPROFILE: home,
    MONDAY_BASE_URL: fake.url,
    MONDAY_CLI_CREDENTIAL_STORE: "file",
    MONDAY_CLI_CREDENTIALS_FILE: credentials,
    MONDAY_CLI_CONFIG_FILE: path.join(home, "config.json"),
  };
});

afterEach(async () => {
  await fake.close();
  rmSync(home, { recursive: true, force: true });
});

function writeLegacy(value: Record<string, string>): string {
  const dir = path.join(home, ".config", "monday");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "config.json");
  writeFileSync(file, JSON.stringify(value));
  return file;
}

describe("personal token, typed at the terminal", () => {
  it("checks the token, saves it and never prints it", async () => {
    const { code, stdout } = await runCli(["login", "--paste"], { env, input: "good-token\n" });
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({
      loggedIn: true,
      identity: "Test User (Test Co)",
      credentialStore: "file",
    });
    expect(stdout).not.toContain("good-token");
    expect(fake.calls[0]!.auth).toBe("good-token");
    if (process.platform !== "win32") expect(statSync(credentials).mode & 0o777).toBe(0o600);

    const status = await runCli(["auth"], { env });
    expect(JSON.parse(status.stdout)).toMatchObject({ authenticated: true });
    expect(status.stdout).not.toContain("good-token");
  });

  it("saves nothing when Monday refuses, and names the other route", async () => {
    const { code, stdout, stderr } = await runCli(["login", "--paste"], { env, input: "typo\n" });
    expect(code).toBe(1);
    expect(stdout).toBe("");
    const error = JSON.parse(stderr);
    expect(error.message).toBe("Monday refused that token.");
    expect(error.hint).toContain("--oauth");
    expect(existsSync(credentials)).toBe(false);
  });

  it("does not sign in twice unless forced", async () => {
    await runCli(["login", "--paste"], { env, input: "good-token\n" });
    const again = await runCli(["login", "--paste"], { env, input: "typo\n" });
    expect(JSON.parse(again.stdout)).toMatchObject({ loggedIn: true, changed: false });
  });

  it("signs out and removes the saved token", async () => {
    await runCli(["login", "--paste"], { env, input: "good-token\n" });
    expect((await runCli(["logout"], { env })).code).toBe(0);
    const status = await runCli(["auth"], { env });
    expect(JSON.parse(status.stdout)).toMatchObject({ authenticated: false });
  });
});

describe("personal token, from a script", () => {
  it("login --token from before 2.0 still works", async () => {
    const { code, stdout } = await runCli(["login", "--token", "good-token"], { env });
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({ loggedIn: true });
  });

  it("auth --api-key stores the key", async () => {
    const { code } = await runCli(["auth", "--api-key", "good-token"], { env });
    expect(code).toBe(0);
    expect(JSON.parse((await runCli(["me"], { env })).stdout)).toMatchObject({ name: "Test User" });
  });

  it("MONDAY_API_KEY stores nothing and beats a saved key", async () => {
    await runCli(["auth", "--api-key", "stale"], { env });
    const { code } = await runCli(["me"], { env: { ...env, MONDAY_API_KEY: "good-token" } });
    expect(code).toBe(0);
    expect(fake.calls.at(-1)!.auth).toBe("good-token");
  });
});

describe("login --status, from before 2.0", () => {
  it("exits 1 when signed out", async () => {
    expect((await runCli(["login", "--status"], { env })).code).toBe(1);
  });

  it("exits 1 when Monday refuses the saved token", async () => {
    await runCli(["auth", "--api-key", "expired"], { env });
    expect((await runCli(["login", "--status"], { env })).code).toBe(1);
  });

  it("exits 0 when the token works", async () => {
    await runCli(["auth", "--api-key", "good-token"], { env });
    expect((await runCli(["login", "--status"], { env })).code).toBe(0);
  });
});

describe("auth --logout", () => {
  it("also removes the app secret", async () => {
    writeFileSync(env.MONDAY_CLI_CONFIG_FILE!, JSON.stringify({ oauthClientId: "c", oauthPort: await freePort() }));
    await runCli(["auth", "--api-key", "good-token"], { env });
    mkdirSync(path.dirname(credentials), { recursive: true });
    const saved = JSON.parse(readFileSync(credentials, "utf-8"));
    writeFileSync(credentials, JSON.stringify({ ...saved, "apiKey:__oauth_client_secret__": "s" }));
    await runCli(["auth", "--logout"], { env });
    expect(existsSync(credentials)).toBe(false);
  });
});

describe("stray requests during sign-in", () => {
  it("a malformed path gets an answer, and the sign-in carries on", async () => {
    const port = await freePort();
    writeFileSync(env.MONDAY_CLI_CONFIG_FILE!, JSON.stringify({ oauthClientId: "c", oauthPort: port }));
    let started = false;
    const { code } = await runCli(["login", "--oauth"], {
      env: { ...env, MONDAY_OAUTH_BASE_URL: fake.url, MONDAY_CLIENT_SECRET: "s" },
      onStderr: (text) => {
        const link = /(http\S+oauth2\/authorize\S+)/.exec(text)?.[1];
        if (!link || started) return;
        started = true;
        void (async () => {
          const socket = connect(port, "127.0.0.1");
          socket.write("GET // HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n");
          socket.resume();
          await new Promise((r) => socket.once("close", r));
          await fetch(`http://127.0.0.1:${port}/callback?code=c&state=${new URL(link).searchParams.get("state")}`);
        })();
      },
    });
    expect(code).toBe(0);
  });
});

describe("browser page", () => {
  beforeEach(() => {
    vi.stubEnv("MONDAY_BASE_URL", fake.url);
    vi.stubEnv("MONDAY_API_KEY", "");
    resetCredentialStore();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("refuses a bad token, keeps listening, then saves a good one", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const pending = runBrowserLogin({ accept: (c) => verify(c, "default"), timeoutMs: 10_000 });

    let base = "";
    for (let i = 0; i < 200 && !base; i++) {
      base = /(http:\/\/127\.0\.0\.1:\d+)/.exec(log.mock.calls.flat().join(" "))?.[1] ?? "";
      if (!base) await new Promise((r) => setTimeout(r, 10));
    }
    const html = await (await fetch(base)).text();
    const nonce = /var NONCE = "([^"]+)"/.exec(html)![1]!;
    const post = (credential: string) =>
      fetch(`${base}/callback`, { method: "POST", body: JSON.stringify({ credential, nonce }) });

    const bad = await post("typo");
    expect(bad.status).toBe(400);
    expect((await bad.json()).error).toContain("Monday refused that token");

    expect((await post("good-token")).status).toBe(200);
    await expect(pending).resolves.toMatchObject({ identity: "Test User (Test Co)" });
  });
});

describe("a Monday app (OAuth)", () => {
  async function oauthEnv() {
    const port = await freePort();
    writeFileSync(env.MONDAY_CLI_CONFIG_FILE!, JSON.stringify({ oauthClientId: "client-1", oauthPort: port }));
    return { port, env: { ...env, MONDAY_OAUTH_BASE_URL: fake.url, MONDAY_CLIENT_SECRET: "app-secret" } };
  }

  /** Runs the sign-in, and acts as the browser once the authorize link is printed. */
  async function signIn(oauth: Awaited<ReturnType<typeof oauthEnv>>, callback: (state: string) => Promise<void>) {
    let started = false;
    return runCli(["login", "--oauth"], {
      env: oauth.env,
      onStderr: (text) => {
        const link = /(http\S+oauth2\/authorize\S+)/.exec(text)?.[1];
        if (!link || started) return;
        started = true;
        void callback(new URL(link).searchParams.get("state")!);
      },
    });
  }

  it("exchanges the code, checks the token and saves it", async () => {
    const oauth = await oauthEnv();
    const { code, stdout } = await signIn(oauth, async (state) => {
      await fetch(`http://127.0.0.1:${oauth.port}/callback?code=the-code&state=${state}`);
    });
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({ loggedIn: true, identity: "Test User (Test Co)" });
    expect(stdout).not.toContain("good-token");
    const exchange = fake.calls.find((c) => c.path === "/oauth2/token")!;
    expect(exchange.body).toMatchObject({
      code: "the-code",
      client_id: "client-1",
      client_secret: "app-secret",
      redirect_uri: `http://localhost:${oauth.port}/callback`,
    });
  });

  it("refuses a callback without the state value, and carries on", async () => {
    const oauth = await oauthEnv();
    let forged = 0;
    const { code } = await signIn(oauth, async (state) => {
      forged = (await fetch(`http://127.0.0.1:${oauth.port}/callback?code=evil&state=wrong`)).status;
      const missing = await fetch(`http://127.0.0.1:${oauth.port}/callback?code=evil`);
      expect(missing.status).toBe(403);
      await fetch(`http://127.0.0.1:${oauth.port}/callback?code=the-code&state=${state}`);
    });
    expect(forged).toBe(403);
    expect(code).toBe(0);
    expect(fake.calls.filter((c) => c.path === "/oauth2/token")).toHaveLength(1);
  });

  it("explains what to do when Monday reports a refusal", async () => {
    const oauth = await oauthEnv();
    const { code, stderr } = await signIn(oauth, async (state) => {
      await fetch(`http://127.0.0.1:${oauth.port}/callback?error=access_denied&state=${state}`);
    });
    expect(code).toBe(1);
    const last = stderr.trim().split("\n").at(-1)!;
    expect(JSON.parse(last).hint).toContain("--paste");
  });

  it("explains the setup when no app is configured", async () => {
    const { code, stderr } = await runCli(["login", "--oauth"], { env });
    expect(code).toBe(1);
    expect(JSON.parse(stderr).hint).toContain("oauthClientId");
  });

  it("escapes text shown on the page", () => {
    expect(escapeHtml(`<img src=x onerror="a">`)).not.toContain("<");
  });
});

describe("a sign-in saved by a version before 2.0", () => {
  it("keeps working after the update", async () => {
    writeLegacy({ access_token: "good-token" });
    expect((await runCli(["me"], { env })).code).toBe(0);
    const doctor = JSON.parse((await runCli(["doctor"], { env })).stdout);
    const key = doctor.checks.find((c: { name: string }) => c.name === "API key");
    expect(key.value).toContain("old sign-in file");
  });

  it("is removed by a new sign-in", async () => {
    const file = writeLegacy({ access_token: "old" });
    await runCli(["login", "--force", "--paste"], { env, input: "good-token\n" });
    expect(existsSync(file)).toBe(false);
  });

  it("moves to the store on a plain login", async () => {
    const file = writeLegacy({ access_token: "good-token" });
    const { code } = await runCli(["login"], { env });
    expect(code).toBe(0);
    expect(existsSync(file)).toBe(false);
    expect(readFileSync(credentials, "utf-8")).toContain("good-token");
  });

  it("is replaced on a plain login when Monday no longer accepts it", async () => {
    writeLegacy({ access_token: "expired" });
    const { code } = await runCli(["login", "--paste"], { env, input: "good-token\n" });
    expect(code).toBe(0);
    expect(readFileSync(credentials, "utf-8")).toContain("good-token");
  });

  it("is removed by logout, and auth --logout", async () => {
    const file = writeLegacy({ access_token: "good-token" });
    await runCli(["logout"], { env });
    expect(existsSync(file)).toBe(false);
    writeLegacy({ access_token: "good-token" });
    await runCli(["auth", "--logout"], { env });
    expect(existsSync(file)).toBe(false);
  });

  it("gives its app secret to an OAuth sign-in", async () => {
    writeLegacy({ access_token: "old", client_secret: "kept-secret" });
    const port = await freePort();
    writeFileSync(env.MONDAY_CLI_CONFIG_FILE!, JSON.stringify({ oauthClientId: "client-1", oauthPort: port }));
    let started = false;
    await runCli(["login", "--force"], {
      env: { ...env, MONDAY_OAUTH_BASE_URL: fake.url },
      onStderr: (text) => {
        const link = /(http\S+oauth2\/authorize\S+)/.exec(text)?.[1];
        if (!link || started) return;
        started = true;
        void fetch(`http://127.0.0.1:${port}/callback?code=c&state=${new URL(link).searchParams.get("state")}`);
      },
    });
    expect(fake.calls.find((c) => c.path === "/oauth2/token")!.body.client_secret).toBe("kept-secret");
    expect(readFileSync(credentials, "utf-8")).toContain("good-token");
  });
});

describe("a sign-in saved in the settings file by an early version", () => {
  // An early version wrote its token and app secret to the file that now holds the settings.
  function writeEarly(extra: Record<string, unknown> = {}): string {
    const file = env.MONDAY_CLI_CONFIG_FILE!;
    writeFileSync(file, JSON.stringify({ access_token: "good-token", client_secret: "kept-secret", ...extra }));
    return file;
  }

  it("keeps working after the update, and never shows the token", async () => {
    writeEarly();
    expect((await runCli(["me"], { env })).code).toBe(0);
    const auth = await runCli(["auth"], { env });
    expect(auth.code).toBe(0);
    expect(JSON.parse(auth.stdout)).toMatchObject({ authenticated: true });
    const doctor = JSON.parse((await runCli(["doctor"], { env })).stdout);
    expect(doctor.checks.find((c: { name: string }) => c.name === "API key").value).toContain("old sign-in file");
    const show = await runCli(["config", "show"], { env });
    expect(show.code).toBe(0);
    expect(show.stdout + auth.stdout).not.toMatch(/good-token|kept-secret/);
  });

  it("moves to the store on a plain login, and keeps the real settings", async () => {
    const file = writeEarly({ timeoutMs: 5000 });
    expect((await runCli(["login"], { env })).code).toBe(0);
    expect(readFileSync(credentials, "utf-8")).toContain("good-token");
    expect(JSON.parse(readFileSync(file, "utf-8"))).toEqual({ timeoutMs: 5000 });
  });

  it("removes the file on login when it held nothing else", async () => {
    const file = writeEarly();
    await runCli(["login"], { env });
    expect(existsSync(file)).toBe(false);
  });

  it("survives a settings change, in a private file", async () => {
    const file = writeEarly();
    expect((await runCli(["config", "set", "timeoutMs", "5000"], { env })).code).toBe(0);
    expect(JSON.parse(readFileSync(file, "utf-8"))).toMatchObject({ access_token: "good-token", timeoutMs: 5000 });
    if (process.platform !== "win32") expect(statSync(file).mode & 0o777).toBe(0o600);
    expect((await runCli(["me"], { env })).code).toBe(0);
  });

  it("is removed by logout", async () => {
    const file = writeEarly({ timeoutMs: 5000 });
    await runCli(["logout"], { env });
    expect(JSON.parse(readFileSync(file, "utf-8"))).toEqual({ timeoutMs: 5000 });
  });

  it("does not excuse any other unknown key", async () => {
    writeEarly({ readonly: true });
    const { code, stderr } = await runCli(["me"], { env });
    expect(code).not.toBe(0);
    expect(JSON.parse(stderr).message).toContain("readonly");
  });
});
