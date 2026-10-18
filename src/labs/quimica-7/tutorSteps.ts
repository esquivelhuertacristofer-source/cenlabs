import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Misión: Valoración',
      mensaje: '¡Hola, {alumno}! Tu objetivo es determinar la concentración de HCl. Primero, purga la bureta con el botón «Purgar bureta».',
    },
    {
      id: 2, tipo: 'accion', pista: 'Indicador de Color',
      mensaje: 'Añade el indicador de Fenolftaleína al matraz Erlenmeyer. Sin él, no podremos ver el punto de equivalencia.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Control de Válvula',
      mensaje: 'Abre la llave de la bureta suavemente. Te recomiendo usar un goteo lento cuando te acerques al pH 7. ¡La precisión es clave!',
    },
    {
      id: 4, tipo: 'calculo', pista: 'Curva de pH',
      mensaje: 'Observa el gráfico. El salto brusco de pH te indicará que estás cerca del punto de equivalencia. ¡Cuidado con pasarte!',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Viraje Rosa',
      mensaje: 'Detén el flujo en cuanto veas el primer cambio a rosa pálido persistente. Ese es el Punto Final de la titulación.',
    },
    {
      id: 6, tipo: 'verificar', pista: 'Finalizar',
      mensaje: '¡Excelente! Lee el volumen de NaOH gastado y calcula [HCl] = Cb·Vb / Va (Cb = 0,1 M, Va = 25 mL). Escríbela y pulsa «Enviar».',
      accion: 'Validar Titulación',
    }
  ];

export default tutorSteps;
