import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-231",
  "titulo": "Robot suspendido: cables, tensiones y cabrestantes",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Cuatro cabrestantes trasladan una carga suspendida manteniendo todos los cables en tracción.\nOT-231 · Traslada ≥12 kg en la trayectoria prescrita con tensiones 12–110 N y potencia máxima de izado ≤80 W.\nRobot por cables, cuatro cabrestantes y registro de longitudes y tensiones.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Cuatro cabrestantes trasladan una carga suspendida manteniendo todos los cables en tracción."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Traslada ≥12 kg en la trayectoria prescrita con tensiones 12–110 N y potencia máxima de izado ≤80 W."
    }
  ],
  "mision": [
    "Identifica los componentes y consulta las condiciones de la orden.",
    "Ajusta ambos parámetros y compara las mediciones con los criterios.",
    "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia.",
    "Traslada ≥12 kg en la trayectoria prescrita con tensiones 12–110 N y potencia máxima de izado ≤80 W."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Robot suspendido: cables, tensiones y cabrestantes"
    }
  ]
};
export default briefing;
