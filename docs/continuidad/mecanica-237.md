# mecanica-237 · Regulador centrífugo: realimentación mecánica

Estado al28-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Competencia y orden
Dos masas giratorias levantan una corredera que corrige la entrada de energía al motor.

OT-237 · Mantén190–215 rpm finales, caída por escalón ≤12 rpm y establecimiento ≤3 s.

Equipo e instrumentos: Regulador de Watt, válvula enlazada y registro de respuesta a carga.

## Modelo y alcance
Brazos l=0,2 m, relación de giro0,4. cosθ=clamp(g/(lωg²)); corredera y=0,5−0,4cosθ. Apertura u=clamp(u0−k(y−0,22)). Motor ideal: Jω̇=2u−Tcarga−0,015ω; J=0,15 kg·m². Carga0,6→0,9 N·m a3 s. RK4, paso0,002 s; establecimiento a2 % del cambio de régimen.

Masas en equilibrio instantáneo: no incluye inercia de bolas, fricción de articulaciones, elasticidad, vapor ni hunting. Transitorio del eje sí integrado. El giro del regulador se ralentiza×1/10, pero la respuesta de velocidad se presenta en segundos físicos. Ensayos de12 s con reinicio de condiciones; no sintoniza un regulador real. La transmisión de la corredera a la válvula se representa esquemáticamente.

Escalas: Giro×1/10 · respuesta del eje en tiempo físico · bolas cuasiestáticas

Fuente del principio: https://www.mech.kuleuven.be/en/tme/thermotechnisch-instituut/basisprincipes/Watt-regulator . Constantes del escenario y geometrías propias sintéticas; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/regulador-centrifugo-watt.html y _ficha-regulador-centrifugo-watt.js.
- Escena: public/labs/_maq-237.js; utilidades _maquinas-piezas.js, que reutilizan _proceso-piezas.js y piezas anteriores.
- _maquinas-modelos.js: funciones puras; _maquinas-definiciones.js: contrato; _maquinas-instrumentos.js: gráficas DOM; _maquinas-runtime.js: orden, ensayo e informe; _maquinas-escenas.js: dispatcher.
- src/labs/mecanica-237/, briefing JSON, portada prac_237.webp y descriptor scripts/lab-src/regulador-centrifugo-watt.json.
- Construir entrada: node scripts/build-lab.mjs regulador-centrifugo-watt. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-maquinas-231-240.mjs --solo 237.
- UI: node scripts/auditoria/flujo-maquinas-231-240.mjs --solo 237 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-maquinas.mjs; admite --solo 237. Revelado de curvas: protecciones-maquinas.mjs. Portada: scripts/portadas/capturar-maquinas.mjs --solo 237.

## Verificación
377 comprobaciones numéricas en este banco;9513 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 43 palabras iniciales; 28 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 43 palabras iniciales; 28 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 43 palabras iniciales; 28 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 43 palabras iniciales; 28 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.

Revisión final a1366×768: 28 llamadas, 7334 triángulos y encuadre 65.0 %. Se revisaron de nuevo los detalles visuales añadidos después del primer recorrido.

Diez comparaciones de sincronía de transformaciones, geometrías y matrices/colores de instancias, diez comprobaciones geométricas específicas y veinte comprobaciones del dibujante de instrumentos para ocultar barridos teóricos antes de validar. Antes de validar se muestran lecturas del ajuste ensayado; las curvas de diseño aparecen tras la aceptación. Portada propia y barrido sin CDN sanos.44 suites,3426 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin alterar entradas anteriores.

## Autocrítica visual y originalidad
Regulador de Watt con dos masas, cuatro brazos, corredera, horquilla, válvula y motor con volante. Se conserva la longitud de los brazos y el ángulo de giro integra la velocidad del eje. Una envolvente invisible identificada estabiliza la cámara para el giro de las masas; se comprueba además la altura proyectada de las mallas visibles. La unión a válvula es esquemática. Se diferencia del189: realimentación mecánica cuasiestática, no servocontrol PD.
Como máximo50 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación de estudio. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

El informe añade datos adquiridos: longitudes/tensiones de cables, respuesta temporal de régimen o longitudes de tendones, según el banco.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:230.
