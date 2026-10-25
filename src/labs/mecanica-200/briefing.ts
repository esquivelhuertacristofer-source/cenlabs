import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-200",
  "titulo": "Robot AMR: calibración y regreso al muelle",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Calibra un robot móvil de almacén para completar una ruta y regresar al muelle con posición y orientación correctas.\nOT-200 · Vuelve tras un cuadrado con error≤50 mm, orientación≤2° y escala de distancia dentro de1 %.\nAMR, encoders, muelle, plano de almacén y escáner de distancias.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Calibra un robot móvil de almacén para completar una ruta y regresar al muelle con posición y orientación correctas."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Vuelve tras un cuadrado con error≤50 mm, orientación≤2° y escala de distancia dentro de1 %."
    }
  ],
  "mision": [
    "Identifica las referencias, el instrumento y el objetivo de la orden.",
    "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
    "Valida manualmente y descarga la evidencia con la configuración ensayada.",
    "Vuelve tras un cuadrado con error≤50 mm, orientación≤2° y escala de distancia dentro de1 %."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Robot AMR: calibración y regreso al muelle"
    }
  ]
};
export default briefing;
