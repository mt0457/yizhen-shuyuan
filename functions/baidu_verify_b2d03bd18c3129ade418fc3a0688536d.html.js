// 百度站长验证专用——绕过Cloudflare .html剥离
export async function onRequest(context) {
  return new Response("b2d03bd18c3129ade418fc3a0688536d", {
    headers: { "Content-Type": "text/plain" }
  });
}
