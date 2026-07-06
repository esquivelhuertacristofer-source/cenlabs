import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Bienvenido al taller de Cristalización. Tu misión es purificar KNO₃ mediante un choque térmico controlado. ¡Comencemos!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Inyección de Soluto',
      mensaje: 'Primero, añade 80g de Nitrato de Potasio (KNO₃) al vaso de precipitados usando el inyector del dock inferior.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Disolución Térmica',
      mensaje: 'Traslada el vaso a la PARRILLA DE CALENTAMIENTO. Observa cómo la temperatura sube. Debes alcanzar al menos 80°C para disolver todo el soluto.',
    },
    {
      id: 4, tipo: 'calculo', pista: 'Curva de Solubilidad',
      mensaje: 'Observa la telemetría. A medida que la temperatura aumenta, la capacidad del agua para retener soluto crece exponencialmente. ¿Ves cómo desaparecen los cristales?',
    },
    {
      id: 5, tipo: 'accion', pista: 'Choque Térmico',
      mensaje: '¡Ahora el paso crítico! Mueve el vaso directamente al BAÑO DE HIELO. El enfriamiento repentino forzará la sobresaturación y la formación de cristales puros.',
    },
    {
      id: 6, tipo: 'verificar', pista: 'Nucleación',
      mensaje: 'Observa la base del vaso. Los cristales emergerán del caos molecular. Cuando la temperatura baje de 20°C, habrás recuperado la mayor parte del soluto.',
    },
    {
      id: 7, tipo: 'verificar', pista: 'Valida la Misión',
      mensaje: 'Si has logrado ver la cristalización activa en el baño de hielo, presiona "Validar Práctica" en la cabecera para certificar tu experimento.',
      accion: 'Finalizar Análisis',
    }
  ];

export default tutorSteps;
