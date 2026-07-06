import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Motor de Fusión Estequiométrica", 
    videoUrl: "",
    mision: "¡Bienvenido al núcleo del Reactor CEN! Soy el Dr. Quantum y hoy vamos a certificar uno de los principios fundamentales del cosmos: la Conservación de la Materia. En un reactor químico, nada se crea ni se destruye por azar. Cada átomo de hidrógeno, carbono u oxígeno que entra en la reacción debe estar presente al final, aunque su estructura molecular haya cambiado por completo. Tu misión es balancear reacciones críticas asegurando que la balanza de masa sea perfecta. ¡Sincroniza el universo átomo por átomo!", 
    ecuacion: "Σ m(Reactivos) = Σ m(Productos)", 
    formulaGfx: "Ley de Lavoisier",
    pasos: [
      { id: 1, text: "Analiza los componentes moleculares y sus estados de agregación (s, l, g, aq).", icon: "microscope" },
      { id: 2, text: "Ajusta los inyectores de masa hasta equilibrar el conteo atómico.", icon: "zap" },
      { id: 3, text: "Observa la estabilización del núcleo de plasma en el motor 3D.", icon: "activity" },
      { id: 4, text: "Redacta el informe técnico de 50 palabras para certificar la fusión.", icon: "file-text" }
    ],
    guiaMaestro: {
      objetivo: "Validar la estequiometría mediante la conservación de masa y el conteo atómico preciso.",
      friccion: "El alumno debe enfrentar reacciones con coeficientes grandes (ej: Octano), lo que requiere un método sistemático.",
      puntosClave: [
        "Progresión: 6 niveles (Propano, Fotosíntesis, Haber, Metanol, Neutralización, Octano).",
        "Rigor: Inclusión de estados de agregación según estándar IUPAC.",
        "Masa Molar: Cálculos basados en g/mol para validación de Lavoisier."
      ]
    },
    conceptos: [
      { titulo: "Coeficiente Estequiométrico", desc: "Número que indica la proporción molar en que reaccionan las sustancias." },
      { titulo: "Estado de Agregación", desc: "Forma física de la materia (sólido, líquido, gas, acuoso) bajo condiciones específicas." },
      { titulo: "Ley de Lavoisier", desc: "Principio de conservación de la materia: nada se crea ni se destruye, solo se transforma." }
    ]
  };

export default contenido;
