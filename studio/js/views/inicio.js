/* KTRL Room · Inicio
   Lo primero que ves al abrir: la próxima fecha, la plata por cobrar y lo que está pendiente en cada frente. */
(function () {
  'use strict';
  var KR = window.KR, esc = KR.esc;

  function greeting() {
    var h = new Date().getHours();
    return h < 5 ? 'Buenas noches' : h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  }

  /* todo lo que tiene fecha: trabajos de la agenda, eventos y lanzamientos */
  function upcoming(days) {
    var out = [];
    KR.store.list('deals').forEach(function (d) {
      if (!d.date || d.stage === 'perdido' || d.stage === 'cobrado') return;
      var n = KR.daysUntil(d.date); if (n < 0 || n > days) return;
      var t = KR.DEAL_TYPES[d.type] || KR.DEAL_TYPES.otro;
      out.push({ date: d.date, time: d.time, title: d.title, sub: t.label + (d.client ? ' · ' + d.client : ''), href: '#agenda-' + d.id, tone: t.tone, tag: (KR.STAGES.find(function (s) { return s.id === d.stage; }) || {}).label });
    });
    KR.store.list('events').forEach(function (e) {
      if (!e.date || e.status === 'cancelado') return;
      var n = KR.daysUntil(e.date); if (n < 0 || n > days) return;
      out.push({ date: e.date, time: e.start, title: e.name, sub: 'Evento' + (e.city ? ' · ' + e.city : ''), href: '#eventos-' + e.id, tone: 'amber', tag: 'Evento' });
    });
    KR.store.list('releases').forEach(function (r) {
      if (!r.date || r.status === 'publicado') return;
      var n = KR.daysUntil(r.date); if (n < 0 || n > days) return;
      out.push({ date: r.date, title: r.title, sub: 'Lanzamiento · ' + (r.kind || ''), href: '#lanzamientos-' + r.id, tone: 'coral', tag: 'Lanzamiento' });
    });
    return out.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : String(a.time || '') < String(b.time || '') ? -1 : 1; });
  }

  function pending() {
    var items = [];
    var deals = KR.store.list('deals');
    var consult = deals.filter(function (d) { return d.stage === 'consulta'; });
    if (consult.length) items.push({ icon: 'chat', text: KR.plural(consult.length, 'consulta sin cotizar', 'consultas sin cotizar'), href: '#agenda', tone: 'warn' });
    var quoted = deals.filter(function (d) { return d.stage === 'cotizado'; });
    if (quoted.length) items.push({ icon: 'send', text: KR.plural(quoted.length, 'cotización esperando respuesta', 'cotizaciones esperando respuesta'), href: '#agenda' });
    var owed = deals.filter(function (d) { return d.stage === 'realizado' && KR.dealDue(d) > 0; });
    if (owed.length) items.push({ icon: 'money', text: KR.plural(owed.length, 'trabajo hecho sin cobrar', 'trabajos hechos sin cobrar') + ' · ' + KR.money(KR.sum(owed, KR.dealDue)), href: '#agenda', tone: 'bad' });
    var beats = KR.store.list('beats');
    var noData = beats.filter(function (b) { return !b.bpm || !b.key; });
    if (noData.length) items.push({ icon: 'wave', text: KR.plural(noData.length, 'beat sin BPM o tonalidad', 'beats sin BPM o tonalidad'), href: '#analizar' });
    var splits = KR.store.list('splits').filter(function (s) {
      var a = KR.sum(s.people, function (p) { return KR.num(p.pub, 0); }), m = KR.sum(s.people, function (p) { return KR.num(p.master, 0); });
      return Math.round(a) !== 100 || Math.round(m) !== 100;
    });
    if (splits.length) items.push({ icon: 'split', text: KR.plural(splits.length, 'split sheet sin completar', 'split sheets sin completar'), href: '#splits' });
    var lic = KR.store.list('licenses').filter(function (l) { return l.status === 'firmada'; });
    if (lic.length) items.push({ icon: 'doc', text: KR.plural(lic.length, 'licencia firmada sin pagar', 'licencias firmadas sin pagar'), href: '#licencias', tone: 'warn' });
    var rel = KR.store.list('releases').filter(function (r) { return r.status !== 'publicado' && r.date && KR.daysUntil(r.date) >= 0; });
    rel.forEach(function (r) {
      var left = KR.releaseLeft ? KR.releaseLeft(r) : 0;
      if (left) items.push({ icon: 'rocket', text: r.title + ': ' + KR.plural(left, 'tarea pendiente', 'tareas pendientes') + ' para el lanzamiento', href: '#lanzamientos-' + r.id });
    });
    if (KR.store.doc('settings').pricesAreExample) items.push({ icon: 'faders', text: 'Los precios de licencias son de ejemplo: pon los tuyos', href: '#ajustes' });
    if (!KR.store.doc('profile').dni) items.push({ icon: 'user', text: 'Agrega tu DNI para que salga en contratos y splits', href: '#ajustes' });
    return items;
  }

  KR.view('inicio', {
    title: 'Inicio', icon: 'home',
    render: function (el, arg, ctx) {
      var prof = KR.store.doc('profile');
      var first = (prof.name || prof.artist || '').split(' ')[0];
      var today = new Date();
      el.innerHTML =
        '<section class="hero-home">' +
        '<div class="hh-copy"><span class="label">' + esc(KR.DIA[today.getDay()]) + ' ' + today.getDate() + ' de ' + KR.MES_L[today.getMonth()] + ' · ' + esc(prof.label || '') + '</span>' +
        '<h1 class="hh-title">' + greeting() + ', <span>' + esc(first || 'MD KTRL') + '</span></h1>' +
        '<p class="hh-lead">' + esc(prof.genres || '') + '. Esto es lo que tienes en marcha.</p></div>' +
        '<div class="hh-next" id="hh-next"></div></section>' +
        '<dl class="kpis" id="home-kpis"></dl>' +
        '<div class="home-grid">' +
        '<section class="panel"><div class="panel-head"><h2>Próximos 30 días</h2><a class="crumb" href="#agenda">Agenda ' + KR.icon('arrow') + '</a></div><div class="panel-pad" id="home-next"></div></section>' +
        '<section class="panel"><div class="panel-head"><h2>Pendientes</h2><span class="label" id="pend-count"></span></div><div class="panel-pad" id="home-pend"></div></section>' +
        '</div>' +
        '<section class="panel"><div class="panel-head"><h2>Ingresos por mes</h2><span class="label">cobrado y por cobrar</span></div><div class="panel-pad" id="home-income"></div></section>' +
        '<section class="quick"><h2 class="section-title">Atajos</h2><div class="quick-grid">' +
        [['#analizar', 'wave', 'Analizar un beat', 'BPM, tono y LUFS'],
          ['#licencias-nuevo', 'doc', 'Nueva licencia', 'Cotización y contrato'],
          ['#eventos', 'ticket', 'Armar un evento', 'Lineup y presupuesto'],
          ['#afiches', 'poster', 'Hacer un afiche', 'Post, historia o flyer'],
          ['#set', 'headphones', 'Ordenar un set', 'Por Camelot y energía'],
          ['#textos', 'chat', 'Responder un mensaje', 'Plantillas y Claude']].map(function (q) {
          return '<a class="quick-item" href="' + q[0] + '">' + KR.icon(q[1]) + '<b>' + q[2] + '</b><span>' + q[3] + '</span></a>';
        }).join('') + '</div></section>';

      var $ = function (s) { return KR.$(s, el); };
      function paint() {
        var deals = KR.store.list('deals'), y = today.getFullYear();
        var owed = KR.sum(deals.filter(function (d) { return d.stage === 'confirmado' || d.stage === 'realizado'; }), KR.dealDue);
        var paidYear = KR.sum(deals.filter(function (d) { var dd = KR.parseDate(d.date); return dd && dd.getFullYear() === y; }), function (d) { return KR.num(d.paid, 0); });
        var beats = KR.store.list('beats');
        var lics = KR.store.list('licenses').filter(function (l) { return String(l.date).slice(0, 4) === String(y); });
        $('#home-kpis').innerHTML =
          '<div class="kpi amber"><dt>Por cobrar</dt><dd class="k-val">' + KR.money(owed) + '</dd></div>' +
          '<div class="kpi"><dt>Cobrado en ' + y + '</dt><dd class="k-val">' + KR.money(paidYear) + '</dd></div>' +
          '<div class="kpi"><dt>Beats disponibles</dt><dd class="k-val">' + beats.filter(function (b) { return (b.status || 'disponible') === 'disponible'; }).length + '</dd></div>' +
          '<div class="kpi coral"><dt>Licencias ' + y + '</dt><dd class="k-val">' + lics.length + '</dd></div>';

        var next = upcoming(365)[0];
        var box = $('#hh-next');
        if (next) {
          var n = KR.daysUntil(next.date);
          box.innerHTML = '<a class="next-card" href="' + next.href + '"><span class="label">Próxima fecha</span>' +
            '<b class="next-n">' + (n === 0 ? 'HOY' : n) + '</b>' + (n === 0 ? '' : '<span class="next-u">' + (n === 1 ? 'día' : 'días') + '</span>') +
            '<span class="next-t">' + esc(next.title) + '</span><span class="next-s">' + KR.fmtDate(next.date, { weekday: true }) + (next.time ? ' · ' + esc(next.time) : '') + ' · ' + esc(next.sub) + '</span></a>';
        } else {
          box.innerHTML = '<div class="next-card empty-next"><span class="label">Próxima fecha</span><b class="next-n faint">LIBRE</b><span class="next-t">Nada agendado</span>' +
            '<button class="btn sm" type="button" data-act="new-deal">' + KR.icon('plus') + 'Anotar un trabajo</button></div>';
        }
        var up = upcoming(30);
        $('#home-next').innerHTML = up.length ? '<ul class="log">' + up.map(function (u) {
          return '<li><span class="when num">' + KR.fmtDate(u.date) + '<br><small>' + KR.relDays(u.date) + '</small></span><a class="what" href="' + u.href + '"><b>' + esc(u.title) + '</b><span><i class="dot ' + u.tone + '"></i> ' + esc(u.sub) + '</span></a>' + (u.tag ? KR.pill(u.tag) : '') + '</li>';
        }).join('') + '</ul>' : KR.empty({ icon: 'calendar', title: 'Sin fechas en los próximos 30 días', text: 'Cuando confirmes un set, un evento o un lanzamiento, aparece aquí con su cuenta regresiva.', action: '<button class="btn sm" type="button" data-act="new-deal">Anotar un trabajo</button>' });
        var pend = pending();
        $('#pend-count').textContent = pend.length ? String(pend.length) : '';
        $('#home-pend').innerHTML = pend.length ? '<ul class="todo">' + pend.map(function (p) {
          return '<li class="' + (p.tone || '') + '"><a href="' + p.href + '">' + KR.icon(p.icon) + '<span>' + esc(p.text) + '</span>' + KR.icon('arrow', 'go') + '</a></li>';
        }).join('') + '</ul>' : '<p class="muted">Todo al día.</p>';
        KR.incomeChart($('#home-income'));
      }
      el.addEventListener('click', function (e) { if (e.target.closest('[data-act="new-deal"]')) KR.newDeal(); });
      ctx.sub(function () { paint(); });
      paint();
    }
  });
})();
