/* Pruebas de la teoría musical: node tests/music.test.js */
const assert = require('assert');
const M = require('../js/music.js');
const k = s => M.parseKey(s);

// Camelot de referencia
const ref = { '8A': 'Am', '8B': 'C', '1A': 'Abm', '1B': 'B', '12A': 'C#m', '12B': 'E', '5A': 'Cm', '2B': 'F#', '3B': 'Db', '11A': 'F#m', '4A': 'Fm', '6B': 'Bb' };
for (const [cam, name] of Object.entries(ref)) {
  assert.strictEqual(M.camelotStr(k(name)), cam, name + ' -> ' + cam);
  assert.strictEqual(M.stdName(k(cam)), name, cam + ' -> ' + name);
}
// todas las 24 ida y vuelta
for (let n = 1; n <= 12; n++) for (const l of ['A', 'B']) assert.strictEqual(M.camelotStr(M.fromCamelot(n, l)), n + l);
// lectura flexible
assert.deepStrictEqual(k('La menor'), { pc: 9, mode: 'min' });
assert.deepStrictEqual(k('fa# m'), { pc: 6, mode: 'min' });
assert.deepStrictEqual(k('Si bemol mayor'), { pc: 10, mode: 'maj' });
assert.deepStrictEqual(k('A minor'), { pc: 9, mode: 'min' });
assert.deepStrictEqual(k('Ebm'), { pc: 3, mode: 'min' });
assert.deepStrictEqual(k('Do♯ menor'), { pc: 1, mode: 'min' });
assert.deepStrictEqual(k('8a'), { pc: 9, mode: 'min' });
assert.strictEqual(k('xyz'), null);
assert.strictEqual(M.esName(k('8A')), 'La menor');
// transiciones
assert.strictEqual(M.transition(k('8A'), k('9A')).kind, 'up1');
assert.strictEqual(M.transition(k('8A'), k('8B')).kind, 'relative');
assert.strictEqual(M.transition(k('8A'), k('9B')).kind, 'diagonal');
assert.strictEqual(M.transition(k('8A'), k('10A')).kind, 'boost');
assert.strictEqual(M.transition(k('8A'), k('3A')).kind, 'semi-up'); // +7 = +1 semitono
assert.strictEqual(M.transition(k('Am'), k('A#m')).kind, 'semi-up');
assert.strictEqual(M.transition(k('8A'), k('2B')).tone, 'bad');
// tempo
assert.ok(Math.abs(M.semitonesFor(124, 128) - 0.5493) < 1e-3);
assert.strictEqual(M.bpmMatch(70, 140).ratio, 0.5);
assert.ok(Math.abs(M.bpmMatch(124, 126).pct - 1.6129) < 1e-3);
assert.ok(Math.abs(M.msFor(120, 1) - 500) < 1e-9);
assert.ok(Math.abs(M.tapTempo([0, 500, 1000, 1500, 2000]) - 120) < 1e-9);
assert.ok(Math.abs(M.barsToSeconds(32, 128) - 60) < 1e-9);
// orden de set: exacto (<=11) y heurístico
const tracks = [
  { title: 'a', bpm: 122, key: '8A', energy: 4 }, { title: 'b', bpm: 128, key: '3A', energy: 8 },
  { title: 'c', bpm: 124, key: '9A', energy: 5 }, { title: 'd', bpm: 126, key: '10A', energy: 6 },
  { title: 'e', bpm: 123, key: '8B', energy: 4 }, { title: 'f', bpm: 127, key: '10B', energy: 7 }
];
const o = M.orderSet(tracks, { arc: 'up' });
assert.strictEqual(o.length, tracks.length);
assert.strictEqual(new Set(o).size, tracks.length);
const ordered = o.map(i => tracks[i]);
assert.ok(M.setScore(ordered) >= M.setScore(tracks), 'el orden no empeora');
const big = Array.from({ length: 30 }, (_, i) => ({ title: 't' + i, bpm: 118 + (i * 7) % 14, key: ((i * 5) % 12 + 1) + (i % 2 ? 'A' : 'B'), energy: 1 + i % 10 }));
const ob = M.orderSet(big, { first: 3 });
assert.strictEqual(ob[0], 3);
assert.strictEqual(new Set(ob).size, 30);
const cost = (ord) => M.pathCost(ord, big.map((a, i) => big.map((b, j) => i === j ? 0 : M.stepCost(a, b, {}))));
assert.ok(cost(ob) < cost(big.map((_, i) => i)), 'el heurístico mejora el orden original');
console.log('music.js: todas las pruebas pasan');
