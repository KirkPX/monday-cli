# Configuration

Most people need no configuration: `monday login` stores your key. The settings
file is for behavior you want every time.

## Where it lives

Run `monday config path` to see it.

| Platform | Location |
|---|---|
| macOS, Linux | `$XDG_CONFIG_HOME/monday-cli/config.json`, or `~/.config/monday-cli/config.json` |
| Windows | `%APPDATA%\monday-cli\config.json` |

`MONDAY_CLI_CONFIG_FILE` points the CLI at another file. Use it to keep one
file per environment, or to commit a shared file to a team's own repo.

## Precedence

Highest first: command flags, environment variables, the settings file (and the
keychain for the key), defaults.

## Settings

See [examples/config.json](../examples/config.json) for a full file.

| Key | Type | Default | What it does |
|---|---|---|---|
| `baseUrl` | URL | `https://api.monday.com` | The API to call. |
| `account` | string | `default` | Which saved key to use. |
| `readOnly` | boolean | `false` | Refuse every command that changes data. |
| `timeoutMs` | integer, up to 600000 | `600000` | How long to wait for each request. Monday can take minutes to answer a query across a whole account. |
| `oauthClientId` | string | none | Your Monday app's client ID, for `monday login --oauth`. |
| `oauthPort` | integer | `19837` | The port in your app's redirect address, if you registered a different one. |

The file never holds your API key.

Change a setting with a command, so you never edit or copy the file by hand:

```bash
monday config set readOnly true
monday config unset readOnly
```

## Validation

`monday config show` checks the file and prints it. Every command that reads the
file checks it first, and stops with the reason if it is wrong. It stops on an
unknown key too: if `readonly` were ignored as a typo, commands would write when you
meant to block them. `monday doctor` reports a bad file without stopping.

A missing file is fine. It means no settings.

## Read-only mode

The `--read-only` flag always turns it on. `MONDAY_READ_ONLY` beats the settings
file in both directions, so `MONDAY_READ_ONLY=0` lets one run write when the file
says `"readOnly": true`.

## Where the key is stored

`monday login` tries the OS keychain first, and reads the key back to confirm it
was saved. When the keychain is closed, the key goes to `credentials.json` in the same
folder as the settings file. Only you can read that file on macOS and Linux. When that
file already exists and a new key goes to the keychain, the file is updated too, so
sessions that cannot reach the keychain do not keep using the old key.

| Variable | What it does |
|---|---|
| `MONDAY_API_KEY` | Use this key and store nothing. |
| `MONDAY_CLI_CREDENTIALS_FILE` | Keep the credentials file somewhere else. |
| `MONDAY_CLI_CREDENTIAL_STORE` | `file` always uses the file. `memory` keeps the key for one process only. |
