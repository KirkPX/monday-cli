// `monday auth` manages the stored API key from a script. People should use
// `login`, which checks the key first. The token is never printed back in full.

import pc from "picocolors";
import {
  clearLegacySignIn,
  getCredentialStore,
  getCredentialStoreInfo,
  OAUTH_SECRET_ACCOUNT,
  storeLabel,
} from "../../auth.js";
import { DEFAULT_ACCOUNT, resolveConfig } from "../../config.js";
import { redact, UsageError } from "../../errors.js";
import { reporter } from "../output.js";

export type AuthOpts = {
  status?: boolean;
  login?: boolean;
  logout?: boolean;
  apiKey?: string;
  account?: string;
  json?: boolean;
};

/**
 * Dispatch `monday auth`. `--status` is checked first, so
 * `auth --status --api-key x` reports and writes nothing. Explicit intent wins.
 */
export async function authCommand(opts: AuthOpts): Promise<void> {
  if (opts.status) return authStatus(opts);
  if (opts.logout) return authLogout(opts);
  if (opts.login || opts.apiKey) return authLogin(opts);
  return authStatus(opts);
}

function authLogin(opts: AuthOpts): void {
  const apiKey = opts.apiKey || process.env.MONDAY_API_KEY;
  if (!apiKey) {
    throw new UsageError(
      "No API key given.",
      "Run `monday login`, or pass --api-key for automation."
    );
  }
  const { account } = resolveConfig({ account: opts.account });
  const store = getCredentialStore();
  const savedTo = store.setApiKey(account, apiKey) ?? store.kind;
  const r = reporter(opts);

  if (!store.persistent) {
    r.warn(
      pc.yellow(
        "Warning: this key will NOT persist after the process exits. " +
          "Use MONDAY_API_KEY for automation."
      )
    );
  }
  r.result(
    { saved: true, account, apiKey: redact(apiKey), credentialStore: savedTo, persistent: store.persistent },
    `Saved API key for account "${account}" (${redact(apiKey)}) in your ${storeLabel(savedTo)}.`
  );
}

function authLogout(opts: AuthOpts): void {
  const { account } = resolveConfig({ account: opts.account });
  getCredentialStore().deleteApiKey(account);
  // Otherwise the sign-in from before 2.0 would take over at once.
  if (account === DEFAULT_ACCOUNT) {
    getCredentialStore().deleteApiKey(OAUTH_SECRET_ACCOUNT);
    clearLegacySignIn();
  }
  reporter(opts).result(
    { cleared: true, account },
    `Cleared API key for account "${account}".`
  );
}

function authStatus(opts: AuthOpts): void {
  const cfg = resolveConfig({ account: opts.account });
  const store = getCredentialStoreInfo();
  const status = {
    account: cfg.account,
    baseUrl: cfg.baseUrl,
    authenticated: Boolean(cfg.apiKey),
    apiKey: cfg.apiKey ? redact(cfg.apiKey) : null,
    credentialStore: store.kind,
    persistent: store.persistent,
  };

  reporter(opts).result(
    status,
    [
      `Account:       ${status.account}`,
      `Base URL:      ${status.baseUrl}`,
      `Authenticated: ${status.authenticated ? "yes" : "no"}`,
      ...(status.apiKey ? [`API key:       ${status.apiKey}`] : []),
      `Store:         ${status.credentialStore} (persistent: ${status.persistent})`,
    ].join("\n")
  );
}
