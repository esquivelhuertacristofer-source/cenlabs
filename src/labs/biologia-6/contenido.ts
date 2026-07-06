import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Selección Natural", mision: "Observa cómo el ambiente industrial desplaza las frecuencias fenotípicas", ecuacion: "f(A) + f(a) = 1", formulaGfx: "\Delta p = p' - p",
    pasos: [
      { id: 1, text: "Selecciona el ambiente (Bosque Limpio o Industrial).", icon: "tree" },
      { id: 2, text: "Inicia la temporada de caza y actúa como el depredador.", icon: "target" },
      { id: 3, text: "Observa la supervivencia diferencial basada en el camuflaje.", icon: "eye" },
      { id: 4, text: "Analiza la gráfica evolutiva tras completar 5 generaciones.", icon: "line-chart" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la selección natural mediante el mimetismo industrial.",
      friccion: "Intervención Directa: Si el alumno no caza, la población se estabiliza. Debe experimentar cómo su rol de depredador es el motor del cambio.",
      puntosClave: ["Presión Selectiva: El agente (ave) que elimina individuos.", "Adaptación: Ventaja reproductiva según el entorno.", "Melanismo Industrial: El caso de la polilla Biston betularia."]
    },
    conceptos: [
      { titulo: "Selección Natural", desc: "Proceso por el cual los organismos mejor adaptados sobreviven y se reproducen." },
      { titulo: "Camuflaje", desc: "Capacidad de un organismo para pasar inadvertido en su entorno." },
      { titulo: "Frecuencia Alélica", desc: "Proporción de un alelo específico en el conjunto de genes de una población." }
    ]
  };

export default contenido;
