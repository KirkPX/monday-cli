# monday-cli

[![CI](https://github.com/KirkPX/monday-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/KirkPX/monday-cli/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Query and manage Monday.com boards, items and activity from the terminal.

Runs on macOS, Windows and Linux. Output is readable at a terminal and JSON in a pipe,
every write can be previewed or blocked, and your token stays in the OS keychain.

This is not the `monday-cli` package on npm, or a product of monday.com.

## Install

You need **Node.js 22.18, 24.11 or newer** and Git.

```bash
cd ~
git clone https://github.com/KirkPX/monday-cli.git
cd monday-cli
npm run setup
monday login
```

`cd ~` puts the tool in your home folder. A PowerShell window can open in a system folder,
where the clone would fail or be hard to find. To update later:

```bash
cd ~/monday-cli
git pull
npm run setup
```

`npm run setup` installs, builds, links, and then tells you where you stand. If the
`monday` command is not reachable yet, it says so and prints the fix.

On Windows, install Node and Git with `winget install OpenJS.NodeJS.LTS Git.Git`, then use
a **new** PowerShell window, because an open window keeps the old PATH. You need no compiler.

## Sign in

Monday gives programs two ways in. Most people want a personal API token: in Monday, open your
profile picture, then **Developers**, then **My access tokens**, and copy it.

```bash
monday login            # opens a local page in your browser, where you paste the token
monday login --paste    # no browser: SSH, a server, a locked-down desktop
monday login --oauth    # through a Monday app of your own
monday logout
```

A personal token can do what you can do in Monday. To limit what the CLI can do, or to
give it scopes your token lacks, use your own app. [docs/auth.md](docs/auth.md) has the setup.

Running `monday` with no arguments signs you in if you never have, and shows help
otherwise.

For CI and agents, where no keychain exists, set the token in the environment:

```bash
export MONDAY_API_KEY=<your-token>
```

```powershell
$env:MONDAY_API_KEY = "<your-token>"
```

## Configure

Highest wins:

1. Command flags
2. Environment variables (`MONDAY_API_KEY`, `MONDAY_BASE_URL`, `MONDAY_ACCOUNT`)
3. The settings file, and the keychain for the token
4. Built-in defaults (base URL `https://api.monday.com`)

```bash
monday config path    # where the settings file lives
monday config show    # check the file and print it
monday config set readOnly true    # change one setting
monday config unset readOnly       # remove it
```

See [docs/configuration.md](docs/configuration.md) and [examples/config.json](examples/config.json).

## First command

```bash
monday me                # human-readable in a terminal
monday me --json         # machine-readable
monday boards > boards.json   # JSON when redirected, with no flag
```

## Commands

| Command | What it does |
|---|---|
| `monday me` | Show who is signed in |
| `monday complexity` | Show the API budget left this minute |
| `monday boards [--workspace ID] [--search TEXT]` | List boards |
| `monday inspect BOARD` | Show a board's columns, groups and views |
| `monday items BOARD [--limit N] [--status X] [--column ID --value X]` | List items |
| `monday search TEXT [--board-id ID] [--workspace ID] [--limit N]` | Find text across boards |
| `monday activity BOARD [--limit N] [--user ID] [--column ID] [--group ID] [--item ID] [--from DAY] [--to DAY]` | Read a board's activity log |
| `monday gql [QUERY] [--file PATH] [--variables JSON] [--api-version V]` | Run raw GraphQL |
| `monday docs [--output DIR]` | Save Monday docs as Markdown |
| `monday create BOARD NAME [--group ID] [--values JSON]` | Create an item |
| `monday update BOARD ITEM --col ID --value X [--value-json]` | Change a column |
| `monday move ITEM --to-group ID`, or `--to-board ID --group ID` | Move an item |
| `monday archive ITEM` | Archive an item |
| `monday webhooks list\|create\|delete` | Manage webhooks |

`gql` reaches everything else in Monday's API. [docs/api/public-api.md](docs/api/public-api.md) lists it.

An option that takes JSON also takes `@<file>`, or `-` for standard input. Use a file in
PowerShell, which strips the quotes inside JSON typed on the command line:

```powershell
'{"label":"Done"}' | Set-Content value.json
monday update 123 456 --col status --value "@value.json" --value-json
```

## Output

Every command prints **human-readable** output in a terminal and **JSON** when the output
is piped or redirected, or when you pass `--json`. A command that fails leaves stdout
empty and prints the reason on stderr.

## Safety

Commands that change data:

- refuse to run in read-only mode (`--read-only`, `MONDAY_READ_ONLY=1`, or `"readOnly": true` in the settings file)
- support `--dry-run` to preview without changing anything

Commands that remove something (`archive`, `webhooks delete`, a `gql` mutation that deletes) also
ask for confirmation, or take `--yes` to skip the question. They never ask in `--json` or
non-interactive mode: pass `--yes`.

## Troubleshooting

```bash
monday doctor            # install, settings file, credential store, token
npm run doctor           # the same check, when the command itself is not found
```

- **"Not signed in"**: run `monday login`, or set `MONDAY_API_KEY`.
- **"Monday refused the token"**: copy the token again, or run `monday login --force`.
- **"Invalid settings"**: the settings file has a typo or an unknown key. The message names it.
- **A list comes back empty, and you expected rows**: your token may lack the scope. An empty list from Monday does not prove nothing is there.
- **`monday on PATH: shadowed`**: another program of the same name comes first on your PATH.
- **"running scripts is disabled on this system"** (PowerShell): the execution policy blocks npm's `.ps1` launcher. Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Uninstall

```bash
monday logout            # removes the stored token; run this first
npm uninstall -g monday-cli
```

The settings file stays. `monday config path` shows where it is, before you uninstall.

## Develop

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE). To report a security problem, see [SECURITY.md](SECURITY.md).
