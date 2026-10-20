/* Aerosol Snake — Studio prototype. Vanilla canvas, no dependencies. */
(function () {
  'use strict';
  var N = 20;                       // grid cells per side
  var TYPES = [
    { key: 'bc',  name: 'Black carbon', col: '#1c1915', glow: 'rgba(28,25,21,.55)',  w: 3 },
    { key: 'so4', name: 'Sulphate',     col: '#c9a24a', glow: 'rgba(201,162,74,.85)', w: 3 },
    { key: 'du',  name: 'Dust',         col: '#b4532f', glow: 'rgba(180,83,47,.8)',   w: 2 },
    { key: 'ss',  name: 'Sea salt',     col: '#2f7a6c', glow: 'rgba(47,122,108,.85)', w: 2 }
  ];
  var START_COL = { col: '#7a7266', glow: 'rgba(122,114,102,.5)' };
  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var stage = document.getElementById('stage');
  var cv = document.getElementById('board');
  var ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var elScore = $('score'), elBest = $('best'), elLen = $('len');
  var startCard = $('startCard'), pauseCard = $('pauseCard'), overCard = $('overCard');
  var pauseBtn = $('pauseBtn');

  var BEST_KEY = 'pxc.studio.snake.best';
  var best = 0;
  try { best = parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) {}
  elBest.textContent = best;

  var size = 0, cell = 0, dpr = 1;
  var S; // game state
  var mode = 'start'; // start | play | pause | over
  var last = 0, acc = 0, t = 0;

  function fresh() {
    return {
      snake: [{ x: 6, y: 10 }, { x: 5, y: 10 }, { x: 4, y: 10 }], cols: [START_COL, START_COL, START_COL],
      dir: 'right', queue: [], grow: 0,
      food: null, clouds: [], score: 0, step: 150, cloudTimer: 3, bursts: []
    };
  }

  function resize() {
    var r = stage.getBoundingClientRect();
    size = Math.max(200, Math.floor(r.width));
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = Math.round(size * dpr);
    cv.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = size / N;
    draw();
  }

  function pickType() {
    var tot = 0, i; for (i = 0; i < TYPES.length; i++) tot += TYPES[i].w;
    var r = Math.random() * tot;
    for (i = 0; i < TYPES.length; i++) { r -= TYPES[i].w; if (r <= 0) return TYPES[i]; }
    return TYPES[0];
  }
  function occupied(x, y) {
    for (var i = 0; i < S.snake.length; i++) if (S.snake[i].x === x && S.snake[i].y === y) return true;
    return inCloud(x, y);
  }
  function inCloud(x, y) {
    for (var i = 0; i < S.clouds.length; i++) {
      var c = S.clouds[i], cx = Math.floor(c.x);
      if (x >= cx && x < cx + c.w && y >= c.y && y < c.y + c.h) return true;
    }
    return false;
  }
  function placeFood() {
    for (var k = 0; k < 400; k++) {
      var x = 1 + Math.floor(Math.random() * (N - 2)), y = 1 + Math.floor(Math.random() * (N - 2));
      if (!occupied(x, y)) { S.food = { x: x, y: y, type: pickType(), born: t }; return; }
    }
  }
  function spawnCloud() {
    var h = S.snake[0];
    var w = 2 + Math.floor(Math.random() * 2), hh = Math.random() < 0.5 ? 1 : 2;
    var fromLeft = Math.random() < 0.5;
    var y, tries = 0;
    do { y = 1 + Math.floor(Math.random() * (N - 2 - hh)); tries++; }
    while (tries < 30 && h.y >= y - 2 && h.y <= y + hh + 1);
    var speed = (1.1 + Math.random() * 0.9) * (fromLeft ? 1 : -1);
    S.clouds.push({ x: fromLeft ? -w : N, y: y, w: w, h: hh, vx: speed, seed: Math.random() * 10 });
  }

  function setDir(d) {
    if (mode !== 'play') return;
    var lastDir = S.queue.length ? S.queue[S.queue.length - 1] : S.dir;
    if (d === lastDir) return;
    var a = DIRS[d], b = DIRS[lastDir];
    if (a[0] === -b[0] && a[1] === -b[1]) return; // no reversing
    if (S.queue.length < 3) S.queue.push(d);
  }

  function tick() {
    if (S.queue.length) S.dir = S.queue.shift();
    var d = DIRS[S.dir], h = S.snake[0];
    var nx = h.x + d[0], ny = h.y + d[1];
    if (nx < 0 || ny < 0 || nx >= N || ny >= N) return over('Drifted out of the atmosphere');
    var tailFree = S.grow === 0;
    for (var i = 0; i < S.snake.length - (tailFree ? 1 : 0); i++) {
      if (S.snake[i].x === nx && S.snake[i].y === ny) return over('Coagulated with your own plume');
    }
    if (inCloud(nx, ny)) return over('Rained out by a cloud');
    S.snake.unshift({ x: nx, y: ny });
    if (S.grow > 0) S.grow--; else S.snake.pop();
    if (S.food && S.food.x === nx && S.food.y === ny) {
      var ty = S.food.type;
      S.score++; S.grow += 3;
      S.cols.unshift(ty, ty, ty); // particle colour bands travel down the plume
      S.step = Math.max(72, 150 - S.score * 3.5);
      S.bursts.push({ x: nx, y: ny, c: ty.col, t: t });
      placeFood();
      hud();
    }
  }

  function updateClouds(dt) {
    if (S.score >= 1) {
      S.cloudTimer -= dt;
      var maxC = S.score >= 12 ? 3 : 2;
      if (S.cloudTimer <= 0) {
        if (S.clouds.length < maxC) spawnCloud();
        S.cloudTimer = Math.max(3, 6 - S.score * 0.2) + Math.random() * 2.5;
      }
    }
    for (var i = S.clouds.length - 1; i >= 0; i--) {
      var c = S.clouds[i];
      c.x += c.vx * dt;
      if (c.x > N + 1 || c.x < -c.w - 1) S.clouds.splice(i, 1);
    }
    var h = S.snake[0];
    if (inCloud(h.x, h.y)) over('Rained out by a cloud');
  }

  function hud() {
    elScore.textContent = S.score;
    elLen.textContent = S.cols.length;
    if (S.score > best) { best = S.score; elBest.textContent = best; try { localStorage.setItem(BEST_KEY, best); } catch (e) {} }
  }

  function over(reason) {
    mode = 'over';
    hud();
    $('overReason').textContent = reason;
    $('overScore').textContent = S.score;
    $('overBest').textContent = (S.score >= best && S.score > 0 ? 'New best · ' : 'Best ') + best;
    overCard.hidden = false;
    pauseBtn.setAttribute('aria-pressed', 'false'); pauseBtn.textContent = 'Pause';
  }

  function start() {
    S = fresh(); placeFood(); hud();
    startCard.hidden = true; overCard.hidden = true; pauseCard.hidden = true;
    mode = 'play'; acc = 0;
    pauseBtn.setAttribute('aria-pressed', 'false'); pauseBtn.textContent = 'Pause';
  }
  function togglePause() {
    if (mode === 'play') { mode = 'pause'; pauseCard.hidden = false; pauseBtn.setAttribute('aria-pressed', 'true'); pauseBtn.textContent = 'Resume'; }
    else if (mode === 'pause') { mode = 'play'; pauseCard.hidden = true; pauseBtn.setAttribute('aria-pressed', 'false'); pauseBtn.textContent = 'Pause'; last = performance.now(); }
  }

  /* ---------- drawing ---------- */
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawBoard() {
    var g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, '#fbf7ef'); g.addColorStop(1, '#f3ecdf');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(28,25,21,.07)';
    for (var i = 1; i < N; i++) for (var j = 1; j < N; j++) {
      ctx.beginPath(); ctx.arc(i * cell, j * cell, Math.max(0.8, cell * 0.04), 0, 6.283); ctx.fill();
    }
  }
  function drawClouds() {
    for (var i = 0; i < S.clouds.length; i++) {
      var c = S.clouds[i];
      var x0 = c.x * cell, y0 = c.y * cell, w = c.w * cell, h = c.h * cell;
      // hit zone tint (snapped cells) so collisions feel fair
      ctx.fillStyle = 'rgba(92,86,76,.08)';
      rr(Math.floor(c.x) * cell + 1, y0 + 1, w - 2, h - 2, cell * 0.3); ctx.fill();
      ctx.save();
      ctx.shadowColor = 'rgba(28,25,21,.18)'; ctx.shadowBlur = cell * 0.5; ctx.shadowOffsetY = cell * 0.08;
      ctx.fillStyle = '#c9cdd0';
      var bob = reduce ? 0 : Math.sin(t * 1.3 + c.seed) * cell * 0.04;
      var cx = x0 + w / 2, cy = y0 + h / 2 + bob;
      ctx.beginPath();
      var puffs = c.w * 2 + c.h;
      for (var k = 0; k < puffs; k++) {
        var a = k / puffs * Math.PI * 2;
        var px = cx + Math.cos(a) * (w / 2 - cell * 0.38), py = cy + Math.sin(a) * (h / 2 - cell * 0.3);
        ctx.moveTo(px + cell * 0.48, py); ctx.arc(px, py, cell * 0.48, 0, 6.283);
      }
      ctx.moveTo(cx + Math.min(w, h) / 2, cy); ctx.ellipse(cx, cy, w / 2 - cell * 0.1, h / 2 - cell * 0.05, 0, 0, 6.283);
      ctx.fill();
      ctx.restore();
      // rain streaks
      ctx.strokeStyle = 'rgba(31,77,69,.35)'; ctx.lineWidth = Math.max(1, cell * 0.06); ctx.lineCap = 'round';
      for (var r = 0; r < c.w; r++) {
        var rx = x0 + (r + 0.5) * cell, ph = reduce ? 0.5 : ((t * 1.6 + r * 0.37 + c.seed) % 1);
        var ry = y0 + h + cell * (0.05 + ph * 0.35);
        ctx.beginPath(); ctx.moveTo(rx - cell * 0.05, ry); ctx.lineTo(rx - cell * 0.12, ry + cell * 0.22); ctx.stroke();
      }
    }
  }
  function drawFood() {
    if (!S.food) return;
    var f = S.food, ty = f.type;
    var cx = (f.x + 0.5) * cell, cy = (f.y + 0.5) * cell;
    var pulse = reduce ? 1 : 1 + Math.sin(t * 5) * 0.08;
    var appear = Math.min(1, (t - f.born) * 4);
    ctx.save();
    ctx.globalAlpha = 0.25 * appear;
    ctx.fillStyle = ty.col;
    ctx.beginPath(); ctx.arc(cx, cy, cell * 0.62 * pulse, 0, 6.283); ctx.fill();
    ctx.globalAlpha = appear;
    ctx.shadowColor = ty.glow; ctx.shadowBlur = cell * 0.7;
    ctx.beginPath(); ctx.arc(cx, cy, cell * 0.3 * pulse, 0, 6.283); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,253,248,.55)';
    ctx.beginPath(); ctx.arc(cx - cell * 0.09, cy - cell * 0.1, cell * 0.08, 0, 6.283); ctx.fill();
    ctx.restore();
  }
  function drawSnake() {
    var sn = S.snake, i, s, inset = cell * 0.1;
    // glow pass, then body
    ctx.save();
    for (i = sn.length - 1; i >= 0; i--) {
      s = sn[i];
      var fade = 1 - (i / Math.max(sn.length, 1)) * 0.45;
      ctx.globalAlpha = fade;
      var sc = S.cols[i] || START_COL;
      ctx.shadowColor = sc.glow; ctx.shadowBlur = i === 0 ? cell * 0.9 : cell * 0.45;
      ctx.fillStyle = sc.col;
      var ins = i === 0 ? inset * 0.4 : inset + Math.min(i, 8) * cell * 0.012;
      rr(s.x * cell + ins, s.y * cell + ins, cell - ins * 2, cell - ins * 2, cell * 0.32);
      ctx.fill();
    }
    ctx.restore();
    // head eyes
    var h = sn[0], d = DIRS[S.dir];
    var hx = (h.x + 0.5) * cell, hy = (h.y + 0.5) * cell;
    var px = -d[1], py = d[0];
    ctx.fillStyle = S.cols[0].col === '#1c1915' ? '#f6f1e7' : '#fffdf8';
    for (var e = -1; e <= 1; e += 2) {
      ctx.beginPath();
      ctx.arc(hx + d[0] * cell * 0.16 + px * e * cell * 0.17, hy + d[1] * cell * 0.16 + py * e * cell * 0.17, cell * 0.075, 0, 6.283);
      ctx.fill();
    }
  }
  function drawBursts() {
    for (var i = S.bursts.length - 1; i >= 0; i--) {
      var b = S.bursts[i], age = t - b.t;
      if (age > 0.6 || reduce) { S.bursts.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = 1 - age / 0.6;
      ctx.strokeStyle = b.c; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc((b.x + 0.5) * cell, (b.y + 0.5) * cell, cell * (0.4 + age * 2.2), 0, 6.283); ctx.stroke();
      ctx.restore();
    }
  }
  function draw() {
    if (!size || !S) return;
    ctx.clearRect(0, 0, size, size);
    drawBoard(); drawFood(); drawSnake(); drawClouds(); drawBursts();
    if (mode !== 'start') {
      ctx.font = '500 ' + Math.round(cell * 1.1) + 'px Fraunces, Georgia, serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(28,25,21,.28)';
      ctx.fillText(String(S.score), cell * 0.6, cell * 0.45);
    }
  }

  function loop(now) {
    var dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    if (mode === 'play') {
      t += dt;
      acc += dt * 1000;
      while (acc >= S.step && mode === 'play') { acc -= S.step; tick(); }
      if (mode === 'play') updateClouds(dt);
    } else if (!reduce && mode !== 'pause') {
      t += dt; // gentle idle animation on start/over screens
    }
    draw();
    requestAnimationFrame(loop);
  }

  /* ---------- input ---------- */
  var KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (KEYMAP[e.key]) {
      if (mode === 'play' || mode === 'pause') e.preventDefault();
      setDir(KEYMAP[e.key]);
    } else if (e.key === ' ' || e.code === 'Space') {
      if (tag === 'BUTTON' && mode !== 'play') return; // let focused buttons activate
      e.preventDefault();
      if (mode === 'start' || mode === 'over') start(); else togglePause();
    } else if ((e.key === 'Enter') && (mode === 'start' || mode === 'over') && tag !== 'BUTTON') {
      start();
    } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (mode === 'play' || mode === 'pause') togglePause();
    }
  });
  var sx = null, sy = null;
  stage.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener('touchmove', function (e) {
    if (sx === null || mode !== 'play') return;
    e.preventDefault();
    var dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 22) {
      setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }
  }, { passive: false });
  stage.addEventListener('touchend', function () { sx = sy = null; }, { passive: true });
  document.querySelectorAll('#dpad button').forEach(function (b) {
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); setDir(b.getAttribute('data-dir')); });
  });
  $('startBtn').addEventListener('click', start);
  $('againBtn').addEventListener('click', start);
  $('restartBtn').addEventListener('click', start);
  $('resumeBtn').addEventListener('click', togglePause);
  pauseBtn.addEventListener('click', function () { if (mode === 'play' || mode === 'pause') togglePause(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && mode === 'play') togglePause(); });


  S = fresh(); placeFood();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);
})();
