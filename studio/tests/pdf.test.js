/* Genera un PDF de prueba y lo valida con pypdf / pdftoppm: node tests/pdf.test.js <salida.pdf> */
const fs = require('fs');
const assert = require('assert');
const P = require('../js/pdf.js');
const out = process.argv[2] || '/tmp/ktrl-prueba.pdf';
// el mismo glifo que usa la app
global.window = undefined;
const logoSrc = fs.readFileSync(__dirname + '/../js/logo.js', 'utf8');
const d = /d: '([^']+)'/.exec(logoSrc)[1];

assert.strictEqual(P.widthOf('Hola', 'H', 10), (722 + 556 + 222 + 556) / 100);
assert.deepStrictEqual(P.encode('ñ€—'), [241, 128, 151]);

const spec = {
  kicker: 'Lattice Rekords', title: 'Contrato de licencia de beat', subtitle: 'Licencia no exclusiva · Bness',
  ref: 'N.° KTRL-2026-001', date: '16 de noviembre de 2026',
  meta: [['Beat', 'Ruby Pt. I'], ['Tipo', 'No exclusiva'], ['Precio', 'S/ 80'], ['Archivos', 'WAV + MP3']],
  blocks: [
    { h: '1. Partes' },
    { p: '**EL PRODUCTOR:** Marcelo López, conocido como **MD KTRL** (alias Bness), con domicilio en Tacna, Perú.' },
    { p: '**EL ARTISTA:** Jeydee Psycho. Año, niño, pingüino, ¿qué tal? ¡Listo! Precio en € y en S/.' },
    { h: '2. Alcance del uso' },
    { bullets: ['Distribución en plataformas digitales hasta **100 000 reproducciones**.', 'Un videoclip oficial.', 'Presentaciones en vivo con o sin fines de lucro, en cualquier ciudad y por tiempo indefinido mientras la licencia esté vigente y se respeten los créditos acordados en la cláusula 6.'] },
    { table: { head: ['Nombre', 'Rol', '% Autoría', '% Máster'], widths: [3, 3, 1.3, 1.3], align: ['', '', 'r', 'r'], rows: [['Juan Sánchez (Mr. Bless)', 'Letra e interpretación', '50 %', '50 %'], ['Marcelo López (MD KTRL)', 'Producción', '50 %', '50 %']], foot: ['Total', '', '100 %', '100 %'] } },
  ].concat(Array.from({ length: 14 }, (_, i) => ({ p: 'Párrafo de relleno ' + (i + 1) + ' para forzar el salto de página y comprobar que el pie con la numeración aparece en todas las hojas del documento generado.' }))),
  place: 'Firmado en Tacna, el 16 de noviembre de 2026.',
  signatures: [{ role: 'El productor', name: 'Marcelo López (MD KTRL)', sub: 'DNI ________' }, { role: 'El artista', name: 'Jeydee Psycho', sub: 'DNI ________' }],
  footer: 'mdkproject.github.io · Lattice Rekords · Tacna, Perú'
};
const bytes = P.renderDoc(spec);
// logo directo con el escritor
const doc = P.create({ info: { title: 'Logo' } });
doc.addPage(); doc.rect(0, 0, doc.W, 120, { fill: '#0b0b0c' }); doc.svgPath(d, 40, 20, 80 / 158.2, { fill: '#f1a83c' });
doc.text('Glifo MD KTRL', 140, 70, { font: 'HB', size: 20, color: '#ffffff' });
fs.writeFileSync(out, bytes);
fs.writeFileSync(out.replace(/\.pdf$/, '-logo.pdf'), doc.output());
console.log('PDF escrito:', out, bytes.length, 'bytes');
