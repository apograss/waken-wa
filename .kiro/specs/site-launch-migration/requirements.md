# Requirements Document

## Introduction

本需求文档由已批准的设计文档（`design.md`）反向推导而来，覆盖 waken-wa 个人主页从 `test.apograss.cn` 正式迁移到主域名 `apograss.cn` 的工作，包括：把原占用 `apograss.cn` 的 Halo 博客迁到 `blog.apograss.cn`、新增 `sitemap.xml` / `robots.txt`、引入规范基础 URL 解析、博客链接经 `HALO_BASE_URL` 指向新博客域、Memos webhook 与回填脚本默认值迁移、反代/CDN 层的 301 重定向，以及上线切换 runbook 与回滚预案。

DNS 与 CDN 解析、证书均已由运维配置完成；本需求聚焦应用层代码行为与反代/CDN 层的切换契约。每条验收标准均采用 EARS 模式书写，并与设计文档的 Correctness Properties（性质 1–8）保持可追溯映射。

## Glossary

- **Site_URL_Resolver**: `lib/site-url.ts` 模块，导出 `getSiteBaseUrl()` 与 `absoluteUrl(path)`，负责解析规范站点根 URL。
- **Canonical_Base_URL**: `getSiteBaseUrl()` 返回的、无尾部斜杠的绝对站点根 URL，默认 `https://apograss.cn`。
- **Sitemap_Generator**: `app/sitemap.ts`，生成 `/sitemap.xml` 的处理器。
- **Robots_Generator**: `app/robots.ts`，生成 `/robots.txt` 的处理器。
- **Layout_Metadata**: `app/layout.tsx` 中 `generateMetadata()` 返回的元数据对象。
- **Blog_Link_Provider**: `lib/halo-blog.ts` 模块，导出 `haloBlogHomeUrl()` 与文章链接，行为由 `HALO_BASE_URL` 环境变量驱动。
- **Memos_Webhook_Endpoint**: `/api/inspiration/memos-webhook` 路由，接收 Memos 推送。
- **Backfill_Script**: `scripts/backfill-memos-inspiration.mjs` 回填脚本。
- **Reverse_Proxy**: VPS openresty / 1Panel 反向代理与 CDN 层（不在应用仓库内）。
- **Inspiration_Entry**: `inspiration_entries` 表中的一行；该表条目全部来自仅同步 PUBLIC+NORMAL memo 的 webhook，因此均为已公开内容。
- **searchEngineIndexingEnabled**: 后台站点配置中的搜索引擎收录开关；取值非 `false` 视为开启。

## Requirements

### Requirement 1: 规范基础 URL 解析

**User Story:** As a site operator, I want a single authoritative base-URL resolver, so that every generated URL uses the canonical domain instead of a hardcoded test domain.

#### Acceptance Criteria

1. WHERE the `SITE_URL` environment variable is set, THE Site_URL_Resolver SHALL return the trimmed value of `SITE_URL` as the Canonical_Base_URL.
2. WHERE the `SITE_URL` environment variable is absent AND the `NEXT_PUBLIC_SITE_URL` environment variable is set, THE Site_URL_Resolver SHALL return the trimmed value of `NEXT_PUBLIC_SITE_URL` as the Canonical_Base_URL.
3. IF neither `SITE_URL` nor `NEXT_PUBLIC_SITE_URL` is set, THEN THE Site_URL_Resolver SHALL return `https://apograss.cn` as the Canonical_Base_URL.
4. THE Site_URL_Resolver SHALL return the Canonical_Base_URL with all trailing slashes removed.
5. WHEN `absoluteUrl(path)` is invoked with a non-empty path, THE Site_URL_Resolver SHALL return the Canonical_Base_URL joined to the path with exactly one separating slash.
6. WHEN `absoluteUrl(path)` is invoked with an empty path, THE Site_URL_Resolver SHALL return the Canonical_Base_URL.
7. THE Layout_Metadata SHALL set `metadataBase` to the Canonical_Base_URL.

### Requirement 2: Sitemap 生成

**User Story:** As an SEO manager, I want sitemap.xml to list the homepage routes and every inspiration entry, so that search engines can discover all public content.

#### Acceptance Criteria

1. WHEN `/sitemap.xml` is requested AND searchEngineIndexingEnabled is not false, THE Sitemap_Generator SHALL include the static routes `/` and `/inspiration`.
2. WHEN `/sitemap.xml` is requested AND searchEngineIndexingEnabled is not false AND the database is available, THE Sitemap_Generator SHALL include one `/inspiration/{id}` entry for every row in the inspiration_entries table.
3. THE Sitemap_Generator SHALL prefix every emitted URL with the Canonical_Base_URL.
4. THE Sitemap_Generator SHALL set each Inspiration_Entry `lastModified` to `updatedAt` when `updatedAt` is present and to `createdAt` otherwise.
5. THE Sitemap_Generator SHALL emit exactly one sitemap entry per Inspiration_Entry, with each entry id appearing exactly once.

### Requirement 3: 搜索引擎收录开关一致性

**User Story:** As a site operator, I want the indexing toggle to control all crawler-facing output, so that the site is hidden from indexing when the toggle is off.

#### Acceptance Criteria

1. IF searchEngineIndexingEnabled is false, THEN THE Sitemap_Generator SHALL return an empty sitemap.
2. IF searchEngineIndexingEnabled is false, THEN THE Robots_Generator SHALL return a rule that disallows `/` for user agent `*`.
3. WHILE searchEngineIndexingEnabled is not false, THE Robots_Generator SHALL return a rule that allows `/` for user agent `*` AND SHALL reference the sitemap at `absoluteUrl('/sitemap.xml')`.
4. THE Robots_Generator output SHALL match the `robots` metadata produced by Layout_Metadata for the same searchEngineIndexingEnabled value.

### Requirement 4: Sitemap 与 Robots 容错

**User Story:** As a site operator, I want sitemap and robots generation to survive database outages, so that crawler requests never fail.

#### Acceptance Criteria

1. IF the database is unavailable WHEN `/sitemap.xml` is requested AND searchEngineIndexingEnabled is not false, THEN THE Sitemap_Generator SHALL return only the static routes `/` and `/inspiration`.
2. WHEN the database raises an error during sitemap generation, THE Sitemap_Generator SHALL return a result and SHALL complete without raising an error.
3. IF the site configuration is unreadable, THEN THE Sitemap_Generator SHALL treat searchEngineIndexingEnabled as enabled.
4. IF the Blog_Link_Provider fails to fetch posts, THEN THE homepage SHALL render with an empty blog-post list.

### Requirement 5: 博客链接指向新博客域

**User Story:** As a visitor, I want blog links to point to blog.apograss.cn, so that I reach the migrated Halo blog after cutover.

#### Acceptance Criteria

1. WHERE `HALO_BASE_URL` is set to `https://blog.apograss.cn`, THE Blog_Link_Provider SHALL return a home URL that begins with `https://blog.apograss.cn`.
2. WHERE `HALO_BASE_URL` is set to `https://blog.apograss.cn`, THE Blog_Link_Provider SHALL return every post URL beginning with `https://blog.apograss.cn`.
3. THE Blog_Link_Provider SHALL derive blog URLs from the `HALO_BASE_URL` environment variable without source-code changes.

### Requirement 6: Memos Webhook 迁移

**User Story:** As a site operator, I want Memos to push to the main domain and the backfill script to default to it, so that new memos appear after cutover.

#### Acceptance Criteria

1. WHEN a valid signed payload is POSTed to `https://apograss.cn/api/inspiration/memos-webhook`, THE Memos_Webhook_Endpoint SHALL respond with `code === 0`.
2. WHEN the Memos_Webhook_Endpoint accepts a new public memo, THE system SHALL persist a corresponding Inspiration_Entry that appears on the homepage and in the sitemap.
3. THE Backfill_Script SHALL use `https://apograss.cn/api/inspiration/memos-webhook` as the default webhook URL.
4. WHERE the `WAKEN_MEMOS_WEBHOOK_URL` environment variable is set, THE Backfill_Script SHALL use the value of `WAKEN_MEMOS_WEBHOOK_URL` in place of the default webhook URL.

### Requirement 7: SEO 301 重定向

**User Story:** As an SEO manager, I want permanent redirects from the old URLs, so that existing link equity is preserved after migration.

#### Acceptance Criteria

1. WHEN a request matches `test.apograss.cn/*`, THE Reverse_Proxy SHALL respond with an HTTP 301 redirect to the equivalent path on `https://apograss.cn`.
2. WHEN a request matches `apograss.cn/archives/*`, THE Reverse_Proxy SHALL respond with an HTTP 301 redirect to the equivalent path on `https://blog.apograss.cn/archives/`.

### Requirement 8: 运行时输出无测试域名

**User Story:** As a site operator, I want runtime output free of the test domain, so that the canonical domain is used consistently across pages and crawler files.

#### Acceptance Criteria

1. WHEN the homepage is rendered with `SITE_URL` set to `https://apograss.cn`, THE system SHALL produce HTML output that excludes `test.apograss.cn`.
2. WHEN the inspiration pages are rendered with `SITE_URL` set to `https://apograss.cn`, THE system SHALL produce HTML output that excludes `test.apograss.cn`.
3. WHEN `/sitemap.xml` and `/robots.txt` are generated with `SITE_URL` set to `https://apograss.cn`, THE system SHALL produce output that excludes `test.apograss.cn`.

### Requirement 9: 上线切换 Runbook 与回滚预案

**User Story:** As a site operator, I want a documented cutover runbook with rollback steps, so that the migration can be executed and reverted safely within the maintenance window.

#### Acceptance Criteria

1. THE launch runbook SHALL document ordered cutover phases covering image preparation, blog migration to `blog.apograss.cn`, homepage cutover to `apograss.cn`, SEO 301 redirects, Memos webhook re-pointing, and verification.
2. THE launch runbook SHALL document a rollback procedure for homepage-cutover failure, image failure, and Memos-webhook failure.
3. THE launch runbook SHALL document verification checks that confirm the 301 redirects, the sitemap contents, and the absence of `test.apograss.cn` in runtime output.
