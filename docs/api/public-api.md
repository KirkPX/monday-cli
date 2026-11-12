# Monday public GraphQL API — complete root surface

**Generated** by `scripts/gen-api-docs.mjs` from live introspection. Do not hand-edit; re-run
`node scripts/introspect.mjs <version>` then `node scripts/gen-api-docs.mjs`.

Endpoint `https://api.monday.com/v2`. Auth header is the bare token (**no** `Bearer` prefix),
read from `~/.config/monday/config.json` key **`access_token`**.

## Version is load-bearing — read this first

| Header sent | Version served | Query root fields |
|---|---|---|
| *(none)* | **2026-07** (current) | **96** |
| `API-Version: 2024-10` (expired) | 2025-04 (silent downgrade) | 48 |
| `API-Version: 2027-01` | 2027-01 (release candidate) | 102 |
| `API-Version: dev` | dev | 171 |

An **expired** version does not error — the server silently falls back to the oldest maintained
version and roughly halves the surface. **Send no header** unless you deliberately want a newer one.
Confirm with `query { version { kind value } }`.

| Version | Types | Query fields | Mutations |
|---|---|---|---|
| 2026-07 (current) | 1291 | 96 | 196 |
| 2027-01 (RC) | 1390 | 102 | 209 |
| dev (dev) | 1476 | 171 | 306 |

## Query root — 2026-07 (current, what you get by default)

| Field | Returns | CLI | Notes |
|---|---|---|---|
| `account` | `Account` | — | Get the connected account's information. |
| `account_connections(withAutomations: Boolean, withStateValidation: Boolean, page: Int, pageSize: Int, order: String, pagination: PaginationInput)` | `[Connection!]` | — | Returns all connections for the account. Requires admin privileges. |
| `account_roles` | `[AccountRole!]` | — | Get all roles for the account |
| `account_trigger_statistics(filters: AccountTriggerStatisticsFiltersInput)` | `AccountTriggerStatistics` | — | **UNUSABLE — board_id typed Int, overflows modern board IDs** |
| `account_triggers_statistics_by_entity_id(run_status: TriggerEventState!, filters: AccountTriggersByEntityIdFiltersInput)` | `AccountTriggersByEntityId` | — | **UNUSABLE — board_id typed Int** |
| `aggregate(query: AggregateQueryInput!)` | `AggregateQueryResult` | — | Performs aggregation operations on board data |
| `all_widgets_schema` | `[WidgetSchemaInfo!]` | — | Returns all available widget schemas for documentation and validation purposes |
| `allowed_sequences_to_enroll(board_id: ID!)` | `[Sequence!]` | — | Get sequences that the current user is allowed to enroll items to, that are connected to t |
| `analytics_events(identifier: String!, campaign_id: ID, event_type: CampaignsAnalyticsEventKind, limit: Int!, next_token: String)` | `CampaignsAnalyticsEventsResponse` | — | Search analytics events by identifier |
| `app(id: ID!)` | `AppType` | — | Get an app by ID or slug. |
| `app_installs(account_id: ID, app_id: ID!, limit: Int = 25, page: Int = 1)` | `[AppInstall]` | — | Get a collection of installs of an app. |
| `app_subscription` | `[AppSubscription]` | — | Get the current app subscription. Note: This query does not work in the playground |
| `app_subscription_operations(kind: String = "global")` | `AppSubscriptionOperationsCounter` | — | Get operations counter current value |
| `app_subscriptions(app_id: ID!, status: SubscriptionStatus, account_id: Int, cursor: String, limit: Int)` | `AppSubscriptions!` | — |  |
| `apps_monetization_info` | `AppsMonetizationInfo` | — | Get apps monetization information for an account |
| `apps_monetization_status` | `AppMonetizationStatus` | — | Get apps monetization status for an account |
| `article_blocks(object_id: ID!, limit: Int = 25, page: Int = 1)` | `[ArticleBlock]!` | — | Retrieves blocks for the published version of a specific article if the requesting user ha |
| `articles(object_ids: [ID!]!, workspace_ids: [ID!], limit: Int = 25, page: Int = 1)` | `[Article]!` | — | Retrieves a list of published articles with their metadata and content blocks that the req |
| `ask_developer_docs(query: String!)` | `AppDocumentationAiResponse` | — | Query the monday.com apps documentation using AI. Returns an AI-generated answer based on  |
| `assets(ids: [ID!]!)` | `[Asset]` | — | Get a collection of assets by ids. |
| `audit_event_catalogue` | `[AuditEventCatalogueEntry!]` | — | Lists all the audit event types that can be logged and information about them. Example que |
| `audit_logs(limit: Int = 25, page: Int = 1, user_id: ID, events: [String!], ip_address: String, start_time: ISO8601DateTime, end_time: ISO8601DateTime)` | `AuditLogPage` | — | Retrieve audit logs for your Monday account. You can filter logs by event types, user ID,  |
| `block_events(triggerUuid: String!, nextPageOffset: Int = 0)` | `BlockEventsPage` | — | List block events for a given trigger UUID |
| `board_candidates(workspaceId: String!, usageType: BoardUsage!)` | `[Board!]` | — | Get board candidates based on workspace and usage type |
| `board_dependencies(board_id: ID!, limit: Int = 25, page: Int = 1, include_items_without_predecessors: Boolean = true)` | `BoardDependencies` | — | Get all dependency predecessors for every item on a board, paginated. Each item includes i |
| `boards(board_kind: BoardKind, hierarchy_types: [BoardHierarchy!], ids: [ID!], latest: Boolean, limit: Int = 25, order_by: BoardsOrderBy, page: Int = 1, state: State = active, workspace_ids: [ID])` | `[Board]` | `monday boards / inspect` | Get a collection of boards. |
| `brand_kit` | `CampaignsBrandKit` | — | Get the brand kit for the current account |
| `campaign(id: ID!)` | `CampaignsEmailCampaign` | — | Get a single email campaign by ID |
| `campaigns(limit: Int, status: [CampaignsStatusKind!], name: String, sent_after: Date, sent_before: Date, sort_field: CampaignsSortField, sort_order: CampaignsSortOrder)` | `[CampaignsEmailCampaign!]` | — | List email campaigns for the current account with optional filtering and sorting |
| `complexity` | `Complexity` | `monday complexity` | Get the complexity data of your queries. |
| `connection(id: Int!)` | `Connection` | — | Fetch a single connection by its unique ID. |
| `connection_board_ids(connection_id: ID!)` | `[ID!]!` | — | Get board IDs that are linked to a specific connection. |
| `connections(withAutomations: Boolean, connectionState: String, withStateValidation: Boolean, page: Int, pageSize: Int, order: String, withPartialScopes: Boolean, pagination: PaginationInput)` | `[Connection!]` | — | Returns connections for the authenticated user. Supports filtering, pagination, ordering,  |
| `custom_activity(ids: [String!], name: String, icon_id: CustomActivityIcon, color: CustomActivityColor)` | `[CustomActivity!]` | — |  |
| `departments(ids: [ID!])` | `[Department!]` | — | Get account departments |
| `dependency_column_config(board_id: ID!, account_id: ID!, user_id: ID!)` | `DependencyColumnConfigResult` | — | Fetch dependency column configuration for a board |
| `doc_version_diff(doc_id: ID!, date: String!, prev_date: String!)` | `DocVersionDiff` | — | Retrieves the content diff between two versions of a document. Pass two restoring point da |
| `doc_version_history(doc_id: ID!, since: String, until: String)` | `DocVersionHistory` | — | Retrieves the version history of a document. Returns a list of restoring points (snapshots |
| `docs(ids: [ID!], limit: Int = 25, object_ids: [ID!], order_by: DocsOrderBy, page: Int = 1, workspace_ids: [ID])` | `[Document]` | `monday docs` | Get a collection of docs. |
| `empty` | `String` | — | Placeholder query field for automations-test microservice. This can be replaced with actua |
| `export_events(board_id: ID, start_date: String, end_date: String, state: [String!], type: [String!], limit: Int, offset: Int, order_by: String, order_direction: String)` | `EventsExport` | — | Export events for a board within a date range. Requires a valid X-Tool-Execution-Secret he |
| `export_graph(boardId: String!)` | `BoardGraphExport` | — | Export the dependency graph for a specific board |
| `export_markdown_from_doc(docId: ID!, blockIds: [String!])` | `ExportMarkdownResult` | — | Converts document content into standard markdown format for external use, backup, or proce |
| `favorites` | `[GraphqlHierarchyObjectItem!]` | — | Get all personal list items by list ID |
| `fetch_job_status(job_id: ID!)` | `JobStatus!` | — | Get the status of a backfill or ingest job |
| `folders(ids: [ID!], limit: Int = 25, page: Int = 1, workspace_ids: [ID])` | `[Folder]` | `monday docs` | Get a collection of folders. Note: This query won't return folders from closed workspaces  |
| `form(formToken: String!)` | `ResponseForm` | — | Fetch a form by its token. The returned form includes all the details of the form such as  |
| `get_app_lifecycle_subscriptions(app_id: ID!, version_id: ID)` | `[LifecycleSubscriptionKind!]` | — | Get lifecycle subscriptions for all entity types in a specific app version. If version_id  |
| `get_column_type_schema(type: ColumnType!)` | `JSON` | — | Retrieves the JSON schema definition for a specific column type. Use this query before cal |
| `get_directory_resources(query_params: ItemsQuery, cursor: String, limit: Int = 25)` | `DirectoryResourcesResponse` | — | Fetch resources information from the resource directory |
| `get_object_schemas(ids: [ID!], names: [String!], limit: Int, page: Int, exclude_created_by_monday: Boolean)` | `[ObjectSchema!]` | — | Retrieve active account object schemas by their IDs or names. Only returns account-level o |
| `get_view_schema_by_type(type: ViewKind!, mutationType: ViewMutationKind!)` | `JSON` | — | Retrieves the JSON schema definition for a specific create view type. Use this query befor |
| `insight(id: ID!)` | `CampaignsInsight` | — | Get a single market insight by ID |
| `insights(limit: Int)` | `[CampaignsInsight!]` | — | List market insights for the current account |
| `item_dependency(board_id: ID!, item_id: ID!)` | `ItemDependency` | — | Get all dependency predecessors for a specific item, including dependency type and lag per |
| `items(exclude_nonactive: Boolean, ids: [ID!], limit: Int = 25, newest_first: Boolean, page: Int = 1)` | `[Item]` | `monday items` | Get a collection of items. |
| `items_page_by_column_values(board_id: ID!, columns: [ItemsPageByColumnValuesQuery!], cursor: String, hierarchy_scope_config: String, limit: Int! = 25)` | `ItemsResponse!` | — | **server-side column filter** |
| `job_status(job_id: ID!)` | `AsyncJobStatus!` | — | Get the status of an async job by its external ID |
| `knowledge_base_search(query: String!, limit: Int = 5)` | `KnowledgeBaseAnswer` | — | Search knowledge base snippets. |
| `managed_column(id: [String!], state: [ManagedColumnState!])` | `[ManagedColumn!]` | — | Get managed column data. |
| `marketplace_app_discounts(app_id: ID!)` | `[MarketplaceAppDiscount!]!` | — |  |
| `me` | `User` | `monday me` | Get the connected user's information. |
| `mute_board_settings(board_ids: [ID!]!)` | `[BoardMuteSettings!]` | — | Get mute board notification settings for the current user |
| `next_items_page(cursor: String!, limit: Int! = 25)` | `ItemsResponse!` | `monday items (pagination)` | Get next pages of board's items (rows) by cursor. |
| `notetaker` | `NotetakerQueries` | — | Namespace for all notetaker-related queries. |
| `notifications(cursor: ID, limit: Int = 25, filter_read: Boolean, since: ISO8601DateTime)` | `[NotificationV2!]` | — |  |
| `notifications_settings(scope_type: ScopeType!, scope_id: Int, setting_kinds: [String!], channels: [ChannelType!])` | `[NotificationSetting!]` | — | Retrieves the current user's notification settings across all available channels. |
| `object_relations(object_id: ID!, kind: RelationKind, direction: RelationDirection = OUTGOING)` | `[ObjectRelation!]` | — | Fetch relations for a specific object |
| `object_types_unique_keys` | `[ObjectTypeUniqueKey!]` | — | Retrieves a list of available object types that can be created or queried. Each object typ |
| `objects(object_type_unique_keys: [String!], ids: [ID!], limit: Int, order_by: OrderBy, state: ObjectState, privacy_kind: PrivacyKind, workspace_ids: [ID!])` | `[Object!]` | — | Retrieves a list of objects from the Monday.com Objects Platform based on specified filter |
| `platform_api` | `PlatformApi` | — | Platform API data. |
| `replies(limit: Int = 25, page: Int = 1, board_ids: [ID!]!, created_at_from: String, created_at_to: String)` | `[Reply!]` | — | Get a collection of replies filtered by board IDs and date range. |
| `search` | `SearchNamespace!` | — | Search API. Each field searches a single entity type with tailored filters. |
| `segment(id: ID!)` | `CampaignsSegment` | — | Get a single audience segment by ID |
| `segments(limit: Int)` | `[CampaignsSegment!]` | — | List audience segments for the current account |
| `service_user_tokens(service_user_ids: [ID!]!)` | `[ServiceUserToken!]` | — | Retrieves API tokens for the given service users. |
| `service_users` | `[ServiceUser!]` | — | Retrieves all service users in the account with their token last activity. |
| `settings` | `CampaignsSettings` | — | Get marketing channels settings for the current account |
| `sprints(ids: [ID!]!)` | `[Sprint!]` | — | Get a collection of monday dev sprints |
| `tags(ids: [ID!])` | `[Tag]` | — | Get a collection of tags. |
| `teams(ids: [ID!])` | `[Team]` | — | Get a collection of teams. |
| `timeline(id: ID!, skipConnectedItems: Boolean)` | `TimelineResponse` | — | Fetches timeline items for a given item |
| `timeline_item(id: ID!)` | `TimelineItem` | — |  |
| `tool_events(trigger_uuid: String!, next_page_offset: Int = 0)` | `ToolEventsPage` | — | List tool events for a given trigger UUID |
| `trigger_event(triggerUuid: String!)` | `TriggerEvent` | — | **single automation run by uuid** |
| `trigger_events(nextPageOffset: Int = 0, filters: TriggerEventsFiltersInput)` | `TriggerEventsPage` | — | **automation run history (~9d retention); use `monday gql`** |
| `updates(limit: Int = 25, page: Int = 1, ids: [ID!], from_date: String, to_date: String)` | `[Update!]` | — | **board/item comments — no typed command; use `monday gql`** |
| `usage` | `CampaignsUsage` | — | Usage metrics for the current account |
| `user_configs(kinds: [String!], visibility: String, behaviors: [String!])` | `[UserConfig!]` | — | Get all user configs for the account. |
| `user_connections(withAutomations: Boolean, withStateValidation: Boolean, page: Int, pageSize: Int, order: String, pagination: PaginationInput)` | `[Connection!]` | — | Returns connections that belong to the authenticated user. |
| `users(ids: [ID!], name: String, emails: [String!], user_kind: UserKindFilterInput, sort: [UsersSortInput!], visibility: String, status: [UserStatus!], limit: Int = 200, page: Int = 1)` | `[User!]` | — | **resolve activity-log user_id -> name; use `monday gql`** |
| `validations(id: ID!, type: ValidationsEntityType = board)` | `Validations` | — | Get validations configuration for a board |
| `version` | `Version!` | `—` | Get the API version in use |
| `versions` | `[Version!]` | `—` | Get a list containing the versions of the API |
| `webhooks(app_webhooks_only: Boolean, board_id: ID!)` | `[Webhook]` | `monday webhooks` | Get a collection of webhooks for the board |
| `workspaces(ids: [ID!], kind: WorkspaceKind, limit: Int = 25, membership_kind: WorkspaceMembershipKind = all, order_by: WorkspacesOrderBy, page: Int = 1, query_params: WorkspacesQueryInput, state: State = active)` | `[Workspace]` | `monday boards --workspace` | Get a collection of workspaces. |

## Mutation root — 2026-07

| Field | Returns | CLI | Notes |
|---|---|---|---|
| `activate_form(formToken: String!)` | `Boolean` | — | Activate a form to make it visible to users and accept new submissions. |
| `activate_managed_column(id: String!)` | `ManagedColumn` | — | Activate managed column mutation. |
| `activate_users(user_ids: [ID!]!)` | `ActivateUsersResult` | — | Activates the specified users. |
| `add_content_to_doc_from_markdown(docId: ID!, markdown: String!, afterBlockId: String)` | `DocBlocksFromMarkdownResult` | — | Adds markdown content to an existing document by converting it into document blocks. Use t |
| `add_file_to_column(column_id: String!, file: File!, item_id: ID!)` | `Asset` | — | Add a file to a column value. |
| `add_file_to_update(file: File!, update_id: ID!)` | `Asset` | — | Add a file to an update. |
| `add_required_column(id: ID!, column_id: String!, type: ValidationsEntityType = board)` | `RequiredColumns` | — | Add a required column to a board |
| `add_subscribers_to_board(board_id: ID!, kind: BoardSubscriberKind = subscriber, user_ids: [ID!]!)` | `[User]` | — | Add subscribers to a board. |
| `add_subscribers_to_object(id: ID!, user_ids: [ID!]!, kind: SubscriberKind = SUBSCRIBER)` | `Object` | — | Adds users to an existing object as either subscribers or owners. Subscribers receive noti |
| `add_teams_to_board(board_id: ID!, kind: BoardSubscriberKind = subscriber, team_ids: [ID!]!)` | `[Team]` | — | Add teams subscribers to a board. |
| `add_teams_to_workspace(kind: WorkspaceSubscriberKind = subscriber, team_ids: [ID!]!, workspace_id: ID!)` | `[Team]` | — | Add teams to a workspace. |
| `add_users_to_board(board_id: ID!, kind: BoardSubscriberKind = subscriber, user_ids: [ID!]!)` | `[User]` | — | Add subscribers to a board. |
| `add_users_to_team(team_id: ID!, user_ids: [ID!]!)` | `ChangeTeamMembershipsResult` | — | Add users to team. |
| `add_users_to_workspace(kind: WorkspaceSubscriberKind = subscriber, user_ids: [ID!]!, workspace_id: ID!)` | `[User]` | — | Add users to a workspace. |
| `archive_board(board_id: ID!)` | `Board` | — | Archive a board. |
| `archive_group(board_id: ID!, group_id: String!)` | `Group` | — | Archives a group in a specific board. |
| `archive_item(item_id: ID)` | `Item` | — | Archive an item. |
| `archive_object(id: ID!)` | `Object` | — | Archives an object in the Monday.com Objects Platform, changing its state to "archived" wh |
| `assign_department_members(department_id: ID!, user_ids: [ID!]!)` | `AssignDepartmentMembersResult` | — | Assigns members to a department. |
| `assign_department_owner(department_id: ID!, user_id: ID!)` | `AssignDepartmentOwnerResult` | — | Assigns an owner to a department. |
| `assign_team_owners(team_id: ID!, user_ids: [ID!]!)` | `AssignTeamOwnersResult` | — | Assigns the specified users as owners of the specified team. |
| `attach_dropdown_managed_column(board_id: ID!, managed_column_id: ID!, title: String, description: String, after_column_id: ID, settings: DropdownSettingsOverridesInput)` | `Column` | — | Creates a new dropdown column in a board that is linked to a managed column. The column da |
| `attach_status_managed_column(board_id: ID!, managed_column_id: ID!, title: String, description: String, after_column_id: ID)` | `Column` | — | Creates a new status column in a board that is linked to a managed column. The column data |
| `backfill_items(board_id: ID!, group_id: ID!)` | `UploadJobInit` | — | Initialize a backfill job for a board and group. Designed for data migrations with no side |
| `batch_extend_trial_period(account_slugs: [String!]!, app_id: ID!, duration_in_days: Int!, plan_id: String!)` | `BatchExtendTrialPeriod` | — | Extends trial period of an application to selected accounts |
| `batch_update_dependency_column(boardId: String!, columnId: String!, values: [DependencyPulseValueInput!]!)` | `JSON!` | — | Batch update the dependency column values in a board. Limited to 50 items per batch. |
| `bulk_archive_items(board_id: ID!, item_ids: [ID!]!)` | `BulkDeleteInit` | — | Asynchronously archive items on a board |
| `bulk_delete_items(board_id: ID!, item_ids: [ID!]!)` | `BulkDeleteInit` | — | Asynchronously delete items on a board |
| `bulk_object_schema_column_actions(object_schema_id: ID, object_schema_name: String, actions: [ObjectSchemaActionInput!]!)` | `[ObjectSchemaActionResult!]` | — | Execute multiple object schema column actions in a single request. Actions are executed se |
| `change_column_metadata(board_id: ID!, column_id: String!, column_property: ColumnProperty, value: String)` | `Column` | — | Change a column's properties |
| `change_column_title(board_id: ID!, column_id: String!, title: String!)` | `Column` | — | Change a column's title |
| `change_column_value(board_id: ID!, column_id: String!, create_labels_if_missing: Boolean, item_id: ID, value: JSON!)` | `Item` | — | Change an item's column value. |
| `change_item_position(group_id: ID, group_top: Boolean, item_id: ID!, position_relative_method: PositionRelative, relative_to: ID)` | `Item` | — | Change an item's position. |
| `change_multiple_column_values(board_id: ID!, column_values: JSON!, create_labels_if_missing: Boolean, item_id: ID)` | `Item` | — | Changes the column values of a specific item. |
| `change_simple_column_value(board_id: ID!, column_id: String!, create_labels_if_missing: Boolean, item_id: ID, value: String)` | `Item` | — | Change an item's column with simple value. |
| `clear_item_updates(item_id: ID!)` | `Item` | — | Clear an item's updates. |
| `clear_users_department(user_ids: [ID!]!)` | `ClearUsersDepartmentResult` | — | Clear users department |
| `complexity` | `Complexity` | `monday complexity` | Get the complexity data of your mutations. |
| `connect_board_to_object_schema(board_id: ID!, object_schema_id: ID, object_schema_name: String)` | `BoardConnection` | — | Connect a board to an object schema. |
| `connect_project_to_portfolio(projectBoardId: ID!, portfolioBoardId: ID!, callback_url: String)` | `ConnectProjectResult` | — | Connect an existing project to a portfolio. When a callback_url is provided the mutation r |
| `convert_board_to_project(input: ConvertBoardToProjectInput!)` | `ConvertBoardToProjectResult` | — | Convert an existing monday.com board into a project with enhanced project management capab |
| `create_app(input: CreateAppInput!)` | `CreateAppResponse` | — | Creates a new app with the specified configuration. |
| `create_app_feature(name: String, slug: String!, app_id: ID!, app_version_id: ID, type: AppFeatureTypeE!, data: JSON, deployment: AppFeatureReleaseInput)` | `AppFeatureType` | — | Create a new app feature. |
| `create_article(name: String, workspace_id: ID!, folder_id: ID)` | `ArticleMetadata` | — | Creates a new article in the specified workspace. Optionally accepts a name and folder ID. |
| `create_board(board_kind: BoardKind!, board_name: String!, board_owner_ids: [ID!], board_owner_team_ids: [ID!], board_subscriber_ids: [ID!], board_subscriber_teams_ids: [ID!], description: String, empty: Boolean = false, folder_id: ID, item_nickname: ItemNicknameInput, prompt: String, template_id: ID, workspace_id: ID)` | `Board` | — | Create a new board. |
| `create_column(board_id: ID!, id: String, title: String!, description: String, after_column_id: ID, capabilities: ColumnCapabilitiesInput, defaults: JSON, column_type: ColumnType!)` | `Column` | — | Generic mutation for creating any column type with validation. Supports creating column wi |
| `create_custom_activity(name: String!, icon_id: CustomActivityIcon!, color: CustomActivityColor!)` | `CustomActivity` | — |  |
| `create_dashboard(name: String!, workspace_id: ID!, board_ids: [ID!]!, kind: DashboardKind, board_folder_id: ID)` | `Dashboard` | — | Create a new dashboard. |
| `create_department(data: CreateDepartmentDataInput!)` | `Department` | — | Creates a new department. |
| `create_doc(doc_owner_ids: [ID!], location: CreateDocInput!)` | `Document` | — | Create a new doc. |
| `create_doc_block(after_block_id: String, content: JSON!, doc_id: ID!, parent_block_id: String, type: DocBlockContentType!)` | `DocumentBlock` | — | Create new document block |
| `create_doc_blocks(docId: ID!, afterBlockId: String, blocksInput: [CreateBlockInput!]!)` | `[DocumentBlockV2!]` | — | Creates multiple document blocks in a single operation for efficient content creation. Use |
| `create_dropdown_column(board_id: ID!, id: String, title: String!, description: String, after_column_id: ID, defaults: CreateDropdownColumnSettingsInput)` | `Column` | — | Creates a new dropdown column with strongly typed settings. Dropdown columns allow users t |
| `create_dropdown_managed_column(title: String!, description: String, settings: CreateDropdownColumnSettingsInput)` | `DropdownManagedColumn` | — | Create managed column of type dropdown mutation. |
| `create_favorite(input: CreateFavoriteInput!)` | `CreateFavoriteResultType` | — | Add workspace object to favorites |
| `create_folder(color: FolderColor, custom_icon: FolderCustomIcon, font_weight: FolderFontWeight, name: String!, parent_folder_id: ID, workspace_id: ID)` | `Folder` | — | Creates a folder in a specific workspace. |
| `create_form(destination_workspace_id: ID!, destination_folder_id: ID, destination_folder_name: String, board_kind: BoardKind, destination_name: String, board_owner_ids: [ID!], board_owner_team_ids: [ID!], board_subscriber_ids: [ID!], board_subscriber_teams_ids: [ID!])` | `DehydratedFormResponse` | — | Create a new form with specified configuration. Returns the created form with its unique t |
| `create_form_question(formToken: String!, question: CreateQuestionInput!)` | `FormQuestion` | — | Create a new question within a form. Returns the created question with auto-generated ID. |
| `create_form_tag(formToken: String!, tag: CreateFormTagInput!)` | `FormTag` | — | Create a new tag for a form. Tags are used to categorize and track responses. (e.g. UTM ta |
| `create_group(board_id: ID!, group_color: String, group_name: String!, position: String, position_relative_method: PositionRelative, relative_to: String)` | `Group` | — | Creates a new group in a specific board. |
| `create_item(board_id: ID!, column_values: JSON, create_labels_if_missing: Boolean, group_id: String, item_name: String!, position_relative_method: PositionRelative, relative_to: ID)` | `Item` | — | Create a new item. |
| `create_marketplace_app_discount(app_id: ID!, account_slug: String!, discount_data: CreateMarketplaceAppDiscountInput!)` | `CreateMarketplaceAppDiscountResult!` | — | Create a marketplace app discount |
| `create_notification(target_id: ID!, target_type: NotificationTargetType!, text: String!, user_id: ID!)` | `Notification` | — | Create a new notification. |
| `create_object(name: String!, privacy_kind: PrivacyKind!, workspace_id: ID, description: String, folder_id: ID, owner_ids: [ID!], owner_team_ids: [ID!], subscriber_ids: [ID!], subscriber_teams_ids: [ID!], object_type_unique_key: String!, payload: JSON, relations: [ObjectRelationInput!])` | `Object` | — | Creates a new object in the Monday.com Objects Platform. The type of object created is det |
| `create_object_relations(source_object_id: ID!, relations: [ObjectRelationInput!]!)` | `[ObjectRelation!]` | — | Create relations for an object |
| `create_object_schema(name: String!, parent_id: ID, description: String)` | `ObjectSchema` | — | Create a new account object schema. |
| `create_object_schema_columns(object_schema_id: ID, object_schema_name: String, columns: [CreateObjectSchemaColumnInput!]!)` | `ObjectSchema` | — | Create columns on an account object schema. |
| `create_or_get_tag(board_id: ID, tag_name: String)` | `Tag` | — | Create a new tag or get it if it already exists. |
| `create_portfolio(boardName: String!, boardPrivacy: String!, destinationWorkspaceId: Int, callback_url: String)` | `CreatePortfolioResult` | — | Create a new portfolio. When a callback_url is provided the mutation returns immediately w |
| `create_project(input: CreateProjectInput!)` | `CreateProjectResult` | — | Create a new project in monday.com from scratch. This mutation initiates asynchronous proj |
| `create_service_user(name: String!, title: String)` | `CreateServiceUserResult` | — | Creates a new service user. |
| `create_status_column(board_id: ID!, id: String, title: String!, description: String, after_column_id: ID, capabilities: StatusColumnCapabilitiesInput, defaults: CreateStatusColumnSettingsInput)` | `Column` | — | Creates a new status column with strongly typed settings. Status columns allow users to tr |
| `create_status_managed_column(title: String!, description: String, settings: CreateStatusColumnSettingsInput)` | `StatusManagedColumn` | — | Create managed column of type status mutation. |
| `create_subitem(column_values: JSON, create_labels_if_missing: Boolean, item_name: String!, parent_item_id: ID!)` | `Item` | — | Create subitem. |
| `create_team(input: CreateTeamAttributesInput!, options: CreateTeamOptionsInput)` | `Team` | — | Creates a new team. |
| `create_timeline_item(item_id: ID!, user_id: Int, title: String!, timestamp: ISO8601DateTime!, summary: String, content: String, location: String, phone: String, url: String, time_range: TimelineItemTimeRange, custom_activity_id: String!)` | `TimelineItem` | — |  |
| `create_update(body: String!, original_creation_date: String, mentions_list: [UpdateMention], item_id: ID, parent_id: ID, use_app_info: Boolean)` | `Update` | — |  |
| `create_validation_rule(id: ID!, type: ValidationsEntityType = board, rule: ValidationRuleInput!)` | `ValidationRule` | — | Create a validation rule |
| `create_view(board_id: ID!, type: ViewKind!, name: String, filter_user_id: ID, filter_team_id: ID, filter: ItemsQueryGroup, sort: [ItemsQueryOrderBy!], tags: [String!], settings: JSON)` | `BoardView` | — | Create a view |
| `create_view_table(board_id: ID!, name: String, filter_user_id: ID, filter_team_id: ID, filter: ItemsQueryGroup, sort: [ItemsQueryOrderBy!], tags: [String!], settings: TableViewSettingsInput)` | `BoardView` | — | Create a new table view |
| `create_webhook(board_id: ID!, config: JSON, event: WebhookEventType!, url: String!)` | `Webhook` | — | Create a new webhook. |
| `create_widget(parent: WidgetParentInput!, kind: ExternalWidget!, name: String!, settings: JSON!, filter: ItemsQueryGroup)` | `Widget` | — | Create a new widget. |
| `create_workspace(account_product_id: ID, description: String, kind: WorkspaceKind!, name: String!)` | `Workspace` | — | Create a new workspace. |
| `deactivate_form(formToken: String!)` | `Boolean` | — | Deactivate a form to hide it from users and stop accepting submissions. Form data is prese |
| `deactivate_managed_column(id: String!)` | `ManagedColumn` | — | Deactivate managed column mutation. |
| `deactivate_users(user_ids: [ID!]!)` | `DeactivateUsersResult` | — | Deactivates the specified users. |
| `delete_app_lifecycle_subscription(entity_identifier: ID!, entity_type: String!)` | `Boolean` | — | Delete all lifecycle subscriptions for an entity. Returns true if deleted successfully or  |
| `delete_article(object_id: ID!)` | `ArticleMetadata` | — | Deletes an article with the specified object ID |
| `delete_board(board_id: ID!)` | `Board` | — | Delete a board. |
| `delete_column(board_id: ID!, column_id: String!)` | `Column` | — | Delete a column. |
| `delete_custom_activity(id: String!)` | `CustomActivity` | — |  |
| `delete_dashboard(id: ID!)` | `Boolean` | — | Delete an existing dashboard. |
| `delete_department(department_id: ID!)` | `Department` | — | Deletes a department. |
| `delete_doc(docId: ID!)` | `JSON` | — | Permanently deletes a document and all its content from the system. This action cannot be  |
| `delete_doc_block(block_id: String!)` | `DocumentBlockIdOnly` | — | Delete a document block |
| `delete_doc_blocks(block_ids: [ID!]!)` | `[DeletedDocBlock!]` | — | Deletes multiple document blocks in a single operation. Maximum 100 blocks per request. |
| `delete_favorite(input: DeleteFavoriteInput!)` | `DeleteFavoriteInputResultType` | — | Remove an object from favorites |
| `delete_folder(folder_id: ID!)` | `Folder` | — | Deletes a folder in a specific workspace. |
| `delete_form_tag(formToken: String!, tagId: String!, options: DeleteFormTagInput)` | `Boolean` | — | Delete a tag from a form |
| `delete_group(board_id: ID!, group_id: String!)` | `Group` | — | Deletes a group in a specific board. |
| `delete_item(item_id: ID)` | `Item` | — | Delete an item. |
| `delete_managed_column(id: String!)` | `ManagedColumn` | — | Delete managed column mutation. |
| `delete_marketplace_app_discount(app_id: ID!, account_slug: String!)` | `DeleteMarketplaceAppDiscountResult!` | — |  |
| `delete_object(id: ID!)` | `Object` | — | Permanently deletes an object from the Monday.com Objects Platform. Unlike archiving, dele |
| `delete_object_relation(source_object_id: ID!, relation_id: ID)` | `Int` | — | Delete a specific object relation or all relations for an object. Returns the number of re |
| `delete_object_schema(id: ID, name: String)` | `ObjectSchema` | — | Delete an account object schema. Can only delete if there are no boards attached to the ob |
| `delete_question(formToken: String!, questionId: String!)` | `Boolean` | — | Permanently remove a question from a form. This action cannot be undone. |
| `delete_subscribers_from_board(board_id: ID!, user_ids: [ID!]!)` | `[User]` | — | Remove subscribers from the board. |
| `delete_team(team_id: ID!)` | `Team` | — | Deletes the specified team. |
| `delete_teams_from_board(board_id: ID!, team_ids: [ID!]!)` | `[Team]` | — | Remove team subscribers from the board. |
| `delete_teams_from_workspace(team_ids: [ID!]!, workspace_id: ID!)` | `[Team]` | — | Delete teams from a workspace. |
| `delete_timeline_item(id: String!)` | `TimelineItem` | — |  |
| `delete_update(id: ID!)` | `Update` | — |  |
| `delete_users_from_workspace(user_ids: [ID!]!, workspace_id: ID!)` | `[User]` | — | Delete users from a workspace. |
| `delete_validation_rule(id: ID!, type: ValidationsEntityType = board, rule_id: ID!)` | `ValidationRule` | — | Delete a validation rule |
| `delete_view(view_id: ID!, board_id: ID!)` | `BoardView` | — | Delete an existing board subset/view |
| `delete_webhook(id: ID!)` | `Webhook` | — | Delete a new webhook. |
| `delete_widget(id: ID!)` | `Boolean` | — | Delete an existing widget. |
| `delete_workspace(workspace_id: ID!)` | `Workspace` | — | Delete workspace. |
| `detach_boards_from_object_schema(board_ids: [ID!]!)` | `[BulkDetachBoardResult!]` | — | Detach boards from their object schemas. |
| `duplicate_board(board_id: ID!, board_name: String, duplicate_type: DuplicateBoardType!, folder_id: ID, keep_subscribers: Boolean, workspace_id: ID)` | `BoardDuplication` | — | Duplicate a board. |
| `duplicate_doc(docId: ID!, duplicateType: DuplicateType)` | `JSON` | — | Creates an exact copy of an existing document, including all content, structure, and forma |
| `duplicate_group(add_to_top: Boolean, board_id: ID!, group_id: String!, group_title: String)` | `Group` | — | Duplicate a group. |
| `duplicate_item(board_id: ID!, item_id: ID, with_updates: Boolean)` | `Item` | — | Duplicate an item. |
| `edit_update(id: ID!, body: String!)` | `Update!` | — |  |
| `enroll_items_to_sequence(input: EnrollToSequenceInput!)` | `EnrollToSequenceResult` | — | Enroll multiple items to a single sequence. Maximum 50 items per request. |
| `execute_integration_block(block_instance_id: ID!, inbound_field_values: JSON!)` | `IntegrationExecutionResult` | — | Execute an integration block with the provided field values |
| `grant_marketplace_app_discount(app_id: ID!, account_slug: String!, data: GrantMarketplaceAppDiscountData!)` | `GrantMarketplaceAppDiscountResult!` | — |  |
| `import_doc_from_html(html: String!, workspaceId: ID!, kind: DocKind, folderId: ID, title: String)` | `ImportDocFromHtmlResult` | — | Imports HTML content as a new document by converting it into document blocks. The HTML wil |
| `increase_app_subscription_operations(increment_by: Int = 1, kind: String = "global")` | `AppSubscriptionOperationsCounter` | — | Increase operations counter |
| `ingest_items(board_id: ID!, group_id: ID!, on_match: OnMatchInput)` | `UploadJobInit` | — | Initialize an ingest job for a board and group. Designed for ongoing integrations with ful |
| `install_app(input: InstallAppInput!)` | `InstallAppResponse` | — | Installs an app on the current account. Requires account admin permission. |
| `invite_users(emails: [String!]!, user_role: UserRole, product: Product)` | `InviteUsersResult` | — | Invite users to the account. |
| `like_update(update_id: ID!, reaction_type: String)` | `Update` | — |  |
| `move_item_to_board(board_id: ID!, columns_mapping: [ColumnMappingInput!], group_id: ID!, item_id: ID!, subitems_columns_mapping: [ColumnMappingInput!])` | `Item` | — | Move an item to a different board. |
| `move_item_to_group(group_id: String!, item_id: ID)` | `Item` | — | Move an item to a different group. |
| `pin_to_top(id: ID!, item_id: ID)` | `Update!` | — |  |
| `publish_article(object_id: ID!, privacy_kind: PrivacyKind!, folder_id: ID, add_subscriber_ids: [ID!], add_subscriber_team_ids: [ID!], remove_subscriber_ids: [ID!], remove_subscriber_team_ids: [ID!])` | `ArticleMetadata` | — | Publishes an article with the specified object ID. Allows setting privacy level, target fo |
| `publish_object(id: ID!)` | `ObjectOperationResponse` | — | Publishes object out of draft state. Returns {success: true} on success, {success: false}  |
| `regenerate_service_user_token(service_user_id: ID!)` | `String` | — | Revokes all existing tokens and generates a new API token for a service user. |
| `remove_mock_app_subscription(app_id: ID!, partial_signing_secret: String!)` | `AppSubscription` | — | Remove mock app subscription for the current account |
| `remove_required_column(id: ID!, column_id: String!, type: ValidationsEntityType = board)` | `RequiredColumns` | — | Remove a required column from a board |
| `remove_team_owners(team_id: ID!, user_ids: [ID!]!)` | `RemoveTeamOwnersResult` | — | Removes the specified users as owners of the specified team. |
| `remove_users_from_team(team_id: ID!, user_ids: [ID!]!)` | `ChangeTeamMembershipsResult` | — | Remove users from team. |
| `revoke_service_user_tokens(service_user_id: ID!)` | `Boolean` | — | Revokes all API tokens for a service user. |
| `set_board_permission(basic_role_name: BoardBasicRoleName, board_id: ID!, cross_product_collaborative: Boolean)` | `SetBoardPermissionResponse` | — | Set or update the board's permission to specified role. This concept is also known as defa |
| `set_form_password(formToken: String!, input: SetFormPasswordInput!)` | `ResponseForm` | — | Set a password on a form to restrict access. This will enable password protection for the  |
| `set_item_description_content(item_id: ID!, markdown: String!)` | `DocBlocksFromMarkdownResult` | — | Sets an item description document's content with new markdown data. This mutation converts |
| `set_mock_app_subscription(app_id: ID!, billing_period: String, is_trial: Boolean, max_units: Int, partial_signing_secret: String!, plan_id: String, pricing_version: Int, renewal_date: Date)` | `AppSubscription` | — | Set mock app subscription for the current account |
| `set_object_schema_column_active_state(object_schema_id: ID, object_schema_name: String, column_id: ID!, action: ColumnActiveStateAction!)` | `ObjectSchema` | — | Deactivate or reactivate a column on an account object schema. |
| `shorten_form_url(formToken: String!)` | `FormShortenedLink` | — | Shorten a URL for a form and store it in the form settings. Returns the shortened link obj |
| `unassign_department_owners(department_id: ID!, user_ids: [ID!]!)` | `UnassignDepartmentOwnerResult` | — | Unassigns owners from a department. |
| `undo_action(job_id: ID!)` | `UndoResult` | — | Undo a previously completed action, or cancel one still in flight |
| `uninstall_app(app_identifier: ID!)` | `AppDeletionResponse` | — | Uninstalls an app from the current account. Requires account admin permission. |
| `unlike_update(update_id: ID!)` | `Update!` | — |  |
| `unpin_from_top(id: ID!, item_id: ID)` | `Update!` | — |  |
| `unpublish_object(id: ID!)` | `ObjectOperationResponse` | — | Unpublishes object from public state back to draft state. Returns {success: true} on succe |
| `update_app(id: ID!, input: UpdateAppInput!)` | `AppType` | — | Updates an existing app. If the app latest version is live, a new draft version is automat |
| `update_app_feature(id: ID!, input: UpdateAppFeatureInput!)` | `AppFeatureType` | — | Update an app feature. |
| `update_app_lifecycle_subscription(entity_identifier: ID!, entity_type: String!, input: UpdateLifecycleSubscriptionsInput!)` | `[LifecycleSubscriptionKind!]` | — | Update (or create) lifecycle subscriptions for an entity. This will soft delete all existi |
| `update_article_block(block_id: String!, content: JSON!)` | `ArticleBlock` | — | Updates the content of a specific article block. The block must belong to a draft article  |
| `update_assets_on_item(board_id: ID!, column_id: String!, files: [FileInput!]!, item_id: ID!)` | `Item` | — | Update item column value by existing assets |
| `update_board(board_attribute: BoardAttributes!, board_id: ID!, new_value: String!)` | `JSON` | — | Update Board attribute. |
| `update_board_hierarchy(attributes: UpdateBoardHierarchyAttributesInput!, board_id: ID!)` | `UpdateBoardHierarchyResult` | — | Update a board's position, workspace, or account product. |
| `update_column(board_id: ID!, id: String!, title: String, description: String, width: Int, revision: String!, capabilities: ColumnCapabilitiesInput, settings: JSON, column_type: ColumnType!)` | `Column` | — | Generic mutation for updating any column type with validation. Supports updating column pr |
| `update_dashboard(id: ID!, name: String, workspace_id: ID, kind: DashboardKind, board_folder_id: ID)` | `Dashboard` | — | Update an existing dashboard. |
| `update_department(department_id: ID!, data: UpdateDepartmentOptionsInput)` | `Department` | — | Updates a department. |
| `update_dependency_column(boardId: String!, pulseId: String!, value: DependencyValueInput!, columnId: String!, successor_new_date: TimelineDateInput)` | `JSON!` | — | Update the dependency column for a specific pulse |
| `update_directory_resources_attributes(attribute: DirectoryResourceAttribute!, values: [String!]!, resource_ids: [ID!]!)` | `UpdateDirectoryResourceAttributesResponse` | — | Update attributes (Job Role, Skills, or Location) for multiple resources in the directory |
| `update_doc_block(block_id: String!, content: JSON!)` | `DocumentBlock` | — | Update a document block |
| `update_doc_name(docId: ID!, name: String!)` | `JSON` | — | Update a document's name/title. Changes are applied immediately and visible to all users w |
| `update_dropdown_column(board_id: ID!, id: String!, title: String, description: String, width: Int, revision: String!, settings: UpdateDropdownColumnSettingsInput)` | `Column` | — | Updates a dropdown column's properties including title, description, and dropdown label se |
| `update_dropdown_managed_column(id: String!, title: String, description: String, settings: UpdateDropdownColumnSettingsInput, revision: Int!)` | `DropdownManagedColumn` | — | Update managed column of type dropdown mutation. |
| `update_email_domain(input: UpdateEmailDomainAttributesInput!)` | `UpdateEmailDomainResult` | — | Updates the email domain for the specified users. |
| `update_favorite_position(input: UpdateObjectHierarchyPositionInput!)` | `UpdateFavoriteResultType` | — | Update the position of an object in favorites |
| `update_folder(account_product_id: ID, color: FolderColor, custom_icon: FolderCustomIcon, folder_id: ID!, font_weight: FolderFontWeight, name: String, parent_folder_id: ID, position: DynamicPosition, workspace_id: ID)` | `Folder` | — | Updates a folder. |
| `update_form(formToken: String!, input: UpdateFormInput!)` | `ResponseForm` | — | Update form properties including title, description, or question order. |
| `update_form_question(formToken: String!, questionId: String!, question: UpdateQuestionInput!)` | `FormQuestion` | — | Update an existing question properties including title, type, or settings. Requires questi |
| `update_form_settings(formToken: String!, settings: UpdateFormSettingsInput!)` | `ResponseForm` | — | Update form configuration including features, appearance, and accessibility options. |
| `update_form_tag(formToken: String!, tagId: String!, tag: UpdateFormTagInput!)` | `Boolean` | — | Update an existing tag in a form |
| `update_group(board_id: ID!, group_attribute: GroupAttributes!, group_id: String!, new_value: String!)` | `Group` | — | Update an existing group. |
| `update_multiple_users(user_updates: [UserUpdateInput!]!, bypass_confirmation_for_claimed_domains: Boolean, use_async_mode: Boolean)` | `UpdateUserAttributesResult` | — | Updates attributes for users. |
| `update_mute_board_settings(board_id: String!, mute_state: BoardMuteState!, enabled: [CustomizableBoardSettings!])` | `[BoardMuteSettings!]` | — | Update mute notification settings for a board. Allows muting all notifications for all use |
| `update_notification_setting(scope_type: ScopeType!, scope_id: Int, setting_kind: String!, channel: ChannelType!, enabled: Boolean!)` | `[NotificationSetting!]` | — | Updates a notification setting's enabled status. |
| `update_object(id: String!, input: UpdateObjectInput!)` | `Object` | — | Updates an object. |
| `update_object_schema(id: ID!, revision: Int!, parent_id: ID, description: String)` | `ObjectSchema` | — | Update an account object schema. |
| `update_object_schema_columns(object_schema_id: ID, object_schema_name: String, columns: [UpdateObjectSchemaColumnInput!]!)` | `ObjectSchema` | — | Update columns on an account object schema. |
| `update_overview_hierarchy(attributes: UpdateOverviewHierarchyAttributesInput!, overview_id: ID!)` | `UpdateOverviewHierarchy` | — | Update the position of a dashboard. |
| `update_status_column(board_id: ID!, id: String!, title: String, description: String, width: Int, revision: String!, capabilities: StatusColumnCapabilitiesInput, settings: UpdateStatusColumnSettingsInput)` | `Column` | — | Updates a status column's properties including title, description, and status label settin |
| `update_status_managed_column(id: String!, title: String, description: String, settings: UpdateStatusColumnSettingsInput, revision: Int!)` | `StatusManagedColumn` | — | Update managed column of type status mutation. |
| `update_users_role(user_ids: [ID!]!, new_role: BaseRoleName, role_id: ID)` | `UpdateUsersRoleResult` | — | Updates the role of the specified users. |
| `update_validation_rule(id: ID!, type: ValidationsEntityType = board, rule_id: ID!, rule: ValidationRuleInput!)` | `ValidationRule` | — | Update a validation rule |
| `update_view(name: String, filter_user_id: ID, filter_team_id: ID, filter: ItemsQueryGroup, sort: [ItemsQueryOrderBy!], tags: [String!], view_id: ID!, board_id: ID!, type: ViewKind!, settings: JSON)` | `BoardView` | — | Update an existing view |
| `update_view_table(view_id: ID!, board_id: ID!, name: String, filter_user_id: ID, filter_team_id: ID, filter: ItemsQueryGroup, sort: [ItemsQueryOrderBy!], tags: [String!], settings: TableViewSettingsInput)` | `BoardView` | — | Update an existing board table view |
| `update_workspace(attributes: UpdateWorkspaceAttributesInput!, id: ID)` | `Workspace` | — | Update an existing workspace. |
| `use_template(board_kind: BoardKind, board_owner_ids: [Int], board_owner_team_ids: [Int], board_subscriber_ids: [Int], board_subscriber_teams_ids: [Int], callback_url_on_complete: String, destination_folder_id: Int, destination_folder_name: String, destination_name: String, destination_workspace_id: Int, skip_target_folder_creation: Boolean, solution_extra_options: JSON, template_id: Int!)` | `Template` | — | Use a template |

## What 2027-01 adds over 2026-07

New query fields (6): `agents`, `aggregate_history`, `board_automations`, `items_history`, `items_page`, `template_installation_status`

New mutations (14): `configure_categorize_ai_column`, `configure_extract_ai_column`, `configure_improve_text_ai_column`, `configure_open_block_ai_column`, `configure_person_assignment_ai_column`, `configure_summarize_ai_column`, `configure_translate_ai_column`, `configure_write_me_ai_column`, `delete_board_automation`, `promote_app`, `remove_ai_from_column`, `run_prompt`, `subscribe_users_to_agent`, `unsubscribe_users_from_agent`

## What `dev` adds over 2027-01

New query fields (69): `account_availability_defaults`, `agent_active_triggers`, `agent_artifacts`, `agent_knowledge`, `agent_run_event`, `agent_runs`, `agent_skills_catalog`, `agent_triggers_catalog`, `ai_search`, `artifact`, `artifacts`, `blocks`, `bulk_import_items_status`, `count_active_workflows`, `custom_agents`, `export_dependencies_board_activity_log`, `external_provider_agents`, `external_provider_data`, `fetch_export_job_status`, `generate_subgraph_token`, `get_allocated_resources`, `get_allocations`, `get_automation_data`, `get_connected_boards`, `get_connected_columns`, `get_entities_for_migration`, `get_entity_snapshots`, `get_live_workflow`, `get_live_workflows`, `get_live_workflows_page`, `get_resource_attribute_types`, `get_resource_attributes`, `get_restore_history`, `get_restores`, `get_snapshot_history`, `get_task_changelog`, `get_workflow_block_next_mapping_schemas`, `get_workflow_data`, `get_workflow_variable_schemas`, `intelligence`, `live_workflows_page`, `load_dashboard_data`, `lookup`, `messages`, `migrated_entity_id_mappings`, `my_task_board`, `my_tasks`, `overviews`, `portfolio_resources`, `portfolio_resources_by_name`, `portfolio_utilization_report`, `priority_prompt`, `remote_options`, `resource_allocation_test`, `resources_availability`, `search_benchmark`, `search_cross_board`, `snapshottable_board`, `snapshottable_workspace`, `sql`, `sql_compile`, `sql_describe`, `task`, `time_offs`, `user_pto`, `utilization_report`, `work_schedules`, `workflow_run_once_trigger_entities`, `workflows`

New mutations (97): `activate_agent`, `activate_live_workflow`, `add_agent_resource_access`, `add_allocated_resources`, `add_allocations_to_resources`, `add_board_relation_connected_boards`, `add_skill_to_agent`, `add_trigger_to_agent`, `assign_time_off`, `assign_work_schedule`, `batch_undo`, `bulk_import_items`, `change_live_workflow_owner`, `complete_upload`, `connect_external_agent`, `connect_external_agent_sync`, `connect_migration_job`, `create_agent`, `create_agent_skill`, `create_blank_agent`, `create_board_automation`, `create_board_relation_column`, `create_entity_snapshot`, `create_form_submission`, `create_live_workflow`, `create_live_workflow_from_template`, `create_migration_job`, `create_mirror_column`, `create_pto_entry`, `create_task`, `create_time_off`, `create_time_off_entry`, `create_upload`, `create_work_schedule`, `create_workflow`, `deactivate_agent`, `deactivate_live_workflow`, `delete_agent`, `delete_agent_artifact`, `delete_allocation`, `delete_entity_id_mappings`, `delete_live_workflow`, `delete_object_schema_columns`, `delete_planner_resource`, `delete_pto_entry`, `delete_time_off`, `delete_time_off_entry`, `delete_work_schedule`, `detach_workflows_from_template`, `disconnect_external_agent`, `execute_integration_block_v2`, `export_board`, `export_board_async`, `process_events`, `publish_workflow`, `reconcile_with_items`, `remove_agent_resource_access`, `remove_board_relation_connected_boards`, `remove_job_from_agent`, `remove_skill_from_agent`, `remove_trigger_from_agent`, `remove_trigger_from_job`, `restore_entity`, `rollback_restore`, `rollback_snapshot`, `run_agent`, `run_job`, `run_workflow_once`, `save_workflow_as_template`, `send_message`, `stop_workflow_run_once`, `toggle_reaction`, `unassign_time_off`, `unassign_work_schedule`, `update_agent`, `update_agent_resource_access`, `update_allocations`, `update_board_relation_column`, `update_board_relation_source_mappings`, `update_custom_agent`, `update_live_workflow`, `update_live_workflow_from_template`, `update_live_workflow_metadata`, `update_mirror_column`, `update_priority_prompt`, `update_pto_entry`, `update_task`, `update_time_off`, `update_time_off_entry`, `update_users_board_role`, `update_users_profile_picture`, `update_widgets_surface`, `update_work_schedule`, `upsert_entity_id_mappings`, `upsert_job_on_agent`, `upsert_trigger_on_job`, `vibe`

> `dev` is unstable and unversioned. Treat it as a preview of direction, never as a target.
