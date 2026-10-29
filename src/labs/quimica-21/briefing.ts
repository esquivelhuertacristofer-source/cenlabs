import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "QMI-21",
  "titulo": "Recuperación de metales: precipitación selectiva",
  "subtitulo": "Química Ambiental",
  "acento": "#219EBC",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Una mezcla produce sólidos que se separan; evaluar selectividad, recuperación y balance de masa.\n\nCalcula el porcentaje de cobre recuperado y analiza la co-precipitación de magnesio.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Solubilidad",
      "descripcion": "El producto iónico fija la precipitación."
    },
    {
      "icono": "📐",
      "nombre": "Selectividad",
      "descripcion": "La recuperación alta no garantiza pureza."
    },
    {
      "icono": "📊",
      "nombre": "pH",
      "descripcion": "OH⁻ cambia exponencialmente con pH."
    }
  ],
  "mision": [
    "Inspecciona «Dosificador de reactivo» y «Precipitado de cobre» con Explorar en 3D.",
    "Ajusta «pH del medio», «Volumen tratado» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Recuperación de metales",
      "ejemplo": "Comparar recuperación de cobre con selectividad frente a co-precipitación."
    }
  ],
  "imagen": "/images/ciencias/quimica-21.webp?v=86c01c420096"
};
export default briefing;
