import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-175",
  "titulo": "Volante de inercia: almacenar energía sin exceder el esfuerzo del aro",
  "subtitulo": "Autotrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Almacena energía haciendo girar un aro y equilibra capacidad, velocidad y esfuerzo del material.\nUn radio o giro mayor guarda más energía, pero también aumenta la tensión que tiende a abrir el aro. El motor-generador entrega un pulso y recupera la energía.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Almacena energía haciendo girar un aro y equilibra capacidad, velocidad y esfuerzo del material."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Reserva ≥250 kJ útiles, tensión del aro ≤350 MPa y energía total inicial ≤650 kJ."
    }
  ],
  "mision": [
    "Observa el mecanismo y cambia un parámetro cada vez.",
    "Reserva ≥250 kJ útiles, tensión del aro ≤350 MPa y energía total inicial ≤650 kJ.",
    "Valida, diagnostica un caso distinto y responde la pregunta de cierre."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Volante de inercia: almacenar energía sin exceder el esfuerzo del aro"
    }
  ]
};
export default briefing;
