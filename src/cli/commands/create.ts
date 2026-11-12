import { createItem } from "../../monday-api.js";
import { createClient } from "../client-helpers.js";
import { assertWritable, dryRunSummary, printDryRun } from "../guardrails.js";
import { reporter } from "../output.js";
import { readJsonOption } from "../read-file.js";
import type { MutationOpts } from "../types.js";

export async function createCommand(
  boardId: string,
  name: string,
  opts: MutationOpts & { group?: string; values?: string } = {}
): Promise<void> {
  const r = reporter(opts);
  assertWritable(opts);
  const columnValues = opts.values === undefined ? undefined : await readJsonOption("--values", opts.values);

  if (opts.dryRun) {
    printDryRun(dryRunSummary(true, `Would create "${name}" on board ${boardId}.`), true, r);
    return;
  }
  const item = await createItem(createClient(opts), boardId, name, { groupId: opts.group, columnValues });
  printDryRun(dryRunSummary(true, `Created item: ${item.name} (${item.id})`), false, r, item);
}
