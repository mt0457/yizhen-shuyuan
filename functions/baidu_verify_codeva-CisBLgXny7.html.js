// 百度站长验证专用——绕过Cloudflare .html剥离
export async function onRequest(context) {
  return new Response("codeva-CisBLgXny7", {
    headers: { "Content-Type": "text/plain" }
  });
}
