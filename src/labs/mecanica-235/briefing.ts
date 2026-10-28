import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-235",
  "titulo": "Motor neumático de paletas: par y consumo",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Las paletas se extienden sobre una cámara excéntrica y convierten aire comprimido en giro.\nOT-235 · Trabaja a900–1800 rpm con potencia ≥80 W, consumo ≤220 L/min y rendimiento respecto al máximo isotérmico ≥18 %.\nMotor de paletas abierto, freno de carga y analizador de consumo.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Las paletas se extienden sobre una cámara excéntrica y convierten aire comprimido en giro."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Trabaja a900–1800 rpm con potencia ≥80 W, consumo ≤220 L/min y rendimiento respecto al máximo isotérmico ≥18 %."
    }
  ],
  "mision": [
    "Identifica los componentes y consulta las condiciones de la orden.",
    "Ajusta ambos parámetros y compara las mediciones con los criterios.",
    "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia.",
    "Trabaja a900–1800 rpm con potencia ≥80 W, consumo ≤220 L/min y rendimiento respecto al máximo isotérmico ≥18 %."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Motor neumático de paletas: par y consumo"
    }
  ]
};
export default briefing;
