# mecanica-235 · Motor neumático de paletas: par y consumo

Estado al28-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Competencia y orden
Las paletas se extienden sobre una cámara excéntrica y convierten aire comprimido en giro.

OT-235 · Trabaja a900–1800 rpm con potencia ≥80 W, consumo ≤220 L/min y rendimiento respecto al máximo isotérmico ≥18 %.

Equipo e instrumentos: Motor de paletas abierto, freno de carga y analizador de consumo.

## Modelo y alcance
Desplazamiento nominal20 cm³/vuelta, eficiencia de par0,7. Tm=0,7ΔpVd/(2π). Fricción viscosa b=0,002 N·m·s/rad: ω=max(0,(Tm−Tcarga)/b). Qin=Vdω/(2π)+10⁻¹⁰Δp; caudal referido a entrada. Aire libre=Qin(pentrada/101325). Potencia útil=Tcargaω; referencia isotérmica=pentradaQin ln(pentrada/101325). Paleta: r=−e cosθ+√(R²−e²sin²θ).

Curva sintética estacionaria, sin expansión transitoria, compresibilidad de cada cámara o lubricación. Desplazamiento nominal prescrito; dibujo de paletas ilustrativo. Eficiencia respecto a trabajo isotérmico máximo, no dato de catálogo. Giro×1/120. No acciona una herramienta neumática real.

Escalas: Giro×1/120 · curvas sintéticas · caudal a aire libre

Fuente del principio: https://www.atlascopco.com/en-us/itba/industry-solutions/airmotors/technicalguide/design-working-principle . Constantes del escenario y geometrías propias sintéticas; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/motor-neumatico-paletas.html y _ficha-motor-neumatico-paletas.js.
- Escena: public/labs/_maq-235.js; utilidades _maquinas-piezas.js, que reutilizan _proceso-piezas.js y piezas anteriores.
- _maquinas-modelos.js: funciones puras; _maquinas-definiciones.js: contrato; _maquinas-instrumentos.js: gráficas DOM; _maquinas-runtime.js: orden, ensayo e informe; _maquinas-escenas.js: dispatcher.
- src/labs/mecanica-235/, briefing JSON, portada prac_235.webp y descriptor scripts/lab-src/motor-neumatico-paletas.json.
- Construir entrada: node scripts/build-lab.mjs motor-neumatico-paletas. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-maquinas-231-240.mjs --solo 235.
- UI: node scripts/auditoria/flujo-maquinas-231-240.mjs --solo 235 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-maquinas.mjs; admite --solo 235. Revelado de curvas: protecciones-maquinas.mjs. Portada: scripts/portadas/capturar-maquinas.mjs --solo 235.

## Verificación
2124 comprobaciones numéricas en este banco;9513 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 39 palabras iniciales; 14 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 39 palabras iniciales; 14 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 39 palabras iniciales; 14 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 39 palabras iniciales; 17 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.

Revisión final a1366×768: 17 llamadas, 13850 triángulos y encuadre 65.0 %. Se revisaron de nuevo los detalles visuales añadidos después del primer recorrido.

Diez comparaciones de sincronía de transformaciones, geometrías y matrices/colores de instancias, diez comprobaciones geométricas específicas y veinte comprobaciones del dibujante de instrumentos para ocultar barridos teóricos antes de validar. Antes de validar se muestran lecturas del ajuste ensayado; las curvas de diseño aparecen tras la aceptación. Portada propia y barrido sin CDN sanos.44 suites,3426 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin alterar entradas anteriores.

## Autocrítica visual y originalidad
Cámara excéntrica abierta con rotor ranurado, ocho paletas, conductos, eje y freno de ensayo. Cada extremo de paleta permanece sobre el círculo de la cámara. Los balances estacionarios son sintéticos y Vd nominal no se deduce del dibujo. Tema distinto del105: actuador neumático de paletas y consumo referido a aire libre, no transmisión hidrostática.
Como máximo50 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación de estudio. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:230.
