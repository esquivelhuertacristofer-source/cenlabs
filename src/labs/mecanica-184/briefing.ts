import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-184",
  "titulo": "Ensayo de un embrague centrífugo: ralentí, acoplamiento y calor",
  "subtitulo": "Autotrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Ajusta un embrague para que no arrastre al ralentí y pueda acelerar una carga sin calentarse demasiado.\nOT-184 · Revisa un accionamiento de máquina ligera que arrastra al ralentí. Debes ajustar la retención y comprobar el arranque contra la carga de prueba.\nTacómetros, traza de deslizamiento y balance térmico virtuales.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Ajusta un embrague para que no arrastre al ralentí y pueda acelerar una carga sin calentarse demasiado."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Trabaja a≥2800 rpm, acopla en≤2 s, calor≤6500 J y arrastre al ralentí≤0,5 N·m."
    }
  ],
  "mision": [
    "Mide el arrastre previsto a1200 rpm.",
    "Ajusta retención y régimen; ejecuta un arranque de prueba.",
    "Documenta tiempo, calor y condición de ralentí antes de aceptar el ajuste.",
    "Trabaja a≥2800 rpm, acopla en≤2 s, calor≤6500 J y arrastre al ralentí≤0,5 N·m."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Ensayo de un embrague centrífugo: ralentí, acoplamiento y calor"
    }
  ]
};
export default briefing;
