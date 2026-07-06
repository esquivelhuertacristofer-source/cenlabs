import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Círculo Trigonométrico", mision: "Visualiza el origen geométrico de las ondas Seno y Coseno", ecuacion: "y = sin(θ), x = cos(θ)", formulaGfx: "Unitario (r=1)",
    pasos: [
      { id: 1, text: "Gira el vector en el círculo unitario usando el deslizador.", icon: "rotate-cw" },
      { id: 2, text: "Usa el 'Auto-Giro' para ver cómo se desenrolla la onda en el osciloscopio.", icon: "activity" },
      { id: 3, text: "Observa el punto de cruce en 45° donde Seno y Coseno son idénticos.", icon: "target" },
      { id: 4, text: "Presiona 'Validar Ángulo' exactamente en el punto de intersección.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Deducir las funciones trigonométricas a partir de la geometría del círculo.",
      friccion: "El salto mental entre una rotación circular y una onda oscilante es complejo.",
      puntosClave: ["Ángulo Radianes: Longitud del arco en el círculo unitario.", "Amplitud: Siempre 1 en el círculo unitario.", "Fase: Posición inicial del vector."]
    },
    conceptos: [
      { titulo: "Círculo Unitario", desc: "Círculo de radio 1 centrado en el origen (0,0)." },
      { titulo: "Seno", desc: "Proyección vertical (eje Y) del punto en el círculo." },
      { titulo: "Coseno", desc: "Proyección horizontal (eje X) del punto en el círculo." }
    ]
  };

export default contenido;
