import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-272",
  "titulo": "Resonancia forzada y transmisibilidad",
  "subtitulo": "Vibraciones y Dinámica de Máquinas",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Mueve la frecuencia del excitador y reconoce cuándo amplifica la fuerza que llega a la base.\nOT-272 · El fabricante cambió el régimen de un excitador. Comprueba si la nueva frecuencia deja de amplificar la carga que recibe el anclaje.",
  "conceptos": [
    {
      "icono": "⚙",
      "nombre": "Amplificación de desplazamiento",
      "descripcion": "Indicador del ensayo."
    },
    {
      "icono": "⚙",
      "nombre": "Fuerza transmitida / excitación",
      "descripcion": "Indicador del ensayo."
    },
    {
      "icono": "⚙",
      "nombre": "Desfase",
      "descripcion": "Lectura del banco en °."
    }
  ],
  "mision": [
    "Identifica excitador, carro y apoyo en el banco.",
    "Registra un ensayo variando frecuencia relativa y amortiguamiento relativo.",
    "Amplificación de desplazamiento entre 0 y 0.5. Fuerza transmitida / excitación entre 0 y 0.5. Desfase entre 120 y 180 °."
  ],
  "aplicaciones": [
    {
      "area": "Vibraciones y Dinámica de Máquinas",
      "ejemplo": "Manipula frecuencia relativa y amortiguamiento relativo. Compara las lecturas con la orden de trabajo."
    }
  ]
};
export default briefing;
