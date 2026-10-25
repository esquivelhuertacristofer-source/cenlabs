import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-180",
  "titulo": "Alineación de una transmisión de doble Cardán: fase y ondulación de velocidad",
  "subtitulo": "Autotrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Alinea las horquillas de una transmisión para que el giro llegue uniforme a pesar del desvío entre ejes.\nOT-180 · Un eje transmite5 kW a300 rpm y necesita superar un obstáculo con al menos25° de desvío. Verifica fase y par pulsante antes de aceptar la transmisión.\nDos tacómetros virtuales, traza de relación instantánea y registro de par.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Alinea las horquillas de una transmisión para que el giro llegue uniforme a pesar del desvío entre ejes."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Conserva un desvío ≥25°, ondulación de velocidad ≤1 % y par de salida ≤190 N·m."
    }
  ],
  "mision": [
    "Observa la ondulación con horquillas fuera de fase.",
    "Ajusta fase sin eliminar el desvío requerido; ensaya una vuelta.",
    "Registra la ondulación y comprueba el par máximo.",
    "Conserva un desvío ≥25°, ondulación de velocidad ≤1 % y par de salida ≤190 N·m."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Alineación de una transmisión de doble Cardán: fase y ondulación de velocidad"
    }
  ]
};
export default briefing;
