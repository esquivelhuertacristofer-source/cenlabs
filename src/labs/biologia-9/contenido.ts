import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Sistema Digestivo", mision: "Hidroliza por completo el alimento asignado en un tubo de ensayo y ubica dónde ocurre esa digestión y la absorción", ecuacion: "E + S ⇌ ES → E + P", formulaGfx: "actividad = f(pH, sustrato, bilis)",
    pasos: [
      { id: 1, text: "Identifica el sustrato del alimento asignado (almidón, proteína o lípidos).", icon: "target" },
      { id: 2, text: "Elige una enzima, el pH del tampón y si añades sales biliares.", icon: "zap" },
      { id: 3, text: "Incuba 30 min y lee el resultado: sin reacción, desnaturalizada, parcial o completa.", icon: "thermometer" },
      { id: 4, text: "Indica en qué órgano actúa tu enzima y dónde se absorben los productos.", icon: "activity" }
    ],
    guiaMaestro: {
      objetivo: "Visualizar el proceso de hidrólisis enzimática y la dependencia del pH en la digestión.",
      friccion: "Especificidad ≠ desnaturalización: una enzima con el sustrato equivocado no reacciona pero sigue intacta; una enzima a un pH que su estructura no tolera se desnaturaliza. Con las grasas, además, importa la superficie de contacto agua-lípido.",
      puntosClave: ["Especificidad: cada enzima reconoce su sustrato.", "pH óptimo: cada enzima trabaja mejor al pH del órgano donde se secreta.", "Las sales biliares emulsionan; no son enzimas.", "Las vellosidades y microvellosidades multiplican la superficie de absorción."]
    },
    conceptos: [
      { titulo: "Enzima", desc: "Proteína que actúa como catalizador biológico, aumentando la velocidad de una reacción." },
      { titulo: "Hidrólisis", desc: "Reacción química en la que una molécula de agua rompe uno o más enlaces químicos." },
      { titulo: "Macronutriente", desc: "Sustancia necesaria en grandes cantidades (Carbohidratos, Proteínas, Lípidos)." }
    ]
  };

export default contenido;
