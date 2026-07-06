import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Celdas Galvánicas", mision: "¡Bienvenido al motor de la Electroquímica! Tu misión es diseñar y ensamblar una celda galvánica funcional capaz de generar energía eléctrica espontánea. Deberás seleccionar los electrodos adecuados, cerrar el circuito iónico mediante un puente salino y verificar la diferencia de potencial. Tu objetivo técnico es lograr un voltaje positivo, lo que certifica la espontaneidad de la reacción según la ecuación de Nernst. Domina el flujo de electrones y convierte el potencial químico en fuerza electromotriz.", ecuacion: "E°celda = E°cat - E°anod", formulaGfx: "Redox: e- Flow",
    pasos: [
      { id: 1, text: "Coloca los dos electrodos metálicos en los vasos de precipitados.", icon: "beaker" },
      { id: 2, text: "Instala el Puente Salino para cerrar el circuito iónico.", icon: "zap" },
      { id: 3, text: "Conecta los cables del voltímetro a ambos electrodos.", icon: "activity" },
      { id: 4, text: "Identifica el ánodo y cátodo para lograr un voltaje positivo.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Identificar los componentes de una celda galvánica y predecir el potencial de celda.",
      friccion: "El alumno suele confundir la polaridad. Si el voltaje es negativo, los cables están invertidos con respecto al flujo espontáneo de electrones.",
      puntosClave: ["CatAn: Cátodo-Anodo.", "Ánodo: Oxidación (Menor E°).", "Cátodo: Reducción (Mayor E°)."]
    },
    conceptos: [
      { titulo: "Ánodo", desc: "Electrodo donde ocurre la oxidación (pérdida de electrones)." },
      { titulo: "Cátodo", desc: "Electrodo donde ocurre la reducción (ganancia de electrones)." },
      { titulo: "Puente Salino", desc: "Tubo que permite el flujo de iones para mantener la electroneutralidad." }
    ]
  };

export default contenido;
