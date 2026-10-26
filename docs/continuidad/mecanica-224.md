# mecanica-224 · Caudalímetro Venturi: presión y continuidad

Estado al26-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden
Sigue el agua a través de una garganta y relaciona su aceleración con la presión diferencial.

OT-224 · Entrega ≥3 L/s con diferencial 5–18 kPa, pérdida ≤2 kPa, presión absoluta ≥40 kPa y Re≥40000.

Equipo e instrumentos: Venturi seccionado, tomas de impulso y transmisor diferencial.

## Modelo y alcance
Agua ρ=998 kg/m³, µ=0,001 Pa·s; D=50 mm. v=Q/A; Δp=ρ(v2²−v1²)/(2Cd²), Cd=0,98. p1=160 kPa absolutos. Pérdida permanente sintética=0,12Δp; Re=ρv2d/µ. Marcadores siguen volumen acumulado en el conducto de sección variable.

Estacionario, incompresible; Cd y recuperación constantes sintéticos, sin CFD ni validación normativa. Si p2≤0 la hipótesis es inválida. No predice cavitación ni calibración real de un transmisor. Flujo ralentizado ×1/20; marcadores representan volumen, no moléculas.

Escalas: Agua estacionaria · flujo ×1/20 · Cd sintético

Fuente del principio: https://www.usbr.gov/tsc/techreferences/mands/wmm/chap14_03.html . Constantes del escenario y geometrías sintéticas propias; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/venturi-presion-diferencial.html y _ficha-venturi-presion-diferencial.js.
- Escena: public/labs/_proc-224.js; utilidades _proceso-piezas.js, que reutiliza las piezas geométricas de _fabricacion-piezas.js.
- _proceso-modelos.js: funciones puras; _proceso-definiciones.js: contrato; _proceso-instrumentos.js: gráficas DOM; _proceso-runtime.js: orden, ensayo e informe; _proceso-escenas.js: dispatcher.
- src/labs/mecanica-224/, briefing JSON, portada prac_224.webp y descriptor scripts/lab-src/venturi-presion-diferencial.json.
- Construir entrada: node scripts/build-lab.mjs venturi-presion-diferencial. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-proceso-221-230.mjs --solo 224.
- UI: node scripts/auditoria/flujo-proceso-221-230.mjs --solo 224 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-proceso.mjs. Calibraciones: calibraciones-proceso.mjs. Portadas: scripts/portadas/capturar-proceso.mjs --solo 224.

## Verificación
844 comprobaciones numéricas en este banco;40634 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo real por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 48 palabras iniciales; 11 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 48 palabras iniciales; 11 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 48 palabras iniciales; 11 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 48 palabras iniciales; 11 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.

Revisión final de inicio e inspección, sincronía de transformaciones y matrices/colores de instancias, portada propia y barrido sin CDN sanos.44 suites,3356 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin cambios en entradas anteriores.

## Autocrítica visual y originalidad
Venturi abierto con convergente, garganta, difusor, agua y transmisor conectado a dos tomas; pernos y apoyos dan escala mecánica. Los marcadores avanzan por volumen acumulado para acelerar al estrecharse el área. La recuperación de presión es sintética. Es distinto del102: medición por diferencial, no bomba volumétrica ni selección de curva.
37–53 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación compartidos. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

## Publicación
Código aae1fdb064a568c64ee6fcc04bfcc2d0fd643a35 empujado a main. Deploy exit0; Cloudflare df771c75-c957-4014-b1d2-8a99f0c330d3. Login real:112 destacadas, doce iframes exactos (221–230 más211/220), portadas HTTP200, geometría sana y consola limpia. Último laboratorio publicado:230. Los commits posteriores de documentación no cambian el código publicado.
