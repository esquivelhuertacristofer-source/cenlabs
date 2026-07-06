import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Motor de C.C.',
      mensaje: 'Construiremos un motor eléctrico simple. ¡Convirtamos electricidad en movimiento!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Configuración Magnética',
      mensaje: 'Orienta los imanes (Norte/Sur). La dirección del campo magnético determinará el sentido del giro.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Número de Espiras',
      mensaje: 'Aumenta las vueltas de la bobina. Más espiras significan un mayor torque motor.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Encendido de Motor',
      mensaje: 'Cierra el circuito y mide las RPM. Valida cuando el motor alcance la velocidad de diseño.',
      accion: 'Validar Torque',
    }
  ];

export default tutorSteps;
