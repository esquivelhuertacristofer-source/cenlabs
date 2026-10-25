import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-178",
  "titulo": "Ajuste de una leva: carrera, contacto y ángulo de presión",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Ajusta una leva de alimentación para que el seguidor complete su carrera sin perder contacto a la velocidad de producción.\nOT-178 · Una alimentadora debe trabajar a450 ciclos/min o más. En el banco comprobarás si su ley de movimiento evita aceleraciones excesivas y separación del seguidor.\nIndicador de desplazamiento, traza de aceleración y fuerza axial virtuales.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Ajusta una leva de alimentación para que el seguidor complete su carrera sin perder contacto a la velocidad de producción."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Consigue ≥450 ciclos/min, aceleración ≤80 m/s², presión ≤25° y contacto positivo en toda la vuelta."
    }
  ],
  "mision": [
    "Identifica la carrera y la duración de subida.",
    "Ajusta el régimen y el perfil; ejecuta el ensayo de una vuelta.",
    "Documenta el mínimo de contacto y los máximos de aceleración y ángulo.",
    "Consigue ≥450 ciclos/min, aceleración ≤80 m/s², presión ≤25° y contacto positivo en toda la vuelta."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Ajuste de una leva: carrera, contacto y ángulo de presión"
    }
  ]
};
export default briefing;
