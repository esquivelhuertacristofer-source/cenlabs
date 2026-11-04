import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-291",
  "titulo": "PID de velocidad con anti-windup",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Cuando el motor ya recibe toda la tensión disponible, el controlador todavía puede acumular error. Observa qué ocurre al bajar la consigna.\nOT-291 · Recupera el control de velocidad tras una consigna que supera la capacidad del accionamiento.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Saturación",
      "descripcion": "El actuador tiene un límite de tensión aunque el controlador pida más."
    },
    {
      "icono": "📐",
      "nombre": "Ganancia última",
      "descripcion": "La oscilación marginal de la planta permite estimar el ajuste inicial."
    },
    {
      "icono": "↩️",
      "nombre": "Anti-windup",
      "descripcion": "La diferencia de mando corrige la acumulación integral."
    }
  ],
  "mision": [
    "Observa el intervalo saturado.",
    "Ajusta la ganancia y la corrección del integrador.",
    "Registra la recuperación y compara la tensión ordenada con la aplicada."
  ],
  "aplicaciones": [
    {
      "area": "Mecatrónica",
      "ejemplo": "Compara la recuperación con y sin corrección del integrador. Repite el ensayo después de cambiar el ajuste."
    }
  ]
};
export default briefing;
