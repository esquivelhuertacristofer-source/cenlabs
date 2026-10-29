import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "BIO-12",
  "titulo": "Mitocondria y ATP sintasa",
  "subtitulo": "Bioquímica y Energía",
  "acento": "#10b981",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Gradiente de protones y motor molecular; relacionar transporte, energía y producción de ATP.\n\nCalcula la fuerza protón-motriz mínima necesaria para sintetizar tres ATP por vuelta en un rotor mitocondrialc8 ideal.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Gradiente",
      "descripcion": "La energía electroquímica puede impulsar trabajo rotacional."
    },
    {
      "icono": "📐",
      "nombre": "Estequiometría",
      "descripcion": "Ocho protones por vuelta se acoplan a tres eventos de síntesis."
    },
    {
      "icono": "📊",
      "nombre": "Costo total",
      "descripcion": "El transporte celular agrega costos no incluidos en el rotor ideal."
    }
  ],
  "mision": [
    "Inspecciona «Rotor c8» y «Cabeza catalítica F1» con Explorar en 3D.",
    "Ajusta «Fuerza protón-motriz», «Energía libre de fosforilación» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Bioenergética molecular",
      "ejemplo": "Relacionar un rotor experimental c8 con el balance ideal de protones y ATP."
    }
  ],
  "imagen": "/images/ciencias/biologia-12.webp?v=963f97701d31"
};
export default briefing;
