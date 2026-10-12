import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Tiro Parabólico", 
    videoUrl: "",
    mision: "¡Bienvenido al polígono de pruebas de balística! Tu misión es dominar la cinemática bidimensional para alcanzar objetivos estratégicos con precisión milimétrica. Deberás descomponer vectorialmente la velocidad inicial, compensar la aceleración gravitatoria y calcular el ángulo de lanzamiento óptimo. Tu éxito técnico se medirá por la capacidad de predecir el punto de impacto exacto, dominando la relación entre el tiempo de vuelo y el alcance horizontal máximo. ¡Ajusta el cañón y convierte la física en precisión balística!", ecuacion: "y = x·tan(θ) - (g·x²) / (2·v₀²·cos²θ)", formulaGfx: "V₀x = V₀·cos(θ)",
    pasos: [
      { id: 1, text: "Lee la misión: altura del cañón, posición y altura del muro, diana y viento.", icon: "zap" },
      { id: 2, text: "Estima ángulo y velocidad con y(x) para librar el muro y llegar a la diana.", icon: "activity" },
      { id: 3, text: "Dispara y compara la traza real con tu cálculo.", icon: "play" },
      { id: 4, text: "Corrige (el aire acorta el alcance, el viento lo desvía) hasta confirmar el impacto.", icon: "target" }
    ],
    guiaMaestro: {
      objetivo: "Descomponer el movimiento en sus componentes rectilíneo (X) y acelerado (Y).",
      friccion: "El alumno suele olvidar que la velocidad en X es constante.",
      puntosClave: ["El ángulo de 45° solo maximiza el alcance en terreno plano y sin aire.", "Gravedad: 9.81 m/s² en la Tierra (cambia por planeta).", "Con altura inicial y₀ el tiempo de vuelo sale de y(t) = 0, no de 2·V₀y/g."]
    },
    conceptos: [
      { titulo: "Velocidad Inicial", desc: "Magnitud vectorial del inicio del movimiento." },
      { titulo: "Aceleración Gravitatoria", desc: "Constante que afecta solo al eje vertical." },
      { titulo: "Alcance Máximo", desc: "Distancia horizontal total recorrida." }
    ]
  };

export default contenido;
