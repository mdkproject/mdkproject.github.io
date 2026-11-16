/* KTRL Room · Licencias de beats
   Las tres licencias de la web (uso compartido, para mezclar, solo tuyo) con su cotización para WhatsApp
   y el contrato en PDF listo para firmar. Es una plantilla de referencia, no reemplaza a un abogado. */
(function () {
  'use strict';
  var KR = window.KR, M = KR.music, esc = KR.esc;

  var TYPES = {
    basic: { label: 'No exclusiva', nick: 'Uso compartido', files: 'WAV y MP3 sin tag de voz', streams: 100000, videos: 1, copies: 2000, radio: false, years: 2, stems: false },
    stems: { label: 'No exclusiva con stems', nick: 'Para mezclar', files: 'WAV, MP3 y stems (pistas separadas)', streams: 500000, videos: 2, copies: 5000, radio: true, years: 3, stems: true },
    exclusive: { label: 'Exclusiva', nick: 'Solo tuyo', files: 'WAV, MP3 y stems (pistas separadas)', streams: null, videos: null, copies: null, radio: true, years: null, stems: true }
  };
  var STATES = { cotizada: { label: 'Cotizada', tone: '' }, firmada: { label: 'Firmada', tone: 'warn' }, pagada: { label: 'Pagada', tone: 'good' } };
  KR.LIC_TYPES = TYPES;
  var IN_KIND = ['Donación', 'Juguetes para niños', 'Comida para albergues'];

  function n(v) { return v == null ? 'sin límite' : Number(v).toLocaleString('es-PE'); }
  function cityOf(p) { return String(p.city || 'Tacna').split(',')[0].trim(); }

  function nextNumber() {
    var st = KR.store.doc('settings'), y = new Date().getFullYear();
    var seq = st.licenseSeqYear === y ? (st.licenseSeq || 0) + 1 : 1;
    KR.store.setDoc('settings', { licenseSeq: seq, licenseSeqYear: y }, { silent: true });
    return 'KTRL-' + y + '-' + ('00' + seq).slice(-3);
  }
  function newLicense(beatId) {
    var st = KR.store.doc('settings'), prof = KR.store.doc('profile'), t = TYPES.basic;
    var beat = beatId ? KR.store.get('beats', beatId) : null;
    return KR.store.put('licenses', {
      number: nextNumber(), date: KR.today(), beatId: beat ? beat.id : '', beatTitle: beat ? beat.title : '', song: '',
      licensee: { name: '', artist: '', dni: '', email: '', phone: '' },
      type: 'basic', price: st.prices.basic, currency: st.currency || 'PEN',
      streams: t.streams, videos: t.videos, copies: t.copies, radio: t.radio, years: t.years,
      credit: 'Prod. ' + (prof.alias || prof.artist), pubShare: st.pubShare != null ? st.pubShare : 50,
      payMethod: (st.payMethods || ['Yape'])[0], payDate: '', status: 'cotizada', deliveryDays: 2
    });
  }

  function beatOf(l) { return l.beatId ? KR.store.get('beats', l.beatId) : null; }
  function beatName(l) { var b = beatOf(l); return (b && b.title) || l.beatTitle || 'Beat sin título'; }

  KR.licenseQuote = function (l) {
    var prof = KR.store.doc('profile'), st = KR.store.doc('settings'), t = TYPES[l.type], b = beatOf(l);
    var info = b ? [b.bpm ? b.bpm + ' BPM' : '', b.key || ''].filter(Boolean).join(' · ') : '';
    var who = l.licensee.artist || l.licensee.name;
    var lines = [
      'Hola' + (who ? ' ' + who : '') + ', te paso la cotización del beat «' + beatName(l) + '»' + (info ? ' (' + info + ')' : '') + ':',
      '',
      '• Licencia: ' + t.label + ' (' + t.nick.toLowerCase() + ')',
      '• Archivos: ' + t.files,
      '• Incluye: ' + (l.streams == null ? 'reproducciones sin límite' : 'hasta ' + n(l.streams) + ' reproducciones') + ', ' +
        (l.videos == null ? 'videoclips sin límite' : l.videos + (l.videos === 1 ? ' videoclip' : ' videoclips')) + ', shows en vivo' + (l.radio ? ', radio y TV' : ''),
      '• Precio: ' + KR.fmtMoney(l.price, l.currency),
      '• Pago: ' + (IN_KIND.indexOf(l.payMethod) >= 0 ? l.payMethod.toLowerCase() + ' (pago en especie)' : (st.payMethods || []).filter(function (m) { return IN_KIND.indexOf(m) < 0; }).join(', '))
    ];
    if (st.promo3x2) lines.push('', 'Promo 3x2: si te llevas tres beats, el más barato va de regalo.');
    lines.push('', 'Cuando confirmes, te mando el contrato para firmar.', '— ' + (prof.alias || prof.artist) + ' · ' + prof.artist);
    return lines.join('\n');
  };

  KR.licenseDoc = function (l) {
    var prof = KR.store.doc('profile'), t = TYPES[l.type], b = beatOf(l);
    var beat = beatName(l), song = l.song ? '«' + l.song + '»' : 'una canción nueva';
    var lic = l.licensee || {};
    var price = KR.fmtMoney(l.price, l.currency);
    var inKind = IN_KIND.indexOf(l.payMethod) >= 0;
    var pub = KR.clamp(KR.num(l.pubShare, 50), 0, 100);
    var exclusive = l.type === 'exclusive';
    var blocks = [
      { h: '1. Partes' },
      { p: '**EL PRODUCTOR:** ' + prof.name + ', conocido artísticamente como ' + prof.artist + (prof.alias ? ' y ' + prof.alias : '') + ', con DNI ' + (prof.dni || '__________') + ', de ' + prof.city + '.' },
      { p: '**EL ARTISTA:** ' + (lic.name || '______________________') + (lic.artist ? ', conocido artísticamente como ' + lic.artist : '') + ', con DNI ' + (lic.dni || '__________') + (lic.email ? ', correo ' + lic.email : '') + (lic.phone ? ', teléfono ' + lic.phone : '') + '.' },
      { h: '2. Objeto' },
      { p: 'EL PRODUCTOR otorga a EL ARTISTA una licencia **' + t.label.toLowerCase() + '** para usar la obra instrumental **«' + beat + '»**' + (b && (b.bpm || b.key) ? ' (' + [b.bpm ? b.bpm + ' BPM' : '', b.key ? b.key : ''].filter(Boolean).join(', ') + ')' : '') + ', en adelante EL BEAT, en ' + song + ' (en adelante, LA CANCIÓN), en los términos de este contrato.' },
      { h: '3. Archivos entregados' },
      { p: t.files + '. EL PRODUCTOR los envía por enlace de descarga dentro de los ' + (l.deliveryDays || 2) + ' días siguientes al pago.' },
      { h: '4. Alcance del uso' },
      { bullets: [
        'Distribución de LA CANCIÓN en plataformas digitales (Spotify, Apple Music, YouTube y otras) ' + (l.streams == null ? '**sin límite de reproducciones**.' : 'hasta **' + n(l.streams) + ' reproducciones** sumando todas las plataformas.'),
        (l.videos == null ? '**Videoclips sin límite.**' : 'Hasta **' + l.videos + (l.videos === 1 ? ' videoclip oficial**.' : ' videoclips oficiales**.')),
        'Presentaciones en vivo, con o sin fines de lucro.',
        (l.copies == null ? 'Venta de copias físicas sin límite.' : l.copies ? 'Venta de hasta ' + n(l.copies) + ' copias físicas (CD, vinilo, casete).' : 'Sin venta de copias físicas.'),
        l.radio ? 'Difusión en radio y televisión.' : 'Radio y televisión: no incluidas en esta licencia.',
        'Uso en cine, publicidad, series o videojuegos (sincronización): requiere un acuerdo aparte.'
      ] },
      { h: '5. Exclusividad' },
      { p: exclusive
        ? 'Esta licencia **es exclusiva**. Desde la firma, EL PRODUCTOR retira EL BEAT de su catálogo y no lo licenciará a nadie más. Las licencias no exclusivas que otorgó antes de esta fecha siguen vigentes hasta que venzan.'
        : 'Esta licencia **no es exclusiva**. EL PRODUCTOR puede seguir licenciando EL BEAT a otros artistas y venderlo en exclusiva a un tercero. Si eso pasa, esta licencia sigue vigente en los mismos términos.' },
      { h: '6. Autoría, máster y créditos' },
      { p: 'EL PRODUCTOR es y sigue siendo el autor de EL BEAT. En LA CANCIÓN, la autoría se reparte así: **' + pub + ' %** para EL PRODUCTOR por la música y **' + (100 - pub) + ' %** para EL ARTISTA y sus coautores por la letra y la melodía vocal. Cada parte puede registrar su porcentaje ante APDAYC u otra sociedad de gestión colectiva.' },
      { p: 'EL ARTISTA es dueño de la grabación de su voz y del máster de LA CANCIÓN. En toda publicación debe aparecer el crédito **«' + (l.credit || 'Prod. ' + (prof.alias || prof.artist)) + '»** en el título o en los créditos de cada plataforma.' },
      { h: '7. Lo que no se puede hacer' },
      { bullets: [
        'Revender, sublicenciar o distribuir EL BEAT solo, sin la voz de EL ARTISTA.',
        'Registrar EL BEAT a nombre propio o presentarlo como obra propia.',
        exclusive ? 'Inscribir EL BEAT solo en sistemas de identificación de contenido. LA CANCIÓN sí puede inscribirse (por ejemplo, en Content ID de YouTube).'
          : 'Inscribir EL BEAT o LA CANCIÓN en sistemas de identificación de contenido (como Content ID de YouTube) de forma que generen reclamos contra EL PRODUCTOR u otros licenciatarios.'
      ] },
      { h: '8. Precio y pago' },
      { p: inKind
        ? 'El pago es **en especie**: ' + l.payMethod.toLowerCase() + ', por un valor referencial de **' + price + '**' + (l.payDate ? ', a entregar el ' + KR.fmtDateLong(l.payDate) : '') + '. EL PRODUCTOR confirma la recepción por escrito.'
        : 'EL ARTISTA paga **' + price + '** mediante ' + l.payMethod.toLowerCase() + (l.payDate ? ', el ' + KR.fmtDateLong(l.payDate) : ', antes de la entrega de los archivos') + '. El pago no es reembolsable una vez entregados los archivos.' },
      { h: '9. Vigencia y territorio' },
      { p: 'La licencia rige en todo el mundo desde la firma' + (l.years ? ' y durante **' + l.years + (l.years === 1 ? ' año**' : ' años**') : ' y **sin plazo de vencimiento**') + '. Si EL ARTISTA supera los límites de la cláusula 4, puede ampliar la licencia pagando la diferencia con la licencia que corresponda.' },
      { h: '10. Incumplimiento' },
      { p: 'Si EL ARTISTA usa EL BEAT fuera de lo acordado, EL PRODUCTOR puede dar por terminada la licencia y pedir que LA CANCIÓN se retire de las plataformas, sin perjuicio de las acciones legales que correspondan.' },
      { h: '11. Ley aplicable' },
      { p: 'Este contrato se rige por las leyes del Perú, en especial el Decreto Legislativo N.° 822, Ley sobre el Derecho de Autor. Cualquier controversia se resuelve ante los jueces de ' + cityOf(prof) + '.' }
    ];
    return {
      kicker: prof.label || 'Lattice Rekords',
      title: 'Contrato de licencia de beat',
      subtitle: t.label + ' · ' + (l.credit || 'Prod. ' + (prof.alias || prof.artist)),
      ref: 'N.° ' + l.number,
      date: KR.fmtDateLong(l.date),
      meta: [['Beat', beat], ['Licencia', t.label], ['Precio', price], ['Vigencia', l.years ? l.years + (l.years === 1 ? ' año' : ' años') : 'Indefinida']],
      blocks: blocks,
      place: 'Firmado en ' + cityOf(prof) + ', el ' + KR.fmtDateLong(l.date) + '.',
      signatures: [
        { role: 'El productor', name: prof.name + ' (' + prof.artist + ')', sub: 'DNI ' + (prof.dni || '__________') },
        { role: 'El artista', name: (lic.name || '______________________') + (lic.artist ? ' (' + lic.artist + ')' : ''), sub: 'DNI ' + (lic.dni || '__________') }
      ],
      footer: String(prof.web || '').replace(/^https?:\/\//, '').replace(/\/$/, '') + ' · ' + (prof.label || '') + ' · ' + prof.city,
      author: prof.name, subject: 'Licencia ' + t.label + ' de ' + beat
    };
  };

  function stageFor(status) { return status === 'pagada' ? 'cobrado' : status === 'firmada' ? 'confirmado' : 'cotizado'; }
  function syncDeal(l) {
    if (!l.dealId) return;
    var d = KR.store.get('deals', l.dealId); if (!d) return;
    KR.store.put('deals', Object.assign({}, d, {
      title: 'Licencia ' + TYPES[l.type].label.toLowerCase() + ' · ' + beatName(l),
      client: l.licensee.artist || l.licensee.name || d.client, amount: KR.num(l.price, 0), currency: l.currency,
      stage: stageFor(l.status), paid: l.status === 'pagada' ? KR.num(l.price, 0) : (d.paid || 0)
    }), { silent: true });
  }
  function countSale(l) {
    if (l.status !== 'pagada' || l.counted || !l.beatId) return l;
    var b = KR.store.get('beats', l.beatId);
    if (b) {
      var upd = Object.assign({}, b, { sold: (+b.sold || 0) + 1 });
      if (l.type === 'exclusive') upd.status = 'vendido';
      KR.store.put('beats', upd, { silent: true });
      KR.toast(l.type === 'exclusive' ? b.title + ' pasó a vendido en exclusiva' : 'Se sumó una licencia a ' + b.title);
    }
    return Object.assign({}, l, { counted: true });
  }

  /* ---------- lista ---------- */
  function renderList(el, ctx) {
    el.innerHTML = KR.head({
      title: 'Licencias',
      lead: 'Cotiza por WhatsApp y entrega el precio y las condiciones por escrito, como dice tu web. Cada licencia genera su contrato en PDF.',
      actions: '<button class="btn solid" type="button" data-act="new">' + KR.icon('plus') + 'Nueva licencia</button>'
    }) + '<dl class="kpis" id="lic-kpis"></dl><div id="lic-list"></div>' +
      '<section class="lic-types">' + Object.keys(TYPES).map(function (k) {
        var t = TYPES[k], st = KR.store.doc('settings');
        return '<article class="panel panel-pad lic-type"><span class="label">' + esc(t.nick) + '</span><h3>' + esc(t.label) + '</h3>' +
          '<p class="muted">' + esc(t.files) + '. ' + (t.streams ? 'Hasta ' + n(t.streams) + ' reproducciones.' : 'Sin límites de uso.') + '</p>' +
          '<b class="lic-price">' + KR.fmtMoney(st.prices[k], st.currency) + '</b>' + (st.pricesAreExample ? '<small class="hint">Precio de ejemplo: cámbialo en Ajustes.</small>' : '') + '</article>';
      }).join('') + '</section>';
    var $ = function (s) { return KR.$(s, el); };
    function paint() {
      var all = KR.store.list('licenses').slice().sort(function (a, b) { return String(b.number).localeCompare(String(a.number)); });
      var y = String(new Date().getFullYear());
      var paid = all.filter(function (l) { return l.status === 'pagada'; });
      var pend = all.filter(function (l) { return l.status === 'firmada'; });
      $('#lic-kpis').innerHTML =
        '<div class="kpi"><dt>Emitidas en ' + y + '</dt><dd class="k-val">' + all.filter(function (l) { return String(l.date).slice(0, 4) === y; }).length + '</dd></div>' +
        '<div class="kpi amber"><dt>Cobrado</dt><dd class="k-val">' + KR.money(KR.sum(paid, function (l) { return KR.num(l.price, 0); })) + '</dd></div>' +
        '<div class="kpi"><dt>Firmadas sin pagar</dt><dd class="k-val">' + KR.money(KR.sum(pend, function (l) { return KR.num(l.price, 0); })) + '</dd></div>' +
        '<div class="kpi"><dt>Exclusivas</dt><dd class="k-val">' + all.filter(function (l) { return l.type === 'exclusive'; }).length + '</dd></div>';
      if (!all.length) {
        $('#lic-list').innerHTML = KR.empty({ icon: 'doc', title: 'Aún no emites licencias', text: 'Empieza desde un beat del catálogo con "Cotizar" o crea una licencia en blanco.', action: '<a class="btn" href="#beats">Ir al catálogo</a><button class="btn solid" type="button" data-act="new">Nueva licencia</button>' });
        return;
      }
      $('#lic-list').innerHTML = '<div class="table-wrap"><table class="tbl"><thead><tr><th>N.°</th><th>Fecha</th><th>Beat</th><th>Artista</th><th>Tipo</th><th class="r">Precio</th><th>Estado</th></tr></thead><tbody>' +
        all.map(function (l) {
          var s = STATES[l.status] || STATES.cotizada;
          return '<tr class="click-row" data-href="#licencias-' + l.id + '"><td class="mono"><a href="#licencias-' + l.id + '">' + esc(l.number) + '</a></td><td class="num">' + KR.fmtDate(l.date) + '</td><td>' + esc(beatName(l)) + '</td><td>' + esc(l.licensee.artist || l.licensee.name || '—') + '</td><td>' + esc(TYPES[l.type].label) + '</td><td class="r num">' + KR.fmtMoney(l.price, l.currency) + '</td><td>' + KR.pill(s.label, s.tone) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act="new"]')) { var l = newLicense(); KR.go('licencias-' + l.id); return; }
      var row = e.target.closest('[data-href]');
      if (row && !e.target.closest('a')) location.hash = row.getAttribute('data-href');
    });
    ctx.sub(function (ev) { if (ev.col === 'licenses' || ev.type === 'reset') paint(); });
    paint();
  }

  /* ---------- editor ---------- */
  function renderEditor(el, lic, ctx) {
    var model = KR.clone(lic), st = KR.store.doc('settings'), prof = KR.store.doc('profile');
    var save = KR.debounce(function () { KR.store.put('licenses', model, { silent: true }); syncDeal(model); }, 300);
    var beats = KR.store.list('beats');
    el.innerHTML = KR.head({
      title: 'Licencia', back: 'licencias',
      lead: '<span class="mono">' + esc(model.number) + '</span> · Completa los datos del artista y descarga el contrato listo para firmar.',
      actions: '<button class="btn ghost sm danger-text" type="button" data-act="delete">' + KR.icon('trash') + 'Borrar</button>'
    }) +
      '<div class="doc-layout">' +
      '<form class="doc-form stack" id="lic-form" autocomplete="off">' +
      '<section class="panel"><div class="panel-head"><h2>Beat y canción</h2></div><div class="panel-pad form-grid">' +
      KR.field({ id: 'l-beat', name: 'beatId', label: 'Beat', type: 'select', value: model.beatId, options: [{ value: '', label: model.beatTitle ? model.beatTitle + ' (fuera del catálogo)' : 'Elige un beat' }].concat(beats.map(function (b) { return { value: b.id, label: b.title + (b.status === 'vendido' ? ' · vendido' : '') }; })) }) +
      KR.field({ id: 'l-beat-t', name: 'beatTitle', label: 'O escribe el título', value: model.beatId ? '' : model.beatTitle, hint: 'Si el beat no está en el catálogo.' }) +
      KR.field({ id: 'l-song', name: 'song', label: 'Canción del artista', value: model.song, cls: 'full', hint: 'Si aún no tiene nombre, el contrato dice "una canción nueva".' }) +
      '</div></section>' +
      '<section class="panel"><div class="panel-head"><h2>Artista</h2></div><div class="panel-pad form-grid">' +
      KR.field({ id: 'l-name', name: 'lic.name', label: 'Nombre legal', value: model.licensee.name }) +
      KR.field({ id: 'l-artist', name: 'lic.artist', label: 'Nombre artístico', value: model.licensee.artist }) +
      KR.field({ id: 'l-dni', name: 'lic.dni', label: 'DNI', value: model.licensee.dni, attrs: 'inputmode="numeric"' }) +
      KR.field({ id: 'l-phone', name: 'lic.phone', label: 'WhatsApp', type: 'tel', value: model.licensee.phone, hint: 'Con código de país: +51…' }) +
      KR.field({ id: 'l-email', name: 'lic.email', label: 'Correo', type: 'email', value: model.licensee.email, cls: 'full' }) +
      '</div></section>' +
      '<section class="panel"><div class="panel-head"><h2>Licencia</h2></div><div class="panel-pad stack">' +
      '<div class="seg lic-seg" id="l-type" role="group" aria-label="Tipo de licencia">' + Object.keys(TYPES).map(function (k) {
        return '<button type="button" data-type="' + k + '" aria-pressed="' + (model.type === k) + '">' + esc(TYPES[k].nick) + '<small>' + esc(TYPES[k].label) + '</small></button>';
      }).join('') + '</div>' +
      '<div class="form-grid">' +
      KR.field({ id: 'l-price', name: 'price', label: 'Precio', type: 'number', value: model.price, attrs: 'min="0" step="1" inputmode="decimal"' }) +
      KR.field({ id: 'l-cur', name: 'currency', label: 'Moneda', type: 'select', value: model.currency, options: [{ value: 'PEN', label: 'Soles (S/)' }, { value: 'USD', label: 'Dólares (US$)' }] }) +
      KR.field({ id: 'l-streams', name: 'streams', label: 'Reproducciones', type: 'number', value: model.streams == null ? '' : model.streams, attrs: 'min="0" step="1000" placeholder="Sin límite" inputmode="numeric"' }) +
      KR.field({ id: 'l-videos', name: 'videos', label: 'Videoclips', type: 'number', value: model.videos == null ? '' : model.videos, attrs: 'min="0" placeholder="Sin límite" inputmode="numeric"' }) +
      KR.field({ id: 'l-copies', name: 'copies', label: 'Copias físicas', type: 'number', value: model.copies == null ? '' : model.copies, attrs: 'min="0" placeholder="Sin límite" inputmode="numeric"' }) +
      KR.field({ id: 'l-years', name: 'years', label: 'Vigencia (años)', type: 'number', value: model.years == null ? '' : model.years, attrs: 'min="1" placeholder="Indefinida" inputmode="numeric"' }) +
      KR.field({ id: 'l-credit', name: 'credit', label: 'Crédito obligatorio', value: model.credit }) +
      KR.field({ id: 'l-pub', name: 'pubShare', label: '% de autoría del productor', type: 'number', value: model.pubShare, attrs: 'min="0" max="100" inputmode="numeric"', hint: 'Lo usual en beats es 50 %.' }) +
      '<label class="check full"><input type="checkbox" name="radio" id="l-radio"' + (model.radio ? ' checked' : '') + '> Incluye radio y televisión</label>' +
      '</div><p class="hint">Deja un campo vacío para que sea sin límite.</p></div></section>' +
      '<section class="panel"><div class="panel-head"><h2>Pago y estado</h2></div><div class="panel-pad form-grid">' +
      KR.field({ id: 'l-pay', name: 'payMethod', label: 'Forma de pago', type: 'select', value: model.payMethod, options: st.payMethods || [] }) +
      KR.field({ id: 'l-paydate', name: 'payDate', label: 'Fecha de pago', type: 'date', value: model.payDate }) +
      KR.field({ id: 'l-date', name: 'date', label: 'Fecha del contrato', type: 'date', value: model.date }) +
      KR.field({ id: 'l-status', name: 'status', label: 'Estado', type: 'select', value: model.status, options: Object.keys(STATES).map(function (k) { return { value: k, label: STATES[k].label }; }) }) +
      '</div></section>' +
      '</form>' +
      '<aside class="doc-side"><div class="doc-actions">' +
      '<button class="btn solid" type="button" data-act="pdf">' + KR.icon('download') + 'Contrato PDF</button>' +
      '<button class="btn" type="button" data-act="quote">' + KR.icon('copy') + 'Copiar cotización</button>' +
      '<a class="btn" id="l-wa" target="_blank" rel="noopener">' + KR.icon('send') + 'WhatsApp</a>' +
      '<button class="btn ghost" type="button" data-act="deal" id="l-deal"></button>' +
      '</div><p class="hint">Plantilla de referencia bajo la ley peruana (D. L. 822). Para acuerdos grandes, que la revise un abogado.</p>' +
      '<div class="paper-wrap" id="l-paper"></div></aside></div>';

    var $ = function (s) { return KR.$(s, el); };
    function paint() {
      $('#l-paper').innerHTML = KR.pdf.docHTML(KR.licenseDoc(model));
      var phone = model.licensee.phone;
      var wa = $('#l-wa');
      wa.href = KR.waLink(phone || '', KR.licenseQuote(model));
      wa.title = phone ? 'Abre WhatsApp con la cotización para ' + phone : 'Sin número: elige el contacto en WhatsApp';
      $('#l-deal').innerHTML = KR.icon('calendar') + (model.dealId && KR.store.get('deals', model.dealId) ? 'Ver en agenda' : 'Llevar a la agenda');
    }
    var form = $('#lic-form');
    form.addEventListener('input', function (e) {
      var name = e.target.name; if (!name) return;
      var v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      if (name.indexOf('lic.') === 0) model.licensee[name.slice(4)] = v;
      else if (['streams', 'videos', 'copies', 'years'].indexOf(name) >= 0) model[name] = v === '' ? null : Math.max(0, Math.round(KR.num(v)));
      else if (name === 'price' || name === 'pubShare') model[name] = KR.num(v, 0);
      else if (name === 'beatId') { model.beatId = v; if (v) { model.beatTitle = (KR.store.get('beats', v) || {}).title || ''; $('#l-beat-t').value = ''; } }
      else if (name === 'beatTitle') { model.beatTitle = v; if (v) { model.beatId = ''; $('#l-beat').value = ''; } }
      else model[name] = v;
      if (name === 'status') { model = countSale(model); }
      paint(); save();
    });
    el.addEventListener('click', function (e) {
      var tb = e.target.closest('[data-type]');
      if (tb) {
        var k = tb.getAttribute('data-type'), t = TYPES[k];
        model.type = k; model.price = st.prices[k];
        ['streams', 'videos', 'copies', 'radio', 'years'].forEach(function (f) { model[f] = t[f]; });
        KR.$$('[data-type]', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b === tb)); });
        $('#l-price').value = model.price;
        ['streams', 'videos', 'copies', 'years'].forEach(function (f) { $('#l-' + f).value = model[f] == null ? '' : model[f]; });
        $('#l-radio').checked = !!model.radio;
        paint(); save(); return;
      }
      var a = e.target.closest('[data-act]'); if (!a) return;
      var act = a.getAttribute('data-act');
      if (act === 'pdf') {
        var bytes = KR.pdf.renderDoc(KR.licenseDoc(model));
        KR.saveFile('licencia-' + model.number + '-' + KR.slug(beatName(model)) + '.pdf', new Blob([bytes], { type: 'application/pdf' }), 'application/pdf');
      }
      if (act === 'quote') KR.copy(KR.licenseQuote(model), 'Cotización copiada');
      if (act === 'deal') {
        var existing = model.dealId && KR.store.get('deals', model.dealId);
        if (existing) { KR.go('agenda-' + existing.id); return; }
        var d = KR.store.put('deals', { type: 'beat', title: 'Licencia ' + TYPES[model.type].label.toLowerCase() + ' · ' + beatName(model), client: model.licensee.artist || model.licensee.name || 'Artista', channel: 'whatsapp', date: model.date, stage: stageFor(model.status), amount: KR.num(model.price, 0), currency: model.currency, paid: model.status === 'pagada' ? KR.num(model.price, 0) : 0, licenseId: model.id, contact: model.licensee.phone || '' });
        model.dealId = d.id; KR.store.put('licenses', model, { silent: true });
        paint();
        KR.toast('Agregada a la agenda', { action: 'Ver', onAction: function () { KR.go('agenda-' + d.id); } });
      }
      if (act === 'delete') {
        KR.confirm('¿Borrar la licencia ' + model.number + '?', 'El número no se reutiliza.').then(function (ok) {
          if (!ok) return;
          KR.store.remove('licenses', model.id); KR.go('licencias');
        });
      }
    });
    ctx.cleanup(function () { KR.store.put('licenses', model, { silent: true }); });
    paint();
  }

  KR.view('licencias', {
    title: 'Licencias', icon: 'doc',
    render: function (el, arg, ctx) {
      if (arg && arg.indexOf('nuevo') === 0) {
        var l = newLicense(arg.slice(6) || null);
        location.replace('#licencias-' + l.id);
        return;
      }
      var lic = arg ? KR.store.get('licenses', arg) : null;
      if (lic) renderEditor(el, lic, ctx); else renderList(el, ctx);
    }
  });
})();
