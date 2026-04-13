const SYSTEM_PROMPT = `あなたは採用ピッチ資料の専門家です。提供された情報からデータを抽出してください。

【最重要ルール】
■ 数字・固有名詞は提供された情報にある数字・言葉だけを使う。なければ必ず空文字。絶対に推測・でっち上げをしない。
■ 文章・説明文は提供された内容をもとにAIが自然にまとめてよい。
■ 国税庁データがある場合、住所・設立年は国税庁データを優先。
■ SNSのURLは提供されたサイトのHTMLに実際にリンクとして存在するものだけ記載。テキスト中にYouTube・SNSの言及があってもURLを推測・生成しない。確信が持てなければ必ず空文字。
■ YouTubeのURLは特に厳格に。チャンネル名が書いてあってもURLが明示されていなければ空文字にする。
■ 従業員数はIndeed求人票の「50〜149人」のような範囲表記は使用しない。会社HP等から明確な数字が取れた場合のみ数字セクションに使用可。
■ FAQは求人内容から確実に答えられるものだけ生成。
■ 補足情報・MTG録画の内容も積極的に活用して情報を補完する。
■ JSON形式のみで回答。前置き・説明不要。

【給与判定ルール】
月給→salaryUnit="月給"万円単位 / 年俸→"年俸"万円単位 / 時給→"時給"円単位 / 日給→"日給"円単位

{
  "companyName": "会社名",
  "ceo": "代表者名（なければ空文字）",
  "address": "住所（国税庁優先。なければ空文字）",
  "founded": "設立年月（国税庁優先。なければ空文字）",
  "sales": "売上高（なければ空文字）",
  "companyNote": "会社・事業に関する特記事項（補足情報にある将来計画・社長YouTube出演・その他ハイライト等。なければ空文字）",
  "business": "事業内容一行",
  "mission": "ミッション（2行）",
  "missionEn": "英語サブタイトル（なければ空文字）",
  "missionDesc": "企業説明80文字以内",
  "bizHeadline": "事業コピー",
  "services": [{"title":"","desc":""},{"title":"","desc":""},{"title":"","desc":""},{"title":"","desc":""}],
  "biz1Title": "メイン事業名",
  "biz1Body": "メイン事業説明200文字",
  "biz2Title": "サブ事業名（なければ空文字）",
  "biz2Body": "サブ事業説明（なければ空文字）",
  "cultureVal1": "カルチャー価値観1",
  "cultureVal2": "カルチャー価値観2",
  "cultureDesc": "カルチャー説明300文字",
  "wantedList": ["求める人物像20文字以内","","","",""],
  "interview": {"person":"","q1":"","a1":"","q2":"","a2":"","q3":"","a3":""},
  "salaryMin": "","salaryMax": "","salaryUnit": "月給","salaryNote": "",
  "salaryFactors": [{"name":"","desc":""},{"name":"","desc":""},{"name":"","desc":""}],
  "careerPath": [{"title":"","period":"","salary":"","desc":""},{"title":"","period":"","salary":"","desc":""},{"title":"","period":"","salary":"","desc":""},{"title":"","period":"","salary":"","desc":""}],
  "salaryExamples": [{"label":"","amount":""},{"label":"","amount":""},{"label":"","amount":""}],
  "workHours": "","workLocation": "勤務地・アクセス（提供情報から。なければ空文字）",
  "holidays": ["","",""],
  "benefits": ["","","","","",""],
  "locations": [
    {"name": "拠点名・施設名（提供情報から）", "address": "住所（提供情報から）"},
    {"name": "", "address": ""},
    {"name": "", "address": ""}
  ],
  "numbers": [
    {"label":"数字のラベル（設立年数・定員・スタッフ数など提供情報から）","value":"数値","unit":"単位"},
    {"label":"","value":"","unit":""},
    {"label":"","value":"","unit":""},
    {"label":"","value":"","unit":""}
  ],
  "faq": [
    {"q":"よくある質問（提供情報から確実に答えられるものだけ）","a":"回答"},
    {"q":"","a":""},
    {"q":"","a":""},
    {"q":"","a":""}
  ],
  "sns": {
    "instagram": "InstagramのURL（実際にあれば。なければ空文字）",
    "twitter": "XのURL（実際にあれば。なければ空文字）",
    "youtube": "YouTubeのURL（実際にあれば。なければ空文字）",
    "line": "LINE公式のURL（実際にあれば。なければ空文字）"
  }
}`;

function extractText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
    .replace(/\s+/g,' ').trim();
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {'User-Agent':'Mozilla/5.0 (compatible; RecruitBot/1.0)'},
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = extractText(html);
    return text.length > 100 ? text.slice(0, 2000) : null;
  } catch { return null; }
}

async function fetchCompanyPages(baseUrl) {
  const base = baseUrl.replace(/\/$/, '');
  const paths = ['','/company','/about','/corporate','/profile','/company/overview','/about/company','/recruit','/access','/location','/locations','/office','/contact','/store','/shop','/branch'];
  const results = await Promise.allSettled(paths.map(p => fetchPage(base + p)));
  const seen = new Set();
  const combined = [];
  let total = 0;
  for (const r of results) {
    const t = r.status === 'fulfilled' ? r.value : null;
    if (!t) continue;
    const key = t.slice(0, 100);
    if (!seen.has(key) && total < 4000) {
      seen.add(key);
      combined.push(t);
      total += t.length;
    }
  }
  return combined.join('\n\n---\n\n');
}

async function fetchKokuzeicho(companyName) {
  if (!companyName || !process.env.KOKUZEI_API_KEY) return null;
  try {
    const url = `https://api.houjin-bangou.nta.go.jp/4/name?id=${process.env.KOKUZEI_API_KEY}&name=${encodeURIComponent(companyName)}&mode=2&type=12&output=json`;
    const res = await fetch(url, {signal: AbortSignal.timeout(5000)});
    if (!res.ok) return null;
    const data = await res.json();
    const corp = data.corporations?.[0];
    if (!corp) return null;
    return {
      address: [corp.prefectureName, corp.cityName, corp.streetNumber].filter(Boolean).join(''),
      founded: corp.assignmentDate ? corp.assignmentDate.slice(0,7).replace('-','年')+'月' : '',
      name: corp.name || '',
    };
  } catch { return null; }
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  const { text, password, hpUrl, tldvUrl, extraInfo } = req.body;
  if (password !== process.env.APP_PASSWORD) return res.status(401).json({error: 'パスワードが違います'});
  if (!text || text.trim().length < 50) return res.status(400).json({error: '求人原稿が短すぎます'});

  const nameMatch = text.match(/(?:株式会社|合同会社|有限会社|一般社団法人)[^\s　「」【】\n]{1,20}/);
  const companyNameGuess = nameMatch ? nameMatch[0] : '';

  const [siteText, kokuzeiData] = await Promise.all([
    hpUrl && hpUrl.startsWith('http') ? fetchCompanyPages(hpUrl) : Promise.resolve(null),
    fetchKokuzeicho(companyNameGuess),
  ]);

  let userContent = `【Indeed求人原稿】\n${text}`;
  if (siteText) userContent += `\n\n【会社サイト本文（${hpUrl}）】\n${siteText}`;
  if (kokuzeiData) {
    userContent += `\n\n【国税庁法人データ（公的情報・信頼性高）】\n`;
    if (kokuzeiData.name) userContent += `法人名: ${kokuzeiData.name}\n`;
    if (kokuzeiData.address) userContent += `所在地: ${kokuzeiData.address}\n`;
    if (kokuzeiData.founded) userContent += `登記日: ${kokuzeiData.founded}\n`;
  }
  if (extraInfo && extraInfo.trim()) userContent += `\n\n【担当者からの補足情報（必ず反映すること）】\n${extraInfo}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{role: 'user', content: userContent}]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({error: data.error.message});
    const txt = (data.content?.[0]?.text || '').replace(/```json\n?|```\n?/g,'').trim();
    const parsed = JSON.parse(txt);
    return res.status(200).json({result: parsed});
  } catch (e) {
    return res.status(500).json({error: e.message});
  }
};
