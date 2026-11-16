/* KTRL Room · Tempo
   Tap tempo, tiempos de delay y reverb, pitch sin key lock y compases ↔ minutos. */
(function () {
  'use strict';
  var KR = window.KR, M = KR.music, esc = KR.esc;

  function remember(k, v) { try { if (v === undefined) return localStorage.getItem('kr-' + k); localStorage.setItem('kr-' + k, v); } catch (e) { return null; } }

  KR.view('tempo', {
    title: 'Tempo', icon: 'metronome',
    render: function (el, arg, ctx) {
      var bpm = KR.num(remember('tempo-bpm'), 0) || 120;
      var taps = [];
      var keyOptions = [];
      for (var n = 1; n <= 12; n++) ['A', 'B'].forEach(function (l) {
        var k = M.fromCamelot(n, l);
        keyOptions.push({ value: n + l, label: n + l + ' · ' + M.stdName(k) });
      });

      el.innerHTML = KR.head({
        title: 'Tempo',
        lead: 'Toca el pulso, saca los tiempos de delay y reverb, y mira qué le pasa a la tonalidad cuando subes el pitch sin key lock.'
      }) +
        '<div class="tempo-grid">' +
        '<section class="panel tap-panel" aria-labelledby="tap-h">' +
        '<div class="panel-head"><h2 id="tap-h">Tap tempo</h2><span class="label">Barra espaciadora o T</span></div>' +
        '<div class="tap-body">' +
        '<button type="button" class="tap-pad" id="tap" aria-describedby="tap-help"><span class="led" id="led"></span><span class="tap-word">TAP</span></button>' +
        '<div class="tap-read"><output class="tap-bpm num" id="tap-bpm" aria-live="polite"><span class="faint">0.0</span></output><span class="label">BPM tocado</span>' +
        '<p class="hint" id="tap-help">Toca al menos 4 veces. Si paras 2 segundos, empieza de nuevo.</p>' +
        '<div class="row"><button class="btn sm ghost" type="button" data-act="half">÷2</button><button class="btn sm ghost" type="button" data-act="double">×2</button>' +
        '<button class="btn sm" type="button" data-act="use">Usar este BPM</button></div></div>' +
        '</div></section>' +

        '<section class="panel bpm-panel"><div class="panel-head"><h2>Tempo de trabajo</h2></div><div class="panel-pad">' +
        '<div class="bpm-row"><button class="icon-btn" type="button" data-act="minus" aria-label="Bajar 1 BPM">−</button>' +
        '<label class="sr" for="bpm">BPM</label><input class="field-in big num bpm-in" id="bpm" type="number" inputmode="decimal" min="40" max="250" step="0.1" value="' + bpm + '">' +
        '<button class="icon-btn" type="button" data-act="plus" aria-label="Subir 1 BPM">+</button><span class="label">BPM</span></div>' +
        '<div class="bpm-facts" id="facts"></div></div></section>' +

        '<section class="panel notes-panel"><div class="panel-head"><h2>Delay y LFO</h2><span class="label">ms · Hz</span></div>' +
        '<div class="table-wrap flat"><table class="tbl" id="notes"></table></div></section>' +

        '<section class="panel"><div class="panel-head"><h2>Reverb</h2></div><div class="panel-pad" id="reverb"></div></section>' +

        '<section class="panel pitch-panel"><div class="panel-head"><h2>Pitch y tonalidad</h2><span class="label">Sin key lock</span></div><div class="panel-pad">' +
        '<div class="form-grid">' +
        KR.field({ id: 'p-from', label: 'BPM del tema', type: 'number', value: 124, attrs: 'inputmode="decimal" step="0.1"' }) +
        KR.field({ id: 'p-to', label: 'BPM al que lo llevas', type: 'number', value: 128, attrs: 'inputmode="decimal" step="0.1"' }) +
        KR.field({ id: 'p-key', label: 'Tonalidad del tema', type: 'select', options: keyOptions, value: '8A' }) +
        '</div><div class="pitch-out" id="pitch-out"></div></div></section>' +

        '<section class="panel"><div class="panel-head"><h2>Compases y minutos</h2></div><div class="panel-pad">' +
        '<div class="form-grid">' +
        KR.field({ id: 'b-bars', label: 'Compases', type: 'number', value: 32, attrs: 'inputmode="numeric" min="1"' }) +
        KR.field({ id: 'b-min', label: 'Minutos de set', type: 'number', value: 60, attrs: 'inputmode="numeric" min="1"' }) +
        '</div><div id="bars-out" class="bars-out"></div></div></section>' +
        '</div>';

      var $ = function (s) { return KR.$(s, el); };
      var bpmIn = $('#bpm');

      function fmtMs(ms) { return ms >= 1000 ? (ms / 1000).toFixed(2) + ' s' : (ms < 100 ? ms.toFixed(1) : Math.round(ms)).toString() + ' ms'; }
      function fmtHz(ms) { var hz = 1000 / ms; return (hz < 10 ? hz.toFixed(2) : hz.toFixed(1)) + ' Hz'; }

      function paint() {
        var b = KR.num(bpmIn.value, 0);
        if (!(b >= 20 && b <= 400)) return;
        remember('tempo-bpm', b);
        var rows = M.noteTable(b);
        $('#notes').innerHTML = '<thead><tr><th>Figura</th><th class="r">Normal</th><th class="r">Con puntillo</th><th class="r">Tresillo</th><th class="r">LFO</th></tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr' + (r.id === '1/4' ? ' class="hl"' : '') + '><td><b class="mono">' + r.id + '</b> <span class="muted">' + r.label + '</span></td>' +
              '<td class="r num">' + fmtMs(r.straight) + '</td><td class="r num">' + fmtMs(r.dotted) + '</td><td class="r num">' + fmtMs(r.triplet) + '</td>' +
              '<td class="r num muted">' + fmtHz(r.straight) + '</td></tr>';
          }).join('') + '</tbody>';
        var bar = M.msFor(b, 4);
        var pd64 = M.msFor(b, 1 / 16), pd128 = M.msFor(b, 1 / 32);
        $('#reverb').innerHTML =
          '<dl class="facts">' +
          '<div><dt>Pre-delay 1/64</dt><dd class="num">' + fmtMs(pd64) + '</dd></div>' +
          '<div><dt>Pre-delay 1/128</dt><dd class="num">' + fmtMs(pd128) + '</dd></div>' +
          '<div><dt>Cola larga · 1 compás</dt><dd class="num">' + fmtMs(bar - pd64) + '</dd></div>' +
          '<div><dt>Cola media · 1/2 compás</dt><dd class="num">' + fmtMs(bar / 2 - pd64) + '</dd></div>' +
          '<div><dt>Cola corta · 1/4</dt><dd class="num">' + fmtMs(bar / 4 - pd128) + '</dd></div>' +
          '</dl><p class="hint">La cola ya descuenta el pre-delay, así la reverb muere justo antes del siguiente golpe.</p>';
        var beatMs = M.msFor(b, 1);
        $('#facts').innerHTML =
          '<span><b class="num">' + fmtMs(beatMs) + '</b> por negra</span>' +
          '<span><b class="num">' + fmtMs(bar) + '</b> por compás</span>' +
          '<span><b class="num">' + Math.round(44100 * beatMs / 1000).toLocaleString('es-PE') + '</b> muestras a 44,1 kHz</span>' +
          '<span><b class="num">' + (b / 2).toFixed(1).replace(/\.0$/, '') + ' / ' + (b * 2).toFixed(1).replace(/\.0$/, '') + '</b> mitad y doble</span>';
        paintBars();
      }

      function paintPitch() {
        var f = KR.num($('#p-from').value, 0), t = KR.num($('#p-to').value, 0);
        var key = M.parseKey($('#p-key').value);
        var out = $('#pitch-out');
        if (!(f > 0 && t > 0)) { out.innerHTML = ''; return; }
        var pct = (t / f - 1) * 100;
        var st = M.semitonesFor(f, t);
        var near = Math.round(st);
        var moved = M.transpose(key, near);
        var cents = Math.round((st - near) * 100);
        var sign = function (x, d) { return (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d); };
        var verdict;
        if (Math.abs(st) < 0.25) verdict = '<span class="pill good">' + KR.icon('check') + 'La tonalidad casi no cambia</span>';
        else if (Math.abs(st) < 0.5) verdict = '<span class="pill warn">' + KR.icon('warn') + 'Queda desafinado hacia ' + M.camelotStr(M.transpose(key, st > 0 ? 1 : -1)) + '</span>';
        else verdict = '<span class="pill bad">' + KR.icon('warn') + 'Suena en ' + M.camelotStr(moved) + ' (' + M.stdName(moved) + ')</span>';
        out.innerHTML =
          '<dl class="facts">' +
          '<div><dt>Pitch</dt><dd class="num">' + sign(pct, 2) + ' %</dd></div>' +
          '<div><dt>Semitonos</dt><dd class="num">' + sign(st, 2) + '</dd></div>' +
          '<div><dt>Tonalidad que suena</dt><dd class="num">' + (Math.abs(st) < 0.5 ? M.camelotStr(key) : M.camelotStr(moved)) + (cents ? ' <small class="muted">' + (cents > 0 ? '+' : '−') + Math.abs(cents) + ' cents</small>' : '') + '</dd></div>' +
          '</dl><div class="row">' + verdict + '</div>' +
          '<p class="hint">Con key lock la tonalidad se queda en ' + esc(M.camelotStr(key)) + '. Un semitono arriba equivale a +7 en la rueda Camelot.</p>';
      }

      function paintBars() {
        var b = KR.num(bpmIn.value, 0) || 120;
        var bars = KR.num($('#b-bars').value, 32), mins = KR.num($('#b-min').value, 60);
        var secs = M.barsToSeconds(bars, b);
        var barsInSet = Math.floor(mins * 60 / M.barsToSeconds(1, b));
        $('#bars-out').innerHTML =
          '<dl class="facts">' +
          '<div><dt>' + KR.plural(bars, 'compás', 'compases') + ' a ' + b + ' BPM</dt><dd class="num">' + KR.fmtDur(secs) + '</dd></div>' +
          '<div><dt>Compases en ' + mins + ' min</dt><dd class="num">' + barsInSet.toLocaleString('es-PE') + '</dd></div>' +
          '<div><dt>Frases de 32 en ' + mins + ' min</dt><dd class="num">' + Math.floor(barsInSet / 32) + '</dd></div>' +
          '</dl>' +
          '<div class="phrases">' + [8, 16, 32, 64].map(function (p) {
            return '<span><b class="num">' + p + '</b> compases <i class="num">' + KR.fmtDur(M.barsToSeconds(p, b)) + '</i></span>';
          }).join('') + '</div>';
      }

      /* tap */
      var led = $('#led'), ledTimer = null;
      function flash() { led.classList.remove('on'); void led.offsetWidth; led.classList.add('on'); }
      function tap() {
        var now = performance.now();
        if (taps.length && now - taps[taps.length - 1] > 2000) taps = [];
        taps.push(now);
        flash();
        var t = M.tapTempo(taps);
        var out = $('#tap-bpm');
        if (t && taps.length >= 4) {
          out.textContent = t.toFixed(1);
          out.dataset.v = t.toFixed(1);
          clearInterval(ledTimer);
          ledTimer = setInterval(flash, 60000 / t);
          setTimeout(function () { clearInterval(ledTimer); }, 8000);
        } else {
          out.innerHTML = '<span class="faint">' + (taps.length < 4 ? (4 - taps.length) + ' más' : '0.0') + '</span>';
        }
      }
      ctx.cleanup(function () { clearInterval(ledTimer); });
      $('#tap').addEventListener('pointerdown', function (e) { e.preventDefault(); tap(); });
      $('#tap').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); tap(); } });
      ctx.on(document, 'keydown', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.metaKey || e.ctrlKey) return;
        if (e.code === 'Space' || e.key === 't' || e.key === 'T') { e.preventDefault(); tap(); }
      });

      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        var act = b.getAttribute('data-act');
        var out = $('#tap-bpm'), v = KR.num(out.dataset.v, 0);
        if (act === 'half' && v) { v = v / 2; out.dataset.v = v.toFixed(1); out.textContent = v.toFixed(1); }
        if (act === 'double' && v) { v = v * 2; out.dataset.v = v.toFixed(1); out.textContent = v.toFixed(1); }
        if (act === 'use' && v) { bpmIn.value = Math.round(v * 10) / 10; paint(); KR.toast('Tempo de trabajo: ' + bpmIn.value + ' BPM'); }
        if (act === 'minus') { bpmIn.value = Math.max(40, Math.round(KR.num(bpmIn.value) - 1)); paint(); }
        if (act === 'plus') { bpmIn.value = Math.min(250, Math.round(KR.num(bpmIn.value) + 1)); paint(); }
      });
      bpmIn.addEventListener('input', paint);
      ['#p-from', '#p-to', '#p-key'].forEach(function (s) { $(s).addEventListener('input', paintPitch); });
      ['#b-bars', '#b-min'].forEach(function (s) { $(s).addEventListener('input', paintBars); });
      paint(); paintPitch();
    }
  });
})();
