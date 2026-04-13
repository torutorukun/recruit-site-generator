#!/bin/bash
set -e
cd ~/recruit-site-generator

# === analyze.js ===
node - <<'EOF'
const fs = require('fs');
let src = fs.readFileSync('api/analyze.js', 'utf8');

// 1. SNSルール強化
src = src.replace(
  '■ SNSのURLは提供されたサイトに実際に存在するものだけ記載。推測しない。',
  '■ SNSのURLは提供されたサイトのHTMLに実際にリンクとして存在するものだけ記載。テキスト中にYouTube・SNSの言及があってもURLを推測・生成しない。確信が持てなければ必ず空文字。\n■ YouTubeのURLは特に厳格に。チャンネル名が書いてあってもURLが明示されていなければ空文字にする。\n■ 従業員数はIndeed求人票の「50〜149人」のような範囲表記は使用しない。会社HP等から明確な数字が取れた場合のみ数字セクションに使用可。'
);

// 2. employeesフィールド削除 → ceoNote追加
src = src.replace(
  '"employees": "従業員数（なければ空文字）",\n  "sales":',
  '"sales":'
);
src = src.replace(
  '"sales": "売上高（なければ空文字）",',
  '"sales": "売上高（なければ空文字）",\n  "ceoNote": "代表者・会社に関する特記事項（補足情報に\'YouTube出演中\'等あれば記載。なければ空文字）",'
);

fs.writeFileSync('api/analyze.js', src);
console.log('analyze.js ✓');
EOF

# === generate-site.js ===
node - <<'EOF'
const fs = require('fs');
let src = fs.readFileSync('api/generate-site.js', 'utf8');

// 3. hasOverviewからemployees削除
src = src.replace(
  'const hasOverview = !!(e.address || e.ceo || e.founded || e.employees || e.sales);',
  'const hasOverview = !!(e.address || e.ceo || e.founded || e.sales);'
);

// 4. アクセスの住所表示をmapLabelに
src = src.replace(
  '<p class="fade-up" style="color:var(--text-grey);margin-bottom:24px">${e.address}</p>',
  '<p class="fade-up" style="color:var(--text-grey);margin-bottom:24px">${mapLabel}</p>'
);

// 5. 写真あり版 ceoNote追加
const ceoNoteRow = '${e.ceoNote && e.ceoNote.trim() ? `<tr><td>代表者情報</td><td><span style="display:inline-block;background:var(--primary);color:#fff;font-size:0.78rem;padding:2px 10px;border-radius:20px;font-weight:600;">${e.ceoNote}</span></td></tr>` : \'\'}';

src = src.replace(
  `          ].filter(([,v]) => v && v.trim()).map(([k,v]) =>
            \`<tr><td>\${k}</td><td>\${v}</td></tr>\`
          ).join('')}
        </tbody>
      </table>
      <div class="overview-photo fade-up delay-1">`,
  `          ].filter(([,v]) => v && v.trim()).map(([k,v]) =>
            \`<tr><td>\${k}</td><td>\${v}</td></tr>\`
          ).join('')}
          ${ceoNoteRow}
        </tbody>
      </table>
      <div class="overview-photo fade-up delay-1">`
);

// 6. 写真なし版 ceoNote追加
src = src.replace(
  `        ].filter(([,v]) => v && v.trim()).map(([k,v]) =>
          \`<tr><td>\${k}</td><td>\${v}</td></tr>\`
        ).join('')}
      </tbody>
    </table>\`}`,
  `        ].filter(([,v]) => v && v.trim()).map(([k,v]) =>
          \`<tr><td>\${k}</td><td>\${v}</td></tr>\`
        ).join('')}
        ${ceoNoteRow}
      </tbody>
    </table>\`}`
);

fs.writeFileSync('api/generate-site.js', src);
console.log('generate-site.js ✓');
EOF

# === git push ===
git add -A
git commit -m "fix: YouTube誤リンク防止・従業員数除外・ceoNote・アクセス住所修正"
git push

echo ""
echo "✅ 完了！Vercelにデプロイされました"
