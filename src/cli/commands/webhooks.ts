import { UsageError } from "../../errors.js";
import { createWebhook, deleteWebhook, getWebhooks } from "../../monday-api.js";
import { createClient } from "../client-helpers.js";
import {
  assertWritable,
  confirmDestructive,
  dryRunSummary,
  printDryRun,
  reportAbort,
} from "../guardrails.js";
import { reporter, type Reporter } from "../output.js";
import { readJsonOption } from "../read-file.js";
import type { MutationOpts } from "../types.js";

type WebhookOpts = MutationOpts & {
  boardId?: number;
  url?: string;
  event?: string;
  config?: string;
  id?: number;
};

function required<T>(value: T | undefined, flag: string): T {
  if (value === undefined || value === "") throw new UsageError(`${flag} is required for this action.`);
  return value;
}

async function list(opts: WebhookOpts, r: Reporter): Promise<void> {
  const boardId = String(required(opts.boardId, "--board-id"));
  const hooks = await getWebhooks(createClient(opts), boardId);
  r.result(
    hooks,
    hooks.length
      ? [`${hooks.length} webhooks:\n`, ...hooks.map((h) => `  ${h.id} - ${h.event} (board: ${h.board_id})`)].join("\n")
      : "No webhooks found"
  );
}

async function create(opts: WebhookOpts, r: Reporter): Promise<void> {
  assertWritable(opts);
  const boardId = String(required(opts.boardId, "--board-id"));
  const url = required(opts.url, "--url");
  const event = required(opts.event, "--event");
  const config = opts.config === undefined ? undefined : await readJsonOption("--config", opts.config);

  if (opts.dryRun) {
    printDryRun(dryRunSummary(true, `Would create a ${event} webhook on board ${boardId}.`), true, r);
    return;
  }
  const hook = await createWebhook(createClient(opts), boardId, url, event, config);
  printDryRun(dryRunSummary(true, `Created webhook: ${hook.id}`), false, r, hook);
}

async function remove(opts: WebhookOpts, r: Reporter): Promise<void> {
  assertWritable(opts);
  const id = String(required(opts.id, "--id"));
  if (opts.dryRun) {
    printDryRun(dryRunSummary(true, `Would delete webhook ${id}.`), true, r);
    return;
  }
  const answer = await confirmDestructive(`Delete webhook ${id}?`, opts);
  if (!answer.confirmed) {
    reportAbort(r, answer.reason, `Did not delete webhook ${id}.`);
    return;
  }
  const hook = await deleteWebhook(createClient(opts), id);
  printDryRun(dryRunSummary(true, `Deleted webhook: ${id}`), false, r, hook ?? {});
}

export async function webhooksCommand(action: string, opts: WebhookOpts = {}): Promise<void> {
  const r = reporter(opts);
  if (action === "list") return list(opts, r);
  if (action === "create") return create(opts, r);
  if (action === "delete") return remove(opts, r);
  throw new UsageError(`Unknown action: ${action}.`, "Use list, create or delete.");
}
