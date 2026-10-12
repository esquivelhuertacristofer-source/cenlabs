import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Alerta Sísmica',
      mensaje: 'Bienvenido, {alumno}. Analizaremos la escala logarítmica de magnitud de momento. ¿Sabías que un grado más significa unas 32 veces más energía (10^1.5)?',
    },
    {
      id: 2, tipo: 'accion', pista: 'Simula el Sismo',
      mensaje: 'Lleva la estación experimental a la magnitud del sismo objetivo. Alterna la gráfica entre escala lineal y logarítmica: en la lineal los sismos pequeños desaparecen.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Factor de Energía',
      mensaje: 'Calcula ΔM = M_objetivo − M_base y el factor de energía 10^(1.5·ΔM). No lo confundas con el factor de amplitud 10^ΔM.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Certificar Informe',
      mensaje: 'Escribe tu factor (se acepta ±5 %) y presiona Validar.',
      accion: 'Validar',
    },
  ];

export default tutorSteps;
