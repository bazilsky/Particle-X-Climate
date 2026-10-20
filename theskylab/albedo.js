/* Albedo Tap — Studio prototype. Vanilla canvas, no dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), cv = $('sky'), ctx = cv.getContext('2d');
  var startCard = $('startCard'), pauseCard = $('pauseCard'), overCard = $('overCard'), pauseBtn = $('pauseBtn');
  var elIn = $('inband'), elBest = $('best'), elPuffs = $('puffs');

  var BEST_KEY = 'pxc.studio.albedo.best';
  var best = 0;
  try { best = parseFloat(localStorage.getItem(BEST_KEY)) || 0; } catch (e) {}
  elBest.textContent = best.toFixed(1);

  var TAU = 3.2;          // puff e-folding time (s); visibly gone by ~10 s
  var COOL = 2.5;         // cooling per unit puff amplitude (units/s)
  var SAT = 3;            // diminishing returns: total aerosol effect saturates near SAT puffs
  var W = 0, H = 0, dpr = 1;
  var mode = 'start', last = 0, phase = 0, clock = 0;
  var G; // game state

  function fresh() {
    return { T: 50, elapsed: 0, inBand: 0, puffs: [], burst: 0, burstLeft: 0, burstTimer: 9, noise: 0, flash: 0, total: 0 };
  }
  function band() {
    var hw = Math.max(6, 11 - G.elapsed * 0.05);
    return [50 - hw, 50 + hw];
  }
  function warming() { return Math.min(6.5, 2.3 + G.elapsed * 0.035); }

  // stars + continents (decorative)
  var stars = []; for (var i = 0; i < 90; i++) stars.push([Math.random(), Math.random(), Math.random() * 1.2 + 0.3, Math.random() * 6]);
  var LAND = [ // lon, lat, radius (radians), colour
    [0.2, 0.35, 0.35, '#b39556'], [0.55, 0.5, 0.3, '#b39556'], [0.35, 0.05, 0.28, '#a35b3a'], [0.5, -0.3, 0.32, '#a35b3a'],
    [2.1, 0.4, 0.4, '#8f9a5a'], [2.5, 0.2, 0.35, '#b39556'], [2.9, 0.55, 0.3, '#8f9a5a'], [2.4, -0.45, 0.22, '#a35b3a'],
    [4.1, 0.6, 0.32, '#8f9a5a'], [4.4, 0.3, 0.28, '#8f9a5a'], [4.55, -0.25, 0.3, '#b39556'], [4.7, -0.6, 0.2, '#a35b3a'],
    [5.7, -0.5, 0.22, '#b39556']
  ];

  function resize() {
    var r = stage.getBoundingClientRect();
    W = Math.max(200, Math.floor(r.width)); H = Math.max(200, Math.floor(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function geom() {
    var gw = Math.max(46, W * 0.07);              // gauge column
    var R = Math.min((W - gw - 40) / 2, (H - 70) / 2);
    return { cx: (W - gw) / 2 + 6, cy: H / 2 + 12, R: R, gx: W - gw + 8, gw: gw };
  }

  function dropPuff(px, py) {
    if (mode !== 'play') return;
    var g = geom();
    var u = (px - g.cx) / g.R, v = (py - g.cy) / g.R;
    var d = Math.hypot(u, v);
    if (d > 0.85) { u = u / d * 0.85; v = v / d * 0.85; }
    G.puffs.push({ u: u, v: v, age: 0, seed: Math.random() * 6 });
    G.total++;
  }
  function amp(p) { return Math.exp(-p.age / TAU); }

  function step(dt) {
    G.elapsed += dt;
    // heat pulses
    G.burstTimer -= dt;
    if (G.burstTimer <= 0) {
      G.burstLeft = 1.3; G.burst = 5 + Math.random() * 4 + Math.min(4, G.elapsed * 0.04); G.flash = 1;
      G.burstTimer = Math.max(4.5, 11 - G.elapsed * 0.06) + Math.random() * 4;
    }
    var heat = warming();
    if (G.burstLeft > 0) { heat += G.burst / 1.3; G.burstLeft -= dt; }
    G.noise += (Math.random() - 0.5) * 3 * dt; G.noise *= 0.98;
    var cool = 0;
    for (var i = G.puffs.length - 1; i >= 0; i--) {
      var p = G.puffs[i]; p.age += dt;
      p.u += dt * 0.035; // drift with rotation
      var a = amp(p);
      if (a < 0.03) { G.puffs.splice(i, 1); continue; }
      cool += a;
    }
    var eff = SAT * (1 - Math.exp(-cool / SAT)); // more puffs, smaller extra cooling each
    G.T += (heat - COOL * eff + G.noise) * dt;
    G.flash = Math.max(0, G.flash - dt * 1.2);
    var b = band();
    if (G.T >= b[0] && G.T <= b[1]) G.inBand += dt;
    if (G.T >= 100) return over('Runaway warming', 'Too hot');
    if (G.T <= 0) return over('Snowball planet', 'Too cold');
  }

  function liveCount() { var n = 0; for (var i = 0; i < G.puffs.length; i++) if (amp(G.puffs[i]) > 0.15) n++; return n; }
  function hud() {
    elIn.textContent = G.inBand.toFixed(1);
    elPuffs.textContent = liveCount();
    if (G.inBand > best) { best = G.inBand; elBest.textContent = best.toFixed(1); }
  }
  function over(reason, kicker) {
    mode = 'over';
    G.T = Math.max(0, Math.min(100, G.T));
    try { localStorage.setItem(BEST_KEY, best.toFixed(1)); } catch (e) {}
    hud();
    elPuffs.textContent = '0';
    $('overKicker').textContent = kicker;
    $('overReason').textContent = reason;
    $('overScore').textContent = G.inBand.toFixed(1) + 's';
    $('overBest').textContent = (G.inBand >= best && G.inBand > 0 ? 'New best · ' : 'Best ') + best.toFixed(1) + 's in the band · ' + G.total + ' puffs';
    overCard.hidden = false;
    pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false');
  }
  function start() {
    G = fresh(); mode = 'play';
    startCard.hidden = overCard.hidden = pauseCard.hidden = true;
    pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false');
    hud();
  }
  function togglePause() {
    if (mode === 'play') { mode = 'pause'; pauseCard.hidden = false; pauseBtn.textContent = 'Resume'; pauseBtn.setAttribute('aria-pressed', 'true'); }
    else if (mode === 'pause') { mode = 'play'; pauseCard.hidden = true; pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false'); }
  }

  /* ---------- drawing ---------- */
  function mix(a, b, k) {
    return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * k); }).join(',') + ')';
  }
  function tempColour(T) {
    var cold = [86, 140, 180], mid = [63, 125, 78], hot = [196, 74, 44];
    return T < 50 ? mix(cold, mid, T / 50) : mix(mid, hot, (T - 50) / 50);
  }
  function drawSky() {
    var g = ctx.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.3, H * 0.2, Math.max(W, H));
    g.addColorStop(0, '#2b241e'); g.addColorStop(1, '#14110e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = reduce ? 0.6 : 0.45 + 0.35 * Math.sin(clock * 1.5 + s[3]);
      ctx.fillStyle = 'rgba(246,241,231,' + tw.toFixed(2) + ')';
      ctx.fillRect(s[0] * W, s[1] * H, s[2], s[2]);
    }
    // sun glow from the left
    var sg = ctx.createRadialGradient(-W * 0.05, H * 0.45, 0, -W * 0.05, H * 0.45, W * 0.45);
    sg.addColorStop(0, 'rgba(232,196,120,.35)'); sg.addColorStop(1, 'rgba(232,196,120,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
  }
  function drawGlobe() {
    var g = geom(), cx = g.cx, cy = g.cy, R = g.R;
    var T = G.T;
    // atmosphere halo tinted by temperature
    var halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.25);
    var hc = tempColour(T);
    halo.addColorStop(0, hc.replace('rgb', 'rgba').replace(')', ',.55)'));
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.25, 0, 6.283); ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.clip();
    var oc = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    oc.addColorStop(0, '#3a7d70'); oc.addColorStop(1, '#1f4d45');
    ctx.fillStyle = oc; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    // faint latitude bands
    ctx.strokeStyle = 'rgba(246,241,231,.06)'; ctx.lineWidth = 1;
    for (var lat = -60; lat <= 60; lat += 30) {
      var yy = cy - Math.sin(lat * Math.PI / 180) * R, rx = Math.cos(lat * Math.PI / 180) * R;
      ctx.beginPath(); ctx.ellipse(cx, yy, rx, rx * 0.08, 0, 0, 6.283); ctx.stroke();
    }
    // continents (orthographic)
    for (var i = 0; i < LAND.length; i++) {
      var L = LAND[i], any = false, zs = 0;
      ctx.beginPath();
      for (var k = 0; k < 7; k++) {
        var lon = L[0] + Math.cos(k * 2.1 + i) * L[2] * 0.7 - phase;
        var la = L[1] + Math.sin(k * 1.7 + i) * L[2] * 0.5;
        var z = Math.cos(la) * Math.cos(lon);
        if (z <= 0.02) continue;
        var x = cx + Math.cos(la) * Math.sin(lon) * R, y = cy - Math.sin(la) * R;
        var lr = L[2] * R * 0.36, rx = lr * Math.max(0.2, Math.cos(lon));
        ctx.moveTo(x + rx, y); ctx.ellipse(x, y, rx, lr * 0.85, 0, 0, 6.283);
        any = true; zs = Math.max(zs, z);
      }
      if (!any) continue;
      ctx.fillStyle = L[3];
      ctx.globalAlpha = 0.88 * Math.min(1, zs * 3);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // ice caps grow when cold, shrink when hot
    var cap = R * (0.07 + (1 - Math.max(0, Math.min(100, T)) / 100) * 0.3);
    ctx.fillStyle = 'rgba(238,242,244,.9)';
    var crx = Math.sqrt(Math.max(0, 2 * R * cap - cap * cap)) * 1.05;
    ctx.beginPath(); ctx.ellipse(cx, cy - R, crx, cap * 1.15, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy + R, crx * 0.95, cap * 1.05, 0, 0, 6.283); ctx.fill();
    // puffs
    for (var j = 0; j < G.puffs.length; j++) {
      var p = G.puffs[j], a = amp(p);
      var grow = reduce ? 1 : Math.min(1, 0.35 + p.age * 2.2);
      var px = cx + p.u * R, py = cy + p.v * R, pr = R * (0.2 + (1 - a) * 0.24) * grow;
      var pg = ctx.createRadialGradient(px, py, 0, px, py, pr);
      pg.addColorStop(0, 'rgba(255,248,226,' + (0.9 * a).toFixed(3) + ')');
      pg.addColorStop(0.55, 'rgba(232,206,140,' + (0.55 * a).toFixed(3) + ')');
      pg.addColorStop(1, 'rgba(232,206,140,0)');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, pr, 0, 6.283); ctx.fill();
      if (!reduce && p.age < 0.6) {
        ctx.strokeStyle = 'rgba(255,240,200,' + (0.8 * (1 - p.age / 0.6)).toFixed(3) + ')'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(px, py, R * 0.08 + p.age * R * 0.35, 0, 6.283); ctx.stroke();
      }
    }
    // overall brightening from albedo
    var tot = 0; for (j = 0; j < G.puffs.length; j++) tot += amp(G.puffs[j]);
    ctx.fillStyle = 'rgba(255,250,235,' + Math.min(0.28, tot * 0.06).toFixed(3) + ')';
    ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    // day/night shading (sun from left)
    var sh = ctx.createRadialGradient(cx - R * 0.45, cy - R * 0.35, R * 0.1, cx - R * 0.2, cy - R * 0.1, R * 1.35);
    sh.addColorStop(0, 'rgba(255,240,210,.14)'); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(10,8,6,.62)');
    ctx.fillStyle = sh; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    if (G.flash > 0) { ctx.fillStyle = 'rgba(196,74,44,' + (0.35 * G.flash).toFixed(3) + ')'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(246,241,231,.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.stroke();
  }
  function rr(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawGauge() {
    var g = geom(), top = 40, bot = H - 40, x = g.gx, w = Math.min(22, g.gw * 0.42);
    var yOf = function (T) { return bot - (T / 100) * (bot - top); };
    var tg = ctx.createLinearGradient(0, bot, 0, top);
    tg.addColorStop(0, 'rgba(86,140,180,.55)'); tg.addColorStop(0.5, 'rgba(246,241,231,.12)'); tg.addColorStop(1, 'rgba(196,74,44,.6)');
    ctx.fillStyle = tg; rr(x, top, w, bot - top, w / 2); ctx.fill();
    var b = band();
    ctx.fillStyle = 'rgba(63,125,78,.85)'; ctx.fillRect(x, yOf(b[1]), w, yOf(b[0]) - yOf(b[1]));
    ctx.strokeStyle = 'rgba(246,241,231,.25)'; ctx.lineWidth = 1; rr(x, top, w, bot - top, w / 2); ctx.stroke();
    var y = yOf(Math.max(0, Math.min(100, G.T)));
    ctx.fillStyle = '#f6f1e7';
    ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x - 13, y - 6); ctx.lineTo(x - 13, y + 6); ctx.closePath(); ctx.fill();
    ctx.fillRect(x - 2, y - 1.5, w + 4, 3);
    ctx.font = '600 10px "Source Sans 3", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(246,241,231,.7)';
    ctx.fillText('HOT', x + w / 2, top - 12); ctx.fillText('COLD', x + w / 2, bot + 20);
  }
  function drawStatus() {
    var b = band(), T = G.T, inB = T >= b[0] && T <= b[1];
    var txt = mode === 'start' ? 'Ready' : inB ? 'In the band' : T > b[1] ? 'Too warm' : 'Too cool';
    ctx.textAlign = 'left';
    ctx.font = '600 11px "Source Sans 3", sans-serif'; ctx.fillStyle = 'rgba(217,191,138,.9)';
    ctx.fillText('PLANET STATUS', 18, 26);
    ctx.font = '500 ' + (W < 500 ? 19 : 23) + 'px Fraunces, Georgia, serif';
    ctx.fillStyle = inB ? '#9fd3a8' : T > b[1] ? '#f0a58a' : '#a9cde6';
    ctx.fillText(txt, 18, W < 500 ? 48 : 52);
    if (G.flash > 0.2) {
      ctx.font = '600 12px "Source Sans 3", sans-serif'; ctx.fillStyle = 'rgba(240,165,138,' + G.flash.toFixed(2) + ')';
      ctx.fillText('Heat pulse', 18, W < 500 ? 68 : 74);
    }
  }
  function draw() {
    if (!W || !G) return;
    ctx.clearRect(0, 0, W, H);
    drawSky(); drawGlobe(); drawGauge(); drawStatus();
  }

  var hudT = 0;
  function loop(now) {
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (mode !== 'pause') { clock += dt; if (!reduce) phase += dt * 0.12; }
    if (mode === 'play') { step(dt); hudT += dt; if (hudT > 0.1 && mode === 'play') { hudT = 0; hud(); } }
    draw();
    requestAnimationFrame(loop);
  }

  /* ---------- input ---------- */
  cv.addEventListener('pointerdown', function (e) {
    if (mode !== 'play') return;
    e.preventDefault();
    var r = cv.getBoundingClientRect();
    dropPuff(e.clientX - r.left, e.clientY - r.top);
  });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (e.key === ' ' || e.code === 'Space') {
      if (tag === 'BUTTON' && mode !== 'play') return;
      e.preventDefault();
      if (mode === 'play') { var g = geom(); dropPuff(g.cx + (Math.random() - 0.5) * g.R, g.cy + (Math.random() - 0.5) * g.R); }
      else if (mode === 'start' || mode === 'over') start();
    } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (mode === 'play' || mode === 'pause') togglePause();
    }
  });
  $('startBtn').addEventListener('click', start);
  $('againBtn').addEventListener('click', start);
  $('restartBtn').addEventListener('click', start);
  $('resumeBtn').addEventListener('click', togglePause);
  pauseBtn.addEventListener('click', function () { if (mode === 'play' || mode === 'pause') togglePause(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && mode === 'play') togglePause(); });


  G = fresh();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);
})();
