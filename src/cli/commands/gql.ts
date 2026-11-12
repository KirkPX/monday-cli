import { isMutation } from "../../client.js";
import { UsageError } from "../../errors.js";
import { createClient } from "../client-helpers.js";
import {
  assertWritable,
  confirmDestructive,
  dryRunSummary,
  printDryRun,
  reportAbort,
} from "../guardrails.js";
import { reporter } from "../output.js";
import { readJsonOption, readOptionFile, readOptionText } from "../read-file.js";
import type { MutationOpts } from "../types.js";

/** Mutations that remove something, by Monday's naming. They need --yes. */
const DESTRUCTIVE_FIELD = /(?<![a-zA-Z])(delete|archive|clear|remove|revoke|deactivate|detach|unassign|unpublish)_\w+/;

/**
 * Raw GraphQL: the way to reach everything the typed commands do not wrap, such as
 * updates, user names and schema introspection. docs/api/public-api.md lists it all.
 * A mutation here gets the same guards as a typed command.
 */
export async function gqlCommand(
  query: string | undefined,
  opts: MutationOpts & { file?: string; variables?: string; apiVersion?: string } = {}
): Promise<void> {
  const r = reporter(opts);

  let document = query;
  if (opts.file) {
    document = opts.file === "-" ? await readOptionText("--file", "-") : await readOptionFile("--file", opts.file);
  }
  if (!document) throw new UsageError("Provide a query, or --file <path> (use - for standard input).");

  const variables =
    opts.variables === undefined
      ? undefined
      : ((await readJsonOption("--variables", opts.variables)) as Record<string, unknown>);

  if (isMutation(document)) {
    assertWritable(opts);
    if (opts.dryRun) {
      printDryRun(dryRunSummary(true, "Would run this mutation."), true, r);
      return;
    }
    if (DESTRUCTIVE_FIELD.test(document)) {
      const answer = await confirmDestructive("Run this mutation, which removes something?", opts);
      if (!answer.confirmed) {
        reportAbort(r, answer.reason, "Did not run the mutation.");
        return;
      }
    }
  }

  const client = createClient(opts);
  const { data, errors } = await client.graphql(document, variables, { apiVersion: opts.apiVersion });

  if (data === null) throw client.failure(errors, "GraphQL request");
  // Monday can answer part of a query. The part it answered still goes to stdout,
  // the rest goes to stderr, and the exit code says the answer is incomplete.
  if (errors.length > 0) {
    r.warn(JSON.stringify({ error: true, messages: errors.map((e) => e.message) }, null, 2));
    process.exitCode = 1;
  }
  r.result(data);
}
