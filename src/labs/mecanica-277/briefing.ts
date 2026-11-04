import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-277",
  "titulo": "Análisis modal de una viga en voladizo",
  "subtitulo": "Vibraciones y Dinámica de Máquinas",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Cambia la longitud y mide cómo se desplaza la segunda frecuencia natural.\nOT-277 · El taller cambia la longitud de la probeta. Comprueba si el segundo modo queda dentro del intervalo que puede medir el equipo de ensayo.",
  "conceptos": [
    {
      "icono": "⚙",
      "nombre": "Frecuencia modal",
      "descripcion": "Lectura del banco en Hz."
    },
    {
      "icono": "⚙",
      "nombre": "Longitud de la probeta",
      "descripcion": "Lectura del banco en m."
    },
    {
      "icono": "⚙",
      "nombre": "Modo solicitado",
      "descripcion": "Indicador del ensayo."
    }
  ],
  "mision": [
    "Identifica empotramiento, viga y forma modal en el banco.",
    "Registra un ensayo variando longitud y modo.",
    "Frecuencia modal entre 45 y 80 Hz. Longitud de la probeta entre 0.8 y 1.2 m. Modo solicitado = 2."
  ],
  "aplicaciones": [
    {
      "area": "Vibraciones y Dinámica de Máquinas",
      "ejemplo": "Manipula longitud y modo. Compara las lecturas con la orden de trabajo."
    }
  ]
};
export default briefing;
