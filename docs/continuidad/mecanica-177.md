# mecanica-177 · Puesta en marcha de un indexador de Ginebra: ciclo, reposo y aceleración

Estado al24-10-2026: terminado y verificado localmente. Pendiente commit y publicación confirmada.

## Orden profesional y competencia practicada
OT-177 · La estación de marcado necesita seis posiciones como mínimo y800 ms de pieza detenida. Debes entregar un ajuste que conserve al menos40 piezas/min sin exceder la aceleración del útil.

Instrumentos: Tacómetro, señal de ventana de avance y registro temporal virtuales.

Pon en marcha una estación que debe detener cada pieza el tiempo suficiente para que trabaje una herramienta. El pasador hace avanzar la mesa y después la deja quieta. Cambiar estaciones y velocidad modifica la ventana disponible para trabajar.

## Archivos exactos
- `public/labs/puesta-marcha-indexador-ginebra.html` y `public/labs/_ficha-puesta-marcha-indexador-ginebra.js`.
- `src/labs/mecanica-177/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_automatismos-modelos.js` (funciones puras), `_automatismos-escenas.js` (construcción y actualización), `_automatismos-definiciones.js` (contratos), `_automatismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-automatismos-177-186.mjs --solo 177`.

## Modelo y límites
Para N ranuras: k=r/c=sin(π/N), c=1 unidad visual. El pasador engrana durante 2α, α=π/2−π/N. Durante ese intervalo ψ=−atan2(k sinφ,1−k cosφ), con incremento de una estación 2π/N por vuelta. Fuera de él, la mesa permanece detenida. Se usan derivadas analíticas para velocidad y aceleración. La duración del reposo es (π+2π/N)/ω. Se revisan721 posturas por ciclo.

Cinemática de un mecanismo rígido ideal. El bloqueo durante el reposo está impuesto; no se calcula el contacto del disco de bloqueo, impacto del pasador, flexión, desgaste ni dinámica del motor. Las ranuras muestran el acoplamiento, no tolerancias de fabricación. No se simula PLC de seguridad ni una célula real.

Fuente del principio: https://archive.nptel.ac.in/content/storage2/courses/112103174/module4/lec5/3.html

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

## Flujo profesional exigido
Abrir y preparar la orden, ajustar el banco, ensayar un ciclo y conservar el informe. La aceptación necesita un ensayo vigente; una modificación invalida el registro. Son escenarios didácticos con hipótesis explícitas, no habilitaciones de equipos reales.

## Verificación incremental · 24-10-2026
Auditoría numérica: 365 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 57 palabras iniciales, normales cero=0, 10 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 57 palabras iniciales, normales cero=0, 10 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 57 palabras iniciales, normales cero=0, 10 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 57 palabras iniciales, normales cero=0, 10 drawcalls, objeto 57.4 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños completa; pendiente cierre visual y pruebas globales. NO afirmar publicado.

## Cierre visual y funcional
40 flujos completos en cuatro tamaños en el lote;6003 comprobaciones numéricas.44 suites,3048 pruebas y12 snapshots correctos; TypeScript y ESLint correctos. Portada propia y barrido sin red10/10. Vistas Banco e Inspección comparten geometrías y reloj; revisión adicional de las diez vistas cercanas en escritorio y móvil. El analizador181 verifica además ampliación FFT, informe y caducidad del registro tras cambiar un mando. Las demás prácticas verificaron preparación, ensayo y descarga en los cuatro tamaños.

Autocrítica:48–65 palabras iniciales, PBR y piezas torneadas; las ecuaciones y el informe se revelan al pedirlos. Se corrigieron apoyos, sujeción CNC y perfiles, y se añadió mesa de proceso al177 y resortes al184. La vista de inspección no es despiece físico: oculta soportes para ver el mecanismo. No se simula hardware comercial ni certificación industrial.

Retomar: módulos _automatismos-*.js e _inspeccion-mecanismos.js; QA reproducible flujo-automatismos-177-186.mjs; capturas .salida/automatismos-177-186. Reconstruir con scripts/build-lab.mjs y el slug del descriptor. Publicación todavía pendiente; continuar hasta200 por mandato del usuario.

## Publicación confirmada
Código cbf27e8 empujado a main. Deploy exit0; Cloudflare 461e43b5-cf37-4bd5-82a6-8a436cde3779. Acceso real con login:68 destacadas, iframes165/166 y177–186 correctos, portadas HTTP200, normales cero=0 y consola limpia. La tarea continúa hasta200.
