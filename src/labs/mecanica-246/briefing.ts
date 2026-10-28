import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-246",
  "titulo": "Corte por agua: presión, orificio y potencia",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Un cabezal convierte presión hidráulica en un chorro que recorre una placa sobre el tanque.\nOT-246 · Obtén velocidad ≥700 m/s, agua ≤2 L/min, potencia hidráulica ≤12 kW y avance equivalente ≥0,3 mm/s.\nCabezal de corte, placa sobre apoyos y balance de caudal y potencia.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Un cabezal convierte presión hidráulica en un chorro que recorre una placa sobre el tanque."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Obtén velocidad ≥700 m/s, agua ≤2 L/min, potencia hidráulica ≤12 kW y avance equivalente ≥0,3 mm/s."
    }
  ],
  "mision": [
    "Identifica los componentes y consulta las condiciones de la orden.",
    "Ajusta ambos parámetros y compara las mediciones con los criterios.",
    "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia.",
    "Obtén velocidad ≥700 m/s, agua ≤2 L/min, potencia hidráulica ≤12 kW y avance equivalente ≥0,3 mm/s."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Corte por agua: presión, orificio y potencia"
    }
  ]
};
export default briefing;
