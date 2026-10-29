import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "BIO-16",
  "titulo": "Mecánica pulmonar y ventilación",
  "subtitulo": "Biomecánica",
  "acento": "#10b981",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Un pulmón se expande; relacionar presión, volumen, resistencia y distensibilidad en un modelo educativo.\n\nCalcula la constante temporal RC del compartimento y relaciona su valor con el llenado y vaciado registrados.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Distensibilidad",
      "descripcion": "C relaciona volumen y presión elástica."
    },
    {
      "icono": "📐",
      "nombre": "Resistencia",
      "descripcion": "R limita la rapidez del llenado."
    },
    {
      "icono": "📊",
      "nombre": "Tiempo",
      "descripcion": "RC determina la constante temporal."
    }
  ],
  "mision": [
    "Inspecciona «Pulmón y distensibilidad» y «Vías aéreas» con Explorar en 3D.",
    "Ajusta «Distensibilidad», «Resistencia de vía aérea» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Fundamentos de electromedicina",
      "ejemplo": "Interpretar resistencia y distensibilidad en un compartimento pasivo educativo."
    }
  ],
  "imagen": "/images/ciencias/biologia-16.webp?v=47ab3605d528"
};
export default briefing;
