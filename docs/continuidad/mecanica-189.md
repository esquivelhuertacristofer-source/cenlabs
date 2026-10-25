# mecanica-189 · Sintonía de un servoeje PD

Estado al 24-10-2026: implementado; pendiente auditoría, revisión visual e integración. NO declarar terminado ni publicado.

## Orden profesional y competencia practicada
OT-189 · Sigue el escalón con sobreimpulso≤5 %, establecimiento≤0,8 s y fuerza≤150 N.

Instrumentos: Servo lineal, encoder y respuesta a escalón.

Ajusta un eje de posicionamiento para alcanzar100 mm con rapidez, poco rebote y fuerza admisible. La ganancia proporcional empuja hacia la consigna. La derivativa frena el movimiento; ambas cambian la respuesta del carro.

## Archivos exactos
- `public/labs/sintonia-servoeje-pd.html` y `public/labs/_ficha-sintonia-servoeje-pd.js`.
- `src/labs/mecanica-189/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-187-200.mjs --solo 189`.

## Modelo y límites
M x″+(B+Kd)x′+Kp x=Kp r, M=5 kg, B=10 N·s/m, r=0,1 m. Solución cerrada de segundo orden incluyendo amortiguamiento crítico y sobreamortiguado. Fuerza=Kp(r−x)−Kd x′. Estadísticas por barrido0–8 s cada5 ms.

PD ideal, sin integral, muestreo, saturación del actuador, ruido, fricción seca ni retardo. El límite de fuerza se comprueba pero no se impone como saturación. Cada3 s se repite un escalón independiente.

Fuente del principio: https://www.ni.com/en/shop/labview/pid-theory-explained.html

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.
