import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Síntesis de Proteínas", mision: "Transcribe el ADN y ensambla el polipéptido en el ribosoma", ecuacion: "ADN → ARN → Proteína", formulaGfx: "Codón = 3 Nucleótidos",
    pasos: [
      { id: 1, text: "Transcribe el gen objetivo (ADN) a ARNm en el núcleo.", icon: "file-text" },
      { id: 2, text: "Observa el viaje del ARNm hacia el citoplasma.", icon: "wind" },
      { id: 3, text: "Acopla los ARNt al ribosoma siguiendo los codones.", icon: "hash" },
      { id: 4, text: "Completa la cadena de aminoácidos hasta el codón STOP.", icon: "check-square" }
    ],
    guiaMaestro: {
      objetivo: "Dominar el Dogma Central de la Biología Molecular y las reglas de apareamiento.",
      friccion: "Sustitución de Uracilo: El alumno debe entender que la Timina no existe en el ARN.",
      puntosClave: ["AUG: Codón de inicio universal.", "Transcripción: Ocurre en el núcleo.", "Traducción: Ensamblaje en el ribosoma."]
    },
    conceptos: [
      { titulo: "Transcripción", desc: "Proceso de copiado de la información genética del ADN al ARNm." },
      { titulo: "Traducción", desc: "Conversión de la secuencia de nucleótidos del ARNm en aminoácidos." },
      { titulo: "Codón", desc: "Secuencia de tres nucleótidos que codifica un aminoácido específico." }
    ]
  };

export default contenido;
