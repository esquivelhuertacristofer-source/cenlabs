import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "BIO-18",
  "titulo": "Contracción muscular y sarcómeros",
  "subtitulo": "Biomecánica",
  "acento": "#10b981",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Filamentos se deslizan; interpretar fuerza, longitud y consumo de energía.\n\nCalcula la fuerza isométrica del sarcómero para su longitud y activación dadas.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Filamentos",
      "descripcion": "Actina y miosina mantienen sus longitudes."
    },
    {
      "icono": "📐",
      "nombre": "Solapamiento",
      "descripcion": "El número de puentes posibles depende de L."
    },
    {
      "icono": "📊",
      "nombre": "Isometría",
      "descripcion": "Se produce fuerza sin cambio de longitud global."
    }
  ],
  "mision": [
    "Inspecciona «Filamentos de actina» y «Filamentos de miosina» con Explorar en 3D.",
    "Ajusta «Longitud del sarcómero», «Activación» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Fisiología mecánica",
      "ejemplo": "Separar fuerza isométrica, activación y solapamiento de filamentos."
    }
  ],
  "imagen": "/images/ciencias/biologia-18.webp?v=7faf01c5fd31"
};
export default briefing;
