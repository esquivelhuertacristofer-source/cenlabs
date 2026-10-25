# mecanica-181 · Diagnóstico de rodamientos: muestreo, FFT y frecuencias de defecto

Estado al24-10-2026: terminado y verificado localmente. Pendiente commit y publicación confirmada.

## Orden profesional y competencia practicada
OT-181 · Investiga una vibración en un motor de1800 rpm. Ajusta el analizador, registra la señal y compara el pico con la cinemática del rodamiento.

Instrumentos: Acelerómetro, tacómetro y analizador FFT virtuales; ventana Hann y registro ajustable.

Configura un analizador de vibraciones y registra un espectro que permita investigar un ruido de rodamiento. El muestreo limita qué frecuencias puedes medir. Un registro más largo separa mejor dos picos próximos.

## Archivos exactos
- `public/labs/analizador-vibraciones-rodamiento.html` y `public/labs/_ficha-analizador-vibraciones-rodamiento.js`.
- `src/labs/mecanica-181/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_automatismos-modelos.js` (funciones puras), `_automatismos-escenas.js` (construcción y actualización), `_automatismos-definiciones.js` (contratos), `_automatismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-automatismos-177-186.mjs --solo 181`.

## Modelo y límites
Eje30 Hz; rodamiento ideal de8 bolas, diámetro8 mm, diámetro de paso40 mm y contacto0°. BPFO=4fr(1−0,2)=96 Hz; BPFI=144 Hz; BSF=72 Hz; FTF=12 Hz. Señal sintética: senos a30,96,100,192,288,900 y17 Hz, con amplitudes0,45;1,4;0,6;0,25;0,15;0,2;0,03 m/s². FFT radix2 con ventana Hann, normalización por ganancia coherente y relleno de ceros. Resolución física1/T; el espaciado de bins después del relleno no la mejora.

Señal sintética conocida para aprender adquisición y comparación de frecuencias, no datos de una máquina real ni estimación de vida. Sin señal de impactos, resonancia de montaje, demodulación de envolvente, anti-alias analógico o clasificación automática comercial. No se deduce severidad a partir del color de la pieza. La vibración visible es una amplificación ilustrativa del desplazamiento equivalente a96 Hz.

Fuente del principio: https://evolution.skf.com/us/vibrations-help-find-faulty-components-3/

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

## Flujo profesional exigido
Abrir y preparar la orden, ajustar el banco, ensayar un ciclo y conservar el informe. La aceptación necesita un ensayo vigente; una modificación invalida el registro. Son escenarios didácticos con hipótesis explícitas, no habilitaciones de equipos reales.

## Verificación incremental · 24-10-2026
Auditoría numérica: 489 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 48 palabras iniciales, normales cero=0, 20 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 48 palabras iniciales, normales cero=0, 20 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 48 palabras iniciales, normales cero=0, 20 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: orden preparada, ensayo de ciclo, validación, informe descargado, quiz, tres diagnósticos, ficha y calidad completados; 48 palabras iniciales, normales cero=0, 20 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños completa; pendiente cierre visual y pruebas globales. NO afirmar publicado.

## Cierre visual y funcional
40 flujos completos en cuatro tamaños en el lote;6003 comprobaciones numéricas.44 suites,3048 pruebas y12 snapshots correctos; TypeScript y ESLint correctos. Portada propia y barrido sin red10/10. Vistas Banco e Inspección comparten geometrías y reloj; revisión adicional de las diez vistas cercanas en escritorio y móvil. El analizador181 verifica además ampliación FFT, informe y caducidad del registro tras cambiar un mando. Las demás prácticas verificaron preparación, ensayo y descarga en los cuatro tamaños.

Autocrítica:48–65 palabras iniciales, PBR y piezas torneadas; las ecuaciones y el informe se revelan al pedirlos. Se corrigieron apoyos, sujeción CNC y perfiles, y se añadió mesa de proceso al177 y resortes al184. La vista de inspección no es despiece físico: oculta soportes para ver el mecanismo. No se simula hardware comercial ni certificación industrial.

Retomar: módulos _automatismos-*.js e _inspeccion-mecanismos.js; QA reproducible flujo-automatismos-177-186.mjs; capturas .salida/automatismos-177-186. Reconstruir con scripts/build-lab.mjs y el slug del descriptor. Publicación todavía pendiente; continuar hasta200 por mandato del usuario.

## Publicación confirmada
Código cbf27e8 empujado a main. Deploy exit0; Cloudflare 461e43b5-cf37-4bd5-82a6-8a436cde3779. Acceso real con login:68 destacadas, iframes165/166 y177–186 correctos, portadas HTTP200, normales cero=0 y consola limpia. La tarea continúa hasta200.
