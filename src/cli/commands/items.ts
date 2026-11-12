import { getItems, type ColumnFilter } from "../../monday-api.js";
import { UsageError } from "../../errors.js";
import { createClient } from "../client-helpers.js";
import { reporter } from "../output.js";
import type { CommonOpts } from "../types.js";
import { boardNotFound } from "./inspect.js";

export async function itemsCommand(
  boardId: string,
  opts: CommonOpts & { limit?: number; status?: string; column?: string; value?: string } = {}
): Promise<void> {
  const r = reporter(opts);
  if (Boolean(opts.column) !== Boolean(opts.value)) {
    // One of the pair on its own used to be ignored, and returned every item.
    throw new UsageError("--column and --value work together. Pass both, or neither.");
  }

  const columnFilters: ColumnFilter[] = [];
  if (opts.status) columnFilters.push({ column_id: "status", compare_value: [opts.status] });
  if (opts.column && opts.value) columnFilters.push({ column_id: opts.column, compare_value: [opts.value] });

  const result = await getItems(createClient(opts), boardId, {
    limit: opts.limit,
    columnFilters: columnFilters.length ? columnFilters : undefined,
  });
  if (!result.board) throw boardNotFound(boardId);

  if (r.format === "json") {
    r.result(result);
    return;
  }
  r.line(`${result.items.length} items\n`);
  r.result(result.items);
}
