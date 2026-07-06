import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Ley de Ohm',
      mensaje: '¡Hola, {alumno}! Bienvenido al Laboratorio de Electrónica. Tu misión es diseñar un circuito seguro para un componente delicado: un LED de alta luminosidad.',
    },
    {
      id: 2, tipo: 'calculo', pista: 'Trinidad Eléctrica',
      mensaje: 'Recuerda la relación fundamental: V = I · R. El voltaje empuja, la resistencia frena y la intensidad es el flujo resultante. ¡Dominar esto es dominar la energía!',
    },
    {
      id: 3, tipo: 'accion', pista: 'Configura la Fuente',
      mensaje: 'Ajusta el Voltaje de la fuente de poder en el HUD. Observa cómo los indicadores de telemetría reaccionan. A mayor voltaje, mayor presión sobre los electrones.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Selecciona Carga',
      mensaje: 'Elige una resistencia de carga del dock. Mira las bandas de colores en el componente SVG; representan el valor en Ohmios. Una resistencia mayor reducirá el flujo.',
    },
    {
      id: 5, tipo: 'calculo', pista: 'Predicción de Flujo',
      mensaje: 'Antes de cerrar el circuito, calcula la intensidad esperada: I = V / R. El LED se funde a los 35mA. Busca un valor cercano a los 20mA para máxima seguridad.',
    },
    {
      id: 6, tipo: 'accion', pista: 'Cierra el Circuito',
      mensaje: '¡Es hora! Presiona el interruptor "Cerrar Circuito". Observa el flujo de electrones (puntos amarillos) y el brillo del LED. ¡Si brilla en verde, lo lograste!',
    },
    {
      id: 7, tipo: 'verificar', pista: 'Validar Ingeniería',
      mensaje: 'Ingresa el valor de la resistencia que estás usando en el campo de texto y presiona "Validar V=IR". Esto certificará tu diseño en el sistema.',
      accion: 'Certificar Circuito',
    },
    {
      id: 8, tipo: 'logro', pista: '¡Ingeniero Eléctrico!',
      mensaje: '¡Excelente trabajo! Has protegido el componente y validado la Ley de Ohm. Has demostrado que puedes controlar la energía con precisión matemática.',
    },
  ];

export default tutorSteps;
