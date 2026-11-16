/* KTRL Room · análisis de audio
   Todo corre en el navegador (en un Worker): nada se sube a ningún servidor.
   - Sonoridad integrada (ITU-R BS.1770 con ponderación K y compuertas), rango (LRA) y pico real con sobremuestreo x4.
   - Tempo: envolvente de ataques por flujo espectral + autocorrelación con peine de múltiplos y fase del primer golpe.
   - Tonalidad: cromagrama por picos espectrales con afinación estimada, bajo aparte, y perfiles Krumhansl-Kessler + Temperley.
   La fábrica es autocontenida para poder pasarla a un Worker con Function.toString(). */
(function (root) {
  'use strict';

  function KRDSP() {
    var LN10 = Math.log(10);
    function db(x) { return x > 0 ? 20 * Math.log(x) / LN10 : -Infinity; }

    /* ---------- FFT radix-2 ---------- */
    var fftCache = {};
    function getFFT(n) {
      if (fftCache[n]) return fftCache[n];
      var levels = Math.round(Math.log2(n));
      var rev = new Uint32Array(n);
      for (var i = 0; i < n; i++) {
        var r = 0, x = i;
        for (var b = 0; b < levels; b++) { r = (r << 1) | (x & 1); x >>>= 1; }
        rev[i] = r;
      }
      var cos = new Float64Array(n / 2), sin = new Float64Array(n / 2);
      for (var k = 0; k < n / 2; k++) { cos[k] = Math.cos(2 * Math.PI * k / n); sin[k] = -Math.sin(2 * Math.PI * k / n); }
      var f = {
        n: n,
        forward: function (re, im) {
          for (var i = 0; i < n; i++) {
            var j = rev[i];
            if (j > i) { var t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
          }
          for (var size = 2; size <= n; size <<= 1) {
            var half = size >>> 1, step = n / size;
            for (var s = 0; s < n; s += size) {
              for (var q = 0, k = 0; q < half; q++, k += step) {
                var a = s + q, bb = a + half;
                var tr = re[bb] * cos[k] - im[bb] * sin[k];
                var ti = re[bb] * sin[k] + im[bb] * cos[k];
                re[bb] = re[a] - tr; im[bb] = im[a] - ti;
                re[a] += tr; im[a] += ti;
              }
            }
          }
        }
      };
      fftCache[n] = f;
      return f;
    }
    function hann(n) {
      var w = new Float32Array(n);
      for (var i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1));
      return w;
    }
    /* recorre la señal en ventanas y entrega el espectro de magnitud de cada una */
    function stft(x, n, hop, each) {
      var f = getFFT(n), w = hann(n);
      var re = new Float64Array(n), im = new Float64Array(n), mag = new Float32Array(n / 2 + 1);
      var frames = Math.max(1, Math.floor((x.length - n) / hop) + 1);
      for (var t = 0; t < frames; t++) {
        var off = t * hop;
        for (var i = 0; i < n; i++) { var v = x[off + i]; re[i] = (v === undefined ? 0 : v) * w[i]; im[i] = 0; }
        f.forward(re, im);
        for (var k = 0; k <= n / 2; k++) mag[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
        each(mag, t, frames);
      }
      return frames;
    }

    /* ---------- utilidades de señal ---------- */
    function downmix(chs) {
      if (chs.length === 1) return chs[0];
      var n = chs[0].length, out = new Float32Array(n), c = chs.length;
      for (var i = 0; i < n; i++) { var s = 0; for (var j = 0; j < c; j++) s += chs[j][i]; out[i] = s / c; }
      return out;
    }
    var lpCache = {};
    function lowpassKernel(taps, cutoff) {
      var key = taps + ':' + cutoff;
      if (lpCache[key]) return lpCache[key];
      var h = new Float32Array(taps), m = (taps - 1) / 2, sum = 0;
      for (var i = 0; i < taps; i++) {
        var t = i - m;
        var s = t === 0 ? 2 * cutoff : Math.sin(2 * Math.PI * cutoff * t) / (Math.PI * t);
        var w = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (taps - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (taps - 1));
        h[i] = s * w; sum += h[i];
      }
      for (var j = 0; j < taps; j++) h[j] /= sum;
      lpCache[key] = h;
      return h;
    }
    /* filtra y se queda con una de cada `factor` muestras */
    function decimate(x, factor) {
      if (factor <= 1) return x;
      var h = lowpassKernel(4 * factor * 4 + 1, 0.45 / factor), L = h.length, m = (L - 1) / 2;
      var n = Math.floor(x.length / factor), out = new Float32Array(n);
      for (var i = 0; i < n; i++) {
        var c = i * factor, s = 0;
        for (var k = 0; k < L; k++) { var idx = c + k - m; if (idx >= 0 && idx < x.length) s += x[idx] * h[k]; }
        out[i] = s;
      }
      return out;
    }
    function biquad(x, c) {
      var y = new Float32Array(x.length), x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (var i = 0; i < x.length; i++) {
        var v = x[i];
        var o = c.b0 * v + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
        x2 = x1; x1 = v; y2 = y1; y1 = o; y[i] = o;
      }
      return y;
    }
    function shelfCoefs(fs) {
      var G = 4.0, Q = 1 / Math.SQRT2, fc = 1500;
      var A = Math.pow(10, G / 40), w0 = 2 * Math.PI * fc / fs, al = Math.sin(w0) / (2 * Q), cw = Math.cos(w0), sA = Math.sqrt(A);
      var a0 = (A + 1) - (A - 1) * cw + 2 * sA * al;
      return {
        b0: A * ((A + 1) + (A - 1) * cw + 2 * sA * al) / a0,
        b1: -2 * A * ((A - 1) + (A + 1) * cw) / a0,
        b2: A * ((A + 1) + (A - 1) * cw - 2 * sA * al) / a0,
        a1: 2 * ((A - 1) - (A + 1) * cw) / a0,
        a2: ((A + 1) - (A - 1) * cw - 2 * sA * al) / a0
      };
    }
    function highpassCoefs(fs) {
      var Q = 0.5, fc = 38, w0 = 2 * Math.PI * fc / fs, al = Math.sin(w0) / (2 * Q), cw = Math.cos(w0), a0 = 1 + al;
      return { b0: (1 + cw) / 2 / a0, b1: -(1 + cw) / a0, b2: (1 + cw) / 2 / a0, a1: -2 * cw / a0, a2: (1 - al) / a0 };
    }

    /* ---------- sonoridad BS.1770 ---------- */
    function loudness(chs, fs) {
      var sub = Math.round(fs * 0.1); /* sub-bloques de 100 ms */
      var nSub = Math.floor(chs[0].length / sub);
      var ms = new Float64Array(nSub);
      var hs = shelfCoefs(fs), hp = highpassCoefs(fs);
      var gains = chs.length >= 5 ? [1, 1, 1, 0, 1.41, 1.41] : null;
      for (var c = 0; c < chs.length; c++) {
        var g = gains ? (gains[c] || 0) : 1;
        if (!g) continue;
        var y = biquad(biquad(chs[c], hs), hp);
        for (var s = 0; s < nSub; s++) {
          var acc = 0, o = s * sub;
          for (var i = 0; i < sub; i++) { var v = y[o + i]; acc += v * v; }
          ms[s] += g * acc / sub;
        }
      }
      function lufsOf(meanSq) { return meanSq > 0 ? -0.691 + 10 * Math.log(meanSq) / LN10 : -Infinity; }
      function blocks(len) {
        var out = [];
        for (var s = 0; s + len <= nSub; s++) {
          var acc = 0; for (var k = 0; k < len; k++) acc += ms[s + k];
          out.push(acc / len);
        }
        return out;
      }
      var mom = blocks(4); /* 400 ms */
      var gated = mom.filter(function (z) { return lufsOf(z) > -70; });
      var integrated = -Infinity;
      if (gated.length) {
        var mean = gated.reduce(function (a, b) { return a + b; }, 0) / gated.length;
        var rel = lufsOf(mean) - 10;
        var g2 = gated.filter(function (z) { return lufsOf(z) > rel; });
        if (g2.length) integrated = lufsOf(g2.reduce(function (a, b) { return a + b; }, 0) / g2.length);
      }
      var st = blocks(30); /* 3 s */
      var stL = st.map(lufsOf);
      var lra = null;
      var stAbs = st.filter(function (z) { return lufsOf(z) > -70; });
      if (stAbs.length > 2) {
        var m2 = lufsOf(stAbs.reduce(function (a, b) { return a + b; }, 0) / stAbs.length) - 20;
        var vals = stAbs.map(lufsOf).filter(function (l) { return l > m2; }).sort(function (a, b) { return a - b; });
        if (vals.length > 2) lra = vals[Math.min(vals.length - 1, Math.round(0.95 * (vals.length - 1)))] - vals[Math.round(0.10 * (vals.length - 1))];
      }
      var series = [];
      for (var t = 0; t < stL.length; t += 5) series.push({ t: (t + 30) * 0.1, l: isFinite(stL[t]) ? Math.max(-60, stL[t]) : -60 });
      return {
        integrated: integrated,
        lra: lra,
        maxMomentary: mom.length ? Math.max.apply(null, mom.map(lufsOf)) : -Infinity,
        maxShortTerm: stL.length ? Math.max.apply(null, stL) : -Infinity,
        shortTerm: series
      };
    }

    /* ---------- picos ---------- */
    function peaks(chs) {
      var peak = 0, clipped = 0, sumSq = 0, n = 0, dc = 0;
      for (var c = 0; c < chs.length; c++) {
        var x = chs[c];
        for (var i = 0; i < x.length; i++) {
          var v = x[i], a = v < 0 ? -v : v;
          if (a > peak) peak = a;
          if (a >= 0.9999) clipped++;
          sumSq += v * v; dc += v;
        }
        n += x.length;
      }
      return { peak: peak, peakDb: db(peak), rmsDb: db(Math.sqrt(sumSq / n)), clipped: clipped, dc: dc / n };
    }
    var tpKernel = null;
    function truePeak(chs, samplePeak) {
      /* sobremuestreo x4 polifásico (48 coeficientes) solo cerca de las muestras altas */
      if (!tpKernel) {
        tpKernel = new Float32Array(48);
        for (var i = 0; i < 48; i++) {
          var t = (i - 23.5) / 4;
          var s = Math.abs(t) < 1e-9 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t);
          var w = 0.5 - 0.5 * Math.cos(2 * Math.PI * (i + 0.5) / 48);
          tpKernel[i] = s * w;
        }
      }
      var h = tpKernel, thr = samplePeak * 0.5, best = samplePeak;
      for (var c = 0; c < chs.length; c++) {
        var x = chs[c];
        for (var m = 11; m < x.length; m++) {
          var a = x[m], b = x[m - 1];
          if ((a < 0 ? -a : a) < thr && (b < 0 ? -b : b) < thr) continue;
          for (var p = 0; p < 4; p++) {
            var acc = 0;
            for (var j = 0; j < 12; j++) acc += x[m - j] * h[p + 4 * j];
            if (acc < 0) acc = -acc;
            if (acc > best) best = acc;
          }
        }
      }
      return best;
    }

    /* ---------- tempo ---------- */
    function onsetEnvelope(x, fs) {
      var n = 1024, hop = 256, bands = 24, fmin = 30, fmax = Math.min(9000, fs / 2 - 100);
      var edges = [];
      for (var b = 0; b <= bands; b++) edges.push(Math.round(fmin * Math.pow(fmax / fmin, b / bands) * n / fs));
      var prev = new Float32Array(bands), cur = new Float32Array(bands), env = [], spec = new Float64Array(6), specN = 0;
      var bandHz = [20, 60, 250, 2000, 6000, fs / 2];
      stft(x, n, hop, function (mag, t) {
        for (var b = 0; b < bands; b++) {
          var lo = Math.max(1, edges[b]), hi = Math.max(lo + 1, edges[b + 1]), e = 0;
          for (var k = lo; k < hi && k < mag.length; k++) e += mag[k] * mag[k];
          cur[b] = Math.log(1 + 100 * e / (hi - lo));
        }
        var flux = 0;
        for (var c = 0; c < bands; c++) { var d = cur[c] - prev[c]; if (d > 0) flux += d; prev[c] = cur[c]; }
        env.push(t === 0 ? 0 : flux);
        /* balance espectral, de paso */
        for (var q = 0; q < 5; q++) {
          var k0 = Math.max(1, Math.floor(bandHz[q] * n / fs)), k1 = Math.min(mag.length, Math.ceil(bandHz[q + 1] * n / fs)), s = 0;
          for (var kk = k0; kk < k1; kk++) s += mag[kk] * mag[kk];
          spec[q] += s;
        }
        specN++;
      });
      var fps = fs / hop;
      /* quita la tendencia: resta la media móvil de ~1 s y rectifica */
      var w = Math.round(fps), out = new Float32Array(env.length), acc = 0, q2 = [];
      for (var i = 0; i < env.length; i++) {
        acc += env[i]; q2.push(env[i]);
        if (q2.length > w) acc -= q2.shift();
        var v = env[i] - acc / q2.length;
        out[i] = v > 0 ? v : 0;
      }
      var mx = 0; for (var j = 0; j < out.length; j++) if (out[j] > mx) mx = out[j];
      if (mx > 0) for (var z = 0; z < out.length; z++) out[z] /= mx;
      var totalSpec = spec[0] + spec[1] + spec[2] + spec[3] + spec[4];
      var balance = ['Sub', 'Graves', 'Medios', 'Medios altos', 'Agudos'].map(function (name, idx) {
        return { name: name, from: bandHz[idx], to: Math.round(bandHz[idx + 1]), pct: totalSpec > 0 ? spec[idx] / totalSpec * 100 : 0 };
      });
      return { env: out, fps: fps, offset: n / 2 / fs, balance: balance };
    }
    function autocorr(env, maxLag) {
      var n = env.length, ac = new Float64Array(maxLag + 2);
      for (var lag = 0; lag <= maxLag + 1; lag++) {
        var s = 0;
        for (var i = lag; i < n; i++) s += env[i] * env[i - lag];
        ac[lag] = s / (n - lag);
      }
      return ac;
    }
    function interp(arr, x) {
      var i = Math.floor(x), f = x - i;
      if (i < 0 || i + 1 >= arr.length) return 0;
      return arr[i] * (1 - f) + arr[i + 1] * f;
    }
    function tempo(onset, opts) {
      opts = opts || {};
      var env = onset.env, fps = onset.fps;
      var minBpm = 50, maxBpm = 220;
      var maxLag = Math.ceil(fps * 60 / minBpm * 4);
      if (env.length < fps * 6) return null;
      var ac = autocorr(env, Math.min(maxLag, env.length - 2));
      var center = opts.center || 120;
      var scores = [];
      for (var b10 = minBpm * 10; b10 <= maxBpm * 10; b10++) {
        var bpm = b10 / 10, P = fps * 60 / bpm, s = 0;
        for (var k = 1; k <= 4; k++) s += interp(ac, k * P) / k;
        var prior = Math.exp(-0.5 * Math.pow(Math.log2(bpm / center) / 1.0, 2));
        scores.push({ bpm: bpm, raw: s, s: s * (0.6 + 0.4 * prior) });
      }
      var best = scores[0];
      for (var q = 1; q < scores.length; q++) if (scores[q].s > best.s) best = scores[q];
      /* afina con una parábola sobre el pico */
      var bi = scores.indexOf(best), bpmBest = best.bpm;
      if (bi > 0 && bi < scores.length - 1) {
        var y0 = scores[bi - 1].s, y1 = best.s, y2 = scores[bi + 1].s, den = y0 - 2 * y1 + y2;
        if (den < 0) bpmBest += 0.1 * 0.5 * (y0 - y2) / den;
      }
      /* rango preferido (hip hop, electrónica…) */
      var lo = opts.lo || null, hi = opts.hi || null, folded = bpmBest;
      if (lo && hi) {
        while (folded < lo && folded * 2 <= hi * 1.04) folded *= 2;
        while (folded > hi && folded / 2 >= lo * 0.96) folded /= 2;
      }
      var mean = scores.reduce(function (a, x) { return a + x.s; }, 0) / scores.length;
      var conf = Math.max(0, Math.min(1, (best.s / (mean || 1) - 1) / 3));
      /* fase: dónde cae el primer golpe */
      var P2 = fps * 60 / folded, bestPh = 0, bestV = -1;
      for (var ph = 0; ph < P2; ph += 0.25) {
        var v = 0;
        for (var t = ph; t < env.length; t += P2) v += interp(env, t);
        if (v > bestV) { bestV = v; bestPh = ph; }
      }
      /* casi todo se produce a BPM entero: si cae a menos de 0.35, se redondea */
      var shown = Math.abs(folded - Math.round(folded)) < 0.35 ? Math.round(folded) : Math.round(folded * 10) / 10;
      var alt = shown >= 100 ? shown / 2 : shown * 2;
      return {
        bpm: shown,
        raw: Math.round(folded * 100) / 100,
        alt: Math.round(alt * 10) / 10,
        confidence: conf,
        firstBeat: bestPh / fps + onset.offset
      };
    }

    /* ---------- tonalidad ---------- */
    var KK_MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    var KK_MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
    var TE_MAJ = [5.0, 2.0, 3.5, 2.0, 4.5, 4.0, 2.0, 4.5, 2.0, 3.5, 1.5, 4.0];
    var TE_MIN = [5.0, 2.0, 3.5, 4.5, 2.0, 4.0, 2.0, 4.5, 3.5, 2.0, 1.5, 4.0];
    function zscore(v) {
      var m = 0, s = 0, i;
      for (i = 0; i < v.length; i++) m += v[i];
      m /= v.length;
      for (i = 0; i < v.length; i++) s += (v[i] - m) * (v[i] - m);
      s = Math.sqrt(s / v.length) || 1;
      return v.map(function (x) { return (x - m) / s; });
    }
    function corr(a, b) { var s = 0; for (var i = 0; i < 12; i++) s += a[i] * b[i]; return s / 12; }
    function chromaOf(x, fs, n, hop, fmin, fmax, tuning, collectDev, frameNorm) {
      var chroma = new Float64Array(12), devs = collectDev ? [] : null, frames = 0;
      stft(x, n, hop, function (mag) {
        var frame = new Float64Array(12), energy = 0;
        var k0 = Math.max(2, Math.floor(fmin * n / fs)), k1 = Math.min(mag.length - 2, Math.ceil(fmax * n / fs));
        var floor = 0;
        for (var q = k0; q <= k1; q++) floor += mag[q];
        floor = floor / (k1 - k0 + 1) * 1.5;
        for (var k = k0; k <= k1; k++) {
          var m = mag[k];
          if (m <= floor || m < mag[k - 1] || m < mag[k + 1]) continue;
          var a = mag[k - 1], c = mag[k + 1], den = a - 2 * m + c;
          var d = den !== 0 ? 0.5 * (a - c) / den : 0;
          var f = (k + d) * fs / n;
          var midi = 69 + 12 * Math.log2(f / 440) - tuning / 100;
          var near = Math.round(midi);
          if (devs) devs.push([(midi - near) * 100, m]);
          var wgt = Math.max(0, 1 - 2 * Math.abs(midi - near));
          var pc = ((near % 12) + 12) % 12;
          frame[pc] += m * wgt;
          energy += m * wgt;
        }
        if (energy > 0) {
          var nz = 0, z;
          if (frameNorm === 'l2') { for (z = 0; z < 12; z++) nz += frame[z] * frame[z]; nz = Math.sqrt(nz); }
          else if (frameNorm === 'l1') nz = energy;
          else if (frameNorm === 'none') nz = 1;
          else { for (z = 0; z < 12; z++) if (frame[z] > nz) nz = frame[z]; }
          for (var y = 0; y < 12; y++) chroma[y] += frame[y] / nz;
          frames++;
        }
      });
      return { chroma: Array.prototype.slice.call(chroma), frames: frames, devs: devs };
    }
    function estimateTuning(devs) {
      if (!devs || !devs.length) return 0;
      var sx = 0, sy = 0;
      for (var i = 0; i < devs.length; i++) {
        var ang = devs[i][0] / 100 * 2 * Math.PI, w = devs[i][1];
        sx += Math.cos(ang) * w; sy += Math.sin(ang) * w;
      }
      return Math.atan2(sy, sx) / (2 * Math.PI) * 100;
    }
    function keyFromChroma(mid, bass, bassW) {
      function norm(v) { var s = v.reduce(function (a, b) { return a + b; }, 0) || 1; return v.map(function (x) { return x / s; }); }
      var bw = bassW == null ? 0.3 : bassW;
      var c = norm(mid), b = norm(bass), comb = c.map(function (x, i) { return x + bw * b[i]; });
      var zc = zscore(comb);
      var profiles = { maj: [zscore(KK_MAJ), zscore(TE_MAJ)], min: [zscore(KK_MIN), zscore(TE_MIN)] };
      var cands = [];
      for (var pc = 0; pc < 12; pc++) {
        ['maj', 'min'].forEach(function (mode) {
          var s = 0;
          profiles[mode].forEach(function (p) {
            var rot = []; for (var i = 0; i < 12; i++) rot.push(p[(i - pc + 12) % 12]);
            s += corr(zc, rot);
          });
          cands.push({ pc: pc, mode: mode, score: s / 2 });
        });
      }
      cands.sort(function (x, y) { return y.score - x.score; });
      var conf = Math.max(0, Math.min(1, (cands[0].score - cands[1].score) * 4 + (cands[0].score - 0.3)));
      return { pc: cands[0].pc, mode: cands[0].mode, confidence: conf, candidates: cands.slice(0, 4), chroma: c, bass: b };
    }

    /* ---------- vista general de la onda ---------- */
    function overview(x, buckets) {
      var n = x.length, size = Math.max(1, Math.floor(n / buckets)), mins = [], maxs = [], rms = [];
      for (var b = 0; b < buckets; b++) {
        var lo = 0, hi = 0, s = 0, o = b * size, end = Math.min(n, o + size);
        for (var i = o; i < end; i++) { var v = x[i]; if (v < lo) lo = v; if (v > hi) hi = v; s += v * v; }
        mins.push(+lo.toFixed(3)); maxs.push(+hi.toFixed(3)); rms.push(+Math.sqrt(s / Math.max(1, end - o)).toFixed(3));
      }
      return { min: mins, max: maxs, rms: rms };
    }

    /* ---------- análisis completo ---------- */
    function analyze(chs, fs, opts, progress) {
      opts = opts || {};
      var step = function (p, msg) { if (progress) progress(p, msg); };
      var dur = chs[0].length / fs;
      step(0.05, 'Picos');
      var pk = peaks(chs);
      step(0.12, 'Pico real');
      var tp = truePeak(chs, pk.peak);
      step(0.25, 'Sonoridad');
      var loud = loudness(chs, fs);
      var mono = downmix(chs);
      var factor = fs > 32000 ? 2 : 1;
      var xa = decimate(mono, factor), fa = fs / factor;
      step(0.45, 'Tempo');
      var onset = onsetEnvelope(xa, fa);
      var tmp = tempo(onset, opts);
      step(0.65, 'Tonalidad');
      var pre = chromaOf(xa, fa, 4096, 4096, 110, 2000, 0, true);
      var tuning = estimateTuning(pre.devs);
      var kf = opts.keyFmin || 110, fn = opts.frameNorm || 'max';
      var mid = chromaOf(xa, fa, 4096, 2048, kf, 2000, tuning, false, fn);
      var bf = Math.max(1, Math.round(fa / 5512.5));
      var xb = decimate(xa, bf), fb = fa / bf;
      var bassC = chromaOf(xb, fb, 4096, 2048, 35, 260, tuning, false, fn);
      var key = mid.frames > 4 ? keyFromChroma(mid.chroma, bassC.frames > 4 ? bassC.chroma : mid.chroma, opts.bassW) : null;
      step(0.92, 'Onda');
      var ov = overview(mono, opts.buckets || 900);
      step(1, 'Listo');
      return {
        duration: dur, sampleRate: fs, channels: chs.length,
        peakDb: pk.peakDb, truePeakDb: db(tp), rmsDb: pk.rmsDb, clipped: pk.clipped, dc: pk.dc,
        lufs: loud.integrated, lra: loud.lra, maxMomentary: loud.maxMomentary, maxShortTerm: loud.maxShortTerm, shortTerm: loud.shortTerm,
        tempo: tmp, key: key, tuning: tuning, balance: onset.balance, wave: ov
      };
    }

    return {
      analyze: analyze, getFFT: getFFT, loudness: loudness, peaks: peaks, truePeak: truePeak,
      onsetEnvelope: onsetEnvelope, tempo: tempo, chromaOf: chromaOf, keyFromChroma: keyFromChroma,
      decimate: decimate, downmix: downmix, overview: overview, db: db
    };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = KRDSP();
  if (root) {
    root.KR = root.KR || {};
    root.KR.dspFactory = KRDSP;
    root.KR.dsp = KRDSP();
    /* corre el análisis en un Worker armado desde esta misma fábrica (sirve igual en la web y dentro de Claude) */
    var worker = null, jobs = {}, seq = 0;
    root.KR.analyzeAudio = function (channels, sampleRate, opts, onProgress) {
      return new Promise(function (resolve, reject) {
        try {
          if (!worker) {
            var src = 'var D=(' + KRDSP.toString() + ')();' +
              'self.onmessage=function(e){var m=e.data;try{var r=D.analyze(m.chs,m.fs,m.opts,function(p,t){self.postMessage({id:m.id,progress:p,stage:t});});' +
              'self.postMessage({id:m.id,result:r});}catch(err){self.postMessage({id:m.id,error:String(err&&err.message||err)});}};';
            worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
            worker.onmessage = function (e) {
              var m = e.data, j = jobs[m.id]; if (!j) return;
              if (m.progress != null) { if (j.onProgress) j.onProgress(m.progress, m.stage); return; }
              delete jobs[m.id];
              if (m.error) j.reject(new Error(m.error)); else j.resolve(m.result);
            };
            worker.onerror = function (e) {
              Object.keys(jobs).forEach(function (k) { jobs[k].reject(new Error(e.message || 'Worker')); delete jobs[k]; });
              worker = null;
            };
          }
          var id = ++seq;
          jobs[id] = { resolve: resolve, reject: reject, onProgress: onProgress };
          var copies = channels.map(function (c) { return new Float32Array(c); });
          worker.postMessage({ id: id, chs: copies, fs: sampleRate, opts: opts || {} }, copies.map(function (c) { return c.buffer; }));
        } catch (err) {
          /* sin Worker: corre aquí mismo */
          setTimeout(function () {
            try { resolve(root.KR.dsp.analyze(channels, sampleRate, opts, onProgress)); } catch (e2) { reject(e2); }
          }, 20);
        }
      });
    };
  }
})(typeof window !== 'undefined' ? window : null);
