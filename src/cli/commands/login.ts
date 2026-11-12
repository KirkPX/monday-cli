// `monday login` is the single-call sign-in. By default it serves a page on loopback,
// opens the browser, takes a personal API token, checks it and stores it. Monday has
// two ways for a program to sign in: a personal token, and an app of your own (OAuth).
// `--paste` is the first with no browser, and `--oauth` is the second.
import pc from "picocolors";
import {
  clearLegacySignIn,
  getCredentialStore,
  legacyKeyInUse,
  OAUTH_SECRET_ACCOUNT,
  readLegacySignIn,
  storeLabel,
  type StoreKind,
} from "../../auth.js";
import { ApiClient, assertSafeEndpoint } from "../../client.js";
import { DEFAULT_ACCOUNT, resolveConfig } from "../../config.js";
import { ApiError, LoginError } from "../../errors.js";
import { getMe } from "../../monday-api.js";
import { runOAuthLogin } from "../../login/oauth.js";
import { promptSecret } from "../../login/prompt.js";
import { runBrowserLogin } from "../../login/server.js";
import { loadSettings } from "../../settings.js";
import { reporter } from "../output.js";

export type LoginOpts = {
  json?: boolean;
  pretty?: boolean;
  paste?: boolean;
  oauth?: boolean;
  force?: boolean;
  account?: string;
  // Hidden forms from before 2.0.
  token?: string;
  status?: boolean;
};

type Verified = { account: string; identity: string | null; credentialStore: StoreKind };

const DEFAULT_OAUTH_BASE_URL = "https://auth.monday.com";

export async function loginCommand(opts: LoginOpts = {}): Promise<void> {
  if (opts.status) {
    return loginStatus(opts);
  }

  const r = reporter(opts);
  const { account, apiKey } = resolveConfig({ account: opts.account });

  // A sign-in from before 2.0 moves to the keychain here. If Monday no longer
  // accepts it, the normal sign-in below replaces it.
  if (!opts.force && apiKey && !opts.token && legacyKeyInUse(apiKey, account)) {
    const moved = await verify(apiKey, account).catch((error: unknown) => {
      if (error instanceof LoginError) return null;
      throw error;
    });
    if (moved) {
      r.result({ loggedIn: true, ...moved }, `Signed in. Token moved to your ${storeLabel(moved.credentialStore)}.`);
      return;
    }
  } else if (!opts.force && apiKey && !opts.token) {
    r.result(
      { loggedIn: true, account, changed: false },
      `Already signed in (${account}).\n` + pc.dim("Run `monday login --force` to sign in again.")
    );
    return;
  }

  const verified = await signIn(opts, account);
  const { persistent } = getCredentialStore();
  if (!persistent) {
    r.warn(
      pc.yellow("Warning: this token will not persist after the process exits. Use MONDAY_API_KEY for automation.")
    );
  }
  r.result(
    { loggedIn: true, ...verified, persistent },
    `${pc.green("Signed in")}${verified.identity ? ` as ${verified.identity}` : ""}.\n` +
      pc.dim(`Token saved to your ${storeLabel(verified.credentialStore)}.`) +
      "\n\nTry it: " +
      pc.cyan("monday boards")
  );
}

/** The form from before 2.0: it checks the token with Monday, and exits 1 if there is none that works. */
async function loginStatus(opts: LoginOpts): Promise<void> {
  const { authCommand } = await import("./auth.js");
  const { apiKey, baseUrl } = resolveConfig({ account: opts.account });
  await authCommand({ ...opts, status: true });
  if (!apiKey) {
    process.exitCode = 1;
    return;
  }
  try {
    await getMe(new ApiClient({ baseUrl, apiKey }));
  } catch (error) {
    reporter(opts).warn(`The saved token did not work: ${(error as Error).message}`);
    process.exitCode = 1;
  }
}

function signIn(opts: LoginOpts, account: string): Promise<Verified> {
  if (opts.token) return verify(opts.token, account);
  const clientId = oauthClientId();
  if (opts.oauth || (clientId && !opts.paste)) return oauthLogin(clientId, account);
  if (opts.paste || !canUseBrowser()) return pasteLogin(account);
  return runBrowserLogin<Verified>({ accept: (credential) => verify(credential, account) });
}

export async function logoutCommand(opts: LoginOpts = {}): Promise<void> {
  const { account } = resolveConfig({ account: opts.account });
  const store = getCredentialStore();
  store.deleteApiKey(account);
  if (account === DEFAULT_ACCOUNT) {
    store.deleteApiKey(OAUTH_SECRET_ACCOUNT);
    clearLegacySignIn();
  }
  reporter(opts).result({ cleared: true, account }, pc.green(`Signed out (${account}).`));
}

/** True when a usable key is already on hand. */
export function isConfigured(): boolean {
  return Boolean(resolveConfig().apiKey);
}

async function pasteLogin(account: string): Promise<Verified> {
  const credential = await promptSecret("Paste your Monday personal API token: ");
  if (!credential) throw new LoginError("Nothing entered.");
  return await verify(credential, account);
}

async function oauthLogin(clientId: string | undefined, account: string): Promise<Verified> {
  if (!clientId) {
    throw new LoginError(
      "No Monday app is set up for this sign-in.",
      "Create an app in Monday (see docs/auth.md), then run `monday config set oauthClientId <id>`. Or run `monday login --paste` to use a personal API token."
    );
  }
  const store = getCredentialStore();
  const known =
    process.env.MONDAY_CLIENT_SECRET ||
    store.getApiKey(OAUTH_SECRET_ACCOUNT) ||
    readLegacySignIn().clientSecret;
  const clientSecret = known || (await promptSecret("Paste your Monday app's client secret: "));
  if (!clientSecret) throw new LoginError("Nothing entered.");

  const authBaseUrl = process.env.MONDAY_OAUTH_BASE_URL || DEFAULT_OAUTH_BASE_URL;
  assertSafeEndpoint(authBaseUrl);
  const verified = await runOAuthLogin<Verified>({
    clientId,
    clientSecret,
    port: loadSettings().oauthPort,
    authBaseUrl,
    accept: (token) => verify(token, account),
  });
  if (!process.env.MONDAY_CLIENT_SECRET) store.setApiKey(OAUTH_SECRET_ACCOUNT, clientSecret);
  return verified;
}

function oauthClientId(): string | undefined {
  return process.env.MONDAY_CLIENT_ID || loadSettings().oauthClientId;
}

/** Prove the token works, THEN store it, so a typo is not reported as success. */
export async function verify(credential: string, account: string): Promise<Verified> {
  const key = credential.trim();
  if (!key) throw new LoginError("Nothing entered.");

  const { baseUrl } = resolveConfig({ account });
  let me: { name?: string; account?: { name?: string } } | null;
  try {
    ({ me } = await getMe(new ApiClient({ baseUrl, apiKey: key })));
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) throw refused();
    throw error;
  }
  if (!me) throw refused();

  const store = getCredentialStore();
  const credentialStore = store.setApiKey(account, key) ?? store.kind;
  if (account === DEFAULT_ACCOUNT && store.persistent) clearLegacySignIn();
  const company = me.account?.name ? ` (${me.account.name})` : "";
  return { account, identity: me.name ? `${me.name}${company}` : null, credentialStore };
}

function refused(): LoginError {
  return new LoginError(
    "Monday refused that token.",
    "Copy your personal API token again from Monday: profile picture, Developers, My access tokens. To sign in through a Monday app, run `monday login --oauth`."
  );
}

function canUseBrowser(): boolean {
  // No terminal to return to, or an explicitly headless environment: the
  // browser has nowhere to open.
  if (process.env.MONDAY_CLI_NO_BROWSER) return false;
  return process.stdout.isTTY === true;
}
