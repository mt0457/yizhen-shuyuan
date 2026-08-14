# 仪贞书院 — AI 开发交接说明（必读）

这是「仪贞书院」国学/命理/视频网站的单仓库。接手开发前先读本文，尤其**铁律**部分——违反会导致线上功能破坏或用户数据丢失。

## 项目是什么

- 单文件 SPA：`仪贞书院.html`（约 8300 行，主应用）
- 内容以独立 JS 文件加载：经典书籍 `_*.js`、道藏 `_daozang_DZ*.js`、索引 `_daozang.js`
- 视频用 HLS（hls.js）播放，`videos/` 目录存 `.ts` 分片 + `.m3u8` 清单
- 后端：Supabase（Auth + 数据库）+ Cloudflare Pages Functions（`functions/api/`）
- 托管：Cloudflare Pages（免费、无需备案），域名 yizhen-shuyuan.pages.dev

## 数据规模（当前）

| 板块 | 规模 |
|------|------|
| 经典书籍 | 254 部，全部 ≥500 行，经史子集四大类 |
| 道藏 | 1487 部（`_daozang_DZ001.js` ~ `_daozang_DZ1487.js`），三洞四辅全覆盖 |
| 命理知识库 | 十书完整版（滴天髓/渊海子平/三命通会/李虚中命书/穷通宝鉴等，全部 ≥850 行） |
| 视频 | 14 系列、187 集（曾仕强系列，HLS 分片） |

## 铁律（违反必坏，不可更改）

1. **改代码必 bump `sw.js` 的 `CACHE_NAME`**（当前 `yizhen-v539`）。Service Worker 缓存旧代码会导致「新数据 + 旧逻辑」的诡异 bug。任何 HTML/JS/CSS 改动都要同步 +1。
2. **书籍排序**：周易(b1)第一 → 归藏(b52)第二 → 连山(b51)第三 → 其余按成书时代。代码 `priority = {b1:0, b52:1, b51:2}`。不可增删固定位。
3. **书籍必须是「最完整版」**：首次创建即达完整规模（≥500 行 / 50KB），每章【原文】+【详解】+【注疏】三层。不可用简略版充数。
4. **视频播放器布局**：桌面 = 左视频 + 右侧 200px 选集侧边栏；手机 = 视频在上选集在下。改 `buildLocalPlayer` 必须保持此布局。
5. **`_covers.js` 封面永久保存**：曾仕强视频封面以 base64 嵌入此文件，永远不要清空或删除。
6. **传统探索 = 五个标签**（八字排盘/周易取名/风水布局/穿衣搭配/黄道吉日），不可删除或减少；每项完成后自动调用 `searchMingliKB()` 检索知识库。
7. **管理员系统不可削弱**：入口「🛡️管理」始终可见、localStorage 持久化、VIP 功能开关、独立控制台。密码存储键 `yizhen_admin_password`，登录态 `yizhen_admin_session`。
8. **书籍三要素缺一不可**：JS 内容文件 + `<script>` 标签 + `DEFAULT_BOOKS` 注册。缺任一 → 404 / 变量未定义 / 书库不显示。
9. **模板字符串反引号**：所有内容文件用 `` ` `` 包裹，内容中**绝不能**出现未转义的 `` ` ``（历史上有 26 个文件因此语法损坏）。
10. **localStorage 只存用户状态**，不存默认内容数据——默认数据从源文件重建（详见 `feedback_localstorage_pattern`）。

## 关键文件位置

- `仪贞书院.html` — 主应用（`DEFAULT_BOOKS` 书籍注册、`DEFAULT_VIDEOS` 视频注册、命理功能函数、播放器逻辑）
- `_daozang.js` — 道藏索引（1487 条）
- `_zeng_data.js` — 视频系列数据 `ZENG_DATA`（14 个 key，每个 key 是集数数组）
- `_zeng_available.js` — 可播集清单 `ZENG_AVAILABLE`（187 条，前端 `_isEpAvail` 据此置灰缺失集）
- `_api.js` — Supabase 配置（URL + anon key 硬编码在此，前端公开 key）
- `_covers.js` — 视频封面（base64，永久保存）
- `sw.js` — Service Worker（CACHE_NAME 在此）
- `styles.css` — 样式（「Zeng-series side-by-side player」区块是播放器布局）
- `functions/api/` — Cloudflare Pages Functions（邮箱验证等）
- `videos/` — HLS 视频分片（35GB，**不在 git 里**，见下）

## 书籍系统架构（三要素加载链）

创建新书流程（严格按序）：
1. 创建 `_xxx.js`，定义 `const XXX_CONTENT = \`...\`;`，**内容中无反引号**
2. 验证语法：`node -e "new (require('vm').Script)(require('fs').readFileSync('_xxx.js','utf8'))"`
3. 加 `<script src="_xxx.js"></script>` 到 HTML
4. `DEFAULT_BOOKS` 加条目：`{ id:'bNNN', title, author, category, price:0, coverType, status:'approved', desc, content: typeof XXX_CONTENT!=='undefined'?XXX_CONTENT:'...' }`
5. 如需进命理知识库，在 `searchMingliKB()` 的 books 数组加条目
6. **bump sw.js CACHE_NAME**

`category` 取值：经部/史部/子部/集部/蒙学/其他。

## 视频系统（HLS）

- 视频源：`videos/<系列目录>/<集>.m3u8`，每集 60 秒 `.ts` 分片
- 播放器取源：`lookupKey` → `ZENG_DATA[lookupKey]` → `episodeRange` 切片 → `videos/<dataFolder>/<fileBase>.m3u8`
- 前端 `_isEpAvail` 用 `ZENG_AVAILABLE` 置灰缺失集
- 已彻底删除的源丢失系列 id：`zs1, zs6, zs7, zs9, zs24`（v539 起对老用户 localStorage 也清理）

## 部署

```bash
npx wrangler pages deploy . --project-name yizhen-shuyuan --commit-dirty=true --branch=master
```

- 需 `.env` 中的 `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`（已被 gitignore，需手动配置或 `wrangler login`）
- **wrangler 串行上传（约 1 文件/秒）**：全站约 12000 文件（含 35GB 视频），单次部署约 3~4 小时，网络中断会失败（无断点续传，重试会自动跳过已上传的 asset）
- **视频 `videos/` 不在 git 里**（被 .gitignore 排除）。若新电脑要重新部署视频，必须先把 35GB 的 `videos/` 目录复制过去，否则部署会把线上视频清空。

## Git 远程

- Gitee：`https://gitee.com/YZ6543/yizhen-shuyuan.git`
- GitHub：`git@ssh.github.com:mt0457/yizhen-shuyuan.git`
- 提交风格：`vNNN: 描述`（版本号递增）