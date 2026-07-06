import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Ingeniería: Suspensión Rover (Ley Hooke)", mision: "¡Protocolo de Estabilidad de Chasis Activo! Tu misión como ingeniero de sistemas de aterrizaje es calibrar con precisión milimétrica la rigidez del amortiguador principal para la próxima misión exploratoria. Utilizando la Ley de Hooke, deberás someter el pistón telescópico a cargas estáticas variables, registrar la telemetría láser de compresión y determinar la constante elástica (k) del ensamble. El éxito de la misión depende de tu capacidad para predecir la respuesta mecánica del sistema y asegurar que la energía potencial elástica almacenada no exceda los límites de fatiga del material. ¡Asegura el aterrizaje y domina la elasticidad industrial!", ecuacion: "F = -k·x", formulaGfx: "Ep = ½·k·x²",
    pasos: [
      { id: 1, text: "Aplica masa de prueba sobre el pistón telescópico.", icon: "box" },
      { id: 2, text: "Lee la telemetría láser de compresión estática (x).", icon: "target" },
      { id: 3, text: "Registra la elongación en la matriz de análisis.", icon: "activity" },
      { id: 4, text: "Calcula la rigidez (k) del ensamble mecánico.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Analizar la respuesta elástica de un sistema de suspensión sometido a carga estática.",
      friccion: "No relacionar correctamente la compresión (x) con la fuerza aplicada por la gravedad sobre la masa.",
      puntosClave: ["Rigidez Mecánica (k): Capacidad de absorción del impacto.", "Límite Elástico: Riesgo de falla catastrófica del chasis.", "Amortiguación: Disipación de energía cinética al tocar la superficie."]
    },
    conceptos: [
      { titulo: "Constante de Rigidez", desc: "Resistencia del pistón a la deformación axial." },
      { titulo: "Compresión", desc: "Reducción de longitud respecto a su estado libre." },
      { titulo: "Energía Potencial", desc: "Energía almacenada en el amortiguador lista para disiparse." }
    ]
  };

export default contenido;
