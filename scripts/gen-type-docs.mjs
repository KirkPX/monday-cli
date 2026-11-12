#!/usr/bin/env node
/** Generate docs/api/types.md — core types expanded + a complete type index. */
import { readFileSync, writeFileSync } from 'node:fs';
const S = JSON.parse(readFileSync('docs/api/.schema-2026-07.json', 'utf-8'));
const RC = JSON.parse(readFileSync('docs/api/.schema-2027-01.json', 'utf-8'));

function tn(t) {
  if (!t) return '?';
  if (t.kind === 'NON_NULL') return tn(t.ofType) + '!';
  if (t.kind === 'LIST') return '[' + tn(t.ofType) + ']';
  return t.name ?? '?';
}
const clean = (d) => (d ?? '').replace(/\s+/g, ' ').trim();
const idx = Object.fromEntries(S.types.map((t) => [t.name, t]));
const rcIdx = Object.fromEntries(RC.types.map((t) => [t.name, t]));

/* Types you actually reach for, in the order you meet them. */
const CORE = [
  ['Board', 'The board itself. NOTE: no automation field exists here — checked.'],
  ['Group', 'A board group. `items_page` on Board is group-filterable via query_params.'],
  ['Item', 'A row ("pulse" in the older API and in activity-log payloads).'],
  ['ItemsPage', 'Cursor pagination. Continue with root `next_items_page(cursor:)`.'],
  ['Column', '`settings_str` holds a status column\'s DEFINED label set — dropped by `inspect --pretty`.'],
  ['ColumnValue', 'Interface. `text` is the display string; `value` is raw JSON.'],
  ['Update', 'A comment. Reachable ONLY via `boards{updates}` / root `updates` — no CLI command.'],
  ['Reply', 'A threaded reply under an Update.'],
  ['User', 'Resolve numeric activity-log user_ids through root `users(ids:)`.'],
  ['Account', 'The workspace account.'],
  ['Workspace', 'Board container.'],
  ['ActivityLogType', '`data` is a JSON STRING — parse it. `created_at` is 17 digits; first 10 = unix seconds.'],
  ['Webhook', 'Board event subscriptions.'],
  ['Doc', 'Monday Docs.'],
  ['Tag', ''], ['Team', ''], ['Asset', ''],
  ['ComplexityType', 'Budget accounting. `monday complexity`.'],
  ['TriggerEvent', 'One automation RUN. ~9-day retention.'],
  ['BoardAutomation', `Recipe definition — ONLY in 2027-01+, and empty without an automations scope.`],
];

const L = [`# Monday GraphQL type reference

Generated from live introspection at **API-Version 2026-07** (current) by
\`scripts/gen-type-docs.mjs\`. \`BoardAutomation\`/\`AutomationsPage\` are read from **2027-01**,
where they first appear.

Companion: [\`public-api.md\`](public-api.md) — the query/mutation root surface.

## Core types
`];

for (const [name, note] of CORE) {
  const t = idx[name] ?? rcIdx[name];
  if (!t) { L.push(`### \`${name}\`\n\n_Not present in this schema version._\n`); continue; }
  const where = idx[name] ? '' : ' _(2027-01 only)_';
  L.push(`### \`${name}\`${where}\n`);
  if (note) L.push(`> ${note}\n`);
  if (clean(t.description)) L.push(`${clean(t.description)}\n`);
  const rows = (t.fields ?? t.inputFields ?? []);
  if (rows.length) {
    L.push('| Field | Type | Notes |', '|---|---|---|');
    for (const f of rows) {
      const args = (f.args ?? []).length ? `(${f.args.map((a) => a.name + ': ' + tn(a.type)).join(', ')})` : '';
      const dep = f.isDeprecated ? '**DEPRECATED** ' : '';
      L.push(`| \`${f.name}${args}\` | \`${tn(f.type)}\` | ${dep}${clean(f.description).slice(0, 80)} |`);
    }
    L.push('');
  }
  if (t.enumValues?.length) {
    L.push('Values: ' + t.enumValues.map((e) => '`' + e.name + '`').join(', ') + '\n');
  }
}

/* Complete index, compact, grouped by kind. */
L.push('## Complete type index\n');
L.push(`All ${S.types.length} types at 2026-07. Introspect any one with:\n`);
L.push('```graphql\nquery { __type(name:"Board") { fields { name type { name kind ofType { name } } } } }\n```\n');
const groups = {};
for (const t of S.types) (groups[t.kind] ??= []).push(t.name);
for (const k of Object.keys(groups).sort()) {
  const list = groups[k].filter((n) => !n.startsWith('__')).sort();
  L.push(`### ${k} (${list.length})\n`);
  L.push(list.map((n) => '`' + n + '`').join(', ') + '\n');
}
writeFileSync('docs/api/types.md', L.join('\n'));
console.log(`types.md — ${CORE.length} core types expanded, ${S.types.length} indexed`);
