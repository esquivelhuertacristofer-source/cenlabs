import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Materiales: Dilatación Térmica", 
    mision: "Determina el coeficiente de dilatación lineal (α) de un metal desconocido midiendo su alargamiento al calentarlo con vapor.", 
    ecuacion: "ΔL = L₀ · α · ΔT", 
    formulaGfx: "α = ΔL / (L₀·ΔT)",
    pasos: [
      { id: 1, text: "Montaje: la barra mide L₀ = 500 mm a temperatura ambiente (20 °C).", icon: "target" },
      { id: 2, text: "Calentamiento: haz pasar vapor; la barra se acerca a 100 °C (vapor a 1 atm).", icon: "flame" },
      { id: 3, text: "Medición: lee ΔL en el comparador de carátula (resolución 1 μm) y ΔT en el termómetro.", icon: "activity" },
      { id: 4, text: "Análisis: calcula α = ΔL/(L₀·ΔT) y compáralo con la tabla de metales.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Analizar la respuesta macroscópica del aumento de la agitación térmica en la red cristalina del sólido.",
      friccion: "ΔL es de décimas de milímetro: con ΔT pequeño, el error de lectura del comparador pesa mucho en α. Además, L₀ y ΔL deben ir en las mismas unidades.",
      puntosClave: ["Coeficiente Alfa (α): Propiedad intrínseca del material.", "Efecto Térmico: Dilatación por aumento de la distancia interatómica.", "Precisión: Relación entre ΔT y la escala micrométrica."]
    },
    conceptos: [
      { titulo: "Coeficiente de Dilatación", desc: "Constante característica de cada material." },
      { titulo: "Equilibrio Térmico", desc: "Estado de igual temperatura entre cuerpos." },
      { titulo: "Termometría", desc: "Técnica de medición de calor sensible." }
    ]
  };

export default contenido;
