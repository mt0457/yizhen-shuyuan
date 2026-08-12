// 仪贞书院 - 邮箱验证码发送
// 使用 Cloudflare + MailChannels 免费集成（无需API Key）
export async function onRequest(context) {
  const { request } = context;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const body = await request.json();
    const { to, code } = body;

    if (!to || !code) {
      return new Response(JSON.stringify({ error: '缺少邮箱或验证码' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return new Response(JSON.stringify({ error: '邮箱格式无效' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const emailHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'PingFang SC','Microsoft YaHei',sans-serif;background:#faf7f2;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#8b1a1a,#c0392b);padding:28px 24px;text-align:center;">
      <div style="font-size:28px;color:#fff;font-weight:700;">仪贞书院</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">国学经典 · 薪火相传</div>
    </div>
    <div style="padding:32px 24px;">
      <p style="margin:0 0 8px;font-size:15px;color:#333;">您好！</p>
      <p style="margin:0 0 24px;font-size:14px;color:#666;">您正在注册/验证仪贞书院账号，请使用以下验证码完成验证：</p>
      <div style="background:#faf7f2;border:1px dashed #c9a96e;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:36px;font-weight:700;color:#8b1a1a;letter-spacing:10px;font-family:'Courier New',monospace;">${code}</div>
        <div style="font-size:12px;color:#999;margin-top:8px;">有效期 5 分钟，请勿泄露</div>
      </div>
      <p style="margin:0 0 8px;font-size:13px;color:#999;">如非本人操作，请忽略此邮件。</p>
      <p style="margin:0;font-size:13px;color:#999;">此邮件由系统自动发送，请勿回复。</p>
    </div>
    <div style="background:#f5f0eb;padding:16px 24px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#bbb;">仪贞书院 · yizhenshuyuan.xyz</p>
    </div>
  </div>
</body>
</html>`;

    // MailChannels API (免费，Cloudflare合作伙伴)
    const mcResp = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: {
          email: 'noreply@yizhenshuyuan.xyz',
          name: '仪贞书院'
        },
        subject: '验证码 ' + code + ' - 仪贞书院邮箱验证',
        content: [{ type: 'text/html', value: emailHTML }]
      })
    });

    if (mcResp.ok || mcResp.status === 202) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const errText = await mcResp.text();
    console.error('MailChannels error:', mcResp.status, errText);
    return new Response(JSON.stringify({ error: '邮件发送失败，请稍后重试' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (e) {
    console.error('Email function error:', e.message);
    return new Response(JSON.stringify({ error: '服务异常，请稍后重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
