import type { BriefingConfig } from '@/components/MissionBriefing';
const briefing: BriefingConfig = {
  "codigo": "MEC-247",
  "titulo": "Hidroformado de tubo: presión y alimentación axial",
  "subtitulo": "Mecatrónica",
  "acento": "#2A9D8F",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Un tubo se expande dentro de una matriz seccionada mientras dos punzones alimentan material desde los extremos.\nOT-247 · Llena la matriz hasta radio ≥25,8 mm con adelgazamiento ≤18 %, presión ≤16 MPa y cierre ≤160 kN.\nCelda de hidroformado seccionada con punzones axiales y espesor medido.",
  "conceptos": [
    {
      "icono": "⚙️",
      "nombre": "Mecanismo",
      "descripcion": "Un tubo se expande dentro de una matriz seccionada mientras dos punzones alimentan material desde los extremos."
    },
    {
      "icono": "📊",
      "nombre": "Modelo medible",
      "descripcion": "Relaciona los instrumentos con la geometría y el mismo reloj."
    },
    {
      "icono": "🔎",
      "nombre": "Diseño y diagnóstico",
      "descripcion": "Llena la matriz hasta radio ≥25,8 mm con adelgazamiento ≤18 %, presión ≤16 MPa y cierre ≤160 kN."
    }
  ],
  "mision": [
    "Identifica los componentes y consulta las condiciones de la orden.",
    "Ajusta ambos parámetros y compara las mediciones con los criterios.",
    "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia.",
    "Llena la matriz hasta radio ≥25,8 mm con adelgazamiento ≤18 %, presión ≤16 MPa y cierre ≤160 kN."
  ],
  "aplicaciones": [
    {
      "area": "Autotrónica y automatización",
      "ejemplo": "Hidroformado de tubo: presión y alimentación axial"
    }
  ]
};
export default briefing;
