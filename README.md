\# The-RCST-Video-Analysis
一个开箱即用的 VIP 影视解析网站模版，功能强大、UI 精美、持续更新。（UI 界面由 GPT-5 深度美化）

\# 配置教程

**1. 环境准备**  
需要 Nginx 环境，推荐版本为 **1.18**

**2. 拉取仓库**  
将镜像拉取到您的服务器建站目录下

**3. 配置接口防盗**  
在 Nginx 配置文件中添加以下内容：
\`\`\`nginx
location /assets/js/ {
    # 只允许 index.html 加载
    valid_referers none blocked yourdomain.com;
    if ($invalid_referer) {
        return 404;
    }
}
\`\`\`
