import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Transporte Celular", mision: "Ajusta la salinidad para alcanzar el equilibrio osmótico", ecuacion: "π = i · M · R · T", formulaGfx: "ΔV ∝ (C_int - C_ext)",
    pasos: [
      { id: 1, text: "Selecciona el modelo celular (Animal o Vegetal).", icon: "box" },
      { id: 2, text: "Ajusta la concentración del medio extracelular (M).", icon: "beaker" },
      { id: 3, text: "Observa la deformación de la membrana y el flujo de agua.", icon: "droplets" },
      { id: 4, text: "Valida cuando la célula alcance un estado isotónico estable.", icon: "check-circle" }
    ],
    guiaMaestro: {
      objetivo: "Comprender los efectos de la tonicidad en la morfología celular y el equilibrio homeostático.",
      friccion: "Lisis celular: Si el medio es excesivamente hipotónico, el eritrocito explotará.",
      puntosClave: ["Isotonía: C_int = C_ext.", "Turgencia: Hinchamiento por entrada de agua.", "Plasmólisis: Retracción de la membrana en vegetales."]
    },
    conceptos: [
      { titulo: "Ósmosis", desc: "Movimiento de agua a través de una membrana semipermeable hacia mayor concentración de soluto." },
      { titulo: "Tonicidad", desc: "Capacidad de una solución extracelular de mover agua hacia adentro o afuera de una célula." },
      { titulo: "Presión Osmótica", desc: "Presión necesaria para detener el flujo de solvente a través de la membrana." }
    ]
  };

export default contenido;
