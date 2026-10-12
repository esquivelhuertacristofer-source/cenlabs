import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Bienvenido al taller de Cristalización. Tu misión es purificar KNO₃ mediante un choque térmico controlado. ¡Comencemos!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Inyección de Soluto',
      mensaje: 'Primero, añade 80 g de Nitrato de Potasio (KNO₃) a los 100 g de agua del vaso con los botones +1/+5/+20 g del panel inferior. A 20 °C solo se disuelven 31.6 g.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Disolución Térmica',
      mensaje: 'Traslada el vaso a la PARRILLA DE CALENTAMIENTO. Observa cómo sube la temperatura: con 80 g, el KNO₃ se disuelve por completo hacia los 48 °C.',
    },
    {
      id: 4, tipo: 'calculo', pista: 'Curva de Solubilidad',
      mensaje: 'Observa la telemetría. Al subir la temperatura la solubilidad del KNO₃ crece mucho (de 31.6 g a 20 °C a 246 g a 100 °C, tablas CRC). ¿Ves cómo desaparecen los cristales?',
    },
    {
      id: 5, tipo: 'accion', pista: 'Choque Térmico',
      mensaje: '¡Ahora el paso crítico! Mueve el vaso al BAÑO DE HIELO. Al enfriarse, el agua ya no puede retener toda la sal y el exceso cristaliza.',
    },
    {
      id: 6, tipo: 'verificar', pista: 'Nucleación',
      mensaje: 'Observa la base del vaso: aparecen los cristales. Espera a que la temperatura baje de 10 °C; a 0 °C solo quedan 13.3 g disueltos y el resto se recupera como cristal.',
    },
    {
      id: 7, tipo: 'verificar', pista: 'Valida la Misión',
      mensaje: 'Si has logrado ver la cristalización activa en el baño de hielo, presiona "Validar Práctica" en la cabecera para certificar tu experimento.',
      accion: 'Finalizar Análisis',
    }
  ];

export default tutorSteps;
