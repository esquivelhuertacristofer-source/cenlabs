import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-225",
  "titulo": "Robot de orugas: giro y esfuerzo de tracción",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Controla dos orugas independientes y observa cómo su diferencia de velocidad hace girar el robot.\nOT-225 · Avanza ≥0,5 m/s en un radio de 1–1,6 m, con par ≤20 N·m y potencia ≤250 W.\nRobot de orugas, transmisión independiente y trayectoria del centro.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Controla dos orugas independientes y observa cómo su diferencia de velocidad hace girar el robot."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Avanza ≥0,5 m/s en un radio de 1–1,6 m, con par ≤20 N·m y potencia ≤250 W."
    }
  ],
  "mision": [
    "Identifica los componentes y consulta las condiciones de la orden.",
    "Ajusta ambos parámetros y compara las mediciones con los criterios.",
    "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia.",
    "Avanza ≥0,5 m/s en un radio de 1–1,6 m, con par ≤20 N·m y potencia ≤250 W."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Robot de orugas: giro y esfuerzo de tracción"
    }
  ]
};
export default briefing;
