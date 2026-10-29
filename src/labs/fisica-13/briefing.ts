import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "FIS-13",
  "titulo": "Fotoelasticidad: esfuerzos vistos con polarizadores",
  "subtitulo": "Mecánica de Materiales",
  "acento": "#3b82f6",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Una pieza cargada revela franjas; interpretar el estado óptico asociado a la diferencia de esfuerzos.\n\nObtén el esfuerzo tangencial máximo alrededor del agujero en MPa a partir del modelo de Kirsch y el registro óptico.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Concentración",
      "descripcion": "Un agujero modifica el campo incluso bajo carga remota uniforme."
    },
    {
      "icono": "📐",
      "nombre": "Diferencia de esfuerzos",
      "descripcion": "La birrefringencia depende de esfuerzos principales y espesor."
    },
    {
      "icono": "📊",
      "nombre": "Unidades",
      "descripcion": "Carga, ancho y espesor deben expresarse en unidades compatibles."
    }
  ],
  "mision": [
    "Inspecciona «Placa con agujero» y «Espesor de la probeta» con Explorar en 3D.",
    "Ajusta «Fuerza de tracción», «Espesor de placa» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Análisis experimental de esfuerzos",
      "ejemplo": "Interpretar franjas y reconocer la diferencia entre una ventana de Kirsch y un ensayo calibrado."
    }
  ],
  "imagen": "/images/ciencias/fisica-13.webp?v=ffc124d7192d"
};
export default briefing;
