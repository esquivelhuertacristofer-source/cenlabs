import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Bienvenido al Forge Atómico de CEN Labs. Tu misión es construir un isótopo estable del elemento objetivo. ¡Empecemos!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Configura Protones',
      mensaje: 'Usa el panel de partículas para añadir Protones (Z). Recuerda: el número de protones define la identidad del elemento en la tabla periódica.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Añade Neutrones',
      mensaje: 'Ahora añade Neutrones (N). Estos aportan masa (A = Z + N) y actúan como el "pegamento" nuclear. Verifica la estabilidad en el gráfico de la derecha.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Distribuye Electrones',
      mensaje: 'Añade Electrones para equilibrar la carga. Un átomo neutro tiene tantos electrones como protones. Observa cómo se llenan los niveles de energía (1s², 2s²...).',
    },
    {
      id: 5, tipo: 'calculo', pista: 'Diagrama de Segré',
      mensaje: 'Observa el panel de telemetría inferior. Tu isótopo debe estar dentro de la banda de estabilidad (puntos verdes). Si está fuera, será radiactivo.',
    },
    {
      id: 6, tipo: 'verificar', pista: 'Valida la Estructura',
      mensaje: 'Cuando alcances los valores objetivo y el núcleo sea estable, presiona "Validar Práctica" en la cabecera. ¡La precisión atómica es fundamental!',
      accion: 'Validar Isótopo',
    },
    {
      id: 7, tipo: 'logro', pista: '¡Átomo Forjado!',
      mensaje: '¡Excelente! Has dominado la arquitectura de la materia. Recuerda: la estabilidad nuclear depende del equilibrio entre la fuerza fuerte y la repulsión electromagnética.',
    },
  ];

export default tutorSteps;
