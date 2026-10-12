import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Máquina de Galton", mision: "Predice μ y σ de la Binomial(10, p) y compruébalas con una muestra de al menos 200 bolitas", ecuacion: "P(k) = (nCk) pᵏ (1-p)ⁿ⁻ᵏ", formulaGfx: "y = [1 / (σ√(2π))] exp[ -½((x-μ)/σ)² ]",
    pasos: [
      { id: 1, text: "Lee la probabilidad p de desvío a la derecha (si la cambias, la máquina se vacía).", icon: "settings" },
      { id: 2, text: "Calcula μ = n·p y σ = √(n·p·(1 − p)) con n = 10 filas y escríbelas en el panel.", icon: "alert-triangle" },
      { id: 3, text: "Suelta bolitas hasta reunir al menos 200 en los contenedores.", icon: "cloud-rain" },
      { id: 4, text: "Valida: se comprueba tu predicción (±0.05) y el ajuste χ² del histograma a la binomial.", icon: "award" }
    ],
    guiaMaestro: {
      objetivo: "Demostrar el Teorema del Límite Central de forma empírica.",
      friccion: "Los alumnos suelen confundir aleatoriedad con desorden total. Ayúdales a ver que con n grande, el orden emerge.",
      puntosClave: ["Distribución Binomial: Modelo de cada rebote individual.", "Distribución Normal: Límite de la binomial cuando n es grande.", "Sesgo: Cómo p ≠ 0.5 desplaza la media μ."]
    },
    conceptos: [
      { titulo: "Independencia", desc: "Cada rebote no depende del anterior ni influye en el siguiente." },
      { titulo: "Límite Central", desc: "La suma de variables independientes tiende a una distribución normal." },
      { titulo: "Probabilidad Binomial", desc: "Modelo que cuenta éxitos en una serie de ensayos Bernoulli." }
    ]
  };

export default contenido;
