#!/bin/bash
# 仪贞书院 - 一键部署脚本
# 用法: bash deploy.sh [提交信息]
# 首次使用：确保目录下有 .env 文件（含 CLOUDFLARE_API_TOKEN）

set -e
MSG="${1:-更新网站内容}"
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# 加载 API Token
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "❌ 缺少 .env 文件，请先创建并填入 CLOUDFLARE_API_TOKEN"
  exit 1
fi

echo "🚀 部署到 Cloudflare Pages..."
"$DIR/node_modules/.bin/wrangler" pages deploy . \
  --project-name=yizhen-shuyuan \
  --commit-dirty=true \
  --branch=master 2>&1 || \
npx wrangler pages deploy . \
  --project-name=yizhen-shuyuan \
  --commit-dirty=true \
  --branch=master

echo ""
echo "📝 提交代码..."
git add -A -- ':!videos/' ':!*.py' ':!.env'
git commit -m "$MSG" 2>/dev/null || echo "(无新变更)"

git push gitee master 2>/dev/null && echo "✅ Gitee 推送成功" || echo "⚠️ Gitee 推送失败"
GIT_SSH_COMMAND="ssh -p 443 -o StrictHostKeyChecking=accept-new" \
  git push github master 2>/dev/null && echo "✅ GitHub 推送成功" || echo "⚠️ GitHub 推送失败"

echo ""
echo "✨ 完成！https://yizhenshuyuan.xyz"
