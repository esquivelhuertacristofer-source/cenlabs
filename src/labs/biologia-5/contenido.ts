import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Leyes de Mendel", mision: "Valida la proporción 9:3:3:1 de Mendel con una población masiva", ecuacion: "P(AB) = P(A) \cdot P(B)", formulaGfx: "9 : 3 : 3 : 1",
    pasos: [
      { id: 1, text: "Configura el genotipo de los parentales (padre y madre).", icon: "dna" },
      { id: 2, text: "Analiza el Cuadro de Punnett para predecir las probabilidades.", icon: "grid" },
      { id: 3, text: "Define el tamaño de la muestra y genera la población F1.", icon: "users" },
      { id: 4, text: "Compara los fenotipos reales con los teóricos de Mendel.", icon: "bar-chart" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la segregación independiente de alelos mediante cruces dihíbridos.",
      friccion: "Probabilidad vs Estadística: En muestras pequeñas (N=10), las proporciones rara vez coinciden con el 9:3:3:1, enseñando la necesidad de grandes muestras.",
      puntosClave: ["Dominancia Completa: El alelo dominante enmascara al recesivo.", "Dihibridismo: Cruce de dos rasgos independientes.", "Distribución Independiente: 2da Ley de Mendel."]
    },
    conceptos: [
      { titulo: "Alelo", desc: "Cada una de las formas alternativas que puede tener un mismo gen." },
      { titulo: "Cuadro de Punnett", desc: "Diagrama diseñado por Reginald Punnett para determinar la probabilidad de genotipos." },
      { titulo: "Fenotipo", desc: "Expresión observable del genotipo en función de un ambiente determinado." }
    ]
  };

export default contenido;
