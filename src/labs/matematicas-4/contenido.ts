import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Teorema de Pitágoras: Fluidos", mision: "Demuestra la relación a² + b² = c² mediante áreas dinámicas", ecuacion: "a² + b² = c²", formulaGfx: "c = √(a² + b²)",
    pasos: [
      { id: 1, text: "Ajusta la longitud de los catetos A y B usando los deslizadores.", icon: "move" },
      { id: 2, text: "Calcula el área de cada cuadrado (lado * lado).", icon: "square" },
      { id: 3, text: "Presiona 'Verter Contenido' para observar la transferencia de energía.", icon: "droplets" },
      { id: 4, text: "Ingresa el valor de la hipotenusa (2 decimales) y valida.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Visualizar geométricamente la suma de áreas en un triángulo rectángulo.",
      friccion: "Los alumnos suelen memorizar la fórmula sin entender que se refiere a áreas físicas.",
      puntosClave: ["La hipotenusa no es solo un lado, es la raíz de una suma de áreas.", "Uso de ternas pitagóricas (3-4-5) para demostración rápida.", "Manejo de raíces cuadradas no exactas."]
    },
    conceptos: [
      { titulo: "Hipotenusa", desc: "Lado opuesto al ángulo recto, el más largo del triángulo." },
      { titulo: "Catetos", desc: "Lados que forman el ángulo de 90 grados." },
      { titulo: "Terna Pitagórica", desc: "Conjunto de tres números enteros que cumplen el teorema." }
    ]
  };

export default contenido;
