import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "La Derivada", mision: "Identifica los puntos críticos de la montaña rusa usando la recta tangente", ecuacion: "f'(x) = lim(h→0) [f(x+h)-f(x)]/h", formulaGfx: "f'(x) = x² - 4x + 3",
    pasos: [
      { id: 1, text: "Desliza el escáner a lo largo de la pista para observar la pendiente.", icon: "move" },
      { id: 2, text: "Busca los puntos donde la recta tangente sea perfectamente horizontal.", icon: "target" },
      { id: 3, text: "Usa los botones de micro-ajuste para alcanzar m = 0.00.", icon: "mouse-pointer" },
      { id: 4, text: "Registra el Punto Crítico para validar el hallazgo del máximo o mínimo.", icon: "award" }
    ],
    guiaMaestro: {
      objetivo: "Visualizar la derivada como la pendiente de la recta tangente en un punto.",
      friccion: "Muchos alumnos ven la derivada como una fórmula algebraica; aquí la verán como un objeto geométrico que rota.",
      puntosClave: ["Pendiente 0: Indica un máximo o mínimo local.", "Cambio de Signo: De positivo a negativo es un Máximo.", "Razonamiento: f'(x) es la velocidad instantánea."]
    },
    conceptos: [
      { titulo: "Tasa de Cambio", desc: "Relación entre el cambio de salida respecto al de entrada." },
      { titulo: "Punto Crítico", desc: "Lugar donde la derivada es cero o no existe." },
      { titulo: "Máximo Local", desc: "Punto más alto en un entorno cercano de la función." }
    ]
  };

export default contenido;
