import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Destilación Fraccionada", mision: "¡Iniciando protocolo de Separación Molecular! Tu objetivo es purificar una mezcla hidroalcohólica mediante destilación fraccionada de alta precisión. Deberás controlar la termodinámica de la manta calefactora para estabilizar el sistema en el punto de ebullición del etanol (78.4°C). Tu éxito técnico depende de mantener una isoterma constante que evite la co-evaporación del agua, asegurando un destilado con pureza superior al 98%. ¡Domina el equilibrio líquido-vapor y recupera el componente volátil con grado analítico!", ecuacion: "ΔT = Teb(B) - Teb(A)", formulaGfx: "Etanol vs Agua",
    pasos: [
      { id: 1, text: "Ajusta la manta de calentamiento a 80-85°C para evaporar el etanol.", icon: "flame" },
      { id: 2, text: "Observa el punto de ebullición del etanol en el termómetro.", icon: "thermometer" },
      { id: 3, text: "Controla que la temperatura no exceda los 90°C para evitar co-evaporación.", icon: "zap" },
      { id: 4, text: "Recupera el volumen total de etanol y valida la pureza.", icon: "beaker" }
    ],
    guiaMaestro: {
      objetivo: "Diferenciar sustancias puras mediante sus puntos de ebullición constantes.",
      friccion: "El alumno debe entender que la temperatura de la mezcla se mantiene constante durante el cambio de fase. Si sube de 90°C, está forzando la ebullición del agua.",
      puntosClave: ["Etanol: 78.4°C.", "Agua: 100°C.", "Fraccionamiento: Separación por volatilidad."]
    },
    conceptos: [
      { titulo: "Punto de Ebullición", desc: "Temperatura a la que la presión de vapor iguala la atmosférica." },
      { titulo: "Condensación", desc: "Cambio de fase de gas a líquido por pérdida de energía." },
      { titulo: "Mezcla Azeotrópica", desc: "Mezcla que destila con composición constante (No aplicable aquí)." }
    ]
  };

export default contenido;
