import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Soy el Dr. Quantum. Tu misión es ajustar los controles del piloto hasta que tu parábola coincida con la trayectoria guía (la línea punteada blanca). ¡Empecemos!',
    },
    {
      id: 2, tipo: 'calculo', pista: 'Calcula Δ',
      mensaje: 'Primero calcula el DISCRIMINANTE. La fórmula es: Δ = b² − 4ac. Sustituye los valores a, b y c que ves en la Sonda de Telemetría del piloto. Anota el resultado en la Bitácora.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Ubica el Vértice',
      mensaje: '¡Bien! Ahora calcula la abscisa del vértice: h = −b ÷ (2a). Ese punto es el máximo o mínimo de la parábola — lo verás marcado en rojo en la gráfica. Verifícalo en la Bitácora.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Ajusta el coeficiente a',
      mensaje: 'Usa el control "Amplitud (a)" del dock inferior. Si a > 0, la parábola abre hacia ARRIBA (mínimo). Si a < 0, abre hacia ABAJO (máximo). Asegúrate de que tu parábola tenga la misma concavidad que la guía.',
    },
    {
      id: 5, tipo: 'accion', pista: 'Ajusta b y c',
      mensaje: 'El control "Simetría (b)" desplaza el vértice horizontalmente. El control "Intercepto (c)" mueve toda la parábola arriba o abajo. Ajusta ambos para acercar tu curva a la trayectoria guía.',
    },
    {
      id: 6, tipo: 'calculo', pista: 'Verifica las 3 Formas',
      mensaje: 'Observa el panel "3 Formas Equivalentes". Verifica que la Forma Vértice a(x−h)²+k y la Forma Factorizada a(x−r₁)(x−r₂) representen la misma ecuación. Son tres expresiones algebraicamente idénticas.',
    },
    {
      id: 7, tipo: 'verificar', pista: 'Valida la Trayectoria',
      mensaje: '¡Listo! Cuando tu parábola coincida visualmente con la guía y el % SYNC esté alto, presiona "Validar Trayectoria" en el dock. Validar en el primer intento te da ⭐⭐⭐.',
      accion: 'Ir a Validar →',
    },
    {
      id: 8, tipo: 'logro', pista: '¡Misión Cumplida!',
      mensaje: '¡Fenomenal! Has dominado las tres formas de la ecuación cuadrática. Recuerda: esta función describe trayectorias reales — desde proyectiles hasta antenas parabólicas. ¡La matemática está en todas partes!',
    },
  ];

export default tutorSteps;
