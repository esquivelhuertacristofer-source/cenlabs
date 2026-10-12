import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Soy el Dr. Quantum. La trayectoria objetivo no trae su ecuación: sólo conoces TRES PUNTOS MEDIDOS (la guía punteada y la tabla del panel). Tu misión es deducir a, b y c.',
    },
    {
      id: 2, tipo: 'calculo', pista: 'Usa los puntos',
      mensaje: 'Con x = −1, 0 y 1 el sistema sale directo: f(0) = c; f(1) − f(−1) = 2b; f(1) + f(−1) = 2a + 2c. Despeja los tres coeficientes.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Ajusta a, b y c',
      mensaje: 'Mueve los controles del dock. La tabla compara tu f(x) con cada punto medido: cuando las tres filas coincidan, tu parábola es la de la trayectoria.',
    },
    {
      id: 4, tipo: 'calculo', pista: 'Calcula Δ',
      mensaje: 'Con TUS coeficientes calcula el discriminante Δ = b² − 4ac y compruébalo en la Bitácora. Su signo dice cuántas raíces reales tiene la parábola.',
    },
    {
      id: 5, tipo: 'calculo', pista: 'Ubica el Vértice',
      mensaje: 'Calcula la abscisa del vértice h = −b ÷ (2a) y compruébala en la Bitácora. Ese punto es el máximo o el mínimo de la parábola.',
    },
    {
      id: 6, tipo: 'verificar', pista: 'Valida la Trayectoria',
      mensaje: 'Con Δ y h comprobados y la parábola sobre los tres puntos, presiona «Validar» en el dock.',
      accion: 'Validar',
    },
    {
      id: 7, tipo: 'logro', pista: '¡Misión Cumplida!',
      mensaje: '¡Fenomenal! Reconstruiste una función cuadrática a partir de mediciones: así se ajustan trayectorias reales, desde proyectiles hasta antenas parabólicas.',
    },
  ];

export default tutorSteps;
