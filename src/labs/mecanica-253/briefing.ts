import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-253",
  "titulo": "Pandeo de columnas: carga crítica y esbeltez",
  "subtitulo": "Mecánica de Sólidos",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Una columna larga puede doblarse antes de que su material se aplaste.\nOT-253 · Sostén al menos 25 kN con reserva de Euler entre 2 y 4 y esbeltez ≥100.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Pieza y carga",
      "descripcion": "Una columna larga puede doblarse antes de que su material se aplaste."
    },
    {
      "icono": "📐",
      "nombre": "Modelo verificable",
      "descripcion": "Relaciona la geometría con las ecuaciones y sus unidades."
    },
    {
      "icono": "🔎",
      "nombre": "Decisión profesional",
      "descripcion": "Sostén al menos 25 kN con reserva de Euler entre 2 y 4 y esbeltez ≥100."
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
      "ejemplo": "Pandeo de columnas: carga crítica y esbeltez"
    }
  ]
};
export default briefing;
