# mecanica-182 · Motorreductor de tornillo sin fin: par útil, pérdidas y reversibilidad

Estado al24-10-2026: terminado y verificado localmente. Pendiente commit y publicación confirmada.

## Orden profesional y competencia practicada
OT-182 · Verifica un accionamiento de posicionamiento que necesita100 N·m de salida. Debes documentar rendimiento y reversibilidad sin confundirla con un freno de seguridad.

Instrumentos: Tacómetro, cálculo de par y balance de potencia virtuales.

Verifica un motorreductor que debe entregar par suficiente y comprueba cómo el rozamiento afecta su reversibilidad. El rozamiento reduce la eficiencia y puede impedir el retroceso ideal. Esa retención no sustituye una función de seguridad certificada.

## Archivos exactos
- `public/labs/verificacion-motorreductor-sinfin.html` y `public/labs/_ficha-verificacion-motorreductor-sinfin.js`.
- `src/labs/mecanica-182/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_automatismos-modelos.js` (funciones puras), `_automatismos-escenas.js` (construcción y actualización), `_automatismos-definiciones.js` (contratos), `_automatismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-automatismos-177-186.mjs --solo 182`.

## Modelo y límites
Tornillo de una entrada, corona40 dientes; γ=8°, φ=atanμ. Modelo de tornillo ideal: η=tanγ/tan(γ+φ). Tsalida=40ηTentrada y pérdidas=(1−η)Tentradaωentrada. Entrada60 rpm. Condición estática ideal de no reversibilidad γ≤φ. La geometría de paso usa radio del tornillo40 mm y radio de corona40r tanγ; se amplía tres veces.

Modelo de rozamiento seco uniforme. Sin temperatura, viscosidad de lubricante, desgaste, contacto de dientes, rodadura real, rodamientos o vibración. No se usa el autobloqueo como freno de seguridad; no certifica sostener una carga real. El perfil de dientes y la rosca visible son esquemáticos, no una geometría de fabricación.

Fuente del principio: https://download.sew-eurodrive.com/download/html/31546463/en-EN/3665340941955631876747.html

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

## Flujo profesional exigido
Abrir y preparar la orden, ajustar el banco, ensayar un ciclo y conservar el informe. La aceptación necesita un ensayo vigente; una modificación invalida el registro. Son escenarios didácticos con hipótesis explícitas, no habilitaciones de equipos reales.

## Verificación incremental · 24-10-2026
Auditoría numérica: 486 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 52 palabras iniciales, normales cero=0, 11 drawcalls, objeto 65.5 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 52 palabras iniciales, normales cero=0, 11 drawcalls, objeto 65.6 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 52 palabras iniciales, normales cero=0, 11 drawcalls, objeto 65.5 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 52 palabras iniciales, normales cero=0, 11 drawcalls, objeto 65.6 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños completa; pendiente cierre visual y pruebas globales. NO afirmar publicado.

## Cierre visual y funcional
40 flujos completos en cuatro tamaños en el lote;6003 comprobaciones numéricas.44 suites,3048 pruebas y12 snapshots correctos; TypeScript y ESLint correctos. Portada propia y barrido sin red10/10. Vistas Banco e Inspección comparten geometrías y reloj; revisión adicional de las diez vistas cercanas en escritorio y móvil. El analizador181 verifica además ampliación FFT, informe y caducidad del registro tras cambiar un mando. Las demás prácticas verificaron preparación, ensayo y descarga en los cuatro tamaños.

Autocrítica:48–65 palabras iniciales, PBR y piezas torneadas; las ecuaciones y el informe se revelan al pedirlos. Se corrigieron apoyos, sujeción CNC y perfiles, y se añadió mesa de proceso al177 y resortes al184. La vista de inspección no es despiece físico: oculta soportes para ver el mecanismo. No se simula hardware comercial ni certificación industrial.

Retomar: módulos _automatismos-*.js e _inspeccion-mecanismos.js; QA reproducible flujo-automatismos-177-186.mjs; capturas .salida/automatismos-177-186. Reconstruir con scripts/build-lab.mjs y el slug del descriptor. Publicación todavía pendiente; continuar hasta200 por mandato del usuario.

## Publicación confirmada
Código cbf27e8 empujado a main. Deploy exit0; Cloudflare 461e43b5-cf37-4bd5-82a6-8a436cde3779. Acceso real con login:68 destacadas, iframes165/166 y177–186 correctos, portadas HTTP200, normales cero=0 y consola limpia. La tarea continúa hasta200.

## Regresión del compartido25-10-2026
_inspeccion-mecanismos.js sincroniza también las referencias de geometría y material de las piezas. Código0ea5b0c. Inicio e inspección comprobados a1366×768: normales cero=0 y consola sin errores. Se repitieron las6003 comprobaciones numéricas del lote. Los40 flujos completos anteriores permanecen preservados aparte; esta regresión adicional es visual inicial.
