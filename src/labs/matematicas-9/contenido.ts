import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Sumas de Riemann", mision: "Aproxima ∫₀¹⁰ (0.1x² + 1) dx con el método del reto y un error relativo bajo su tolerancia", ecuacion: "A ≈ Σ f(xᵢ) Δx", formulaGfx: "f(x) = 0.1x² + 1",
    pasos: [
      { id: 1, text: "Lee el reto: método asignado y error relativo máximo (2 % con extremos, 0.1 % con punto medio).", icon: "list" },
      { id: 2, text: "Selecciona ese método y empieza con pocos rectángulos para ver el error.", icon: "columns" },
      { id: 3, text: "Calcula la integral exacta con la regla de Barrow y compárala con la suma.", icon: "activity" },
      { id: 4, text: "Aumenta n hasta que el error relativo quede bajo la tolerancia y valida.", icon: "check" }
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
