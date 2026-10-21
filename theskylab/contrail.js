/* Contrail Catcher — Sky Lab game. Vanilla canvas, no dependencies.
   Physics, kept simple and honest: standard-atmosphere temperature (15 °C at the surface, −6.5 °C per km up to an 11 km
   tropopause, −56.5 °C above). A contrail persists only where the air is colder than about −40 °C (Schmidt-Appleman
   criterion, simplified to one threshold) and inside an ice-supersaturated layer. Layers are a few hundred metres deep at
   8 to 11 km; the air above the tropopause is dry. Fuel: about 0.6 % extra per 1,000 ft away from FL340 for the share of
   the route flown there, plus 0.1 % per 1,000 ft climbed. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), cv = $('sky'), ctx = cv.getContext('2d');
  var startCard = $('startCard'), pauseCard = $('pauseCard'), overCard = $('overCard'), pauseBtn = $('pauseBtn');
  var elTrail = $('trail'), elFuel = $('fuel'), elBest = $('best'), elFL = $('flOut'), climbBtn = $('climbBtn'), descendBtn = $('descendBtn');
  var BEST_KEY = 'pxc.studio.contrail.best';
  var best = 0;
  try { best = parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) {}
  elBest.textContent = best;

  var ROUTE = 1500, SPEED = 20, VIEW = 420;          // km, km per game second (75 s flight), km visible
  var FL_MIN = 240, FL_MAX = 400, FL_OPT = 340, RATE = 10; // flight levels; RATE = FL per second (1,000 ft/s game time)
  var Z_LO = 6.6, Z_HI = 13;                           // km shown
  var SA = -40, TROPO = 11;
  function flKm(fl) { return fl * 100 * 0.3048 / 1000; }
  function tempAt(z) { return 15 - 6.5 * Math.min(z, TROPO); }
  var Z_SA = (15 - SA) / 6.5;                          // height of the −40 °C line (about 8.5 km)

  /* ---------- humid layers ---------- */
  function makeLayers() {
    var L = [], x = 90;
    while (x < ROUTE - 60) {
      var len = 80 + Math.random() * 220, r = Math.random(), zc;
      if (r < 0.6) zc = 9.9 + Math.random() * 1.0;      // FL325–FL355: right across the best cruise level
      else if (r < 0.85) zc = 8.7 + Math.random() * 1.1;
      else zc = 7.4 + Math.random() * 1.1;              // warmer than −40 °C: humid but no lasting contrail
      L.push({ x0: x, x1: Math.min(ROUTE, x + len), zc: zc, th: 0.4 + Math.random() * 0.45, s: Math.random() * 6 });
      if (Math.random() < 0.35) {                       // a second layer stacked near the first
        var z2 = zc + (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 0.4);
        if (z2 < TROPO + 0.1 && z2 > 7.2) L.push({ x0: x + len * 0.2, x1: Math.min(ROUTE, x + len * 0.9), zc: z2, th: 0.35 + Math.random() * 0.35, s: Math.random() * 6 });
      }
      x += len + 40 + Math.random() * 130;
    }
    return L;
  }
  function halfAt(l, x) {
    if (x <= l.x0 || x >= l.x1) return 0;
    var u = (x - (l.x0 + l.x1) / 2) / ((l.x1 - l.x0) / 2);
    return l.th / 2 * Math.sqrt(Math.max(0, 1 - Math.pow(u, 4))) * (1 + 0.12 * Math.sin(x * 0.03 + l.s));
  }
  function humidAt(x, z) {
    for (var i = 0; i < G.layers.length; i++) { var l = G.layers[i], h = halfAt(l, x); if (h && Math.abs(z - l.zc) < h) return true; }
    return false;
  }
  function persists(x, z) { return tempAt(z) < SA && humidAt(x, z); }

  var W = 0, H = 0, dpr = 1, mode = 'start', last = 0, clock = 0, G;
  function fresh() {
    return { layers: makeLayers(), x: 0, fl: FL_OPT, target: FL_OPT, trail: [], ckm: 0, offFuel: 0, climbFuel: 0, inTrail: false, lastPt: -9 };
  }
  function fuel() { return G.offFuel + G.climbFuel; }
  function score() { return Math.max(0, Math.round(1000 * (1 - G.ckm / ROUTE) - 100 * fuel())); }
  function setTarget(fl) {
    if (mode !== 'play') return;
    G.target = Math.max(FL_MIN, Math.min(FL_MAX, Math.round(fl / 10) * 10)); hud();
  }
  function hud() {
    elTrail.textContent = Math.round(G.ckm) + ' km';
    elFuel.textContent = fuel().toFixed(1) + '%';
    elFL.textContent = 'FL' + G.target;
  }
  function over() {
    mode = 'over';
    var sc = score(), nb = sc > best;
    if (nb) { best = sc; elBest.textContent = best; try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {} }
    hud();
    $('overKicker').textContent = 'Flight complete';
    $('overReason').textContent = G.ckm < 15 ? 'Clear skies behind you' : G.ckm < 80 ? 'A few lasting contrails' : 'A long contrail trail';
    $('overScore').textContent = sc;
    $('overBest').textContent = (nb ? 'New best · ' : 'Best ' + best + ' · ') + Math.round(G.ckm) + ' km of lasting contrail · +' + fuel().toFixed(1) + '% fuel';
    overCard.hidden = false; climbBtn.disabled = descendBtn.disabled = true;
    pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false');
  }
  function start() {
    G = fresh(); mode = 'play';
    startCard.hidden = overCard.hidden = pauseCard.hidden = true;
    climbBtn.disabled = descendBtn.disabled = false;
    pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false');
    hud();
    var r = stage.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) stage.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }
  function togglePause() {
    if (mode === 'play') { mode = 'pause'; pauseCard.hidden = false; pauseBtn.textContent = 'Resume'; pauseBtn.setAttribute('aria-pressed', 'true'); }
    else if (mode === 'pause') { mode = 'play'; pauseCard.hidden = true; pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false'); }
  }
  function step(dt) {
    var dx = Math.min(SPEED * dt, ROUTE - G.x);
    var d = G.target - G.fl, mv = Math.sign(d) * Math.min(Math.abs(d), RATE * dt);
    if (mv > 0) G.climbFuel += mv / 10 * 0.1;
    G.fl += mv;
    G.offFuel += Math.abs(G.fl - FL_OPT) / 10 * 0.6 * dx / ROUTE;
    G.x += dx;
    var z = flKm(G.fl), p = persists(G.x, z);
    if (p) G.ckm += dx;
    G.inTrail = p;
    if (G.x - G.lastPt >= 3) { G.trail.push({ x: G.x, z: z, p: p }); G.lastPt = G.x; }
    while (G.trail.length && G.trail[0].x < G.x - VIEW) G.trail.shift();
    if (G.x >= ROUTE) over();
  }

  /* ---------- drawing ---------- */
  function resize() {
    var r = stage.getBoundingClientRect();
    W = Math.max(200, Math.floor(r.width)); H = Math.max(200, Math.floor(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function geom() { var top = W < 500 ? 88 : 74, left = W < 500 ? 46 : 58; return { top: top, bot: H - 26, left: left, right: W - 12, px: left + (W - left - 12) * 0.28 }; }
  function zy(g, z) { return g.bot - (z - Z_LO) / (Z_HI - Z_LO) * (g.bot - g.top); }
  function xs(g, x) { return g.px + (x - G.x) / VIEW * (g.right - g.left); }
  function drawSky(g) {
    var sk = ctx.createLinearGradient(0, g.top, 0, g.bot);
    sk.addColorStop(0, '#15202a'); sk.addColorStop(0.35, '#22394a'); sk.addColorStop(1, '#4d6f7d');
    ctx.fillStyle = '#1c1915'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = sk; ctx.fillRect(g.left, g.top, g.right - g.left, g.bot - g.top);
    // stratosphere above the tropopause: dry
    ctx.fillStyle = 'rgba(21,19,15,.35)'; ctx.fillRect(g.left, g.top, g.right - g.left, zy(g, TROPO) - g.top);
  }
  function drawLayers(g) {
    ctx.save(); ctx.beginPath(); ctx.rect(g.left, g.top, g.right - g.left, g.bot - g.top); ctx.clip();
    var x0 = G.x - VIEW * 0.3, x1 = G.x + VIEW * 0.75;
    for (var i = 0; i < G.layers.length; i++) {
      var l = G.layers[i]; if (l.x1 < x0 || l.x0 > x1) continue;
      var cold = tempAt(l.zc) < SA;
      ctx.beginPath();
      var a = Math.max(l.x0, x0), b = Math.min(l.x1, x1), n = 40, k, x;
      for (k = 0; k <= n; k++) { x = a + (b - a) * k / n; ctx[k ? 'lineTo' : 'moveTo'](xs(g, x), zy(g, l.zc + halfAt(l, x))); }
      for (k = n; k >= 0; k--) { x = a + (b - a) * k / n; ctx.lineTo(xs(g, x), zy(g, l.zc - halfAt(l, x))); }
      ctx.closePath();
      ctx.fillStyle = cold ? 'rgba(159,216,187,.30)' : 'rgba(246,241,231,.10)'; ctx.fill();
      ctx.strokeStyle = cold ? 'rgba(159,216,187,.75)' : 'rgba(246,241,231,.3)'; ctx.setLineDash(cold ? [] : [3, 4]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    }
    // contrails
    for (var j = 1; j < G.trail.length; j++) {
      var q = G.trail[j - 1], p = G.trail[j], age = (G.x - p.x) / SPEED;
      var X = xs(g, p.x), Y = zy(g, p.z), Xq = xs(g, q.x), Yq = zy(g, q.z);
      if (p.p) {
        var wdt = 2 + (reduce ? 4 : Math.min(14, age * 2.2));
        ctx.strokeStyle = 'rgba(246,241,231,' + Math.max(0.25, 0.85 - age * 0.03).toFixed(3) + ')'; ctx.lineWidth = wdt;
      } else {
        var fa = 0.7 - age * 0.9; if (fa <= 0) continue;
        ctx.strokeStyle = 'rgba(246,241,231,' + fa.toFixed(3) + ')'; ctx.lineWidth = 1.5;
      }
      ctx.beginPath(); ctx.moveTo(Xq, Yq); ctx.lineTo(X, Y); ctx.stroke();
    }
    ctx.restore();
  }
  function drawGuides(g) {
    ctx.font = '600 10px "Source Sans 3", sans-serif';
    // −40 °C line and tropopause
    [[Z_SA, '−40 °C', [6, 4]], [TROPO, 'TROPOPAUSE', [2, 4]]].forEach(function (L) {
      var y = zy(g, L[0]) + 0.5; ctx.strokeStyle = 'rgba(217,191,138,.7)'; ctx.setLineDash(L[2]);
      ctx.beginPath(); ctx.moveTo(g.left, y); ctx.lineTo(g.right, y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#e6cf9c'; ctx.textAlign = 'right'; ctx.fillText(L[1], g.right - 6, y - 5);
    });
    // flight level scale
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(246,241,231,.75)';
    for (var fl = FL_MIN; fl <= FL_MAX; fl += 40) { var y = zy(g, flKm(fl)); ctx.fillText('FL' + fl, g.left - 6, y + 3); ctx.fillStyle = 'rgba(246,241,231,.12)'; ctx.fillRect(g.left, y, g.right - g.left, 1); ctx.fillStyle = 'rgba(246,241,231,.75)'; }
    // best cruise level
    var yo = zy(g, flKm(FL_OPT)); ctx.fillStyle = '#d9bf8a'; ctx.fillRect(g.left - 4, yo - 1, 4, 3);
    // target level marker
    if (mode === 'play' || mode === 'pause') {
      var yt = zy(g, flKm(G.target)); ctx.strokeStyle = 'rgba(246,241,231,.55)'; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(g.px, yt + 0.5); ctx.lineTo(g.right, yt + 0.5); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  function drawPlane(g) {
    var X = g.px, Y = zy(g, flKm(G.fl)), s = W < 500 ? 8 : 10, tilt = Math.max(-0.25, Math.min(0.25, (G.fl - G.target) / 40));
    ctx.save(); ctx.translate(X, Y); ctx.rotate(tilt);
    ctx.fillStyle = '#f6f1e7';
    ctx.beginPath(); ctx.moveTo(s * 1.6, 0); ctx.lineTo(-s * 1.4, -s * 0.28); ctx.lineTo(-s * 1.4, s * 0.28); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s * 0.2, 0); ctx.lineTo(-s * 0.5, -s * 1.1); ctx.lineTo(-s * 0.85, -s * 1.1); ctx.lineTo(-s * 0.4, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * 1.0, 0); ctx.lineTo(-s * 1.4, -s * 0.7); ctx.lineTo(-s * 1.55, -s * 0.7); ctx.lineTo(-s * 1.35, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawStatus(g) {
    var small = W < 500, z = flKm(G.fl), T = tempAt(z);
    ctx.textAlign = 'left'; ctx.font = '600 11px "Source Sans 3", sans-serif'; ctx.fillStyle = 'rgba(217,191,138,.95)';
    ctx.fillText('ROUTE ' + Math.round(G.x) + ' OF ' + ROUTE.toLocaleString('en-GB') + ' KM', 16, 24);
    ctx.font = '500 ' + (small ? 19 : 23) + 'px Fraunces, Georgia, serif'; ctx.fillStyle = '#f6f1e7';
    ctx.fillText('FL' + Math.round(G.fl) + ' · ' + z.toFixed(1) + ' km · ' + (Math.round(T) < 0 ? '−' + Math.abs(Math.round(T)) : Math.round(T)) + ' °C', 16, small ? 48 : 54);
    var msg = mode === 'start' ? 'Best cruise level FL340' : G.inTrail ? 'Lasting contrail forming' : humidAt(G.x, z) ? 'Humid but warmer than −40 °C: short contrail' : 'Short contrail only';
    ctx.font = '600 12px "Source Sans 3", sans-serif'; ctx.fillStyle = G.inTrail ? '#f2ab94' : 'rgba(246,241,231,.8)';
    if (small) { ctx.textAlign = 'left'; ctx.fillText(msg, 16, 70); } else { ctx.textAlign = 'right'; ctx.fillText(msg, W - 16, 24); }
    // progress bar
    ctx.fillStyle = 'rgba(246,241,231,.15)'; ctx.fillRect(g.left, H - 12, g.right - g.left, 3);
    ctx.fillStyle = '#d9bf8a'; ctx.fillRect(g.left, H - 12, (g.right - g.left) * G.x / ROUTE, 3);
  }
  function draw() {
    if (!W || !G) return;
    var g = geom();
    drawSky(g); drawLayers(g); drawGuides(g); drawPlane(g); drawStatus(g);
  }
  var hudT = 0;
  function loop(now) {
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (mode !== 'pause') clock += dt;
    if (mode === 'play') { step(dt); hudT += dt; if (hudT > 0.1 && mode === 'play') { hudT = 0; hud(); } }
    draw();
    requestAnimationFrame(loop);
  }

  /* ---------- input ---------- */
  var dragging = false;
  function flAtY(e) {
    var r = cv.getBoundingClientRect(), y = e.clientY - r.top, g = geom();
    var z = Z_LO + (g.bot - y) / (g.bot - g.top) * (Z_HI - Z_LO);
    return z * 1000 / 0.3048 / 100;
  }
  cv.addEventListener('pointerdown', function (e) {
    if (mode !== 'play') return;
    e.preventDefault(); dragging = true; setTarget(flAtY(e));
    try { cv.setPointerCapture(e.pointerId); } catch (x) {}
  });
  cv.addEventListener('pointermove', function (e) { if (dragging && mode === 'play') setTarget(flAtY(e)); });
  ['pointerup', 'pointercancel'].forEach(function (ev) { cv.addEventListener(ev, function () { dragging = false; }); });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) return;
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault(); if (mode === 'start' || mode === 'over') start();
    } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (mode === 'play' || mode === 'pause') togglePause();
    } else if (mode === 'play') {
      var m = { ArrowUp: 10, w: 10, W: 10, ArrowDown: -10, s: -10, S: -10 }[e.key];
      if (m) { e.preventDefault(); setTarget(G.target + m); }
    }
  });
  climbBtn.addEventListener('click', function () { if (mode === 'play') setTarget(G.target + 10); });
  descendBtn.addEventListener('click', function () { if (mode === 'play') setTarget(G.target - 10); });
  $('startBtn').addEventListener('click', start);
  $('againBtn').addEventListener('click', start);
  $('restartBtn').addEventListener('click', start);
  $('resumeBtn').addEventListener('click', togglePause);
  pauseBtn.addEventListener('click', function () { if (mode === 'play' || mode === 'pause') togglePause(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && mode === 'play') togglePause(); });

  G = fresh(); hud();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);
})();
