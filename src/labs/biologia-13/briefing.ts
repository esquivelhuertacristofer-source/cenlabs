import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "BIO-13",
  "titulo": "PCR con ADN patrón",
  "subtitulo": "Técnicas de Laboratorio",
  "acento": "#10b981",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Un termociclador y una vista molecular; comprender amplificación y evaluar controles.\n\nCalcula el mínimo de ciclos necesarios para alcanzar 10⁷ copias y contrasta si el registro alcanza esa meta.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Amplificación",
      "descripcion": "La cantidad crece multiplicativamente por ciclo."
    },
    {
      "icono": "📐",
      "nombre": "Control",
      "descripcion": "Sin plantilla no hay amplificación ideal."
    },
    {
      "icono": "📊",
      "nombre": "Eficiencia",
      "descripcion": "Un valor menor de uno reduce el crecimiento respecto a duplicación."
    }
  ],
  "mision": [
    "Inspecciona «Bloque del termociclador» y «ADN en amplificación» con Explorar en 3D.",
    "Ajusta «Número de ciclos», «Eficiencia por ciclo» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Control de amplificación",
      "ejemplo": "Calcular crecimiento de ADN patrón virtual y razonar sobre un control sin plantilla."
    }
  ],
  "imagen": "/images/ciencias/biologia-13.webp?v=40991ad5a894"
};
export default briefing;
