import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-179",
  "titulo": "Selección de pinza paralela: fuerza, presión de contacto y margen de agarre",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Selecciona la geometría y el par de una pinza que sujete una pieza sin deslizar ni dañar sus superficies.\nOT-179 · Debes elegir una pinza compacta para una pieza de2 kg con caras delicadas. Presenta capacidad de agarre, presión y dimensión del mecanismo.\nMedición virtual de abertura, fuerza y presión; útil de apoyo para la prueba.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Selecciona la geometría y el par de una pinza que sujete una pieza sin deslizar ni dañar sus superficies."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Sujeta2 kg con margen ≥1,3, presión ≤0,4 MPa y barras de ≤85 mm."
    }
  ],
  "mision": [
    "Lee masa, fricción y presión admisible de la pieza de ensayo.",
    "Configura palancas y par; realiza el ciclo con la pieza apoyada.",
    "Justifica el margen y exporta el ajuste que cumple.",
    "Sujeta2 kg con margen ≥1,3, presión ≤0,4 MPa y barras de ≤85 mm."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Selección de pinza paralela: fuerza, presión de contacto y margen de agarre"
    }
  ]
};
export default briefing;
