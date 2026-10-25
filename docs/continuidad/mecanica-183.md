# mecanica-183 · Dimensionado de un reductor cicloidal: excentricidad, carga y velocidad

Estado al24-10-2026: terminado y verificado localmente. Pendiente commit y publicación confirmada.

## Orden profesional y competencia practicada
OT-183 · Un eje de robot necesita entre8 y12 rpm. Debes elegir entrada y excentricidad sin rebasar las exigencias equivalentes del apoyo.

Instrumentos: Tacómetros de entrada/salida y registro de fuerza y aceleración equivalentes.

Dimensiona un reductor de una articulación comprobando velocidad de salida y exigencia sobre el apoyo excéntrico. El disco gira despacio mientras su centro orbita. Una excentricidad pequeña exige más fuerza para transmitir el mismo par.

## Archivos exactos
- `public/labs/dimensionado-reductor-cicloidal.html` y `public/labs/_ficha-dimensionado-reductor-cicloidal.js`.
- `src/labs/mecanica-183/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_automatismos-modelos.js` (funciones puras), `_automatismos-escenas.js` (construcción y actualización), `_automatismos-definiciones.js` (contratos), `_automatismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-automatismos-177-186.mjs --solo 183`.

## Modelo y límites
11 rodillos y10 lóbulos: ωsalida=−ωentrada/10. Entrada8 N·m, η=0,9: salida72 N·m. Exigencia ideal equivalente F=Tentrada/e; aceleración orbital eω². El perfil se deriva como envolvente desplazada de Q(u)=[Rcosu−ecos11u,Rsin u−esin11u], R=0,10 m, rodillo8 mm; P=Q−r n, con n normal unitaria exterior. Centro del disco e[cosθ,sinθ] y orientación−θ/10.

Sólo geometría ideal y estimación equivalente de carga de entrada. F=T/e no es cálculo de reparto entre rodillos ni vida del rodamiento. Sin elasticidad, lubricación, holgura, carga dinámica del portador, desgaste o perfil comercial. Los pasadores de salida son estructurales; no se resuelve contacto en sus alojamientos.

Fuente del principio: https://emeia.sumitomodrive.com/en-gb/cycloidal-gear-technology

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

## Flujo profesional exigido
Abrir y preparar la orden, ajustar el banco, ensayar un ciclo y conservar el informe. La aceptación necesita un ensayo vigente; una modificación invalida el registro. Son escenarios didácticos con hipótesis explícitas, no habilitaciones de equipos reales.

## Verificación incremental · 24-10-2026
Auditoría numérica: 1696 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 51 palabras iniciales, normales cero=0, 16 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 51 palabras iniciales, normales cero=0, 16 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 51 palabras iniciales, normales cero=0, 16 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 51 palabras iniciales, normales cero=0, 16 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños completa; pendiente cierre visual y pruebas globales. NO afirmar publicado.

## Cierre visual y funcional
40 flujos completos en cuatro tamaños en el lote;6003 comprobaciones numéricas.44 suites,3048 pruebas y12 snapshots correctos; TypeScript y ESLint correctos. Portada propia y barrido sin red10/10. Vistas Banco e Inspección comparten geometrías y reloj; revisión adicional de las diez vistas cercanas en escritorio y móvil. El analizador181 verifica además ampliación FFT, informe y caducidad del registro tras cambiar un mando. Las demás prácticas verificaron preparación, ensayo y descarga en los cuatro tamaños.

Autocrítica:48–65 palabras iniciales, PBR y piezas torneadas; las ecuaciones y el informe se revelan al pedirlos. Se corrigieron apoyos, sujeción CNC y perfiles, y se añadió mesa de proceso al177 y resortes al184. La vista de inspección no es despiece físico: oculta soportes para ver el mecanismo. No se simula hardware comercial ni certificación industrial.

Retomar: módulos _automatismos-*.js e _inspeccion-mecanismos.js; QA reproducible flujo-automatismos-177-186.mjs; capturas .salida/automatismos-177-186. Reconstruir con scripts/build-lab.mjs y el slug del descriptor. Publicación todavía pendiente; continuar hasta200 por mandato del usuario.

## Publicación confirmada
Código cbf27e8 empujado a main. Deploy exit0; Cloudflare 461e43b5-cf37-4bd5-82a6-8a436cde3779. Acceso real con login:68 destacadas, iframes165/166 y177–186 correctos, portadas HTTP200, normales cero=0 y consola limpia. La tarea continúa hasta200.
