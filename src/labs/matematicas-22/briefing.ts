import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "MAT-22",
  "titulo": "Bayes en inspección: defectos y falsas alarmas",
  "subtitulo": "Estadística Aplicada",
  "acento": "#8b5cf6",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Lotes atraviesan un detector; distinguir sensibilidad, tasa base y probabilidad posterior.\n\nCalcula la probabilidad de defecto entre las piezas que activan la alarma.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Condicional",
      "descripcion": "P(D|+) difiere de P(+|D)."
    },
    {
      "icono": "📐",
      "nombre": "Tasa base",
      "descripcion": "Los defectos raros pueden producir baja precisión positiva."
    },
    {
      "icono": "📊",
      "nombre": "Falsa alarma",
      "descripcion": "Muchos conformes pueden dominar las alarmas."
    }
  ],
  "mision": [
    "Inspecciona «Estación de detección» y «Flujo de inspección» con Explorar en 3D.",
    "Ajusta «Tasa base de defectos», «Falsa alarma sobre piezas conformes» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Inspección automatizada",
      "ejemplo": "Distinguir sensibilidad de probabilidad posterior y considerar la tasa base."
    }
  ],
  "imagen": "/images/ciencias/matematicas-22.webp?v=c68fdb4c1541"
};
export default briefing;
