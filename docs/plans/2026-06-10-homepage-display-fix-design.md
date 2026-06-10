# 首页真实数据展示修复 · 设计

> 2026-06-10。点火接入真实设备后，首页「02 此刻」区块的真实数据展示出现 6+1 个问题，本设计统一修复。

## 背景

reporter 真实数据接入后（设备 `APOGRASS`、活动 `✳ Claude Code` / `WindowsTerminal.exe`、媒体 B 站视频），首页出现：

1. hero 大标题从单词中间硬断（`Wi↵ndowsTerminal`）—— `splitForBanner` 对开头带短前缀+空格的标题退化成按字数中点硬切
2. `.exe` 到处暴露（hero / 设备 meta / 正在做 / 历史）
3. `✳` 前缀直出（reporter 上报的 `process_title` 自带）
4. `process_title` + `process_name` 在多处重复堆叠
5. 「已打开 0 分钟」
6. 媒体标题带站点后缀（`_哔哩哔哩_bilibili`）
7. hero 时间叠在立绘上、对比度过低

## 设计决策（已与站主确认）

- **应用名展示**：智能美化（去 `.exe/.app` 后缀 + 驼峰/分隔符转空格 + 首字母大写）+ 常见别名表兜底
- **hero 大标题**：只显示 `cleanActivityTitle(processTitle)`（清洗掉装饰符），不再拼接进程名；应用名/设备细节交由下方「正在做 / 设备」区块承载

## 方案

1. **新建 `lib/activity-display.ts`**（集中清洗/美化）
   - `prettifyAppName(name)`：去后缀 → 查别名表 → 未命中则驼峰/分隔转空格 + 首字母大写
   - `cleanActivityTitle(title)`：剥离开头装饰符（`✳✶◆•·` 等）+ trim
   - 别名表放 `constants/`（如 `constants/app-display.ts`），便于增量维护
2. **`lib/activity-media.ts` · `getMediaDisplay`**：title 经 `cleanMediaTitle` 去站点后缀（`_哔哩哔哩_bilibili`、`- YouTube`、`_网易云音乐` 等），只留主体（边界层清洗）
3. **`components/homepage/live-now-banner.tsx`**：hero 标题 = `cleanActivityTitle(processTitle)`，无标题回退 `prettifyAppName(processName)`；**删除 `splitForBanner` 硬拆**，短标题靠 CSS 自然换行、长标题 `line-clamp` 省略号，绝不从单词中间切；media chip title 走清洗
4. **`components/homepage/live-now-section.tsx`**：设备 meta / `buildDoingApp` / 历史 全部 `prettifyAppName`；`已打开 0 分钟` → `不到 1 分钟`；`doing.title` / 历史 title 走 `cleanActivityTitle`
5. **`styles/homepage.css`**：hero 时间叠立绘处加文字阴影/半透明底提对比；banner 标题换行兜底（`overflow-wrap`，禁止 `break-all`）

## 落地约束

- 以 **VPS 为唯一基准**（最新 = `49d988b`），**绕开 GitHub**（GitHub 落后）
- 本地改（本地与 VPS 同为 `49d988b`、工作区均干净，逐文件一致）→ `pnpm lint` + `typecheck` → 改动文件 `scp` 直传 VPS `~/waken-wa-deploy/waken-wa/` → VPS `docker compose build && up -d`（构建在 VPS 本地，吃 swap）→ 对照截图逐项核验

## 验证

- 三个 helper 为纯函数（输入→输出可核）
- 项目无测试框架 → 以 `pnpm typecheck` + 人工对照截图核验各项；不为此硬塞测试框架（YAGNI）
