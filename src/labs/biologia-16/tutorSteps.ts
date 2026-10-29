import type {TutorStep} from '@/components/DrQuantumTutor';
const tutorSteps:TutorStep[]=[
  {
    "id": 1,
    "tipo": "intro",
    "pista": "Explora",
    "mensaje": "Inspecciona «Pulmón y distensibilidad» y «Vías aéreas» con Explorar en 3D."
  },
  {
    "id": 2,
    "tipo": "accion",
    "pista": "Mide",
    "mensaje": "Ajusta «Distensibilidad», «Resistencia de vía aérea» y usa Revisar movimiento para comparar el fenómeno."
  },
  {
    "id": 3,
    "tipo": "calculo",
    "pista": "Calcula",
    "mensaje": "Adquiere un registro completo de 6 s y calcula el resultado solicitado."
  },
  {
    "id": 4,
    "tipo": "verificar",
    "pista": "Valida",
    "mensaje": "Valida tu respuesta y contrasta la interpretación en el quiz."
  }
];
export default tutorSteps;
