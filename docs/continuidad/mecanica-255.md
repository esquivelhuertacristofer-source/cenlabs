# mecanica-255 · Fatiga de un eje: curva S–N y Goodman

<!-- estado-solidos -->
## Revisión vigente · 31-10-2026

**Implementación y revisión local completas. Sin push ni publicación.** Commit del lote: consultar el historial de Git de esta ficha. Publicación pendiente de la primera autorización exigida por el usuario.

Orden: OT-255 · Consigue reserva Goodman entre 1,5 y 2,2, diámetro ≤28 mm y tensión media ≥50 MPa.

Modelo vigente: Flexión rotativa biapoyada L=1 m y carga central P=560 N: Mmax=PL/4=140 N·m; M(x)=P min(x,L−x)/2. Se evalúa fatiga en la sección central: σa=32Mmax/(πd³). Se=180 MPa, Sut=600 MPa; σeq=σa/(1−σm/Sut), U=σa/Se+σm/Sut; n=1/U. Basquin entre 10³ ciclos a 480 MPa y 10⁶ a 180 MPa. Por debajo de Se se muestra 10⁶ como referencia, no vida exacta.

Límites: Material y curva sintéticos sin datos de fabricante, entallas, acabado, efecto de tamaño, dispersión, corrosión ni daño acumulado. No se dibuja la pequeña flecha de flexión. Giro demostrativo 0,25 Hz, sin velocidad de servicio ni propagación de grieta; no se garantiza vida infinita. Colores de fibras: σm+32M(x)cos(φ)/(πd³), sin FEM. El esfuerzo medio axial se prescribe, no se simula el equipo que lo genera. Diámetro visual ampliado ×3; casquillos intercambiables ilustrativos, sin selección real de rodamiento.

Fuente: MIT · Mechanics of Materials · David Roylance · https://web.mit.edu/course/3/3.11/www/module_list.html

Evidencia funcional de la revisión actual: **4/4 tamaños**. Firma del producto y auditor: 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86.

- 390×844 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 49 palabras, 33 llamadas, 26314 triángulos, 65.00 % de encuadre inicial.
- 1366×768 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 49 palabras, 33 llamadas, 26314 triángulos, 65.00 % de encuadre inicial.
- 1600×900 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 49 palabras, 33 llamadas, 26314 triángulos, 65.00 % de encuadre inicial.
- 2020×1055 DPR 1.25: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 49 palabras, 33 llamadas, 26314 triángulos, 65.00 % de encuadre inicial.

Global: TypeScript y ESLint pasaron. Jest completo: 50 suites / 4289 pruebas, correctas. Después del manifiesto de voz se comprobaron 2 suites y 34 pruebas de voz/briefing, correctas. Física: 5.388 comprobaciones correctas; regresión de modelos 241–250: 14.738 correctas.

Voz: 150 clips para el bloque, 49 textos distintos, generados con Qwen3-TTS y molde aprobado; duración, SHA256 y copia a sus claves verificados en voz.json. Se preservaron los 7.555 MP3 anteriores: 7.705 en el árbol local. El manifiesto amplía 166→176 prácticas con voz, sin eliminar las anteriores.

Portada propia revisada: public/images/mecanica/prac_255.webp. Autocrítica: Motor, casquillos, eje y carga central forman un banco reconocible; la inspección acerca el eje. Material metálico continuo, sin ruido. La vida sintética se declara; no se dibujan grietas falsas.

Evidencia portable: [autocrítica del bloque](evidencia-solidos/autocritica.json), [portadas](evidencia-solidos/contacto-portadas.jpg) y [estados](evidencia-solidos/contacto-estados.jpg). Cierre estricto comprueba-cierre-solidos.mjs correcto: 40 recorridos, 150 clips con hashes actuales, código y revisión visual.

Retomar: solicitar la primera autorización de push/despliegue con este bloque revisado. No confundir aprobación local con publicación. Continuar construyendo 261–270 (Elementos de Máquina), después 291–300, 271–280 y 281–290. El total encargado es de 50 laboratorios.
<!-- /estado-solidos -->

## Historial de implementación y verificaciones anteriores
Estado: implementación local en curso. Sin commit, push ni publicación.

## Originalidad
Dimensionamiento por fatiga, distinto de rodamientos por FFT del 181.

## Modelo y límites
Flexión rotativa M=70 N·m: σa=32M/(πd³). Se=180 MPa, Sut=600 MPa, σeq=σa/(1−σm/Sut). Goodman: U=σa/Se+σm/Sut; n=1/U. Basquin entre 10³ ciclos a 480 MPa y 10⁶ a 180 MPa; por debajo de Se se muestra 10⁶ como referencia, no vida exacta.

Material y curva sintéticos sin datos de fabricante, entallas, acabado, tamaño, dispersión, corrosión ni daño acumulado. Rotación demostrativa 0,25 Hz no ligada a una velocidad de servicio; no se simula una grieta ni se garantiza vida infinita.

## Archivos
`public/labs/_solidos-*.js`, `fatiga-goodman-eje.html`, `_ficha-fatiga-goodman-eje.js`, `scripts/lab-src/fatiga-goodman-eje.json`, `src/labs/mecanica-255/`.

## Verificación y punto para retomar
Pendientes: pruebas numéricas independientes, recorrido real en cuatro tamaños, crítica visual, portada, voz, TypeScript, ESLint, Jest completo y publicación autorizada. No contar este laboratorio como terminado.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 20e8e43db13e4987b6113e3460404520c4892e8376369161a0082cb8d230fcd5; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 20e8e43db13e4987b6113e3460404520c4892e8376369161a0082cb8d230fcd5; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 20e8e43db13e4987b6113e3460404520c4892e8376369161a0082cb8d230fcd5; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 41a56976bb60704e45c517b91d769640edeff9c279cf26d949612b7b696fdf1b; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.
