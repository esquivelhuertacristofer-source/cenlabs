import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-254",
  "titulo": "Círculo de Mohr: encuentra el plano principal",
  "subtitulo": "Mecánica de Sólidos",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Gira un corte del material hasta que desaparezca el esfuerzo que lo desliza.\nOT-254 · Reduce |cortante en el corte| a ≤3 MPa, con principal mayor ≤160 MPa y cortante aplicado ≥50 MPa.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Pieza y carga",
      "descripcion": "Gira un corte del material hasta que desaparezca el esfuerzo que lo desliza."
    },
    {
      "icono": "📐",
      "nombre": "Modelo verificable",
      "descripcion": "Relaciona la geometría con las ecuaciones y sus unidades."
    },
    {
      "icono": "🔎",
      "nombre": "Decisión profesional",
      "descripcion": "Reduce |cortante en el corte| a ≤3 MPa, con principal mayor ≤160 MPa y cortante aplicado ≥50 MPa."
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
      "ejemplo": "Círculo de Mohr: encuentra el plano principal"
    }
  ]
};
export default briefing;
