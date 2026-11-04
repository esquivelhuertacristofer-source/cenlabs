# Mecánica 299 · Paro de emergencia y contactores

**Integrado localmente.**

El paro ordenado a 2 s corta la alimentación con dos contactores en serie aunque uno se suelde. El EDM bloquea el rearme. El rotor conserva movimiento por inercia tras el corte. El PFHᴅ de ejemplo es 3,2×10⁻⁷ h⁻¹. La banda numérica requiere comprobaciones adicionales para asignar un PL real.

Código en [src/labs/mecanica-299](../../src/labs/mecanica-299), escena y simulador [paro-emergencia-contactores-edm.html](../../public/labs/paro-emergencia-contactores-edm.html), modelo [_control-avanzado-diagnostico.js](../../public/labs/_control-avanzado-diagnostico.js).

Cuatro recorridos completados a 1366, 1600, 2020 y 390 px, con geometría sana y exportación de informe. Evidencia local en scripts/auditoria/.salida/control-avanzado/299-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 300.

Fuentes del modelo de seguridad y del ejemplo numérico. [ISO 13849-1:2023](https://www.iso.org/standard/73481.html) · [ISO 13850:2015](https://www.iso.org/standard/59970.html) · [DGUV, tabla 6 de bandas PFHᴅ](https://publikationen.dguv.de/widgets/pdf/download/article/270).

## Revisión visual

56 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. El botón y los contactores se distinguen del motor. El movimiento residual y el bloqueo de rearme se leen en momentos separados del ensayo.
