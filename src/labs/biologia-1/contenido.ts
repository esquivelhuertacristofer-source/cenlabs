import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Microscopio Virtual", 
    videoUrl: "",
    mision: "Localiza la estructura que pide la misión en la preparación correcta", ecuacion: "d = λ / (2·NA)  (Abbe)", formulaGfx: "Mag = Oc · Ob",
    pasos: [
      { id: 1, text: "Coloca en la platina la preparación que pide la misión.", icon: "layers" },
      { id: 2, text: "Localiza con 4x y sube al objetivo que RESUELVA la estructura (a 100x, con aceite de inmersión).", icon: "zoom-in" },
      { id: 3, text: "Ajusta la lámpara (a más aumento, menos luz llega al ojo) y enfoca con el micrométrico.", icon: "sun" },
      { id: 4, text: "Pulsa 'Analizar imagen' cuando la estructura esté nítida y bien iluminada.", icon: "camera" }
    ],
    guiaMaestro: {
      objetivo: "Dominar el uso de aumentos y reconocer diferencias entre células animales y vegetales.",
      friccion: "Pérdida de luz a gran aumento: El alumno debe compensar subiendo la intensidad lumínica manualmente.",
      puntosClave: ["Cloroplastos: Solo presentes en vegetales.", "Núcleo y cloroplastos (≈ 5 µm): se resuelven a 400x.", "Bacterias (≈ 1 µm): 1000x con aceite de inmersión."]
    },
    conceptos: [
      { titulo: "Aumento Total", desc: "Producto del poder de magnificación del ocular por el objetivo." },
      { titulo: "Resolución", desc: "Capacidad de distinguir dos puntos cercanos como objetos separados." },
      { titulo: "Ciclosis", desc: "Movimiento giratorio del citoplasma que transporta orgánulos." }
    ]
  };

export default contenido;
