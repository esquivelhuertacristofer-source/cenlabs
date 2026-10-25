import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-185",
  "titulo": "Calibración de una bomba peristáltica: caudal, presión y esfuerzo del fluido",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Ajusta una dosificadora para entregar el caudal pedido sin exigir demasiada presión ni esfuerzo de pared.\nOT-185 · Una dosificadora debe entregar entre40 y60 mL/min a un circuito viscoso. Selecciona tubo y giro, comprueba el punto de operación y registra el ajuste.\nCaudalímetro, manómetro y registro virtual de dosificación.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Ajusta una dosificadora para entregar el caudal pedido sin exigir demasiada presión ni esfuerzo de pared."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Dosifica40–60 mL/min con presión≤60 kPa y esfuerzo de pared≤25 Pa."
    }
  ],
  "mision": [
    "Lee viscosidad, longitud y caudal requeridos.",
    "Ajusta tubo y giro; ejecuta una vuelta de prueba.",
    "Registra el caudal y los límites; explica por qué un equipo real requiere aforo.",
    "Dosifica40–60 mL/min con presión≤60 kPa y esfuerzo de pared≤25 Pa."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Calibración de una bomba peristáltica: caudal, presión y esfuerzo del fluido"
    }
  ]
};
export default briefing;
