# mecanica-186 · Preparación de fresado CNC: avance por diente, potencia y arranque de material

Estado al24-10-2026: terminado y verificado localmente. Pendiente commit y publicación confirmada.

## Orden profesional y competencia practicada
OT-186 · Prepara una pasada circular de2 mm con una fresa de4 dientes. La máquina admite250 W netos y0,45 N·m; justifica avance, viruta y producción.

Instrumentos: Panel de avance/husillo, registro de potencia y verificación de trayectoria virtuales.

Prepara una pasada de fresado eligiendo avance y giro que produzcan viruta útil dentro de los límites de la máquina. Subir el avance aumenta el material retirado y la potencia. El giro reparte ese avance entre los dientes y cambia la carga de cada filo.

## Archivos exactos
- `public/labs/preparacion-fresado-cnc.html` y `public/labs/_ficha-preparacion-fresado-cnc.js`.
- `src/labs/mecanica-186/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_automatismos-modelos.js` (funciones puras), `_automatismos-escenas.js` (construcción y actualización), `_automatismos-definiciones.js` (contratos), `_automatismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-automatismos-177-186.mjs --solo 186`.

## Modelo y límites
Fresa de10 mm y4 dientes; avance por diente fz=vf/(nz). Profundidad2 mm y anchura equivalente4 mm: Q=8vf mm³/min. Energía específica sintética1,8 J/mm³: Pc=1,8Q/60 y Mc=Pc/ω. Trayectoria circular de radio25 mm: φ=vf t/R en SI. Para conservar el volumen por arco, el sector de sobremetal tiene radio exterior30 mm e interior√(30²−2·4·25)=26,458 mm. El sector eliminado muestra el progreso angular, no una intersección CSG exacta del filo.

Corte estacionario ideal y energía específica constante, no datos de un material comercial. Sin vibración de chatter, flexión, desgaste, temperatura, sujeción real, colisiones, refrigerante o G-code de un control comercial. Cada vuelta es una pasada independiente con pieza reiniciada. El husillo se muestra estroboscópico; no es el giro físico aparente de una cámara real.

Fuente del principio: https://www.sandvik.coromant.com/en-gb/knowledge/machining-formulas-definitions/milling-formulas-definitions?newsarchivetagfilter=Turning

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

## Flujo profesional exigido
Abrir y preparar la orden, ajustar el banco, ensayar un ciclo y conservar el informe. La aceptación necesita un ensayo vigente; una modificación invalida el registro. Son escenarios didácticos con hipótesis explícitas, no habilitaciones de equipos reales.

## Verificación incremental · 24-10-2026
Auditoría numérica: 486 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 65 palabras iniciales, normales cero=0, 21 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 65 palabras iniciales, normales cero=0, 21 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 65 palabras iniciales, normales cero=0, 21 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 65 palabras iniciales, normales cero=0, 21 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños completa; pendiente cierre visual y pruebas globales. NO afirmar publicado.

## Cierre visual y funcional
40 flujos completos en cuatro tamaños en el lote;6003 comprobaciones numéricas.44 suites,3048 pruebas y12 snapshots correctos; TypeScript y ESLint correctos. Portada propia y barrido sin red10/10. Vistas Banco e Inspección comparten geometrías y reloj; revisión adicional de las diez vistas cercanas en escritorio y móvil. El analizador181 verifica además ampliación FFT, informe y caducidad del registro tras cambiar un mando. Las demás prácticas verificaron preparación, ensayo y descarga en los cuatro tamaños.

Autocrítica:48–65 palabras iniciales, PBR y piezas torneadas; las ecuaciones y el informe se revelan al pedirlos. Se corrigieron apoyos, sujeción CNC y perfiles, y se añadió mesa de proceso al177 y resortes al184. La vista de inspección no es despiece físico: oculta soportes para ver el mecanismo. No se simula hardware comercial ni certificación industrial.

Retomar: módulos _automatismos-*.js e _inspeccion-mecanismos.js; QA reproducible flujo-automatismos-177-186.mjs; capturas .salida/automatismos-177-186. Reconstruir con scripts/build-lab.mjs y el slug del descriptor. Publicación todavía pendiente; continuar hasta200 por mandato del usuario.

## Publicación confirmada
Código cbf27e8 empujado a main. Deploy exit0; Cloudflare 461e43b5-cf37-4bd5-82a6-8a436cde3779. Acceso real con login:68 destacadas, iframes165/166 y177–186 correctos, portadas HTTP200, normales cero=0 y consola limpia. La tarea continúa hasta200.

## Regresión del compartido25-10-2026
_inspeccion-mecanismos.js sincroniza también las referencias de geometría y material de las piezas. Código0ea5b0c. Inicio e inspección comprobados a1366×768: normales cero=0 y consola sin errores. Se repitieron las6003 comprobaciones numéricas del lote. Los40 flujos completos anteriores permanecen preservados aparte; esta regresión adicional es visual inicial.
