import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-172",
  "titulo": "Balanceo dinámico: corregir un par de desequilibrio en dos planos",
  "subtitulo": "Autotrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Corrige una rueda que parece equilibrada en reposo, pero hace vibrar los apoyos cuando gira.\nDos desequilibrios opuestos no dejan una fuerza neta, pero sí un par oscilante. La corrección necesita dos pesos, uno en cada plano.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Corrige una rueda que parece equilibrada en reposo, pero hace vibrar los apoyos cuando gira."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Reduce la fuerza en cada apoyo a ≤0,7 N usando como máximo 45 g por plano."
    }
  ],
  "mision": [
    "Observa el mecanismo y cambia un parámetro cada vez.",
    "Reduce la fuerza en cada apoyo a ≤0,7 N usando como máximo 45 g por plano.",
    "Valida, diagnostica un caso distinto y responde la pregunta de cierre."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Balanceo dinámico: corregir un par de desequilibrio en dos planos"
    }
  ]
};
export default briefing;
