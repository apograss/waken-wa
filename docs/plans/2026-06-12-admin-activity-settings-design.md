# Admin Activity Settings Design

## Goal

Expose existing activity-management capabilities inside the current admin Website Settings tab, instead of adding a new top-level admin tab.

## Context

The backend and client helpers already provide these pieces:

- `POST /api/admin/activity` for manual activity creation.
- `PATCH /api/admin/activity` for ending persistent activity records.
- `GET /api/admin/activity/history/apps` for captured process names.
- `GET /api/admin/activity/history/play-sources` for captured media play sources.
- `GET /api/admin/activity/apps-export` for used-app export JSON.
- Rule tools already use the history APIs as suggestions, and the dashboard overview already uses quick add and recent records.

The missing piece is a coherent management surface in admin. Project notes also mention "Admin -> activity management", but the current admin navigation has no such surface.

## Decision

Add an activity management section under:

`/admin` -> Website Settings -> Advanced -> Runtime

The section should sit near `WebSettingsActivityPanel` and `WebSettingsRuleTools`, because it manages runtime activity data rather than global account or content settings.

## UI Scope

Create a new `WebSettingsActivityManagementPanel` component with:

- Manual activity quick add, reusing `AddActivityForm`.
- Recent activity records, reusing the existing activity feed query and end-persistent-activity mutation.
- Historical app records, searchable with last-seen timestamps.
- Historical media play sources, searchable with last-seen timestamps.
- Used-app JSON export, reusing the existing export endpoint.

Do not add destructive cleanup or record deletion in this pass. The existing APIs are mostly read/write for current activity and export; adding deletion would increase risk and require new API behavior.

## Data Flow

- Reuse `fetchActivityFeed`, `fetchActivityHistoryApps`, `fetchActivityHistoryPlaySources`, and `exportAdminActivityApps`.
- Add row-level fetchers for activity app and play-source history so the settings panel can show `lastSeenAt`, while keeping the existing string suggestion fetchers unchanged for rule tools.
- Reuse `endAdminActivity` for persistent records.
- Keep query invalidation aligned with the existing dashboard quick-add flow.

## Testing

- Add focused unit tests for row normalization and timestamp/file-name helper behavior.
- Run `pnpm test` for the new test file.
- Run `pnpm lint`.
- Run `pnpm typecheck`.

## Non-Goals

- No database schema changes.
- No top-level admin tab.
- No activity history deletion or retention controls.
- No production secrets or environment-variable changes.
