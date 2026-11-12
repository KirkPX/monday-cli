#!/usr/bin/env node
import { Command, Option } from "commander";
import { parseDate, parseId, parseLimit, parseUserId } from "./cli/parse.js";

// Exit cleanly when the reader closes the pipe early (`monday doctor | head -1`).
// Without this, the next write raises an uncaught EPIPE, and the CLI dies with a
// stack trace and a non-zero exit. Any other stream error still propagates.
for (const stream of [process.stdout, process.stderr]) {
  stream.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EPIPE") process.exit(0);
    throw err;
  });
}

const program = new Command();

// Commander's own errors (a missing option, an unknown command) follow the output
// contract too: one JSON object on stderr when the output is JSON. This is set
// before any subcommand is added, because each subcommand copies it when created.
program.configureOutput({
  outputError: (text, write) => {
    const json =
      process.argv.includes("--json") || (!process.argv.includes("--pretty") && !process.stdout.isTTY);
    if (!json) return write(text);
    const message = text.replace(/^error: /, "").trim();
    write(JSON.stringify({ error: true, message, hint: "Run the command with --help to see its options." }) + "\n");
  },
});

// --json is declared once, here on the root. Commander still accepts it after a
// subcommand (`monday me --json`), and each action merges
// `program.opts()` so the value reaches the handler. Declaring it again on a
// subcommand would bind each copy to its own command, and the handler would read
// whichever object is empty.
program
  .name("monday")
  .description("Query and manage Monday.com boards, items and activity from the terminal.")
  .version("2.0.1")
  .option("--json", "emit machine-readable JSON")
  .option("--read-only", "refuse any command that would change remote data")
  .option("--verbose", "emit diagnostic details")
  // Before 2.0 JSON was the default even at a terminal, and this asked for text.
  .addOption(new Option("--pretty", "Print readable text, even in a pipe").hideHelp());

// Running `monday` bare should do the obvious thing: sign you in if you
// never have, and otherwise show what you can do.
program.action(async () => {
  const { isConfigured, loginCommand } = await import("./cli/commands/login.js");
  if (isConfigured()) {
    program.help();
    return;
  }
  const { reporter } = await import("./cli/output.js");
  reporter(program.opts()).note("Welcome to monday. Let's connect your account.\n");
  await loginCommand(program.opts());
});

program
  .command("login")
  .description("Sign in")
  .option("--paste", "Enter a personal API token in the terminal instead of a browser")
  .option("--oauth", "Sign in through your own Monday app (see docs/auth.md)")
  .option("--force", "Sign in again, even if already signed in")
  .option("--account <name>", "Named account (default: default)")
  // Forms from before 2.0, kept so existing scripts still run.
  .addOption(new Option("--token <token>", "Save this token").hideHelp())
  .addOption(new Option("--status", "Show the sign-in status").hideHelp())
  .action(async (opts) => {
    const { loginCommand } = await import("./cli/commands/login.js");
    await loginCommand({ ...program.opts(), ...opts });
  });

program
  .command("logout")
  .description("Sign out and clear the stored credential")
  .option("--account <name>", "Named account (default: default)")
  .action(async (opts) => {
    const { logoutCommand } = await import("./cli/commands/login.js");
    await logoutCommand({ ...program.opts(), ...opts });
  });

program
  .command("doctor")
  .description("Check the install, the settings file and the credential store")
  .option("--install", "Close with an install verdict (used by `npm run setup`)")
  .action(async (opts) => {
    const { doctorCommand } = await import("./cli/commands/doctor.js");
    await doctorCommand({ ...program.opts(), ...opts });
  });

const configCmd = program
  .command("config")
  .description("Inspect and change the settings file");

configCmd
  .command("path")
  .description("Print where the settings file lives")
  .action(async (opts) => {
    const { configPath } = await import("./cli/commands/config.js");
    await configPath({ ...program.opts(), ...opts });
  });

configCmd
  .command("show")
  .description("Validate the settings file and print it")
  .action(async (opts) => {
    const { configShow } = await import("./cli/commands/config.js");
    await configShow({ ...program.opts(), ...opts });
  });

configCmd
  .command("set <name> <value>")
  .description("Set one setting, for example `config set readOnly true`")
  .action(async (name: string, value: string, opts) => {
    const { configSet } = await import("./cli/commands/config.js");
    await configSet(name, value, { ...program.opts(), ...opts });
  });

configCmd
  .command("unset <name>")
  .description("Remove one setting")
  .action(async (name: string, opts) => {
    const { configUnset } = await import("./cli/commands/config.js");
    await configUnset(name, { ...program.opts(), ...opts });
  });

program
  .command("auth")
  .description("Manage the stored API key from a script")
  .option("--status", "Show current auth status (default)")
  .option("--login", "Store an API key")
  .option("--logout", "Clear the stored API key")
  .option("--api-key <key>", "API key to store")
  .option("--account <name>", "Named account (default: default)")
  .action(async (opts) => {
    const { authCommand } = await import("./cli/commands/auth.js");
    await authCommand({ ...program.opts(), ...opts });
  });

/** Adds the option that picks a saved sign-in. */
function withAccount(command: Command): Command {
  return command.option("--account <name>", "Named account (default: default)");
}

/** Adds the options every command that changes data takes. */
function withWriteOptions(command: Command): Command {
  return withAccount(command).option("--dry-run", "Show what would change, and change nothing");
}

withAccount(program.command("me").description("Show the signed-in user")).action(async (opts) => {
  const { meCommand } = await import("./cli/commands/me.js");
  await meCommand({ ...program.opts(), ...opts });
});

withAccount(program.command("complexity").description("Check the API complexity budget")).action(async (opts) => {
  const { complexityCommand } = await import("./cli/commands/complexity.js");
  await complexityCommand({ ...program.opts(), ...opts });
});

withAccount(
  program
    .command("boards")
    .description("List boards, or find them by name")
    .option("--workspace <id>", "Only boards in this workspace", parseId)
    .option("--search <term>", "Only boards whose name holds this text")
).action(async (opts) => {
  const { boardsCommand } = await import("./cli/commands/boards.js");
  await boardsCommand({ ...program.opts(), ...opts });
});

withAccount(
  program.command("inspect <board-id>").description("Show a board's columns, groups and views")
).action(async (boardId: string, opts) => {
  const { inspectCommand } = await import("./cli/commands/inspect.js");
  await inspectCommand(boardId, { ...program.opts(), ...opts });
});

withAccount(
  program
    .command("items <board-id>")
    .description("List the items on a board")
    .option("--limit <n>", "Most items to fetch", parseLimit, 100)
    .option("--status <value>", "Only items with this value in the status column")
    .option("--column <id>", "Filter on this column (use with --value)")
    .option("--value <text>", "Only items with this value (use with --column)")
).action(async (boardId: string, opts) => {
  const { itemsCommand } = await import("./cli/commands/items.js");
  await itemsCommand(boardId, { ...program.opts(), ...opts });
});

withWriteOptions(
  program
    .command("create <board-id> <name>")
    .description("Create an item on a board")
    .option("--group <id>", "Group to put it in")
    .option("--values <json>", "Column values as JSON, @<file>, or - for standard input")
).action(async (boardId: string, name: string, opts) => {
  const { createCommand } = await import("./cli/commands/create.js");
  await createCommand(boardId, name, { ...program.opts(), ...opts });
});

withWriteOptions(
  program
    .command("update <board-id> <item-id>")
    .description("Change one column value on an item")
    .requiredOption("--col <id>", "Column to change")
    .requiredOption("--value <text>", "New value. With --value-json: JSON, @<file>, or - for standard input")
    .option("--value-json", "Send the value as JSON, for complex column types")
).action(async (boardId: string, itemId: string, opts) => {
  const { updateCommand } = await import("./cli/commands/update.js");
  await updateCommand(boardId, itemId, { ...program.opts(), ...opts });
});

withWriteOptions(
  program
    .command("move <item-id>")
    .description("Move an item to another group or board")
    .option("--to-group <id>", "Group to move it to")
    .option("--to-board <id>", "Board to move it to")
    .option("--group <id>", "Group on that board (required with --to-board)")
).action(async (itemId: string, opts) => {
  const { moveCommand } = await import("./cli/commands/move.js");
  await moveCommand(itemId, { ...program.opts(), ...opts });
});

withWriteOptions(
  program
    .command("archive <item-id>")
    .description("Archive an item (destructive)")
    .option("--yes", "Do not ask for confirmation")
).action(async (itemId: string, opts) => {
  const { archiveCommand } = await import("./cli/commands/archive.js");
  await archiveCommand(itemId, { ...program.opts(), ...opts });
});

withAccount(
  program
    .command("search <term>")
    .description("Find text across boards: item names, column values and subitems")
    .option("--board-id <id>", "Search only this board", parseId)
    .option("--workspace <id>", "Search only this workspace", parseId)
    .option("--limit <n>", "Most items to read on each board", parseLimit, 500)
).action(async (term: string, opts) => {
  const { searchCommand } = await import("./cli/commands/search.js");
  await searchCommand(term, { ...program.opts(), ...opts });
});

withAccount(
  program
    .command("activity <board-id>")
    .description("Show a board's activity log: who changed what, and when")
    .option("--limit <n>", "Most entries to fetch", parseLimit, 100)
    .option("--user <id>", "Only this user (-4 is Monday's automations)", parseUserId)
    .option("--column <id>", "Only this column")
    .option("--group <id>", "Only this group")
    .option("--item <id>", "Only this item", parseId)
    .option("--from <date>", "From this day, as YYYY-MM-DD", parseDate)
    .option("--to <date>", "To the end of this day, as YYYY-MM-DD", parseDate)
).action(async (boardId: string, opts) => {
  const { activityCommand } = await import("./cli/commands/activity.js");
  await activityCommand(boardId, { ...program.opts(), ...opts });
});

withWriteOptions(
  program
    .command("gql [query]")
    .description("Run raw GraphQL, for anything the other commands do not cover (destructive when the mutation removes something)")
    .option("--file <path>", "Read the query from a file, or - for standard input")
    .option("--variables <json>", "Variables as JSON, @<file>, or - for standard input")
    .option("--api-version <version>", "Ask for one API version. An expired one silently returns far fewer fields")
    .option("--yes", "Do not ask for confirmation")
).action(async (query: string | undefined, opts) => {
  const { gqlCommand } = await import("./cli/commands/gql.js");
  await gqlCommand(query, { ...program.opts(), ...opts });
});

withAccount(
  program
    .command("docs")
    .description("Save Monday docs as Markdown (destructive: replaces the output folder)")
    .option("--output <dir>", "Folder to fill (default: ./monday_docs)")
    .option("--yes", "Do not ask before replacing the folder")
).action(async (opts) => {
  const { docsCommand } = await import("./cli/commands/docs.js");
  await docsCommand({ ...program.opts(), ...opts });
});

withWriteOptions(
  program
    .command("webhooks <action>")
    .description("List, create or delete webhooks (destructive: delete)")
    .option("--board-id <id>", "Board (for list and create)", parseId)
    .option("--url <url>", "Callback address (for create)")
    .option("--event <type>", "Event type (for create)")
    .option("--config <json>", "Webhook config as JSON, @<file>, or - (for create)")
    .option("--id <id>", "Webhook (for delete)", parseId)
    .option("--yes", "Do not ask for confirmation")
).action(async (action: string, opts) => {
  const { webhooksCommand } = await import("./cli/commands/webhooks.js");
  await webhooksCommand(action, { ...program.opts(), ...opts });
});

program.parseAsync(process.argv).catch(async (error: unknown) => {
  const { resolveFormat } = await import("./cli/output.js");
  const { InterruptedError, safeErrorMessage } = await import("./errors.js");

  // Ctrl-C at a prompt: a person is at the terminal and knows why it stopped.
  if (error instanceof InterruptedError) {
    console.error(error.message);
    process.exitCode = 130;
    return;
  }

  const raw = error instanceof Error ? error.message : String(error);
  const message = safeErrorMessage(raw);
  // Login and config failures carry a next step. Printing the cause without it
  // leaves the user guessing.
  const rawHint = (error as { hint?: unknown })?.hint;
  const hint = typeof rawHint === "string" && rawHint ? rawHint : undefined;

  // --verbose adds the stack. In json it goes INSIDE the envelope, not as a
  // second stderr write, so stderr stays parseable as one object.
  const verbose = Boolean(program.opts().verbose);
  const stack = verbose && error instanceof Error ? error.stack : undefined;

  if (resolveFormat(program.opts()) === "json") {
    console.error(
      JSON.stringify({
        error: true,
        message,
        ...(hint ? { hint } : {}),
        ...(stack ? { stack: safeErrorMessage(stack) } : {}),
      })
    );
  } else {
    console.error(`Error: ${message}`);
    if (hint) console.error(hint);
    if (stack) console.error(safeErrorMessage(stack));
  }

  // exitCode, not process.exit: exit() can cut off output still buffered for a pipe.
  process.exitCode = 1;
});
