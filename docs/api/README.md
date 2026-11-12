# Monday API reference

What Monday's public GraphQL API exposes, generated from the live schema.

| Doc | Covers | Contract |
|---|---|---|
| [`public-api.md`](public-api.md) | `POST https://api.monday.com/v2` GraphQL | Documented, versioned, stable. **96 query fields, 196 mutations, 1,291 types** at API-Version `2026-07`. |
| [`types.md`](types.md) | Type reference for the above | 20 core types expanded, all 1,291 indexed. |

## The two rules that cost the most time

1. **Do not pin a stale `API-Version`.** An expired version does not error — the server silently
   falls back to the oldest maintained one and roughly halves the surface (96 fields → 48). Send
   **no** header to get current. Verify with `query { version { kind value } }`.
2. **An empty result is not an answer.** `board_automations` returns `{items: []}` for a board with
   8 live automations, because the token has no automations scope. Absence in a scoped or
   permission-limited query is not evidence of absence — go wider before concluding.

## Regenerating

`public-api.md` and `types.md` are **generated**. Do not hand-edit them.

```sh
node scripts/introspect.mjs            # current version -> docs/api/.schema-default.json
node scripts/introspect.mjs 2026-07    # explicit
node scripts/introspect.mjs 2027-01    # release candidate
node scripts/introspect.mjs dev        # unstable preview
node scripts/gen-api-docs.mjs          # -> public-api.md
node scripts/gen-type-docs.mjs         # -> types.md
```

The `.schema-*.json` dumps are gitignored — they are large and reproducible in one command.

## Where the CLI sits

`monday-cli` wraps a deliberately small slice of `public-api.md` — boards, items, activity, docs,
webhooks. `public-api.md` marks each root field with the command that covers it, or `—` where
nothing does. `monday gql` reaches the rest.
