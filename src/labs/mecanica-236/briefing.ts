import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-236",
  "titulo": "Engranaje magnético: transmisión sin contacto",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Dos coronas de imanes y un modulador fijo transmiten par con velocidades opuestas.\nOT-236 · Entrega ≥120 W con margen ≥2 N·m, par de entrada ≤3,5 N·m y entrehierro ≥1,5 mm.\nAcoplamiento magnético coaxial abierto, imanes alternos y freno de banco.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Dos coronas de imanes y un modulador fijo transmiten par con velocidades opuestas."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Entrega ≥120 W con margen ≥2 N·m, par de entrada ≤3,5 N·m y entrehierro ≥1,5 mm."
    }
  ],
  "mision": [
    "Identifica los componentes y consulta las condiciones de la orden.",
    "Ajusta ambos parámetros y compara las mediciones con los criterios.",
    "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia.",
    "Entrega ≥120 W con margen ≥2 N·m, par de entrada ≤3,5 N·m y entrehierro ≥1,5 mm."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Engranaje magnético: transmisión sin contacto"
    }
  ]
};
export default briefing;
