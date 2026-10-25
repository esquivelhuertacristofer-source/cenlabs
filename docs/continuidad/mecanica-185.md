# mecanica-185 · Calibración de una bomba peristáltica: caudal, presión y esfuerzo del fluido

Estado al24-10-2026: terminado y verificado localmente. Pendiente commit y publicación confirmada.

## Orden profesional y competencia practicada
OT-185 · Una dosificadora debe entregar entre40 y60 mL/min a un circuito viscoso. Selecciona tubo y giro, comprueba el punto de operación y registra el ajuste.

Instrumentos: Caudalímetro, manómetro y registro virtual de dosificación.

Ajusta una dosificadora para entregar el caudal pedido sin exigir demasiada presión ni esfuerzo de pared. Los rodillos desplazan el contenido de una manguera. Su diámetro cambia mucho el volumen por vuelta y la resistencia del circuito.

## Archivos exactos
- `public/labs/calibracion-bomba-peristaltica.html` y `public/labs/_ficha-calibracion-bomba-peristaltica.js`.
- `src/labs/mecanica-185/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_automatismos-modelos.js` (funciones puras), `_automatismos-escenas.js` (construcción y actualización), `_automatismos-definiciones.js` (contratos), `_automatismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-automatismos-177-186.mjs --solo 185`.

## Modelo y límites
Radio de pista40 mm, área interior A=πd²/4, volumen ideal por vuelta A2πR. Caudal medio Q=0,85 Vrev n/60. Circuito equivalente laminar de2 m y viscosidad0,08 Pa·s: Δp=128μLQ/(πd⁴), esfuerzo de pared32μQ/(πd³). Par ideal de bombeo ΔpVrev/(2πηm), ηm=0,8. La ganancia volumétrica0,85 es sintética; un aforo real debe medirla. Los rodillos se muestran como oclusiones geométricas, no como un modelo de pared de goma.

Sin pulsación instantánea de caudal, reología no newtoniana, deformación elástica, retorno de líquido, fatiga de tubo, presión de oclusión ni control real de dosificación. Hagen–Poiseuille sólo representa el circuito equivalente, no el paso por el cabezal aplastado. Los puntos de fluido señalan bolsillos arrastrados; no son CFD ni medición volumétrica.

Fuente del principio: https://www.wmfts.com/en-au/support/pump-principles/how-do-peristaltic-pumps-work/

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

## Flujo profesional exigido
Abrir y preparar la orden, ajustar el banco, ensayar un ciclo y conservar el informe. La aceptación necesita un ensayo vigente; una modificación invalida el registro. Son escenarios didácticos con hipótesis explícitas, no habilitaciones de equipos reales.

## Verificación incremental · 24-10-2026
Auditoría numérica: 486 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 53 palabras iniciales, normales cero=0, 24 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 53 palabras iniciales, normales cero=0, 24 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 53 palabras iniciales, normales cero=0, 24 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 53 palabras iniciales, normales cero=0, 24 drawcalls, objeto 64.1 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños completa; pendiente cierre visual y pruebas globales. NO afirmar publicado.

## Cierre visual y funcional
40 flujos completos en cuatro tamaños en el lote;6003 comprobaciones numéricas.44 suites,3048 pruebas y12 snapshots correctos; TypeScript y ESLint correctos. Portada propia y barrido sin red10/10. Vistas Banco e Inspección comparten geometrías y reloj; revisión adicional de las diez vistas cercanas en escritorio y móvil. El analizador181 verifica además ampliación FFT, informe y caducidad del registro tras cambiar un mando. Las demás prácticas verificaron preparación, ensayo y descarga en los cuatro tamaños.

Autocrítica:48–65 palabras iniciales, PBR y piezas torneadas; las ecuaciones y el informe se revelan al pedirlos. Se corrigieron apoyos, sujeción CNC y perfiles, y se añadió mesa de proceso al177 y resortes al184. La vista de inspección no es despiece físico: oculta soportes para ver el mecanismo. No se simula hardware comercial ni certificación industrial.

Retomar: módulos _automatismos-*.js e _inspeccion-mecanismos.js; QA reproducible flujo-automatismos-177-186.mjs; capturas .salida/automatismos-177-186. Reconstruir con scripts/build-lab.mjs y el slug del descriptor. Publicación todavía pendiente; continuar hasta200 por mandato del usuario.

## Publicación confirmada
Código cbf27e8 empujado a main. Deploy exit0; Cloudflare 461e43b5-cf37-4bd5-82a6-8a436cde3779. Acceso real con login:68 destacadas, iframes165/166 y177–186 correctos, portadas HTTP200, normales cero=0 y consola limpia. La tarea continúa hasta200.
