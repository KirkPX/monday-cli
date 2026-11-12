// Output contract. JSON is the machine format; "pretty" is the human format. The DEFAULT is
// decided by resolveFormat, NOT hard-coded per command: interactive terminal -> pretty; piped or
// --json -> json. This single rule keeps every command consistent and makes the CLI agent-safe
// (piped output is always parseable) without the caller needing a flag.

export type OutputFormat = "json" | "pretty";

export function resolveFormat(opts: { json?: boolean; pretty?: boolean } = {}): OutputFormat {
  if (opts.json) return "json";
  // Hidden flag from before 2.0, when JSON was the default even at a terminal.
  if (opts.pretty) return "pretty";
  // Non-interactive (piped, redirected, CI, agent) => machine-readable by default.
  if (!process.stdout.isTTY) return "json";
  return "pretty";
}

export function output(data: unknown, format: OutputFormat): void {
  if (format === "json") {
    console.log(JSON.stringify(data, null, 2));
  } else {
    prettyPrint(data);
  }
}

/**
 * The per-command writer. Every handler starts with `const r = reporter(opts)`.
 *
 * resolveFormat() returning a value is not enough on its own: a loose `format`
 * variable sitting next to a globally available console.log is how a CLI ends
 * up printing prose into a pipe. The Reporter makes the contract the path of
 * least resistance — there is a method for each kind of writing, and none of
 * them is console.log.
 *
 * Rules, enforced by tests/output-contract.test.ts:
 *   - exactly one r.result() on every return path — the ONE stdout write
 *   - console.log never appears in src/cli/commands/**
 */
export type Reporter = {
  readonly format: OutputFormat;
  /** The single stdout write. `pretty` is the human rendering of the same data. */
  result(data: unknown, pretty?: string): void;
  /** Extra lines of a multi-line pretty result. stdout, pretty only. */
  line(message: string): void;
  /** Progress and diagnostics. stderr, pretty only — never pollutes a pipe. */
  note(message: string): void;
  /** Problems worth seeing in both formats. Always stderr. */
  warn(message: string): void;
};

export function reporterFor(format: OutputFormat): Reporter {
  return {
    format,
    result(data, pretty) {
      if (format === "json") output(data, "json");
      else if (pretty !== undefined) console.log(pretty);
      else output(data, "pretty");
    },
    line(message) {
      if (format === "pretty") console.log(message);
    },
    note(message) {
      if (format === "pretty") console.error(message);
    },
    warn(message) {
      console.error(message);
    },
  };
}

export function reporter(opts: { json?: boolean; pretty?: boolean } = {}): Reporter {
  return reporterFor(resolveFormat(opts));
}

function prettyPrint(data: unknown): void {
  if (Array.isArray(data)) {
    // An empty result must still say something. Printing nothing looks the same
    // as a silently broken command.
    if (data.length === 0) {
      console.log("No results.");
      return;
    }
    for (const item of data) prettyPrintItem(item);
  } else if (typeof data === "object" && data !== null) {
    prettyPrintItem(data as Record<string, unknown>);
  } else {
    console.log(String(data));
  }
}

function prettyPrintItem(item: Record<string, unknown>): void {
  const any = item as any;

  // Board structure (inspect). Checked before the board list: both have items_count.
  if ("columns" in item && "groups" in item && "views" in item) {
    printBoardStructure(any);
    return;
  }

  // One row of `monday boards`.
  if ("id" in item && "name" in item && "items_count" in item) {
    console.log(`  ${any.name} (${any.id}) - ${any.workspace?.name || ""} - ${any.items_count} items`);
    return;
  }

  // An item with its column values.
  if (Array.isArray(any.column_values)) {
    console.log(`${any.name} (${any.id})`);
    if (any.group?.title) console.log(`  Group: ${any.group.title}`);
    for (const cv of any.column_values) {
      if (cv.text) console.log(`  ${cv.id}: ${cv.text}`);
    }
    if (any.subitems?.length) {
      console.log(`  Subitems: ${any.subitems.length}`);
      for (const sub of any.subitems) console.log(`    ${sub.name} (${sub.id})`);
    }
    console.log("");
    return;
  }

  // The signed-in user (me).
  if ("name" in item && "email" in item && "account" in item) {
    console.log(`User: ${any.name}`);
    console.log(`Email: ${any.email}`);
    if (any.title) console.log(`Title: ${any.title}`);
    console.log(`Admin: ${any.is_admin ? "Yes" : "No"}`);
    if (any.account?.name) console.log(`Account: ${any.account.name}`);
    return;
  }

  // The complexity budget.
  if ("before" in item && "after" in item && "reset_in_x_seconds" in item) {
    const pct = ((any.after / 10_000_000) * 100).toFixed(1);
    console.log("Complexity Budget");
    console.log(`  Before query: ${any.before.toLocaleString()}`);
    console.log(`  Query cost:   ${any.query.toLocaleString()}`);
    console.log(`  Remaining:    ${any.after.toLocaleString()} (${pct}%)`);
    console.log(`  Resets in:    ${any.reset_in_x_seconds}s`);
    return;
  }

  for (const [key, value] of Object.entries(item)) {
    if (typeof value === "object" && value !== null) {
      console.log(`${key}: ${JSON.stringify(value)}`);
    } else {
      console.log(`${key}: ${value}`);
    }
  }
}

function printBoardStructure(b: any): void {
  console.log(`Board: ${b.name} (${b.id})`);
  if (b.workspace?.name) console.log(`Workspace: ${b.workspace.name}`);
  if (b.items_count != null) console.log(`Items: ${b.items_count}`);
  console.log("");

  if (b.columns?.length) {
    console.log("Columns:");
    const maxId = Math.max(...b.columns.map((c: any) => c.id.length), 2);
    const maxType = Math.max(...b.columns.map((c: any) => c.type.length), 4);
    console.log(`  ${"ID".padEnd(maxId)}  ${"TYPE".padEnd(maxType)}  TITLE`);
    console.log(`  ${"-".repeat(maxId)}  ${"-".repeat(maxType)}  ${"-".repeat(30)}`);
    for (const col of b.columns) {
      console.log(`  ${col.id.padEnd(maxId)}  ${col.type.padEnd(maxType)}  ${col.title}`);
    }
    console.log("");
  }

  if (b.groups?.length) {
    console.log("Groups:");
    for (const g of b.groups) console.log(`  ${g.title} (${g.id})`);
    console.log("");
  }

  if (b.views?.length) {
    console.log("Views:");
    for (const v of b.views) console.log(`  ${v.name} (${v.type})`);
    console.log("");
  }
}
