const FONTS = {
  classic:  { serif: "'Noto Serif JP', serif",       googleUrl: "Noto+Serif+JP:wght@400;700" },
  modern:   { serif: "'Noto Sans JP', sans-serif",    googleUrl: "Noto+Sans+JP:wght@400;700" },
  elegant:  { serif: "'Shippori Mincho', serif",      googleUrl: "Shippori+Mincho:wght@400;700" },
  friendly: { serif: "'M PLUS Rounded 1c', sans-serif", googleUrl: "M+PLUS+Rounded+1c:wght@400;700" },
  bold:     { serif: "'Zen Kaku Gothic New', sans-serif", googleUrl: "Zen+Kaku+Gothic+New:wght@400;700" },
  kaisei:   { serif: "'Kaisei Opti', serif",          googleUrl: "Kaisei+Opti:wght@400;700" },
};
const THEMES = {
  navy:     { navy:'#1A2B4A', blue:'#1B6FBE', blueLight:'#3B8FD4', bluePale:'#EBF4FF' },
  forest:   { navy:'#1A3D2B', blue:'#2D7A4F', blueLight:'#4A9E6E', bluePale:'#E8F5EE' },
  charcoal: { navy:'#2C2C2C', blue:'#4A4A4A', blueLight:'#6B6B6B', bluePale:'#F0F0F0' },
  burgundy: { navy:'#6B1A2B', blue:'#9B2335', blueLight:'#C23B50', bluePale:'#FBEEF0' },
  stone:    { navy:'#4A3D30', blue:'#7A6A58', blueLight:'#9E8E7A', bluePale:'#F5F0EB' },
  indigo:   { navy:'#2D1F6E', blue:'#3B2D8F', blueLight:'#5A4AB0', bluePale:'#EEEAFF' },
};
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { data, password } = req.body;
  if (password !== process.env.APP_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const e = data;
  const thm = THEMES[e.theme] || THEMES.navy;
  const fnt = FONTS[e.font] || FONTS.classic;
  const cn = e.companyName || '会社名';
  const prefixes = ['株式会社','合同会社','有限会社','一般社団法人','特定非営利活動法人','NPO法人'];
  const prefix = prefixes.find(p => cn.startsWith(p)) || '';
  const shortName = prefix ? cn.replace(prefix, '').trim() : cn;
  const services = (e.services || []).filter(s => s.title && s.title.trim());
  const wantedList = (e.wantedList || []).filter(v => v && v.trim());
  const benefits = (e.benefits || []).filter(b => b && b.trim());
  const holidays = (e.holidays || []).filter(h => h && h.trim());
  const vc = (e.careerPath || []).filter(s => s && s.title && s.title.trim());
  const isHourly = e.salaryUnit === '時給' || e.salaryUnit === '日給';
  const sUnit = isHourly ? '円' : '万円';
  const stl = isHourly ? (e.salaryUnit + 'レンジ') : e.salaryUnit === '年俸' ? '年俸レンジ' : '月給レンジ';
  const sMin = parseInt(e.salaryMin) || 0;
  const sMax = parseInt(e.salaryMax) || 0;
  const iv = e.interview || {};
  const hasIV = (iv.q1 && iv.q1.trim()) || (iv.q2 && iv.q2.trim()) || (iv.q3 && iv.q3.trim());
  // ★ indeedUrl を使う
  const indeedUrl = e.indeedUrl || '#';
  const selectionProcess = (e.selectionProcess || []).filter(s => s && s.trim());
  const daySchedule = (e.daySchedule || []).filter(d => d.time && d.activity && d.time.trim() && d.activity.trim());
  const jobTypes = (e.jobTypes || []).filter(j => j.title && j.title.trim());
  const challenges = (e.challenges || []).filter(c => c && c.trim());
  const hasMessage = !!(e.ceoMessage && e.ceoMessage.trim());
  const hasVision = !!(e.missionFuture && e.missionFuture.trim()) || challenges.length > 0;
  const hasJobTypes = jobTypes.length > 0;
  const hasSelection = selectionProcess.length > 0;
  const hasDaySchedule = daySchedule.length > 0;
  const hasApply = !!(e.applyUrl || e.applyEmail);

  // セクション表示判定フラグ
  const hasOverview = !!(e.address || e.ceo || e.founded || e.sales);
  const hasBusiness = !!(e.bizHeadline || services.length > 0 || (e.biz1Title && e.biz1Body));
  const hasCompensation = !!((sMin && sMax) || vc.length >= 1);
  const hasCulture = !!(e.cultureDesc || e.cultureVal1 || e.cultureVal2);
  const hasWanted = wantedList.length > 0;
  const hasWorkstyle = !!(e.workHours || e.workLocation || holidays.length > 0 || benefits.length > 0);
  const numbers = (e.numbers || []).filter(n => n.label && n.value);
  const faq = (e.faq || []).filter(f => f.q && f.a);
  const hasSns = !!(e.sns && (e.sns.instagram || e.sns.twitter || e.sns.youtube || e.sns.line));
  const hasNumbers = numbers.length > 0;
  const hasFaq = faq.length > 0;
  const locations = (e.locations || []).filter(l => l.address && l.address.trim());
  const mapQuery = e.workLocation || (locations.length > 0 ? locations[0].address : '') || e.address || '';
  const mapUrl = mapQuery ? 'https://maps.google.com/maps?q=' + encodeURIComponent(mapQuery) + '&output=embed' : '';
  const mapLabel = e.workLocation || e.address || '';

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${cn} 採用情報</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=${fnt.googleUrl}&family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
/* ── DESIGN.md準拠：游ゴシック @font-face トリック（Windows対応） ── */
@font-face {
  font-family: AdjustedYuGothic;
  font-weight: 400;
  src: local("Yu Gothic Medium"), local("YuGothic-Medium");
}
@font-face {
  font-family: AdjustedYuGothic;
  font-weight: 700;
  src: local("Yu Gothic Bold"), local("YuGothic-Bold");
}

:root {
  --text-black: #23221e;
  --text-grey: #706d65;
  --text-disabled: #c1bdb7;
  --stone-01: #f8f7f6;
  --stone-02: #edebe8;
  --stone-03: #aaa69f;
  --stone-04: #4e4c49;
  --white: #ffffff;
  --border: #d6d3d0;
  --surface: #f2f1f0;

  --navy: ${thm.navy};
  --blue: ${thm.blue};
  --blue-light: ${thm.blueLight};
  --blue-pale: ${thm.bluePale};
  --accent: #E8F1FB;

  --font-ja: AdjustedYuGothic, "Yu Gothic", YuGothic, "Hiragino Sans", "Noto Sans JP", sans-serif;
  --font-serif: ${fnt.serif};

  --sp-xs: 4px;
  --sp-s: 8px;
  --sp-m: 16px;
  --sp-l: 24px;
  --sp-xl: 32px;
  --sp-xxl: 40px;
  --sp-3xl: 64px;
  --sp-4xl: 96px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-ja);
  color: var(--text-black);
  background: var(--white);
  line-height: 1.75;
  letter-spacing: 0.03em;
  overflow-x: hidden;
  overflow-wrap: break-word;
  word-break: break-word;
}

/* ── ナビゲーション ── */
nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  background: rgba(255,255,255,0.97);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--sp-3xl);
}
.nav-brand {
  display: flex;
  flex-direction: column;
  text-decoration: none;
}
.nav-prefix {
  font-size: 10px;
  color: var(--text-grey);
  letter-spacing: 0.05em;
  line-height: 1.2;
}
.nav-name {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 700;
  color: var(--navy);
  line-height: 1.25;
  letter-spacing: 0;
}
.nav-links {
  display: flex;
  gap: var(--sp-xl);
  list-style: none;
}
.nav-links a {
  font-size: 13px;
  color: var(--text-grey);
  text-decoration: none;
  letter-spacing: 0.05em;
  transition: color 0.2s;
}
.nav-links a:hover { color: var(--blue); }
.nav-cta {
  background: var(--blue);
  color: var(--white);
  padding: var(--sp-s) var(--sp-l);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: background 0.2s, transform 0.1s;
}
.nav-cta:hover { background: var(--navy); transform: translateY(-1px); }

/* ── ヒーロー ── */
.hero {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding-top: 64px;
}
.hero-left {
  background: var(--navy);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--sp-4xl) var(--sp-4xl);
  position: relative;
  overflow: hidden;
}
.hero-left::after {
  content: '';
  position: absolute;
  bottom: -80px; right: -80px;
  width: 360px; height: 360px;
  border-radius: 50%;
  background: rgba(59,143,212,0.08);
  pointer-events: none;
}
.hero-eyebrow {
  font-size: 10px;
  font-weight: 500;
  color: var(--blue-light);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: var(--sp-l);
}
.hero-prefix-text {
  font-size: 13px;
  color: rgba(255,255,255,0.45);
  font-weight: 300;
  line-height: 1.25;
  letter-spacing: 0.05em;
  margin-bottom: var(--sp-xs);
}
.hero-name {
  font-family: var(--font-serif);
  font-size: clamp(28px, 3.5vw, 48px);
  color: var(--white);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0;
  margin-bottom: var(--sp-xl);
}
.hero-rule {
  width: 40px;
  height: 3px;
  background: var(--blue);
  margin-bottom: var(--sp-l);
}
.hero-mission {
  font-family: var(--font-serif);
  font-size: 17px;
  color: rgba(255,255,255,0.92);
  line-height: 1.75;
  letter-spacing: 0.02em;
  margin-bottom: var(--sp-m);
}
.hero-desc {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  line-height: 1.75;
  letter-spacing: 0.03em;
  max-width: 400px;
}
.hero-right {
  position: relative;
  overflow: hidden;
  background: var(--stone-02);
}
.hero-right img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.hero-right-empty {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--blue-pale) 0%, var(--stone-02) 100%);
}

/* ── セクション共通 ── */
section {
  padding: var(--sp-4xl) 0;
}
.container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 var(--sp-3xl);
}
.section-eyebrow {
  font-size: 10px;
  font-weight: 700;
  color: var(--blue);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: var(--sp-s);
  display: block;
}
.section-title {
  font-family: var(--font-serif);
  font-size: 32px;
  font-weight: 700;
  color: var(--navy);
  line-height: 1.25;
  letter-spacing: 0;
  margin-bottom: var(--sp-m);
}
.section-lead {
  font-size: 15px;
  color: var(--text-grey);
  line-height: 1.75;
  letter-spacing: 0.03em;
  max-width: 520px;
}
.section-header {
  margin-bottom: var(--sp-3xl);
}

/* ── 会社概要 ── */
.overview { background: var(--stone-01); }
.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-4xl);
  align-items: start;
}
.overview-table { width: 100%; }
.overview-table tr { border-bottom: 1px solid var(--border); }
.overview-table td {
  padding: var(--sp-m) 0;
  font-size: 14px;
  vertical-align: top;
  line-height: 1.75;
  letter-spacing: 0.03em;
}
.overview-table td:first-child {
  color: var(--text-grey);
  width: 88px;
  font-size: 12px;
  letter-spacing: 0.05em;
}
.overview-table td:last-child {
  color: var(--text-black);
  font-weight: 500;
}
.overview-photo {
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 4/3;
  background: var(--stone-02);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.overview-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* ── 事業紹介 ── */
.biz-headline {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 700;
  color: var(--navy);
  text-align: center;
  line-height: 1.5;
  letter-spacing: 0;
  margin-bottom: var(--sp-3xl);
  padding: var(--sp-xl) var(--sp-3xl);
  background: var(--blue-pale);
  border-radius: 8px;
}
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--sp-l);
  margin-bottom: var(--sp-4xl);
}
.service-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-top: 3px solid var(--blue);
  border-radius: 8px;
  padding: var(--sp-xl) var(--sp-l);
  transition: transform 0.2s, box-shadow 0.2s;
}
.service-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
}
.service-num {
  font-size: 10px;
  font-weight: 700;
  color: var(--blue);
  letter-spacing: 0.15em;
  margin-bottom: var(--sp-s);
}
.service-title {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  color: var(--navy);
  line-height: 1.5;
  letter-spacing: 0;
  margin-bottom: var(--sp-s);
}
.service-desc {
  font-size: 13px;
  color: var(--text-grey);
  line-height: 1.75;
  letter-spacing: 0.03em;
}
.biz-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-4xl);
  align-items: center;
  margin-bottom: var(--sp-4xl);
  padding-bottom: var(--sp-4xl);
  border-bottom: 1px solid var(--border);
}
.biz-detail:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.biz-detail.reverse { direction: rtl; }
.biz-detail.reverse > * { direction: ltr; }
.biz-title {
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 700;
  color: var(--navy);
  line-height: 1.4;
  letter-spacing: 0;
  margin-bottom: var(--sp-m);
}
.biz-text {
  font-size: 14px;
  color: var(--text-grey);
  line-height: 1.85;
  letter-spacing: 0.03em;
}
.biz-photo {
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 4/3;
  background: var(--stone-02);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.biz-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* ── 報酬・評価 ── */
.compensation { background: var(--navy); }
.compensation .section-eyebrow { color: var(--blue-light); }
.compensation .section-title { color: var(--white); }
.comp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-4xl);
  align-items: start;
}
.salary-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: var(--sp-3xl);
  text-align: center;
}
.salary-label {
  font-size: 11px;
  color: rgba(255,255,255,0.45);
  letter-spacing: 0.15em;
  margin-bottom: var(--sp-l);
  display: block;
}
.salary-amount {
  font-family: var(--font-serif);
  font-size: 52px;
  font-weight: 700;
  color: var(--white);
  line-height: 1;
  margin-bottom: var(--sp-s);
}
.salary-unit { font-size: 20px; color: rgba(255,255,255,0.65); }
.salary-note {
  font-size: 12px;
  color: rgba(255,255,255,0.35);
  margin-top: var(--sp-l);
  line-height: 1.75;
  letter-spacing: 0.03em;
}
.comp-right-title {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--white);
  line-height: 1.25;
  letter-spacing: 0;
  margin-bottom: var(--sp-l);
  padding-bottom: var(--sp-m);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.career-list { list-style: none; }
.career-item {
  display: flex;
  gap: var(--sp-m);
  padding: var(--sp-m) 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.career-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--blue-light);
  margin-top: 6px;
  flex-shrink: 0;
}
.career-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--white);
  line-height: 1.5;
  letter-spacing: 0;
}
.career-info {
  font-size: 12px;
  color: rgba(255,255,255,0.45);
  margin-top: 2px;
  letter-spacing: 0.03em;
}
.career-sal {
  font-size: 13px;
  color: var(--blue-light);
  font-weight: 500;
  margin-top: 4px;
}

/* ── カルチャー ── */
.culture-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-4xl);
  align-items: center;
}
.culture-tags {
  display: flex;
  gap: var(--sp-s);
  flex-wrap: wrap;
  margin-bottom: var(--sp-l);
}
.culture-tag {
  background: var(--blue);
  color: var(--white);
  padding: 5px var(--sp-m);
  border-radius: 4px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.culture-text {
  font-size: 14px;
  color: var(--text-grey);
  line-height: 1.85;
  letter-spacing: 0.03em;
}
.culture-photo {
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 4/3;
  background: var(--stone-02);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.culture-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* ── 求める人物像 ── */
.wanted { background: var(--stone-01); }
.wanted-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--sp-m);
}
.wanted-item {
  background: var(--white);
  border: 1px solid var(--border);
  border-left: 4px solid var(--blue);
  border-radius: 4px;
  padding: var(--sp-m) var(--sp-l);
  display: flex;
  align-items: center;
  gap: var(--sp-m);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-black);
  line-height: 1.5;
  letter-spacing: 0.03em;
}
.wanted-num {
  font-size: 11px;
  font-weight: 700;
  color: var(--blue);
  min-width: 24px;
  letter-spacing: 0.05em;
}

/* ── 社員の声 ── */
.iv-card {
  background: var(--stone-01);
  border-radius: 8px;
  padding: var(--sp-3xl);
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: var(--sp-3xl);
  align-items: start;
  border: 1px solid var(--border);
}
.iv-photo {
  width: 180px; height: 180px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--stone-02);
}
.iv-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.iv-person {
  font-size: 12px;
  color: var(--text-grey);
  text-align: center;
  margin-top: var(--sp-s);
  letter-spacing: 0.05em;
  line-height: 1.5;
}
.qa-item { margin-bottom: var(--sp-l); }
.qa-q {
  font-size: 14px;
  font-weight: 700;
  color: var(--blue);
  margin-bottom: var(--sp-s);
  display: flex;
  align-items: flex-start;
  gap: var(--sp-s);
  line-height: 1.5;
  letter-spacing: 0.03em;
}
.qa-badge {
  background: var(--blue);
  color: var(--white);
  width: 20px; height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
}
.qa-a {
  font-size: 14px;
  color: var(--text-grey);
  line-height: 1.85;
  letter-spacing: 0.03em;
  padding-left: 28px;
}

/* ── 働き方 ── */
.workstyle-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3xl);
}
.ws-item h3 {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 700;
  color: var(--navy);
  margin-bottom: var(--sp-m);
  padding-bottom: var(--sp-s);
  border-bottom: 2px solid var(--blue);
  line-height: 1.25;
  letter-spacing: 0;
  display: inline-block;
}
.ws-item p {
  font-size: 14px;
  color: var(--text-grey);
  line-height: 1.85;
  letter-spacing: 0.03em;
}
.benefits-wrap {
  margin-top: var(--sp-3xl);
  padding-top: var(--sp-3xl);
  border-top: 1px solid var(--border);
}
.benefits-wrap h3 {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--navy);
  margin-bottom: var(--sp-l);
  line-height: 1.25;
  letter-spacing: 0;
}
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--sp-s);
}
.benefit-item {
  background: var(--blue-pale);
  border-radius: 4px;
  padding: var(--sp-s) var(--sp-m);
  font-size: 13px;
  color: var(--navy);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--sp-s);
  line-height: 1.5;
  letter-spacing: 0.03em;
}
.benefit-item::before {
  content: '✓';
  color: var(--blue);
  font-weight: 700;
  flex-shrink: 0;
}

/* ── CTA ── */
.cta {
  background: var(--navy);
  text-align: center;
  padding: var(--sp-4xl) var(--sp-3xl);
}
.cta h2 {
  font-family: var(--font-serif);
  font-size: 32px;
  font-weight: 700;
  color: var(--white);
  line-height: 1.5;
  letter-spacing: 0;
  margin-bottom: var(--sp-m);
}
.cta p {
  font-size: 15px;
  color: rgba(255,255,255,0.55);
  margin-bottom: var(--sp-3xl);
  line-height: 1.75;
  letter-spacing: 0.03em;
}
.cta-btn {
  display: inline-block;
  background: var(--blue);
  color: var(--white);
  padding: var(--sp-m) var(--sp-3xl);
  border-radius: 6px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: background 0.2s, transform 0.15s;
}
.cta-btn:hover { background: var(--blue-light); transform: translateY(-2px); }

/* ── フッター ── */
footer {
  background: var(--text-black);
  color: var(--stone-03);
  text-align: center;
  padding: var(--sp-l);
  font-size: 12px;
  letter-spacing: 0.05em;
  line-height: 1.5;
}

/* ── アニメーション ── */
@keyframes countUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
@keyframes lineGrow { from { width:0; } to { width:40px; } }
@keyframes fadeSlide { from { opacity:0; transform:translateX(-16px); } to { opacity:1; transform:translateX(0); } }
.fade-up {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
}
.fade-up.visible { opacity: 1; transform: translateY(0); }
.fade-up.delay-1 { transition-delay: 0.12s; }
.fade-up.delay-2 { transition-delay: 0.24s; }
.fade-up.delay-3 { transition-delay: 0.36s; }
.fade-up.delay-4 { transition-delay: 0.48s; }
.fade-left {
  opacity: 0;
  transform: translateX(-24px);
  transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
}
.fade-left.visible { opacity: 1; transform: translateX(0); }
.count-up { display: inline-block; }
/* カードホバー */
.biz-service-card:hover, .wanted-item:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.biz-service-card, .wanted-item { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease; }
/* セクションタイトル下線アニメ */
.section-title-line {
  display: block;
  width: 0;
  height: 3px;
  background: var(--blue);
  margin: 12px auto 0;
  transition: width 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s;
}
.section-title-line.visible { width: 40px; }

/* ── 代表メッセージ ── */
.message-wrap { max-width: 780px; margin: 0 auto; }
.message-body {
  font-family: var(--font-serif);
  font-size: 16px;
  line-height: 2;
  color: var(--text-black);
  letter-spacing: 0.04em;
  white-space: pre-line;
  border-left: 3px solid var(--blue);
  padding-left: var(--sp-xl);
}
.message-sign {
  margin-top: var(--sp-l);
  font-size: 14px;
  font-weight: 700;
  color: var(--text-grey);
  letter-spacing: 0.1em;
  padding-left: var(--sp-xl);
}

/* ── 目指す未来・課題 ── */
.vision-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-xl); }
.vision-future {
  background: var(--navy);
  color: var(--white);
  border-radius: 12px;
  padding: var(--sp-3xl);
}
.vision-future h3 { font-family: var(--font-serif); font-size: 20px; color: var(--white); margin-bottom: var(--sp-l); }
.vision-future p { font-size: 15px; line-height: 1.85; color: rgba(255,255,255,0.8); }
.vision-challenges { display: flex; flex-direction: column; gap: var(--sp-m); }
.challenge-item {
  background: var(--stone-01);
  border-radius: 10px;
  padding: var(--sp-l);
  border-left: 3px solid var(--blue);
  font-size: 15px;
  line-height: 1.7;
}

/* ── 募集職種 ── */
.job-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--sp-l); }
.job-card {
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: var(--sp-xl);
  transition: border-color 0.2s, box-shadow 0.3s;
}
.job-card:hover { border-color: var(--blue); box-shadow: 0 8px 24px rgba(27,111,190,0.1); }
.job-card-title { font-family: var(--font-serif); font-size: 20px; font-weight: 700; color: var(--navy); margin-bottom: var(--sp-m); }
.job-card-desc { font-size: 14px; color: var(--text-grey); line-height: 1.75; margin-bottom: var(--sp-m); }
.job-card-cond { font-size: 12px; color: var(--text-disabled); border-top: 1px solid var(--border); padding-top: var(--sp-m); }

/* ── 選考プロセス ── */
.process-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0;
  margin-top: var(--sp-3xl);
}
.process-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-s);
  min-width: 100px;
}
.process-num {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: var(--navy);
  color: var(--white);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 700;
}
.process-label { font-size: 13px; color: var(--text-grey); letter-spacing: 0.05em; text-align: center; }
.process-arrow {
  font-size: 20px;
  color: var(--blue);
  margin: 0 var(--sp-m);
  padding-bottom: 24px;
}

/* ── 1日の働き方 ── */
.timeline { max-width: 640px; margin: 0 auto; position: relative; }
.timeline::before {
  content: '';
  position: absolute;
  left: 72px; top: 0; bottom: 0;
  width: 1px;
  background: var(--border);
}
.timeline-item {
  display: grid;
  grid-template-columns: 72px 16px 1fr;
  gap: 0 var(--sp-l);
  align-items: flex-start;
  margin-bottom: var(--sp-xl);
}
.timeline-time {
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 700;
  color: var(--navy);
  text-align: right;
  padding-top: 2px;
}
.timeline-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: var(--blue);
  margin-top: 4px;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}
.timeline-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-black);
  padding-bottom: var(--sp-m);
}

/* ── レスポンシブ ── */
@media (max-width: 768px) {
  nav { padding: 0 var(--sp-l); }
  .nav-links, .nav-cta { display: none; }
  .hero { grid-template-columns: 1fr; }
  .hero-left { padding: var(--sp-3xl) var(--sp-l); min-height: 65vh; }
  .hero-right { min-height: 40vw; }
  .container { padding: 0 var(--sp-l); }
  section { padding: var(--sp-3xl) 0; }
  .overview-grid, .biz-detail, .comp-grid, .culture-grid, .workstyle-grid, .iv-card { grid-template-columns: 1fr; gap: var(--sp-l); }
  .biz-detail.reverse { direction: ltr; }
  .section-title { font-size: 24px; }
  .salary-amount { font-size: 40px; }
}
</style>
</head>
<body>

<!-- ナビ -->
<nav>
  <a href="#" class="nav-brand">
    ${prefix ? `<span class="nav-prefix">${prefix}</span>` : ''}
    <span class="nav-name">${shortName}</span>
  </a>
  <ul class="nav-links">
    ${hasOverview ? `<li><a href="#overview">会社概要</a></li>` : ''}
    ${hasBusiness ? `<li><a href="#business">事業紹介</a></li>` : ''}
    ${hasCompensation ? `<li><a href="#compensation">待遇</a></li>` : ''}
    ${hasCulture ? `<li><a href="#culture">カルチャー</a></li>` : ''}
    ${hasWorkstyle ? `<li><a href="#workstyle">働き方</a></li>` : ''}
    ${hasSelection ? `<li><a href="#selection">選考</a></li>` : ''}
  </ul>
  <a href="${e.applyUrl || indeedUrl}" target="_blank" class="nav-cta">応募する</a>
</nav>

<!-- ヒーロー -->
<div class="hero">
  <div class="hero-left">
    <span class="hero-eyebrow">Recruitment</span>
    ${prefix ? `<p class="hero-prefix-text">${prefix}</p>` : ''}
    <h1 class="hero-name">${shortName}</h1>
    <div class="hero-rule"></div>
    ${e.mission ? `<p class="hero-mission">${e.mission}</p>` : ''}
    ${e.missionDesc ? `<p class="hero-desc">${e.missionDesc}</p>` : ''}
  </div>
  <div class="hero-right">
    ${e.photos && e.photos.cover
      ? `<img src="${e.photos.cover}" alt="${cn}のカバー写真">`
      : `<div class="hero-right-empty"></div>`}
  </div>
</div>

<!-- 代表メッセージ -->
${hasMessage ? `
<section id="message" style="background:var(--stone-01)">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow fade-up">Message</span>
      <h2 class="section-title fade-up delay-1">代表メッセージ</h2>
    </div>
    <div class="message-wrap fade-up delay-2">
      <div class="message-body">${e.ceoMessage}</div>
      ${e.ceo ? `<p class="message-sign">代表取締役　${e.ceo}</p>` : ''}
    </div>
  </div>
</section>
` : ''}

<!-- 目指す未来・課題 -->
${hasVision ? `
<section id="vision">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow fade-up">Vision</span>
      <h2 class="section-title fade-up delay-1">目指す未来</h2>
    </div>
    <div class="vision-grid">
      ${e.missionFuture ? `
      <div class="vision-future fade-up">
        <h3>私たちが目指す世界</h3>
        <p>${e.missionFuture}</p>
      </div>` : ''}
      ${challenges.length > 0 ? `
      <div class="vision-challenges">
        ${challenges.map((c,i) => `
        <div class="challenge-item fade-up" style="transition-delay:${0.1+i*0.1}s">
          <span style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:var(--blue);display:block;margin-bottom:6px;">CHALLENGE ${String(i+1).padStart(2,'0')}</span>
          ${c}
        </div>`).join('')}
      </div>` : ''}
    </div>
  </div>
</section>
` : ''}

<!-- 募集職種 -->
${hasJobTypes ? `
<section id="jobs" style="background:var(--stone-01)">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow fade-up">Positions</span>
      <h2 class="section-title fade-up delay-1">募集職種</h2>
    </div>
    <div class="job-grid">
      ${jobTypes.map((j,i) => `
      <div class="job-card fade-up" style="transition-delay:${i*0.1}s">
        <div class="job-card-title">${j.title}</div>
        ${j.desc ? `<div class="job-card-desc">${j.desc}</div>` : ''}
        ${j.conditions ? `<div class="job-card-cond">${j.conditions}</div>` : ''}
      </div>`).join('')}
    </div>
  </div>
</section>
` : ''}

<!-- 会社概要 -->
${hasOverview ? `
<section class="overview" id="overview">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow fade-up">Company</span>
      <h2 class="section-title fade-up delay-1">会社概要</h2>
    </div>
    ${e.photos && e.photos.company ? `
    <div class="overview-grid">
      <table class="overview-table fade-up">
        <tbody>
          ${[
            ['社名', e.companyName],
            ['所在地', e.address],
            ['代表者', e.ceo],
            ['設立', e.founded],
            ['売上高', e.sales],
            ['事業内容', e.business],
          ].filter(([,v]) => v && v.trim()).map(([k,v]) =>
            `<tr><td>${k}</td><td>${v}</td></tr>`
          ).join('')}
          ${e.phoneNumber && e.phoneNumber.trim() ? `<tr><td>電話番号</td><td>${e.phoneNumber}</td></tr>` : ''}
          ${e.companyNote && e.companyNote.trim() ? `<tr><td>特記事項</td><td style="color:var(--text-black);font-size:0.9rem;">${e.companyNote}</td></tr>` : ''}
        </tbody>
      </table>
      <div class="overview-photo fade-up delay-1">
        <img src="${e.photos.company}" alt="${cn}の写真">
      </div>
    </div>` : `
    <table class="overview-table fade-up" style="max-width:560px">
      <tbody>
        ${[
          ['社名', e.companyName],
          ['所在地', e.address],
          ['代表者', e.ceo],
          ['設立', e.founded],
          ['売上高', e.sales],
          ['事業内容', e.business],
        ].filter(([,v]) => v && v.trim()).map(([k,v]) =>
          `<tr><td>${k}</td><td>${v}</td></tr>`
        ).join('')}
        ${e.phoneNumber && e.phoneNumber.trim() ? `<tr><td>電話番号</td><td>${e.phoneNumber}</td></tr>` : ''}
        ${e.companyNote && e.companyNote.trim() ? `<tr><td>特記事項</td><td style="color:var(--text-black);font-size:0.9rem;">${e.companyNote}</td></tr>` : ''}
      </tbody>
    </table>`}
  </div>
</section>
` : ''}

<!-- 事業紹介 -->
${hasBusiness ? `
<section id="business">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow fade-up">Business</span>
      <h2 class="section-title fade-up delay-1">事業紹介</h2>
    </div>
    ${e.bizHeadline ? `<div class="biz-headline fade-up">${e.bizHeadline}</div>` : ''}
    ${services.length > 0 ? `
    <div class="services-grid">
      ${services.map((s, i) => `
      <div class="service-card fade-up" style="transition-delay:${i*0.08}s">
        <p class="service-num">SERVICE ${String(i+1).padStart(2,'0')}</p>
        <h3 class="service-title">${s.title}</h3>
        <p class="service-desc">${s.desc}</p>
      </div>`).join('')}
    </div>` : ''}
    ${e.biz1Title && e.biz1Body ? `
    ${e.photos && e.photos.biz1 ? `
    <div class="biz-detail fade-up">
      <div>
        <h3 class="biz-title">${e.biz1Title}</h3>
        <p class="biz-text">${e.biz1Body}</p>
      </div>
      <div class="biz-photo">
        <img src="${e.photos.biz1}" alt="${e.biz1Title}">
      </div>
    </div>` : `
    <div class="fade-up" style="max-width:720px;margin-bottom:var(--sp-4xl)">
      <h3 class="biz-title">${e.biz1Title}</h3>
      <p class="biz-text">${e.biz1Body}</p>
    </div>`}` : ''}
    ${e.biz2Title && e.biz2Body ? `
    ${e.photos && e.photos.biz2 ? `
    <div class="biz-detail reverse fade-up">
      <div>
        <h3 class="biz-title">${e.biz2Title}</h3>
        <p class="biz-text">${e.biz2Body}</p>
      </div>
      <div class="biz-photo">
        <img src="${e.photos.biz2}" alt="${e.biz2Title}">
      </div>
    </div>` : `
    <div class="fade-up" style="max-width:720px;margin-bottom:var(--sp-4xl)">
      <h3 class="biz-title">${e.biz2Title}</h3>
      <p class="biz-text">${e.biz2Body}</p>
    </div>`}` : ''}
  </div>
</section>
` : ''}

<!-- 報酬・評価 -->
${(sMin && sMax) || vc.length >= 1 ? `
<section class="compensation" id="compensation">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow fade-up">Compensation</span>
      <h2 class="section-title fade-up delay-1">評価・報酬制度</h2>
    </div>
    <div class="comp-grid">
      ${sMin && sMax ? `
      <div class="salary-card fade-up">
        <span class="salary-label">${stl}</span>
        <div class="salary-amount">${sMin}<span style="font-size:28px">〜</span>${sMax}</div>
        <div class="salary-unit">${sUnit}</div>
        <p class="salary-note">${e.salaryNote || '昇給あり'}<br>※詳細は面接時にご確認ください</p>
      </div>` : '<div></div>'}
      <div class="fade-up delay-1">
        ${vc.length >= 1 ? `
        <p class="comp-right-title">キャリアパス</p>
        <ul class="career-list">
          ${vc.map(s => `
          <li class="career-item">
            <div class="career-dot"></div>
            <div>
              <div class="career-name">${s.title}</div>
              ${s.desc ? `<div class="career-info">${s.desc}</div>` : ''}
              ${s.salary ? `<div class="career-sal">${/^\d+$/.test(s.salary.trim()) ? s.salary + '万円' : s.salary}</div>` : ''}
            </div>
          </li>`).join('')}
        </ul>` : ''}
      </div>
    </div>
  </div>
</section>` : ''}

<!-- カルチャー -->
${hasCulture ? `
<section id="culture">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow fade-up">Culture</span>
      <h2 class="section-title fade-up delay-1">カルチャー</h2>
    </div>
    ${e.photos && e.photos.culture ? `
    <div class="culture-grid">
      <div class="fade-up">
        ${(e.cultureVal1 || e.cultureVal2) ? `
        <div class="culture-tags">
          ${e.cultureVal1 ? `<span class="culture-tag">${e.cultureVal1}</span>` : ''}
          ${e.cultureVal2 ? `<span class="culture-tag">${e.cultureVal2}</span>` : ''}
        </div>` : ''}
        ${e.cultureDesc ? `<p class="culture-text">${e.cultureDesc}</p>` : ''}
      </div>
      <div class="culture-photo fade-up delay-1">
        <img src="${e.photos.culture}" alt="カルチャー写真">
      </div>
    </div>` : `
    <div class="fade-up" style="max-width:720px">
      ${(e.cultureVal1 || e.cultureVal2) ? `
      <div class="culture-tags">
        ${e.cultureVal1 ? `<span class="culture-tag">${e.cultureVal1}</span>` : ''}
        ${e.cultureVal2 ? `<span class="culture-tag">${e.cultureVal2}</span>` : ''}
      </div>` : ''}
      ${e.cultureDesc ? `<p class="culture-text" style="font-size:16px;line-height:1.85">${e.cultureDesc}</p>` : ''}
    </div>`}
  </div>
</section>
` : ''}

<!-- 求める人物像 -->
${wantedList.length > 0 ? `
<section class="wanted" id="wanted">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow fade-up">Who We Need</span>
      <h2 class="section-title fade-up delay-1">こんな方と働きたい</h2>
    </div>
    <div class="wanted-grid">
      ${wantedList.map((v, i) => `
      <div class="wanted-item fade-up" style="transition-delay:${i*0.06}s">
        <span class="wanted-num">${String(i+1).padStart(2,'0')}</span>${v}
      </div>`).join('')}
    </div>
  </div>
</section>` : ''}

<!-- 社員の声 -->
${hasIV ? `
<section id="interview">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow fade-up">Voice</span>
      <h2 class="section-title fade-up delay-1">社員の声</h2>
    </div>
    ${e.photos && e.photos.member ? `
    <div class="iv-card fade-up">
      <div>
        <div class="iv-photo">
          <img src="${e.photos.member}" alt="${iv.person || '社員'}の写真">
        </div>
        ${iv.person ? `<p class="iv-person">${iv.person}</p>` : ''}
      </div>
      <div>
        ${[[iv.q1,iv.a1],[iv.q2,iv.a2],[iv.q3,iv.a3]].filter(([q])=>q&&q.trim()).map(([q,a])=>`
        <div class="qa-item">
          <div class="qa-q"><span class="qa-badge">Q</span>${q}</div>
          <p class="qa-a">${a||''}</p>
        </div>`).join('')}
      </div>
    </div>` : `
    <div class="fade-up" style="background:var(--stone-01);border-radius:8px;padding:var(--sp-3xl);border:1px solid var(--border);max-width:720px">
      ${iv.person ? `<p style="font-size:13px;font-weight:700;color:var(--text-grey);margin-bottom:var(--sp-l);letter-spacing:0.05em">${iv.person}</p>` : ''}
      ${[[iv.q1,iv.a1],[iv.q2,iv.a2],[iv.q3,iv.a3]].filter(([q])=>q&&q.trim()).map(([q,a])=>`
      <div class="qa-item">
        <div class="qa-q"><span class="qa-badge">Q</span>${q}</div>
        <p class="qa-a">${a||''}</p>
      </div>`).join('')}
    </div>`}
  </div>
</section>` : ''}

<!-- 働き方 -->
${hasWorkstyle ? `
<section id="workstyle">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow fade-up">Work Style</span>
      <h2 class="section-title fade-up delay-1">働き方・制度</h2>
    </div>
    <div class="workstyle-grid">
      ${[
        ['就業時間', e.workHours],
        ['勤務地', e.workLocation],
        ['休暇・休日', holidays.join('　')],
      ].filter(([,v])=>v&&v.trim()).map(([k,v],i)=>`
      <div class="ws-item fade-up" style="transition-delay:${i*0.1}s">
        <h3>${k}</h3>
        <p>${v}</p>
      </div>`).join('')}
    </div>
    ${benefits.length > 0 ? `
    <div class="benefits-wrap fade-up">
      <h3>福利厚生</h3>
      <div class="benefits-grid">
        ${benefits.map(b=>`<div class="benefit-item">${b}</div>`).join('')}
      </div>
    </div>` : ''}
  </div>
</section>
` : ''}

<!-- 数字で見る会社 -->
${hasNumbers ? `
<section id="numbers" style="background:var(--stone-01)">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow fade-up">Numbers</span>
      <h2 class="section-title fade-up delay-1">数字で見る${shortName}</h2>
    </div>
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:48px;margin-top:48px">
      ${numbers.map((n,i) => `
      <div class="fade-up" style="text-align:center;transition-delay:${i*0.1}s;min-width:120px">
        <div style="font-family:var(--font-serif);font-size:64px;font-weight:700;color:var(--navy);line-height:1">${String(n.value).replace(/[^0-9.]/g,'')}</div>
        <div style="font-size:15px;color:var(--text-grey);margin-top:4px">${n.unit}</div>
        <div style="font-size:13px;color:var(--text-grey);margin-top:8px;letter-spacing:0.05em">${n.label}</div>
      </div>`).join('')}
    </div>
  </div>
</section>` : ''}

<!-- FAQ -->
${hasFaq ? `
<section id="faq">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow fade-up">FAQ</span>
      <h2 class="section-title fade-up delay-1">よくある質問</h2>
    </div>
    <div style="max-width:720px;margin-top:48px">
      ${faq.map((f,i) => `
      <div class="fade-up" style="border-bottom:1px solid var(--border);padding:24px 0;transition-delay:${i*0.06}s">
        <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:12px">
          <span style="background:var(--navy);color:#fff;font-size:12px;font-weight:700;padding:2px 8px;border-radius:4px;flex-shrink:0">Q</span>
          <p style="font-weight:700;font-size:15px;margin:0">${f.q}</p>
        </div>
        <div style="display:flex;gap:16px;align-items:flex-start">
          <span style="background:var(--blue);color:#fff;font-size:12px;font-weight:700;padding:2px 8px;border-radius:4px;flex-shrink:0">A</span>
          <p style="font-size:15px;color:var(--text-grey);margin:0;line-height:1.7">${f.a}</p>
        </div>
      </div>`).join('')}
    </div>
  </div>
</section>` : ''}

<!-- 1日の働き方 -->
${hasDaySchedule ? `
<section id="day" style="background:var(--stone-01)">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow fade-up">Daily</span>
      <h2 class="section-title fade-up delay-1">1日の流れ</h2>
    </div>
    <div class="timeline">
      ${daySchedule.map((d,i) => `
      <div class="timeline-item fade-up" style="transition-delay:${i*0.08}s">
        <div class="timeline-time">${d.time}</div>
        <div class="timeline-dot"></div>
        <div class="timeline-content">${d.activity}</div>
      </div>`).join('')}
    </div>
  </div>
</section>
` : ''}

<!-- 選考プロセス -->
${hasSelection ? `
<section id="selection">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow fade-up">Process</span>
      <h2 class="section-title fade-up delay-1">選考プロセス</h2>
    </div>
    <div class="process-flow">
      ${selectionProcess.map((s,i) => `
        <div class="process-step fade-up" style="transition-delay:${i*0.1}s">
          <div class="process-num">${i+1}</div>
          <div class="process-label">${s}</div>
        </div>
        ${i < selectionProcess.length-1 ? '<div class="process-arrow">›</div>' : ''}
      `).join('')}
    </div>
    <p style="text-align:center;font-size:13px;color:var(--text-grey);margin-top:var(--sp-3xl)">※内定後も不安な点はいつでもご相談ください</p>
  </div>
</section>
` : ''}

<!-- アクセス -->
${mapUrl ? `
<section id="access" style="background:var(--stone-01)">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow fade-up">Access</span>
      <h2 class="section-title fade-up delay-1">アクセス</h2>
    </div>
    <p class="fade-up" style="color:var(--text-grey);margin-bottom:24px">${mapLabel}</p>
    <div class="fade-up" style="border-radius:12px;overflow:hidden;height:360px">
      <iframe src="${mapUrl}" width="100%" height="100%" style="border:0" allowfullscreen loading="lazy"></iframe>
    </div>
  </div>
</section>` : ''}

<!-- SNS -->
${hasSns ? `
<section id="sns">
  <div class="container" style="text-align:center">
    <div class="section-header">
      <span class="section-eyebrow fade-up">Social</span>
      <h2 class="section-title fade-up delay-1">SNS・公式アカウント</h2>
    </div>
    <div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin-top:40px">
      ${e.sns.instagram ? `<a href="${e.sns.instagram}" target="_blank" class="fade-up" style="display:flex;align-items:center;gap:8px;padding:12px 24px;border:1.5px solid var(--border);border-radius:8px;text-decoration:none;color:var(--text-black);font-size:14px;font-weight:700">Instagram</a>` : ''}
      ${e.sns.twitter ? `<a href="${e.sns.twitter}" target="_blank" class="fade-up" style="display:flex;align-items:center;gap:8px;padding:12px 24px;border:1.5px solid var(--border);border-radius:8px;text-decoration:none;color:var(--text-black);font-size:14px;font-weight:700">X（旧Twitter）</a>` : ''}
      ${e.sns.youtube ? `<a href="${e.sns.youtube}" target="_blank" class="fade-up" style="display:flex;align-items:center;gap:8px;padding:12px 24px;border:1.5px solid var(--border);border-radius:8px;text-decoration:none;color:var(--text-black);font-size:14px;font-weight:700">YouTube</a>` : ''}
      ${e.sns.line ? `<a href="${e.sns.line}" target="_blank" class="fade-up" style="display:flex;align-items:center;gap:8px;padding:12px 24px;border:1.5px solid var(--border);border-radius:8px;text-decoration:none;color:var(--text-black);font-size:14px;font-weight:700">LINE公式</a>` : ''}
    </div>
  </div>
</section>` : ''}

<!-- CTA -->
<section class="cta" id="cta">
  <h2 class="fade-up">${cn}で、<br>一緒に働きませんか？</h2>
  <p class="fade-up delay-1">まずはカジュアルにお話しましょう。</p>
<a href="${e.applyUrl || indeedUrl}" target="_blank" class="cta-btn fade-up delay-2">応募する</a>
  ${e.applyEmail ? `<a href="mailto:${e.applyEmail}" class="cta-btn fade-up delay-3" style="background:transparent;border:1.5px solid rgba(255,255,255,0.4);margin-left:12px">メールで問い合わせ</a>` : ''}
</section>

<footer>
  <p>© ${cn} All Rights Reserved. | 採用特設サイトジェネレーター にて作成</p>
</footer>

<script>
const obs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.08 });
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
document.querySelectorAll('.fade-left').forEach(el => obs.observe(el));

// セクションタイトル下線アニメ
const lineObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.3 });
document.querySelectorAll('.section-title-line').forEach(el => lineObs.observe(el));

// カウントアップアニメーション
function animateCount(el) {
  const target = parseFloat(el.dataset.target);
  const isInt = Number.isInteger(target);
  const duration = 1800;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = target * eased;
    el.textContent = isInt ? Math.floor(current).toLocaleString() : current.toFixed(1);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}
const countObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting) { animateCount(e.target); countObs.unobserve(e.target); } });
}, { threshold: 0.5 });
document.querySelectorAll('.count-up').forEach(el => countObs.observe(el));

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    e.preventDefault();
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
</script>
</body>
</html>`;

  return res.status(200).json({ html });
};
