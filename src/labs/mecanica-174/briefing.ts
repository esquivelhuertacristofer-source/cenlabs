import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-174",
  "titulo": "Limpiaparabrisas de cuatro barras: de giro continuo a barrido",
  "subtitulo": "Autotrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Transforma el giro continuo de un motor en un barrido amplio que no se atasque durante la vuelta.\nLa manivela da vueltas completas; la biela empuja un balancín. Las longitudes determinan cuánto barre y si aparece una mala postura de transmisión.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Transforma el giro continuo de un motor en un barrido amplio que no se atasque durante la vuelta."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Logra un barrido de 75–95°, con vuelta completa de motor y ángulo de transmisión ≥35°."
    }
  ],
  "mision": [
    "Observa el mecanismo y cambia un parámetro cada vez.",
    "Logra un barrido de 75–95°, con vuelta completa de motor y ángulo de transmisión ≥35°.",
    "Valida, diagnostica un caso distinto y responde la pregunta de cierre."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Limpiaparabrisas de cuatro barras: de giro continuo a barrido"
    }
  ]
};
export default briefing;
