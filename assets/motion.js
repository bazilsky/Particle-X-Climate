/**
 * Particle X Climate — motion layer.
 * Page enter, scroll reveal, view-transition + JS nav fallback, header scroll.
 * Content stays visible without JS (html.js-ready gates hide styles).
 */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STAGGER = 90;
  var ENTER_SELECTOR = '.motion-enter, .motion-line';
  var REVEAL_SELECTOR = '.motion-reveal';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function markIn(el, delay) {
    if (delay) el.style.transitionDelay = delay + 'ms';
    void el.offsetWidth;
    el.classList.add('is-in');
  }

  function clearLeaving() {
    document.documentElement.classList.remove('pxc-leaving');
    if (document.body) {
      document.body.style.opacity = '';
      document.body.style.transform = '';
    }
  }

  function runEnter() {
    var nodes = document.querySelectorAll(ENTER_SELECTOR);
    if (!nodes.length) return;
    if (reduce) {
      nodes.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        nodes.forEach(function (el, i) {
          markIn(el, i * STAGGER);
        });
      });
    });
  }

  function runReveal() {
    var nodes = document.querySelectorAll(REVEAL_SELECTOR);
    if (!nodes.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      nodes.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = Number(el.getAttribute('data-delay') || 0);
          markIn(el, delay);
          io.unobserve(el);
        });
      },
      { rootMargin: '0px 0px 10% 0px', threshold: 0.02 }
    );
    nodes.forEach(function (el) {
      if (!el.hasAttribute('data-delay')) {
        var sibs = el.parentElement
          ? Array.prototype.indexOf.call(el.parentElement.children, el)
          : 0;
        el.setAttribute('data-delay', String(Math.max(0, sibs) * 70));
      }
      io.observe(el);
    });
  }

  function headerScroll() {
    var header = document.querySelector('header');
    if (!header) return;
    var onScroll = function () {
      if (window.scrollY > 12) header.classList.add('pxc-header-scrolled');
      else header.classList.remove('pxc-header-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function sameOriginInternal(a) {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('javascript:') === 0) return false;
    try {
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return false;
      if (url.pathname === location.pathname && url.search === location.search) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  /** JS fade-out fallback when cross-document View Transitions are unavailable. */
  function wireNavFallback() {
    if (reduce) return;
    if ('onpagereveal' in window) return; // Chromium VT navigation handles it

    document.addEventListener(
      'click',
      function (ev) {
        if (ev.defaultPrevented) return;
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
        if (ev.button !== 0) return;
        var a = ev.target.closest && ev.target.closest('a');
        if (!sameOriginInternal(a)) return;
        ev.preventDefault();
        var href = a.href;
        document.documentElement.classList.add('pxc-leaving');
        window.setTimeout(function () {
          location.href = href;
        }, 250);
      },
      true
    );
  }

  // bfcache / Back-Forward: never leave the page stuck faded out
  window.addEventListener('pageshow', function (ev) {
    clearLeaving();
    if (ev.persisted) {
      // Re-run enter so restored pages aren't mid-hidden
      document.querySelectorAll(ENTER_SELECTOR + ', ' + REVEAL_SELECTOR).forEach(function (el) {
        el.classList.add('is-in');
        el.style.opacity = '';
        el.style.transform = '';
      });
    }
  });

  // Also clear on pagehide cancel / visibility (safety)
  window.addEventListener('pagehide', function () {
    // leave pxc-leaving if we set it intentionally for outbound nav
  });

  ready(function () {
    clearLeaving();
    runEnter();
    runReveal();
    headerScroll();
    wireNavFallback();
  });
})();
