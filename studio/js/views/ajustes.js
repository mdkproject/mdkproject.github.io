/* KTRL Room · Ajustes
   Perfil (sale en contratos, splits y riders), precios de licencias, preferencias y respaldo de datos. */
(function () {
  'use strict';
  var KR = window.KR, M = KR.music, esc = KR.esc;

  KR.view('ajustes', {
    title: 'Ajustes', icon: 'faders',
    render: function (el, arg, ctx) {
      var p = KR.store.doc('profile'), s = KR.store.doc('settings');
      var sampleKey = M.fromCamelot(8, 'A');
      el.innerHTML = KR.head({ title: 'Ajustes', lead: 'Tus datos salen en contratos, split sheets, riders y textos. Se guarda solo al escribir.' }) +
        '<div class="settings">' +
        '<section class="panel"><div class="panel-head"><h2>Perfil</h2></div><form class="panel-pad form-grid" id="f-prof" autocomplete="off">' +
        KR.field({ id: 's-artist', name: 'artist', label: 'Nombre artístico', value: p.artist }) +
        KR.field({ id: 's-name', name: 'name', label: 'Nombre legal', value: p.name }) +
        KR.field({ id: 's-alias', name: 'alias', label: 'Alias de beatmaker', value: p.alias }) +
        KR.field({ id: 's-label', name: 'label', label: 'Sello o estudio', value: p.label }) +
        KR.field({ id: 's-dni', name: 'dni', label: 'DNI', value: p.dni, attrs: 'inputmode="numeric"', hint: 'Solo para los PDF. Queda en este dispositivo o en tu cuenta de Claude.' }) +
        KR.field({ id: 's-city', name: 'city', label: 'Ciudad', value: p.city }) +
        KR.field({ id: 's-phone', name: 'phone', label: 'WhatsApp', type: 'tel', value: p.phone }) +
        KR.field({ id: 's-email', name: 'email', label: 'Correo', type: 'email', value: p.email }) +
        KR.field({ id: 's-ig', name: 'instagram', label: 'Instagram (sin @)', value: p.instagram }) +
        KR.field({ id: 's-web', name: 'web', label: 'Web', type: 'url', value: p.web }) +
        KR.field({ id: 's-beats', name: 'beatsUrl', label: 'Catálogo de beats', type: 'url', value: p.beatsUrl, cls: 'full' }) +
        KR.field({ id: 's-genres', name: 'genres', label: 'Géneros', value: p.genres, cls: 'full' }) +
        '</form></section>' +

        '<section class="panel"><div class="panel-head"><h2>Licencias y pagos</h2>' + (s.pricesAreExample ? KR.pill('Precios de ejemplo', 'warn', 'warn') : KR.pill('Precios tuyos', 'good', 'check')) + '</div><form class="panel-pad form-grid" id="f-lic" autocomplete="off">' +
        KR.field({ id: 's-p-basic', name: 'basic', label: 'Uso compartido (no exclusiva)', type: 'number', value: s.prices.basic, attrs: 'min="0" inputmode="decimal"' }) +
        KR.field({ id: 's-p-stems', name: 'stems', label: 'Para mezclar (con stems)', type: 'number', value: s.prices.stems, attrs: 'min="0" inputmode="decimal"' }) +
        KR.field({ id: 's-p-exc', name: 'exclusive', label: 'Solo tuyo (exclusiva)', type: 'number', value: s.prices.exclusive, attrs: 'min="0" inputmode="decimal"' }) +
        KR.field({ id: 's-cur', name: 'currency', label: 'Moneda', type: 'select', value: s.currency, options: [{ value: 'PEN', label: 'Soles (S/)' }, { value: 'USD', label: 'Dólares (US$)' }] }) +
        KR.field({ id: 's-pub', name: 'pubShare', label: '% de autoría del productor', type: 'number', value: s.pubShare, attrs: 'min="0" max="100" inputmode="numeric"' }) +
        KR.field({ id: 's-pay', name: 'payMethods', label: 'Formas de pago (separadas por coma)', value: (s.payMethods || []).join(', '), cls: 'full' }) +
        '<label class="check full"><input type="checkbox" name="promo3x2" id="s-promo"' + (s.promo3x2 ? ' checked' : '') + '> Promo 3x2 activa (tres beats por el precio de dos)</label>' +
        '</form></section>' +

        '<section class="panel"><div class="panel-head"><h2>Preferencias</h2></div><div class="panel-pad stack">' +
        '<div class="field"><span class="flabel">Cómo mostrar las tonalidades</span><div class="seg" id="s-notation">' +
        [['camelot', M.camelotStr(sampleKey) + ' · Camelot'], ['std', M.stdName(sampleKey) + ' · cifrado'], ['es', M.esName(sampleKey)]].map(function (o) { return '<button type="button" data-n="' + o[0] + '" aria-pressed="' + (s.keyNotation === o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div></div>' +
        (KR.inClaude ? '' : '<div class="field"><span class="flabel">Tema</span><div class="seg" id="s-theme">' + [['system', 'Como el sistema'], ['dark', 'Oscuro'], ['light', 'Claro']].map(function (o) { return '<button type="button" data-theme-opt="' + o[0] + '" aria-pressed="' + (s.theme === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div></div>') +
        '</div></section>' +

        '<section class="panel"><div class="panel-head"><h2>Tus datos</h2><span class="sync ' + KR.cloud.status + '">' + KR.icon(KR.cloud.status === 'on' ? 'cloud' : 'device') + esc(KR.cloud.statusText()) + '</span></div><div class="panel-pad stack">' +
        '<p class="muted">' + (KR.cloud.status === 'on'
          ? 'Todo se guarda en tu cuenta de Claude y lo ves igual desde cualquier dispositivo donde abras este artifact.'
          : 'Todo se guarda en este navegador. Descarga un respaldo de vez en cuando, y úsalo para pasar tus datos a otro equipo o a la versión dentro de Claude.') + '</p>' +
        '<dl class="facts" id="counts"></dl>' +
        '<div class="row"><button class="btn" type="button" data-act="export">' + KR.icon('download') + 'Descargar respaldo</button>' +
        '<label class="btn ghost" for="s-import">' + KR.icon('upload') + 'Restaurar respaldo</label><input type="file" id="s-import" accept="application/json,.json" class="sr">' +
        '<span class="spacer"></span><button class="btn ghost sm danger-text" type="button" data-act="reset">' + KR.icon('trash') + 'Empezar de cero</button></div>' +
        '</div></section>' +

        '<section class="panel panel-pad about"><span class="label">KTRL Room</span><p>Hecho para ' + esc(p.artist) + ' y ' + esc(p.label) + '. Funciona sin conexión una vez abierto, y en el celular se puede instalar desde el menú del navegador con "Agregar a pantalla de inicio".</p>' +
        '<p class="hint">El analizador, los PDF y los afiches se generan en tu dispositivo: ningún audio ni documento se sube a un servidor.</p></section>' +
        '</div>';

      var $ = function (q) { return KR.$(q, el); };
      function counts() {
        var labels = { deals: 'Trabajos', beats: 'Beats', licenses: 'Licencias', events: 'Eventos', sets: 'Sets', splits: 'Splits', releases: 'Lanzamientos', textos: 'Plantillas' };
        $('#counts').innerHTML = Object.keys(labels).map(function (k) { return '<div><dt>' + labels[k] + '</dt><dd class="num">' + KR.store.list(k).length + '</dd></div>'; }).join('');
      }
      var saveProf = KR.debounce(function () { KR.store.setDoc('profile', KR.formData($('#f-prof'))); }, 300);
      $('#f-prof').addEventListener('input', saveProf);
      $('#f-lic').addEventListener('input', KR.debounce(function () {
        var fd = KR.formData($('#f-lic'));
        KR.store.setDoc('settings', {
          prices: { basic: KR.num(fd.basic, 0), stems: KR.num(fd.stems, 0), exclusive: KR.num(fd.exclusive, 0) },
          pricesAreExample: false, currency: fd.currency, pubShare: KR.clamp(KR.num(fd.pubShare, 50), 0, 100), promo3x2: !!fd.promo3x2,
          payMethods: String(fd.payMethods || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean)
        });
      }, 300));
      el.addEventListener('click', function (e) {
        var n = e.target.closest('[data-n]');
        if (n) { KR.store.setDoc('settings', { keyNotation: n.getAttribute('data-n') }); KR.$$('[data-n]', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b === n)); }); return; }
        var t = e.target.closest('[data-theme-opt]');
        if (t) { KR.store.setDoc('settings', { theme: t.getAttribute('data-theme-opt') }); KR.$$('[data-theme-opt]', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); }); return; }
        var a = e.target.closest('[data-act]'); if (!a) return;
        if (a.getAttribute('data-act') === 'export') {
          KR.saveFile('ktrl-room-respaldo-' + KR.today() + '.json', JSON.stringify(KR.store.exportData(), null, 2), 'application/json');
        }
        if (a.getAttribute('data-act') === 'reset') {
          KR.dialog({
            title: 'Empezar de cero', ok: 'Borrar todo', danger: true,
            body: '<p>Se borran trabajos, beats, licencias, eventos, sets, splits y lanzamientos. Tu perfil y tus precios se reinician.</p><label class="check"><input type="checkbox" id="rs-seed" checked> Volver a cargar los datos de tu web (lanzamientos, eventos y colaboraciones)</label><p class="hint">Si no tienes un respaldo, descárgalo antes.</p>',
            read: function (d) { return { seed: d.querySelector('#rs-seed').checked }; }
          }).then(function (r) { if (!r) return; KR.store.reset(r.seed); KR.toast('Listo, empezaste de cero'); KR.go('inicio'); });
        }
      });
      $('#s-import').addEventListener('change', function (e) {
        var f = e.target.files[0]; if (!f) return;
        KR.readFile(f, 'text').then(function (txt) {
          var data = JSON.parse(txt);
          return KR.dialog({ title: 'Restaurar respaldo', ok: 'Reemplazar mis datos', danger: true, body: '<p>El respaldo del ' + esc(String(data.exportedAt || '').slice(0, 10)) + ' reemplaza todo lo que hay ahora en KTRL Room.</p>' })
            .then(function (ok) { if (!ok) return; KR.store.importData(data); KR.toast('Respaldo restaurado'); KR.go('inicio'); });
        }).catch(function (err) { KR.toast(err && err.message && /KTRL/.test(err.message) ? err.message : 'Ese archivo no es un respaldo válido de KTRL Room.', { tone: 'bad' }); });
        e.target.value = '';
      });
      ctx.sub(function () { counts(); });
      counts();
    }
  });
})();
