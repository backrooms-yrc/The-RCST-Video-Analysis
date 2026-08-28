<div align="center">

# Current Video Analysis

**开箱即用的 VIP 视频聚合解析播放站**

一个开箱即用的纯静态 VIP 视频解析前端：粘贴 m3u8 / 视频页链接 / 片名，
自动选择直连播放（hls.js）或解析器 iframe 播放。

MDUI 2 · Material Design 3 | Plyr | hls.js | 零后端依赖

</div>

---

## ✨ 特性

- **MD3 设计体系** — 基于 [MDUI 2](https://www.mdui.org/) 重构：顶栏、通告条、输入卡片、纸片（Chip）、对话框全部遵循 Material Design 3 规范，**本地托管**样式与字体，不依赖海外 CDN
- **深浅色主题** — 跟随系统 + 手动切换，`localStorage` 记忆偏好，首屏防闪烁预加载
- **本地解析引擎** — 服务器端自部署 [yt-dlp](https://github.com/yt-dlp/yt-dlp)（`/opt/cv-resolver`，systemd 常驻 `cv-resolver`）：粘贴视频页链接 → `/api/resolve/` 返回直链 → 本站播放器直接播放，不经过任何第三方解析页；解析失败自动回退 iframe 解析器
- **自建片源搜索（主打）** — 输入片名即搜即播：聚合影视资源站采集 API（nginx 反代双源容错），选集后在本站播放器直接播 m3u8，**不依赖任何第三方解析页**
- **智能播放** — 粘贴 m3u8 直连播放（原生 HLS / hls.js 自动降级）；粘贴 VIP 页面链接走解析器 iframe
- **多解析器热切换** — 下拉选择 + 侧栏快速切换纸片，选中态实时同步
- **稳定的播放器窗口** — 16:9 响应式容器（`aspect-ratio`），任意屏幕尺寸不变形、不溢出
- **DNS 劫持对策** — 对易被污染的接口域名提供 Nginx 反代中转方案（见下文）

## 🧰 技术栈

| 依赖 | 版本 | 加载方式 |
|---|---|---|
| MDUI | 2.1.5 | 本地 `assets/vendor/mdui/` |
| Material Icons（连字字体） | v145 | 本地 `assets/vendor/mdui/fonts/` |
| Plyr | 3.7.8 | CDN |
| hls.js | 1.6.11 | CDN |

> Plyr 与 hls.js 仍走公共 CDN，如需完全离线可自行下载替换 `<script>` / `<link>` 引用。

## 📦 目录结构

```
The-RCST-Video-Analysis/
├── index.html                # 主页面（MDUI 版）
├── index_beta.html           # 与 index.html 保持同步的副本
├── favicon.ico
├── assets/
│   ├── js/
│   │   └── player.js         # 核心业务逻辑：接口列表 / 播放 / 模式切换 / 弹窗
│   └── vendor/
│       └── mdui/             # 本地托管的 MDUI 2.1.5（CSS + JS + 图标字体）
└── README.md
```

## 🚀 快速开始（本地预览）

在项目根目录任选一种方式起静态服务（避免 `file://` 协议下的 iframe / CORS 问题）：

```bash
python3 -m http.server 8000
# 或
npx http-server -p 8000
```

浏览器打开 `http://localhost:8000` 即可。

## 🧠 本地解析引擎（yt-dlp 自部署）

播放链路对"视频页 URL"的处理顺序：**本站解析 → iframe 解析器兜底**。

```
/opt/cv-resolver/
├── yt-dlp          # 自包含二进制（github releases 最新版）
└── server.js       # Node 零依赖 HTTP 服务，127.0.0.1:39333
```

```bash
# systemd 常驻（服务名 cv-resolver）
systemctl status cv-resolver
# yt-dlp 需定期更新以跟进站点改版
/opt/cv-resolver/yt-dlp -U
systemctl restart cv-resolver
```

nginx 暴露为同源接口：`/api/resolve/resolve?url=<视频页>` → `{ok,url,hls,title}`。

实现要点：

- 站点白名单（bilibili/iqiyi/youku/qq/mgtv/sohu 等），防止被当通用抓取代理；并发上限 2、单次 25s 超时
- 只返回"单文件可直连播放"的流（优先 HLS，其次渐进式 mp4）；音视频分离的 DASH 流（B站高画质）不直连，回退解析器
- https 页面无法播放 http 直链（混合内容）：仅对已知支持 https 的 CDN（优酷 pl-ali）升级协议，其余回退解析器
- 本服务器（美国 IP）实测：**优酷 ✅**、搜狐（http-only，回退）⚠️、B站 ❌（IP 级 412 风控）、爱奇艺 ❌（extractor 失效）、腾讯 ❌（数据中心 IP 被拒）——不支持站点由前端自动回退 iframe 解析器，用户无感

## 🔌 接口与片源管理

**自建片源搜索**（片名输入走此路径）：`player.js` 中的 `vodSources` 定义资源站采集 API，
均经 nginx `/api/vod/<name>/` 反代（同源调用，规避 CORS 与 http 混合内容限制），
m3u8 流由浏览器直连资源站国内 CDN，本站只转发轻量 JSON：

```js
const vodSources = [
  { name: "非凡资源", api: "/api/vod/ff/" },     // nginx → http://api.ffzyapi.com
  { name: "360资源", api: "/api/vod/zy360/" },   // nginx → https://360zy.com
];
```

**VIP 链接解析器**（网页链接输入走此路径）：`parsers` 数组，当前仅保留实测可用的一条：

```js
const parsers = [
  { name: "接口1·臻享视听（VIP链接解析，本站中转）", url: "/jx/aibox/?url=%s" },
  // { name: "新接口", url: "/jx/xxx/?url=%s" }
];
```

要点：

- URL 模板保留 `%s`，用户输入会经 `encodeURIComponent` 替换后载入 iframe；
- 接入前请确认目标站无 `X-Frame-Options: DENY` / CSP `frame-ancestors` 限制；
- 解析器内部 JS 若以 `document.domain` / 同源相对路径调用自家 API，入口反代会打断其内部请求（虾米、七七云即因此失败）——接入前需实测；
- 修改 `player.js` 后记得同步更新 `index.html` 中引用的 `?v=` 缓存版本号。

## 🩺 接口健康探测记录 — 2026-08-28（三轮）

| 接口 | 端点 | 结论 | 现象 |
|---|---|---|---|
| 臻享视听 | `aibox.eu.org` → `/jx/aibox/` | ✅ 唯一保留 | 反代后正常播放且不卡顿 |
| 虾米 | `jx.xmflv.com` → `/jx/xmflv/` | ❌ 移除 | 反代后无限加载（其 nosdn CDN 脚本回源自家 API） |
| 七七云 | `jx.77flv.cc` → `/jx/77flv/` | ❌ 移除 | 反代后无限加载（JS 按 `document.domain` 拼 API） |
| M1907 | `z1.m1907.top` → `/jx/m1907/` | ❌ 移除 | 播放器报"格式不支持" |
| ik9 | `yparse.ik9.cc` → `/jx/ik9/` | ❌ 移除 | 检测代理环境后跳转不良站点 |
| 夜幕 | `www.yemu.xyz` | ❌ 假接口 | 实为 CMS 模板技术博客，`?url=` 无效，从来不能解析 |

结论：第三方 iframe 解析器在"入口反代"模式下多数不可靠（内部回源机制被打断），
故转向**自建片源搜索**为主、单一可用解析器为辅的架构。

其他已淘汰（供避坑）：CK解析（域名售卖停靠）、playerjy（可疑广告脚本）、
playm3u8（iframe 无限重定向循环）、parwix / jsonplayer / lskyf / 黑米 / 盘古（服务不可达）、
艾豆（仅为 77flv 跳转壳）。

## 🛡️ DNS 劫持与 Nginx 反代方案（重要）

国内运营商对第三方解析域名的污染/封锁导致用户浏览器直连全部失败（2026-08-28 实测，
当时唯一走反代的接口是唯一可用的）。本站的做法：**让浏览器只连自己的域名**，
由服务器反代到真实接口，从入口彻底绕开用户侧 DNS 污染——现已应用到全部接口。

```nginx
# 站点 server 块内、catch-all location 之前（最长前缀优先）
location ^~ /jx/aibox/ {
    proxy_pass https://aibox.eu.org/;
    proxy_set_header Host aibox.eu.org;
    proxy_ssl_server_name on;
    proxy_ssl_name aibox.eu.org;
    proxy_ssl_protocols TLSv1.2 TLSv1.3;
    proxy_set_header User-Agent $http_user_agent;
    proxy_set_header Accept-Encoding "";
    proxy_connect_timeout 10s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}
```

前端对应把该接口的 URL 写成相对路径 `/jx/aibox/?url=%s` 即可。该方案可复制到其他被劫持的接口。

> 局限：反代只覆盖入口 HTML 与相对路径资源；若解析器内部 JS 硬编码直连其他被污染域名，则无法覆盖（M1907 即属此类，其官方入口链路目前完好，故保持直连）。

## 🖥️ 生产部署（Nginx）

```nginx
server {
    listen 443 ssl;
    server_name your.domain.com;
    root /path/to/The-RCST-Video-Analysis;
    index index.html index_beta.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ /\. { deny all; }

    # 如需反代被劫持接口，将上一节的 /jx/aibox/ 块加在此处
}
```

可选加固（防止脚本被外站直链滥用，非安全边界）：

```nginx
location = /assets/js/player.js {
    valid_referers none blocked your.domain.com www.your.domain.com;
    if ($invalid_referer) { return 404; }
}
```

## ❓ 常见问题

**播放器窗口大小异常？**
页面容器为 16:9 响应式（`.player-area { aspect-ratio: 16/9 }`），请勿再对 `.player-area` 或其内部 `video` 强制指定 `height`，否则会与 Plyr 生成的包装容器冲突导致窗口错乱（旧版 `height:45vh` 的教训）。

**iframe 白屏 / 拒绝加载？**
目标站设置了 `X-Frame-Options` 或 CSP。换一个解析器，或参照上文用服务端反代。

**m3u8 无法播放？**
Safari 原生支持；其余浏览器由 hls.js 接管。仍失败时查看控制台的网络 / CORS 报错；部分源站不带 CORS 头，此前版本 `video` 标签上的 `crossorigin` 属性已因此移除，请勿加回。

**接口突然全挂了？**
免费解析接口生命周期短，属正常现象。按上文方法替换 `parsers` 数组中的失效项即可，新接口先实测再上线。

## 🔒 安全与合规

- 本项目仅为聚合解析前端模板，接口与片源均来自第三方公共服务，请勿用于未经授权的分发或商业用途；
- 不要在前端硬编码任何密钥 / 凭证；
- Referer 限制只能降低滥用，不是安全边界；
- 使用各解析接口时请遵守目标服务条款。

## 📮 联系方式

- 邮箱：ruochenyang161@gmail.com
- GitHub：[backrooms-yrc](https://github.com/backrooms-yrc)
- Telegram：[@rcst20](https://t.me/rcst20)

欢迎以 issue / PR 形式反馈接口失效或改进建议。

---

版权所有 © 2025 Current Video Analysis
