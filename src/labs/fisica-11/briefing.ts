import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "FIS-11",
  "titulo": "Ondas en una cuerda: reflexión y transmisión",
  "subtitulo": "Ondas y Óptica",
  "acento": "#3b82f6",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Pulsos que se reflejan al cambiar de medio; medir velocidades y reparto de energía.\n\nCalcula el porcentaje de energía reflejada en la unión de dos cuerdas bajo la misma tensión.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Impedancia",
      "descripcion": "La unión de impedancias distintas refleja parte del pulso."
    },
    {
      "icono": "📐",
      "nombre": "Inversión",
      "descripcion": "Un destino más denso invierte el pulso reflejado."
    },
    {
      "icono": "📊",
      "nombre": "Conservación",
      "descripcion": "R más T suma uno en ausencia de pérdidas."
    }
  ],
  "mision": [
    "Inspecciona «Tramos de cuerda» y «Unión entre medios» con Explorar en 3D.",
    "Ajusta «Tensión común», «Razón μ2/μ1» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Ensayos de vibración",
      "ejemplo": "Justificar reflexión e inversión de pulsos en uniones de impedancias distintas."
    }
  ],
  "imagen": "/images/ciencias/fisica-11.webp?v=4516cfabb8f1"
};
export default briefing;
