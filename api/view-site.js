const { list } = require('@vercel/blob');

module.exports = async (req, res) => {
  const { url } = req.query;
  if (url) {
    try {
      const r = await fetch(decodeURIComponent(url));
      if (!r.ok) return res.status(404).send('Not found');
      const html = await r.text();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch(e) {
      return res.status(404).send('Not found: ' + e.message);
    }
  }

  const host = req.headers.host || '';
  const domain = host.split(':')[0];

  try {
    const { blobs } = await list({ prefix: `domains/${domain}.json` });
    if (blobs.length === 0) return res.status(404).send('サイトが見つかりません');

    const mappingRes = await fetch(blobs[0].url);
    const mapping = await mappingRes.json();

    // 停止中チェック
    if (mapping.status === 'stopped') {
      return res.status(200).send(`<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>公開停止中</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f7f6}div{text-align:center;color:#706d65}.icon{font-size:48px;margin-bottom:16px}.title{font-size:20px;font-weight:700;margin-bottom:8px}.sub{font-size:14px}</style></head><body><div><div class="icon">🔒</div><div class="title">このサイトは現在公開停止中です</div><div class="sub">お問い合わせは担当者までご連絡ください</div></div></body></html>`);
    }

    const siteRes = await fetch(mapping.blobUrl);
    if (!siteRes.ok) return res.status(404).send('サイトが見つかりません');

    const html = await siteRes.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch(e) {
    return res.status(500).send('エラー: ' + e.message);
  }
};
