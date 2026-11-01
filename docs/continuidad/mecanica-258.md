# mecanica-258 · Recipiente a presión: aro y espesor mínimo

<!-- publicacion-solidos -->
## Publicación confirmada · 1 de noviembre de2026

Código **0b9ddf8**, push a main y despliegue autorizados por el usuario. Cloudflare **8028185d-32c1-494e-aad7-d5446876346a**, [CENLABS](https://www.cenlaboratorios.com.mx/alumno/simulador/mecanica-258). Compilación y despliegue correctos; audios anteriores preservados.

Prueba de producción con login real: ficha, portada HTTP200, iframe exacto, reto y quiz correctos; cero errores de consola. Intento guardado y leído de vuelta: **86/100**; escritura HTTP201, lectura HTTP200. La nota corresponde a una prueba breve con el tiempo real de la rúbrica, no a una sesión artificial de8 minutos. Regresión de ciencias:50 accesos y4 notas10/10 guardadas/leídas correctamente.

[Evidencia de producción](evidencia-solidos/produccion.json). Implementación/publicación del bloqueA cerradas. Siguiente trabajo: bloqueB261–270; no mezclar sus borradores locales con este código publicado.
<!-- /publicacion-solidos -->


<!-- estado-solidos -->
## Revisión vigente · 31-10-2026

Implementación y revisión local cerradas; la publicación confirmada se documenta arriba. Commit del lote0b9ddf8.

Orden: OT-258 · Trabaja a ≥1,8 MPa con aro entre 80 y 110 MPa, espesor ≤9 mm y r/t ≥20.

Modelo vigente: Cilindro cerrado r=0,2 m. σθ=pr/t; σz=pr/(2t); σVM=√(σθ²+σz²−σθσz); tmin=pr/σadm con σadm=120 MPa. εr=(σθ−νσz)/E; E=210 GPa, ν=0,3.

Límites: Pared delgada, presión uniforme, sin soldaduras, tapas calculadas, corrosión, fatiga, temperatura ni código de recipientes. Corte de carcasa para ver espesor, ampliado ×4; expansión radial ×30. Es una comparación de esfuerzos, no diseño certificable.

Fuente: MIT · Mechanics of Materials · David Roylance · https://web.mit.edu/course/3/3.11/www/module_list.html

Evidencia funcional de la revisión actual: **4/4 tamaños**. Firma del producto y auditor: 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86.

- 2020×1055 DPR 1.25: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 49 palabras, 33 llamadas, 14166 triángulos, 65.00 % de encuadre inicial.
- 390×844 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 49 palabras, 33 llamadas, 14166 triángulos, 65.00 % de encuadre inicial.
- 1366×768 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 49 palabras, 33 llamadas, 14166 triángulos, 65.00 % de encuadre inicial.
- 1600×900 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 49 palabras, 33 llamadas, 14166 triángulos, 65.00 % de encuadre inicial.

Global: TypeScript y ESLint pasaron. Jest completo: 50 suites / 4289 pruebas, correctas. Después del manifiesto de voz se comprobaron 2 suites y 34 pruebas de voz/briefing, correctas. Física: 5.388 comprobaciones correctas; regresión de modelos 241–250: 14.738 correctas.

Voz: 150 clips para el bloque, 49 textos distintos, generados con Qwen3-TTS y molde aprobado; duración, SHA256 y copia a sus claves verificados en voz.json. Se preservaron los 7.555 MP3 anteriores: 7.705 en el árbol local. El manifiesto amplía 166→176 prácticas con voz, sin eliminar las anteriores.

Portada propia revisada: public/images/mecanica/prac_258.webp. Autocrítica: El acero refleja luz de estudio; la vista de inspección abre el recipiente y permite ver pared y tapas. El objeto llena la escena sin cifras flotantes. La expansión ampliada no pretende reproducir una deformación visible a escala real.

Evidencia portable: [autocrítica del bloque](evidencia-solidos/autocritica.json), [portadas](evidencia-solidos/contacto-portadas.jpg) y [estados](evidencia-solidos/contacto-estados.jpg). Cierre estricto comprueba-cierre-solidos.mjs correcto: 40 recorridos, 150 clips con hashes actuales, código y revisión visual.

Retomar: solicitar la primera autorización de push/despliegue con este bloque revisado. No confundir aprobación local con publicación. Continuar construyendo 261–270 (Elementos de Máquina), después 291–300, 271–280 y 281–290. El total encargado es de 50 laboratorios.
<!-- /estado-solidos -->

## Historial de implementación y verificaciones anteriores
Estado: implementación local en curso. Sin commit, push ni publicación.

## Originalidad
Equilibrio de esfuerzos de recipiente, distinto de llenado térmico de hidrógeno.

## Modelo y límites
Cilindro cerrado r=0,2 m. σθ=pr/t; σz=pr/(2t); σVM=√(σθ²+σz²−σθσz); tmin=pr/σadm con σadm=120 MPa. εr=(σθ−νσz)/E; E=210 GPa, ν=0,3.

Pared delgada, presión uniforme, sin soldaduras, tapas calculadas, corrosión, fatiga, temperatura ni código de recipientes. Corte de carcasa para ver espesor, ampliado ×4; expansión radial ×30. Es una comparación de esfuerzos, no diseño certificable.

## Archivos
`public/labs/_solidos-*.js`, `recipiente-aro-espesor.html`, `_ficha-recipiente-aro-espesor.js`, `scripts/lab-src/recipiente-aro-espesor.json`, `src/labs/mecanica-258/`.

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
