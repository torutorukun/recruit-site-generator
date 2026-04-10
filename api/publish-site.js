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

  const id = Math.random().toString(36).slice(2, 10);

  // base64画像を抽出してBlobにアップ、URLに置き換え
  const imgRegex = /src="(data:image\/(png|jpeg|webp|gif);base64,[^"]+)"/g;
  let processedHtml = html;
  const uploads = [];
  let match;
  let imgIndex = 0;

  while ((match = imgRegex.exec(html)) !== null) {
    uploads.push({ placeholder: match[1], index: imgIndex++ });
  }

  // 並行でアップロード
  await Promise.all(uploads.map(async ({ placeholder, index }) => {
    try {
      const [, base64Data] = placeholder.split(',');
      const mimeMatch = placeholder.match(/data:(image\/\w+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const ext = mimeType.split('/')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = await put(`sites/${id}/img${index}.${ext}`, buffer, {
        access: 'private',
        contentType: mimeType,
      });
      processedHtml = processedHtml.replace(placeholder, blob.url);
    } catch(e) {}
  }));

  // HTMLをアップ
  const blob = await put(`sites/${id}/index.html`, processedHtml, {
    access: 'private',
    contentType: 'text/html; charset=utf-8',
  });

  return res.status(200).json({ url: blob.url, id });
};
