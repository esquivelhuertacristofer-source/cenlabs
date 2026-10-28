import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-245",
  "titulo": "Fricción-agitación: unir sin fundir",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Una herramienta rotativa atraviesa la junta y deja un cordón continuo entre dos placas sujetas.\nOT-245 · Mantén500–800 J/mm, temperatura equivalente350–500 °C y potencia ≤1100 W.\nBanco FSW con sujeción, herramienta no consumible y balance energético.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Una herramienta rotativa atraviesa la junta y deja un cordón continuo entre dos placas sujetas."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Mantén500–800 J/mm, temperatura equivalente350–500 °C y potencia ≤1100 W."
    }
  ],
  "mision": [
    "Identifica los componentes y consulta las condiciones de la orden.",
    "Ajusta ambos parámetros y compara las mediciones con los criterios.",
    "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia.",
    "Mantén500–800 J/mm, temperatura equivalente350–500 °C y potencia ≤1100 W."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Fricción-agitación: unir sin fundir"
    }
  ]
};
export default briefing;
