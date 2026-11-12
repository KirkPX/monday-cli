# Security policy

Report a vulnerability privately through
[GitHub's security advisory form](https://github.com/KirkPX/monday-cli/security/advisories/new).
Do not open a public issue. Only the latest release is supported.

## How the CLI handles your API key

- `monday login` saves the key to the OS keychain.
- Where the keychain is closed, such as over SSH on macOS, the key goes to a
  credentials file in the settings folder. On macOS and Linux only you can read
  that file (mode 600, in a folder with mode 700). On Windows it relies on your
  profile folder's permissions.
- `MONDAY_API_KEY` takes the key from the environment and stores nothing.
- Error messages and logs redact the key.
- The sign-in page listens on `127.0.0.1` only, and accepts a token only with a
  one-time value that it issues itself.
- `monday login --oauth` listens on `127.0.0.1` too, on the port registered with
  your Monday app, because Monday sends the browser only to a registered address.
  It accepts a sign-in only with a one-time value it issued, and it closes when the
  sign-in ends.
- Your Monday app's client secret is kept with the key, and never in the settings file.
- Versions before 2.0 kept the token in a private file, `~/.config/monday/config.json`.
  The CLI still reads it, so an update does not sign you out. `monday login` or
  `monday logout` removes it.

The settings file never holds a key.
