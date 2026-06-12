# Admin Activity Settings Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Website Settings activity management section that exposes existing manual activity, recent activity, history search, and used-app export capabilities.

**Architecture:** Keep the top-level admin navigation unchanged. Add a new client component under `components/admin/` and mount it in `components/admin/web-settings.tsx` inside the Advanced -> Runtime section. Reuse existing API endpoints and query helpers; add only small typed row fetchers and pure helpers where the UI needs richer data.

**Tech Stack:** Next.js App Router, React 19, TanStack Query, i18next locale JSON, Vitest, TypeScript.

---

### Task 1: Add Activity History Row Helpers

**Files:**
- Create: `components/admin/activity-management-utils.ts`
- Create: `components/admin/activity-management-utils.test.ts`
- Modify: `types/admin.ts`
- Modify: `components/admin/admin-query-fetchers.ts`

**Step 1: Write the failing test**

Create tests for:

- App history rows preserve trimmed process names and ISO timestamps.
- Empty names are filtered.
- Play-source rows normalize play-source keys to lowercase.
- Export file names are stable and filesystem-safe.

**Step 2: Run test to verify it fails**

Run: `pnpm test components/admin/activity-management-utils.test.ts`

Expected: FAIL because the helper file does not exist.

**Step 3: Write minimal implementation**

Add:

- `AdminActivityHistoryAppRow`
- `AdminActivityHistoryPlaySourceRow`
- `NormalizeActivityHistoryAppRows`
- `NormalizeActivityHistoryPlaySourceRows`
- `BuildActivityAppsExportFileName`

Update `admin-query-fetchers.ts` with richer row fetchers while keeping existing suggestion functions returning `string[]`.

**Step 4: Run test to verify it passes**

Run: `pnpm test components/admin/activity-management-utils.test.ts`

Expected: PASS.

### Task 2: Add Website Settings Activity Management Panel

**Files:**
- Create: `components/admin/web-settings-activity-management-panel.tsx`
- Modify: `components/admin/web-settings.tsx`

**Step 1: Write the component against existing helpers**

Build a client component that contains:

- Quick-add activity area with `AddActivityForm`.
- Recent records area with `fetchActivityFeed`, refresh button, and persistent-record end action.
- Historical apps search/list using the new row fetcher.
- Historical play-source search/list using the new row fetcher.
- Export used-app JSON button using `exportAdminActivityApps`.

**Step 2: Mount it**

In `components/admin/web-settings.tsx`, render the panel in the existing Runtime section after `WebSettingsActivityPanel` and before `WebSettingsRuleTools`.

**Step 3: Run targeted tests**

Run: `pnpm test components/admin/activity-management-utils.test.ts`

Expected: PASS.

### Task 3: Add i18n Text

**Files:**
- Modify: `public/locales/zh-CN/admin.json`
- Modify: `public/locales/en/admin.json`

**Step 1: Add Chinese locale keys**

Add `webSettingsActivityManagement` labels, descriptions, empty/loading/error text, and action labels.

**Step 2: Add English locale keys**

Mirror the Chinese keys in English.

**Step 3: Run i18n check**

Run: `pnpm i18n:check`

Expected: PASS with no missing locale keys.

### Task 4: Verify, Commit, and Sync

**Files:**
- All files changed above.

**Step 1: Run full verification**

Run:

- `pnpm test components/admin/activity-management-utils.test.ts`
- `pnpm lint`
- `pnpm typecheck`

Expected: all commands exit 0.

**Step 2: Review diff**

Run: `git diff --check` and inspect `git diff`.

Expected: no whitespace errors and no unrelated file changes staged.

**Step 3: Commit implementation**

Stage only files changed for this task, excluding unrelated `ci_check*.json`.

Commit message:

`feat(admin): expose activity management in settings`

**Step 4: Sync to VPS**

Inspect existing remotes and deployment notes before syncing. Use the repository's established remote/deploy path, and do not change secrets or production environment variables.
