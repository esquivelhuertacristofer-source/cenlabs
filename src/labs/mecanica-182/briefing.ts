import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-182",
  "titulo": "Motorreductor de tornillo sin fin: par útil, pérdidas y reversibilidad",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Verifica un motorreductor que debe entregar par suficiente y comprueba cómo el rozamiento afecta su reversibilidad.\nOT-182 · Verifica un accionamiento de posicionamiento que necesita100 N·m de salida. Debes documentar rendimiento y reversibilidad sin confundirla con un freno de seguridad.\nTacómetro, cálculo de par y balance de potencia virtuales.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Verifica un motorreductor que debe entregar par suficiente y comprueba cómo el rozamiento afecta su reversibilidad."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Obtén ≥100 N·m, pérdidas ≤25 W y condición ideal de autobloqueo."
    }
  ],
  "mision": [
    "Revisa relación, condiciones de rozamiento y requisito de par.",
    "Prueba un ajuste y observa el balance de potencia.",
    "Registra la condición de retroceso y sus límites de aplicación.",
    "Obtén ≥100 N·m, pérdidas ≤25 W y condición ideal de autobloqueo."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Motorreductor de tornillo sin fin: par útil, pérdidas y reversibilidad"
    }
  ]
};
export default briefing;
