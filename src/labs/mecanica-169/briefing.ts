import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-169",
  "titulo": "Robot delta: tres brazos que cooperan para mover una herramienta",
  "subtitulo": "Autotrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Haz que tres brazos lleven una pieza por una trayectoria común sin perder alcance ni exigir giros excesivos.\nCada brazo debe llegar al mismo efector. Alejar la trayectoria o acercarla demasiado a la base cambia mucho las articulaciones.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Haz que tres brazos lleven una pieza por una trayectoria común sin perder alcance ni exigir giros excesivos."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Traza un círculo de radio ≥250 mm, alcanzable entero, sin superar 2 rad/s en ningún motor."
    }
  ],
  "mision": [
    "Observa el mecanismo y cambia un parámetro cada vez.",
    "Traza un círculo de radio ≥250 mm, alcanzable entero, sin superar 2 rad/s en ningún motor.",
    "Valida, diagnostica un caso distinto y responde la pregunta de cierre."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Robot delta: tres brazos que cooperan para mover una herramienta"
    }
  ]
};
export default briefing;
