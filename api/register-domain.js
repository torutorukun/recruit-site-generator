const { put } = require('@vercel/blob');

const VERCEL_PROJECT_ID = 'prj_3LcWRtzcYAdojtub5zYplDAX5ZMW';
const VERCEL_TEAM_ID = 'torutorukun1029-arts-projects';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { password, domain, blobUrl } = req.body;
  if (password !== process.env.APP_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // 1. Vercel APIでrecruit-viewerプロジェクトにドメインを自動追加
    const vercelToken = process.env.VERCEL_API_TOKEN;
    const addDomain = await fetch(`https://api.vercel.com/v9/projects/recruit-viewer/domains?teamId=${VERCEL_TEAM_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    });
    const domainResult = await addDomain.json();
    console.log('Vercel domain add:', JSON.stringify(domainResult));

    // 2. BlobにドメインマッピングをJSON保存
    const mapping = { domain, blobUrl, status: 'active', createdAt: new Date().toISOString() };
    await put(`domains/${domain}.json`, JSON.stringify(mapping), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });

    return res.status(200).json({ success: true, vercel: domainResult });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
