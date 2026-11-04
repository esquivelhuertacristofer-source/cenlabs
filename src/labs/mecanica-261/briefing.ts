import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-261",
  "titulo": "Unión atornillada: precarga y separación",
  "subtitulo": "Elementos de Máquina",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Aprieta dos piezas y descubre por qué una carga exterior no pasa entera al tornillo.\nOT-261 · Ajusta una junta axial para transmitir carga sin perder contacto ni sobrecargar el tornillo.",
  "conceptos": [
    {
      "icono": "🔩",
      "nombre": "Precarga y contacto",
      "descripcion": "El apriete crea tracción en el tornillo y compresión entre las piezas."
    },
    {
      "icono": "📐",
      "nombre": "Rigidez de junta",
      "descripcion": "Las rigideces determinan qué parte de la carga aumenta la tracción del tornillo."
    },
    {
      "icono": "🔎",
      "nombre": "Decisión de servicio",
      "descripcion": "Transmite ≥24 kN, conserva ≥3 kN de compresión y limita el tornillo a 34 kN con precarga ≤28 kN."
    }
  ],
  "mision": [
    "Identifica tornillo, piezas comprimidas y sentido de la carga.",
    "Compara la junta cerrada con la pérdida de contacto al aumentar la carga.",
    "Prepara el ensayo, registra un ajuste conforme y explica cómo se reparte la carga."
  ],
  "aplicaciones": [
    {
      "area": "Montaje y mantenimiento de máquinas",
      "ejemplo": "Comprobar una unión axial sin confundir par orientativo con precarga medida."
    }
  ]
};
export default briefing;
