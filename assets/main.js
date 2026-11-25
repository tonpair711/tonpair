/* ==========================================================================
   對頻設計 tonpair — 全站共用 JS
   漸進增強：沒有 JS 時內容 100% 可見可用，這支只負責加分項。
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 只有在會動的情況才加 js-fx，讓 CSS 的「初始隱藏」生效
  if (!reduced) document.documentElement.classList.add('js-fx');

  /* ---------- 深色 / 淺色模式（預設淺色，記住選擇） ---------- */
  var themeToggle = document.getElementById('themeToggle');
  function syncThemeIcon() {
    if (!themeToggle) return;
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeToggle.textContent = dark ? '☀' : '☾';
    themeToggle.setAttribute('aria-label', dark ? '切換為淺色模式' : '切換為深色模式');
  }
  syncThemeIcon();
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (dark) {
        document.documentElement.removeAttribute('data-theme');
        try { localStorage.setItem('amp-theme', 'light'); } catch (e) {}
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        try { localStorage.setItem('amp-theme', 'dark'); } catch (e) {}
      }
      syncThemeIcon();
    });
  }

  /* ---------- 手機選單 ---------- */
  var navToggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- 捲動淡入 ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px' });
    revealEls.forEach(function (el) { io.observe(el); });
    // 保險：3 秒後一律顯示，任何情況都不會有看不到的內容
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { el.classList.add('in'); });
    }, 3000);
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 分頁切換（.tabs 內的 .tab[data-panel]） ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var tabs = group.querySelectorAll('.tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-panel');
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        var scope = document.getElementById(group.getAttribute('data-tabs'));
        if (!scope) return;
        scope.querySelectorAll('[data-panel-id]').forEach(function (panel) {
          panel.hidden = panel.getAttribute('data-panel-id') !== target;
        });
      });
    });
  });

  /* ---------- 篩選（提示詞場景庫：.tab[data-filter] + [data-cat]） ---------- */
  document.querySelectorAll('[data-filters]').forEach(function (group) {
    var items = document.querySelectorAll('#' + group.getAttribute('data-filters') + ' [data-cat]');
    group.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var f = tab.getAttribute('data-filter');
        group.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t === tab); });
        items.forEach(function (item) {
          var cats = (item.getAttribute('data-cat') || '').split(' ');
          item.hidden = !(f === 'all' || cats.indexOf(f) !== -1);
        });
      });
    });
  });

  /* ---------- 點圖放大（img.lightbox） ---------- */
  document.querySelectorAll('img.lightbox').forEach(function (img) {
    img.addEventListener('click', function () {
      var overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';
      overlay.innerHTML = '<button class="lightbox-close" aria-label="關閉">✕</button>';
      var big = document.createElement('img');
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      overlay.appendChild(big);
      function onEsc(e) { if (e.key === 'Escape') close(); }
      function close() { overlay.remove(); document.removeEventListener('keydown', onEsc); }
      overlay.addEventListener('click', close);
      document.addEventListener('keydown', onEsc);
      document.body.appendChild(overlay);
    });
  });

  /* ---------- 視覺簽名：雙軸對頻線／分隔結點 ----------
     .sig-line：兩條錯位髮絲線，進入視野加 .in 鎖定重合。
     .divider：分隔線中央兩枚結點，進入視野向中間靠攏。
     無 JS 或 reduced-motion 時 CSS 直接呈現「已對頻」狀態，不會有看不到的內容。 */
  var sigEls = document.querySelectorAll('.sig-line, .divider');
  if (sigEls.length && 'IntersectionObserver' in window && !reduced) {
    var sigIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); sigIo.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    sigEls.forEach(function (el) { sigIo.observe(el); });
    setTimeout(function () {
      document.querySelectorAll('.sig-line:not(.in), .divider:not(.in)').forEach(function (el) { el.classList.add('in'); });
    }, 3000);
  } else {
    sigEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 聯絡表單：?topic= 預填 ＋ 送出（有端點就真的送，沒有／失敗才退回 mailto） ---------- */
  var topicSelect = document.querySelector('select[name="topic"]');
  if (topicSelect) {
    var topic = new URLSearchParams(location.search).get('topic');
    if (topic) {
      for (var i = 0; i < topicSelect.options.length; i++) {
        var opt = topicSelect.options[i];
        if (opt.text === topic || opt.text.indexOf(topic) !== -1) { topicSelect.value = opt.value; break; }
      }
    }
  }

  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var loadedAt = Date.now();

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var form = this;
      // 表單掛 novalidate（不要瀏覽器自己跳泡泡打斷版面），必填欄位改在這裡自己檢查
      if (form.checkValidity && !form.checkValidity()) { form.reportValidity(); return; }
      var d = new FormData(form);
      var pains = d.getAll('pain').join('、') || '（未勾選）';
      var body = [
        '姓名：' + d.get('name'),
        '店家/單位：' + (d.get('organization') || '（未填）'),
        'Email：' + d.get('email'),
        'LINE ID／電話：' + (d.get('line') || '（未填）'),
        '想了解：' + d.get('topic'),
        '目前狀況：' + pains,
        '',
        '想說的話：',
        d.get('message') || '（未填）'
      ].join('\n');

      var ok = document.getElementById('formStatus');
      var fallback = document.getElementById('formFallback');
      var btn = form.querySelector('button[type="submit"]');

      function openMail() {
        location.href = 'mailto:tonpair711@gmail.com?subject=' +
          encodeURIComponent('【免費諮詢】' + d.get('topic')) +
          '&body=' + encodeURIComponent(body);
      }
      function show(el) { if (el) el.hidden = false; }
      function hide(el) { if (el) el.hidden = true; }

      var endpoint = form.getAttribute('data-endpoint') || '';

      // 沒有設定端點時，維持原本的 mailto 行為（端點掛掉也永遠有這條路可走）
      if (!endpoint) { openMail(); show(fallback); return; }

      // 機器人：填了隱藏欄位，或載入後 3 秒內就送出
      if (d.get('website') || Date.now() - loadedAt < 3000) { show(ok); return; }

      var payload = {
        name: d.get('name') || '',
        organization: d.get('organization') || '',
        email: d.get('email') || '',
        line: d.get('line') || '',
        topic: d.get('topic') || '',
        pains: pains,
        message: d.get('message') || '',
        page: location.href,
        referrer: document.referrer || ''
      };

      hide(ok); hide(fallback);
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = '傳送中…'; }

      var done = false;
      function finish(success) {
        if (done) return;
        done = true;
        if (btn) { btn.disabled = false; btn.textContent = label; }
        if (success) { show(ok); form.reset(); }
        else { show(fallback); openMail(); }
      }
      // 端點沒回應就別讓使用者一直等，8 秒後改走 mailto
      var timer = setTimeout(function () { finish(false); }, 8000);

      // text/plain 不會觸發 CORS 預檢，Apps Script 才收得到
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        clearTimeout(timer);
        finish(r.ok);
      }).catch(function () {
        clearTimeout(timer);
        finish(false);
      });
    });
  }

  /* ---------- Gemini 頁：3 題導入評估小工具 ---------- */
  var quiz = document.getElementById('quizForm');
  if (quiz) {
    quiz.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(quiz);
      var hasAccount = d.get('q1') === 'yes';
      var tightBudget = d.get('q2') === 'limited';
      var full = d.get('q3') === 'full';
      var title, text;
      if (!hasAccount) {
        title = '建議：先完成 Google Workspace for Education 帳號申請';
        text = '目前尚未有教育帳號，第一步是完成 Google Workspace for Education Fundamentals 的申請與網域驗證，AI 功能才有可以掛載的基礎。本團隊可協助評估申請流程與現有基礎架構。';
      } else if (tightBudget || !full) {
        title = '建議：從 Gemini for Education 起步試行';
        text = '已有教育帳號、預算尚未編列或想先體驗，建議先啟用免費的 Gemini for Education，挑一到兩個科目或行政流程試行，累積成效後再評估是否升級付費方案，導入風險最低。';
      } else {
        title = '建議：評估 Google AI Pro For Education 全面導入';
        text = '已有教育帳號、預算已編列且目標是全面導入，可評估 Google AI Pro For Education：進階能力直接整合進 Docs、Slides、Sheets 與 Meet，並提供更高使用額度。建議搭配教師端教育訓練一起規劃。';
      }
      var out = document.getElementById('quizResult');
      out.querySelector('h3').textContent = title;
      out.querySelector('p').textContent = text;
      out.hidden = false;
      out.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    });
  }

  /* ---------- 一鍵複製（LINE ID／信箱）----------
     電腦版 LINE 沒辦法用手機掃碼加好友，只能搜尋 ID，所以 ID 要能直接複製。
     做法沿用 hunglun2026 的 .fc-copy：非同步 API 失敗就退回 textarea + execCommand。 */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.fc-copy') : null;
    if (!btn) return;
    e.preventDefault();
    var text = btn.getAttribute('data-copy') || '';
    var label = btn.getAttribute('data-label') || '複製';

    function done() {
      btn.textContent = '已複製';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.textContent = label;
        btn.classList.remove('copied');
      }, 1600);
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { /* 複製不成就維持原樣 */ }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done)['catch'](fallback);
    } else {
      fallback();
    }
  });

  /* ---------- 電腦版 LINE 連結：彈出 ID 小卡，不跳 QR Code ----------
     line.me/R/ti/p 在電腦瀏覽器只會顯示要用手機掃的 QR Code，沒有意義。
     有滑鼠的裝置改成在按鈕旁彈出 ID＋複製鈕；手機（觸控）照舊直接開 LINE。
     沿用 hunglun2026 的 .fab-pop，但頁尾與頁內按鈕也要用，所以改成事件委派＋fixed 定位。 */
  if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var linePop = null, lineAnchor = null;
    var LINE_ID = '@007bbtpd';
    var closeLinePop = function () {
      if (linePop) { linePop.remove(); linePop = null; lineAnchor = null; }
    };
    var openLinePop = function (a) {
      closeLinePop();
      linePop = document.createElement('div');
      linePop.className = 'line-pop';
      linePop.setAttribute('role', 'dialog');
      linePop.setAttribute('aria-label', 'LINE 官方帳號 ID');
      linePop.innerHTML = '<b></b><button type="button" class="fc-copy" data-label="複製 ID">複製 ID</button>' +
        '<small>電腦版請在 LINE 搜尋這個 ID 加入好友</small>' +
        '<a href="' + a.href + '" target="_blank" rel="noopener">或用手機開啟</a>';
      linePop.querySelector('b').textContent = LINE_ID;
      linePop.querySelector('.fc-copy').setAttribute('data-copy', LINE_ID);
      document.body.appendChild(linePop);
      lineAnchor = a;
      // 定位：優先放在按鈕上方，上方空間不夠就放下方；水平貼齊按鈕右緣但不超出視窗
      var r = a.getBoundingClientRect(), pw = linePop.offsetWidth, ph = linePop.offsetHeight;
      var top = r.top - ph - 10;
      if (top < 8) top = r.bottom + 10;
      var left = Math.min(Math.max(8, r.right - pw), window.innerWidth - pw - 8);
      linePop.style.top = top + 'px';
      linePop.style.left = left + 'px';
    };
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target : null;
      if (!t) return;
      var a = t.closest('a[href*="line.me/R/ti/p"], a[href*="lin.ee/"]');
      if (a && !a.closest('.line-pop')) {
        e.preventDefault();
        if (lineAnchor === a) closeLinePop(); else openLinePop(a);
        return;
      }
      if (linePop && !t.closest('.line-pop')) closeLinePop();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLinePop(); });
    window.addEventListener('scroll', closeLinePop, { passive: true });
    window.addEventListener('resize', closeLinePop);
  }

  /* ---------- 首頁的網站效果展示：每張卡片就是那個效果本人 ----------
     卡片進入視野時演一次，「再看一次」可重播。
     reduced-motion 時一律直接呈現最終狀態（文字打完、數字到位、線已重合）。 */
  var fxStages = document.querySelectorAll('[data-fx]');
  if (fxStages.length) {

    function fxType(stage, instant) {
      var el = stage.querySelector('.fx-type');
      if (!el) return;
      var text = el.getAttribute('data-text') || '';
      if (instant) { el.textContent = text; return; }
      el.textContent = '';
      var i = 0;
      clearInterval(el._t);
      el._t = setInterval(function () {
        el.textContent = text.slice(0, ++i);
        if (i >= text.length) clearInterval(el._t);
      }, 110);
    }

    function fxCount(stage, instant) {
      var el = stage.querySelector('[data-count-to]');
      if (!el) return;
      var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
      var prefix = el.getAttribute('data-count-prefix') || '';
      function paint(v) { el.textContent = prefix + v.toLocaleString('en-US'); }
      if (instant) { paint(target); return; }
      var start = null, dur = 1100;
      cancelAnimationFrame(el._raf);
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        // 先快後慢，停下來時比較有重量感
        paint(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) el._raf = requestAnimationFrame(step);
      }
      el._raf = requestAnimationFrame(step);
    }

    function fxReveal(stage, instant) {
      var box = stage.querySelector('.fx-reveal-box');
      if (!box) return;
      if (instant) { box.classList.add('on'); return; }
      box.classList.remove('on');
      setTimeout(function () { box.classList.add('on'); }, 60);
    }

    function fxSig(stage, instant) {
      var line = stage.querySelector('.sig-line');
      if (!line) return;
      if (instant) { line.classList.add('in'); return; }
      line.classList.remove('in');
      setTimeout(function () { line.classList.add('in'); }, 80);
    }

    var players = { type: fxType, count: fxCount, reveal: fxReveal, sig: fxSig };

    function play(stage, instant) {
      var fn = players[stage.getAttribute('data-fx')];
      if (fn) fn(stage, instant);
    }

    // 3D 傾斜：只在有滑鼠的裝置上做，觸控裝置維持靜止
    document.querySelectorAll('[data-fx="tilt"]').forEach(function (stage) {
      var card = stage.querySelector('.fx-tilt');
      if (!card || reduced) return;
      stage.addEventListener('mousemove', function (e) {
        var r = stage.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'rotateY(' + (x * 18).toFixed(2) + 'deg) rotateX(' + (-y * 18).toFixed(2) + 'deg)';
      });
      stage.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });

    fxStages.forEach(function (stage) {
      if (reduced) { play(stage, true); return; }
      if (!('IntersectionObserver' in window)) { play(stage, true); return; }
      var seen = false;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !seen) { seen = true; play(stage, false); io.unobserve(stage); }
        });
      }, { threshold: 0.5 });
      io.observe(stage);
      // 保險：3 秒後還沒演過就直接給最終狀態，不會有空白的卡片
      setTimeout(function () { if (!seen) { seen = true; play(stage, true); } }, 3000);
    });

    document.querySelectorAll('[data-fx-replay]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.fx-card');
        var stage = card && card.querySelector('[data-fx]');
        if (stage) play(stage, reduced);
      });
    });

    // 8. 粒子連線背景：進視野才畫、離開就停，reduced-motion 直接不畫（CSS 已隱藏 canvas）
    var particleStage = document.querySelector('[data-fx="particles"]');
    if (particleStage && !reduced) {
      var pCanvas = particleStage.querySelector('.fx-particles-canvas');
      if (pCanvas && 'IntersectionObserver' in window) {
        var pCtx = pCanvas.getContext('2d');
        var pRaf = null, pDots = [], pW = 0, pH = 0;
        var pColor = getComputedStyle(document.documentElement).getPropertyValue('--gold-pure').trim() || '#22d3ee';
        function pResize() {
          pW = pCanvas.width = pCanvas.offsetWidth;
          pH = pCanvas.height = pCanvas.offsetHeight;
        }
        function pFrame() {
          pCtx.clearRect(0, 0, pW, pH);
          pDots.forEach(function (d) {
            d.x += d.vx; d.y += d.vy;
            if (d.x < 0 || d.x > pW) d.vx *= -1;
            if (d.y < 0 || d.y > pH) d.vy *= -1;
          });
          pCtx.strokeStyle = pColor;
          for (var i = 0; i < pDots.length; i++) {
            for (var j = i + 1; j < pDots.length; j++) {
              var dx = pDots[i].x - pDots[j].x, dy = pDots[i].y - pDots[j].y;
              var dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 70) {
                pCtx.globalAlpha = 0.5 * (1 - dist / 70);
                pCtx.beginPath();
                pCtx.moveTo(pDots[i].x, pDots[i].y);
                pCtx.lineTo(pDots[j].x, pDots[j].y);
                pCtx.stroke();
              }
            }
          }
          pCtx.fillStyle = pColor; pCtx.globalAlpha = 0.85;
          pDots.forEach(function (d) {
            pCtx.beginPath(); pCtx.arc(d.x, d.y, d.r, 0, Math.PI * 2); pCtx.fill();
          });
          pRaf = requestAnimationFrame(pFrame);
        }
        function pStart() {
          if (pRaf) return;
          pResize();
          if (!pDots.length) {
            pDots = Array.from({ length: 34 }, function () {
              return { x: Math.random() * pW, y: Math.random() * pH, r: 1.6 + Math.random() * 1.4, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4 };
            });
          }
          pFrame();
        }
        function pStop() { cancelAnimationFrame(pRaf); pRaf = null; }
        window.addEventListener('resize', function () { if (pRaf) pResize(); });
        new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { en.isIntersecting ? pStart() : pStop(); });
        }, { threshold: 0.2 }).observe(particleStage);
      }
    }
  }
})();

/* 累計瀏覽人次（Cloudflare Worker + KV，真實計數）
   拿不到數字就整塊留著 hidden，不顯示任何預設／假數字。 */
(function () {
  var el = document.getElementById('visitCount');
  if (!el) return;
  // 只在正式網域上計數：本機預覽與稽核腳本不打這支 Worker，
  // 免得（a）本機測試灌爆真實數字（b）CORS 失敗在稽核時被當成全站 console 錯誤。
  var LIVE = ['tonpair.com', 'www.tonpair.com', 'tonpair.pages.dev'];
  if (LIVE.indexOf(location.hostname) === -1) return;
  fetch('https://tonpair-visits.tonpair711.workers.dev', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (d) {
      if (typeof d.count !== 'number') return;
      el.textContent = d.count.toLocaleString('en-US');
      var box = el.closest('.visit-counter');
      if (box) box.hidden = false;
    })
    .catch(function () { /* 靜默：維持 hidden，不顯示假數字 */ });
})();

/* FAQ 快速跳轉：點 .faq-jump 的連結或帶 #faq-N 進站時，把對應的手風琴題目展開再捲過去，
   不然使用者跳到的是一個關起來的 <details>，看起來像沒反應。 */
(function () {
  function openTarget(hash) {
    if (!hash) return;
    var el = document.querySelector(hash);
    if (el && el.tagName === 'DETAILS') el.open = true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('.faq-jump a[href^="#"]');
    if (a) openTarget(a.getAttribute('href'));
  });
  if (location.hash) openTarget(location.hash);
})();

/* 斷行保底：段落最後 4 個字綁在一起不拆行，避免末行只剩一兩個字（孤字）。
   只動「最後一個子節點是純文字」的區塊，文字內容不變，搜尋與 AI 讀到的一樣。 */
(function () {
  function fix(el) {
    var n = el.lastChild;
    while (n && n.nodeType === 3 && !n.nodeValue.trim()) n = n.previousSibling;
    if (!n || n.nodeType !== 3) return;
    var t = n.nodeValue.replace(/\s+$/, '');
    if (t.length < 9) return;
    var head = t.slice(0, -4), tail = t.slice(-4);
    if (/[\s]/.test(tail)) return;
    var span = document.createElement('span');
    span.className = 'tail-nowrap';
    span.textContent = tail;
    n.nodeValue = head;
    n.parentNode.insertBefore(span, n.nextSibling);
  }
  function run() {
    document.querySelectorAll('main p, main li, main td, main figcaption, main summary, .site-footer p').forEach(fix);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();

/* 網站效果區「看更多效果」：展開後把被隱藏的卡片補演一次最終狀態（隱藏時不會觸發進場動畫） */
(function () {
  var btn = document.getElementById('fxMore');
  var grid = document.getElementById('fxGrid');
  if (!btn || !grid) return;
  grid.classList.add('fx-collapsed');
  btn.parentNode.hidden = false;
  btn.addEventListener('click', function () {
    grid.classList.remove('fx-collapsed');
    btn.setAttribute('aria-expanded', 'true');
    btn.parentNode.hidden = true;
    grid.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    window.dispatchEvent(new Event('resize'));
  });
})();

/* 回到頂端鈕（2026-11-06 由 xmprintbase 樣板移植）：捲過 300px 才顯示，不需改任何頁面 HTML */
(function () {
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'to-top';
  b.hidden = true;
  b.setAttribute('aria-label', '回到頁面頂端');
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';
  document.body.appendChild(b);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  var tick = false;
  window.addEventListener('scroll', function () {
    if (tick) return;
    tick = true;
    requestAnimationFrame(function () { b.hidden = window.scrollY < 300; tick = false; });
  }, { passive: true });
})();

/* 首頁手機版：捲過 300px 前先淡出浮動聯絡鈕（2026-11-24）。原本會蓋住首屏次要按鈕與小字；
   首屏已有主要 CTA 與頁首按鈕，捲動後鈕就出現。沒有 JS 時維持顯示，內容不會不見 */
(function () {
  var fab = document.querySelector('.contact-fab');
  if (!fab || !document.querySelector('.hero')) return;
  var tick = false;
  function sync() { fab.classList.toggle('fab-quiet', window.scrollY < 300); tick = false; }
  sync();
  window.addEventListener('scroll', function () {
    if (tick) return;
    tick = true;
    requestAnimationFrame(sync);
  }, { passive: true });
})();

/* 文章分享框（2026-11-06 由 hunglun2026 移植）：只加在知識庫與案例文章尾端。
   手機優先用系統分享選單，沒有就複製連結 */
(function () {
  var p = location.pathname;
  if (!/^\/(knowledge|cases)\/[^\/]+/.test(p)) return;
  var anchor = document.querySelector('main .prose-cta') || document.querySelector('main .prose');
  if (!anchor) return;
  var box = document.createElement('div');
  box.className = 'share-box';
  box.innerHTML = '<span class="share-label">覺得有用？分享給需要的朋友</span><button type="button" class="share-btn">分享這篇</button>';
  anchor.parentNode.insertBefore(box, anchor.nextSibling);
  var btn = box.querySelector('button');
  btn.addEventListener('click', function () {
    var data = { title: document.title, url: location.href.split('#')[0] };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    var done = function () { btn.textContent = '已複製連結'; setTimeout(function () { btn.textContent = '分享這篇'; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(data.url).then(done, function () {});
  });
})();
