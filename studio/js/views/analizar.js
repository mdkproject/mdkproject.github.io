/* KTRL Room · Analizador
   Arrastra audios: BPM, tonalidad, sonoridad (LUFS), pico real, balance espectral y grilla de tiempo con clic.
   Todo se procesa en el navegador. Los resultados pasan al catálogo de beats con un clic. */
(function () {
  'use strict';
  var KR = window.KR, M = KR.music, esc = KR.esc;

  var RANGES = {
    auto: { label: 'Auto', center: 120 },
    hiphop: { label: 'Hip hop · trap', lo: 70, hi: 115, center: 90 },
    house: { label: 'House · techno', lo: 110, hi: 150, center: 125 },
    dnb: { label: 'DnB · jungle', lo: 155, hi: 185, center: 172 }
  };
  var PLATFORMS = [
    { name: 'Spotify', target: -14 }, { name: 'YouTube', target: -14 }, { name: 'Apple Music', target: -16 },
    { name: 'Tidal', target: -14 }, { name: 'Deezer', target: -15 }, { name: 'SoundCloud', target: null }
  ];
  var MAX_SECONDS = 15 * 60;

  /* estado de la sesión: sobrevive al cambiar de módulo */
  var S = { items: [], sel: null, busy: false, demoDone: false };
  var P = { ac: null, src: null, gain: null, item: null, startedAt: 0, offset: 0, playing: false, click: false, grid: true, nudge: 0, raf: 0, sched: 0, lastClick: -1 };

  function audioCtx() {
    if (!P.ac) {
      var C = window.AudioContext || window.webkitAudioContext;
      P.ac = new C();
      P.gain = P.ac.createGain(); P.gain.connect(P.ac.destination);
    }
    return P.ac;
  }
  function decode(file) {
    return file.arrayBuffer().then(function (buf) {
      var ac = audioCtx();
      return new Promise(function (res, rej) { ac.decodeAudioData(buf, res, function (e) { rej(e || new Error('No se pudo leer el audio')); }); });
    });
  }
  function baseName(n) { return String(n || '').replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_]+/g, ' ').trim(); }
  function fmtDb(v, d) { if (v == null || !isFinite(v)) return '—'; return (v < 0 ? '−' : v > 0 ? '+' : '') + Math.abs(v).toFixed(d == null ? 1 : d); }

  /* ---------- loop de ejemplo generado aquí mismo ---------- */
  function makeDemo() {
    var fs = 44100, bpm = 92, beat = 60 / bpm, bars = 8, secs = bars * 4 * beat;
    var n = Math.round(secs * fs), L = new Float32Array(n), R = new Float32Array(n);
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647 * 2 - 1; }
    function hit(t0, kind, gain) {
      var i0 = Math.round(t0 * fs), len = Math.round((kind === 'kick' ? 0.35 : kind === 'snare' ? 0.22 : 0.06) * fs);
      for (var i = 0; i < len && i0 + i < n; i++) {
        var t = i / fs, v;
        if (kind === 'kick') v = Math.sin(2 * Math.PI * (48 + 110 * Math.exp(-t * 28)) * t) * Math.exp(-t * 9) * 0.9;
        else if (kind === 'snare') v = (rnd() * 0.7 + Math.sin(2 * Math.PI * 190 * t) * 0.4) * Math.exp(-t * 22) * 0.55;
        else v = rnd() * Math.exp(-t * 80) * 0.18;
        v *= gain || 1;
        L[i0 + i] += v * (kind === 'hat' ? 0.8 : 1); R[i0 + i] += v * (kind === 'hat' ? 1.1 : 1);
      }
    }
    function note(midi, t0, dur, amp, pan) {
      var f = 440 * Math.pow(2, (midi - 69) / 12), i0 = Math.round(t0 * fs), len = Math.round(dur * fs);
      for (var h = 1; h <= 5; h++) {
        var fh = f * h; if (fh > 9000) break;
        for (var i = 0; i < len && i0 + i < n; i++) {
          var env = Math.min(1, i / 600) * Math.min(1, (len - i) / 2000) * Math.exp(-i / fs * 0.9);
          var v = amp / (h * h * 0.7 + 0.3) * env * Math.sin(2 * Math.PI * fh * i / fs);
          L[i0 + i] += v * (1 - pan); R[i0 + i] += v * (1 + pan);
        }
      }
    }
    var prog = [[57, 60, 64], [62, 65, 69], [64, 67, 71], [57, 60, 64]]; /* Am Dm Em Am */
    for (var b = 0; b < bars; b++) {
      var t = b * 4 * beat, ch = prog[b % 4];
      ch.forEach(function (m, k) { note(m, t, 4 * beat, 0.07, (k - 1) * 0.3); });
      note(ch[0] - 24, t, 2 * beat, 0.32, 0); note(ch[0] - 24, t + 2.5 * beat, 1.5 * beat, 0.26, 0);
      hit(t, 'kick'); hit(t + 1.75 * beat, 'kick', 0.7); hit(t + 2.5 * beat, 'kick');
      hit(t + beat, 'snare'); hit(t + 3 * beat, 'snare');
      for (var e = 0; e < 8; e++) hit(t + e * beat / 2, 'hat', e % 2 ? 0.6 : 1);
    }
    var pk = 0;
    for (var i = 0; i < n; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
    var g = 0.89 / pk;
    for (var j = 0; j < n; j++) { L[j] *= g; R[j] *= g; }
    return { name: 'Loop de ejemplo (92 BPM, generado aquí)', channels: [L, R], sampleRate: fs };
  }

  /* ---------- cola ---------- */
  function addFiles(files, repaint) {
    var list = Array.prototype.slice.call(files).filter(function (f) { return /^audio\//.test(f.type) || /\.(wav|mp3|aiff?|flac|m4a|ogg|opus|aac)$/i.test(f.name); });
    if (!list.length) { KR.toast('Esos archivos no son audio. Prueba con WAV, MP3, AIFF o FLAC.', { tone: 'bad' }); return; }
    list.forEach(function (f) {
      S.items.push({ id: KR.uid('a'), file: f, name: f.name, size: f.size, status: 'cola', progress: 0 });
    });
    if (!S.sel) S.sel = S.items[S.items.length - list.length].id;
    repaint();
    run(repaint);
  }
  function run(repaint) {
    if (S.busy) return;
    var next = S.items.find(function (it) { return it.status === 'cola'; });
    if (!next) return;
    S.busy = true;
    next.status = 'leyendo'; repaint();
    var prepare = next.demo ? Promise.resolve(null) : decode(next.file);
    prepare.then(function (ab) {
      var chs, fs;
      if (next.demo) { chs = next.demo.channels; fs = next.demo.sampleRate; next.buffer = toBuffer(next.demo); }
      else {
        fs = ab.sampleRate; next.buffer = ab;
        var maxN = Math.min(ab.length, Math.round(MAX_SECONDS * fs));
        next.trimmed = ab.length > maxN;
        chs = [];
        for (var c = 0; c < Math.min(ab.numberOfChannels, 2); c++) chs.push(ab.getChannelData(c).subarray(0, maxN));
      }
      next.status = 'analizando'; repaint();
      var r = RANGES[KR.store.doc('settings').bpmRange] || RANGES.auto;
      return KR.analyzeAudio(chs, fs, { lo: r.lo, hi: r.hi, center: r.center }, function (p, stage) {
        next.progress = p; next.stage = stage;
        var bar = document.querySelector('[data-q="' + next.id + '"] .q-bar i');
        if (bar) bar.style.width = Math.round(p * 100) + '%';
      });
    }).then(function (res) {
      next.result = res; next.status = 'listo';
      trimBuffers();
    }).catch(function (e) {
      console.error(e);
      next.status = 'error';
      next.error = /decode|Unable|EncodingError|leer/i.test(String(e && (e.name || e.message))) ? 'El navegador no pudo decodificar este archivo. Prueba exportarlo como WAV o MP3.' : String(e && e.message || e);
    }).then(function () {
      S.busy = false; repaint(); run(repaint);
    });
  }
  function toBuffer(demo) {
    var ac = audioCtx(), b = ac.createBuffer(demo.channels.length, demo.channels[0].length, demo.sampleRate);
    demo.channels.forEach(function (c, i) { b.copyToChannel(c, i); });
    return b;
  }
  function trimBuffers() {
    /* guarda en memoria solo el audio de los últimos tres para poder reproducirlos */
    var withBuf = S.items.filter(function (it) { return it.buffer && it.id !== S.sel && it !== P.item; });
    while (withBuf.length > 3) { withBuf.shift().buffer = null; }
  }

  /* ---------- reproducción con clic ---------- */
  function stop() {
    if (P.src) { try { P.src.onended = null; P.src.stop(); } catch (e) { /* ya paró */ } P.src = null; }
    if (P.playing && P.ac) P.offset = P.ac.currentTime - P.startedAt;
    P.playing = false;
    cancelAnimationFrame(P.raf); clearInterval(P.sched);
  }
  function play(item, at) {
    var ac = audioCtx();
    if (ac.state === 'suspended') ac.resume();
    stop();
    if (!item.buffer) {
      if (!item.file) return Promise.resolve();
      KR.toast('Cargando el audio…');
      return decode(item.file).then(function (ab) { item.buffer = ab; return play(item, at); });
    }
    P.item = item;
    var dur = item.buffer.duration;
    P.offset = Math.max(0, Math.min(dur - 0.05, at != null ? at : P.offset));
    var src = ac.createBufferSource();
    src.buffer = item.buffer; src.connect(P.gain);
    src.start(0, P.offset);
    src.onended = function () { if (P.src === src) { P.playing = false; P.offset = 0; paintTransport(); } };
    P.src = src; P.startedAt = ac.currentTime - P.offset; P.playing = true;
    P.lastClick = -1;
    P.sched = setInterval(scheduleClicks, 25);
    var loop = function () { drawWave(); paintTime(); if (P.playing) P.raf = requestAnimationFrame(loop); };
    loop();
    paintTransport();
    return Promise.resolve();
  }
  function beatTimes(item) {
    var t = item.result && item.result.tempo;
    if (!t || !t.bpm) return null;
    return { period: 60 / t.bpm, first: t.firstBeat + P.nudge / 1000 };
  }
  function scheduleClicks() {
    if (!P.playing || !P.click || !P.item) return;
    var bt = beatTimes(P.item); if (!bt) return;
    var ac = P.ac, pos = ac.currentTime - P.startedAt, ahead = pos + 0.15;
    var k0 = Math.max(0, Math.ceil((pos - bt.first) / bt.period));
    for (var k = Math.max(k0, P.lastClick + 1); bt.first + k * bt.period < ahead; k++) {
      var when = P.startedAt + bt.first + k * bt.period;
      if (when < ac.currentTime) continue;
      var o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = k % 4 === 0 ? 1760 : 1180;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(0.35, when + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
      o.connect(g); g.connect(ac.destination);
      o.start(when); o.stop(when + 0.06);
      P.lastClick = k;
    }
  }
  function position() { return P.playing ? P.ac.currentTime - P.startedAt : P.offset; }

  /* ---------- dibujo de la onda ---------- */
  var waveEl = null;
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#999'; }
  function drawWave() {
    var cv = waveEl; if (!cv || !document.body.contains(cv)) return;
    var item = S.items.find(function (i) { return i.id === S.sel; });
    if (!item || !item.result) return;
    var dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    var g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    var wv = item.result.wave, n = wv.max.length, mid = h / 2, dur = item.result.duration;
    var pos = P.item === item ? position() : 0, px = pos / dur * w;
    var cMuted = cssVar('--line-2'), cPlayed = cssVar('--accent'), cRms = cssVar('--muted'), cGrid = cssVar('--fg');
    var bt = beatTimes(item);
    if (P.grid && bt) {
      g.lineWidth = 1;
      for (var k = 0; ; k++) {
        var t = bt.first + k * bt.period; if (t > dur) break;
        if (t < 0) continue;
        var x = Math.round(t / dur * w) + 0.5;
        g.globalAlpha = k % 4 === 0 ? 0.32 : 0.1;
        g.strokeStyle = cGrid; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke();
      }
      g.globalAlpha = 1;
    }
    for (var i = 0; i < n; i++) {
      var x0 = i / n * w, bw = Math.max(1, w / n - 0.4);
      var top = mid - wv.max[i] * mid * 0.95, bot = mid - wv.min[i] * mid * 0.95;
      g.fillStyle = x0 <= px ? cPlayed : cMuted;
      g.fillRect(x0, top, bw, Math.max(1, bot - top));
      var r = wv.rms[i] * mid * 0.95;
      g.fillStyle = x0 <= px ? cPlayed : cRms;
      g.globalAlpha = x0 <= px ? 0.55 : 0.5;
      g.fillRect(x0, mid - r, bw, r * 2);
      g.globalAlpha = 1;
    }
    if (P.item === item) { g.fillStyle = cssVar('--fg'); g.fillRect(Math.round(px), 0, 2, h); }
  }
  function paintTime() {
    var el = document.getElementById('an-time'); if (!el) return;
    var item = S.items.find(function (i) { return i.id === S.sel; });
    if (!item || !item.result) return;
    el.textContent = KR.fmtDur(P.item === item ? position() : 0) + ' / ' + KR.fmtDur(item.result.duration);
  }
  function paintTransport() {
    var b = document.getElementById('an-play'); if (!b) return;
    var item = S.items.find(function (i) { return i.id === S.sel; });
    var on = P.playing && P.item === item;
    b.innerHTML = KR.icon(on ? 'pause' : 'play') + '<span>' + (on ? 'Pausa' : 'Escuchar') + '</span>';
    b.setAttribute('aria-pressed', String(on));
  }

  /* ---------- catálogo ---------- */
  function toBeat(item) {
    var r = item.result, title = baseName(item.name).replace(/\s*\(92 BPM, generado aquí\)$/, '');
    return {
      title: title, bpm: r.tempo ? r.tempo.bpm : null, key: r.key ? M.camelotStr(r.key) : '',
      duration: Math.round(r.duration), lufs: isFinite(r.lufs) ? Math.round(r.lufs * 10) / 10 : null,
      truePeak: isFinite(r.truePeakDb) ? Math.round(r.truePeakDb * 10) / 10 : null, analyzedAt: Date.now(), fileName: item.name
    };
  }
  function saveToCatalog(items) {
    var added = 0, updated = 0;
    items.forEach(function (item) {
      if (!item.result) return;
      var data = toBeat(item);
      var norm = function (s) { return KR.slug(s); };
      var found = KR.store.list('beats').find(function (b) { return norm(b.title) === norm(data.title); });
      if (found) { KR.store.put('beats', Object.assign({}, found, data, { title: found.title })); updated++; }
      else { KR.store.put('beats', Object.assign({ status: 'disponible', project: '', genre: '', mood: '', notes: '' }, data)); added++; }
      item.saved = true;
    });
    var msg = [added ? KR.plural(added, 'beat nuevo', 'beats nuevos') : '', updated ? KR.plural(updated, 'beat actualizado', 'beats actualizados') : ''].filter(Boolean).join(' y ');
    KR.toast((msg || 'Nada que guardar') + ' en el catálogo', { action: 'Ver catálogo', onAction: function () { KR.go('beats'); } });
  }
  function summary(item) {
    var r = item.result, parts = [baseName(item.name)];
    if (r.tempo) parts.push(r.tempo.bpm + ' BPM');
    if (r.key) parts.push(M.camelotStr(r.key) + ' (' + M.stdName(r.key) + ')');
    parts.push(fmtDb(r.lufs) + ' LUFS', 'pico real ' + fmtDb(r.truePeakDb) + ' dBTP', KR.fmtDur(r.duration));
    return parts.join(' · ');
  }

  /* ---------- vista ---------- */
  KR.view('analizar', {
    title: 'Analizador', icon: 'wave',
    render: function (el, arg, ctx) {
      var rangeId = KR.store.doc('settings').bpmRange || 'auto';
      el.innerHTML = KR.head({
        title: 'Analizador',
        lead: 'Arrastra tus beats o temas: tempo, tonalidad, sonoridad LUFS y pico real. <b>El audio no sale de tu equipo.</b>'
      }) +
        '<div class="an-top">' +
        '<label class="drop" id="drop" for="an-files">' + KR.icon('upload', 'drop-ic') +
        '<span class="drop-t">Suelta aquí uno o varios audios</span><span class="drop-s">WAV, MP3, AIFF, FLAC o M4A · también puedes tocar para elegir</span>' +
        '<input type="file" id="an-files" accept="audio/*,.wav,.mp3,.aif,.aiff,.flac,.m4a,.ogg" multiple class="sr"></label>' +
        '<div class="an-range"><span class="label">Rango de BPM esperado</span><div class="seg" id="an-range">' +
        Object.keys(RANGES).map(function (k) { return '<button type="button" data-r="' + k + '" aria-pressed="' + (k === rangeId) + '">' + RANGES[k].label + '</button>'; }).join('') +
        '</div><p class="hint">Sirve para decidir entre 85 y 170 cuando el tema admite las dos lecturas. Se aplica a los próximos análisis.</p></div>' +
        '</div>' +
        '<div class="an-layout"><aside class="panel an-queue" aria-label="Audios analizados"><div class="panel-head"><h2>Audios</h2><span class="label" id="q-count"></span></div><ul class="q-list" id="q-list"></ul><div class="q-foot" id="q-foot"></div></aside>' +
        '<section class="an-detail" id="an-detail" aria-live="polite"></section></div>';

      var $ = function (s) { return KR.$(s, el); };
      var input = $('#an-files'), drop = $('#drop');

      function repaint() { paintQueue(); paintDetail(); }
      function paintQueue() {
        var ul = $('#q-list'); if (!ul) return;
        $('#q-count').textContent = S.items.length ? KR.plural(S.items.length, 'archivo', 'archivos') : '';
        ul.innerHTML = S.items.map(function (it) {
          var r = it.result, st;
          if (it.status === 'listo') st = '<span class="q-meta num">' + (r.tempo ? r.tempo.bpm + ' BPM' : '—') + ' · ' + (r.key ? M.camelotStr(r.key) : '—') + ' · ' + fmtDb(r.lufs) + ' LUFS</span>';
          else if (it.status === 'error') st = '<span class="q-meta bad">' + KR.icon('warn') + ' No se pudo analizar</span>';
          else st = '<span class="q-meta">' + (it.status === 'cola' ? 'En cola' : it.status === 'leyendo' ? 'Leyendo el audio…' : (it.stage || 'Analizando') + '…') + '</span><span class="q-bar"><i style="width:' + Math.round((it.progress || 0) * 100) + '%"></i></span>';
          return '<li data-q="' + it.id + '"' + (it.id === S.sel ? ' aria-current="true"' : '') + '><button type="button" class="q-item" data-pick="' + it.id + '">' +
            '<b>' + esc(baseName(it.name)) + '</b>' + st + '</button>' +
            (it.saved ? '<span class="q-saved" title="Ya está en el catálogo">' + KR.icon('check') + '</span>' : '') + '</li>';
        }).join('');
        var done = S.items.filter(function (i) { return i.status === 'listo'; });
        $('#q-foot').innerHTML = done.length > 1 ? '<button class="btn sm solid" type="button" data-act="save-all">' + KR.icon('disc') + 'Guardar ' + done.length + ' en el catálogo</button>' : '';
      }
      function paintDetail() {
        var box = $('#an-detail'); if (!box) return;
        var it = S.items.find(function (i) { return i.id === S.sel; });
        if (!it) {
          box.innerHTML = KR.empty({ icon: 'wave', title: 'Todavía no hay audios', text: 'Suelta un beat arriba o escucha cómo funciona con un loop generado aquí mismo.', action: '<button class="btn" type="button" data-act="demo">Probar con un loop de ejemplo</button>' });
          return;
        }
        if (it.status !== 'listo') {
          box.innerHTML = it.status === 'error'
            ? KR.empty({ icon: 'warn', title: baseName(it.name), text: esc(it.error || 'No se pudo analizar este archivo.') })
            : '<div class="an-wait"><span class="spinner" aria-hidden="true"></span><p>Analizando <b>' + esc(baseName(it.name)) + '</b>…</p></div>';
          return;
        }
        var r = it.result, t = r.tempo, k = r.key;
        var lufs = r.lufs, tp = r.truePeakDb;
        var tpTone = tp > -0.1 ? 'bad' : tp > -1 ? 'warn' : 'good';
        var tpMsg = tp > -0.1 ? 'Recorta: baja el limitador' : tp > -1 ? 'Arriba de −1 dBTP' : 'Margen seguro';
        var lufsPct = Math.max(0, Math.min(100, (lufs + 30) / 30 * 100));
        var conf = function (c) { return c > 0.66 ? 'alta' : c > 0.33 ? 'media' : 'baja'; };
        box.innerHTML =
          '<div class="an-head"><div class="an-title"><h2>' + esc(baseName(it.name)) + '</h2><span class="label num">' + KR.fmtDur(r.duration) + ' · ' + (r.sampleRate / 1000).toFixed(1) + ' kHz · ' + (r.channels > 1 ? 'estéreo' : 'mono') + (it.trimmed ? ' · se analizaron los primeros 15 min' : '') + '</span></div>' +
          '<div class="row"><button class="btn sm ghost" type="button" data-act="copy">' + KR.icon('copy') + 'Copiar ficha</button>' +
          '<button class="btn sm solid" type="button" data-act="save">' + KR.icon('disc') + (it.saved ? 'Actualizar en catálogo' : 'Guardar en catálogo') + '</button></div></div>' +

          '<div class="readouts">' +
          '<div class="ro"><span class="label">Tempo</span><b class="ro-val">' + (t ? t.bpm : '—') + '</b><span class="ro-unit">BPM</span>' +
          '<small>' + (t ? 'o ' + t.alt + (t.alt > t.bpm ? ' a doble tiempo' : ' a mitad') + ' · confianza ' + conf(t.confidence) : 'Muy corto para medir el tempo') + '</small></div>' +
          '<div class="ro"><span class="label">Tonalidad</span><b class="ro-val">' + (k ? M.camelotStr(k) : '—') + '</b><span class="ro-unit">' + (k ? esc(M.stdName(k)) : '') + '</span>' +
          '<small>' + (k ? esc(M.esName(k)) + ' · confianza ' + conf(k.confidence) : '') + '</small></div>' +
          '<div class="ro"><span class="label">Sonoridad integrada</span><b class="ro-val">' + fmtDb(lufs) + '</b><span class="ro-unit">LUFS</span>' +
          '<span class="meter" role="img" aria-label="' + fmtDb(lufs) + ' LUFS en una escala de −30 a 0"><i style="width:' + lufsPct.toFixed(1) + '%"></i><em style="left:' + ((16 / 30) * 100).toFixed(1) + '%" title="−14 LUFS streaming"></em><em style="left:' + ((21 / 30) * 100).toFixed(1) + '%" title="−9 LUFS club"></em></span>' +
          '<small>Streaming −14 · club −9</small></div>' +
          '<div class="ro"><span class="label">Pico real</span><b class="ro-val">' + fmtDb(tp) + '</b><span class="ro-unit">dBTP</span>' +
          '<small>' + KR.pill(tpMsg, tpTone, tpTone === 'good' ? 'check' : 'warn') + '</small></div>' +
          '</div>' +

          '<section class="panel wave-panel"><div class="panel-head"><h3>Onda y grilla de tiempo</h3><div class="row transport">' +
          '<button class="btn sm" type="button" id="an-play" data-act="play"></button>' +
          '<label class="check"><input type="checkbox" id="an-click"' + (P.click ? ' checked' : '') + '> Clic de metrónomo</label>' +
          '<label class="check"><input type="checkbox" id="an-grid"' + (P.grid ? ' checked' : '') + '> Grilla</label>' +
          '<span class="nudge"><button class="icon-btn sm" type="button" data-act="nudge" data-v="-10" aria-label="Adelantar la grilla 10 ms">−</button><output class="num" id="an-nudge">' + (P.nudge >= 0 ? '+' : '') + P.nudge + ' ms</output><button class="icon-btn sm" type="button" data-act="nudge" data-v="10" aria-label="Atrasar la grilla 10 ms">+</button></span>' +
          '</div></div>' +
          '<canvas class="wave-cv" id="an-wave" aria-label="Forma de onda. Toca para saltar a ese punto."></canvas>' +
          '<div class="wave-foot"><span class="num" id="an-time"></span><span class="hint">Las líneas marcan cada golpe; las fuertes, cada 4. Si el clic no cae justo, muévelo con − y +.</span></div></section>' +

          '<div class="grid-2 an-cols">' +
          '<section class="panel"><div class="panel-head"><h3>Sonoridad</h3><span class="label">a corto plazo (3 s)</span></div><div class="panel-pad stack">' +
          '<div id="an-loud"></div>' +
          '<dl class="facts">' +
          '<div><dt>Rango (LRA)</dt><dd class="num">' + (r.lra != null ? r.lra.toFixed(1) : '—') + ' <small>LU</small></dd></div>' +
          '<div><dt>Máx. corto plazo</dt><dd class="num">' + fmtDb(r.maxShortTerm) + ' <small>LUFS</small></dd></div>' +
          '<div><dt>Pico / sonoridad</dt><dd class="num">' + (isFinite(tp - lufs) ? (tp - lufs).toFixed(1) : '—') + ' <small>dB</small></dd></div>' +
          '<div><dt>Pico de muestra</dt><dd class="num">' + fmtDb(r.peakDb) + ' <small>dBFS</small></dd></div>' +
          '</dl>' +
          (r.clipped > 0 ? '<p class="note warn">' + KR.icon('warn') + '<span><b>' + r.clipped.toLocaleString('es-PE') + ' muestras en 0 dBFS.</b> Hay recorte digital: revisa el limitador del máster.</span></p>' : '') +
          '<ul class="plat">' +
          PLATFORMS.map(function (p) {
            var txt, tone;
            if (p.target == null) { txt = 'No normaliza: suena tal cual'; tone = ''; }
            else {
              var d = p.target - lufs;
              if (d < -0.5) { txt = 'Lo baja ' + Math.abs(d).toFixed(1) + ' dB'; tone = 'amber'; }
              else if (d > 0.5) { txt = 'Queda ' + d.toFixed(1) + ' dB por debajo'; tone = ''; }
              else { txt = 'Casi sin cambios'; tone = 'silver'; }
            }
            return '<li><span class="p-name">' + p.name + '<small class="num">' + (p.target == null ? 'sin normalizar' : p.target + ' LUFS') + '</small></span><span class="p-what"><i class="dot ' + tone + '"></i>' + txt + '</span></li>';
          }).join('') + '</ul>' +
          '<p class="hint">Un máster de club suele ir más fuerte. Lo que importa en streaming es que el pico real quede en −1 dBTP o menos.</p>' +
          '</div></section>' +

          '<section class="panel"><div class="panel-head"><h3>Tonalidad</h3><span class="label">' + (Math.abs(r.tuning) >= 5 ? 'afinación ' + (r.tuning > 0 ? '+' : '−') + Math.abs(Math.round(r.tuning)) + ' cents' : 'afinado a La 440') + '</span></div><div class="panel-pad stack">' +
          (k ? '<div class="key-row"><div class="key-wheel">' + KR.chart.wheel({ active: k, size: 250, sub: M.stdName(k) }) + '</div>' +
            '<div class="key-side"><span class="label">Mezcla bien con</span><ul class="compat">' + M.compatibleKeys(k).slice(1).map(function (c) {
              return '<li><b class="mono">' + M.camelotStr(c.key) + '</b> <span>' + esc(M.stdName(c.key)) + '</span> <small>' + esc(c.why) + '</small></li>';
            }).join('') + '</ul>' +
            '<span class="label">Otras lecturas posibles</span><ul class="compat alt">' + k.candidates.slice(1, 3).map(function (c) {
              var rel = M.transition(k, c).kind === 'relative';
              return '<li><b class="mono">' + M.camelotStr(c) + '</b> <span>' + esc(M.stdName(c)) + '</span> <small>' + (rel ? 'relativa' : '') + '</small></li>';
            }).join('') + '</ul></div></div>' +
            '<div><span class="label">Notas que más suenan</span><div id="an-chroma"></div></div>' : '<p class="muted">No hay suficiente material armónico para estimar la tonalidad.</p>') +
          '</div></section>' +
          '</div>' +

          '<section class="panel"><div class="panel-head"><h3>Balance espectral</h3><span class="label">energía por zona</span></div><div class="panel-pad"><div id="an-bands"></div>' +
          '<p class="hint">Compáralo con un tema de referencia del mismo género: si los graves se comen la mezcla, aquí se nota.</p></div></section>';

        waveEl = $('#an-wave');
        paintTransport(); drawWave(); paintTime();
        KR.chart.line($('#an-loud'), {
          label: 'Sonoridad a corto plazo', height: 170,
          points: r.shortTerm.map(function (p) { return { x: p.t, y: p.l }; }),
          xFormat: function (v) { return KR.fmtDur(v); }, yFormat: function (v) { return fmtDb(v, 0) + (arguments[1] ? '' : ' LUFS'); },
          yMin: Math.min(-30, Math.floor(Math.min.apply(null, r.shortTerm.map(function (p) { return p.l; }).concat([-20])))), yMax: 0,
          refs: [{ y: -14, label: 'Streaming −14' }, { y: lufs, label: 'Integrada ' + fmtDb(lufs), strong: true }],
          areaBase: -60, onClick: function (p) { play(it, Math.max(0, p.x - 3)); }
        });
        if (k) {
          var scale = k.mode === 'min' ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
          var inScale = function (i) { return scale.indexOf((i - k.pc + 12) % 12) >= 0; };
          var names = M.SHARP;
          KR.chart.bars($('#an-chroma'), {
            label: 'Presencia de cada nota', height: 150,
            items: k.chroma.map(function (v, i) { return { label: names[i] + (inScale(i) ? ' · en la escala' : ''), short: names[i], values: [v * 100] }; }),
            yFormat: function (v) { return Math.round(v) + ' %'; },
            dim: function (i) { return !inScale(i); }
          });
        }
        KR.chart.hbars($('#an-bands'), {
          items: r.balance.map(function (b) { var hz = function (v) { return v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : v; }; return { label: b.name, sub: hz(b.from) + '–' + hz(b.to) + ' Hz', value: b.pct }; }),
          format: function (v) { return v.toFixed(1) + ' %'; }, max: 100
        });
      }

      /* eventos */
      input.addEventListener('change', function () { if (input.files.length) addFiles(input.files, repaint); input.value = ''; });
      ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
      ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
      drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files, repaint); });
      ctx.on(window, 'dragover', function (e) { e.preventDefault(); });
      ctx.on(window, 'drop', function (e) { e.preventDefault(); if (e.dataTransfer && e.dataTransfer.files.length && !drop.contains(e.target)) addFiles(e.dataTransfer.files, repaint); });

      el.addEventListener('click', function (e) {
        var pick = e.target.closest('[data-pick]');
        if (pick) { S.sel = pick.getAttribute('data-pick'); repaint(); return; }
        var r = e.target.closest('[data-r]');
        if (r) {
          KR.store.setDoc('settings', { bpmRange: r.getAttribute('data-r') });
          KR.$$('[data-r]', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b === r)); });
          KR.toast('Rango de BPM: ' + RANGES[r.getAttribute('data-r')].label);
          return;
        }
        var b = e.target.closest('[data-act]'); if (!b) return;
        var act = b.getAttribute('data-act');
        var it = S.items.find(function (i) { return i.id === S.sel; });
        if (act === 'demo') {
          var d = makeDemo();
          S.items.push({ id: KR.uid('a'), demo: d, name: d.name, status: 'cola', progress: 0 });
          S.sel = S.items[S.items.length - 1].id;
          repaint(); run(repaint);
        }
        if (act === 'save' && it) { saveToCatalog([it]); paintQueue(); paintDetail(); }
        if (act === 'save-all') { saveToCatalog(S.items.filter(function (i) { return i.status === 'listo'; })); repaint(); }
        if (act === 'copy' && it) KR.copy(summary(it), 'Ficha copiada');
        if (act === 'play' && it) { if (P.playing && P.item === it) { stop(); paintTransport(); } else play(it); }
        if (act === 'nudge') {
          P.nudge = KR.clamp(P.nudge + KR.num(b.getAttribute('data-v')), -200, 200);
          var o = $('#an-nudge'); if (o) o.textContent = (P.nudge >= 0 ? '+' : '') + P.nudge + ' ms';
          P.lastClick = -1; drawWave();
        }
      });
      el.addEventListener('change', function (e) {
        if (e.target.id === 'an-click') { P.click = e.target.checked; P.lastClick = -1; }
        if (e.target.id === 'an-grid') { P.grid = e.target.checked; drawWave(); }
      });
      el.addEventListener('pointerdown', function (e) {
        if (e.target.id !== 'an-wave') return;
        var it = S.items.find(function (i) { return i.id === S.sel; });
        if (!it || !it.result) return;
        var rect = e.target.getBoundingClientRect();
        var at = (e.clientX - rect.left) / rect.width * it.result.duration;
        if (P.playing && P.item === it) play(it, at); else { P.item = it; P.offset = at; drawWave(); paintTime(); }
      });
      ctx.on(window, 'resize', KR.debounce(drawWave, 120));
      ctx.cleanup(function () { stop(); waveEl = null; });

      if (!S.items.length && !S.demoDone) {
        /* primera visita: muestra el analizador funcionando con un loop generado en el navegador */
        S.demoDone = true;
        var d0 = makeDemo();
        S.items.push({ id: KR.uid('a'), demo: d0, name: d0.name, status: 'cola', progress: 0 });
        S.sel = S.items[0].id;
        run(repaint);
      }
      repaint();
    }
  });
})();
