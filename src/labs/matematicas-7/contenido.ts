import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Ley de Snell", mision: "Deduce el índice de refracción del cristal misterioso", ecuacion: "n₁·sin(θ₁) = n₂·sin(θ₂)", formulaGfx: "n₂ = n₁ · sin(θ₁) / sin(θ₂)",
    pasos: [
      { id: 1, text: "Elige el ángulo de incidencia θ₁ con el deslizador (10°–80°).", icon: "zap" },
      { id: 2, text: "Mide en la escena el ángulo refractado θ₂; ambos se miden desde la normal.", icon: "target" },
      { id: 3, text: "Calcula n₂ = n₁·sen θ₁ / sen θ₂ con el índice n₁ del medio superior.", icon: "layers" },
      { id: 4, text: "Escribe n₂ (tolerancia ±0.05) y valida para identificar el cristal.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Aplicar funciones trigonométricas inversas para resolver problemas de óptica física.",
      friccion: "El fenómeno de Reflexión Interna Total puede confundir al alumno; es vital explicar el ángulo crítico.",
      puntosClave: ["La Normal: El ángulo se mide siempre desde la vertical.", "Límite: sin(θ) no puede ser mayor a 1.", "Densidad: A mayor n, menor es la velocidad de la luz."]
    },
    conceptos: [
      { titulo: "Refracción", desc: "Cambio de dirección de un rayo al pasar de un medio a otro." },
      { titulo: "Índice de Refracción", desc: "Medida de cuánto se reduce la velocidad de la luz en un medio." },
      { titulo: "Ángulo Crítico", desc: "Ángulo mínimo donde ocurre la reflexión total interna." }
    ]
  };

export default contenido;
