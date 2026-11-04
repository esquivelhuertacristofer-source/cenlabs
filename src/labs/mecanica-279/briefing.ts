import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-279",
  "titulo": "Impacto, restitución y energía",
  "subtitulo": "Vibraciones y Dinámica de Máquinas",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Ajusta la altura de caída y el material de contacto para contener el rebote sin perder energía de ensayo.\nOT-279 · Regula un ensayo de caída sobre una placa instrumentada. El impacto debe entregar energía medible y mantener el rebote dentro de la guía.",
  "conceptos": [
    {
      "icono": "⚙",
      "nombre": "Velocidad antes del impacto",
      "descripcion": "Lectura del banco en m/s."
    },
    {
      "icono": "⚙",
      "nombre": "Altura de rebote",
      "descripcion": "Lectura del banco en m."
    },
    {
      "icono": "⚙",
      "nombre": "Energía disipada",
      "descripcion": "Lectura del banco en J."
    }
  ],
  "mision": [
    "Identifica guías, percutor y placa de impacto en el banco.",
    "Registra un ensayo variando altura de caída y coeficiente de restitución.",
    "Velocidad antes del impacto entre 3 y 5 m/s. Altura de rebote entre 0 y 0.25 m. Energía disipada entre 10 y 20 J."
  ],
  "aplicaciones": [
    {
      "area": "Vibraciones y Dinámica de Máquinas",
      "ejemplo": "Manipula altura de caída y coeficiente de restitución. Compara las lecturas con la orden de trabajo."
    }
  ]
};
export default briefing;
