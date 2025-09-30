# The-RCST-Video-Analysis
一个开箱即用的VIP影视解析网站模版，功能强大、UI精美、持续更新。（UI界面由GPT-5深度美化）
# 配置教程
**1.环境准备** Nginx环境，推荐版本为1.18
**2.拉取镜像** 拉取镜像到服务器
**3.配置接口防盗** 在Nginx配置文件中添加以下内容：
location /assets/js/ {
    # 只允许 index.html 加载
    valid_referers none blocked yourdomain.com;
    if ($invalid_referer) {
        return 404;
    }
