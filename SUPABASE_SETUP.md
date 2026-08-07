# 仪贞书院 - Supabase 设置指南

## 第一步：创建 Supabase 账号

1. 打开 https://supabase.com
2. 点击 "Start your project" → 用 GitHub 账号注册
3. 创建新项目：
   - Name: `yizhen-academy`
   - Database Password: 设置一个强密码（记下来！）
   - Region: 选 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`
4. 等2分钟项目创建完成

## 第二步：获取API密钥

1. 进入项目 Dashboard → Settings → API
2. 记下两个值：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...`（以 `eyJ` 开头的长字符串）

## 第三步：创建数据库表

1. 进入 SQL Editor（左侧菜单）
2. 点击 "New query"
3. 复制下方所有 SQL
4. 点击 "Run" 执行

## 第四步：配置认证

1. 进入 Authentication → Settings
2. 找到 Email 部分：
   - 打开 Email provider 开关
   - **取消勾选** "Confirm email"（先跳过邮箱验证，后续可开启）
3. 找到 "Site URL" 设为你的域名（先用 `http://localhost:8765` 测试）

## 第五步：配置行级安全(RLS)

进入 Authentication → Policies，为每个表添加策略。

---

# 数据库建表 SQL

复制下面全部内容到 Supabase SQL Editor 执行：

```sql
-- ========== 用户扩展信息表 ==========
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  vip_tier TEXT DEFAULT 'none',
  vip_tier_id TEXT,
  vip_expiry TIMESTAMPTZ,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========== VIP购买记录 ==========
CREATE TABLE IF NOT EXISTS vip_purchases (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tier_id TEXT NOT NULL,
  tier_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  purchase_date TIMESTAMPTZ DEFAULT now()
);

-- ========== 书籍评论 ==========
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== 读者偏好 ==========
CREATE TABLE IF NOT EXISTS reader_prefs (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  prefs JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========== 用户留言 ==========
CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== 验证码记录 ==========
CREATE TABLE IF NOT EXISTS verify_codes (
  id BIGSERIAL PRIMARY KEY,
  target TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0
);

-- ========== 索引 ==========
CREATE INDEX IF NOT EXISTS idx_comments_book_id ON comments(book_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_purchases_user_id ON vip_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_verify_codes_target ON verify_codes(target);

-- ========== 行级安全策略 (RLS) ==========

-- profiles: 用户可读所有，只能改自己的
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公开读取 profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "用户更新自己的 profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "用户插入自己的 profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- vip_purchases: 用户可读自己的，管理员可读写所有
ALTER TABLE vip_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户读取自己的购买记录" ON vip_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户插入自己的购买记录" ON vip_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- comments: 公开可读，登录可写，只能删自己的
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公开读取评论" ON comments FOR SELECT USING (true);
CREATE POLICY "登录用户发表评论" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户删除自己的评论" ON comments FOR DELETE USING (auth.uid() = user_id);

-- reader_prefs: 完全私有
ALTER TABLE reader_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户读写自己的偏好" ON reader_prefs FOR ALL USING (auth.uid() = user_id);

-- contact_messages: 登录用户可写，管理员可读
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "登录用户发送留言" ON contact_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户读取自己的留言" ON contact_messages FOR SELECT USING (auth.uid() = user_id);

-- ========== 自动创建 profile 的触发器 ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 当 auth.users 新增时，自动在 profiles 创建对应记录
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 验证

执行以下查询确认表创建成功：

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

应该显示6个表：comments, contact_messages, profiles, reader_prefs, verify_codes, vip_purchases
