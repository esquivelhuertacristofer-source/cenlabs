import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-233",
  "titulo": "Electroerosión por hilo: energía y avance",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Un hilo corta un contorno circular mediante descargas en un baño dieléctrico.\nOT-233 · Corta a ≥0,18 mm/s con energía por pulso ≤0,30 J, hilo ≤240 °C y duración física ≤700 s.\nElectroerosionadora de hilo, contorno circular y balance energético.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Un hilo corta un contorno circular mediante descargas en un baño dieléctrico."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Corta a ≥0,18 mm/s con energía por pulso ≤0,30 J, hilo ≤240 °C y duración física ≤700 s."
    }
  ],
  "mision": [
    "Identifica los componentes y consulta las condiciones de la orden.",
    "Ajusta ambos parámetros y compara las mediciones con los criterios.",
    "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia.",
    "Corta a ≥0,18 mm/s con energía por pulso ≤0,30 J, hilo ≤240 °C y duración física ≤700 s."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Electroerosión por hilo: energía y avance"
    }
  ]
};
export default briefing;
