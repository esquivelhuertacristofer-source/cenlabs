import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Selección Natural", mision: "Actúa como el ave depredadora y muestra que la selección desplaza la frecuencia del alelo mejor camuflado", ecuacion: "p + q = 1 ;  q ≈ √f(claras cc)", formulaGfx: "Δp = p′ − p",
    pasos: [
      { id: 1, text: "Observa la corteza que te tocó (hollín o líquenes claros).", icon: "tree" },
      { id: 2, text: "Caza la cuota de polillas de cada generación como lo haría un ave.", icon: "target" },
      { id: 3, text: "Deja que las supervivientes se reproduzcan y anota % de oscuras y q.", icon: "eye" },
      { id: 4, text: "Completa de 3 a 6 generaciones y valida.", icon: "line-chart" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la selección natural mediante el mimetismo industrial.",
      friccion: "Selección vs. deriva: si el alumno caza al azar, la frecuencia cambia poco y sin dirección (deriva génica); solo una caza guiada por el contraste con la corteza la desplaza. Y como C es dominante, el % de oscuras no es p: q se estima con √f(claras).",
      puntosClave: ["Presión Selectiva: El agente (ave) que elimina individuos.", "Adaptación: Ventaja reproductiva según el entorno.", "Melanismo Industrial: El caso de la polilla Biston betularia."]
    },
    conceptos: [
      { titulo: "Selección Natural", desc: "Proceso por el cual los organismos mejor adaptados sobreviven y se reproducen." },
      { titulo: "Camuflaje", desc: "Capacidad de un organismo para pasar inadvertido en su entorno." },
      { titulo: "Frecuencia Alélica", desc: "Proporción de un alelo específico en el conjunto de genes de una población." }
    ]
  };

export default contenido;
