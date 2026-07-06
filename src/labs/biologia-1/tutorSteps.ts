import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Óptica de Precisión',
      mensaje: '¡Hola, {alumno}! Soy el Dr. Quantum. Bienvenido al Centro de Microscopía. Tu misión es explorar el mundo subcelular con rigor científico.',
    },
    {
      id: 2, tipo: 'calculo', pista: 'Física de la Luz',
      mensaje: 'Para ver el detalle máximo, debemos entender la resolución. El límite de Abbe dicta que no podemos ver nada más pequeño que la mitad de la longitud de onda de la luz.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Elige tu Muestra',
      mensaje: 'Selecciona una muestra (Vegetal, Animal o Bacteria) para colocarla en la platina. Cada una requiere un nivel de iluminación diferente para su observación.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Localización (4x/10x)',
      mensaje: 'Usa los objetivos de baja potencia para localizar la zona de interés. Ajusta el "Macrométrico" hasta que veas formas generales.',
    },
    {
      id: 5, tipo: 'accion', pista: 'Alta Resolución (40x)',
      mensaje: 'Pasa al objetivo de 40x. ¡Cuidado! La profundidad de campo es muy corta. Usa solo el "Micrométrico" para enfocar la estructura interna.',
    },
    {
      id: 6, tipo: 'accion', pista: 'Escáner Biométrico',
      mensaje: 'Una vez enfocado, presiona "Escanear Estructura". Mi sistema de IA identificará los organelos y validará si has encontrado el objetivo de la misión.',
    },
    {
      id: 7, tipo: 'verificar', pista: 'Documentación',
      mensaje: '¡Hallazgo confirmado! Toma una "Foto de Bitácora" para registrar la micrografía en tu informe. Luego presiona Validar para certificar la práctica.',
      accion: 'Certificar Hallazgo',
    },
    {
      id: 8, tipo: 'logro', pista: '¡Científico Explorador!',
      mensaje: '¡Increíble! Has navegado por el interior de la vida. Has demostrado una gran destreza en el manejo de instrumentos ópticos de precisión.',
    },
  ];

export default tutorSteps;
