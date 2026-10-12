import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Círculo Trigonométrico", mision: "Encuentra los dos ángulos de una vuelta que cumplen la ecuación trigonométrica asignada", ecuacion: "y = sin(θ), x = cos(θ)", formulaGfx: "Unitario (r=1)",
    pasos: [
      { id: 1, text: "Lee la ecuación objetivo del panel (sen θ o cos θ igual a un valor notable).", icon: "target" },
      { id: 2, text: "Gira el vector con el deslizador o el auto-giro y observa la proyección que corresponde.", icon: "rotate-cw" },
      { id: 3, text: "Detén el vector y captura cada ángulo que cumpla la ecuación: hay DOS en [0°, 360°).", icon: "activity" },
      { id: 4, text: "Si capturaste uno que no cumple, limpia las muestras. Luego valida.", icon: "check" }
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
