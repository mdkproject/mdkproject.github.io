/* KTRL Room · Lanzamientos
   Cuenta regresiva por lanzamiento con las tareas de cada semana (máster, portada, distribuidora, pitch,
   teasers, anuncio, web y press kit) y la fila lista para pegar en la discografía de la web. */
(function () {
  'use strict';
  var KR = window.KR, esc = KR.esc;

  var TASKS = [
    { id: 'master', d: -28, t: 'Máster final aprobado', s: 'Revisa LUFS y pico real en el Analizador.' },
    { id: 'split', d: -28, t: 'Split sheet firmado', s: 'Si hay colaboradores.' },
    { id: 'cover', d: -21, t: 'Portada de 3000 × 3000 px', s: 'JPG o PNG, sin bordes ni logos de plataformas.' },
    { id: 'distro', d: -21, t: 'Subido a la distribuidora', s: 'Con tres semanas hay tiempo para el pitch editorial.' },
    { id: 'pitch', d: -18, t: 'Pitch en Spotify for Artists', s: 'Género, mood, instrumentos y la historia del tema.' },
    { id: 'teaser', d: -14, t: 'Teaser vertical para Reels y TikTok', s: '15 a 30 segundos con el mejor momento.' },
    { id: 'art', d: -10, t: 'Arte del anuncio', s: 'Hazlo en Afiches con el estilo del lanzamiento.' },
    { id: 'announce', d: -7, t: 'Anuncio con fecha en Instagram', s: 'Post fijado e historia con cuenta regresiva.' },
    { id: 'presave', d: -3, t: 'Enlace de pre-guardado', s: 'En la bio de Instagram y TikTok.' },
    { id: 'release', d: 0, t: 'Publicado en SoundCloud y YouTube', s: 'El mismo día que sale en plataformas.' },
    { id: 'web', d: 0, t: 'Discografía de la web actualizada', s: 'Copia la fila de abajo en index.html.' },
    { id: 'stories', d: 1, t: 'Historias con reacciones', s: 'Comparte a quienes lo publiquen.' },
    { id: 'recap', d: 7, t: 'Agradecimiento y números de la primera semana', s: 'Reproducciones, guardados y playlists.' },
    { id: 'presskit', d: 7, t: 'Press kit al día', s: 'Agrega el lanzamiento y las cifras nuevas.' }
  ];
  var KINDS = ['Single', 'EP', 'Álbum', 'Álbum de instrumentales', 'EP de instrumentales', 'Recopilación de instrumentales', 'Remix', 'Producción para otro artista'];
  var STATUS = { plan: { label: 'En preparación', tone: 'amber' }, listo: { label: 'Listo para salir', tone: 'warn' }, publicado: { label: 'Publicado', tone: 'good' } };

  KR.releaseLeft = function (r) { return TASKS.filter(function (t) { return !(r.tasks || {})[t.id]; }).length; };
  function category(r) { return r.alias === 'Bness' || /instrumental/i.test(r.kind) ? 'beats' : /otro artista|producci/i.test(r.kind) ? 'colab' : 'elec'; }
  function tagOf(r) { var c = category(r); return c === 'beats' ? 'Beats' : c === 'colab' ? 'Producción' : (/álbum/i.test(r.kind) ? 'Álbum' : /ep/i.test(r.kind) ? 'EP' : r.kind || 'Single'); }

  function siteRow(r) {
    var slug = KR.slug(r.title), img = 'img/' + slug + '.webp', date = KR.parseDate(r.date);
    var dateTxt = date ? date.getDate() + ' ' + KR.MES[date.getMonth()] + ' ' + date.getFullYear() : '';
    var url = r.url || '';
    var e = function (s) { return KR.esc(s); };
    return '<li data-c="' + category(r) + '" style="--art: url(' + img + ')">\n' +
      '  <time datetime="' + e(r.date || '') + '">' + e(dateTxt) + '</time>\n' +
      (url ? '  <a class="sleeve" href="' + e(url) + '" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">\n' : '  <div class="sleeve">\n') +
      '    <span class="disc"><i></i></span>\n' +
      '    <span class="cover"><img src="' + img + '" alt="" width="540" height="540" loading="lazy"></span>\n' +
      (url ? '  </a>\n' : '  </div>\n') +
      '  <div class="body">\n' +
      '    <h3>' + e(r.title) + '<small>' + e(r.kind || '') + '</small></h3>\n' +
      '    <div class="more">\n' +
      '      <p>' + e(r.blurb || 'Descripción del lanzamiento.') + '</p>\n' +
      (url ? '      <div class="links">\n' +
        '        <button class="play" type="button" data-sc="' + e(url) + '" data-title="' + e(r.title) + '" data-artist="' + e(r.alias || 'MD KTRL') + '" data-cover="' + img + '"><svg class="ico i-p" aria-hidden="true"><use href="#i-play"/></svg><svg class="ico i-q" aria-hidden="true"><use href="#i-pause"/></svg><span class="t-play">Reproducir</span><span class="t-pause">Pausar</span></button>\n' +
        '        <a class="listen" href="' + e(url) + '" target="_blank" rel="noopener">Escuchar en SoundCloud</a>\n' +
        '      </div>\n' : '') +
      '    </div>\n  </div>\n' +
      '  <span class="tag">' + e(tagOf(r)) + '</span>\n</li>';
  }

  function renderList(el, ctx) {
    el.innerHTML = KR.head({
      title: 'Lanzamientos',
      lead: 'Cada lanzamiento con su cuenta regresiva: qué hacer cuatro semanas antes, el día y la semana después.',
      actions: '<button class="btn solid" type="button" data-act="new">' + KR.icon('plus') + 'Nuevo lanzamiento</button>'
    }) + '<div id="rel-list"></div>';
    function paint() {
      var all = KR.store.list('releases').slice().sort(function (a, b) { return (b.date || '') > (a.date || '') ? 1 : -1; });
      var upcoming = all.filter(function (r) { return r.status !== 'publicado'; });
      var done = all.filter(function (r) { return r.status === 'publicado'; });
      var block = function (title, list) {
        return '<section class="rel-block"><h2 class="section-title">' + title + '</h2>' + (list.length ? '<ul class="log">' + list.map(function (r) {
          var left = KR.releaseLeft(r), s = STATUS[r.status] || STATUS.plan;
          return '<li><span class="when num">' + (r.date ? KR.fmtDate(r.date, { year: true }) : 'Sin fecha') + (r.date && r.status !== 'publicado' ? '<br><small>' + KR.relDays(r.date) + '</small>' : '') + '</span>' +
            '<a class="what" href="#lanzamientos-' + r.id + '"><b>' + esc(r.title) + '</b><span>' + esc([r.kind, r.alias].filter(Boolean).join(' · ')) + '</span></a>' +
            '<span class="row">' + (r.status !== 'publicado' ? KR.pill(left ? KR.plural(left, 'tarea', 'tareas') : 'Todo listo', left ? '' : 'good') : '') + KR.pill(s.label, s.tone) + '</span></li>';
        }).join('') + '</ul>' : '<p class="muted">Nada por aquí.</p>') + '</section>';
      };
      KR.$('#rel-list', el).innerHTML = block('En camino', upcoming) + block('Publicados', done);
    }
    el.addEventListener('click', function (e) {
      if (!e.target.closest('[data-act="new"]')) return;
      var r = KR.store.put('releases', { title: 'Nuevo lanzamiento', kind: 'Single', alias: KR.store.doc('profile').artist, date: KR.addDays(KR.today(), 28), status: 'plan', url: '', distributor: '', blurb: '', tasks: {} });
      KR.go('lanzamientos-' + r.id);
    });
    ctx.sub(function (ev) { if (ev.col === 'releases' || ev.type === 'reset') paint(); });
    paint();
  }

  function renderDetail(el, rel, ctx) {
    var model = KR.clone(rel); model.tasks = model.tasks || {};
    var save = KR.debounce(function () { KR.store.put('releases', model, { silent: true }); }, 300);
    var prof = KR.store.doc('profile');
    el.innerHTML = KR.head({
      title: model.title, back: 'lanzamientos', lead: '<span id="rel-lead"></span>',
      actions: '<button class="btn ghost sm danger-text" type="button" data-act="delete">' + KR.icon('trash') + 'Borrar</button>'
    }) +
      '<div class="split"><div class="stack">' +
      '<section class="panel"><div class="panel-head"><h2>Cuenta regresiva</h2><span class="label" id="rel-count"></span></div><ol class="tasks" id="tasks"></ol></section>' +
      '<section class="panel"><div class="panel-head"><h2>Fila para la web</h2><button class="btn sm" type="button" data-act="copy-row">' + KR.icon('copy') + 'Copiar HTML</button></div>' +
      '<div class="panel-pad stack"><p class="hint">Pégala al inicio de <code>&lt;ol class="log" id="log"&gt;</code> en index.html y sube la portada como <code id="img-name"></code>.</p><pre class="code" id="row-code"></pre></div></section>' +
      '</div>' +
      '<form class="panel" id="rel-form" autocomplete="off"><div class="panel-head"><h2>Datos</h2></div><div class="panel-pad form-grid">' +
      KR.field({ id: 'r-title', name: 'title', label: 'Título', value: model.title, cls: 'full' }) +
      KR.field({ id: 'r-kind', name: 'kind', label: 'Tipo', value: model.kind, attrs: 'list="kind-list"' }) +
      KR.field({ id: 'r-alias', name: 'alias', label: 'Como', type: 'select', value: model.alias, options: [prof.artist, prof.alias].filter(Boolean) }) +
      KR.field({ id: 'r-date', name: 'date', label: 'Fecha de salida', type: 'date', value: model.date }) +
      KR.field({ id: 'r-status', name: 'status', label: 'Estado', type: 'select', value: model.status, options: Object.keys(STATUS).map(function (k) { return { value: k, label: STATUS[k].label }; }) }) +
      KR.field({ id: 'r-dist', name: 'distributor', label: 'Distribuidora', value: model.distributor, attrs: 'placeholder="DistroKid, OneRPM, CD Baby…"' }) +
      KR.field({ id: 'r-url', name: 'url', label: 'Enlace de SoundCloud', type: 'url', value: model.url, cls: 'full' }) +
      KR.field({ id: 'r-blurb', name: 'blurb', label: 'Descripción para la web', type: 'textarea', value: model.blurb, cls: 'full', rows: 3, hint: 'Una o dos frases, como las de tu discografía.' }) +
      '</div><datalist id="kind-list">' + KINDS.map(function (k) { return '<option value="' + k + '">'; }).join('') + '</datalist></form></div>';
    var $ = function (s) { return KR.$(s, el); };
    function paint() {
      var s = STATUS[model.status] || STATUS.plan;
      $('#rel-lead').innerHTML = KR.pill(s.label, s.tone) + ' ' + esc([model.kind, model.alias].filter(Boolean).join(' · ')) + (model.date ? ' · sale el ' + KR.fmtDate(model.date, { weekday: true, year: true }) + ' (' + KR.relDays(model.date) + ')' : '');
      var h = el.querySelector('.bar-title'); if (h) h.textContent = model.title;
      var today = KR.today();
      $('#tasks').innerHTML = TASKS.map(function (t) {
        var due = model.date ? KR.addDays(model.date, t.d) : null, done = !!model.tasks[t.id];
        var late = !done && due && due < today;
        return '<li class="' + (done ? 'done' : late ? 'late' : '') + '"><label class="check"><input type="checkbox" data-task="' + t.id + '"' + (done ? ' checked' : '') + '>' +
          '<span><b>' + esc(t.t) + '</b><small>' + esc(t.s) + '</small></span></label>' +
          '<span class="t-when num">' + (t.d === 0 ? 'Día D' : (t.d < 0 ? 'D' + t.d : 'D+' + t.d)) + (due ? '<small>' + KR.fmtDate(due) + '</small>' : '') + (late ? KR.pill('Atrasada', 'bad') : '') + '</span></li>';
      }).join('');
      var left = KR.releaseLeft(model);
      $('#rel-count').textContent = (TASKS.length - left) + ' / ' + TASKS.length;
      $('#row-code').textContent = siteRow(model);
      $('#img-name').textContent = 'img/' + KR.slug(model.title) + '.webp';
    }
    $('#rel-form').addEventListener('input', function (e) { if (e.target.name) { model[e.target.name] = e.target.value; paint(); save(); } });
    el.addEventListener('change', function (e) { var t = e.target.getAttribute('data-task'); if (t) { model.tasks[t] = e.target.checked; paint(); save(); } });
    el.addEventListener('click', function (e) {
      var a = e.target.closest('[data-act]'); if (!a) return;
      if (a.getAttribute('data-act') === 'copy-row') KR.copy(siteRow(model), 'Fila copiada');
      if (a.getAttribute('data-act') === 'delete') KR.confirm('¿Borrar "' + model.title + '"?', 'Se borra con su lista de tareas.').then(function (ok) { if (ok) { KR.store.remove('releases', model.id); KR.go('lanzamientos'); } });
    });
    ctx.cleanup(function () { if (KR.store.get('releases', model.id)) KR.store.put('releases', model, { silent: true }); });
    paint();
  }

  KR.view('lanzamientos', {
    title: 'Lanzamientos', icon: 'rocket',
    render: function (el, arg, ctx) {
      var r = arg ? KR.store.get('releases', arg) : null;
      if (r) renderDetail(el, r, ctx); else renderList(el, ctx);
    }
  });
})();
