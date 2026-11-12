import { UsageError } from "../../errors.js";
import { changeColumnValueJson, updateColumnValue } from "../../monday-api.js";
import { createClient } from "../client-helpers.js";
import { assertWritable, dryRunSummary, printDryRun } from "../guardrails.js";
import { reporter } from "../output.js";
import { readJsonOption } from "../read-file.js";
import type { MutationOpts } from "../types.js";

export async function updateCommand(
  boardId: string,
  itemId: string,
  opts: MutationOpts & { col: string; value: string; valueJson?: boolean }
): Promise<void> {
  const r = reporter(opts);
  assertWritable(opts);

  // Before 2.0, `--json` on this command meant "the value is JSON". It now selects
  // JSON output on every command. Without this check, an old script would store the
  // JSON as plain text in the column.
  if (opts.json && !opts.valueJson && /^\s*([[{"]|null\b)/.test(opts.value)) {
    throw new UsageError(
      "--value looks like JSON, but --json now only selects the output format.",
      "Pass --value-json to send the value as JSON."
    );
  }
  const value = opts.valueJson ? await readJsonOption("--value", opts.value) : opts.value;

  if (opts.dryRun) {
    printDryRun(dryRunSummary(true, `Would update column ${opts.col} on item ${itemId}.`), true, r);
    return;
  }
  const client = createClient(opts);
  const item = opts.valueJson
    ? await changeColumnValueJson(client, boardId, itemId, opts.col, value)
    : await updateColumnValue(client, boardId, itemId, opts.col, opts.value);
  printDryRun(dryRunSummary(true, `Updated: ${item.name} (${item.id})`), false, r, item);
}
