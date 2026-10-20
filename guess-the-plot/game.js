/* Guess the Plot. Reads window.PXC_GTP_WEEKS (weeks.js). No server, no tracking, no storage. */
(function () {
  'use strict';
  var all = (window.PXC_GTP_WEEKS || []).slice().sort(function (a, b) { return a.id < b.id ? 1 : a.id > b.id ? -1 : 0; });
  var game = document.getElementById('game');
  if (!all.length || !game) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var real = all.filter(function (w) { return !w.placeholder; });
  var listed = real.length ? real : all;

  var params = new URLSearchParams(window.location.search);
  var asked = params.get('week');
  var week = (asked && all.filter(function (w) { return w.id === asked; })[0]) || listed[0];
  var isLatest = week === listed[0];

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function link(href, text) { var a = el('a', null, text); a.href = href; return a; }
  function fmtDate(id) {
    var p = id.split('-'), m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (+p[2]) + ' ' + m[(+p[1]) - 1] + ' ' + p[0];
  }
  // deterministic shuffle per week id
  function seeded(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h += 0x6D2B79F5; var t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function shuffle(arr, id) {
    var r = seeded(id), a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // header
  $('gtp-week').textContent = (isLatest ? "This week's plot · " : 'From the archive · ') + fmtDate(week.id);
  var title = $('gtp-paper-title');
  if (week.doiUrl) { var ta = link(week.doiUrl, week.paperTitle); ta.rel = 'noopener'; title.appendChild(ta); } else title.textContent = week.paperTitle;
  $('gtp-byline').textContent = week.placeholder ? week.figureLabel : [week.authors + ' (' + week.year + ')', week.venue, week.figureLabel].filter(Boolean).join(' · ');
  $('gtp-test').hidden = !week.placeholder;
  if (!isLatest || week.placeholder) document.title = 'Guess the Plot · ' + fmtDate(week.id) + ' · Particle X Climate';

  // figure + covers
  var fig = $('gtp-figure'), img = $('gtp-img');
  if (week.imageWidth && week.imageHeight) { img.width = week.imageWidth; img.height = week.imageHeight; }
  img.src = week.image;
  img.alt = week.imageAlt || '';
  (week.masks || []).forEach(function (m) {
    var c = el('div', 'gtp-cover');
    c.setAttribute('aria-hidden', 'true');
    c.style.left = (m.x * 100) + '%'; c.style.top = (m.y * 100) + '%';
    c.style.width = (m.w * 100) + '%'; c.style.height = (m.h * 100) + '%';
    c.dataset.label = m.label || '';
    fig.appendChild(c);
  });
  var labels = (week.masks || []).map(function (m) { return m.label; }).filter(Boolean);
  $('gtp-covered').textContent = labels.length ? 'Covered on the figure: ' + labels.join(', ') + '.' : '';

  // credit (always visible)
  var cr = $('gtp-credit'), c = week.credit || { type: 'original' };
  var sentence = c.text || (c.type === 'redrawn'
    ? 'Redrawn from ' + week.authors + ' (' + week.year + ')' + (week.figureLabel ? ', ' + week.figureLabel : '') + '.'
    : (week.figureLabel || 'Figure') + ' from ' + week.authors + ' (' + week.year + '), ' + week.venue + '.');
  cr.appendChild(document.createTextNode(sentence + ' '));
  if (c.dataSource && c.dataSource.url) { cr.appendChild(document.createTextNode('Data: ')); cr.appendChild(link(c.dataSource.url, c.dataSource.text || 'source')); cr.appendChild(document.createTextNode('. ')); }
  if (week.licence) {
    cr.appendChild(document.createTextNode('Licence: '));
    var la = link(week.licence.url, week.licence.name); la.rel = 'license noopener'; cr.appendChild(la);
    cr.appendChild(document.createTextNode('. '));
  }
  if (week.doiUrl) { var da = link(week.doiUrl, week.doiUrl.replace(/^https?:\/\//, '')); da.rel = 'noopener'; cr.appendChild(da); }

  // options
  var opts = week.options || [];
  if (opts.length !== 3 || opts.filter(function (o) { return o.correct; }).length !== 1) {
    if (window.console) console.warn('Guess the Plot: week ' + week.id + ' should have 3 options with exactly one correct.');
  }
  var box = $('gtp-options'), fb = $('gtp-feedback'), buttons = [];
  shuffle(opts, 'gtp:' + week.id).forEach(function (o, i) {
    var b = el('button', 'gtp-opt');
    b.type = 'button';
    b.appendChild(el('span', 'k', String.fromCharCode(65 + i)));
    b.appendChild(el('span', 't', o.text));
    b._opt = o;
    b.addEventListener('click', function () { pick(b); });
    box.appendChild(b); buttons.push(b);
  });
  function pick(b) {
    var right = !!b._opt.correct, real = null;
    buttons.forEach(function (x) {
      x.disabled = true;
      if (x._opt.correct) { x.classList.add('is-correct'); real = x; }
      else if (x === b) x.classList.add('is-wrong');
      else x.classList.add('is-dim');
      x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
    });
    fb.className = 'gtp-feedback ' + (right ? 'ok' : 'no');
    fb.textContent = right ? 'You got it.' : 'Close — here’s the real one: ' + (real ? real._opt.text : '') + '.';
    $('gtp-step1').hidden = false;
    $('gtp-reveal-labels').focus();
  }

  function show(panel) {
    panel.hidden = false;
    panel.focus({ preventScroll: true });
    var r = panel.getBoundingClientRect();
    if (r.bottom > window.innerHeight || r.top < 0) panel.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }
  $('gtp-labels-text').textContent = week.labelsText || '';
  $('gtp-point-text').textContent = week.mainPoint || '';
  var idea = $('gtp-idea');
  if (week.ideaPathUrl) idea.href = week.ideaPathUrl; else idea.hidden = true;

  $('gtp-reveal-labels').addEventListener('click', function () {
    fig.classList.add('is-revealed');
    if (week.imageAltRevealed) img.alt = week.imageAltRevealed;
    $('gtp-covered').textContent = 'The labels are now uncovered.';
    $('gtp-step1').hidden = true;
    show($('gtp-labels'));
  });
  $('gtp-reveal-point').addEventListener('click', function () {
    this.parentNode.hidden = true;
    show($('gtp-point'));
  });

  game.hidden = false;

  // archive
  var list = $('gtp-weeks'), archive = $('archive');
  var shown = listed.indexOf(week) === -1 ? [week].concat(listed) : listed;
  shown.forEach(function (w) {
    var li = el('li'), inner;
    if (w === week) { inner = el('div', 'cur'); inner.setAttribute('aria-current', 'page'); }
    else { inner = link(w === listed[0] ? '/guess-the-plot' : '/guess-the-plot?week=' + encodeURIComponent(w.id)); }
    inner.appendChild(el('span', 'd', fmtDate(w.id) + (w === week ? ' · playing now' : '')));
    inner.appendChild(el('span', 't', w.paperTitle));
    inner.appendChild(el('span', 's', w.placeholder ? 'Test week' : w.authors + ' (' + w.year + ') · ' + w.figureLabel));
    li.appendChild(inner); list.appendChild(li);
  });
  $('archive-note').textContent = shown.length === 1 ? 'Each Thursday’s plot stays here, so you can play past weeks too.' : 'Past weeks stay playable. Pick one to try it.';
  if (asked && asked !== week.id) $('archive-note').textContent = 'That week isn’t in the archive yet, so here is the latest plot.';
  archive.hidden = false;
})();
