# mecanica-251 · Viga en flexión: cortante, momento y flecha

<!-- publicacion-solidos -->
## Publicación confirmada · 1 de noviembre de2026

Código **0b9ddf8**, push a main y despliegue autorizados por el usuario. Cloudflare **8028185d-32c1-494e-aad7-d5446876346a**, [CENLABS](https://www.cenlaboratorios.com.mx/alumno/simulador/mecanica-251). Compilación y despliegue correctos; audios anteriores preservados.

Prueba de producción con login real: ficha, portada HTTP200, iframe exacto, reto y quiz correctos; cero errores de consola. Intento guardado y leído de vuelta: **86/100**; escritura HTTP201, lectura HTTP200. La nota corresponde a una prueba breve con el tiempo real de la rúbrica, no a una sesión artificial de8 minutos. Regresión de ciencias:50 accesos y4 notas10/10 guardadas/leídas correctamente.

[Evidencia de producción](evidencia-solidos/produccion.json). Implementación/publicación del bloqueA cerradas. Siguiente trabajo: bloqueB261–270; no mezclar sus borradores locales con este código publicado.
<!-- /publicacion-solidos -->


<!-- estado-solidos -->
## Revisión vigente · 31-10-2026

Implementación y revisión local cerradas; la publicación confirmada se documenta arriba. Commit del lote0b9ddf8.

Orden: OT-251 · Soporta al menos 2800 N, con flecha ≤3 mm, esfuerzo ≤120 MPa y masa ≤50 kg.

Modelo vigente: Viga biapoyada L=2 m, ancho b=50 mm, E=210 GPa, densidad 7850 kg/m³. I=bh³/12; RA=RB=P/2; V=±P/2; M=P min(x,L−x)/2. v=P u(3L²−4u²)/(48EI), u=min(x,L−x); vmax=PL³/(48EI); σmax=PLh/(8I).

Límites: Euler–Bernoulli elástico de pequeña flecha, sin peso propio, cortante, plasticidad ni pandeo lateral. Flecha visual ×12; geometría transversal ×3 respecto de la longitud. Carga estática modulada de 50 a 100 % en una demostración de 8 s, no vibración.

Fuente: MIT · Mechanics of Materials · David Roylance · https://web.mit.edu/course/3/3.11/www/module_list.html

Evidencia funcional de la revisión actual: **4/4 tamaños**. Firma del producto y auditor: 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86.

- 390×844 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 51 palabras, 12 llamadas, 14290 triángulos, 65.00 % de encuadre inicial.
- 1366×768 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 51 palabras, 12 llamadas, 14290 triángulos, 65.00 % de encuadre inicial.
- 1600×900 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 51 palabras, 12 llamadas, 14290 triángulos, 65.00 % de encuadre inicial.
- 2020×1055 DPR 1.25: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 51 palabras, 12 llamadas, 14290 triángulos, 65.00 % de encuadre inicial.

Global: TypeScript y ESLint pasaron. Jest completo: 50 suites / 4289 pruebas, correctas. Después del manifiesto de voz se comprobaron 2 suites y 34 pruebas de voz/briefing, correctas. Física: 5.388 comprobaciones correctas; regresión de modelos 241–250: 14.738 correctas.

Voz: 150 clips para el bloque, 49 textos distintos, generados con Qwen3-TTS y molde aprobado; duración, SHA256 y copia a sus claves verificados en voz.json. Se preservaron los 7.555 MP3 anteriores: 7.705 en el árbol local. El manifiesto amplía 166→176 prácticas con voz, sin eliminar las anteriores.

Portada propia revisada: public/images/mecanica/prac_251.webp. Autocrítica: El pórtico, apoyos y penetrador explican la carga central; la viga deformada se distingue del banco. Calidad media nítida. La flecha ampliada se declara; el ensayo no es una máquina comercial.

Evidencia portable: [autocrítica del bloque](evidencia-solidos/autocritica.json), [portadas](evidencia-solidos/contacto-portadas.jpg) y [estados](evidencia-solidos/contacto-estados.jpg). Cierre estricto comprueba-cierre-solidos.mjs correcto: 40 recorridos, 150 clips con hashes actuales, código y revisión visual.

Retomar: solicitar la primera autorización de push/despliegue con este bloque revisado. No confundir aprobación local con publicación. Continuar construyendo 261–270 (Elementos de Máquina), después 291–300, 271–280 y 281–290. El total encargado es de 50 laboratorios.
<!-- /estado-solidos -->

## Historial de implementación y verificaciones anteriores
Estado: implementación local en curso. Sin commit, push ni publicación.

## Originalidad
Diferente del 201: flexión estática y esfuerzos internos, no identificación modal.

## Modelo y límites
Viga biapoyada L=2 m, ancho b=50 mm, E=210 GPa, densidad 7850 kg/m³. I=bh³/12; RA=RB=P/2; V=±P/2; M=P min(x,L−x)/2. v=P u(3L²−4u²)/(48EI), u=min(x,L−x); vmax=PL³/(48EI); σmax=PLh/(8I).

Euler–Bernoulli elástico de pequeña flecha, sin peso propio, cortante, plasticidad ni pandeo lateral. Flecha visual ×12; geometría transversal ×3 respecto de la longitud. Carga estática modulada de 50 a 100 % en una demostración de 8 s, no vibración.

## Archivos
`public/labs/_solidos-*.js`, `viga-flexion-estatica.html`, `_ficha-viga-flexion-estatica.js`, `scripts/lab-src/viga-flexion-estatica.json`, `src/labs/mecanica-251/`.

## Verificación y punto para retomar
Pendientes: pruebas numéricas independientes, recorrido real en cuatro tamaños, crítica visual, portada, voz, TypeScript, ESLint, Jest completo y publicación autorizada. No contar este laboratorio como terminado.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

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
