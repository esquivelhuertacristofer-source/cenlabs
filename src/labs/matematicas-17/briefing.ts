import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "MAT-17",
  "titulo": "Confiabilidad Weibull y datos censurados",
  "subtitulo": "Estadística Aplicada",
  "acento": "#8b5cf6",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Componentes envejecen en un banco virtual; estimar supervivencia y reconocer observaciones incompletas.\n\nCalcula la supervivencia al finalizar el ensayo y distingue supervivientes de fallas observadas.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Forma",
      "descripcion": "β distingue riesgo creciente o decreciente."
    },
    {
      "icono": "📐",
      "nombre": "Escala",
      "descripcion": "η es el tiempo de supervivencia e⁻¹."
    },
    {
      "icono": "📊",
      "nombre": "Censura",
      "descripcion": "Un superviviente sólo informa que su vida excede el corte."
    }
  ],
  "mision": [
    "Inspecciona «Rotor en ensayo» y «Muestra del banco» con Explorar en 3D.",
    "Ajusta «Parámetro de forma β», «Duración del ensayo» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Confiabilidad de componentes",
      "ejemplo": "Distinguir fallas, supervivencia y observaciones censuradas al terminar un ensayo."
    }
  ],
  "imagen": "/images/ciencias/matematicas-17.webp?v=4c98b561ba52"
};
export default briefing;
