# Agent instructions

Follow [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/cross-platform.md](docs/cross-platform.md).

Project shape:

- `src/index.ts`: CLI entry point, with lazy command imports and the top-level error handler.
- `src/client.ts`: API transport, with timeout, limited retries and redacted errors. `src/monday-api.ts`: the GraphQL queries.
- `src/paths.ts`: the settings folder. `src/settings.ts`: the settings file. `src/config.ts`: the precedence chain.
- `src/auth.ts`: credential stores.
- `src/errors.ts`: typed errors, with secret redaction.
- `src/cli/output.ts`, `src/cli/guardrails.ts`: output format, dry runs, confirmation, read-only.
- `src/cli/ask.ts`: every prompt. `src/cli/parse.ts`: number options. `src/cli/read-file.ts`: files and JSON bodies. `src/cli/client-helpers.ts`: `createClient()`.
- `src/cli/commands/`: one file per command group, imported lazily from `index.ts`.
- `src/login/`: the browser sign-in page, the paste fallback and the OAuth route.

## Rules that matter most

- **ESM and `tsup`**, Node 22.18, 24.11 or newer. Do not switch to CommonJS or build with plain `tsc`. It leaves old files in `dist/`.
- **Dependencies are fixed:** `commander`, `zod`, `@napi-rs/keyring`, `picocolors`. Do not add `axios`, `chalk`, `inquirer`, `ora` or `jest`. Use `fetch`, `picocolors`, readline and `vitest`.
- **Build without `--dts`.** TypeScript 7 has no compiler API for `tsup --dts`. A CLI needs no type files.
- **`private: true` stays.** Releases are GitHub-only, and this prevents an accidental npm publish.
- **Secrets** go through `src/auth.ts`, or `MONDAY_API_KEY`. Never print a full token. Use `redact()`.
- **Settings** go through `src/settings.ts` and `src/config.ts`. One precedence chain: flags, env, settings file or keychain, default.

## Adding a command

- **Read command:** copy `src/cli/commands/me.ts`. Register it in `index.ts` with a lazy `import()`.
- **Command that changes data:** call `assertWritable(opts)`, then `confirmDestructive(msg, opts)` for destructive actions, and report through `printDryRun()`, so output separates changed, would change and nothing changed.
- Number options use `src/cli/parse.ts`. Options that take JSON use `readJsonBody()` in `src/cli/read-file.ts`.
- Update `README.md` and add a test in the same change. Add every new environment variable to `.env.example`.

## Verify before committing

```bash
npm run typecheck && npm test && npm run build && npm run smoke
```

## Monday's API

`docs/api/` holds what Monday exposes:

- `public-api.md`: every root query and mutation at one API version, with the CLI command that covers each. Generated: run `scripts/introspect.mjs`, then `scripts/gen-api-docs.mjs`. Do not hand-edit it.
- `types.md`: the type reference. Also generated.

Rules that have already cost real time:

1. **Send no `API-Version` unless asked.** An expired version raises no error. Monday serves its oldest supported version, with about half the fields.
2. **An empty result is not an answer.** Monday can return an empty list because the token lacks a scope.
3. **Never ask for a column's `width`.** It causes server errors.
4. **Values go in GraphQL variables,** never inside the document text.
5. **A query across all boards spends most of the per-minute budget.** Go slowly when you test against the real service, and never write to it from a test.

Queries live in `src/monday-api.ts`. Transport lives in `src/client.ts`. `ApiClient.query` throws on any GraphQL error, so a refusal cannot look like an empty list.
