import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Óptica de Precisión',
      mensaje: '¡Hola, {alumno}! Soy el Dr. Quantum. Bienvenido al Centro de Microscopía. Tu misión es explorar el mundo subcelular con rigor científico.',
    },
    {
      id: 2, tipo: 'calculo', pista: 'Física de la Luz',
      mensaje: 'Aumentar no basta: hay que resolver. La distancia mínima que separa un objetivo es d = 0,61·λ/AN. Con luz de 550 nm y AN 0,65 son medio micrómetro.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Elige un caso',
      mensaje: 'Tienes seis preparaciones: agua de estanque viva, sangre con malaria, un Gram, mitosis en raíz de cebolla, epidermis de cebolla y estomas. Resuelve tres.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Recorre la preparación',
      mensaje: 'Arrastra la imagen para mover la platina. Empieza con poco aumento para orientarte: a 4× ves 4,5 mm de preparación; a 100×, sólo 0,18 mm.',
    },
    {
      id: 5, tipo: 'accion', pista: 'Enfoque fino',
      mensaje: 'A 40× la profundidad de campo es de un par de micrómetros. Usa el micrométrico o la rueda del ratón: verás pasar de foco capas distintas de la muestra.',
    },
    {
      id: 6, tipo: 'accion', pista: 'Luz, diafragma y aceite',
      mensaje: 'A más aumento llega menos luz: sube la lámpara. Cierra el diafragma para ganar contraste en lo que no está teñido. El objetivo de 100× exige aceite de inmersión.',
    },
    {
      id: 7, tipo: 'verificar', pista: 'Mide y cuenta',
      mensaje: 'Usa la regla para medir en micrómetros y el marco para contar. Escribe tu dato y pulsa «Comprobar». Con tres casos resueltos, valida la práctica.',
      accion: 'Validar práctica',
    },
    {
      id: 8, tipo: 'logro', pista: '¡Científico Explorador!',
      mensaje: '¡Increíble! Has medido, contado e identificado como en un laboratorio de verdad. Dominas el microscopio y sabes qué puede resolver y qué no.',
    },
  ];

export default tutorSteps;
