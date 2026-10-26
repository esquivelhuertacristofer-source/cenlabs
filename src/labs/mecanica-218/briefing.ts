import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-218",
  "titulo": "Diagnóstico CNC con ballbar",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Recorre un círculo con una barra de medida y ajusta dos compensaciones geométricas observando el error radial.\nOT-218 · Obtén desviación circular ≤3 µm y error radial máximo ≤2 µm ajustando escala y escuadra.\nCentro CNC, barra extensible y registro de desviación circular.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Recorre un círculo con una barra de medida y ajusta dos compensaciones geométricas observando el error radial."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Obtén desviación circular ≤3 µm y error radial máximo ≤2 µm ajustando escala y escuadra."
    }
  ],
  "mision": [
    "Observa la barra y la trayectoria circular de referencia.",
    "Ajusta las compensaciones comparando la firma radial.",
    "Registra un recorrido y valida los dos límites.",
    "Obtén desviación circular ≤3 µm y error radial máximo ≤2 µm ajustando escala y escuadra."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Diagnóstico CNC con ballbar"
    }
  ]
};
export default briefing;
