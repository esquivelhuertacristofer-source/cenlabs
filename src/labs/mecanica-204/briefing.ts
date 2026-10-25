import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-204",
  "titulo": "CMM: palpador y compensación térmica",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Prepara una medición por coordenadas con dos patrones antes de inspeccionar una pieza de aluminio.\nOT-204 · Deja los patrones de 100 y 200 mm dentro de±0,005 mm. La sonda térmica del banco indica 30 °C.\nCMM, bola de rubí, patrones y referencia de temperatura.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Prepara una medición por coordenadas con dos patrones antes de inspeccionar una pieza de aluminio."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Deja los patrones de 100 y 200 mm dentro de±0,005 mm. La sonda térmica del banco indica 30 °C."
    }
  ],
  "mision": [
    "Reconoce el banco, sus referencias y los límites de la orden.",
    "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
    "Contrasta todos los criterios, valida manualmente y conserva el informe.",
    "Deja los patrones de 100 y 200 mm dentro de±0,005 mm. La sonda térmica del banco indica 30 °C."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "CMM: palpador y compensación térmica"
    }
  ]
};
export default briefing;
