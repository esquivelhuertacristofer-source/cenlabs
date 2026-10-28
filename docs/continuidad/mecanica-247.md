# mecanica-247 · Hidroformado de tubo: presión y alimentación axial

Estado al28-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Orden y competencia profesional
OT-247 · Llena la matriz hasta radio ≥25,8 mm con adelgazamiento ≤18 %, presión ≤16 MPa y cierre ≤160 kN.

Equipo e instrumentos: Celda de hidroformado seccionada con punzones axiales y espesor medido.

Un tubo se expande dentro de una matriz seccionada mientras dos punzones alimentan material desde los extremos. La alimentación axial ayuda a conservar espesor durante la expansión radial.

## Modelo y límites
Pared delgada uniforme: r0=20 mm,t0=1 mm,L0=200 mm. L=L0−2f, 2πrtL=constante. Deformación ε=ln(r/r0), tensión circunferencial=180 MPa+1000 MPa·ε. Equilibrio p=σθt/r en la rama creciente, radio limitado por matriz26 mm. Fuerza de cierre=p·2rL; empuje por extremo=pπr². Rampa3 s, sostén2 s y descarga2 s; expansión plástica conservada durante descarga.

Modelo de membrana uniforme con endurecimiento sintético y espesor de pared delgada, no FEM, criterio de rotura, abultamiento localizado, fricción o arrugado. Alimentación axial prescrita. El volumen conservado es el volumen de membrana2πrtL, no el volumen exacto de una pared de espesor finito. Matriz abierta sólo para observar; ensayo real requiere cierre.

Escalas: Membrana uniforme · rampa3 s · descarga sin recuperación

Principio consultado: https://www.schulergroup.com/technologien/produkte/grundlagen_innenhochdruckumformung_verfahren_rohre/index.html?sLang=en . Geometría y constantes de escenario propias, no datos comerciales.

## Archivos y receta para retomar
- public/labs/hidroformado-tubo-espesor.html, _ficha-hidroformado-tubo-espesor.js y escena _ind-247.js.
- _industria-modelos.js: funciones puras; _industria-definiciones.js: contrato; _industria-runtime.js: orden, ensayo e informe; _industria-instrumentos.js: lecturas y curvas DOM; _industria-escenas.js y _industria-piezas.js. Se reutilizan utilidades geométricas anteriores.
- src/labs/mecanica-247/, briefing JSON, portada prac_247.webp y descriptor scripts/lab-src/hidroformado-tubo-espesor.json.
- Build: node scripts/build-lab.mjs hidroformado-tubo-espesor.
- Física: node scripts/auditoria/verifica-industria-241-250.mjs --solo 247.
- Flujo: node scripts/auditoria/flujo-industria-241-250.mjs --solo 247 --inspeccion. --reanudar conserva informe.json; QA_REPORT cambia salida.
- Sincronía y geometría: sincronia-industria.mjs; admite --solo 247. Revelado: protecciones-industria.mjs. Portada: scripts/portadas/capturar-industria.mjs --solo 247.
- Evidencia: scripts/auditoria/.salida/industria-241-250/. No ejecutar los generadores históricos de work/ sobre escenas refinadas.

## Pruebas
1192 comprobaciones numéricas;14738 en la tanda. Valores iniciales rechazados y solución interior sobre la rejilla de controles aceptada. Ensayo completo obligatorio, validación manual, quiz barajado, tres diagnósticos, instrumento, descarga de informe y caducidad del registro al modificar/restaurar un control.
- 1366×768, DPR1: 45 palabras iniciales; 19 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 1600×900, DPR1: 45 palabras iniciales; 19 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 2020×1055, DPR1.25: 45 palabras iniciales; 19 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 390×844, DPR1: 45 palabras iniciales; 19 llamadas; encuadre65.0 %; sin errores ni desbordamiento.

Revisión final1366: 13 llamadas y13250 triángulos, 45 palabras. Diez comparaciones de sincronía de pose/geometría/instancias y diez pruebas geométricas específicas. Altura real de mallas visibles comprobada en244/249;20 protecciones de curvas. Diez portadas propias y10/10 sin CDN.44 suites,3496 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; entradas anteriores sin cambios semánticos.

## Autocrítica y originalidad
Matriz seccionada, bastidor, punzones axiales y tubo hueco con pared interna real. Sus radios interior y exterior y longitud se recalculan desde el espesor de membrana. Se comprueban volumen de la malla y espesor; la bancada de inspección referencia la geometría fusionada vigente. La forma es uniforme, no un abultamiento FEM. Distinto de prensa93 y plegado240: conservación de material en expansión de tubo con alimentación axial.

La prosa inicial queda en47 palabras como máximo. Los instrumentos están en DOM y los contratos cerrados; la escena muestra el fenómeno desde la entrada. Se corrigieron ocultaciones y apoyos antes del cierre. No se afirma eficacia educativa medida sin evaluación con docentes y estudiantes.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:240.
