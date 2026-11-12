import { getActivityLogs } from "../../monday-api.js";
import { createClient } from "../client-helpers.js";
import { reporter } from "../output.js";
import type { CommonOpts } from "../types.js";
import { boardNotFound } from "./inspect.js";

type ActivityOpts = CommonOpts & {
  limit?: number;
  user?: number;
  column?: string;
  group?: string;
  item?: number;
  from?: string;
  to?: string;
};

export async function activityCommand(boardId: string, opts: ActivityOpts = {}): Promise<void> {
  const r = reporter(opts);
  const { board, logs } = await getActivityLogs(createClient(opts), boardId, {
    limit: opts.limit,
    userId: opts.user === undefined ? undefined : String(opts.user),
    columnId: opts.column,
    groupId: opts.group,
    itemId: opts.item === undefined ? undefined : String(opts.item),
    from: opts.from,
    to: opts.to,
  });
  if (!board) throw boardNotFound(boardId);

  const parsed = logs.map((log) => ({ ...log, data: parseData(log.data) }));
  const pretty =
    r.format === "pretty"
      ? [`Activity log for ${board.name}: ${logs.length} entries\n`, ...parsed.map(renderEntry)].join("\n")
      : undefined;
  r.result({ board_id: board.id, board_name: board.name, activity_logs: parsed }, pretty);
}

function parseData(raw: string): Record<string, any> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function renderEntry(log: any): string {
  // created_at is a high-precision timestamp. Its first 10 digits are Unix seconds.
  const date = new Date(parseInt(log.created_at.substring(0, 10), 10) * 1000).toLocaleString();
  const data = log.data as Record<string, any>;
  const event = log.event.replace(/_/g, " ");
  const who = data.user_name || (log.user_id === "-4" ? "automation" : `user ${log.user_id}`);
  const itemName = data.pulse_name || data.item_name || "";
  const previous = displayValue(data.previous_value);
  const next = displayValue(data.value);

  const lines = [`[${date}] ${event} - ${who}`];
  if (itemName) lines.push(`  Item: ${itemName}`);
  if (data.column_title) lines.push(`  Column: ${data.column_title}`);
  if (previous && next) lines.push(`  Changed: ${previous} -> ${next}`);
  else if (next) lines.push(`  Value: ${next}`);
  lines.push("");
  return lines.join("\n");
}

/** A readable string from an activity log value, whatever the column type. */
function displayValue(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val !== "object") return String(val);

  const v = val as Record<string, any>;
  if (v.label) {
    return typeof v.label === "object" ? v.label.text || JSON.stringify(v.label) : String(v.label);
  }
  if (v.date) return v.time ? `${v.date} ${v.time}` : v.date;
  if (v.personsAndTeams) return v.personsAndTeams.map((p: any) => `${p.kind} ${p.id}`).join(", ");
  if (Array.isArray(v.files)) return v.files.map((f: any) => f.name || "file").join(", ");
  if ("value" in v && (typeof v.value === "string" || typeof v.value === "number")) return String(v.value);
  if (v.name) return v.name;
  if (v.text) return v.text;
  return JSON.stringify(val);
}
