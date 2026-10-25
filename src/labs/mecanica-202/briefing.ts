import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-202",
  "titulo": "Reflectometría TDR de un cable",
  "subtitulo": "Autotrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Configura un reflectómetro para separar dos discontinuidades próximas y reducir la reflexión del extremo del cable.\nOT-202 · Resuelve ≤0,6 m, requiere ≤80 MHz y deja el valor absoluto de la reflexión final ≤0,05.\nReflectómetro, generador gaussiano, terminador y cable seccionado.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Configura un reflectómetro para separar dos discontinuidades próximas y reducir la reflexión del extremo del cable."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Resuelve ≤0,6 m, requiere ≤80 MHz y deja el valor absoluto de la reflexión final ≤0,05."
    }
  ],
  "mision": [
    "Reconoce el banco, sus referencias y los límites de la orden.",
    "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
    "Contrasta todos los criterios, valida manualmente y conserva el informe.",
    "Resuelve ≤0,6 m, requiere ≤80 MHz y deja el valor absoluto de la reflexión final ≤0,05."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Reflectometría TDR de un cable"
    }
  ]
};
export default briefing;
