# mecanica-194 · Inspección por corrientes inducidas

Estado al 24-10-2026: implementado; pendiente auditoría, revisión visual e integración. NO declarar terminado ni publicado.

## Orden profesional y competencia practicada
OT-194 · Obtén sensibilidad≥0,15 con separación≤0,4 mm y profundidad de piel0,4–1,2 mm.

Instrumentos: Sonda, cupón con ranura y plano de impedancia.

Selecciona frecuencia y separación de una sonda para revelar una discontinuidad superficial en aluminio. La frecuencia limita la profundidad de penetración. Alejar la bobina también reduce la señal de la discontinuidad.

## Archivos exactos
- `public/labs/corrientes-inducidas-inspeccion.html` y `public/labs/_ficha-corrientes-inducidas-inspeccion.js`.
- `src/labs/mecanica-194/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-187-200.mjs --solo 194`.

## Modelo y límites
δ=√(2/(ωµσ)), µ=µ0 y σ=35 MS/m. Modelo sintético de señal para discontinuidad de0,5 mm: S=(d/δ) exp(−(d+2h)/δ). Canales complejos con fase d/δ y envolvente gaussiana del barrido.

La profundidad de piel es física; la respuesta de grieta es una función didáctica sintética, no soluciónMaxwell/FEM ni criterioNDT real. No estima tamaño de grieta real ni reproduce un equipo comercial.

Fuente del principio: https://ims.evidentscientific.com/en/learn/ndt-tutorials/eddy-current-tutorial

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.
