import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "MAT-14",
  "titulo": "Ajuste de modelos y análisis de residuos",
  "subtitulo": "Estadística Aplicada",
  "acento": "#8b5cf6",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Datos de un banco de ensayo; elegir un modelo y detectar sesgo, ruido y valores atípicos.\n\nAjusta por mínimos cuadrados una recta a los nueve datos y calcula su pendiente.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Ajuste",
      "descripcion": "Minimiza la suma de cuadrados de residuos."
    },
    {
      "icono": "📐",
      "nombre": "Residuos",
      "descripcion": "Un patrón curvo sugiere error de modelo."
    },
    {
      "icono": "📊",
      "nombre": "Atípico",
      "descripcion": "Un dato extremo puede cambiar la pendiente."
    }
  ],
  "mision": [
    "Inspecciona «Probeta de ensayo» y «Extensómetro» con Explorar en 3D.",
    "Ajusta «Curvatura oculta al ajuste», «Desviación del dato 7» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Análisis de bancos de ensayo",
      "ejemplo": "Ajustar una recta y detectar curvatura o influencia de un valor atípico."
    }
  ],
  "imagen": "/images/ciencias/matematicas-14.webp?v=94af4a7b9a8f"
};
export default briefing;
