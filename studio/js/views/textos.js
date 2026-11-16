/* KTRL Room · Textos
   Plantillas para Instagram, WhatsApp, captions y bios con tu voz: mensajes cortos, una pregunta a la vez.
   El flujo "comentario → DM" sigue el playbook de calificación de Instagram. Dentro de Claude, además redacta con IA. */
(function () {
  'use strict';
  var KR = window.KR, esc = KR.esc;
  var current = 'ig-dm';

  function prof() { return KR.store.doc('profile'); }
  function st() { return KR.store.doc('settings'); }
  function nextEvent() {
    return KR.store.list('events').filter(function (e) { return e.date && KR.daysUntil(e.date) >= 0; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; })[0] || KR.store.list('events')[0] || null;
  }
  function payList() { return (st().payMethods || []).filter(function (m) { return ['Donación', 'Juguetes para niños', 'Comida para albergues'].indexOf(m) < 0; }).join(', '); }
  function at(u) { u = String(u || '').trim(); return u ? (u[0] === '@' ? u : '@' + u) : ''; }

  var T = [
    { id: 'ig-dm', cat: 'Instagram', title: 'Comentario → DM', note: 'Respuesta pública corta y un DM que retoma lo que dijo y termina con una sola pregunta. Tienes 7 días desde el comentario para escribirle por privado; luego el chat libre dura 24 horas desde su último mensaje.',
      fields: [
        { id: 'user', label: 'Usuario', def: function () { return '@usuario'; } },
        { id: 'about', label: 'Comentó sobre', type: 'select', options: ['un beat', 'un evento', 'un set o mix', 'producción musical'], def: function () { return 'un beat'; } },
        { id: 'what', label: 'Cuál (beat, evento…)', def: function () { var b = KR.store.list('beats')[0]; return b ? b.title : ''; } }
      ],
      out: function (v) {
        var u = at(v.user), w = v.what ? ' «' + v.what + '»' : '';
        var q = { 'un beat': 'Hola ' + u + ', vi tu comentario en' + (w || ' el beat') + '. ¿Lo quieres para un single, un álbum o un video?',
          'un evento': 'Hola ' + u + ', gracias por comentar' + (w ? ' en' + w : '') + '. ¿Te separo una entrada en preventa?',
          'un set o mix': 'Hola ' + u + ', gracias por escuchar' + (w || ' el set') + '. ¿Buscas DJ para alguna fecha?',
          'producción musical': 'Hola ' + u + ', vi que te interesa producir. ¿Ya tienes letra o empezamos desde el beat?' }[v.about];
        return [{ label: 'Respuesta pública', text: 'Te escribí al DM 📩' }, { label: 'Mensaje privado', text: q }];
      } },
    { id: 'wa-beat', cat: 'WhatsApp', title: 'Precio de beats',
      fields: [{ id: 'name', label: 'Nombre', def: function () { return ''; } }],
      out: function (v) {
        var p = st().prices, c = st().currency;
        return [{ label: 'Mensaje', text: 'Hola' + (v.name ? ' ' + v.name : '') + ', estas son las licencias:\n\n• Uso compartido (no exclusiva): ' + KR.fmtMoney(p.basic, c) + '\n• Para mezclar (con stems): ' + KR.fmtMoney(p.stems, c) + '\n• Solo tuyo (exclusiva): ' + KR.fmtMoney(p.exclusive, c) +
          (st().promo3x2 ? '\n\nPromo 3x2: llevando tres beats, el más barato va de regalo.' : '') + '\nPago por ' + payList() + '.\n\nEl catálogo está aquí: ' + prof().beatsUrl + '\n¿Cuál te gustó?' }];
      } },
    { id: 'wa-booking', cat: 'WhatsApp', title: 'Consulta de booking',
      fields: [{ id: 'name', label: 'Nombre', def: function () { return ''; } }],
      out: function (v) { return [{ label: 'Mensaje', text: 'Hola' + (v.name ? ' ' + v.name : '') + ', gracias por escribir. Para cotizarte, ¿qué fecha y en qué ciudad sería?' }]; } },
    { id: 'wa-quote', cat: 'WhatsApp', title: 'Cotización de set',
      fields: [
        { id: 'name', label: 'Nombre', def: function () { return ''; } },
        { id: 'date', label: 'Fecha', def: function () { var e = nextEvent(); return e && e.date ? KR.fmtDate(e.date, { weekday: true }) : ''; } },
        { id: 'len', label: 'Duración del set', def: function () { return '2 horas'; } },
        { id: 'price', label: 'Cachet', def: function () { return ''; } },
        { id: 'gear', label: 'Equipo', type: 'select', options: ['el organizador pone CDJ y mixer', 'llevo mi controlador', 'llevo controlador y sonido'], def: function () { return 'el organizador pone CDJ y mixer'; } }
      ],
      out: function (v) {
        return [{ label: 'Mensaje', text: 'Hola' + (v.name ? ' ' + v.name : '') + ', te paso la propuesta:\n\n• Set de ' + v.len + (v.date ? ' el ' + v.date : '') + '\n• Equipo: ' + v.gear + '\n• Cachet: ' + (v.price || '—') + '\n\nPara separar la fecha pido el 50 % de adelanto por ' + payList() + '. Te mando el rider técnico apenas confirmes.' }];
      } },
    { id: 'wa-confirm', cat: 'WhatsApp', title: 'Confirmación de fecha',
      fields: [{ id: 'name', label: 'Nombre', def: function () { return ''; } }, { id: 'event', label: 'Evento', def: function () { var e = nextEvent(); return e ? e.name : ''; } }, { id: 'when', label: 'Cuándo', def: function () { var e = nextEvent(); return e && e.date ? KR.fmtDate(e.date, { weekday: true }) + (e.start ? ', ' + KR.fmtTime(KR.parseTime(e.start)) : '') : ''; } }],
      out: function (v) { return [{ label: 'Mensaje', text: 'Hola' + (v.name ? ' ' + v.name : '') + ', confirmado: ' + (v.event || 'el set') + (v.when ? ' el ' + v.when : '') + '. Llego una hora antes para la prueba de sonido. Cualquier cambio me avisas.' }]; } },
    { id: 'wa-pay', cat: 'WhatsApp', title: 'Recordatorio de pago',
      fields: [{ id: 'name', label: 'Nombre', def: function () { return ''; } }, { id: 'what', label: 'Por qué', def: function () { return 'el set del sábado'; } }, { id: 'amount', label: 'Saldo', def: function () { return ''; } }],
      out: function (v) { return [{ label: 'Mensaje', text: 'Hola' + (v.name ? ' ' + v.name : '') + ', gracias de nuevo por ' + v.what + '. Te recuerdo el saldo' + (v.amount ? ' de ' + v.amount : '') + '. Puedes pagar por ' + payList() + '.' }]; } },
    { id: 'wa-gear', cat: 'WhatsApp', title: 'Alquiler de equipos',
      fields: [{ id: 'name', label: 'Nombre', def: function () { return ''; } }, { id: 'items', label: 'Equipos', def: function () { return 'controlador de DJ y dos parlantes'; } }],
      out: function (v) { return [{ label: 'Mensaje', text: 'Hola' + (v.name ? ' ' + v.name : '') + ', sí tengo ' + v.items + '. ¿Para qué fecha y cuántas horas los necesitas? Si quieres, también me encargo del montaje.' }]; } },
    { id: 'cap-beat', cat: 'Captions', title: 'Beat nuevo de Bness',
      fields: [{ id: 'title', label: 'Beat o tape', def: function () { var b = KR.store.list('beats')[0]; return b ? b.title : ''; } }, { id: 'vibe', label: 'Vibra', def: function () { return 'boom bap oscuro'; } }],
      out: function (v) { return [{ label: 'Caption', text: (v.title || 'Beat nuevo').toUpperCase() + ' · ' + v.vibe + '\n\nYa está en el catálogo de ' + (prof().alias || 'Bness') + '. Licencias por DM' + (st().promo3x2 ? ', con promo 3x2' : '') + '.\n\n🎧 ' + prof().beatsUrl.replace(/^https?:\/\//, '') + '\n\n#beats #boombap #trap #productor #tacna #peru' }]; } },
    { id: 'cap-release', cat: 'Captions', title: 'Lanzamiento',
      fields: [{ id: 'title', label: 'Título', def: function () { var r = KR.store.list('releases').filter(function (x) { return x.status !== 'publicado'; })[0] || KR.store.list('releases')[0]; return r ? r.title : ''; } }, { id: 'kind', label: 'Tipo', def: function () { return 'EP'; } }, { id: 'line', label: 'Una línea sobre el disco', def: function () { return 'Paisajes electrónicos para escuchar de noche.'; } }],
      out: function (v) { return [{ label: 'Caption', text: (v.title || '').toUpperCase() + ' · ' + v.kind + ' disponible\n\n' + v.line + '\n\nEn todas las plataformas. Link en la bio.\n\n#musicaelectronica #' + KR.slug(prof().artist).replace(/-/g, '') + ' #tacna' }]; } },
    { id: 'cap-event', cat: 'Captions', title: 'Anuncio de evento',
      fields: [{ id: 'event', label: 'Evento', type: 'event', def: function () { var e = nextEvent(); return e ? e.id : ''; } }],
      out: function (v) {
        var e = KR.store.get('events', v.event);
        if (!e) return [{ label: 'Caption', text: 'Elige un evento.' }];
        return [{ label: 'Caption', text: KR.lineupText(e) + '\n\n' + (e.organizers ? e.organizers + '\n' : '') + '#techno #house #' + KR.slug(e.city || 'tacna').replace(/-/g, '') }];
      } },
    { id: 'cap-recap', cat: 'Captions', title: 'Gracias post evento',
      fields: [{ id: 'event', label: 'Evento', def: function () { var e = KR.store.list('events')[0]; return e ? e.name : ''; } }],
      out: function (v) { return [{ label: 'Caption', text: 'Gracias a todos los que llegaron a ' + v.event + '. Sonó como queríamos. Pronto la próxima.\n\n📷 Etiquétennos en sus fotos.' }]; } },
    { id: 'bio-es', cat: 'Bios', title: 'Bio corta',
      fields: [],
      out: function () { var p = prof(); return [{ label: 'Instagram (máx. 150)', text: 'Productor y DJ · ' + p.genres + '\n' + p.label + ' · ' + String(p.city).split(',')[0] + '\nBeats como ' + p.alias + ' 👇' }, { label: 'En inglés', text: 'Producer & DJ · Hip hop, trap & electronic\n' + p.label + ' · ' + String(p.city).split(',')[0] + ', Peru\nBeats as ' + p.alias }]; } },
    { id: 'bio-press', cat: 'Bios', title: 'Bio para prensa',
      fields: [],
      out: function () {
        var p = prof();
        return [{ label: 'Párrafo', text: p.name + ', conocido como ' + p.artist + ', es productor y DJ de ' + p.city + '. Explora el hip hop, el trap y la electrónica sin quedarse en ninguno. Ha producido para Jeydee Psycho, Dekaesse, Oriel X, Mr. Bless y DJ Azúcar, y para los colectivos Black Flow y Fire in the Ghetto. En la electrónica publicó el EP 13 (2024) y el álbum 12 (2025). Como ' + p.alias + ' lleva un catálogo de beats para artistas, y desde ' + p.label + ' produce eventos y diseña sus afiches.' }];
      } }
  ];

  function fieldHtml(f) {
    var v = f.def ? f.def() : '';
    if (f.type === 'select') return KR.field({ id: 'tf-' + f.id, name: f.id, label: f.label, type: 'select', value: v, options: f.options });
    if (f.type === 'event') return KR.field({ id: 'tf-' + f.id, name: f.id, label: f.label, type: 'select', value: v, options: KR.store.list('events').map(function (e) { return { value: e.id, label: e.name }; }) });
    return KR.field({ id: 'tf-' + f.id, name: f.id, label: f.label, value: v });
  }

  KR.view('textos', {
    title: 'Textos', icon: 'chat',
    render: function (el, arg, ctx) {
      if (arg && T.some(function (t) { return t.id === arg; })) current = arg;
      var cats = [];
      T.forEach(function (t) { if (cats.indexOf(t.cat) < 0) cats.push(t.cat); });
      el.innerHTML = KR.head({
        title: 'Textos',
        lead: 'Respuestas y captions con tu voz: cortos, directos, una pregunta a la vez. Toca un texto para copiarlo.'
      }) +
        '<div class="tx-layout"><nav class="tx-nav panel" aria-label="Plantillas">' + cats.map(function (c) {
          return '<div class="tx-group"><span class="nav-label">' + c + '</span>' + T.filter(function (t) { return t.cat === c; }).map(function (t) {
            return '<button type="button" class="tx-item" data-t="' + t.id + '" aria-pressed="' + (t.id === current) + '">' + esc(t.title) + '</button>';
          }).join('') + '</div>';
        }).join('') + '<div class="tx-group" id="mine-group"></div></nav>' +
        '<section class="tx-main stack" id="tx-main"></section></div>' +
        '<section class="panel ai-panel" id="ai" hidden><div class="panel-head"><h2>' + KR.icon('sparkle') + ' Redactar con Claude</h2><span class="label">usa tu cuenta de Claude</span></div>' +
        '<div class="panel-pad stack"><div class="form-grid">' +
        KR.field({ id: 'ai-ask', label: 'Qué necesitas', type: 'textarea', rows: 3, cls: 'full', value: '', attrs: 'placeholder="Ej.: caption para anunciar el EP con su fecha, o una respuesta a alguien que pide descuento en un beat"' }) +
        KR.field({ id: 'ai-tone', label: 'Tono', type: 'select', value: 'cercano', options: [{ value: 'cercano', label: 'Cercano' }, { value: 'profesional', label: 'Profesional' }, { value: 'callejero', label: 'Callejero' }] }) +
        KR.field({ id: 'ai-len', label: 'Largo', type: 'select', value: 'corto', options: [{ value: 'corto', label: 'Corto' }, { value: 'medio', label: 'Medio' }] }) +
        '<div class="field full"><span class="flabel">Que tenga en cuenta</span><div class="row"><label class="check"><input type="checkbox" id="ai-c-event" checked> Próximo evento</label><label class="check"><input type="checkbox" id="ai-c-beats"> Catálogo de beats</label><label class="check"><input type="checkbox" id="ai-c-prices"> Precios de licencias</label></div></div>' +
        '</div><div class="row"><button class="btn solid" type="button" data-act="ai-go">' + KR.icon('sparkle') + 'Redactar</button><button class="btn ghost" type="button" data-act="ai-stop" hidden>Detener</button></div>' +
        '<div class="ai-out" id="ai-out" aria-live="polite"></div>' +
        '<div class="row" id="ai-acts" hidden><button class="btn sm" type="button" data-act="ai-copy">' + KR.icon('copy') + 'Copiar</button><button class="btn sm ghost" type="button" data-act="ai-again">Otra versión</button><button class="btn sm ghost" type="button" data-act="ai-save">Guardar como plantilla</button></div>' +
        '</div></section>' +
        (KR.inClaude ? '' : '<p class="note">' + KR.icon('sparkle') + '<span>Cuando abres KTRL Room dentro de Claude, este módulo también redacta textos nuevos con IA.</span></p>');

      var $ = function (s) { return KR.$(s, el); };
      function tpl() { return T.find(function (t) { return t.id === current; }); }
      function paintMine() {
        var mine = KR.store.list('textos');
        $('#mine-group').innerHTML = mine.length ? '<span class="nav-label">Mis plantillas</span>' + mine.map(function (m) {
          return '<button type="button" class="tx-item" data-mine="' + m.id + '" aria-pressed="' + (current === 'mine-' + m.id) + '">' + esc(m.title) + '</button>';
        }).join('') : '';
      }
      function paintMain() {
        if (current.indexOf('mine-') === 0) {
          var m = KR.store.get('textos', current.slice(5));
          if (!m) { current = 'ig-dm'; return paintMain(); }
          $('#tx-main').innerHTML = '<div class="panel panel-pad stack"><h2 class="tx-title">' + esc(m.title) + '</h2><button class="tx-out" type="button" data-copy><span class="label">Texto guardado</span><span class="tx-text">' + esc(m.body) + '</span><i>' + KR.icon('copy') + ' Copiar</i></button>' +
            '<div class="row"><button class="btn sm ghost danger-text" type="button" data-act="mine-del">' + KR.icon('trash') + 'Borrar plantilla</button></div></div>';
          return;
        }
        var t = tpl();
        $('#tx-main').innerHTML = '<div class="panel panel-pad stack"><span class="label">' + esc(t.cat) + '</span><h2 class="tx-title">' + esc(t.title) + '</h2>' +
          (t.note ? '<p class="hint">' + esc(t.note) + '</p>' : '') +
          (t.fields.length ? '<form class="form-grid" id="tx-form" autocomplete="off">' + t.fields.map(fieldHtml).join('') + '</form>' : '') +
          '<div class="stack" id="tx-outs"></div></div>';
        paintOut();
      }
      function vals() { var f = $('#tx-form'); return f ? KR.formData(f) : {}; }
      function paintOut() {
        var t = tpl(); if (!t) return;
        var outs = t.out(vals());
        $('#tx-outs').innerHTML = outs.map(function (o, i) {
          var wa = /WhatsApp/.test(t.cat) ? '<a class="btn sm" target="_blank" rel="noopener" href="' + KR.waLink('', o.text) + '">' + KR.icon('send') + 'Abrir en WhatsApp</a>' : '';
          return '<div class="stack-sm"><button class="tx-out" type="button" data-copy="' + i + '"><span class="label">' + esc(o.label) + (o.text.length ? ' · ' + o.text.length + ' caracteres' : '') + '</span><span class="tx-text">' + esc(o.text) + '</span><i>' + KR.icon('copy') + ' Copiar</i></button>' + (wa ? '<div class="row">' + wa + '</div>' : '') + '</div>';
        }).join('');
      }
      el.addEventListener('input', function (e) { if (e.target.closest('#tx-form')) paintOut(); });
      el.addEventListener('change', function (e) { if (e.target.closest('#tx-form')) paintOut(); });
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-t]');
        if (b) { current = b.getAttribute('data-t'); KR.$$('.tx-item', el).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); paintMain(); return; }
        var mb = e.target.closest('[data-mine]');
        if (mb) { current = 'mine-' + mb.getAttribute('data-mine'); KR.$$('.tx-item', el).forEach(function (x) { x.setAttribute('aria-pressed', String(x === mb)); }); paintMain(); return; }
        var c = e.target.closest('[data-copy]');
        if (c) { KR.copy(c.querySelector('.tx-text').textContent, 'Texto copiado'); return; }
        var a = e.target.closest('[data-act]'); if (!a) return;
        var act = a.getAttribute('data-act');
        if (act === 'mine-del') { KR.store.remove('textos', current.slice(5)); current = 'ig-dm'; paintMine(); paintMain(); }
        if (act === 'ai-go' || act === 'ai-again') ask(act === 'ai-again');
        if (act === 'ai-stop' && aiCtl) aiCtl.abort();
        if (act === 'ai-copy') KR.copy($('#ai-out').textContent, 'Texto copiado');
        if (act === 'ai-save') {
          var body = $('#ai-out').textContent;
          KR.dialog({ title: 'Guardar como plantilla', ok: 'Guardar', body: KR.field({ id: 'sv-title', label: 'Nombre', value: ($('#ai-ask').value || 'Texto').slice(0, 40) }), read: function (d) { return d.querySelector('#sv-title').value; } })
            .then(function (title) { if (!title) return; var m = KR.store.put('textos', { title: title, body: body, cat: 'Mías' }); current = 'mine-' + m.id; paintMine(); paintMain(); });
        }
      });

      /* Claude dentro del Artifact */
      var sample = null, aiCtl = null;
      KR.cap('sample').then(function (fn) {
        if (!fn || !document.body.contains(el)) return;
        sample = fn; $('#ai').hidden = false;
      });
      function context() {
        var p = prof(), lines = ['Artista: ' + p.artist + ' (' + p.name + '), productor y DJ de ' + p.city + '. Géneros: ' + p.genres + '. Sello y estudio: ' + p.label + '. Alias de beatmaker: ' + p.alias + '. Instagram: @' + p.instagram + '. Web: ' + p.web + '.'];
        if ($('#ai-c-event').checked) { var e = nextEvent(); if (e) lines.push('Próximo evento: ' + KR.lineupText(e).replace(/\n+/g, ' / ')); }
        if ($('#ai-c-beats').checked) lines.push('Beats en catálogo: ' + KR.store.list('beats').slice(0, 20).map(function (b) { return b.title + (b.bpm ? ' ' + b.bpm + ' BPM' : '') + (b.key ? ' ' + b.key : ''); }).join('; ') + '.');
        if ($('#ai-c-prices').checked) { var pr = st().prices; lines.push('Licencias: no exclusiva ' + KR.fmtMoney(pr.basic, st().currency) + ', con stems ' + KR.fmtMoney(pr.stems, st().currency) + ', exclusiva ' + KR.fmtMoney(pr.exclusive, st().currency) + (st().promo3x2 ? '; promo 3x2 activa' : '') + '. Pagos: ' + (st().payMethods || []).join(', ') + '.'); }
        return lines.join('\n');
      }
      function ask(again) {
        if (!sample) return;
        var q = $('#ai-ask').value.trim();
        if (!q) { $('#ai-ask').focus(); return; }
        if (aiCtl) aiCtl.abort();
        aiCtl = new AbortController();
        var out = $('#ai-out');
        out.textContent = 'Pensando…'; out.classList.add('wait');
        $('#ai-acts').hidden = true; el.querySelector('[data-act="ai-stop"]').hidden = false;
        var prompt = 'Escribe en español del Perú para ' + prof().artist + ', en primera persona. Tono ' + $('#ai-tone').value + ', ' + ($('#ai-len').value === 'corto' ? 'de 1 a 3 frases' : 'de un párrafo') + '. ' +
          'Reglas de voz: mensajes cortos y directos; si es una respuesta a un cliente, termina con una sola pregunta; sin superlativos ("increíble", "perfecto"); sin emojis decorativos (máximo uno si aporta); no inventes datos que no estén abajo. ' +
          'Devuelve solo el texto final, sin comillas ni explicaciones.\n\nDatos:\n' + context() + '\n\nPedido: ' + q;
        var opts = { signal: aiCtl.signal, onText: function (u) { out.classList.remove('wait'); out.textContent = u.text; } };
        if (again) opts.cache = false;
        sample(prompt, opts)
          .then(function (r) { out.textContent = r.text; $('#ai-acts').hidden = false; })
          .catch(function (e) {
            out.classList.remove('wait');
            if (e && e.code === 'cancelled') { out.textContent = e.text || ''; if (e.text) $('#ai-acts').hidden = false; return; }
            if (e && (e.code === 'not_granted' || e.code === 'sampling_disabled')) { $('#ai').hidden = true; KR.toast('Claude no está disponible en esta vista.'); return; }
            out.textContent = (e && e.text) || '';
            KR.toast(e && e.code === 'rate_limited' ? 'Muchas consultas seguidas: prueba en un rato.' : 'No se pudo redactar. Intenta de nuevo.', { tone: 'bad' });
          })
          .then(function () { var s = el.querySelector('[data-act="ai-stop"]'); if (s) s.hidden = true; });
      }
      ctx.cleanup(function () { if (aiCtl) aiCtl.abort(); });
      ctx.sub(function (ev) { if (ev.col === 'textos') paintMine(); });
      paintMine(); paintMain();
    }
  });
})();
