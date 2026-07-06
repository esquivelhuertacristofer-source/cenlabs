import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Dinámica: Leyes de Newton", mision: "¡Iniciando protocolo de Análisis Mecánico! Tu misión es dominar la dinámica de partículas analizando el movimiento de un bloque en un plano inclinado. Deberás descomponer vectorialmente la fuerza de gravedad en sus componentes tangencial y normal, calcular la magnitud de la fricción cinética y predecir la aceleración resultante del sistema. Tu éxito técnico se basará en la precisión de tu Diagrama de Cuerpo Libre (DCL) y tu capacidad para equilibrar las fuerzas fundamentales. ¡Desbloquea los secretos del movimiento y domina la segunda ley de Newton!", ecuacion: "F_net = m·a", formulaGfx: "a = g(sinθ - μ·cosθ)",
    pasos: [
      { id: 1, text: "Ajusta el ángulo de la rampa a 30°.", icon: "zap" },
      { id: 2, text: "Coloca el bloque de 2kg sobre la superficie.", icon: "box" },
      { id: 3, text: "Mide el tiempo de descenso del bloque.", icon: "timer" },
      { id: 4, text: "Calcula el coeficiente de fricción cinética si es necesario.", icon: "activity" }
    ],
    guiaMaestro: {
      objetivo: "Identificar las fuerzas normal, peso y fricción en un sistema inclinado.",
      friccion: "Dificultad al descomponer el vector peso en Px y Py.",
      puntosClave: ["Normal: Siempre perpendicular al plano.", "Fricción: Se opone al movimiento.", "Aceleración: Independiente de la masa (sin fricción)."]
    },
    conceptos: [
      { titulo: "Fuerza Normal", desc: "Reacción del plano sobre el objeto." },
      { titulo: "Fricción", desc: "Resistencia al movimiento entre superficies." },
      { titulo: "Diagrama de Cuerpo Libre", desc: "Representación vectorial de todas las fuerzas." }
    ]
  };

export default contenido;
