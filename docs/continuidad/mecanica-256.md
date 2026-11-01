# mecanica-256 · Concentración de esfuerzos: agujero y filete

<!-- publicacion-solidos -->
## Publicación confirmada · 1 de noviembre de2026

Código **0b9ddf8**, push a main y despliegue autorizados por el usuario. Cloudflare **8028185d-32c1-494e-aad7-d5446876346a**, [CENLABS](https://www.cenlaboratorios.com.mx/alumno/simulador/mecanica-256). Compilación y despliegue correctos; audios anteriores preservados.

Prueba de producción con login real: ficha, portada HTTP200, iframe exacto, reto y quiz correctos; cero errores de consola. Intento guardado y leído de vuelta: **86/100**; escritura HTTP201, lectura HTTP200. La nota corresponde a una prueba breve con el tiempo real de la rúbrica, no a una sesión artificial de8 minutos. Regresión de ciencias:50 accesos y4 notas10/10 guardadas/leídas correctamente.

[Evidencia de producción](evidencia-solidos/produccion.json). Implementación/publicación del bloqueA cerradas. Siguiente trabajo: bloqueB261–270; no mezclar sus borradores locales con este código publicado.
<!-- /publicacion-solidos -->


<!-- estado-solidos -->
## Revisión vigente · 31-10-2026

Implementación y revisión local cerradas; la publicación confirmada se documenta arriba. Commit del lote0b9ddf8.

Orden: OT-256 · Mantén ambos picos ≤110 MPa, radio ≥3 mm y ancho ≤115 mm.

Modelo vigente: Agujero: placa t=6 mm, F=20 kN, d=2r, η=d/W; Kt=3−3,14η+3,667η²−1,527η³; σnom=F/[(W−d)t]. Filete de hombro doble: D=W, d=D−20 mm, h=10 mm, r variable; Kt=C1+C2z+C3z²+C4z³, z=2h/D. Coeficientes por h/r de Roark, tabla 6-1 III-1a, tracción axial; σnom=F/(6d). Longitud remota L=800 mm, L/D supera el límite de la tabla.

Límites: Factores elásticos tabulados; no FEM ni campo de esfuerzos calculado, plasticidad o fatiga. Se resaltan sólo las posiciones de pico. El 3D muestra el detalle central y acorta las regiones remotas del filete; no es un plano a escala longitudinal ni un modelo de contacto de mordazas. Espesor visual ampliado.

Fuente: Roark · capítulo 6 · tabla 6-1, II-2a y III-1a · https://s1b0d3d77136c1679.jimcontent.com/download/version/1531108625/module/14143373530/name/Roark-Ch06.pdf

Evidencia funcional de la revisión actual: **4/4 tamaños**. Firma del producto y auditor: 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86.

- 2020×1055 DPR 1.25: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 51 palabras, 13 llamadas, 15850 triángulos, 65.00 % de encuadre inicial.
- 390×844 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 51 palabras, 13 llamadas, 15850 triángulos, 65.00 % de encuadre inicial.
- 1366×768 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 51 palabras, 13 llamadas, 15850 triángulos, 65.00 % de encuadre inicial.
- 1600×900 DPR 1: orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; 51 palabras, 13 llamadas, 15850 triángulos, 65.00 % de encuadre inicial.

Global: TypeScript y ESLint pasaron. Jest completo: 50 suites / 4289 pruebas, correctas. Después del manifiesto de voz se comprobaron 2 suites y 34 pruebas de voz/briefing, correctas. Física: 5.388 comprobaciones correctas; regresión de modelos 241–250: 14.738 correctas.

Voz: 150 clips para el bloque, 49 textos distintos, generados con Qwen3-TTS y molde aprobado; duración, SHA256 y copia a sus claves verificados en voz.json. Se preservaron los 7.555 MP3 anteriores: 7.705 en el árbol local. El manifiesto amplía 166→176 prácticas con voz, sin eliminar las anteriores.

Portada propia revisada: public/images/mecanica/prac_256.webp. Autocrítica: Agujero y hombro con filete permiten comparar dos concentradores en el mismo banco; los cambios de radio se ven en la pieza. El mapa es ilustrativo y los picos proceden de relaciones analíticas, no de un FEM.

Evidencia portable: [autocrítica del bloque](evidencia-solidos/autocritica.json), [portadas](evidencia-solidos/contacto-portadas.jpg) y [estados](evidencia-solidos/contacto-estados.jpg). Cierre estricto comprueba-cierre-solidos.mjs correcto: 40 recorridos, 150 clips con hashes actuales, código y revisión visual.

Retomar: solicitar la primera autorización de push/despliegue con este bloque revisado. No confundir aprobación local con publicación. Continuar construyendo 261–270 (Elementos de Máquina), después 291–300, 271–280 y 281–290. El total encargado es de 50 laboratorios.
<!-- /estado-solidos -->

## Historial de implementación y verificaciones anteriores
Estado: implementación local en curso. Sin commit, push ni publicación.

## Originalidad
Amplía el tema aprobado de filetes mediante analogía de raíz explícita; falta correlación de hombro si se exige filete real.

## Modelo y límites
Placa t=6 mm, F=20 kN. Agujero d=2r: η=d/W; Kt=3−3,14η+3,667η²−1,527η³ referido a sección neta; σnom=F/[(W−d)t]. Comparación Inglis para elipse pequeña con a=4 mm y radio raíz ρ=r: Kt=1+2√(a/ρ); σremota=F/(Wt).

Correlación de placa con agujero y solución ideal de elipse infinita son modelos diferentes. El segundo es una analogía de redondeo de raíz, no una tabla de filetes de hombro. No FEM, plasticidad, tensiones residuales ni campo completo calculado. Resaltado sólo del pico; geometría de espesor ampliada.

## Archivos
`public/labs/_solidos-*.js`, `concentracion-agujero-entalla.html`, `_ficha-concentracion-agujero-entalla.js`, `scripts/lab-src/concentracion-agujero-entalla.json`, `src/labs/mecanica-256/`.

## Verificación y punto para retomar
Pendientes: pruebas numéricas independientes, recorrido real en cuatro tamaños, crítica visual, portada, voz, TypeScript, ESLint, Jest completo y publicación autorizada. No contar este laboratorio como terminado.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

Corrección del alcance: se sustituyó la analogía de elipse por un filete de hombro real y el factor de Roark III-1a, con coeficientes por h/r y límites declarados. Agujero: placa t=6 mm, F=20 kN, d=2r, η=d/W; Kt=3−3,14η+3,667η²−1,527η³; σnom=F/[(W−d)t]. Filete de hombro doble: D=W, d=D−20 mm, h=10 mm, r variable; Kt=C1+C2z+C3z²+C4z³, z=2h/D. Coeficientes por h/r de Roark, tabla 6-1 III-1a, tracción axial; σnom=F/(6d). Longitud remota L=800 mm, L/D supera el límite de la tabla.
Factores elásticos tabulados; no FEM ni campo de esfuerzos calculado, plasticidad o fatiga. Se resaltan sólo las posiciones de pico. El 3D muestra el detalle central y acorta las regiones remotas del filete; no es un plano a escala longitudinal ni un modelo de contacto de mordazas. Espesor visual ampliado.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 20e8e43db13e4987b6113e3460404520c4892e8376369161a0082cb8d230fcd5; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 20e8e43db13e4987b6113e3460404520c4892e8376369161a0082cb8d230fcd5; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 20e8e43db13e4987b6113e3460404520c4892e8376369161a0082cb8d230fcd5; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86; normales cero=0, sin errores ni desbordamiento.
