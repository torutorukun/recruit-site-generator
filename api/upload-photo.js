const { put } = require('@vercel/blob');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, key, base64 } = req.body;
  if (password !== process.env.APP_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  if (!base64 || !key) return res.status(400).json({ error: 'Missing data' });

  try {
    // base64をBufferに変換
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid base64' });
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const filename = `photos/${Date.now()}-${key}.${ext}`;

    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: mimeType,
    });

    return res.status(200).json({ url: blob.url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
