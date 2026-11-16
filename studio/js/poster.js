/* KTRL Room · afiches en canvas
   Cuatro estilos con la identidad de la web: tie-dye con títulos en barras sólidas, cromo sobre negro,
   horarios para historia y foto con duotono. Exporta PNG a 1080 px de ancho. */
(function () {
  'use strict';
  var KR = window.KR;

  var FORMATS = {
    post: { w: 1080, h: 1350, label: 'Post 4:5' },
    story: { w: 1080, h: 1920, label: 'Historia 9:16' },
    square: { w: 1080, h: 1080, label: 'Cuadrado' }
  };
  var TINTS = {
    amber: { label: 'Ámbar', stops: [['#f1a83c', 0], ['#ec917f', .07], ['#ec917f', .09], ['#0b0b0c', .12], ['#b9bdc0', .15], ['#f1a83c', .19], ['#f1a83c', .21], ['#ec917f', .25], ['#0b0b0c', .28], ['#f1a83c', .30]], accent: '#f1a83c', ink: '#17110a' },
    coral: { label: 'Salmón', stops: [['#ec917f', 0], ['#f6c0a8', .06], ['#ec917f', .09], ['#0b0b0c', .12], ['#f1a83c', .16], ['#ec917f', .20], ['#b4473a', .24], ['#0b0b0c', .28], ['#ec917f', .30]], accent: '#ec917f', ink: '#1a0d0a' },
    silver: { label: 'Plata', stops: [['#c3c6c8', 0], ['#f3f4f4', .05], ['#7d8185', .09], ['#0b0b0c', .12], ['#c3c6c8', .16], ['#f1a83c', .19], ['#c3c6c8', .22], ['#7d8185', .26], ['#0b0b0c', .28], ['#c3c6c8', .30]], accent: '#c3c6c8', ink: '#0b0b0c' }
  };
  var FONT = {
    wide: '"Syncopate", "Arial Black", sans-serif',
    display: '"Big Shoulders Display", "Arial Narrow", Impact, sans-serif',
    mono: '"DM Mono", "Courier New", monospace',
    body: '"Instrument Sans", Arial, sans-serif'
  };

  var fontsReady = null;
  function loadFonts() {
    if (fontsReady) return fontsReady;
    if (!document.fonts || !document.fonts.load) return (fontsReady = Promise.resolve());
    fontsReady = Promise.all([
      document.fonts.load('700 100px "Syncopate"'), document.fonts.load('900 100px "Big Shoulders Display"'),
      document.fonts.load('800 100px "Big Shoulders Display"'), document.fonts.load('400 40px "DM Mono"'),
      document.fonts.load('500 40px "DM Mono"'), document.fonts.load('600 40px "Instrument Sans"')
    ]).catch(function () { /* se usan las de respaldo */ });
    return fontsReady;
  }

  /* ---------- utilidades ---------- */
  function hex(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
  function noise2(seed) {
    var r = rng(seed), perm = [], g = [];
    for (var i = 0; i < 256; i++) { perm[i] = i; g[i] = r(); }
    for (var j = 255; j > 0; j--) { var k = Math.floor(r() * (j + 1)), t = perm[j]; perm[j] = perm[k]; perm[k] = t; }
    function h(x, y) { return g[perm[(perm[x & 255] + y) & 255]]; }
    function sm(t) { return t * t * (3 - 2 * t); }
    return function (x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      var a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1), u = sm(xf), v = sm(yf);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }
  function stopColor(stops, t) {
    for (var i = 1; i < stops.length; i++) {
      if (t <= stops[i][1]) {
        var a = stops[i - 1], b = stops[i], f = (t - a[1]) / ((b[1] - a[1]) || 1), ca = hex(a[0]), cb = hex(b[0]);
        return [ca[0] + (cb[0] - ca[0]) * f, ca[1] + (cb[1] - ca[1]) * f, ca[2] + (cb[2] - ca[2]) * f];
      }
    }
    return hex(stops[stops.length - 1][0]);
  }
  /* tie-dye: anillos que se repiten, deformados con ruido y con los pliegues de la tela anudada */
  var dyeCache = {};
  function dye(w, h, tint, seed, cx, cy) {
    var key = [w, h, tint, seed, cx, cy].join(':');
    if (dyeCache[key]) return dyeCache[key];
    var sw = Math.round(w / 4), sh = Math.round(h / 4);
    var c = document.createElement('canvas'); c.width = sw; c.height = sh;
    var g = c.getContext('2d'), img = g.createImageData(sw, sh), px = img.data;
    var n1 = noise2(seed), n2 = noise2(seed + 7), stops = TINTS[tint].stops;
    var ox = sw * cx, oy = sh * cy, R = Math.hypot(sw, sh) * 0.62, period = R * 0.42, warp = sw * 0.075;
    for (var y = 0; y < sh; y++) {
      for (var x = 0; x < sw; x++) {
        var dx = (n1(x / 46, y / 46) - 0.5) * 2 * warp + (n1(x / 14, y / 14) - 0.5) * warp * 0.3;
        var dy = (n2(x / 46, y / 46) - 0.5) * 2 * warp + (n2(x / 14, y / 14) - 0.5) * warp * 0.3;
        var X = x + dx - ox, Y = y + dy - oy, r = Math.sqrt(X * X + Y * Y);
        var t = (r % period) / period * 0.30;
        var col = stopColor(stops, t);
        var ang = (Math.atan2(Y, X) * 180 / Math.PI + 368) % 14.4;
        if (ang > 12.6) { var k = 0.78 + 0.22 * Math.abs(ang - 13.5) / 0.9; col = [col[0] * k, col[1] * k, col[2] * k]; }
        var i = (y * sw + x) * 4;
        px[i] = col[0]; px[i + 1] = col[1]; px[i + 2] = col[2]; px[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    /* un desenfoque leve: la tinta se corre en la tela */
    var out = document.createElement('canvas'); out.width = sw; out.height = sh;
    var og = out.getContext('2d');
    og.filter = 'blur(1.2px)'; og.drawImage(c, 0, 0);
    if (og.filter !== 'blur(1.2px)') og.drawImage(c, 0, 0);
    dyeCache[key] = out;
    return out;
  }
  function grain(g, w, h, amount, seed) {
    var r = rng(seed || 3), n = Math.round(w * h / 90 * amount);
    for (var i = 0; i < n; i++) {
      var v = r() > 0.5 ? 255 : 0;
      g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.04 + r() * 0.06) + ')';
      g.fillRect(r() * w, r() * h, 1.6, 1.6);
    }
  }
  function fit(g, text, font, weight, maxW, maxSize, minSize, spacing) {
    var size = maxSize;
    while (size > minSize) {
      g.font = weight + ' ' + size + 'px ' + font;
      if (measure(g, text, size, spacing) <= maxW) break;
      size -= 2;
    }
    g.font = weight + ' ' + size + 'px ' + font;
    return size;
  }
  function measure(g, text, size, spacing) { return g.measureText(text).width + (spacing ? spacing * size * Math.max(0, text.length - 1) : 0); }
  function textSp(g, text, x, y, size, spacing, align) {
    if (!spacing) { g.textAlign = align || 'left'; g.fillText(text, x, y); return; }
    var w = measure(g, text, size, spacing);
    var cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    g.textAlign = 'left';
    for (var i = 0; i < text.length; i++) { g.fillText(text[i], cx, y); cx += g.measureText(text[i]).width + spacing * size; }
  }
  /* parte un título en líneas que entren, priorizando letras grandes */
  function titleLines(g, text, font, weight, maxW, maxSize, minSize, maxLines) {
    var words = String(text || '').toUpperCase().split(/\s+/).filter(Boolean);
    for (var size = maxSize; size >= minSize; size -= 4) {
      g.font = weight + ' ' + size + 'px ' + font;
      var lines = [], cur = '';
      for (var i = 0; i < words.length; i++) {
        var test = cur ? cur + ' ' + words[i] : words[i];
        if (g.measureText(test).width <= maxW) cur = test;
        else { if (cur) lines.push(cur); cur = words[i]; }
      }
      if (cur) lines.push(cur);
      var widest = Math.max.apply(null, lines.map(function (l) { return g.measureText(l).width; }));
      if (lines.length <= maxLines && widest <= maxW) return { lines: lines, size: size };
    }
    g.font = weight + ' ' + minSize + 'px ' + font;
    return { lines: [words.join(' ')], size: minSize };
  }
  function bar(g, text, x, y, size, font, weight, fg, bg, padX, spacing) {
    g.font = weight + ' ' + size + 'px ' + font;
    var w = measure(g, text, size, spacing), h = size * 1.18;
    g.fillStyle = bg; g.fillRect(x, y, w + padX * 2, h);
    g.fillStyle = fg; g.textBaseline = 'alphabetic';
    textSp(g, text, x + padX, y + h * 0.82, size, spacing);
    return { w: w + padX * 2, h: h };
  }
  function logo(g, x, y, size, color, rot) {
    if (!KR.LOGO) return;
    g.save();
    g.translate(x + size / 2, y + size / 2);
    if (rot) g.rotate(rot);
    var s = size / KR.LOGO.h;
    g.scale(s, s);
    g.translate(-KR.LOGO.w / 2, -KR.LOGO.h / 2);
    g.fillStyle = color;
    g.fill(new Path2D(KR.LOGO.d));
    g.restore();
  }
  function chromeFill(g, y0, y1) {
    var gr = g.createLinearGradient(0, y0, 0, y1);
    [['#ffffff', 0], ['#d6d9db', .28], ['#7d8185', .47], ['#e9ebec', .6], ['#a4a7aa', .82], ['#f3f4f4', 1]].forEach(function (s) { gr.addColorStop(s[1], s[0]); });
    return gr;
  }
  function photoCover(g, img, w, h, dim, tint) {
    var r = Math.max(w / img.width, h / img.height), iw = img.width * r, ih = img.height * r;
    g.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
    /* duotono negro → color del tinte, como las fotos del press kit */
    var data = g.getImageData(0, 0, w, h), p = data.data, hi = hex(TINTS[tint].accent);
    for (var i = 0; i < p.length; i += 4) {
      var l = (0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]) / 255;
      l = Math.pow(l, 1.1);
      p[i] = 11 + (hi[0] - 11) * l; p[i + 1] = 11 + (hi[1] - 11) * l; p[i + 2] = 12 + (hi[2] - 12) * l;
    }
    g.putImageData(data, 0, 0);
    var gr = g.createLinearGradient(0, h * 0.35, 0, h);
    gr.addColorStop(0, 'rgba(11,11,12,0)'); gr.addColorStop(1, 'rgba(11,11,12,' + (0.55 + dim * 0.4) + ')');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }

  /* ---------- estilos ---------- */
  function drawDye(g, s, W, H) {
    var T = TINTS[s.tint] || TINTS.amber;
    g.fillStyle = '#0b0b0c'; g.fillRect(0, 0, W, H);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(dye(W, H, s.tint || 'amber', s.seed || 11, 0.62, s.format === 'story' ? 0.36 : 0.4), 0, 0, W, H);
    var gr = g.createLinearGradient(0, H * 0.45, 0, H);
    gr.addColorStop(0, 'rgba(11,11,12,0)'); gr.addColorStop(1, 'rgba(11,11,12,.72)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    grain(g, W, H, 1, 5);
    var M = 72, y = M;
    /* cabecera */
    g.fillStyle = '#0b0b0c'; g.font = '500 26px ' + FONT.mono;
    var head = (s.organizers ? s.organizers + ' presenta' : 'Lattice Rekords presenta').toUpperCase();
    bar(g, head, M, y, 26, FONT.mono, 500, '#ffffff', '#0b0b0c', 16, 0.14);
    if (s.logo) { g.fillStyle = '#0b0b0c'; g.fillRect(W - M - 100, y - 14, 100, 100); logo(g, W - M - 88, y - 2, 76, T.accent); }
    /* título en barras sólidas, como los títulos de la web */
    var tl = titleLines(g, s.title || 'Evento', FONT.wide, 700, W - 2 * M - 48, s.format === 'square' ? 130 : 150, 56, 3);
    y = s.format === 'story' ? H * 0.22 : H * (s.format === 'square' ? 0.2 : 0.21);
    tl.lines.forEach(function (line) { var b = bar(g, line, M, y, tl.size, FONT.wide, 700, '#ffffff', '#0b0b0c', 24, -0.01); y += b.h + 10; });
    if (s.tagline) { y += 8; bar(g, s.tagline.toUpperCase(), M, y, 30, FONT.mono, 500, '#0b0b0c', T.accent, 14, 0.08); y += 50; }
    /* bloque inferior calculado de abajo hacia arriba para que nada se encime */
    var dateStr = (s.dateText || '').toUpperCase();
    var info = [s.timeText, s.venue, s.city].filter(Boolean).join('  ·  ').toUpperCase();
    var ds = dateStr ? fit(g, dateStr, FONT.display, 900, W - 2 * M, s.format === 'square' ? 150 : 190, 70, 0) : 0;
    var avail = W - 2 * M, stacked = s.format === 'story';
    var rows = s.lineup.slice(0, stacked ? 9 : 5);
    var inlineFits = true, ls = 0;
    if (!stacked && rows.length) {
      var names = rows.map(function (r) { return r.name.toUpperCase(); }).join('  /  ');
      ls = fit(g, names, FONT.display, 800, avail, 64, 30, 0);
      inlineFits = g.measureText(names).width <= avail;
      if (!inlineFits) rows = rows.slice(0, s.format === 'square' ? 2 : 4);
    }
    function luH(n) { if (!n) return 0; return 18 + (stacked || !inlineFits ? n * (stacked ? 64 : 56) : ls + 10); }
    function blockH(n) { return (ds ? ds * 0.86 + 22 : 0) + (info ? 56 : 0) + luH(n); }
    var bottom = H - M - 50;
    while (rows.length > 1 && bottom - blockH(rows.length) < y + 30) rows = rows.slice(0, rows.length - 1);
    var iy = Math.max(y + 30, bottom - blockH(rows.length));
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    if (ds) { g.fillStyle = '#ffffff'; fit(g, dateStr, FONT.display, 900, W - 2 * M, ds, 70, 0); g.fillText(dateStr, M, iy + ds * 0.86); iy += ds * 0.86 + 22; }
    if (info) { g.fillStyle = '#ffffff'; var fz = fit(g, info, FONT.mono, 500, W - 2 * M, 34, 20, 0.06); textSp(g, info, M, iy + 30, fz, 0.06); iy += 56; }
    if (rows.length) {
      iy += 18;
      if (stacked || !inlineFits) {
        rows.forEach(function (r) {
          g.fillStyle = r.me ? T.accent : '#ffffff';
          var showT = r.time && s.showTimes && stacked;
          if (showT) { g.font = '500 30px ' + FONT.mono; g.fillText(r.time, M, iy + 46); }
          var nx = M + (showT ? 190 : 0);
          fit(g, r.name.toUpperCase(), FONT.display, 800, W - nx - M, stacked ? 60 : 54, 28, 0);
          g.fillText(r.name.toUpperCase(), nx, iy + 50);
          iy += stacked ? 64 : 56;
        });
      } else {
        var cx = M;
        rows.forEach(function (r, i) {
          var t = r.name.toUpperCase() + (i < rows.length - 1 ? '  /  ' : '');
          g.font = '800 ' + ls + 'px ' + FONT.display; g.fillStyle = r.me ? T.accent : '#ffffff';
          g.fillText(t, cx, iy + ls * 0.9); cx += g.measureText(t).width;
        });
      }
    }
    /* pie */
    var foot = [s.price, s.handle].filter(Boolean).join('   ');
    if (foot) { g.fillStyle = '#ffffff'; g.font = '500 26px ' + FONT.mono; textSp(g, foot.toUpperCase(), M, H - M + 6, 26, 0.1); }
  }

  function drawChrome(g, s, W, H) {
    var T = TINTS[s.tint] || TINTS.amber;
    g.fillStyle = '#0b0b0c'; g.fillRect(0, 0, W, H);
    var rg = g.createRadialGradient(W * 0.8, H * 0.25, 10, W * 0.8, H * 0.25, W * 0.9);
    rg.addColorStop(0, 'rgba(241,168,60,.20)'); rg.addColorStop(1, 'rgba(11,11,12,0)');
    if (s.tint === 'coral') { rg = g.createRadialGradient(W * 0.8, H * 0.25, 10, W * 0.8, H * 0.25, W * 0.9); rg.addColorStop(0, 'rgba(236,145,127,.22)'); rg.addColorStop(1, 'rgba(11,11,12,0)'); }
    if (s.tint === 'silver') { rg = g.createRadialGradient(W * 0.8, H * 0.25, 10, W * 0.8, H * 0.25, W * 0.9); rg.addColorStop(0, 'rgba(195,198,200,.16)'); rg.addColorStop(1, 'rgba(11,11,12,0)'); }
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.08; logo(g, W * 0.18, H * 0.08, W * 1.05, '#ffffff', 0.35); g.globalAlpha = 1;
    grain(g, W, H, 1.2, 9);
    var M = 76;
    g.fillStyle = T.accent; g.fillRect(M, M, 90, 8);
    g.fillStyle = '#c3c6c8'; g.font = '500 26px ' + FONT.mono;
    textSp(g, (s.organizers || 'Lattice Rekords').toUpperCase(), M, M + 60, 26, 0.16);
    if (s.logo) logo(g, W - M - 84, M - 6, 84, T.accent);
    var tl = titleLines(g, s.title || 'Evento', FONT.wide, 700, W - 2 * M, s.format === 'square' ? 124 : 150, 54, 3);
    var y = s.format === 'story' ? H * 0.28 : H * 0.26;
    tl.lines.forEach(function (line) {
      g.font = '700 ' + tl.size + 'px ' + FONT.wide;
      g.fillStyle = chromeFill(g, y, y + tl.size);
      g.textBaseline = 'alphabetic'; g.textAlign = 'left';
      g.fillText(line, M - 4, y + tl.size * 0.86);
      y += tl.size * 1.02;
    });
    if (s.tagline) { y += 14; g.fillStyle = T.accent; g.font = '500 32px ' + FONT.mono; textSp(g, s.tagline.toUpperCase(), M, y + 30, 32, 0.08); y += 60; }
    /* fecha, datos y lineup: se calculan de abajo hacia arriba */
    var dStr = (s.dateText || '').toUpperCase();
    var info = [s.timeText, s.venue, s.city].filter(Boolean).join('  ·  ').toUpperCase();
    var ds = dStr ? fit(g, dStr, FONT.display, 900, W - 2 * M, s.format === 'square' ? 150 : 200, 70, 0) : 0;
    var rowH = s.format === 'story' ? 70 : 62;
    var rows = s.lineup.slice(0, s.format === 'story' ? 9 : 5);
    function blockH(n) { return (ds ? ds * 0.86 + 26 : 0) + 2 + (info ? 78 : 0) + (n ? 10 + n * rowH : 0); }
    var bottom = H - M - 60;
    while (rows.length > 1 && bottom - blockH(rows.length) < y + 30) rows = rows.slice(0, rows.length - 1);
    var by = Math.max(y + 30, bottom - blockH(rows.length));
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    if (ds) { g.fillStyle = '#ffffff'; fit(g, dStr, FONT.display, 900, W - 2 * M, ds, 70, 0); g.fillText(dStr, M, by + ds * 0.86); by += ds * 0.86 + 26; }
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(M, by, W - 2 * M, 2);
    if (info) { g.fillStyle = '#ffffff'; var fz = fit(g, info, FONT.mono, 500, W - 2 * M, 34, 20, 0.06); textSp(g, info, M, by + 52, fz, 0.06); by += 78; }
    if (rows.length) {
      by += 10;
      rows.forEach(function (r) {
        var nx = M;
        if (s.showTimes && r.time) { g.font = '500 28px ' + FONT.mono; g.fillStyle = '#9c9e9f'; g.fillText(r.time, M, by + 44); nx = M + 180; }
        g.fillStyle = r.me ? T.accent : '#ffffff';
        fit(g, r.name.toUpperCase(), FONT.display, 800, W - nx - M, s.format === 'story' ? 64 : 56, 28, 0);
        g.fillText(r.name.toUpperCase(), nx, by + 48);
        by += rowH;
      });
    }
    var foot = [s.price, s.handle].filter(Boolean).join('   ');
    if (foot) { g.fillStyle = '#c3c6c8'; g.font = '500 26px ' + FONT.mono; textSp(g, foot.toUpperCase(), M, H - M + 8, 26, 0.1); }
  }

  function drawTimetable(g, s, W, H) {
    var T = TINTS[s.tint] || TINTS.amber;
    g.fillStyle = '#0b0b0c'; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = 0.9;
    var size = Math.round(W * 0.9);
    g.beginPath(); g.arc(W * 0.92, H * 0.06, size / 2, 0, Math.PI * 2); g.clip();
    g.drawImage(dye(size, size, s.tint || 'amber', (s.seed || 11) + 4, 0.5, 0.5), W * 0.92 - size / 2, H * 0.06 - size / 2, size, size);
    g.restore();
    grain(g, W, H, 1, 13);
    var M = 72, y = s.format === 'story' ? 210 : 120;
    g.fillStyle = '#ffffff';
    bar(g, 'HORARIOS', M, y, 30, FONT.mono, 500, '#0b0b0c', T.accent, 14, 0.18);
    y += 70;
    var tl = titleLines(g, s.title || 'Evento', FONT.wide, 700, W - 2 * M, 110, 50, 2);
    tl.lines.forEach(function (line) { g.font = '700 ' + tl.size + 'px ' + FONT.wide; g.fillStyle = '#ffffff'; g.fillText(line, M, y + tl.size * 0.86); y += tl.size * 1.05; });
    var meta = [s.dateText, s.venue, s.city].filter(Boolean).join('  ·  ').toUpperCase();
    if (meta) { g.fillStyle = '#c3c6c8'; var fz = fit(g, meta, FONT.mono, 500, W - 2 * M, 30, 18, 0.06); textSp(g, meta, M, y + 40, fz, 0.06); y += 70; }
    y += 30;
    var rows = s.lineup.slice(0, s.format === 'story' ? 12 : s.format === 'square' ? 6 : 8);
    var footSpace = 140, rowH = Math.min(s.format === 'story' ? 112 : 96, (H - y - footSpace) / Math.max(1, rows.length));
    g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(M, y, W - 2 * M, 2);
    rows.forEach(function (r) {
      if (r.me) { g.fillStyle = T.accent; g.fillRect(M - 18, y + 4, W - 2 * M + 36, rowH - 6); }
      g.fillStyle = r.me ? T.ink : '#9c9e9f';
      g.font = '500 ' + Math.round(rowH * 0.3) + 'px ' + FONT.mono;
      g.textAlign = 'left';
      g.fillText(r.time || '', M, y + rowH * 0.62);
      g.fillStyle = r.me ? T.ink : '#ffffff';
      var nx = M + Math.round(rowH * 1.9);
      fit(g, r.name.toUpperCase(), FONT.display, 900, W - nx - M, Math.round(rowH * 0.62), 26, 0);
      g.fillText(r.name.toUpperCase(), nx, y + rowH * 0.7);
      y += rowH;
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(M, y, W - 2 * M, 2);
    });
    var foot = [s.price, s.handle].filter(Boolean).join('   ');
    g.fillStyle = '#c3c6c8'; g.font = '500 26px ' + FONT.mono;
    if (foot) textSp(g, foot.toUpperCase(), M, H - (s.format === 'story' ? 200 : 76), 26, 0.1);
    if (s.logo) logo(g, W - M - 70, H - (s.format === 'story' ? 244 : 120), 70, T.accent);
  }

  function drawPhoto(g, s, W, H) {
    var T = TINTS[s.tint] || TINTS.amber;
    g.fillStyle = '#0b0b0c'; g.fillRect(0, 0, W, H);
    if (s.photo) photoCover(g, s.photo, W, H, s.photoDim == null ? 0.5 : s.photoDim, s.tint || 'amber');
    else { g.drawImage(dye(W, H, s.tint || 'amber', s.seed || 11, 0.5, 0.3), 0, 0, W, H); var gr = g.createLinearGradient(0, H * 0.3, 0, H); gr.addColorStop(0, 'rgba(11,11,12,0)'); gr.addColorStop(1, 'rgba(11,11,12,.85)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    grain(g, W, H, 0.9, 21);
    var M = 72;
    if (s.logo) logo(g, M, M, 86, T.accent);
    g.fillStyle = '#ffffff'; g.font = '500 26px ' + FONT.mono;
    textSp(g, (s.organizers || 'Lattice Rekords').toUpperCase(), W - M, M + 50, 26, 0.14, 'right');
    var tl = titleLines(g, s.title || 'Evento', FONT.wide, 700, W - 2 * M - 48, 120, 50, 2);
    var rowsN = Math.min(s.lineup.length, s.format === 'story' ? 6 : 3);
    var y = H - M - 60 - rowsN * 56 - 150 - tl.lines.length * (tl.size * 1.18 + 10);
    tl.lines.forEach(function (line) { var b = bar(g, line, M, y, tl.size, FONT.wide, 700, '#ffffff', '#0b0b0c', 24, -0.01); y += b.h + 10; });
    y += 18;
    var date = [s.dateText, s.timeText].filter(Boolean).join(' · ').toUpperCase();
    g.fillStyle = T.accent; fit(g, date, FONT.display, 900, W - 2 * M, 96, 48, 0); g.fillText(date, M, y + 84);
    y += 112;
    var where = [s.venue, s.city].filter(Boolean).join(' · ').toUpperCase();
    if (where) { g.fillStyle = '#ffffff'; var fz = fit(g, where, FONT.mono, 500, W - 2 * M, 30, 18, 0.06); textSp(g, where, M, y, fz, 0.06); y += 30; }
    s.lineup.slice(0, rowsN).forEach(function (r) {
      g.fillStyle = r.me ? T.accent : '#ffffff';
      fit(g, r.name.toUpperCase(), FONT.display, 800, W - 2 * M, 50, 26, 0);
      g.fillText(r.name.toUpperCase(), M, y + 52); y += 56;
    });
    var foot = [s.price, s.handle].filter(Boolean).join('   ');
    if (foot) { g.fillStyle = '#c3c6c8'; g.font = '500 24px ' + FONT.mono; textSp(g, foot.toUpperCase(), W - M, H - M + 8, 24, 0.1, 'right'); }
  }

  var STYLES = {
    dye: { label: 'Tie-dye', draw: drawDye },
    chrome: { label: 'Cromo', draw: drawChrome },
    timetable: { label: 'Horarios', draw: drawTimetable },
    photo: { label: 'Foto', draw: drawPhoto }
  };

  function render(canvas, spec) {
    var f = FORMATS[spec.format] || FORMATS.post;
    canvas.width = f.w; canvas.height = f.h;
    var g = canvas.getContext('2d');
    g.save();
    (STYLES[spec.style] || STYLES.dye).draw(g, Object.assign({ lineup: [] }, spec), f.w, f.h);
    g.restore();
    return canvas;
  }

  KR.poster = { FORMATS: FORMATS, TINTS: TINTS, STYLES: STYLES, render: render, loadFonts: loadFonts };
})();
