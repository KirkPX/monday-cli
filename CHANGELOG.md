# Changelog

## 2.0.2

**Fixed**

- `monday login --json` at a terminal now prints only JSON on standard output. The browser sign-in's status lines ("Opened …", "Open this page …" and "Waiting…") go to standard error, as the `--oauth` sign-in's lines already did.

## 2.0.1

**Fixed**

- An upgrade from an early version no longer stops every command with `Invalid settings: Unrecognized keys: "access_token", "client_secret"`. That version kept its sign-in in the file that now holds the settings. The CLI now reads those two keys as an old sign-in, so it keeps working, and the next `monday login` moves the token to the keychain and removes the keys. Your other settings in the file stay. Any other unknown key is still refused.

## 2.0.0

The CLI now follows one standard for output, safety, sign-in and installs.

**What changes for people using it**

- At a terminal, commands print readable text. In a pipe they print JSON, as before. `--json` forces JSON. The old `--pretty` flag still works.
- `update --json` is now `update --value-json`. `--json` selects the output format on every command. The old form is refused when the value looks like JSON, so an old script cannot store JSON as text.
- `archive`, `webhooks delete` and a `gql` mutation that removes something ask first. In a script, pass `--yes`.
- `docs` asks before it replaces a folder with files in it, and refuses the home folder.
- A command that changes data now reports `{ ok, dryRun, changed, summary }`. The `id` and `name` it used to report are still there.
- `MONDAY_API_KEY` now beats a saved sign-in. Before, the saved sign-in won.
- `activity --from` and `--to` take a day as YYYY-MM-DD, and `--to` includes that whole day.
- `MONDAY_API_URL` is now `MONDAY_BASE_URL`, without the `/v2`.
- The CLI no longer loads a `.env` file beside its install.
- Settings moved to `monday-cli/config.json` in your settings folder. Your token moves to the OS keychain at your next `monday login`. Until then the old file keeps working.

**Added**

- `monday doctor`, `monday logout`, `monday config path|show|set|unset`, and `monday auth`.
- `monday login` takes a personal API token through a local page or, with `--paste`, at the terminal. `--oauth` signs in through your own Monday app.
- `--read-only` and `--dry-run` on every command that changes data, including `gql` mutations.
- `--values`, `--value`, `--variables` and `--config` accept `@<file>` or `-`, because PowerShell breaks JSON typed on the command line.

**Fixed**

- An error from Monday no longer shows up as an empty list in `boards`, `items`, `search` and `activity`.
- `items` and `activity` report a board that does not exist.
- `items --column` without `--value` is refused. It used to return every item.
- `activity --limit` above 500 now returns that many entries.
- `items --status` works. Monday matches a status by its number and returned nothing for its text, so the CLI now converts the text and names the valid statuses when one does not exist.
- `move --to-board` no longer fails on a wrong variable type.
- A spent complexity budget waits the time Monday asks for, then retries.
- Values reach Monday as GraphQL variables, so a quote in a value cannot break a query.

## 1.0.0

First version.
