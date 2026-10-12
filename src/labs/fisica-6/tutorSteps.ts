import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Bienvenido a la boya experimental. Tu misión es usar el Principio de Arquímedes para determinar la densidad de un sólido desconocido.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Pesa en el aire',
      mensaje: 'Con el sólido fuera del fluido (0 % sumergido), lee el dinamómetro y pulsa "Peso en aire" para registrar W.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Sumerge el Objeto',
      mensaje: 'Elige el fluido y baja el sólido hasta el 100 %. Observa cómo la lectura disminuye por el empuje (E) y registra el "Peso sumergido".',
    },
    {
      id: 4, tipo: 'calculo', pista: 'Principio de Arquímedes',
      mensaje: 'Calcula el empuje E = W_aire − W_sumergido. Con E = ρ_fluido · g · V despeja el volumen del sólido y después su densidad ρ = W / (g · V).',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Valida la Densidad',
      mensaje: 'Escribe la densidad calculada en kg/m³ y pulsa "Comprobar análisis" (tolerancia ±3 %). ¡Mucha suerte!',
      accion: 'Validar Densidad',
    }
  ];

export default tutorSteps;
