import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Bienvenido a la boya experimental. Tu misión es utilizar el Principio de Arquímedes para determinar la densidad de un material desconocido.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Selecciona Material',
      mensaje: 'Escoge el "Material ?" (Misterioso) en el dock. Observa su peso (W) en el dinamómetro mientras está fuera del agua.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Sumerge el Objeto',
      mensaje: 'Baja el bloque al tanque de fluido. Observa cómo el peso aparente disminuye debido a la fuerza de empuje (E).',
    },
    {
      id: 4, tipo: 'calculo', pista: 'Principio de Arquímedes',
      mensaje: 'Calcula el empuje E = W_aire - W_sumergido. Luego usa la fórmula E = ρ_fluido · g · V para encontrar el volumen del objeto si no lo conoces, o usa ρ_obj = m / V.',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Valida la Densidad',
      mensaje: 'Introduce la densidad calculada en kg/m³. Tienes un margen de error del 5%. ¡Mucha suerte!',
      accion: 'Validar Densidad',
    }
  ];

export default tutorSteps;
