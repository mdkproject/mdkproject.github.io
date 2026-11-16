# MD KTRL

Sitio web oficial de MD KTRL (Marcelo Lopez), productor y DJ de Tacna, Peru.

Hip hop, trap y musica electronica: discografia, beats, colaboraciones, eventos y contacto.

Pagina en vivo: https://mdkproject.github.io

## Que tiene la pagina

- **Reproductor propio**: boton de play en cada lanzamiento y en el bloque Destacado, mas un mini reproductor fijo abajo. Usa el widget de SoundCloud con controles propios y solo se carga al primer play.
- **Contratar**: el formulario arma un mensaje y abre WhatsApp. No guarda nada.
- **Licencias de beats**: tres opciones; "Cotizar" rellena el formulario.
- **Press kit y tarjeta de contacto**: `press-kit/MD-KTRL-press-kit.pdf` y `mdktrl.vcf`.
- **Ingles**: selector ES/EN. El espanol es el texto de la pagina; el ingles sale del diccionario `EN` en el script de `index.html`.
- **Tie-dye** en las secciones (la portada va limpia); se mueve mientras suena un track.

## Como editar

Todo esta en `index.html`.

- **Destacado**: la seccion `#destacado` (cambia el enlace `data-sc` y los textos).
- **Un lanzamiento nuevo**: copia una fila de `#log`; el boton de play usa `data-sc` con la URL del track o del set de SoundCloud.
- **Textos en ingles**: agrega la frase en espanol y su traduccion al diccionario `EN`. En la consola, `MDK.missing()` lista lo que falta (nombres propios y numeros pueden quedar igual).
- **Contacto**: el numero esta en el script (`wa.me/51944310246`), en `#v-tel` y en `mdktrl.vcf`.

## Probar en local

```bash
python -m http.server 8123
```

Abre http://127.0.0.1:8123/ (`?lang=en` para ver el ingles).

## KTRL Room (el estudio)

Herramientas de trabajo en `studio/`, publicadas en https://mdkproject.github.io/studio/ (no aparecen en buscadores ni hay enlace desde la web). Se instala en el celular con "Agregar a pantalla de inicio" y funciona sin conexion una vez abierto.

| Modulo | Para que sirve |
|---|---|
| Inicio | Proxima fecha, plata por cobrar, pendientes e ingresos por mes. |
| Agenda | Sets, beats, producciones, eventos, alquiler de equipos y diseno en un tablero por etapa. Preguntas para calificar cada consulta y el siguiente mensaje de WhatsApp. |
| Catalogo | Los beats de Bness con BPM, tonalidad, estado y licencias vendidas. Filtro "compatible con" por Camelot. CSV. |
| Analizador | Suelta audios: BPM, tonalidad (Camelot), LUFS integrado, rango, pico real, balance espectral y grilla con clic. Todo en el navegador. |
| Licencias | Las tres licencias de la web con cotizacion para WhatsApp y contrato en PDF (ley peruana, D. L. 822). Acepta pago en especie. |
| Splits | Split sheets con autoria (APDAYC) y master (UNIMPRO, SONIEM) y una firma por persona, en PDF. |
| Set | Orden de un set por compatibilidad armonica, BPM y energia, con la ruta en la rueda Camelot. |
| Tempo | Tap tempo, delay y reverb en ms, pitch sin key lock y compases a minutos. |
| Eventos | Lineup con horarios automaticos, presupuesto con punto de equilibrio y rider tecnico en PDF. |
| Afiches | Post, historia o cuadrado en cuatro estilos (tie-dye, cromo, horarios, foto) a partir de un evento. PNG. |
| Lanzamientos | Cuenta regresiva de tareas por lanzamiento y la fila lista para pegar en `#log` de esta web. |
| Textos | Plantillas para Instagram (comentario a DM), WhatsApp, captions y bios. Dentro de Claude tambien redacta con IA. |
| Ajustes | Perfil (sale en los PDF), precios, formas de pago, respaldo y restauracion. |

**Donde se guardan los datos**: en el navegador (`localStorage`). Descarga un respaldo desde Ajustes de vez en cuando. Cuando KTRL Room se abre como artifact dentro de Claude, los datos se guardan en tu cuenta y se sincronizan entre dispositivos; el respaldo sirve para pasar de una version a la otra.

**Como esta hecho**: HTML, CSS y JavaScript sin dependencias ni paso de compilacion. Cada modulo es un archivo en `studio/js/views/` que se registra con `KR.view()`. El nucleo (`js/core.js`) tiene los datos, las rutas por `#hash` y piezas comunes. `js/dsp.js` hace el analisis de audio en un Worker, `js/pdf.js` escribe los PDF con las fuentes estandar y `js/poster.js` dibuja los afiches en canvas.

**Pruebas** (Node 18 o mas nuevo):

```bash
node studio/tests/music.test.js   # tonalidades, Camelot, orden de sets
node studio/tests/dsp.test.js     # LUFS, pico real, BPM y tonalidad con senales sinteticas
node studio/tests/pdf.test.js /tmp/prueba.pdf
```

Si cambias archivos del estudio, sube `VERSION` en `studio/sw.js` para que el modo sin conexion tome la version nueva.
