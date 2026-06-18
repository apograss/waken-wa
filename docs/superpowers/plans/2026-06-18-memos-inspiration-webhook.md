# Memos Inspiration Webhook 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 让 Memos 发布、更新、删除 PUBLIC memo 后通过 webhook 实时写入 waken-wa 的灵感记录，并提供一次性 backfill 脚本补齐已有 PUBLIC memo。

**架构：** Memos 作为内容入口，waken-wa 的 `inspiration_entries` 仍是首页和归档页的数据源。新增外部来源字段用于幂等 upsert/delete，新增服务端 webhook 端点校验可选签名后处理事件，新增脚本从 Memos list API 拉取 PUBLIC memo 并调用同一套同步逻辑。图片不入库，内容里只保留 `[图片]` 占位。

**技术栈：** Next.js Route Handler、Drizzle schema push、Vitest、Node.js `crypto`、Memos `/api/v1/memos` 和 user webhook。

---

### 任务 1：Memos memo 转换与签名 helper

**文件：**
- 创建：`lib/memos-inspiration.ts`
- 测试：`lib/memos-inspiration.test.ts`

- [ ] **步骤 1：编写失败的转换测试**

测试 `normalizeMemosMemoForInspiration()`：
- `PUBLIC` + `NORMAL` memo 会得到 `externalId`、标题、正文、创建/更新时间。
- Markdown 图片、HTML 图片和附件会变成 `[图片]`，不输出图片 URL。
- `PRIVATE`、`PROTECTED`、非 `NORMAL` memo 返回 `null`。

- [ ] **步骤 2：运行测试验证失败**

运行：`fnm exec --using v22.22.3 pnpm test lib/memos-inspiration.test.ts`
预期：FAIL，模块不存在或函数不存在。

- [ ] **步骤 3：实现最少转换 helper**

实现类型：
- `MemosMemo`
- `NormalizedMemosInspiration`

实现函数：
- `normalizeMemosMemoForInspiration(memo)`
- `memoHasImageLikeAttachment(memo)`
- `stripMemosMarkdownImages(content)`

- [ ] **步骤 4：编写失败的签名测试**

测试 `verifyMemosWebhookSignature()`：
- 正确的 `webhook-id`、`webhook-timestamp`、`webhook-signature` 和 secret 返回 `true`。
- 错误 secret 返回 `false`。
- `whsec_<base64>` secret 会先 base64 decode。
- secret 为空时返回 `true`，表示本地允许无签名 webhook。

- [ ] **步骤 5：实现签名 helper 并验证**

实现函数：
- `verifyMemosWebhookSignature({ body, headers, secret, nowMs })`

运行：`fnm exec --using v22.22.3 pnpm test lib/memos-inspiration.test.ts`
预期：PASS。

### 任务 2：数据库 schema 与同步服务

**文件：**
- 修改：`drizzle/schema.sqlite.ts`
- 修改：`drizzle/schema.pg.ts`
- 创建：`lib/memos-inspiration-store.ts`
- 测试：`lib/memos-inspiration-store.test.ts`

- [ ] **步骤 1：编写失败的 store 测试**

测试 `upsertMemosInspirationEntry()` 和 `deleteMemosInspirationEntry()`：
- 同一个 Memos `externalId` 重复 upsert 只保留一条记录。
- `createdAt` 使用 Memos 的 `createTime`。
- 删除事件按 `externalSource/externalId` 删除。

- [ ] **步骤 2：运行测试验证失败**

运行：`fnm exec --using v22.22.3 pnpm test lib/memos-inspiration-store.test.ts`
预期：FAIL，schema 字段或 store 函数不存在。

- [ ] **步骤 3：添加 schema 字段和 store 实现**

字段：
- `externalSource`
- `externalId`

索引：
- SQLite：`inspiration_entries_external_source_id_idx`
- PostgreSQL：`inspiration_entries_external_source_id_idx`

实现：
- `upsertMemosInspirationEntry(normalized)`
- `deleteMemosInspirationEntry(externalId)`

- [ ] **步骤 4：运行 store 测试**

运行：`fnm exec --using v22.22.3 pnpm test lib/memos-inspiration-store.test.ts`
预期：PASS。

### 任务 3：Webhook Route Handler

**文件：**
- 创建：`app/api/inspiration/memos-webhook/route.ts`
- 测试：`lib/memos-inspiration.test.ts`

- [ ] **步骤 1：补 webhook payload 行为测试**

测试 `handleMemosWebhookPayload()`：
- `memos.memo.created` 和 `memos.memo.updated` 对 PUBLIC memo 返回 upsert 指令。
- `memos.memo.deleted` 返回 delete 指令。
- `memos.memo.comment.created` 返回 ignore。
- 非 PUBLIC memo 的 created/updated 返回 delete/ignore，避免 PRIVATE 内容残留。

- [ ] **步骤 2：运行测试验证失败**

运行：`fnm exec --using v22.22.3 pnpm test lib/memos-inspiration.test.ts`
预期：FAIL，handler helper 不存在。

- [ ] **步骤 3：实现 webhook route**

Route 行为：
- 读取原始 body 文本。
- 使用 `MEMOS_WEBHOOK_SECRET` 做可选签名校验。
- 事件来自 `activityType`，memo 来自 `memo`。
- 成功返回 `{ "code": 0, "message": "ok" }`，满足 Memos webhook 对响应体的要求。
- 签名失败返回 401。
- 非法 payload 返回 400。

- [ ] **步骤 4：运行 webhook 相关测试**

运行：`fnm exec --using v22.22.3 pnpm test lib/memos-inspiration.test.ts`
预期：PASS。

### 任务 4：Backfill 脚本与文档

**文件：**
- 创建：`scripts/backfill-memos-inspiration.mjs`
- 修改：`docs/inspiration-integration.md`
- 修改：`.env.example`

- [ ] **步骤 1：编写脚本**

脚本行为：
- 从 `MEMOS_BASE_URL` 读取 Memos API 地址，默认 `https://memos.apograss.cn`。
- 分页请求 `/api/v1/memos?pageSize=100&filter=visibility == "PUBLIC"`。
- 只同步 `PUBLIC` + `NORMAL`。
- 使用 `lib/memos-inspiration-store.ts` 的 upsert 逻辑。
- 输出 synced/ignored 计数。

- [ ] **步骤 2：补文档**

记录：
- `MEMOS_WEBHOOK_SECRET`
- `MEMOS_BASE_URL`
- Memos webhook URL：`https://test.apograss.cn/api/inspiration/memos-webhook`
- 一次性 backfill 命令：`fnm exec --using v22.22.3 pnpm node scripts/backfill-memos-inspiration.mjs`

- [ ] **步骤 3：运行脚本 dry 验证**

运行：`MEMOS_BASE_URL=https://memos.apograss.cn fnm exec --using v22.22.3 node scripts/backfill-memos-inspiration.mjs --dry-run`
预期：能拉到 PUBLIC memo 并输出计数，不写库。

### 任务 5：全量验证与提交

**文件：**
- 所有新增/修改文件

- [ ] **步骤 1：运行完整验证**

运行：
- `fnm exec --using v22.22.3 pnpm test`
- `fnm exec --using v22.22.3 pnpm lint`
- `fnm exec --using v22.22.3 pnpm typecheck`
- `fnm exec --using v22.22.3 pnpm build`

- [ ] **步骤 2：检查 diff**

运行：`git diff --stat && git diff --check`
预期：无 whitespace error，diff 只包含 Memos webhook/backfill 相关内容。

- [ ] **步骤 3：提交**

运行：
- `git add ...`
- `git commit -m "feat(inspiration): sync public memos via webhook"`
