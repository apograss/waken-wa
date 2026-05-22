# 第一次点火测试 · 接入真实设备

> 目的：在本地 dev 环境跑通「真实设备 → reporter 上报 → 后端入库 → 首页展示」的完整链路，确认我们的修改没有打破原有功能。

## 一、当前状态盘点

### 已完成（waken-wa fork 上的所有修改）

| 模块 | 状态 | 说明 |
|------|------|------|
| 首页 hero（时钟 / 搜索框 / 问候 / glance） | ✅ | `app/page.tsx` |
| 天气模块（左上角 + 12 小时预报） | ✅ | 和风天气主，GFS fallback；`HEFENG_API_KEY` 已配 |
| IP 定位 | ✅ | `ipinfo.dkly.net`，城市英文 |
| 字体（思源宋体自托管 woff2） | ✅ | `public/fonts/noto-serif-sc/`、`styles/noto-serif-sc.css` |
| 多引擎搜索（百度/必应/谷歌/Yandex/搜狗/360） | ✅ | `public/icons/*.svg` |
| 三个下半屏 section（关于我 / 此刻 / 灵感） | ✅ | 双栏 + 立绘 + 漂浮便签 |
| 立绘装饰（约 800KB ×3） | ✅ | `public/assets/homepage/section-{about,now,inspiration}-companion.png` |
| Admin 首页设置面板 | ✅ | `/admin` → 网站设置 → 进阶；7 个 v2 site_settings keys |

### 数据库与登录

- SQLite，路径 `data/dev.db`，340KB（已初始化，admin 账号已建）
- `JWT_SECRET` 在 `.env` 中**未设置**——dev 模式下后端可能拒绝鉴权，**需要先确认能正常登录 `/admin`**

### 未做但应在点火前确认

- [ ] `JWT_SECRET` 是否需要补，或 dev 模式自动生成
- [ ] 确认 admin 设置面板里的「保存设备活动应用记录」开关状态
- [ ] 确认「自动接受新设备」开关状态——影响首次接入要不要手动审核

---

## 二、点火测试流程（建议顺序）

### Step 1：确认服务跑得动

```bash
# 已经在跑就跳过
# 如果要重启：
export PATH="/Users/apograss/.local/share/fnm/node-versions/v22.22.3/installation/bin:$PATH"
pnpm dev
```

验证：
- 浏览器打开 `http://localhost:3000` → 首页正常
- 浏览器打开 `http://localhost:3000/admin` → 能登录

### Step 2：在 admin 创建 API Token

1. `/admin` → API Token 页
2. 点「创建 Token」
3. **完整复制 Token**（只显示一次，遗失要重新创建）

### Step 3：在 admin 创建设备

1. `/admin` → 设备管理（Device Management）
2. 点「Add Device」
3. 设备名：例如 `apograss MacBook Pro`
4. `GeneratedHashKey`：可以让系统随机生成，或自己起一个（要求稳定不变）
5. 设备状态确认为 `active`

> 也可以先打开「自动接受新设备」开关（在网站设置里），第一次上报时自动建条目。两种做法二选一。

### Step 4：先用 curl 单次自检（不依赖任何 reporter）

```bash
# 替换 YOUR_TOKEN 和 YOUR_DEVICE_HASH_KEY
curl -X POST "http://localhost:3000/api/activity" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generatedHashKey": "YOUR_DEVICE_HASH_KEY",
    "device": "MacBook Pro",
    "device_type": "desktop",
    "process_name": "VS Code",
    "process_title": "在写论文",
    "battery_level": 78,
    "is_charging": true,
    "push_mode": "active"
  }'
```

期望响应：`HTTP 200`，`{"success":true,...}`

刷新首页 → **此刻 banner 上方的 demo 内容应该被真实数据替换**（如果 admin 关掉了 demo 兜底），或者可以在 dashboard 的活动卡里看到 `VS Code` 的记录。

### Step 5：选一个真实 reporter 跑起来

官方 reporter 有几种选择：

| 平台 | reporter 类型 | 仓库/工具 |
|------|---------------|----------|
| macOS / Windows / Linux | 桌面进程跟踪 | [Waken-Wa-Reporter (Go)](https://github.com/MoYoez/waken-wa-reporter) |
| 浏览器 | Web 上报（用 Tampermonkey 或网页内集成） | 见 docs `Node.js Example` 自己写 |
| Android / iOS | 手机端 | 需自己写或找第三方 |

**最简推荐路径（macOS 这台）**：

1. clone `https://github.com/MoYoez/waken-wa-reporter`
2. 按它的 README 配置：
   - `endpoint`: `http://localhost:3000/api/activity`（本机测试）
   - `token`: Step 2 拿到的
   - `generatedHashKey`: Step 3 创建的
3. 启动后让它运行 5–10 分钟，切换几个应用（VS Code、Chrome、Spotify 等）

### Step 6：验证上报链路

打开几个标签确认：

1. **Admin → 活动管理**：是否能看到刚刚的设备和上报记录
2. **首页 hero**：左上角天气是否正常 + 状态条显示「现在在用 xx · 电量 xx%」
3. **首页「02 此刻」**：是否从 demo 切换到真实活动 + 多设备列表正确显示
4. **如果设备在播放音乐**：`metadata.media.title` 是否能在 hover card 上显示

### Step 7：触发关键边界路径

- 关掉 reporter → 等几分钟看离线判定是否生效（`push_mode=realtime`）
- 切换网络 / 改时区 → 看时间显示是否正确
- 让 admin 撤销设备 → 再上报应返回 `403`

---

## 三、点火验证清单

每项打勾才算通过：

### 后端

- [ ] `POST /api/activity` 返回 `200`
- [ ] 错误 token 返回 `401`
- [ ] 缺 `generatedHashKey` 返回 `400`
- [ ] 撤销的设备返回 `403`

### 数据库

- [ ] `data/dev.db` 中 `activities` 表有新记录
- [ ] 重复上报同一 process 时，旧记录的 `ended_at` 被自动结束

### 首页

- [ ] hero 左上角天气仍正常
- [ ] hero 时钟、问候、glance 状态条都按设计显示
- [ ] 三个 section（01 关于我 / 02 此刻 / 03 灵感）布局正常
- [ ] 立绘装饰图片正确加载（不是 404）
- [ ] 「02 此刻」banner 中央 quote「听见雨声 / 写到第三章」显示完整
- [ ] 多引擎搜索框图标全显示
- [ ] 中文显示为简体（不是繁体）

### Admin

- [ ] 「网站设置 → 进阶 → 首页设置」面板里改任何开关，前台立刻生效
- [ ] 设备管理列出真实设备 + 上报次数
- [ ] 灵感管理能正常增删

### 真实设备数据

- [ ] reporter 持续上报后，首页「此刻」从 demo 切到真实数据
- [ ] 多设备并行上报时正确显示
- [ ] 媒体播放（如 Spotify / 网易云）信息显示正确
- [ ] 电量、充电状态、设备类型显示正确

---

## 四、点火失败时的兜底

| 症状 | 可能原因 | 排查 |
|------|----------|------|
| 401 | Token 不对或被禁 | `/admin` API Token 页确认 token 已启用 |
| 400 | 漏传必填字段 | `generatedHashKey` 和 `process_name` 都得有 |
| 403 | 设备未审核 / 被撤销 / Token 不匹配 | `/admin` 设备管理 |
| 502 / 网络错误 | dev server 挂了 | 看终端日志，重启 `pnpm dev` |
| 前端首页报错 | 编译错误 | 看 dev server 终端，`styles/homepage.css` 类似的语法错误优先排查 |
| 首页字体显示繁体 | 思源宋体没加载 | 检查 `public/fonts/noto-serif-sc/` 和 `styles/noto-serif-sc.css` 的引入顺序 |
| 立绘 404 | 文件路径错 | 文件在 `public/assets/homepage/section-{about,now,inspiration}-companion.png` |

---

## 五、点火通过后的动作

1. 把当前 dev 跑通的配置整理一份，准备生产环境上线
2. 关掉 demo 兜底（admin → 「显示 demo 填充内容」改为 OFF）
3. 真正的部署上线流程参考 `docs/deploy-build-from-source.sh` 或 `Dockerfile`
4. 域名 `apograss.cn` 解析切到生产服务器

---

## 六、与原作者保持同步

```bash
git remote -v          # 应能看到 upstream → MoYoez/waken-wa
git fetch upstream
git log HEAD..upstream/main --oneline   # 看上游新增的 commit
# 想合并就 git merge upstream/main，自己的 fork commit 与上游冲突就 cherry-pick
```

---

**当前 fork commit 头**：`98891c4 fix(首页): 修复 homepage.css 孤立块导致的语法错误，01/02 视觉收尾`
