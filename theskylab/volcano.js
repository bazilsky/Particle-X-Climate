/* Volcano Veil — Sky Lab game. Vanilla canvas, no dependencies.
   Simple, honest scaling: SO2 converts to sulphate over about a month; the veil's lifetime grows with height above the
   local tropopause and is shorter at high latitudes; forcing scales with load^(2/3) (bigger eruptions, bigger particles);
   extratropical veils stay in one hemisphere and cover less sunlit area; temperature follows forcing with a 6-month lag.
   Calibrated so Pinatubo (17 Tg SO2, 15°N, 25 km) peaks at 0.45 °C of global cooling. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), cv = $('sky'), ctx = cv.getContext('2d');
  var startCard = $('startCard'), pauseCard = $('pauseCard'), overCard = $('overCard'), pauseBtn = $('pauseBtn');
  var elRound = $('round'), elScore = $('score'), elBest = $('best'), eruptBtn = $('eruptBtn');
  var IN = { so2: $('so2'), lat: $('lat'), alt: $('alt') };
  var BEST_KEY = 'pxc.studio.volcano.best';
  var best = 0;
  try { best = parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) {}
  elBest.textContent = best;

  var ROUNDS = 3, AIM_SECS = 25, MONTHS = 30, MONTHS_PER_SEC = 4, DT = 0.05;
  var TC = 1, TT = 6;                 // SO2 -> sulphate e-folding (months); temperature lag (months)

  /* ---------- the model ---------- */
  function tropopause(lat) { return 17 - 7 * Math.min(Math.abs(lat), 60) / 60; }
  function lifetime(lat, h) {
    var a = Math.min(Math.abs(lat), 60);
    return Math.max(1, 1 + 1.15 * (h - tropopause(lat))) * (1 - 0.4 * a / 60);
  }
  function hemiFactor(lat) { var a = Math.abs(lat); return a <= 20 ? 1 : 1 - 0.55 * (Math.min(a, 60) - 20) / 40; }
  function load(so2, tau, t) { return Math.max(0, so2 * tau / (tau - TC + 1e-6) * (Math.exp(-t / tau) - Math.exp(-t / TC))); }
  function run(so2, lat, h, K) {
    var tau = lifetime(lat, h), hf = hemiFactor(lat), T = 0, out = [], peak = 0, pm = 0;
    for (var i = 0; i * DT <= MONTHS + 1e-9; i++) {
      var t = i * DT, F = K * hf * Math.pow(load(so2, tau, t), 2 / 3);
      T += (F - T) / TT * DT;
      out.push(T);
      if (T > peak) { peak = T; pm = t; }
    }
    return { series: out, peak: peak, peakMonth: pm, tau: tau };
  }
  var K = 0.45 / run(17, 15, 25, 1).peak;

  /* ---------- rounds ---------- */
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function makeRounds() {
    var hiLat = pick([-60, -55, -50, 50, 55, 60]);
    return [
      { target: pick([0.3, 0.4, 0.5]), lock: null, note: 'Free choice' },
      { target: pick([0.3, 0.4, 0.5]), lock: { lat: hiLat }, note: 'Volcano fixed at ' + latTxt(hiLat) },
      { target: pick([0.6, 0.7, 0.8]), lock: { so2: 40 }, note: 'Eruption fixed at 40 Tg' }
    ];
  }
  function latTxt(v) { v = +v; return v === 0 ? '0°' : Math.abs(v) + '°' + (v > 0 ? 'N' : 'S'); }
  function points(err) { return Math.max(0, Math.round(100 - 250 * err)); }

  var W = 0, H = 0, dpr = 1, mode = 'start', last = 0, clock = 0, G;
  function fresh() { return { rounds: makeRounds(), r: 0, phase: 'aim', aim: AIM_SECS, t: 0, res: null, total: 0, hist: [] }; }
  function cur() { return G.rounds[G.r]; }
  function val(k) { return +IN[k].value; }
  function setVal(k, v) {
    var el = IN[k]; if (el.disabled) return;
    v = Math.max(+el.min, Math.min(+el.max, v)); el.value = v; outputs();
  }
  function outputs() {
    $('so2Out').textContent = val('so2') + ' Tg';
    $('latOut').textContent = latTxt(val('lat'));
    $('altOut').textContent = val('alt') + ' km';
  }
  function setupRound() {
    var R = cur(); G.phase = 'aim'; G.aim = AIM_SECS; G.t = 0; G.res = null;
    ['so2', 'lat', 'alt'].forEach(function (k) { IN[k].disabled = false; });
    if (R.lock) Object.keys(R.lock).forEach(function (k) { IN[k].value = R.lock[k]; IN[k].disabled = true; });
    outputs();
    eruptBtn.disabled = false; eruptBtn.textContent = 'Erupt';
    hud();
  }
  function erupt() {
    if (mode !== 'play' || G.phase !== 'aim') return;
    var s = { so2: val('so2'), lat: val('lat'), alt: val('alt') };
    G.res = run(s.so2, s.lat, s.alt, K); G.res.set = s;
    G.res.err = Math.abs(G.res.peak - cur().target); G.res.pts = points(G.res.err);
    G.phase = 'run'; G.t = 0;
    ['so2', 'lat', 'alt'].forEach(function (k) { IN[k].disabled = true; });
    eruptBtn.disabled = true; eruptBtn.textContent = 'Erupting…';
    var r = stage.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) stage.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }
  function finishRound() {
    G.phase = 'result'; G.total += G.res.pts; G.hist.push(G.res.pts);
    eruptBtn.disabled = false; eruptBtn.textContent = G.r + 1 < ROUNDS ? 'Next round' : 'See final score';
    hud();
  }
  function next() {
    if (mode !== 'play' || G.phase !== 'result') return;
    if (G.r + 1 < ROUNDS) { G.r++; setupRound(); } else over();
  }
  function hud() {
    elRound.textContent = (G.r + 1) + '/' + ROUNDS;
    elScore.textContent = G.total;
  }
  function over() {
    mode = 'over';
    var nb = G.total > best;
    if (nb) { best = G.total; elBest.textContent = best; try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {} }
    $('overKicker').textContent = 'Final score';
    $('overReason').textContent = G.total >= 240 ? 'Right on target' : G.total >= 150 ? 'Close to target' : 'Off target';
    $('overScore').textContent = G.total;
    $('overBest').textContent = (nb ? 'New best · ' : 'Best ' + best + ' · ') + 'rounds ' + G.hist.join(' + ') + ' of 300';
    overCard.hidden = false; eruptBtn.disabled = true; eruptBtn.textContent = 'Erupt';
    pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false');
  }
  function start() {
    G = fresh(); mode = 'play';
    startCard.hidden = overCard.hidden = pauseCard.hidden = true;
    pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false');
    setupRound();
  }
  function togglePause() {
    if (mode === 'play') { mode = 'pause'; pauseCard.hidden = false; pauseBtn.textContent = 'Resume'; pauseBtn.setAttribute('aria-pressed', 'true'); }
    else if (mode === 'pause') { mode = 'play'; pauseCard.hidden = true; pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false'); }
  }
  function step(dt) {
    if (G.phase === 'aim') { G.aim -= dt; if (G.aim <= 0) { G.aim = 0; erupt(); } }
    else if (G.phase === 'run') { G.t = Math.min(MONTHS, G.t + dt * MONTHS_PER_SEC); if (G.t >= MONTHS) finishRound(); }
  }

  /* ---------- geometry ---------- */
  function resize() {
    var r = stage.getBoundingClientRect();
    W = Math.max(200, Math.floor(r.width)); H = Math.max(200, Math.floor(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function geom() {
    var pad = 14, top = W < 500 ? 88 : 78, colW = W < 500 ? 40 : 52;
    var mapH = Math.round((H - top) * (W < 500 ? 0.5 : 0.56)), mx = pad, mw = W - pad * 3 - colW;
    var cy = top + mapH + 34, ch = H - cy - 30;
    return { pad: pad, top: top, mx: mx, mw: mw, mh: mapH, colX: mx + mw + pad, colW: colW, cx: mx + 34, cw: W - pad * 2 - 34, cy: cy, ch: ch };
  }
  function latY(g, lat) { return g.top + (90 - lat) / 180 * g.mh; }
  var ALT_MAX = 35;
  function altY(g, h) { return g.top + g.mh - h / ALT_MAX * g.mh; }

  /* ---------- veil shape (zonal mean, for display) ---------- */
  function veil(lat0, t, lat) {
    var e = function (c, s) { var d = (lat - c) / s; return Math.exp(-d * d / 2); };
    if (Math.abs(lat0) <= 20) {
      var w0 = Math.exp(-t / 3), c = 12 + 30 * (1 - Math.exp(-t / 5)), s = 6 + 9 * (1 - Math.exp(-t / 6));
      return w0 * e(lat0, 7) + (1 - w0) * 0.5 * (e(c, s) + e(-c, s));
    }
    var sg = lat0 > 0 ? 1 : -1, cc = lat0 + (sg * 65 - lat0) * (1 - Math.exp(-t / 4)), ss = 6 + 10 * (1 - Math.exp(-t / 5));
    return sg * lat < -5 ? 0 : e(cc, ss);
  }

  /* ---------- drawing ---------- */
  var LAND = [ // lon, lat, rx (deg), ry (deg), rotation
    [-100, 45, 28, 17, -0.3], [-60, -15, 14, 24, 0.25], [15, 50, 18, 9, 0], [20, 5, 18, 26, 0], [90, 45, 45, 18, 0.05],
    [105, 15, 16, 9, 0.3], [135, -25, 15, 10, 0], [-40, 72, 12, 7, 0], [0, -82, 180, 8, 0]
  ];
  var VLON = 122; // the volcano's longitude on the map (a fixed, stylised arc volcano)
  function lonX(g, lon) { return g.mx + (lon + 180) / 360 * g.mw; }
  function drawMap(g) {
    ctx.save();
    ctx.beginPath(); ctx.rect(g.mx, g.top, g.mw, g.mh); ctx.clip();
    var oc = ctx.createLinearGradient(0, g.top, 0, g.top + g.mh);
    oc.addColorStop(0, '#24453f'); oc.addColorStop(0.5, '#1f4d45'); oc.addColorStop(1, '#24453f');
    ctx.fillStyle = oc; ctx.fillRect(g.mx, g.top, g.mw, g.mh);
    ctx.fillStyle = 'rgba(143,154,90,.55)';
    for (var i = 0; i < LAND.length; i++) {
      var L = LAND[i]; ctx.beginPath();
      ctx.ellipse(lonX(g, L[0]), latY(g, L[1]), L[2] / 360 * g.mw, L[3] / 180 * g.mh, L[4], 0, 6.283); ctx.fill();
    }
    // latitude lines
    ctx.strokeStyle = 'rgba(246,241,231,.12)'; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
    [-60, -30, 0, 30, 60].forEach(function (la) { var y = latY(g, la) + 0.5; ctx.beginPath(); ctx.moveTo(g.mx, y); ctx.lineTo(g.mx + g.mw, y); ctx.stroke(); });
    ctx.setLineDash([]);
    // the veil
    var lat0 = G.phase === 'aim' ? val('lat') : G.res.set.lat;
    if (G.phase !== 'aim') {
      var vt = G.phase === 'result' ? G.res.peakMonth : G.t; // after the run, show the veil at peak cooling
      var k = Math.min(0.85, Math.sqrt(load(G.res.set.so2, G.res.tau, vt) / 10) * 0.8);
      var lonW = Math.min(360, 40 + vt * 500), x0 = lonX(g, VLON) - 20 / 360 * g.mw;
      for (var y = g.top; y < g.top + g.mh; y += 3) {
        var la2 = 90 - (y - g.top) / g.mh * 180, d = veil(lat0, vt, la2) * k;
        if (d < 0.01) continue;
        var sh = reduce ? 0 : 0.06 * Math.sin(clock * 2 + la2 * 0.2);
        ctx.fillStyle = 'rgba(217,191,138,' + Math.min(0.9, d + sh * d).toFixed(3) + ')';
        if (lonW >= 360) ctx.fillRect(g.mx, y, g.mw, 3);
        else {
          var wpx = lonW / 360 * g.mw; ctx.fillRect(x0, y, wpx, 3);
          if (x0 + wpx > g.mx + g.mw) ctx.fillRect(g.mx, y, x0 + wpx - g.mx - g.mw, 3);
        }
      }
    }
    // volcano
    var vx = lonX(g, VLON), vy = latY(g, lat0), s = W < 500 ? 7 : 9;
    if (G.phase === 'run' && G.t < 1.2 && !reduce) {
      for (var j = 0; j < 6; j++) {
        var ph = (clock * 1.6 + j / 6) % 1;
        ctx.fillStyle = 'rgba(92,86,76,' + (0.7 * (1 - ph)).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(vx + Math.sin(j * 2 + clock) * 4, vy - s - ph * s * 3, s * (0.4 + ph * 0.8), 0, 6.283); ctx.fill();
      }
    }
    ctx.fillStyle = '#9a3b24'; ctx.strokeStyle = '#f6f1e7'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(vx - s, vy + s * 0.7); ctx.lineTo(vx, vy - s * 0.8); ctx.lineTo(vx + s, vy + s * 0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'rgba(246,241,231,.2)'; ctx.strokeRect(g.mx + 0.5, g.top + 0.5, g.mw - 1, g.mh - 1);
    ctx.font = '600 10px "Source Sans 3", sans-serif'; ctx.fillStyle = 'rgba(246,241,231,.75)'; ctx.textAlign = 'left';
    ctx.fillText('60°N', g.mx + 5, latY(g, 60) - 4); ctx.fillText('EQUATOR', g.mx + 5, latY(g, 0) - 4); ctx.fillText('60°S', g.mx + 5, latY(g, -60) - 4);
  }
  function drawColumn(g) {
    var x = g.colX, w = g.colW, h = G.phase === 'aim' ? val('alt') : G.res.set.alt, lat = G.phase === 'aim' ? val('lat') : G.res.set.lat;
    var sk = ctx.createLinearGradient(0, g.top + g.mh, 0, g.top);
    sk.addColorStop(0, '#5f7f86'); sk.addColorStop(0.45, '#2c3c46'); sk.addColorStop(1, '#15130f');
    ctx.fillStyle = sk; ctx.fillRect(x, g.top, w, g.mh);
    var ty = altY(g, tropopause(lat));
    ctx.strokeStyle = 'rgba(246,241,231,.55)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x, ty + 0.5); ctx.lineTo(x + w, ty + 0.5); ctx.stroke(); ctx.setLineDash([]);
    var hy = altY(g, h);
    ctx.fillStyle = '#d9bf8a'; ctx.fillRect(x + 4, hy - 2, w - 8, 4);
    ctx.font = '600 10px "Source Sans 3", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(246,241,231,.8)';
    ctx.fillText('HEIGHT', x + w / 2, g.top - 8);
    ctx.fillText(h + ' km', x + w / 2, hy - 7);
    ctx.fillStyle = 'rgba(246,241,231,.6)'; ctx.fillText('TROPO', x + w / 2, ty + 13);
    ctx.strokeStyle = 'rgba(246,241,231,.2)'; ctx.strokeRect(x + 0.5, g.top + 0.5, w - 1, g.mh - 1);
  }
  function drawChart(g) {
    var x0 = g.cx, y0 = g.cy, w = g.cw, h = g.ch, MAXC = 1.2;
    var X = function (m) { return x0 + m / MONTHS * w; }, Y = function (c) { return y0 + c / MAXC * h; };
    ctx.font = '600 10px "Source Sans 3", sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(217,191,138,.9)';
    ctx.fillText('GLOBAL COOLING (°C) OVER ' + MONTHS + ' MONTHS', x0, y0 - 10);
    ctx.strokeStyle = 'rgba(246,241,231,.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, y0 + 0.5); ctx.lineTo(x0 + w, y0 + 0.5); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(246,241,231,.6)';
    [0, 0.5, 1].forEach(function (c) { ctx.fillText(c ? '−' + c.toFixed(1) : '0', x0 - 6, Y(c) + 3); });
    ctx.textAlign = 'center';
    [0, 12, 24].forEach(function (m) { ctx.fillText(m ? m + ' mo' : '', X(m), y0 + h + 16); });
    // target
    var tg = cur().target, ty = Y(tg);
    ctx.fillStyle = 'rgba(217,191,138,.16)'; ctx.fillRect(x0, Y(tg - 0.05), w, Y(tg + 0.05) - Y(tg - 0.05));
    ctx.strokeStyle = '#d9bf8a'; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(x0, ty); ctx.lineTo(x0 + w, ty); ctx.stroke(); ctx.setLineDash([]);
    ctx.textAlign = 'right'; ctx.fillStyle = '#e6cf9c'; ctx.fillText('TARGET −' + tg.toFixed(1), x0 + w, ty - 6);
    if (!G.res || G.phase === 'aim') return;
    var n = Math.min(G.res.series.length - 1, Math.floor(G.t / DT));
    ctx.strokeStyle = '#9fd8bb'; ctx.lineWidth = 2.5; ctx.beginPath();
    for (var i = 0; i <= n; i += 2) { var px = X(i * DT), py = Y(Math.min(MAXC, G.res.series[i])); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.stroke();
    if (G.phase === 'result') {
      var pmx = X(G.res.peakMonth), pmy = Y(Math.min(MAXC, G.res.peak));
      ctx.fillStyle = '#f6f1e7'; ctx.beginPath(); ctx.arc(pmx, pmy, 4, 0, 6.283); ctx.fill();
    }
  }
  function drawStatus(g) {
    var R = cur(), small = W < 500;
    ctx.textAlign = 'left'; ctx.font = '600 11px "Source Sans 3", sans-serif'; ctx.fillStyle = 'rgba(217,191,138,.95)';
    ctx.fillText('ROUND ' + (G.r + 1) + ' OF ' + ROUNDS + ' · ' + R.note.toUpperCase(), 16, 24);
    ctx.font = '500 ' + (small ? 19 : 23) + 'px Fraunces, Georgia, serif'; ctx.fillStyle = '#f6f1e7';
    var line;
    if (mode === 'start') line = 'Hit a target cooling';
    else if (G.phase === 'aim') line = 'Target −' + R.target.toFixed(1) + ' °C';
    else if (G.phase === 'run') line = 'Month ' + Math.floor(G.t) + ' · −' + G.res.series[Math.min(G.res.series.length - 1, Math.floor(G.t / DT))].toFixed(2) + ' °C';
    else line = 'Peak −' + G.res.peak.toFixed(2) + ' °C · ' + G.res.pts + ' points';
    ctx.fillText(line, 16, small ? 48 : 54);
    var side = mode !== 'start' && G.phase === 'aim' ? Math.ceil(G.aim) + ' s to erupt'
      : G.phase === 'result' ? 'Target −' + R.target.toFixed(1) + ' °C · veil at peak, month ' + Math.round(G.res.peakMonth) : '';
    ctx.font = '600 12px "Source Sans 3", sans-serif'; ctx.fillStyle = 'rgba(246,241,231,.8)';
    if (small) { ctx.textAlign = 'left'; ctx.fillText(side, 16, 70); }
    else { ctx.textAlign = 'right'; ctx.fillText(side, W - 16, 24); }
  }
  function draw() {
    if (!W || !G) return;
    var g = geom();
    ctx.fillStyle = '#1c1915'; ctx.fillRect(0, 0, W, H);
    drawMap(g); drawColumn(g); drawChart(g); drawStatus(g);
  }

  var hudT = 0;
  function loop(now) {
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (mode !== 'pause') clock += dt;
    if (mode === 'play') step(dt);
    draw();
    requestAnimationFrame(loop);
  }

  /* ---------- input ---------- */
  var drag = null;
  function pointAt(e) {
    var r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, g = geom();
    if (y < g.top - 10 || y > g.top + g.mh + 10) return;
    if (drag === 'col' || (!drag && x >= g.colX - 6)) {
      drag = 'col'; setVal('alt', Math.round((g.top + g.mh - y) / g.mh * ALT_MAX));
    } else {
      drag = 'map'; setVal('lat', Math.round((90 - (y - g.top) / g.mh * 180) / 5) * 5);
    }
  }
  cv.addEventListener('pointerdown', function (e) {
    if (mode !== 'play' || G.phase !== 'aim') return;
    e.preventDefault(); drag = null; pointAt(e);
    if (drag) try { cv.setPointerCapture(e.pointerId); } catch (x) {}
  });
  cv.addEventListener('pointermove', function (e) { if (drag && mode === 'play' && G.phase === 'aim') pointAt(e); });
  ['pointerup', 'pointercancel'].forEach(function (ev) { cv.addEventListener(ev, function () { drag = null; }); });
  ['so2', 'lat', 'alt'].forEach(function (k) { IN[k].addEventListener('input', outputs); });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) return;
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (mode === 'start' || mode === 'over') start();
      else if (mode === 'play') { if (G.phase === 'aim') erupt(); else if (G.phase === 'result') next(); }
    } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (mode === 'play' || mode === 'pause') togglePause();
    } else if (mode === 'play' && G.phase === 'aim' && tag !== 'INPUT') {
      var m = { ArrowLeft: ['so2', -1], ArrowRight: ['so2', 1], ArrowUp: ['lat', 5], ArrowDown: ['lat', -5], w: ['alt', 1], W: ['alt', 1], s: ['alt', -1], S: ['alt', -1] }[e.key];
      if (m) { e.preventDefault(); setVal(m[0], val(m[0]) + m[1]); }
    }
  });
  eruptBtn.addEventListener('click', function () { if (mode !== 'play') return; if (G.phase === 'aim') erupt(); else if (G.phase === 'result') next(); });
  $('startBtn').addEventListener('click', start);
  $('againBtn').addEventListener('click', start);
  $('restartBtn').addEventListener('click', start);
  $('resumeBtn').addEventListener('click', togglePause);
  pauseBtn.addEventListener('click', function () { if (mode === 'play' || mode === 'pause') togglePause(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && mode === 'play') togglePause(); });

  G = fresh(); outputs();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);
})();
