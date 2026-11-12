# Monday GraphQL type reference

Generated from live introspection at **API-Version 2026-07** (current) by
`scripts/gen-type-docs.mjs`. `BoardAutomation`/`AutomationsPage` are read from **2027-01**,
where they first appear.

Companion: [`public-api.md`](public-api.md) — the query/mutation root surface.

## Core types

### `Board`

> The board itself. NOTE: no automation field exists here — checked.

A monday.com board.

| Field | Type | Notes |
|---|---|---|
| `id` | `ID!` | The unique identifier of the board. |
| `inferred_metadata` | `BoardInferredMetadata` | Inferred metadata associated with this board |
| `manual_metadata` | `BoardManualMetadata` | Manually set metadata associated with this board |
| `columns(ids: [String], types: [ColumnType!], capabilities: [ColumnCapability])` | `[Column]` | The board's visible columns. |
| `updates_page(limit: Int, cursor: String)` | `UpdatesPage` | The board's updates with cursor-based pagination. |
| `updates(limit: Int, page: Int, ids: [ID!], board_updates_only: Boolean, from_date: ISO8601DateTime, to_date: ISO8601DateTime)` | `[Update!]` | The board's updates. |
| `views(ids: [ID!], type: String)` | `[BoardView]` | The board's views. |
| `access_level` | `BoardAccessLevel!` | The user's permission level for this board (view / edit). |
| `activity_logs(column_ids: [String], from: ISO8601DateTime, group_ids: [String], item_ids: [ID!], limit: Int, page: Int, to: ISO8601DateTime, user_ids: [ID!])` | `[ActivityLogType]` | The board log events. |
| `board_folder_id` | `ID` | The board's folder unique identifier. |
| `board_kind` | `BoardKind!` | The board's kind (public / private / share). |
| `columns_namespace` | `String` | The board's columns namespace. |
| `communication` | `JSON` | Get the board communication value - typically meeting ID |
| `created_at` | `ISO8601DateTime` | The time the board was created at. |
| `created_from_board_id` | `ID` | The board's source board unique identifier (the board from which this board was  |
| `creator` | `User!` | The creator of the board. |
| `description` | `String` | The board's description. |
| `folder` | `Folder` | The folder that contains this board, or null if it isn't in any folder. |
| `groups(ids: [String])` | `[Group]` | The board's visible groups. |
| `hierarchy_type` | `BoardHierarchy` | The hierarchy type of the board |
| `item_terminology` | `String` | The Board's item nickname, one of a predefined set of values, or a custom user v |
| `items_count` | `Int` | The number of items on the board |
| `items_limit` | `Int` | The maximum number of items this board can have |
| `items_page(cursor: String, hierarchy_scope_config: String, limit: Int!, query_params: ItemsQuery)` | `ItemsResponse!` | The board's items (rows). |
| `name` | `String!` | The board's name. |
| `object_type_unique_key` | `String` | The Board's object type unique key |
| `owner` | `User!` | **DEPRECATED** The owner of the board. |
| `owners` | `[User]!` | List of user board owners |
| `permissions` | `String!` | The board's permissions. |
| `state` | `State!` | The board's state (all / active / archived / deleted). |
| `subscribers` | `[User]!` | The board's subscribers. |
| `tags` | `[Tag]` | The board's specific tags. |
| `team_owners(limit: Int, page: Int)` | `[Team!]` | List of team board owners |
| `team_subscribers(limit: Int, page: Int)` | `[Team!]` | The board's team subscribers. |
| `top_group` | `Group!` | The top group at this board. |
| `type` | `BoardObjectType` | The board object type. |
| `updated_at` | `ISO8601DateTime` | The last time the board was updated at. |
| `url` | `String!` | The Board's url |
| `workspace` | `Workspace` | The workspace that contains this board (null for main workspace). |
| `workspace_id` | `ID` | The board's workspace unique identifier (null for main workspace). |

### `Group`

> A board group. `items_page` on Board is group-filterable via query_params.

A group of items in a board.

| Field | Type | Notes |
|---|---|---|
| `archived` | `Boolean` | Is the group archived or not. |
| `color` | `String!` | The group's color. |
| `deleted` | `Boolean` | Is the group deleted or not. |
| `id` | `ID!` | The group's unique identifier. |
| `items_page(cursor: String, hierarchy_scope_config: String, limit: Int!, query_params: ItemsQuery)` | `ItemsResponse!` | The items in the group. |
| `position` | `String!` | The group's position in the board. |
| `title` | `String!` | The group's title. |

### `Item`

> A row ("pulse" in the older API and in activity-log payloads).

An item (table row).

| Field | Type | Notes |
|---|---|---|
| `id` | `ID!` | The item's unique identifier. |
| `updates_page(limit: Int, cursor: String)` | `UpdatesPage` | The item's updates with cursor-based pagination. |
| `updates(limit: Int, page: Int, ids: [ID!])` | `[Update!]` | The item's updates. |
| `assets(assets_source: AssetsSource, column_ids: [String])` | `[Asset]` | The item's assets/files. |
| `board` | `Board` | The board that contains this item. |
| `column_values(capabilities: [ColumnCapability!], ids: [String!], types: [ColumnType!])` | `[ColumnValue!]!` | The item's column values. |
| `created_at` | `Date` | The item's create date. |
| `creator` | `User` | The item's creator. |
| `creator_id` | `String!` | The unique identifier of the item creator. |
| `description` | `ItemDescription` | The item's description |
| `email` | `String!` | The item's email. |
| `group` | `Group` | The group that contains this item. |
| `linked_items(link_to_item_column_id: String!, linked_board_id: ID!)` | `[Item!]!` | The item's linked items |
| `name` | `String!` | The item's name. |
| `parent_item` | `Item` | The parent item of a subitem. |
| `relative_link` | `String` | The item's relative path |
| `state` | `State` | The item's state (all / active / archived / deleted). |
| `subitems` | `[Item]` | The item's subitems. |
| `subscribers` | `[User]!` | The pulses's subscribers. |
| `updated_at` | `Date` | The item's last update date. |
| `url` | `String!` | The item's link |

### `ItemsPage`

_Not present in this schema version._

### `Column`

> `settings_str` holds a status column's DEFINED label set — dropped by `inspect --pretty`.

| Field | Type | Notes |
|---|---|---|
| `id` | `ID!` | The unique identifier of the column. |
| `title` | `String!` | The column's title. |
| `description` | `String` | The column's description. |
| `type` | `ColumnType!` | The column's type. |
| `width` | `Int` | The column's width. |
| `archived` | `Boolean!` | Is the column archived or not. |
| `settings` | `JSON` | The column's settings in a JSON form. |
| `settings_str` | `String!` | **DEPRECATED** The column's settings in a string form. |
| `revision` | `String!` | The revision of the column (fetch to get latest revision). Used for optimistic c |
| `capabilities` | `ColumnCapabilities!` | Capabilities available for this column |

### `ColumnValue`

> Interface. `text` is the display string; `value` is raw JSON.

| Field | Type | Notes |
|---|---|---|
| `column` | `Column!` | The column that this value belongs to. |
| `id` | `ID!` | The column's unique identifier. |
| `is_leaf` | `Boolean!` | Whether this item is a leaf (has no subitems). |
| `text` | `String` | Text representation of the column value. Note: Not all columns support textual v |
| `type` | `ColumnType!` | The column's type. |
| `value` | `JSON` | The column's raw value in JSON format. |

### `Update`

> A comment. Reachable ONLY via `boards{updates}` / root `updates` — no CLI command.

An update.

| Field | Type | Notes |
|---|---|---|
| `id` | `ID!` | The update's unique identifier. |
| `body` | `String!` | The update's html formatted body. |
| `creator_id` | `String` | The unique identifier of the update creator. |
| `edited_at` | `Date!` |  |
| `creator` | `User` | The update's creator. |
| `likes` | `[Like!]!` |  |
| `pinned_to_top` | `[UpdatePin!]!` |  |
| `viewers(limit: Int, page: Int)` | `[Watcher!]!` |  |
| `created_at` | `Date` | The update's creation date. |
| `updated_at` | `Date` | The update's last edit date. |
| `item_id` | `String` | The update's item ID. |
| `original_creation_date` | `String` | The original creation time of the update. |
| `item` | `Item` |  |
| `replies` | `[Reply!]` | The update's replies. |
| `assets` | `[Asset]` | The update's assets/files. |
| `text_body` | `String` | The update's text body. |

### `Reply`

> A threaded reply under an Update.

A reply for an update.

| Field | Type | Notes |
|---|---|---|
| `id` | `ID!` | The reply's unique identifier. |
| `body` | `String!` | The reply's html formatted body. |
| `kind` | `String!` |  |
| `creator_id` | `String` | The unique identifier of the reply creator. |
| `edited_at` | `Date!` |  |
| `creator` | `User` | The reply's creator. |
| `likes` | `[Like!]!` |  |
| `pinned_to_top` | `[UpdatePin!]!` |  |
| `viewers(limit: Int, page: Int)` | `[Watcher!]!` |  |
| `created_at` | `Date` | The reply's creation date. |
| `updated_at` | `Date` | The reply's last edit date. |
| `assets` | `[Asset]` | The reply's assets/files. |
| `text_body` | `String` | The reply's text body. |

### `User`

> Resolve numeric activity-log user_ids through root `users(ids:)`.

A monday.com user.

| Field | Type | Notes |
|---|---|---|
| `id` | `ID!` | The user's unique identifier. |
| `department` | `Department` | The department the user is a member of (if any) |
| `account_id` | `ID!` | The unique identifier of the account the user belongs to. |
| `status` | `UserStatus!` | The activation status of the user. |
| `invitation_method` | `InvitationMethod!` | The method by which the user was added to the account. |
| `serial_number` | `Int` | The user registration sequence number. |
| `is_deleted` | `Boolean!` | Whether the user has been soft-deleted. |
| `photo_url` | `PhotoUrl` | URLs for the user's profile photo in various sizes. |
| `became_active_at` | `ISO8601DateTime` | The date and time when the user became active. |
| `bb_visitor_id` | `ID!` | The BigBrain visitor ID associated with the user. |
| `is_email_confirmed` | `Boolean!` | Whether the user has confirmed their email address. |
| `user_config` | `UserConfig!` | The user's config based on their kind. |
| `email` | `String!` | The user's email address. |
| `name` | `String!` | The user's full name. |
| `kind` | `String!` | The kind of the user. |
| `created_at` | `ISO8601DateTime!` | The user's creation date. |
| `title` | `String!` | The user's title. |
| `phone` | `String` | The user's phone number. |
| `location` | `String` | The user's location. |
| `birthday` | `String` | The user's birthday. |
| `mobile_phone` | `String` | The user's mobile phone number. |
| `country_code` | `String` | The user's country code. |
| `current_language` | `String` | The current user's language |
| `time_zone_identifier` | `String` | The user's timezone identifier. |
| `utc_hours_diff` | `Float` | The user's utc hours difference. |
| `url` | `String!` | The user's profile url. |
| `account` | `Account!` | The user's account. |
| `account_products` | `[AccountProduct!]` | The products the user is assigned to. |
| `custom_field_metas` | `[CustomFieldMetas]` | The custom field metas of the user profile. |
| `custom_field_values` | `[CustomFieldValue]` | The custom field values of the user profile. |
| `enabled` | `Boolean!` | **DEPRECATED** Is the user enabled or not. |
| `encrypt_api_token` | `String` | **DEPRECATED** The token of the user for email to board. |
| `is_admin` | `Boolean` | **DEPRECATED** Is the user an account admin. |
| `is_guest` | `Boolean` | **DEPRECATED** Is the user a guest or not. |
| `is_pending` | `Boolean` | **DEPRECATED** Is the user a pending user |
| `is_verified` | `Boolean` | **DEPRECATED** Is user verified his email. |
| `is_view_only` | `Boolean` | **DEPRECATED** Is the user a view only user or not. |
| `join_date` | `Date` | **DEPRECATED** The date the user joined the account. |
| `last_activity` | `Date` | Last date & time when user was active |
| `out_of_office` | `OutOfOffice` | The user's out of office status. |
| `photo_original` | `String` | **DEPRECATED** The user's photo in the original size. |
| `photo_small` | `String` | **DEPRECATED** The user's photo in small size (150x150). |
| `photo_thumb` | `String` | **DEPRECATED** The user's photo in thumbnail size (100x100). |
| `photo_thumb_small` | `String` | **DEPRECATED** The user's photo in small thumbnail size (50x50). |
| `photo_tiny` | `String` | **DEPRECATED** The user's photo in tiny size (30x30). |
| `sign_up_product_kind` | `String` | **DEPRECATED** The product to which the user signed up to first. |
| `teams(ids: [ID!])` | `[Team]` | The teams the user is a member in. |
| `activity_logs(from: String, to: String, board_ids: [ID!], limit: Int, event_types: [String!], cursor: String)` | `UserActivityLogsPage` | Activity log entries for the user |

### `Account`

> The workspace account.

Your monday.com account

| Field | Type | Notes |
|---|---|---|
| `active_members_count` | `Int` | The number of active member users in the account |
| `country_code` | `String` | The account's country two-letter code in ISO3166 format |
| `created_at` | `Date` | The account's creation date. |
| `first_day_of_the_week` | `FirstDayOfTheWeek!` | The first day of the week for the account (sunday / monday) |
| `id` | `ID!` | The account's unique identifier. |
| `logo` | `String` | The account's logo. |
| `name` | `String!` | The account's name. |
| `plan` | `Plan` | The account's payment plan. |
| `products` | `[AccountProduct]` | The account's active products |
| `show_timeline_weekends` | `Boolean!` | Show weekends in timeline |
| `sign_up_product_kind` | `String` | The product the account signed up to first. |
| `slug` | `String!` | The account's slug. |
| `tier` | `String` | The account's tier. |
| `is_during_trial` | `Boolean` | Is the account during the free trial period |
| `is_trial_expired` | `Boolean` | Is the account's trial expired |

### `Workspace`

> Board container.

A monday.com workspace.

| Field | Type | Notes |
|---|---|---|
| `id` | `ID` | The workspace's unique identifier. |
| `account_product` | `AccountProduct` | The account product that contains workspace. |
| `created_at` | `Date` | The workspace's creation date. |
| `description` | `String` | The workspace's description. |
| `is_default_workspace` | `Boolean` | Returns true if it is the default workspace of the product or account |
| `kind` | `WorkspaceKind` | The workspace's kind (open / closed / template). |
| `name` | `String!` | The workspace's name. |
| `owners_subscribers(limit: Int, page: Int)` | `[User]` | The workspace's user owners. |
| `settings` | `WorkspaceSettings` | The workspace's settings. |
| `state` | `State` | The workspace's state (all / active / archived / deleted). |
| `team_owners_subscribers(limit: Int, page: Int)` | `[Team!]` | The workspace's team owners. |
| `teams_subscribers(limit: Int, page: Int)` | `[Team]` | The teams subscribed to the workspace. |
| `users_subscribers(limit: Int, page: Int)` | `[User]` | The users subscribed to the workspace |

### `ActivityLogType`

> `data` is a JSON STRING — parse it. `created_at` is 17 digits; first 10 = unix seconds.

An activity log event

| Field | Type | Notes |
|---|---|---|
| `account_id` | `String!` |  |
| `created_at` | `String!` |  |
| `data` | `String!` | The item's column values in string form. |
| `entity` | `String!` |  |
| `event` | `String!` |  |
| `id` | `String!` |  |
| `user_id` | `String!` |  |

### `Webhook`

> Board event subscriptions.

Monday webhooks

| Field | Type | Notes |
|---|---|---|
| `board_id` | `ID!` | The webhooks's board id. |
| `config` | `String` | The webhooks's config. |
| `event` | `WebhookEventType!` | The event webhook will listen to |
| `id` | `ID!` | The webhooks's unique identifier. |

### `Doc`

_Not present in this schema version._

### `Tag`

A tag

| Field | Type | Notes |
|---|---|---|
| `color` | `String!` | The tag's color. |
| `id` | `ID!` | The tag's unique identifier. |
| `name` | `String!` | The tag's name. |

### `Team`

A team of users.

| Field | Type | Notes |
|---|---|---|
| `id` | `ID!` | The team's unique identifier. |
| `is_guest` | `Boolean` | Whether the team is a guest team |
| `name` | `String!` | The team's name. |
| `created_at` | `String` | The team's creation date as an ISO 8601 string. |
| `owners(ids: [ID!])` | `[User!]!` | The users who are the owners of the team. |
| `picture_url` | `String` | The team's picture url. |
| `users(emails: [String], ids: [ID!], kind: UserKind, limit: Int, name: String, newest_first: Boolean, non_active: Boolean, page: Int)` | `[User]` | The users in the team. |

### `Asset`

A file uploaded to monday.com

| Field | Type | Notes |
|---|---|---|
| `created_at` | `Date` | The file's creation date. |
| `file_extension` | `String!` | The file's extension. |
| `file_size` | `Int!` | The file's size in bytes. |
| `id` | `ID!` | The file's unique identifier. |
| `name` | `String!` | The file's name. |
| `original_geometry` | `String` | original geometry of the asset. |
| `public_url` | `String!` | public url to the asset, valid for 1 hour. |
| `uploaded_by` | `User!` | The user who uploaded the file. |
| `url` | `String!` | url to view the asset. |
| `url_thumbnail` | `String` | url to view the asset in thumbnail mode. Only available for images. |

### `ComplexityType`

_Not present in this schema version._

### `TriggerEvent`

> One automation RUN. ~9-day retention.

Represents a single automation trigger event

| Field | Type | Notes |
|---|---|---|
| `accountId` | `Int` | Account identifier |
| `triggerUuid` | `String` | Trigger UUID |
| `eventKind` | `String` | Kind of the event |
| `eventState` | `String` | Current state of the event |
| `triggerStarted` | `Float` | Timestamp (epoch) when trigger started |
| `triggerStartedAt` | `ISO8601DateTime` | Date when trigger started |
| `createdAt` | `ISO8601DateTime` | Creation time of the record |
| `errorReason` | `String` | Error reason if the event failed |
| `billingActionsCount` | `Int` | Number of billing actions counted for this trigger |
| `waitingForTriggerName` | `String` | Waiting trigger name, when applicable |
| `triggerDuration` | `Float` | Duration of the trigger in milliseconds |
| `entityKind` | `String` | Entity kind for the trigger (item / subitem / etc.) |
| `reignitionSubscriptionId` | `String` | Reignition subscription ID if trigger was reignited |
| `hostType` | `String` | Host type on which the automation is executed |
| `hostInstanceId` | `String` | Host instance ID |
| `creatorAppFeatureReferenceId` | `String` | Original creator feature reference ID |
| `is_test_run` | `Boolean` | Whether the trigger was fired as part of a test run |

### `BoardAutomation`

> Recipe definition — ONLY in 2027-01+, and empty without an automations scope.

A board automation

| Field | Type | Notes |
|---|---|---|
| `id` | `ID` | Automation ID |
| `user_id` | `ID` | Creator user ID |
| `active` | `Boolean` | Whether the automation is active |
| `title` | `String` | Automation title |
| `description` | `String` | Automation description |
| `created_at` | `String` | Creation timestamp |
| `updated_at` | `String` | Last update timestamp |
| `workflow_host_data` | `JSON` | Host data (board ID and type) |
| `workflow_blocks` | `JSON` | Workflow block definitions |
| `workflow_variables` | `JSON` | Workflow variable definitions |
| `importance` | `Int` | Automation importance level |
| `notice_message` | `String` | Notice message for the automation |
| `template_reference_id` | `ID` | Template reference ID if created from template |

## Complete type index

All 1291 types at 2026-07. Introspect any one with:

```graphql
query { __type(name:"Board") { fields { name type { name kind ofType { name } } } } }
```

### ENUM (275)

`Action`, `ActivateUsersErrorCode`, `ActivityGroupBy`, `AgentActivityRunStatus`, `AgentMembershipRole`, `AgentSubscriberKind`, `AggregateFromElementType`, `AggregateSelectElementType`, `AggregateSelectFunctionName`, `AiColumnEntity`, `AiColumnImproverLength`, `AiColumnLanguage`, `AiColumnOutputLength`, `AiColumnRefinementLevel`, `AiColumnSource`, `AiColumnTone`, `AiModel`, `AllowedFileMime`, `ApiAppUserMappingKind`, `AppAuditKind`, `AppFeatureRelationKind`, `AppFeatureReleaseKind`, `AppFeatureTypeE`, `AppKind`, `AppPermission`, `AppStatus`, `AppVersionStatus`, `ArtifactGenerationStatus`, `ArtifactState`, `AssetCaptionStatus`, `AssetsSource`, `AssignTeamOwnersErrorCode`, `AttributionEntity`, `BaseRoleName`, `BlockAlignment`, `BlockDirection`, `BoardAccessLevel`, `BoardAttributes`, `BoardBasicRoleName`, `BoardEditPermissions`, `BoardHierarchy`, `BoardKind`, `BoardMuteState`, `BoardObjectType`, `BoardPermission`, `BoardSubscriberKind`, `BoardUsage`, `BoardViewAccessLevel`, `BoardViewPermissions`, `BoardViewTypeValues`, `BoardsOrderBy`, `BuildingBlock`, `BulkImportFailureReason`, `BulkImportState`, `CalculatedFunction`, `CampaignsAnalyticsEventKind`, `CampaignsBrandColorKind`, `CampaignsBrandImageKind`, `CampaignsBrandImageStatus`, `CampaignsInsightClassificationKind`, `CampaignsInsightStatusKind`, `CampaignsScheduleKind`, `CampaignsSortField`, `CampaignsSortOrder`, `CampaignsStatusKind`, `CanOverrideField`, `ChannelEditableStatus`, `ChannelType`, `ChatMessageKind`, `ChatModeKind`, `ChatSender`, `ColumnActiveStateAction`, `ColumnCapability`, `ColumnProperty`, `ColumnType`, `ConditionOperator`, `ConnectedItemColumnFormat`, `CreateAppModeInput`, `CreateTaskStatus`, `CreateUserInvitationMethod`, `CrudAccessLevel`, `CustomActivityColor`, `CustomActivityIcon`, `CustomizableBoardSettings`, `DashboardKind`, `DataViewAuthorizationKind`, `DataViewSourceKind`, `DeactivateUsersErrorCode`, `DependencyRelatedColumnTypes`, `DependencyRelation`, `DirectoryResourceAttribute`, `DirectoryResourceKind`, `DiscountPeriod`, `DocBlockContentType`, `DocKind`, `DocsMention`, `DocsOrderBy`, `DuplicateBoardType`, `DuplicateType`, `EffortKind`, `EffortUnit`, `ExportFailureReason`, `ExportFormat`, `ExportJobStatus`, `ExternalProvider`, `ExternalWidget`, `FeedbackSentiment`, `FieldTypeRelationType`, `FieldTypeState`, `FileColumnValue`, `FileLinkValueKind`, `FilterMode`, `FirstDayOfTheWeek`, `FolderColor`, `FolderCustomIcon`, `FolderFontWeight`, `FormAlignment`, `FormBackgrounds`, `FormDirection`, `FormFontSize`, `FormFormat`, `FormLayoutStyle`, `FormLogoPosition`, `FormLogoSize`, `FormQuestionPrefillAccountLookups`, `FormQuestionPrefillSources`, `FormQuestionSelectDisplay`, `FormQuestionSelectOrderByOptions`, `FormQuestionType`, `GovernanceRisk`, `GraphqlMondayObject`, `GreetingType`, `GroupAttributes`, `GroupByResourceAttribute`, `GroupOperator`, `HeaderFormat`, `HostEntityType`, `HostType`, `InvitationMethod`, `InviteUsersErrorCode`, `ItemsOrderByDirection`, `ItemsQueryOperator`, `ItemsQueryRuleOperator`, `JobState`, `Kind`, `LLMModelInput`, `ListBlock`, `ListType`, `MagicProductKind`, `ManagedColumnState`, `ManagedColumnTypes`, `MeetingAccess`, `MeetingAccessFilter`, `MeetingSearchAccess`, `MentionType`, `MessageKind`, `MessageSenderType`, `MessageType`, `MessageTypeInput`, `MirrorCalc`, `MirrorSum`, `MondayDataSourceType`, `NonImportableColumns`, `NoticeBoxTheme`, `NotificationTargetType`, `NumberValueUnitDirection`, `ObjectSchemaAction`, `ObjectState`, `ObjectType`, `Occur`, `OnMatchBehaviour`, `OperationStatus`, `OrderBy`, `PeopleColumnFormat`, `PlannerResourceKind`, `PositionRelative`, `PrimitiveTypes`, `PrivacyKind`, `Product`, `PromptSuggestionFor`, `PromptSuggestionPlatform`, `PublishedCommunityAppsSortBy`, `RelationDirection`, `RelationKind`, `RemoveTeamOwnersErrorCode`, `RepositorySource`, `RerankingStrategy`, `ResourceAttributeTypeKey`, `ResourceType`, `RestoreStatus`, `RuleOperator`, `RunOnceSource`, `ScopeType`, `Search`, `SearchField`, `SearchStrategy`, `SequenceContext`, `SequenceStatus`, `SharedTemplateKind`, `SharedTemplateStatus`, `SnapshotStatus`, `SortDirection`, `SortOrder`, `SprintSnapshotKind`, `SprintState`, `State`, `StatusCalculatedFunction`, `StatusColumnColors`, `SubscriberKind`, `SubscriptionDiscountModelType`, `SubscriptionDiscountType`, `SubscriptionPeriodType`, `SubscriptionStatus`, `TargetObject`, `TaskAction`, `TaskIngestionSource`, `TaskStatus`, `TemplateInstallationStatus`, `TemplateType`, `TextBlock`, `TimeGranularity`, `TimeOffEntryKind`, `TimelineItemKind`, `TimelineItemProductKind`, `ToolCallDecision`, `TransformationType`, `TriggerEventState`, `UpdatableUserStatus`, `UpdateEmailDomainErrorCode`, `UpdateUserAttributesErrorCode`, `UpdateUsersRoleErrorCode`, `UserCreationFlow`, `UserKind`, `UserKindFilter`, `UserKindValue`, `UserPermitScopeKind`, `UserRequestKind`, `UserRole`, `UserStatus`, `UsersSortDirection`, `UsersSortField`, `UtilizationDenominator`, `ValidationErrorType`, `ValidationsEntityType`, `VersionKind`, `VibeAggregateFn`, `VibeAppSearchScope`, `VibeAppSearchSortField`, `VibeAppSortField`, `VibeAppState`, `VibeAppStatus`, `VibeAppVersionStatus`, `VibeAppVisitKind`, `VibeFilterOp`, `VibeMemoryScopeKind`, `VibePublishedStatusFilter`, `VibeSortDir`, `VibeVariant`, `ViewContext`, `ViewKind`, `ViewMutationKind`, `WebhookEventType`, `WeekDay`, `WidgetParentKind`, `WidgetStatus`, `WorkflowBlockKind`, `WorkflowBuilderPrivacyKind`, `WorkflowCutoffNode`, `WorkflowTemplateContext`, `WorkflowVariableSourceKind`, `WorkspaceKind`, `WorkspaceMembershipKind`, `WorkspaceSubscriberKind`, `WorkspacesOrderBy`, `WorkspacesQueryAccountProductKind`

### INPUT_OBJECT (285)

`AccountTriggerStatisticsFiltersInput`, `AccountTriggersByEntityIdFiltersInput`, `AggregateFromTableInput`, `AggregateGroupByElementInput`, `AggregateQueryInput`, `AggregateSelectColumnInput`, `AggregateSelectElementInput`, `AggregateSelectFunctionInput`, `AiColumnExtraSettingsInput`, `AiColumnPersonGroupInput`, `AllocatedResourceInput`, `AllocationToResourceInput`, `AllocationUpdateInput`, `AppFeatureReleaseDataInput`, `AppFeatureReleaseInput`, `AssetCompletePartInput`, `AssetCompleteUploadInput`, `AssignTimeOffInput`, `AssignWorkScheduleInput`, `AttributesInput`, `BlotInput`, `BoardAutomationCreateInput`, `BoardDataSourceInput`, `BoardRelationColumnDefaultsInput`, `BoolInput`, `BoostConfigurationInput`, `BuildConfigInput`, `BuildSettingsInput`, `CalculatedCapabilityInput`, `ChatMessageComponentReferenceInput`, `ChatMessageFileInput`, `ChatMessagePaginationInput`, `ClauseInput`, `ColumnCapabilitiesInput`, `ColumnMappingInput`, `ColumnPolicyInput`, `ColumnPropertyInput`, `ColumnStyleInput`, `ColumnsConfigInput`, `ColumnsMappingInput`, `ConnectCustomAgentInput`, `ConnectExternalAgentInput`, `ConnectExternalAgentSyncInput`, `ConnectedBoardColumnMappingInput`, `ConnectedBoardInput`, `ConvertBoardToProjectInput`, `CountryAnswerInput`, `CreateAppFeatureRelationInput`, `CreateAppInput`, `CreateBlockInput`, `CreateDepartmentDataInput`, `CreateDocBoardInput`, `CreateDocInput`, `CreateDocWorkspaceInput`, `CreateDropdownColumnSettingsInput`, `CreateDropdownLabelInput`, `CreateFavoriteInput`, `CreateFormTagInput`, `CreateMarketplaceAppDiscountInput`, `CreateObjectSchemaColumnInput`, `CreateObjectSchemaColumnsActionInput`, `CreateProjectInput`, `CreatePtoEntryInput`, `CreateQuestionInput`, `CreateStatusColumnSettingsInput`, `CreateStatusLabelInput`, `CreateTaskInput`, `CreateTeamAttributesInput`, `CreateTeamOptionsInput`, `CreateTimeOffEntryInput`, `CreateTimeOffInput`, `CreateUserInput`, `CreateWorkScheduleInput`, `CreateWorkflowFromTemplateInput`, `CredentialsCreatedInput`, `CrossEntityDateRangeInput`, `DataSourceInput`, `DataViewAuthorizationObjectInput`, `DataViewColumnInput`, `DataViewColumnMappingInput`, `DataViewSourceIdInput`, `DataViewSourceInput`, `DataViewTargetInput`, `DateAnswerInput`, `DateRangeAnswerInput`, `DateRangeInput`, `DeleteFavoriteInput`, `DeleteFormTagInput`, `DeleteObjectSchemaColumnsActionInput`, `DependencyPulseValueInput`, `DependencyRelatedValueInput`, `DependencyValueInput`, `DisMaxInput`, `DisabledReasonInput`, `DividerBlockInput`, `DocsColumnValueInput`, `DropdownSettingsOverridesInput`, `DynamicPosition`, `EnrollToSequenceInput`, `EntityIdMappingInput`, `ExportOptionsInput`, `FieldInput`, `FieldTextInput`, `FieldTextListInput`, `FileAnswerInput`, `FileInput`, `FormAccessibilityInput`, `FormAfterSubmissionViewInput`, `FormAiTranslateInput`, `FormAnswerInput`, `FormAppearanceInput`, `FormBackgroundInput`, `FormCloseDateInput`, `FormDraftSubmissionInput`, `FormFeaturesInput`, `FormLayoutInput`, `FormLogoInput`, `FormMondayInput`, `FormPasswordInput`, `FormPreSubmissionViewInput`, `FormQuestionSettingsInput`, `FormRedirectAfterSubmissionInput`, `FormRequireLoginInput`, `FormResponseLimitInput`, `FormStartButtonInput`, `FormSubmitButtonInput`, `FormTextInput`, `FuzzyInput`, `GetBlocksInput`, `GrantMarketplaceAppDiscountData`, `GroupByColumnConfigInput`, `GroupByConditionInput`, `GroupBySettingsInput`, `GroupBySortSettingsInput`, `GroupInput`, `HierarchyObjectIDInputType`, `HostTargetInput`, `HourAnswerInput`, `ImageBlockInput`, `InsertOpsInput`, `InstallAppInput`, `IntegrationBlockReferenceInput`, `InternalCallbackInput`, `ItemNicknameInput`, `ItemsPageByColumnValuesQuery`, `ItemsQuery`, `ItemsQueryGroup`, `ItemsQueryOrderBy`, `ItemsQueryRule`, `LayoutBlockInput`, `LifecycleEventInput`, `ListBlockInput`, `LocationAnswerInput`, `LocationCityInput`, `LocationCountryInput`, `LocationStreetInput`, `LocationStreetNumberInput`, `MagicSolutionFileInput`, `MaxEntitiesPerTypeInput`, `MeetingSearchFieldsInput`, `MeetingsDateRangeInput`, `MeetingsFilterInput`, `MentionInput`, `MetadataInput`, `MirrorColumnDefaultsInput`, `MirrorDisplayedLinkedColumnInput`, `ModifyMagicSolutionInternalCallbackInput`, `MondayAssetDocumentSourceInput`, `NoticeBoxBlockInput`, `ObjectDynamicPositionInput`, `ObjectRelationInput`, `ObjectSchemaActionInput`, `OnMatchInput`, `OperationInput`, `PageBreakBlockInput`, `PaginationInput`, `PayloadInput`, `PersonsInput`, `PhoneAnswerInput`, `PhonePrefixPredefinedInput`, `PolicyMessagesInput`, `PortfolioResourcesInput`, `PortfolioResourcesSearchInput`, `PortfolioUtilizationReportInput`, `PrefillSettingsInput`, `ProcessEventsInput`, `QuestionOptionInput`, `QuestionOrderInput`, `RangeInput`, `RemoteOptionsInput`, `RuleConstraintInput`, `RunPromptConfigInput`, `SearchDateRangeInput`, `SearchDateRangeLegacyInput`, `SendMessageInput`, `SetFormPasswordInput`, `ShowIfConditionInput`, `ShowIfRuleInput`, `ShowIfRulesInput`, `SqlDescribeSourceInput`, `StatusCalculatedCapabilityInput`, `StatusColumnCapabilitiesInput`, `SubitemAnswerInput`, `TableBlockInput`, `TableViewSettingsInput`, `TagInput`, `TextBlockInput`, `ThemeDefinitionInput`, `ThemeInput`, `TimeOffEntryInput`, `TimeRangeInput`, `TimelineDateInput`, `TimelineItemTimeRange`, `ToggleReactionInput`, `ToolCallResponseInput`, `ToolFieldsConfiguredInput`, `TriggerEventsFiltersInput`, `UpdateAppFeatureInput`, `UpdateAppInput`, `UpdateBoardHierarchyAttributesInput`, `UpdateBoardInferredMetadataInput`, `UpdateBoardManualMetadataInput`, `UpdateCustomAgentInput`, `UpdateDepartmentOptionsInput`, `UpdateDependencyColumnInput`, `UpdateDropdownColumnSettingsInput`, `UpdateDropdownLabelInput`, `UpdateEmailDomainAttributesInput`, `UpdateFormInput`, `UpdateFormSettingsInput`, `UpdateFormTagInput`, `UpdateLifecycleSubscriptionsInput`, `UpdateMention`, `UpdateObjectHierarchyPositionInput`, `UpdateObjectInput`, `UpdateObjectSchemaColumnInput`, `UpdateObjectSchemaColumnsActionInput`, `UpdateOverviewHierarchyAttributesInput`, `UpdatePtoEntryInput`, `UpdateQuestionInput`, `UpdateStatusColumnSettingsInput`, `UpdateStatusLabelInput`, `UpdateTaskInput`, `UpdateTimeOffEntryInput`, `UpdateTimeOffInput`, `UpdateUserInput`, `UpdateUserProfilePictureInput`, `UpdateWidgetsSurfaceInput`, `UpdateWorkScheduleInput`, `UpdateWorkflowFromTemplateInput`, `UpdateWorkflowInput`, `UpdateWorkflowMetadataInput`, `UpdateWorkspaceAttributesInput`, `UserAttributesInput`, `UserKindFilterInput`, `UserPermitScopeInput`, `UserUpdateInput`, `UsersSortInput`, `UtilizationReportInput`, `ValidationRuleInput`, `VibeAppConfigInput`, `VibeAppSearchSortInput`, `VibeAppSortInput`, `VibeBatchOpInput`, `VibeCodeVersionWhereInput`, `VibeFilterInput`, `VibeOrderByInput`, `VideoBlockInput`, `WebSearchConfigInput`, `WebSearchOptionsInput`, `WidgetParentInput`, `WorkScheduleDayInput`, `WorkflowAutomationsPaginationInput`, `WorkflowBlockCredentialFieldInput`, `WorkflowBlockFieldInput`, `WorkflowBlockInput`, `WorkflowCustomizationInput`, `WorkflowHostDataInput`, `WorkflowInput`, `WorkflowIteratorInput`, `WorkflowTemplateInput`, `WorkflowTemplateWorkflowBlockFieldInput`, `WorkflowTemplateWorkflowBlockInput`, `WorkflowsPaginationInput`, `WorkspacesQueryInput`

### INTERFACE (5)

`ColumnValue`, `DocBaseBlockContent`, `FieldType`, `InputFieldConfig`, `OutputFieldConfig`

### OBJECT (702)

`Account`, `AccountAvailabilityDefaults`, `AccountContext`, `AccountProduct`, `AccountRole`, `AccountTriggerStatistics`, `AccountTriggersByEntityId`, `ActionItem`, `ActivateUsersError`, `ActivateUsersResult`, `ActivateWorkflowResult`, `ActivityLog`, `ActivityLogInternalQueries`, `ActivityLogQueries`, `ActivityLogType`, `ActivityLogsPage`, `AddAllocationsToResourcesResponse`, `AddedAllocatedResource`, `Agent`, `AgentActivityRun`, `AgentActivityRunsConnection`, `AgentActivityStep`, `AgentSubscriber`, `AggregateBasicAggregationResult`, `AggregateGroupByResult`, `AggregateQueryResult`, `AggregateResultEntry`, `AggregateResultSet`, `AiActionResponse`, `AiColumnRemoveResult`, `AiColumnResult`, `AiDocumentActionResponse`, `AllocatedResource`, `AllocatedResourceOperationResult`, `Allocation`, `AllocationEffort`, `AllocationResource`, `AllocationTimeline`, `AllocationToResourceResult`, `ApiAppUserMapping`, `AppAudit`, `AppDeletionResponse`, `AppDocumentationAiResponse`, `AppFeatureRelation`, `AppFeatureType`, `AppInstall`, `AppInstallAccount`, `AppInstallPermissions`, `AppInstallUser`, `AppMonetizationStatus`, `AppSubscription`, `AppSubscriptionDetails`, `AppSubscriptionOperationsCounter`, `AppSubscriptions`, `AppType`, `AppVersion`, `AppsMonetizationInfo`, `Article`, `ArticleBlock`, `ArticleMetadata`, `Artifact`, `ArtifactAsset`, `ArtifactRun`, `Asset`, `AssetPartUrl`, `AssetSizeRange`, `AssetUploadResult`, `AssignDepartmentMembersResult`, `AssignDepartmentOwnerResult`, `AssignTeamOwnersError`, `AssignTeamOwnersResult`, `AssignTimeOffResult`, `AssignTimeOffTeamResult`, `AssignTimeOffUserResult`, `AssignWorkScheduleResult`, `AssignWorkScheduleTeamResult`, `AssignWorkScheduleUserResult`, `AssignedBoard`, `AsyncJobResult`, `AsyncJobStatus`, `Attribute`, `Attributes`, `AuditEventCatalogueEntry`, `AuditLogEntry`, `AuditLogPage`, `AutomationsPage`, `BaseFieldType`, `BatchExtendTrialPeriod`, `BatchUndoResult`, `BatteryValue`, `BatteryValueItem`, `BillingCycleDates`, `Block`, `BlockChanges`, `BlockContextData`, `BlockEvent`, `BlockEventsPage`, `BlocksResult`, `Board`, `BoardAutomation`, `BoardAutomationCreateResult`, `BoardAutomationDeleteResult`, `BoardConnection`, `BoardDependencies`, `BoardDuplication`, `BoardEnhancementResult`, `BoardGraphExport`, `BoardIdMapping`, `BoardInferredMetadata`, `BoardManualMetadata`, `BoardMuteSettings`, `BoardPreview`, `BoardPromptSuggestions`, `BoardRelationConnectedBoardsResult`, `BoardRelationValue`, `BoardView`, `BoardViewPermission`, `BulkDeleteInit`, `BulkDetachBoardResult`, `BulkImportInit`, `BulkImportItemCounts`, `BulkImportStatus`, `ButtonValue`, `CalculatedCapability`, `CampaignsAdditionalQuota`, `CampaignsAnalyticsEvent`, `CampaignsAnalyticsEventsResponse`, `CampaignsAnalyticsSummary`, `CampaignsBrandColor`, `CampaignsBrandImage`, `CampaignsBrandKit`, `CampaignsCompanyInformation`, `CampaignsContactsBoard`, `CampaignsEmailCampaign`, `CampaignsFacets`, `CampaignsInsight`, `CampaignsInsightFacets`, `CampaignsInsightSourceFacet`, `CampaignsInsightStatusFacet`, `CampaignsInsightTypeFacet`, `CampaignsPhysicalAddress`, `CampaignsSegment`, `CampaignsSettings`, `CampaignsStatusFacet`, `CampaignsUnsubscribeFooter`, `CampaignsUnsubscribePage`, `CampaignsUsage`, `CampaignsUsageForDomain`, `CampaignsUsageKey`, `CampaignsUserFacet`, `Cell`, `ChangeTeamMembershipsResult`, `ChangeWorkflowOwnerResult`, `ChatMessage`, `ChatMessageComponentReference`, `ChatMessageFile`, `ChatMessageIntegrationBlock`, `CheckboxValue`, `ChildBoardDataViewSource`, `ClaudeProviderData`, `ClearUsersDepartmentResult`, `CodeFile`, `ColorPickerValue`, `Column`, `ColumnCapabilities`, `ColumnChange`, `ColumnStyle`, `Complexity`, `ConnectExternalAgentPayload`, `ConnectExternalAgentResult`, `ConnectMigrationJobResult`, `ConnectProjectResult`, `ConnectedBoardPermission`, `ConnectedColumnItem`, `ConnectedTargetColumn`, `Connection`, `ConvertBoardToProjectResult`, `ConvertColumnsToAiResult`, `Country`, `CountryValue`, `CreateApiUserResult`, `CreateAppResponse`, `CreateBoardViewPreBuiltResult`, `CreateEntitySnapshotResult`, `CreateFavoriteResultType`, `CreateMagicSolutionPayload`, `CreateMarketplaceAppDiscount`, `CreateMarketplaceAppDiscountResult`, `CreateMigrationJobResult`, `CreateMultipleUsersResult`, `CreatePortfolioResult`, `CreateProjectResult`, `CreateServiceUserResult`, `CreateWorkflowResult`, `CreationLogValue`, `CredentialsCreatedResult`, `CurrentPublicTemplateLinkResult`, `CursorPaginatedConnectedColumnsResult`, `CustomActivity`, `CustomFieldMetas`, `CustomFieldValue`, `CustomInputFieldConfig`, `CustomOutputFieldConfig`, `DailyAnalytics`, `DailyLimit`, `DailyLimitAddon`, `Dashboard`, `DashboardDataResult`, `DashboardPreview`, `DataView`, `DataViewAuthorizationObject`, `DataViewAutomapping`, `DataViewAutomappingSources`, `DataViewColumn`, `DataViewColumnLevelError`, `DataViewColumnMapping`, `DataViewPaginatedSources`, `DataViewPaginationMetadata`, `DataViewSourceColumn`, `DataViewSourceId`, `DataViewTarget`, `DateValue`, `DeactivateUsersError`, `DeactivateUsersResult`, `DeactivateWorkflowResult`, `DehydratedFormResponse`, `DeleteAllocationResponse`, `DeleteEntityIdMappingsResult`, `DeleteFavoriteInputResultType`, `DeleteMarketplaceAppDiscount`, `DeleteMarketplaceAppDiscountResult`, `DeletePlannerResourceResponse`, `DeleteWorkflowResult`, `DeletedDocBlock`, `Department`, `DependencyColumnConfig`, `DependencyColumnConfigResult`, `DependencyConfig`, `DependencyEdge`, `DependencyField`, `DependencyLink`, `DependencyValue`, `DeploymentResult`, `DetachWorkflowsFromTemplateResult`, `DeveloperAppVersion`, `DiffBlock`, `DirectDocValue`, `DirectoryResource`, `DirectoryResourcesResponse`, `DisconnectExternalAgentPayload`, `DividerContent`, `DocBlocksFromMarkdownResult`, `DocObjectLink`, `DocRestoringPoint`, `DocValue`, `DocVersionDiff`, `DocVersionHistory`, `DocsColumnValue`, `Document`, `DocumentBlock`, `DocumentBlockIdOnly`, `DocumentBlockV2`, `DropdownColumnSettings`, `DropdownLabel`, `DropdownManagedColumn`, `DropdownValue`, `DropdownValueOption`, `Effort`, `EmailTimelineItemMetadata`, `EmailValue`, `EnhancedPromptResult`, `EnrollToSequenceResult`, `EntityDataViewSource`, `Error`, `Event`, `EventCountsResult`, `EventsExport`, `ExportAsyncJob`, `ExportBoardResult`, `ExportJobStatusInfo`, `ExportMarkdownResult`, `ExtendTrialPeriod`, `FailedUserBoardRoleUpdate`, `FailedUserProfilePicture`, `FieldInformation`, `FieldTypeImplementation`, `FileAssetInvalidValue`, `FileAssetValue`, `FileDocValue`, `FileLinkValue`, `FileUploadUrl`, `FileValue`, `Folder`, `FormAccessibility`, `FormAfterSubmissionView`, `FormAiTranslate`, `FormAppearance`, `FormBackground`, `FormCloseDate`, `FormDraftSubmission`, `FormFeatures`, `FormLayout`, `FormLogo`, `FormMonday`, `FormPassword`, `FormPreSubmissionView`, `FormPreview`, `FormQuestion`, `FormQuestionOption`, `FormQuestionSettings`, `FormRedirectAfterSubmission`, `FormRequireLogin`, `FormResponseLimit`, `FormShortenedLink`, `FormStartButton`, `FormSubmissionResult`, `FormSubmitButton`, `FormTag`, `FormText`, `FormulaValue`, `GenerateMarketplaceTemplateResult`, `GeneratePublicTemplateLinkResult`, `GenerateRemixLinkResult`, `GetAllocationsResponse`, `GetAttributesResponse`, `GetEntitiesForMigrationResult`, `GetRestoresQueryResults`, `GetSnapshotsQueryResults`, `GrantMarketplaceAppDiscount`, `GrantMarketplaceAppDiscountResult`, `GraphqlFolder`, `GraphqlHierarchyObjectItem`, `Group`, `GroupCountBucket`, `GroupValue`, `HierarchyObjectID`, `HourValue`, `ImageContent`, `ImportDocFromHtmlResult`, `InputFieldConstraints`, `InsertOps`, `InspirationItem`, `InstallAppResponse`, `InstallFromPublicTemplateLinkResult`, `InstallFromRemixResult`, `Instance`, `IntegrationExecutionResult`, `IntegrationValue`, `IntegrationVariable`, `Intelligence`, `InterfaceInputFieldConfig`, `InviteUsersError`, `InviteUsersResult`, `Item`, `ItemDependency`, `ItemDescription`, `ItemIdValue`, `ItemsJobItemCounts`, `ItemsJobStatus`, `ItemsResponse`, `KnowledgeBaseAnswer`, `LastUpdatedValue`, `LayoutContent`, `LifecycleSubscriptionKind`, `Like`, `LinkValue`, `ListBlockContent`, `LiteBuilderContextData`, `LiveWorkflowAutomationsPage`, `LiveWorkflowsPage`, `LiveWorkflowsPageInfo`, `LocationValue`, `LongTextValue`, `LookupNamespace`, `MagicSolutionFileError`, `ManagedColumn`, `MarketplaceAppDiscount`, `Meeting`, `MeetingsResponse`, `Mention`, `Message`, `MessagesPage`, `MigratedEntityIdMappingsResult`, `MigrationProgress`, `MirrorValue`, `MirroredItem`, `ModifyMagicSolutionPayload`, `MondayAgentsContextData`, `Mutation`, `MyTaskBoardResponse`, `MyTasksResponse`, `NextPageRequestData`, `Note`, `NoteData`, `NotetakerQueries`, `NoticeBoxContent`, `Notification`, `NotificationSetting`, `NotificationSettingChannel`, `NotificationV2`, `NumbersValue`, `Object`, `ObjectOperationResponse`, `ObjectRelation`, `ObjectSchema`, `ObjectSchemaActionResult`, `ObjectSchemaColumn`, `ObjectSchemaColumnPolicy`, `ObjectSchemaColumnTags`, `ObjectTypeUniqueKey`, `OngoingProgress`, `Operation`, `Option`, `OutOfOffice`, `OutputFieldConstraints`, `Overview`, `PageBreakContent`, `PageInfo`, `PaginatedConnectedBoards`, `Pagination`, `Participant`, `PeopleEntity`, `PeopleValue`, `PersonValue`, `PhonePrefixPredefined`, `PhoneValue`, `PhotoUrl`, `Plan`, `PlatformApi`, `PlatformApiDailyAnalyticsByApp`, `PlatformApiDailyAnalyticsByDay`, `PlatformApiDailyAnalyticsByUser`, `PortfolioNoConnectedProjects`, `PortfolioResource`, `PrefillSettings`, `PrimitiveFieldType`, `PrimitiveInputFieldConfig`, `PrimitiveOutputFieldConfig`, `PriorityPromptResponse`, `ProcessingNode`, `ProgressResult`, `ProgressValue`, `PromptSuggestion`, `ProviderResource`, `PtoEntry`, `PublicTemplateLinkPreviewResult`, `PublishedCommunityAppsResult`, `Query`, `QueueMessageResponse`, `QueuedMessage`, `QueuedMessageFile`, `RatingValue`, `ReactionSummary`, `RecentVibeApp`, `ReconciliationResult`, `RelevantBoard`, `RelevantDoc`, `RelevantPerson`, `RelevantPromptSuggestion`, `RemoteOptionsResponse`, `RemoveTeamOwnersError`, `RemoveTeamOwnersResult`, `Reply`, `RequiredColumns`, `ResourceAttributeTypeInfo`, `ResourcesAvailability`, `ResponseForm`, `RestoreEntityResult`, `RestoreHistoryEntry`, `RestoringPointAgentAttribution`, `Risk`, `RollbackRestoreMutationResult`, `RollbackSnapshotMutationResult`, `RunPromptResult`, `RunWorkflowOnceResult`, `SaveWorkflowAsTemplateResult`, `SaveWorkspaceAsTemplateResponse`, `SearchBenchmarkResults`, `SearchBoardResult`, `SearchBoardResults`, `SearchDocResult`, `SearchDocResults`, `SearchIndexedBoard`, `SearchIndexedDoc`, `SearchIndexedItem`, `SearchIndexedMeeting`, `SearchIndexedOverview`, `SearchIndexedTimelineItem`, `SearchIndexedUpdate`, `SearchIndexedUser`, `SearchIndexedWorkspace`, `SearchItemResult`, `SearchItemResults`, `SearchMeetingResult`, `SearchMeetingResults`, `SearchNamespace`, `SearchOverviewResult`, `SearchOverviewResults`, `SearchTimelineItemResult`, `SearchTimelineItemResults`, `SearchUpdateResult`, `SearchUpdateResults`, `SearchUserResult`, `SearchUserResults`, `SearchWorkspaceResult`, `SearchWorkspaceResults`, `Sequence`, `ServiceUser`, `ServiceUserToken`, `SetBoardPermissionResponse`, `SharedTemplate`, `SnapshotHistoryEntry`, `SnapshottableBoard`, `SnapshottableBoardConnection`, `SnapshottableOverview`, `SnapshottableOverviewConnection`, `SnapshottableWorkspace`, `SnippetSearchResult`, `Solution`, `Sprint`, `SprintSnapshot`, `SprintSnapshotColumnMetadata`, `SprintSnapshotItem`, `SprintSnapshotItemColumnValue`, `SprintTimeline`, `StandaloneBoardDataViewSource`, `StatusColumnSettings`, `StatusLabel`, `StatusLabelStyle`, `StatusManagedColumn`, `StatusValue`, `StopWorkflowRunOnceResult`, `StructurePreview`, `SubfieldsFieldType`, `SubscribeTeamsToAgentResult`, `SubscribeUsersToAgentResult`, `SubscriptionDiscount`, `SubtasksValue`, `SuccessResponse`, `SuggestedAgent`, `SuggestedTrigger`, `TableContent`, `TableRow`, `Tag`, `TagsValue`, `TalkingPoint`, `TargetSchemaGroup`, `Task`, `TaskDecisionChangelogEvent`, `Team`, `TeamAssignment`, `TeamValue`, `Template`, `TemplateInstallationStatusResult`, `TextBlockContent`, `TextValue`, `ThreadSessionMetadata`, `TimeBucket`, `TimeOff`, `TimeOffDeleteResult`, `TimeOffEntry`, `TimeOffEntryDeleteResult`, `TimeOffEntryResult`, `TimeOffResult`, `TimePeriodHeader`, `TimeTrackingHistoryItem`, `TimeTrackingValue`, `TimelineItem`, `TimelineItemsPage`, `TimelineResponse`, `TimelineValue`, `TimesOffPage`, `ToggleReactionResult`, `TokenUsage`, `ToolEvent`, `ToolEventsPage`, `ToolFieldsConfiguredResult`, `Topic`, `TranscriptEntry`, `TransferAgentOwnershipResult`, `TransitionToExternalEligibility`, `TriggerEvent`, `TriggerEventsPage`, `UnassignDepartmentOwnerResult`, `UncreatedUser`, `UndoResult`, `UnsubscribeTeamsFromAgentResult`, `UnsubscribeUsersFromAgentResult`, `UnsupportedValue`, `UnupdatedUser`, `Update`, `UpdateAllocationResult`, `UpdateBoardHierarchyResult`, `UpdateBoardInferredMetadataResult`, `UpdateBoardManualMetadataResult`, `UpdateCustomAgentPayload`, `UpdateDirectoryResourceAttributesResponse`, `UpdateEmailDomainError`, `UpdateEmailDomainResult`, `UpdateFavoriteResultType`, `UpdateMarketplaceDataResult`, `UpdateOverviewHierarchy`, `UpdatePin`, `UpdatePriorityPromptResponse`, `UpdateUserAttributesError`, `UpdateUserAttributesResult`, `UpdateUsersBoardRoleResponse`, `UpdateUsersProfilePictureResult`, `UpdateUsersResult`, `UpdateUsersRoleError`, `UpdateUsersRoleResult`, `UpdateWorkflowResult`, `UpdatesPage`, `UploadJobInit`, `UploadedFile`, `UpsertEntityIdMappingsResult`, `User`, `UserActivityLogsPage`, `UserAssignment`, `UserConfig`, `UserContext`, `UserContextResponse`, `UserFeedback`, `UserPermit`, `UserPermitReasonContext`, `UserPermits`, `UserPermitsScope`, `UserPto`, `UserRequest`, `UtilizationRatios`, `UtilizationReportGroup`, `UtilizationReportGrouped`, `UtilizationReportProjectBreakdown`, `UtilizationReportResource`, `UtilizationReportUngrouped`, `ValidationRule`, `Validations`, `Version`, `VibeAggregateBucket`, `VibeApp`, `VibeAppAccess`, `VibeAppConfig`, `VibeAppCounts`, `VibeAppInstance`, `VibeAppOwner`, `VibeAppOwnerPhotoUrl`, `VibeAppPublishStatus`, `VibeAppStateCounts`, `VibeAppStorage`, `VibeAppUIMetadata`, `VibeAppUserAccess`, `VibeAsset`, `VibeCodeVersion`, `VibeCollection`, `VibeCollectionField`, `VibeConnectedIntegration`, `VibeDocument`, `VibeDocumentConnection`, `VibeMemory`, `VibeMemoryScope`, `VibeMutations`, `VibePermissions`, `VibeQueries`, `VibeSubscription`, `VideoContent`, `VoteValue`, `Watcher`, `Webhook`, `WeekValue`, `WhatsNewItem`, `Widget`, `WidgetParentOutput`, `WidgetResult`, `WidgetSchemaInfo`, `WidgetsSurface`, `WorkSchedule`, `WorkScheduleDay`, `WorkScheduleDeleteResult`, `WorkSchedulePage`, `WorkScheduleResult`, `WorkSchedules`, `Workflow`, `WorkflowAutomation`, `WorkflowAutomationsPageInfo`, `WorkflowBlock`, `WorkflowBlockCredentialField`, `WorkflowBlockInputField`, `WorkflowBlockNextMappingSchema`, `WorkflowBuilderContextData`, `WorkflowBuilderCreateResult`, `WorkflowBuilderPublishResult`, `WorkflowHostData`, `WorkflowIterator`, `WorkflowRunOnceTriggerEntities`, `WorkflowRunOnceTriggerEntity`, `WorkflowStep`, `WorkflowVariableSchema`, `Workspace`, `WorkspaceBoardGroup`, `WorkspaceIcon`, `WorkspaceSettings`, `WorldClockValue`

### SCALAR (10)

`Boolean`, `CompareValue`, `Date`, `File`, `Float`, `ID`, `ISO8601DateTime`, `Int`, `JSON`, `String`

### UNION (14)

`AgentSubscriberEntity`, `AggregateResult`, `BlockContent`, `BlotContent`, `ColumnSettings`, `DataViewSource`, `DataViewSourceError`, `ExternalProviderData`, `FileValueItem`, `JobStatus`, `MirroredValue`, `PortfolioUtilizationReport`, `TimelineItemMetadata`, `UtilizationReport`
