import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "BIO-15",
  "titulo": "Levadura en un biorreactor",
  "subtitulo": "Bioprocesos",
  "acento": "#10b981",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Un tanque aireado sostiene crecimiento; relacionar sustrato, oxígeno y productividad.\n\nCalcula la biomasa proyectada al cabo de 24 h bajo alimentación mantenida y oxígeno disponible.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Monod",
      "descripcion": "La saturación limita la respuesta al sustrato."
    },
    {
      "icono": "📐",
      "nombre": "Oxígeno",
      "descripcion": "Su disponibilidad modula el crecimiento."
    },
    {
      "icono": "📊",
      "nombre": "Operación",
      "descripcion": "Reservas externas distinguen el banco de un lote cerrado."
    }
  ],
  "mision": [
    "Inspecciona «Biomasa» y «Aireación» con Explorar en 3D.",
    "Ajusta «Sustrato mantenido», «Disponibilidad relativa de oxígeno» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Operación de fermentadores",
      "ejemplo": "Relacionar sustrato, oxígeno y crecimiento bajo alimentación mantenida."
    }
  ],
  "imagen": "/images/ciencias/biologia-15.webp?v=876cb35ff74b"
};
export default briefing;
