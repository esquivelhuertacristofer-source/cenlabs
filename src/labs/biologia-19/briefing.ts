import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "BIO-19",
  "titulo": "Ecotoxicología con bioindicadores virtuales",
  "subtitulo": "Biología Ambiental",
  "acento": "#10b981",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Poblaciones responden a una exposición simulada; construir una curva dosis–respuesta e interpretar variabilidad.\n\nCalcula el porcentaje de respuesta de los bioindicadores virtuales a la exposición.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Dosis-respuesta",
      "descripcion": "E crece de forma saturable."
    },
    {
      "icono": "📐",
      "nombre": "EC50",
      "descripcion": "Es la concentración para 50% de respuesta."
    },
    {
      "icono": "📊",
      "nombre": "Incertidumbre",
      "descripcion": "Un modelo virtual no establece un límite legal."
    }
  ],
  "mision": [
    "Inspecciona «Cámara virtual de exposición» y «Bioindicadores virtuales» con Explorar en 3D.",
    "Ajusta «Concentración virtual», «Pendiente de Hill» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Interpretación de ecotoxicología",
      "ejemplo": "Leer una curva dosis-respuesta virtual sin extrapolarla a especies ni normas reales."
    }
  ],
  "imagen": "/images/ciencias/biologia-19.webp?v=1aa2015bf63e"
};
export default briefing;
