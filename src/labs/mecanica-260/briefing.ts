import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-260",
  "titulo": "Fractura: grieta crítica y margen de inspección",
  "subtitulo": "Mecánica de Sólidos",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Una grieta puede volver peligrosa una carga que antes parecía pequeña.\nOT-260 · Mantén reserva Kic/K ≥2, esfuerzo ≥90 MPa, grieta ≥5 mm y zona plástica ≤10 % de a.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Pieza y carga",
      "descripcion": "Una grieta puede volver peligrosa una carga que antes parecía pequeña."
    },
    {
      "icono": "📐",
      "nombre": "Modelo verificable",
      "descripcion": "Relaciona la geometría con las ecuaciones y sus unidades."
    },
    {
      "icono": "🔎",
      "nombre": "Decisión profesional",
      "descripcion": "Mantén reserva Kic/K ≥2, esfuerzo ≥90 MPa, grieta ≥5 mm y zona plástica ≤10 % de a."
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
      "ejemplo": "Fractura: grieta crítica y margen de inspección"
    }
  ]
};
export default briefing;
