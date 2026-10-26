# mecanica-222 · Sensor de fuerza y par: calibración de seis ejes

Estado al26-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Competencia y orden
Abre el sensor, observa sus flexuras y corrige el acoplamiento entre seis canales.

OT-222 · Calibra doce cargas patrón: RMS normalizado ≤0,3 % y error máximo ≤0,5 %.

Equipo e instrumentos: Sensor seccionado, patrones de fuerza/par e inversa matricial.

## Modelo y alcance
Canales normalizados con escalas 100 N y 10 N·m. s=g(I+cC)w; C desplaza cíclicamente seis canales. Se reconstruye w con inversa 6×6 de la matriz estimada. Doce patrones ±unitarios. Fuerza dinámica prescrita; desplazamiento elástico F/(0,5 MN/m), ampliado ×200. Rigidez torsional ilustrativa 20000 N·m/rad; giro elástico ampliado ×200. El informe conserva las doce filas de señales normalizadas de entrada.

Sólo dos parámetros globales de una matriz sintética; no estima 36 constantes independientes ni temperatura, histéresis o dinámica estructural. Las flexuras son esquemáticas, sin FEM. Cargas patrón independientes y datos sin ruido. No controla un sensor ATI ni usa su calibración.

Escalas: Deformación ×200 · seis canales normalizados · sin FEM

Fuente del principio: https://www.ati-ia.com/zh-CN/library/documents/FT_FAQ.pdf . Constantes del escenario y geometrías sintéticas propias; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/sensor-fuerza-par-matriz.html y _ficha-sensor-fuerza-par-matriz.js.
- Escena: public/labs/_proc-222.js; utilidades _proceso-piezas.js, que reutiliza las piezas geométricas de _fabricacion-piezas.js.
- _proceso-modelos.js: funciones puras; _proceso-definiciones.js: contrato; _proceso-instrumentos.js: gráficas DOM; _proceso-runtime.js: orden, ensayo e informe; _proceso-escenas.js: dispatcher.
- src/labs/mecanica-222/, briefing JSON, portada prac_222.webp y descriptor scripts/lab-src/sensor-fuerza-par-matriz.json.
- Construir entrada: node scripts/build-lab.mjs sensor-fuerza-par-matriz. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-proceso-221-230.mjs --solo 222.
- UI: node scripts/auditoria/flujo-proceso-221-230.mjs --solo 222 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-proceso.mjs. Calibraciones: calibraciones-proceso.mjs. Portadas: scripts/portadas/capturar-proceso.mjs --solo 222.

## Verificación
964 comprobaciones numéricas en este banco;40634 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo real por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 37 palabras iniciales; 23 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 37 palabras iniciales; 23 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 37 palabras iniciales; 23 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 37 palabras iniciales; 23 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.

Revisión final de inicio e inspección, sincronía de transformaciones y matrices/colores de instancias, portada propia y barrido sin CDN sanos.44 suites,3356 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin cambios en entradas anteriores.

## Autocrítica visual y originalidad
Sensor seccionado con bridas, seis flexuras, galgas, herramienta y cable. La deformación de fuerza y giro se amplifica200 veces. El informe conserva doce patrones y seis señales por patrón, para reconstruir el ajuste fuera de la pantalla. Es distinto del38: calibración de seis canales acoplados, no puente de una sola deformación.
37–53 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación compartidos. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

Referencia oculta en Modelo/Ficha hasta validar y retirada al cambiar el ajuste; comprobado en escritorio y móvil. Informe con datos adquiridos comprobado mediante descarga.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:220.
