import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "FIS-22",
  "titulo": "Efecto Hall: medir un campo con portadores de carga",
  "subtitulo": "Física Moderna y Campos",
  "acento": "#3b82f6",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Las cargas se separan transversalmente; calibrar tensión Hall y distinguir signos de portador.\n\nCalcula la densidad de portadores del metal usando la magnitud de la tensión Hall.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Desviación",
      "descripcion": "La fuerza magnética redistribuye carga."
    },
    {
      "icono": "📐",
      "nombre": "Equilibrio transversal",
      "descripcion": "La fuerza eléctrica compensa la magnética."
    },
    {
      "icono": "📊",
      "nombre": "Espesor",
      "descripcion": "Una lámina fina amplifica VH."
    }
  ],
  "mision": [
    "Inspecciona «Lámina conductora» y «Región magnética» con Explorar en 3D.",
    "Ajusta «Corriente longitudinal», «Campo transversal» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Caracterización eléctrica",
      "ejemplo": "Convertir una tensión transversal medida en densidad ideal de portadores."
    }
  ],
  "imagen": "/images/ciencias/fisica-22.webp?v=6454811e36e2"
};
export default briefing;
