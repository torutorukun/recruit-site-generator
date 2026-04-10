const { get } = require('@vercel/blob');

module.exports = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).send('No ID');

  try {
    const blob = await get(`sites/${id}/index.html`);
    if (!blob) return res.status(404).send('Not found');
    const r = await fetch(blob.url);
    const html = await r.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch(e) {
    return res.status(404).send('Not found');
  }
};
