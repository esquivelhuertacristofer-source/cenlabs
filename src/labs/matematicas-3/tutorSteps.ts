import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Alerta Sísmica',
      mensaje: 'Bienvenido, {alumno}. Analizaremos la escala logarítmica de Richter. ¿Sabías que un grado más significa 32 veces más energía?',
    },
    {
      id: 2, tipo: 'accion', pista: 'Simula el Sismo',
      mensaje: 'Ajusta la magnitud del sismo experimental. Observa cómo crece la amplitud de la onda en el sismógrafo 3D de forma no lineal.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Factor de Energía',
      mensaje: 'Calcula el factor de energía usando la fórmula 10^(1.5 * ΔM). Ingresa el valor en el panel de telemetría para validar tu análisis.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Certificar Informe',
      mensaje: 'Si tu cálculo de energía coincide con el impacto visual, presiona Validar Informe.',
      accion: 'Validar Análisis',
    }
  ];

export default tutorSteps;
