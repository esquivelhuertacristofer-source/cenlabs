import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-211",
  "titulo": "Calibración cámara–robot: correspondencias planares",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Relaciona las medidas de una cámara con el marco de la herramienta y comprueba el error sobre varios puntos.\nOT-211 · Ajusta la transformación para obtener RMS ≤0,5 mm, error máximo ≤0,7 mm y reproyección equivalente ≤0,7 px.\nSCARA, cámara, patrón, correspondencias y visor de residuos.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Relaciona las medidas de una cámara con el marco de la herramienta y comprueba el error sobre varios puntos."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Ajusta la transformación para obtener RMS ≤0,5 mm, error máximo ≤0,7 mm y reproyección equivalente ≤0,7 px."
    }
  ],
  "mision": [
    "Observa el patrón y las correspondencias normalizadas.",
    "Ajusta rotación y traslación comparando los seis residuos.",
    "Adquiere un ciclo de poses y valida todos los criterios.",
    "Ajusta la transformación para obtener RMS ≤0,5 mm, error máximo ≤0,7 mm y reproyección equivalente ≤0,7 px."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Calibración cámara–robot: correspondencias planares"
    }
  ]
};
export default briefing;
