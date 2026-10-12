import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Explorador de Cuadráticas", 
    videoUrl: "",
    mision: "Deduce a, b y c de una trayectoria a partir de tres puntos medidos", ecuacion: "f(x) = ax² + bx + c", formulaGfx: "Δ = b² - 4ac",
    pasos: [
      { id: 1, text: "Lee los tres puntos medidos de la trayectoria objetivo (x = −1, 0 y 1).", icon: "target" },
      { id: 2, text: "Plantea el sistema: f(0) = c, f(1) − f(−1) = 2b y f(1) + f(−1) = 2a + 2c.", icon: "activity" },
      { id: 3, text: "Ajusta a, b y c: la tabla compara tu f(x) con cada punto medido.", icon: "zap" },
      { id: 4, text: "Comprueba Δ y el vértice h en la bitácora y valida.", icon: "check" }
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
