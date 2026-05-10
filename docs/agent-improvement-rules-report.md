# Agent 改善规则项目报告

生成日期：2026-05-10  
适用仓库：`waken-wa-web`

这份报告用于后续 Agent 修改本项目时作为执行准则。它不是一次性重构方案，而是“以后动代码前先看这里”的工程规则摘要。

## 1. 项目现状速览

项目是基于 Next.js App Router 的个人站点与后台管理系统，核心栈为 Next.js 16、React 19、Tailwind 4、Drizzle ORM、SQLite/PostgreSQL 双运行时。数据访问、认证、安全、站点配置与活动聚合集中在 `lib/`，页面与 API 路由集中在 `app/`，后台 UI 主要在 `components/admin/`。

当前仓库文件分布重点：

| 区域 | 文件数 | 后续修改关注点 |
| --- | ---: | --- |
| `lib/` | 137 | 业务逻辑、DB、缓存、配置读写，最容易形成隐式耦合 |
| `components/` | 122 | 后台组件体积偏大，后续应优先拆分状态、常量、类型 |
| `app/` | 79 | Route/page 应保持薄层，避免继续塞业务逻辑 |
| `types/` | 30 | 已有集中类型目录，但仍有大量类型散落在功能文件中 |
| `constants/` | 14 | 顶层常量目录已启用，后续新增共享常量继续按领域拆分 |

大文件集中区：

| 文件 | 行数 | 建议 |
| --- | ---: | --- |
| `components/admin/use-web-settings-controller.ts` | 1093 | 拆分按设置分类的 controller/helper |
| `components/admin/web-settings-custom-surface.tsx` | 900 | 已拆出背景模式/预览派生 helper；后续拆分颜色/尺寸/背景/预览区域 |
| `components/admin/schedule-manager.tsx` | 844 | 拆分课程编辑、时间段编辑、导入导出与状态派生 |
| `components/admin/use-rule-tools-state.ts` | 794 | 已拆出导入导出 handler；后续拆分查询、编辑缓存、列表与规则组操作 |
| `components/current-status.tsx` | 821 | 拆分展示子组件与活动状态派生 |
| `components/admin/dashboard.tsx` | 801 | 拆分 dashboard 区块与数据派生 |
| `lib/site-settings-write.ts` | 782 | 已拆出事务/错误/entry 写入 helper；后续按 core/theme/schedule/rules 继续拆分写入逻辑 |
| `lib/site-settings-read.ts` | 757 | 已拆出缺表兼容与 row 解码 helper；后续按 core/theme/schedule/rules 继续拆分读取逻辑 |
| `components/admin/web-settings-rule-tools.tsx` | 734 | 已拆出预览区、规则组列表、规则组编辑器、媒体源弹窗、导入规则弹窗；后续拆分状态派生 |
| `components/admin/status-card-preview-panel.tsx` | 728 | 已拆出预览 URL/HTML/资源 key/hash helper；后续拆分表单区、预览区、资源选择与尺寸控制 |

## 2. 新规则总原则

以后修改代码时，优先遵守下面顺序：

1. 先看模块归属，再决定文件位置。
2. 共享常量进 `constants/`，共享类型进 `types/`。
3. API/page/component 不承载复杂业务逻辑，复杂逻辑下沉到 `lib/` 或拆成专门模块。
4. 少写 normalize，只有跨边界输入才需要转换。
5. 文件结构保持：引入 -> 常量/变量 -> 类型补充（仅限私有且很小）-> 函数/组件。
6. 多分支条件优先 `switch`，尤其是同一个变量的枚举/字符串分支。
7. 不为了兼容性写额外分支，除非明确存在旧数据、历史接口或迁移状态。

## 3. Constants 规则

当前仓库实际目录名是 `constants/`。用户规则中的 “Constants 文件夹” 在当前项目里对应 `constants/`；不要做仅大小写变化的目录重命名，除非单独开一次工程化改名。

### 3.1 必须抽到 `constants/` 的内容

多个文件共同使用的常量必须放到 `constants/` 下的领域文件中，例如：

- `constants/site-settings.ts`
- `constants/status-card.ts`
- `constants/activity-feed.ts`
- `constants/inspiration.ts`
- `constants/admin-dashboard.ts`

适合抽离的常量包括：

- API 路径、Cookie key、localStorage key、Redis key prefix
- 默认值、范围限制、最大长度、分页大小、TTL
- 状态枚举数组、tab 配置、字段白名单/黑名单
- UI 固定选项、文案映射、颜色 token、尺寸 token
- 多个模块引用的正则或解析规则

### 3.2 不要堆成总常量文件

不要新增 `constants/index.ts` 作为所有常量的大杂烩。每个领域单独一个文件，必要时再由使用方直接 import。

示例：

```ts
import { STATUS_CARD_DEFAULT_WIDTH } from '@/constants/status-card'
```

不推荐：

```ts
import { STATUS_CARD_DEFAULT_WIDTH } from '@/constants'
```

### 3.3 当前迁移优先级

第一批共享常量迁移已经完成，旧的 `lib/*-constants.ts` 大多已迁入 `constants/`。当前仍可继续关注：

- 组件文件顶部的大写 UI 固定选项
- 仍然只有模块内部使用的局部常量，例如 `lib/activity-history-pending/constants.ts`
- 新增第二个使用方后的领域常量，应立即移动到 `constants/<domain>.ts`

后续改到这些文件时，不要顺手大重构；但如果常量会被新增第二个文件使用，应在本次变更中移动到 `constants/<domain>.ts`，并更新 import。

## 4. Types 规则

当前仓库实际目录名是 `types/`。用户规则中的 “Types 文件夹” 在当前项目里对应 `types/`。

扫描结果：项目内约有 340 个 `type/interface` 声明，其中约 266 个不在 `types/` 目录下。不是所有都必须立刻移动，但后续新增共享类型应默认进入 `types/`。

### 4.1 类型放置

必须放入 `types/` 的类型：

- 被多个文件引用的类型
- API request/response/payload 类型
- DB 查询结果映射类型
- 组件之间共享的 props/data model
- 管理后台 store/controller/form 共同使用的类型

允许留在本文件的类型：

- 单文件私有的小型 props 类型
- 不导出的内部 helper 类型
- UI library 适配层里的局部泛型

### 4.2 命名标准

新增共享类型命名使用：

```ts
<Function><Usage>Types
```

含义：

- `Function`：功能域，例如 `SiteSettings`、`StatusCard`、`ActivityFeed`
- `Usage`：用途，例如 `Form`、`Payload`、`Response`、`Controller`、`Route`
- `Types`：类型集合后缀，用于聚合一组相关类型

示例：

```ts
export type SiteSettingsFormTypes = {
  values: SiteSettingsFormValues
  patch: SiteSettingsPatchPayload
}
```

如果只是单个明确实体，可以保留更具体名称，例如 `ActivityFeedItem`、`ScheduleCourse`。但当一个文件输出一组配套类型时，应按 `<Function><Usage>Types` 命名。

### 4.3 文件命名

当前项目使用小写短横线风格。后续为了减少仓库大小写与 Windows 路径问题，优先使用：

- `types/site-settings-form.ts`
- `types/status-card-route.ts`
- `types/activity-feed-response.ts`

不要新增 `components/admin/web-settings-types.ts` 这种组件目录内共享类型文件；如果它要被多个模块复用，应迁移到 `types/`。

## 5. Normalize 规则

项目当前 normalize 使用非常多，集中在：

- `lib/llm-site-config.ts`
- `app/api/admin/setup/admin/route.ts`
- `components/admin/web-settings-utils.ts`
- `components/admin/use-web-settings-controller.ts`
- `lib/rule-tools-config.ts`
- `lib/status-card-options.ts`
- `lib/site-config-normalize.ts`
- `lib/site-settings-read.ts`
- `lib/site-settings-write.ts`

后续原则：尽可能少写 normalize。normalize 只应该出现在边界层，不应该成为内部数据流的默认动作。

### 5.1 合理的 normalize 场景

可以写 normalize 的情况：

- API 请求体进入系统时
- DB legacy 数据读取时
- SQLite JSON 读取/写入时
- 环境变量、Cookie、Header、URL search params
- 第三方服务返回值，例如 Steam、hCaptcha、Hitokoto
- 旧数据迁移、兼容历史 schema

### 5.2 不应新增 normalize 的场景

避免写 normalize 的情况：

- 同一个可信内部对象在多个函数间传递
- React state 已经由表单控制器保证形状
- 类型系统可以表达的简单默认值
- 只为“保险”重复 trim/stringify/parse
- 没有旧数据来源的新设置 key

### 5.3 替代方案

优先使用：

- Zod/schema 验证 API payload
- 类型明确的 builder/helper
- 单入口 parse，一次性产出稳定结构
- DB 写入前统一转换，读取后不反复转换

如果必须新增 normalize，请在函数旁边说明它处理的边界来源，例如 “API payload”、 “legacy site_config row”、 “SQLite JSON column”。

## 6. 文件结构与函数顺序

后续新增或重排文件时，保持下面顺序：

1. import
2. module-level constants / vars
3. private type aliases（仅限很小且本文件私有）
4. helper functions
5. exported functions / React components

不要把函数随机插在文件中间。相关函数按调用链或领域顺序排列：

- parse/validate
- build/derive
- persist/query
- public/exported API

### 6.1 函数命名

用户规则要求函数使用大驼峰。后续新增业务函数优先使用 PascalCase，尤其是导出的业务 helper、factory、controller。

保留例外：

- Next.js Route Handler：`GET`、`POST`、`PATCH`、`DELETE`
- React Hook：`useXxx`
- React 事件 handler 局部函数可保留 `handleXxx`
- 已有公共函数名不要为了命名风格单独批量改，避免产生无意义 churn
- 第三方约定、测试约定、框架约定优先

## 7. if / switch 规则

当多个条件判断围绕同一个变量展开时，优先使用 `switch`。

适合改成 `switch`：

```ts
switch (mode) {
  case 'oauth':
    return ...
  case 'apikey':
    return ...
  default:
    return ...
}
```

仍可保留 `if`：

- guard clause，例如 `if (!user) return null`
- 只有一个条件
- 两个条件但语义完全不同
- 异常处理或权限短路
- 类型收窄需要更直接的判断

当前项目 `else if` 数量不算非常高，但字符串/枚举选择逻辑散在 route、config 与 utils 中。后续触碰这类逻辑时，应优先改成 `switch`。

## 8. 复杂逻辑拆分规则

遇到以下任一情况，应考虑拆分：

- 单文件超过 500 行且本次还要继续增加逻辑
- 单函数超过 80 行
- 同一个函数同时做 parse、validate、DB、UI state、response
- 一个组件同时处理查询、表单、弹窗、列表、导入导出
- 一个 `lib` 文件同时包含常量、类型、normalize、DB 写入、缓存失效

优先拆分方向：

- `constants/<domain>.ts`：领域常量
- `types/<domain>-<usage>.ts`：共享类型
- `lib/<domain>-parse.ts`：边界解析
- `lib/<domain>-query.ts`：读取
- `lib/<domain>-write.ts`：写入
- `components/<domain>/<part>.tsx`：UI 子组件
- `components/<domain>/use-<feature>.ts`：UI 状态 hook

不要为了“看起来更工程化”拆出没有复用价值的一层。

## 9. 兼容性规则

大多数新增内容不需要兼容旧格式，除非存在明确旧数据来源。

需要兼容的场景：

- `site_config` legacy 表数据
- split/v2 site settings 迁移状态
- SQLite JSON 字段历史写入格式
- 已发布 API 的 request/response
- 已存在 Cookie/localStorage key
- 部署环境变量别名

不需要兼容的场景：

- 新增后台 UI 内部 state
- 新增未发布 API
- 新增 v2-only 设置 key
- 新建组件 props
- 新建 constants/types 文件结构

如果决定保留兼容分支，必须能说明兼容对象是什么。

## 10. 站点设置修改特别规则

站点设置是本项目最复杂的修改区。新增或修改设置时，先判断它属于：

- core
- theme
- schedule
- rules
- status-card
- activity/media
- security

普通新增设置 key 优先进入 split/v2 存储，不要默认给 legacy `site_config` 加实体列。

修改链路通常要检查：

- `constants/site-settings.ts`
- `constants/site-settings-storage.ts`
- `lib/site-settings-read.ts`
- `lib/site-settings-write.ts`
- `lib/llm-site-config.ts`
- `lib/site-config-normalize.ts`
- `components/admin/use-web-settings-controller.ts`
- `components/admin/web-settings-store.ts`
- `types/web-settings.ts`
- 对应 panel/component
- OpenAPI schema 与导入导出接口

如果新 key 只支持迁移后的 v2 存储，应加入迁移保护列表，并在 legacy 状态下返回“请先迁移到新方案”。

## 11. 数据库修改特别规则

数据库变更必须同步：

- `drizzle/schema.pg.ts`
- `drizzle/schema.sqlite.ts`
- `lib/drizzle-schema.ts`

新增列默认可空，不要加 `.notNull()`。只有业务强制不能为 `NULL` 时，才允许 `.notNull()`，并必须带服务端默认值。

SQLite JSON 写入不能直接 bind object/array。写入 SQLite 时必须传 string 或确保已有 helper 会 stringify；读取时只在边界处兼容 string/object。

## 12. API 与 UI 工程化规则

### API Route

API route 应保持薄层：

- 鉴权
- 读取 request
- 调用 `lib/` 业务函数
- 返回 response

不要在 route 中堆复杂 normalize、DB 拼装、大量常量。

### React Component

组件应保持职责清楚：

- UI 展示组件只收 props，不直接处理复杂数据转换
- 表单状态放 hook/store
- 固定选项放 constants
- 共享 props/data types 放 `types/`
- 复杂派生值放 helper

后台大组件后续改动时，优先把“新增功能”放到新子组件/新 hook，不继续扩大原文件。

## 13. 后续 Agent 修改前检查清单

每次修改前先问：

- 这个常量是否被多个文件使用？如果是，是否放进 `constants/<domain>.ts`？
- 这个类型是否跨文件共享？如果是，是否放进 `types/`？
- 这段 normalize 是否真的处理外部输入、旧数据或 DB 边界？
- 是否为了没有历史数据的新功能写了兼容代码？
- 是否有多个同变量分支可以改成 `switch`？
- 文件结构是否仍然是 import -> constants/vars -> types -> functions？
- 新逻辑是否让单文件/单函数明显过大？
- 是否触碰数据库 schema？如果是，PG/SQLite/统一导出是否同步？
- 是否触碰站点设置？如果是，读写链路、UI store、OpenAPI、导入导出是否同步？
- 是否运行至少 `pnpm lint` 或 `pnpm typecheck` 中与本次变更相关的检查？

## 14. 当前不建议立刻做的大动作

以下事项适合单独开工程化任务，不要混进普通业务修改：

- 把所有现有函数批量改成 PascalCase
- 把所有 `lib/*-constants.ts` 一次性迁到 `constants/`
- 把所有散落类型一次性迁到 `types/`
- 把所有 `if` 一次性改成 `switch`
- 大规模重排 `site-settings-read/write`
- 将 `constants/` 或 `types/` 改成仅大小写不同的目录名

后续应采用“触碰到哪里，修正到哪里”的渐进方式，避免无关重构影响真实业务变更。

## 15. 已完成迁移记录

截至 2026-05-10，本报告对应的第一批工程化整理已完成：

- 常量迁移到 `constants/`：`activity-api`、`activity-report`、`activity-stream`、`admin-list`、`device`、`inspiration-manager`、`site-config`、`site-settings`、`site-settings-storage`、`skills`、`status-card`、`viewer-presence`。
- 类型迁移到 `types/`：`activity-history-pending`、`admin-query`、`openapi`、`schedule-manager`、`site-settings`、`skills-auth`、`status-card`、`web-settings`。
- 复杂 helper 拆分：`lib/site-config-values.ts`、`lib/site-settings-record.ts`、`lib/site-settings-read-utils.ts`、`lib/site-settings-write-utils.ts`、`lib/site-settings-write-entries.ts`。
- 状态卡拆分：`lib/status-card-data.ts`、`lib/status-card-activity.ts`、`lib/status-card-text.ts`、`lib/status-card-svg-elements.ts`、`lib/status-card-render-shared.ts`、`lib/status-card-render-classic.ts`、`lib/status-card-render-aurora.ts`、`lib/status-card-render-cover.ts`、`lib/status-card-render-signature.ts`，让 `lib/status-card-svg.ts` 只负责尺寸解析与 variant 分发，当前约 86 行。
- 状态卡预览拆分：`lib/status-card-preview.ts` 承接预览 URL、HTML attribute 转义、资源 key 解析和 hash 逻辑；`types/status-card.ts` 新增 preview draft/source 类型，`constants/status-card.ts` 新增预览默认 draft。
- 主题自定义背景拆分：`lib/theme-custom-surface-preview.ts` 承接背景模式、预览 hint、上传 usage key 与 palette 选项解析，`types/web-settings.ts` 新增预览资源状态类型。
- 站点设置读写拆分：共享类型迁入 `types/site-settings.ts`，`SITE_SETTINGS_SITE_CONFIG_ID` 与迁移提示迁入 `constants/site-settings.ts`，读侧缺表兼容/row 解码与写侧事务/错误/entry rows 已下沉。
- 管理后台组件拆分：`components/admin/device-list-item-actions.tsx`、`components/admin/rule-tools-preview.tsx`、`components/admin/rule-tools-group-list.tsx`、`components/admin/rule-tools-group-editor.tsx` 承接大组件内的可复用 UI 块。
- 规则工具弹窗拆分：`components/admin/rule-tools-media-source-dialog.tsx`、`components/admin/rule-tools-import-dialog.tsx` 承接媒体源与导入规则弹窗，让 `components/admin/web-settings-rule-tools.tsx` 当前降至约 734 行。
- 设备管理弹窗拆分：`components/admin/device-review-dialog.tsx`、`components/admin/device-custom-status-dialog.tsx` 承接审核与自定义状态弹窗，让 `components/admin/device-manager.tsx` 当前降至约 893 行。
- 设备管理列表项拆分：`components/admin/device-list-item.tsx` 承接设备单项展示、删除确认、启停/置顶/Steam 开关与自定义状态入口，让 `components/admin/device-manager.tsx` 当前降至约 747 行。
- 设备管理表单控件拆分：`components/admin/device-create-form.tsx`、`components/admin/device-list-filters.tsx`、`components/admin/device-list-pagination.tsx` 承接创建表单、筛选条和分页摘要，让 `components/admin/device-manager.tsx` 当前降至约 627 行。
- 设备管理状态逻辑拆分：`components/admin/use-device-custom-status-editor.ts`、`components/admin/use-device-list-query-state.ts`、`components/admin/use-device-manager-mutations.ts` 承接自定义状态编辑、设备列表查询与设备 mutation helper，让 `components/admin/device-manager.tsx` 当前降至约 312 行，暂时移出大文件拆分重点。
- 规则工具导入导出拆分：`components/admin/rule-tools-import-export-handlers.ts` 承接复制规则 JSON、导出已用应用 JSON、确认导入规则 JSON，让 `components/admin/use-rule-tools-state.ts` 当前降至约 794 行。
- 规则工具状态拆分：`components/admin/use-rule-tools-editing-state.ts` 承接规则组/列表/媒体源/导入弹窗等编辑态与派生逻辑，让 `components/admin/use-rule-tools-state.ts` 当前只保留保存、回滚与导入导出编排，显著缩小了主 hook 的职责面。
- 当前状态拆分：`components/current-status-utils.ts` 承接电量、设备类型、播放时间、播放进度与媒体源标签等纯派生；`components/current-status-media-row.tsx` 承接媒体 / Steam 行与 marquee / hover / popover 展示；`components/current-status-card.tsx` 承接单卡状态与闪烁签名逻辑；`components/current-status.tsx` 现在只负责列表编排与空态。
- 站点设置 controller 拆分：`components/admin/web-settings-controller-utils.ts` 承接表单构建、深比较、设置导入图片上传、核心 payload 对比与字符串列表去重；`components/admin/use-web-settings-controller.ts` 当前降至约 863 行，后续可继续按保存流程和迁移流程拆分。
- Skills 设置面板拆分：`components/admin/web-settings-skills-auth-panel.tsx` 承接 Skills API Key / OAuth / AI 授权展示与操作；`components/admin/web-settings-skills-mcp-panel.tsx` 承接 legacy MCP 配置、密钥与端点展示；`components/admin/web-settings-skills-panel.tsx` 当前降至约 164 行，只保留总开关、工具模式与区块编排。
- 分支规范补充：`components/admin/lexical-editor.tsx`、`lib/skills-auth/secrets.ts`、`lib/public-page-font.ts` 中同变量多分支已改为 `switch`。
- 清理无用文件：删除未使用的 `lib/inspiration-admin-constants.ts`。
- 分支规范：`components/admin/schedule-manager-utils.ts` 与状态卡相关枚举/扩展名分支已改为 `switch`。
- 已验证：`pnpm typecheck`、`pnpm lint`、`git diff --check` 通过。

## 16. 剩余内容盘点

截至 2026-05-10，按 `app/`、`components/`、`hooks/`、`lib/`、`types/`、`constants/` 这些主要代码目录统计：

| 项目 | 数量 | 说明 |
| --- | ---: | --- |
| 当前 `ts/tsx` 文件总数 | 405 | 不含已删除的旧迁移文件；本轮新增多个拆分组件/hook |
| 已动到的当前 `ts/tsx` 文件 | 约 128 | 包含修改文件与新增文件，按原报告口径顺延估算 |
| 删除/迁移出去的旧 `ts/tsx` 文件 | 15 | 主要是旧 constants/types 文件 |
| 仍未触碰的当前 `ts/tsx` 文件 | 约 277 | 约占当前文件的 68% |
| 当前 400 行以上文件 | 31 | 仍是后续拆分重点 |
| 当前 400 行以上且尚未触碰的文件 | 约 11 | 适合后续单独推进 |
| `types/` 外的 `type/interface` 声明 | 约 210 | 不等于都必须迁移，单文件私有类型可保留 |
| `constants/` 外的大写常量声明 | 约 245 | 不等于都必须迁移，仅共享常量或固写配置优先迁移 |

尚未触碰、且超过 400 行的大文件如下：

| 文件 | 行数 | 后续建议 |
| --- | ---: | --- |
| `components/admin/dashboard.tsx` | 801 | 拆分 dashboard 区块与数据派生 |
| `components/admin/token-manager.tsx` | 670 | 拆分 token 列表、创建表单与操作弹窗 |
| `components/user-profile.tsx` | 606 | 拆分资料展示、社交链接与主题相关派生 |
| `lib/openapi/components/schemas.ts` | 555 | 按 schema 领域拆分或生成结构梳理 |
| `app/api/llm/md/route.ts` | 551 | Route 保持薄层，复杂逻辑下沉到 `lib/` |
| `lib/schedule-courses.ts` | 535 | 拆分课程数据模型、时间计算与格式化 |
| `components/admin/admin-query-mutations.ts` | 527 | 按后台资源拆分 mutation helper |
| `components/admin/schedule-course-editor-dialog.tsx` | 519 | 拆分课程基础信息、时间段与校验提示 |
| `lib/theme-custom-surface.ts` | 479 | 拆分主题 surface 解析、资源映射与 CSS 生成 |
| `components/site-theme-runtime.tsx` | 422 | 拆分运行时主题状态与 DOM 注入逻辑 |
| `components/ui/select.tsx` | 400 | UI 基础组件，除非有明确需求不建议主动重构 |

当前仍需要记录并继续推进的内容：

- `components/admin/device-manager.tsx` 已降至约 312 行，剩余只有高亮/审核接线与轻量表单 state，暂不再作为优先拆分对象。
- `components/admin/use-rule-tools-state.ts` 仍有约 794 行，是下一轮最划算入口：优先拆列表操作、规则组操作、编辑缓存与查询状态。
- `components/current-status.tsx` 已完成首轮拆分，当前只保留入口编排；`components/current-status-card.tsx` 与 `components/current-status-media-row.tsx` 承接主要展示逻辑，后续如再改动优先维持这一分层。
- `components/admin/web-settings-skills-panel.tsx` 已完成首轮拆分，当前主文件约 164 行；后续如继续优化，优先拆 `web-settings-skills-auth-panel.tsx` 内的 AI 授权列表/弹窗。
- `components/admin/use-web-settings-controller.ts` 已完成首轮 helper 拆分，当前仍约 863 行；后续优先拆 `save` 保存流程、skills 保存同步和迁移操作。
- 仍在 700 行以上的大文件包括 `components/admin/use-web-settings-controller.ts`、`components/admin/web-settings-custom-surface.tsx`、`components/admin/schedule-manager.tsx`、`components/admin/dashboard.tsx`、`lib/site-settings-write.ts`、`lib/site-settings-read.ts`、`components/admin/web-settings-rule-tools.tsx`、`components/admin/status-card-preview-panel.tsx`。
- 共享类型/常量仍然采用“触碰到哪里迁到哪里”的方式，不做清零式批量迁移。

下一轮最划算的推进顺序：

1. 继续处理 `components/admin/use-web-settings-controller.ts`，优先把 `save` 保存流程和 skills 同步保存拆成独立 helper/hook。
2. 渐进拆 `components/admin/web-settings-rule-tools.tsx` 剩余状态派生；避免再把新功能塞回主文件。
3. 渐进拆 `components/admin/dashboard.tsx`、`components/admin/token-manager.tsx` 或 `components/user-profile.tsx`，优先挑最容易独立抽出的展示区块。
4. 渐进迁移仍散落的共享类型与共享常量；不要为了数字清零批量移动私有类型或局部常量。
