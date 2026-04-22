const { put, get } = require('@vercel/blob');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { password, domain, blobUrl } = req.body;
  if (password !== process.env.APP_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // ドメインマッピングをBlobに保存
    const mapping = { domain, blobUrl, createdAt: new Date().toISOString() };
    await put(`domains/${domain}.json`, JSON.stringify(mapping), {
      access: 'public',
      contentType: 'application/json',
    });
    return res.status(200).json({ success: true });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
