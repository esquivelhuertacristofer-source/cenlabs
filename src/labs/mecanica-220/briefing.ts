import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-220",
  "titulo": "Cavitación: aspiración de una bomba centrífuga",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Observa el impulsor y ajusta la aspiración para mantener margen frente a la vaporización del líquido.\nOT-220 · Mantén margen NPSH ≥1 m, caudal ≥2,5 L/s, potencia ≤1200 W y una hipótesis compatible con líquido continuo.\nDepósito, línea de aspiración, bomba seccionada y balance NPSH.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Observa el impulsor y ajusta la aspiración para mantener margen frente a la vaporización del líquido."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Mantén margen NPSH ≥1 m, caudal ≥2,5 L/s, potencia ≤1200 W y una hipótesis compatible con líquido continuo."
    }
  ],
  "mision": [
    "Observa el ojo del impulsor y el recorrido del líquido.",
    "Relaciona nivel y caudal con las pérdidas de aspiración.",
    "Registra el funcionamiento y valida margen, entrega y potencia.",
    "Mantén margen NPSH ≥1 m, caudal ≥2,5 L/s, potencia ≤1200 W y una hipótesis compatible con líquido continuo."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Cavitación: aspiración de una bomba centrífuga"
    }
  ]
};
export default briefing;
