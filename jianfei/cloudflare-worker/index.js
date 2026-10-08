// 减脂计划云端同步 Worker（Cloudflare Workers + D1）
// 路由：
//   GET /api/state?uid=xxx   拉取该 uid 的进度（shop/ck/body 三段 JSON）
//   PUT /api/state           上传进度，Body: {uid, shop, ck, body}
// 安全：请求头必须带 Authorization: Bearer <SYNC_KEY>（与 Worker 环境变量 SYNC_KEY 一致）

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

export default {
  async fetch(request, env) {
    // 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // 密钥校验
    const auth = request.headers.get('Authorization');
    if (auth !== 'Bearer ' + env.SYNC_KEY) {
      return json({ error: 'unauthorized' }, 401);
    }

    const url = new URL(request.url);

    // 拉取进度
    if (url.pathname === '/api/state' && request.method === 'GET') {
      const uid = (url.searchParams.get('uid') || '').slice(0, 64);
      const row = await env.DB.prepare('SELECT shop, ck, body FROM state WHERE uid = ?').bind(uid).first();
      return json(row
        ? { shop: JSON.parse(row.shop), ck: JSON.parse(row.ck), body: JSON.parse(row.body) }
        : { shop: {}, ck: {}, body: {} });
    }

    // 上传进度（整份覆盖该 uid）
    if (url.pathname === '/api/state' && request.method === 'PUT') {
      let data;
      try {
        data = await request.json();
      } catch (e) {
        return json({ error: 'bad json' }, 400);
      }
      const uid = (data.uid || '').toString().slice(0, 64);
      if (!uid) return json({ error: 'uid required' }, 400);

      const shop = JSON.stringify(data.shop || {});
      const ck = JSON.stringify(data.ck || {});
      const body = JSON.stringify(data.body || {});
      const now = Date.now();

      await env.DB.prepare(
        `INSERT INTO state (uid, shop, ck, body, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(uid) DO UPDATE SET
           shop = excluded.shop,
           ck = excluded.ck,
           body = excluded.body,
           updated_at = excluded.updated_at`
      ).bind(uid, shop, ck, body, now).run();

      return json({ ok: true, updated_at: now });
    }

    return json({ error: 'not found' }, 404);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS }
  });
}
