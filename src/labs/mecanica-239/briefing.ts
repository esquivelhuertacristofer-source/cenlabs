import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-239",
  "titulo": "Robot flexible: curvatura y tendones",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Una columna flexible curva su cuerpo con tendones y aproxima una herramienta a un objetivo.\nOT-239 · Alcanza el objetivo patrón con error ≤5 mm, fuerza diferencial ≤7 N y flexión máxima ≤90°. Objetivo cartesiano: (71.78,247.84,124.32) mm.\nRobot continuo de tendones, guías, herramienta y objetivo espacial.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Una columna flexible curva su cuerpo con tendones y aproxima una herramienta a un objetivo."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Alcanza el objetivo patrón con error ≤5 mm, fuerza diferencial ≤7 N y flexión máxima ≤90°."
    }
  ],
  "mision": [
    "Identifica los componentes y consulta las condiciones de la orden.",
    "Ajusta ambos parámetros y compara las mediciones con los criterios.",
    "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia.",
    "Alcanza el objetivo patrón con error ≤5 mm, fuerza diferencial ≤7 N y flexión máxima ≤90°."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Robot flexible: curvatura y tendones"
    }
  ]
};
export default briefing;
