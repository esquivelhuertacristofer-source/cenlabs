import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-226",
  "titulo": "Soplador Roots: lóbulos y compresión externa",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Dos rotores transportan bolsas de aire hacia una salida presurizada, sin comprimirlas internamente.\nOT-226 · Entrega ≥12 L/s con potencia ≤650 W, salida ≤50 °C y régimen ≤2100 rpm.\nSoplador abierto, rotores sincronizados y balance de aire.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Dos rotores transportan bolsas de aire hacia una salida presurizada, sin comprimirlas internamente."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Entrega ≥12 L/s con potencia ≤650 W, salida ≤50 °C y régimen ≤2100 rpm."
    }
  ],
  "mision": [
    "Identifica los componentes y consulta las condiciones de la orden.",
    "Ajusta ambos parámetros y compara las mediciones con los criterios.",
    "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia.",
    "Entrega ≥12 L/s con potencia ≤650 W, salida ≤50 °C y régimen ≤2100 rpm."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Soplador Roots: lóbulos y compresión externa"
    }
  ]
};
export default briefing;
