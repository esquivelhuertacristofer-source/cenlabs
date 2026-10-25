# mecanica-180 · Alineación de una transmisión de doble Cardán: fase y ondulación de velocidad

Estado al24-10-2026: terminado y verificado localmente. Pendiente commit y publicación confirmada.

## Orden profesional y competencia practicada
OT-180 · Un eje transmite5 kW a300 rpm y necesita superar un obstáculo con al menos25° de desvío. Verifica fase y par pulsante antes de aceptar la transmisión.

Instrumentos: Dos tacómetros virtuales, traza de relación instantánea y registro de par.

Alinea las horquillas de una transmisión para que el giro llegue uniforme a pesar del desvío entre ejes. Una cruceta introduce variaciones de velocidad. Dos ángulos iguales pueden compensarlas si las horquillas están correctamente en fase.

## Archivos exactos
- `public/labs/alineacion-doble-cardan.html` y `public/labs/_ficha-alineacion-doble-cardan.js`.
- `src/labs/mecanica-180/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_automatismos-modelos.js` (funciones puras), `_automatismos-escenas.js` (construcción y actualización), `_automatismos-definiciones.js` (contratos), `_automatismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-automatismos-177-186.mjs --solo 180`.

## Modelo y límites
Junta simple: γ=atan2(cosβ sinθ,cosθ) con ángulo desenrollado. Segunda junta compensadora: ψ=atan2(sin(γ+δ),cosβ cos(γ+δ))−δ. Se derivan ambas transformaciones para la relación instantánea. Con δ=0 se obtiene ψ=θ. Entrada a300 rpm y potencia ideal constante5 kW: Tsalida=P/ωsalida. Se revisa una vuelta completa en721 posturas.

Ángulos de junta iguales ejes de entrada/salida paralelos; error de fase δ impuesto. Sin elasticidad, desequilibrio, desgaste, fuerzas de rodamiento, holgura ni límites comerciales de velocidad. No es un procedimiento de alineación bajo un vehículo real. Las crucetas siguen las direcciones ortogonales deducidas de la cinemática.

Fuente del principio: https://www.huco.com/products/power-transmission/universal-joints

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

## Flujo profesional exigido
Abrir y preparar la orden, ajustar el banco, ensayar un ciclo y conservar el informe. La aceptación necesita un ensayo vigente; una modificación invalida el registro. Son escenarios didácticos con hipótesis explícitas, no habilitaciones de equipos reales.

## Verificación incremental · 24-10-2026
Auditoría numérica: 486 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 54 palabras iniciales, normales cero=0, 38 drawcalls, objeto 64.4 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 54 palabras iniciales, normales cero=0, 38 drawcalls, objeto 64.4 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 54 palabras iniciales, normales cero=0, 38 drawcalls, objeto 64.4 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 54 palabras iniciales, normales cero=0, 38 drawcalls, objeto 64.3 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños completa; pendiente cierre visual y pruebas globales. NO afirmar publicado.

## Cierre visual y funcional
40 flujos completos en cuatro tamaños en el lote;6003 comprobaciones numéricas.44 suites,3048 pruebas y12 snapshots correctos; TypeScript y ESLint correctos. Portada propia y barrido sin red10/10. Vistas Banco e Inspección comparten geometrías y reloj; revisión adicional de las diez vistas cercanas en escritorio y móvil. El analizador181 verifica además ampliación FFT, informe y caducidad del registro tras cambiar un mando. Las demás prácticas verificaron preparación, ensayo y descarga en los cuatro tamaños.

Autocrítica:48–65 palabras iniciales, PBR y piezas torneadas; las ecuaciones y el informe se revelan al pedirlos. Se corrigieron apoyos, sujeción CNC y perfiles, y se añadió mesa de proceso al177 y resortes al184. La vista de inspección no es despiece físico: oculta soportes para ver el mecanismo. No se simula hardware comercial ni certificación industrial.

Retomar: módulos _automatismos-*.js e _inspeccion-mecanismos.js; QA reproducible flujo-automatismos-177-186.mjs; capturas .salida/automatismos-177-186. Reconstruir con scripts/build-lab.mjs y el slug del descriptor. Publicación todavía pendiente; continuar hasta200 por mandato del usuario.

## Publicación confirmada
Código cbf27e8 empujado a main. Deploy exit0; Cloudflare 461e43b5-cf37-4bd5-82a6-8a436cde3779. Acceso real con login:68 destacadas, iframes165/166 y177–186 correctos, portadas HTTP200, normales cero=0 y consola limpia. La tarea continúa hasta200.

## Regresión del compartido25-10-2026
_inspeccion-mecanismos.js sincroniza también las referencias de geometría y material de las piezas. Código0ea5b0c. Inicio e inspección comprobados a1366×768: normales cero=0 y consola sin errores. Se repitieron las6003 comprobaciones numéricas del lote. Los40 flujos completos anteriores permanecen preservados aparte; esta regresión adicional es visual inicial.
