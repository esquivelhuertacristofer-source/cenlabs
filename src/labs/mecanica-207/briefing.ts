import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-207",
  "titulo": "Separación centrífuga: ajuste del proceso",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Ajusta una separadora para que partículas pequeñas alcancen la pared antes de salir con el caudal.\nOT-207 · Entrega ≥3 L/min, separa en≤90 % de la residencia, con esfuerzo de aro ≤15 MPa y velocidad periférica ≤35 m/s.\nTazón en corte, caudalímetro y trayectorias de partículas.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Ajusta una separadora para que partículas pequeñas alcancen la pared antes de salir con el caudal."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Entrega ≥3 L/min, separa en≤90 % de la residencia, con esfuerzo de aro ≤15 MPa y velocidad periférica ≤35 m/s."
    }
  ],
  "mision": [
    "Reconoce el banco, sus referencias y los límites de la orden.",
    "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
    "Contrasta todos los criterios, valida manualmente y conserva el informe.",
    "Entrega ≥3 L/min, separa en≤90 % de la residencia, con esfuerzo de aro ≤15 MPa y velocidad periférica ≤35 m/s."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Separación centrífuga: ajuste del proceso"
    }
  ]
};
export default briefing;
