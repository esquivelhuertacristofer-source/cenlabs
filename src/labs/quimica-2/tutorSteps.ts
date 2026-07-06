import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    { 
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Bienvenido al laboratorio de Gases. Comienza ajustando la TEMPERATURA a 400K para observar la excitación molecular.',
    },
    { 
      id: 2, tipo: 'accion', pista: 'Ajusta el Volumen',
      mensaje: 'Ahora manipula el VOLUMEN del contenedor para observar el cambio en el manómetro. Recuerda la Ley de Boyle: P₁V₁ = P₂V₂.',
    },
    { 
      id: 3, tipo: 'calculo', pista: 'Analiza la Isoterma',
      mensaje: 'Observa el GRÁFICO DE ISOTERMAS. Cada punto del gráfico corresponde a un estado del gas. Intenta moverte por la curva suavemente.',
    },
    { 
      id: 4, tipo: 'accion', pista: 'Bomba de Gas',
      mensaje: '¿Presión insuficiente? Puedes bombear más gas con el control de MOLES (n). Más moléculas significan más colisiones cinéticas.',
    },
    { 
      id: 5, tipo: 'verificar', pista: 'Sincroniza',
      mensaje: 'Cuando logres la PRESIÓN OBJETIVO (±0.05), el botón VALIDAR se activará. ¡Mantén el sistema en equilibrio!',
      accion: 'Validar Telemetría',
    }
  ];

export default tutorSteps;
