import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Leyes de los Gases", 
    videoUrl: "",
    tituloEn: "Gas Laws",
    mision: "¡Atención, investigador! Nos encontramos en la Cámara de Pruebas Térmicas de CEN Labs. Tu objetivo es aplicar la ecuación del gas ideal, PV = nRT. Con el termostato (T), el compresor (V) y la inyección de gas (n) deberás llevar la cámara a la presión objetivo asignada en tu telemetría (±0.1 atm) sin rebasar el límite de seguridad de 7 atm. Antes de mover un control, predice con la ecuación hacia dónde irá la presión: a V constante P ∝ T (Gay-Lussac) y a T constante P ∝ 1/V (Boyle).", 
    misionEn: "Ideal gas law: reach a target pressure by adjusting T, V and n",
    ecuacion: "P = nRT / V", 
    formulaGfx: "R = 0.08206 atm·L/(mol·K)",
    pasos: [
      { id: 1, text: "Calcula qué T o V necesitas con PV = nRT.", textEn: "Compute the T or V you need with PV = nRT.", icon: "flame" },
      { id: 2, text: "Observa el aumento de colisiones en el manómetro digital.", textEn: "Observe the increase in collisions on the digital manometer.", icon: "bar-chart" },
      { id: 3, text: "No rebases 7 atm: la cámara colapsa.", textEn: "Do not exceed 7 atm: the chamber fails.", icon: "box" },
      { id: 4, text: "Sincroniza la presión con el objetivo y valida resultados.", textEn: "Sync the pressure with the target and validate results.", icon: "save" }
    ],
    guiaMaestro: {
      objetivo: "Aplicar PV = nRT para predecir y alcanzar una presión.",
      friccion: "El alumno debe entender que la presión es el resultado de choques cinéticos.",
      puntosClave: ["Gay-Lussac: P ∝ T a V constante.", "Cámara de presión: colapsa por encima de 7 atm.", "Energía Cinética: 1/2 mv²."]
    },
    conceptos: [
      { titulo: "Presión (P)", desc: "Fuerza ejercida por unidad de área." },
      { titulo: "Temperatura (K)", desc: "Medida de la energía cinética promedio." },
      { titulo: "Volumen (L)", desc: "Espacio ocupado por la masa de gas." }
    ]
  };

export default contenido;
