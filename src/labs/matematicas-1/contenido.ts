import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Explorador de Cuadráticas", 
    videoUrl: "",
    mision: "Ajusta los coeficientes para empatar la trayectoria objetivo", ecuacion: "f(x) = ax² + bx + c", formulaGfx: "Δ = b² - 4ac",
    pasos: [
      { id: 1, text: "Ajusta el coeficiente 'a' para controlar la apertura y concavidad.", icon: "zap" },
      { id: 2, text: "Modifica 'b' para desplazar el vértice horizontalmente.", icon: "activity" },
      { id: 3, text: "Cambia 'c' para ajustar la intersección con el eje Y.", icon: "target" },
      { id: 4, text: "Valida la función cuando ambas parábolas se superpongan.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Analizar cómo los coeficientes a, b y c transforman la gráfica de una función cuadrática.",
      friccion: "El alumno suele tener dificultad para entender el desplazamiento horizontal causado por 'b' sin afectar 'a'.",
      puntosClave: ["Si a > 0, cóncava hacia arriba; si a < 0, hacia abajo.", "Si Δ < 0, la parábola no corta el eje X.", "El vértice es el punto máximo o mínimo."]
    },
    conceptos: [
      { titulo: "Discriminante (Δ)", desc: "Indica el número de raíces reales de la función." },
      { titulo: "Vértice", desc: "Punto de inflexión donde la función cambia de dirección." },
      { titulo: "Raíces", desc: "Puntos donde la gráfica cruza el eje X (f(x) = 0)." }
    ]
  };

export default contenido;
