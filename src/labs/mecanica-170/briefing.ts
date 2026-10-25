import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-170",
  "titulo": "Plataforma Stewart: movimiento y reparto de carga entre seis actuadores",
  "subtitulo": "Autotrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Inclina una plataforma coordinando seis actuadores y comprueba que ninguno se queda sin recorrido ni fuerza.\nLas seis patas cambian de longitud a la vez. La altura y la inclinación modifican tanto el recorrido como el reparto del peso.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Inclina una plataforma coordinando seis actuadores y comprueba que ninguno se queda sin recorrido ni fuerza."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Logra ≥8° de balanceo; durante todo el ciclo conserva patas entre 0,65–1,35 m y fuerzas ≤2200 N."
    }
  ],
  "mision": [
    "Observa el mecanismo y cambia un parámetro cada vez.",
    "Logra ≥8° de balanceo; durante todo el ciclo conserva patas entre 0,65–1,35 m y fuerzas ≤2200 N.",
    "Valida, diagnostica un caso distinto y responde la pregunta de cierre."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Plataforma Stewart: movimiento y reparto de carga entre seis actuadores"
    }
  ]
};
export default briefing;
