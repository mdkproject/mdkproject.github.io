/* Pruebas del analizador con señales sintéticas: node tests/dsp.test.js */
const assert = require('assert');
const D = require('../js/dsp.js');
const M = require('../js/music.js');
const FS = 44100;

function sine(freq, amp, secs, phase = 0) {
  const n = Math.round(secs * FS), x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = amp * Math.sin(2 * Math.PI * freq * i / FS + phase);
  return x;
}
// 1. sonoridad: seno de 1 kHz a 0.1 en ambos canales = -20 LUFS
{
  const s = sine(1000, 0.1, 10);
  const r = D.loudness([s, s], FS);
  assert.ok(Math.abs(r.integrated - (-20)) < 0.15, 'LUFS ' + r.integrated);
  console.log('LUFS seno 1 kHz a −20 dBFS:', r.integrated.toFixed(2));
}
// 2. pico real: seno a fs/4 con fase 45°: muestras a −3 dB, pico real 0 dB
{
  const s = sine(FS / 4, 1, 1, Math.PI / 4);
  const pk = D.peaks([s]);
  const tp = D.db(D.truePeak([s], pk.peak));
  assert.ok(Math.abs(pk.peakDb + 3.01) < 0.05, 'pico muestra ' + pk.peakDb);
  assert.ok(Math.abs(tp) < 0.4, 'pico real ' + tp);
  console.log('Pico de muestra', pk.peakDb.toFixed(2), 'dB · pico real', tp.toFixed(2), 'dBTP');
}
// 3. ritmos
function drums(bpm, secs, pattern) {
  const n = Math.round(secs * FS), x = new Float32Array(n);
  const beat = 60 / bpm;
  const add = (t0, kind) => {
    const i0 = Math.round(t0 * FS);
    const len = Math.round((kind === 'kick' ? 0.25 : kind === 'snare' ? 0.18 : 0.05) * FS);
    let seed = 1 + i0;
    for (let i = 0; i < len && i0 + i < n; i++) {
      const t = i / FS;
      let v;
      if (kind === 'kick') v = Math.sin(2 * Math.PI * (50 + 100 * Math.exp(-t * 30)) * t) * Math.exp(-t * 12);
      else { seed = (seed * 16807) % 2147483647; const noise = seed / 2147483647 * 2 - 1; v = noise * Math.exp(-t * (kind === 'snare' ? 25 : 90)) * (kind === 'snare' ? 0.6 : 0.25); }
      x[i0 + i] += v * 0.5;
    }
  };
  for (let b = 0; b * beat < secs; b++) pattern(b, beat, add);
  return x;
}
const house = (b, beat, add) => { add(b * beat, 'kick'); add(b * beat + beat / 2, 'hat'); };
const hiphop = (b, beat, add) => {
  const bar = b % 4;
  if (bar === 0 || bar === 2) add(b * beat, 'kick');
  if (bar === 2) add(b * beat - beat / 2, 'kick');
  if (bar === 1 || bar === 3) add(b * beat, 'snare');
  add(b * beat, 'hat'); add(b * beat + beat / 2, 'hat');
};
function bpmOf(x, opts) {
  const xa = D.decimate(x, 2);
  return D.tempo(D.onsetEnvelope(xa, FS / 2), opts);
}
{
  for (const bpm of [124, 128, 140]) {
    const r = bpmOf(drums(bpm, 30, house));
    console.log('House', bpm, '→', r.bpm, 'conf', r.confidence.toFixed(2), 'primer golpe', r.firstBeat.toFixed(3));
    assert.ok(Math.abs(r.bpm - bpm) < 0.6, 'house ' + bpm + ' -> ' + r.bpm);
  }
  for (const bpm of [86, 92]) {
    const r = bpmOf(drums(bpm, 30, hiphop), { lo: 70, hi: 115 });
    console.log('Hip hop', bpm, '→', r.bpm, '(alt', r.alt + ')');
    assert.ok(Math.abs(r.bpm - bpm) < 0.6, 'hiphop ' + bpm + ' -> ' + r.bpm);
  }
}
// 4. tonalidad: progresiones con armónicos y bajo, en las 24 tonalidades
function tone(x, freq, amp, t0, dur) {
  const i0 = Math.round(t0 * FS), n = Math.round(dur * FS);
  for (let h = 1; h <= 6; h++) {
    const f = freq * h; if (f > 8000) break;
    for (let i = 0; i < n && i0 + i < x.length; i++) {
      const env = Math.min(1, i / 400) * Math.exp(-i / FS * 1.2);
      x[i0 + i] += amp / h * env * Math.sin(2 * Math.PI * f * i / FS);
    }
  }
}
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
function progression(tonic, mode, chords) {
  chords = chords || (mode === 'min' ? [[0, 3, 7], [5, 8, 12], [7, 10, 14], [0, 3, 7]] : [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]]);
  const secs = 16, x = new Float32Array(secs * FS);
  for (let rep = 0; rep < 2; rep++) chords.forEach((ch, i) => {
    const t0 = (rep * 4 + i) * 2;
    ch.forEach(iv => tone(x, midiHz(60 + tonic + iv), 0.12, t0, 2));
    tone(x, midiHz(36 + tonic + ch[0]), 0.25, t0, 2);
  });
  return x;
}
{
  // progresiones típicas: i-iv-v-i, i-VI-VII-i, I-IV-V-I, I-V-vi-IV en las 12 tónicas
  const PROGS = [
    ['min', [[0, 3, 7], [5, 8, 12], [7, 10, 14], [0, 3, 7]]],
    ['min', [[0, 3, 7], [8, 12, 15], [10, 14, 17], [0, 3, 7]]],
    ['maj', [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]]],
    ['maj', [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]]]
  ];
  let ok = 0, total = 0;
  for (const [mode, chords] of PROGS) for (let pc = 0; pc < 12; pc++) {
    const xa = D.decimate(progression(pc, mode, chords), 2), fa = FS / 2;
    const mid = D.chromaOf(xa, fa, 4096, 2048, 110, 2000, 0, false, 'max').chroma;
    const bass = D.chromaOf(D.decimate(xa, 4), fa / 4, 4096, 2048, 35, 260, 0, false, 'max').chroma;
    const got = D.keyFromChroma(mid, bass);
    total++;
    if (got.pc === pc && got.mode === mode) ok++;
    else console.log('  fallo:', M.stdName({ pc, mode }), '→', M.stdName(got));
  }
  console.log('Tonalidad: ' + ok + '/' + total + ' exactas');
  assert.ok(ok / total >= 0.9, 'precisión de tonalidad ' + ok + '/' + total);
}
// 5. análisis completo con afinación desplazada (+30 cents) sigue encontrando la tonalidad
{
  const x = progression(9, 'min');
  // re-muestreo barato para subir 30 cents
  const ratio = Math.pow(2, 30 / 1200), y = new Float32Array(Math.floor(x.length / ratio));
  for (let i = 0; i < y.length; i++) { const p = i * ratio, j = Math.floor(p), f = p - j; y[i] = x[j] * (1 - f) + (x[j + 1] || 0) * f; }
  const t0 = Date.now();
  const r = D.analyze([y, y], FS, {});
  console.log('Am +30 cents →', M.stdName(r.key), '· afinación estimada', r.tuning.toFixed(1), 'cents ·', (Date.now() - t0) + ' ms');
  assert.strictEqual(M.stdName(r.key), 'Am');
  assert.ok(Math.abs(r.tuning - 30) < 8, 'afinación ' + r.tuning);
}
console.log('dsp.js: todas las pruebas pasan');
