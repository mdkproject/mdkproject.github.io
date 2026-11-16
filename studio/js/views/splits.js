/* KTRL Room · Split sheets
   Quién es dueño de qué en cada canción: autoría (obra, APDAYC) y máster (grabación, UNIMPRO / SONIEM).
   Se firma el mismo día de la sesión, antes de lanzar. */
(function () {
  'use strict';
  var KR = window.KR, esc = KR.esc;
  var ROLES = ['Letra', 'Letra e interpretación', 'Música', 'Producción y música', 'Interpretación', 'Arreglos', 'Mezcla y máster', 'Scratch', 'Sello o productor fonográfico', 'Otro'];
  var SOCIETIES = ['APDAYC', 'UNIMPRO', 'SONIEM', 'Otra', 'Ninguna'];

  function total(people, f) { return Math.round(KR.sum(people, function (p) { return KR.num(p[f], 0); }) * 100) / 100; }
  function pct(v) { return v == null || v === '' ? '—' : (Math.round(KR.num(v) * 100) / 100) + ' %'; }

  KR.splitDoc = function (s) {
    var prof = KR.store.doc('profile');
    var pubT = total(s.people, 'pub'), masT = total(s.people, 'master');
    return {
      kicker: prof.label || 'Lattice Rekords',
      title: 'Split sheet',
      subtitle: '«' + (s.song || 'Canción sin título') + '»',
      ref: s.isrc ? 'ISRC ' + s.isrc : 'Acuerdo de titularidad',
      date: s.date ? KR.fmtDateLong(s.date) : '',
      meta: [['Canción', s.song || 'Sin título'], ['Fecha de sesión', s.date ? KR.fmtDate(s.date, { year: true }) : 'Por definir'], ['Estudio', s.studio || '—'], ['Participantes', String(s.people.length)]],
      blocks: [
        { p: 'Las personas que firman acuerdan cómo se reparte la titularidad de la canción **«' + (s.song || 'sin título') + '»**. **Autoría** es la obra (letra y música) y la gestiona APDAYC. **Máster** es la grabación: los productores fonográficos cobran a través de UNIMPRO y los intérpretes a través de SONIEM.' },
        { table: {
          head: ['Nombre', 'Rol', 'Sociedad', 'IPI / CAE', '% Autoría', '% Máster'],
          widths: [3.2, 2.6, 1.5, 1.5, 1.2, 1.2], align: ['', '', '', '', 'r', 'r'],
          rows: s.people.map(function (p) { return [p.name || '—', p.role || '—', p.society || '—', p.ipi || '—', pct(p.pub), pct(p.master)]; }),
          foot: ['Total', '', '', '', pubT + ' %', masT + ' %']
        } },
        { h: 'Acuerdos' },
        { bullets: [
          'Estos porcentajes valen para la canción original y para sus versiones, remixes, ediciones y videos.',
          'Cada parte registra su porcentaje ante su sociedad de gestión colectiva y comparte su código IPI o CAE con las demás.',
          'Cualquier cambio requiere un nuevo documento firmado por todas las partes.',
          'Si alguien vende o cede su parte, la otra parte conserva la suya en los mismos términos.'
        ] }
      ].concat(s.notes ? [{ h: 'Notas' }, { p: s.notes }] : []),
      place: 'Firmado en ' + String(prof.city || 'Tacna').split(',')[0] + (s.date ? ', el ' + KR.fmtDateLong(s.date) : '') + '.',
      signatures: s.people.map(function (p) { return { role: p.role || 'Participante', name: p.name || '______________________', sub: 'DNI ' + (p.dni || '__________') }; }),
      footer: String(prof.web || '').replace(/^https?:\/\//, '').replace(/\/$/, '') + ' · ' + (prof.label || '') + ' · ' + prof.city,
      author: prof.name, subject: 'Split sheet de ' + (s.song || 'una canción')
    };
  };

  function renderList(el, ctx) {
    el.innerHTML = KR.head({
      title: 'Splits',
      lead: 'Antes de lanzar, que quede por escrito cuánto le toca a cada uno. Autoría es la obra; máster es la grabación.',
      actions: '<button class="btn solid" type="button" data-act="new">' + KR.icon('plus') + 'Nuevo split</button>'
    }) + '<div id="sp-list"></div>' +
      '<section class="explain grid-2"><div class="panel panel-pad"><span class="label">Autoría · la obra</span><p>La letra y la música de la canción. La gestiona <b>APDAYC</b>, que cobra por radio, shows, streaming y cualquier uso público.</p></div>' +
      '<div class="panel panel-pad"><span class="label">Máster · la grabación</span><p>El audio grabado. Los productores fonográficos cobran por <b>UNIMPRO</b> y los intérpretes y músicos por <b>SONIEM</b>.</p></div></section>';
    var $ = function (s) { return KR.$(s, el); };
    function paint() {
      var all = KR.store.list('splits');
      if (!all.length) { $('#sp-list').innerHTML = KR.empty({ icon: 'split', title: 'Aún no hay splits', text: 'Crea uno por canción y fírmenlo el mismo día de la sesión.', action: '<button class="btn solid" type="button" data-act="new">Nuevo split</button>' }); return; }
      $('#sp-list').innerHTML = '<div class="table-wrap"><table class="tbl"><thead><tr><th>Canción</th><th>Participantes</th><th class="r">Autoría</th><th class="r">Máster</th><th>Estado</th></tr></thead><tbody>' +
        all.map(function (s) {
          var a = total(s.people, 'pub'), m = total(s.people, 'master'), ok = a === 100 && m === 100;
          return '<tr class="click-row" data-href="#splits-' + s.id + '"><td><a href="#splits-' + s.id + '" class="t-title">' + esc(s.song || 'Sin título') + '</a><span class="t-sub">' + (s.date ? KR.fmtDate(s.date) : 'Sin fecha') + ' · ' + esc(s.studio || '') + '</span></td>' +
            '<td>' + esc(s.people.map(function (p) { return p.name; }).filter(Boolean).join(', ') || '—') + '</td>' +
            '<td class="r num">' + a + ' %</td><td class="r num">' + m + ' %</td><td>' + (ok ? KR.pill('Listo para firmar', 'good', 'check') : KR.pill('Faltan porcentajes', 'warn', 'warn')) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act="new"]')) {
        var prof = KR.store.doc('profile');
        var s = KR.store.put('splits', { song: '', date: KR.today(), studio: prof.label || '', isrc: '', notes: '', people: [
          { id: KR.uid('c'), name: prof.name + ' (' + prof.artist + ')', role: 'Producción y música', pub: 50, master: 50, society: 'APDAYC', ipi: '', dni: prof.dni || '' },
          { id: KR.uid('c'), name: '', role: 'Letra e interpretación', pub: 50, master: 50, society: 'APDAYC', ipi: '', dni: '' }
        ] });
        KR.go('splits-' + s.id); return;
      }
      var row = e.target.closest('[data-href]');
      if (row && !e.target.closest('a')) location.hash = row.getAttribute('data-href');
    });
    ctx.sub(function (ev) { if (ev.col === 'splits' || ev.type === 'reset') paint(); });
    paint();
  }

  function renderEditor(el, sp, ctx) {
    var model = KR.clone(sp);
    var save = KR.debounce(function () { KR.store.put('splits', model, { silent: true }); }, 300);
    el.innerHTML = KR.head({
      title: 'Split sheet', back: 'splits',
      lead: 'Los dos totales tienen que sumar 100 %. Se descarga en PDF con una línea de firma por persona.',
      actions: '<button class="btn ghost sm danger-text" type="button" data-act="delete">' + KR.icon('trash') + 'Borrar</button>'
    }) +
      '<div class="doc-layout"><div class="doc-form stack">' +
      '<section class="panel"><div class="panel-head"><h2>Canción</h2></div><div class="panel-pad form-grid" id="sp-meta">' +
      KR.field({ id: 's-song', name: 'song', label: 'Título', value: model.song, cls: 'full' }) +
      KR.field({ id: 's-date', name: 'date', label: 'Fecha de sesión', type: 'date', value: model.date }) +
      KR.field({ id: 's-studio', name: 'studio', label: 'Estudio', value: model.studio }) +
      KR.field({ id: 's-isrc', name: 'isrc', label: 'ISRC', value: model.isrc, hint: 'Si ya lo tienes. Formato PE-XXX-26-00001.' }) +
      KR.field({ id: 's-notes', name: 'notes', label: 'Notas', type: 'textarea', value: model.notes, cls: 'full', rows: 2 }) +
      '</div></section>' +
      '<section class="panel"><div class="panel-head"><h2>Participantes</h2><div class="row"><button class="btn sm ghost" type="button" data-act="even-pub">Autoría en partes iguales</button><button class="btn sm ghost" type="button" data-act="even-master">Máster en partes iguales</button></div></div>' +
      '<div class="people" id="people"></div>' +
      '<div class="panel-pad row between"><button class="btn sm" type="button" data-act="add">' + KR.icon('plus') + 'Agregar persona</button><div class="row" id="totals"></div></div></section>' +
      '</div><aside class="doc-side"><div class="doc-actions"><button class="btn solid" type="button" data-act="pdf">' + KR.icon('download') + 'Split sheet PDF</button></div>' +
      '<div class="paper-wrap" id="s-paper"></div></aside></div>';
    var $ = function (s) { return KR.$(s, el); };
    function personRow(p, i) {
      return '<div class="person" data-id="' + p.id + '">' +
        '<span class="person-n num">' + (i + 1) + '</span>' +
        KR.field({ id: 'p-name-' + p.id, name: 'name', label: 'Nombre', value: p.name, cls: 'p-name' }) +
        KR.field({ id: 'p-role-' + p.id, name: 'role', label: 'Rol', value: p.role, attrs: 'list="role-list"', cls: 'p-role' }) +
        KR.field({ id: 'p-pub-' + p.id, name: 'pub', label: '% Autoría', type: 'number', value: p.pub == null ? '' : p.pub, attrs: 'min="0" max="100" step="0.5" inputmode="decimal"', cls: 'p-pub' }) +
        KR.field({ id: 'p-master-' + p.id, name: 'master', label: '% Máster', type: 'number', value: p.master == null ? '' : p.master, attrs: 'min="0" max="100" step="0.5" inputmode="decimal"', cls: 'p-master' }) +
        KR.field({ id: 'p-soc-' + p.id, name: 'society', label: 'Sociedad', type: 'select', value: p.society || 'Ninguna', options: SOCIETIES, cls: 'p-soc' }) +
        KR.field({ id: 'p-ipi-' + p.id, name: 'ipi', label: 'IPI / CAE', value: p.ipi, cls: 'p-ipi' }) +
        KR.field({ id: 'p-dni-' + p.id, name: 'dni', label: 'DNI', value: p.dni, attrs: 'inputmode="numeric"', cls: 'p-dni' }) +
        '<button class="icon-btn sm person-x" type="button" data-del aria-label="Quitar a ' + esc(p.name || 'esta persona') + '">' + KR.icon('x') + '</button></div>';
    }
    function paintPeople() {
      $('#people').innerHTML = model.people.map(personRow).join('') + '<datalist id="role-list">' + ROLES.map(function (r) { return '<option value="' + r + '">'; }).join('') + '</datalist>';
      paint();
    }
    function paint() {
      var a = total(model.people, 'pub'), m = total(model.people, 'master');
      $('#totals').innerHTML = KR.pill('Autoría ' + a + ' %', a === 100 ? 'good' : 'bad', a === 100 ? 'check' : 'warn') + KR.pill('Máster ' + m + ' %', m === 100 ? 'good' : 'bad', m === 100 ? 'check' : 'warn');
      $('#s-paper').innerHTML = KR.pdf.docHTML(KR.splitDoc(model));
    }
    $('#sp-meta').addEventListener('input', function (e) { if (e.target.name) { model[e.target.name] = e.target.value; paint(); save(); } });
    $('#people').addEventListener('input', function (e) {
      var row = e.target.closest('.person'); if (!row || !e.target.name) return;
      var p = model.people.find(function (x) { return x.id === row.getAttribute('data-id'); });
      var v = e.target.value;
      p[e.target.name] = (e.target.name === 'pub' || e.target.name === 'master') ? (v === '' ? null : KR.num(v)) : v;
      paint(); save();
    });
    el.addEventListener('click', function (e) {
      var del = e.target.closest('[data-del]');
      if (del) {
        var id = del.closest('.person').getAttribute('data-id');
        model.people = model.people.filter(function (p) { return p.id !== id; });
        paintPeople(); save(); return;
      }
      var a = e.target.closest('[data-act]'); if (!a) return;
      var act = a.getAttribute('data-act');
      if (act === 'add') { model.people.push({ id: KR.uid('c'), name: '', role: '', pub: null, master: null, society: 'APDAYC', ipi: '', dni: '' }); paintPeople(); save(); var ins = KR.$$('.person', el); var last = ins[ins.length - 1]; if (last) last.querySelector('input').focus(); }
      if (act === 'even-pub' || act === 'even-master') {
        var f = act === 'even-pub' ? 'pub' : 'master', nn = model.people.length;
        if (!nn) return;
        var share = Math.floor(10000 / nn) / 100, rest = Math.round((100 - share * nn) * 100) / 100;
        model.people.forEach(function (p, i) { p[f] = i === 0 ? Math.round((share + rest) * 100) / 100 : share; });
        paintPeople(); save();
      }
      if (act === 'pdf') {
        var a2 = total(model.people, 'pub'), m2 = total(model.people, 'master');
        var go = function () {
          var bytes = KR.pdf.renderDoc(KR.splitDoc(model));
          KR.saveFile('split-sheet-' + KR.slug(model.song || 'cancion') + '.pdf', new Blob([bytes], { type: 'application/pdf' }), 'application/pdf');
        };
        if (a2 !== 100 || m2 !== 100) {
          KR.dialog({ title: 'Los totales no suman 100 %', body: '<p>Autoría suma ' + a2 + ' % y máster ' + m2 + ' %. ¿Descargar igual como borrador?</p>', ok: 'Descargar borrador' }).then(function (ok) { if (ok) go(); });
        } else go();
      }
      if (act === 'delete') {
        KR.confirm('¿Borrar este split?', 'Se borra el acuerdo de "' + (model.song || 'sin título') + '".').then(function (ok) { if (ok) { KR.store.remove('splits', model.id); KR.go('splits'); } });
      }
    });
    ctx.cleanup(function () { if (KR.store.get('splits', model.id)) KR.store.put('splits', model, { silent: true }); });
    paintPeople();
  }

  KR.view('splits', {
    title: 'Splits', icon: 'split',
    render: function (el, arg, ctx) {
      var sp = arg ? KR.store.get('splits', arg) : null;
      if (sp) renderEditor(el, sp, ctx); else renderList(el, ctx);
    }
  });
})();
