# Mobile Frontend 沙盒

这个文件夹是**当前线上首页前端的完整快照**，用来独立设计/重做一版**手机端**前端，不影响线上代码。

> 复制自 `components/homepage/`、`styles/`、`public/assets/homepage/`（快照时间见 git）。
> 这里的组件保留了 `@/...` 的导入路径，作为**设计参考**，不是独立可运行工程。
> 设计稿满意后，按下面「集成方式」把改好的组件回填到 `components/homepage/`。

## 目录结构

```
mobile-frontend/
├── components/        # 当前首页的全部前端组件（17 个）
├── styles/            # homepage.css（首页样式，桌面端为主）+ noto-serif-sc.css
├── assets/            # 三个区块的立绘配图（png 原图 + webp 压缩版）
└── README.md
```

## 页面结构（单页滚动）

```
┌─ HERO（首屏 above-the-fold）──────────────┐
│  左上：时钟(HeroClock) + 天气(HeroWeather) │
│  中部：问候(HeroGreeting) + 副标题         │
│        (HeroSubtitle) + 搜索框(HeroSearch) │
│  底部：在线状态 + 向下滚动提示 scroll-cue   │
├─ 首屏外（below-the-fold，滚动到才加载）─────┤
│  01 关于我   DemoAboutSection              │
│  02 此刻     LiveNowBanner/Section + Today │
│  03 灵感     LiveInspirationStage + Blog   │
└────────────────────────────────────────────┘
```

## 组件清单

| 组件 | 作用 | 类型 |
|------|------|------|
| `personal-home-page.tsx` | 页面容器：HERO + 首屏外 | 组装 |
| `home-below-the-fold.tsx` | 首屏外**视口懒加载**包装（IntersectionObserver）| client |
| `hero-clock.tsx` | 24h 数字时钟（访客本地时间）| client |
| `hero-weather.tsx` | 左上角天气卡（hover 展开）| client |
| `hero-greeting.tsx` | 时段问候语 | client |
| `hero-subtitle.tsx` | 副标题/一言 | client |
| `hero-search.tsx` | 多引擎搜索框 | client |
| `homepage-reused-section.tsx` | 首屏外三大区块的装配 | 组装 |
| `live-now-banner.tsx` / `live-now-section.tsx` | 「此刻」实时活动（SSE）| client |
| `now-section-view.tsx` / `today-section.tsx` | 今日统计 / Steam 等 | client |
| `live-inspiration-stage.tsx` / `inspiration-stage-view.tsx` | 「灵感」随想流 | client |
| `blog-strip.tsx` | 博客最新文章条 | client |
| `demo-content.tsx` | 无真实数据时的 demo 占位 | 组装 |
| `constants.ts` | 搜索引擎列表、时段常量、工具函数 | - |

## 数据接口（重做时必须保持）

首屏外内容的数据由 **`app/page.tsx`（服务端）** 获取，通过 props 传入：

`PersonalHomePage` 接收：
- `homepageSettings`、`userName`
- `reusedSectionProps`（→ 透传给 `HomepageReusedSection`）

`HomepageReusedSectionProps` 关键字段（完整定义见 `homepage-reused-section.tsx` 顶部 interface）：
- 活动/此刻：`activityInitialFeed`、`activityUpdateMode`、`hideActivityMedia`、`todaySummary`、`steamGames`
- 关于我：`userName`、`userBio`、`avatarSrc`、`aboutProfile`、`todayStatus*`、`userNote`、一言相关 `noteHitokoto*`
- 课程表：`showScheduleHomeColumn`、`scheduleCoursesForHome`、`schedulePeriodTemplate`、`scheduleHome*`
- 灵感：`inspirationHomeEntries`、`inspirationTotal`、`hideInspirationOnHome`、`earlierText`
- 博客：`blogPosts`、`blogHomeUrl`
- 其它：`demoEnabled`、`currentlyText`

**手机端重做只要保持这些 props 的形状不变**，数据逻辑和 API 路由（天气、活动、SSE）都不用动。

## 宿主应用提供的依赖（未复制，集成时由 app 提供）

这些组件在线上从 `@/...` 引入，沙盒里没有复制（设计时把它们当黑盒）：
- `@/components/activity-feed-provider`（SSE 活动流 Provider）
- `@/components/lenis-smooth-scroll`、`@/components/home-scrollbar-hider`
- `@/components/public-page-transition-shell`、`@/components/site-theme-runtime`
- `@/components/layout-footer-portal`、`@/components/site-lock-form`
- `@/components/schedule-home-in-class-banner`
- `@/lib/*`（数据/类型）、`@/types/*`

## 集成方式（设计完回填）

1. 在 `mobile-frontend/components/` 里改好组件（或新增手机端布局组件）。
2. 把改动覆盖回 `components/homepage/` 对应文件。
3. 样式改 `styles/homepage.css`。
4. `app/page.tsx` 的接线（`<PersonalHomePage .../>`）通常不用动——只要 props 形状没变。

## 手机端设计建议

- 现有 `homepage-reused-section.tsx` 用了固定的 `01/02/03` 分栏式排版（`sec-head`/`sec-num`/`sec-rule`），桌面端横向留白多；手机端建议改成单列纵向卡片流。
- HERO 的左上时钟+天气、中部搜索在窄屏要重新堆叠（现在是绝对定位/分散布局）。
- 断点：`styles/homepage.css` 目前以桌面为主，可加 `@media (max-width: 768px)` 覆盖，或为手机端单独写一套类名。
- 首屏外已是懒加载（`home-below-the-fold.tsx`），手机端可沿用——滚动到再加载，省流量。
- 立绘配图（`assets/section-*-companion.*`）在手机端可能要缩小或隐藏，注意 `.webp` 才 ~15KB，优先用它。
- 实时部分（此刻/SSE）在手机端默认折叠、点开再连，能进一步省电省流量。
