import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Ley de Ohm',
      mensaje: '¡Hola, {alumno}! Bienvenido al Laboratorio de Electrónica. Tu misión es diseñar la resistencia que protege a un LED rojo: que trabaje a 20 mA sin quemarse.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Sin resistencia',
      mensaje: 'En el Módulo 01 conecta la fuente y el LED (clic en cada pieza) y cierra el circuito. Sin nada que limite la corriente, sólo la frena la resistencia interna de la fuente: mira qué le pasa al LED.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Diseña R',
      mensaje: 'El LED se lleva unos 2 V (su caída directa V_f); el resto del voltaje cae en la resistencia. Por eso R = (V_fuente − V_f) / I. Calcula R para I = 20 mA con el voltaje de tu fuente.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Monta y ensaya',
      mensaje: 'En el Módulo 02 conecta fuente, resistencia y LED, escribe tu R calculada, ajusta la caja de resistencias a ese valor y cierra el circuito. Lee I, V de la resistencia y V del LED en el multímetro.',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Validar diseño',
      mensaje: 'Si el multímetro marca unos 20 mA y el LED brilla sin quemarse, tu diseño es correcto. Pulsa "Validar práctica".',
      accion: 'Certificar Circuito',
    },
    {
      id: 6, tipo: 'logro', pista: '¡Ingeniero Eléctrico!',
      mensaje: '¡Excelente trabajo! Has usado la Ley de Ohm teniendo en cuenta la caída del LED: así se diseña cualquier indicador luminoso.',
    },
  ];

export default tutorSteps;
