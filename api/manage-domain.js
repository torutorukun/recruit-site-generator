const { put, list, del } = require('@vercel/blob');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { password, action, domain } = req.method === 'GET' ? req.query : req.body;
  if (password !== process.env.APP_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // 一覧取得
    if (action === 'list') {
      const { blobs } = await list({ prefix: 'domains/' });
      const mappings = await Promise.all(blobs.map(async b => {
        const r = await fetch(b.url);
        return await r.json();
      }));
      return res.status(200).json({ mappings });
    }

    // 停止
    if (action === 'stop') {
      const { blobs } = await list({ prefix: `domains/${domain}.json` });
      if (blobs.length === 0) return res.status(404).json({ error: 'Not found' });
      const r = await fetch(blobs[0].url);
      const mapping = await r.json();
      mapping.status = 'stopped';
      await put(`domains/${domain}.json`, JSON.stringify(mapping), {
        access: 'public', contentType: 'application/json',
      });
      return res.status(200).json({ success: true });
    }

    // 再開
    if (action === 'resume') {
      const { blobs } = await list({ prefix: `domains/${domain}.json` });
      if (blobs.length === 0) return res.status(404).json({ error: 'Not found' });
      const r = await fetch(blobs[0].url);
      const mapping = await r.json();
      mapping.status = 'active';
      await put(`domains/${domain}.json`, JSON.stringify(mapping), {
        access: 'public', contentType: 'application/json',
      });
      return res.status(200).json({ success: true });
    }

    // 削除
    if (action === 'delete') {
      const { blobs } = await list({ prefix: `domains/${domain}.json` });
      if (blobs.length > 0) await del(blobs[0].url);
      return res.status(200).json({ success: true });
    }

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
