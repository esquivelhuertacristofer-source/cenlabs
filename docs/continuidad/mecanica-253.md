# mecanica-253 · Pandeo de columnas: carga crítica y esbeltez

<!-- estado-solidos -->
## Revisión vigente · 31-10-2026

**Implementación y revisión local completas. Sin push ni publicación.** Commit del lote: consultar el historial de Git de esta ficha. Publicación pendiente de la primera autorización exigida por el usuario.

Orden: OT-253 · Sostén al menos 25 kN con reserva de Euler entre 2 y 4 y esbeltez ≥100.

Modelo vigente: Columna circular biarticulada L=1,5 m, K=1, E=210 GPa. A=πd²/4; I=πd⁴/64; λ=KL/√(I/A)=4L/d; Pcr=π²EI/(KL)². Imperfección sinusoidal e0=1 mm: e=e0/(1−P/Pcr), exclusivamente para P<Pcr.

Límites: Euler elástico ideal, sin excentricidad adicional, residual ni plasticidad. Si P≥Pcr se muestra inestabilidad sin inventar una deformada poscrítica. Exageración lateral ×8; diámetro visual ×3. Aproximación de amplificación de imperfección, no solución no lineal completa.

Fuente: MIT · Mechanics of Materials · David Roylance · https://web.mit.edu/course/3/3.11/www/module_list.html

Evidencia funcional de la revisión actual: **4/4 tamaños**. Firma del producto y auditor: 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86.

- 390×844 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 47 palabras, 16 llamadas, 15234 triángulos, 65.00 % de encuadre inicial.
- 1366×768 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 47 palabras, 16 llamadas, 15234 triángulos, 65.00 % de encuadre inicial.
- 1600×900 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 47 palabras, 16 llamadas, 15234 triángulos, 65.00 % de encuadre inicial.
- 2020×1055 DPR 1.25: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 47 palabras, 16 llamadas, 15234 triángulos, 65.00 % de encuadre inicial.

Global: TypeScript y ESLint pasaron. Jest completo: 50 suites / 4289 pruebas, correctas. Después del manifiesto de voz se comprobaron 2 suites y 34 pruebas de voz/briefing, correctas. Física: 5.388 comprobaciones correctas; regresión de modelos 241–250: 14.738 correctas.

Voz: 150 clips para el bloque, 49 textos distintos, generados con Qwen3-TTS y molde aprobado; duración, SHA256 y copia a sus claves verificados en voz.json. Se preservaron los 7.555 MP3 anteriores: 7.705 en el árbol local. El manifiesto amplía 166→176 prácticas con voz, sin eliminar las anteriores.

Portada propia revisada: public/images/mecanica/prac_253.webp. Autocrítica: La columna esbelta y la deformada lateral contrastan con el bastidor; el reto queda en el lateral. El trazo inicial es sutil por tratarse de carga subcrítica, no se representa colapso plástico.

Evidencia portable: [autocrítica del bloque](evidencia-solidos/autocritica.json), [portadas](evidencia-solidos/contacto-portadas.jpg) y [estados](evidencia-solidos/contacto-estados.jpg). Cierre estricto comprueba-cierre-solidos.mjs correcto: 40 recorridos, 150 clips con hashes actuales, código y revisión visual.

Retomar: solicitar la primera autorización de push/despliegue con este bloque revisado. No confundir aprobación local con publicación. Continuar construyendo 261–270 (Elementos de Máquina), después 291–300, 271–280 y 281–290. El total encargado es de 50 laboratorios.
<!-- /estado-solidos -->

## Historial de implementación y verificaciones anteriores
Estado: implementación local en curso. Sin commit, push ni publicación.

## Originalidad
Nuevo criterio de estabilidad estructural, no estabilidad de control.

## Modelo y límites
Columna circular biarticulada L=1,5 m, K=1, E=210 GPa. A=πd²/4; I=πd⁴/64; λ=KL/√(I/A)=4L/d; Pcr=π²EI/(KL)². Imperfección sinusoidal e0=1 mm: e=e0/(1−P/Pcr), exclusivamente para P<Pcr.

Euler elástico ideal, sin excentricidad adicional, residual ni plasticidad. Si P≥Pcr se muestra inestabilidad sin inventar una deformada poscrítica. Exageración lateral ×8; diámetro visual ×3. Aproximación de amplificación de imperfección, no solución no lineal completa.

## Archivos
`public/labs/_solidos-*.js`, `columna-pandeo-euler.html`, `_ficha-columna-pandeo-euler.js`, `scripts/lab-src/columna-pandeo-euler.json`, `src/labs/mecanica-253/`.

## Verificación y punto para retomar
Pendientes: pruebas numéricas independientes, recorrido real en cuatro tamaños, crítica visual, portada, voz, TypeScript, ESLint, Jest completo y publicación autorizada. No contar este laboratorio como terminado.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 20e8e43db13e4987b6113e3460404520c4892e8376369161a0082cb8d230fcd5; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 20e8e43db13e4987b6113e3460404520c4892e8376369161a0082cb8d230fcd5; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 20e8e43db13e4987b6113e3460404520c4892e8376369161a0082cb8d230fcd5; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 55b421fa1049a716a31d070ab9243ef4d51d6201db291236866b160d628066a9; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.
