import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Dilatación Térmica',
      mensaje: 'Veremos cómo los metales se alargan con el calor. Calentaremos una barra haciendo pasar vapor por su interior.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Calentamiento',
      mensaje: 'Monta el "Metal ?" y pulsa "Pasar vapor". Cuando el termómetro suba al menos 20 °C (mejor si se estabiliza cerca de 100 °C), lee el comparador y registra la medición.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Coeficiente Alfa',
      mensaje: 'Aplica ΔL = α · L₀ · ΔT y despeja α. Ojo: L₀ y ΔL deben estar en las mismas unidades (mm). Puedes calibrar el método con las barras de α conocido.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Material',
      mensaje: 'Escribe α en unidades de 10⁻⁶ /°C y pulsa "Comprobar análisis" (tolerancia ±5 %).',
      accion: 'Validar Expansión',
    }
  ];

export default tutorSteps;
