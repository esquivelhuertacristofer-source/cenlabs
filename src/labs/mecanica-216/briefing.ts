import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-216",
  "titulo": "Inspección de engranajes: juego y contacto",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Invierte el giro y relaciona el juego libre con la distribución de carga a lo ancho del diente.\nOT-216 · Ajusta juego 0,10–0,20 mm, contacto ≥90 % y carga lineal máxima ≤1,6 veces la media.\nPar de engranes, comparador de inversión y visor de contacto.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Invierte el giro y relaciona el juego libre con la distribución de carga a lo ancho del diente."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Ajusta juego 0,10–0,20 mm, contacto ≥90 % y carga lineal máxima ≤1,6 veces la media."
    }
  ],
  "mision": [
    "Invierte el giro y observa el recorrido libre.",
    "Ajusta entrecentros e inclinación y compara juego y carga.",
    "Adquiere una inversión completa antes de validar el montaje.",
    "Ajusta juego 0,10–0,20 mm, contacto ≥90 % y carga lineal máxima ≤1,6 veces la media."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Inspección de engranajes: juego y contacto"
    }
  ]
};
export default briefing;
