import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Leyes de los Gases", 
    videoUrl: "",
    tituloEn: "Gas Laws",
    mision: "¡Atención, investigador! Nos encontramos en la Cámara de Pruebas Térmicas de CEN Labs. Tu objetivo es validar experimentalmente la Ley de Gay-Lussac. Deberás manipular la energía cinética de las partículas de gas aumentando la temperatura del sistema, mientras mantienes el volumen rigurosamente constante en 10 litros. Tu meta es alcanzar la presión objetivo asignada en tu telemetría sin comprometer la integridad estructural del contenedor. ¡Analiza cómo cada grado Kelvin impacta en la fuerza de colisión molecular!", 
    misionEn: "Study of Pressure vs Temperature (Gay-Lussac's Law)",
    ecuacion: "P = T / (30 · V)", 
    formulaGfx: "V = constante",
    pasos: [
      { id: 1, text: "Ajusta el mechero para variar la temperatura del sistema.", textEn: "Adjust the burner to vary the system temperature.", icon: "flame" },
      { id: 2, text: "Observa el aumento de colisiones en el manómetro digital.", textEn: "Observe the increase in collisions on the digital manometer.", icon: "bar-chart" },
      { id: 3, text: "Mantén el volumen en 10L para certificar la Ley de Gay-Lussac.", textEn: "Maintain the volume at 10L to certify Gay-Lussac's Law.", icon: "box" },
      { id: 4, text: "Sincroniza la presión con el objetivo y valida resultados.", textEn: "Sync the pressure with the target and validate results.", icon: "save" }
    ],
    guiaMaestro: {
      objetivo: "Analizar la relación directamente proporcional entre P y T.",
      friccion: "El alumno debe entender que la presión es el resultado de choques cinéticos.",
      puntosClave: ["Gay-Lussac: P ∝ T a V constante.", "Cámara de Presión: Riesgo mecánico a > 5.0 atm.", "Energía Cinética: 1/2 mv²."]
    },
    conceptos: [
      { titulo: "Presión (P)", desc: "Fuerza ejercida por unidad de área." },
      { titulo: "Temperatura (K)", desc: "Medida de la energía cinética promedio." },
      { titulo: "Volumen (L)", desc: "Espacio ocupado por la masa de gas." }
    ]
  };

export default contenido;
