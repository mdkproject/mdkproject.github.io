(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Filtro de la discografía */
  var chips = document.querySelectorAll('.chip');
  var items = document.querySelectorAll('#log li');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var f = c.getAttribute('data-f');
      chips.forEach(function (o) { o.setAttribute('aria-pressed', String(o === c)); });
      var k = 0;
      items.forEach(function (li) {
        var show = f === 'all' || li.getAttribute('data-c') === f;
        li.hidden = !show;
        li.classList.remove('pop');
        if (show && !reduce) {
          void li.offsetWidth;
          li.style.animationDelay = (k++ * 60) + 'ms';
          li.classList.add('pop');
        }
      });
    });
  });

  /* Copiar contacto */
  document.querySelectorAll('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var el = document.getElementById(b.getAttribute('data-src'));
      var done = function () { b.textContent = MDK.t('Copiado'); setTimeout(function () { b.textContent = MDK.t('Copiar'); }, 1600); };
      var fallback = function () {
        var r = document.createRange(); r.selectNodeContents(el);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        b.textContent = MDK.t('Seleccionado'); setTimeout(function () { b.textContent = MDK.t('Copiar'); }, 1600);
      };
      try {
        navigator.clipboard.writeText(el.textContent.trim()).then(done, fallback);
      } catch (e) { fallback(); }
    });
  });

  /* Portada: foco de luz y foto que siguen al mouse */
  var hero = document.getElementById('hero');
  var portrait = document.getElementById('portrait');
  if (hero && canHover && !reduce) {
    var pending = null;
    hero.addEventListener('pointermove', function (e) {
      pending = e;
      requestAnimationFrame(function () {
        if (!pending) return;
        var r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', (pending.clientX - r.left) + 'px');
        hero.style.setProperty('--my', (pending.clientY - r.top) + 'px');
        var p = portrait.getBoundingClientRect();
        var px = ((pending.clientX - p.left) / p.width - 0.5) * 2;
        var py = ((pending.clientY - p.top) / p.height - 0.5) * 2;
        portrait.style.setProperty('--px', Math.max(-1, Math.min(1, px)).toFixed(3));
        portrait.style.setProperty('--py', Math.max(-1, Math.min(1, py)).toFixed(3));
        pending = null;
      });
    });
    hero.addEventListener('pointerleave', function () {
      portrait.style.setProperty('--px', 0); portrait.style.setProperty('--py', 0);
    });
  }

  /* Idioma: el español es el texto de la página; el inglés se aplica con un diccionario */
  window.MDK = window.MDK || { t: function (x) { return x; } };
  var EN = {
    "MD KTRL, inicio": "MD KTRL, home",
    "Principal": "Main",
    "Sobre mí": "About",
    "Música": "Music",
    "Colaboraciones": "Collaborations",
    "En vivo": "Live",
    "Eventos": "Events",
    "Contacto": "Contact",
    "Idioma": "Language",
    "Productor <b>&amp;</b> DJ": "Producer <b>&amp;</b> DJ",
    "Tacna, Perú": "Tacna, Peru",
    "Hip hop, trap y música electrónica. Beats, producción para otros artistas y sets en vivo.": "Hip hop, trap and electronic music. Beats, production for other artists and live sets.",
    "Escuchar": "Listen",
    "Contratar": "Book",
    "Marcelo López, MD KTRL, de perfil con lentes oscuros sobre un fondo de papel aluminio": "Marcelo López, MD KTRL, in profile wearing dark glasses against an aluminum foil background",
    "Géneros": "Genres",
    "Electrónica": "Electronic",
    "Destacado": "Featured",
    "Del álbum <b>12</b>": "From the album <b>12</b>",
    "Portada del álbum 12 de MD KTRL": "Cover of MD KTRL's album 12",
    "Reproducir": "Play",
    "Pausar": "Pause",
    "Dale play desde aquí. El mini reproductor te acompaña mientras recorres la página.": "Hit play right here. The mini player stays with you as you scroll through the page.",
    "Abrir en SoundCloud": "Open on SoundCloud",
    "Ver la discografía": "See the discography",
    "Marcelo López, conocido como MD KTRL, forjó su identidad explorando géneros sin quedarse en ninguno.": "Marcelo López, known as MD KTRL, built his identity by exploring genres without settling on any one.",
    "Lo atrajo la libertad del hip hop, la profundidad atmosférica del trap y la energía hipnótica de la electrónica. En ellos encontró un lenguaje propio y empezó a producir música que refleja estados de ánimo, pensamientos y visiones.": "He was drawn to the freedom of hip hop, the atmospheric depth of trap and the hypnotic energy of electronic music. In them he found a language of his own and began producing music that reflects moods, thoughts and visions.",
    "Ha producido para Jeydee Psycho, Dekaesse, Oriel X, Mr. Bless y DJ Azúcar, y para los colectivos Black Flow y Fire in the Ghetto. En la electrónica, su álbum <em>12</em> salió el 27 de enero de 2025, después del EP <em>13</em>, de abril de 2024.": "He has produced for Jeydee Psycho, Dekaesse, Oriel X, Mr. Bless and DJ Azúcar, and for the collectives Black Flow and Fire in the Ghetto. In electronic music, his album <em>12</em> came out on January 27, 2025, after the EP <em>13</em> in April 2024.",
    "Lanzamientos": "Releases",
    "Discografía": "Discography",
    "Filtrar por tipo": "Filter by type",
    "Todo": "All",
    "Producción": "Production",
    "11 abr 2025": "Apr 11, 2025",
    "Portada de In the Fusion, de Jeydee Psycho": "In the Fusion cover, by Jeydee Psycho",
    "Jeydee Psycho · instrumentales de MD KTRL": "Jeydee Psycho · instrumentals by MD KTRL",
    "Álbum de nueve temas urbanos, del boom bap al reggaetón, con Aflexx, CVN Centena, Dekaesse, Lucciana Z y eHori. Los beats vienen de <em>Key</em>.": "A nine-track urban album, from boom bap to reggaeton, featuring Aflexx, CVN Centena, Dekaesse, Lucciana Z and eHori. The beats come from <em>Key</em>.",
    "27 ene 2025": "Jan 27, 2025",
    "Primer álbum de electrónica": "First electronic album",
    "Paisajes electrónicos cargados de emociones complejas. Texturas envolventes y ritmos sutiles que generan tensión y calma a la vez, en un viaje introspectivo que se queda en la memoria.": "Electronic landscapes loaded with complex emotions. Enveloping textures and subtle rhythms create tension and calm at once, in an introspective journey that stays in your memory.",
    "Escuchar en SoundCloud": "Listen on SoundCloud",
    "Álbum": "Album",
    "25 nov 2024": "Nov 25, 2024",
    "Álbum de instrumentales": "Instrumentals album",
    "Alterna calma, esperanza y alegría con pasajes de tensión y emociones más oscuras. Un rango amplio, pensado para el oyente y para el artista que busca base.": "Alternates calm, hope and joy with passages of tension and darker emotions. A wide range, made for the listener and for the artist looking for a base.",
    "26 sep 2024": "Sep 26, 2024",
    "EP de instrumentales": "Instrumentals EP",
    "La cara más suave del trap. Melodías dulces, atmósferas etéreas y percusiones delicadas que transmiten calma, amor y nostalgia.": "The softer side of trap. Sweet melodies, ethereal atmospheres and delicate percussion that convey calm, love and nostalgia.",
    "26 jun 2024": "Jun 26, 2024",
    "EP · cuatro tracks": "EP · four tracks",
    "Nació sin plan, de la improvisación y de explorar el sampleo en la electrónica. Cuatro tracks de esencia house hechos para el movimiento, el baile y las sonrisas.": "Born without a plan, from improvisation and from exploring sampling in electronic music. Four house-flavored tracks made for movement, dancing and smiles.",
    "2 jun 2024": "Jun 2, 2024",
    "Oriel X · producida en Lattice Rekords": "Oriel X · produced at Lattice Rekords",
    "Primera canción de Oriel X, del Callao. MD KTRL lo acompañó desde la composición hasta la masterización. Salió en todas las plataformas.": "Oriel X's first song, from Callao. MD KTRL guided him from writing through mastering. It was released on all streaming platforms.",
    "Ver el videoclip en YouTube": "Watch the music video on YouTube",
    "12 abr 2024": "Apr 12, 2024",
    "EP de electrónica": "Electronic EP",
    "Electrónica oscura y atmosférica. Paisajes sonoros densos, con texturas y ritmos envolventes. Precisión técnica y emoción cruda, con tensión y misterio de principio a fin.": "Dark, atmospheric electronic music. Dense soundscapes with enveloping textures and rhythms. Technical precision and raw emotion, with tension and mystery from start to finish.",
    "8 abr 2024": "Apr 8, 2024",
    "Primera recopilación de instrumentales": "First instrumentals collection",
    "Álbum boom bap basado en el sampleo, de atmósfera mística y oscura con destellos de luz y delicadeza. Cada beat está pensado para conectar con artistas del género.": "A sample-based boom bap album with a mystical, dark atmosphere and flashes of light and delicacy. Every beat is made to connect with artists in the genre.",
    "Afiche de Bness Beatmaker: instrumentales en 3x2, con código QR al catálogo": "Bness Beatmaker poster: instrumentals 3 for 2, with a QR code to the catalog",
    "Instrumentales en 3x2": "Instrumentals, 3 for 2",
    "Bness es el perfil anónimo de beatmaker de MD KTRL. Ahí están sus 48 beats, en promoción de tres por el precio de dos.": "Bness is MD KTRL's anonymous beatmaker profile. His 48 beats are there, on a three-for-the-price-of-two promotion.",
    "Puedes pagarlos con:": "You can pay for them with:",
    "Efectivo": "Cash",
    "Donaciones": "Donations",
    "Juguetes para niños": "Toys for children",
    "Comida para animales de albergues": "Food for shelter animals",
    "Ver el catálogo de beats": "See the beat catalog",
    "Licencias de beats": "Beat licenses",
    "Elige cómo quieres usar un beat. Cotiza por WhatsApp y recibe el precio y las condiciones por escrito.": "Choose how you want to use a beat. Get a quote on WhatsApp and receive the price and terms in writing.",
    "Uso compartido": "Shared use",
    "No exclusiva": "Non-exclusive",
    "Usas el beat en tu canción. El mismo beat puede seguir en el catálogo para otros artistas.": "You use the beat in your song. The same beat can stay in the catalog for other artists.",
    "Cotizar": "Get a quote",
    "Solo tuyo": "Yours alone",
    "Exclusiva": "Exclusive",
    "El beat sale del catálogo y queda solo para ti.": "The beat leaves the catalog and is yours alone.",
    "Para mezclar": "For mixing",
    "Stems y mezcla": "Stems and mixing",
    "Las pistas separadas del beat, para que tu ingeniero o tú lo mezclen con tu voz.": "The beat's separate tracks, so your engineer or you can mix it with your vocals.",
    "Contraportada de In the Fusion con la lista de temas": "Back cover of In the Fusion with the track list",
    "Álbum · 2025": "Album · 2025",
    "Fundador del colectivo Black Flow. Compró los beats <em>Ruby Pt. I</em> y <em>Temple</em>, de <em>Key</em>, para su álbum <em>In the Fusion</em>.": "Founder of the Black Flow collective. He bought the beats <em>Ruby Pt. I</em> and <em>Temple</em>, from <em>Key</em>, for his album <em>In the Fusion</em>.",
    "Canción · 2024": "Song · 2024",
    "Artista del puerto del Callao. Hizo su primera canción en el estudio Lattice Rekords. MD KTRL lo guio hasta plasmar sus ideas y cerrar juntos su primer proyecto.": "An artist from the port city of Callao. He made his first song at the Lattice Rekords studio. MD KTRL guided him to put his ideas into shape and finish his first project together.",
    "Portada del próximo single de Mr. Bless": "Cover of Mr. Bless's upcoming single",
    "Por estrenar": "Coming soon",
    "Mr. Bless es Juan Sánchez, rapero cristiano. Su mensaje consciente, el scratch de DJ Azúcar y la producción de MD KTRL se juntan en una canción lista para salir.": "Mr. Bless is Juan Sánchez, a Christian rapper. His conscious message, DJ Azúcar's scratching and MD KTRL's production come together in a song ready for release.",
    "También con": "Also with",
    "Sonido · DJ · Sets": "Sound · DJ · Sets",
    "Campamentos y 24 horas de música electrónica en la naturaleza. MD KTRL estuvo en sus dos eventos post-sala.": "Camping and 24 hours of electronic music in nature. MD KTRL played at both of its after-parties.",
    "Ver en Instagram": "See on Instagram",
    "Afiche de Sunday Sessions, showcase de Misti Qhapaq y Quramanta": "Sunday Sessions poster, a Misti Qhapaq and Quramanta showcase",
    "Primer post-sala": "First after-party",
    "Showcase de Misti Qhapaq y Quramanta. Domingo desde las 4:00 pm, en ubicación secreta.": "Misti Qhapaq and Quramanta showcase. Sunday from 4:00 pm, at a secret location.",
    "<b>Rol</b>Soporte con equipos de sonido y controladores de DJ.": "<b>Role</b>Support with sound equipment and DJ controllers.",
    "Afiche de la segunda post-sala: Habemus terraza": "Poster for the second after-party: Habemus terraza",
    "Segundo post-sala": "Second after-party",
    "De 4:30 a 9:30 pm. Con la pulsera del festival, la entrada era libre.": "4:30 to 9:30 pm. With the festival wristband, entry was free.",
    "Además de tocar, MD KTRL apoya eventos con equipos de sonido y controladores de DJ.": "Besides playing, MD KTRL supports events with sound equipment and DJ controllers.",
    "Producción y diseño": "Production and design",
    "Eventos · afiches": "Events · posters",
    "Además de la música, MD KTRL trabaja en la producción de eventos y en el diseño de sus afiches.": "Besides music, MD KTRL works on event production and on designing event posters.",
    "Afiche de Lattice, viernes 22 de noviembre, con MD.KTRL en el line-up": "Lattice poster, Friday November 22, with MD.KTRL on the lineup",
    "Viernes 22 nov": "Friday Nov 22",
    "MD.KTRL encabeza con un Xtended live set. Invitados: Rimaycuna (Ilo) y Jota (Tacna).": "MD.KTRL headlines with an Xtended live set. Guests: Rimaycuna (Ilo) and Jota (Tacna).",
    "Afiche de KatanaSound: J-SKRT, 16 de febrero": "KatanaSound poster: J-SKRT, February 16",
    "16 feb · 12:00 pm": "Feb 16 · 12:00 pm",
    "Lattice y KatanaSound, con MDK en el cartel.": "Lattice and KatanaSound, with MDK on the bill.",
    "Afiche de True House, domingo 27 de junio, Tacna": "True House poster, Sunday June 27, Tacna",
    "Domingo 27 jun · 7 pm": "Sunday Jun 27 · 7 pm",
    "Techno, house y trance en ubicación secreta. Tacna, ingreso limitado.": "Techno, house and trance at a secret location. Tacna, limited entry.",
    "Afiche de Old Grooves": "Old Grooves poster",
    "Afiche": "Poster",
    "Diseño del afiche.": "Poster design.",
    "Contratación · beats · producción": "Booking · beats · production",
    "Hablemos": "Let's talk",
    "Qué necesitas": "What do you need",
    "Un set de DJ": "A DJ set",
    "Producción musical": "Music production",
    "Comprar un beat": "Buy a beat",
    "Otra cosa": "Something else",
    "Licencia": "License",
    "Aún no sé": "Not sure yet",
    "Tu nombre": "Your name",
    "Fecha": "Date",
    "Ciudad o lugar": "City or venue",
    "Detalles (duración, presupuesto, referencias)": "Details (length, budget, references)",
    "Abrir WhatsApp": "Open WhatsApp",
    "Copiar mensaje": "Copy message",
    "Se abre WhatsApp con el mensaje ya escrito. Esta página no guarda lo que escribes.": "WhatsApp opens with your message already written. This page doesn't store what you type.",
    "Correo": "Email",
    "Copiar": "Copy",
    "Llévalo contigo": "Take it with you",
    "Guardar contacto": "Save contact",
    "Compartir esta página": "Share this page",
    "Redes": "Social",
    "Lattice Rekords · Tacna, Perú": "Lattice Rekords · Tacna, Peru",
    "Reproductor": "Player",
    "Posición del track": "Track position",
    "Cerrar reproductor": "Close player",
    "Hola MD KTRL, te escribo desde tu página web.": "Hi MD KTRL, I'm writing from your website.",
    "Busco:": "Looking for:",
    "Licencia:": "License:",
    "Nombre:": "Name:",
    "Fecha:": "Date:",
    "Ciudad o lugar:": "City or venue:",
    "Detalles:": "Details:",
    "Se abrió WhatsApp con tu mensaje. Revísalo y envíalo desde ahí.": "WhatsApp opened with your message. Check it and send it from there.",
    "Mensaje copiado.": "Message copied.",
    "No se pudo copiar. El mensaje quedó en el campo de detalles.": "Couldn't copy. The message was placed in the details field.",
    "Enlace copiado": "Link copied",
    "No se pudo copiar": "Couldn't copy",
    "Copiado": "Copied",
    "Seleccionado": "Selected",
    "Cargando…": "Loading…",
    "No se pudo cargar. Ábrelo en SoundCloud.": "Couldn't load. Open it on SoundCloud.",
    "Toca play para empezar": "Tap play to start"
  };
  var lang = 'es';
  var i18nTargets = null;
  var normTxt = function (t) { return t.replace(/\s+/g, ' ').trim(); };
  var collectTargets = function () {
    var out = [], claimed = [];
    var inClaimed = function (el) { return claimed.some(function (c) { return c.contains(el); }); };
    document.querySelectorAll('body *').forEach(function (el) {
      if (el.closest('svg, script, style, textarea, [data-no-i18n]') || inClaimed(el)) return;
      ['alt', 'aria-label', 'title'].forEach(function (a) {
        if (el.hasAttribute(a)) out.push({ kind: 'attr', el: el, attr: a, orig: el.getAttribute(a), key: normTxt(el.getAttribute(a)) });
      });
      var kids = Array.prototype.slice.call(el.children);
      var emph = kids.some(function (k) { return /^(EM|B|STRONG)$/.test(k.tagName); });
      var other = kids.some(function (k) { return !/^(EM|B|STRONG|BR)$/.test(k.tagName); });
      if (emph && !other) {
        claimed.push(el);
        out.push({ kind: 'html', el: el, orig: el.innerHTML, key: normTxt(el.innerHTML) });
        return;
      }
      Array.prototype.forEach.call(el.childNodes, function (n) {
        if (n.nodeType === 3 && normTxt(n.nodeValue)) out.push({ kind: 'text', node: n, orig: n.nodeValue, key: normTxt(n.nodeValue) });
      });
    });
    return out;
  };
  var applyLang = function (l) {
    lang = l;
    if (!i18nTargets) i18nTargets = collectTargets();
    i18nTargets.forEach(function (t) {
      var en = l === 'en' ? EN[t.key] : null;
      if (t.kind === 'attr') t.el.setAttribute(t.attr, en || t.orig);
      else if (t.kind === 'html') t.el.innerHTML = en || t.orig;
      else {
        var lead = t.orig.match(/^\s*/)[0], trail = t.orig.match(/\s*$/)[0];
        t.node.nodeValue = en ? lead + en + trail : t.orig;
      }
    });
    document.documentElement.lang = l;
    document.title = l === 'en' ? 'MD KTRL · Producer & DJ' : 'MD KTRL · Productor y DJ';
    document.querySelectorAll('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === l)); });
    if (window.MDK.onLang) window.MDK.onLang();
    try { localStorage.setItem('mdk-lang', l); } catch (e) {}
  };
  window.MDK.t = function (x) { return lang === 'en' && EN[x] ? EN[x] : x; };
  window.MDK.keys = function () {
    var seen = {};
    collectTargets().forEach(function (t) { seen[t.key] = 1; });
    return Object.keys(seen);
  };
  window.MDK.missing = function () { return window.MDK.keys().filter(function (k) { return !EN[k]; }); };
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang')); });
  });
  (function () {
    var want = null;
    try { want = new URLSearchParams(location.search).get('lang') || localStorage.getItem('mdk-lang'); } catch (e) {}
    if (!want) want = /^es/i.test(navigator.language || 'es') ? 'es' : 'en';
    if (want === 'en') applyLang('en');
  })();

  /* Reproductor: widget de SoundCloud con controles propios; se carga recién al primer play */
  window.MDK = window.MDK || { t: function (x) { return x; } };
  var dock = document.getElementById('dock');
  if (dock) {
    var byId = function (id) { return document.getElementById(id); };
    var dTitle = byId('dock-title'), dArtist = byId('dock-artist'), dToggle = byId('dock-toggle'), dRange = byId('dock-range');
    var dCur = byId('dock-cur'), dDur = byId('dock-dur'), dOpen = byId('dock-open'), dClose = byId('dock-close');
    var scFrame = null, widget = null, current = null, playing = false, duration = 0, seeking = false, failTimer = null, nudge = null;
    var fmtTime = function (ms) { var t = Math.max(0, Math.floor(ms / 1000)); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); };
    var setPct = function (rel) { dRange.style.setProperty('--p', (rel * 100).toFixed(1) + '%'); };

    var sync = function () {
      document.querySelectorAll('.play[data-sc]').forEach(function (b) {
        var on = !!current && playing && b.getAttribute('data-sc') === current.url;
        b.setAttribute('data-playing', String(on));
        b.setAttribute('aria-label', MDK.t(on ? 'Pausar' : 'Reproducir') + ' ' + (b.getAttribute('data-title') || ''));
      });
      dToggle.setAttribute('data-playing', String(playing));
      dToggle.setAttribute('aria-label', MDK.t(playing ? 'Pausar' : 'Reproducir') + (current ? ' ' + current.title : ''));
      document.body.classList.toggle('is-playing', playing);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    };
    window.MDK.onLang = sync;
    var fail = function () {
      playing = false; sync();
      dArtist.textContent = MDK.t('No se pudo cargar. Ábrelo en SoundCloud.');
    };
    var setMeta = function () {
      if (!('mediaSession' in navigator) || !current || !window.MediaMetadata) return;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: dTitle.textContent, artist: current.artist,
        artwork: current.cover ? [{ src: new URL(current.cover, location.href).href }] : []
      });
      navigator.mediaSession.setActionHandler('play', function () { if (widget) widget.play(); });
      navigator.mediaSession.setActionHandler('pause', function () { if (widget) widget.pause(); });
    };
    var bindWidget = function () {
      var E = SC.Widget.Events;
      widget.bind(E.READY, function () {
        widget.play();
        clearTimeout(nudge);
        nudge = setTimeout(function () { if (!playing && current) dArtist.textContent = MDK.t('Toca play para empezar'); }, 2500);
      });
      widget.bind(E.PLAY, function () {
        playing = true; clearTimeout(failTimer); clearTimeout(nudge); sync();
        if (current) dArtist.textContent = current.artist;
        widget.getDuration(function (d) { duration = d; dDur.textContent = fmtTime(d); });
        widget.getCurrentSound(function (snd) { if (snd && snd.title) { dTitle.textContent = snd.title; setMeta(); } });
      });
      widget.bind(E.PAUSE, function () { playing = false; sync(); });
      widget.bind(E.FINISH, function () { playing = false; sync(); });
      widget.bind(E.PLAY_PROGRESS, function (e) {
        if (seeking) return;
        dRange.value = Math.round(e.relativePosition * 1000); setPct(e.relativePosition);
        dCur.textContent = fmtTime(e.currentPosition);
      });
      widget.bind(E.ERROR, fail);
    };
    var start = function (b) {
      current = {
        url: b.getAttribute('data-sc'), title: b.getAttribute('data-title') || '',
        artist: b.getAttribute('data-artist') || '', cover: b.getAttribute('data-cover') || ''
      };
      dock.hidden = false; document.body.classList.add('has-dock');
      dTitle.textContent = current.title; dArtist.textContent = MDK.t('Cargando…');
      dOpen.href = current.url; dRange.value = 0; setPct(0); dCur.textContent = '0:00'; dDur.textContent = '0:00';
      clearTimeout(failTimer);
      failTimer = setTimeout(function () { if (!playing) fail(); }, 9000);
      var go = function () {
        if (!scFrame) {
          scFrame = document.createElement('iframe');
          scFrame.className = 'sc-frame'; scFrame.title = 'SoundCloud'; scFrame.tabIndex = -1;
          scFrame.setAttribute('allow', 'autoplay'); scFrame.setAttribute('aria-hidden', 'true');
          scFrame.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(current.url) +
            '&auto_play=true&visual=false&show_comments=false&hide_related=true&show_teaser=false';
          document.body.appendChild(scFrame);
          widget = SC.Widget(scFrame); bindWidget();
        } else {
          widget.load(current.url, {
            auto_play: true, visual: false, show_comments: false, hide_related: true,
            callback: function () { widget.play(); }
          });
        }
      };
      if (window.SC && SC.Widget) go();
      else {
        var api = document.createElement('script');
        api.src = 'https://w.soundcloud.com/player/api.js'; api.onload = go; api.onerror = fail;
        document.head.appendChild(api);
      }
      sync();
    };
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.play[data-sc]');
      if (!b) return;
      if (current && widget && b.getAttribute('data-sc') === current.url) { if (playing) widget.pause(); else widget.play(); }
      else start(b);
    });
    dToggle.addEventListener('click', function () {
      if (!widget || !current) return;
      if (playing) widget.pause(); else widget.play();
    });
    dRange.addEventListener('input', function () {
      seeking = true; setPct(dRange.value / 1000); dCur.textContent = fmtTime(dRange.value / 1000 * duration);
    });
    dRange.addEventListener('change', function () {
      seeking = false;
      if (widget && duration) widget.seekTo(dRange.value / 1000 * duration);
    });
    dClose.addEventListener('click', function () {
      if (widget && playing) widget.pause();
      dock.hidden = true; document.body.classList.remove('has-dock');
      clearTimeout(failTimer); clearTimeout(nudge);
      current = null; playing = false; sync();
    });
    sync();
  }

  /* Contratar: arma el mensaje y abre WhatsApp */
  var hire = document.getElementById('hire');
  if (hire) {
    var fld = function (id) { return document.getElementById(id); };
    var optText = function (sel) { return sel.options[sel.selectedIndex].text; };
    var buildMsg = function () {
      var t = MDK.t, type = fld('h-type'), lic = fld('h-lic');
      var lines = [t('Hola MD KTRL, te escribo desde tu página web.'), t('Busco:') + ' ' + optText(type)];
      if (type.value === 'beat' && lic.value) lines.push(t('Licencia:') + ' ' + optText(lic));
      var date = fld('h-date').value ? fld('h-date').value.split('-').reverse().join('/') : '';
      [['Nombre:', fld('h-name').value], ['Fecha:', date], ['Ciudad o lugar:', fld('h-city').value], ['Detalles:', fld('h-msg').value]]
        .forEach(function (p) { var v = p[1].trim(); if (v) lines.push(t(p[0]) + ' ' + v); });
      return lines.join('\n');
    };
    var syncLic = function () { fld('h-lic-wrap').hidden = fld('h-type').value !== 'beat'; };
    var say = function (txt) { fld('h-status').textContent = MDK.t(txt); };
    fld('h-type').addEventListener('change', syncLic);
    hire.addEventListener('submit', function (e) {
      e.preventDefault();
      var url = 'https://wa.me/51944310246?text=' + encodeURIComponent(buildMsg());
      if (!window.open(url, '_blank', 'noopener')) window.location.href = url;
      say('Se abrió WhatsApp con tu mensaje. Revísalo y envíalo desde ahí.');
    });
    fld('h-copy').addEventListener('click', function () {
      var msg = buildMsg();
      var ok = function () { say('Mensaje copiado.'); };
      var no = function () { fld('h-msg').value = msg; say('No se pudo copiar. El mensaje quedó en el campo de detalles.'); };
      try { navigator.clipboard.writeText(msg).then(ok, no); } catch (err) { no(); }
    });
    document.querySelectorAll('[data-quote]').forEach(function (b) {
      b.addEventListener('click', function () {
        fld('h-type').value = 'beat'; syncLic(); fld('h-lic').value = b.getAttribute('data-quote');
        fld('hire').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        setTimeout(function () { fld('h-name').focus({ preventScroll: true }); }, reduce ? 0 : 500);
      });
    });
  }

  /* Compartir la página: menú del sistema si existe; si no, copia el enlace */
  var shareBtn = document.getElementById('share');
  if (shareBtn) {
    var shareT = document.getElementById('share-t');
    var flash = function (txt) {
      shareT.textContent = MDK.t(txt);
      setTimeout(function () { shareT.textContent = MDK.t('Compartir esta página'); }, 1800);
    };
    shareBtn.addEventListener('click', function () {
      var url = location.href.split('#')[0];
      if (navigator.share) { navigator.share({ title: document.title, url: url }).catch(function () {}); return; }
      try { navigator.clipboard.writeText(url).then(function () { flash('Enlace copiado'); }, function () { flash('No se pudo copiar'); }); }
      catch (err) { flash('No se pudo copiar'); }
    });
  }

  /* Afiches con inclinación 3D y reflejo */
  if (canHover && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      var frame = card.querySelector('.frame');
      if (!frame) return;
      card.addEventListener('pointermove', function (e) {
        var r = frame.getBoundingClientRect();
        var x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        var y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
        card.classList.add('tilting');
        frame.style.setProperty('--tx', ((x - 0.5) * 12).toFixed(2) + 'deg');
        frame.style.setProperty('--ty', ((0.5 - y) * 12).toFixed(2) + 'deg');
        frame.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        frame.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () {
        card.classList.remove('tilting');
        frame.style.setProperty('--tx', '0deg'); frame.style.setProperty('--ty', '0deg');
      });
    });
  }

  /* Cifras que cuentan al entrar en pantalla (el número final ya está escrito) */
  var stats = document.getElementById('stats');
  if (stats && !reduce && 'IntersectionObserver' in window) {
    var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
    var counted = false;
    new IntersectionObserver(function (entries, obs) {
      if (counted || !entries[0].isIntersecting) return;
      counted = true; obs.disconnect();
      stats.querySelectorAll('dd[data-to]').forEach(function (dd) {
        var to = +dd.getAttribute('data-to'), pre = dd.getAttribute('data-prefix') || '', t0 = null;
        var step = function (ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / 1300);
          k = 1 - Math.pow(1 - k, 3);
          dd.textContent = pre + fmt(Math.round(to * k));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 }).observe(stats);
  }

  /* Menú: marca la sección visible */
  var links = {};
  document.querySelectorAll('#nav a:not(.cta)').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = links[en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* Forma de onda: lo reproducido va de ámbar a salmón; con el mouse encima, el cabezal te sigue */
  var cv = document.getElementById('wave');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, dpr = 1, colors = null, frame = 0, visible = true, t0 = 0, hoverX = -1, head = 0;

  function hex(c) {
    c = c.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var n = parseInt(c, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, k) {
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ')';
  }
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    colors = {
      wave: cs.getPropertyValue('--wave').trim(),
      fg: cs.getPropertyValue('--fg').trim(),
      a: hex(cs.getPropertyValue('--accent').trim()),
      b: hex(cs.getPropertyValue('--coral').trim())
    };
  }
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function amp(i, n, t) {
    var x = i / n;
    var env = 0.35 + 0.65 * Math.abs(Math.sin(x * 9.3 + 0.6) * Math.cos(x * 3.1));
    var wob = Math.sin(i * 0.9 + t * 1.4) * 0.18 + Math.sin(i * 0.37 - t * 0.8) * 0.22;
    var hit = Math.pow(Math.abs(Math.sin(x * 38 + 1.2)), 6) * 0.45;
    return Math.max(0.06, Math.min(1, env * (0.55 + wob) + hit));
  }
  function draw(t) {
    if (frame % 30 === 0 || !colors) readColors();
    frame++;
    ctx.clearRect(0, 0, W, H);
    var step = W < 520 ? 5 : 7, n = Math.floor(W / step);
    var auto = reduce ? 0.68 : ((t * 0.05) % 1);
    if (hoverX >= 0) head = reduce ? hoverX : head + (hoverX - head) * 0.25;
    else head = auto;
    for (var i = 0; i < n; i++) {
      var x = i / n;
      var d = Math.abs(x - head);
      var swell = hoverX >= 0 ? 1 + 0.45 * Math.max(0, 1 - d / 0.06) : 1;
      var h = Math.min(H, amp(i, n, t) * H * 0.82 * swell);
      var k = 0.5 + 0.5 * Math.sin(x * 7.5 + 0.4) * Math.cos(x * 2.3);
      ctx.fillStyle = x < head ? mix(colors.a, colors.b, k) : colors.wave;
      ctx.fillRect(i * step, (H - h) / 2, Math.max(2, step - 3), h);
    }
    if (hoverX >= 0) {
      ctx.fillStyle = colors.fg;
      ctx.fillRect(Math.round(head * W), 0, 1, H);
    }
  }
  function loop(ts) {
    if (!t0) t0 = ts;
    if (visible) draw((ts - t0) / 1000);
    requestAnimationFrame(loop);
  }
  size(); readColors(); draw(0);
  window.addEventListener('resize', function () { size(); draw((performance.now() - t0) / 1000); });
  cv.addEventListener('pointermove', function (e) {
    var r = cv.getBoundingClientRect();
    hoverX = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    if (reduce) draw(0);
  });
  cv.addEventListener('pointerleave', function () { hoverX = -1; if (reduce) draw(0); });
  try {
    new MutationObserver(function () { colors = null; if (reduce) draw(0); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { colors = null; if (reduce) draw(0); });
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(cv);
  } catch (e) {}
  if (!reduce) requestAnimationFrame(loop);
})();
