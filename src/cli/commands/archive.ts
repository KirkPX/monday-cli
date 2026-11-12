import { archiveItem } from "../../monday-api.js";
import { createClient } from "../client-helpers.js";
import {
  assertWritable,
  confirmDestructive,
  dryRunSummary,
  printDryRun,
  reportAbort,
} from "../guardrails.js";
import { reporter } from "../output.js";
import type { MutationOpts } from "../types.js";

export async function archiveCommand(itemId: string, opts: MutationOpts = {}): Promise<void> {
  const r = reporter(opts);
  assertWritable(opts);
  if (opts.dryRun) {
    printDryRun(dryRunSummary(true, `Would archive item ${itemId}.`), true, r);
    return;
  }
  const answer = await confirmDestructive(`Archive item ${itemId}?`, opts);
  if (!answer.confirmed) {
    reportAbort(r, answer.reason, `Did not archive item ${itemId}.`);
    return;
  }
  const item = await archiveItem(createClient(opts), itemId);
  printDryRun(dryRunSummary(true, `Archived: ${item.name} (${item.id})`), false, r, item);
}
