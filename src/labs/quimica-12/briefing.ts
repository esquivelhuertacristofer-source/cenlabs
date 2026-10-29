import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "QMI-12",
  "titulo": "Cromatografía HPLC: separar una mezcla",
  "subtitulo": "Análisis Instrumental",
  "acento": "#219EBC",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Bandas avanzan por una columna; interpretar retención, resolución y cuantificación.\n\nCalcula la resolución entre los dos picos y juzga si la separación es suficiente.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Retención",
      "descripcion": "Los analitos avanzan con velocidades medias distintas."
    },
    {
      "icono": "📐",
      "nombre": "Eficiencia",
      "descripcion": "El número de platos relaciona retención y anchura."
    },
    {
      "icono": "📊",
      "nombre": "Resolución",
      "descripcion": "Combina separación temporal y dispersión."
    }
  ],
  "mision": [
    "Inspecciona «Columna cromatográfica» y «Fase estacionaria» con Explorar en 3D.",
    "Ajusta «Caudal», «Factor relativo de retención» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Separaciones analíticas",
      "ejemplo": "Calcular resolución y distinguir caudal, selectividad y eficiencia."
    }
  ],
  "imagen": "/images/ciencias/quimica-12.webp?v=1393665b79b1"
};
export default briefing;
