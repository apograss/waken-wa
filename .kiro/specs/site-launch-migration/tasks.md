# Implementation Plan: Site Launch Migration (域名迁移 + Sitemap)

## Overview

本计划把设计拆成两类工作：

- **A. CODE 任务**（任务 1–7）：可由编码代理现在就实现、测试，并在本地 `pnpm typecheck / lint / test / build` 验证。改动集中在 `lib/site-url.ts`、`app/sitemap.ts`、`app/robots.ts`、`app/layout.tsx`、`scripts/backfill-memos-inspiration.mjs`、`.env.example`。
- **B. OPS / 切换 runbook 任务**（任务 8）：在维护窗口对基础设施手动执行，**编码代理不能执行**（DNS / CDN / 反向代理 / Halo 后台 / Memos 后台均不在仓库内，需用户操作）。这些任务以 `【MANUAL / 运维】` 明确标注，不属于代码自动化范围。

技术栈：TypeScript + Next.js (App Router) + drizzle-orm + better-sqlite3，测试用 vitest（`*.test.ts` 与源码同目录，node 环境）。属性测试（标 `*`）建议用 fast-check，需先加 devDependency。

要求与性质追溯：每个任务标注其满足的 Requirements（1–9）与 design 的 Correctness Properties（1–8）。

---

## Tasks

### A. CODE 任务

- [x] 1. 规范基础 URL 解析器（Canonical Base URL）
  - [x]* 1.1 为 `lib/site-url.ts` 编写单元测试（TDD：先写，先失败）
    - 新建 `lib/site-url.test.ts`
    - 覆盖 `getSiteBaseUrl()`：`SITE_URL` 设置时返回其 trim 值；仅 `NEXT_PUBLIC_SITE_URL` 时回落到它；两者皆缺时返回 `https://apograss.cn`；带尾斜杠（如 `https://apograss.cn/`、`https://apograss.cn///`）时去除所有尾斜杠
    - 覆盖 `absoluteUrl(path)`：`'/x'` 与 `'x'` 等价、均为单斜杠拼接；空字符串返回 base
    - 用 `vi.stubEnv` / 还原 `process.env` 隔离环境变量
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 1.2 实现 `lib/site-url.ts`
    - 新建 `lib/site-url.ts`，`import 'server-only'`
    - `getSiteBaseUrl()`：优先级 `SITE_URL` > `NEXT_PUBLIC_SITE_URL` > `https://apograss.cn`，对结果 `.trim()` 后 `.replace(/\/+$/, '')`
    - `absoluteUrl(path)`：空 path 返回 base；否则 `` `${base}/${path.replace(/^\/+/, '')}` ``
    - 让 1.1 的测试全部通过
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [ ]* 1.3 为 `site-url` 编写属性测试（domain 前缀不变式）
    - **Property 1: Sitemap 域名规范性（基础不变式）**
    - **Validates: Requirements 1.5, 8.3**
    - 对任意路径字符串，`absoluteUrl(path).startsWith(getSiteBaseUrl())` 恒成立，且结果不含 `//`（协议后除外）
    - 需先添加 `fast-check` devDependency（`pnpm add -D fast-check`）

- [x] 2. Layout metadataBase 规范化
  - [x] 2.1 在 `app/layout.tsx` 的 `generateMetadata()` 中新增 `metadataBase`
    - `import { getSiteBaseUrl } from '@/lib/site-url'`
    - 返回对象新增 `metadataBase: new URL(getSiteBaseUrl())`
    - 不改动既有 `robots` / `title` / `icons` 逻辑
    - _Requirements: 1.7_
  - [ ]* 2.2 为 layout metadata 编写测试
    - 断言 `generateMetadata()` 返回的 `metadataBase` 等于 `getSiteBaseUrl()` 对应的 URL（在 `SITE_URL=https://apograss.cn` 下不含 `test.apograss.cn`）
    - _Requirements: 1.7, 8.1_

- [x] 3. Sitemap 生成器
  - [x]* 3.1 为 `app/sitemap.ts` 编写集成测试（TDD：先写，先失败）
    - 新建 `app/sitemap.test.ts`，mock `@/lib/db`、`@/lib/site-config-cache`
    - 索引开启 + 有条目 → 含 `/`、`/inspiration` 及全部 `/inspiration/{id}`，所有 url 以 `getSiteBaseUrl()` 前缀（性质 1、2）
    - 索引关闭（`searchEngineIndexingEnabled === false`）→ 返回 `[]`（性质 3）
    - DB 抛错 → 仅返回静态路由 `/`、`/inspiration` 且不抛错（性质 7）
    - `lastModified` 取 `updatedAt ?? createdAt`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 4.1, 4.2, 4.3_
  - [x] 3.2 实现 `app/sitemap.ts`
    - `export const dynamic = 'force-dynamic'`
    - 读 `getSiteConfigMemoryFirst()`，`searchEngineIndexingEnabled === false` → 返回 `[]`；读配置异常按开启处理
    - 静态路由 `/`（priority 1.0）、`/inspiration`（0.8）
    - 从 `inspirationEntries` 查询全部行，`map` 出 `/inspiration/{id}`（priority 0.6, weekly），`lastModified = toDate(updatedAt ?? createdAt)`
    - DB 查询包 try/catch，异常时动态条目回落为 `[]`
    - 所有 url 经 `absoluteUrl(...)` 生成
    - 让 3.1 测试通过
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 4.1, 4.2, 4.3_
  - [ ]* 3.3 为 sitemap 编写属性测试（条目双射）
    - **Property 2: Sitemap 只列公开条目（id 一一对应）**
    - **Validates: Requirements 2.2, 2.5**
    - 对任意 inspiration 行集合（随机 id/时间），sitemap 动态条目数 === 行数，且 url 中提取的 id 集合与输入 id 集合相等（无遗漏、无多余、无重复）

- [x] 4. Robots 生成器
  - [x]* 4.1 为 `app/robots.ts` 编写测试（TDD：先写，先失败）
    - 新建 `app/robots.test.ts`，mock `@/lib/site-config-cache`
    - 索引关闭 → `rules` 含 `{ userAgent: '*', disallow: '/' }`（性质 3）
    - 索引开启 → `allow: '/'` 且 `sitemap === absoluteUrl('/sitemap.xml')`
    - 配置不可读 → 按开启处理
    - _Requirements: 3.2, 3.3, 4.3_
  - [x] 4.2 实现 `app/robots.ts`
    - `export const dynamic = 'force-dynamic'`
    - 读 `getSiteConfigMemoryFirst()`，异常按开启处理
    - 关闭：`{ rules: [{ userAgent: '*', disallow: '/' }] }`
    - 开启：`{ rules: [{ userAgent: '*', allow: '/' }], sitemap: absoluteUrl('/sitemap.xml'), host: absoluteUrl('/') }`
    - 让 4.1 测试通过
    - _Requirements: 3.2, 3.3_
  - [ ]* 4.3 验证 robots 与 layout 索引行为一致性
    - 断言同一 `searchEngineIndexingEnabled` 值下，`robots()` 的 allow/disallow 与 `layout.tsx` 的 `robots` meta（index/noindex）一致（性质 3）
    - _Requirements: 3.4_

- [x] 5. Memos webhook 回填脚本默认值迁移
  - [x] 5.1 更新 `scripts/backfill-memos-inspiration.mjs` 默认 URL
    - `DEFAULT_WAKEN_WEBHOOK_URL` 由 `https://test.apograss.cn/api/inspiration/memos-webhook` 改为 `https://apograss.cn/api/inspiration/memos-webhook`
    - 保持 `WAKEN_MEMOS_WEBHOOK_URL` env 覆盖逻辑不变
    - _Requirements: 6.3, 6.4_

- [x] 6. 环境变量文档化
  - [x] 6.1 在 `.env.example` 增加 `SITE_URL` 与 `HALO_BASE_URL` 说明
    - `SITE_URL=https://apograss.cn`（用于 sitemap/robots/canonical）
    - `HALO_BASE_URL=https://blog.apograss.cn`（切换后博客对外地址）
    - 各附一行中文注释
    - _Requirements: 1.x, 5.1, 5.2, 5.3_

- [x] 7. Checkpoint - 代码验证
  - 依次运行并确保通过：`pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build`
  - 运行后 grep 构建产物/渲染输出无意外 `test.apograss.cn` 残留（性质 6 的代码侧自检）
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 8.1, 8.2, 8.3_

---

### B. OPS / 切换 Runbook 任务（任务 8）

> **【MANUAL / 运维】以下任务由用户在维护窗口手动执行，编码代理不得尝试执行。**
> 这些涉及 VPS 容器环境、镜像部署、反向代理 / CDN、Halo 后台、Memos 后台，均不在代码仓库内。它们对应 Requirement 9（runbook 与回滚）以及性质 4、5、8 的运维侧落地，记录于此以保证可追溯与可执行，但不纳入下方代码任务依赖图。

- [ ] 8. 上线切换与回滚 runbook（手动执行）
  - [ ] 8.1 【MANUAL / 运维】阶段 A — 镜像准备
    - 本地构建 amd64 镜像：`docker buildx build --platform linux/amd64 -t ghcr.io/apograss/waken-wa:main .`
    - 推送上 VPS：`docker save ghcr.io/apograss/waken-wa:main | ssh apograss@100.104.170.109 docker load`
    - 保留上一个镜像 tag ≥1 个以备回滚
    - _Requirements: 9.1_
  - [ ] 8.2 【MANUAL / 运维】阶段 B — 博客迁移到 blog.apograss.cn
    - 反代为 `blog.apograss.cn` 配置 upstream 指向 Halo 容器，验证可访问、文章可打开
    - Halo 后台把外部访问地址 / 永久链接 base 改为 `https://blog.apograss.cn`（RSS、permalink 自洽）
    - _Requirements: 9.1 ; Property 4_
  - [ ] 8.3 【MANUAL / 运维】阶段 C — 主页切到 apograss.cn
    - 在 `~/waken-wa-deploy/waken-wa` compose/env 设置 `SITE_URL=https://apograss.cn`、`HALO_BASE_URL=https://blog.apograss.cn`
    - `docker compose up -d app` 部署新镜像并重启（entrypoint 跑 `drizzle-kit push`）；如改了 v2 配置存储需 flush 内置 redis 后重启
    - 反代把 `apograss.cn` upstream 从 Halo 切到 `waken-wa-app-1:3000`
    - _Requirements: 9.1 ; Property 4_
  - [ ] 8.4 【MANUAL / 运维】阶段 D — SEO 301 重定向（反代/CDN 层）
    - `test.apograss.cn/*` → `301 https://apograss.cn/$request_uri`
    - `apograss.cn/archives/*` → `301 https://blog.apograss.cn/archives/$request_uri`
    - _Requirements: 7.1, 7.2, 9.1 ; Property 8_
  - [ ] 8.5 【MANUAL / 运维】阶段 E — Memos webhook 重指向
    - 在 Memos（`ssh ubuntu@79.137.78.127`）把 webhook 目标改为 `https://apograss.cn/api/inspiration/memos-webhook`
    - 发一条测试 memo，确认主页灵感流出现新条目
    - _Requirements: 6.1, 6.2, 9.1 ; Property 5_
  - [ ] 8.6 【MANUAL / 运维】阶段 F — 验证
    - `curl -sI https://test.apograss.cn/` → 301 到 apograss.cn
    - `curl -sI https://apograss.cn/archives/<old-post>` → 301 到 blog 域
    - `curl -s https://apograss.cn/sitemap.xml | head` → 含 `/`、`/inspiration`、若干 `/inspiration/{id}`，全部 `https://apograss.cn`
    - `curl -s https://apograss.cn/robots.txt` → 引用 `https://apograss.cn/sitemap.xml`
    - 抓取主页/灵感页 HTML 确认无 `test.apograss.cn`
    - Google Search Console 提交新 sitemap，并登记 `apograss.cn` / `blog.apograss.cn` 站点变更
    - 确认页脚备案号（粤ICP / 公安）展示正确
    - _Requirements: 9.3 ; Properties 5, 6, 8_
  - [ ] 8.7 【MANUAL / 运维】回滚预案与判定窗口
    - 主页切换失败：反代把 `apograss.cn` upstream 切回 Halo；`test.apograss.cn` 暂去掉 301 恢复指向 waken-wa；下线 `apograss.cn/archives` 301
    - 镜像异常：`docker compose` 回滚到上一个镜像 tag；SQLite 数据卷不动
    - Memos webhook 失败：临时把 Memos 目标改回旧地址（注意 POST+301 可能丢 body，优先直接改回）
    - 切换后 15 分钟内监控错误率与主页可用性
    - _Requirements: 9.2_

---

## Notes

- 标 `*` 的子任务为可选（单元 / 集成 / 属性测试），可为 MVP 跳过；核心实现任务不可跳过。
- 属性测试（1.3、3.3）需先 `pnpm add -D fast-check`；测试文件与源码同目录、命名 `*.test.ts`（vitest，node 环境）。
- `lib/halo-blog.ts` **不改代码**：已是 `HALO_BASE_URL` 驱动，性质 4 通过任务 8.3 的 env 设置满足。
- 任务 8（OPS）为手动 runbook，**不在代码任务依赖图内**，因其按维护窗口顺序由用户串行执行。
- 每个代码任务引用具体 Requirements 子条款与设计性质，保证可追溯。

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "5.1", "6.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "2.1", "3.1", "4.1"] },
    { "id": 3, "tasks": ["2.2", "3.2", "4.2"] },
    { "id": 4, "tasks": ["3.3", "4.3"] }
  ]
}
```
