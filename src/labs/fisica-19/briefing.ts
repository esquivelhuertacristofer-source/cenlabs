import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "FIS-19",
  "titulo": "Golpe de ariete: una válvula genera una onda de presión",
  "subtitulo": "Fluidos Aplicados",
  "acento": "#3b82f6",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Una onda recorre una conducción; relacionar cierre, propagación y sobrepresión.\n\nEstima la sobrepresión causada por el cierre de una válvula y distingue cierre rápido de lento.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Cierre rápido",
      "descripcion": "Activa el límite de Joukowsky."
    },
    {
      "icono": "📐",
      "nombre": "Tiempo característico",
      "descripcion": "La onda recorre dos veces la longitud."
    },
    {
      "icono": "📊",
      "nombre": "Diseño",
      "descripcion": "Una estimación no reemplaza el cálculo de una red."
    }
  ],
  "mision": [
    "Inspecciona «Válvula de cierre» y «Frente de presión» con Explorar en 3D.",
    "Ajusta «Velocidad inicial», «Tiempo de cierre» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Instalaciones hidráulicas",
      "ejemplo": "Identificar cierres rápidos y estimar un salto de presión antes de un análisis de red."
    }
  ],
  "imagen": "/images/ciencias/fisica-19.webp?v=0db3688a45e3"
};
export default briefing;
