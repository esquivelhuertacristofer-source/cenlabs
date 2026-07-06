import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Fotosíntesis", mision: "Encuentra la luz ideal para producir 50ml de Oxígeno", ecuacion: "6CO₂ + 6H₂O + Luz → C₆H₁₂O₆ + 6O₂", formulaGfx: "O₂ ∝ 1/d² · ColorEff",
    pasos: [
      { id: 1, text: "Ajusta la distancia de la lámpara sobre el riel.", icon: "move" },
      { id: 2, text: "Selecciona una longitud de onda (color) del espectro.", icon: "palette" },
      { id: 3, text: "Monitorea la tasa de burbujeo en el tubo de recolección.", icon: "droplets" },
      { id: 4, text: "Alcanza la meta de 50ml de O₂ antes del tiempo límite.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Visualizar el efecto de la intensidad y longitud de onda en la tasa metabólica vegetal.",
      friccion: "La Trampa Verde: Los alumnos suelen creer que la planta absorbe luz verde. Al ver que no produce O₂, descubrirán el papel de la clorofila.",
      puntosClave: ["Luz Roja/Azul: Máxima absorción.", "Distancia: La intensidad cae con el cuadrado de la distancia.", "Fotólisis: Ruptura de agua para liberar O₂."]
    },
    conceptos: [
      { titulo: "Clorofila", desc: "Pigmento primordial de las plantas que absorbe luz violeta, azul y roja." },
      { titulo: "Espectro de Absorción", desc: "Rango de longitudes de onda que un pigmento puede captar para realizar trabajo." },
      { titulo: "Fotólisis del Agua", desc: "Etapa de la fase clara donde se libera oxígeno como subproducto." }
    ]
  };

export default contenido;
