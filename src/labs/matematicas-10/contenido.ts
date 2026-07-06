import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Máquina de Galton", mision: "Descubre el patrón oculto en el caos aleatorio calibrando la distribución de probabilidades", ecuacion: "P(k) = (nCk) pᵏ (1-p)ⁿ⁻ᵏ", formulaGfx: "y = [1 / (σ√(2π))] exp[ -½((x-μ)/σ)² ]",
    pasos: [
      { id: 1, text: "Observa la deformación de la campana causada por el sesgo inicial de la máquina.", icon: "alert-triangle" },
      { id: 2, text: "Ajusta la probabilidad de rebote (p) para eliminar la tendencia lateral.", icon: "settings" },
      { id: 3, text: "Lanza una población masiva de esferas (n=500) para estabilizar el histograma.", icon: "cloud-rain" },
      { id: 4, text: "Confirma que la distribución física encaja con la Campana de Gauss teórica.", icon: "award" }
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
