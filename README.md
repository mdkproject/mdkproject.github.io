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
