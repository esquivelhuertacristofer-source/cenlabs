# mecanica-221 · Ultrasonido phased array: enfoque electrónico

Estado al26-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden
Dieciséis elementos emiten con retardos distintos y concentran el frente acústico dentro de una pieza.

OT-221 · Enfoca el reflector patrón (x=18 mm, z=40 mm) con error ≤0,8 mm y suma coherente ≥90 %.

Equipo e instrumentos: Sonda lineal, bloque patrón y visor de leyes focales.

## Modelo y alcance
16 elementos a paso 0,6 mm; frecuencia 4 MHz, c=5,9 mm/µs. Foco=(z tanθ,z). τi=max(di/c)−di/c. Amplitud normalizada=|Σexp[j2πf(τi+ri/c)]|/16. Distancias en mm; el reflector es una referencia conocida.

Medio homogéneo longitudinal, sin cuña ni refracción, atenuación, respuesta de elemento o caracterización de defectos. Amplitud coherente monocromática; los arcos representan frentes, no una solución de onda transitoria. Tiempo de propagación ralentizado 200000 veces. No interpreta ensayos reales. El campo coloreado representa la amplitud monocromática calculada, no una temperatura.

Escalas: Onda ×1/200000 · campo coherente en falso color · reflector conocido

Fuente del principio: https://industrial.evidentscientific.com.cn/zh/.downloads/download/?file=285218469&fl=en_US . Constantes del escenario y geometrías sintéticas propias; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/ultrasonido-arreglo-fases.html y _ficha-ultrasonido-arreglo-fases.js.
- Escena: public/labs/_proc-221.js; utilidades _proceso-piezas.js, que reutiliza las piezas geométricas de _fabricacion-piezas.js.
- _proceso-modelos.js: funciones puras; _proceso-definiciones.js: contrato; _proceso-instrumentos.js: gráficas DOM; _proceso-runtime.js: orden, ensayo e informe; _proceso-escenas.js: dispatcher.
- src/labs/mecanica-221/, briefing JSON, portada prac_221.webp y descriptor scripts/lab-src/ultrasonido-arreglo-fases.json.
- Construir entrada: node scripts/build-lab.mjs ultrasonido-arreglo-fases. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-proceso-221-230.mjs --solo 221.
- UI: node scripts/auditoria/flujo-proceso-221-230.mjs --solo 221 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-proceso.mjs. Calibraciones: calibraciones-proceso.mjs. Portadas: scripts/portadas/capturar-proceso.mjs --solo 221.

## Verificación
245 comprobaciones numéricas en este banco;40634 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo real por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 42 palabras iniciales; 36 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 42 palabras iniciales; 36 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 42 palabras iniciales; 36 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 42 palabras iniciales; 36 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.

Revisión final de inicio e inspección, sincronía de transformaciones y matrices/colores de instancias, portada propia y barrido sin CDN sanos.44 suites,3356 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin cambios en entradas anteriores.

## Autocrítica visual y originalidad
Sonda de16 elementos con campo coherente calculado en falso color, frentes propagados y reflector conocido. Se amplió el bloque para contener la profundidad usada y se mantuvo el foco visible. Frente monocromático y propagación ideal declarados; no inferir tamaño de defecto. Es distinto del193: forma el haz mediante retardos, no mide sólo espesor por tiempo de vuelo.
37–53 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación compartidos. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

## Publicación
Código aae1fdb064a568c64ee6fcc04bfcc2d0fd643a35 empujado a main. Deploy exit0; Cloudflare df771c75-c957-4014-b1d2-8a99f0c330d3. Login real:112 destacadas, doce iframes exactos (221–230 más211/220), portadas HTTP200, geometría sana y consola limpia. Último laboratorio publicado:230. Los commits posteriores de documentación no cambian el código publicado.
