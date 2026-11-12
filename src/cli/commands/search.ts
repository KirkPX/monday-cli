import type { ApiClient } from "../../client.js";
import { ApiError, NetworkError, TimeoutError } from "../../errors.js";
import { getBoards, getItems } from "../../monday-api.js";
import { createClient } from "../client-helpers.js";
import { reporter, type Reporter } from "../output.js";
import type { CommonOpts } from "../types.js";

type SearchHit = {
  board_id: string;
  board_name: string;
  workspace: string;
  item_id: string;
  item_name: string;
  group: string;
  matched_fields: Array<{ field: string; value: string }>;
  column_values: Array<{ id: string; text: string }>;
};

type BoardInfo = { id: string; name: string; workspace: string };

function matches(text: string, term: string): boolean {
  return text.toLowerCase().includes(term.toLowerCase());
}

function findHits(items: any[], term: string, board: BoardInfo): SearchHit[] {
  const hits: SearchHit[] = [];
  for (const item of items) {
    const matched: SearchHit["matched_fields"] = [];
    if (matches(item.name || "", term)) matched.push({ field: "name", value: item.name });
    for (const cv of item.column_values || []) {
      if (cv.text && matches(cv.text, term)) matched.push({ field: cv.id, value: cv.text });
    }
    for (const sub of item.subitems || []) {
      if (matches(sub.name || "", term)) matched.push({ field: `subitem:${sub.id}:name`, value: sub.name });
      for (const cv of sub.column_values || []) {
        if (cv.text && matches(cv.text, term)) matched.push({ field: `subitem:${sub.id}:${cv.id}`, value: cv.text });
      }
    }
    if (matched.length > 0) {
      hits.push({
        board_id: board.id,
        board_name: board.name,
        workspace: board.workspace,
        item_id: item.id,
        item_name: item.name,
        group: item.group?.title || "",
        matched_fields: matched,
        column_values: (item.column_values || []).filter((cv: any) => cv.text),
      });
    }
  }
  return hits;
}

async function searchAllBoards(
  client: ApiClient,
  term: string,
  limit: number,
  workspace: string | undefined,
  r: Reporter
): Promise<SearchHit[]> {
  const boards = (await getBoards(client, { workspaceId: workspace })).filter((b) => b.items_count > 0);
  r.note(`Searching ${boards.length} boards for "${term}"...\n`);

  const hits: SearchHit[] = [];
  for (const board of boards) {
    try {
      const { items } = await getItems(client, board.id, { limit });
      const found = findHits(items, term, {
        id: board.id,
        name: board.name,
        workspace: board.workspace?.name || "",
      });
      hits.push(...found);
      if (found.length > 0) r.note(`  Found ${found.length} match(es) on ${board.name}`);
    } catch (error) {
      // A board the sign-in cannot read should not end a search of the others.
      // A problem with the sign-in or the connection would fail on every board.
      const stop =
        error instanceof NetworkError ||
        error instanceof TimeoutError ||
        (error instanceof ApiError && error.status === 401);
      if (stop) throw error;
      r.warn(`Skipped board ${board.name} (${board.id}): ${(error as Error).message}`);
      // A list with boards missing must not look like a complete answer.
      process.exitCode = 1;
    }
  }
  return hits;
}

function renderHit(hit: SearchHit): string {
  const lines = [`${hit.item_name} (${hit.item_id})`, `  Board: ${hit.board_name} (${hit.board_id})`];
  if (hit.workspace) lines.push(`  Workspace: ${hit.workspace}`);
  if (hit.group) lines.push(`  Group: ${hit.group}`);
  lines.push("  Matched:", ...hit.matched_fields.map((m) => `    ${m.field}: ${m.value}`));
  const shown = new Set(hit.matched_fields.map((m) => m.field));
  const context = hit.column_values.filter((cv) => !shown.has(cv.id)).slice(0, 8);
  if (context.length) lines.push("  Context:", ...context.map((cv) => `    ${cv.id}: ${cv.text}`));
  lines.push("");
  return lines.join("\n");
}

export async function searchCommand(
  term: string,
  opts: CommonOpts & { boardId?: number; workspace?: number; limit?: number } = {}
): Promise<void> {
  const r = reporter(opts);
  const client = createClient(opts);
  const limit = opts.limit ?? 500;

  let hits: SearchHit[];
  if (opts.boardId !== undefined) {
    const id = String(opts.boardId);
    const { items, board } = await getItems(client, id, { limit });
    hits = findHits(items, term, { id, name: board?.name || id, workspace: board?.workspace?.name || "" });
  } else {
    const workspace = opts.workspace === undefined ? undefined : String(opts.workspace);
    hits = await searchAllBoards(client, term, limit, workspace, r);
  }

  r.result(hits, [`${hits.length} result(s) for "${term}"\n`, ...hits.map(renderHit)].join("\n"));
}
