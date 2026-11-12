import { UsageError } from "../../errors.js";
import { getBoardStructure } from "../../monday-api.js";
import { createClient } from "../client-helpers.js";
import { reporter } from "../output.js";
import type { CommonOpts } from "../types.js";

export async function inspectCommand(boardId: string, opts: CommonOpts = {}): Promise<void> {
  const r = reporter(opts);
  const board = await getBoardStructure(createClient(opts), boardId);
  if (!board) throw boardNotFound(boardId);
  r.result(board);
}

/** Monday answers an unknown or hidden board with an empty list, not an error. */
export function boardNotFound(boardId: string): UsageError {
  return new UsageError(
    `Board ${boardId} was not found.`,
    "Check the ID with `monday boards`. The board may also be one your sign-in cannot see."
  );
}
