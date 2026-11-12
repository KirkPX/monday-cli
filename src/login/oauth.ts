import { createServer, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import pc from "picocolors";
import { extractSafeDetail } from "../client.js";
import { LoginError, NetworkError, TimeoutError } from "../errors.js";
import { openBrowser } from "./browser.js";

/** The port the setup steps in docs/auth.md register with Monday. */
export const DEFAULT_OAUTH_PORT = 19837;

const EXCHANGE_TIMEOUT_MS = 30_000;

export type OAuthLoginOptions<T> = {
  clientId: string;
  clientSecret: string;
  /** Set only when the app registers a port other than the default. */
  port?: number;
  authBaseUrl: string;
  /** Verifies the token and saves it. Throws to reject it. */
  accept: (token: string) => Promise<T>;
  timeoutMs?: number;
};

/**
 * Sign in through a Monday app, and receive the code on loopback.
 *
 * Monday sends the browser only to a redirect address registered on the app, so
 * this page cannot use an ephemeral port as the paste page does. The port is
 * fixed, and these keep it safe: it listens on 127.0.0.1 only, the one-time state
 * value must come back, and it closes as soon as the sign-in ends.
 */
export async function runOAuthLogin<T>(opts: OAuthLoginOptions<T>): Promise<T> {
  const state = randomUUID();
  const port = opts.port ?? DEFAULT_OAUTH_PORT;
  const redirectUri = `http://localhost:${port}/callback`;
  const timeoutMs = opts.timeoutMs ?? 5 * 60_000;

  return await new Promise<T>((resolve, reject) => {
    let settled = false;

    const finish = (outcome: { ok: true; value: T } | { ok: false; error: Error }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.close();
      server.closeIdleConnections();
      setTimeout(() => server.closeAllConnections(), 300).unref();
      if (outcome.ok) resolve(outcome.value);
      else reject(outcome.error);
    };

    const server = createServer(async (req, res) => {
      const url = URL.parse(req.url ?? "/", "http://127.0.0.1");
      if (!url || req.method !== "GET" || url.pathname !== "/callback") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
      // Without the state value, any page could send the browser here with a code
      // for someone else's account. Check it before anything else in the request.
      if (url.searchParams.get("state") !== state) {
        page(res, 403, "Sign-in failed", "This sign-in link has expired. Run monday login --oauth again.");
        return;
      }
      if (settled) {
        page(res, 200, "Connected", "You can close this tab and return to your terminal.");
        return;
      }

      const denied = url.searchParams.get("error");
      if (denied) {
        page(res, 400, "Sign-in failed", `Monday reported: ${denied}`);
        finish({
          ok: false,
          error: new LoginError(
            `Monday did not authorize the sign-in: ${denied}.`,
            "Run `monday login --paste` to use a personal API token instead."
          ),
        });
        return;
      }

      const code = url.searchParams.get("code");
      if (!code) {
        page(res, 400, "Sign-in failed", "Monday sent no authorization code.");
        return;
      }

      try {
        const token = await exchangeCode(opts, code, redirectUri);
        const value = await opts.accept(token);
        page(res, 200, "Connected", "You can close this tab and return to your terminal.");
        finish({ ok: true, value });
      } catch (error) {
        page(res, 400, "Sign-in failed", error instanceof Error ? error.message : "The sign-in failed.");
        finish({ ok: false, error: error as Error });
      }
    });

    const timer = setTimeout(() => {
      finish({
        ok: false,
        error: new LoginError(
          "Sign-in timed out.",
          "Run `monday login --paste` to use a personal API token instead."
        ),
      });
    }, timeoutMs);
    timer.unref?.();

    server.on("error", (error: NodeJS.ErrnoException) => {
      finish({
        ok: false,
        error: new LoginError(
          error.code === "EADDRINUSE"
            ? `Port ${port} is in use, so Monday cannot send the sign-in back.`
            : `Could not start the local sign-in page: ${error.message}`,
          "Close the program using it, or run `monday login --paste` to use a personal API token."
        ),
      });
    });

    server.listen(port, "127.0.0.1", () => {
      const authorize = new URL("/oauth2/authorize", opts.authBaseUrl);
      authorize.searchParams.set("client_id", opts.clientId);
      authorize.searchParams.set("state", state);
      // Monday uses the app's only registered address when none is sent.
      if (opts.port) authorize.searchParams.set("redirect_uri", redirectUri);

      // stderr, because this run can have its stdout in a pipe.
      if (!openBrowser(authorize.toString())) {
        console.error(`Open this page to finish signing in: ${pc.cyan(authorize.toString())}`);
      }
      console.error(pc.dim("Waiting for Monday... (Ctrl+C to cancel)"));
    });
  });
}

async function exchangeCode(
  opts: OAuthLoginOptions<unknown>,
  code: string,
  redirectUri: string
): Promise<string> {
  const url = new URL("/oauth2/token", opts.authBaseUrl);
  const operation = "exchange the Monday sign-in code";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXCHANGE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        code,
        client_id: opts.clientId,
        client_secret: opts.clientSecret,
        redirect_uri: redirectUri,
      }),
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => null)) as { access_token?: unknown } | null;

    if (!response.ok) {
      throw new LoginError(
        `Monday refused the sign-in: ${extractSafeDetail(data, opts.clientSecret)}.`,
        "Check the app's client ID and client secret. See `monday login --help`."
      );
    }
    if (typeof data?.access_token !== "string" || !data.access_token) {
      throw new LoginError("Monday's sign-in reply held no token.", "Run `monday login --paste` instead.");
    }
    return data.access_token;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError({ operation, timeoutMs: EXCHANGE_TIMEOUT_MS });
    }
    if (error instanceof TypeError) throw new NetworkError({ operation, host: url.host, cause: error });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function page(res: ServerResponse, status: number, title: string, message: string): void {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 48px; }</style>
</head>
<body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></body>
</html>`);
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}
