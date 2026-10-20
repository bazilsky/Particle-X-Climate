/* Particle X Climate — Studio hub: looping mini previews for each game cabinet (decorative). */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TAU = Math.PI * 2;
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function seeded(n) { var s = n * 9301 + 49297; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  var R = {};
  R.snake = function (c, w, h, t) {
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fbf7ef'); g.addColorStop(1, '#efe6d6');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    var cols = 8, cell = w / cols, rows = Math.max(4, Math.floor(h / cell));
    var oy = (h - rows * cell) / 2;
    c.fillStyle = 'rgba(28,25,21,.08)';
    for (var i = 1; i < cols; i++) for (var j = 1; j < rows; j++) { c.beginPath(); c.arc(i * cell, oy + j * cell, Math.max(.7, cell * .04), 0, TAU); c.fill(); }
    // loop path around the inner rectangle
    var path = [], x, y;
    for (x = 1; x < cols - 1; x++) path.push([x, 1]);
    for (y = 2; y < rows - 1; y++) path.push([cols - 2, y]);
    for (x = cols - 3; x >= 1; x--) path.push([x, rows - 2]);
    for (y = rows - 3; y >= 2; y--) path.push([1, y]);
    var P = path.length, head = Math.floor(t * 5) % P;
    var bands = ['#2f7a6c', '#2f7a6c', '#c9a24a', '#c9a24a', '#c9a24a', '#b4532f', '#b4532f', '#1c1915', '#1c1915', '#7a7266'];
    var f = path[(head + 5) % P];
    c.save(); c.shadowColor = 'rgba(180,83,47,.7)'; c.shadowBlur = cell * .6; c.fillStyle = '#b4532f';
    c.beginPath(); c.arc((f[0] + .5) * cell, oy + (f[1] + .5) * cell, cell * .22, 0, TAU); c.fill(); c.restore();
    for (var k = bands.length - 1; k >= 0; k--) {
      var p = path[(head - k + P * 4) % P], ins = cell * (k ? .14 : .08);
      c.save(); c.shadowColor = bands[k]; c.shadowBlur = k ? cell * .3 : cell * .7; c.fillStyle = bands[k]; c.globalAlpha = 1 - k * .05;
      rr(c, p[0] * cell + ins, oy + p[1] * cell + ins, cell - ins * 2, cell - ins * 2, cell * .3); c.fill(); c.restore();
    }
    // a drifting cloud
    var cx = ((t * .25) % 1.4 - .2) * w, cy = oy + cell * (rows / 2 + .1);
    c.fillStyle = 'rgba(201,205,208,.95)';
    c.beginPath(); c.arc(cx, cy, cell * .42, 0, TAU); c.arc(cx + cell * .45, cy - cell * .15, cell * .5, 0, TAU); c.arc(cx + cell * .95, cy, cell * .4, 0, TAU); c.fill();
  };
  R.drift = function (c, w, h, t) {
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5f7f88'); g.addColorStop(.5, '#9fbcc0'); g.addColorStop(1, '#e6ddc9');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(246,241,231,.35)'; c.lineWidth = 1;
    for (var l = 1; l < 4; l++) { c.beginPath(); c.moveTo(0, h * l / 4); c.lineTo(w, h * l / 4); c.stroke(); }
    var rnd = seeded(7);
    c.strokeStyle = 'rgba(31,77,69,.45)'; c.lineWidth = Math.max(1, w * .008); c.lineCap = 'round';
    for (var i = 0; i < 14; i++) {
      var rx = rnd() * w, sp = .35 + rnd() * .4, ph = rnd();
      var ry = ((t * sp + ph) % 1) * (h * 1.2) - h * .1;
      c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - w * .01, ry + h * .05); c.stroke();
    }
    var cyc = (t * .14) % 1, px = w / 2 + Math.sin(t * 1.4) * w * .18, py = h * (1.05 - cyc * 1.1);
    for (var k = 1; k < 10; k++) {
      var tt = t - k * .09, cc = (tt * .14) % 1;
      if (cc > cyc) continue;
      c.fillStyle = 'rgba(138,106,47,' + (.5 - k * .045).toFixed(2) + ')';
      c.beginPath(); c.arc(w / 2 + Math.sin(tt * 1.4) * w * .18, h * (1.05 - cc * 1.1), w * .022 * (1 - k * .06), 0, TAU); c.fill();
    }
    c.save(); c.shadowColor = 'rgba(255,248,226,.95)'; c.shadowBlur = w * .07; c.fillStyle = '#1c1915';
    c.beginPath(); c.arc(px, py, w * .04, 0, TAU); c.fill(); c.restore();
  };
  R.globe = function (c, w, h, t) {
    c.fillStyle = '#17130f'; c.fillRect(0, 0, w, h);
    var rnd = seeded(3); c.fillStyle = 'rgba(246,241,231,.5)';
    for (var s = 0; s < 30; s++) c.fillRect(rnd() * w, rnd() * h, 1, 1);
    var R0 = Math.min(w, h) * .36, cx = w / 2, cy = h / 2;
    var halo = c.createRadialGradient(cx, cy, R0 * .9, cx, cy, R0 * 1.35); halo.addColorStop(0, 'rgba(63,125,78,.5)'); halo.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = halo; c.beginPath(); c.arc(cx, cy, R0 * 1.35, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(cx, cy, R0, 0, TAU); c.clip();
    c.fillStyle = '#2f6b60'; c.fillRect(cx - R0, cy - R0, 2 * R0, 2 * R0);
    var land = [[0, .4, '#b39556'], [.9, -.2, '#a35b3a'], [2, .2, '#8f9a5a'], [3.2, -.4, '#b39556'], [4.3, .5, '#a35b3a'], [5.3, 0, '#8f9a5a']];
    for (var i = 0; i < land.length; i++) {
      var lon = land[i][0] - t * .5, la = land[i][1], z = Math.cos(la) * Math.cos(lon);
      if (z <= 0) continue;
      c.fillStyle = land[i][2]; c.globalAlpha = Math.min(1, z * 3);
      c.beginPath(); c.ellipse(cx + Math.cos(la) * Math.sin(lon) * R0, cy - Math.sin(la) * R0, R0 * .3 * Math.max(.2, Math.cos(lon)), R0 * .24, 0, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
    var pt = t % 2.6, pa = Math.exp(-pt / 1.1);
    var pg = c.createRadialGradient(cx - R0 * .2, cy - R0 * .1, 0, cx - R0 * .2, cy - R0 * .1, R0 * (.3 + pt * .12));
    pg.addColorStop(0, 'rgba(255,248,226,' + (.9 * pa).toFixed(2) + ')'); pg.addColorStop(1, 'rgba(232,206,140,0)');
    c.fillStyle = pg; c.fillRect(cx - R0, cy - R0, 2 * R0, 2 * R0);
    var sh = c.createRadialGradient(cx - R0 * .4, cy - R0 * .3, R0 * .1, cx - R0 * .2, cy, R0 * 1.3);
    sh.addColorStop(0, 'rgba(255,240,210,.12)'); sh.addColorStop(.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(10,8,6,.6)');
    c.fillStyle = sh; c.fillRect(cx - R0, cy - R0, 2 * R0, 2 * R0);
    c.restore();
  };
  R.pop = function (c, w, h, t) {
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#dfe7ea'); g.addColorStop(1, '#f6f1e7');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    var cols = 4, rows = Math.max(3, Math.round(cols * h / w)), cw = w / cols, ch = h / rows, r0 = Math.min(cw, ch) * .32;
    var kinds = ['#9fb6c2', '#c9a24a', '#f6f1e7', '#2f7a6c'];
    var beat = Math.floor(t / .7), ph = (t % .7) / .7, rnd = seeded(11);
    var popA = (beat * 7) % (cols * rows), popB = (beat * 7 + 5) % (cols * rows);
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var idx = j * cols + i, kind = kinds[Math.floor(rnd() * 4)];
      var x = (i + .5) * cw, y = (j + .5) * ch + Math.sin(t * 1.5 + idx) * ch * .03, r = r0;
      if (idx === popA || idx === popB) {
        c.strokeStyle = 'rgba(28,25,21,' + (.5 * (1 - ph)).toFixed(2) + ')'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(x, y, r * (1 + ph * 1.2), 0, TAU); c.stroke();
        r = r * Math.max(0, 1 - ph * 1.6);
        if (r <= 0) continue;
      }
      c.fillStyle = kind; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(28,25,21,.12)'; c.lineWidth = 1; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(x - r * .3, y - r * .3, r * .22, 0, TAU); c.fill();
    }
  };

  R.contrail = function (c, w, h, t) {
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#6f97a6'); g.addColorStop(1, '#d9e4e4');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // cold, humid layer (ice-supersaturated band)
    var by = h * .42, bh = h * .2;
    c.fillStyle = 'rgba(246,241,231,.22)'; c.fillRect(0, by, w, bh);
    c.setLineDash([4, 5]); c.strokeStyle = 'rgba(246,241,231,.55)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, by); c.lineTo(w, by); c.moveTo(0, by + bh); c.lineTo(w, by + bh); c.stroke(); c.setLineDash([]);
    var cyc = (t * .12) % 1, path = function (u) { var x = -w * .1 + u * w * 1.2; var y = h * .75 - Math.sin(u * Math.PI) * h * .52; return [x, y]; };
    var p = path(cyc);
    // trail: thin and short outside the band, spreading and lasting inside it
    for (var k = 1; k < 60; k++) {
      var u = cyc - k * .006; if (u < 0) break;
      var q = path(u), inBand = q[1] > by && q[1] < by + bh, life = inBand ? 1 : Math.max(0, 1 - k / 10);
      if (life <= 0) continue;
      c.fillStyle = 'rgba(255,255,255,' + (.75 * life * (1 - k / 70)).toFixed(2) + ')';
      c.beginPath(); c.arc(q[0], q[1], (inBand ? 1.2 + k * .07 : 1.1) * w * .012, 0, TAU); c.fill();
    }
    // plane
    var d = path(Math.min(1, cyc + .004)), ang = Math.atan2(d[1] - p[1], d[0] - p[0]), s = w * .05;
    c.save(); c.translate(p[0], p[1]); c.rotate(ang); c.fillStyle = '#1c1915';
    c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * .8, -s * .18); c.lineTo(-s * .8, s * .18); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(s * .15, 0); c.lineTo(-s * .25, -s * .75); c.lineTo(-s * .45, -s * .75); c.lineTo(-s * .2, 0); c.lineTo(-s * .45, s * .75); c.lineTo(-s * .25, s * .75); c.closePath(); c.fill();
    c.restore();
  };
  R.volcano = function (c, w, h, t) {
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#d8c79e'); g.addColorStop(1, '#f1e6cf');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // spreading sulphate veil high up
    var cyc = (t * .18) % 1, vw = w * (.15 + cyc * .9);
    var vg = c.createLinearGradient(0, h * .12, 0, h * .32); vg.addColorStop(0, 'rgba(201,162,74,0)'); vg.addColorStop(.5, 'rgba(201,162,74,' + (.25 + cyc * .45).toFixed(2) + ')'); vg.addColorStop(1, 'rgba(201,162,74,0)');
    c.fillStyle = vg; c.beginPath(); c.ellipse(w / 2, h * .22, vw / 2, h * .09, 0, 0, TAU); c.fill();
    // plume puffs rising
    var rnd = seeded(5);
    for (var i = 0; i < 9; i++) {
      var ph = (t * .45 + i / 9) % 1, sx = (rnd() - .5) * w * .1;
      var x = w / 2 + sx + Math.sin(ph * 5 + i) * w * .03, y = h * .66 - ph * h * .42, r = w * (.04 + ph * .07);
      c.fillStyle = 'rgba(92,86,76,' + (.55 * (1 - ph * .7)).toFixed(2) + ')';
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
    // mountain
    c.fillStyle = '#5c3a28';
    c.beginPath(); c.moveTo(0, h); c.lineTo(w * .1, h * .92); c.lineTo(w * .42, h * .66); c.lineTo(w * .58, h * .66); c.lineTo(w * .9, h * .92); c.lineTo(w, h); c.closePath(); c.fill();
    c.fillStyle = 'rgba(180,83,47,' + (.6 + .3 * Math.sin(t * 6)).toFixed(2) + ')';
    c.beginPath(); c.ellipse(w / 2, h * .665, w * .07, h * .012, 0, 0, TAU); c.fill();
  };
  R.ice = function (c, w, h, t) {
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9bb6c4'); g.addColorStop(1, '#e8eef0');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    var cx = w / 2, cy = h * .5, R0 = Math.min(w, h) * .26, cyc = (t * .3) % 1;
    var f = Math.max(0, Math.min(1, (cyc - .35) / .35)), hold = cyc > .7;
    // seed speck
    c.fillStyle = '#1c1915'; c.beginPath(); c.arc(cx + R0 * .15, cy + R0 * .1, R0 * .08, 0, TAU); c.fill();
    // droplet (fades as it freezes)
    c.globalAlpha = 1 - f * .85;
    var dg = c.createRadialGradient(cx - R0 * .3, cy - R0 * .3, R0 * .1, cx, cy, R0);
    dg.addColorStop(0, 'rgba(255,255,255,.9)'); dg.addColorStop(1, 'rgba(31,77,69,.45)');
    c.fillStyle = dg; c.beginPath(); c.arc(cx, cy, R0 * (1 + Math.sin(t * 3) * .02), 0, TAU); c.fill();
    c.globalAlpha = 1;
    // crystal arms growing from the seed
    if (f > 0) {
      c.save(); c.translate(cx, cy); c.strokeStyle = '#f6f1e7'; c.lineWidth = Math.max(1.5, w * .012); c.lineCap = 'round';
      c.shadowColor = 'rgba(255,255,255,.9)'; c.shadowBlur = w * .03;
      var L = R0 * 1.05 * f;
      for (var a = 0; a < 6; a++) {
        c.save(); c.rotate(a * Math.PI / 3);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -L);
        c.moveTo(0, -L * .55); c.lineTo(-L * .22, -L * .75); c.moveTo(0, -L * .55); c.lineTo(L * .22, -L * .75);
        c.stroke(); c.restore();
      }
      c.restore();
    }
    // thermometer
    var tx = w * .1, ty = h * .15, th = h * .7, lvl = hold ? 0 : 1 - cyc / .7;
    c.fillStyle = 'rgba(246,241,231,.6)'; c.fillRect(tx - 3, ty, 6, th);
    c.fillStyle = '#9a3b24'; c.fillRect(tx - 3, ty + th * (1 - (.2 + lvl * .8)), 6, th * (.2 + lvl * .8));
  };

  var items = [];
  function register(cv) {
    var fn = R[cv.getAttribute('data-preview')]; if (!fn) return;
    items.push({ cv: cv, fn: fn, ctx: cv.getContext('2d'), w: 0, h: 0, dpr: 0, off: Math.random() * 10, vis: true });
  }
  document.querySelectorAll('canvas[data-preview]').forEach(register);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { items.forEach(function (it) { if (it.cv === e.target) it.vis = e.isIntersecting; }); }); });
    items.forEach(function (it) { io.observe(it.cv); });
  }
  function frame(now) {
    var t = reduce ? 2.2 : now / 1000;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it.vis || !it.cv.offsetParent) continue;
      var w = it.cv.clientWidth, h = it.cv.clientHeight, d = Math.min(window.devicePixelRatio || 1, 2);
      if (!w || !h) continue;
      if (w !== it.w || h !== it.h || d !== it.dpr) { it.w = w; it.h = h; it.dpr = d; it.cv.width = Math.round(w * d); it.cv.height = Math.round(h * d); }
      it.ctx.setTransform(d, 0, 0, d, 0, 0);
      it.fn(it.ctx, w, h, t + (reduce ? 0 : it.off));
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if (reduce) window.addEventListener('resize', function () { requestAnimationFrame(frame); });
  window.PXCPreviews = { redraw: function () { requestAnimationFrame(frame); } };
})();
