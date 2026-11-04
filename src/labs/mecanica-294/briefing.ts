import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-294",
  "titulo": "Servo con tres lazos en cascada",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "El carro debe llegar a una marca. Un lazo pide velocidad, otro pide corriente y el último entrega el esfuerzo al motor.\nOT-294 · Pon a punto un eje de posicionamiento para llegar a la marca y resistir una carga.",
  "conceptos": [
    {
      "icono": "📍",
      "nombre": "Posición",
      "descripcion": "El error de posición determina la velocidad solicitada."
    },
    {
      "icono": "⚙️",
      "nombre": "Velocidad",
      "descripcion": "La corrección de velocidad determina la corriente solicitada."
    },
    {
      "icono": "⚡",
      "nombre": "Corriente",
      "descripcion": "El lazo interior regula el par disponible."
    }
  ],
  "mision": [
    "Sigue el movimiento y la llegada a la marca.",
    "Ajusta los dos lazos exteriores.",
    "Contrasta las tres señales y valida bajo carga."
  ],
  "aplicaciones": [
    {
      "area": "Mecatrónica",
      "ejemplo": "Ajusta los lazos exteriores. Observa la llegada a la marca y el efecto de una carga aplicada a los dos segundos."
    }
  ]
};
export default briefing;
