import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-273",
  "titulo": "Velocidad crítica de rotor giroscópico",
  "subtitulo": "Vibraciones y Dinámica de Máquinas",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Cruza el mapa de velocidades y observa cómo se separan las ramas de precesión.\nOT-273 · Antes de programar el variador, delimita una zona de giro donde la órbita esté controlada y las ramas de precesión se distingan.",
  "conceptos": [
    {
      "icono": "⚙",
      "nombre": "Amplitud de órbita",
      "descripcion": "Lectura del banco en mm."
    },
    {
      "icono": "⚙",
      "nombre": "Rama directa equivalente",
      "descripcion": "Lectura del banco en rpm."
    },
    {
      "icono": "⚙",
      "nombre": "Rama inversa equivalente",
      "descripcion": "Lectura del banco en rpm."
    }
  ],
  "mision": [
    "Identifica rotor, discos, apoyos y órbita en el banco.",
    "Registra un ensayo variando velocidad de giro y acoplamiento giroscópico.",
    "Amplitud de órbita entre 0 y 0.2 mm. Rama directa equivalente entre 1580 y 2200 rpm. Rama inversa equivalente entre 1000 y 1499 rpm."
  ],
  "aplicaciones": [
    {
      "area": "Vibraciones y Dinámica de Máquinas",
      "ejemplo": "Manipula velocidad de giro y acoplamiento giroscópico. Compara las lecturas con la orden de trabajo."
    }
  ]
};
export default briefing;
