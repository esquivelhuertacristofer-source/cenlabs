import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Localización 2x2',
      mensaje: '¡Hola, {alumno}! Bienvenido a la central de rastreo. Tu objetivo es encontrar el punto exacto donde se interceptan dos haces láser para localizar un satélite.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Calibra Haz Alpha',
      mensaje: 'Usa los controles del Haz Alpha (m1, b1). La pendiente m1 determina la inclinación. Intenta que el haz pase cerca del objetivo rojo.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Calibra Haz Omega',
      mensaje: 'Ahora ajusta el Haz Omega (m2, b2). Busca que la intersección de ambas líneas coincida exactamente con la señal del satélite.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Sincronía de Coordenadas',
      mensaje: 'Cuando las líneas se crucen sobre el objetivo, el sistema mostrará "Coordinates Matched". Presiona Validar para asegurar el enlace.',
      accion: 'Validar Enlace',
    }
  ];

export default tutorSteps;
