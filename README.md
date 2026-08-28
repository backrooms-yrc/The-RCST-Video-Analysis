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
- **智能播放** — 输入 m3u8 直连播放（原生 HLS / hls.js 自动降级）；其余输入走所选解析器
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

## 🔌 解析接口管理

接口列表定义在 `assets/js/player.js` 顶部的 `parsers` 数组，增删改后前端自动渲染下拉与快速切换纸片：

```js
const parsers = [
  { name: "接口1·虾米（本站中转）",  url: "/jx/xmflv/?url=%s" },
  { name: "接口2·M1907（本站中转，支持 m3u8/mp4 直链）", url: "/jx/m1907/?jx=%s" },
  { name: "接口3·七七云解析（本站中转）", url: "/jx/77flv/?url=%s" },
  { name: "接口4·臻享视听（本站中转）", url: "/jx/aibox/?url=%s" },
  { name: "接口5·ik9云解析（本站中转）", url: "/jx/ik9/?url=%s" },
  // { name: "新接口", url: "/jx/xxx/?url=%s" }
];
```

要点：

- URL 模板保留 `%s`，用户输入会经 `encodeURIComponent` 替换后载入 iframe；
- 接入前请确认目标站无 `X-Frame-Options: DENY` / CSP `frame-ancestors` 限制，否则 iframe 无法嵌入；
- 修改 `player.js` 后记得同步更新 `index.html` 中引用的 `?v=` 缓存版本号。

## 🩺 接口健康探测记录 — 2026-08-28（二次）

首轮实测所有直连端点服务端均存活，但用户侧（国内）直连第三方解析域名**全部失败**（DNS 污染/封锁），
唯独走本站反代的接口可用——因此**全部接口改为本站 nginx 中转**（`/jx/<name>/`）：

| 接口 | 上游端点 | 状态 | 说明 |
|---|---|---|---|
| 虾米 | `jx.xmflv.com/?url=` | ✅ 反代 | 页面解析逻辑在网易 nosdn CDN，国内可达 |
| M1907 | `z1.m1907.top/?jx=` | ✅ 入口反代 | 跳转目标为其官方国内中转节点（nnpp:2223），保持客户端直连 |
| 七七云解析 | `jx.77flv.cc/?url=` | ✅ 反代 | JS/WASM 在神马/字节/同程 CDN，API 为国内裸 IP |
| 臻享视听 | `aibox.eu.org/?url=` | ✅ 反代 | `.eu.org` 域名国内普遍遭 DNS 劫持 |
| ik9 云解析 | `yparse.ik9.cc/?url=` | ✅ 反代 | 播放器 JS 在 cdns.nmjsjs.com 国内 CDN |

已淘汰（供避坑）：
- **夜幕（www.yemu.xyz）** — 经核实是"十八码"CMS 模板技术博客，`?url=` 参数完全无效，**从来不是解析接口**；
- CK解析（域名售卖停靠）、playerjy（可疑广告脚本）、playm3u8（iframe 无限重定向循环）、parwix / jsonplayer / lskyf / 黑米 / 盘古（服务不可达）、艾豆（仅为 77flv 跳转壳）。

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
