import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-198",
  "titulo": "Alineación láser de maquinaria",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Corrige dos apoyos de un motor para eliminar desplazamiento y ángulo respecto de una bomba.\nOT-198 · Deja desplazamiento≤0,03 mm y ángulo≤0,1 mrad ajustando ambos apoyos.\nCabezal láser, receptor, apoyos y registro de alineación.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Corrige dos apoyos de un motor para eliminar desplazamiento y ángulo respecto de una bomba."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Deja desplazamiento≤0,03 mm y ángulo≤0,1 mrad ajustando ambos apoyos."
    }
  ],
  "mision": [
    "Identifica las referencias, el instrumento y el objetivo de la orden.",
    "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
    "Valida manualmente y descarga la evidencia con la configuración ensayada.",
    "Deja desplazamiento≤0,03 mm y ángulo≤0,1 mrad ajustando ambos apoyos."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Alineación láser de maquinaria"
    }
  ]
};
export default briefing;
