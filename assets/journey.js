/* journey.html 專用（2026-09-07 新增）
   ① 頂端捲動進度條：純視覺點綴，跟 reduced-motion 無關（沒有動畫，只是隨捲動位置定寬）
   ② 統計數字滾動：跟 main.js 的 fx-num 同一種手法，reduced-motion 直接給最終值 */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var track = document.getElementById('jnJourney');
  var fill = document.getElementById('jnProgressFill');
  if (track && fill) {
    function onScroll() {
      var r = track.getBoundingClientRect();
      var total = r.height - window.innerHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      fill.style.width = (p * 100) + '%';
    }
    window.addEventListener('scroll', function () { requestAnimationFrame(onScroll); }, { passive: true });
    window.addEventListener('resize', function () { requestAnimationFrame(onScroll); });
    onScroll();
  }

  var stats = document.querySelectorAll('.jn-stat-num[data-count-to]');
  if (!stats.length) return;

  function paint(el, v) { el.textContent = v.toLocaleString('en-US'); }

  if (reduced || !('IntersectionObserver' in window)) {
    stats.forEach(function (el) { paint(el, parseInt(el.getAttribute('data-count-to'), 10) || 0); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      var el = en.target;
      var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
      var start = null, dur = 1100;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        paint(el, Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  stats.forEach(function (el) { io.observe(el); });
})();
