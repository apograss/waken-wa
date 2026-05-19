# Homepage Frontend 模块

这个文件夹包含了个人主页扩展的所有前端代码，方便独立查看和重做。

## 目录结构

```
homepage-frontend/
├── components/          # React 组件
│   ├── personal-home-page.tsx    # 页面容器（上1/3 + 下2/3 布局）
│   ├── digital-clock.tsx         # 数字时钟（24h，访客本地时间）
│   ├── weather-module.tsx        # 天气小卡（左上角，hover 展开）
│   ├── search-box.tsx            # 多引擎搜索框
│   ├── search-engine-dropdown.tsx # 引擎下拉菜单
│   ├── greeting-module.tsx       # 时段问候语
│   ├── homepage-reused-section.tsx # 下半屏：装配 waken-wa 原有组件
│   └── constants.ts              # 搜索引擎列表、时段常量、工具函数
├── api/                 # Next.js API 路由
│   ├── geolocation/route.ts      # IP 定位代理
│   └── weather/route.ts          # 天气 API 代理（和风 + GFS fallback）
├── icons/               # 搜索引擎 SVG 图标
├── i18n-zh-CN.json      # 中文文案
├── i18n-en.json         # 英文文案
└── README.md            # 本文件
```

## 页面布局

```
┌─────────────────────────────────────┐
│ ☁ 22°  ← 左上角天气（hover 展开）
│                                     │
│         14:32:08            ← 数字时钟 24h
│                                     │
│      [搜索框]               ← 多引擎切换
│       早上好                ← 时段问候
│                                     │
├─────────────────────────────────────┤
│   waken-wa 原有模块                  │
│   （头像/状态/日程/活动/随想/访客数） │
└─────────────────────────────────────┘
```

## 技术栈

- React 19 + Next.js 16 App Router
- Tailwind 4（使用 waken-wa 的 CSS 变量：foreground, muted-foreground, border 等）
- Radix UI（下拉菜单等）

## 数据流

- 时钟：纯客户端 `Date.now()`
- 天气：客户端 → `/api/homepage/geolocation` → `/api/homepage/weather`
- 搜索引擎偏好：localStorage
- 下半屏数据：由 waken-wa 的 `app/page.tsx` 服务端获取后通过 props 传入

## 集成方式

在 `app/page.tsx` 中：
```tsx
import { PersonalHomePage } from '@/components/homepage/personal-home-page'

// 在 return 中替换原有的 <main> 为：
<PersonalHomePage reusedSectionProps={...} />
```

## 如果要重做前端

你只需要关注 `components/` 目录。API 路由和数据逻辑可以保持不变。
重做时需要保持的接口：
1. `PersonalHomePage` 接收 `reusedSectionProps`（waken-wa 原有组件的 props）
2. `HomepageReusedSection` 负责渲染 waken-wa 的原有模块
3. 天气数据从 `/api/homepage/geolocation` + `/api/homepage/weather` 获取
4. 搜索引擎列表在 `constants.ts` 中定义
