import { getBoards } from "../../monday-api.js";
import { createClient } from "../client-helpers.js";
import { reporter } from "../output.js";
import type { CommonOpts } from "../types.js";

export async function boardsCommand(
  opts: CommonOpts & { workspace?: number; search?: string } = {}
): Promise<void> {
  const r = reporter(opts);
  const boards = await getBoards(createClient(opts), {
    workspaceId: opts.workspace === undefined ? undefined : String(opts.workspace),
    search: opts.search,
  });
  if (boards.length > 0) r.line(`${boards.length} boards found\n`);
  r.result(boards);
}
