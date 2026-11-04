import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-287",
  "titulo": "Turbina Pelton y cantidad de movimiento",
  "subtitulo": "Termofluidos y Energía",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Ajusta la velocidad periférica para aprovechar el chorro sin sacrificar el empuje útil.\nOT-287 · Prepara el rodete para una línea hidráulica de altura conocida. Evalúa empuje, potencia y eficiencia antes de fijar la velocidad de giro.",
  "conceptos": [
    {
      "icono": "⚙",
      "nombre": "Potencia al rodete",
      "descripcion": "Lectura del banco en kW."
    },
    {
      "icono": "⚙",
      "nombre": "Eficiencia del rodete",
      "descripcion": "Lectura del banco en %."
    },
    {
      "icono": "⚙",
      "nombre": "Fuerza tangencial",
      "descripcion": "Lectura del banco en N."
    }
  ],
  "mision": [
    "Identifica boquilla, chorro, cucharas y eje en el banco.",
    "Registra un ensayo variando altura neta y relación de velocidades.",
    "Potencia al rodete entre 2.5 y 4 kW. Eficiencia del rodete entre 88 y 95 %. Fuerza tangencial entre 140 y 205 N."
  ],
  "aplicaciones": [
    {
      "area": "Termofluidos y Energía",
      "ejemplo": "Manipula altura neta y relación de velocidades. Compara las lecturas con la orden de trabajo."
    }
  ]
};
export default briefing;
