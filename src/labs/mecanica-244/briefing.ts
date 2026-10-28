import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-244",
  "titulo": "Sincronizador de caja: igualar antes de engranar",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Un cono de fricción iguala dos velocidades antes de que el manguito acople los dientes.\nOT-244 · Sincroniza en ≤1,2 s con par ≤4 N·m, fuerza axial ≤140 N y coeficiente ≥0,065.\nSincronizador abierto, horquilla y registro de régimen relativo.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Un cono de fricción iguala dos velocidades antes de que el manguito acople los dientes."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Sincroniza en ≤1,2 s con par ≤4 N·m, fuerza axial ≤140 N y coeficiente ≥0,065."
    }
  ],
  "mision": [
    "Identifica los componentes y consulta las condiciones de la orden.",
    "Ajusta ambos parámetros y compara las mediciones con los criterios.",
    "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia.",
    "Sincroniza en ≤1,2 s con par ≤4 N·m, fuerza axial ≤140 N y coeficiente ≥0,065."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Sincronizador de caja: igualar antes de engranar"
    }
  ]
};
export default briefing;
