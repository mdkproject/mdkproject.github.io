/* KTRL Room · datos de arranque
   Solo lo que ya está publicado en mdkproject.github.io: lanzamientos, colaboraciones y eventos.
   Montos, BPM y tonalidades quedan vacíos hasta que los completes o analices el audio.
   El set de DJ es de ejemplo y lo dice en su nombre. */
(function () {
  'use strict';
  var KR = window.KR = window.KR || {};

  KR.seed = function (s) {
    var id = function (p, n) { return p + '-' + n; };

    s.beats = [
      { id: id('b', 'ruby-pt-1'), title: 'Ruby Pt. I', project: 'Key', genre: 'Boom bap', mood: 'Místico, oscuro', status: 'disponible', bpm: null, key: '', url: 'https://soundcloud.com/boness6/sets/key', notes: 'Licenciado a Jeydee Psycho para In the Fusion (2025).', sold: 1 },
      { id: id('b', 'temple'), title: 'Temple', project: 'Key', genre: 'Boom bap', mood: 'Místico, oscuro', status: 'disponible', bpm: null, key: '', url: 'https://soundcloud.com/boness6/sets/key', notes: 'Licenciado a Jeydee Psycho para In the Fusion (2025).', sold: 1 }
    ];

    s.deals = [
      { id: id('d', 'in-the-fusion'), type: 'beat', title: 'Beats Ruby Pt. I y Temple', client: 'Jeydee Psycho', channel: 'otro', date: '2025-04-11', stage: 'cobrado', amount: null, paid: null, notes: 'Para su álbum In the Fusion. Fundador del colectivo Black Flow.' },
      { id: id('d', 'hijos-maldad'), type: 'produccion', title: 'Hijos de la maldad', client: 'Oriel X', channel: 'otro', date: '2024-06-02', stage: 'cobrado', amount: null, paid: null, notes: 'Primera canción de Oriel X, del Callao. Composición a masterización en Lattice Rekords.' },
      { id: id('d', 'mr-bless'), type: 'produccion', title: 'Canción con Mr. Bless y DJ Azúcar', client: 'Mr. Bless (Juan Sánchez)', channel: 'otro', date: '', stage: 'confirmado', amount: null, paid: null, notes: 'Lista para salir. Scratch de DJ Azúcar.' },
      { id: id('d', 'habemus'), type: 'dj', title: 'Set en Habemus terraza', client: 'Quramanta', channel: 'instagram', date: '', time: '20:00', place: 'Arequipa', stage: 'realizado', amount: null, paid: null, notes: 'Segundo post-sala de Quramanta.' },
      { id: id('d', 'sunday'), type: 'equipos', title: 'Equipos para Sunday Sessions', client: 'Misti Qhapaq y Quramanta', channel: 'instagram', date: '', place: 'Arequipa', stage: 'realizado', amount: null, paid: null, notes: 'Soporte con equipos de sonido y controladores de DJ.' }
    ];

    s.events = [
      {
        id: id('e', 'lattice'), name: 'Lattice', tagline: 'Xtended live set', date: '2024-11-22', start: '22:00', venue: '', city: 'Tacna', secret: false,
        organizers: 'Lattice Rekords', status: 'realizado', capacity: null, entry: '',
        lineup: [
          { id: 'l1', artist: 'MD.KTRL', from: 'Tacna', dur: 120, me: true, note: 'Xtended live set' },
          { id: 'l2', artist: 'Rimaycuna', from: 'Ilo', dur: 60 },
          { id: 'l3', artist: 'Jota', from: 'Tacna', dur: 60 }
        ],
        costs: [], tiers: [], notes: 'MD.KTRL encabeza con un Xtended live set.'
      },
      {
        id: id('e', 'habemus'), name: 'Habemus terraza', tagline: 'Segundo post-sala Quramanta', date: '', start: '16:00', venue: 'Terraza', city: 'Arequipa', secret: false,
        organizers: 'Quramanta', status: 'realizado', capacity: null, entry: 'Libre con la pulsera del festival',
        lineup: [
          { id: 'l1', artist: 'Avendaño', dur: 60 },
          { id: 'l2', artist: 'Ancestral', dur: 60 },
          { id: 'l3', artist: 'Kelvin Ryan', dur: 60 },
          { id: 'l4', artist: 'Piero Dávila', dur: 60 },
          { id: 'l5', artist: 'MD KTRL', dur: 60, me: true },
          { id: 'l6', artist: 'Yosstyn', dur: 60 }
        ],
        costs: [], tiers: [], notes: 'Con la pulsera del festival la entrada era libre.'
      },
      {
        id: id('e', 'sunday'), name: 'Sunday Sessions', tagline: 'Showcase Misti Qhapaq × Quramanta', date: '', start: '16:00', venue: '', city: 'Arequipa', secret: true,
        organizers: 'Misti Qhapaq × Quramanta', status: 'realizado', capacity: null, entry: '',
        lineup: [
          { id: 'l1', artist: 'Kelvin Ryan b2b Avendaño', dur: 90 },
          { id: 'l2', artist: 'Ancestral', dur: 60 },
          { id: 'l3', artist: 'Dog Pop', dur: 60 },
          { id: 'l4', artist: 'Yosttyn b2b Savage Rol', dur: 90 }
        ],
        costs: [], tiers: [], notes: 'MD KTRL dio soporte con equipos de sonido y controladores.'
      },
      {
        id: id('e', 'true-house'), name: 'True House', tagline: 'Techno, house y trance', date: '', start: '19:00', venue: '', city: 'Tacna', secret: true,
        organizers: 'Lattice Rekords', status: 'realizado', capacity: null, entry: 'Ingreso limitado',
        lineup: [], costs: [], tiers: [], notes: 'Domingo 27 jun, 7 pm. Ubicación secreta.'
      }
    ];

    s.sets = [
      {
        id: id('s', 'ejemplo'), name: 'Set de ejemplo · warm-up house', minutes: 60, arc: 'up', example: true,
        tracks: [
          { id: 't1', title: 'Tema de ejemplo 1', artist: '', bpm: 122, key: '8A', energy: 4 },
          { id: 't2', title: 'Tema de ejemplo 2', artist: '', bpm: 128, key: '3A', energy: 8 },
          { id: 't3', title: 'Tema de ejemplo 3', artist: '', bpm: 124, key: '9A', energy: 5 },
          { id: 't4', title: 'Tema de ejemplo 4', artist: '', bpm: 126, key: '10A', energy: 6 },
          { id: 't5', title: 'Tema de ejemplo 5', artist: '', bpm: 123, key: '8B', energy: 4 },
          { id: 't6', title: 'Tema de ejemplo 6', artist: '', bpm: 127, key: '10B', energy: 7 },
          { id: 't7', title: 'Tema de ejemplo 7', artist: '', bpm: 125, key: '9B', energy: 6 }
        ]
      }
    ];

    s.splits = [
      {
        id: id('p', 'mr-bless'), song: 'Canción con Mr. Bless y DJ Azúcar', date: '', studio: 'Lattice Rekords', notes: 'Por estrenar. Completen los porcentajes juntos antes de firmar.',
        people: [
          { id: 'c1', name: 'Juan Sánchez (Mr. Bless)', role: 'Letra e interpretación', pub: null, master: null, society: 'APDAYC' },
          { id: 'c2', name: 'Marcelo López (MD KTRL)', role: 'Producción y música', pub: null, master: null, society: 'APDAYC' },
          { id: 'c3', name: 'DJ Azúcar', role: 'Scratch', pub: null, master: null, society: '' }
        ]
      }
    ];

    s.releases = [
      { id: id('r', '12'), title: '12', kind: 'Álbum', alias: 'MD KTRL', date: '2025-01-27', status: 'publicado', url: 'https://soundcloud.com/marcelo-lopez-456835638/sets/12a', tasks: {} },
      { id: id('r', 'rest-in-beats'), title: 'Rest in Beats', kind: 'Álbum de instrumentales', alias: 'Bness', date: '2024-11-25', status: 'publicado', url: 'https://soundcloud.com/boness6/sets/rest-in-beats', tasks: {} },
      { id: id('r', 'raw-tapes'), title: 'Raw Tapes: Pluggnb', kind: 'EP de instrumentales', alias: 'Bness', date: '2024-09-26', status: 'publicado', url: 'https://soundcloud.com/boness6/sets/raw-tapes-pluggnb', tasks: {} },
      { id: id('r', 'la-receta'), title: 'La Receta', kind: 'EP', alias: 'MD KTRL', date: '2024-06-26', status: 'publicado', url: 'https://soundcloud.com/dino-lopez-548405551/sets/la-receta-ep', tasks: {} },
      { id: id('r', '13'), title: '13', kind: 'EP', alias: 'MD KTRL', date: '2024-04-12', status: 'publicado', url: 'https://soundcloud.com/marcelo-lopez-456835638/sets/13a', tasks: {} },
      { id: id('r', 'key'), title: 'Key', kind: 'Recopilación de instrumentales', alias: 'Bness', date: '2024-04-08', status: 'publicado', url: 'https://soundcloud.com/boness6/sets/key', tasks: {} }
    ];
  };
})();
