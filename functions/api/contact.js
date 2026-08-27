/**
 * /api/contact —— 官網詢問表單的收件端（Cloudflare Pages Function）
 *
 * 2026-08-27 由 company\hunglun2026\functions\api\contact.js 移植，欄位改成對頻的版本。
 *
 * 為什麼要有這一層，而不是讓瀏覽器直接打 Apps Script：
 * 1. 同網域，所以沒有 CORS 問題（Apps Script 的 /exec 會 302 到 googleusercontent，
 *    瀏覽器直接打會被 CORS 擋，這是最常見的坑）
 * 2. Apps Script 網址與共用密鑰只存在伺服器端，不會外流到前端
 * 3. 蜜罐、必填、長度這些檢查在進到信箱之前就擋掉
 *
 * 需要的環境變數（Cloudflare Pages 專案 → 設定 → 環境變數，Production 與 Preview 都要設）：
 *   APPS_SCRIPT_URL      Apps Script 網頁應用程式網址（結尾 /exec）        ← 必填
 *   FORM_SHARED_SECRET   與 Apps Script 裡的 SHARED_SECRET 一模一樣        ← 必填
 *   TURNSTILE_SECRET     Cloudflare Turnstile 的 secret key               ← 選填
 *
 * ⚠️ Turnstile 是「有設就驗、沒設就跳過」：對頻目前還沒申請自己的 Turnstile 金鑰
 * （不可共用鴻綸那一組，site key 綁網域），所以先靠蜜罐＋前端的 3 秒門檻擋機器人。
 * 之後申請好，把 TURNSTILE_SECRET 設進來、前端加上 widget 就會自動開始驗，這支不必改。
 *
 * ⚠️ 前兩個環境變數沒設好時，這支回 503。前端（assets/main.js）收到非 2xx 會自動
 * 退回原本的 mailto 流程，所以就算後端還沒設定好，表單也不會變成死路。
 *
 * 對應的 Apps Script 原始碼在 ClaudeOnly\mybus\tonpair-contact-form\Code.gs
 * （不進這個發布用的白名單，因為裡面有共用密鑰）。
 */

const MAX = {
  name: 100, organization: 200, email: 200, line: 100,
  topic: 100, pains: 500, message: 5000
};

// 只導出 onRequest 一個進入點：同時導出 onRequest 與 onRequestPost 時，
// 哪一個優先在 Pages 的行為不夠明確，直接在裡面判斷方法最保險。
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  const missing = ['APPS_SCRIPT_URL', 'FORM_SHARED_SECRET'].filter((k) => !env[k]);
  if (missing.length) {
    console.error('缺少環境變數：' + missing.join('、'));
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  // 前端送的是 text/plain（避免 CORS 預檢），所以不能用 request.json() 判斷 content-type
  let body;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }

  // 蜜罐：真人看不到這個欄位，會填的幾乎都是機器人。回 ok 讓對方以為送出了，不給線索
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return json({ ok: true });
  }

  const f = {};
  for (const k of Object.keys(MAX)) {
    f[k] = typeof body[k] === 'string' ? body[k].trim().slice(0, MAX[k]) : '';
  }

  if (!f.name || !f.email) {
    return json({ ok: false, error: 'missing_required' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) {
    return json({ ok: false, error: 'bad_email' }, 400);
  }

  // Turnstile：有設 secret 才驗（見檔頭說明）
  if (env.TURNSTILE_SECRET) {
    const token = typeof body.token === 'string' ? body.token : '';
    if (!token) return json({ ok: false, error: 'no_token' }, 400);

    const form = new FormData();
    form.append('secret', env.TURNSTILE_SECRET);
    form.append('response', token);
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) form.append('remoteip', ip);

    let verify;
    try {
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: form
      });
      verify = await r.json();
    } catch (err) {
      console.error('turnstile_unreachable: ' + err);
      return json({ ok: false, error: 'verify_failed' }, 502);
    }
    if (!verify.success) {
      console.warn('turnstile_rejected: ' + JSON.stringify(verify['error-codes'] || []));
      return json({ ok: false, error: 'verify_failed' }, 403);
    }
  }

  // 轉給 Apps Script 寄信
  try {
    const r = await fetch(env.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.FORM_SHARED_SECRET,
        ...f,
        page: typeof body.page === 'string' ? body.page.slice(0, 300) : '',
        referrer: typeof body.referrer === 'string' ? body.referrer.slice(0, 300) : ''
      })
    });
    const out = await r.json();
    if (!out || out.ok !== true) {
      console.error('apps_script_error: ' + JSON.stringify(out));
      return json({ ok: false, error: 'send_failed' }, 502);
    }
  } catch (err) {
    console.error('apps_script_unreachable: ' + err);
    return json({ ok: false, error: 'send_failed' }, 502);
  }

  return json({ ok: true });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
