const { put } = require('@vercel/blob');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { html, password } = req.body;
  if (password !== process.env.APP_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  if (!html) return res.status(400).json({ error: 'No HTML provided' });

  // ランダムID生成
  const id = Math.random().toString(36).slice(2, 10);

  const blob = await put(`sites/${id}.html`, html, {
    access: 'public',
    contentType: 'text/html; charset=utf-8',
  });

  return res.status(200).json({ url: blob.url, id });
};
