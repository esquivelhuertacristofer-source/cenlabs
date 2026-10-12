import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Síntesis de Proteínas", mision: "Transcribe el ADN y ensambla el polipéptido en el ribosoma", ecuacion: "ADN → ARN → Proteína", formulaGfx: "Codón = 3 Nucleótidos",
    pasos: [
      { id: 1, text: "Transcribe la hebra molde de ADN a ARNm en el núcleo (A→U, T→A, C→G, G→C).", icon: "file-text" },
      { id: 2, text: "El ARNm sale al citoplasma por un poro nuclear.", icon: "wind" },
      { id: 3, text: "En el ribosoma elige el ARNt cuyo ANTICODÓN es complementario a cada codón.", icon: "hash" },
      { id: 4, text: "En el codón de paro no entra ningún ARNt: elige el factor de liberación y valida.", icon: "check-square" }
    ],
    guiaMaestro: {
      objetivo: "Dominar el Dogma Central de la Biología Molecular y las reglas de apareamiento.",
      friccion: "Uracilo en lugar de timina, y codón ≠ anticodón: el ARNt lleva el triplete COMPLEMENTARIO al codón. En el codón de paro no hay ARNt; lo reconoce un factor de liberación. Se toleran como máximo 2 errores de apareamiento.",
      puntosClave: ["AUG: codón de inicio (metionina).", "Transcripción: en el núcleo, con la hebra molde.", "Traducción: en el ribosoma, apareando codón y anticodón.", "UAA, UAG, UGA: codones de paro."]
    },
    conceptos: [
      { titulo: "Transcripción", desc: "Proceso de copiado de la información genética del ADN al ARNm." },
      { titulo: "Traducción", desc: "Conversión de la secuencia de nucleótidos del ARNm en aminoácidos." },
      { titulo: "Codón", desc: "Secuencia de tres nucleótidos que codifica un aminoácido específico." }
    ]
  };

export default contenido;
