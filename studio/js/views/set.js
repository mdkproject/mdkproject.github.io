/* KTRL Room · Set
   Arma un set: cada transición muestra si la mezcla es armónica y cuánto pitch necesitas.
   "Ordenar" busca el orden más fluido (exacto hasta 11 temas, heurístico para más). */
(function () {
  'use strict';
  var KR = window.KR, M = KR.music, esc = KR.esc;
  var undoStack = {};

  var CAM_OPTIONS = (function () {
    var o = [];
    for (var n = 1; n <= 12; n++) ['A', 'B'].forEach(function (l) { o.push(n + l + ' ' + M.stdName(M.fromCamelot(n, l))); });
    return o;
  })();

  function normKey(v) { var k = M.parseKey(v); return k ? M.camelotStr(k) : String(v || '').trim(); }

  function parseList(text) {
    return text.split(/\r?\n/).map(function (line) {
      var s = line.replace(/^\s*\d{1,3}[.)-]\s*/, '').trim();
      if (!s) return null;
      var bpm = null, key = '', energy = null, m;
      m = /\b(1[0-2]|[1-9])\s?([AB])\b/i.exec(s);
      if (m) { key = m[1] + m[2].toUpperCase(); s = s.replace(m[0], ' '); }
      else {
        m = /(?:^|[\s[(·|,])([A-G](?:#|b)?m?)(?=$|[\s\])·|,])/.exec(s);
        if (m && M.parseKey(m[1])) { key = normKey(m[1]); s = s.replace(m[1], ' '); }
      }
      m = /\b(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:bpm)?\b/i.exec(s);
      if (m && +m[1].replace(',', '.') >= 60 && +m[1].replace(',', '.') <= 200) { bpm = +m[1].replace(',', '.'); s = s.replace(m[0], ' '); }
      m = /\b(?:e|energ[ií]a)\s*[:=]?\s*(10|[1-9])\b/i.exec(s);
      if (m) { energy = +m[1]; s = s.replace(m[0], ' '); }
      s = s.replace(/[[\]()·|]+/g, ' ').replace(/\s{2,}/g, ' ').trim().replace(/[-–,\s]+$/, '');
      var artist = '', title = s, parts = s.split(/\s[-–]\s/);
      if (parts.length > 1) { artist = parts.shift().trim(); title = parts.join(' – ').trim(); }
      return { id: KR.uid('t'), title: title || 'Sin título', artist: artist, bpm: bpm, key: key, energy: energy || 5 };
    }).filter(Boolean);
  }

  function setText(set) {
    var lines = ['SET · ' + set.name + (set.minutes ? ' · ' + set.minutes + ' min' : ''), ''];
    set.tracks.forEach(function (t, i) {
      lines.push(KR.pad(i + 1) + '. ' + (t.artist ? t.artist + ' – ' : '') + t.title +
        ((t.bpm || t.key) ? '  [' + [t.bpm ? t.bpm + ' BPM' : '', t.key || ''].filter(Boolean).join(' · ') + ']' : ''));
    });
    return lines.join('\n');
  }

  KR.view('set', {
    title: 'Set', icon: 'headphones',
    render: function (el, arg, ctx) {
      var sets = KR.store.list('sets');
      var set = arg ? KR.store.get('sets', arg) : sets[0];
      if (!set) {
        el.innerHTML = KR.head({ title: 'Set' }) + KR.empty({
          icon: 'headphones', title: 'Arma tu primer set',
          text: 'Pega tu lista de temas con BPM y tonalidad, o agrégalos uno por uno. KTRL Room te dice qué transiciones son armónicas y propone el orden más fluido.',
          action: '<button class="btn solid" type="button" data-act="new">' + KR.icon('plus') + 'Nuevo set</button>'
        });
        el.addEventListener('click', function (e) { if (e.target.closest('[data-act="new"]')) newSet(); });
        return;
      }
      var model = KR.clone(set);
      var save = KR.debounce(function () { KR.store.put('sets', model, { silent: true }); }, 350);

      el.innerHTML = KR.head({
        title: 'Set',
        lead: 'Cada fila te dice cómo entra desde el tema anterior: <b>verde</b> mezcla armónica, <b>ámbar</b> tensión o subida de energía, <b>rojo</b> choque.',
        actions: '<label class="sr" for="set-pick">Elegir set</label><select class="field-in set-pick" id="set-pick">' +
          sets.map(function (s) { return '<option value="' + s.id + '"' + (s.id === set.id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') +
          '</select><button class="btn ghost" type="button" data-act="new">' + KR.icon('plus') + 'Nuevo</button>'
      }) +
        (model.example ? '<p class="note">' + KR.icon('warn') + '<span><b>Este set es de ejemplo.</b> Reemplaza los temas por los tuyos o bórralo cuando quieras.</span></p>' : '') +
        '<div class="set-layout">' +
        '<section class="set-main stack">' +
        '<div class="panel panel-pad"><div class="form-grid">' +
        KR.field({ id: 'set-name', label: 'Nombre del set', value: model.name, cls: 'full' }) +
        KR.field({ id: 'set-min', label: 'Duración (min)', type: 'number', value: model.minutes || 60, attrs: 'min="5" inputmode="numeric"' }) +
        '<div class="field"><span class="flabel">Curva de energía</span><div class="seg" id="set-arc">' +
        '<button type="button" data-arc="up" aria-pressed="' + (model.arc !== 'free') + '">Subir de a poco</button>' +
        '<button type="button" data-arc="free" aria-pressed="' + (model.arc === 'free') + '">Libre</button></div></div>' +
        '</div></div>' +

        '<div class="set-tools toolbar">' +
        '<button class="btn solid" type="button" data-act="order">' + KR.icon('shuffle') + 'Ordenar</button>' +
        '<label class="check"><input type="checkbox" id="keep-first" checked> Mantener el primero</label>' +
        '<button class="btn ghost sm" type="button" data-act="undo" id="undo" hidden>Deshacer orden</button>' +
        '<span class="spacer"></span>' +
        '<button class="btn ghost sm" type="button" data-act="paste">' + KR.icon('list') + 'Pegar lista</button>' +
        '<button class="btn ghost sm" type="button" data-act="from-beats">' + KR.icon('disc') + 'Desde el catálogo</button>' +
        '<button class="btn ghost sm" type="button" data-act="copy">' + KR.icon('copy') + 'Copiar tracklist</button>' +
        '</div>' +

        '<div class="panel"><div class="trk-head" aria-hidden="true"><span></span><span>#</span><span>Tema</span><span>BPM</span><span>Tono</span><span>Energía</span><span>Entra desde el anterior</span><span></span></div>' +
        '<ol class="trk-list" id="trk-list"></ol>' +
        '<form class="trk-add" id="trk-add" autocomplete="off">' +
        '<input class="field-in" name="title" placeholder="Artista – Tema" aria-label="Tema nuevo">' +
        '<input class="field-in num" name="bpm" type="number" step="0.1" placeholder="BPM" aria-label="BPM" inputmode="decimal">' +
        '<input class="field-in" name="key" list="cam-list" placeholder="8A" aria-label="Tonalidad">' +
        '<button class="btn" type="submit">' + KR.icon('plus') + 'Agregar</button></form>' +
        '<datalist id="cam-list">' + CAM_OPTIONS.map(function (o) { return '<option value="' + o.split(' ')[0] + '">' + esc(o) + '</option>'; }).join('') + '</datalist>' +
        '</div>' +
        '<div class="row between"><button class="btn ghost sm danger-text" type="button" data-act="delete">' + KR.icon('trash') + 'Borrar este set</button><span class="hint" id="per-track"></span></div>' +
        '</section>' +

        '<aside class="set-side stack">' +
        '<div class="panel panel-pad set-score"><span class="label">Fluidez del orden actual</span><b class="score num" id="score"></b><span class="hint" id="score-note"></span></div>' +
        '<div class="panel"><div class="panel-head"><h3>Ruta en la rueda</h3><span class="label">del primero al último</span></div><div class="panel-pad" id="route"></div></div>' +
        '<div class="panel"><div class="panel-head"><h3>Tempo del set</h3><span class="label">BPM por tema</span></div><div class="panel-pad" id="bpm-chart"></div></div>' +
        '<div class="panel"><div class="panel-head"><h3>Energía</h3><span class="label">1 a 10</span></div><div class="panel-pad" id="energy-chart"></div></div>' +
        '</aside></div>';

      var $ = function (s) { return KR.$(s, el); };
      var list = $('#trk-list');

      function rowHtml(t, i) {
        return '<li class="trk" data-id="' + t.id + '">' +
          '<button type="button" class="grip" aria-label="Mover ' + esc(t.title) + ' (Alt + flechas)" data-grip>' + KR.icon('grip') + '</button>' +
          '<span class="trk-n num">' + KR.pad(i + 1) + '</span>' +
          '<span class="trk-title"><input class="field-in bare" data-f="title" value="' + esc(t.title) + '" aria-label="Tema ' + (i + 1) + '">' +
          '<input class="field-in bare sub" data-f="artist" value="' + esc(t.artist || '') + '" placeholder="Artista" aria-label="Artista del tema ' + (i + 1) + '"></span>' +
          '<input class="field-in num" data-f="bpm" type="number" step="0.1" value="' + (t.bpm || '') + '" aria-label="BPM del tema ' + (i + 1) + '" inputmode="decimal">' +
          '<input class="field-in mono" data-f="key" list="cam-list" value="' + esc(t.key || '') + '" aria-label="Tonalidad del tema ' + (i + 1) + '">' +
          '<input class="field-in num" data-f="energy" type="number" min="1" max="10" value="' + (t.energy || 5) + '" aria-label="Energía del tema ' + (i + 1) + '" inputmode="numeric">' +
          '<span class="trk-mix" data-mix></span>' +
          '<button type="button" class="icon-btn sm bare" data-del aria-label="Quitar ' + esc(t.title) + '">' + KR.icon('x') + '</button></li>';
      }
      function paintList() {
        list.innerHTML = model.tracks.length ? model.tracks.map(rowHtml).join('') :
          '<li class="trk-empty">' + KR.empty({ icon: 'note', title: 'El set está vacío', text: 'Agrega temas abajo o pega una lista completa.' }) + '</li>';
        paintDerived();
      }
      function paintDerived() {
        var tr = model.tracks;
        KR.$$('.trk', list).forEach(function (li, i) {
          li.querySelector('.trk-n').textContent = KR.pad(i + 1);
          var cell = li.querySelector('[data-mix]');
          if (i === 0) { cell.innerHTML = '<span class="pill">Abre el set</span>'; return; }
          var a = tr[i - 1], b = tr[i];
          var ka = M.parseKey(a.key), kb = M.parseKey(b.key);
          var tk = M.transition(ka, kb), bm = M.bpmMatch(+a.bpm, +b.bpm);
          var icon = tk.tone === 'good' ? 'check' : 'warn';
          cell.innerHTML = '<span class="pill ' + tk.tone + '">' + KR.icon(icon) + esc(tk.label) + '</span>' +
            '<span class="mix-bpm ' + bm.tone + '">' + (bm.pct == null ? 'falta BPM' : esc(bm.label)) + '</span>';
        });
        var sc = M.setScore(tr);
        $('#score').textContent = sc == null ? '—' : sc;
        var bad = 0;
        for (var i = 1; i < tr.length; i++) if (M.transition(M.parseKey(tr[i - 1].key), M.parseKey(tr[i].key)).tone === 'bad') bad++;
        $('#score-note').textContent = tr.length < 2 ? 'Agrega al menos dos temas.' : bad ? KR.plural(bad, 'choque armónico', 'choques armónicos') + ' en el orden actual.' : 'Ninguna transición choca.';
        var keys = tr.map(function (t) { return M.parseKey(t.key); });
        $('#route').innerHTML = KR.chart.wheel({ size: 280, path: keys, active: keys[0] || null, compatible: false, center: keys.filter(Boolean).length ? M.camelotStr(keys[0]) + '→' + M.camelotStr(keys[keys.length - 1] || keys[0]) : '—', sub: 'inicio → cierre' });
        var withBpm = tr.map(function (t, i) { return { x: i + 1, y: +t.bpm, note: t.title }; }).filter(function (p) { return p.y > 0; });
        if (withBpm.length > 1) {
          KR.chart.line($('#bpm-chart'), {
            label: 'BPM por tema', height: 150, points: withBpm, xTicks: withBpm.map(function (p) { return p.x; }),
            xFormat: function (v, full) { return full ? 'Tema ' + v : String(v); }, yFormat: function (v) { return (Math.round(v * 10) / 10) + (arguments[1] ? '' : ' BPM'); },
            markers: [{ x: withBpm[withBpm.length - 1].x, y: withBpm[withBpm.length - 1].y, label: withBpm[withBpm.length - 1].y + '' }]
          });
        } else $('#bpm-chart').innerHTML = '<p class="hint">Faltan BPM para dibujar la curva.</p>';
        if (tr.length) {
          KR.chart.bars($('#energy-chart'), {
            label: 'Energía por tema', height: 130, minMax: 10,
            items: tr.map(function (t, i) { return { label: (i + 1) + '. ' + t.title, short: String(i + 1), values: [+t.energy || 0] }; }),
            yFormat: function (v) { return String(Math.round(v)); }
          });
        } else $('#energy-chart').innerHTML = '';
        var mins = KR.num($('#set-min').value, 0);
        $('#per-track').textContent = tr.length && mins ? 'Para ' + mins + ' min con ' + KR.plural(tr.length, 'tema', 'temas') + ': unos ' + KR.fmtDur(mins * 60 / tr.length) + ' por tema.' : '';
      }
      function commit(structural) {
        if (structural) paintList(); else paintDerived();
        save();
      }

      /* edición en línea */
      list.addEventListener('input', function (e) {
        var f = e.target.getAttribute('data-f'); if (!f) return;
        var id = e.target.closest('.trk').getAttribute('data-id');
        var t = model.tracks.find(function (x) { return x.id === id; });
        var v = e.target.value;
        t[f] = f === 'bpm' ? (v ? KR.num(v) : null) : f === 'energy' ? KR.clamp(Math.round(KR.num(v, 5)), 1, 10) : v;
        commit(false);
      });
      list.addEventListener('change', function (e) {
        if (e.target.getAttribute('data-f') !== 'key') return;
        var id = e.target.closest('.trk').getAttribute('data-id');
        var t = model.tracks.find(function (x) { return x.id === id; });
        t.key = normKey(e.target.value); e.target.value = t.key;
        commit(false);
      });
      list.addEventListener('click', function (e) {
        var del = e.target.closest('[data-del]');
        if (del) {
          var id = del.closest('.trk').getAttribute('data-id');
          var idx = model.tracks.findIndex(function (x) { return x.id === id; });
          var gone = model.tracks.splice(idx, 1)[0];
          commit(true);
          KR.toast('Quitaste ' + gone.title, { action: 'Deshacer', onAction: function () { model.tracks.splice(idx, 0, gone); commit(true); } });
        }
      });
      list.addEventListener('keydown', function (e) {
        if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
        var li = e.target.closest('.trk'); if (!li) return;
        e.preventDefault();
        var i = model.tracks.findIndex(function (x) { return x.id === li.getAttribute('data-id'); });
        var j = e.key === 'ArrowUp' ? i - 1 : i + 1;
        if (j < 0 || j >= model.tracks.length) return;
        var t = model.tracks.splice(i, 1)[0]; model.tracks.splice(j, 0, t);
        var focusF = e.target.getAttribute('data-f') || null;
        commit(true);
        var again = list.querySelector('[data-id="' + t.id + '"] ' + (focusF ? '[data-f="' + focusF + '"]' : '[data-grip]'));
        if (again) again.focus();
      });

      /* arrastrar para reordenar */
      var drag = null;
      list.addEventListener('pointerdown', function (e) {
        var g = e.target.closest('[data-grip]'); if (!g) return;
        e.preventDefault();
        var li = g.closest('.trk');
        drag = { li: li, id: li.getAttribute('data-id'), startY: e.clientY, pid: e.pointerId };
        li.classList.add('dragging');
        g.setPointerCapture(e.pointerId);
      });
      list.addEventListener('pointermove', function (e) {
        if (!drag) return;
        var rows = KR.$$('.trk', list).filter(function (r) { return r !== drag.li; });
        var before = rows.find(function (r) { var b = r.getBoundingClientRect(); return e.clientY < b.top + b.height / 2; });
        if (before) list.insertBefore(drag.li, before); else list.appendChild(drag.li);
      });
      function endDrag() {
        if (!drag) return;
        drag.li.classList.remove('dragging');
        var ids = KR.$$('.trk', list).map(function (r) { return r.getAttribute('data-id'); });
        model.tracks.sort(function (a, b) { return ids.indexOf(a.id) - ids.indexOf(b.id); });
        drag = null;
        commit(false);
      }
      list.addEventListener('pointerup', endDrag);
      list.addEventListener('pointercancel', endDrag);

      $('#trk-add').addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = KR.formData(e.target);
        if (!fd.title.trim()) { e.target.title.focus(); return; }
        var parsed = parseList(fd.title)[0] || { id: KR.uid('t'), title: fd.title, energy: 5 };
        if (fd.bpm) parsed.bpm = KR.num(fd.bpm);
        if (fd.key) parsed.key = normKey(fd.key);
        model.tracks.push(parsed);
        commit(true);
        e.target.reset(); e.target.title.focus();
      });
      $('#set-name').addEventListener('input', function (e) { model.name = e.target.value; save(); var o = $('#set-pick').selectedOptions[0]; if (o) o.textContent = model.name; });
      $('#set-min').addEventListener('input', function (e) { model.minutes = KR.num(e.target.value, 60); paintDerived(); save(); });
      $('#set-pick').addEventListener('change', function (e) { KR.go('set-' + e.target.value); });

      function newSet() {
        var s = KR.store.put('sets', { name: 'Set nuevo', minutes: 60, arc: 'up', tracks: [] });
        KR.go('set-' + s.id);
      }
      el.addEventListener('click', function (e) {
        var arc = e.target.closest('[data-arc]');
        if (arc) {
          model.arc = arc.getAttribute('data-arc');
          KR.$$('[data-arc]', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b === arc)); });
          save(); return;
        }
        var b = e.target.closest('[data-act]'); if (!b) return;
        var act = b.getAttribute('data-act');
        if (act === 'new') newSet();
        if (act === 'order') {
          if (model.tracks.length < 3) { KR.toast('Agrega al menos tres temas para ordenar.'); return; }
          undoStack[model.id] = model.tracks.slice();
          var before = M.setScore(model.tracks);
          var ord = M.orderSet(model.tracks, { arc: model.arc === 'free' ? 'free' : 'up', first: $('#keep-first').checked ? 0 : null });
          model.tracks = ord.map(function (i) { return model.tracks[i]; });
          commit(true);
          $('#undo').hidden = false;
          var after = M.setScore(model.tracks);
          KR.toast(after > before ? 'Fluidez de ' + before + ' a ' + after : 'Ya estaba en el mejor orden posible');
        }
        if (act === 'undo' && undoStack[model.id]) { model.tracks = undoStack[model.id]; delete undoStack[model.id]; $('#undo').hidden = true; commit(true); }
        if (act === 'copy') KR.copy(setText(model), 'Tracklist copiado');
        if (act === 'delete') {
          KR.confirm('¿Borrar "' + model.name + '"?', 'Se borra el set y su lista de temas.').then(function (ok) {
            if (!ok) return;
            KR.store.remove('sets', model.id);
            KR.go('set');
          });
        }
        if (act === 'paste') {
          KR.dialog({
            title: 'Pegar lista de temas', ok: 'Agregar al set',
            body: '<p class="muted">Un tema por línea. Reconozco BPM, tonalidad (8A o Am) y "Artista - Tema".</p>' +
              '<textarea class="field-in mono" id="paste-in" rows="9" placeholder="Artista - Tema 124 8A&#10;Otro artista - Otro tema 126 Am&#10;Tema sin datos"></textarea>',
            read: function (d) { return d.querySelector('#paste-in').value; }
          }).then(function (txt) {
            if (!txt) return;
            var rows = parseList(txt);
            model.tracks = model.tracks.concat(rows);
            commit(true);
            KR.toast(KR.plural(rows.length, 'tema agregado', 'temas agregados'));
          });
        }
        if (act === 'from-beats') {
          var beats = KR.store.list('beats');
          if (!beats.length) { KR.toast('El catálogo está vacío. Analiza audios o agrega beats primero.'); return; }
          KR.dialog({
            title: 'Agregar desde el catálogo', ok: 'Agregar',
            body: '<div class="pick-list">' + beats.map(function (bt) {
              return '<label class="check"><input type="checkbox" value="' + bt.id + '"> <span><b>' + esc(bt.title) + '</b> <small class="muted">' + [bt.bpm ? bt.bpm + ' BPM' : '', bt.key || ''].filter(Boolean).join(' · ') + '</small></span></label>';
            }).join('') + '</div>',
            read: function (d) { return KR.$$('input:checked', d).map(function (i) { return i.value; }); }
          }).then(function (ids) {
            if (!ids || !ids.length) return;
            ids.forEach(function (id) {
              var bt = KR.store.get('beats', id);
              model.tracks.push({ id: KR.uid('t'), title: bt.title, artist: KR.store.doc('profile').alias || '', bpm: bt.bpm, key: bt.key, energy: 5 });
            });
            commit(true);
          });
        }
      });

      paintList();
      if (undoStack[model.id]) $('#undo').hidden = false;
    }
  });
})();
