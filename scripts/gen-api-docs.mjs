#!/usr/bin/env node
/**
 * Generate docs/api/public-api.md from the introspection dumps.
 * Usage: node scripts/gen-api-docs.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const load = (v) => JSON.parse(readFileSync(`docs/api/.schema-${v}.json`, 'utf-8'));
const CUR = '2026-07', RC = '2027-01', DEV = 'dev';
const S = { [CUR]: load(CUR), [RC]: load(RC), [DEV]: load(DEV) };

/** Render a type reference as GraphQL SDL-ish text (Int!, [Board!]!, ...). */
function tn(t) {
  if (!t) return '?';
  if (t.kind === 'NON_NULL') return tn(t.ofType) + '!';
  if (t.kind === 'LIST') return '[' + tn(t.ofType) + ']';
  return t.name ?? '?';
}
const byName = (s) => Object.fromEntries(s.types.map((t) => [t.name, t]));
const rootFields = (s, which) => {
  const rootName = s[which]?.name;
  if (!rootName) return [];
  return (byName(s)[rootName]?.fields ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
};
const sig = (f) => {
  const args = (f.args ?? []).map((a) => `${a.name}: ${tn(a.type)}${a.defaultValue != null ? ' = ' + a.defaultValue : ''}`);
  return args.length ? `${f.name}(${args.join(', ')})` : f.name;
};
const clean = (d) => (d ?? '').replace(/\s+/g, ' ').trim();

/* ---- CLI coverage: which root fields monday-cli already wraps ---- */
const COVERED = {
  me: 'monday me', complexity: 'monday complexity', boards: 'monday boards / inspect',
  __schema: 'monday gql', __type: 'monday gql',
  items: 'monday items', next_items_page: 'monday items (pagination)', docs: 'monday docs',
  webhooks: 'monday webhooks', workspaces: 'monday boards --workspace', folders: 'monday docs',
  version: '—', versions: '—',
};
/* Root fields an audit actually needed but the CLI cannot reach. */
const GAPS = {
  updates: 'board/item comments — no typed command; use `monday gql`',
  users: 'resolve activity-log user_id -> name; use `monday gql`',
  trigger_events: 'automation run history (~9d retention); use `monday gql`',
  trigger_event: 'single automation run by uuid',
  board_automations: `automation recipe list — ${RC}+ only, returns [] without an automations scope`,
  account_trigger_statistics: 'UNUSABLE — board_id typed Int, overflows modern board IDs',
  account_triggers_statistics_by_entity_id: 'UNUSABLE — board_id typed Int',
  items_page_by_column_values: 'server-side column filter',
};

function table(fields, s) {
  const out = ['| Field | Returns | CLI | Notes |', '|---|---|---|---|'];
  for (const f of fields) {
    const cli = COVERED[f.name] ? `\`${COVERED[f.name]}\`` : '—';
    const note = GAPS[f.name] ? `**${GAPS[f.name]}**` : clean(f.description).slice(0, 90);
    out.push(`| \`${sig(f)}\` | \`${tn(f.type)}\` | ${cli} | ${note} |`);
  }
  return out.join('\n');
}

const q = {}, m = {};
for (const v of [CUR, RC, DEV]) { q[v] = rootFields(S[v], 'queryType'); m[v] = rootFields(S[v], 'mutationType'); }
const names = (arr) => new Set(arr.map((f) => f.name));
const delta = (a, b) => [...names(b)].filter((n) => !names(a).has(n)).sort();

const L = [];
L.push(`# Monday public GraphQL API — complete root surface

**Generated** by \`scripts/gen-api-docs.mjs\` from live introspection. Do not hand-edit; re-run
\`node scripts/introspect.mjs <version>\` then \`node scripts/gen-api-docs.mjs\`.

Endpoint \`https://api.monday.com/v2\`. Auth header is the bare token (**no** \`Bearer\` prefix),
read from \`~/.config/monday/config.json\` key **\`access_token\`**.

## Version is load-bearing — read this first

| Header sent | Version served | Query root fields |
|---|---|---|
| *(none)* | **${CUR}** (current) | **${q[CUR].length}** |
| \`API-Version: 2024-10\` (expired) | 2025-04 (silent downgrade) | 48 |
| \`API-Version: ${RC}\` | ${RC} (release candidate) | ${q[RC].length} |
| \`API-Version: ${DEV}\` | dev | ${q[DEV].length} |

An **expired** version does not error — the server silently falls back to the oldest maintained
version and roughly halves the surface. **Send no header** unless you deliberately want a newer one.
Confirm with \`query { version { kind value } }\`.

| Version | Types | Query fields | Mutations |
|---|---|---|---|
| ${CUR} (current) | ${S[CUR].types.length} | ${q[CUR].length} | ${m[CUR].length} |
| ${RC} (RC) | ${S[RC].types.length} | ${q[RC].length} | ${m[RC].length} |
| ${DEV} (dev) | ${S[DEV].types.length} | ${q[DEV].length} | ${m[DEV].length} |

## Query root — ${CUR} (current, what you get by default)

${table(q[CUR], S[CUR])}

## Mutation root — ${CUR}

${table(m[CUR], S[CUR])}

## What ${RC} adds over ${CUR}

New query fields (${delta(q[CUR], q[RC]).length}): ${delta(q[CUR], q[RC]).map((n) => '`' + n + '`').join(', ') || '_none_'}

New mutations (${delta(m[CUR], m[RC]).length}): ${delta(m[CUR], m[RC]).map((n) => '`' + n + '`').join(', ') || '_none_'}

## What \`dev\` adds over ${RC}

New query fields (${delta(q[RC], q[DEV]).length}): ${delta(q[RC], q[DEV]).map((n) => '`' + n + '`').join(', ') || '_none_'}

New mutations (${delta(m[RC], m[DEV]).length}): ${delta(m[RC], m[DEV]).map((n) => '`' + n + '`').join(', ') || '_none_'}

> \`dev\` is unstable and unversioned. Treat it as a preview of direction, never as a target.
`);
writeFileSync('docs/api/public-api.md', L.join('\n'));
console.log(`public-api.md: ${q[CUR].length} query / ${m[CUR].length} mutation fields (${CUR})`);
console.log(`RC adds ${delta(q[CUR], q[RC]).length} queries, ${delta(m[CUR], m[RC]).length} mutations`);
console.log(`dev adds ${delta(q[RC], q[DEV]).length} queries, ${delta(m[RC], m[DEV]).length} mutations`);
