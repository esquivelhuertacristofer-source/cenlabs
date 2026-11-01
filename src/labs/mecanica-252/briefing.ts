import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-252",
  "titulo": "Ensayo de tracción: curva y deformación permanente",
  "subtitulo": "Mecánica de Sólidos",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Estira una probeta y observa qué parte recupera su forma al descargar.\nOT-252 · Caracteriza bajo 5,0–5,7 kN, con extensión útil de 60–78 µm y sin deformación permanente.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Pieza y carga",
      "descripcion": "Estira una probeta y observa qué parte recupera su forma al descargar."
    },
    {
      "icono": "📐",
      "nombre": "Modelo verificable",
      "descripcion": "Relaciona la geometría con las ecuaciones y sus unidades."
    },
    {
      "icono": "🔎",
      "nombre": "Decisión profesional",
      "descripcion": "Caracteriza bajo 5,0–5,7 kN, con extensión útil de 60–78 µm y sin deformación permanente."
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
      "ejemplo": "Ensayo de tracción: curva y deformación permanente"
    }
  ]
};
export default briefing;
