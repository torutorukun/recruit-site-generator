// ============================================================
// generate-images.js (v2) - DALL-E 3を最大限活用
// ============================================================
// - 全画像HD品質（quality:'hd'）
// - 会社固有情報をプロンプトに反映（mission/bizHeadline/services等）
// - テーマカラーと連動（navy/forest/burgundy等を画像にも反映）
// - 5種類の画風から業種で自動選択（photo/illustration/watercolor/minimalist/3D）
// - 構図・カメラアングル・余白を緻密に指定
// ============================================================

// ──────────────────────────────────────────
// テーマカラー定義（generate-site.jsのTHEMESと一致）
// ──────────────────────────────────────────
const THEME_PALETTES = {
  navy: {
    name: 'deep navy blue',
    palette: 'deep navy blue (#1A2B4A) and bright cobalt blue (#1B6FBE) accents, with soft pale blue (#EBF4FF) highlights',
    mood: 'trustworthy, professional, corporate',
  },
  forest: {
    name: 'forest green',
    palette: 'deep forest green (#1A3D2B) and emerald green (#2D7A4F) accents, with pale mint (#E8F5EE) highlights',
    mood: 'natural, sustainable, calm',
  },
  charcoal: {
    name: 'charcoal',
    palette: 'sophisticated charcoal grey (#2C2C2C) and medium grey (#4A4A4A) tones, with soft pale grey (#F0F0F0) highlights',
    mood: 'minimalist, refined, modern',
  },
  burgundy: {
    name: 'burgundy red',
    palette: 'rich burgundy red (#6B1A2B) and warm wine red (#9B2335) accents, with soft pale rose (#FBEEF0) highlights',
    mood: 'premium, passionate, artisanal',
  },
  stone: {
    name: 'warm stone',
    palette: 'warm stone brown (#4A3D30) and earthy taupe (#7A6A58) tones, with soft cream (#F5F0EB) highlights',
    mood: 'warm, grounded, organic',
  },
  indigo: {
    name: 'deep indigo',
    palette: 'deep indigo (#2D1F6E) and royal purple (#3B2D8F) accents, with soft lavender (#EEEAFF) highlights',
    mood: 'innovative, intellectual, creative',
  },
};

// ──────────────────────────────────────────
// 業種カテゴリ判定（5種類の画風から自動選択）
// ──────────────────────────────────────────
function detectStyle(business, biz1Title, biz1Body, services, mission) {
  const text = [
    business, biz1Title, biz1Body, mission,
    ...(services || []).map(s => `${s.title || ''} ${s.desc || ''}`),
  ].filter(Boolean).join(' ').toLowerCase();

  const illustrationKeywords = [
    '保育', '幼稚園', 'こども', '子ども', '児童', '学童', '託児',
    '介護', 'デイサービス', 'ヘルパー', '訪問介護', '高齢者', 'シニア',
    '飲食', 'レストラン', 'カフェ', '居酒屋', '料理', 'グルメ',
    '小売', '販売', 'ショップ', 'アパレル', 'eコマース',
  ];
  const watercolorKeywords = [
    'クリニック', '歯科', '医院', '薬局', '医療', '看護', 'リハビリ',
    '教育', '塾', '学校', 'スクール', '研修', '学習',
    '美容', 'サロン', 'エステ', 'ネイル', 'ヘア', 'スパ',
  ];
  const minimalistKeywords = [
    '法律', '弁護士', '会計', '税理', '司法書士', '行政書士',
    'コンサル', '戦略', '経営支援', 'm&a', 'ブランディング',
    '金融', '銀行', '証券', '保険', '投資', 'ファイナンス',
    'デザイン', 'クリエイティブ', '建築設計',
  ];
  const threeDKeywords = [
    'it', 'システム', 'ソフトウェア', 'アプリ', 'web', 'dx', 'ai', '人工知能',
    'saas', 'クラウド', 'iot', 'fintech', 'blockchain', 'web3',
    'スタートアップ', 'テック', 'データ分析', '機械学習',
  ];

  const score = {
    illustration: illustrationKeywords.filter(k => text.includes(k)).length,
    watercolor: watercolorKeywords.filter(k => text.includes(k)).length,
    minimalist: minimalistKeywords.filter(k => text.includes(k)).length,
    threeD: threeDKeywords.filter(k => text.includes(k)).length,
  };

  const max = Math.max(...Object.values(score));
  if (max === 0) return 'photo';
  if (score.threeD === max) return 'threeD';
  if (score.minimalist === max) return 'minimalist';
  if (score.watercolor === max) return 'watercolor';
  if (score.illustration === max) return 'illustration';
  return 'photo';
}

// ──────────────────────────────────────────
// 画風別のスタイル指定
// ──────────────────────────────────────────
function styleSpec(style, palette) {
  const specs = {
    photo: `Professional editorial photography, shot on full-frame DSLR with 35mm lens, natural soft lighting, shallow depth of field, cinematic color grading dominated by ${palette}. Authentic candid moments, no staged poses, magazine-quality composition`,
    illustration: `Modern flat vector illustration, clean geometric shapes, soft pastel color palette dominated by ${palette}, smooth gradients, minimal line work, friendly approachable style reminiscent of contemporary editorial illustration (Notion, Stripe, Linear style), no harsh outlines`,
    watercolor: `Delicate watercolor illustration with soft hand-painted texture, gentle color washes dominated by ${palette}, organic brush strokes, subtle paper texture visible, warm and human atmosphere, evocative of high-end editorial illustration`,
    minimalist: `Minimalist line art with extremely refined composition, elegant thin lines on clean background dominated by ${palette}, generous negative space, sophisticated and understated, evocative of Japanese ink wash aesthetic combined with modern editorial design`,
    threeD: `Modern 3D rendered illustration, soft isometric or three-quarter perspective, rounded clay-render aesthetic with smooth surfaces, subtle ambient occlusion, vibrant ${palette} color scheme, contemporary tech-forward style (Figma, Apple keynote aesthetic)`,
  };
  return specs[style] || specs.photo;
}

// ──────────────────────────────────────────
// 共通ネガティブ指定
// ──────────────────────────────────────────
const NEGATIVE = 'STRICTLY NO text, NO letters, NO Japanese characters, NO English words, NO logos, NO brand names, NO watermarks, NO recognizable celebrity faces, NO low quality artifacts, NO weird hands or distorted faces';

// ──────────────────────────────────────────
// セクション別プロンプト生成（緻密版）
// ──────────────────────────────────────────
function buildPrompt(slot, style, context, themeKey) {
  const theme = THEME_PALETTES[themeKey] || THEME_PALETTES.navy;
  const ss = styleSpec(style, theme.palette);

  const business = context.business || '';
  const mission = context.mission || '';
  const bizHeadline = context.bizHeadline || '';
  const biz1Title = context.biz1Title || '';
  const biz1Body = context.biz1Body || '';
  const biz2Title = context.biz2Title || '';
  const biz2Body = context.biz2Body || '';
  const cultureVal1 = context.cultureVal1 || '';
  const cultureVal2 = context.cultureVal2 || '';
  const cultureDesc = context.cultureDesc || '';
  const services = (context.services || []).filter(s => s && s.title).slice(0, 3);
  const servicesHint = services.length > 0
    ? `Related services include: ${services.map(s => s.title).join(', ')}.`
    : '';

  // ── ヒーロー（最重要・第一印象、左下に余白を作る）
  if (slot === 'cover') {
    const concept = mission || bizHeadline || business || 'a forward-looking Japanese company';
    return `Cinematic wide hero banner image (16:9 aspect ratio) for a Japanese company recruitment website. ${theme.mood} atmosphere.

CONCEPT: A symbolic visual representing "${concept}". ${business ? `Company business domain: ${business}.` : ''} ${servicesHint}

COMPOSITION: Aspirational and inviting scene with strong sense of depth and openness. Subject positioned in the RIGHT HALF of the frame, leaving deliberate negative space on the LEFT SIDE for text overlay. Eye-level perspective, balanced rule-of-thirds composition with leading lines guiding the eye into the depth of the frame.

LIGHTING: Soft natural morning light, warm color temperature (around 5000K), gentle highlights on key surfaces, subtle atmospheric haze suggesting possibility and growth.

STYLE: ${ss}.

${NEGATIVE}.`;
  }

  // ── 事業1
  if (slot === 'biz1') {
    const concept = biz1Title || business || 'core business activity';
    const detail = biz1Body ? ` Specifically: ${biz1Body.slice(0, 220)}` : '';
    return `Editorial-quality landscape image illustrating "${concept}" — the primary business activity of a Japanese company.${detail}

COMPOSITION: Symbolic representation of the work itself, focused on action, tools, and environment rather than people's faces. Centered subject with breathing room on all sides. Layered depth — foreground element, mid-ground subject, soft out-of-focus background. 4:3 framing in mind for cropping.

LIGHTING: Natural directional lighting from a side window, slight rim light to add dimension, ${theme.mood} mood.

STYLE: ${ss}.

${NEGATIVE}.`;
  }

  // ── 事業2（事業1と差別化）
  if (slot === 'biz2') {
    const concept = biz2Title || 'secondary business';
    const detail = biz2Body ? ` Specifically: ${biz2Body.slice(0, 220)}` : '';
    return `Editorial-quality landscape image showing a different aspect of the company — "${concept}".${detail}

COMPOSITION: Distinctly different angle, subject, and scale from the primary business image — if primary is a close-up, make this a wider shot, or vice versa. Maintain cohesive ${theme.name} color palette to feel like part of the same brand. Could focus on planning, strategy session, customer interaction, or service delivery moment. Strong focal point with clear visual hierarchy.

LIGHTING: Slightly cooler or differently angled lighting compared to the primary business image, but still maintaining ${theme.mood} atmosphere. Aim for visual variety while preserving brand consistency.

STYLE: ${ss}.

${NEGATIVE}.`;
  }

  // ── カルチャー
  if (slot === 'culture') {
    const values = [cultureVal1, cultureVal2].filter(Boolean).join(' and ');
    const desc = cultureDesc ? cultureDesc.slice(0, 220) : '';
    return `Editorial landscape image capturing the workplace culture of a Japanese company${values ? ` that values "${values}"` : ''}.${desc ? ` Culture description: ${desc}` : ''}

COMPOSITION: Wide horizontal scene showing an open, bright workspace with sense of community and warmth. INDIRECT view of people interacting — shot from behind, side angles, or focused on hands, gestures, and environmental details. NO clearly identifiable faces. Atmosphere of casual professionalism and genuine connection.

LIGHTING: Warm afternoon light streaming through large windows, soft elongated shadows, golden-hour quality with high color temperature contrast. ${theme.mood} mood throughout, with gentle bokeh in background highlights.

STYLE: ${ss}.

${NEGATIVE}.`;
  }

  return `Editorial image for a Japanese company recruitment website. ${ss}. ${NEGATIVE}.`;
}

// ──────────────────────────────────────────
// DALL-E 3 API 呼び出し → base64取得
// ──────────────────────────────────────────
async function generateOne(slot, prompt, quality) {
  try {
    const dalleRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1792x1024',         // 横長で統一（generate-site.jsのレイアウトに最適）
        quality,                    // 'hd' or 'standard'
        style: 'natural',           // vividより自然・採用サイト向き
        response_format: 'url',
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!dalleRes.ok) {
      const errText = await dalleRes.text();
      console.error(`DALL-E error for ${slot}:`, errText);
      return null;
    }

    const dalleData = await dalleRes.json();
    const imageUrl = dalleData.data?.[0]?.url;
    if (!imageUrl) return null;

    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(20000) });
    if (!imgRes.ok) return null;
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (e) {
    console.error(`generateOne error for ${slot}:`, e.message);
    return null;
  }
}

// ──────────────────────────────────────────
// メインハンドラ
// ──────────────────────────────────────────
module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { slots, context, password, quality: reqQuality, theme: reqTheme } = req.body;
  if (password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }
  if (!Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ error: 'slots is required' });
  }

  const ALLOWED_SLOTS = ['cover', 'biz1', 'biz2', 'culture'];
  const targets = slots.filter(s => ALLOWED_SLOTS.includes(s)).slice(0, 4);
  if (targets.length === 0) return res.status(200).json({ images: {} });

  const ctx = context || {};
  const themeKey = reqTheme || ctx.theme || 'navy';
  const quality = reqQuality === 'hd' ? 'hd' : 'standard'; // デフォルトstandard（Hobbyタイムアウト回避）

  const style = detectStyle(
    ctx.business, ctx.biz1Title, ctx.biz1Body, ctx.services, ctx.mission
  );

  const results = await Promise.allSettled(
    targets.map(async (slot) => {
      const prompt = buildPrompt(slot, style, ctx, themeKey);
      const base64 = await generateOne(slot, prompt, quality);
      return { slot, base64, promptPreview: prompt.slice(0, 300) };
    })
  );

  const images = {};
  const debug = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      if (r.value.base64) images[r.value.slot] = r.value.base64;
      debug.push({
        slot: r.value.slot,
        success: !!r.value.base64,
        promptPreview: r.value.promptPreview,
      });
    }
  }

  return res.status(200).json({
    images,
    style,
    theme: themeKey,
    quality,
    generated: Object.keys(images),
    debug,
  });
};
