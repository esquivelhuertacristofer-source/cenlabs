import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Reactivo Limitante", mision: "¡Bienvenido a la Planta de Síntesis de Amoníaco! Tu objetivo es optimizar la reacción entre Nitrógeno e Hidrógeno. En la industria, los recursos son limitados; por ello, deberás identificar con precisión matemática cuál de tus reactivos se agotará primero (Reactivo Limitante) y calcular exactamente cuánto material quedará en exceso. Tu meta es producir la mayor cantidad posible de NH3 aplicando la proporción estequiométrica 1:3. ¡Analiza los moles, predice el rendimiento y evita el desperdicio atómico!", 
    ecuacion: "N2 + 3H2 → 2NH3", formulaGfx: "Exceso = m - (nL * ratio * PM)",
    pasos: [
      { id: 1, text: "Analiza los gramos iniciales de N2 y H2.", icon: "microscope" },
      { id: 2, text: "Calcula los moles y determina el limitante.", icon: "zap" },
      { id: 3, text: "Ingresa el limitante y los gramos sobrantes.", icon: "beaker" },
      { id: 4, text: "Inicia la síntesis y observa el flujo.", icon: "play" }
    ],
    guiaMaestro: {
      objetivo: "Identificar el reactivo limitante mediante cálculos estequiométricos.",
      friccion: "Muchos alumnos asumen que el reactivo con menos gramos es el limitante.",
      puntosClave: ["PM(N2) = 28, PM(H2) = 2.", "Relación: 1 de N2 necesita 3 de H2.", "Exceso: Masa que no reaccionó."]
    },
    conceptos: [
      { titulo: "Reactivo Limitante", desc: "Sustancia que se consume totalmente." },
      { titulo: "Reactivo en Exceso", desc: "Sustancia que sobra." },
      { titulo: "Eficiencia", desc: "Relación entre rendimiento real y teórico." }
    ]
  };

export default contenido;
