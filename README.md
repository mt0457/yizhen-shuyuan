# 仪贞书院

一个国学经典 + 道藏 + 命理（传统探索）+ 曾仕强视频的综合文化网站。

在线地址：**https://yizhen-shuyuan.pages.dev**

## 功能一览

- 📚 **经典书籍**：254 部国学经典（经史子集），周易/归藏/连山居首，其余按成书时代排序
- 🗄️ **道藏**：1487 部道教经典，三洞四辅全覆盖（洞真/洞玄/洞神/太玄/太平/太清/正一）
- 🎬 **曾仕强视频**：14 系列 187 集，HLS 流媒体播放（60 秒分片，秒开不卡）
- 🔮 **传统探索**（命理）：八字排盘 / 周易取名 / 风水布局 / 穿衣搭配 / 黄道吉日，配套十书命理知识库自动检索
- 🔍 **全局搜索**：Ctrl+K 全文检索 1741+ 部书籍
- 🛡️ **管理员系统**：书籍/视频审核、封面上传、VIP 功能开关、数据统计控制台
- 👤 **用户系统**：注册/登录（邮箱验证）、VIP 购买、收藏、阅读进度

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | 原生 HTML/CSS/JS，单文件 SPA（`仪贞书院.html`） |
| 内容 | 独立 JS 文件（模板字符串），`_*.js` 书籍 + `_daozang_DZ*.js` 道藏 |
| 视频 | HLS（hls.js 1.5），`.m3u8` + `.ts` 分片 |
| 后端 | Supabase（Auth + 数据库）+ Cloudflare Pages Functions |
| 缓存 | Service Worker（`sw.js`） |
| 托管 | Cloudflare Pages |

## 目录结构

```
仪贞/
├── 仪贞书院.html          # 主应用（单文件 SPA）
├── _*.js                   # 经典书籍内容（254 部）
├── _daozang.js             # 道藏索引（1487 条）
├── _daozang_DZ*.js         # 道藏内容（1487 部）
├── _zeng_data.js           # 视频系列数据 ZENG_DATA
├── _zeng_available.js      # 可播集清单 ZENG_AVAILABLE
├── _api.js                 # Supabase 配置
├── _covers.js              # 视频封面（base64 永久保存）
├── sw.js                   # Service Worker
├── styles.css              # 样式
├── functions/api/          # Cloudflare Pages Functions
├── videos/                 # HLS 视频分片（35GB，不在 git）
└── CLAUDE.md               # AI 开发铁律（接手开发必读）
```

## 快速开始

### 本地预览

直接用静态服务器打开根目录即可（`npx serve .` 或 `npx http-server`）。因为页面用 `fetch` 加载内容 JS 文件，直接双击 HTML 会有 CORS 限制。

### 部署到 Cloudflare Pages

```bash
npx wrangler pages deploy . --project-name yizhen-shuyuan --commit-dirty=true --branch=master
```

前提：配置 `.env`（`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`），或先 `npx wrangler login`。

> ⚠️ 部署注意：全站约 12000 文件（含 35GB 视频），wrangler 串行上传约 3~4 小时，网络中断会失败。视频 `videos/` 目录不在 git 里，换机器重新部署视频前需先复制该目录。

## 环境配置

- **Supabase**：URL + anon key 已硬编码在 `_api.js`（前端公开 key，clone 即用）
- **Cloudflare 部署凭据**：`.env`（被 gitignore，需手动配置）
- **邮箱验证**：`functions/api/send-verify-email.js`，需在 Cloudflare 配置 `RESEND_API_KEY`

## Git 仓库

- Gitee：https://gitee.com/YZ6543/yizhen-shuyuan.git
- GitHub：git@ssh.github.com:mt0457/yizhen-shuyuan.git

## 开发规范

接手开发前**必须阅读 [CLAUDE.md](CLAUDE.md)**，其中包含 10 条铁律（书籍排序、SW 缓存版本、视频播放器布局、封面永久保存等）和完整的架构/操作流程说明。