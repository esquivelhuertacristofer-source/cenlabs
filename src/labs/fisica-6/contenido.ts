import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Física de Fluidos: Empuje Estático", 
    mision: "Determina la densidad de materiales desconocidos mediante el análisis del empuje hidrostático de Arquímedes.", 
    ecuacion: "E = ρ_f · g · V_sub", 
    formulaGfx: "P_ap = P_real - E",
    pasos: [
      { id: 1, text: "Pesaje Inicial: Registra la masa gravitatoria del sólido en condiciones atmosféricas (Aire).", icon: "scale" },
      { id: 2, text: "Inmersión Controlada: Sumerge el espécimen completamente en el fluido de referencia (Agua/Glicerina).", icon: "droplets" },
      { id: 3, text: "Telemetría de Empuje: Mide el peso aparente para calcular la fuerza de flotación ascendente.", icon: "activity" },
      { id: 4, text: "Certificación de Densidad: Utiliza el volumen de fluido desalojado para identificar la composición del material.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Validar experimentalmente que el empuje es igual al peso del volumen de fluido desplazado por el cuerpo.",
      friccion: "Muchos alumnos asocian el empuje a la profundidad o al peso del objeto, ignorando que es el volumen desalojado el factor determinante.",
      puntosClave: ["Principio de Arquímedes: Fuerza vertical dirigida hacia arriba.", "Peso Aparente: Reducción efectiva de masa por el empuje del fluido.", "Flotabilidad: Análisis de fuerzas competitivas en medios líquidos."]
    },
    conceptos: [
      { titulo: "Fuerza de Empuje", desc: "Fuerza neta ascendente sobre un cuerpo sumergido." },
      { titulo: "Densidad", desc: "Propiedad intensiva de la materia." },
      { titulo: "Peso Aparente", desc: "Lectura del dinamómetro dentro del fluido." }
    ]
  };

export default contenido;
