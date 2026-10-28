import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-240",
  "titulo": "Plegado de chapa: fuerza y recuperación elástica",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Un punzón forma una chapa sobre una matriz en V y la pieza se abre ligeramente al descargar.\nOT-240 · Obtén ángulo descargado89–91°, fuerza ≤5,5 kN, material ≥280 MPa y carrera ≤10 mm.\nPlegadora abierta, punzón, matriz y chapa con recuperación elástica.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Un punzón forma una chapa sobre una matriz en V y la pieza se abre ligeramente al descargar."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Obtén ángulo descargado89–91°, fuerza ≤5,5 kN, material ≥280 MPa y carrera ≤10 mm."
    }
  ],
  "mision": [
    "Identifica los componentes y consulta las condiciones de la orden.",
    "Ajusta ambos parámetros y compara las mediciones con los criterios.",
    "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia.",
    "Obtén ángulo descargado89–91°, fuerza ≤5,5 kN, material ≥280 MPa y carrera ≤10 mm."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Plegado de chapa: fuerza y recuperación elástica"
    }
  ]
};
export default briefing;
