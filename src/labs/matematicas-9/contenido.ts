import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Sumas de Riemann", mision: "Aproxima el área bajo la parábola incrementando la resolución rectángular", ecuacion: "A ≈ Σ f(xᵢ) Δx", formulaGfx: "f(x) = -x² + 10x",
    pasos: [
      { id: 1, text: "Selecciona el método de aproximación (Izquierda, Derecha o Medio).", icon: "list" },
      { id: 2, text: "Ajusta la resolución (n) para dividir el área en rectángulos.", icon: "columns" },
      { id: 3, text: "Observa cómo disminuye el margen de error respecto al área exacta.", icon: "activity" },
      { id: 4, text: "Valida la integral cuando el error sea menor al 0.5%.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la integral definida como el límite de una suma de Riemann.",
      friccion: "El alumno puede frustrarse si no nota la diferencia entre los métodos; anímalo a usar n < 10 primero.",
      puntosClave: ["Δx: El ancho de las subdivisiones.", "Convergencia: n → ∞ implica Error → 0.", "Comparación: El punto medio suele ser más preciso con menos n."]
    },
    conceptos: [
      { titulo: "Suma de Riemann", desc: "Método para aproximar el área total mediante áreas simples." },
      { titulo: "Integral Definida", desc: "El límite de la suma de Riemann cuando el número de rectángulos tiende a infinito." },
      { titulo: "Teorema Fundamental", desc: "Relación entre la derivación y la integración." }
    ]
  };

export default contenido;
