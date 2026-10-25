# mecanica-193 · Ultrasonido para espesor y corrosión

Estado al 24-10-2026: implementado; pendiente auditoría, revisión visual e integración. NO declarar terminado ni publicado.

## Orden profesional y competencia practicada
OT-193 · Ajusta velocidad y cero: los patrones de5 y15 mm deben quedar dentro de±0,05 mm.

Instrumentos: Palpador, patrones escalonados y trazaA-scan virtual.

Calibra un medidor ultrasónico con dos patrones antes de inspeccionar una placa con pérdida de espesor. El tiempo de vuelo incluye el material y un retardo del palpador. Una sola referencia no separa velocidad y cero.

## Archivos exactos
- `public/labs/ultrasonido-espesor-corrosion.html` y `public/labs/_ficha-ultrasonido-espesor-corrosion.js`.
- `src/labs/mecanica-193/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-187-200.mjs --solo 193`.

## Modelo y límites
Material sintético con c=5900 m/s y retardo0,6 µs. τ=2d/c+τ0; dmed=cconfig(τ−τ0config)/2. Placa d(x)=10−4 exp(−((x−0,55)/0,14)²) mm. El eco recorre ida y vuelta.

Incidencia normal, un solo eco y velocidad constante. Sin dispersión, acoplamiento variable, rugosidad, tamaño del haz ni interpretación de grietas. La animación del pulso se ralentiza×100000 para hacerlo visible.

Fuente del principio: https://ims.evidentscientific.com/en/learn/ndt-tutorials/flaw-detection/calibration-concepts

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.
