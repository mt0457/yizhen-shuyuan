#!/bin/bash
# 仪贞书院 - 一键部署脚本
# 用法: bash deploy.sh [提交信息]

MSG="${1:-更新网站内容}"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 部署到 Cloudflare Pages..."
echo "   (视频文件约64GB，首次上传可能需要较长时间)"
cd "$DIR"
npx wrangler pages deploy . --project-name=yizhen-shuyuan --commit-dirty=true --branch=master

echo ""
echo "📝 提交代码（不含视频文件）..."
cd "$DIR"
git add -A -- ':!videos/' ':!曾仕强（视频）/' ':!*.py' ':!_hls_convert*'
git commit -m "$MSG" 2>/dev/null || echo "(无新变更)"

# Push to Gitee
git push gitee master 2>/dev/null && echo "✅ Gitee 推送成功" || echo "⚠️ Gitee 推送失败"

# Push to GitHub via SSH
GIT_SSH_COMMAND="ssh -p 443 -o StrictHostKeyChecking=accept-new" git push github master 2>/dev/null && echo "✅ GitHub 推送成功" || echo "⚠️ GitHub 推送失败"

echo "✨ 完成！https://yizhenshuyuan.xyz"
