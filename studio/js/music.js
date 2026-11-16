/* KTRL Room · teoría para DJ y productor
   Tonalidades, rueda Camelot, compatibilidad armónica, tempo y orden automático de sets.
   Funciona en el navegador (KR.music) y en Node (module.exports) para las pruebas. */
(function (root) {
  'use strict';

  var SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var MAJ_NAME = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  var MIN_NAME = ['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'Abm', 'Am', 'Bbm', 'Bm'];
  var SOLFEO = ['Do', 'Re♭', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
  var SOLFEO_MIN = ['Do', 'Do♯', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'Si♭', 'Si'];
  var LETTER = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  var SOLF = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 };

  function mod(n, m) { return ((n % m) + m) % m; }

  /* ---------- tonalidades ---------- */
  function camelotOf(key) {
    if (!key) return null;
    var relMajor = key.mode === 'min' ? mod(key.pc + 3, 12) : key.pc;
    var n = mod(relMajor * 7 + 7, 12) + 1;
    return { n: n, l: key.mode === 'min' ? 'A' : 'B' };
  }
  function fromCamelot(n, l) {
    n = mod(n - 1, 12) + 1;
    var major = mod((n - 8) * 7, 12);
    return l === 'A' ? { pc: mod(major - 3, 12), mode: 'min' } : { pc: major, mode: 'maj' };
  }
  function camelotStr(key) { var c = camelotOf(key); return c ? c.n + c.l : ''; }
  function stdName(key) { if (!key) return ''; return key.mode === 'min' ? MIN_NAME[key.pc] : MAJ_NAME[key.pc]; }
  function esName(key) {
    if (!key) return '';
    return (key.mode === 'min' ? SOLFEO_MIN[key.pc] : SOLFEO[key.pc]) + (key.mode === 'min' ? ' menor' : ' mayor');
  }
  function keyLabel(key, notation) {
    if (!key) return '';
    if (notation === 'std') return stdName(key);
    if (notation === 'es') return esName(key);
    return camelotStr(key);
  }
  function keyFull(key) { return key ? camelotStr(key) + ' · ' + stdName(key) + ' · ' + esName(key) : ''; }
  function sameKey(a, b) { return !!a && !!b && a.pc === b.pc && a.mode === b.mode; }

  function parseKey(input) {
    if (input == null) return null;
    if (typeof input === 'object' && input.pc != null) return { pc: mod(input.pc, 12), mode: input.mode === 'min' ? 'min' : 'maj' };
    var s = String(input).trim();
    if (!s) return null;
    var m = /^(1[0-2]|[1-9])\s*([AaBb])$/.exec(s);
    if (m) return fromCamelot(+m[1], m[2].toUpperCase());
    var t = s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/♯/g, '#').replace(/♭/g, 'b').trim();
    var low = t.toLowerCase();
    /* solfeo: "La menor", "fa# m", "Si bemol mayor" */
    m = /^(do|re|mi|fa|sol|la|si)\s*(#|b|sostenido|bemol)?\s*(mayor|menor|maj|min|m)?$/.exec(low.replace(/\s+/g, ' '));
    if (m) {
      var pc = SOLF[m[1]];
      if (m[2] === '#' || m[2] === 'sostenido') pc += 1;
      if (m[2] === 'b' || m[2] === 'bemol') pc -= 1;
      var mn = m[3] === 'menor' || m[3] === 'min' || m[3] === 'm';
      return { pc: mod(pc, 12), mode: mn ? 'min' : 'maj' };
    }
    /* anglosajón: "Am", "A minor", "F#m", "Bbmin", "C", "Ebmaj" */
    m = /^([A-Ga-g])\s*(#|b|sharp|flat)?\s*(m|min|minor|menor|-|maj|major|mayor|M)?$/.exec(t);
    if (m) {
      var p = LETTER[m[1].toUpperCase()];
      if (m[2] === '#' || m[2] === 'sharp') p += 1;
      if (m[2] === 'b' || m[2] === 'flat') p -= 1;
      var q = m[3] || '';
      var minor = q === 'm' || q === 'min' || q === 'minor' || q === 'menor' || q === '-';
      return { pc: mod(p, 12), mode: minor ? 'min' : 'maj' };
    }
    return null;
  }
  function transpose(key, semis) { return key ? { pc: mod(key.pc + Math.round(semis), 12), mode: key.mode } : null; }

  /* ---------- compatibilidad armónica entre dos temas ---------- */
  function transition(a, b) {
    if (!a || !b) return { score: 0.5, kind: 'unknown', label: 'Falta la tonalidad', short: '?', tone: 'muted' };
    var ca = camelotOf(a), cb = camelotOf(b);
    var dn = mod(cb.n - ca.n, 12), same = ca.l === cb.l;
    var r;
    if (dn === 0 && same) r = { score: 1, kind: 'same', label: 'Misma tonalidad', short: '=' };
    else if (dn === 0) r = { score: 0.85, kind: 'relative', label: 'Relativa ' + (cb.l === 'B' ? 'mayor' : 'menor'), short: 'A↔B' };
    else if (same && dn === 1) r = { score: 0.9, kind: 'up1', label: '+1 · sube energía', short: '+1' };
    else if (same && dn === 11) r = { score: 0.9, kind: 'down1', label: '−1 · baja energía', short: '−1' };
    else if (!same && ((ca.l === 'A' && dn === 1) || (ca.l === 'B' && dn === 11))) r = { score: 0.7, kind: 'diagonal', label: 'Diagonal', short: '↗' };
    else if (!same && (dn === 1 || dn === 11)) r = { score: 0.55, kind: 'diagonal2', label: 'Diagonal inversa', short: '↘' };
    else if (same && dn === 2) r = { score: 0.6, kind: 'boost', label: '+2 · golpe de energía', short: '+2' };
    else if (same && dn === 7) r = { score: 0.55, kind: 'semi-up', label: '+1 semitono', short: '+7' };
    else if (same && dn === 10) r = { score: 0.45, kind: 'drop', label: '−2 · bajón', short: '−2' };
    else if (same && dn === 5) r = { score: 0.4, kind: 'semi-down', label: '−1 semitono', short: '−7' };
    else r = { score: same ? 0.2 : 0.12, kind: 'clash', label: 'Choque armónico', short: '✕' };
    r.tone = r.score >= 0.8 ? 'good' : r.score >= 0.5 ? 'warn' : 'bad';
    return r;
  }
  function compatibleKeys(key) {
    if (!key) return [];
    var c = camelotOf(key);
    return [
      { key: key, why: 'Misma' },
      { key: fromCamelot(c.n + 1, c.l), why: '+1' },
      { key: fromCamelot(c.n - 1, c.l), why: '−1' },
      { key: fromCamelot(c.n, c.l === 'A' ? 'B' : 'A'), why: 'Relativa' },
      { key: c.l === 'A' ? fromCamelot(c.n + 1, 'B') : fromCamelot(c.n - 1, 'A'), why: 'Diagonal' },
      { key: fromCamelot(c.n + 2, c.l), why: '+2 energía' },
      { key: fromCamelot(c.n + 7, c.l), why: '+1 semitono' }
    ];
  }

  /* ---------- tempo ---------- */
  function semitonesFor(bpmFrom, bpmTo) { return 12 * Math.log2(bpmTo / bpmFrom); }
  function bpmMatch(b1, b2) {
    /* compara también a doble o mitad de tiempo (70 ↔ 140) */
    if (!(b1 > 0) || !(b2 > 0)) return { pct: null, ratio: 1, tone: 'muted', label: 'Falta el BPM' };
    var best = null;
    [1, 2, 0.5].forEach(function (r) {
      var pct = (b2 * r / b1 - 1) * 100;
      if (!best || Math.abs(pct) < Math.abs(best.pct)) best = { pct: pct, ratio: r };
    });
    var a = Math.abs(best.pct);
    best.tone = a <= 2.5 ? 'good' : a <= 6 ? 'warn' : 'bad';
    best.label = (best.ratio !== 1 ? (best.ratio === 2 ? 'a doble tiempo · ' : 'a mitad de tiempo · ') : '') +
      (best.pct >= 0 ? '+' : '−') + Math.abs(best.pct).toFixed(1) + ' %';
    return best;
  }
  var FIGURES = [
    { id: '1/1', label: 'Redonda', beats: 4 },
    { id: '1/2', label: 'Blanca', beats: 2 },
    { id: '1/4', label: 'Negra', beats: 1 },
    { id: '1/8', label: 'Corchea', beats: 0.5 },
    { id: '1/16', label: 'Semicorchea', beats: 0.25 },
    { id: '1/32', label: 'Fusa', beats: 0.125 }
  ];
  function msFor(bpm, beats) { return 60000 / bpm * beats; }
  function noteTable(bpm) {
    return FIGURES.map(function (f) {
      var ms = msFor(bpm, f.beats);
      return { id: f.id, label: f.label, straight: ms, dotted: ms * 1.5, triplet: ms * 2 / 3 };
    });
  }
  function barsToSeconds(bars, bpm, beatsPerBar) { return bars * (beatsPerBar || 4) * 60 / bpm; }
  function tapTempo(times) {
    /* times: marcas en ms; usa hasta los últimos 12 intervalos y descarta los raros */
    if (times.length < 2) return null;
    var iv = [];
    for (var i = Math.max(1, times.length - 12); i < times.length; i++) iv.push(times[i] - times[i - 1]);
    var sorted = iv.slice().sort(function (a, b) { return a - b; });
    var med = sorted[Math.floor(sorted.length / 2)];
    var good = iv.filter(function (x) { return Math.abs(x - med) < med * 0.25; });
    var avg = good.reduce(function (a, b) { return a + b; }, 0) / good.length;
    return 60000 / avg;
  }

  /* ---------- orden automático de un set ---------- */
  function trackKey(t) { return t.key ? parseKey(t.key) : null; }
  function stepCost(a, b, opts) {
    var ka = trackKey(a), kb = trackKey(b);
    var keyPart = (ka && kb) ? 1 - transition(ka, kb).score : 0.5;
    var bm = bpmMatch(+a.bpm, +b.bpm);
    var bpmPart = bm.pct == null ? 0.3 : Math.min(1, Math.abs(bm.pct) / 8);
    var cost = keyPart * (opts.wKey != null ? opts.wKey : 1) + bpmPart * (opts.wBpm != null ? opts.wBpm : 0.8);
    if (opts.arc === 'up') {
      var ea = +a.energy || 5, eb = +b.energy || 5;
      if (eb < ea) cost += (ea - eb) * 0.12;
      if (+a.bpm > 0 && +b.bpm > 0 && bm.ratio === 1 && b.bpm < a.bpm - 0.5) cost += 0.25;
    }
    return cost;
  }
  function pathCost(order, M) {
    var c = 0;
    for (var i = 1; i < order.length; i++) c += M[order[i - 1]][order[i]];
    return c;
  }
  function orderSet(tracks, opts) {
    opts = opts || {};
    var n = tracks.length;
    if (n < 3) return tracks.map(function (_, i) { return i; });
    var M = [];
    for (var i = 0; i < n; i++) {
      M[i] = [];
      for (var j = 0; j < n; j++) M[i][j] = i === j ? 0 : stepCost(tracks[i], tracks[j], opts);
    }
    var first = opts.first != null ? opts.first : null;
    if (n <= 11) return heldKarp(M, first);
    var starts = first != null ? [first] : tracks.map(function (_, k) { return k; });
    var best = null, bestC = Infinity;
    starts.forEach(function (s) {
      var ord = greedy(M, s);
      ord = improve(ord, M, first != null);
      var c = pathCost(ord, M);
      if (c < bestC - 1e-9) { bestC = c; best = ord; }
    });
    return best;
  }
  function greedy(M, s) {
    var n = M.length, used = new Array(n).fill(false), ord = [s];
    used[s] = true;
    for (var k = 1; k < n; k++) {
      var last = ord[ord.length - 1], bi = -1, bc = Infinity;
      for (var j = 0; j < n; j++) if (!used[j] && M[last][j] < bc) { bc = M[last][j]; bi = j; }
      used[bi] = true; ord.push(bi);
    }
    return ord;
  }
  function improve(ord, M, lockFirst) {
    var n = ord.length, cur = pathCost(ord, M), better = true, guard = 0;
    var lo = lockFirst ? 1 : 0;
    while (better && guard++ < 40) {
      better = false;
      /* reubicar un tema */
      for (var i = lo; i < n; i++) {
        for (var j = lo; j < n; j++) {
          if (i === j) continue;
          var o = ord.slice(); var x = o.splice(i, 1)[0]; o.splice(j, 0, x);
          var c = pathCost(o, M);
          if (c < cur - 1e-9) { ord = o; cur = c; better = true; }
        }
      }
      /* invertir un tramo */
      for (var a = lo; a < n - 1; a++) {
        for (var b = a + 1; b < n; b++) {
          var o2 = ord.slice(0, a).concat(ord.slice(a, b + 1).reverse(), ord.slice(b + 1));
          var c2 = pathCost(o2, M);
          if (c2 < cur - 1e-9) { ord = o2; cur = c2; better = true; }
        }
      }
    }
    return ord;
  }
  function heldKarp(M, first) {
    /* camino óptimo exacto para sets chicos */
    var n = M.length, FULL = 1 << n;
    var dp = new Float64Array(FULL * n).fill(Infinity);
    var par = new Int16Array(FULL * n).fill(-1);
    for (var s = 0; s < n; s++) if (first == null || s === first) dp[(1 << s) * n + s] = 0;
    for (var mask = 1; mask < FULL; mask++) {
      for (var last = 0; last < n; last++) {
        var v = dp[mask * n + last];
        if (v === Infinity || !(mask & (1 << last))) continue;
        for (var nx = 0; nx < n; nx++) {
          if (mask & (1 << nx)) continue;
          var nm = mask | (1 << nx), nv = v + M[last][nx];
          if (nv < dp[nm * n + nx]) { dp[nm * n + nx] = nv; par[nm * n + nx] = last; }
        }
      }
    }
    var bl = 0, bv = Infinity, fm = FULL - 1;
    for (var l = 0; l < n; l++) if (dp[fm * n + l] < bv) { bv = dp[fm * n + l]; bl = l; }
    var ord = [], m = fm, cur = bl;
    while (cur !== -1) { ord.push(cur); var p = par[m * n + cur]; m &= ~(1 << cur); cur = p; }
    return ord.reverse();
  }
  function setScore(tracks) {
    /* 0-100: qué tan fluido es el orden actual */
    if (tracks.length < 2) return null;
    var total = 0, cnt = 0;
    for (var i = 1; i < tracks.length; i++) {
      total += stepCost(tracks[i - 1], tracks[i], {}); cnt++;
    }
    return Math.round(Math.max(0, 100 - (total / cnt) / 1.8 * 100));
  }

  var api = {
    SHARP: SHARP, MAJ_NAME: MAJ_NAME, MIN_NAME: MIN_NAME, SOLFEO: SOLFEO,
    parseKey: parseKey, camelotOf: camelotOf, fromCamelot: fromCamelot, camelotStr: camelotStr,
    stdName: stdName, esName: esName, keyLabel: keyLabel, keyFull: keyFull, sameKey: sameKey, transpose: transpose,
    transition: transition, compatibleKeys: compatibleKeys,
    semitonesFor: semitonesFor, bpmMatch: bpmMatch, FIGURES: FIGURES, msFor: msFor, noteTable: noteTable,
    barsToSeconds: barsToSeconds, tapTempo: tapTempo,
    orderSet: orderSet, stepCost: stepCost, setScore: setScore, pathCost: pathCost
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) { root.KR = root.KR || {}; root.KR.music = api; }
})(typeof window !== 'undefined' ? window : null);
