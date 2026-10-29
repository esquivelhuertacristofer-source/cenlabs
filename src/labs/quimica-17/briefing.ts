import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "QMI-17",
  "titulo": "Reactor continuo: cinética y tiempo de residencia",
  "subtitulo": "Cinética y Reactores",
  "acento": "#219EBC",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Un reactor mezclado convierte reactivos; medir conversión y respuesta a cambios de operación.\n\nDetermina la conversión de estado estacionario de un reactor continuo perfectamente mezclado.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Mezcla",
      "descripcion": "La salida comparte concentración con el tanque."
    },
    {
      "icono": "📐",
      "nombre": "Residencia",
      "descripcion": "V/Q fija una escala de transformación."
    },
    {
      "icono": "📊",
      "nombre": "Arranque",
      "descripcion": "El transitorio no equivale al estado estacionario."
    }
  ],
  "mision": [
    "Inspecciona «Agitador y mezcla» y «Especie reactiva» con Explorar en 3D.",
    "Ajusta «Caudal de alimentación», «Concentración de alimentación» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Operación de procesos",
      "ejemplo": "Separar arranque, tiempo de residencia y conversión de estado estacionario."
    }
  ],
  "imagen": "/images/ciencias/quimica-17.webp?v=324ddc8c2599"
};
export default briefing;
