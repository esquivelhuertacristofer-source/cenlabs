import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Magnitud de Momento (Mw): Energía Sísmica",
    videoUrl: "",
    mision: "Calcula el factor de potencia entre sismos usando logaritmos", ecuacion: "E = 10^(1.5ΔM)", formulaGfx: "log₁₀(E₂/E₁) = 1.5(M₂ - M₁)",
    pasos: [
      { id: 1, text: "Lee la magnitud Mw del sismo objetivo y la de la estación base.", icon: "target" },
      { id: 2, text: "Lleva la estación experimental a esa magnitud y compara las escalas lineal y logarítmica.", icon: "activity" },
      { id: 3, text: "Calcula ΔM y el factor de energía 10^(1.5·ΔM). Ojo: la amplitud sólo crece 10^ΔM.", icon: "zap" },
      { id: 4, text: "Escribe el factor (tolerancia ±5 %) y valida.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Diferenciar entre crecimiento lineal y exponencial aplicado a fenómenos naturales.",
      friccion: "Los alumnos suelen subestimar el incremento de energía al ver números pequeños (ej. de 6 a 8).",
      puntosClave: ["Un aumento de 1 grado = ~31.6 veces más energía.", "Un aumento de 2 grados = 1000 veces más energía.", "La escala es logarítmica para manejar rangos de energía masivos."]
    },
    conceptos: [
      { titulo: "Magnitud de Momento", desc: "Escala logarítmica que mide la energía total liberada." },
      { titulo: "Energía Sísmica", desc: "Cantidades masivas de Joules liberados en la falla." },
      { titulo: "Logaritmo", desc: "Función inversa de la exponencial, clave en sismología." }
    ]
  };

export default contenido;
