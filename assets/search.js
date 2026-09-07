/* 站內搜尋（2026-09-07 新增）
   輕量本機子字串比對，不打外部服務。點 header 的搜尋鈕開 modal，
   Esc 關閉、上下鍵選取、Enter 導頁。跟深色模式一樣不受 reduced-motion 影響，
   modal 開關本身沒有動畫依賴。 */
(function () {
  var btn = document.getElementById('searchToggle');
  if (!btn) return;

  var modal, input, list, empty;
  var index = null;
  var indexPromise = null;
  var activeIndex = -1;

  // 每頁的 <script src="…assets/main.js"> 已經帶正確的相對前綴（根目錄頁 vs
  // knowledge/cases/services 子目錄頁不同），直接借用它，不用自己猜路徑深度。
  var rootPrefix = (function () {
    var el = document.querySelector('script[src*="assets/main.js"]');
    var src = el ? el.getAttribute('src') : 'assets/main.js';
    return src.replace(/assets\/main\.js.*$/, '');
  })();

  function assetPath(name) { return rootPrefix + 'assets/' + name; }
  function pagePath(rel) { return rootPrefix + rel; }

  function loadIndex() {
    if (indexPromise) return indexPromise;
    indexPromise = fetch(assetPath('search-index.json'), { cache: 'force-cache' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (data) { index = data; return data; })
      .catch(function () { index = []; return []; });
    return indexPromise;
  }

  function buildModal() {
    if (modal) return;
    modal = document.createElement('div');
    modal.className = 'search-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', '站內搜尋');
    modal.innerHTML =
      '<div class="search-modal-backdrop" data-search-close></div>' +
      '<div class="search-modal-panel">' +
      '  <div class="search-modal-head">' +
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3" stroke-linecap="round"/></svg>' +
      '    <input type="search" placeholder="搜尋頁面、服務、知識庫文章…" autocomplete="off" aria-label="搜尋關鍵字">' +
      '    <button type="button" class="search-modal-close" data-search-close aria-label="關閉搜尋">✕</button>' +
      '  </div>' +
      '  <p class="search-modal-empty" hidden>找不到符合的頁面，可以看看 <a href="' + pagePath('contact.html') + '">直接聯絡我們</a>。</p>' +
      '  <ul class="search-modal-list"></ul>' +
      '</div>';
    document.body.appendChild(modal);
    input = modal.querySelector('input');
    list = modal.querySelector('.search-modal-list');
    empty = modal.querySelector('.search-modal-empty');

    modal.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-search-close')) close();
    });
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      var items = list.querySelectorAll('a');
      if (e.key === 'ArrowDown') { e.preventDefault(); move(items, 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(items, -1); }
      else if (e.key === 'Enter' && activeIndex >= 0 && items[activeIndex]) { items[activeIndex].click(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });
  }

  function move(items, dir) {
    if (!items.length) return;
    activeIndex = (activeIndex + dir + items.length) % items.length;
    items.forEach(function (a, i) { a.classList.toggle('active', i === activeIndex); });
    items[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  function render(q) {
    q = (q || '').trim().toLowerCase();
    activeIndex = -1;
    list.innerHTML = '';
    if (!q || !index) { empty.hidden = true; return; }
    var hits = index.filter(function (e) {
      return (e.title + e.h1 + e.desc).toLowerCase().indexOf(q) !== -1;
    }).slice(0, 8);
    empty.hidden = hits.length !== 0;
    hits.forEach(function (e) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = pagePath(e.url === '/' ? 'index.html' : e.url.slice(1) + '.html');
      a.innerHTML = '<strong>' + escapeHtml(e.h1 || e.title) + '</strong><span>' + escapeHtml(e.desc) + '</span>';
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function open() {
    buildModal();
    loadIndex().then(function () { render(''); });
    modal.classList.add('open');
    document.documentElement.classList.add('search-lock');
    setTimeout(function () { input.focus(); }, 10);
  }

  function close() {
    if (!modal) return;
    modal.classList.remove('open');
    document.documentElement.classList.remove('search-lock');
    btn.focus();
  }

  btn.addEventListener('click', open);
})();
