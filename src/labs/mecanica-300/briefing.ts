import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-300",
  "titulo": "Mantenimiento predictivo por vibración",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Un rodamiento empieza a vibrar con más intensidad. Ajusta la ventana de diagnóstico y estima cuándo alcanzará el umbral del taller.\nOT-300 · Estima la alarma a 7–12 días, con al menos cinco muestras y residuo RMS ≤0,11 mm/s.",
  "conceptos": [
    {
      "icono": "⚙",
      "nombre": "Ventana demasiado larga",
      "descripcion": "La tendencia diluye el crecimiento reciente."
    },
    {
      "icono": "⚙",
      "nombre": "Mediciones escasas",
      "descripcion": "Quedan muy pocos puntos para estimar una pendiente."
    },
    {
      "icono": "⚙",
      "nombre": "Estimación fuera de rango",
      "descripcion": "La intersección se desplaza al cambiar el ajuste."
    }
  ],
  "mision": [
    "Acorta la ventana para captar la degradación reciente y compara el efecto de espaciar las mediciones.",
    "Ejecuta un ensayo y abre el instrumento de diagnóstico.",
    "Estima la alarma a 7–12 días, con al menos cinco muestras y residuo RMS ≤0,11 mm/s."
  ],
  "aplicaciones": [
    {
      "area": "Mecatrónica",
      "ejemplo": "Acorta la ventana para captar la degradación reciente y compara el efecto de espaciar las mediciones."
    }
  ]
};
export default briefing;
