# 管理后台：首页设置面板 — Codex 任务清单

## 背景

仓库：https://github.com/apograss/waken-wa（fork 自 MoYoez/waken-wa）

我们在首页（`app/page.tsx`）新增了个人主页扩展模块（搜索框、天气、问候语、demo 填充等），目前这些模块的配置全部硬编码在代码里。需要把它们接入 waken-wa 已有的 v2 site_settings 存储系统，并在 admin 后台加一个设置面板让站主可以在线修改。

技术栈：Next.js 16 + React 19 + Tailwind 4 + Drizzle ORM（双 schema SQLite/PG）+ i18next

**开始前必读：** 仓库根目录的 `AGENTS.md`，里面有完整的开发规范、设置 key 注册链路、代码风格要求。

---

## 新增 Site Settings Key 清单

| Key | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| `homepageVisibleEngines` | `string[]` (JSON) | `['baidu','bing','google','yandex','sogou','360']` | 首页搜索框中可见的搜索引擎 ID 列表 |
| `homepageDefaultEngine` | `string` | `'bing'` | 首页搜索框的默认选中引擎 |
| `homepageGreetingSource` | `'hitokoto' \| 'custom'` | `'hitokoto'` | Hero 副标题文字来源（一言 API 或自定义） |
| `homepageGreetingCustomText` | `string` | `''` | 自定义问候语文字（仅 source=custom 时生效） |
| `homepageWeatherEnabled` | `boolean` | `true` | 天气模块是否显示 |
| `homepageDemoEnabled` | `boolean` | `true` | 无真实数据时是否显示 demo 填充内容 |
| `homepageCoverImage` | `string` | `'/assets/cover.png'` | Hero 区域背景图路径（支持上传后的路径） |

---

## 任务分解

### Task 1: 注册设置 key（v2 存储）

需要修改的文件（按 AGENTS.md 中"站点设置特别规则"的链路）：

1. `constants/site-settings.ts` — 添加 key 字符串常量
2. `constants/site-settings-storage.ts` — 声明这些 key 属于哪个分类（建议归入 core 或新建 homepage 分类）
3. `lib/site-config-normalize.ts` — 为每个 key 添加默认值兜底
4. `types/web-settings.ts` — 添加 TypeScript 类型定义
5. `lib/llm-site-config.ts` 的 `prepareSiteConfigValuesFromPayload` — 如果需要从 payload 解析

**注意：** 这些 key 走 v2 存储（`site_config_v2_entries` 表），不要给 legacy `site_config` 表加列。

### Task 2: 添加设置读取逻辑

1. `lib/site-settings-read.ts` — 添加读取函数（或在现有函数中扩展）
2. `app/page.tsx` — 在 `Home()` 函数中读取这些设置值，传给 `<PersonalHomePage>` 组件

当前 `app/page.tsx` 中 `PersonalHomePage` 只接收 `userName` 和 `reusedSectionProps`，需要扩展 props 接口加入新设置。

### Task 3: 添加设置写入逻辑

1. `lib/site-settings-write-core.ts`（或 `lib/site-settings-write-entries.ts`）— 添加写入处理
2. 确保写入时做基本校验（如 `homepageVisibleEngines` 必须是合法引擎 ID 数组）

### Task 4: 创建 Admin UI 面板

在 `components/admin/` 下新建 `homepage-settings-panel.tsx`：

**面板内容：**
- **搜索引擎管理**
  - 勾选框列表：选择哪些引擎对访客可见
  - 下拉选择：默认引擎（从可见列表中选）
- **问候语设置**
  - Radio：来源选择（一言 API / 自定义文字）
  - 文本输入：自定义文字（仅 source=custom 时可编辑）
- **天气模块**
  - 开关：是否显示天气
- **Demo 模式**
  - 开关：无真实数据时是否显示 demo 填充
- **背景图**
  - 图片预览 + 上传按钮（或 URL 输入）
  - 预览当前背景图

**参考现有面板：** `components/admin/web-settings-custom-surface-style-panel.tsx` 的结构和模式。

### Task 5: 在 Admin 路由中挂载面板

- 在 admin 设置页面中添加"首页设置"section
- 参考 `components/admin/use-web-settings-controller.ts` 和 `components/admin/web-settings-store.ts` 的状态管理模式
- 确保保存按钮调用正确的写入 API

### Task 6: 前端组件消费设置

修改以下组件，从 props 读取设置而非硬编码：

| 组件 | 需要读取的设置 | 当前硬编码位置 |
|------|---------------|---------------|
| `components/homepage/hero-search.tsx` | `visibleEngines`, `defaultEngine` | `DEFAULT_SEARCH_ENGINES` 全量 + 硬编码 bing |
| `components/homepage/hero-subtitle.tsx` | `greetingSource`, `customText` | 硬编码调用 hitokoto API |
| `components/homepage/hero-weather.tsx` | `weatherEnabled` | 无条件渲染 |
| `components/homepage/homepage-reused-section.tsx` | `demoEnabled` | `SHOW_DEMO_WHEN_EMPTY = true` 硬编码 |
| `components/homepage/personal-home-page.tsx` | `coverImage` | 无（CSS 中硬编码 `/assets/cover.png`） |
| `styles/homepage.css` 第 42 行 | `coverImage` | `background-image: url('/assets/cover.png')` |

**背景图动态化方案：** CSS 中的 `background-image` 无法直接从 props 读取。建议改为在 `personal-home-page.tsx` 的 `.hero` div 上用 inline style 设置 `backgroundImage`，删除 CSS 中的硬编码。

### Task 7: 添加 i18n 文案

在 `public/locales/zh-CN/admin.json` 和 `public/locales/en/admin.json` 中添加面板相关文案：
- 面板标题："首页设置" / "Homepage Settings"
- 各设置项的标签和描述
- 保存成功/失败提示

---

## 关键注意事项

1. **必须先读 AGENTS.md** — 里面有设置 key 的完整注册链路（涉及 10+ 个文件）
2. 新 key 走 v2 存储，**不要**给 legacy `site_config` 表加列
3. 如果涉及 DB schema 变更，必须同步 `drizzle/schema.pg.ts` 和 `drizzle/schema.sqlite.ts`
4. Admin UI 组件遵循 shadcn 风格（Radix UI + Tailwind）
5. 所有文案走 i18n，不硬编码中文
6. 代码注释用英文（仓库惯例）
7. 函数命名优先 PascalCase（导出的 helper/factory/controller）
8. 单文件不超过 500 行，超了就拆

---

## 验收标准

- [ ] 在 `/admin` 后台能看到"首页设置"面板
- [ ] 修改搜索引擎可见性后，首页刷新反映变更
- [ ] 修改默认引擎后，新访客（无 localStorage）看到新默认
- [ ] 切换问候语来源后，首页副标题相应变化
- [ ] 关闭天气后，首页右上角天气卡消失
- [ ] 关闭 demo 后，无真实数据时下半屏显示空状态而非 demo
- [ ] 上传新背景图后，Hero 区域背景更新
- [ ] TypeScript 零错误（`npx tsc --noEmit`）
- [ ] 所有设置持久化到数据库，重启后不丢失
