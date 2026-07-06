import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Microscopio Virtual", 
    videoUrl: "",
    mision: "Identifica orgánulos específicos en muestras celulares", ecuacion: "Resolución = 0.61λ / NA", formulaGfx: "Mag = Oc · Ob",
    pasos: [
      { id: 1, text: "Selecciona el portaobjetos con la muestra requerida.", icon: "layers" },
      { id: 2, text: "Ajusta la iluminación del diafragma para ver detalles.", icon: "sun" },
      { id: 3, text: "Usa el revólver (zoom) para localizar la estructura objetivo.", icon: "zoom-in" },
      { id: 4, text: "Presiona 'Capturar Micrografía' cuando el orgánulo esté enfocado.", icon: "camera" }
    ],
    guiaMaestro: {
      objetivo: "Dominar el uso de aumentos y reconocer diferencias entre células animales y vegetales.",
      friccion: "Pérdida de luz a gran aumento: El alumno debe compensar subiendo la intensidad lumínica manualmente.",
      puntosClave: ["Cloroplastos: Solo presentes en vegetales.", "Núcleo: Visible a partir de 400x.", "Ciclosis: Movimiento citoplasmático vivo."]
    },
    conceptos: [
      { titulo: "Aumento Total", desc: "Producto del poder de magnificación del ocular por el objetivo." },
      { titulo: "Resolución", desc: "Capacidad de distinguir dos puntos cercanos como objetos separados." },
      { titulo: "Ciclosis", desc: "Movimiento giratorio del citoplasma que transporta orgánulos." }
    ]
  };

export default contenido;
