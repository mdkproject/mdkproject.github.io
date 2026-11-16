/* KTRL Room · Afiches
   Toma los datos y el lineup de un evento y arma el afiche en post, historia o cuadrado. Exporta PNG. */
(function () {
  'use strict';
  var KR = window.KR, esc = KR.esc;
  var FREE_KEY = 'kr-afiche-libre';
  var photoCache = {};

  function loadFree() {
    try { return JSON.parse(localStorage.getItem(FREE_KEY) || 'null'); } catch (e) { return null; }
  }
  function saveFree(p) { try { localStorage.setItem(FREE_KEY, JSON.stringify(p)); } catch (e) { /* sin espacio */ } }
  function clock12(min) { return KR.fmtTime(min).replace(/\s?(am|pm)$/, ''); }

  function fromEvent(ev) {
    var prof = KR.store.doc('profile');
    if (!ev) {
      return { title: 'Lattice', tagline: 'Xtended live set', dateText: 'Viernes 22 nov', timeText: '10:00 pm', venue: 'Ubicación secreta', city: 'Tacna', price: 'Preventa S/ 20', organizers: prof.label, handle: '@' + prof.instagram, lineupText: 'MD.KTRL\nRimaycuna\nJota' };
    }
    var times = KR.lineupTimes(ev);
    return {
      title: ev.name, tagline: ev.tagline || '',
      dateText: ev.date ? KR.fmtDate(ev.date, { weekday: true, year: false }) : '',
      timeText: ev.start ? KR.fmtTime(KR.parseTime(ev.start)) : '',
      venue: ev.secret ? 'Ubicación secreta' : (ev.venue || ''), city: ev.city || '',
      price: ev.entry || '', organizers: ev.organizers || prof.label, handle: prof.instagram ? '@' + prof.instagram : '',
      lineupText: times.map(function (t) { return clock12(t.start) + ' ' + t.name + (t.me ? ' *' : ''); }).join('\n')
    };
  }
  function parseLineup(text, prof) {
    return String(text || '').split(/\r?\n/).map(function (line) {
      var s = line.trim(); if (!s) return null;
      var me = /\*\s*$/.test(s); s = s.replace(/\*\s*$/, '').trim();
      var m = /^(\d{1,2}[:.]\d{2})\s+(.+)$/.exec(s), time = '', name = s;
      if (m) { time = m[1].replace('.', ':'); name = m[2]; }
      if (!me && prof && name.toLowerCase().replace(/[^a-z]/g, '') === String(prof.artist || '').toLowerCase().replace(/[^a-z]/g, '')) me = true;
      return { name: name, time: time, me: me };
    }).filter(Boolean);
  }

  KR.view('afiches', {
    title: 'Afiches', icon: 'poster',
    render: function (el, arg, ctx) {
      var events = KR.store.list('events');
      var ev = arg && arg !== 'libre' ? KR.store.get('events', arg) : null;
      if (!arg && events.length) {
        var future = events.filter(function (e) { return e.date && KR.daysUntil(e.date) >= 0; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
        ev = future[0] || null;
      }
      var prof = KR.store.doc('profile');
      var cfg = Object.assign({ style: 'dye', format: 'post', tint: 'amber', logo: true, showTimes: true, seed: 11, overrides: {} }, ev ? (ev.poster || {}) : (loadFree() || {}));
      cfg.overrides = cfg.overrides || {};
      var photo = ev ? photoCache[ev.id] : photoCache.libre;

      function texts() { return Object.assign(fromEvent(ev), cfg.overrides); }
      function persist() {
        if (ev) { var cur = KR.store.get('events', ev.id); if (cur) KR.store.put('events', Object.assign({}, cur, { poster: cfg }), { silent: true }); }
        else saveFree(cfg);
      }
      var persistSoon = KR.debounce(persist, 400);

      var opt = function (o) { return '<option value="' + o.value + '"' + (o.sel ? ' selected' : '') + '>' + esc(o.label) + '</option>'; };
      var t0 = texts();
      el.innerHTML = KR.head({
        title: 'Afiches',
        lead: 'Elige un evento y un estilo: el título, la fecha y el lineup salen solos. Todo se puede retocar antes de descargar.'
      }) +
        '<div class="poster-layout">' +
        '<form class="poster-controls stack" id="pc" autocomplete="off">' +
        '<div class="panel panel-pad stack">' +
        '<div class="field"><label for="p-ev">Evento</label><select class="field-in" id="p-ev">' + opt({ value: '', label: 'Afiche libre', sel: !ev }) +
        events.map(function (e) { return opt({ value: e.id, label: e.name + (e.date ? ' · ' + KR.fmtDate(e.date) : ''), sel: ev && ev.id === e.id }); }).join('') + '</select></div>' +
        '<div class="field"><span class="flabel">Formato</span><div class="seg" id="p-format">' + Object.keys(KR.poster.FORMATS).map(function (k) { return '<button type="button" data-format="' + k + '" aria-pressed="' + (cfg.format === k) + '">' + KR.poster.FORMATS[k].label + '</button>'; }).join('') + '</div></div>' +
        '<div class="field"><span class="flabel">Estilo</span><div class="seg" id="p-style">' + Object.keys(KR.poster.STYLES).map(function (k) { return '<button type="button" data-style="' + k + '" aria-pressed="' + (cfg.style === k) + '">' + KR.poster.STYLES[k].label + '</button>'; }).join('') + '</div></div>' +
        '<div class="field"><span class="flabel">Tinte</span><div class="seg" id="p-tint">' + Object.keys(KR.poster.TINTS).map(function (k) { return '<button type="button" data-tint="' + k + '" aria-pressed="' + (cfg.tint === k) + '"><i class="tint-dot" style="background:' + KR.poster.TINTS[k].accent + '"></i>' + KR.poster.TINTS[k].label + '</button>'; }).join('') + '</div></div>' +
        '<div class="row"><label class="check"><input type="checkbox" id="p-logo"' + (cfg.logo ? ' checked' : '') + '> Glifo MD KTRL</label><label class="check"><input type="checkbox" id="p-times"' + (cfg.showTimes ? ' checked' : '') + '> Horarios en el lineup</label>' +
        '<button class="btn sm ghost" type="button" data-act="reroll">' + KR.icon('shuffle') + 'Otro teñido</button></div>' +
        '</div>' +
        '<div class="panel panel-pad form-grid" id="p-texts">' +
        KR.field({ id: 'p-title', name: 'title', label: 'Título', value: t0.title, cls: 'full' }) +
        KR.field({ id: 'p-tagline', name: 'tagline', label: 'Bajada', value: t0.tagline, cls: 'full' }) +
        KR.field({ id: 'p-date', name: 'dateText', label: 'Fecha', value: t0.dateText }) +
        KR.field({ id: 'p-time', name: 'timeText', label: 'Hora', value: t0.timeText }) +
        KR.field({ id: 'p-venue', name: 'venue', label: 'Lugar', value: t0.venue }) +
        KR.field({ id: 'p-city', name: 'city', label: 'Ciudad', value: t0.city }) +
        KR.field({ id: 'p-price', name: 'price', label: 'Entrada', value: t0.price }) +
        KR.field({ id: 'p-org', name: 'organizers', label: 'Organiza', value: t0.organizers }) +
        KR.field({ id: 'p-handle', name: 'handle', label: 'Usuario de Instagram', value: t0.handle, cls: 'full' }) +
        KR.field({ id: 'p-lineup', name: 'lineupText', label: 'Lineup (uno por línea, "8:00 Artista"; * marca tu set)', type: 'textarea', value: t0.lineupText, cls: 'full', rows: 6 }) +
        '<div class="row full"><button class="btn sm ghost" type="button" data-act="reset">Volver a los datos del evento</button></div>' +
        '</div>' +
        '<div class="panel panel-pad stack"><div class="field"><label for="p-photo">Foto de fondo (estilo Foto)</label><input class="field-in" type="file" id="p-photo" accept="image/*"></div>' +
        '<div class="field"><label for="p-dim">Oscurecer la foto</label><input type="range" id="p-dim" min="0" max="1" step="0.05" value="' + (cfg.photoDim == null ? 0.5 : cfg.photoDim) + '"></div>' +
        '<p class="hint">La foto se queda en tu equipo y no se guarda: si recargas, vuelve a elegirla.</p></div>' +
        '</form>' +
        '<div class="poster-stage"><div class="poster-frame" id="p-frame"><canvas id="p-canvas" aria-label="Vista previa del afiche"></canvas></div>' +
        '<div class="row poster-actions"><button class="btn solid" type="button" data-act="png">' + KR.icon('download') + 'Descargar PNG</button>' +
        '<button class="btn" type="button" data-act="share" id="p-share" hidden>' + KR.icon('share') + 'Compartir</button>' +
        '<button class="btn ghost" type="button" data-act="copy-caption">' + KR.icon('copy') + 'Copiar texto para el post</button></div>' +
        '<p class="hint" id="p-size"></p></div></div>';

      var $ = function (s) { return KR.$(s, el); };
      var canvas = $('#p-canvas');
      function spec() {
        var t = texts();
        return {
          style: cfg.style, format: cfg.format, tint: cfg.tint, logo: cfg.logo, showTimes: cfg.showTimes, seed: cfg.seed,
          title: t.title, tagline: t.tagline, dateText: t.dateText, timeText: t.timeText, venue: t.venue, city: t.city,
          price: t.price, organizers: t.organizers, handle: t.handle, lineup: parseLineup(t.lineupText, prof),
          photo: photo || null, photoDim: cfg.photoDim == null ? 0.5 : cfg.photoDim
        };
      }
      var drawSoon = KR.debounce(draw, 60);
      function draw() {
        KR.poster.render(canvas, spec());
        var f = KR.poster.FORMATS[cfg.format];
        $('#p-size').textContent = f.label + ' · ' + f.w + ' × ' + f.h + ' px';
        $('#p-frame').style.aspectRatio = f.w + ' / ' + f.h;
      }
      KR.poster.loadFonts().then(draw);
      draw();

      $('#p-ev').addEventListener('change', function (e) { KR.go(e.target.value ? 'afiches-' + e.target.value : 'afiches-libre'); });
      $('#p-texts').addEventListener('input', function (e) {
        if (!e.target.name) return;
        cfg.overrides[e.target.name] = e.target.value;
        drawSoon(); persistSoon();
      });
      el.addEventListener('click', function (e) {
        var b;
        if ((b = e.target.closest('[data-format]'))) { cfg.format = b.getAttribute('data-format'); mark('[data-format]', b); draw(); persistSoon(); return; }
        if ((b = e.target.closest('[data-style]'))) { cfg.style = b.getAttribute('data-style'); mark('[data-style]', b); if (cfg.style === 'timetable' && cfg.format === 'post') { cfg.format = 'story'; mark('[data-format]', el.querySelector('[data-format="story"]')); } draw(); persistSoon(); return; }
        if ((b = e.target.closest('[data-tint]'))) { cfg.tint = b.getAttribute('data-tint'); mark('[data-tint]', b); draw(); persistSoon(); return; }
        var a = e.target.closest('[data-act]'); if (!a) return;
        var act = a.getAttribute('data-act');
        if (act === 'reroll') { cfg.seed = Math.floor(Math.random() * 9000) + 12; draw(); persistSoon(); }
        if (act === 'reset') {
          cfg.overrides = {};
          var t = texts();
          KR.$$('#p-texts [name]', el).forEach(function (inp) { inp.value = t[inp.name] || ''; });
          draw(); persistSoon();
        }
        if (act === 'png') {
          canvas.toBlob(function (blob) {
            KR.saveFile('afiche-' + KR.slug(texts().title) + '-' + cfg.format + '.png', blob, 'image/png');
          }, 'image/png');
        }
        if (act === 'share') {
          canvas.toBlob(function (blob) {
            var file = new File([blob], 'afiche-' + KR.slug(texts().title) + '.png', { type: 'image/png' });
            navigator.share({ files: [file], title: texts().title, text: caption() }).catch(function () { /* cancelado */ });
          }, 'image/png');
        }
        if (act === 'copy-caption') KR.copy(caption(), 'Texto copiado');
      });
      function mark(sel, on) { KR.$$(sel, el).forEach(function (x) { x.setAttribute('aria-pressed', String(x === on)); }); }
      function caption() {
        var t = texts(), lu = parseLineup(t.lineupText, prof);
        var lines = [(t.title || '').toUpperCase() + (t.tagline ? ' · ' + t.tagline : ''), [t.dateText, t.timeText].filter(Boolean).join(' · '), [t.venue, t.city].filter(Boolean).join(' · '), ''];
        lu.forEach(function (r) { lines.push((r.time ? r.time + ' ' : '') + r.name); });
        if (t.price) lines.push('', t.price);
        lines.push('', [t.organizers, t.handle].filter(Boolean).join(' · '));
        return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
      }
      $('#p-logo').addEventListener('change', function (e) { cfg.logo = e.target.checked; draw(); persistSoon(); });
      $('#p-times').addEventListener('change', function (e) { cfg.showTimes = e.target.checked; draw(); persistSoon(); });
      $('#p-dim').addEventListener('input', function (e) { cfg.photoDim = +e.target.value; drawSoon(); persistSoon(); });
      $('#p-photo').addEventListener('change', function (e) {
        var f = e.target.files[0]; if (!f) return;
        var img = new Image();
        img.onload = function () {
          photo = img; photoCache[ev ? ev.id : 'libre'] = img;
          if (cfg.style !== 'photo') { cfg.style = 'photo'; mark('[data-style]', el.querySelector('[data-style="photo"]')); }
          draw();
        };
        img.src = URL.createObjectURL(f);
      });
      try {
        var probe = new File([new Blob(['x'])], 'x.png', { type: 'image/png' });
        if (!KR.inClaude && navigator.canShare && navigator.canShare({ files: [probe] })) $('#p-share').hidden = false;
      } catch (e) { /* sin compartir */ }
      ctx.cleanup(persist);
    }
  });
})();
