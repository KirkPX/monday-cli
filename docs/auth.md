# Signing in

Monday gives a program two ways in: a personal API token, and an app you register (OAuth).
`monday login` handles both. Monday's own Google and email sign-in work only in its website.

## Personal API token

In Monday, open your profile picture, then **Developers**, then **My access tokens**, and copy it.

```bash
monday login            # opens a local page where you paste it
monday login --paste    # types it at the terminal, with no echo
```

The CLI checks the token with Monday before it saves it. A personal token has your own access.

## A Monday app (OAuth)

Use this to choose the token's scopes, for example write access to boards.

One-time setup in Monday, under **Developers**, then **My Apps**, then your app, then
**Features**, then **OAuth & Permissions**:

1. Add `http://localhost:19837/callback` to **Redirect URLs**.
2. Enable the scopes you need, such as `boards:write`, `docs:write`, `webhooks:write` and the
   `*:read` scopes.

Then give the CLI the app's client ID and sign in:

```bash
monday config set oauthClientId <client-id>
monday login --oauth
```

The CLI asks once for the client secret and keeps it with your token. In CI, set
`MONDAY_CLIENT_SECRET` instead. If you registered a different port, run
`monday config set oauthPort <port>`.

Monday grants whatever scopes are enabled on the app. After you change them, run
`monday login --force` to get a new token.

## Where the token lives

`monday login` saves to the OS keychain, or to a private file where the keychain is closed,
as over SSH on macOS. `monday doctor` shows which. `monday logout` removes it.

Highest first: `MONDAY_API_KEY`, then the saved token.

Versions before 2.0 kept the token in `~/.config/monday/config.json`. The CLI still reads that
file, last of all, so an update does not sign you out. `monday login` or `monday logout`
removes it.

## Checking what a token can do

An OAuth token is a JWT. The `per` claim in its payload lists the scopes. A token without a
scope often gets an empty list from Monday, not an error, so an empty result does not prove
that nothing is there.
