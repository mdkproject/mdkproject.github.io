/* KTRL Room · Catálogo de beats (Bness)
   Lista filtrable por estado, BPM y tonalidad compatible. Desde aquí se cotiza una licencia. */
(function () {
  'use strict';
  var KR = window.KR, M = KR.music, esc = KR.esc;
  var ui = { q: '', status: 'all', compat: '', bpmLo: '', bpmHi: '' };

  var STATUS = {
    disponible: { label: 'Disponible', tone: 'good' },
    reservado: { label: 'Reservado', tone: 'warn' },
    vendido: { label: 'Vendido en exclusiva', tone: 'silver' }
  };
  KR.BEAT_STATUS = STATUS;

  function keyCell(k, notation) {
    var key = M.parseKey(k);
    if (!key) return '<span class="faint">—</span>';
    return '<span class="keychip"><b>' + M.camelotStr(key) + '</b><small>' + esc(notation === 'es' ? M.esName(key) : M.stdName(key)) + '</small></span>';
  }
  function beatForm(b) {
    var keyOpts = [{ value: '', label: 'Sin definir' }];
    for (var n = 1; n <= 12; n++) ['A', 'B'].forEach(function (l) { keyOpts.push({ value: n + l, label: n + l + ' · ' + M.stdName(M.fromCamelot(n, l)) + ' · ' + M.esName(M.fromCamelot(n, l)) }); });
    var k = M.parseKey(b.key);
    return '<div class="form-grid">' +
      KR.field({ id: 'bf-title', name: 'title', label: 'Título', value: b.title, cls: 'full', attrs: 'required autofocus' }) +
      KR.field({ id: 'bf-project', name: 'project', label: 'Proyecto o tape', value: b.project, hint: 'Key, Rest in Beats, Raw Tapes…' }) +
      KR.field({ id: 'bf-genre', name: 'genre', label: 'Género', value: b.genre, attrs: 'list="genre-list"' }) +
      KR.field({ id: 'bf-bpm', name: 'bpm', label: 'BPM', type: 'number', value: b.bpm || '', attrs: 'step="0.1" inputmode="decimal"' }) +
      KR.field({ id: 'bf-key', name: 'key', label: 'Tonalidad', type: 'select', options: keyOpts, value: k ? M.camelotStr(k) : '' }) +
      KR.field({ id: 'bf-mood', name: 'mood', label: 'Mood', value: b.mood, hint: 'Oscuro, nostálgico, bailable…' }) +
      KR.field({ id: 'bf-status', name: 'status', label: 'Estado', type: 'select', value: b.status || 'disponible', options: Object.keys(STATUS).map(function (s) { return { value: s, label: STATUS[s].label }; }) }) +
      KR.field({ id: 'bf-url', name: 'url', label: 'Enlace (SoundCloud, Drive…)', type: 'url', value: b.url, cls: 'full' }) +
      KR.field({ id: 'bf-notes', name: 'notes', label: 'Notas', type: 'textarea', value: b.notes, cls: 'full', rows: 2 }) +
      '</div><datalist id="genre-list">' + ['Boom bap', 'Trap', 'Pluggnb', 'Drill', 'Lo-fi', 'R&B', 'Reggaetón', 'Dembow', 'House', 'Afro'].map(function (g) { return '<option value="' + g + '">'; }).join('') + '</datalist>';
  }
  KR.editBeat = function (b) {
    b = b || { status: 'disponible' };
    return KR.dialog({
      title: b.id ? 'Editar beat' : 'Agregar beat', ok: 'Guardar', wide: true, body: beatForm(b),
      read: function (d) {
        var fd = KR.formData(d);
        if (!fd.title.trim()) { d.querySelector('#bf-title').focus(); return false; }
        return fd;
      }
    }).then(function (fd) {
      if (!fd) return null;
      var saved = KR.store.put('beats', Object.assign({}, b, fd, { bpm: fd.bpm ? KR.num(fd.bpm) : null, title: fd.title.trim() }));
      KR.toast(b.id ? 'Beat actualizado' : 'Beat agregado al catálogo');
      return saved;
    });
  };

  KR.view('beats', {
    title: 'Catálogo', short: 'Beats', icon: 'disc',
    render: function (el, arg, ctx) {
      var st = KR.store.doc('settings'), prof = KR.store.doc('profile');
      el.innerHTML = KR.head({
        title: 'Catálogo',
        lead: 'Los beats de <b>' + esc(prof.alias || 'Bness') + '</b>. Analiza los audios para completar BPM y tonalidad, y cotiza una licencia desde cada fila.',
        actions: '<a class="btn ghost" href="#analizar">' + KR.icon('wave') + 'Analizar audios</a>' +
          '<button class="btn solid" type="button" data-act="add">' + KR.icon('plus') + 'Agregar beat</button>'
      }) +
        '<dl class="kpis" id="beat-kpis"></dl>' +
        (st.promo3x2 ? '<p class="note promo">' + KR.icon('sparkle') + '<span><b>Promo 3x2 activa.</b> Al cotizar tres beats, el más barato va de regalo. Se aceptan efectivo, donaciones, juguetes para niños y comida para albergues.</span></p>' : '') +
        '<div class="toolbar beats-tools">' +
        '<label class="search"><span class="sr">Buscar</span>' + KR.icon('search') + '<input class="field-in" type="search" id="b-q" placeholder="Buscar por título, proyecto o mood" value="' + esc(ui.q) + '"></label>' +
        '<div class="chips" id="b-status">' + [['all', 'Todos'], ['disponible', 'Disponibles'], ['reservado', 'Reservados'], ['vendido', 'Vendidos']].map(function (c) {
          return '<button class="chip" type="button" data-s="' + c[0] + '" aria-pressed="' + (ui.status === c[0]) + '">' + c[1] + ' <span class="n" data-n="' + c[0] + '"></span></button>';
        }).join('') + '</div>' +
        '<div class="row bpm-filter"><label class="label" for="b-lo">BPM</label><input class="field-in num" id="b-lo" type="number" placeholder="de" value="' + esc(ui.bpmLo) + '" inputmode="numeric"><input class="field-in num" id="b-hi" type="number" placeholder="a" value="' + esc(ui.bpmHi) + '" inputmode="numeric" aria-label="BPM hasta"></div>' +
        '<div class="row"><label class="label" for="b-compat">Compatible con</label><select class="field-in" id="b-compat"><option value="">Cualquier tono</option>' +
        (function () { var o = ''; for (var n = 1; n <= 12; n++) ['A', 'B'].forEach(function (l) { var code = n + l; o += '<option value="' + code + '"' + (ui.compat === code ? ' selected' : '') + '>' + code + ' · ' + M.stdName(M.fromCamelot(n, l)) + '</option>'; }); return o; })() +
        '</select></div>' +
        '</div>' +
        '<div id="beat-list"></div>' +
        '<div class="row between beats-foot"><span class="hint" id="b-count"></span><div class="row">' +
        '<button class="btn ghost sm" type="button" data-act="import">' + KR.icon('list') + 'Pegar lista de títulos</button>' +
        '<button class="btn ghost sm" type="button" data-act="csv">' + KR.icon('download') + 'Exportar CSV</button></div></div>';

      var $ = function (s) { return KR.$(s, el); };
      function filtered() {
        var q = ui.q.trim().toLowerCase(), lo = KR.num(ui.bpmLo, 0), hi = KR.num(ui.bpmHi, 0);
        var ck = ui.compat ? M.parseKey(ui.compat) : null;
        return KR.store.list('beats').filter(function (b) {
          if (ui.status !== 'all' && (b.status || 'disponible') !== ui.status) return false;
          if (q && [b.title, b.project, b.mood, b.genre, b.notes].join(' ').toLowerCase().indexOf(q) < 0) return false;
          if (lo && !(b.bpm >= lo)) return false;
          if (hi && !(b.bpm <= hi)) return false;
          if (ck) { var bk = M.parseKey(b.key); if (!bk || M.transition(ck, bk).score < 0.8) return false; }
          return true;
        }).sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
      }
      function paint() {
        var all = KR.store.list('beats');
        var by = function (s) { return all.filter(function (b) { return (b.status || 'disponible') === s; }).length; };
        var analyzed = all.filter(function (b) { return b.bpm && b.key; }).length;
        var sold = KR.sum(all, function (b) { return +b.sold || 0; });
        $('#beat-kpis').innerHTML =
          '<div class="kpi"><dt>Beats</dt><dd class="k-val">' + all.length + '</dd></div>' +
          '<div class="kpi amber"><dt>Disponibles</dt><dd class="k-val">' + by('disponible') + '</dd></div>' +
          '<div class="kpi"><dt>Licencias vendidas</dt><dd class="k-val">' + sold + '</dd></div>' +
          '<div class="kpi"><dt>Con BPM y tono</dt><dd class="k-val">' + analyzed + '<small class="k-sub"> / ' + all.length + '</small></dd></div>';
        KR.$$('[data-n]', el).forEach(function (n) { var s = n.getAttribute('data-n'); n.textContent = s === 'all' ? all.length : by(s); });
        var rows = filtered(), notation = st.keyNotation;
        $('#b-count').textContent = rows.length === all.length ? '' : 'Mostrando ' + rows.length + ' de ' + all.length;
        if (!all.length) {
          $('#beat-list').innerHTML = KR.empty({ icon: 'disc', title: 'El catálogo está vacío', text: 'Suelta tus beats en el analizador para cargarlos con BPM y tonalidad, o agrégalos a mano.', action: '<a class="btn solid" href="#analizar">Analizar audios</a><button class="btn" type="button" data-act="add">Agregar a mano</button>' });
          return;
        }
        if (!rows.length) { $('#beat-list').innerHTML = KR.empty({ icon: 'search', title: 'Ningún beat cumple esos filtros', text: 'Prueba otro rango de BPM o quita el filtro de tonalidad.' }); return; }
        $('#beat-list').innerHTML = '<div class="table-wrap"><table class="tbl beats-tbl"><thead><tr><th>Beat</th><th class="r">BPM</th><th>Tono</th><th>Género · mood</th><th>Estado</th><th class="r">Licencias</th><th class="acts"><span class="sr">Acciones</span></th></tr></thead><tbody>' +
          rows.map(function (b) {
            var s = STATUS[b.status || 'disponible'] || STATUS.disponible;
            return '<tr data-id="' + b.id + '">' +
              '<td data-l="Beat"><span class="t-title">' + esc(b.title) + '</span><span class="t-sub">' + esc(b.project || 'Sin proyecto') + (b.duration ? ' · ' + KR.fmtDur(b.duration) : '') + (b.lufs != null ? ' · ' + String(b.lufs).replace('-', '−') + ' LUFS' : '') + '</span></td>' +
              '<td class="r num" data-l="BPM">' + (b.bpm || '<span class="faint">—</span>') + '</td>' +
              '<td data-l="Tono">' + keyCell(b.key, notation) + '</td>' +
              '<td data-l="Género">' + esc([b.genre, b.mood].filter(Boolean).join(' · ') || '—') + '</td>' +
              '<td data-l="Estado">' + KR.pill(s.label, s.tone) + '</td>' +
              '<td class="r num" data-l="Licencias">' + (+b.sold || 0) + '</td>' +
              '<td class="acts">' +
              (b.status !== 'vendido' ? '<a class="btn sm" href="#licencias-nuevo-' + b.id + '">Cotizar</a> ' : '') +
              (b.url ? '<a class="icon-btn sm" href="' + esc(b.url) + '" target="_blank" rel="noopener" aria-label="Escuchar ' + esc(b.title) + '">' + KR.icon('external') + '</a> ' : '') +
              '<button class="icon-btn sm" type="button" data-edit aria-label="Editar ' + esc(b.title) + '">' + KR.icon('edit') + '</button> ' +
              '<button class="icon-btn sm" type="button" data-del aria-label="Borrar ' + esc(b.title) + '">' + KR.icon('trash') + '</button></td></tr>';
          }).join('') + '</tbody></table></div>';
      }

      $('#b-q').addEventListener('input', KR.debounce(function (e) { ui.q = e.target.value; paint(); }, 120));
      $('#b-lo').addEventListener('input', function (e) { ui.bpmLo = e.target.value; paint(); });
      $('#b-hi').addEventListener('input', function (e) { ui.bpmHi = e.target.value; paint(); });
      $('#b-compat').addEventListener('change', function (e) { ui.compat = e.target.value; paint(); });
      el.addEventListener('click', function (e) {
        var chip = e.target.closest('[data-s]');
        if (chip) { ui.status = chip.getAttribute('data-s'); KR.$$('[data-s]', el).forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); }); paint(); return; }
        var row = e.target.closest('tr[data-id]');
        if (row && e.target.closest('[data-edit]')) { KR.editBeat(KR.store.get('beats', row.getAttribute('data-id'))); return; }
        if (row && e.target.closest('[data-del]')) {
          var b = KR.store.get('beats', row.getAttribute('data-id'));
          KR.store.remove('beats', b.id);
          KR.toast('Borraste ' + b.title, { action: 'Deshacer', onAction: function () { KR.store.put('beats', b); } });
          return;
        }
        var a = e.target.closest('[data-act]'); if (!a) return;
        var act = a.getAttribute('data-act');
        if (act === 'add') KR.editBeat();
        if (act === 'csv') {
          var head = ['Título', 'Proyecto', 'BPM', 'Camelot', 'Tonalidad', 'Género', 'Mood', 'Estado', 'Licencias', 'Duración', 'LUFS', 'Enlace'];
          var q = function (v) { v = v == null ? '' : String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
          var lines = [head.join(',')].concat(KR.store.list('beats').map(function (b) {
            var k = M.parseKey(b.key);
            return [b.title, b.project, b.bpm, k ? M.camelotStr(k) : '', k ? M.stdName(k) : '', b.genre, b.mood, (STATUS[b.status] || STATUS.disponible).label, b.sold || 0, b.duration ? KR.fmtDur(b.duration) : '', b.lufs, b.url].map(q).join(',');
          }));
          KR.saveFile('catalogo-bness.csv', '﻿' + lines.join('\n'), 'text/csv');
        }
        if (act === 'import') {
          KR.dialog({
            title: 'Pegar lista de títulos', ok: 'Agregar al catálogo',
            body: '<p class="muted">Un beat por línea. Si la línea trae BPM o tonalidad (por ejemplo "Ruby Pt. II 88 8A"), también se guardan.</p>' +
              KR.field({ id: 'imp-project', label: 'Proyecto (opcional)', value: '' }) +
              '<textarea class="field-in mono" id="imp-list" rows="8" placeholder="Ruby Pt. II 88 8A&#10;Temple&#10;Nocturno"></textarea>',
            read: function (d) { return { text: d.querySelector('#imp-list').value, project: d.querySelector('#imp-project').value }; }
          }).then(function (r) {
            if (!r || !r.text.trim()) return;
            var n = 0;
            r.text.split(/\r?\n/).forEach(function (line) {
              line = line.trim(); if (!line) return;
              var bpm = null, key = '', m = /\b(1[0-2]|[1-9])\s?([AB])\b/i.exec(line);
              if (m) { key = m[1] + m[2].toUpperCase(); line = line.replace(m[0], ' '); }
              m = /\b(\d{2,3})\s*(bpm)?\b/i.exec(line);
              if (m && +m[1] >= 50 && +m[1] <= 220) { bpm = +m[1]; line = line.replace(m[0], ' '); }
              KR.store.put('beats', { title: line.replace(/\s{2,}/g, ' ').trim(), project: r.project, bpm: bpm, key: key, status: 'disponible' }, { silent: true });
              n++;
            });
            KR.store.emit({ col: 'beats', type: 'bulk' });
            KR.toast(KR.plural(n, 'beat agregado', 'beats agregados'));
          });
        }
      });
      ctx.sub(function (ev) { if (ev.col === 'beats' || ev.type === 'reset') paint(); });
      paint();
    }
  });
})();
