# mecanica-184 · Ensayo de un embrague centrífugo: ralentí, acoplamiento y calor

Estado al24-10-2026: terminado y verificado localmente. Pendiente commit y publicación confirmada.

## Orden profesional y competencia practicada
OT-184 · Revisa un accionamiento de máquina ligera que arrastra al ralentí. Debes ajustar la retención y comprobar el arranque contra la carga de prueba.

Instrumentos: Tacómetros, traza de deslizamiento y balance térmico virtuales.

Ajusta un embrague para que no arrastre al ralentí y pueda acelerar una carga sin calentarse demasiado. La fuerza centrífuga empuja las zapatas; los resortes las retienen. Cuando hay deslizamiento se transforma energía en calor.

## Archivos exactos
- `public/labs/ensayo-embrague-centrifugo.html` y `public/labs/_ficha-ensayo-embrague-centrifugo.js`.
- `src/labs/mecanica-184/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_automatismos-modelos.js` (funciones puras), `_automatismos-escenas.js` (construcción y actualización), `_automatismos-definiciones.js` (contratos), `_automatismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-automatismos-177-186.mjs --solo 184`.

## Modelo y límites
Tres zapatas: N=max(0,mrω²−Fs), m=0,12 kg y r=45 mm. Tcap=3μRN, μ=0,32, R=60 mm. Entrada a giro constante; carga8 N·m e inercia de tambor0,08 kg·m². Si Tcap>8: α=(Tcap−8)/J y ts=Jω/(Tcap−8). El deslizamiento termina al igualar velocidades. Calor=∫Tcap(ωentrada−ωtambor)dt. Ralentí de referencia1200 rpm. Se comprueba balance de trabajo, energía cinética, carga y calor.

Fricción y normal constantes durante cada arranque, sin recorrido real de zapata, elasticidad, variación de μ con temperatura, desgaste ni refrigeración. El paso de fuerza a contacto es idealizado. Cada4 s se reinicia un arranque independiente; no es frenado físico de la carga. El régimen está impuesto y no incluye dinámica del motor.

Fuente del principio: https://www.hilliardcorp.com/products/drivetrain/extreme-duty-clutches/

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

## Flujo profesional exigido
Abrir y preparar la orden, ajustar el banco, ensayar un ciclo y conservar el informe. La aceptación necesita un ensayo vigente; una modificación invalida el registro. Son escenarios didácticos con hipótesis explícitas, no habilitaciones de equipos reales.

## Verificación incremental · 24-10-2026
Auditoría numérica: 416 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 52 palabras iniciales, normales cero=0, 14 drawcalls, objeto 66.7 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 52 palabras iniciales, normales cero=0, 14 drawcalls, objeto 66.0 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 52 palabras iniciales, normales cero=0, 14 drawcalls, objeto 66.5 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 52 palabras iniciales, normales cero=0, 14 drawcalls, objeto 67.6 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños completa; pendiente cierre visual y pruebas globales. NO afirmar publicado.

## Cierre visual y funcional
40 flujos completos en cuatro tamaños en el lote;6003 comprobaciones numéricas.44 suites,3048 pruebas y12 snapshots correctos; TypeScript y ESLint correctos. Portada propia y barrido sin red10/10. Vistas Banco e Inspección comparten geometrías y reloj; revisión adicional de las diez vistas cercanas en escritorio y móvil. El analizador181 verifica además ampliación FFT, informe y caducidad del registro tras cambiar un mando. Las demás prácticas verificaron preparación, ensayo y descarga en los cuatro tamaños.

Autocrítica:48–65 palabras iniciales, PBR y piezas torneadas; las ecuaciones y el informe se revelan al pedirlos. Se corrigieron apoyos, sujeción CNC y perfiles, y se añadió mesa de proceso al177 y resortes al184. La vista de inspección no es despiece físico: oculta soportes para ver el mecanismo. No se simula hardware comercial ni certificación industrial.

Retomar: módulos _automatismos-*.js e _inspeccion-mecanismos.js; QA reproducible flujo-automatismos-177-186.mjs; capturas .salida/automatismos-177-186. Reconstruir con scripts/build-lab.mjs y el slug del descriptor. Publicación todavía pendiente; continuar hasta200 por mandato del usuario.

## Publicación confirmada
Código cbf27e8 empujado a main. Deploy exit0; Cloudflare 461e43b5-cf37-4bd5-82a6-8a436cde3779. Acceso real con login:68 destacadas, iframes165/166 y177–186 correctos, portadas HTTP200, normales cero=0 y consola limpia. La tarea continúa hasta200.

## Regresión del compartido25-10-2026
_inspeccion-mecanismos.js sincroniza también las referencias de geometría y material de las piezas. Código0ea5b0c. Inicio e inspección comprobados a1366×768: normales cero=0 y consola sin errores. Se repitieron las6003 comprobaciones numéricas del lote. Los40 flujos completos anteriores permanecen preservados aparte; esta regresión adicional es visual inicial.
