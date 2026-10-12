import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Reactivo Limitante',
      mensaje: '¡Hola, {alumno}! El reactor ya está cargado con dos reactivos. Tu misión es averiguar cuál se agota primero y cuánto sobra del otro, antes de encender la síntesis.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Datos del Reactor',
      mensaje: 'Lee en el panel izquierdo la ecuación balanceada, la masa cargada de cada reactivo y su masa molar. Con las flechas de arriba puedes cambiar de reacción.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Análisis Estequiométrico',
      mensaje: 'Calcula los moles de cada reactivo (n = m / M) y divídelos entre su coeficiente. El cociente menor indica el limitante. Con sus moles calcula cuánto del otro se consume; la diferencia, en gramos, es el exceso.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Registrar y Validar',
      mensaje: 'Elige el reactivo limitante, escribe la masa que sobra y pulsa «Registrar y validar». Si aciertas, el reactor ejecuta la síntesis y te muestra el rendimiento teórico.',
      accion: 'Registrar y validar',
    }
  ];

export default tutorSteps;
