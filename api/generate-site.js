module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { data, password } = req.body;
  if (password !== process.env.APP_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const e = data;
  const cn = e.companyName || '会社名';
  const prefixes = ['株式会社','合同会社','有限会社','一般社団法人','特定非営利活動法人','NPO法人'];
  const prefix = prefixes.find(p => cn.startsWith(p)) || '';
  const shortName = prefix ? cn.replace(prefix, '').trim() : cn;
  const services = (e.services || []).filter(s => s && s.title && s.title.trim());
  const wantedList = (e.wantedList || []).filter(v => v && v.trim());
  const benefits = (e.benefits || []).filter(b => b && b.trim());
  const holidays = (e.holidays || []).filter(h => h && h.trim());
  const vc = (e.careerPath || []).filter(s => s && s.title && s.title.trim());
  const vf = (e.salaryFactors || []).filter(f => f && f.name && f.name.trim() && f.desc && f.desc.trim());
  const isHourly = e.salaryUnit === '時給' || e.salaryUnit === '日給';
  const sUnit = isHourly ? '円' : '万円';
  const stl = isHourly ? (e.salaryUnit + 'レンジ') : e.salaryUnit === '年俸' ? '年俸レンジ' : '月給レンジ';
  const sMin = parseInt(e.salaryMin) || 0;
  const sMax = parseInt(e.salaryMax) || 0;
  const iv = e.interview || {};
  const hasIV = (iv.q1 && iv.q1.trim()) || (iv.q2 && iv.q2.trim()) || (iv.q3 && iv.q3.trim());
  const stats = (e.stats || []).filter(s => s && s.num && s.label);
  const faq = (e.faq || []).filter(f => f && f.q && f.q.trim());
  const daily = (e.daily || []).filter(d => d && d.time && d.task);
  const process_ = (e.selectionProcess || []).filter(p => p && p.trim());
  const indeedUrl = e.indeedUrl || e.hpUrl || '#';
  const photos = e.photos || {};
  const hasPh = id => !!(photos[id] && typeof photos[id] === 'string' && photos[id].length > 100);

  // 写真なし時のグラデーション背景（セクションごとに変える）
  const gradients = [
    'linear-gradient(135deg,#0f1f3d 0%,#1a3a6b 100%)',
    'linear-gradient(135deg,#1a2f52 0%,#2d5096 100%)',
    'linear-gradient(135deg,#111827 0%,#1e3a5f 100%)',
    'linear-gradient(135deg,#0f2340 0%,#1b4080 100%)',
  ];

  // 写真なし時のスタイリッシュなプレースホルダー
  const placeholder = (label, idx=0, aspect='4/3') => `
    <div style="aspect-ratio:${aspect};background:${gradients[idx%gradients.length]};border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;overflow:hidden;position:relative">
      <div style="position:absolute;inset:0;background:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><defs><pattern id=%22g%22 width=%2220%22 height=%2220%22 patternUnits=%22userSpaceOnUse%22><circle cx=%2210%22 cy=%2210%22 r=%221%22 fill=%22rgba(255,255,255,0.06)%22/></pattern></defs><rect width=%22100%25%22 height=%22100%25%22 fill=%22url(%23g)%22/></svg>');opacity:0.8"></div>
      <div style="position:relative;font-family:'Noto Serif JP',serif;font-size:clamp(16px,2vw,24px);color:rgba(255,255,255,0.9);font-weight:700;letter-spacing:0;text-align:center;padding:0 20px;line-height:1.4">${shortName}</div>
      <div style="position:relative;font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:0.15em;text-transform:uppercase">${label}</div>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${cn} 採用情報</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;600;700&family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
@font-face{font-family:AdjYG;font-weight:400;src:local("Yu Gothic Medium"),local("YuGothic-Medium")}
@font-face{font-family:AdjYG;font-weight:700;src:local("Yu Gothic Bold"),local("YuGothic-Bold")}
:root{
  --ink:#111110;--ink2:#3a3935;--muted:#7a7772;
  --warm:#f7f6f4;--warm2:#eeece9;--line:#dddbd7;--white:#ffffff;
  --navy:#0f1f3d;--navy2:#1a2f52;--blue:#1a5fb4;--blue2:#3d7dd8;--blue-pale:#e8f0fc;
  --serif:"Noto Serif JP",AdjYG,"Yu Gothic",YuGothic,serif;
  --sans:"Noto Sans JP",AdjYG,"Yu Gothic",YuGothic,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--sans);color:var(--ink);background:var(--white);line-height:1.75;letter-spacing:0.03em;overflow-x:hidden;word-break:break-word}

/* NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:100;height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.nav-logo{text-decoration:none;display:flex;flex-direction:column}
.nav-pre{font-size:9px;color:var(--muted);letter-spacing:0.1em;line-height:1}
.nav-name{font-family:var(--serif);font-size:17px;font-weight:700;color:var(--navy);line-height:1.2;letter-spacing:0}
.nav-links{display:flex;gap:28px;list-style:none}
.nav-links a{font-size:12px;color:var(--muted);text-decoration:none;letter-spacing:0.05em;transition:color .2s}
.nav-links a:hover{color:var(--blue)}
.nav-cta{background:var(--navy);color:var(--white);padding:9px 22px;border-radius:5px;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.05em;transition:background .2s}
.nav-cta:hover{background:var(--blue)}

/* HERO */
.hero{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;padding-top:60px}
.hero-l{background:var(--navy);padding:72px 56px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden}
.hero-l::before{content:'';position:absolute;bottom:-120px;right:-80px;width:320px;height:320px;border-radius:50%;background:rgba(58,125,216,0.08)}
.hero-eyebrow{font-size:9px;font-weight:700;color:var(--blue2);letter-spacing:.25em;text-transform:uppercase;margin-bottom:20px}
.hero-pre{font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:0.05em;margin-bottom:2px;line-height:1}
.hero-name{font-family:var(--serif);font-size:clamp(26px,3.5vw,46px);color:var(--white);font-weight:700;line-height:1.2;letter-spacing:0;margin-bottom:28px}
.hero-rule{width:36px;height:2px;background:var(--blue2);margin-bottom:22px}
.hero-mission{font-family:var(--serif);font-size:16px;color:rgba(255,255,255,0.9);line-height:1.8;letter-spacing:0.02em;margin-bottom:14px;font-weight:400}
.hero-desc{font-size:12.5px;color:rgba(255,255,255,0.45);line-height:1.8;max-width:380px}
/* hero右：写真あり */
.hero-r{position:relative;overflow:hidden}
.hero-r img{width:100%;height:100%;object-fit:cover;display:block}
/* hero右：写真なし → グラデーション＋テキスト */
.hero-r-empty{width:100%;height:100%;background:linear-gradient(160deg,var(--navy2) 0%,#0a1628 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px;position:relative;overflow:hidden}
.hero-r-empty::before{content:'';position:absolute;inset:0;background:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><defs><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><circle cx=%2220%22 cy=%2220%22 r=%221.5%22 fill=%22rgba(255,255,255,0.04)%22/></pattern></defs><rect width=%22100%25%22 height=%22100%25%22 fill=%22url(%23p)%22/></svg>')}
.hero-r-tagline{position:relative;font-family:var(--serif);font-size:clamp(18px,2.5vw,32px);color:rgba(255,255,255,0.85);font-weight:600;text-align:center;line-height:1.5;letter-spacing:0.01em}
.hero-r-sub{position:relative;font-size:12px;color:rgba(255,255,255,0.25);margin-top:24px;letter-spacing:0.15em;text-transform:uppercase}

/* SECTION */
section{padding:80px 0}
.c{max-width:1060px;margin:0 auto;padding:0 40px}
.eyebrow{font-size:9px;font-weight:700;color:var(--blue);letter-spacing:.25em;text-transform:uppercase;margin-bottom:8px;display:block}
.sec-title{font-family:var(--serif);font-size:30px;font-weight:700;color:var(--navy);line-height:1.25;letter-spacing:0;margin-bottom:10px}
.sec-lead{font-size:14px;color:var(--muted);line-height:1.8;max-width:500px}

/* MESSAGE */
.message{background:var(--ink);padding:80px 0}
.message .eyebrow{color:var(--blue2)}
/* 写真あり：2カラム */
.message-inner{display:grid;grid-template-columns:280px 1fr;gap:56px;align-items:center;margin-top:40px}
.message-photo{border-radius:6px;overflow:hidden;aspect-ratio:3/4;background:var(--navy2)}
.message-photo img{width:100%;height:100%;object-fit:cover;display:block}
/* 写真なし：1カラム */
.message-inner.no-photo{grid-template-columns:1fr;max-width:720px}
.message-quote{font-family:var(--serif);font-size:20px;color:var(--white);line-height:1.75;letter-spacing:0.01em;font-weight:400;margin-bottom:24px;padding-left:20px;border-left:2px solid var(--blue2)}
.message-text{font-size:13.5px;color:rgba(255,255,255,0.5);line-height:1.9;letter-spacing:0.03em}
.message-name{font-size:12px;color:rgba(255,255,255,0.3);margin-top:20px;letter-spacing:0.05em}

/* VISION */
.vision{background:var(--warm);padding:80px 0}
.vision-inner{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-top:40px;border:1px solid var(--line);border-radius:8px;overflow:hidden}
.vision-main{background:var(--navy);padding:48px 40px;display:flex;flex-direction:column;justify-content:center}
.vision-main h3{font-family:var(--serif);font-size:20px;color:var(--white);font-weight:600;line-height:1.4;margin-bottom:16px;letter-spacing:0}
.vision-main p{font-size:13px;color:rgba(255,255,255,0.55);line-height:1.85;letter-spacing:0.03em}
.vision-challenges{background:var(--white);display:flex;flex-direction:column}
.challenge-item{padding:24px 32px;border-bottom:1px solid var(--line);display:flex;gap:16px;align-items:flex-start}
.challenge-item:last-child{border-bottom:none}
.ch-num{font-size:9px;font-weight:700;color:var(--blue);letter-spacing:.15em;white-space:nowrap;padding-top:3px}
.ch-text{font-size:13.5px;color:var(--ink2);line-height:1.7;letter-spacing:0.03em}

/* POSITIONS */
.positions{background:var(--white);padding:72px 0}
.pos-card{background:var(--navy);border-radius:8px;padding:40px 48px;display:grid;grid-template-columns:1fr auto;gap:40px;align-items:center;margin-top:32px}
.pos-type{font-size:10px;font-weight:700;color:var(--blue2);letter-spacing:.2em;text-transform:uppercase;margin-bottom:8px}
.pos-title{font-family:var(--serif);font-size:24px;color:var(--white);font-weight:700;line-height:1.3;letter-spacing:0;margin-bottom:12px}
.pos-meta{font-size:13px;color:rgba(255,255,255,0.5);line-height:1.8;letter-spacing:0.03em}
.pos-cta{background:var(--blue);color:var(--white);padding:14px 32px;border-radius:5px;font-size:14px;font-weight:700;text-decoration:none;white-space:nowrap;transition:background .2s;flex-shrink:0}
.pos-cta:hover{background:var(--blue2)}

/* OVERVIEW */
.overview{background:var(--warm);padding:80px 0}
/* 写真あり：2カラム */
.overview-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start;margin-top:40px}
/* 写真なし：テーブルを中央に大きく */
.overview-grid.no-photo{grid-template-columns:1fr;max-width:680px}
.overview-table{width:100%;border-collapse:collapse}
.overview-table tr{border-bottom:1px solid var(--line)}
.overview-table td{padding:14px 0;font-size:13.5px;vertical-align:top;line-height:1.7;letter-spacing:0.03em}
.overview-table td:first-child{color:var(--muted);width:80px;font-size:11px;padding-right:16px;white-space:nowrap}
.overview-table td:last-child{color:var(--ink);font-weight:500}
.overview-photo{border-radius:8px;overflow:hidden;aspect-ratio:4/3}
.overview-photo img{width:100%;height:100%;object-fit:cover;display:block}

/* BUSINESS */
.business{background:var(--white);padding:80px 0}
.biz-headline{font-family:var(--serif);font-size:19px;font-weight:600;color:var(--navy);text-align:center;line-height:1.5;letter-spacing:0;margin:32px 0 48px;padding:28px 40px;background:var(--blue-pale);border-radius:6px}
.services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:8px;overflow:hidden;margin-bottom:64px}
.svc-card{background:var(--white);padding:32px 28px}
.svc-num{font-size:9px;font-weight:700;color:var(--blue);letter-spacing:.18em;margin-bottom:10px}
.svc-title{font-family:var(--serif);font-size:16px;font-weight:700;color:var(--navy);line-height:1.4;letter-spacing:0;margin-bottom:10px}
.svc-desc{font-size:12.5px;color:var(--muted);line-height:1.78;letter-spacing:0.03em}
/* 写真あり：2カラム */
.biz-detail{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;padding:48px 0;border-top:1px solid var(--line)}
/* 写真なし：1カラム */
.biz-detail.no-photo{grid-template-columns:1fr;max-width:700px}
.biz-detail.rev{direction:rtl}.biz-detail.rev>*{direction:ltr}
.biz-detail.rev.no-photo{direction:ltr}
.biz-photo{border-radius:8px;overflow:hidden;aspect-ratio:4/3}
.biz-photo img{width:100%;height:100%;object-fit:cover;display:block}
.biz-text-title{font-family:var(--serif);font-size:22px;font-weight:700;color:var(--navy);line-height:1.4;letter-spacing:0;margin-bottom:16px}
.biz-text-body{font-size:13.5px;color:var(--muted);line-height:1.85;letter-spacing:0.03em}

/* NUMBERS */
.numbers{background:var(--navy);padding:72px 0}
.numbers .eyebrow{color:var(--blue2)}
.numbers .sec-title{color:var(--white)}
.numbers-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.08);border-radius:8px;overflow:hidden;margin-top:40px}
.num-item{padding:36px 28px;background:var(--navy);text-align:center}
.num-val{font-family:var(--serif);font-size:52px;font-weight:700;color:var(--white);line-height:1;margin-bottom:4px}
.num-unit{font-size:16px;color:rgba(255,255,255,0.5)}
.num-label{font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:0.08em;margin-top:10px}

/* COMPENSATION */
.compensation{background:var(--warm);padding:80px 0}
.comp-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:40px}
.salary-card{background:var(--navy);border-radius:8px;padding:40px;text-align:center}
.salary-lbl{font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:.15em;margin-bottom:16px;display:block}
.salary-amt{font-family:var(--serif);font-size:56px;font-weight:700;color:var(--white);line-height:1}
.salary-unit{font-size:18px;color:rgba(255,255,255,0.55)}
.salary-note{font-size:11.5px;color:rgba(255,255,255,0.3);margin-top:16px;line-height:1.75;letter-spacing:0.03em}
.comp-right{background:var(--white);border-radius:8px;padding:32px;border:1px solid var(--line)}
.comp-sub{font-family:var(--serif);font-size:16px;font-weight:700;color:var(--navy);letter-spacing:0;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--line)}
.factor-row{display:grid;grid-template-columns:72px 1fr;gap:12px;padding:12px 0;border-bottom:1px solid var(--warm);font-size:13px}
.factor-tag{background:var(--blue-pale);color:var(--blue);font-weight:700;border-radius:4px;padding:4px 6px;font-size:10px;letter-spacing:0.05em;text-align:center;display:flex;align-items:center;justify-content:center}
.factor-desc{color:var(--ink2);line-height:1.7;letter-spacing:0.03em;display:flex;align-items:center}
.career-list{list-style:none}
.career-item{display:flex;gap:16px;padding:14px 0;border-bottom:1px solid var(--warm)}
.career-item:last-child{border-bottom:none}
.c-dot{width:10px;height:10px;border-radius:50%;background:var(--blue);margin-top:5px;flex-shrink:0}
.c-name{font-size:14px;font-weight:700;color:var(--navy);line-height:1.4;letter-spacing:0}
.c-desc{font-size:11.5px;color:var(--muted);margin-top:2px;letter-spacing:0.03em}
.c-sal{font-size:12px;color:var(--blue);font-weight:500;margin-top:3px}

/* CULTURE */
.culture{background:var(--white);padding:80px 0}
/* 写真あり：2カラム */
.culture-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;margin-top:40px}
/* 写真なし：グラデーション背景の全幅 */
.culture-no-photo{margin-top:40px;border-radius:8px;overflow:hidden;background:linear-gradient(135deg,var(--navy) 0%,var(--navy2) 100%);padding:56px 64px;position:relative}
.culture-no-photo::before{content:'';position:absolute;inset:0;background:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><defs><pattern id=%22g%22 width=%2230%22 height=%2230%22 patternUnits=%22userSpaceOnUse%22><circle cx=%2215%22 cy=%2215%22 r=%221%22 fill=%22rgba(255,255,255,0.04)%22/></pattern></defs><rect width=%22100%25%22 height=%22100%25%22 fill=%22url(%23g)%22/></svg>')}
.culture-inner-np{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start}
.culture-photo{border-radius:8px;overflow:hidden;aspect-ratio:4/3}
.culture-photo img{width:100%;height:100%;object-fit:cover;display:block}
.culture-tags{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.culture-tag{background:var(--navy);color:var(--white);padding:5px 14px;border-radius:3px;font-size:12px;font-weight:700;letter-spacing:0.05em}
.culture-tag.light{background:rgba(255,255,255,0.15);color:var(--white)}
.culture-text{font-size:13.5px;color:var(--muted);line-height:1.88;letter-spacing:0.03em}
.culture-text.light{color:rgba(255,255,255,0.7)}

/* WANTED */
.wanted{background:var(--warm);padding:72px 0}
.wanted-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:32px}
.wanted-item{background:var(--white);border:1px solid var(--line);border-left:3px solid var(--blue);border-radius:4px;padding:16px 20px;display:flex;align-items:center;gap:14px;font-size:13.5px;font-weight:500;color:var(--ink);letter-spacing:0.03em;line-height:1.5}
.w-num{font-size:10px;font-weight:700;color:var(--blue);min-width:22px;letter-spacing:0.05em}

/* INTERVIEW */
.interview{background:var(--white);padding:80px 0}
/* 写真あり */
.iv-card{background:var(--warm);border-radius:8px;padding:40px;display:grid;grid-template-columns:160px 1fr;gap:40px;align-items:start;border:1px solid var(--line);margin-top:32px}
/* 写真なし：1カラム */
.iv-card.no-photo{grid-template-columns:1fr}
.iv-photo{border-radius:6px;overflow:hidden;aspect-ratio:3/4;background:var(--warm2)}
.iv-photo img{width:100%;height:100%;object-fit:cover;display:block}
.iv-name{font-size:11px;color:var(--muted);text-align:center;margin-top:8px;letter-spacing:0.05em;line-height:1.5}
.iv-name.inline{text-align:left;margin-top:0;margin-bottom:20px;font-size:12px;color:var(--muted);padding-bottom:16px;border-bottom:1px solid var(--line)}
.qa-item{margin-bottom:20px}
.qa-q{font-size:13.5px;font-weight:700;color:var(--blue);margin-bottom:7px;display:flex;align-items:flex-start;gap:8px;line-height:1.5;letter-spacing:0.03em}
.q-badge{background:var(--blue);color:var(--white);width:18px;height:18px;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;margin-top:2px}
.qa-a{font-size:13px;color:var(--muted);line-height:1.85;letter-spacing:0.03em;padding-left:26px}

/* WORKSTYLE */
.workstyle{background:var(--warm);padding:72px 0}
.ws-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:32px}
.ws-item{background:var(--white);border:1px solid var(--line);border-radius:6px;padding:24px 28px}
.ws-label{font-size:10px;font-weight:700;color:var(--blue);letter-spacing:.18em;text-transform:uppercase;margin-bottom:8px}
.ws-val{font-size:13.5px;color:var(--ink2);line-height:1.78;letter-spacing:0.03em}
.benefits-wrap{margin-top:32px}
.benefits-title{font-family:var(--serif);font-size:18px;font-weight:700;color:var(--navy);margin-bottom:16px;letter-spacing:0}
.benefits-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}
.benefit-item{background:var(--white);border:1px solid var(--line);border-radius:4px;padding:9px 14px;font-size:12.5px;color:var(--navy);font-weight:500;display:flex;align-items:center;gap:8px;letter-spacing:0.03em}
.benefit-item::before{content:'✓';color:var(--blue);font-weight:700;flex-shrink:0}

/* FAQ */
.faq{background:var(--white);padding:72px 0}
.faq-list{margin-top:32px;display:flex;flex-direction:column;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.faq-item{background:var(--white)}
details summary{padding:20px 28px;font-size:14px;font-weight:600;color:var(--ink);cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;letter-spacing:0.03em;line-height:1.5}
details summary::-webkit-details-marker{display:none}
details summary::after{content:'+';font-size:20px;color:var(--blue);font-weight:300;flex-shrink:0;margin-left:16px}
details[open] summary::after{content:'−'}
.faq-ans{padding:0 28px 20px;font-size:13px;color:var(--muted);line-height:1.85;letter-spacing:0.03em}

/* DAILY */
.daily{background:var(--warm);padding:72px 0}
.daily-list{margin-top:32px;display:flex;flex-direction:column;position:relative}
.daily-list::before{content:'';position:absolute;left:58px;top:0;bottom:0;width:1px;background:var(--line)}
.daily-item{display:flex;align-items:flex-start;padding:16px 0;position:relative}
.d-time{font-size:13px;font-weight:700;color:var(--blue);width:58px;flex-shrink:0;padding-top:2px;letter-spacing:0.03em}
.d-dot{width:10px;height:10px;border-radius:50%;background:var(--blue);border:2px solid var(--white);margin-top:4px;flex-shrink:0;position:relative;z-index:1;margin-right:16px}
.d-task{font-size:13.5px;color:var(--ink2);line-height:1.6;letter-spacing:0.03em}

/* PROCESS */
.process{background:var(--navy);padding:72px 0}
.process .eyebrow{color:var(--blue2)}
.process .sec-title{color:var(--white)}
.process-steps{display:flex;align-items:center;gap:0;margin-top:40px;flex-wrap:wrap;gap:16px}
.process-step{display:flex;flex-direction:column;align-items:center;gap:12px;flex:1;min-width:100px}
.p-num{width:44px;height:44px;border-radius:50%;background:var(--blue);color:var(--white);font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:var(--serif);flex-shrink:0}
.p-label{font-size:12px;color:rgba(255,255,255,0.7);text-align:center;letter-spacing:0.03em;line-height:1.5}
.p-arrow{color:rgba(255,255,255,0.2);font-size:18px;flex-shrink:0;align-self:center;margin-top:-16px}

/* ACCESS */
.access{background:var(--white);padding:72px 0}
.access-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:32px;align-items:start}
.access-text h3{font-family:var(--serif);font-size:18px;font-weight:700;color:var(--navy);letter-spacing:0;margin-bottom:14px}
.access-text p{font-size:13.5px;color:var(--muted);line-height:1.8;letter-spacing:0.03em}
.map-wrap{border-radius:8px;overflow:hidden;aspect-ratio:4/3;background:var(--warm2)}
.map-wrap iframe{width:100%;height:100%;border:0;display:block}

/* CTA */
.cta{background:var(--navy);padding:96px 40px;text-align:center}
.cta h2{font-family:var(--serif);font-size:32px;font-weight:700;color:var(--white);line-height:1.5;letter-spacing:0;margin-bottom:14px}
.cta p{font-size:14px;color:rgba(255,255,255,0.45);margin-bottom:36px;line-height:1.75;letter-spacing:0.03em}
.cta-btn{display:inline-block;background:var(--blue);color:var(--white);padding:16px 48px;border-radius:5px;font-size:15px;font-weight:700;letter-spacing:0.05em;text-decoration:none;transition:background .2s}
.cta-btn:hover{background:var(--blue2)}

footer{background:var(--ink);color:rgba(255,255,255,0.3);text-align:center;padding:24px;font-size:11px;letter-spacing:0.05em}

.fade{opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .6s ease}
.fade.in{opacity:1;transform:none}
.fade.d1{transition-delay:.08s}.fade.d2{transition-delay:.16s}.fade.d3{transition-delay:.24s}

@media(max-width:768px){
  nav{padding:0 20px}.nav-links,.nav-cta{display:none}
  .hero{grid-template-columns:1fr}
  .hero-l{padding:56px 24px;min-height:60vh}
  .hero-r,.hero-r-empty{min-height:50vw}
  .c{padding:0 20px}
  section{padding:56px 0}
  .message-inner,.vision-inner,.overview-grid,.culture-grid,.culture-inner-np,.comp-grid,.biz-detail,.access-grid,.iv-card{grid-template-columns:1fr!important;gap:24px}
  .biz-detail.rev{direction:ltr}
  .sec-title{font-size:24px}
  .salary-amt{font-size:40px}
  .process-steps{flex-wrap:wrap;gap:16px}
  .p-arrow{display:none}
  .pos-card{grid-template-columns:1fr;gap:20px}
  .culture-no-photo{padding:40px 24px}
}
</style>
</head>
<body>

<nav>
  <a href="#" class="nav-logo">
    ${prefix?`<span class="nav-pre">${prefix}</span>`:''}
    <span class="nav-name">${shortName}</span>
  </a>
  <ul class="nav-links">
    <li><a href="#overview">会社概要</a></li>
    <li><a href="#business">事業紹介</a></li>
    ${sMin||vc.length?`<li><a href="#compensation">待遇</a></li>`:''}
    <li><a href="#culture">カルチャー</a></li>
    <li><a href="#workstyle">働き方</a></li>
    ${process_.length?`<li><a href="#process">選考</a></li>`:''}
  </ul>
  <a href="${indeedUrl}" target="_blank" class="nav-cta">応募する</a>
</nav>

<!-- HERO -->
<div class="hero">
  <div class="hero-l">
    <span class="hero-eyebrow">Recruitment</span>
    ${prefix?`<p class="hero-pre">${prefix}</p>`:''}
    <h1 class="hero-name">${shortName}</h1>
    <div class="hero-rule"></div>
    ${e.mission?`<p class="hero-mission">${e.mission}</p>`:''}
    ${e.missionDesc?`<p class="hero-desc">${e.missionDesc.slice(0,120)}...</p>`:''}
  </div>
  <div class="hero-r ${hasPh('cover')?'':''}">
    ${hasPh('cover')
      ? `<img src="${photos.cover}" alt="">`
      : `<div class="hero-r-empty">
          <p class="hero-r-tagline">${e.mission||e.bizHeadline||shortName}</p>
          <p class="hero-r-sub">Recruitment</p>
        </div>`}
  </div>
</div>

<!-- MESSAGE -->
${e.ceoMessage||hasPh('member')||hasPh('company')?`
<section class="message" id="message">
  <div class="c">
    <span class="eyebrow fade">Message</span>
    <h2 class="sec-title fade d1" style="color:var(--white)">代表メッセージ</h2>
    <div class="message-inner ${hasPh('member')||hasPh('company')?'':'no-photo'}">
      ${hasPh('member')||hasPh('company')?`
      <div class="message-photo fade">
        <img src="${photos.member||photos.company}" alt="">
      </div>`:''}
      <div class="fade d1">
        <p class="message-quote">${e.ceoMessage||e.mission||''}</p>
        ${e.missionDesc?`<p class="message-text">${e.missionDesc}</p>`:''}
        ${e.ceo?`<p class="message-name">代表取締役 ${e.ceo}</p>`:''}
      </div>
    </div>
  </div>
</section>`:''}

<!-- VISION -->
${e.vision||(e.challenges&&e.challenges.filter(c=>c&&c.trim()).length)?`
<section class="vision" id="vision">
  <div class="c">
    <span class="eyebrow fade">Vision</span>
    <h2 class="sec-title fade d1">目指す未来</h2>
    <div class="vision-inner fade d2">
      <div class="vision-main">
        <h3>${e.visionTitle||'私たちが目指す世界'}</h3>
        <p>${e.vision||e.missionDesc||''}</p>
      </div>
      <div class="vision-challenges">
        ${(e.challenges||[]).filter(c=>c&&c.trim()).slice(0,4).map((ch,i)=>`
        <div class="challenge-item">
          <span class="ch-num">CHALLENGE ${String(i+1).padStart(2,'0')}</span>
          <span class="ch-text">${ch}</span>
        </div>`).join('')}
      </div>
    </div>
  </div>
</section>`:''}

<!-- POSITIONS -->
${e.positionTitle?`
<section class="positions" id="positions">
  <div class="c">
    <span class="eyebrow fade">Positions</span>
    <h2 class="sec-title fade d1">募集職種</h2>
    <div class="pos-card fade d2">
      <div>
        <p class="pos-type">Open Position</p>
        <h3 class="pos-title">${e.positionTitle}</h3>
        <p class="pos-meta">${[e.employmentType,sMin&&sMax?`${sMin}〜${sMax}${sUnit}`:'',e.workLocation].filter(v=>v&&v.trim()).join('　|　')}</p>
      </div>
      <a href="${indeedUrl}" target="_blank" class="pos-cta">詳細を見る</a>
    </div>
  </div>
</section>`:''}

<!-- OVERVIEW -->
<section class="overview" id="overview">
  <div class="c">
    <span class="eyebrow fade">Company</span>
    <h2 class="sec-title fade d1">会社概要</h2>
    <div class="overview-grid ${hasPh('company')?'':'no-photo'}">
      <table class="overview-table fade">
        <tbody>
          ${[['社名',e.companyName],['所在地',e.address],['代表者',e.ceo],['設立',e.founded],['従業員数',e.employees],['売上高',e.sales],['事業内容',e.business],['電話番号',e.phone]].filter(([,v])=>v&&v.trim()).map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('')}
        </tbody>
      </table>
      ${hasPh('company')?`
      <div class="overview-photo fade d1">
        <img src="${photos.company}" alt="">
      </div>`:''}
    </div>
  </div>
</section>

<!-- BUSINESS -->
<section class="business" id="business">
  <div class="c">
    <span class="eyebrow fade">Business</span>
    <h2 class="sec-title fade d1">事業紹介</h2>
    ${e.bizHeadline?`<div class="biz-headline fade d2">${e.bizHeadline}</div>`:''}
    ${services.length?`
    <div class="services-grid">
      ${services.map((s,i)=>`
      <div class="svc-card fade" style="transition-delay:${i*0.07}s">
        <p class="svc-num">SERVICE ${String(i+1).padStart(2,'0')}</p>
        <h3 class="svc-title">${s.title}</h3>
        <p class="svc-desc">${s.desc}</p>
      </div>`).join('')}
    </div>`:''}
    ${e.biz1Title&&e.biz1Body?`
    <div class="biz-detail ${hasPh('biz1')?'':'no-photo'} fade">
      <div>
        <h3 class="biz-text-title">${e.biz1Title}</h3>
        <p class="biz-text-body">${e.biz1Body}</p>
      </div>
      ${hasPh('biz1')?`<div class="biz-photo"><img src="${photos.biz1}" alt=""></div>`:''}
    </div>`:''}
    ${e.biz2Title&&e.biz2Body?`
    <div class="biz-detail rev ${hasPh('biz2')?'':'no-photo'} fade">
      <div>
        <h3 class="biz-text-title">${e.biz2Title}</h3>
        <p class="biz-text-body">${e.biz2Body}</p>
      </div>
      ${hasPh('biz2')?`<div class="biz-photo"><img src="${photos.biz2}" alt=""></div>`:''}
    </div>`:''}
  </div>
</section>

<!-- NUMBERS -->
${stats.length?`
<section class="numbers" id="numbers">
  <div class="c">
    <span class="eyebrow fade">Numbers</span>
    <h2 class="sec-title fade d1">数字で見る${shortName}</h2>
    <div class="numbers-grid">
      ${stats.map((s,i)=>`
      <div class="num-item fade" style="transition-delay:${i*0.08}s">
        <div class="num-val">${s.num}<span class="num-unit">${s.unit||''}</span></div>
        <div class="num-label">${s.label}</div>
      </div>`).join('')}
    </div>
  </div>
</section>`:''}

<!-- COMPENSATION -->
${sMin&&sMax||vf.length||vc.length?`
<section class="compensation" id="compensation">
  <div class="c">
    <span class="eyebrow fade">Compensation</span>
    <h2 class="sec-title fade d1">評価・報酬制度</h2>
    <div class="comp-grid">
      ${sMin&&sMax?`
      <div class="salary-card fade">
        <span class="salary-lbl">${stl}</span>
        <div class="salary-amt">${sMin}<span style="font-size:26px">〜</span>${sMax}</div>
        <div class="salary-unit">${sUnit}</div>
        <p class="salary-note">${e.salaryNote||'賞与・昇給あり'}<br>※詳細は面接時にご確認ください</p>
      </div>`:'<div></div>'}
      <div class="comp-right fade d1">
        ${vf.length?`
        <p class="comp-sub">報酬の考え方</p>
        ${vf.slice(0,3).map(f=>`
        <div class="factor-row">
          <div class="factor-tag">${f.name}</div>
          <div class="factor-desc">${f.desc}</div>
        </div>`).join('')}`:''}
        ${vc.length?`
        <p class="comp-sub" style="margin-top:${vf.length?'24px':'0'}">キャリアパス</p>
        <ul class="career-list">
          ${vc.map(s=>`
          <li class="career-item">
            <div class="c-dot"></div>
            <div>
              <div class="c-name">${s.title}</div>
              ${s.desc?`<div class="c-desc">${s.desc}</div>`:''}
              ${s.salary?`<div class="c-sal">${/^\d+$/.test(s.salary.trim())?s.salary+'万円':s.salary}</div>`:''}
            </div>
          </li>`).join('')}
        </ul>`:''}
      </div>
    </div>
  </div>
</section>`:''}

<!-- CULTURE -->
<section class="culture" id="culture">
  <div class="c">
    <span class="eyebrow fade">Culture</span>
    <h2 class="sec-title fade d1">カルチャー</h2>
    ${hasPh('culture')?`
    <div class="culture-grid">
      <div class="culture-photo fade">
        <img src="${photos.culture}" alt="">
      </div>
      <div class="fade d1">
        ${e.cultureVal1||e.cultureVal2?`
        <div class="culture-tags">
          ${e.cultureVal1?`<span class="culture-tag">${e.cultureVal1}</span>`:''}
          ${e.cultureVal2?`<span class="culture-tag">${e.cultureVal2}</span>`:''}
        </div>`:''}
        ${e.cultureDesc?`<p class="culture-text">${e.cultureDesc}</p>`:''}
      </div>
    </div>`:`
    <div class="culture-no-photo fade">
      <div class="culture-inner-np">
        <div>
          ${e.cultureVal1||e.cultureVal2?`
          <div class="culture-tags">
            ${e.cultureVal1?`<span class="culture-tag light">${e.cultureVal1}</span>`:''}
            ${e.cultureVal2?`<span class="culture-tag light">${e.cultureVal2}</span>`:''}
          </div>`:''}
          <p class="culture-text light">${(e.cultureDesc||'').slice(0,200)}</p>
        </div>
        <p class="culture-text light" style="font-size:13px;opacity:0.8">${(e.cultureDesc||'').slice(200)}</p>
      </div>
    </div>`}
  </div>
</section>

<!-- WANTED -->
${wantedList.length?`
<section class="wanted" id="wanted">
  <div class="c">
    <span class="eyebrow fade">Who We Need</span>
    <h2 class="sec-title fade d1">こんな方と働きたい</h2>
    <div class="wanted-grid">
      ${wantedList.map((v,i)=>`
      <div class="wanted-item fade" style="transition-delay:${i*0.06}s">
        <span class="w-num">${String(i+1).padStart(2,'0')}</span>${v}
      </div>`).join('')}
    </div>
  </div>
</section>`:''}

<!-- INTERVIEW -->
${hasIV?`
<section class="interview" id="interview">
  <div class="c">
    <span class="eyebrow fade">Voice</span>
    <h2 class="sec-title fade d1">社員の声</h2>
    <div class="iv-card ${hasPh('member')?'':'no-photo'} fade">
      ${hasPh('member')?`
      <div>
        <div class="iv-photo"><img src="${photos.member}" alt=""></div>
        ${iv.person?`<p class="iv-name">${iv.person}</p>`:''}
      </div>`:''}
      <div>
        ${!hasPh('member')&&iv.person?`<p class="iv-name inline">${iv.person}</p>`:''}
        ${[[iv.q1,iv.a1],[iv.q2,iv.a2],[iv.q3,iv.a3]].filter(([q])=>q&&q.trim()).map(([q,a])=>`
        <div class="qa-item">
          <div class="qa-q"><span class="q-badge">Q</span>${q}</div>
          <p class="qa-a">${a||''}</p>
        </div>`).join('')}
      </div>
    </div>
  </div>
</section>`:''}

<!-- WORKSTYLE -->
<section class="workstyle" id="workstyle">
  <div class="c">
    <span class="eyebrow fade">Work Style</span>
    <h2 class="sec-title fade d1">働き方・制度</h2>
    <div class="ws-grid">
      ${[['就業時間',e.workHours],['勤務地',e.workLocation],['休暇・休日',holidays.join('　')],['雇用形態',e.employmentType]].filter(([,v])=>v&&v.trim()).map(([k,v],i)=>`
      <div class="ws-item fade" style="transition-delay:${i*0.08}s">
        <p class="ws-label">${k}</p>
        <p class="ws-val">${v}</p>
      </div>`).join('')}
    </div>
    ${benefits.length?`
    <div class="benefits-wrap fade">
      <h3 class="benefits-title">福利厚生</h3>
      <div class="benefits-grid">
        ${benefits.map(b=>`<div class="benefit-item">${b}</div>`).join('')}
      </div>
    </div>`:''}
  </div>
</section>

<!-- FAQ -->
${faq.length?`
<section class="faq" id="faq">
  <div class="c">
    <span class="eyebrow fade">FAQ</span>
    <h2 class="sec-title fade d1">よくある質問</h2>
    <div class="faq-list fade d2">
      ${faq.map(f=>`
      <div class="faq-item">
        <details>
          <summary>${f.q}</summary>
          <div class="faq-ans">${f.a}</div>
        </details>
      </div>`).join('')}
    </div>
  </div>
</section>`:''}

<!-- DAILY -->
${daily.length?`
<section class="daily" id="daily">
  <div class="c">
    <span class="eyebrow fade">Daily</span>
    <h2 class="sec-title fade d1">1日の流れ</h2>
    <div class="daily-list">
      ${daily.map((d,i)=>`
      <div class="daily-item fade" style="transition-delay:${i*0.06}s">
        <span class="d-time">${d.time}</span>
        <div class="d-dot"></div>
        <span class="d-task">${d.task}</span>
      </div>`).join('')}
    </div>
  </div>
</section>`:''}

<!-- PROCESS -->
${process_.length?`
<section class="process" id="process">
  <div class="c">
    <span class="eyebrow fade">Process</span>
    <h2 class="sec-title fade d1">選考プロセス</h2>
    <div class="process-steps">
      ${process_.map((p,i)=>`
      <div class="process-step fade" style="transition-delay:${i*0.08}s">
        <div class="p-num">${i+1}</div>
        <div class="p-label">${p}</div>
      </div>
      ${i<process_.length-1?`<span class="p-arrow">›</span>`:''}`).join('')}
    </div>
  </div>
</section>`:''}

<!-- ACCESS -->
${e.address?`
<section class="access" id="access">
  <div class="c">
    <span class="eyebrow fade">Access</span>
    <h2 class="sec-title fade d1">アクセス</h2>
    <div class="access-grid">
      <div class="access-text fade">
        <h3>${shortName}</h3>
        <p>${e.address}${e.access?'<br>'+e.access:''}</p>
      </div>
      <div class="map-wrap fade d1">
        <iframe src="https://maps.google.com/maps?q=${encodeURIComponent(e.address)}&output=embed" allowfullscreen loading="lazy"></iframe>
      </div>
    </div>
  </div>
</section>`:''}

<!-- CTA -->
<section class="cta">
  <h2 class="fade">${cn}で、<br>一緒に働きませんか？</h2>
  <p class="fade d1">まずはカジュアルにお話しましょう。</p>
  <a href="${indeedUrl}" target="_blank" class="cta-btn fade d2">応募する</a>
</section>

<footer><p>© ${cn} All Rights Reserved.</p></footer>

<script>
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')});
},{threshold:0.06});
document.querySelectorAll('.fade').forEach(el=>obs.observe(el));
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const id=a.getAttribute('href');if(id==='#')return;
    e.preventDefault();
    const el=document.querySelector(id);
    if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
  });
});
</script>
</body>
</html>`;

  return res.status(200).json({ html });
};
