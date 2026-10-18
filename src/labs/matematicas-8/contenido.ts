import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "La Derivada", mision: "Encuentra con la derivada el instante de máxima velocidad del cohete", ecuacion: "f'(x) = lim(h→0) [f(x+h)-f(x)]/h", formulaGfx: "s(t) = −k·t³ + m·t²",
    pasos: [
      { id: 1, text: "Lee la función de posición s(t) del cohete en el panel.", icon: "move" },
      { id: 2, text: "Recorre t: la recta tangente a s(t) tiene pendiente v(t) = s'(t).", icon: "target" },
      { id: 3, text: "Deriva otra vez: v es máxima donde a(t) = v'(t) = 0.", icon: "mouse-pointer" },
      { id: 4, text: "Marca ese instante (tolerancia ±0,2 s) y valida.", icon: "award" }
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
