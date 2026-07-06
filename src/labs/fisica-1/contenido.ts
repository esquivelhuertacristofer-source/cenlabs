import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Tiro Parabólico", 
    videoUrl: "",
    mision: "¡Bienvenido al polígono de pruebas de balística! Tu misión es dominar la cinemática bidimensional para alcanzar objetivos estratégicos con precisión milimétrica. Deberás descomponer vectorialmente la velocidad inicial, compensar la aceleración gravitatoria y calcular el ángulo de lanzamiento óptimo. Tu éxito técnico se medirá por la capacidad de predecir el punto de impacto exacto, dominando la relación entre el tiempo de vuelo y el alcance horizontal máximo. ¡Ajusta el cañón y convierte la física en precisión balística!", ecuacion: "y = x·tan(θ) - (g·x²) / (2·v₀²·cos²θ)", formulaGfx: "V₀x = V₀·cos(θ)",
    pasos: [
      { id: 1, text: "Ajusta el cañón a un ángulo de 45° para máximo alcance.", icon: "zap" },
      { id: 2, text: "Define la velocidad inicial a 20 m/s.", icon: "activity" },
      { id: 3, text: "Dispara y observa la trayectoria parabólica.", icon: "play" },
      { id: 4, text: "Ajusta parámetros si el proyectil no alcanza el blanco.", icon: "target" }
    ],
    guiaMaestro: {
      objetivo: "Descomponer el movimiento en sus componentes rectilíneo (X) y acelerado (Y).",
      friccion: "El alumno suele olvidar que la velocidad en X es constante.",
      puntosClave: ["Ángulo óptimo: 45°.", "Gravedad: 9.81 m/s².", "Tiempo de vuelo: T = 2·V₀y / g."]
    },
    conceptos: [
      { titulo: "Velocidad Inicial", desc: "Magnitud vectorial del inicio del movimiento." },
      { titulo: "Aceleración Gravitatoria", desc: "Constante que afecta solo al eje vertical." },
      { titulo: "Alcance Máximo", desc: "Distancia horizontal total recorrida." }
    ]
  };

export default contenido;
