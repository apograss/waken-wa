# Favicon 设计 · apograss.cn

- 日期：2026-06-12
- 状态：已定稿，落地

## 背景

站点 favicon 走 `/api/site/icon` 动态接口；后台未上传图标时，回退到 `lib/site-default-icon.tsx` 的默认图标。原默认图标是「紫黑径向渐变 + Material 魔法棒」，属模板占位，与站点暖色文艺调性完全不搭。

## 站点调性（设计依据）

- 配色：象牙暖白底 + 赤陶/砖红主色（`--primary` = `oklch(0.42 0.07 40)`）
- 字体：思源宋体 + **Satisfy** 英文手写花体（`layout.tsx` 已加载）
- 气质：文艺、亲切；板块「此刻 / 今日 / 灵感 / 关于」
- 身份：apograss（域名 apograss.cn）

## 设计决策

- 图形：小写字母 **a**（apograss 首字母，个人签名感）
- 字形：**Satisfy** 书法手写体的 a —— 与站点英文字体同源，风格统一
- 配色：鲜赤陶底 `#B05C38` + 反白象牙 `#FAF6EE`
- 形态：squircle 圆角（`borderRadius 28` / 128），居中
- 尺寸：128×128 PNG，沿用现有 `ImageResponse` 架构

## 取舍

- 选鲜赤陶而非站点原色深红棕 `#6D3F2F`：深红棕在深色标签栏背景下对比弱、偏闷。
- 16px 实际尺寸下 Satisfy 书法尾锋略糊，但手写 a 轮廓仍可辨；为保留书法韵味接受。
- 字形烘焙为**静态矢量 path** 嵌入代码，不依赖运行时字体加载。

## 落地

- 文件：`lib/site-default-icon.tsx`
- 改 `createDefaultSiteIconResponse`：背景换赤陶圆角、移除玻璃块、改用 Satisfy a 的 path。
- path 来源：Google Fonts `Satisfy-Regular`（Apache-2.0），用 opentype.js 提取轮廓并居中到 `0 0 128 128`。
- 不改 `/api/site/icon` 路由与后台上传机制；后台仍可随时覆盖。

## 验证

- 已用 sharp 渲染等价 SVG，确认 128 / 64 / 32 / 16 各尺寸在深浅标签栏背景下的观感。
- `tsc --noEmit` 类型检查通过。
