import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    { 
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Bienvenido al laboratorio de Gases. Sube la TEMPERATURA con el termostato y observa cómo se agitan las partículas y sube la presión.',
    },
    { 
      id: 2, tipo: 'accion', pista: 'Ajusta el Volumen',
      mensaje: 'Ahora manipula el VOLUMEN del contenedor para observar el cambio en el manómetro. Recuerda la Ley de Boyle: P₁V₁ = P₂V₂.',
    },
    { 
      id: 3, tipo: 'calculo', pista: 'Analiza la Isoterma',
      mensaje: 'Antes de mover otro control, calcula con PV = nRT la temperatura o el volumen que te dan la PRESIÓN OBJETIVO. R = 0.08206 atm·L/(mol·K).',
    },
    { 
      id: 4, tipo: 'accion', pista: 'Bomba de Gas',
      mensaje: '¿Presión insuficiente? Puedes bombear más gas con el control de MOLES (n). Más moléculas significan más colisiones cinéticas.',
    },
    { 
      id: 5, tipo: 'verificar', pista: 'Sincroniza',
      mensaje: 'Cuando la presión quede a ±0.1 atm del objetivo, pulsa VALIDAR. Cuidado: por encima de 7 atm la cámara colapsa.',
      accion: 'Validar Telemetría',
    }
  ];

export default tutorSteps;
