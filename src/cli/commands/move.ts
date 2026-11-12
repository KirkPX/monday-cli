import { UsageError } from "../../errors.js";
import { moveItemToBoard, moveItemToGroup } from "../../monday-api.js";
import { createClient } from "../client-helpers.js";
import { assertWritable, dryRunSummary, printDryRun } from "../guardrails.js";
import { reporter } from "../output.js";
import type { MutationOpts } from "../types.js";

export async function moveCommand(
  itemId: string,
  opts: MutationOpts & { toGroup?: string; toBoard?: string; group?: string } = {}
): Promise<void> {
  const r = reporter(opts);
  assertWritable(opts);
  if (opts.toBoard && !opts.group) throw new UsageError("--group is required with --to-board.");
  if (!opts.toBoard && !opts.toGroup) throw new UsageError("Pass --to-group or --to-board.");

  const target = opts.toBoard ? `board ${opts.toBoard}` : `group ${opts.toGroup}`;
  if (opts.dryRun) {
    printDryRun(dryRunSummary(true, `Would move item ${itemId} to ${target}.`), true, r);
    return;
  }
  const client = createClient(opts);
  const item = opts.toBoard
    ? await moveItemToBoard(client, itemId, opts.toBoard, opts.group!)
    : await moveItemToGroup(client, itemId, opts.toGroup!);
  const label = opts.toBoard ? "board" : "group";
  printDryRun(dryRunSummary(true, `Moved to ${label}: ${item.name} (${item.id})`), false, r, item);
}
