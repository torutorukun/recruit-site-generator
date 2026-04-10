module.exports = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).send('No ID');

  try {
    const blobUrl = `https://k8ubd8aeiskzmiru.public.blob.vercel-storage.com/sites/${id}/index.html`;
    const r = await fetch(blobUrl);
    if (!r.ok) return res.status(404).send('Not found');
    const html = await r.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch(e) {
    return res.status(404).send('Not found');
  }
};
