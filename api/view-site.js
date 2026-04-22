const { list } = require('@vercel/blob');

module.exports = async (req, res) => {
  // URLパラメータがある場合（通常の共有URL）
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

  // カスタムドメインからのアクセス
  const host = req.headers.host || '';
  const domain = host.split(':')[0]; // ポート番号を除去

  try {
    // ドメインマッピングを検索
    const { blobs } = await list({ prefix: `domains/${domain}.json` });
    if (blobs.length === 0) return res.status(404).send('サイトが見つかりません');

    const mappingRes = await fetch(blobs[0].url);
    const mapping = await mappingRes.json();

    const siteRes = await fetch(mapping.blobUrl);
    if (!siteRes.ok) return res.status(404).send('サイトが見つかりません');

    const html = await siteRes.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch(e) {
    return res.status(500).send('エラー: ' + e.message);
  }
};
