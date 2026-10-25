import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-191",
  "titulo": "Puesta en servicio de precarga HV",
  "subtitulo": "Autotrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Dimensiona una precarga virtual para que el enlace de continua alcance tensión antes de cerrar el contactor principal.\nOT-191 · Limita el pico a8 A y2500 W; cierra en≤900 ms con diferencia≤20 V.\nResistencia, condensadores, contactores en corte y registroV/I.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Dimensiona una precarga virtual para que el enlace de continua alcance tensión antes de cerrar el contactor principal."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Limita el pico a8 A y2500 W; cierra en≤900 ms con diferencia≤20 V."
    }
  ],
  "mision": [
    "Identifica las referencias, el instrumento y el objetivo de la orden.",
    "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
    "Valida manualmente y descarga la evidencia con la configuración ensayada.",
    "Limita el pico a8 A y2500 W; cierra en≤900 ms con diferencia≤20 V."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Puesta en servicio de precarga HV"
    }
  ]
};
export default briefing;
