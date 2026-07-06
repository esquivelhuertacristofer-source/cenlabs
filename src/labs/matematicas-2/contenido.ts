import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Sistemas 2x2: Triangulación", mision: "Ajusta las trayectorias para localizar la señal del satélite", ecuacion: "y = mx + b", formulaGfx: "P(x,y) = L₁ ∩ L₂",
    pasos: [
      { id: 1, text: "Ajusta la pendiente m y la ordenada b de la trayectoria L1 (Cyan).", icon: "activity" },
      { id: 2, text: "Modifica los parámetros de la trayectoria L2 (Fucsia).", icon: "zap" },
      { id: 3, text: "Sigue el punto de colisión blanco hasta coincidir con el objetivo pulsante.", icon: "target" },
      { id: 4, text: "Cuando el radar marque 'Target Locked', presiona Triangular.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Hallar el punto de intersección de dos funciones lineales mediante manipulación algebraica-visual.",
      friccion: "Identificar que no existe solución cuando m1 = m2 (rectas paralelas).",
      puntosClave: ["Pendiente (m): Inclinación respecto al eje X.", "Ordenada (b): Punto de corte con el eje Y.", "Intersección: Valores de x e y que satisfacen ambas ecuaciones."]
    },
    conceptos: [
      { titulo: "Sistema 2x2", desc: "Conjunto de dos ecuaciones con dos incógnitas." },
      { titulo: "Pendiente (m)", desc: "Razón de cambio que determina la dirección de la recta." },
      { titulo: "Intersección", desc: "Punto común donde ambas trayectorias se cruzan." }
    ]
  };

export default contenido;
