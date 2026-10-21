/* Ice Nucleus — Sky Lab game. Vanilla canvas, no dependencies.
   Physics, kept simple: cloud droplets stay liquid below 0 °C. Without a seed they freeze on their own near −38 °C
   (homogeneous freezing). Ice-nucleating particles let ice form at warmer temperatures; typical ranges used here:
   bacteria and pollen −2 to −8 °C, mineral dust (K-feldspar) −15 to −25 °C, soot −30 to −38 °C. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), cv = $('sky'), ctx = cv.getContext('2d');
  var startCard = $('startCard'), pauseCard = $('pauseCard'), overCard = $('overCard'), pauseBtn = $('pauseBtn');
  var elDrop = $('drop'), elScore = $('score'), elBest = $('best'), freezeBtn = $('freezeBtn');
  var BEST_KEY = 'pxc.studio.ice.best';
  var best = 0;
  try { best = parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) {}
  elBest.textContent = best;

  var SEEDS = {
    bio: { name: 'Bacteria or pollen', warm: -2, cold: -8, col: '#2f7a6c' },
    dust: { name: 'Mineral dust (K-feldspar)', warm: -15, cold: -25, col: '#b4532f' },
    soot: { name: 'Soot', warm: -30, cold: -38, col: '#0f0d0b' },
    none: { name: 'No particle', warm: -37, cold: -39, col: null }
  };
  Object.keys(SEEDS).forEach(function (k) { var s = SEEDS[k]; s.mid = (s.warm + s.cold) / 2; });
  var ROUNDS = 5, RATES = [3, 3.5, 4, 4.5, 5], SHOW_RANGE = 2, T0 = 4, T_MIN = -42, RESULT_SECS = 1.9;
  function points(T, s) { return Math.max(10, Math.round(100 - 12 * Math.abs(T - s.mid))); }
  function fmt(T) { var v = Math.abs(T) < 0.05 ? 0 : T; return (v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + ' °C'; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  var W = 0, H = 0, dpr = 1, mode = 'start', last = 0, clock = 0, G;
  var puffs = []; for (var i = 0; i < 14; i++) puffs.push([Math.random(), Math.random(), 0.08 + Math.random() * 0.12]);
  function fresh() {
    var order = shuffle(['bio', 'dust', 'soot', 'none']); order.push(['bio', 'dust', 'soot'][Math.floor(Math.random() * 3)]);
    return { order: order, r: 0, T: T0, phase: 'cool', res: null, total: 0, hist: [], wait: 0, rise: 0 };
  }
  function seed() { return SEEDS[G.order[G.r]]; }
  function setupRound() { G.T = T0; G.phase = 'cool'; G.res = null; freezeBtn.disabled = false; hud(); }
  function freeze(auto) {
    if (mode !== 'play' || G.phase !== 'cool') return;
    var s = seed(), T = G.T, res;
    if (auto) res = { kind: 'late', T: s.cold, pts: 0 };
    else if (T > s.warm) res = { kind: 'warm', T: T, pts: 0 };
    else res = { kind: 'ice', T: T, pts: points(T, s) };
    res.age = 0; G.res = res; G.phase = 'result'; G.wait = RESULT_SECS;
    G.total += res.pts; G.hist.push(res.pts); freezeBtn.disabled = true; hud();
  }
  function hud() { elDrop.textContent = (G.r + 1) + '/' + ROUNDS; elScore.textContent = G.total; }
  function over() {
    mode = 'over';
    var nb = G.total > best;
    if (nb) { best = G.total; elBest.textContent = best; try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {} }
    $('overKicker').textContent = 'Final score';
    $('overReason').textContent = G.total >= 400 ? 'Ice right on time' : G.total >= 250 ? 'Mostly on time' : 'Keep an eye on the range';
    $('overScore').textContent = G.total;
    $('overBest').textContent = (nb ? 'New best · ' : 'Best ' + best + ' · ') + G.hist.join(' + ') + ' of 500';
    overCard.hidden = false; freezeBtn.disabled = true;
    pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false');
  }
  function start() {
    G = fresh(); mode = 'play';
    startCard.hidden = overCard.hidden = pauseCard.hidden = true;
    pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false');
    setupRound();
    var r = stage.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) stage.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }
  function togglePause() {
    if (mode === 'play') { mode = 'pause'; pauseCard.hidden = false; pauseBtn.textContent = 'Resume'; pauseBtn.setAttribute('aria-pressed', 'true'); }
    else if (mode === 'pause') { mode = 'play'; pauseCard.hidden = true; pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false'); }
  }
  function step(dt) {
    G.rise += dt;
    if (G.phase === 'cool') {
      G.T -= RATES[G.r] * dt;
      if (G.T <= seed().cold) { G.T = seed().cold; freeze(true); }
    } else {
      G.res.age += dt; G.wait -= dt;
      if (G.wait <= 0) { if (G.r + 1 < ROUNDS) { G.r++; setupRound(); } else over(); }
    }
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
  function geom() {
    var small = W < 500, top = small ? 92 : 80, tw = small ? 64 : 84;
    return { small: small, top: top, bot: H - 24, tx: W - tw + (small ? 18 : 26), tw: tw, cx: (W - tw) / 2 + 8, cy: top + (H - top) * 0.5, R: Math.min((W - tw) * 0.3, (H - top) * 0.34) };
  }
  function ty(g, T) { return g.top + 12 + (T0 - T) / (T0 - T_MIN) * (g.bot - g.top - 24); }
  function drawCloud(g) {
    var sk = ctx.createLinearGradient(0, 0, 0, H);
    sk.addColorStop(0, '#2c3c46'); sk.addColorStop(1, '#5f7f86');
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);
    var off = reduce ? 0 : G.rise * 0.05;
    for (var i = 0; i < puffs.length; i++) {
      var p = puffs[i], y = ((p[1] + off) % 1.2) - 0.1, x = p[0] * W, r = p[2] * Math.max(W, H);
      var pg = ctx.createRadialGradient(x, y * H, 0, x, y * H, r);
      pg.addColorStop(0, 'rgba(230,236,238,.16)'); pg.addColorStop(1, 'rgba(230,236,238,0)');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(x, y * H, r, 0, 6.283); ctx.fill();
    }
  }
  function drawDroplet(g) {
    var s = seed(), R = g.R, cx = g.cx, cy = g.cy + (reduce ? 0 : Math.sin(clock * 1.4) * 3);
    var res = G.phase === 'result' ? G.res : null, frozen = res && res.kind !== 'warm';
    var f = frozen ? (reduce ? 1 : Math.min(1, res.age / 0.6)) : 0;
    var dg = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
    dg.addColorStop(0, 'rgba(255,255,255,' + (0.85 - f * 0.2).toFixed(2) + ')');
    dg.addColorStop(1, frozen ? 'rgba(214,228,232,.75)' : 'rgba(31,77,69,.55)');
    ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = res && res.kind === 'warm' ? '#f2ab94' : 'rgba(246,241,231,.55)'; ctx.stroke();
    if (s.col) {
      ctx.fillStyle = s.col; ctx.beginPath(); ctx.arc(cx + R * 0.12, cy + R * 0.1, R * 0.1, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(246,241,231,.8)'; ctx.lineWidth = 1.2; ctx.stroke();
    }
    if (f > 0) {
      ctx.save(); ctx.translate(cx + (s.col ? R * 0.12 : 0), cy + (s.col ? R * 0.1 : 0));
      ctx.strokeStyle = '#f6f1e7'; ctx.lineWidth = Math.max(1.5, R * 0.05); ctx.lineCap = 'round';
      var L = R * 0.85 * f;
      for (var a = 0; a < 6; a++) {
        ctx.save(); ctx.rotate(a * Math.PI / 3);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -L);
        ctx.moveTo(0, -L * 0.55); ctx.lineTo(-L * 0.22, -L * 0.75); ctx.moveTo(0, -L * 0.55); ctx.lineTo(L * 0.22, -L * 0.75);
        ctx.stroke(); ctx.restore();
      }
      ctx.restore();
    }
  }
  function drawThermo(g) {
    var x = g.tx, w = g.small ? 12 : 14, s = seed(), top = ty(g, T0), bot = ty(g, T_MIN);
    ctx.fillStyle = 'rgba(21,19,15,.45)'; ctx.fillRect(x - 4, top - 6, w + 8, bot - top + 12);
    ctx.fillStyle = 'rgba(246,241,231,.18)'; ctx.fillRect(x, top, w, bot - top);
    if (G.r < SHOW_RANGE || G.phase === 'result') {
      ctx.fillStyle = 'rgba(217,191,138,.55)'; ctx.fillRect(x - 3, ty(g, s.warm), w + 6, ty(g, s.cold) - ty(g, s.warm));
    }
    var y = ty(g, G.T);
    ctx.fillStyle = '#9fd8bb'; ctx.fillRect(x, top, w, y - top);
    ctx.fillStyle = '#f6f1e7'; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x - 12, y - 6); ctx.lineTo(x - 12, y + 6); ctx.closePath(); ctx.fill();
    ctx.font = '600 10px "Source Sans 3", sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(246,241,231,.8)';
    [0, -10, -20, -30, -40].forEach(function (T) { var yy = ty(g, T); ctx.fillText(T ? '−' + Math.abs(T) : '0', x - 14, yy + 3); ctx.fillRect(x, yy, w, 1); });
    ctx.textAlign = 'center'; ctx.fillText('°C', x + w / 2, top - 12);
  }
  function drawStatus(g) {
    var s = seed(), small = g.small;
    ctx.textAlign = 'left'; ctx.font = '600 11px "Source Sans 3", sans-serif'; ctx.fillStyle = 'rgba(217,191,138,.95)';
    ctx.fillText('DROPLET ' + (G.r + 1) + ' OF ' + ROUNDS + ' · SEED: ' + s.name.toUpperCase(), 16, 24);
    ctx.font = '500 ' + (small ? 19 : 23) + 'px Fraunces, Georgia, serif'; ctx.fillStyle = '#f6f1e7';
    var line, sub;
    if (mode === 'start') { line = 'Supercooled droplet'; sub = 'Press Start'; }
    else if (G.phase === 'cool') { line = fmt(G.T) + ' · still liquid'; sub = G.r < SHOW_RANGE ? 'Freezing range shown on the thermometer' : 'From memory: no range shown'; }
    else {
      var r = G.res;
      if (r.kind === 'ice') { line = 'Ice at ' + fmt(r.T) + ' · ' + r.pts + ' points'; sub = 'Best near ' + fmt(s.mid); }
      else if (r.kind === 'warm') { line = 'Too warm: no ice at ' + fmt(r.T); sub = s.name + ' works from about ' + fmt(s.warm); }
      else { line = 'Froze on its own at ' + fmt(r.T); sub = 'Call it before ' + fmt(s.cold); }
    }
    ctx.fillText(line, 16, small ? 48 : 54);
    ctx.font = '600 12px "Source Sans 3", sans-serif'; ctx.fillStyle = 'rgba(246,241,231,.85)';
    ctx.fillText(sub, 16, small ? 70 : 74);
  }
  function draw() {
    if (!W || !G) return;
    var g = geom();
    drawCloud(g); drawDroplet(g); drawThermo(g); drawStatus(g);
  }
  function loop(now) {
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (mode !== 'pause') clock += dt;
    if (mode === 'play') step(dt);
    draw();
    requestAnimationFrame(loop);
  }

  /* ---------- input ---------- */
  cv.addEventListener('pointerdown', function (e) { if (mode === 'play' && G.phase === 'cool') { e.preventDefault(); freeze(false); } });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) return;
    if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
      e.preventDefault();
      if (mode === 'start' || mode === 'over') start(); else if (mode === 'play') freeze(false);
    } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (mode === 'play' || mode === 'pause') togglePause();
    }
  });
  freezeBtn.addEventListener('click', function () { freeze(false); });
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
