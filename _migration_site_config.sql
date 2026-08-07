-- ============================================================
-- 仪贞书院 - 管理员设置跨设备同步表
-- 在 Supabase SQL Editor 中执行此脚本
-- https://hzvpcvgryumkxtzeiefx.supabase.co → SQL Editor
-- ============================================================

-- 1. 创建设置表
CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 启用 RLS
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- 3. 任何人可读（公开读取，无需登录）
DROP POLICY IF EXISTS "Public read site_config" ON site_config;
CREATE POLICY "Public read site_config" ON site_config
  FOR SELECT
  USING (true);

-- 4. 任何人可写（通过 anon key，我们在应用层做密码验证）
DROP POLICY IF EXISTS "Public insert site_config" ON site_config;
CREATE POLICY "Public insert site_config" ON site_config
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update site_config" ON site_config;
CREATE POLICY "Public update site_config" ON site_config
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Public delete site_config" ON site_config;
CREATE POLICY "Public delete site_config" ON site_config
  FOR DELETE
  USING (true);

-- 5. 确认
SELECT * FROM site_config;
