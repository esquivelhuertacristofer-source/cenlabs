import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "QMI-15",
  "titulo": "Electrodeposición: corriente, masa y espesor",
  "subtitulo": "Electroquímica Aplicada",
  "acento": "#219EBC",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Un recubrimiento crece sobre una pieza; contrastar la ley de Faraday con rendimiento de corriente.\n\nObtén el espesor medio de cobre depositado sobre una superficie de 100 cm².",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Carga",
      "descripcion": "I por t cuantifica electrones transferidos."
    },
    {
      "icono": "📐",
      "nombre": "Rendimiento",
      "descripcion": "No toda la corriente deposita metal."
    },
    {
      "icono": "📊",
      "nombre": "Espesor",
      "descripcion": "Masa y área determinan el recubrimiento medio."
    }
  ],
  "mision": [
    "Inspecciona «Cátodo de depósito» y «Recubrimiento» con Explorar en 3D.",
    "Ajusta «Corriente», «Tiempo de depósito», «Rendimiento de corriente» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Fabricación de recubrimientos",
      "ejemplo": "Calcular masa y espesor considerando rendimiento de corriente y superficie."
    }
  ],
  "imagen": "/images/ciencias/quimica-15.webp?v=e94a3d5dcd8b"
};
export default briefing;
