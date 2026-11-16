/* KTRL Room · gráficos SVG livianos
   Siguen la skill dataviz: barras de máximo 24 px con punta redondeada de 4 px y base recta, líneas de 2 px,
   rejilla de 1 px recesiva, separación de 2 px entre segmentos, leyenda desde dos series, texto siempre con
   tokens de texto y tooltip al pasar el cursor o enfocar con teclado. Cada gráfico trae su tabla para lectores de pantalla. */
(function () {
  'use strict';
  var KR = window.KR, esc = KR.esc;
  var NS = 'http://www.w3.org/2000/svg';

  function niceTicks(min, max, count) {
    if (min === max) { max = min + 1; }
    var span = max - min, step = Math.pow(10, Math.floor(Math.log10(span / count)));
    var err = span / count / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, out = [];
    for (var v = lo; v <= hi + step / 2; v += step) out.push(+v.toFixed(10));
    return out;
  }
  function compact(v) {
    var a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (a >= 1e4) return (v / 1e3).toFixed(0) + 'K';
    return Math.round(v).toLocaleString('es-PE');
  }
  /* barra con punta redondeada y base recta */
  function barPath(x, y, w, h, up) {
    var r = Math.min(4, w / 2, Math.abs(h));
    if (h <= 0) return '';
    if (up) return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z';
    return 'M' + x + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h - r) + 'Q' + (x + w) + ',' + (y + h) + ' ' + (x + w - r) + ',' + (y + h) + 'H' + x + 'Z';
  }

  function frame(el, o) {
    el.classList.add('chart');
    el.innerHTML = '';
    var w = Math.max(240, Math.round(el.clientWidth || 600)), h = o.height || 200;
    var tip = document.createElement('div');
    tip.className = 'chart-tip'; tip.hidden = true;
    el.appendChild(tip);
    return { w: w, h: h, tip: tip };
  }
  function showTip(f, el, html, x, y) {
    f.tip.innerHTML = html; f.tip.hidden = false;
    var tw = f.tip.offsetWidth, th = f.tip.offsetHeight;
    var left = Math.min(Math.max(0, x - tw / 2), f.w - tw), top = y - th - 10;
    if (top < 0) top = y + 14;
    f.tip.style.left = left + 'px'; f.tip.style.top = top + 'px';
  }
  function table(o, rows) {
    return '<table class="sr"><caption>' + esc(o.label || 'Datos del gráfico') + '</caption><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return (i ? '<td>' : '<th scope="row">') + esc(c) + (i ? '</td>' : '</th>'); }).join('') + '</tr>'; }).join('') +
      '</tbody></table>';
  }
  function observe(el, draw) {
    if (!('ResizeObserver' in window)) return;
    var last = el.clientWidth;
    var ro = new ResizeObserver(function () {
      if (Math.abs(el.clientWidth - last) > 8) { last = el.clientWidth; draw(); }
    });
    ro.observe(el);
    el._ro && el._ro.disconnect();
    el._ro = ro;
  }

  /* ---------- columnas (simples o apiladas) ---------- */
  function bars(el, o) {
    function draw() {
      var f = frame(el, o);
      var series = o.series || [{ name: o.label || '', color: 'var(--series-1)' }];
      var items = o.items || [];
      var pad = { t: 14, r: 8, b: 26, l: 46 };
      var totals = items.map(function (it) { return it.values.reduce(function (a, b) { return a + (b || 0); }, 0); });
      var maxV = Math.max.apply(null, totals.concat([o.minMax || 0]));
      var ticks = niceTicks(0, maxV || 1, 4), top = ticks[ticks.length - 1];
      var iw = f.w - pad.l - pad.r, ih = f.h - pad.t - pad.b;
      var band = iw / Math.max(1, items.length), bw = Math.min(24, band * 0.62);
      var y = function (v) { return pad.t + ih - v / top * ih; };
      var svg = '<svg class="chart-svg" viewBox="0 0 ' + f.w + ' ' + f.h + '" width="100%" height="' + f.h + '" role="img" aria-label="' + esc(o.label || '') + '">';
      ticks.forEach(function (t) {
        svg += '<line class="grid" x1="' + pad.l + '" x2="' + (f.w - pad.r) + '" y1="' + y(t) + '" y2="' + y(t) + '"/>' +
          '<text class="tick" x="' + (pad.l - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + esc(o.yFormat ? o.yFormat(t, true) : compact(t)) + '</text>';
      });
      var every = Math.ceil(items.length / Math.max(1, Math.floor(iw / 44)));
      items.forEach(function (it, i) {
        var cx = pad.l + band * i + band / 2, x = cx - bw / 2, acc = 0;
        var segs = '';
        it.values.forEach(function (v, si) {
          if (!v) return;
          var y1 = y(acc + v), y0 = y(acc), hh = y0 - y1 - (acc > 0 ? 2 : 0);
          var isTop = it.values.slice(si + 1).every(function (z) { return !z; });
          segs += isTop ? '<path d="' + barPath(x, y1, bw, Math.max(0, hh), true) + '" fill="' + series[si].color + '"/>'
            : '<rect x="' + x + '" y="' + y1 + '" width="' + bw + '" height="' + Math.max(0, hh) + '" fill="' + series[si].color + '"/>';
          acc += v;
        });
        svg += '<g class="bar' + (o.highlight === i ? ' hl' : '') + (o.dim && o.dim(i) ? ' dim' : '') + '" data-i="' + i + '" tabindex="0" role="img" aria-label="' + esc(it.label + ': ' + (o.yFormat ? o.yFormat(totals[i]) : totals[i])) + '">' +
          '<rect class="hit" x="' + (pad.l + band * i) + '" y="' + pad.t + '" width="' + band + '" height="' + ih + '" fill="transparent"/>' + segs + '</g>';
        if (i % every === 0) svg += '<text class="tick" x="' + cx + '" y="' + (f.h - 8) + '" text-anchor="middle">' + esc(it.short || it.label) + '</text>';
      });
      svg += '<line class="axis" x1="' + pad.l + '" x2="' + (f.w - pad.r) + '" y1="' + y(0) + '" y2="' + y(0) + '"/>';
      svg += '</svg>';
      var legend = series.length > 1 ? '<div class="legend">' + series.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + '</span>'; }).join('') + '</div>' : '';
      el.insertAdjacentHTML('beforeend', legend + svg + table(o, items.map(function (it, i) {
        return [it.label].concat(it.values.map(function (v, si) { return series[si].name + ': ' + (o.yFormat ? o.yFormat(v || 0) : v); }));
      })));
      var root = el.querySelector('svg');
      function tipFor(g) {
        var i = +g.getAttribute('data-i'), it = items[i];
        var rows = it.values.map(function (v, si) {
          return '<span><i style="background:' + series[si].color + '"></i>' + esc(series[si].name) + '<b>' + esc(o.yFormat ? o.yFormat(v || 0) : v) + '</b></span>';
        }).join('');
        var rect = g.querySelector('.hit').getBBox();
        var scale = root.getBoundingClientRect().width / f.w;
        showTip(f, el, '<strong>' + esc(it.label) + '</strong>' + rows + (it.note ? '<em>' + esc(it.note) + '</em>' : ''), (rect.x + rect.width / 2) * scale, (pad.t + 10) * scale + (legend ? 28 : 0));
      }
      KR.$$('.bar', root).forEach(function (g) {
        g.addEventListener('pointerenter', function () { tipFor(g); });
        g.addEventListener('focus', function () { tipFor(g); });
        g.addEventListener('pointerleave', function () { f.tip.hidden = true; });
        g.addEventListener('blur', function () { f.tip.hidden = true; });
        if (o.onClick) g.addEventListener('click', function () { o.onClick(+g.getAttribute('data-i')); });
      });
    }
    draw(); observe(el, draw);
  }

  /* ---------- línea con área suave, líneas de referencia y marcadores ---------- */
  function line(el, o) {
    function draw() {
      var f = frame(el, o);
      var pts = o.points || [];
      if (!pts.length) { el.insertAdjacentHTML('beforeend', '<p class="muted">Sin datos.</p>'); return; }
      var pad = { t: 16, r: o.padRight || 14, b: 26, l: 52 };
      var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
      var xmin = o.xMin != null ? o.xMin : Math.min.apply(null, xs), xmax = o.xMax != null ? o.xMax : Math.max.apply(null, xs);
      var refYs = (o.refs || []).map(function (r) { return r.y; });
      var ymin = o.yMin != null ? o.yMin : Math.min.apply(null, ys.concat(refYs)), ymax = o.yMax != null ? o.yMax : Math.max.apply(null, ys.concat(refYs));
      var yt = niceTicks(ymin, ymax, 4); ymin = yt[0]; ymax = yt[yt.length - 1];
      var iw = f.w - pad.l - pad.r, ih = f.h - pad.t - pad.b;
      var X = function (v) { return pad.l + (v - xmin) / ((xmax - xmin) || 1) * iw; };
      var Y = function (v) { return pad.t + ih - (v - ymin) / ((ymax - ymin) || 1) * ih; };
      var svg = '<svg class="chart-svg" viewBox="0 0 ' + f.w + ' ' + f.h + '" width="100%" height="' + f.h + '" role="img" aria-label="' + esc(o.label || '') + '">';
      yt.forEach(function (t) {
        svg += '<line class="grid" x1="' + pad.l + '" x2="' + (f.w - pad.r) + '" y1="' + Y(t) + '" y2="' + Y(t) + '"/>' +
          '<text class="tick" x="' + (pad.l - 8) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + esc(o.yFormat ? o.yFormat(t, true) : compact(t)) + '</text>';
      });
      var xt = o.xTicks || niceTicks(xmin, xmax, Math.max(2, Math.floor(iw / 90)));
      xt.forEach(function (t) {
        if (t < xmin || t > xmax) return;
        svg += '<text class="tick" x="' + X(t) + '" y="' + (f.h - 8) + '" text-anchor="middle">' + esc(o.xFormat ? o.xFormat(t) : compact(t)) + '</text>';
      });
      (o.refs || []).forEach(function (r) {
        svg += '<line class="ref' + (r.strong ? ' strong' : '') + '" x1="' + pad.l + '" x2="' + (f.w - pad.r) + '" y1="' + Y(r.y) + '" y2="' + Y(r.y) + '"/>' +
          (r.label ? '<text class="ref-label" x="' + (f.w - pad.r - 4) + '" y="' + (Y(r.y) - 6) + '" text-anchor="end">' + esc(r.label) + '</text>' : '');
      });
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p.x).toFixed(1) + ',' + Y(p.y).toFixed(1); }).join('');
      if (o.area !== false) {
        var base = Y(o.areaBase != null ? Math.max(ymin, Math.min(ymax, o.areaBase)) : ymin);
        svg += '<path class="area" d="' + d + 'L' + X(pts[pts.length - 1].x).toFixed(1) + ',' + base + 'L' + X(pts[0].x).toFixed(1) + ',' + base + 'Z" fill="' + (o.color || 'var(--series-1)') + '"/>';
      }
      svg += '<path class="line" d="' + d + '" stroke="' + (o.color || 'var(--series-1)') + '"/>';
      (o.markers || []).forEach(function (m) {
        svg += '<circle class="marker" cx="' + X(m.x) + '" cy="' + Y(m.y) + '" r="5" fill="' + (m.color || o.color || 'var(--series-1)') + '"/>';
        if (m.label) {
          var anchor = X(m.x) > f.w * 0.7 ? 'end' : X(m.x) < f.w * 0.3 ? 'start' : 'middle';
          svg += '<text class="m-label" x="' + X(m.x) + '" y="' + (Y(m.y) + (m.below ? 20 : -12)) + '" text-anchor="' + anchor + '">' + esc(m.label) + '</text>';
        }
      });
      svg += '<line class="cross" x1="0" x2="0" y1="' + pad.t + '" y2="' + (pad.t + ih) + '" hidden/><circle class="cross-dot" r="4.5" cx="0" cy="0" hidden fill="' + (o.color || 'var(--series-1)') + '"/>';
      svg += '<rect class="hitzone" x="' + pad.l + '" y="' + pad.t + '" width="' + iw + '" height="' + ih + '" fill="transparent" tabindex="0"/>';
      svg += '</svg>';
      el.insertAdjacentHTML('beforeend', svg + table(o, pts.filter(function (_, i) { return i % Math.ceil(pts.length / 40) === 0; }).map(function (p) {
        return [o.xFormat ? o.xFormat(p.x) : String(p.x), o.yFormat ? o.yFormat(p.y) : String(p.y)];
      })));
      var root = el.querySelector('svg'), cross = root.querySelector('.cross'), dot = root.querySelector('.cross-dot'), hz = root.querySelector('.hitzone');
      var cur = Math.floor(pts.length / 2);
      function at(i) {
        cur = Math.max(0, Math.min(pts.length - 1, i));
        var p = pts[cur], scale = root.getBoundingClientRect().width / f.w;
        cross.setAttribute('x1', X(p.x)); cross.setAttribute('x2', X(p.x)); cross.removeAttribute('hidden');
        dot.setAttribute('cx', X(p.x)); dot.setAttribute('cy', Y(p.y)); dot.removeAttribute('hidden');
        showTip(f, el, '<strong>' + esc(o.xFormat ? o.xFormat(p.x, true) : p.x) + '</strong><span><b>' + esc(o.yFormat ? o.yFormat(p.y) : p.y) + '</b></span>' + (p.note ? '<em>' + esc(p.note) + '</em>' : ''), X(p.x) * scale, Y(p.y) * scale);
      }
      function nearest(clientX) {
        var r = root.getBoundingClientRect(), x = (clientX - r.left) / r.width * f.w;
        var v = xmin + (x - pad.l) / iw * (xmax - xmin), best = 0, bd = Infinity;
        pts.forEach(function (p, i) { var dd = Math.abs(p.x - v); if (dd < bd) { bd = dd; best = i; } });
        return best;
      }
      hz.addEventListener('pointermove', function (e) { at(nearest(e.clientX)); });
      hz.addEventListener('pointerleave', function () { f.tip.hidden = true; cross.setAttribute('hidden', ''); dot.setAttribute('hidden', ''); });
      hz.addEventListener('focus', function () { at(cur); });
      hz.addEventListener('blur', function () { f.tip.hidden = true; cross.setAttribute('hidden', ''); dot.setAttribute('hidden', ''); });
      hz.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); at(cur + Math.max(1, Math.round(pts.length / 40))); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); at(cur - Math.max(1, Math.round(pts.length / 40))); }
      });
      if (o.onClick) hz.addEventListener('click', function (e) { o.onClick(pts[nearest(e.clientX)]); });
    }
    draw(); observe(el, draw);
  }

  /* ---------- barras horizontales (una serie) ---------- */
  function hbars(el, o) {
    var items = o.items || [];
    var max = o.max || Math.max.apply(null, items.map(function (i) { return i.value; }).concat([1e-9]));
    el.classList.add('hbars');
    el.innerHTML = items.map(function (it) {
      var pct = Math.max(0, Math.min(100, it.value / max * 100));
      return '<div class="hbar' + (it.hl ? ' hl' : '') + '" title="' + esc(it.label + ': ' + (o.format ? o.format(it.value) : it.value)) + '">' +
        '<span class="hb-label">' + esc(it.label) + (it.sub ? ' <small>' + esc(it.sub) + '</small>' : '') + '</span>' +
        '<span class="hb-track"><i style="width:' + pct.toFixed(1) + '%"></i></span>' +
        '<span class="hb-val num">' + esc(o.format ? o.format(it.value) : it.value) + '</span></div>';
    }).join('');
  }


  /* ---------- rueda Camelot ---------- */
  function wheel(o) {
    var M = KR.music, size = o.size || 300, c = size / 2, R = size / 2 - 4, rm = R * 0.66, ri = R * 0.34;
    var active = o.active ? M.camelotOf(o.active) : null;
    var compat = {};
    if (active && o.compatible !== false) M.compatibleKeys(o.active).forEach(function (k, i) { if (i) compat[M.camelotStr(k.key)] = k.why; });
    var path = (o.path || []).map(function (k) { return k ? M.camelotStr(k) : null; });
    function pt(r, deg) { var a = deg * Math.PI / 180; return [c + r * Math.sin(a), c - r * Math.cos(a)]; }
    function seg(r0, r1, a0, a1) {
      var p1 = pt(r1, a0), p2 = pt(r1, a1), p3 = pt(r0, a1), p4 = pt(r0, a0);
      return 'M' + p1[0].toFixed(2) + ',' + p1[1].toFixed(2) + 'A' + r1 + ',' + r1 + ' 0 0 1 ' + p2[0].toFixed(2) + ',' + p2[1].toFixed(2) +
        'L' + p3[0].toFixed(2) + ',' + p3[1].toFixed(2) + 'A' + r0 + ',' + r0 + ' 0 0 0 ' + p4[0].toFixed(2) + ',' + p4[1].toFixed(2) + 'Z';
    }
    var svg = '<svg class="wheel" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" role="group" aria-label="Rueda Camelot">';
    for (var n = 1; n <= 12; n++) {
      var mid = (n % 12) * 30;
      [['B', rm, R], ['A', ri, rm]].forEach(function (ring) {
        var code = n + ring[0], key = M.fromCamelot(n, ring[0]);
        var cls = 'w-seg' + (active && active.n === n && active.l === ring[0] ? ' on' : compat[code] ? ' near' : '') + (path.indexOf(code) >= 0 ? ' in-path' : '');
        var tp = pt((ring[1] + ring[2]) / 2, mid);
        svg += '<g class="' + cls + '" data-cam="' + code + '"' + (o.pickable ? ' tabindex="0" role="button"' : '') + ' aria-label="' + code + ' ' + M.stdName(key) + (compat[code] ? ', compatible: ' + compat[code] : '') + '">' +
          '<path d="' + seg(ring[1] + 1, ring[2] - 1, mid - 14.2, mid + 14.2) + '"/>' +
          '<text class="w-code" x="' + tp[0].toFixed(1) + '" y="' + (tp[1] - (ring[0] === 'B' ? 3 : 1)).toFixed(1) + '" text-anchor="middle">' + code + '</text>' +
          '<text class="w-name" x="' + tp[0].toFixed(1) + '" y="' + (tp[1] + (ring[0] === 'B' ? 10 : 10)).toFixed(1) + '" text-anchor="middle">' + M.stdName(key) + '</text></g>';
      });
    }
    if (path.length > 1) {
      var pts = path.map(function (code) {
        if (!code) return null;
        var cc = M.camelotOf(M.parseKey(code)), r = cc.l === 'B' ? (rm + R) / 2 : (ri + rm) / 2;
        return pt(r - 14, (cc.n % 12) * 30);
      });
      var d = '';
      pts.forEach(function (p, i) { if (p) d += (d ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); });
      svg += '<path class="w-route" d="' + d + '"/>';
      pts.forEach(function (p, i) { if (p) svg += '<circle class="w-stop" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (i === 0 ? 5 : 3.5) + '"/>'; });
    }
    var label = o.center || (o.active ? M.camelotStr(o.active) : '');
    svg += '<circle class="w-hub" cx="' + c + '" cy="' + c + '" r="' + (ri - 3) + '"/>' +
      '<text class="w-center" x="' + c + '" y="' + (c + 8) + '" text-anchor="middle" style="font-size:' + (label.length <= 3 ? 30 : label.length <= 5 ? 22 : Math.max(13, Math.round(ri * 0.36))) + 'px">' + esc(label) + '</text>' +
      (o.sub ? '<text class="w-sub" x="' + c + '" y="' + (c + 24) + '" text-anchor="middle">' + esc(o.sub) + '</text>' : '') +
      '</svg>';
    return svg;
  }

  KR.chart = { bars: bars, line: line, hbars: hbars, wheel: wheel, niceTicks: niceTicks, compact: compact };
})();
