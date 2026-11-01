# mecanica-259 · Cercha: reacciones y fuerzas en las barras

<!-- estado-solidos -->
## Revisión vigente · 31-10-2026

**Implementación y revisión local completas. Sin push ni publicación.** Commit del lote: consultar el historial de Git de esta ficha. Publicación pendiente de la primera autorización exigida por el usuario.

Orden: OT-259 · Sostén ≥24 kN con esfuerzo ≤100 MPa, flecha ≤2 mm y altura ≤800 mm.

Modelo vigente: Cercha triangular, base 2 m y nudo central a h. Barras A=300 mm², E=210 GPa; l=√(1+h²). RA=RB=P/2; Nd=−Pl/(2h); Nt=P/(2h). Castigliano: δ=P(l³+1)/(2EA h²). Un apoyo articulado y otro rodillo.

Límites: Barras biarticuladas sólo axiales, sin peso propio, rigidez de nudos, flexión ni verificación de pandeo de diagonales. Deformada sólo del nudo por trabajo virtual, ×25; no apta para selección estructural real.

Fuente: MIT · Mechanics of Materials · David Roylance · https://web.mit.edu/course/3/3.11/www/module_list.html

Evidencia funcional de la revisión actual: **4/4 tamaños**. Firma del producto y auditor: 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86.

- 2020×1055 DPR 1.25: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 47 palabras, 23 llamadas, 10950 triángulos, 65.00 % de encuadre inicial.
- 390×844 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 47 palabras, 23 llamadas, 10950 triángulos, 56.49 % de encuadre inicial.
- 1366×768 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 47 palabras, 23 llamadas, 10950 triángulos, 65.00 % de encuadre inicial.
- 1600×900 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 47 palabras, 23 llamadas, 10950 triángulos, 65.00 % de encuadre inicial.

Global: TypeScript y ESLint pasaron. Jest completo: 50 suites / 4289 pruebas, correctas. Después del manifiesto de voz se comprobaron 2 suites y 34 pruebas de voz/briefing, correctas. Física: 5.388 comprobaciones correctas; regresión de modelos 241–250: 14.738 correctas.

Voz: 150 clips para el bloque, 49 textos distintos, generados con Qwen3-TTS y molde aprobado; duración, SHA256 y copia a sus claves verificados en voz.json. Se preservaron los 7.555 MP3 anteriores: 7.705 en el árbol local. El manifiesto amplía 166→176 prácticas con voz, sin eliminar las anteriores.

Portada propia revisada: public/images/mecanica/prac_259.webp. Autocrítica: Barras, uniones y apoyos se distinguen por forma y acabado; la altura cambia la geometría triangular. El reto validado sigue legible sin cubrir la estructura. Modelo reducido de tres barras, no una armadura espacial compleja.

Evidencia portable: [autocrítica del bloque](evidencia-solidos/autocritica.json), [portadas](evidencia-solidos/contacto-portadas.jpg) y [estados](evidencia-solidos/contacto-estados.jpg). Cierre estricto comprueba-cierre-solidos.mjs correcto: 40 recorridos, 150 clips con hashes actuales, código y revisión visual.

Retomar: solicitar la primera autorización de push/despliegue con este bloque revisado. No confundir aprobación local con publicación. Continuar construyendo 261–270 (Elementos de Máquina), después 291–300, 271–280 y 281–290. El total encargado es de 50 laboratorios.
<!-- /estado-solidos -->

## Historial de implementación y verificaciones anteriores
Estado: implementación local en curso. Sin commit, push ni publicación.

## Originalidad
Nuevo equilibrio de estructura isostática; no robot por cables.

## Modelo y límites
Cercha triangular, base 2 m y nudo central a h. Barras A=300 mm², E=210 GPa; l=√(1+h²). RA=RB=P/2; Nd=−Pl/(2h); Nt=P/(2h). Castigliano: δ=P(l³+1)/(2EA h²). Un apoyo articulado y otro rodillo.

Barras biarticuladas sólo axiales, sin peso propio, rigidez de nudos, flexión ni verificación de pandeo de diagonales. Deformada sólo del nudo por trabajo virtual, ×25; no apta para selección estructural real.

## Archivos
`public/labs/_solidos-*.js`, `cercha-equilibrio-barras.html`, `_ficha-cercha-equilibrio-barras.js`, `scripts/lab-src/cercha-equilibrio-barras.json`, `src/labs/mecanica-259/`.

## Verificación y punto para retomar
Pendientes: pruebas numéricas independientes, recorrido real en cuatro tamaños, crítica visual, portada, voz, TypeScript, ESLint, Jest completo y publicación autorizada. No contar este laboratorio como terminado.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 20e8e43db13e4987b6113e3460404520c4892e8376369161a0082cb8d230fcd5; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 20e8e43db13e4987b6113e3460404520c4892e8376369161a0082cb8d230fcd5; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión a8c1aee2c62754bdc348efb18d3f6bfaa457290850a4d363e82664fc66833d0e; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.
