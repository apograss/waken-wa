# 灵感来源参考：Shiro & Sleepy

> 整理 waken-wa 的两个灵感来源，挑出值得抄、值得想、不抄三类。

## 一、Shiro（Innei/Shiro · 4.2k stars · NextJS 16 + React + TS）

**示例站**：[innei.in](https://innei.in/)（静かな森） — 极简纸雪美学个人站
**设计语言**：极简纸雪 / Spring 物理动画 / 大量留白 / 中英混排刊物感

### 已具备且我们做得不错（不用抄）

| 已有 | 状态 |
|------|------|
| Hero 区域 + 活动流 + 时间线 | ✅ 我们也有 hero / 此刻 / 灵感 |
| 实时 ProcessReporter 活动状态 | ✅ waken-wa 自带这套，我们已接入 |
| TailwindCSS v4 / NextJS 16 / React | ✅ 同栈 |
| 极简留白美学 | ✅ Fraunces + 思源宋体已经很接近 |

### 值得抄/借鉴

#### 1. **Spring 物理动画**（高 ROI）
Shiro 用 Motion 做符合物理学的弹簧动画。我们的页面目前几乎没动画，加上之后能立刻提升质感。

**最该上的位置**：
- 卡片 hover/进入视口时的轻微浮起（`whileInView` + spring）
- section 03 灵感纸便签的 stagger 入场
- now-banner 的 LIVE 角标 pulse 改 spring（不是线性）
- 主页滚动时 hero 视差 / 渐隐

**实现成本**：低。Motion 已经是事实标准，加个 `motion/react` 依赖就行。

#### 2. **思考（Recently/Musings）页**（中 ROI）
Innei 主页的「碎念」一栏：「AI 不会代替你，但是比你会用 AI 的人，会。」这种短句一两行 + 时间。
我们的 `03 灵感` 现在偏长文摘要，可以**多加一种短篇形态**——更接近 Twitter 的 250 字以内日常碎念。

**做法**：
- 用 waken-wa 自带的 `inspiration` 表，给它加一个 `kind` 字段：`note` / `musing` / `image`
- 短的当 musing 渲染（无标题，只有时间戳 + 一两句话）
- 长的当 note 渲染（保留现在的便签形态）

#### 3. **来信（Letters）模块**（中 ROI）
Innei 主页有「LETTERS 来信」区，访客留言变成主页装饰元素，每条带头像、来信人、回复链接。
非常符合「家」的氛围。

**最简实现**：
- 用 waken-wa 现有评论表（如果有）或新建 `letters` 表
- 主页第四个 section 「04 来信」摆几张「信封纸」
- 灵感来自[innei.in 的 musing 段落]

**取舍**：需要登录/防垃圾，复杂度上来了。**可以放 v2**。

#### 4. **「站点字数 / 天数」徽章**（低 ROI 但好看）
Innei 主页顶部一行：「363篇·127万字·2816天」——非常有作家气质。

**做法**：build 时统计 inspiration 数量、累计字数、注册到现在的天数，写到 hero meta 条里。

```
现在的 glance bar:  下午好，apograss · 在写论文 · 晴 25°C
加上字数后:          下午好 · 在写论文 · 26 篇·8.4 万字·245 天
```

#### 5. **季节式时间线**（低 ROI 但有趣）
Innei 把全年文章按「春·夏·秋·冬」分组：「春 1 篇 2025 / 夏 8 篇 2025…」
比单纯月份漂亮得多。

**做法**：`/inspiration` 列表页（如果有的话）按季节分组。

#### 6. **每日诗词**（低 ROI 但锦上添花）
Shiroi 赞助版有「今日诗词」（[jinrishici.com](https://www.jinrishici.com/) 免费 API）。
我们 hero 现在的「下午好 / 一言」可以改为：
- **早上**：今日诗词
- **下午**：一言
- **晚上**：私人状态文本

### 不抄

- ❌ **Mix Space 后端**：Shiro 是套主题，配套 Mix Space CMS，我们不可能换后端
- ❌ **WebSocket 实时通知**：waken-wa 已经有 SSE 活动流，再加一套通知没必要
- ❌ **AGPLv3 + 商业附加条款**：注意 Shiro 是 AGPLv3，**抄代码会有许可证传染**。所以只能抄思路、抄设计、抄交互，**不能 copy-paste 代码**

---

## 二、Sleepy（sleepy-project/sleepy · 417 stars · Flask Python + 朴素 HTML）

**核心定位**：「视奸」别人在做什么 — 在线状态聚合页
**示例站**：[sleepy.wyf9.top](https://sleepy.wyf9.top/) / [sleepy-preview.wyf9.top](https://sleepy-preview.wyf9.top/)
**特点**：客户端覆盖面非常广（Win / Linux / iOS+macOS / Android / 油猴）

### 已具备且更强（不用抄）

| 已有 | 状态 |
|------|------|
| 设备状态聚合 | ✅ waken-wa 比 sleepy 更全（Steam / 媒体 / 电量） |
| API + 客户端协议 | ✅ waken-wa 有完整 OpenAPI 和 4 平台 reporter |
| 自定义状态列表 | ✅ admin 设置就有 |

### 值得抄/借鉴

#### 1. **「自定义在线状态」明示开关**（中 ROI）
Sleepy 让站主直接在前端切「活着 / 似了 / 再睡 5 分钟」，访客一眼能看到。
waken-wa 现在的状态条是从设备活动**推断**出来的，但**没有「我手动声明」的 manual override**。

**做法**：
- admin 加一个「手动状态」开关 + 文本框：「正在写论文，请勿打扰至 13:42」
- 这个手动状态优先级高于设备活动推断
- 用 hitokoto fallback 时，手动状态优先

**收益**：人格化，不再像「监控大屏」

#### 2. **Steam mini iframe**（低 ROI 但好玩）
Sleepy 直接抄了 [steam-miniprofile](https://github.com/gamer2810/steam-miniprofile) 的 iframe 嵌入。
点 Steam 用户名直接展开你的库存、最近游戏、好友。

**做法**：「02 此刻」的游戏卡 hover 时显示 Steam mini profile。
**取舍**：iframe 不可信内容、CSP 麻烦。**可以放 v2**。

#### 3. **Metrics 公开接口**（中 ROI）
Sleepy 有公开的 `/metrics` JSON，谁都能爬。这就让别人可以做：
- 自己的 Twitter bot 自动同步状态
- 朋友圈聚合页（多个站主合并）
- 插件 / 桌面 widget

waken-wa 已经有 `/api/openapi.json` 了，但**对外暴露的 read-only metrics 端点要更清晰**。

**做法**：检查 admin 「Skills/MCP」面板的开关，开个公开只读端点 `/api/public/glance` 返回当前状态精简 JSON。

#### 4. **多客户端覆盖**（信息收集）
Sleepy 的客户端列表：Win/Linux/iOS+macOS/Android/油猴/Niri。waken-wa 当前只有 mac dmg + Android apk + Linux deb/AppImage + Windows exe，**iOS 和油猴脚本是缺的**。

**做法**：v2 自己写一个浏览器油猴脚本（或 Web Extension），用浏览器访问页面时自动上报「正在浏览：xxx」。
**好处**：苹果生态/不愿装 reporter 的访客也能反向上报（如果他们愿意）。

### 不抄

- ❌ **Flask Python 后端**：换栈成本无穷
- ❌ **「视奸」表述**：太网梗化了，apograss.cn 的定位是「私人主页」不是「网友状态板」
- ❌ **后端管理面板**：waken-wa 自带的 admin 比 sleepy 强很多

---

## 三、综合建议：v1 点火后能马上上的几样

按 ROI 排序，每项独立可做：

| 优先级 | 项目 | 估时 | 依赖 |
|--------|------|------|------|
| ⭐⭐⭐ | Motion spring 动画（hero 视差 + 卡片浮起 + section 入场） | 半天 | `motion/react` |
| ⭐⭐⭐ | 「手动状态」覆盖（admin 加一个开关 + 文本框） | 半天 | 改 admin + glance bar |
| ⭐⭐ | 字数/天数徽章 | 1 小时 | inspiration 表已有 |
| ⭐⭐ | 早上诗词 / 晚上私人状态（hero greeting 三段式） | 1 小时 | jinrishici API |
| ⭐⭐ | 公开 read-only `/api/public/glance` JSON | 半天 | 已有 admin 控制 |
| ⭐ | section 04 「来信」 | 1 天 | 需新建表 + 防垃圾 |
| ⭐ | inspiration 短/长两态（musings + notes） | 1 天 | 加 `kind` 字段 |
| ⭐ | Steam mini profile hover | 半天 | iframe + CSP 调整 |
| 推后 | 季节时间线 | 1 天 | 仅 listing 页用 |
| 推后 | 油猴脚本 reporter | 2 天 | 独立项目 |

---

## 四、一个建议的"美学一致性"原则

Shiro 的核心是「极简纸雪」——这正好是我们目前选的方向（Fraunces + 思源宋体 + 大量留白 + editorial caption + figure-label 角标）。

**别去抄 sleepy 的「网梗 + 看板」风格**，我们要走 **Innei / Shiroi 那种「书房窗口」的感觉**。

具体来说：
- ✅ 字体：保持 Fraunces + 思源宋体
- ✅ 配色：保持现在的暖灰底（cover.png）
- ✅ 装饰：立绘 + 漂浮便签
- ❌ 不要：荧光绿色「活着」灯、大字号 emoji、看板式表格
- ❌ 不要：QQ 群截图、视奸字眼

---

## 五、是否需要本仓库依赖任何 Shiro/Sleepy 的代码？

**不需要。**

我们的栈是 NextJS 16 + React 19 + Tailwind 4 + Drizzle，跟 Shiro 完全相同。
但 Shiro 是 AGPLv3 + 商业附加条款，**直接复制代码会污染我们的仓库**。
建议：**只看 demo 网站、抄思路、抄交互、自己实现**。

Sleepy 是 MIT，但栈不同（Flask Python），代码层面也用不上。

---

**当前 fork commit 头**：`e3f3ee4 docs(点火测试): 整理第一次接入真实设备的测试计划`
