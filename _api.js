// ============================================================
// _api.js — 仪贞书院 Supabase 数据访问层
// 替换原有的 localStorage 读写，实现服务端数据持久化
// ============================================================

// ---------- 配置（部署时修改为实际值） ----------
const SUPABASE_URL = 'https://hzvpcvgryumkxtzeiefx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JLkCymr-_2uCFGHO6zuJkA_UomYeyS_';

// ---------- 初始化 Supabase 客户端 ----------
let _supabase = null;
function getSupabase() {
  if (_supabase) return _supabase;
  if (typeof window.supabase === 'undefined') {
    console.error('[API] Supabase SDK 未加载，请检查 CDN 引入');
    return null;
  }
  _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  // 监听认证状态变化
  _supabase.auth.onAuthStateChange(function(event, session) {
    console.log('[API] Auth state:', event, session ? 'logged in' : 'logged out');
    if (event === 'SIGNED_OUT') {
      state.isLoggedIn = false;
      state.currentUser = null;
      updateVipBadge();
    }
  });
  return _supabase;
}

// ---------- 工具函数 ----------
function apiGetSession() {
  var sb = getSupabase();
  if (!sb) return Promise.resolve(null);
  return sb.auth.getSession().then(function(res) {
    return res.data.session || null;
  });
}

function apiGetUserId() {
  return apiGetSession().then(function(session) {
    return session ? session.user.id : null;
  });
}

// ============================================================
// 认证模块
// ============================================================

/** 注册新用户 */
async function apiRegister(username, password, phone) {
  var sb = getSupabase();
  if (!sb) throw new Error('API未初始化');
  // Supabase Auth 用 email 注册，我们用 username + phone 构建虚拟邮箱
  var virtualEmail = username.toLowerCase() + '_' + phone + '@yizhen.user';
  var res = await sb.auth.signUp({
    email: virtualEmail,
    password: password,
    options: {
      data: { username: username, phone: phone }
    }
  });
  if (res.error) throw new Error(res.error.message);
  // 更新 profiles 表中的 username（因为触发器只取了 email 前缀）
  if (res.data.user) {
    await sb.from('profiles').update({ username: username, phone: phone }).eq('id', res.data.user.id);
  }
  return res.data;
}

/** 登录：支持用户名或手机号 */
async function apiLogin(credential, password) {
  var sb = getSupabase();
  if (!sb) throw new Error('API未初始化');
  // 先判断是用户名还是手机号，找到对应的虚拟邮箱
  var email;
  if (credential.indexOf('@') > -1) {
    email = credential; // 直接是邮箱
  } else {
    // 通过 profiles 表查找
    var query = sb.from('profiles').select('id, username, phone');
    if (/^1[3-9]\d{9}$/.test(credential)) {
      var res = await query.eq('phone', credential).single();
      if (res.error || !res.data) throw new Error('手机号未注册');
      email = res.data.username.toLowerCase() + '_' + res.data.phone + '@yizhen.user';
    } else {
      var res = await query.eq('username', credential).single();
      if (res.error || !res.data) throw new Error('用户名不存在');
      email = res.data.username.toLowerCase() + '_' + (res.data.phone || '00000000000') + '@yizhen.user';
    }
  }
  var res = await sb.auth.signInWithPassword({ email: email, password: password });
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/** 退出登录 */
async function apiLogout() {
  var sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

/** 找回密码 */
async function apiResetPassword(phone) {
  var sb = getSupabase();
  if (!sb) throw new Error('API未初始化');
  // 查找该手机号对应的用户
  var res = await sb.from('profiles').select('id, username, phone').eq('phone', phone).single();
  if (res.error || !res.data) throw new Error('该手机号未注册');
  var email = res.data.username.toLowerCase() + '_' + res.data.phone + '@yizhen.user';
  // 发送重置密码邮件
  var ret = await sb.auth.resetPasswordForEmail(email);
  if (ret.error) throw new Error(ret.error.message);
  return true;
}

// ============================================================
// 用户资料模块
// ============================================================

/** 获取当前用户 profile */
async function apiGetProfile() {
  var userId = await apiGetUserId();
  if (!userId) return null;
  var sb = getSupabase();
  var res = await sb.from('profiles').select('*').eq('id', userId).single();
  if (res.error) return null;
  return res.data;
}

/** 更新用户 VIP 状态 */
async function apiUpdateVip(userId, tierId, tierName, amount, days) {
  var sb = getSupabase();
  if (!sb || !userId) return;
  var expiry = new Date(Date.now() + days * 86400000).toISOString();
  // 更新 profile
  await sb.from('profiles').update({
    vip_tier: tierId,
    vip_tier_id: tierId,
    vip_expiry: expiry,
    updated_at: new Date().toISOString()
  }).eq('id', userId);
  // 记录购买
  await sb.from('vip_purchases').insert({
    user_id: userId,
    tier_id: tierId,
    tier_name: tierName,
    amount: amount,
    status: 'completed'
  });
}

// ============================================================
// 评论模块
// ============================================================

/** 获取某本书的评论 */
async function apiGetComments(bookId) {
  var sb = getSupabase();
  if (!sb) return [];
  var res = await sb.from('comments')
    .select('id, user_id, book_id, content, parent_id, created_at, profiles(username)')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (res.error) { console.error('[API] getComments error:', res.error); return []; }
  return res.data || [];
}

/** 添加评论 */
async function apiAddComment(bookId, content, parentId) {
  var userId = await apiGetUserId();
  if (!userId) throw new Error('请先登录');
  var sb = getSupabase();
  var res = await sb.from('comments').insert({
    user_id: userId,
    book_id: bookId,
    content: content,
    parent_id: parentId || null
  }).select('id, user_id, book_id, content, parent_id, created_at, profiles(username)').single();
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/** 删除评论 */
async function apiDeleteComment(commentId) {
  var userId = await apiGetUserId();
  if (!userId) throw new Error('请先登录');
  var sb = getSupabase();
  var res = await sb.from('comments').delete().eq('id', commentId).eq('user_id', userId);
  if (res.error) throw new Error(res.error.message);
  return true;
}

// ============================================================
// 偏好模块
// ============================================================

/** 读取阅读偏好 */
async function apiGetPrefs() {
  var userId = await apiGetUserId();
  if (!userId) return {};
  var sb = getSupabase();
  var res = await sb.from('reader_prefs').select('prefs').eq('user_id', userId).single();
  if (res.error || !res.data) return {};
  return res.data.prefs || {};
}

/** 保存阅读偏好 */
async function apiSavePrefs(prefs) {
  var userId = await apiGetUserId();
  if (!userId) return;
  var sb = getSupabase();
  await sb.from('reader_prefs').upsert({
    user_id: userId,
    prefs: prefs,
    updated_at: new Date().toISOString()
  });
}

// ============================================================
// 留言模块
// ============================================================

/** 发送留言 */
async function apiSendContactMessage(message) {
  var userId = await apiGetUserId();
  if (!userId) throw new Error('请先登录');
  var sb = getSupabase();
  var res = await sb.from('contact_messages').insert({
    user_id: userId,
    message: message
  });
  if (res.error) throw new Error(res.error.message);
  return true;
}

// ============================================================
// 管理模块
// ============================================================

/** 获取全站统计（管理员用） */
async function apiGetAdminStats() {
  var sb = getSupabase();
  if (!sb) return null;
  var stats = {};
  var r1 = await sb.from('profiles').select('*', { count: 'exact', head: true });
  stats.totalUsers = r1.count || 0;
  var r2 = await sb.from('profiles').select('*', { count: 'exact', head: true }).neq('vip_tier', 'none');
  stats.vipUsers = r2.count || 0;
  var r3 = await sb.from('comments').select('*', { count: 'exact', head: true });
  stats.totalComments = r3.count || 0;
  var r4 = await sb.from('vip_purchases').select('*', { count: 'exact', head: true });
  stats.totalPurchases = r4.count || 0;
  return stats;
}

/** 获取所有VIP用户列表 */
async function apiGetVipUsers() {
  var sb = getSupabase();
  if (!sb) return [];
  var res = await sb.from('profiles').select('*').neq('vip_tier', 'none').order('vip_expiry', { ascending: false });
  return res.data || [];
}

/** 管理员手动修改用户VIP */
async function apiAdminSetVip(targetUsername, tierId, tierName, days) {
  var sb = getSupabase();
  if (!sb) throw new Error('API未初始化');
  var res = await sb.from('profiles').select('id').eq('username', targetUsername).single();
  if (res.error || !res.data) throw new Error('用户不存在');
  var expiry = new Date(Date.now() + days * 86400000).toISOString();
  await sb.from('profiles').update({
    vip_tier: tierId, vip_tier_id: tierId, vip_expiry: expiry, updated_at: new Date().toISOString()
  }).eq('id', res.data.id);
  await sb.from('vip_purchases').insert({
    user_id: res.data.id, tier_id: tierId, tier_name: tierName, amount: 0, status: 'admin_manual'
  });
  return true;
}

/** 管理员取消用户VIP */
async function apiAdminCancelVip(targetUsername) {
  var sb = getSupabase();
  var res = await sb.from('profiles').select('id').eq('username', targetUsername).single();
  if (res.error || !res.data) throw new Error('用户不存在');
  await sb.from('profiles').update({
    vip_tier: 'none', vip_tier_id: null, vip_expiry: null, updated_at: new Date().toISOString()
  }).eq('id', res.data.id);
  return true;
}

// ============================================================
// 初始化：恢复会话
// ============================================================
async function apiInitSession() {
  var sb = getSupabase();
  if (!sb) return null;
  var session = await sb.auth.getSession();
  if (session.data.session) {
    var profile = await apiGetProfile();
    if (profile) {
      state.currentUser = {
        username: profile.username,
        vipTier: profile.vip_tier || 'none',
        vipTierId: profile.vip_tier_id || null,
        vipExpiry: profile.vip_expiry || null,
        phone: profile.phone || '',
        createdAt: profile.created_at || ''
      };
      state.isLoggedIn = true;
      return state.currentUser;
    }
  }
  return null;
}

console.log('[API] 数据访问层已加载。Supabase URL: ' + (SUPABASE_URL === 'https://YOUR_PROJECT_ID.supabase.co' ? '⚠ 未配置，请修改 SUPABASE_URL' : SUPABASE_URL));
