/**
 * 全站中介層（2026-11-21）：www.tonpair.com 一律 301 到 tonpair.com。
 *
 * 為什麼：www 版本原本回 200，Google 看到同一份內容兩個網址。canonical 雖然指向 tonpair.com，
 * 但最好直接轉址，連結權重與索引才不會分散。這裡用 Pages Function 做，
 * 因為 tonpair 的 Cloudflare 帳號沒有放 API token，沒辦法用 API 建轉址規則。
 *
 * 其他請求原樣放行（next()）。只動 hostname，路徑與查詢字串保留。
 * 如果之後在 Cloudflare 後台加了 Redirect Rule，這支可以刪掉。
 */
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  // tonpair.pages.dev 也轉（2026-11-24）：不轉的話同一份內容有兩個網址。只比對完全相同的主機，
  // 預覽部署（xxxx.tonpair.pages.dev）不受影響，才看得到未發布的版本
  if (url.hostname === 'www.tonpair.com' || url.hostname === 'tonpair.pages.dev') {
    url.hostname = 'tonpair.com';
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
