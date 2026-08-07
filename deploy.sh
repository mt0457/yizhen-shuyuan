#!/bin/bash
# 仪贞书院 - 一键部署脚本
# 用法: bash deploy.sh [提交信息]

MSG="${1:-更新网站内容}"
DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_TMP="/tmp/yizhen-deploy"

echo "📦 1/3 打包项目..."
cd "$DIR"
rm -rf "$DEPLOY_TMP"
mkdir -p "$DEPLOY_TMP"

tar -czf /tmp/yizhen-deploy.tar.gz \
  --exclude='.git' \
  --exclude='曾仕强（视频）' \
  --exclude='_update_videos.py' \
  --exclude='node_modules' \
  --exclude='.claude' \
  --exclude='*.bak' \
  --exclude='ossutil64.exe' \
  --exclude='*.ps1' \
  --exclude='*.py' \
  --exclude='_supabase_setup.js' \
  --exclude='test_*' \
  --exclude='_build_*' \
  --exclude='_gen_*' \
  --exclude='_batch_expand*' \
  --exclude='_check_books*' \
  --exclude='website_config.xml' \
  --exclude='ALIYUN_DEPLOY.md' \
  --exclude='SUPABASE_TUTORIAL.md' \
  . 2>&1

cd "$DEPLOY_TMP" && tar -xzf /tmp/yizhen-deploy.tar.gz

echo "🚀 2/3 部署到 Cloudflare Pages..."
npx wrangler pages deploy . --project-name=yizhen-shuyuan --commit-dirty=true --branch=master

echo "📝 3/3 提交代码..."
cd "$DIR"
git add -A
git commit -m "$MSG" 2>/dev/null || echo "(无新变更)"

# Push to Gitee (always works)
git push gitee master 2>/dev/null && echo "✅ Gitee 推送成功" || echo "⚠️ Gitee 推送失败"

# Push to GitHub via SSH
GIT_SSH_COMMAND="ssh -p 443 -o StrictHostKeyChecking=accept-new" git push github master 2>/dev/null && echo "✅ GitHub 推送成功" || echo "⚠️ GitHub 推送失败"

rm -rf "$DEPLOY_TMP" /tmp/yizhen-deploy.tar.gz
echo "✨ 完成！网站已更新：https://yizhenshuyuan.xyz"
