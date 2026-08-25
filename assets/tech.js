/* 對頻設計 tonpair — 首頁科技風附加行為 v3（2026-08-25）
   1) hero 的對頻波 canvas：兩條青藍正弦波緩慢相位錯開→重合
   2) 表頭捲過 hero 後由透明轉為亮底
   只有 index.html 引用；定案後併回 main.js。 */
(function () {
  'use strict';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 表頭：捲過 hero 換色 ---------- */
  var header = document.querySelector('.site-header');
  var hero = document.querySelector('.hero');
  if (header && hero && document.body.classList.contains('home-hero')) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > hero.offsetHeight - 90);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- 對頻波 ---------- */
  var cv = document.getElementById('tonWave');
  if (!cv || reduced) return;
  var cx = cv.getContext('2d');
  if (!cx) return;

  var w = 0, h = 0, running = false, raf = 0, t = 0;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = cv.offsetWidth; h = cv.offsetHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame() {
    if (!running) return;
    cx.clearRect(0, 0, w, h);
    var mid = h * 0.74, amp = Math.min(52, h * 0.09);
    var drift = Math.sin(t * 0.16) * Math.PI;   // 相位錯開 → 重合 → 再錯開
    var waves = [[0, 'rgba(34,211,238,.55)', 2], [drift, 'rgba(34,211,238,.28)', 1.4]];
    for (var i = 0; i < waves.length; i++) {
      cx.beginPath();
      cx.lineWidth = waves[i][2];
      cx.strokeStyle = waves[i][1];
      for (var x = 0; x <= w; x += 3) {
        // 兩端收斂到中線，波形不會被切斷在邊緣
        var y = mid + Math.sin(x / 165 + t * 0.5 + waves[i][0]) * amp * Math.sin(x / w * Math.PI);
        if (x) { cx.lineTo(x, y); } else { cx.moveTo(x, y); }
      }
      cx.stroke();
    }
    t += 0.012;
    raf = requestAnimationFrame(frame);
  }

  function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

  resize();
  window.addEventListener('resize', function () { resize(); }, { passive: true });

  /* 離開可視範圍就停畫，不在背景空轉 */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? start() : stop();
    }, { threshold: 0 }).observe(cv);
  } else {
    start();
  }
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });
})();
