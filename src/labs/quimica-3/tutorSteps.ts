import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Protocolo Iniciado',
      mensaje: '¡Bienvenido al núcleo de Fusión Estequiométrica! Tu misión es certificar la Conservación de la Masa. Ajusta los coeficientes para que los átomos en ambos lados sean idénticos.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Sincronía Molecular',
      mensaje: 'Utiliza los inyectores de masa en tu bitácora. Observa cómo el motor 3D renderiza las moléculas reales y el núcleo de plasma se estabiliza con cada ajuste correcto.',
    },
    {
      id: 3, tipo: 'verificar', pista: 'Ley de Lavoisier',
      mensaje: 'Cuando logres el equilibrio atómico total, el núcleo emitirá una señal de estabilidad. Redacta tu conclusión técnica (50+ palabras) para obtener la certificación.',
      accion: 'Certificar Fusión',
    }
  ];

export default tutorSteps;
