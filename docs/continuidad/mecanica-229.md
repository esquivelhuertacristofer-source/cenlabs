# mecanica-229 · Bobinado de banda: tensión y rodillo bailarín

Estado al26-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Competencia y orden
Observa dos bobinas cambiar de diámetro mientras un rodillo con peso fija la geometría de la banda.

OT-229 · Produce ≥0,5 m/s con tensión ≥12 N, esfuerzo ≤3,5 MPa, par ≤2,5 N·m, potencia ≤30 W y descenso del bailarín 50–180 mm.

Equipo e instrumentos: Dos bobinas, banda continua, bailarín por gravedad y balance de par.

## Modelo y alcance
Núcleo R0=40 mm, radio final100 mm, espesor0,1 mm, ancho60 mm, densidad1200 kg/m³. R²=R0²+hvτ/π; ω=v/R. J=Jnúcleo+mbanda(R²+R0²)/2. Par=FR+Jω̇+0,08 N·m; entrada de momento del material cancela J̇ω. Bailarín de peso20 N: d=0,15·20/√(4F²−400) m. Eficiencia0,85. Se evalúa el máximo del ciclo.

Banda inextensible y equilibrio estático del bailarín, sin control PID ni transitorios elásticos. F≤10 N no puede equilibrar el peso. Volumen conservado entre bobinas. La banda se dibuja como superficie; rodillos de radio ampliado y tangencias esquemáticas. bobinado acelerado ×40. No dimensiona una línea comercial.

Escalas: Bobinado ×40 · banda inextensible · equilibrio estático

Fuente del principio: https://www.maxcessintl.com/wp-content/uploads/2025/04/Maxcess-TensionSolutionsBrochure-2025Jan.pdf . Constantes del escenario y geometrías sintéticas propias; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/bobinado-tension-bailarin.html y _ficha-bobinado-tension-bailarin.js.
- Escena: public/labs/_proc-229.js; utilidades _proceso-piezas.js, que reutiliza las piezas geométricas de _fabricacion-piezas.js.
- _proceso-modelos.js: funciones puras; _proceso-definiciones.js: contrato; _proceso-instrumentos.js: gráficas DOM; _proceso-runtime.js: orden, ensayo e informe; _proceso-escenas.js: dispatcher.
- src/labs/mecanica-229/, briefing JSON, portada prac_229.webp y descriptor scripts/lab-src/bobinado-tension-bailarin.json.
- Construir entrada: node scripts/build-lab.mjs bobinado-tension-bailarin. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-proceso-221-230.mjs --solo 229.
- UI: node scripts/auditoria/flujo-proceso-221-230.mjs --solo 229 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-proceso.mjs. Calibraciones: calibraciones-proceso.mjs. Portadas: scripts/portadas/capturar-proceso.mjs --solo 229.

## Verificación
1258 comprobaciones numéricas en este banco;40634 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo real por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 51 palabras iniciales; 36 llamadas; encuadre 63.7 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 51 palabras iniciales; 36 llamadas; encuadre 64.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 51 palabras iniciales; 36 llamadas; encuadre 63.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 51 palabras iniciales; 36 llamadas; encuadre 54.0 %; cero normales nulas y sin desbordamiento.

Revisión final de inicio e inspección, sincronía de transformaciones y matrices/colores de instancias, portada propia y barrido sin CDN sanos.44 suites,3356 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin cambios en entradas anteriores.

## Autocrítica visual y originalidad
Dos bobinas con capas visibles, pedestales y banda sobre un bailarín con peso. Los radios conservan volumen; el par se calcula para todo el ciclo y el bailarín responde al equilibrio de tensión. Rodillos y tangencias son esquemáticos, sin dinámica elástica. Tema nuevo: relación tensión-radio-par y bobinado de masa variable.
37–53 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación compartidos. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:220.
