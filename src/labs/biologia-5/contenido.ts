import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Leyes de Mendel", mision: "Predice la proporción fenotípica de la cruza asignada y ponla a prueba con χ²", ecuacion: "P(AB) = P(A) \cdot P(B)", formulaGfx: "χ² = Σ (O − E)² / E",
    pasos: [
      { id: 1, text: "Lee los genotipos de los progenitores de la misión y escribe sus gametos.", icon: "dna" },
      { id: 2, text: "Arma el cuadro de Punnett y escribe tu proporción fenotípica predicha.", icon: "grid" },
      { id: 3, text: "Elige el tamaño de la muestra (al menos 100) y realiza la cruza.", icon: "users" },
      { id: 4, text: "Compara observados contra esperados con χ² (α = 0.05) y valida.", icon: "bar-chart" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la segregación independiente de alelos mediante cruces dihíbridos.",
      friccion: "Probabilidad vs. estadística: con N = 10 los conteos se alejan mucho de lo esperado aunque la predicción sea correcta; χ² cuantifica cuándo una desviación es solo azar. Cada alumno recibe una cruza distinta (no siempre es 9:3:3:1).",
      puntosClave: ["Dominancia Completa: El alelo dominante enmascara al recesivo.", "Dihibridismo: Cruce de dos rasgos independientes.", "Distribución Independiente: 2da Ley de Mendel."]
    },
    conceptos: [
      { titulo: "Alelo", desc: "Cada una de las formas alternativas que puede tener un mismo gen." },
      { titulo: "Cuadro de Punnett", desc: "Diagrama diseñado por Reginald Punnett para determinar la probabilidad de genotipos." },
      { titulo: "Fenotipo", desc: "Expresión observable del genotipo en función de un ambiente determinado." }
    ]
  };

export default contenido;
