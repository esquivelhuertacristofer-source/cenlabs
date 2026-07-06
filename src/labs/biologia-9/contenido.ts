import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Sistema Digestivo", mision: "Cataliza macronutrientes mediante enzimas y optimización de pH", ecuacion: "Enzima + Sustrato", formulaGfx: "pH Óptimo",
    pasos: [
      { id: 1, text: "Analiza el macronutriente ingerido por el paciente en la bitácora.", icon: "target" },
      { id: 2, text: "Selecciona la enzima catalizadora específica (Llave-Cerradura).", icon: "zap" },
      { id: 3, text: "Ajusta el pH del órgano según el rango óptimo de la enzima.", icon: "thermometer" },
      { id: 4, text: "Inyecta la enzima y monitorea la absorción en el torrente sanguíneo.", icon: "activity" }
    ],
    guiaMaestro: {
      objetivo: "Visualizar el proceso de hidrólisis enzimática y la dependencia del pH en la digestión.",
      friccion: "Desnaturalización: Si el alumno inyecta pepsina a pH 7, esta se deformará. Aprenderá por qué el estómago DEBE ser ácido para digerir proteínas.",
      puntosClave: ["Catálisis: Aceleración de reacciones químicas por enzimas.", "Especificidad: Cada enzima actúa sobre un sustrato único.", "Microvellosidades: Aumento de superficie para absorción de monómeros."]
    },
    conceptos: [
      { titulo: "Enzima", desc: "Proteína que actúa como catalizador biológico, aumentando la velocidad de una reacción." },
      { titulo: "Hidrólisis", desc: "Reacción química en la que una molécula de agua rompe uno o más enlaces químicos." },
      { titulo: "Macronutriente", desc: "Sustancia necesaria en grandes cantidades (Carbohidratos, Proteínas, Lípidos)." }
    ]
  };

export default contenido;
