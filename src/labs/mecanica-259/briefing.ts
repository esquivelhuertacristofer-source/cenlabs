import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-259",
  "titulo": "Cercha: reacciones y fuerzas en las barras",
  "subtitulo": "Mecánica de Sólidos",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Un triángulo reparte la carga entre barras que tiran o empujan.\nOT-259 · Sostén ≥24 kN con esfuerzo ≤100 MPa, flecha ≤2 mm y altura ≤800 mm.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Pieza y carga",
      "descripcion": "Un triángulo reparte la carga entre barras que tiran o empujan."
    },
    {
      "icono": "📐",
      "nombre": "Modelo verificable",
      "descripcion": "Relaciona la geometría con las ecuaciones y sus unidades."
    },
    {
      "icono": "🔎",
      "nombre": "Decisión profesional",
      "descripcion": "Sostén ≥24 kN con esfuerzo ≤100 MPa, flecha ≤2 mm y altura ≤800 mm."
    }
  ],
  "mision": [
    "Observa apoyos, pieza y sentido de carga.",
    "Ajusta los mandos para cumplir simultáneamente todos los criterios.",
    "Prepara el ensayo, registra el ajuste y valida antes de comparar curvas."
  ],
  "aplicaciones": [
    {
      "area": "Diseño y mantenimiento industrial",
      "ejemplo": "Cercha: reacciones y fuerzas en las barras"
    }
  ]
};
export default briefing;
