import type {BriefingConfig} from '@/components/MissionBriefing';
const briefing:BriefingConfig={
  "codigo": "MAT-21",
  "titulo": "Estabilidad de métodos numéricos: Euler frente a RK4",
  "subtitulo": "Cálculo y Métodos Numéricos",
  "acento": "#8b5cf6",
  "duracion": 40,
  "videoUrl": "",
  "bienvenida": "Un sistema térmico se simula con pasos distintos; medir error y detectar soluciones numéricas inestables.\n\nCalcula el error absoluto de Euler al final del registro, como porcentaje de la diferencia térmica inicial.",
  "conceptos": [
    {
      "icono": "🔬",
      "nombre": "Discretización",
      "descripcion": "El paso cambia el error y la estabilidad."
    },
    {
      "icono": "📐",
      "nombre": "Referencia",
      "descripcion": "La solución cerrada permite contrastar métodos."
    },
    {
      "icono": "📊",
      "nombre": "Estabilidad",
      "descripcion": "Una solución numérica puede oscilar aunque la física decaiga."
    }
  ],
  "mision": [
    "Inspecciona «Aproximación de Euler» y «Aproximación RK4» con Explorar en 3D.",
    "Ajusta «Paso de integración» y usa Revisar movimiento para comparar el fenómeno.",
    "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
    "Valida tu respuesta y contrasta la interpretación en el quiz."
  ],
  "aplicaciones": [
    {
      "area": "Validación de simulaciones",
      "ejemplo": "Detectar inestabilidad numérica y comparar métodos a un mismo tiempo físico."
    }
  ],
  "imagen": "/images/ciencias/matematicas-21.webp?v=407361967dce"
};
export default briefing;
