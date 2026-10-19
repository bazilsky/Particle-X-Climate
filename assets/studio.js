/**
 * Particle X Climate — Studio cinematic interface behaviour.
 * Landing + Overwatch: header turns solid once past the ink hero; hero glow parallax and copy fade.
 * Respects prefers-reduced-motion (no parallax/fade, header still turns solid).
 */
(function () {
  'use strict';
  var body = document.body;
  if (!body || !(body.classList.contains('landing') || body.classList.contains('overwatch'))) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var head = document.querySelector('.lp-head') || document.querySelector('.overwatch header');
  var hero = document.querySelector('.overwatch .hero, .landing .lp-hero');
  var glow = document.querySelector('.overwatch .hero-bg');
  var copy = document.querySelector('.overwatch .hero > div:not(.hero-bg)');
  var ticking = false;
  function update() {
    ticking = false;
    var y = window.scrollY;
    if (head) {
      var th = (hero ? hero.offsetHeight : 300) - 70;
      head.classList.toggle('head-solid', y > Math.max(40, th));
    }
    if (reduce) return;
    if (glow) glow.style.transform = 'translateY(' + (y * 0.35).toFixed(1) + 'px)';
    if (copy && y < window.innerHeight * 1.2) {
      copy.style.transform = 'translateY(' + (y * 0.18).toFixed(1) + 'px)';
      copy.style.opacity = String(Math.max(0.2, 1 - y / (window.innerHeight * 0.9)));
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('pageshow', update);
  update();
})();
