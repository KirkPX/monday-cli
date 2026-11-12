import { ApiClient, isMondayHost, type RetryInfo } from "../client.js";
import { resolveConfig } from "../config.js";
import { requireApiKey } from "./guardrails.js";
import { reporter, type Reporter } from "./output.js";

const COMMAND_TIMEOUT_MS = 600_000;

/**
 * The client a command uses: settings resolved, sign-in required, retries shown.
 * A retry message goes to stderr at a terminal, and stays out of a piped run.
 */
export function createClient(
  opts: { json?: boolean; pretty?: boolean; account?: string; baseUrl?: string; apiVersion?: string } = {}
): ApiClient {
  const cfg = resolveConfig({
    account: opts.account,
    baseUrl: opts.baseUrl,
    apiVersion: opts.apiVersion,
  });
  requireApiKey(cfg.apiKey);
  const r = reporter(opts);
  // A shared settings file could otherwise point the token at another service.
  if (!isMondayHost(cfg.baseUrl)) r.warn(`Warning: sending your Monday token to ${cfg.baseUrl}.`);
  return new ApiClient({
    baseUrl: cfg.baseUrl,
    apiKey: cfg.apiKey,
    // Monday answers a whole-account query slowly, so commands wait longer than
    // the client's own 30-second default. `timeoutMs` in the settings file changes it.
    timeoutMs: cfg.timeoutMs ?? COMMAND_TIMEOUT_MS,
    apiVersion: cfg.apiVersion,
    onRetry: (info) => reportRetry(r, info),
  });
}

function reportRetry(r: Reporter, info: RetryInfo): void {
  const seconds = Math.ceil(info.delayMs / 1000);
  r.note(
    `The service answered ${info.status} for ${info.operation}. Retrying in ${seconds}s (${info.attempt + 1}/${info.maxRetries}).`
  );
}
