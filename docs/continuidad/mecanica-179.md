# mecanica-179 · Selección de pinza paralela: fuerza, presión de contacto y margen de agarre

Estado al24-10-2026: terminado y verificado localmente. Pendiente commit y publicación confirmada.

## Orden profesional y competencia practicada
OT-179 · Debes elegir una pinza compacta para una pieza de2 kg con caras delicadas. Presenta capacidad de agarre, presión y dimensión del mecanismo.

Instrumentos: Medición virtual de abertura, fuerza y presión; útil de apoyo para la prueba.

Selecciona la geometría y el par de una pinza que sujete una pieza sin deslizar ni dañar sus superficies. La misma fuerza de motor produce distintos esfuerzos según las palancas. Más fuerza de agarre también aumenta la presión sobre la pieza.

## Archivos exactos
- `public/labs/seleccion-pinza-palancas.html` y `public/labs/_ficha-seleccion-pinza-palancas.js`.
- `src/labs/mecanica-179/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_automatismos-modelos.js` (funciones puras), `_automatismos-escenas.js` (construcción y actualización), `_automatismos-definiciones.js` (contratos), `_automatismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-automatismos-177-186.mjs --solo 179`.

## Modelo y límites
Separación de pivotes200 mm, pieza de65 mm. Al contactar: cosθ=(0,1−0,065/2)/L. Trabajo virtual: T=2 F L sinθ. Coeficiente de fricción0,5 en cada mordaza, capacidad2μF. Margen=2μF/(2g). Área de cada almohadilla100 mm², presión F/A. La apertura usa transiciones quínticas de un segundo; la fuerza de cierre nominal se aplica en el reposo de contacto. No se calcula el transitorio de fuerza.

Agarre simétrico por fricción y geometría rígida ideal. No incluye flexión de dedos, dinámica de caída, desgaste, grasa, variación real de μ ni control del motor. La pieza permanece apoyada en el útil; el margen es una predicción, no una prueba de elevación real. Límites de presión y dimensiones didácticos, no ficha comercial.

Fuente del principio: https://digitaledition.assemblymag.com/april-2021/assembly-how-to-schunk/

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

## Flujo profesional exigido
Abrir y preparar la orden, ajustar el banco, ensayar un ciclo y conservar el informe. La aceptación necesita un ensayo vigente; una modificación invalida el registro. Son escenarios didácticos con hipótesis explícitas, no habilitaciones de equipos reales.

## Verificación incremental · 24-10-2026
Auditoría numérica: 486 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 60 palabras iniciales, normales cero=0, 16 drawcalls, objeto 63.8 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 60 palabras iniciales, normales cero=0, 16 drawcalls, objeto 63.8 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 60 palabras iniciales, normales cero=0, 16 drawcalls, objeto 63.8 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 60 palabras iniciales, normales cero=0, 16 drawcalls, objeto 63.7 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños completa; pendiente cierre visual y pruebas globales. NO afirmar publicado.

## Cierre visual y funcional
40 flujos completos en cuatro tamaños en el lote;6003 comprobaciones numéricas.44 suites,3048 pruebas y12 snapshots correctos; TypeScript y ESLint correctos. Portada propia y barrido sin red10/10. Vistas Banco e Inspección comparten geometrías y reloj; revisión adicional de las diez vistas cercanas en escritorio y móvil. El analizador181 verifica además ampliación FFT, informe y caducidad del registro tras cambiar un mando. Las demás prácticas verificaron preparación, ensayo y descarga en los cuatro tamaños.

Autocrítica:48–65 palabras iniciales, PBR y piezas torneadas; las ecuaciones y el informe se revelan al pedirlos. Se corrigieron apoyos, sujeción CNC y perfiles, y se añadió mesa de proceso al177 y resortes al184. La vista de inspección no es despiece físico: oculta soportes para ver el mecanismo. No se simula hardware comercial ni certificación industrial.

Retomar: módulos _automatismos-*.js e _inspeccion-mecanismos.js; QA reproducible flujo-automatismos-177-186.mjs; capturas .salida/automatismos-177-186. Reconstruir con scripts/build-lab.mjs y el slug del descriptor. Publicación todavía pendiente; continuar hasta200 por mandato del usuario.
