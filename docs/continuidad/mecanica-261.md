# mecanica-261 · Unión atornillada: precarga y separación

**Implementación y revisión individual completas. Local, sin commit, push ni publicación del bloque B.** Pendiente la batería global y la revisión estable del conjunto 261–270.

## Diferencia respecto del catálogo
No hay unión atornillada con reparto de carga por rigidez y transición de contacto. No repite la precarga eléctrica HV del 191 ni la precarga de acumulador del 107.

## Modelo y límites
Rigideces dadas: kb=200 MN/m, kj=800 MN/m; C=kb/(kb+kj)=0,2. Antes de separación: Fb=Fi+CP, Fc=Fi−(1−C)P. Psep=Fi/(1−C). Después: Fb=P, Fc=0 y abertura=(P−Psep)/kb. Extensión desde el estado precargado=(Fb−Fi)/kb. Área resistente didáctica 84,3 mm². Par orientativo T=K d Fi, K=0,20 y d=12 mm.

Carga axial concéntrica, dos rigideces constantes y contacto unilateral; sin palanca de brida, plastificación, asentamiento, dispersión de rozamiento ni aflojamiento. Parámetros de ejemplo, no certificación de un tornillo ni clase normativa. Las deformaciones axiales se amplían ×80 respecto de la escala geométrica (25 unidades/m). Rosca y herramienta ilustrativas; la precarga se prescribe, no se deduce del giro de la llave. Demostración cuasiestática de 8 s entre 50 y 100 % de carga.

## Archivos y continuación
`public/labs/_elementos-*.js`, `union-atornillada-precarga.html`, `_ficha-union-atornillada-precarga.js`, descriptor en `scripts/lab-src/`, `src/labs/mecanica-261/`. Fuente: https://ntrs.nasa.gov/citations/19900009424

## Verificación individual · 31-10-2026

7.845 comprobaciones numéricas correctas: referencias de 29 kN/4 kN, equilibrio, compatibilidad a partir de longitudes independientes, continuidad en separación y condición de contacto unilateral. Fuente consultada en PDF original NASA RP-1228, página impresa 13 (PDF17) para rigideces, y PDF21 para par orientativo; el valor K=0,20 es una hipótesis, no una recomendación de apriete.

Cuatro recorridos completos correctos: 1366×768, 1600×900, 2020×1055 DPR1,25 y 390×844. Firma individual inicial `5cd776ae7b27265f087c379663d02ff484c0bce3db70f99b88d6cb2161a17489`. Pruebas con clics de orden, adquisición, validación, quiz barajado, tres diagnósticos, TXT, instrumento, ficha, calidad media y arrastre. Extremos de ambos mandos en escritorio/móvil: abertura y compresión de las mallas contra el estado del modelo. Cero normales nulas/NaN/errores; 26 llamadas y 19.654 triángulos; 65 % de encuadre y 52 palabras de prosa inicial. Barrido oficial sano.

Portada `public/images/mecanica/prac_261.webp` revisada visualmente. Vista inicial, sección, móvil e instrumento examinados: la sección descubre tornillo, arandelas, rosca y contacto; los apoyos sostienen la brida inferior, sin piezas flotantes. Bastidor azul y metales limpios, sin pizarra ni saturación de texto. La escena general es sobria y la inspección acerca el fenómeno; se explicita la ampliación de deformación. Se corrigió un encabezado ausente detectado en la primera captura.

15 clips narrados con Qwen3-TTS, molde_consignas_4, lote8, una toma; duración y hashes comprobados. Manifiesto 176→177, sin eliminar anteriores; 7.720 MP3 totales. Evidencia local `scripts/auditoria/.salida/elementos-261-270/`, voz-261.json.

Retomar en 262: comparación de unión soldada y remachada bajo carga excéntrica. Al ampliar módulos compartidos cambiará la firma global; repetir la verificación del conjunto estable antes de declarar el bloque terminado. Faltan pruebas globales del bloque, nueve laboratorios, commit y publicación. La autorización pendiente del primer push/despliegue corresponde sólo al bloque A `0b9ddf8`.

QA 1366×768 DPR1: inicio correctos; revisión 1eb5ffd99fc4338223fc6ab37623342760942236ec2fa4fce5254349ccfc3f70; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 5cd776ae7b27265f087c379663d02ff484c0bce3db70f99b88d6cb2161a17489; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 5cd776ae7b27265f087c379663d02ff484c0bce3db70f99b88d6cb2161a17489; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 5cd776ae7b27265f087c379663d02ff484c0bce3db70f99b88d6cb2161a17489; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 5cd776ae7b27265f087c379663d02ff484c0bce3db70f99b88d6cb2161a17489; normales cero=0, sin errores ni desbordamiento.

1 noviembre: portada regenerada con HUD anidado oculto y revisada visualmente. En263 esto también incorpora el ajuste de eje/taladro descrito previamente. No equivale a publicación ni al cierre global de B.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión e12d5c4264b3951026367eb828736be72803e61668bce34ad5114aeafb4e9e23; normales cero=0, sin errores ni desbordamiento.
