import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-206",
  "titulo": "Calidad eléctrica: armónicos y filtrado",
  "subtitulo": "Máquinas Eléctricas",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Dimensiona un filtrado virtual para mejorar una corriente distorsionada sin sobrecargar el filtro ni perder demasiada tensión.\nOT-206 · Consigue THD ≤15 %, factor de potencia ≥0,93, corriente del filtro ≤4 A y caída fundamental ≤15 V.\nAnalizador trifásico, pinzas, reactor y filtro activo virtuales.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Dimensiona un filtrado virtual para mejorar una corriente distorsionada sin sobrecargar el filtro ni perder demasiada tensión."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Consigue THD ≤15 %, factor de potencia ≥0,93, corriente del filtro ≤4 A y caída fundamental ≤15 V."
    }
  ],
  "mision": [
    "Reconoce el banco, sus referencias y los límites de la orden.",
    "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
    "Contrasta todos los criterios, valida manualmente y conserva el informe.",
    "Consigue THD ≤15 %, factor de potencia ≥0,93, corriente del filtro ≤4 A y caída fundamental ≤15 V."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Calidad eléctrica: armónicos y filtrado"
    }
  ]
};
export default briefing;
