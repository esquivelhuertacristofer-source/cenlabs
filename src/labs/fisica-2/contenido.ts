import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Dinámica: Leyes de Newton", mision: "¡Iniciando protocolo de Análisis Mecánico! Tu misión es dominar la dinámica de partículas analizando el movimiento de un bloque en un plano inclinado. Deberás descomponer vectorialmente la fuerza de gravedad en sus componentes tangencial y normal, calcular la magnitud de la fricción cinética y predecir la aceleración resultante del sistema. Tu éxito técnico se basará en la precisión de tu Diagrama de Cuerpo Libre (DCL) y tu capacidad para equilibrar las fuerzas fundamentales. ¡Desbloquea los secretos del movimiento y domina la segunda ley de Newton!", ecuacion: "F_net = m·a", formulaGfx: "a = (F − m·g·sinθ ∓ μk·m·g·cosθ) / m",
    pasos: [
      { id: 1, text: "Ajusta el ángulo de la rampa, la fuerza aplicada F y la carga.", icon: "zap" },
      { id: 2, text: "Decide si la fricción estática lo sostiene (|F − m·g·sinθ| ≤ μs·N).", icon: "box" },
      { id: 3, text: "Predice la aceleración con la fricción cinética y escríbela.", icon: "timer" },
      { id: 4, text: "Suelta el bloque y compara tu predicción con la medición.", icon: "activity" }
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
