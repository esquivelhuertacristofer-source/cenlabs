# mecanica-178 · Ajuste de una leva: carrera, contacto y ángulo de presión

Estado al24-10-2026: terminado y verificado localmente. Pendiente commit y publicación confirmada.

## Orden profesional y competencia practicada
OT-178 · Una alimentadora debe trabajar a450 ciclos/min o más. En el banco comprobarás si su ley de movimiento evita aceleraciones excesivas y separación del seguidor.

Instrumentos: Indicador de desplazamiento, traza de aceleración y fuerza axial virtuales.

Ajusta una leva de alimentación para que el seguidor complete su carrera sin perder contacto a la velocidad de producción. Una subida demasiado breve exige mucha aceleración. La fuerza de contacto permite comprobar si el resorte puede mantener al rodillo sobre la leva.

## Archivos exactos
- `public/labs/banco-leva-seguidor.html` y `public/labs/_ficha-banco-leva-seguidor.js`.
- `src/labs/mecanica-178/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_automatismos-modelos.js` (funciones puras), `_automatismos-escenas.js` (construcción y actualización), `_automatismos-definiciones.js` (contratos), `_automatismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-automatismos-177-186.mjs --solo 178`.

## Modelo y límites
Carrera20 mm; subida cicloidal s=h[u−sin(2πu)/(2π)] durante β, reposo hasta180°, retorno de la misma duración y reposo inferior. ds/dθ=h(1−cos2πu)/β; d²s/dθ²=2πh sin2πu/β². Fuerza axial N=120+9000s+0,6a en N; sin gravedad en este balance axial. Curva de paso r=48 mm+s; rodillo8 mm, radio base40 mm. El perfil se obtiene desplazando la curva de paso a lo largo de su normal. tanα=|ds/dθ|/(48 mm+s).

Mecanismo rígido y resorte lineal precargado. La trayectoria es impuesta incluso si N resulta negativa: se avisa que el seguimiento no es viable; no se simula vuelo o impacto del seguidor. Sin lubricación, resistencia de contacto Hertz, elasticidad, fabricación de leva ni dinámica completa del motor. El rodillo no tiene un modelo de giro por adherencia.

Fuente del principio: https://egyankosh.ac.in/bitstream/123456789/27124/1/Unit-4.pdf

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

## Flujo profesional exigido
Abrir y preparar la orden, ajustar el banco, ensayar un ciclo y conservar el informe. La aceptación necesita un ensayo vigente; una modificación invalida el registro. Son escenarios didácticos con hipótesis explícitas, no habilitaciones de equipos reales.

## Verificación incremental · 24-10-2026
Auditoría numérica: 607 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 63 palabras iniciales, normales cero=0, 10 drawcalls, objeto 67.3 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 63 palabras iniciales, normales cero=0, 10 drawcalls, objeto 67.3 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 63 palabras iniciales, normales cero=0, 10 drawcalls, objeto 67.3 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 63 palabras iniciales, normales cero=0, 10 drawcalls, objeto 67.5 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños completa; pendiente cierre visual y pruebas globales. NO afirmar publicado.

## Cierre visual y funcional
40 flujos completos en cuatro tamaños en el lote;6003 comprobaciones numéricas.44 suites,3048 pruebas y12 snapshots correctos; TypeScript y ESLint correctos. Portada propia y barrido sin red10/10. Vistas Banco e Inspección comparten geometrías y reloj; revisión adicional de las diez vistas cercanas en escritorio y móvil. El analizador181 verifica además ampliación FFT, informe y caducidad del registro tras cambiar un mando. Las demás prácticas verificaron preparación, ensayo y descarga en los cuatro tamaños.

Autocrítica:48–65 palabras iniciales, PBR y piezas torneadas; las ecuaciones y el informe se revelan al pedirlos. Se corrigieron apoyos, sujeción CNC y perfiles, y se añadió mesa de proceso al177 y resortes al184. La vista de inspección no es despiece físico: oculta soportes para ver el mecanismo. No se simula hardware comercial ni certificación industrial.

Retomar: módulos _automatismos-*.js e _inspeccion-mecanismos.js; QA reproducible flujo-automatismos-177-186.mjs; capturas .salida/automatismos-177-186. Reconstruir con scripts/build-lab.mjs y el slug del descriptor. Publicación todavía pendiente; continuar hasta200 por mandato del usuario.

## Publicación confirmada
Código cbf27e8 empujado a main. Deploy exit0; Cloudflare 461e43b5-cf37-4bd5-82a6-8a436cde3779. Acceso real con login:68 destacadas, iframes165/166 y177–186 correctos, portadas HTTP200, normales cero=0 y consola limpia. La tarea continúa hasta200.
