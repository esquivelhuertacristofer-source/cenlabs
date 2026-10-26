# mecanica-226 · Soplador Roots: lóbulos y compresión externa

Estado al26-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Competencia y orden
Dos rotores transportan bolsas de aire hacia una salida presurizada, sin comprimirlas internamente.

OT-226 · Entrega ≥12 L/s con potencia ≤650 W, salida ≤50 °C y régimen ≤2100 rpm.

Equipo e instrumentos: Soplador abierto, rotores sincronizados y balance de aire.

## Modelo y alcance
Volumen desplazado nominal=0,6 L/vuelta; Qideal=Vdn/60. Fuga sintética=10⁻⁵√Δp m³/s (Δp en Pa). Qneto=Qideal−fuga. Potencia eje=ΔpQideal/0,75. Calor al gas=ΔpQideal; T2=293,15+calor/(1,2Qneto·1005) K. Densidad de salida por gas ideal.

Compresión externa idealizada. Perfiles bilobulares ilustrativos r=0,36+0,18cos2θ, no conjugados de mecanizado; el desplazamiento nominal se prescribe, no se deriva del dibujo. Fuga sintética, sin CFD ni curva comercial. Color del aire indica temperatura media; giro ×1/60.

Escalas: Giro ×1/60 · compresión externa · lóbulos ilustrativos

Fuente del principio: https://www.aerzen.com/products/positive-displacement-blowers/overview . Constantes del escenario y geometrías sintéticas propias; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/soplador-roots-lobulos.html y _ficha-soplador-roots-lobulos.js.
- Escena: public/labs/_proc-226.js; utilidades _proceso-piezas.js, que reutiliza las piezas geométricas de _fabricacion-piezas.js.
- _proceso-modelos.js: funciones puras; _proceso-definiciones.js: contrato; _proceso-instrumentos.js: gráficas DOM; _proceso-runtime.js: orden, ensayo e informe; _proceso-escenas.js: dispatcher.
- src/labs/mecanica-226/, briefing JSON, portada prac_226.webp y descriptor scripts/lab-src/soplador-roots-lobulos.json.
- Construir entrada: node scripts/build-lab.mjs soplador-roots-lobulos. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-proceso-221-230.mjs --solo 226.
- UI: node scripts/auditoria/flujo-proceso-221-230.mjs --solo 226 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-proceso.mjs. Calibraciones: calibraciones-proceso.mjs. Portadas: scripts/portadas/capturar-proceso.mjs --solo 226.

## Verificación
644 comprobaciones numéricas en este banco;40634 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo real por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 37 palabras iniciales; 11 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 37 palabras iniciales; 13 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 37 palabras iniciales; 13 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 37 palabras iniciales; 13 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.

Revisión final de inicio e inspección, sincronía de transformaciones y matrices/colores de instancias, portada propia y barrido sin CDN sanos.44 suites,3356 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin cambios en entradas anteriores.

## Autocrítica visual y originalidad
Soplador abierto con lóbulos, ejes, engranes de sincronización posteriores, fijaciones, entrada y descarga. Se comprueba separación de perfiles durante la contrarrotación; trazadores fuera del máximo radio de lóbulo. Los perfiles no son conjugados de fabricación y Vd se prescribe. Es distinto del123: desplazamiento positivo y compresión externa, no turbocompresor.
37–53 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación compartidos. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

Perfil ilustrativo separado durante una vuelta completa; prueba geométrica de holgura y revisión visual final después de añadir engranes posteriores.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:220.
