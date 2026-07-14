import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Electrónica",
  titulo: "Diseña un comparador Schmitt trigger con histéresis (LM393)",
  duracion: "35 min",
  teoria: "Un comparador simple decide \"alto\" o \"bajo\" contra un único umbral — y cuando la señal es ruidosa y cruza ese umbral lentamente, la salida rebota (chatter) decenas de veces antes de asentarse, un defecto real de cualquier comparador sin realimentación. El Schmitt trigger resuelve esto con histéresis: en vez de un umbral usa dos — VTH (umbral de subida) y VTL (umbral de bajada) — realimentando una fracción de la propia salida hacia la entrada no inversora mediante R1/R2. En la topología inversora, VTH=Vcc·R1/(R1+R2) y VTL=Vol·R1/(R1+R2), con Vol el voltaje de saturación baja del comparador; en la no inversora, ambos umbrales quedan centrados alrededor de Vcc/2 y, si R1/R2 se eligen mal, pueden salirse del rango 0–Vcc y dejar la salida enganchada en un solo estado. El simulador usa el LM393, un comparador dual de colector abierto que exige un resistor de pull-up externo (Rpu) para producir un nivel alto. Cuatro modos: Explora (R1/R2/Vcc/ruido y topología libres, con el lazo de histéresis y el osciloscopio en vivo), Predicción (VTH, VTL o el comportamiento frente a ruido antes de revelar), Medición (barrido automático de R2 que muestra cómo se abre o cierra la ventana de histéresis ΔV=VTH−VTL) y Reto (diseñar R1/R2 para que la ventana de histéresis supere el ruido pico-pico esperado, sin volverse tan ancha que el comparador pierda sensibilidad a cambios reales de la señal).",
  estado: "activo",
  simuladorHtml: "/labs/schmitt.html",
};

export default catalogo;
