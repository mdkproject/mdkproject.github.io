/* KTRL Room · Agenda
   Todo lo que entra por WhatsApp, Instagram o en persona: sets, beats, producciones, eventos, alquiler de equipos y diseño.
   Tablero por etapa, lista por fecha, ingresos por mes y una guía de preguntas para calificar cada consulta. */
(function () {
  'use strict';
  var KR = window.KR, esc = KR.esc;

  /* colores de la web: ámbar = en vivo y electrónica, plata = beats y equipos, salmón = trabajos para otros artistas */
  var TYPES = {
    dj: { label: 'Set de DJ', tone: 'amber', icon: 'headphones' },
    evento: { label: 'Producción de evento', tone: 'amber', icon: 'ticket' },
    beat: { label: 'Beat o licencia', tone: 'silver', icon: 'disc' },
    equipos: { label: 'Alquiler de equipos', tone: 'silver', icon: 'eq' },
    produccion: { label: 'Producción musical', tone: 'coral', icon: 'note' },
    diseno: { label: 'Diseño de afiche', tone: 'coral', icon: 'poster' },
    otro: { label: 'Otro', tone: '', icon: 'chat' }
  };
  var STAGES = [
    { id: 'consulta', label: 'Consulta' }, { id: 'cotizado', label: 'Cotizado' }, { id: 'confirmado', label: 'Confirmado' },
    { id: 'realizado', label: 'Realizado' }, { id: 'cobrado', label: 'Cobrado' }, { id: 'perdido', label: 'Perdido' }
  ];
  var CHANNELS = { whatsapp: 'WhatsApp', instagram: 'Instagram', correo: 'Correo', referido: 'Referido', otro: 'Otro' };
  /* las preguntas que conviene cerrar antes de cotizar, por tipo de trabajo */
  var QUALIFY = {
    dj: ['Fecha, horario y ciudad', 'Tipo de evento y duración del set', 'Equipo disponible (CDJ, controlador, sonido)', 'Cachet, adelanto y movilidad'],
    evento: ['Fecha y lugar', 'Lineup y horarios', 'Presupuesto y precio de entrada', 'Permisos, sonido y seguridad'],
    beat: ['Para qué proyecto (single, álbum, video)', 'Tipo de licencia', 'Fecha de lanzamiento', 'Presupuesto'],
    equipos: ['Fecha y horas de uso', 'Qué equipos necesita', 'Transporte y montaje', 'Garantía y forma de pago'],
    produccion: ['Referencias y género', 'Qué incluye (beat, grabación, mezcla, máster)', 'Fecha de entrega', 'Presupuesto y adelanto'],
    diseno: ['Formato (post, historia, flyer)', 'Datos del evento y logos', 'Fecha de entrega', 'Precio'],
    otro: ['Qué necesita', 'Para cuándo', 'Presupuesto']
  };
  KR.DEAL_TYPES = TYPES; KR.STAGES = STAGES; KR.QUALIFY = QUALIFY;

  function stageOf(id) { return STAGES.find(function (s) { return s.id === id; }) || STAGES[0]; }
  function due(d) { return Math.max(0, KR.num(d.amount, 0) - KR.num(d.paid, 0)); }
  KR.dealDue = due;
  function remember(k, v) { try { if (v === undefined) return localStorage.getItem('kr-' + k); localStorage.setItem('kr-' + k, v); } catch (e) { return null; } }

  /* ingresos de los últimos 12 meses: cobrado y por cobrar, según la fecha del trabajo */
  KR.incomeByMonth = function (months) {
    months = months || 12;
    var now = new Date(), out = [];
    for (var i = months - 1; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({ y: d.getFullYear(), m: d.getMonth(), paid: 0, due: 0 });
    }
    KR.store.list('deals').forEach(function (deal) {
      if (deal.stage === 'perdido') return;
      var d = KR.parseDate(deal.date); if (!d) return;
      var slot = out.find(function (o) { return o.y === d.getFullYear() && o.m === d.getMonth(); });
      if (!slot) return;
      slot.paid += KR.num(deal.paid, 0);
      if (deal.stage === 'confirmado' || deal.stage === 'realizado' || deal.stage === 'cobrado') slot.due += due(deal);
    });
    return out;
  };
  KR.incomeChart = function (box) {
    var data = KR.incomeByMonth(12);
    var any = data.some(function (d) { return d.paid || d.due; });
    if (!any) {
      box.innerHTML = KR.empty({ icon: 'money', title: 'Todavía no hay montos', text: 'Cuando anotes cuánto cobras por cada trabajo, aquí verás tus ingresos de los últimos 12 meses.' });
      return;
    }
    KR.chart.bars(box, {
      label: 'Ingresos por mes', height: 210,
      series: [{ name: 'Cobrado', color: 'var(--series-1)' }, { name: 'Por cobrar', color: 'var(--series-2)' }],
      items: data.map(function (d) { return { label: KR.MES_L[d.m] + ' ' + d.y, short: KR.MES[d.m], values: [d.paid, d.due] }; }),
      yFormat: function (v, tick) { return tick ? KR.chart.compact(v) : KR.money(v); }
    });
  };

  function dealForm(d) {
    var types = Object.keys(TYPES).map(function (k) { return { value: k, label: TYPES[k].label }; });
    return '<div class="form-grid">' +
      KR.field({ id: 'df-title', name: 'title', label: 'Qué es', value: d.title, cls: 'full', attrs: 'required placeholder="Set de cierre en…, beat para…"' }) +
      KR.field({ id: 'df-type', name: 'type', label: 'Tipo', type: 'select', value: d.type || 'dj', options: types }) +
      KR.field({ id: 'df-stage', name: 'stage', label: 'Etapa', type: 'select', value: d.stage || 'consulta', options: STAGES.map(function (s) { return { value: s.id, label: s.label }; }) }) +
      KR.field({ id: 'df-client', name: 'client', label: 'Cliente o artista', value: d.client }) +
      KR.field({ id: 'df-contact', name: 'contact', label: 'WhatsApp o usuario', value: d.contact, attrs: 'placeholder="+51… o @usuario"' }) +
      KR.field({ id: 'df-channel', name: 'channel', label: 'Llegó por', type: 'select', value: d.channel || 'whatsapp', options: Object.keys(CHANNELS).map(function (k) { return { value: k, label: CHANNELS[k] }; }) }) +
      KR.field({ id: 'df-date', name: 'date', label: 'Fecha', type: 'date', value: d.date }) +
      KR.field({ id: 'df-time', name: 'time', label: 'Hora', type: 'time', value: d.time }) +
      KR.field({ id: 'df-place', name: 'place', label: 'Lugar o ciudad', value: d.place }) +
      KR.field({ id: 'df-amount', name: 'amount', label: 'Monto acordado', type: 'number', value: d.amount == null ? '' : d.amount, attrs: 'min="0" step="1" inputmode="decimal"' }) +
      KR.field({ id: 'df-paid', name: 'paid', label: 'Ya cobrado (adelanto)', type: 'number', value: d.paid == null ? '' : d.paid, attrs: 'min="0" step="1" inputmode="decimal"' }) +
      KR.field({ id: 'df-notes', name: 'notes', label: 'Notas', type: 'textarea', value: d.notes, cls: 'full', rows: 3 }) +
      '</div>';
  }
  function readDeal(fd, base) {
    return Object.assign({}, base, fd, {
      title: (fd.title || '').trim() || TYPES[fd.type || 'otro'].label,
      amount: fd.amount === '' ? null : KR.num(fd.amount), paid: fd.paid === '' ? null : KR.num(fd.paid)
    });
  }
  KR.newDeal = function (preset) {
    var base = Object.assign({ type: 'dj', stage: 'consulta', channel: 'whatsapp', currency: KR.store.doc('settings').currency }, preset || {});
    return KR.dialog({ title: 'Nuevo trabajo', ok: 'Guardar', wide: true, body: dealForm(base), read: function (dl) { return KR.formData(dl); } })
      .then(function (fd) {
        if (!fd) return null;
        var d = KR.store.put('deals', readDeal(fd, base));
        KR.toast('Agregado a la agenda', { action: 'Abrir', onAction: function () { KR.go('agenda-' + d.id); } });
        return d;
      });
  };

  function card(d) {
    var t = TYPES[d.type] || TYPES.otro, rel = d.date ? KR.relDays(d.date) : '';
    var soon = d.date && KR.daysUntil(d.date) >= 0 && KR.daysUntil(d.date) <= 7 && ['confirmado', 'cotizado', 'consulta'].indexOf(d.stage) >= 0;
    var owed = due(d);
    return '<article class="deal" data-id="' + d.id + '" tabindex="0" aria-label="' + esc(d.title + ', ' + t.label) + '">' +
      '<button type="button" class="deal-grip" data-grip aria-label="Mover ' + esc(d.title) + '">' + KR.icon('grip') + '</button>' +
      '<span class="deal-type"><i class="dot ' + t.tone + '"></i>' + esc(t.label) + '</span>' +
      '<a class="deal-title" href="#agenda-' + d.id + '">' + esc(d.title) + '</a>' +
      '<span class="deal-client">' + esc(d.client || 'Sin cliente') + '</span>' +
      '<span class="deal-meta">' + (d.date ? '<span class="num' + (soon ? ' soon' : '') + '">' + KR.icon('calendar') + KR.fmtDate(d.date) + (rel ? ' · ' + rel : '') + '</span>' : '<span class="faint">Sin fecha</span>') +
      (d.amount != null ? '<b class="num">' + KR.money(d.amount) + '</b>' : '') + '</span>' +
      (owed > 0 && (d.stage === 'realizado' || d.stage === 'confirmado') ? '<span class="deal-due">' + KR.icon('money') + 'Falta cobrar ' + KR.money(owed) + '</span>' : '') +
      '</article>';
  }

  function renderBoard(el, ctx) {
    var mode = remember('agenda-mode') || (window.innerWidth < 760 ? 'list' : 'board');
    var filter = remember('agenda-type') || 'all';
    var showLost = false;
    el.innerHTML = KR.head({
      title: 'Agenda',
      lead: 'Sets, beats, producciones, eventos, alquiler de equipos y diseño en un solo tablero. Arrastra una tarjeta para cambiarla de etapa.',
      actions: '<div class="seg" id="ag-mode"><button type="button" data-mode="board" aria-pressed="' + (mode === 'board') + '">' + KR.icon('board') + ' Tablero</button><button type="button" data-mode="list" aria-pressed="' + (mode === 'list') + '">' + KR.icon('list') + ' Lista</button></div>' +
        '<button class="btn solid" type="button" data-act="new">' + KR.icon('plus') + 'Nuevo trabajo</button>'
    }) +
      '<dl class="kpis" id="ag-kpis"></dl>' +
      '<div class="toolbar ag-tools"><div class="chips" id="ag-types">' +
      [['all', 'Todo']].concat(Object.keys(TYPES).map(function (k) { return [k, TYPES[k].label]; })).map(function (c) {
        return '<button class="chip" type="button" data-t="' + c[0] + '" aria-pressed="' + (filter === c[0]) + '">' + (c[0] !== 'all' ? '<i class="dot ' + TYPES[c[0]].tone + '"></i>' : '') + esc(c[1]) + '</button>';
      }).join('') + '</div><label class="check"><input type="checkbox" id="ag-lost"> Ver perdidos</label></div>' +
      '<div id="ag-body"></div>' +
      '<section class="panel ag-chart"><div class="panel-head"><h2>Ingresos por mes</h2><span class="label">últimos 12 meses · por fecha del trabajo</span></div><div class="panel-pad" id="ag-income"></div></section>';
    var $ = function (s) { return KR.$(s, el); };

    function list() {
      return KR.store.list('deals').filter(function (d) {
        if (filter !== 'all' && d.type !== filter) return false;
        if (!showLost && d.stage === 'perdido') return false;
        return true;
      });
    }
    function paintKpis() {
      var all = KR.store.list('deals'), y = new Date().getFullYear();
      var owed = KR.sum(all.filter(function (d) { return d.stage === 'confirmado' || d.stage === 'realizado'; }), due);
      var paidYear = KR.sum(all.filter(function (d) { var dd = KR.parseDate(d.date); return dd && dd.getFullYear() === y; }), function (d) { return KR.num(d.paid, 0); });
      var open = all.filter(function (d) { return d.stage === 'consulta' || d.stage === 'cotizado'; }).length;
      var next = all.filter(function (d) { return d.date && KR.daysUntil(d.date) >= 0 && d.stage !== 'perdido' && d.stage !== 'cobrado'; })
        .sort(function (a, b) { return a.date < b.date ? -1 : 1; })[0];
      $('#ag-kpis').innerHTML =
        '<div class="kpi amber"><dt>Por cobrar</dt><dd class="k-val">' + KR.money(owed) + '</dd></div>' +
        '<div class="kpi"><dt>Cobrado en ' + y + '</dt><dd class="k-val">' + KR.money(paidYear) + '</dd></div>' +
        '<div class="kpi"><dt>Consultas abiertas</dt><dd class="k-val">' + open + '</dd></div>' +
        '<div class="kpi"><dt>Próxima fecha</dt><dd class="k-val k-text">' + (next ? KR.fmtDate(next.date) : '—') + '</dd>' + (next ? '<span class="k-sub">' + esc(next.title) + '</span>' : '') + '</div>';
    }
    function paintBody() {
      var rows = list(), body = $('#ag-body');
      if (!KR.store.list('deals').length) {
        body.innerHTML = KR.empty({ icon: 'calendar', title: 'La agenda está vacía', text: 'Anota cada consulta apenas llega por WhatsApp o Instagram. Así nada se queda sin respuesta.', action: '<button class="btn solid" type="button" data-act="new">Nuevo trabajo</button>' });
        return;
      }
      if (mode === 'board') {
        var stages = STAGES.filter(function (s) { return showLost || s.id !== 'perdido'; });
        body.innerHTML = '<div class="board">' + stages.map(function (s) {
          var items = rows.filter(function (d) { return (d.stage || 'consulta') === s.id; })
            .sort(function (a, b) { return (a.date || '9999') < (b.date || '9999') ? -1 : 1; });
          var sum = KR.sum(items, function (d) { return KR.num(d.amount, 0); });
          return '<section class="col" data-stage="' + s.id + '" aria-label="' + s.label + '"><header class="col-head"><h3>' + s.label + '</h3><span class="num">' + items.length + (sum ? ' · ' + KR.money(sum) : '') + '</span></header>' +
            '<div class="col-body">' + (items.map(card).join('') || '<p class="col-empty">Nada aquí</p>') + '</div></section>';
        }).join('') + '</div>';
      } else {
        var sorted = rows.slice().sort(function (a, b) { return (b.date || '0000') > (a.date || '0000') ? 1 : -1; });
        body.innerHTML = '<ul class="log deal-log">' + sorted.map(function (d) {
          var t = TYPES[d.type] || TYPES.otro;
          return '<li><span class="when num">' + (d.date ? KR.fmtDate(d.date) : 'Sin fecha') + '</span>' +
            '<a class="what" href="#agenda-' + d.id + '"><b>' + esc(d.title) + '</b><span><i class="dot ' + t.tone + '"></i> ' + esc(t.label) + ' · ' + esc(d.client || 'Sin cliente') + '</span></a>' +
            '<span class="row">' + (d.amount != null ? '<span class="num">' + KR.money(d.amount) + '</span>' : '') + KR.pill(stageOf(d.stage).label, d.stage === 'cobrado' ? 'good' : d.stage === 'perdido' ? 'bad' : d.stage === 'confirmado' ? 'amber' : '') + '</span></li>';
        }).join('') + '</ul>';
      }
    }
    function paint() { paintKpis(); paintBody(); KR.incomeChart($('#ag-income')); }

    /* arrastrar tarjetas entre columnas */
    var drag = null;
    el.addEventListener('pointerdown', function (e) {
      var g = e.target.closest('[data-grip]'); if (!g) return;
      var cardEl = g.closest('.deal');
      e.preventDefault();
      var r = cardEl.getBoundingClientRect();
      var ghost = cardEl.cloneNode(true);
      ghost.classList.add('ghost'); ghost.style.width = r.width + 'px';
      document.body.appendChild(ghost);
      drag = { id: cardEl.getAttribute('data-id'), ghost: ghost, dx: e.clientX - r.left, dy: e.clientY - r.top, over: null };
      cardEl.classList.add('lifted');
      move(e);
      g.setPointerCapture(e.pointerId);
    });
    function move(e) {
      if (!drag) return;
      drag.ghost.style.transform = 'translate(' + (e.clientX - drag.dx) + 'px,' + (e.clientY - drag.dy) + 'px)';
      var under = document.elementFromPoint(e.clientX, e.clientY);
      var col = under && under.closest && under.closest('.col');
      KR.$$('.col', el).forEach(function (c) { c.classList.toggle('drop-on', c === col); });
      drag.over = col ? col.getAttribute('data-stage') : null;
    }
    el.addEventListener('pointermove', move);
    function end() {
      if (!drag) return;
      drag.ghost.remove();
      KR.$$('.col', el).forEach(function (c) { c.classList.remove('drop-on'); });
      var d = KR.store.get('deals', drag.id), to = drag.over;
      drag = null;
      if (d && to && to !== d.stage) moveTo(d, to); else paintBody();
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    function moveTo(d, to) {
      var prev = d.stage;
      var upd = Object.assign({}, d, { stage: to });
      if (to === 'cobrado' && d.amount != null && KR.num(d.paid, 0) < KR.num(d.amount, 0)) upd.paid = d.amount;
      KR.store.put('deals', upd);
      KR.toast(d.title + ' → ' + stageOf(to).label, { action: 'Deshacer', onAction: function () { KR.store.put('deals', Object.assign({}, upd, { stage: prev, paid: d.paid })); } });
    }
    el.addEventListener('keydown', function (e) {
      var c = e.target.closest && e.target.closest('.deal');
      if (!c || !e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      e.preventDefault();
      var d = KR.store.get('deals', c.getAttribute('data-id'));
      var ids = STAGES.map(function (s) { return s.id; }), i = ids.indexOf(d.stage) + (e.key === 'ArrowRight' ? 1 : -1);
      if (i >= 0 && i < ids.length) moveTo(d, ids[i]);
      var again = el.querySelector('.deal[data-id="' + d.id + '"]'); if (again) again.focus();
    });
    el.addEventListener('click', function (e) {
      var m = e.target.closest('[data-mode]');
      if (m) { mode = m.getAttribute('data-mode'); remember('agenda-mode', mode); KR.$$('[data-mode]', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b === m)); }); paintBody(); return; }
      var t = e.target.closest('[data-t]');
      if (t) { filter = t.getAttribute('data-t'); remember('agenda-type', filter); KR.$$('[data-t]', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); }); paintBody(); return; }
      if (e.target.closest('[data-act="new"]')) { KR.newDeal(filter !== 'all' ? { type: filter } : null); return; }
      var c = e.target.closest('.deal');
      if (c && !e.target.closest('a,button')) KR.go('agenda-' + c.getAttribute('data-id'));
    });
    el.addEventListener('keydown', function (e) {
      var c = e.target.closest && e.target.closest('.deal');
      if (c && e.key === 'Enter' && e.target === c) KR.go('agenda-' + c.getAttribute('data-id'));
    });
    $('#ag-lost').addEventListener('change', function (e) { showLost = e.target.checked; paintBody(); });
    ctx.sub(function (ev) { if (ev.col === 'deals' || ev.type === 'reset' || ev.col === 'settings') paint(); });
    paint();
  }

  function waText(d) {
    var prof = KR.store.doc('profile'), who = d.client ? ' ' + d.client.split(' ')[0] : '';
    if (d.stage === 'consulta') {
      var q = (QUALIFY[d.type] || QUALIFY.otro)[0].toLowerCase();
      return 'Hola' + who + ', gracias por escribir. Para cotizarte bien, cuéntame: ' + q + '.';
    }
    if (d.stage === 'cotizado') return 'Hola' + who + ', ¿pudiste revisar la cotización de ' + d.title.toLowerCase() + '? Si te sirve, separo la fecha con un adelanto.';
    if (d.stage === 'confirmado') return 'Hola' + who + ', confirmado: ' + d.title + (d.date ? ' el ' + KR.fmtDate(d.date, { weekday: true }) : '') + (d.time ? ' a las ' + d.time : '') + (d.place ? ' en ' + d.place : '') + '. Cualquier cambio me avisas.';
    if (d.stage === 'realizado') return 'Hola' + who + ', gracias por la confianza. Te recuerdo el saldo pendiente de ' + KR.money(due(d)) + '. Puedes pagar por Yape, Plin o transferencia.';
    return 'Hola' + who + ', gracias de nuevo. Cuando quieras repetimos. — ' + (prof.artist || 'MD KTRL');
  }

  function renderDetail(el, deal, ctx) {
    var model = KR.clone(deal);
    model.quals = model.quals || {};
    var t = TYPES[model.type] || TYPES.otro;
    el.innerHTML = KR.head({
      title: model.title || 'Trabajo', back: 'agenda',
      lead: '<i class="dot ' + t.tone + '"></i> ' + esc(t.label) + ' · ' + esc(stageOf(model.stage).label) + (model.date ? ' · ' + KR.fmtDate(model.date, { weekday: true }) + ' (' + KR.relDays(model.date) + ')' : ''),
      actions: '<button class="btn ghost sm danger-text" type="button" data-act="delete">' + KR.icon('trash') + 'Borrar</button>'
    }) +
      '<div class="split"><form class="panel" id="deal-form" autocomplete="off"><div class="panel-head"><h2>Datos</h2><span class="label" id="saved-note">Se guarda solo</span></div><div class="panel-pad">' + dealForm(model) + '</div></form>' +
      '<aside class="stack">' +
      '<section class="panel"><div class="panel-head"><h2>Antes de cotizar</h2><span class="label" id="q-count"></span></div><div class="panel-pad"><ul class="qual" id="qual"></ul>' +
      '<p class="hint">Una pregunta a la vez, en mensajes cortos. Así se califica una consulta sin sonar a formulario.</p></div></section>' +
      '<section class="panel"><div class="panel-head"><h2>Siguiente mensaje</h2></div><div class="panel-pad stack"><p class="wa-preview" id="wa-text"></p>' +
      '<div class="row"><a class="btn solid" id="wa-go" target="_blank" rel="noopener">' + KR.icon('send') + 'Abrir WhatsApp</a><button class="btn" type="button" data-act="copy-wa">' + KR.icon('copy') + 'Copiar</button></div></div></section>' +
      '<section class="panel"><div class="panel-head"><h2>Atajos</h2></div><div class="panel-pad row" id="shortcuts"></div></section>' +
      '</aside></div>';
    var $ = function (s) { return KR.$(s, el); };
    var save = KR.debounce(function () { KR.store.put('deals', model, { silent: true }); var n = $('#saved-note'); if (n) n.textContent = 'Guardado'; }, 350);
    function paintSide() {
      var qs = QUALIFY[model.type] || QUALIFY.otro;
      $('#qual').innerHTML = qs.map(function (q, i) {
        return '<li><label class="check"><input type="checkbox" data-q="' + i + '"' + (model.quals[i] ? ' checked' : '') + '> ' + esc(q) + '</label></li>';
      }).join('');
      $('#q-count').textContent = qs.filter(function (_, i) { return model.quals[i]; }).length + ' / ' + qs.length;
      var txt = waText(model);
      $('#wa-text').textContent = txt;
      var phone = /\d{6,}/.test(String(model.contact || '').replace(/\D/g, '')) ? model.contact : '';
      $('#wa-go').href = KR.waLink(phone, txt);
      var sc = [];
      if (model.type === 'beat') sc.push(model.licenseId && KR.store.get('licenses', model.licenseId) ? '<a class="btn sm" href="#licencias-' + model.licenseId + '">' + KR.icon('doc') + 'Ver licencia</a>' : '<a class="btn sm" href="#licencias-nuevo">' + KR.icon('doc') + 'Nueva licencia</a>');
      if (model.type === 'evento' || model.type === 'dj') sc.push(model.eventId && KR.store.get('events', model.eventId) ? '<a class="btn sm" href="#eventos-' + model.eventId + '">' + KR.icon('ticket') + 'Ver evento</a>' : '<button class="btn sm" type="button" data-act="mk-event">' + KR.icon('ticket') + 'Crear evento</button>');
      if (model.type === 'diseno' || model.type === 'evento' || model.type === 'dj') sc.push('<a class="btn sm" href="#afiches">' + KR.icon('poster') + 'Hacer afiche</a>');
      if (model.type === 'produccion') sc.push('<a class="btn sm" href="#splits">' + KR.icon('split') + 'Split sheet</a>');
      sc.push('<a class="btn sm" href="#textos">' + KR.icon('chat') + 'Más textos</a>');
      $('#shortcuts').innerHTML = sc.join('');
    }
    $('#deal-form').addEventListener('input', function () {
      var fd = KR.formData($('#deal-form'));
      var typeChanged = fd.type !== model.type;
      model = readDeal(fd, model);
      if (typeChanged) model.quals = {};
      var n = $('#saved-note'); if (n) n.textContent = 'Guardando…';
      paintSide(); save();
    });
    el.addEventListener('change', function (e) {
      if (e.target.matches('[data-q]')) { model.quals[e.target.getAttribute('data-q')] = e.target.checked; paintSide(); save(); }
    });
    el.addEventListener('click', function (e) {
      var a = e.target.closest('[data-act]'); if (!a) return;
      var act = a.getAttribute('data-act');
      if (act === 'copy-wa') KR.copy(waText(model), 'Mensaje copiado');
      if (act === 'mk-event') {
        var ev = KR.store.put('events', { name: model.title, tagline: '', date: model.date, start: model.time || '22:00', venue: model.place || '', city: '', secret: false, organizers: model.client || '', status: model.stage === 'confirmado' ? 'confirmado' : 'idea', lineup: [{ id: 'l1', artist: KR.store.doc('profile').artist, dur: 60, me: true }], costs: [], tiers: [], notes: model.notes || '' });
        model.eventId = ev.id; KR.store.put('deals', model, { silent: true });
        KR.go('eventos-' + ev.id);
      }
      if (act === 'delete') KR.confirm('¿Borrar "' + model.title + '"?', 'Se borra de la agenda.').then(function (ok) { if (ok) { KR.store.remove('deals', model.id); KR.go('agenda'); } });
    });
    ctx.cleanup(function () { if (KR.store.get('deals', model.id)) KR.store.put('deals', model, { silent: true }); });
    paintSide();
  }

  KR.view('agenda', {
    title: 'Agenda', icon: 'calendar',
    render: function (el, arg, ctx) {
      var d = arg ? KR.store.get('deals', arg) : null;
      if (d) renderDetail(el, d, ctx); else renderBoard(el, ctx);
    }
  });
})();
