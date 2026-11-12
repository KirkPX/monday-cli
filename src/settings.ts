import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";
import { ConfigError, UsageError, fileErrorReason } from "./errors.js";
import { settingsFilePath } from "./paths.js";

/**
 * The settings file. Unknown keys are refused: a misspelt `readonly` must stop
 * the command, because ignoring it would allow the writes it was meant to block.
 * Add your CLI's own settings here. The API key never goes in this file.
 */
export const settingsSchema = z.strictObject({
  baseUrl: z.url().optional(),
  account: z.string().trim().min(1).optional(),
  readOnly: z.boolean().optional(),
  timeoutMs: z.number().int().positive().max(600_000).optional(),
  oauthClientId: z.string().trim().min(1).optional(),
  oauthPort: z.number().int().min(1024).max(65_535).optional(),
});

export type Settings = z.infer<typeof settingsSchema>;

function parse(value: unknown): Settings {
  const result = settingsSchema.safeParse(value);
  if (result.success) return result.data;
  const detail = result.error.issues
    .map((issue) => {
      // A bad record key reports "Invalid key in record"; the reason is one level down.
      const inner = issue.code === "invalid_key" ? issue.issues[0]?.message : undefined;
      return `${issue.path.map(String).join(".") || "settings"}: ${inner ?? issue.message}`;
    })
    .join("; ");
  throw new ConfigError(`Invalid settings: ${detail}`, `Settings file: ${settingsFilePath()}`);
}

/**
 * An early version of this CLI kept its sign-in in this same file, under these
 * keys. They are not settings: the sign-in code reads them as an old sign-in
 * (see `readLegacySignIn` in auth.ts), and the next `monday login` or
 * `monday logout` removes them. Every other unknown key is still refused.
 */
export const LEGACY_SIGN_IN_KEYS = ["access_token", "client_secret"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function withoutLegacy(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const rest = { ...value };
  for (const key of LEGACY_SIGN_IN_KEYS) delete rest[key];
  return rest;
}

function legacyPart(value: unknown): Record<string, unknown> {
  const part: Record<string, unknown> = {};
  if (!isRecord(value)) return part;
  for (const key of LEGACY_SIGN_IN_KEYS) if (key in value) part[key] = value[key];
  return part;
}

/** The settings file as written, or null when it is missing or unreadable. Never throws. */
export function readRawSettings(): unknown {
  try {
    return JSON.parse(readFileSync(settingsFilePath(), "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Remove an early version's sign-in keys from the settings file, and keep every
 * real setting. The file goes when nothing else is left in it.
 */
export function clearLegacySettingsSignIn(): void {
  const raw = readRawSettings();
  if (Object.keys(legacyPart(raw)).length === 0) return;
  const rest = withoutLegacy(raw) as Record<string, unknown>;
  if (Object.keys(rest).length === 0) {
    rmSync(settingsFilePath(), { force: true });
    return;
  }
  writeFileAtomic(rest, false);
}

/** Read and validate the settings file. A missing file means no settings. */
export function loadSettings(): Settings {
  const path = settingsFilePath();
  let text: string;
  try {
    text = readFileSync(path, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw new ConfigError(
      `Cannot read the settings file: ${fileErrorReason(error)}.`,
      `Settings file: ${path}. Run \`monday config path\` to see where it should be.`
    );
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ConfigError("The settings file is not valid JSON.", `Settings file: ${path}`);
  }
  return parse(withoutLegacy(value));
}

/**
 * Merge a change into the settings file. The new file is written beside the old
 * one and renamed over it, so a crash cannot leave half a file. A patch value of
 * undefined removes that key.
 */
export function updateSettings(patch: Partial<Settings>): void {
  const merged: Record<string, unknown> = { ...loadSettings(), ...patch };
  for (const key of Object.keys(merged)) {
    if (merged[key] === undefined) delete merged[key];
  }
  writeSettings(merged);
}

function writeSettings(value: Record<string, unknown>): void {
  const next = parse(value);
  // Keep an early version's sign-in, so changing a setting does not sign anyone out.
  const legacy = legacyPart(readRawSettings());
  writeFileAtomic({ ...next, ...legacy }, Object.keys(legacy).length > 0);
}

function writeFileAtomic(value: Record<string, unknown>, holdsSecret: boolean): void {
  const path = settingsFilePath();
  const tmp = `${path}.${process.pid}.tmp`;
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(tmp, JSON.stringify(value, null, 2) + "\n", { encoding: "utf-8", mode: holdsSecret ? 0o600 : 0o644 });
    renameSync(tmp, path);
  } catch (error) {
    rmSync(tmp, { force: true });
    throw new ConfigError(
      `Cannot save the settings file: ${fileErrorReason(error)}.`,
      `Settings file: ${path}. Check you can write to that folder, or point MONDAY_CLI_CONFIG_FILE at another file.`
    );
  }
}

type Leaf = "string" | "boolean" | "integer";

/**
 * Every setting `config set` can change. Add yours here and to the schema above.
 * A dotted name reaches inside an object, and `*` matches any one key of a record,
 * as in "profiles.*.region".
 */
const SETTABLE: Record<string, Leaf> = {
  baseUrl: "string",
  account: "string",
  readOnly: "boolean",
  timeoutMs: "integer",
  oauthClientId: "string",
  oauthPort: "integer",
};

// A `*` takes whatever was typed, and these names would reach JavaScript's own objects.
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function settingPath(name: string): { parts: string[]; type: Leaf } {
  const parts = name.split(".");
  const match = Object.keys(SETTABLE).find((pattern) => {
    const segments = pattern.split(".");
    return (
      segments.length === parts.length &&
      segments.every((s, i) => (s === "*" ? Boolean(parts[i]) && !UNSAFE_KEYS.has(parts[i]!) : s === parts[i]))
    );
  });
  if (!match) {
    throw new UsageError(`There is no setting called "${name}".`, `Settings: ${Object.keys(SETTABLE).join(", ")}.`);
  }
  return { parts, type: SETTABLE[match]! };
}

function coerce(name: string, type: Leaf, raw: string): string | boolean | number {
  if (type === "boolean") {
    if (raw === "true") return true;
    if (raw === "false") return false;
    throw new UsageError(`${name} takes true or false, not "${raw}".`);
  }
  if (type === "integer") {
    if (/^\d+$/.test(raw)) return Number(raw);
    throw new UsageError(`${name} takes a whole number, not "${raw}".`);
  }
  return raw;
}

/**
 * Set one value in the settings file, by its dotted name. The whole file is
 * checked before it is written, so a bad value never reaches the disk.
 */
export function setSetting(name: string, raw: string): Settings {
  const { parts, type } = settingPath(name);
  const value = coerce(name, type, raw);
  const settings = structuredClone(loadSettings()) as Record<string, unknown>;
  let node = settings;
  for (const part of parts.slice(0, -1)) {
    const child = node[part];
    node[part] = typeof child === "object" && child !== null ? child : {};
    node = node[part] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]!] = value;
  writeSettings(settings);
  return loadSettings();
}

/** Remove one value from the settings file. Returns false when it was not set. */
export function unsetSetting(name: string): boolean {
  const { parts } = settingPath(name);
  const settings = structuredClone(loadSettings()) as Record<string, unknown>;
  const chain: Record<string, unknown>[] = [settings];
  for (const part of parts.slice(0, -1)) {
    const child = chain[chain.length - 1]![part];
    if (typeof child !== "object" || child === null) return false;
    chain.push(child as Record<string, unknown>);
  }
  const last = parts[parts.length - 1]!;
  if (!Object.hasOwn(chain[chain.length - 1]!, last)) return false;
  delete chain[chain.length - 1]![last];
  // Drop the objects the removal left empty.
  for (let i = chain.length - 1; i > 0; i--) {
    if (Object.keys(chain[i]!).length > 0) break;
    delete chain[i - 1]![parts[i - 1]!];
  }
  writeSettings(settings);
  return true;
}
