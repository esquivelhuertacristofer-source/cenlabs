import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-267",
  "titulo": "Resortes: rigidez, esfuerzo y frecuencia",
  "subtitulo": "Elementos de Máquina",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Un alambre más grueso endurece mucho el resorte. La geometría también cambia su esfuerzo y la rapidez con que oscila.\nOT-267 · Selecciona el alambre y diámetro de un resorte para un carro horizontal de3 kg con precarga constante de30 N.",
  "conceptos": [
    {
      "icono": "🌀",
      "nombre": "Rigidez geométrica",
      "descripcion": "El alambre trabaja principalmente a torsión; su diámetro cambia fuertemente la rigidez."
    },
    {
      "icono": "📐",
      "nombre": "Esfuerzo corregido",
      "descripcion": "El factor de Wahl incorpora curvatura y cortante directo del alambre."
    },
    {
      "icono": "⏱️",
      "nombre": "Frecuencia del conjunto",
      "descripcion": "La frecuencia depende de rigidez y masa móvil, con una pequeña contribución del resorte."
    }
  ],
  "mision": [
    "Distingue alambre, diámetro medio y espiras activas.",
    "Compara frecuencia, compresión y esfuerzo al cambiar cada dimensión.",
    "Ensaya una selección conforme y justifica su carrera y margen de esfuerzo."
  ],
  "aplicaciones": [
    {
      "area": "Montaje y mantenimiento de máquinas",
      "ejemplo": "Seleccionar un elemento elástico de una máquina por carrera, esfuerzo y respuesta dinámica."
    }
  ]
};
export default briefing;
