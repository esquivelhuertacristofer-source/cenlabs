import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Ósmosis Celular',
      mensaje: 'La osmolaridad del citoplasma de esta célula es desconocida. La deducirás observando cómo cambia su volumen. ¡Cuidado con la hemólisis!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Medio Hipotónico',
      mensaje: 'Prepara un medio de prueba y espera a que el volumen deje de cambiar. Si la célula se hincha, el medio es hipotónico; si se arruga, hipertónico. Anota la lectura.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Boyle–van ’t Hoff',
      mensaje: 'Los solutos del citoplasma no salen: Osm_int · V = constante. Con tu lectura, Osm_int = Osm_ext · (V_eq / V0). Recuerda que el NaCl aporta 2 partículas y la glucosa 1.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Equilibrio Osmótico',
      mensaje: 'Prepara un medio con esa osmolaridad: la célula volverá a su volumen inicial y dejará de cambiar. Entonces valida.',
      accion: 'Validar Tonicidad',
    }
  ];

export default tutorSteps;
