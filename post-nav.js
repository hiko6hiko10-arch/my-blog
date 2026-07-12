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
    '.pn-related .pn-date{color:#999;font-size:.78rem;margin-left:8px;}';
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
