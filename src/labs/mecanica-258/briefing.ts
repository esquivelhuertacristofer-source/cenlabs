import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-258",
  "titulo": "Recipiente a presión: aro y espesor mínimo",
  "subtitulo": "Mecánica de Sólidos",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "La pared de un depósito soporta más esfuerzo alrededor que a lo largo.\nOT-258 · Trabaja a ≥1,8 MPa con aro entre 80 y 110 MPa, espesor ≤9 mm y r/t ≥20.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Pieza y carga",
      "descripcion": "La pared de un depósito soporta más esfuerzo alrededor que a lo largo."
    },
    {
      "icono": "📐",
      "nombre": "Modelo verificable",
      "descripcion": "Relaciona la geometría con las ecuaciones y sus unidades."
    },
    {
      "icono": "🔎",
      "nombre": "Decisión profesional",
      "descripcion": "Trabaja a ≥1,8 MPa con aro entre 80 y 110 MPa, espesor ≤9 mm y r/t ≥20."
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
      "ejemplo": "Recipiente a presión: aro y espesor mínimo"
    }
  ]
};
export default briefing;
