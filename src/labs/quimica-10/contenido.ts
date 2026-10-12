import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Destilación Fraccionada", mision: "¡Iniciando protocolo de Separación Molecular! Tu objetivo es purificar una mezcla hidroalcohólica mediante destilación fraccionada de alta precisión. La mezcla 1:1 de etanol y agua hierve hacia los 83 °C; en la cabeza de la columna el vapor rico en etanol marca cerca de 78 °C. Deberás calentar con la manta apenas por encima de la ebullición para que la columna separe bien, y recoger al menos 50 mL de destilado con 85 % v/v de etanol o más. Calentar a fondo destila más rápido, pero la columna se inunda y el destilado sale más aguado. (El azeótropo, ~96 % m/m, es el límite de cualquier destilación.)", ecuacion: "ΔT = Teb(B) - Teb(A)", formulaGfx: "Etanol vs Agua",
    pasos: [
      { id: 1, text: "Ajusta la manta a 85-95 °C, apenas sobre la ebullición de la mezcla (~83 °C).", icon: "flame" },
      { id: 2, text: "Observa la cabeza de la columna: ~78 °C mientras sube vapor rico en etanol.", icon: "thermometer" },
      { id: 3, text: "No calientes a fondo: más calor es más caudal y menos separación.", icon: "zap" },
      { id: 4, text: "Recoge 50 mL con ≥ 85 % v/v en el alcoholímetro y certifica.", icon: "beaker" }
    ],
    guiaMaestro: {
      objetivo: "Diferenciar sustancias puras mediante sus puntos de ebullición constantes.",
      friccion: "El alumno debe entender que, al hervir, la mezcla se queda en su punto de burbuja (que sube despacio al empobrecerse en etanol): calentar más no sube la temperatura, sube el caudal, y una columna forzada separa peor.",
      puntosClave: ["Etanol: 78.4°C.", "Agua: 100°C.", "Fraccionamiento: Separación por volatilidad."]
    },
    conceptos: [
      { titulo: "Punto de Ebullición", desc: "Temperatura a la que la presión de vapor iguala la atmosférica." },
      { titulo: "Condensación", desc: "Cambio de fase de gas a líquido por pérdida de energía." },
      { titulo: "Mezcla Azeotrópica", desc: "Mezcla que destila con composición constante (No aplicable aquí)." }
    ]
  };

export default contenido;
