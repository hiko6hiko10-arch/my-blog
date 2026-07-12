// 記事の下に「前の記事・次の記事」と「関連記事」を自動表示する
// データはホーム（index.html）の投稿一覧から読み取るため、記事が増えても自動で更新される
(function () {
  var box = document.getElementById('postNav');
  if (!box) return;

  var here = location.pathname.split('/').pop();
  if (!here) return;
  if (!/\.html$/.test(here)) here += '.html'; // 拡張子なしURL（/article11 など）にも対応

  // 見た目（このファイル内で完結させる）
  var style = document.createElement('style');
  style.textContent =
    '.pn-wrap{margin-top:32px;border-top:1px solid #eee;padding-top:20px;}' +
    '.pn-row{display:flex;gap:12px;flex-wrap:wrap;}' +
    '.pn-row a{flex:1;min-width:180px;display:block;border:1px solid #d9e4dc;border-radius:12px;padding:12px 14px;text-decoration:none;color:#2d6c4f;font-size:.9rem;background:#fafcfa;}' +
    '.pn-row a:hover{background:#eef5f0;}' +
    '.pn-row .pn-dir{color:#888;font-size:.78rem;display:block;margin-bottom:2px;}' +
    '.pn-row .pn-next{text-align:right;}' +
    '.pn-related{margin-top:18px;}' +
    '.pn-related .pn-head{font-weight:700;color:#2d6c4f;font-size:.95rem;margin-bottom:8px;}' +
    '.pn-related a{display:block;color:#2d6c4f;text-decoration:none;font-size:.9rem;padding:6px 0;border-bottom:1px dashed #e5e5e5;}' +
    '.pn-related a:last-child{border-bottom:none;}' +
    '.pn-related a:hover{text-decoration:underline;}' +
    '.pn-related .pn-date{color:#999;font-size:.78rem;margin-left:8px;}' +
    '.pn-share{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px;}' +
    '.pn-share-label{font-weight:700;color:#2d6c4f;font-size:.95rem;}' +
    '.pn-share a.line-btn{display:inline-block;background:#06C755;color:#fff;text-decoration:none;font-weight:700;font-size:.9rem;padding:9px 18px;border-radius:8px;}' +
    '.pn-share a.line-btn:hover{background:#05b34c;}' +
    '.pn-share button.copy-btn{border:1px solid #c3d4c8;background:#fff;color:#2d6c4f;font-size:.9rem;font-weight:600;padding:9px 16px;border-radius:8px;cursor:pointer;font-family:inherit;}' +
    '.pn-share button.copy-btn:hover{background:#eef5f0;}';
  document.head.appendChild(style);

  fetch('index.html')
    .then(function (r) { return r.text(); })
    .then(function (html) {
      var d = new DOMParser().parseFromString(html, 'text/html');
      var cards = Array.prototype.map.call(d.querySelectorAll('.main-col .card'), function (c) {
        var a = c.querySelector('h2 a');
        var dateEl = c.querySelector('.date');
        if (!a) return null;
        return {
          url: a.getAttribute('href'),
          title: a.textContent.trim(),
          date: dateEl ? dateEl.textContent.trim() : '',
          cat: c.getAttribute('data-cat') || ''
        };
      }).filter(Boolean); // 新しい順に並んでいる

      var i = -1;
      for (var k = 0; k < cards.length; k++) {
        if (cards[k].url === here) { i = k; break; }
      }
      if (i === -1) return;

      var newer = i > 0 ? cards[i - 1] : null;              // 次の記事（新しい方）
      var older = i < cards.length - 1 ? cards[i + 1] : null; // 前の記事（古い方）

      var wrap = document.createElement('div');
      wrap.className = 'pn-wrap';

      // この記事をシェア（LINEで送る・リンクをコピー）
      var canonical = document.querySelector('link[rel="canonical"]');
      var pageUrl = canonical ? canonical.href : location.href;

      var share = document.createElement('div');
      share.className = 'pn-share';

      var label = document.createElement('span');
      label.className = 'pn-share-label';
      label.textContent = 'この記事をシェア:';
      share.appendChild(label);

      var lineBtn = document.createElement('a');
      lineBtn.className = 'line-btn';
      lineBtn.href = 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(pageUrl);
      lineBtn.target = '_blank';
      lineBtn.rel = 'noopener';
      lineBtn.textContent = 'LINEで送る';
      share.appendChild(lineBtn);

      var copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = 'リンクをコピー';
      copyBtn.onclick = function () {
        function done() {
          copyBtn.textContent = 'コピーしました！';
          setTimeout(function () { copyBtn.textContent = 'リンクをコピー'; }, 2000);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(pageUrl).then(done);
        } else {
          // 古いブラウザ向けの保険
          var ta = document.createElement('textarea');
          ta.value = pageUrl;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          done();
        }
      };
      share.appendChild(copyBtn);

      wrap.appendChild(share);

      var row = document.createElement('div');
      row.className = 'pn-row';
      if (older) {
        var pa = document.createElement('a');
        pa.href = older.url;
        pa.innerHTML = '<span class="pn-dir">← 前の記事</span>';
        pa.appendChild(document.createTextNode(older.title));
        row.appendChild(pa);
      }
      if (newer) {
        var na = document.createElement('a');
        na.href = newer.url;
        na.className = 'pn-next';
        na.innerHTML = '<span class="pn-dir">次の記事 →</span>';
        na.appendChild(document.createTextNode(newer.title));
        row.appendChild(na);
      }
      if (row.children.length) wrap.appendChild(row);

      // 関連記事: 同じテーマで、日付が近い順に最大3件
      var me = cards[i];
      if (me.cat) {
        var related = [];
        for (var dist = 1; dist < cards.length && related.length < 3; dist++) {
          [i - dist, i + dist].forEach(function (j) {
            if (related.length < 3 && j >= 0 && j < cards.length && cards[j].cat === me.cat) {
              related.push(cards[j]);
            }
          });
        }
        if (related.length) {
          var rel = document.createElement('div');
          rel.className = 'pn-related';
          var head = document.createElement('div');
          head.className = 'pn-head';
          head.textContent = '🔗 関連記事（' + me.cat + '）';
          rel.appendChild(head);
          related.forEach(function (p) {
            var a = document.createElement('a');
            a.href = p.url;
            a.textContent = p.title;
            if (p.date) {
              var sp = document.createElement('span');
              sp.className = 'pn-date';
              sp.textContent = p.date;
              a.appendChild(sp);
            }
            rel.appendChild(a);
          });
          wrap.appendChild(rel);
        }
      }

      box.appendChild(wrap);
    })
    .catch(function () { /* 読み込めなくても記事本文には影響なし */ });
})();
