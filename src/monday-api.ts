// The GraphQL documents this CLI sends. Each function takes a client, so timeout, retry
// and errors stay in client.ts. Values always travel as GraphQL variables, never inside
// the document text, so a quote in a value cannot change what the query means.

import type { ApiClient } from "./client.js";
import { UsageError } from "./errors.js";

export type Complexity = {
  before: number;
  query: number;
  after: number;
  reset_in_x_seconds: number;
};

export type ColumnFilter = { column_id: string; compare_value: Array<string | number> };

const PAGE_SIZE = 100;
const MAX_BOARD_PAGES = 50;
const MAX_ITEMS_PER_REQUEST = 500;
const MAX_LOGS_PER_REQUEST = 500;

const ITEM_FIELDS = `
  id name
  group { id title }
  column_values { id type text value }
  subitems {
    id name
    column_values { id type text value }
  }
`;

// ── Reads ─────────────────────────────────────────────────────────────────────

export function getMe(client: ApiClient) {
  return client.query<{ me: any }>(
    `query {
      me {
        id name email title photo_thumb_small is_admin is_guest
        account { id name }
      }
    }`,
    undefined,
    { operation: "read the signed-in user" }
  );
}

export async function getComplexity(client: ApiClient): Promise<Complexity> {
  const data = await client.query<{ complexity: Complexity }>(
    `query {
      complexity { before query after reset_in_x_seconds }
      boards(limit: 1) { id }
    }`,
    undefined,
    { operation: "read the complexity budget" }
  );
  return data.complexity;
}

export async function getBoards(
  client: ApiClient,
  opts: { workspaceId?: string; search?: string } = {}
): Promise<any[]> {
  const all: any[] = [];
  for (let page = 1; page <= MAX_BOARD_PAGES; page++) {
    const { boards } = await client.query<{ boards: any[] }>(
      `query ($limit: Int!, $page: Int!) {
        boards(limit: $limit, page: $page, state: active) {
          id name description board_kind board_folder_id
          workspace_id items_count updated_at
          workspace { id name kind }
          columns { id title type }
          groups { id title color }
        }
      }`,
      { limit: PAGE_SIZE, page },
      { operation: "list boards" }
    );
    all.push(...boards);
    if (boards.length < PAGE_SIZE) break;
  }

  // Monday's boards query has no name filter, and this CLI reads every page anyway.
  let filtered = all;
  if (opts.workspaceId) {
    filtered = filtered.filter((b) => String(b.workspace_id) === opts.workspaceId);
  }
  if (opts.search) {
    const term = opts.search.toLowerCase();
    filtered = filtered.filter((b) => String(b.name).toLowerCase().includes(term));
  }
  return filtered;
}

export async function getBoardStructure(client: ApiClient, boardId: string): Promise<any | undefined> {
  const { boards } = await client.query<{ boards: any[] }>(
    `query ($board_id: ID!) {
      boards(ids: [$board_id]) {
        id name description board_kind items_count
        workspace { id name }
        columns { id title type settings_str description }
        groups { id title color position }
        views { id name type }
      }
    }`,
    { board_id: boardId },
    { operation: `read board ${boardId}` }
  );
  return boards[0];
}

export async function getItems(
  client: ApiClient,
  boardId: string,
  opts: { limit?: number; columnFilters?: ColumnFilter[] } = {}
): Promise<{ items: any[]; board: any | undefined }> {
  const limit = opts.limit ?? PAGE_SIZE;
  const operation = `list items on board ${boardId}`;
  const params = opts.columnFilters?.length
    ? { rules: await resolveFilters(client, boardId, opts.columnFilters), operator: "and" }
    : undefined;

  const { boards } = await client.query<{ boards: any[] }>(
    `query ($board_id: ID!, $limit: Int!, $params: ItemsQuery) {
      boards(ids: [$board_id]) {
        id name
        workspace { id name }
        items_page(limit: $limit, query_params: $params) {
          cursor
          items { ${ITEM_FIELDS} }
        }
      }
    }`,
    { board_id: boardId, limit: Math.min(limit, MAX_ITEMS_PER_REQUEST), params },
    { operation }
  );

  const board = boards[0];
  const firstPage = board?.items_page;
  if (!firstPage) return { items: [], board };

  const items: any[] = [...firstPage.items];
  let cursor: string | null = firstPage.cursor;
  while (cursor && items.length < limit) {
    const { next_items_page: page } = await client.query<{ next_items_page: any }>(
      `query ($limit: Int!, $cursor: String!) {
        next_items_page(limit: $limit, cursor: $cursor) {
          cursor
          items { ${ITEM_FIELDS} }
        }
      }`,
      { limit: Math.min(limit - items.length, MAX_ITEMS_PER_REQUEST), cursor },
      { operation }
    );
    if (!page?.items?.length) break;
    items.push(...page.items);
    cursor = page.cursor;
  }

  return { items, board };
}

/**
 * Monday matches a status column by its label's number. Given the label's text, it
 * returns no items and no error, so text is turned into the number here.
 */
async function resolveFilters(
  client: ApiClient,
  boardId: string,
  filters: ColumnFilter[]
): Promise<ColumnFilter[]> {
  const { boards } = await client.query<{ boards: any[] }>(
    `query ($board_id: ID!, $ids: [String!]) {
      boards(ids: [$board_id]) {
        columns(ids: $ids) { id type settings_str }
      }
    }`,
    { board_id: boardId, ids: [...new Set(filters.map((f) => f.column_id))] },
    { operation: `read the columns of board ${boardId}` }
  );
  // An unknown board is reported by the caller, with its own message.
  if (!boards[0]) return filters;

  const columns = new Map<string, any>(boards[0].columns.map((c: any) => [c.id, c]));
  return filters.map((filter) => {
    const column = columns.get(filter.column_id);
    if (!column) {
      throw new UsageError(
        `Board ${boardId} has no column with the ID "${filter.column_id}".`,
        `\`monday inspect ${boardId}\` lists the column IDs.`
      );
    }
    if (column.type !== "status") return filter;
    return { ...filter, compare_value: filter.compare_value.map((v) => statusIndex(column, String(v))) };
  });
}

function statusIndex(column: any, value: string): number {
  const labels: Record<string, string> = JSON.parse(column.settings_str || "{}").labels ?? {};
  const entry = Object.entries(labels).find(([, label]) => label.toLowerCase() === value.toLowerCase());
  if (entry) return Number(entry[0]);
  if (Object.hasOwn(labels, value)) return Number(value);
  throw new UsageError(
    `Column ${column.id} has no status "${value}".`,
    `Its statuses: ${Object.values(labels).filter(Boolean).join(", ")}.`
  );
}

export type ActivityFilters = {
  limit?: number;
  userId?: string;
  columnId?: string;
  groupId?: string;
  itemId?: string;
  /** YYYY-MM-DD. The whole of this day is included. */
  from?: string;
  /** YYYY-MM-DD. The whole of this day is included. */
  to?: string;
};

export async function getActivityLogs(
  client: ApiClient,
  boardId: string,
  opts: ActivityFilters = {}
): Promise<{ board: any | undefined; logs: any[] }> {
  const limit = opts.limit ?? PAGE_SIZE;
  const logs: any[] = [];
  let board: any | undefined;

  // Monday finds a page by page number times page size, so the size must not
  // change between pages. A smaller last page would repeat entries.
  const pageSize = Math.min(limit, MAX_LOGS_PER_REQUEST);
  for (let page = 1; logs.length < limit; page++) {
    const { boards } = await client.query<{ boards: any[] }>(
      `query (
        $board_id: ID!, $limit: Int!, $page: Int!,
        $user_ids: [ID!], $column_ids: [String], $group_ids: [String], $item_ids: [ID!],
        $from: ISO8601DateTime, $to: ISO8601DateTime
      ) {
        boards(ids: [$board_id]) {
          id name
          activity_logs(
            limit: $limit, page: $page,
            user_ids: $user_ids, column_ids: $column_ids, group_ids: $group_ids, item_ids: $item_ids,
            from: $from, to: $to
          ) {
            id event data entity user_id created_at account_id
          }
        }
      }`,
      {
        board_id: boardId,
        limit: pageSize,
        page,
        user_ids: opts.userId ? [opts.userId] : undefined,
        column_ids: opts.columnId ? [opts.columnId] : undefined,
        group_ids: opts.groupId ? [opts.groupId] : undefined,
        item_ids: opts.itemId ? [opts.itemId] : undefined,
        from: opts.from ? `${opts.from}T00:00:00Z` : undefined,
        to: opts.to ? `${opts.to}T23:59:59Z` : undefined,
      },
      { operation: `read the activity log of board ${boardId}` }
    );
    board = boards[0];
    const batch: any[] = board?.activity_logs ?? [];
    logs.push(...batch);
    if (batch.length < pageSize) break;
  }

  return { board, logs: logs.slice(0, limit) };
}

export async function getAllDocs(client: ApiClient): Promise<any[]> {
  const { docs } = await client.query<{ docs: any[] }>(
    `query {
      docs(limit: 500) {
        id name doc_kind workspace_id doc_folder_id created_at
        created_by { id name email }
        workspace { id name }
        blocks { id type content position parent_block_id }
      }
    }`,
    undefined,
    { operation: "list documents" }
  );
  return docs;
}

export async function getAllFolders(client: ApiClient): Promise<any[]> {
  const all: any[] = [];
  for (let page = 1; ; page++) {
    const { folders } = await client.query<{ folders: any[] }>(
      `query ($limit: Int!, $page: Int!) {
        folders(limit: $limit, page: $page) {
          id name
          workspace { id name }
        }
      }`,
      { limit: PAGE_SIZE, page },
      { operation: "list folders" }
    );
    all.push(...folders);
    if (folders.length < PAGE_SIZE) return all;
  }
}

export async function getWebhooks(client: ApiClient, boardId: string): Promise<any[]> {
  const { webhooks } = await client.query<{ webhooks: any[] }>(
    `query ($board_id: ID!) {
      webhooks(board_id: $board_id) {
        id event board_id config
      }
    }`,
    { board_id: boardId },
    { operation: `list webhooks on board ${boardId}` }
  );
  return webhooks;
}

// ── Changes ───────────────────────────────────────────────────────────────────

export async function createItem(
  client: ApiClient,
  boardId: string,
  itemName: string,
  opts: { groupId?: string; columnValues?: unknown } = {}
): Promise<any> {
  const { create_item } = await client.query<{ create_item: any }>(
    `mutation ($board_id: ID!, $item_name: String!, $column_values: JSON!, $group_id: String) {
      create_item(
        board_id: $board_id
        item_name: $item_name
        column_values: $column_values
        group_id: $group_id
      ) {
        id name
      }
    }`,
    {
      board_id: boardId,
      item_name: itemName,
      column_values: JSON.stringify(opts.columnValues ?? {}),
      group_id: opts.groupId,
    },
    { operation: `create an item on board ${boardId}` }
  );
  return create_item;
}

export async function updateColumnValue(
  client: ApiClient,
  boardId: string,
  itemId: string,
  columnId: string,
  value: string
): Promise<any> {
  const { change_simple_column_value } = await client.query<{ change_simple_column_value: any }>(
    `mutation ($board_id: ID!, $item_id: ID!, $column_id: String!, $value: String!) {
      change_simple_column_value(
        board_id: $board_id
        item_id: $item_id
        column_id: $column_id
        value: $value
      ) {
        id name
      }
    }`,
    { board_id: boardId, item_id: itemId, column_id: columnId, value },
    { operation: `update item ${itemId}` }
  );
  return change_simple_column_value;
}

export async function changeColumnValueJson(
  client: ApiClient,
  boardId: string,
  itemId: string,
  columnId: string,
  value: unknown
): Promise<any> {
  const { change_column_value } = await client.query<{ change_column_value: any }>(
    `mutation ($board_id: ID!, $item_id: ID!, $column_id: String!, $value: JSON!) {
      change_column_value(
        board_id: $board_id
        item_id: $item_id
        column_id: $column_id
        value: $value
      ) {
        id name
      }
    }`,
    { board_id: boardId, item_id: itemId, column_id: columnId, value: JSON.stringify(value) },
    { operation: `update item ${itemId}` }
  );
  return change_column_value;
}

export async function moveItemToGroup(client: ApiClient, itemId: string, groupId: string): Promise<any> {
  const { move_item_to_group } = await client.query<{ move_item_to_group: any }>(
    `mutation ($item_id: ID!, $group_id: String!) {
      move_item_to_group(item_id: $item_id, group_id: $group_id) {
        id name
      }
    }`,
    { item_id: itemId, group_id: groupId },
    { operation: `move item ${itemId}` }
  );
  return move_item_to_group;
}

export async function moveItemToBoard(
  client: ApiClient,
  itemId: string,
  boardId: string,
  groupId: string
): Promise<any> {
  const { move_item_to_board } = await client.query<{ move_item_to_board: any }>(
    `mutation ($item_id: ID!, $board_id: ID!, $group_id: ID!) {
      move_item_to_board(item_id: $item_id, board_id: $board_id, group_id: $group_id) {
        id name
      }
    }`,
    { item_id: itemId, board_id: boardId, group_id: groupId },
    { operation: `move item ${itemId}` }
  );
  return move_item_to_board;
}

export async function archiveItem(client: ApiClient, itemId: string): Promise<any> {
  const { archive_item } = await client.query<{ archive_item: any }>(
    `mutation ($item_id: ID!) {
      archive_item(item_id: $item_id) {
        id name
      }
    }`,
    { item_id: itemId },
    { operation: `archive item ${itemId}` }
  );
  return archive_item;
}

export async function createWebhook(
  client: ApiClient,
  boardId: string,
  url: string,
  event: string,
  config?: unknown
): Promise<any> {
  const { create_webhook } = await client.query<{ create_webhook: any }>(
    `mutation ($board_id: ID!, $url: String!, $event: WebhookEventType!, $config: JSON) {
      create_webhook(board_id: $board_id, url: $url, event: $event, config: $config) {
        id
      }
    }`,
    {
      board_id: boardId,
      url,
      event,
      config: config === undefined ? undefined : JSON.stringify(config),
    },
    { operation: `create a webhook on board ${boardId}` }
  );
  return create_webhook;
}

export async function deleteWebhook(client: ApiClient, webhookId: string): Promise<any> {
  const { delete_webhook } = await client.query<{ delete_webhook: any }>(
    `mutation ($id: ID!) {
      delete_webhook(id: $id) {
        id
      }
    }`,
    { id: webhookId },
    { operation: `delete webhook ${webhookId}` }
  );
  return delete_webhook;
}
