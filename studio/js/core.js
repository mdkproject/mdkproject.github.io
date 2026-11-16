/* KTRL Room · núcleo
   Utilidades, datos (local + nube cuando corre dentro de Claude), rutas por hash y piezas de interfaz compartidas.
   Sin dependencias: cada módulo en js/views registra su vista con KR.view(). */
(function () {
  'use strict';
  var KR = window.KR = window.KR || {};

  /* ---------- utilidades ---------- */
  KR.$ = function (sel, root) { return (root || document).querySelector(sel); };
  KR.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  KR.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  KR.uid = function (p) { return (p || 'x') + Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 7); };
  KR.clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  KR.num = function (v, d) {
    if (typeof v === 'number') return isFinite(v) ? v : (d == null ? 0 : d);
    var n = parseFloat(String(v == null ? '' : v).replace(',', '.'));
    return isFinite(n) ? n : (d == null ? 0 : d);
  };
  KR.debounce = function (fn, ms) {
    var t; return function () { var a = arguments, self = this; clearTimeout(t); t = setTimeout(function () { fn.apply(self, a); }, ms); };
  };
  KR.clone = function (o) { return o == null ? o : JSON.parse(JSON.stringify(o)); };
  KR.slug = function (s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'archivo';
  };
  KR.plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : many); };
  KR.sum = function (arr, f) { return arr.reduce(function (a, x) { return a + (f ? f(x) : x); }, 0); };

  /* ---------- fechas (siempre locales, sin corrimientos de zona horaria) ---------- */
  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var MES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  KR.MES = MES; KR.MES_L = MES_L; KR.DIA = DIA;
  KR.pad = function (n) { return (n < 10 ? '0' : '') + n; };
  KR.iso = function (d) { return d.getFullYear() + '-' + KR.pad(d.getMonth() + 1) + '-' + KR.pad(d.getDate()); };
  KR.today = function () { return KR.iso(new Date()); };
  KR.parseDate = function (s) {
    if (!s) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  KR.addDays = function (s, n) { var d = KR.parseDate(s) || new Date(); d.setDate(d.getDate() + n); return KR.iso(d); };
  KR.daysUntil = function (s) {
    var d = KR.parseDate(s); if (!d) return null;
    var t = KR.parseDate(KR.today());
    return Math.round((d - t) / 864e5);
  };
  KR.fmtDate = function (s, o) {
    o = o || {};
    var d = KR.parseDate(s); if (!d) return o.empty || 'Sin fecha';
    var out = d.getDate() + ' ' + MES[d.getMonth()];
    if (o.weekday) out = DIA[d.getDay()] + ' ' + out;
    if (o.year !== false && (o.year || d.getFullYear() !== new Date().getFullYear())) out += ' ' + d.getFullYear();
    return out;
  };
  KR.fmtDateLong = function (s) {
    var d = KR.parseDate(s); if (!d) return '';
    return d.getDate() + ' de ' + MES_L[d.getMonth()] + ' de ' + d.getFullYear();
  };
  KR.relDays = function (s) {
    var n = KR.daysUntil(s); if (n == null) return '';
    if (n === 0) return 'hoy';
    if (n === 1) return 'mañana';
    if (n === -1) return 'ayer';
    if (n > 0) return n < 60 ? 'en ' + n + ' días' : 'en ' + Math.round(n / 30) + ' meses';
    return -n < 60 ? 'hace ' + -n + ' días' : 'hace ' + Math.round(-n / 30) + ' meses';
  };
  KR.fmtTime = function (min) { /* minutos desde las 00:00 -> "8:00 pm" */
    if (min == null || !isFinite(min)) return '';
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    var h = Math.floor(min / 60), m = min % 60, ap = h >= 12 ? 'pm' : 'am';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + KR.pad(m) + ' ' + ap;
  };
  KR.fmtClock = function (min) { /* "20:00" */
    if (min == null || !isFinite(min)) return '';
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    return Math.floor(min / 60) + ':' + KR.pad(min % 60);
  };
  KR.parseTime = function (s) {
    if (!s) return null;
    var m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?m\.?|p\.?m\.?)?$/i.exec(String(s).trim());
    if (!m) return null;
    var h = +m[1], mi = +(m[2] || 0), ap = (m[3] || '').toLowerCase().replace(/\./g, '');
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    return h * 60 + mi;
  };
  KR.fmtDur = function (sec) {
    if (!isFinite(sec)) return '0:00';
    sec = Math.max(0, Math.round(sec));
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return (h ? h + ':' + KR.pad(m) : m) + ':' + KR.pad(s);
  };

  /* ---------- dinero ---------- */
  var CUR = { PEN: { sym: 'S/', locale: 'es-PE' }, USD: { sym: 'US$', locale: 'es-PE' } };
  KR.CUR = CUR;
  KR.fmtMoney = function (n, cur, o) {
    o = o || {};
    if (n == null || n === '' || !isFinite(+n)) return o.empty || '—';
    var c = CUR[cur] || CUR.PEN;
    var dec = o.decimals != null ? o.decimals : (Math.round(+n) === +n ? 0 : 2);
    var s = Number(+n).toLocaleString('es-PE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return c.sym + ' ' + s;
  };
  KR.money = function (n) { return KR.fmtMoney(n, KR.store ? KR.store.doc('settings').currency : 'PEN'); };

  /* ---------- íconos (trazo 1.75, 24 px) ---------- */
  var ICONS = {
    home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
    calendar: 'M4 6h16v14H4z M4 10h16 M8 3v5 M16 3v5',
    disc: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z',
    wave: 'M3 12h3l2-5 3 10 3-14 3 12 2-3h2',
    doc: 'M6 3h8l4 4v14H6z M14 3v4h4 M9 12h6 M9 16h6',
    split: 'M12 3v9h9 M20.5 15A9 9 0 1 1 9 3.5',
    headphones: 'M4 15v-3a8 8 0 0 1 16 0v3 M4 15h3v5H4z M17 15h3v5h-3z',
    metronome: 'M9 3h6l3.5 18h-13z M12 16l5-9 M7.8 15h8.4',
    ticket: 'M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z M14 7v2 M14 11v2 M14 15v2',
    poster: 'M5 3h14v18H5z M5 15l4-4 4 4 2-2 4 4 M14.5 8.5h.01',
    chat: 'M4 5h16v11H9l-5 4z M8 9h8 M8 12h5',
    faders: 'M6 3v18 M12 3v18 M18 3v18 M3.5 8h5 M9.5 15h5 M15.5 10h5',
    plus: 'M12 5v14 M5 12h14',
    trash: 'M5 7h14 M10 7V4h4v3 M7 7l1 13h8l1-13',
    download: 'M12 4v11 M7 10l5 5 5-5 M5 20h14',
    upload: 'M12 20V9 M7 14l5-5 5 5 M5 4h14',
    copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
    search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4',
    x: 'M6 6l12 12 M18 6L6 18',
    check: 'M5 12l5 5 9-10',
    edit: 'M4 20h4L19 9l-4-4L4 16z M13 7l4 4',
    send: 'M4 12l16-8-6 16-3-7z M11 13l9-9',
    sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z',
    menu: 'M4 7h16 M4 12h16 M4 17h16',
    arrow: 'M5 12h14 M13 6l6 6-6 6',
    back: 'M15 5l-7 7 7 7',
    external: 'M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6',
    cloud: 'M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.1 9.6 4.2 4.2 0 0 0 7 18z',
    device: 'M7 3h10v18H7z M11 18h2',
    warn: 'M12 4l9 16H3z M12 10v4 M12 17h.01',
    shuffle: 'M4 7h4l8 10h4 M4 17h4l2.5-3 M13.5 10L16 7h4 M18 5l2 2-2 2 M18 15l2 2-2 2',
    note: 'M9 18V6l10-2v12 M9 18a3 3 0 1 1-6 0a3 3 0 1 1 6 0 M19 16a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
    grip: 'M9 6h.01 M15 6h.01 M9 12h.01 M15 12h.01 M9 18h.01 M15 18h.01',
    share: 'M12 3v12 M7 8l5-5 5 5 M5 13v8h14v-8',
    money: 'M3 7h18v10H3z M12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z M6 10v.01 M18 14v.01',
    user: 'M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M4 21a8 8 0 0 1 16 0',
    clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2',
    pin: 'M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z M12 6.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z',
    board: 'M4 4h4v16H4z M10 4h4v10h-4z M16 4h4v13h-4z',
    list: 'M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01',
    play: 'M8 5v14l11-7z',
    pause: 'M7 5h3v14H7z M14 5h3v14h-3z',
    stop: 'M6 6h12v12H6z',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    rocket: 'M12 15l-3-3c1-4 4-8 10-8 0 6-4 9-8 10z M9 12l-4 1 2-4h3 M12 15l-1 4 4-2v-3 M5 19c0-2 1-3 3-3',
    eq: 'M4 20v-6 M4 10V4 M12 20v-9 M12 7V4 M20 20v-4 M20 12V4 M2 14h4 M10 7h4 M18 16h4'
  };
  KR.ICONS = ICONS;
  KR.icon = function (name, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#ic-' + name + '"/></svg>';
  };
  function injectSprite() {
    if (document.getElementById('kr-sprite')) return;
    var filled = { play: 1, pause: 1, stop: 1 };
    var out = '<svg id="kr-sprite" width="0" height="0" style="position:absolute" aria-hidden="true">';
    Object.keys(ICONS).forEach(function (k) {
      out += '<symbol id="ic-' + k + '" viewBox="0 0 24 24"><path d="' + ICONS[k] + '"' +
        (filled[k] ? ' fill="currentColor" stroke="none"' : ' fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"') +
        '/></symbol>';
    });
    out += '<symbol id="ic-logo" viewBox="0 0 ' + KR.LOGO.w + ' ' + KR.LOGO.h + '"><path fill="currentColor" d="' + KR.LOGO.d + '"/></symbol>';
    out += '</svg>';
    document.body.insertAdjacentHTML('afterbegin', out);
  }
  KR.logoSvg = function (cls) {
    return '<svg class="' + (cls || 'glyph') + '" viewBox="0 0 ' + KR.LOGO.w + ' ' + KR.LOGO.h + '" aria-hidden="true" focusable="false"><use href="#ic-logo"/></svg>';
  };

  /* ---------- capacidades de Claude (solo existen cuando la página corre como Artifact) ---------- */
  var capCache = {};
  KR.inClaude = !!(window.claude && typeof window.claude.use === 'function');
  KR.cap = function (name) {
    if (!KR.inClaude) return Promise.resolve(null);
    if (!capCache[name]) {
      capCache[name] = Promise.resolve().then(function () { return window.claude.use(name); })
        .catch(function () { return null; });
    }
    return capCache[name];
  };

  /* ---------- datos ---------- */
  var KEY = 'ktrl-room/v1';
  var COLS = ['deals', 'beats', 'events', 'sets', 'splits', 'licenses', 'textos', 'releases'];
  var DOCS = ['profile', 'settings'];
  KR.COLS = COLS; KR.DOCS = DOCS;

  function defaults() {
    var s = {
      v: 1,
      profile: {
        artist: 'MD KTRL', name: 'Marcelo López', alias: 'Bness', label: 'Lattice Rekords',
        city: 'Tacna, Perú', dni: '', phone: '+51 944 310 246', email: 'mdkrvzy@gmail.com',
        web: 'https://mdkproject.github.io', instagram: 'm1ndktrl', beatsUrl: 'https://soundcloud.com/boness6',
        genres: 'Hip hop, trap y música electrónica'
      },
      settings: {
        currency: 'PEN', theme: 'system', keyNotation: 'camelot',
        licenseSeq: 0,
        prices: { basic: 80, exclusive: 400, stems: 150 },
        pricesAreExample: true,
        pubShare: 50,
        promo3x2: true,
        payMethods: ['Yape', 'Plin', 'Transferencia', 'Efectivo', 'Donación', 'Juguetes para niños', 'Comida para albergues'],
        bpmRange: 'auto'
      },
      meta: { createdAt: Date.now() }
    };
    COLS.forEach(function (c) { s[c] = []; });
    return s;
  }
  KR.defaults = defaults;

  var listeners = [];
  var saveWarned = false;
  var store = KR.store = {
    state: null,
    init: function () {
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { saved = null; }
      if (saved && saved.v === 1) {
        this.state = merge(defaults(), saved);
      } else {
        this.state = defaults();
        if (KR.seed) KR.seed(this.state);
        this.state.meta.seeded = true;
        this.persistNow();
      }
    },
    persistNow: function () {
      try { localStorage.setItem(KEY, JSON.stringify(this.state)); }
      catch (e) {
        if (!saveWarned) { saveWarned = true; KR.toast('No se pudo guardar en este navegador. Exporta un respaldo desde Ajustes.', { tone: 'bad' }); }
      }
    },
    list: function (col) { return (this.state && this.state[col]) || []; },
    get: function (col, id) {
      var a = this.list(col);
      for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
      return null;
    },
    put: function (col, item, o) {
      o = o || {};
      var arr = this.state[col], now = Date.now();
      var next = Object.assign({}, item);
      if (!next.id) next.id = KR.uid(col.charAt(0));
      if (!next.createdAt) next.createdAt = now;
      if (o.source !== 'cloud') next.updatedAt = now;
      var i = -1;
      for (var k = 0; k < arr.length; k++) if (arr[k].id === next.id) { i = k; break; }
      if (i >= 0) arr[i] = next; else arr.push(next);
      this.persist();
      if (o.source !== 'cloud' && KR.cloud) KR.cloud.push(col, next);
      if (!o.silent) this.emit({ col: col, id: next.id, type: i >= 0 ? 'update' : 'add', source: o.source || 'local' });
      return next;
    },
    remove: function (col, id, o) {
      o = o || {};
      var arr = this.state[col];
      var i = arr.findIndex(function (x) { return x.id === id; });
      if (i < 0) return null;
      var gone = arr.splice(i, 1)[0];
      this.persist();
      if (o.source !== 'cloud' && KR.cloud) KR.cloud.drop(col, id);
      if (!o.silent) this.emit({ col: col, id: id, type: 'remove', source: o.source || 'local', item: gone });
      return gone;
    },
    doc: function (name) { return this.state[name]; },
    setDoc: function (name, patch, o) {
      o = o || {};
      this.state[name] = Object.assign({}, this.state[name], patch);
      if (o.source !== 'cloud') this.state[name].updatedAt = Date.now();
      this.persist();
      if (o.source !== 'cloud' && KR.cloud) KR.cloud.pushDoc(name, this.state[name]);
      if (!o.silent) this.emit({ col: name, type: 'doc', source: o.source || 'local' });
    },
    on: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; },
    emit: function (ev) { listeners.slice().forEach(function (fn) { try { fn(ev); } catch (e) { console.error(e); } }); },
    exportData: function () {
      var data = {};
      DOCS.concat(COLS).forEach(function (k) { data[k] = store.state[k]; });
      return { app: 'ktrl-room', v: 1, exportedAt: new Date().toISOString(), data: data };
    },
    importData: function (obj) {
      if (!obj || obj.app !== 'ktrl-room' || !obj.data) throw new Error('Este archivo no es un respaldo de KTRL Room.');
      var fresh = defaults();
      DOCS.forEach(function (k) { if (obj.data[k]) fresh[k] = Object.assign(fresh[k], obj.data[k]); });
      COLS.forEach(function (k) { if (Array.isArray(obj.data[k])) fresh[k] = obj.data[k]; });
      fresh.meta = Object.assign({}, this.state.meta, { importedAt: Date.now() });
      this.state = fresh;
      this.persistNow();
      if (KR.cloud) KR.cloud.pushAll();
      this.emit({ type: 'reset', source: 'local' });
    },
    reset: function (withSeed) {
      var fresh = defaults();
      if (withSeed && KR.seed) KR.seed(fresh);
      this.state = fresh;
      this.persistNow();
      if (KR.cloud) KR.cloud.pushAll(true);
      this.emit({ type: 'reset', source: 'local' });
    }
  };
  store.persist = KR.debounce(function () { store.persistNow(); }, 250);
  function merge(base, saved) {
    Object.keys(saved).forEach(function (k) {
      if (DOCS.indexOf(k) >= 0 || k === 'meta') base[k] = Object.assign(base[k] || {}, saved[k]);
      else base[k] = saved[k];
    });
    if (base.settings && saved.settings && saved.settings.prices) base.settings.prices = Object.assign({}, defaults().settings.prices, saved.settings.prices);
    return base;
  }

  /* ---------- nube: base de datos del Artifact (solo dentro de Claude) ----------
     Colecciones con un documento por registro; perfil y ajustes en meta/profile y meta/settings.
     La primera vez: si la nube está vacía se sube lo local; si no, manda la nube (y se guarda una copia local). */
  var cloud = KR.cloud = {
    db: null, status: 'local', unsubs: [], queues: {}, timers: {},
    statusText: function () {
      return {
        local: 'Guardado en este dispositivo',
        connecting: 'Conectando con tu cuenta…',
        on: 'Sincronizado con tu cuenta de Claude',
        error: 'Sin conexión con la nube; se guarda aquí'
      }[this.status];
    },
    setStatus: function (s) {
      this.status = s;
      store.emit({ type: 'sync', source: 'cloud' });
    },
    start: function () {
      var self = this;
      if (!KR.inClaude) return;
      self.setStatus('connecting');
      KR.cap('db').then(function (db) {
        if (!db) { self.setStatus('local'); return; }
        self.db = db;
        var timer = setTimeout(function () { if (self.status === 'connecting') self.setStatus('error'); }, 10000);
        var gets = COLS.map(function (c) { return db.collection(c).get(); });
        gets.push(db.collection('meta').get());
        return Promise.all(gets).then(function (snaps) {
          clearTimeout(timer);
          var empty = snaps.every(function (s) { return s.empty; });
          if (empty) {
            return self.pushAll().then(function () { self.subscribe(); });
          }
          try { localStorage.setItem(KEY + '/antes-de-sincronizar', JSON.stringify(store.state)); } catch (e) { /* sin espacio */ }
          COLS.forEach(function (c, i) {
            store.state[c] = snaps[i].docs.map(function (d) { return Object.assign({}, d.data(), { id: d.id }); });
          });
          snaps[COLS.length].docs.forEach(function (d) {
            if (DOCS.indexOf(d.id) >= 0) store.state[d.id] = Object.assign({}, defaults()[d.id], d.data());
          });
          store.persistNow();
          store.emit({ type: 'reset', source: 'cloud' });
          self.subscribe();
        });
      }).catch(function (e) {
        console.warn('KTRL Room: nube no disponible', e);
        self.setStatus('error');
      });
    },
    subscribe: function () {
      var self = this, db = self.db;
      self.setStatus('on');
      COLS.forEach(function (col) {
        self.unsubs.push(db.collection(col).onSnapshot(function (snap) {
          var changed = false;
          snap.docChanges().forEach(function (ch) {
            var id = ch.doc.id;
            if (ch.type === 'removed') {
              if (store.get(col, id)) { store.remove(col, id, { source: 'cloud', silent: true }); changed = true; }
              return;
            }
            var incoming = Object.assign({}, ch.doc.data(), { id: id });
            var mine = store.get(col, id);
            if (mine && (mine.updatedAt || 0) >= (incoming.updatedAt || 0)) return;
            store.put(col, incoming, { source: 'cloud', silent: true });
            changed = true;
          });
          if (changed) store.emit({ col: col, type: 'remote', source: 'cloud' });
        }, function (e) { console.warn('KTRL Room: escucha terminada', e); self.setStatus('error'); }));
      });
      self.unsubs.push(db.collection('meta').onSnapshot(function (snap) {
        snap.docChanges().forEach(function (ch) {
          if (ch.type === 'removed' || DOCS.indexOf(ch.doc.id) < 0) return;
          var inc = ch.doc.data();
          var mine = store.doc(ch.doc.id) || {};
          if ((mine.updatedAt || 0) >= (inc.updatedAt || 0)) return;
          store.setDoc(ch.doc.id, inc, { source: 'cloud' });
        });
      }, function () { self.setStatus('error'); }));
    },
    write: function (key, fn) {
      /* una escritura a la vez por documento */
      var self = this;
      var prev = self.queues[key] || Promise.resolve();
      var next = prev.then(fn).catch(function (e) {
        console.warn('KTRL Room: no se pudo guardar en la nube', key, e);
        if (e && e.code === 'quota_exceeded') KR.toast('La nube está llena. Borra registros viejos o exporta un respaldo.', { tone: 'bad' });
        else if (e && e.code === 'unavailable') return new Promise(function (r) { setTimeout(r, 800 + Math.random() * 800); }).then(fn).catch(function () {});
      });
      self.queues[key] = next;
      return next;
    },
    push: function (col, item) {
      var self = this; if (!self.db || self.status !== 'on') return;
      var key = col + '/' + item.id;
      clearTimeout(self.timers[key]);
      self.timers[key] = setTimeout(function () {
        var latest = store.get(col, item.id);
        if (!latest) return;
        self.write(key, function () { return self.db.collection(col).doc(item.id).set(KR.clone(latest)); });
      }, 400);
    },
    drop: function (col, id) {
      var self = this; if (!self.db || self.status !== 'on') return;
      var key = col + '/' + id;
      clearTimeout(self.timers[key]);
      self.write(key, function () { return self.db.collection(col).doc(id).delete(); });
    },
    pushDoc: function (name, obj) {
      var self = this; if (!self.db || self.status !== 'on') return;
      var key = 'meta/' + name;
      clearTimeout(self.timers[key]);
      self.timers[key] = setTimeout(function () {
        self.write(key, function () { return self.db.collection('meta').doc(name).set(KR.clone(store.doc(name))); });
      }, 400);
    },
    pushAll: function (wipe) {
      var self = this; if (!self.db) return Promise.resolve();
      var jobs = [];
      var db = self.db;
      var chain = Promise.resolve();
      if (wipe) {
        chain = Promise.all(COLS.map(function (c) { return db.collection(c).get(); })).then(function (snaps) {
          return snaps.reduce(function (p, s, i) {
            return s.docs.reduce(function (pp, d) {
              if (store.get(COLS[i], d.id)) return pp;
              return pp.then(function () { return db.collection(COLS[i]).doc(d.id).delete(); });
            }, p);
          }, Promise.resolve());
        });
      }
      COLS.forEach(function (c) { store.list(c).forEach(function (it) { jobs.push([c, it]); }); });
      DOCS.forEach(function (d) { jobs.push(['meta', Object.assign({ id: d }, store.doc(d))]); });
      /* de a pocos para no pasar el límite de escrituras */
      return chain.then(function () {
        var i = 0;
        function next() {
          if (i >= jobs.length) return Promise.resolve();
          var batch = jobs.slice(i, i + 6); i += 6;
          return Promise.all(batch.map(function (j) {
            var body = KR.clone(j[1]);
            if (j[0] === 'meta') delete body.id;
            return db.collection(j[0]).doc(j[1].id).set(body).catch(function (e) { console.warn(e); });
          })).then(next);
        }
        return next();
      });
    }
  };

  /* ---------- archivos y portapapeles ---------- */
  KR.saveFile = function (filename, data, mime) {
    return KR.cap('downloads').then(function (dl) {
      if (dl) {
        return dl.save({ filename: filename, data: data }).then(function () {
          KR.toast('Archivo guardado: ' + filename);
          return true;
        }, function (e) {
          if (e && e.code === 'declined') return false;
          if (e && e.code === 'rate_limited') { KR.toast('Ya hay una descarga esperando tu confirmación.'); return false; }
          KR.toast('No se pudo guardar el archivo (' + ((e && e.code) || 'error') + ').', { tone: 'bad' });
          return false;
        });
      }
      var blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      KR.toast('Descargado: ' + filename);
      return true;
    });
  };
  KR.copy = function (text, okMsg) {
    var done = function () { KR.toast(okMsg || 'Copiado al portapapeles'); return true; };
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      if (ok) return done();
      KR.dialog({ title: 'Copia este texto', body: '<textarea class="field-in mono" rows="8" readonly id="dlg-copy">' + KR.esc(text) + '</textarea>', ok: 'Listo', cancel: null })
        .then(function () {});
      setTimeout(function () { var t = document.getElementById('dlg-copy'); if (t) t.select(); }, 30);
      return false;
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(done, fallback);
      }
    } catch (e) { /* sigue con el respaldo */ }
    return Promise.resolve(fallback());
  };
  KR.readFile = function (file, as) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
      if (as === 'text') r.readAsText(file); else if (as === 'url') r.readAsDataURL(file); else r.readAsArrayBuffer(file);
    });
  };
  KR.waLink = function (phone, text) {
    var digits = String(phone || '').replace(/\D/g, '');
    return 'https://wa.me/' + digits + (text ? '?text=' + encodeURIComponent(text) : '');
  };

  /* ---------- avisos ---------- */
  KR.toast = function (msg, o) {
    o = o || {};
    var box = document.getElementById('toasts');
    if (!box) return;
    var el = document.createElement('div');
    el.className = 'toast' + (o.tone ? ' ' + o.tone : '');
    el.innerHTML = '<span>' + KR.esc(msg) + '</span>' + (o.action ? '<button type="button">' + KR.esc(o.action) + '</button>' : '');
    box.appendChild(el);
    var gone = function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 260); };
    if (o.action) el.querySelector('button').addEventListener('click', function () { o.onAction && o.onAction(); gone(); });
    setTimeout(gone, o.ms || (o.action ? 6000 : 2600));
  };

  /* ---------- diálogo propio (confirm/alert no funcionan dentro de Claude) ---------- */
  KR.dialog = function (o) {
    return new Promise(function (resolve) {
      var d = document.createElement('dialog');
      d.className = 'dlg' + (o.wide ? ' wide' : '');
      d.innerHTML =
        '<form method="dialog" class="dlg-in">' +
        '<header class="dlg-head"><h2>' + KR.esc(o.title || '') + '</h2>' +
        '<button type="button" class="icon-btn" data-x aria-label="Cerrar">' + KR.icon('x') + '</button></header>' +
        '<div class="dlg-body">' + (o.body || '') + '</div>' +
        '<footer class="dlg-foot">' +
        (o.cancel === null ? '' : '<button type="button" class="btn ghost" data-x>' + KR.esc(o.cancel || 'Cancelar') + '</button>') +
        (o.ok === null ? '' : '<button type="submit" class="btn ' + (o.danger ? 'danger' : 'solid') + '" value="ok">' + KR.esc(o.ok || 'Aceptar') + '</button>') +
        '</footer></form>';
      document.body.appendChild(d);
      var result = null;
      var close = function (val) { result = val; try { d.close(); } catch (e) { d.remove(); resolve(val); } };
      d.addEventListener('close', function () { d.remove(); resolve(result); });
      KR.$$('[data-x]', d).forEach(function (b) { b.addEventListener('click', function () { close(null); }); });
      d.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        var val = true;
        if (o.read) { val = o.read(d); if (val === false) return; }
        close(val);
      });
      if (o.mount) o.mount(d);
      try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
      var first = d.querySelector('[autofocus]') || d.querySelector('.dlg-body input, .dlg-body select, .dlg-body textarea');
      if (first) setTimeout(function () { first.focus(); }, 30);
    });
  };
  KR.confirm = function (title, body, ok) {
    return KR.dialog({ title: title, body: '<p>' + KR.esc(body) + '</p>', ok: ok || 'Borrar', danger: true });
  };

  /* ---------- formularios ---------- */
  KR.field = function (o) {
    /* o: {id, label, type, value, options, hint, attrs, cls, full} */
    var id = o.id, v = o.value == null ? '' : o.value, attrs = o.attrs || '';
    var input;
    if (o.type === 'select') {
      input = '<select class="field-in" id="' + id + '" name="' + (o.name || id) + '" ' + attrs + '>' +
        o.options.map(function (op) {
          var val = typeof op === 'object' ? op.value : op, lab = typeof op === 'object' ? op.label : op;
          return '<option value="' + KR.esc(val) + '"' + (String(val) === String(v) ? ' selected' : '') + '>' + KR.esc(lab) + '</option>';
        }).join('') + '</select>';
    } else if (o.type === 'textarea') {
      input = '<textarea class="field-in" id="' + id + '" name="' + (o.name || id) + '" rows="' + (o.rows || 3) + '" ' + attrs + '>' + KR.esc(v) + '</textarea>';
    } else {
      input = '<input class="field-in" id="' + id + '" name="' + (o.name || id) + '" type="' + (o.type || 'text') + '" value="' + KR.esc(v) + '" ' + attrs + '>';
    }
    return '<div class="field' + (o.cls ? ' ' + o.cls : '') + '"><label for="' + id + '">' + KR.esc(o.label) + '</label>' + input +
      (o.hint ? '<small class="hint">' + o.hint + '</small>' : '') + '</div>';
  };
  KR.formData = function (root) {
    var out = {};
    KR.$$('input[name], select[name], textarea[name]', root).forEach(function (el) {
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
      else out[el.name] = el.value;
    });
    return out;
  };

  /* ---------- vistas y rutas ---------- */
  KR.views = {};
  KR.viewOrder = [];
  KR.view = function (name, def) { def.name = name; KR.views[name] = def; KR.viewOrder.push(name); };
  KR.go = function (hash) {
    if (location.hash === '#' + hash) router.render();
    else location.hash = hash;
  };
  var router = KR.router = {
    current: null, ctx: null,
    parse: function () {
      var h = decodeURIComponent(location.hash.slice(1));
      var i = h.indexOf('-');
      var name = i > 0 ? h.slice(0, i) : h, arg = i > 0 ? h.slice(i + 1) : null;
      if (!KR.views[name]) { name = 'inicio'; arg = null; }
      return { name: name, arg: arg };
    },
    render: function () {
      var r = this.parse();
      if (this.ctx) this.ctx.destroy();
      var main = document.getElementById('view');
      var view = KR.views[r.name];
      var ctx = this.ctx = makeCtx();
      var el = document.createElement('div');
      el.className = 'view view-' + r.name;
      main.innerHTML = '';
      main.appendChild(el);
      this.current = r.name;
      document.title = (view.title ? view.title + ' · ' : '') + 'KTRL Room';
      KR.markNav(view.nav || r.name);
      try { view.render(el, r.arg, ctx); }
      catch (e) {
        console.error(e);
        el.innerHTML = '<div class="empty"><h3>Algo falló al abrir este módulo</h3><p class="muted">' + KR.esc(e.message) + '</p></div>';
      }
      var top = document.querySelector('.topbar-title');
      if (top) top.textContent = view.title || 'KTRL Room';
      if (!router.first) main.focus({ preventScroll: true });
      router.first = false;
      window.scrollTo(0, 0);
    }
  };
  router.first = true;
  function makeCtx() {
    var offs = [];
    return {
      on: function (target, type, fn, opt) { target.addEventListener(type, fn, opt); offs.push(function () { target.removeEventListener(type, fn, opt); }); },
      sub: function (fn) { offs.push(store.on(fn)); },
      cleanup: function (fn) { offs.push(fn); },
      destroy: function () { offs.forEach(function (f) { try { f(); } catch (e) { /* ya cerrado */ } }); offs = []; }
    };
  }

  /* cabecera de cada vista: barra sólida como los títulos de la web */
  KR.head = function (o) {
    return '<header class="vhead">' +
      '<div class="vhead-row">' +
      (o.back ? '<a class="icon-btn back" href="#' + o.back + '" aria-label="Volver">' + KR.icon('back') + '</a>' : '') +
      '<h1 class="bar-title">' + KR.esc(o.title) + '</h1>' +
      (o.actions ? '<div class="vhead-actions">' + o.actions + '</div>' : '') +
      '</div>' +
      (o.lead ? '<p class="vhead-lead">' + o.lead + '</p>' : '') +
      '</header>';
  };
  KR.empty = function (o) {
    return '<div class="empty">' + (o.icon ? KR.icon(o.icon, 'empty-ic') : '') +
      '<h3>' + KR.esc(o.title) + '</h3>' + (o.text ? '<p>' + o.text + '</p>' : '') +
      (o.action ? '<div class="empty-act">' + o.action + '</div>' : '') + '</div>';
  };
  KR.pill = function (label, tone, icon) {
    return '<span class="pill' + (tone ? ' ' + tone : '') + '">' + (icon ? KR.icon(icon) : '') + KR.esc(label) + '</span>';
  };

  /* ---------- navegación ---------- */
  KR.NAV = [
    { group: 'Estudio', items: ['inicio', 'agenda'] },
    { group: 'Beats', items: ['beats', 'analizar', 'licencias', 'splits'] },
    { group: 'DJ', items: ['set', 'tempo'] },
    { group: 'Eventos', items: ['eventos', 'afiches'] },
    { group: 'Contenido', items: ['lanzamientos', 'textos'] }
  ];
  KR.TABS = ['inicio', 'agenda', 'beats', 'eventos'];
  KR.buildNav = function () {
    var nav = document.getElementById('nav');
    var html = '';
    KR.NAV.forEach(function (g) {
      var items = g.items.filter(function (n) { return KR.views[n]; });
      if (!items.length) return;
      html += '<div class="nav-group"><span class="nav-label">' + g.group + '</span>' +
        items.map(function (n) {
          var v = KR.views[n];
          return '<a class="nav-item" href="#' + n + '" data-nav="' + n + '">' + KR.icon(v.icon) + '<span>' + KR.esc(v.title) + '</span></a>';
        }).join('') + '</div>';
    });
    nav.innerHTML = html;
    var set = document.getElementById('nav-settings');
    if (set) set.innerHTML = KR.icon('faders') + '<span>Ajustes</span>';
    var tabs = document.getElementById('tabbar');
    tabs.innerHTML = KR.TABS.filter(function (n) { return KR.views[n]; }).map(function (n) {
      var v = KR.views[n];
      return '<a class="tab" href="#' + n + '" data-nav="' + n + '">' + KR.icon(v.icon) + '<span>' + KR.esc(v.short || v.title) + '</span></a>';
    }).join('') + '<button class="tab" type="button" id="tab-more" aria-expanded="false" aria-controls="rail">' + KR.icon('menu') + '<span>Más</span></button>';
  };
  KR.markNav = function (name) {
    KR.$$('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  };

  KR.boot = function () {
    injectSprite();
    store.init();
    var glyph = document.getElementById('brand-glyph');
    if (glyph) glyph.outerHTML = KR.logoSvg('brand-glyph');
    KR.buildNav();
    applyTheme();
    var rail = document.getElementById('rail');
    var more = document.getElementById('tab-more');
    var shade = document.getElementById('shade');
    var setOpen = function (open) {
      document.body.classList.toggle('rail-open', open);
      if (more) more.setAttribute('aria-expanded', String(open));
    };
    if (more) more.addEventListener('click', function () { setOpen(!document.body.classList.contains('rail-open')); });
    if (shade) shade.addEventListener('click', function () { setOpen(false); });
    rail.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('hashchange', function () { router.render(); });
    store.on(function (ev) {
      if (ev.type === 'sync' || ev.type === 'reset') paintSync();
      if (ev.col === 'settings') applyTheme();
      if (ev.type === 'reset' && ev.source === 'cloud') router.render();
    });
    paintSync();
    router.render();
    cloud.start();
    /* calienta las capacidades para que el primer clic responda rápido */
    if (KR.inClaude) { KR.cap('downloads'); KR.cap('sample'); }
    if ('serviceWorker' in navigator && !KR.inClaude && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(function () { /* sin modo offline */ });
    }
  };
  function paintSync() {
    var el = document.getElementById('sync-status');
    if (!el) return;
    var s = cloud.status;
    el.className = 'sync ' + s;
    el.innerHTML = KR.icon(s === 'on' ? 'cloud' : 'device') + '<span>' + KR.esc(cloud.statusText()) + '</span>';
  }
  function applyTheme() {
    if (KR.inClaude) return; /* dentro de Claude manda el tema del visor */
    var t = store.doc('settings').theme;
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  KR.applyTheme = applyTheme;
})();
