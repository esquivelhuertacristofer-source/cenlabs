import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Materiales: Dilatación Térmica", 
    mision: "Certifica el coeficiente de expansión lineal (α) mediante el análisis de elongación micrométrica por gradiente térmico.", 
    ecuacion: "ΔL = L₀ · α · ΔT", 
    formulaGfx: "α = ΔL / (L₀·ΔT)",
    pasos: [
      { id: 1, text: "Calibración Inicial: Registra la longitud L₀ del espécimen a temperatura ambiente.", icon: "target" },
      { id: 2, text: "Gradiente de Calor: Inyecta energía térmica controlada hasta alcanzar la saturación por vapor.", icon: "flame" },
      { id: 3, text: "Telemetría Micrométrica: Mide la elongación ΔL con precisión láser en el comparador de carátula.", icon: "activity" },
      { id: 4, text: "Análisis Alfa: Calcula la constante de expansión para validar la composición metalúrgica.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Analizar la respuesta macroscópica del aumento de la agitación térmica en la red cristalina del sólido.",
      friccion: "Es crítico entender que ΔL es una fracción milimétrica. Un error de lectura en el micrómetro invalida el coeficiente α.",
      puntosClave: ["Coeficiente Alfa (α): Propiedad intrínseca del material.", "Efecto Térmico: Dilatación por aumento de la distancia interatómica.", "Precisión: Relación entre ΔT y la escala micrométrica."]
    },
    conceptos: [
      { titulo: "Coeficiente de Dilatación", desc: "Constante característica de cada material." },
      { titulo: "Equilibrio Térmico", desc: "Estado de igual temperatura entre cuerpos." },
      { titulo: "Termometría", desc: "Técnica de medición de calor sensible." }
    ]
  };

export default contenido;
