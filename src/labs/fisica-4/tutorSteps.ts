import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Ley de Hooke',
      mensaje: 'Estudiaremos la elasticidad. Vamos a estirar resortes para encontrar su constante k.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Carga de Masas',
      mensaje: 'Método estático: cuelga al menos dos cargas distintas y registra la elongación x que marca la regla con la carga en reposo.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Constante k',
      mensaje: 'Calcula k = m·g / x para cada carga. ¿Es constante? Luego el método dinámico: suelta la carga desde una amplitud A y cronometra al menos 10 oscilaciones con tres cargas distintas y con dos amplitudes: k = 4π²m/T².',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Resorte',
      mensaje: 'Escribe tu k (los dos métodos deben coincidir, ±5 %), pulsa "Comprobar análisis" y valida tu práctica.',
      accion: 'Validar Elongación',
    }
  ];

export default tutorSteps;
