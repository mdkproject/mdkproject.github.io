/* KTRL Room · Eventos
   Producción de eventos: datos, lineup con horarios automáticos, presupuesto con punto de equilibrio
   y el rider técnico en PDF. Desde aquí sale el afiche. */
(function () {
  'use strict';
  var KR = window.KR, esc = KR.esc;
  var STATUS = { idea: { label: 'Idea', tone: '' }, confirmado: { label: 'Confirmado', tone: 'amber' }, realizado: { label: 'Realizado', tone: 'good' }, cancelado: { label: 'Cancelado', tone: 'bad' } };
  var COST_CATS = ['Local', 'Sonido y luces', 'Cachets de artistas', 'Diseño e impresión', 'Publicidad en redes', 'Movilidad y hospedaje', 'Seguridad', 'Permisos municipales', 'Barra e insumos', 'Otros'];
  var RIDER = {
    cdj: { label: 'CDJ y mixer', gear: ['2 CDJ-3000 o CDJ-2000NXS2 enlazados por LAN', '1 mixer DJM-900NXS2, DJM-A9 o similar', 'Cables RCA o XLR del mixer a la consola'] },
    controller: { label: 'Controlador propio', gear: ['Llevo mi controlador y laptop', '2 cables XLR o RCA hacia la consola', 'Espacio de 1 m de ancho para el equipo'] },
    live: { label: 'Live set', gear: ['Laptop e interfaz de audio propias', '2 canales estéreo (XLR) en la consola', 'Mesa amplia para controladores y sintetizador'] }
  };
  var RIDER_ITEMS = ['2 monitores de cabina a la altura del oído', 'Mesa firme de 1.10 m de alto', '4 tomas de corriente con línea a tierra', 'Luz de cabina', 'Prueba de sonido de 30 minutos', 'Acceso cercano para cargar equipos', 'Agua y toalla en cabina', 'Micrófono inalámbrico'];
  var tabMemory = 'datos';

  function startMin(ev) { var t = KR.parseTime(ev.start); return t == null ? 22 * 60 : t; }
  KR.lineupTimes = function (ev) {
    var t = startMin(ev), ch = KR.num(ev.changeover, 0);
    return (ev.lineup || []).map(function (l) {
      var at = t; t += KR.num(l.dur, 60) + ch;
      return { id: l.id, name: l.artist, from: l.from, start: at, end: at + KR.num(l.dur, 60), me: !!l.me, note: l.note };
    });
  };
  function clock12(min) { var s = KR.fmtTime(min); return s.replace(/\s?(am|pm)$/, ''); }
  KR.lineupText = function (ev) {
    var lines = [(ev.name || 'Evento').toUpperCase() + (ev.date ? ' · ' + KR.fmtDate(ev.date, { weekday: true, year: false }) : '') + (ev.secret ? ' · Ubicación secreta' : ev.venue ? ' · ' + ev.venue : '') + (ev.city ? ' · ' + ev.city : ''), ''];
    KR.lineupTimes(ev).forEach(function (s) { lines.push(KR.fmtTime(s.start) + '  ' + s.name + (s.from ? ' (' + s.from + ')' : '')); });
    if (ev.entry) lines.push('', ev.entry);
    return lines.join('\n');
  };
  function budget(ev) {
    var C = KR.sum(ev.costs || [], function (c) { return KR.num(c.amount, 0); });
    var tiers = ev.tiers || [];
    var A = KR.sum(tiers, function (t) { return KR.num(t.qty, 0); });
    var It = KR.sum(tiers, function (t) { return KR.num(t.price, 0) * KR.num(t.qty, 0); });
    var E = KR.sum(ev.extras || [], function (x) { return KR.num(x.amount, 0); });
    var avg = A > 0 ? It / A : (tiers[0] ? KR.num(tiers[0].price, 0) : 0);
    var be = avg > 0 ? Math.max(0, Math.ceil((C - E) / avg)) : null;
    return { costs: C, att: A, tickets: It, extras: E, avg: avg, result: It + E - C, breakeven: be };
  }
  KR.eventBudget = budget;

  /* ---------- lista ---------- */
  function renderList(el, ctx) {
    el.innerHTML = KR.head({
      title: 'Eventos',
      lead: 'Lattice, True House, Sunday Sessions… Cada evento con su lineup, horarios, presupuesto, rider y afiche.',
      actions: '<button class="btn solid" type="button" data-act="new">' + KR.icon('plus') + 'Nuevo evento</button>'
    }) + '<div class="ev-grid" id="ev-grid"></div>';
    function paint() {
      var all = KR.store.list('events').slice().sort(function (a, b) {
        var da = a.date || '0000', db = b.date || '0000';
        var fa = KR.daysUntil(a.date) >= 0, fb = KR.daysUntil(b.date) >= 0;
        if (fa !== fb) return fa ? -1 : 1;
        return fa ? (da < db ? -1 : 1) : (da > db ? -1 : 1);
      });
      if (!all.length) { KR.$('#ev-grid', el).innerHTML = KR.empty({ icon: 'ticket', title: 'No hay eventos', text: 'Crea el primero y arma su lineup.', action: '<button class="btn solid" type="button" data-act="new">Nuevo evento</button>' }); return; }
      KR.$('#ev-grid', el).innerHTML = all.map(function (e) {
        var s = STATUS[e.status] || STATUS.idea, b = budget(e), times = KR.lineupTimes(e);
        var me = times.find(function (t) { return t.me; });
        var d = KR.parseDate(e.date);
        return '<a class="ev-card" href="#eventos-' + e.id + '">' +
          '<span class="ev-date">' + (d ? '<b>' + d.getDate() + '</b><i>' + KR.MES[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '') + '</i>' : '<b>—</b><i>sin fecha</i>') + '</span>' +
          '<span class="ev-body"><b class="ev-name">' + esc(e.name) + '</b><span class="ev-sub">' + esc([e.tagline, e.secret ? 'Ubicación secreta' : e.venue, e.city].filter(Boolean).join(' · ')) + '</span>' +
          '<span class="ev-tags">' + KR.pill(s.label, s.tone) + (times.length ? KR.pill(KR.plural(times.length, 'artista', 'artistas')) : '') + (me ? KR.pill('Tocas ' + KR.fmtTime(me.start), 'amber') : '') +
          ((e.costs || []).length ? KR.pill('Resultado ' + KR.money(b.result), b.result >= 0 ? 'good' : 'bad') : '') + '</span></span></a>';
      }).join('');
    }
    el.addEventListener('click', function (e) {
      if (!e.target.closest('[data-act="new"]')) return;
      var ev = KR.store.put('events', { name: 'Evento nuevo', tagline: '', date: '', start: '22:00', venue: '', city: String(KR.store.doc('profile').city || '').split(',')[0], secret: false, organizers: KR.store.doc('profile').label, status: 'idea', capacity: null, entry: '', changeover: 0, lineup: [{ id: KR.uid('l'), artist: KR.store.doc('profile').artist, dur: 60, me: true }], costs: [], tiers: [], extras: [], notes: '' });
      KR.go('eventos-' + ev.id);
    });
    ctx.sub(function (ev) { if (ev.col === 'events' || ev.type === 'reset') paint(); });
    paint();
  }

  /* ---------- detalle ---------- */
  function renderDetail(el, event, ctx) {
    var model = KR.clone(event);
    ['lineup', 'costs', 'tiers', 'extras'].forEach(function (k) { model[k] = model[k] || []; });
    model.rider = model.rider || { setup: 'cdj', items: RIDER_ITEMS.slice(0, 6), notes: '' };
    var save = KR.debounce(function () { KR.store.put('events', model, { silent: true }); }, 350);
    var tabs = [['datos', 'Datos'], ['lineup', 'Lineup y horarios'], ['presupuesto', 'Presupuesto'], ['rider', 'Rider técnico']];
    el.innerHTML = KR.head({
      title: model.name || 'Evento', back: 'eventos',
      lead: '<span id="ev-lead"></span>',
      actions: '<a class="btn" href="#afiches-' + model.id + '">' + KR.icon('poster') + 'Hacer afiche</a><button class="btn ghost sm danger-text" type="button" data-act="delete">' + KR.icon('trash') + 'Borrar</button>'
    }) +
      '<div class="seg tabs" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (tabMemory === t[0]) + '" aria-pressed="' + (tabMemory === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="tab-panels">' +
      '<section data-panel="datos" class="panel"><form class="panel-pad form-grid" id="ev-form" autocomplete="off">' +
      KR.field({ id: 'e-name', name: 'name', label: 'Nombre', value: model.name, cls: 'full' }) +
      KR.field({ id: 'e-tag', name: 'tagline', label: 'Bajada', value: model.tagline, hint: 'Xtended live set, Showcase, Techno y house…', cls: 'full' }) +
      KR.field({ id: 'e-date', name: 'date', label: 'Fecha', type: 'date', value: model.date }) +
      KR.field({ id: 'e-start', name: 'start', label: 'Hora de inicio', type: 'time', value: model.start }) +
      KR.field({ id: 'e-venue', name: 'venue', label: 'Lugar', value: model.venue }) +
      KR.field({ id: 'e-city', name: 'city', label: 'Ciudad', value: model.city }) +
      '<label class="check"><input type="checkbox" name="secret" id="e-secret"' + (model.secret ? ' checked' : '') + '> Ubicación secreta (se revela a quien compra)</label>' +
      KR.field({ id: 'e-org', name: 'organizers', label: 'Organiza', value: model.organizers, hint: 'Lattice × KatanaSound, Quramanta…' }) +
      KR.field({ id: 'e-status', name: 'status', label: 'Estado', type: 'select', value: model.status || 'idea', options: Object.keys(STATUS).map(function (k) { return { value: k, label: STATUS[k].label }; }) }) +
      KR.field({ id: 'e-cap', name: 'capacity', label: 'Aforo', type: 'number', value: model.capacity == null ? '' : model.capacity, attrs: 'min="0" inputmode="numeric"' }) +
      KR.field({ id: 'e-entry', name: 'entry', label: 'Entrada', value: model.entry, hint: 'Preventa S/ 20 · Puerta S/ 30, Libre con pulsera…', cls: 'full' }) +
      KR.field({ id: 'e-notes', name: 'notes', label: 'Notas', type: 'textarea', value: model.notes, cls: 'full', rows: 3 }) +
      '</form></section>' +

      '<section data-panel="lineup" class="stack"><div class="split"><div class="panel"><div class="panel-head"><h2>Lineup</h2><div class="row"><label class="label" for="e-ch">Cambio entre sets (min)</label><input class="field-in num sm-in" id="e-ch" type="number" min="0" step="5" value="' + (model.changeover || 0) + '"></div></div>' +
      '<ol class="lineup" id="lineup"></ol><div class="panel-pad"><button class="btn sm" type="button" data-act="add-slot">' + KR.icon('plus') + 'Agregar artista</button></div></div>' +
      '<aside class="stack"><div class="panel tt-panel"><div class="panel-head"><h2>Horarios</h2><span class="label" id="tt-span"></span></div><ol class="tt" id="tt"></ol>' +
      '<div class="panel-pad row"><button class="btn sm" type="button" data-act="copy-tt">' + KR.icon('copy') + 'Copiar horarios</button><a class="btn sm" href="#afiches-' + model.id + '">' + KR.icon('poster') + 'Afiche de horarios</a></div></div></aside></div></section>' +

      '<section data-panel="presupuesto" class="stack"><dl class="kpis" id="b-kpis"></dl><div class="split">' +
      '<div class="stack"><div class="panel"><div class="panel-head"><h2>Costos</h2><button class="btn sm ghost" type="button" data-act="typical">Partidas típicas</button></div><div class="rows" id="costs"></div><div class="panel-pad"><button class="btn sm" type="button" data-act="add-cost">' + KR.icon('plus') + 'Agregar costo</button></div></div>' +
      '<div class="panel"><div class="panel-head"><h2>Entradas</h2></div><div class="rows" id="tiers"></div><div class="panel-pad"><button class="btn sm" type="button" data-act="add-tier">' + KR.icon('plus') + 'Agregar tipo de entrada</button></div></div>' +
      '<div class="panel"><div class="panel-head"><h2>Otros ingresos</h2><span class="label">barra, auspicios</span></div><div class="rows" id="extras"></div><div class="panel-pad"><button class="btn sm" type="button" data-act="add-extra">' + KR.icon('plus') + 'Agregar ingreso</button></div></div></div>' +
      '<aside class="panel"><div class="panel-head"><h2>Resultado según asistentes</h2></div><div class="panel-pad"><div id="be-chart"></div><p class="hint" id="be-note"></p></div></aside>' +
      '</div></section>' +

      '<section data-panel="rider" class="split"><div class="panel"><div class="panel-head"><h2>Formato del set</h2></div><div class="panel-pad stack" id="rider-form"></div></div>' +
      '<aside class="doc-side"><div class="doc-actions"><button class="btn solid" type="button" data-act="rider-pdf">' + KR.icon('download') + 'Rider PDF</button></div><div class="paper-wrap" id="rider-paper"></div></aside></section>' +
      '</div>';

    var $ = function (s) { return KR.$(s, el); };
    function showTab(t) {
      tabMemory = t;
      KR.$$('[data-tab]', el).forEach(function (b) { var on = b.getAttribute('data-tab') === t; b.setAttribute('aria-selected', String(on)); b.setAttribute('aria-pressed', String(on)); });
      KR.$$('[data-panel]', el).forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== t; });
      if (t === 'presupuesto') paintBudget();
      if (t === 'rider') paintRider();
    }
    function paintLead() {
      var s = STATUS[model.status] || STATUS.idea;
      $('#ev-lead').innerHTML = KR.pill(s.label, s.tone) + ' ' + (model.date ? KR.fmtDate(model.date, { weekday: true }) + ' · ' + KR.relDays(model.date) : 'Sin fecha') + (model.start ? ' · desde ' + KR.fmtTime(KR.parseTime(model.start)) : '') + (model.city ? ' · ' + esc(model.city) : '');
      var h = el.querySelector('.bar-title'); if (h) h.textContent = model.name || 'Evento';
    }
    /* lineup */
    function paintLineup() {
      $('#lineup').innerHTML = model.lineup.map(function (l, i) {
        return '<li class="slot" data-id="' + l.id + '"><span class="slot-n num">' + (i + 1) + '</span>' +
          '<input class="field-in" data-f="artist" value="' + esc(l.artist) + '" aria-label="Artista ' + (i + 1) + '" placeholder="Artista o b2b">' +
          '<input class="field-in" data-f="from" value="' + esc(l.from || '') + '" aria-label="De dónde viene" placeholder="Ciudad">' +
          '<span class="slot-dur"><input class="field-in num" data-f="dur" type="number" min="15" step="15" value="' + (l.dur || 60) + '" aria-label="Duración en minutos"><small>min</small></span>' +
          '<label class="check slot-me" title="Marca tu set"><input type="checkbox" data-f="me"' + (l.me ? ' checked' : '') + '> Yo</label>' +
          '<span class="slot-acts"><button class="icon-btn sm" type="button" data-up aria-label="Subir">↑</button><button class="icon-btn sm" type="button" data-down aria-label="Bajar">↓</button><button class="icon-btn sm" type="button" data-x aria-label="Quitar">' + KR.icon('x') + '</button></span></li>';
      }).join('') || '<li class="panel-pad muted">Sin artistas todavía.</li>';
      paintTimes();
    }
    function paintTimes() {
      var times = KR.lineupTimes(model);
      $('#tt').innerHTML = times.map(function (t) {
        return '<li' + (t.me ? ' class="me"' : '') + '><span class="num">' + clock12(t.start) + '</span><b>' + esc(t.name || '—') + '</b>' + (t.from ? '<small>' + esc(t.from) + '</small>' : '') + '</li>';
      }).join('');
      $('#tt-span').textContent = times.length ? KR.fmtTime(times[0].start) + ' a ' + KR.fmtTime(times[times.length - 1].end) : '';
    }
    $('#lineup').addEventListener('input', function (e) {
      var li = e.target.closest('.slot'), f = e.target.getAttribute('data-f'); if (!li || !f) return;
      var l = model.lineup.find(function (x) { return x.id === li.getAttribute('data-id'); });
      l[f] = f === 'me' ? e.target.checked : f === 'dur' ? Math.max(5, KR.num(e.target.value, 60)) : e.target.value;
      paintTimes(); save();
    });
    $('#lineup').addEventListener('change', function (e) { if (e.target.getAttribute('data-f') === 'me') { var li = e.target.closest('.slot'); var l = model.lineup.find(function (x) { return x.id === li.getAttribute('data-id'); }); l.me = e.target.checked; paintTimes(); save(); } });
    $('#lineup').addEventListener('click', function (e) {
      var li = e.target.closest('.slot'); if (!li) return;
      var i = model.lineup.findIndex(function (x) { return x.id === li.getAttribute('data-id'); });
      if (e.target.closest('[data-x]')) model.lineup.splice(i, 1);
      else if (e.target.closest('[data-up]') && i > 0) model.lineup.splice(i - 1, 0, model.lineup.splice(i, 1)[0]);
      else if (e.target.closest('[data-down]') && i < model.lineup.length - 1) model.lineup.splice(i + 1, 0, model.lineup.splice(i, 1)[0]);
      else return;
      paintLineup(); save();
    });
    $('#e-ch').addEventListener('input', function (e) { model.changeover = Math.max(0, KR.num(e.target.value, 0)); paintTimes(); save(); });

    /* presupuesto */
    function rowsHtml(list, kind) {
      if (!list.length) return '<p class="panel-pad muted">' + (kind === 'costs' ? 'Sin costos cargados.' : kind === 'tiers' ? 'Agrega preventa, general o puerta.' : 'Opcional.') + '</p>';
      return list.map(function (r) {
        var a = kind === 'tiers'
          ? '<input class="field-in" data-f="name" value="' + esc(r.name || '') + '" placeholder="Preventa" aria-label="Tipo de entrada">' +
            '<label class="mini"><small>Precio</small><input class="field-in num" data-f="price" type="number" min="0" value="' + (r.price == null ? '' : r.price) + '" inputmode="decimal"></label>' +
            '<label class="mini"><small>Cantidad</small><input class="field-in num" data-f="qty" type="number" min="0" value="' + (r.qty == null ? '' : r.qty) + '" inputmode="numeric"></label>'
          : (kind === 'costs' ? '<input class="field-in" data-f="cat" list="cost-cats" value="' + esc(r.cat || '') + '" placeholder="Categoría" aria-label="Categoría">' : '') +
            '<input class="field-in" data-f="desc" value="' + esc(r.desc || '') + '" placeholder="' + (kind === 'costs' ? 'Detalle' : 'Barra (neto), auspicio…') + '" aria-label="Detalle">' +
            '<label class="mini"><small>Monto</small><input class="field-in num" data-f="amount" type="number" min="0" value="' + (r.amount == null ? '' : r.amount) + '" inputmode="decimal"></label>';
        return '<div class="brow ' + kind + '" data-id="' + r.id + '" data-kind="' + kind + '">' + a + '<button class="icon-btn sm bare" type="button" data-rm aria-label="Quitar">' + KR.icon('x') + '</button></div>';
      }).join('') + (kind === 'costs' ? '<datalist id="cost-cats">' + COST_CATS.map(function (c) { return '<option value="' + c + '">'; }).join('') + '</datalist>' : '');
    }
    function paintBudget() {
      $('#costs').innerHTML = rowsHtml(model.costs, 'costs');
      $('#tiers').innerHTML = rowsHtml(model.tiers, 'tiers');
      $('#extras').innerHTML = rowsHtml(model.extras, 'extras');
      paintResult();
    }
    function paintResult() {
      var b = budget(model);
      $('#b-kpis').innerHTML =
        '<div class="kpi"><dt>Costos</dt><dd class="k-val">' + KR.money(b.costs) + '</dd></div>' +
        '<div class="kpi"><dt>Ingreso esperado</dt><dd class="k-val">' + KR.money(b.tickets + b.extras) + '</dd><span class="k-sub">' + KR.plural(b.att, 'entrada', 'entradas') + '</span></div>' +
        '<div class="kpi ' + (b.result >= 0 ? 'amber' : 'coral') + '"><dt>' + (b.result >= 0 ? 'Ganancia' : 'Pérdida') + ' esperada</dt><dd class="k-val">' + KR.money(Math.abs(b.result)) + '</dd></div>' +
        '<div class="kpi"><dt>Punto de equilibrio</dt><dd class="k-val">' + (b.breakeven == null ? '—' : b.breakeven) + '</dd><span class="k-sub">' + (b.breakeven == null ? 'pon precio a una entrada' : 'personas a ' + KR.money(Math.round(b.avg * 100) / 100) + ' en promedio') + '</span></div>';
      var box = $('#be-chart');
      if (!(b.avg > 0) || !b.costs) {
        box.innerHTML = KR.empty({ icon: 'money', title: 'Faltan datos', text: 'Carga los costos y al menos un tipo de entrada con precio para ver cuánta gente necesitas.' });
        $('#be-note').textContent = '';
        return;
      }
      var xmax = Math.max(KR.num(model.capacity, 0), b.att * 1.4, (b.breakeven || 0) * 1.5, 40);
      xmax = Math.ceil(xmax / 10) * 10;
      var pts = [];
      for (var i = 0; i <= 40; i++) { var x = Math.round(xmax * i / 40); pts.push({ x: x, y: x * b.avg + b.extras - b.costs }); }
      var markers = [];
      if (b.breakeven != null && b.breakeven <= xmax) markers.push({ x: b.breakeven, y: 0, label: 'Equilibrio: ' + b.breakeven, below: true });
      if (b.att) markers.push({ x: b.att, y: b.att * b.avg + b.extras - b.costs, label: 'Esperado: ' + b.att });
      KR.chart.line(box, {
        label: 'Resultado del evento según cuántas personas pagan entrada', height: 230, points: pts,
        xFormat: function (v, full) { return full ? Math.round(v) + ' personas' : String(Math.round(v)); }, yFormat: function (v, tick) { return tick ? KR.chart.compact(v) : KR.money(Math.round(v)); },
        refs: [{ y: 0, label: 'Sin ganar ni perder', strong: true }].concat(model.capacity ? [] : []), markers: markers, area: false
      });
      var cap = KR.num(model.capacity, 0);
      $('#be-note').textContent = 'Con ' + KR.plural(b.att, 'entrada vendida', 'entradas vendidas') + ' el resultado es ' + KR.money(Math.round(b.result)) + '.' +
        (b.breakeven != null ? ' Necesitas ' + KR.plural(b.breakeven, 'persona', 'personas') + ' para cubrir costos' + (cap ? ' (' + Math.round(b.breakeven / cap * 100) + ' % del aforo).' : '.') : '');
    }
    var budgetEl = el.querySelector('[data-panel="presupuesto"]');
    budgetEl.addEventListener('input', function (e) {
      var row = e.target.closest('.brow'), f = e.target.getAttribute('data-f'); if (!row || !f) return;
      var list = model[row.getAttribute('data-kind')], r = list.find(function (x) { return x.id === row.getAttribute('data-id'); });
      r[f] = (f === 'amount' || f === 'price' || f === 'qty') ? (e.target.value === '' ? null : KR.num(e.target.value)) : e.target.value;
      paintResult(); save();
    });
    budgetEl.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-rm]');
      if (rm) { var row = rm.closest('.brow'), k = row.getAttribute('data-kind'); model[k] = model[k].filter(function (x) { return x.id !== row.getAttribute('data-id'); }); paintBudget(); save(); }
    });

    /* rider */
    function riderDoc() {
      var prof = KR.store.doc('profile'), r = model.rider, setup = RIDER[r.setup] || RIDER.cdj;
      return {
        kicker: prof.label || 'Lattice Rekords', title: 'Rider técnico', subtitle: prof.artist + ' · ' + setup.label,
        ref: model.name, date: model.date ? KR.fmtDateLong(model.date) : '',
        meta: [['Artista', prof.artist], ['Formato', setup.label], ['Evento', model.name || '—'], ['Set', (function () { var me = KR.lineupTimes(model).find(function (t) { return t.me; }); return me ? KR.fmtTime(me.start) + ' · ' + (me.end - me.start) + ' min' : 'Por confirmar'; })()]],
        blocks: [
          { h: 'Equipo de cabina' }, { bullets: setup.gear },
          { h: 'Necesito en el lugar' }, { bullets: r.items.length ? r.items : ['Sin requisitos adicionales.'] }
        ].concat(r.notes ? [{ h: 'Notas' }, { p: r.notes }] : []).concat([
          { h: 'Contacto' }, { p: prof.name + ' · ' + prof.phone + ' · ' + prof.email }
        ]),
        footer: String(prof.web || '').replace(/^https?:\/\//, '').replace(/\/$/, '') + ' · ' + (prof.label || '') + ' · ' + prof.city,
        author: prof.name, subject: 'Rider técnico de ' + prof.artist
      };
    }
    function paintRider() {
      var r = model.rider;
      $('#rider-form').innerHTML = '<div class="seg lic-seg">' + Object.keys(RIDER).map(function (k) { return '<button type="button" data-setup="' + k + '" aria-pressed="' + (r.setup === k) + '">' + esc(RIDER[k].label) + '</button>'; }).join('') + '</div>' +
        '<ul class="qual">' + RIDER[r.setup].gear.map(function (g) { return '<li class="muted">' + KR.icon('check') + ' ' + esc(g) + '</li>'; }).join('') + '</ul>' +
        '<span class="label">Necesito en el lugar</span><ul class="qual">' + RIDER_ITEMS.map(function (it, i) { return '<li><label class="check"><input type="checkbox" data-ri="' + i + '"' + (r.items.indexOf(it) >= 0 ? ' checked' : '') + '> ' + esc(it) + '</label></li>'; }).join('') + '</ul>' +
        KR.field({ id: 'r-notes', label: 'Notas para el organizador', type: 'textarea', value: r.notes, rows: 3 });
      $('#rider-paper').innerHTML = KR.pdf.docHTML(riderDoc());
    }
    el.querySelector('[data-panel="rider"]').addEventListener('change', function (e) {
      var i = e.target.getAttribute('data-ri'); if (i == null) return;
      var it = RIDER_ITEMS[+i];
      model.rider.items = e.target.checked ? model.rider.items.concat([it]) : model.rider.items.filter(function (x) { return x !== it; });
      $('#rider-paper').innerHTML = KR.pdf.docHTML(riderDoc()); save();
    });
    el.querySelector('[data-panel="rider"]').addEventListener('input', function (e) { if (e.target.id === 'r-notes') { model.rider.notes = e.target.value; $('#rider-paper').innerHTML = KR.pdf.docHTML(riderDoc()); save(); } });

    /* datos */
    $('#ev-form').addEventListener('input', function (e) {
      var n = e.target.name; if (!n) return;
      model[n] = e.target.type === 'checkbox' ? e.target.checked : n === 'capacity' ? (e.target.value === '' ? null : KR.num(e.target.value)) : e.target.value;
      paintLead(); paintTimes(); save();
    });

    el.addEventListener('click', function (e) {
      var tb = e.target.closest('[data-tab]'); if (tb) { showTab(tb.getAttribute('data-tab')); return; }
      var su = e.target.closest('[data-setup]'); if (su) { model.rider.setup = su.getAttribute('data-setup'); paintRider(); save(); return; }
      var a = e.target.closest('[data-act]'); if (!a) return;
      var act = a.getAttribute('data-act');
      if (act === 'add-slot') { model.lineup.push({ id: KR.uid('l'), artist: '', dur: 60 }); paintLineup(); save(); var ins = KR.$$('.slot [data-f="artist"]', el); if (ins.length) ins[ins.length - 1].focus(); }
      if (act === 'copy-tt') KR.copy(KR.lineupText(model), 'Horarios copiados');
      if (act === 'add-cost') { model.costs.push({ id: KR.uid('c'), cat: '', desc: '', amount: null }); paintBudget(); save(); }
      if (act === 'add-tier') { model.tiers.push({ id: KR.uid('t'), name: model.tiers.length ? 'General' : 'Preventa', price: null, qty: null }); paintBudget(); save(); }
      if (act === 'add-extra') { model.extras.push({ id: KR.uid('x'), desc: '', amount: null }); paintBudget(); save(); }
      if (act === 'typical') {
        var have = model.costs.map(function (c) { return c.cat; });
        COST_CATS.slice(0, 8).forEach(function (c) { if (have.indexOf(c) < 0) model.costs.push({ id: KR.uid('c'), cat: c, desc: '', amount: null }); });
        paintBudget(); save();
      }
      if (act === 'rider-pdf') {
        var bytes = KR.pdf.renderDoc(riderDoc());
        KR.saveFile('rider-' + KR.slug(KR.store.doc('profile').artist) + '-' + KR.slug(model.name) + '.pdf', new Blob([bytes], { type: 'application/pdf' }), 'application/pdf');
      }
      if (act === 'delete') KR.confirm('¿Borrar "' + model.name + '"?', 'Se borran su lineup, presupuesto y rider.').then(function (ok) { if (ok) { KR.store.remove('events', model.id); KR.go('eventos'); } });
    });
    ctx.cleanup(function () { if (KR.store.get('events', model.id)) KR.store.put('events', model, { silent: true }); });
    paintLead(); paintLineup(); showTab(tabMemory);
  }

  KR.view('eventos', {
    title: 'Eventos', icon: 'ticket',
    render: function (el, arg, ctx) {
      var ev = arg ? KR.store.get('events', arg) : null;
      if (ev) renderDetail(el, ev, ctx); else renderList(el, ctx);
    }
  });
})();
