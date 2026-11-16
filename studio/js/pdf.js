/* KTRL Room · PDF propio
   Escribe PDF 1.4 a mano con las fuentes estándar (Helvetica, Courier) y codificación WinAnsi, así
   las tildes, la ñ, ¿ ¡ y € salen bien sin incrustar fuentes. Incluye un maquetador de documentos
   (contratos, split sheets, riders) y la vista previa en HTML con el mismo contenido. */
(function (root) {
  'use strict';

  var W_H = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,761,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500];
  var W_HB = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,761,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556];
  var FONTS = {
    H: { base: 'Helvetica', w: W_H }, HB: { base: 'Helvetica-Bold', w: W_HB },
    HO: { base: 'Helvetica-Oblique', w: W_H }, C: { base: 'Courier', w: null }
  };
  var FONT_KEYS = ['H', 'HB', 'HO', 'C'];
  var CP1252 = { 0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F };
  var SUBST = { '−': '-', '♯': '#', '♭': 'b', '→': '->', '←': '<-', '↔': '<->', '↑': '^', '↓': 'v', ' ': ' ', ' ': ' ', ' ': ' ', '′': "'", '″': '"', '✓': 'v', '✕': 'x' };

  function encode(str) {
    var out = [];
    str = String(str == null ? '' : str).normalize('NFC');
    for (var i = 0; i < str.length; i++) {
      var ch = str[i], c = str.charCodeAt(i);
      if (SUBST[ch]) { var s = SUBST[ch]; for (var j = 0; j < s.length; j++) out.push(s.charCodeAt(j)); continue; }
      if (c >= 32 && c < 127) out.push(c);
      else if (c >= 0xA0 && c <= 0xFF) out.push(c);
      else if (CP1252[c]) out.push(CP1252[c]);
      else if (c === 10 || c === 9) out.push(32);
      else out.push(63);
    }
    return out;
  }
  function pdfString(bytes) {
    var s = '(';
    for (var i = 0; i < bytes.length; i++) {
      var b = bytes[i];
      if (b === 40 || b === 41 || b === 92) s += '\\' + String.fromCharCode(b);
      else if (b < 32 || b > 126) s += '\\' + ('00' + b.toString(8)).slice(-3);
      else s += String.fromCharCode(b);
    }
    return s + ')';
  }
  function widthOf(str, font, size) {
    var f = FONTS[font] || FONTS.H, bytes = encode(str), w = 0;
    for (var i = 0; i < bytes.length; i++) w += f.w ? (f.w[bytes[i] - 32] || 556) : 600;
    return w * size / 1000;
  }
  function rgb(hex) {
    var h = String(hex || '#000').replace('#', '');
    if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
    var n = parseInt(h, 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255].map(function (v) { return +v.toFixed(3); }).join(' ');
  }
  function f2(n) { return (Math.round(n * 100) / 100).toString(); }

  /* ---------- escritor de bajo nivel (coordenadas desde arriba a la izquierda, en puntos) ---------- */
  function create(o) {
    o = o || {};
    var W = o.width || 595.28, H = o.height || 841.89;
    var pages = [], cur = null;
    var doc = {
      W: W, H: H, info: o.info || {},
      addPage: function () { cur = { ops: [] }; pages.push(cur); return doc; },
      pageCount: function () { return pages.length; },
      onPage: function (i, fn) { var keep = cur; cur = pages[i]; fn(); cur = keep; },
      width: widthOf,
      text: function (str, x, y, t) {
        t = t || {};
        var font = t.font || 'H', size = t.size || 10, w = widthOf(str, font, size) + (t.spacing ? t.spacing * Math.max(0, encode(str).length - 1) : 0);
        if (t.align === 'right') x -= w; else if (t.align === 'center') x -= w / 2;
        cur.ops.push('BT /' + font + ' ' + f2(size) + ' Tf ' + rgb(t.color || '#111111') + ' rg ' + (t.spacing ? f2(t.spacing) + ' Tc ' : '0 Tc ') +
          '1 0 0 1 ' + f2(x) + ' ' + f2(H - y) + ' Tm ' + pdfString(encode(str)) + ' Tj ET');
        return w;
      },
      rect: function (x, y, w, h, t) {
        t = t || {};
        var op = t.fill && t.stroke ? 'B' : t.fill ? 'f' : 'S';
        cur.ops.push((t.fill ? rgb(t.fill) + ' rg ' : '') + (t.stroke ? rgb(t.stroke) + ' RG ' + f2(t.lw || 0.75) + ' w ' : '') +
          f2(x) + ' ' + f2(H - y - h) + ' ' + f2(w) + ' ' + f2(h) + ' re ' + op);
      },
      line: function (x1, y1, x2, y2, t) {
        t = t || {};
        cur.ops.push(rgb(t.stroke || '#111111') + ' RG ' + f2(t.lw || 0.75) + ' w ' + (t.dash ? '[' + t.dash.join(' ') + '] 0 d ' : '[] 0 d ') +
          f2(x1) + ' ' + f2(H - y1) + ' m ' + f2(x2) + ' ' + f2(H - y2) + ' l S');
      },
      svgPath: function (d, x, y, scale, t) {
        /* solo comandos absolutos M, L, C, Z (como el glifo de MD KTRL) */
        var toks = d.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) || [], i = 0, cmd = '', ops = [];
        var P = function () { var px = parseFloat(toks[i++]), py = parseFloat(toks[i++]); return f2(x + px * scale) + ' ' + f2(H - (y + py * scale)); };
        while (i < toks.length) {
          var tk = toks[i];
          if (/[MLCZ]/i.test(tk)) { cmd = tk.toUpperCase(); i++; if (cmd === 'Z') { ops.push('h'); continue; } }
          if (cmd === 'M') { ops.push(P() + ' m'); cmd = 'L'; }
          else if (cmd === 'L') ops.push(P() + ' l');
          else if (cmd === 'C') ops.push(P() + ' ' + P() + ' ' + P() + ' c');
          else i++;
        }
        cur.ops.push(rgb((t && t.fill) || '#111111') + ' rg ' + ops.join(' ') + ' f');
      },
      output: function () {
        var objs = [], add = function (s) { objs.push(s); return objs.length; };
        var catalogId = add(null), pagesId = add(null);
        var fontIds = {};
        FONT_KEYS.forEach(function (k) { fontIds[k] = add('<< /Type /Font /Subtype /Type1 /BaseFont /' + FONTS[k].base + ' /Encoding /WinAnsiEncoding >>'); });
        var fontRes = '<< ' + FONT_KEYS.map(function (k) { return '/' + k + ' ' + fontIds[k] + ' 0 R'; }).join(' ') + ' >>';
        var kids = [];
        pages.forEach(function (p) {
          var content = p.ops.join('\n');
          var cid = add('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
          kids.push(add('<< /Type /Page /Parent ' + pagesId + ' 0 R /MediaBox [0 0 ' + f2(W) + ' ' + f2(H) + '] /Resources << /Font ' + fontRes + ' >> /Contents ' + cid + ' 0 R >>'));
        });
        objs[pagesId - 1] = '<< /Type /Pages /Kids [' + kids.map(function (k) { return k + ' 0 R'; }).join(' ') + '] /Count ' + kids.length + ' >>';
        objs[catalogId - 1] = '<< /Type /Catalog /Pages ' + pagesId + ' 0 R >>';
        var d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
        var stamp = 'D:' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
        var infoId = add('<< /Title ' + pdfString(encode(doc.info.title || 'Documento')) + ' /Author ' + pdfString(encode(doc.info.author || '')) +
          ' /Subject ' + pdfString(encode(doc.info.subject || '')) + ' /Creator (KTRL Room) /Producer (KTRL Room) /CreationDate (' + stamp + ') >>');
        var out = '%PDF-1.4\n%âãÏÓ\n', offsets = [];
        objs.forEach(function (body, i) { offsets.push(out.length); out += (i + 1) + ' 0 obj\n' + body + '\nendobj\n'; });
        var xref = out.length;
        out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
        offsets.forEach(function (off) { out += ('0000000000' + off).slice(-10) + ' 00000 n \n'; });
        out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root ' + catalogId + ' 0 R /Info ' + infoId + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
        var bytes = new Uint8Array(out.length);
        for (var i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
        return bytes;
      }
    };
    return doc;
  }

  /* ---------- texto con **negritas** partido en líneas ---------- */
  function runs(text) {
    var parts = String(text || '').split('**'), out = [];
    parts.forEach(function (p, i) {
      p.split(/(\s+)/).forEach(function (w) { if (w) out.push({ t: w, b: i % 2 === 1, sp: /^\s+$/.test(w) }); });
    });
    return out;
  }
  function wrapRuns(text, maxW, size, bold) {
    var words = runs(text), lines = [[]], lw = 0;
    words.forEach(function (w) {
      var font = (w.b || bold) ? 'HB' : 'H';
      if (w.sp) { if (lines[lines.length - 1].length) { lines[lines.length - 1].push({ t: ' ', f: font }); lw += widthOf(' ', font, size); } return; }
      var ww = widthOf(w.t, font, size);
      if (lw + ww > maxW && lines[lines.length - 1].length) {
        var last = lines[lines.length - 1];
        while (last.length && last[last.length - 1].t === ' ') last.pop();
        lines.push([]); lw = 0;
      }
      lines[lines.length - 1].push({ t: w.t, f: font });
      lw += ww;
    });
    return lines.filter(function (l) { return l.length; });
  }

  /* ---------- maquetador de documentos ---------- */
  var INK = '#111111', MUTED = '#5b5e62', RULE = '#c9cbce', BAND = '#0b0b0c', AMBER = '#f1a83c';
  function renderDoc(spec) {
    var doc = create({ info: { title: spec.title + (spec.ref ? ' ' + spec.ref : ''), author: spec.author || '', subject: spec.subject || '' } });
    var M = 52, W = doc.W, CW = W - 2 * M, BOTTOM = doc.H - 58;
    var y = 0, logo = root && root.KR && root.KR.LOGO;
    function header(first) {
      if (first) {
        doc.rect(0, 0, W, 104, { fill: BAND });
        if (logo) doc.svgPath(logo.d, M, 24, 44 / logo.h, { fill: AMBER });
        var tx = logo ? M + 58 : M;
        doc.text((spec.kicker || '').toUpperCase(), tx, 40, { font: 'HB', size: 8, color: AMBER, spacing: 1.6 });
        doc.text(spec.title, tx, 64, { font: 'HB', size: 19, color: '#ffffff' });
        if (spec.subtitle) doc.text(spec.subtitle, tx, 82, { size: 9, color: '#c3c6c8' });
        if (spec.ref) doc.text(spec.ref, W - M, 40, { font: 'C', size: 9, color: '#ffffff', align: 'right' });
        if (spec.date) doc.text(spec.date, W - M, 54, { size: 9, color: '#c3c6c8', align: 'right' });
        y = 132;
      } else {
        doc.rect(0, 0, W, 6, { fill: BAND });
        doc.text(spec.title + (spec.ref ? ' · ' + spec.ref : ''), M, 30, { size: 8, color: MUTED });
        y = 54;
      }
    }
    function newPage() { doc.addPage(); header(doc.pageCount() === 1); }
    function ensure(h) { if (y + h > BOTTOM) newPage(); }
    function para(text, o) {
      o = o || {};
      var size = o.size || 9.5, lh = o.lh || size * 1.45, x = o.x || M, w = o.w || CW;
      var lines = wrapRuns(text, w, size, o.bold);
      lines.forEach(function (line) {
        ensure(lh);
        var cx = x;
        line.forEach(function (r) { cx += doc.text(r.t, cx, y + size, { font: r.f, size: size, color: o.color || INK }); });
        y += lh;
      });
      y += o.after != null ? o.after : 5;
    }
    newPage();

    /* resumen en recuadros */
    if (spec.meta && spec.meta.length) {
      var cols = Math.min(4, spec.meta.length), cw = CW / cols, rowsN = Math.ceil(spec.meta.length / cols);
      for (var r = 0; r < rowsN; r++) {
        var cells = spec.meta.slice(r * cols, r * cols + cols);
        var hMax = 0;
        cells.forEach(function (c) { hMax = Math.max(hMax, wrapRuns(c[1], cw - 16, 10.5, true).length); });
        var bh = 22 + hMax * 13 + 6;
        ensure(bh);
        cells.forEach(function (c, i) {
          var x = M + i * cw;
          doc.rect(x, y, cw, bh, { stroke: RULE, lw: 0.6 });
          doc.text(String(c[0]).toUpperCase(), x + 8, y + 14, { size: 6.5, color: MUTED, spacing: 0.9 });
          wrapRuns(c[1], cw - 16, 10.5, true).forEach(function (line, li) {
            var cx = x + 8;
            line.forEach(function (rr) { cx += doc.text(rr.t, cx, y + 29 + li * 13, { font: 'HB', size: 10.5 }); });
          });
        });
        y += bh;
      }
      y += 16;
    }

    (spec.blocks || []).forEach(function (b) {
      if (b.h) {
        ensure(40);
        y += 6;
        doc.text(b.h.toUpperCase(), M, y + 9, { font: 'HB', size: 8.5, spacing: 0.8 });
        y += 14;
        doc.line(M, y, W - M, y, { stroke: INK, lw: 0.8 });
        y += 9;
      } else if (b.p != null) {
        para(b.p, { size: b.size, color: b.muted ? MUTED : INK });
      } else if (b.bullets) {
        b.bullets.forEach(function (t) {
          var size = 9.5, lines = wrapRuns(t, CW - 14, size);
          lines.forEach(function (line, li) {
            ensure(size * 1.45);
            if (li === 0) doc.rect(M + 2, y + 4.2, 3.2, 3.2, { fill: INK });
            var cx = M + 14;
            line.forEach(function (rr) { cx += doc.text(rr.t, cx, y + size, { font: rr.f, size: size }); });
            y += size * 1.45;
          });
          y += 2;
        });
        y += 4;
      } else if (b.table) {
        var tb = b.table, widths = tb.widths || tb.head.map(function () { return 1; });
        var tot = widths.reduce(function (a, c) { return a + c; }, 0), ws = widths.map(function (v) { return v / tot * CW; });
        var drawRow = function (cells, o) {
          o = o || {};
          var size = o.size || 9, lines = cells.map(function (c, i) { return wrapRuns(String(c == null ? '' : c), ws[i] - 10, size, o.bold); });
          var hh = Math.max.apply(null, lines.map(function (l) { return Math.max(1, l.length); })) * size * 1.35 + 10;
          ensure(hh);
          if (o.fill) doc.rect(M, y, CW, hh, { fill: o.fill });
          var x = M;
          lines.forEach(function (l, i) {
            l.forEach(function (line, li) {
              var lineW = line.reduce(function (a, rr) { return a + widthOf(rr.t, rr.f, size); }, 0);
              var cx = tb.align && tb.align[i] === 'r' ? x + ws[i] - 5 - lineW : x + 5;
              line.forEach(function (rr) { cx += doc.text(rr.t, cx, y + 5 + size + li * size * 1.35, { font: o.head ? 'HB' : rr.f, size: o.head ? 7 : size, color: o.head ? '#ffffff' : INK, spacing: o.head ? 0.6 : 0 }); });
            });
            x += ws[i];
          });
          y += hh;
          doc.line(M, y, W - M, y, { stroke: o.strong ? INK : RULE, lw: o.strong ? 0.9 : 0.5 });
        };
        drawRow(tb.head.map(function (h) { return String(h).toUpperCase(); }), { fill: BAND, head: true });
        tb.rows.forEach(function (rw) { drawRow(rw); });
        if (tb.foot) drawRow(tb.foot, { bold: true, strong: true });
        y += 12;
      } else if (b.space) { y += b.space; }
    });

    /* firmas */
    if (spec.signatures && spec.signatures.length) {
      var n = spec.signatures.length, perRow = Math.min(n, 2), sw = (CW - (perRow - 1) * 28) / perRow;
      var rowsS = Math.ceil(n / perRow);
      ensure(30);
      if (spec.place) { y += 8; para(spec.place, { color: MUTED, after: 4 }); }
      for (var rs = 0; rs < rowsS; rs++) {
        ensure(84);
        y += 46;
        spec.signatures.slice(rs * perRow, rs * perRow + perRow).forEach(function (s, i) {
          var x = M + i * (sw + 28);
          doc.line(x, y, x + sw, y, { stroke: INK, lw: 0.8 });
          doc.text(s.role.toUpperCase(), x, y + 13, { font: 'HB', size: 7.5, spacing: 0.8 });
          doc.text(s.name || '', x, y + 26, { size: 9.5 });
          if (s.sub) doc.text(s.sub, x, y + 38, { size: 8.5, color: MUTED });
        });
        y += 40;
      }
    }

    /* pie con número de página */
    var total = doc.pageCount();
    for (var p = 0; p < total; p++) {
      doc.onPage(p, function () {
        doc.line(M, doc.H - 40, W - M, doc.H - 40, { stroke: RULE, lw: 0.5 });
        doc.text(spec.footer || '', M, doc.H - 26, { size: 7.5, color: MUTED });
        doc.text((p + 1) + ' / ' + total, W - M, doc.H - 26, { size: 7.5, color: MUTED, align: 'right' });
      });
    }
    return doc.output();
  }

  /* ---------- la misma pieza en HTML para la vista previa ---------- */
  function inline(t) {
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    return String(t || '').split('**').map(function (p, i) { return i % 2 ? '<b>' + esc(p) + '</b>' : esc(p); }).join('');
  }
  function docHTML(spec) {
    var h = '<article class="paper"><header class="paper-band">' +
      (root && root.KR ? root.KR.logoSvg('paper-logo') : '') +
      '<div class="paper-t"><span>' + inline(spec.kicker || '') + '</span><h3>' + inline(spec.title) + '</h3>' + (spec.subtitle ? '<p>' + inline(spec.subtitle) + '</p>' : '') + '</div>' +
      '<div class="paper-ref"><code>' + inline(spec.ref || '') + '</code><span>' + inline(spec.date || '') + '</span></div></header><div class="paper-body">';
    if (spec.meta && spec.meta.length) h += '<dl class="paper-meta">' + spec.meta.map(function (m) { return '<div><dt>' + inline(m[0]) + '</dt><dd>' + inline(m[1]) + '</dd></div>'; }).join('') + '</dl>';
    (spec.blocks || []).forEach(function (b) {
      if (b.h) h += '<h4>' + inline(b.h) + '</h4>';
      else if (b.p != null) h += '<p' + (b.muted ? ' class="m"' : '') + '>' + inline(b.p) + '</p>';
      else if (b.bullets) h += '<ul>' + b.bullets.map(function (t) { return '<li>' + inline(t) + '</li>'; }).join('') + '</ul>';
      else if (b.table) {
        var al = b.table.align || [];
        h += '<div class="paper-tw"><table><thead><tr>' + b.table.head.map(function (c, i) { return '<th' + (al[i] === 'r' ? ' class="r"' : '') + '>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          b.table.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td' + (al[i] === 'r' ? ' class="r"' : '') + '>' + inline(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody>' +
          (b.table.foot ? '<tfoot><tr>' + b.table.foot.map(function (c, i) { return '<td' + (al[i] === 'r' ? ' class="r"' : '') + '>' + inline(c) + '</td>'; }).join('') + '</tr></tfoot>' : '') + '</table></div>';
      }
    });
    if (spec.place) h += '<p class="m">' + inline(spec.place) + '</p>';
    if (spec.signatures) h += '<div class="paper-sign">' + spec.signatures.map(function (s) { return '<div><i></i><b>' + inline(s.role) + '</b><span>' + inline(s.name) + '</span>' + (s.sub ? '<small>' + inline(s.sub) + '</small>' : '') + '</div>'; }).join('') + '</div>';
    h += '</div><footer class="paper-foot">' + inline(spec.footer || '') + '</footer></article>';
    return h;
  }

  var api = { create: create, renderDoc: renderDoc, docHTML: docHTML, widthOf: widthOf, encode: encode, wrapRuns: wrapRuns };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) { root.KR = root.KR || {}; root.KR.pdf = api; }
})(typeof window !== 'undefined' ? window : null);
