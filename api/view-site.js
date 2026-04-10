module.exports = async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('No URL');

  try {
    const r = await fetch(decodeURIComponent(url));
    if (!r.ok) return res.status(404).send('Not found');
    const html = await r.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch(e) {
    return res.status(404).send('Not found: ' + e.message);
  }
};
