/* ==========================================================================
   對頻設計 tonpin — 全站共用 JS
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

  /* ---------- Hero 對頻波（2D canvas，取代原本的 Three.js 開場） ----------
     兩條金色正弦波緩慢相位錯開、每 9 秒對上一次＝對頻意象。畫在 hero 背景，不擋互動；
     離開可視範圍就停畫，手機降低取樣密度。 */
  var canvas = document.getElementById('resonanceCanvas');
  if (canvas && !reduced) {
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var running = true, t = 0;

    function resize() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function wave(phase, amp, yBase, alpha, color) {
      ctx.beginPath();
      var step = w < 700 ? 8 : 5;
      for (var x = 0; x <= w; x += step) {
        var k = x / w;
        // 兩端收斂、中段飽滿，避免線條在邊緣被硬切
        var envelope = Math.sin(Math.PI * k);
        var y = yBase
          + Math.sin(k * 7.5 + phase) * amp * envelope
          + Math.sin(k * 3.1 - phase * 0.6) * amp * 0.45 * envelope;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      var gold = getComputedStyle(document.documentElement).getPropertyValue('--gold-pure').trim() || '#f5b942';
      var blue = getComputedStyle(document.documentElement).getPropertyValue('--accent-bright').trim() || '#19a7ce';
      t += 0.006;
      var mid = h * 0.58;
      wave(t, h * 0.09, mid, 0.5, gold);
      wave(t + 1.15, h * 0.07, mid + 26, 0.32, gold);
      wave(t * 0.8 + 2.4, h * 0.11, mid - 34, 0.22, blue);
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !running) { running = true; requestAnimationFrame(frame); }
          else if (!e.isIntersecting) { running = false; }
        });
      }, { threshold: 0 }).observe(canvas);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- 手機底部諮詢列：捲過 hero 才浮現 ---------- */
  var sticky = document.querySelector('.sticky-cta');
  if (sticky) {
    document.body.classList.add('has-sticky-cta');
    var onScroll = function () { sticky.classList.toggle('on', window.scrollY > 420); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- 聯絡表單：?topic= 預填 ＋ mailto 送出 ---------- */
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
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(this);
      var pains = d.getAll('pain').join('、') || '（未勾選）';
      var body = [
        '姓名：' + d.get('name'),
        '店家/單位：' + (d.get('organization') || '（未填）'),
        'Email：' + d.get('email'),
        'LINE ID：' + (d.get('line') || '（未填）'),
        '想了解：' + d.get('topic'),
        '目前狀況：' + pains,
        '',
        '想說的話：',
        d.get('message') || '（未填）'
      ].join('\n');
      location.href = 'mailto:steve.edu711@gmail.com?subject=' +
        encodeURIComponent('【免費諮詢】' + d.get('topic')) +
        '&body=' + encodeURIComponent(body);
      var status = document.getElementById('formStatus');
      if (status) status.hidden = false;
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
})();
