import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Teorema Universal',
      mensaje: '¡Hola! Vamos a demostrar físicamente que a² + b² = c². Observa los contenedores de agua sobre los catetos.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Define Dimensiones',
      mensaje: 'Ajusta la longitud de los catetos A y B. Observa cómo el área de los cuadrados cambia dinámicamente.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Trasvase de Fluidos',
      mensaje: 'Activa el flujo de agua. Si el Teorema es cierto, el volumen de los dos cuadrados pequeños debe llenar EXACTAMENTE el cuadrado de la hipotenusa.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Cálculo de C',
      mensaje: 'Calcula la raíz cuadrada de la suma de las áreas e ingresa el valor de la hipotenusa (c).',
      accion: 'Verificar Hipotenusa',
    }
  ];

export default tutorSteps;
