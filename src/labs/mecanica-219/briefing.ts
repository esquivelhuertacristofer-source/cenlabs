import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-219",
  "titulo": "Cambiador de herramientas: secuencia por bloques",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Programa el intercambio de dos herramientas y observa cómo las confirmaciones permiten cada movimiento.\nOT-219 · Verifica el programa de nueve bloques; usa cota ≥150 mm, velocidad ≤0,7 m/s, par ≤0,7 N·m y ciclo ≤8,5 s.\nBrazo doble, husillo, herramientas y editor de secuencia por bloques.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Programa el intercambio de dos herramientas y observa cómo las confirmaciones permiten cada movimiento."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Verifica el programa de nueve bloques; usa cota ≥150 mm, velocidad ≤0,7 m/s, par ≤0,7 N·m y ciclo ≤8,5 s."
    }
  ],
  "mision": [
    "Abre Programa y comprueba las dependencias entre bloques.",
    "Ajusta altura y tiempo del giro sin exceder velocidad o par.",
    "Ensaya el intercambio y descarga también la secuencia ejecutada.",
    "Verifica el programa de nueve bloques; usa cota ≥150 mm, velocidad ≤0,7 m/s, par ≤0,7 N·m y ciclo ≤8,5 s."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Cambiador de herramientas: secuencia por bloques"
    }
  ]
};
export default briefing;
