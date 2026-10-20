/* Cloud Pop — Studio game. Vanilla canvas match-three, no dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), cv = $('board'), ctx = cv.getContext('2d');
  var startCard = $('startCard'), pauseCard = $('pauseCard'), overCard = $('overCard'), pauseBtn = $('pauseBtn');
  var elScore = $('score'), elBest = $('best'), elTime = $('time'), elCap = $('caption');
  var BEST_KEY = 'pxc.studio.cloudpop.best';
  var best = 0;
  try { best = parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) {}
  elBest.textContent = best;

  var N = 8, ROUND = 60;
  var KINDS = [
    { k: 'drop', name: 'cloud droplets', note: 'they merge into raindrops' },
    { k: 'ice', name: 'ice crystals', note: 'they grow fast in mixed clouds' },
    { k: 'bc', name: 'black carbon', note: 'it absorbs sunlight and warms the cloud layer' },
    { k: 'so4', name: 'sulphate', note: 'it seeds many small droplets for brighter clouds' },
    { k: 'dust', name: 'dust', note: 'a good seed for ice' },
    { k: 'salt', name: 'sea salt', note: 'big seeds that help rain form' }
  ];
  var W = 0, dpr = 1, cell = 0, ox = 0, oy = 0;
  var mode = 'start', last = 0, clock = 0;
  var grid, state, sel, score, timeLeft, combo, pending, floats, idleT, hint, uid = 0;

  function rnd(n) { return Math.floor(Math.random() * n); }
  function tile(k, r, c, y) { return { k: k, r: r, c: c, x: c, y: y === undefined ? r : y, pop: 0, id: uid++ }; }
  function newGrid() {
    var g = [];
    for (var r = 0; r < N; r++) { g.push([]); for (var c = 0; c < N; c++) {
      var k; do { k = rnd(KINDS.length); } while ((c >= 2 && g[r][c - 1].k === k && g[r][c - 2].k === k) || (r >= 2 && g[r - 1][c].k === k && g[r - 2][c].k === k));
      g[r].push(tile(k, r, c, r - N - 1));
    } }
    return g;
  }
  function findMatches() {
    var hit = {}, runs = [], r, c, n;
    for (r = 0; r < N; r++) for (c = 0; c < N; c = c + n) {
      n = 1; while (c + n < N && grid[r][c + n] && grid[r][c] && grid[r][c + n].k === grid[r][c].k) n++;
      if (n >= 3 && grid[r][c]) { runs.push({ k: grid[r][c].k, n: n }); for (var i = 0; i < n; i++) hit[r + ',' + (c + i)] = 1; }
    }
    for (c = 0; c < N; c++) for (r = 0; r < N; r = r + n) {
      n = 1; while (r + n < N && grid[r + n][c] && grid[r][c] && grid[r + n][c].k === grid[r][c].k) n++;
      if (n >= 3 && grid[r][c]) { runs.push({ k: grid[r][c].k, n: n }); for (var j = 0; j < n; j++) hit[(r + j) + ',' + c] = 1; }
    }
    return { cells: Object.keys(hit), runs: runs };
  }
  function swapCells(a, b) {
    var t = grid[a.r][a.c]; grid[a.r][a.c] = grid[b.r][b.c]; grid[b.r][b.c] = t;
    grid[a.r][a.c].r = a.r; grid[a.r][a.c].c = a.c; grid[b.r][b.c].r = b.r; grid[b.r][b.c].c = b.c;
  }
  function findMove() {
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) for (var d = 0; d < 2; d++) {
      var b = d ? { r: r + 1, c: c } : { r: r, c: c + 1 };
      if (b.r >= N || b.c >= N) continue;
      swapCells({ r: r, c: c }, b); var ok = findMatches().cells.length > 0; swapCells({ r: r, c: c }, b);
      if (ok) return [{ r: r, c: c }, b];
    }
    return null;
  }
  function settled() {
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) { var t = grid[r][c]; if (t && (Math.abs(t.x - t.c) > 0.001 || Math.abs(t.y - t.r) > 0.001)) return false; }
    return true;
  }

  function trySwap(a, b) {
    if (mode !== 'play' || state !== 'idle') return;
    if (Math.abs(a.r - b.r) + Math.abs(a.c - b.c) !== 1) return;
    sel = null; hint = null; idleT = 0;
    swapCells(a, b); pending = { a: a, b: b };
    state = 'swap';
  }
  function resolve() {
    var m = findMatches();
    if (!m.cells.length) return false;
    combo++;
    var gained = 0;
    m.cells.forEach(function (key) { var p = key.split(','); grid[+p[0]][+p[1]].pop = 0.0001; });
    m.runs.forEach(function (run) { gained += run.n * 10 + Math.max(0, run.n - 3) * 20; });
    gained *= combo; score += gained;
    var big = m.runs.reduce(function (a, b) { return b.n > a.n ? b : a; });
    var K = KINDS[big.k];
    elCap.textContent = 'Matched ' + big.n + ' ' + K.name + ': ' + K.note + '.';
    var cx = 0, cy = 0; m.cells.forEach(function (key) { var p = key.split(','); cy += +p[0]; cx += +p[1]; });
    cx /= m.cells.length; cy /= m.cells.length;
    floats.push({ x: cx, y: cy, text: '+' + gained, t: 0 });
    if (combo > 1) floats = floats.filter(function (f) { return !f.big; });
    if (combo > 1) floats.push({ x: N / 2 - 0.5, y: N / 2 - 0.5, text: 'Combo ×' + combo, t: 0, big: true });
    hud(); state = 'clear';
    return true;
  }
  function collapse() {
    for (var c = 0; c < N; c++) {
      var col = [];
      for (var r = N - 1; r >= 0; r--) if (grid[r][c] && !grid[r][c].pop) col.push(grid[r][c]);
      var miss = N - col.length;
      for (var i = 0; i < miss; i++) col.push(tile(rnd(KINDS.length), 0, c, -1 - i));
      for (var rr = N - 1, j = 0; rr >= 0; rr--, j++) { var t = col[j]; t.r = rr; t.c = c; grid[rr][c] = t; }
    }
    state = 'fall';
  }

  function update(dt) {
    var r, c, t, sp = state === 'fall' ? 11 : 8;
    for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
      t = grid[r][c];
      var dx = t.c - t.x, dy = t.r - t.y, m = sp * dt;
      t.x += Math.abs(dx) <= m ? dx : Math.sign(dx) * m;
      t.y += Math.abs(dy) <= m ? dy : Math.sign(dy) * m;
      if (t.pop) t.pop += dt;
    }
    if (state === 'swap' && settled()) {
      combo = 0;
      if (!resolve()) { swapCells(pending.a, pending.b); state = 'unswap'; elCap.textContent = 'No match there. Try another swap.'; }
    } else if (state === 'unswap' && settled()) { state = 'idle'; }
    else if (state === 'clear') {
      var done = true; for (r = 0; r < N; r++) for (c = 0; c < N; c++) if (grid[r][c].pop && grid[r][c].pop < 0.24) done = false;
      if (done) collapse();
    } else if (state === 'fall' && settled()) {
      if (!resolve()) {
        state = 'idle';
        if (!findMove()) { reshuffle(); elCap.textContent = 'No moves left, so the sky reshuffled.'; }
      }
    }
    if (state === 'idle') { idleT += dt; if (idleT > 6 && !hint) hint = findMove(); }
    for (var i = floats.length - 1; i >= 0; i--) { floats[i].t += dt; if (floats[i].t > 1.1) floats.splice(i, 1); }
  }
  function reshuffle() {
    do { grid = newGrid(); } while (!findMove());
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) grid[r][c].y = r - N - 1;
    state = 'fall';
  }

  function hud() {
    elScore.textContent = score;
    elTime.textContent = Math.ceil(Math.max(0, timeLeft));
    if (score > best) { best = score; elBest.textContent = best; }
  }
  function tier(s) { return s < 800 ? 'Light haze' : s < 1800 ? 'Fair-weather cumulus' : s < 3200 ? 'Towering cumulus' : 'Thunderhead'; }
  function over() {
    mode = 'over'; timeLeft = 0; sel = null; hint = null; down = null; hud();
    try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {}
    $('overReason').textContent = tier(score);
    $('overScore').textContent = score;
    $('overBest').textContent = (score >= best && score > 0 ? 'New best · ' : 'Best ') + best;
    overCard.hidden = false; pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false');
  }
  function start() {
    do { grid = newGrid(); } while (!findMove());
    state = 'fall'; sel = null; score = 0; timeLeft = ROUND; combo = 0; floats = []; idleT = 0; hint = null; mode = 'play';
    startCard.hidden = overCard.hidden = pauseCard.hidden = true;
    pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false');
    elCap.textContent = 'Line up three of a kind to clear them.'; hud();
  }
  function togglePause() {
    if (mode === 'play') { mode = 'pause'; pauseCard.hidden = false; pauseBtn.textContent = 'Resume'; pauseBtn.setAttribute('aria-pressed', 'true'); }
    else if (mode === 'pause') { mode = 'play'; pauseCard.hidden = true; pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false'); }
  }

  /* ---------- drawing ---------- */
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function piece(c, k, x, y, s, phase) {
    var R = s * 0.34, i, a;
    c.save(); c.translate(x, y);
    if (k === 0) { // droplet
      c.fillStyle = '#7fb0c9'; c.beginPath(); c.arc(0, 0, R, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(255,255,255,.65)'; c.beginPath(); c.arc(-R * .32, -R * .32, R * .28, 0, 6.283); c.fill();
    } else if (k === 1) { // ice crystal
      c.strokeStyle = '#5e8fa6'; c.lineWidth = Math.max(1.5, s * 0.06); c.lineCap = 'round';
      c.fillStyle = '#e9f2f6'; c.beginPath();
      for (i = 0; i < 6; i++) { a = i / 6 * 6.283 + (phase || 0); c.lineTo(Math.cos(a) * R, Math.sin(a) * R); }
      c.closePath(); c.fill(); c.stroke();
      for (i = 0; i < 3; i++) { a = i / 6 * 6.283 + (phase || 0); c.beginPath(); c.moveTo(Math.cos(a) * R * .75, Math.sin(a) * R * .75); c.lineTo(-Math.cos(a) * R * .75, -Math.sin(a) * R * .75); c.stroke(); }
    } else if (k === 2) { // black carbon cluster
      c.fillStyle = '#1c1915';
      [[-.35, -.25, .42], [.3, -.3, .38], [-.1, .3, .45], [.4, .3, .3]].forEach(function (p) { c.beginPath(); c.arc(p[0] * R, p[1] * R, p[2] * R, 0, 6.283); c.fill(); });
    } else if (k === 3) { // sulphate
      c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(0, 0, R * .92, 0, 6.283); c.fill();
      c.strokeStyle = 'rgba(255,253,248,.55)'; c.lineWidth = Math.max(1, s * .04); c.beginPath(); c.arc(0, 0, R * .55, 0, 6.283); c.stroke();
    } else if (k === 4) { // dust
      c.fillStyle = '#b4532f'; c.beginPath();
      var pts = [1, .75, .95, .7, 1, .8, .9, .72];
      for (i = 0; i < 8; i++) { a = i / 8 * 6.283; c.lineTo(Math.cos(a) * R * pts[i], Math.sin(a) * R * pts[i]); }
      c.closePath(); c.fill();
    } else { // sea salt cube
      c.fillStyle = '#2f7a6c'; rr(c, -R * .8, -R * .8, R * 1.6, R * 1.6, R * .25); c.fill();
      c.fillStyle = 'rgba(255,255,255,.22)'; rr(c, -R * .8, -R * .8, R * 1.6, R * .55, R * .25); c.fill();
    }
    c.restore();
  }
  function resize() {
    var r = stage.getBoundingClientRect();
    W = Math.max(200, Math.floor(Math.min(r.width, r.height)));
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var pad = Math.max(10, W * 0.03);
    cell = (W - pad * 2) / N; ox = (r.width - cell * N) / 2; oy = pad;
    draw();
  }
  function draw() {
    var r = stage.getBoundingClientRect(), H = r.height, Wd = r.width;
    ctx.clearRect(0, 0, Wd, H);
    var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#e6edef'); g.addColorStop(1, '#f6f1e7');
    ctx.fillStyle = g; ctx.fillRect(0, 0, Wd, H);
    if (!grid) return;
    var rr0, c0, t;
    ctx.save(); rr(ctx, ox, oy, cell * N, cell * N, cell * .3); ctx.clip();
    for (rr0 = 0; rr0 < N; rr0++) for (c0 = 0; c0 < N; c0++) {
      ctx.fillStyle = (rr0 + c0) % 2 ? 'rgba(255,253,248,.75)' : 'rgba(255,253,248,.5)';
      ctx.fillRect(ox + c0 * cell, oy + rr0 * cell, cell, cell);
    }
    for (rr0 = 0; rr0 < N; rr0++) for (c0 = 0; c0 < N; c0++) {
      t = grid[rr0][c0]; if (!t) continue;
      var x = ox + (t.x + .5) * cell, y = oy + (t.y + .5) * cell;
      if (y < oy - cell) continue;
      var s = cell, alpha = 1;
      if (t.pop) { var p = Math.min(1, t.pop / 0.24); s = cell * (1 + p * 0.35); alpha = 1 - p; }
      ctx.globalAlpha = alpha;
      piece(ctx, t.k, x, y, s, t.k === 1 && !reduce ? clock * 0.3 : 0);
      ctx.globalAlpha = 1;
      if (t.pop && !reduce) { ctx.strokeStyle = 'rgba(255,253,248,' + (1 - t.pop / 0.24).toFixed(2) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, cell * (0.3 + t.pop * 2), 0, 6.283); ctx.stroke(); }
    }
    ctx.restore();
    if (sel) {
      ctx.strokeStyle = '#8a6a2f'; ctx.lineWidth = 3;
      rr(ctx, ox + sel.c * cell + 3, oy + sel.r * cell + 3, cell - 6, cell - 6, cell * .22); ctx.stroke();
    }
    if (hint && mode === 'play' && state === 'idle') {
      var pulse = reduce ? .6 : .35 + .35 * Math.sin(clock * 5);
      ctx.strokeStyle = 'rgba(31,77,69,' + pulse.toFixed(2) + ')'; ctx.lineWidth = 2.5;
      hint.forEach(function (h) { rr(ctx, ox + h.c * cell + 4, oy + h.r * cell + 4, cell - 8, cell - 8, cell * .22); ctx.stroke(); });
    }
    // timer bar under the board
    var by = oy + cell * N + Math.max(6, (H - oy - cell * N) / 2 - 3), frac = mode === 'start' ? 1 : Math.max(0, timeLeft / ROUND);
    ctx.fillStyle = 'rgba(28,25,21,.1)'; rr(ctx, ox, by, cell * N, 6, 3); ctx.fill();
    ctx.fillStyle = frac < .2 ? '#9a3b24' : '#1f4d45'; if (frac > 0) { rr(ctx, ox, by, Math.max(6, cell * N * frac), 6, 3); ctx.fill(); }
    floats.forEach(function (f) {
      var a = 1 - f.t / 1.1, rise = reduce ? 0 : f.t * cell * .6;
      ctx.globalAlpha = Math.max(0, a); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = (f.big ? '500 ' + Math.round(cell * .62) + 'px Fraunces, Georgia, serif' : '600 ' + Math.round(cell * .36) + 'px "Source Sans 3", sans-serif');
      var fx = ox + (f.x + .5) * cell, fy = oy + (f.y + .5) * cell - rise;
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,253,248,.9)'; ctx.strokeText(f.text, fx, fy);
      ctx.fillStyle = f.big ? '#9a3b24' : '#1c1915'; ctx.fillText(f.text, fx, fy);
      ctx.globalAlpha = 1;
    });
  }
  function loop(now) {
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (mode !== 'pause') clock += dt;
    if (mode === 'play') {
      update(dt);
      timeLeft -= dt;
      elTime.textContent = Math.ceil(Math.max(0, timeLeft));
      if (timeLeft <= 0) over();
    }
    draw();
    requestAnimationFrame(loop);
  }

  /* ---------- input ---------- */
  function cellAt(e) {
    var r = cv.getBoundingClientRect(), x = e.clientX - r.left - ox, y = e.clientY - r.top - oy;
    var c = Math.floor(x / cell), rw = Math.floor(y / cell);
    if (c < 0 || rw < 0 || c >= N || rw >= N) return null;
    return { r: rw, c: c, x: e.clientX, y: e.clientY };
  }
  var down = null;
  cv.addEventListener('pointerdown', function (e) {
    if (mode !== 'play') return;
    e.preventDefault();
    var p = cellAt(e); if (!p) return;
    down = p; try { cv.setPointerCapture(e.pointerId); } catch (x) {}
  });
  cv.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > cell * 0.35) {
      var b = Math.abs(dx) > Math.abs(dy) ? { r: down.r, c: down.c + (dx > 0 ? 1 : -1) } : { r: down.r + (dy > 0 ? 1 : -1), c: down.c };
      var a = { r: down.r, c: down.c }; down = null;
      if (b.r >= 0 && b.c >= 0 && b.r < N && b.c < N) trySwap(a, b);
    }
  });
  cv.addEventListener('pointerup', function (e) {
    if (!down) return;
    var p = down; down = null;
    if (sel && Math.abs(sel.r - p.r) + Math.abs(sel.c - p.c) === 1) trySwap(sel, { r: p.r, c: p.c });
    else if (sel && sel.r === p.r && sel.c === p.c) sel = null;
    else sel = { r: p.r, c: p.c };
  });
  cv.addEventListener('pointercancel', function () { down = null; });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (e.key === ' ' || e.code === 'Space') {
      if (tag === 'BUTTON') return;
      e.preventDefault();
      if (mode === 'start' || mode === 'over') start(); else togglePause();
    } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { if (mode === 'play' || mode === 'pause') togglePause(); }
  });
  $('startBtn').addEventListener('click', start);
  $('againBtn').addEventListener('click', start);
  $('restartBtn').addEventListener('click', start);
  $('resumeBtn').addEventListener('click', togglePause);
  pauseBtn.addEventListener('click', function () { if (mode === 'play' || mode === 'pause') togglePause(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && mode === 'play') togglePause(); });

  // legend with the same drawings
  var lg = $('legend');
  KINDS.forEach(function (K, i) {
    var li = document.createElement('li'), c = document.createElement('canvas'), d = Math.min(window.devicePixelRatio || 1, 3);
    c.className = 'shape'; c.width = 22 * d; c.height = 22 * d; c.style.width = '22px'; c.style.height = '22px'; c.setAttribute('aria-hidden', 'true');
    var x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); piece(x, i, 11, 11, 26, 0);
    li.appendChild(c); li.appendChild(document.createTextNode(K.name.charAt(0).toUpperCase() + K.name.slice(1)));
    lg.appendChild(li);
  });


  do { grid = newGrid(); } while (!findMove());
  for (var r0 = 0; r0 < N; r0++) for (var c0 = 0; c0 < N; c0++) grid[r0][c0].y = r0;
  state = 'idle'; floats = []; score = 0; timeLeft = ROUND;
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);
})();
