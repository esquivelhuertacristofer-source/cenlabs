import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Transporte Celular", mision: "Deduce la osmolaridad del citoplasma y prepara un medio isotónico", ecuacion: "Osm_int · V = constante", formulaGfx: "V_eq / V0 = Osm_int / Osm_ext",
    pasos: [
      { id: 1, text: "Selecciona el modelo celular (Animal o Vegetal).", icon: "box" },
      { id: 2, text: "Prepara un medio de prueba (NaCl y/o glucosa) y anota el volumen cuando se estabilice.", icon: "beaker" },
      { id: 3, text: "Calcula Osm_int = Osm_ext · (V_eq / V0), con Osm = i · M (NaCl i = 2, glucosa i = 1).", icon: "droplets" },
      { id: 4, text: "Prepara el medio isotónico: la célula vuelve a su volumen y deja de cambiar. Valida.", icon: "check-circle" }
    ],
    guiaMaestro: {
      objetivo: "Comprender los efectos de la tonicidad en la morfología celular y el equilibrio homeostático.",
      friccion: "Lisis celular: Si el medio es excesivamente hipotónico, el eritrocito explotará.",
      puntosClave: ["Isotonía: Osm_int = Osm_ext (cuentan TODAS las partículas, también la glucosa).", "Turgencia: la pared frena la entrada de agua en la célula vegetal (no revienta).", "Plasmólisis: Retracción de la membrana en vegetales."]
    },
    conceptos: [
      { titulo: "Ósmosis", desc: "Movimiento de agua a través de una membrana semipermeable hacia la mayor osmolaridad." },
      { titulo: "Tonicidad", desc: "Capacidad de una solución extracelular de mover agua hacia adentro o afuera de una célula." },
      { titulo: "Presión Osmótica", desc: "Presión necesaria para detener el flujo de solvente a través de la membrana." }
    ]
  };

export default contenido;
