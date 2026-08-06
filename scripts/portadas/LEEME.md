# Portadas de las prácticas de mecánica

Cada ficha del hub (`/alumno/laboratorio/mecanica`) muestra
`public/images/mecanica/prac_<orden>.webp`, donde `orden` es el número del id
(`mecanica-93` → `prac_93.webp`). La imagen **no** es arte de archivo: es un
fotograma capturado del propio simulador 3D de esa práctica, así que nunca puede
mentir sobre lo que el alumno va a abrir.

## Cuando añadas una práctica nueva

```bash
node scripts/portadas/capturar-portadas.mjs --solo 113
node scripts/portadas/maqueta-fichas.mjs --solo 113          # revisión en claro
node scripts/portadas/maqueta-fichas.mjs --solo 113 --oscuro # y en oscuro
```

La primera orden escribe `public/images/mecanica/prac_113.webp`; las otras dos
montan la ficha real con esa portada dentro y dejan
`scripts/portadas/.salida/fichas-claro-1.png` y `fichas-oscuro-1.png`.
**Mira las hojas antes de commitear**: el encuadre automático acierta casi
siempre, pero el «casi» hay que verlo, y el velo que funde el borde izquierdo de
la imagen con la ficha es blanco en claro y `#0A1121` en oscuro, así que una
portada puede fundirse bien en un tema y cortarse en seco en el otro.

Si a la maqueta le falta alguna portada avisa por `stderr` y sale con código 1 —
un hueco blanco en la hoja es indistinguible de un encuadre malo, y esa confusión
ya costó una vuelta.

Si la portada sale siendo una mesa vacía con el aparato diminuto en una esquina,
añade el lab a la tabla `AJUSTES` de `capturar-portadas.mjs` con
`{ forzarBanco: true }` y vuelve a capturar. Está explicado ahí y en `encuadre.mjs`
por qué esa excepción va lab por lab y no como regla general.

Rehacer las 112 de golpe (≈40 min) es `npm run gen:portadas`. Es idempotente
salvo por el ruido de compresión, así que espera un diff en casi todos los
archivos aunque no hayas cambiado nada.

## Requisito: Playwright

Playwright **no** es dependencia del proyecto —no queremos arrastrar Chromium al
build de Cloudflare— así que se resuelve desde la instalación global:

```bash
npm i -g playwright && npx playwright install chromium
```

Si la tienes en otro sitio, exporta `PLAYWRIGHT_DIR` con la carpeta que contiene
su `node_modules`.

## Qué hace el encuadre

`encuadre.mjs` reencuadra la cámara de three.js **desde fuera** del lab, sin tocar
ni un archivo del proyecto: engancha `__THREE_DEVTOOLS__` para capturar escena y
cámara, parchea `OrbitControls` (que si no reimpone su `target` en cada frame),
manda la pizarra teórica y los rótulos flotantes a la capa 31 —invisible para
toda cámara—, mide la máquina descartando el banco de trabajo y resuelve la
distancia mínima que mete la caja del sujeto en un cuadro 3:2. Las reglas de
medida están comentadas ahí arriba, con la práctica concreta donde se midió cada
una.

`capturar-portadas.mjs` monta encima: sirve `public/` en un puerto suelto, arma
los labs que nacen desmontados (dos familias de API, `__labDebug` y `__test`),
despierta a los que esconden el aparato hasta que se opera, congela la cámara
dentro de `renderer.render` y reencodea a WebP con `canvas.toDataURL` — sin
`sharp` ni ninguna dependencia nueva.

Salida actual: 112 imágenes de 720×480, 876 KB en total (mínimo 4,8 · mediana 7,4
· máximo 19,1 KB).
