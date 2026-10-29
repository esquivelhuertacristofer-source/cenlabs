import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "QMI-22",
  "titulo": "Tratamiento de agua: coagulación, floculación y sedimentación",
  "subtitulo": "Química Ambiental",
  "acento": "#219EBC",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Flóculos se forman en pruebas de jarras; comparar dosificación, mezcla y clarificación.\n\nCalcula la velocidad de sedimentación del flóculo equivalente y compara el agua clarificada.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Coagulación",
      "descripcion": "El banco tiene una dosis óptima sintética."
    },
    {
      "icono": "📐",
      "nombre": "Floculación",
      "descripcion": "La mezcla favorece agregados equivalentes."
    },
    {
      "icono": "📊",
      "nombre": "Sedimentación",
      "descripcion": "La velocidad depende del cuadrado del radio."
    }
  ],
  "mision": [
    "Inspecciona «Dosis menor» y «Ensayo central» con Explorar en 3D.",
    "Ajusta «Dosis de coagulante del banco», «Gradiente de mezcla» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Tratamiento de agua",
      "ejemplo": "Comparar dosis y mezcla en jarras virtuales sin confundir claridad con potabilidad."
    }
  ],
  "imagen": "/images/ciencias/quimica-22.webp?v=5fcbabe6b8a1"
};
export default briefing;
