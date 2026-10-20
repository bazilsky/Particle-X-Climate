/* Particle Drift — Studio game. Vanilla canvas, no dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), cv = $('sky'), ctx = cv.getContext('2d');
  var startCard = $('startCard'), pauseCard = $('pauseCard'), overCard = $('overCard'), pauseBtn = $('pauseBtn');
  var elDays = $('days'), elBest = $('best'), elAlt = $('alt');
  var BEST_KEY = 'pxc.studio.drift.best';
  var best = 0;
  try { best = parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) {}
  elBest.textContent = best;

  var VIEW = 12;           // km of atmosphere visible top to bottom
  // tuning
  var P = {
    thrust: 1.28, falloff: 75, tropo: 0.76, sink: 0.32, sinkExp: 1.1,   // climb, tropopause drag, settling
    gainLow: 0.006, gainHigh: 0.05, coag: 0.5,                          // weight gain (faster in the stratosphere)
    rainEvery: 0.55, cloudEvery: 3.2, bigEvery: 2.2, rampSecs: 35, rampMax: 99,
    startEase: 25, easeBase: 0.3, firstRain: 1.5, firstCloud: 3,         // hazards build up over the first 25 s
    rainHit: 0.9, dropHit: 0.9, grace: 2.5,                              // slightly forgiving hitboxes, 2.5 s spawn shield
    aim: 0.4, aimSpread: 0.05, cloudAim: 0.4,                           // some rain and clouds form in your path
    rainV: 2.8, rainDeck: 0.3, deckBelow: 10.5                          // rain keeps falling from the high cloud deck
  };
  var TOP = 49.5;          // stratopause ceiling
  var LAYERS = [[0, 'Boundary layer'], [2, 'Free troposphere'], [12, 'Tropopause'], [17, 'Stratosphere']];
  var SKY = [[0, [239, 228, 207]], [2, [226, 235, 232]], [12, [178, 204, 206]], [17, [96, 124, 134]], [30, [38, 46, 58]], [50, [20, 17, 14]]];
  var BIG = { salt: { col: '#2f7a6c', name: 'sea salt' }, dust: { col: '#b4532f', name: 'dust' }, sulph: { col: '#8a6a2f', name: 'a large sulphate droplet' } };
  var W = 0, H = 0, dpr = 1, u = 1, kmPx = 1;
  var mode = 'start', last = 0, clock = 0, G;
  var keys = { up: false, down: false, left: false, right: false };
  var drag = null;

  function fresh() {
    return { x: 0.5, alt: 1.5, mass: 1, days: 0, t: 0, ents: [], clouds: [], trail: [], flash: 0, note: '', noteT: 0, spawn: { rain: P.firstRain, cloud: P.firstCloud, big: 1.2 } };
  }
  function resize() {
    var r = stage.getBoundingClientRect();
    W = Math.max(200, Math.floor(r.width)); H = Math.max(200, Math.floor(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    u = Math.min(W, H) / 100; kmPx = H / VIEW;
    draw();
  }
  var PY = function () { return H * 0.6; };
  function sy(alt) { return PY() - (alt - G.alt) * kmPx; }
  function pr() { return u * (2 + 0.6 * (G.mass - 1)); }
  function layerName(a) { var n = LAYERS[0][1]; for (var i = 0; i < LAYERS.length; i++) if (a >= LAYERS[i][0]) n = LAYERS[i][1]; return n; }
  function skyCol(a) {
    for (var i = 1; i < SKY.length; i++) if (a <= SKY[i][0]) {
      var k = (a - SKY[i - 1][0]) / (SKY[i][0] - SKY[i - 1][0]), A = SKY[i - 1][1], B = SKY[i][1];
      return 'rgb(' + [0, 1, 2].map(function (j) { return Math.round(A[j] + (B[j] - A[j]) * k); }).join(',') + ')';
    }
    return 'rgb(20,17,14)';
  }

  /* ---------- spawning ---------- */
  function spawn(dt) {
    var k = Math.min(P.rampMax, 1 + G.t / P.rampSecs) * (P.startEase ? Math.min(1, P.easeBase + G.t / P.startEase * (1 - P.easeBase)) : 1), top = G.alt + (H - PY()) / kmPx + VIEW * 0.0, viewTop = G.alt + PY() / kmPx, viewBot = G.alt - (H - PY()) / kmPx;
    var s = G.spawn;
    // rain falls from below the tropopause
    s.rain -= dt;
    if (s.rain <= 0) {
      s.rain = P.rainEvery / k * (0.6 + Math.random() * 0.8);
      var ra = viewTop + Math.random() * 1.5;
      if (ra > 11.5 && G.alt < P.deckBelow && Math.random() < P.rainDeck) ra = 11.4 - Math.random() * 0.4; // rain keeps forming at the cloud deck while you are below it
      var rx = Math.random() < P.aim ? Math.max(0.03, Math.min(0.97, G.x + (Math.random() - 0.5) * P.aimSpread)) : Math.random(); // some rain falls right on you
      if (ra < 11.5) G.ents.push({ kind: 'rain', x: rx, alt: ra, vx: -0.02, va: -(P.rainV + Math.random() * 1.4), r: 0.55 });
    }
    // clouds of droplets drift sideways in the troposphere
    s.cloud -= dt;
    if (s.cloud <= 0) {
      s.cloud = P.cloudEvery / k * (0.7 + Math.random() * 0.6);
      var lo = Math.max(2.5, viewBot), hi = Math.min(10.5, viewTop + 1.5);
      if (hi > lo) {
        var ca = Math.random() < P.cloudAim ? Math.max(lo, Math.min(hi, G.alt + 1.5 + Math.random() * 2.5)) : lo + Math.random() * (hi - lo), left = Math.random() < 0.5, vx = (0.05 + Math.random() * 0.05) * (left ? 1 : -1);
        var cx = left ? -0.15 : 1.15, n = 4 + Math.floor(Math.random() * 4), cl = { x: cx, alt: ca, vx: vx, w: 0.16 + n * 0.012, h: 0.9 };
        G.clouds.push(cl);
        for (var i = 0; i < n; i++) G.ents.push({ kind: 'drop', cloud: cl, dx: (Math.random() - 0.5) * cl.w, da: (Math.random() - 0.5) * cl.h, x: 0, alt: 0, vx: vx, va: 0, r: 1.3, ph: Math.random() * 6 });
      }
    }
    // bigger particles drift in from the sides
    s.big -= dt;
    if (s.big <= 0) {
      s.big = P.bigEvery / k * (0.6 + Math.random() * 0.8);
      var ba = viewBot + 1 + Math.random() * (viewTop - viewBot - 1.5);
      if (ba > 0.3 && ba < TOP) {
        var kind = ba < 2 ? 'salt' : ba < 15 ? 'dust' : 'sulph', fromL = Math.random() < 0.5;
        G.ents.push({ kind: 'big', type: kind, x: fromL ? -0.05 : 1.05, alt: ba, vx: (0.07 + Math.random() * 0.08) * (fromL ? 1 : -1), va: -0.08, r: 2.3 + Math.random() * 0.8, ph: Math.random() * 6 });
      }
    }
  }

  function step(dt) {
    G.t += dt;
    // controls
    var up = keys.up, down = keys.down, h = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (drag) {
      var dy = drag.y - PY(), dx = drag.x / W - G.x;
      up = up || dy < -u * 3; down = down || dy > u * 3;
      h = Math.max(-1, Math.min(1, dx * 8));
    }
    var thrust = P.thrust * (1 - G.alt / P.falloff) / Math.sqrt(G.mass);
    if (G.alt > 12 && G.alt < 17) thrust *= P.tropo; // cold, stable tropopause is harder to cross
    var sink = P.sink * Math.pow(G.mass, P.sinkExp);
    var va = -sink + (up ? thrust : 0) - (down ? 1.3 : 0);
    G.alt = Math.min(TOP, G.alt + va * dt);
    G.x = Math.max(0.04, Math.min(0.96, G.x + h * 0.5 * dt));
    G.mass += dt * (G.alt > 17 ? P.gainHigh : P.gainLow); // condensation slowly adds mass
    G.grace = Math.max(0, G.grace - dt);
    G.days += dt * (0.5 + G.alt * 0.22);
    G.flash = Math.max(0, G.flash - dt * 2); G.noteT = Math.max(0, G.noteT - dt);
    if (!reduce) { G.trail.unshift([G.x, G.alt]); if (G.trail.length > 14) G.trail.pop(); } else G.trail.length = 0;
    if (G.alt <= 0) return over('Settled back to the surface', 'Deposited');

    spawn(dt);
    var i, e, px = G.x * W, py = PY(), r0 = pr();
    for (i = G.clouds.length - 1; i >= 0; i--) { var c = G.clouds[i]; c.x += c.vx * dt; if (c.x < -0.4 || c.x > 1.4) G.clouds.splice(i, 1); }
    for (i = G.ents.length - 1; i >= 0; i--) {
      e = G.ents[i];
      if (e.cloud) { e.x = e.cloud.x + e.dx; e.alt = e.cloud.alt + e.da + (reduce ? 0 : Math.sin(G.t * 1.5 + e.ph) * 0.05); }
      else { e.x += e.vx * dt; e.alt += e.va * dt; }
      if (e.x < -0.5 || e.x > 1.5 || e.alt < G.alt - VIEW || e.alt > G.alt + VIEW * 1.5) { G.ents.splice(i, 1); continue; }
      var ex = e.x * W, ey = sy(e.alt), d = Math.hypot(ex - px, ey - py);
      if (e.kind === 'rain') {
        // streak: test head and a point up the streak
        var d2 = Math.hypot(ex - px, ey - kmPx * 0.35 - py);
        if (!G.grace && Math.min(d, d2) < (r0 + e.r * u) * P.rainHit) return over('Washed out by rain', 'Washout');
      } else if (e.kind === 'drop') {
        if (!G.grace && d < (r0 + e.r * u) * P.dropHit) return over('Scavenged by a cloud droplet', 'Washout');
      } else if (d < r0 + e.r * u) {
        G.mass += P.coag; G.flash = 1; G.note = 'Coagulated with ' + BIG[e.type].name; G.noteT = 2.2;
        G.ents.splice(i, 1);
      }
    }
  }

  function hud() {
    elDays.textContent = Math.floor(G.days);
    elAlt.textContent = Math.max(0, G.alt).toFixed(1);
    if (Math.floor(G.days) > best) { best = Math.floor(G.days); elBest.textContent = best; }
  }
  function fmtDays(d) { d = Math.floor(d); return d >= 365 ? (d / 365).toFixed(1) + ' years' : d + (d === 1 ? ' day' : ' days'); }
  function over(reason, kicker) {
    mode = 'over'; G.alt = Math.max(0, G.alt); hud();
    try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {}
    $('overKicker').textContent = kicker;
    $('overReason').textContent = reason;
    $('overScore').textContent = fmtDays(G.days);
    $('overBest').textContent = (Math.floor(G.days) >= best && G.days >= 1 ? 'New best · ' : 'Best ') + best + ' days · top ' + G.top.toFixed(1) + ' km';
    overCard.hidden = false; pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false');
    keys.up = keys.down = keys.left = keys.right = false; drag = null;
  }
  function start() {
    G = fresh(); G.top = G.alt; G.grace = P.grace; mode = 'play';
    startCard.hidden = overCard.hidden = pauseCard.hidden = true;
    pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false'); hud();
  }
  function togglePause() {
    if (mode === 'play') { mode = 'pause'; pauseCard.hidden = false; pauseBtn.textContent = 'Resume'; pauseBtn.setAttribute('aria-pressed', 'true'); keys.up = keys.down = keys.left = keys.right = false; drag = null; }
    else if (mode === 'pause') { mode = 'play'; pauseCard.hidden = true; pauseBtn.textContent = 'Pause'; pauseBtn.setAttribute('aria-pressed', 'false'); }
  }

  /* ---------- drawing ---------- */
  function drawSky() {
    var aTop = G.alt + PY() / kmPx, aBot = G.alt - (H - PY()) / kmPx;
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, skyCol(Math.min(50, aTop)));
    SKY.forEach(function (s) { if (s[0] < aTop && s[0] > aBot) g.addColorStop((aTop - s[0]) / (aTop - aBot), skyCol(s[0])); });
    g.addColorStop(1, skyCol(Math.max(0, aBot)));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (aTop > 20) { // stars high up
      var a = Math.min(1, (aTop - 20) / 10);
      for (var i = 0; i < 50; i++) {
        var sx = (i * 137.5 % 100) / 100 * W, sAlt = 20 + (i * 53 % 300) / 10;
        var yy = sy(sAlt); if (yy < 0 || yy > H) continue;
        var tw = reduce ? 0.6 : 0.4 + 0.3 * Math.sin(clock * 1.7 + i);
        ctx.fillStyle = 'rgba(246,241,231,' + (a * tw).toFixed(2) + ')'; ctx.fillRect(sx, yy, 1.4, 1.4);
      }
    }
    // ground
    var gy = sy(0);
    if (gy < H) {
      var hz = ctx.createLinearGradient(0, gy - kmPx * 0.8, 0, gy);
      hz.addColorStop(0, 'rgba(239,228,207,0)'); hz.addColorStop(1, 'rgba(239,228,207,.85)');
      ctx.fillStyle = hz; ctx.fillRect(0, gy - kmPx * 0.8, W, kmPx * 0.8);
      var lg = ctx.createLinearGradient(0, gy, 0, H); lg.addColorStop(0, '#c2a76a'); lg.addColorStop(1, '#8a6a2f');
      ctx.fillStyle = lg; ctx.fillRect(0, gy, W * 0.64, H - gy);
      var sg = ctx.createLinearGradient(0, gy, 0, H); sg.addColorStop(0, '#4f8f82'); sg.addColorStop(1, '#1f4d45');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(W * 0.6, gy); ctx.quadraticCurveTo(W * 0.63, gy + (H - gy) * 0.5, W * 0.58, H); ctx.lineTo(W, H); ctx.lineTo(W, gy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(28,25,21,.18)'; ctx.fillRect(0, gy, W, 1.5);
    }
    // high cloud deck under the tropopause, where the rain forms
    var dTop = sy(11.9), dBot = sy(10.9);
    if (dBot > 0 && dTop < H) {
      var dk = ctx.createLinearGradient(0, dTop, 0, dBot);
      dk.addColorStop(0, 'rgba(255,253,248,0)'); dk.addColorStop(0.55, 'rgba(255,253,248,.34)'); dk.addColorStop(1, 'rgba(255,253,248,0)');
      ctx.fillStyle = dk; ctx.fillRect(0, dTop, W, dBot - dTop);
      ctx.fillStyle = 'rgba(255,253,248,.22)';
      for (var di = 0; di < 9; di++) {
        var dxp = ((di * 0.137 + clock * 0.004) % 1.2 - 0.1) * W;
        ctx.beginPath(); ctx.ellipse(dxp, sy(11.45 + (di % 3) * 0.08), W * 0.09, kmPx * 0.22, 0, 0, 6.283); ctx.fill();
      }
    }
    // layer boundaries and labels
    ctx.font = '600 ' + Math.max(10, Math.round(u * 2.4)) + 'px "Source Sans 3", sans-serif';
    ctx.textBaseline = 'bottom';
    LAYERS.forEach(function (L) {
      var y = sy(L[0]);
      var dark = L[0] < 14;
      var ink = dark ? 'rgba(28,25,21,' : 'rgba(246,241,231,';
      if (L[0] > 0 && y > -20 && y < H + 20) {
        ctx.strokeStyle = ink + '.28)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); ctx.setLineDash([]);
      }
      var ly = L[0] === 0 ? y - 8 : y - 6;
      if (ly > 18 && ly < H - 4) { ctx.textAlign = 'left'; ctx.fillStyle = ink + '.62)'; ctx.fillText(L[1].toUpperCase(), 12, ly); }
    });
    // altitude ticks
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (var km = Math.ceil(aBot / 2) * 2; km <= aTop; km += 2) {
      if (km <= 0) continue;
      var ty = sy(km); var lt = km < 14;
      ctx.fillStyle = lt ? 'rgba(28,25,21,.4)' : 'rgba(246,241,231,.5)';
      ctx.fillRect(W - 8, ty, 8, 1);
      ctx.fillText(km + ' km', W - 12, ty);
    }
  }
  function drawEnts() {
    var i, e;
    G.clouds.forEach(function (c) {
      var cx = c.x * W, cy = sy(c.alt), w = c.w * W, h = c.h * kmPx;
      var cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
      cg.addColorStop(0, 'rgba(255,255,255,.75)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.75, h * 0.85, 0, 0, Math.PI * 2); ctx.fill();
    });
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      var x = e.x * W, y = sy(e.alt);
      if (y < -60 || y > H + 60) continue;
      if (e.kind === 'rain') {
        ctx.strokeStyle = 'rgba(47,107,140,.75)'; ctx.lineWidth = Math.max(1.5, u * 0.45); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + kmPx * 0.04, y - kmPx * 0.4); ctx.stroke();
        ctx.fillStyle = 'rgba(47,107,140,.85)'; ctx.beginPath(); ctx.arc(x, y, e.r * u * 1.1, 0, Math.PI * 2); ctx.fill();
      } else if (e.kind === 'drop') {
        ctx.fillStyle = 'rgba(122,170,196,.92)'; ctx.beginPath(); ctx.arc(x, y, e.r * u, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(x - e.r * u * 0.3, y - e.r * u * 0.3, e.r * u * 0.3, 0, Math.PI * 2); ctx.fill();
      } else {
        var b = BIG[e.type], rr = e.r * u, wob = reduce ? 0 : Math.sin(clock * 2 + e.ph) * 0.06;
        ctx.save(); ctx.shadowColor = b.col; ctx.shadowBlur = u * 2;
        ctx.fillStyle = b.col; ctx.beginPath();
        for (var k = 0; k < 9; k++) { var a = k / 9 * Math.PI * 2, rad = rr * (0.85 + 0.15 * Math.sin(k * 2.3 + e.ph) + wob); ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
        ctx.closePath(); ctx.fill(); ctx.restore();
      }
    }
  }
  function drawParticle() {
    var x = G.x * W, y = PY(), r = pr();
    for (var i = G.trail.length - 1; i > 0; i--) {
      var t = G.trail[i];
      ctx.fillStyle = 'rgba(201,162,74,' + (0.28 * (1 - i / G.trail.length)).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(t[0] * W, sy(t[1]), r * (1 - i / 20), 0, Math.PI * 2); ctx.fill();
    }
    ctx.save();
    ctx.shadowColor = G.flash > 0 ? 'rgba(180,83,47,.9)' : 'rgba(232,196,110,.95)'; ctx.shadowBlur = u * (4 + G.flash * 4);
    if (G.grace > 0) ctx.globalAlpha = 0.45 + 0.45 * Math.abs(Math.sin(clock * 12));
    ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,253,248,.7)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2); ctx.fill();
    if (drag) { ctx.strokeStyle = 'rgba(201,162,74,.5)'; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(drag.x, drag.y); ctx.stroke(); ctx.setLineDash([]); }
  }
  function drawHud() {
    var lightText = G.alt > 14;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    var pad = 14, bw = Math.min(230, W * 0.55);
    ctx.fillStyle = lightText ? 'rgba(20,17,14,.45)' : 'rgba(255,253,248,.72)';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(pad - 6, pad - 6, bw, 58, 10) : ctx.rect(pad - 6, pad - 6, bw, 58); ctx.fill();
    ctx.font = '600 11px "Source Sans 3", sans-serif'; ctx.fillStyle = lightText ? 'rgba(217,191,138,.95)' : '#8a6a2f';
    ctx.fillText(layerName(G.alt).toUpperCase() + ' · ' + Math.max(0, G.alt).toFixed(1) + ' KM', pad, pad + 8);
    ctx.font = '500 ' + (W < 500 ? 19 : 22) + 'px Fraunces, Georgia, serif'; ctx.fillStyle = lightText ? '#f6f1e7' : '#1c1915';
    ctx.fillText(fmtDays(G.days) + ' aloft', pad, pad + 36);
    if (G.noteT > 0) {
      ctx.globalAlpha = Math.min(1, G.noteT);
      ctx.font = '600 12px "Source Sans 3", sans-serif'; ctx.fillStyle = lightText ? '#f0a58a' : '#9a3b24';
      ctx.fillText(G.note + ' · heavier', pad, pad + 70);
      ctx.globalAlpha = 1;
    }
    // weight meter
    var mw = Math.min(120, W * 0.3), mx = W - mw - 16, my = H - 22;
    ctx.fillStyle = lightText ? 'rgba(246,241,231,.25)' : 'rgba(28,25,21,.15)'; ctx.fillRect(mx, my, mw, 5);
    ctx.fillStyle = '#b4532f'; ctx.fillRect(mx, my, mw * Math.min(1, (G.mass - 1) / 3), 5);
    ctx.font = '600 10px "Source Sans 3", sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = lightText ? 'rgba(246,241,231,.75)' : 'rgba(28,25,21,.6)';
    ctx.fillText('WEIGHT', mx - 8, my + 6);
  }
  function draw() {
    if (!W || !G) return;
    ctx.clearRect(0, 0, W, H);
    drawSky(); drawEnts(); drawParticle();
    if (mode !== 'start') drawHud();
  }
  var hudT = 0;
  function loop(now) {
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (mode !== 'pause') clock += dt;
    if (mode === 'play') { step(dt); if (mode === 'play') G.top = Math.max(G.top, G.alt); hudT += dt; if (hudT > 0.1) { hudT = 0; hud(); } }
    else if (mode === 'start' && !reduce) { G.t += dt; spawn(dt); G.ents.forEach(function (e) { if (e.cloud) { e.x = e.cloud.x + e.dx; e.alt = e.cloud.alt + e.da; } else { e.x += e.vx * dt; e.alt += e.va * dt; } }); G.clouds.forEach(function (c) { c.x += c.vx * dt; }); }
    draw();
    requestAnimationFrame(loop);
  }

  /* ---------- input ---------- */
  var KM = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (KM[e.key]) { if (mode === 'play') { e.preventDefault(); keys[KM[e.key]] = true; } return; }
    if (e.key === ' ' || e.code === 'Space') {
      if (tag === 'BUTTON' && mode !== 'play') return;
      e.preventDefault();
      if (mode === 'start' || mode === 'over') start(); else togglePause();
    } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { if (mode === 'play' || mode === 'pause') togglePause(); }
  });
  document.addEventListener('keyup', function (e) { if (KM[e.key]) keys[KM[e.key]] = false; });
  window.addEventListener('blur', function () { keys.up = keys.down = keys.left = keys.right = false; });
  function pt(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  cv.addEventListener('pointerdown', function (e) { if (mode !== 'play') return; e.preventDefault(); drag = pt(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
  cv.addEventListener('pointermove', function (e) { if (drag) drag = pt(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { cv.addEventListener(n, function () { drag = null; }); });
  $('startBtn').addEventListener('click', start);
  $('againBtn').addEventListener('click', start);
  $('restartBtn').addEventListener('click', start);
  $('resumeBtn').addEventListener('click', togglePause);
  pauseBtn.addEventListener('click', function () { if (mode === 'play' || mode === 'pause') togglePause(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && mode === 'play') togglePause(); });


  G = fresh(); G.top = G.alt;
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);
})();
