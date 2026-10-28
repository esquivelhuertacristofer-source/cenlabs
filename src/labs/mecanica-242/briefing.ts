import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-242",
  "titulo": "Robot por impedancia: tocar sin golpear",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Un brazo acerca una herramienta a un palpador elástico y registra la fuerza de contacto.\nOT-242 · Obtén fuerza final14–18 N, pico ≤22 N y establecimiento a2 % ≤1 s.\nBrazo articulado, palpador elástico y adquisición de fuerza.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Un brazo acerca una herramienta a un palpador elástico y registra la fuerza de contacto."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Obtén fuerza final14–18 N, pico ≤22 N y establecimiento a2 % ≤1 s."
    }
  ],
  "mision": [
    "Identifica los componentes y consulta las condiciones de la orden.",
    "Ajusta ambos parámetros y compara las mediciones con los criterios.",
    "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia.",
    "Obtén fuerza final14–18 N, pico ≤22 N y establecimiento a2 % ≤1 s."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Robot por impedancia: tocar sin golpear"
    }
  ]
};
export default briefing;
