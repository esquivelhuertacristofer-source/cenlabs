import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Motor de C.C.',
      mensaje: 'Construiremos un motor eléctrico simple. ¡Convirtamos electricidad en movimiento!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Configuración Magnética',
      mensaje: 'Orienta los imanes. Con polos opuestos enfrentados (N–S) el campo atraviesa la bobina; con polos iguales no hay campo neto y el rotor no gira. Invertir el campo invierte el sentido de giro.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Número de Espiras',
      mensaje: 'Elige el número de espiras. Más espiras dan más par por amperio (k = N·B·A), pero a igual voltaje el motor gira MÁS DESPACIO, porque su fuerza contraelectromotriz k·ω crece más rápido.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Encendido de Motor',
      mensaje: 'Calcula el voltaje para el reto: I = τ/k y V = k·ω + I·Rₐ (ω en rad/s). Escríbelo, ajusta la fuente a ese valor y energiza. El tacómetro debe marcar la velocidad pedida (±5 %) en el sentido pedido.',
      accion: 'Validar Torque',
    }
  ];

export default tutorSteps;
