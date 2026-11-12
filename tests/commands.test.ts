// Each command driven through the built CLI against a fake server, so a test sees
// the wiring a person would hit: flags, guards, what goes to Monday, and what comes back.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Call } from "./fake-monday.js";
import { fakeMonday } from "./fake-monday.js";
import { runCli } from "./run-cli.js";

let dir: string;
let fake: Awaited<ReturnType<typeof fakeMonday>>;
let env: Record<string, string>;
let answer: (call: Call) => unknown;

beforeEach(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "monday cmd "));
  answer = () => ({});
  fake = await fakeMonday((call) => answer(call));
  env = { MONDAY_BASE_URL: fake.url, MONDAY_API_KEY: "good-token" };
});

afterEach(async () => {
  await fake.close();
  rmSync(dir, { recursive: true, force: true });
});

const ITEM = { id: "7", name: "Row" };

const WRITES: Array<[string, string[]]> = [
  ["create", ["create", "1", "Row"]],
  ["update", ["update", "1", "7", "--col", "text", "--value", "x"]],
  ["move", ["move", "7", "--to-group", "g"]],
  ["archive", ["archive", "7", "--yes"]],
  ["webhooks create", ["webhooks", "create", "--board-id", "1", "--url", "https://e.test", "--event", "create_item"]],
  ["webhooks delete", ["webhooks", "delete", "--id", "5", "--yes"]],
  ["gql mutation", ["gql", 'mutation { create_item(board_id: 1, item_name: "x") { id } }']],
];

describe("commands that change data", () => {
  it.each(WRITES)("%s refuses in read-only mode and sends nothing", async (_name, args) => {
    for (const run of [
      () => runCli(["--read-only", ...args], { env }),
      () => runCli(args, { env: { ...env, MONDAY_READ_ONLY: "1" } }),
    ]) {
      const { code, stderr } = await run();
      expect(code).toBe(1);
      expect(JSON.parse(stderr).message).toContain("Read-only");
    }
    expect(fake.calls).toEqual([]);
  });

  it.each(WRITES)("%s --dry-run reports and sends nothing", async (_name, args) => {
    const { code, stdout } = await runCli([...args, "--dry-run"], { env });
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({ dryRun: true, changed: false });
    expect(fake.calls).toEqual([]);
  });

  it("reports a change, and keeps id and name at the top level", async () => {
    answer = () => ({ create_item: ITEM });
    const { stdout } = await runCli(["create", "1", 'Say "hi"', "--values", '{"a":1}'], { env });
    expect(JSON.parse(stdout)).toMatchObject({ ok: true, dryRun: false, changed: true, id: "7", name: "Row" });
    expect(fake.calls[0]!.variables).toMatchObject({ item_name: 'Say "hi"', column_values: '{"a":1}' });
  });

  it.each([
    ["archive", ["archive", "7"]],
    ["webhooks delete", ["webhooks", "delete", "--id", "5"]],
    ["a destructive gql mutation", ["gql", "mutation { delete_item(item_id: 1) { id } }"]],
    ["a bulk removal through gql", ["gql", "mutation { bulk_delete_items(board_id: 1, item_ids: [2]) { id } }"]],
  ])("%s needs --yes when nobody can answer", async (_name, args) => {
    const { code, stdout } = await runCli(args, { env });
    expect(code).toBe(1);
    expect(JSON.parse(stdout)).toMatchObject({ aborted: true, changed: false, hint: expect.stringContaining("--yes") });
    expect(fake.calls).toEqual([]);
  });

  it("archive --yes archives", async () => {
    answer = () => ({ archive_item: ITEM });
    const { code, stdout } = await runCli(["archive", "7", "--yes"], { env });
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({ changed: true, id: "7" });
  });

  it("move --to-board needs --group", async () => {
    const { code, stderr } = await runCli(["move", "7", "--to-board", "2"], { env });
    expect(code).toBe(1);
    expect(JSON.parse(stderr).message).toContain("--group");
  });
});

describe("update", () => {
  it("sends plain text with no flag", async () => {
    answer = () => ({ change_simple_column_value: ITEM });
    await runCli(["update", "1", "7", "--col", "text", "--value", "hello"], { env });
    expect(fake.calls[0]!.query).toContain("change_simple_column_value");
  });

  it("will not store JSON as text for a script that used the old --json", async () => {
    const { code, stderr } = await runCli(["update", "1", "7", "--col", "s", "--value", '{"label":"Done"}', "--json"], { env });
    expect(code).toBe(1);
    expect(JSON.parse(stderr).hint).toContain("--value-json");
    expect(fake.calls).toEqual([]);
  });

  it.each(['"Done"', "null"])("will not store %s as text for a script that used the old --json", async (value) => {
    const { code } = await runCli(["update", "1", "7", "--col", "s", "--value", value, "--json"], { env });
    expect(code).toBe(1);
    expect(fake.calls).toEqual([]);
  });

  it("--value-json reads a file at a path with spaces and non-English characters", async () => {
    const folder = path.join(dir, "datos de prueba ñ 日本");
    mkdirSync(folder);
    const file = path.join(folder, "valor.json");
    // A byte-order mark, as Windows PowerShell can write.
    writeFileSync(file, '﻿{"label":"Done"}', "utf-8");
    answer = () => ({ change_column_value: ITEM });
    const { code } = await runCli(["update", "1", "7", "--col", "s", "--value", `@${file}`, "--value-json"], { env });
    expect(code).toBe(0);
    expect(fake.calls[0]!.variables.value).toBe('{"label":"Done"}');
  });

  it("a bad JSON value names the option", async () => {
    const { code, stderr } = await runCli(["update", "1", "7", "--col", "s", "--value", "{nope", "--value-json"], { env });
    expect(code).toBe(1);
    expect(JSON.parse(stderr).message).toBe("--value is not valid JSON.");
  });
});

describe("reads", () => {
  const boards = [
    { id: "1", name: "Alpha", workspace_id: "10", items_count: 2, columns: [], groups: [] },
    { id: "2", name: "Beta", workspace_id: "20", items_count: 0, columns: [], groups: [] },
  ];

  it("boards filters by workspace and by name", async () => {
    answer = () => ({ boards });
    expect(JSON.parse((await runCli(["boards", "--workspace", "20"], { env })).stdout).map((b: any) => b.id)).toEqual(["2"]);
    expect(JSON.parse((await runCli(["boards", "--search", "alp"], { env })).stdout).map((b: any) => b.id)).toEqual(["1"]);
  });

  it("an error from Monday is reported, not shown as an empty list", async () => {
    answer = () => ({ status: 200, body: { errors: [{ message: "No access" }] } });
    const { code, stdout, stderr } = await runCli(["boards"], { env });
    expect(code).toBe(1);
    expect(stdout).toBe("");
    expect(JSON.parse(stderr).message).toBe("list boards failed: No access");
  });

  const columns = [
    { id: "status", type: "status", settings_str: '{"labels":{"0":"Working","1":"Done"}}' },
    { id: 'co"l', type: "text", settings_str: "{}" },
  ];
  const withColumns = (call: Call) =>
    call.query.includes("columns(ids")
      ? { boards: [{ columns: columns.filter((c) => call.variables.ids.includes(c.id)) }] }
      : { boards: [{ id: "1", name: "A", items_page: { cursor: null, items: [] } }] };

  it("items sends a value with a quote as data, and a status as its number", async () => {
    answer = withColumns;
    const value = 'say "hi"';
    const { code } = await runCli(["items", "1", "--column", 'co"l', "--value", value, "--status", "done"], { env });
    expect(code).toBe(0);
    const call = fake.calls.find((c) => c.query.includes("items_page"))!;
    expect(call.query).not.toContain("hi");
    expect(call.variables.params.rules).toEqual([
      { column_id: "status", compare_value: [1] },
      { column_id: 'co"l', compare_value: [value] },
    ]);
  });

  it("items names the statuses when one does not exist", async () => {
    answer = withColumns;
    const { code, stderr } = await runCli(["items", "1", "--status", "Nope"], { env });
    expect(code).toBe(1);
    expect(JSON.parse(stderr).hint).toContain("Working, Done");
  });

  it("items names a column that does not exist", async () => {
    answer = withColumns;
    const { code, stderr } = await runCli(["items", "1", "--column", "missing", "--value", "x"], { env });
    expect(code).toBe(1);
    expect(JSON.parse(stderr).message).toContain('no column with the ID "missing"');
  });

  it("items follows the cursor up to the limit", async () => {
    answer = (call) =>
      call.query.includes("next_items_page")
        ? { next_items_page: { cursor: null, items: [{ id: "2" }] } }
        : { boards: [{ id: "1", name: "A", items_page: { cursor: "c", items: [{ id: "1" }] } }] };
    const { stdout } = await runCli(["items", "1", "--limit", "2"], { env });
    expect(JSON.parse(stdout).items).toHaveLength(2);
    expect(fake.calls[1]!.variables).toEqual({ limit: 1, cursor: "c" });
  });

  it("items refuses half of a column filter, which used to return everything", async () => {
    const { code } = await runCli(["items", "1", "--column", "x"], { env });
    expect(code).toBe(1);
    expect(fake.calls).toEqual([]);
  });

  it.each([["inspect"], ["items"], ["activity"]])("%s says when a board does not exist", async (command) => {
    answer = () => ({ boards: [] });
    const { code, stderr } = await runCli([command!, "99"], { env });
    expect(code).toBe(1);
    expect(JSON.parse(stderr).message).toBe("Board 99 was not found.");
  });

  it("activity sends each filter, and includes the whole of the last day", async () => {
    answer = () => ({ boards: [{ id: "1", name: "A", activity_logs: [] }] });
    await runCli(
      ["activity", "1", "--user", "5", "--column", "c", "--group", "g", "--item", "6", "--from", "2026-03-01", "--to", "20260310"],
      { env }
    );
    expect(fake.calls[0]!.variables).toMatchObject({
      user_ids: ["5"],
      column_ids: ["c"],
      group_ids: ["g"],
      item_ids: ["6"],
      from: "2026-03-01T00:00:00Z",
      to: "2026-03-10T23:59:59Z",
    });
  });

  it("activity accepts -4, Monday's user ID for automations", async () => {
    answer = () => ({ boards: [{ id: "1", name: "A", activity_logs: [] }] });
    const { code } = await runCli(["activity", "1", "--user", "-4"], { env });
    expect(code).toBe(0);
    expect(fake.calls[0]!.variables.user_ids).toEqual(["-4"]);
  });

  it("activity reads more pages when the limit is above one request", async () => {
    answer = (call) => ({
      boards: [{
        id: "1",
        name: "A",
        activity_logs: Array.from({ length: call.variables.limit }, (_, i) => ({ id: String(i), data: "{}" })),
      }],
    });
    const { stdout } = await runCli(["activity", "1", "--limit", "700"], { env });
    expect(JSON.parse(stdout).activity_logs).toHaveLength(700);
    expect(fake.calls.map((c) => c.variables.page)).toEqual([1, 2]);
    // The size must stay the same across pages, or entries repeat.
    expect(fake.calls.map((c) => c.variables.limit)).toEqual([500, 500]);
  });

  it.each([
    [["items", "1", "--limit", "abc"], "--limit"],
    [["activity", "1", "--from", "March"], "--from"],
    [["boards", "--workspace", "x"], "--workspace"],
  ])("%j is refused before any request", async (args, flag) => {
    const { code, stderr } = await runCli(args, { env });
    expect(code).toBe(1);
    expect(stderr).toContain(flag);
    expect(fake.calls).toEqual([]);
  });

  it("search reports a board it could not read, and still searches the rest", async () => {
    const nonEmpty = boards.map((b) => ({ ...b, items_count: 1 }));
    answer = (call) => {
      if (call.query.includes("boards(limit")) return { boards: nonEmpty };
      if (call.variables.board_id === "1") {
        return { boards: [{ id: "1", name: "Alpha", items_page: { cursor: null, items: [{ id: "3", name: "needle" }] } }] };
      }
      return { status: 200, body: { errors: [{ message: "No access" }] } };
    };
    const { code, stdout, stderr } = await runCli(["search", "needle"], { env });
    expect(code).toBe(1);
    expect(JSON.parse(stdout)).toHaveLength(1);
    expect(stderr).toContain("Skipped board Beta");
  });

  it("--pretty from before 2.0 still gives text in a pipe, and is not in the help", async () => {
    const { stdout } = await runCli(["me", "--pretty"], { env });
    expect(stdout).toContain("User: Test User");
    expect((await runCli(["--help"], { env })).stdout).not.toContain("--pretty");
  });
});

describe("gql", () => {
  it("runs a read in read-only mode, with variables from a file", async () => {
    answer = () => ({ boards: [] });
    const file = path.join(dir, "vars with space.json");
    writeFileSync(file, '{"a":1}');
    const { code, stdout } = await runCli(
      ["--read-only", "gql", "query ($a: Int) { boards(limit: $a) { id } }", "--variables", `@${file}`],
      { env }
    );
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toEqual({ boards: [] });
    expect(fake.calls[0]!.variables).toEqual({ a: 1 });
  });

  it("reads the query from standard input", async () => {
    answer = () => ({ boards: [] });
    const { code } = await runCli(["gql", "--file", "-"], { env, input: "{ boards { id } }" });
    expect(code).toBe(0);
    expect(fake.calls[0]!.query).toBe("{ boards { id } }");
  });

  it("gives a partial answer on stdout, the errors on stderr, and exit 1", async () => {
    answer = () => ({ status: 200, body: { data: { boards: [] }, errors: [{ message: "part failed" }] } });
    const { code, stdout, stderr } = await runCli(["gql", "{ boards { id } }"], { env });
    expect(code).toBe(1);
    expect(JSON.parse(stdout)).toEqual({ boards: [] });
    expect(stderr).toContain("part failed");
  });

  it("an empty reply is an error, not null", async () => {
    answer = () => ({ status: 200, body: {} });
    const { code, stdout } = await runCli(["gql", "{ boards { id } }"], { env });
    expect(code).toBe(1);
    expect(stdout).toBe("");
  });

  it("an expired token inside a 200 reply gets the sign-in hint", async () => {
    answer = () => ({ status: 200, body: { errors: [{ message: "No", extensions: { code: "UNAUTHORIZED" } }] } });
    const { stderr } = await runCli(["gql", "{ boards { id } }"], { env });
    expect(JSON.parse(stderr).hint).toContain("monday login --force");
  });

  it("sends an API version only when asked", async () => {
    answer = () => ({ boards: [] });
    const { code } = await runCli(["gql", "{ boards { id } }", "--api-version", "2026-07"], { env });
    expect(code).toBe(0);
  });
});

describe("docs", () => {
  const docs = [{ id: "1", name: "Plan/One", workspace: { name: "W" }, blocks: [] }];
  beforeEach(() => {
    answer = (call) => (call.query.includes("folders(") ? { folders: [] } : { docs });
  });

  it("saves Markdown, with a safe file name", async () => {
    const out = path.join(dir, "salida ñ");
    const { code, stdout } = await runCli(["docs", "--output", out], { env });
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({ saved: 1, total: 1, failed: [] });
    expect(readFileSync(path.join(out, "W", "Uncategorized", "Plan-One.md"), "utf-8")).toContain("# Plan/One");
  });

  it("will not replace a folder with files in it unless told to", async () => {
    const out = path.join(dir, "existing");
    mkdirSync(out);
    const keep = path.join(out, "keep.txt");
    writeFileSync(keep, "x");

    const refused = await runCli(["docs", "--output", out], { env });
    expect(refused.code).toBe(1);
    expect(existsSync(keep)).toBe(true);
    expect(fake.calls).toEqual([]);

    expect((await runCli(["docs", "--output", out, "--yes"], { env })).code).toBe(0);
    expect(existsSync(keep)).toBe(false);
  });

  it("never empties the home folder, even with --yes", async () => {
    const { code, stderr } = await runCli(["docs", "--output", homedir(), "--yes"], { env });
    expect(code).toBe(1);
    expect(JSON.parse(stderr).message).toContain("Refusing");
  });

  it("carries on when the token cannot read folders", async () => {
    answer = (call) =>
      call.query.includes("folders(") ? { status: 200, body: { errors: [{ message: "no scope" }] } } : { docs };
    const { code, stderr } = await runCli(["docs", "--output", path.join(dir, "o")], { env });
    expect(code).toBe(0);
    expect(stderr).toContain("Could not read folders");
  });
});
