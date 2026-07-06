import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Construcción Atómica", 
    videoUrl: "",
    tituloEn: "Atomic Construction",
    mision: "¡Bienvenido al Forge Atómico de CEN Labs! Tu misión hoy es fundamental para la ciencia moderna: vamos a sintetizar un isótopo de Carbono-14, una variante esencial utilizada en la datación arqueológica. Deberás equilibrar con precisión la cantidad de protones para definir la identidad del elemento, añadir los neutrones necesarios para alcanzar la masa atómica requerida y finalmente ajustar la nube electrónica para lograr un estado de neutralidad eléctrica perfecto. ¡La estabilidad de la materia está bajo tu supervisión!", 
    misionEn: "Forge a Carbon-14 atom (Isotope)",
    ecuacion: "A = Z + N", 
    formulaGfx: "Carga = P - e",
    pasos: [
      { id: 1, text: "Añade 6 Protones (P+) al núcleo para estabilizar el elemento.", textEn: "Add 6 Protons (P+) to the nucleus to stabilize the element.", icon: "zap" },
      { id: 2, text: "Añade 8 Neutrones (N) para alcanzar la masa crítica (A=14).", textEn: "Add 8 Neutrons (N) to reach critical mass (A=14).", icon: "beaker" },
      { id: 3, text: "Añade 6 Electrones (e-) repartidos en las capas K y L.", textEn: "Add 6 Electrons (e-) distributed in K and L shells.", icon: "circle" },
      { id: 4, text: "Verifica que la carga sea neutra (0) y presiona Validar.", textEn: "Verify that the charge is neutral (0) and press Validate.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Diferenciar entre masa (protones + neutrones) y carga (protones - electrones).",
      friccion: "El alumno suele confundir el número atómico (Z) con el número de masa (A). Forzar la construcción del C-14 ayuda a visualizar por qué un exceso de neutrones genera inestabilidad.",
      puntosClave: ["Isótopos: Átomos con igual Z pero distinto A.", "Carga Neta: Desbalance electrónico.", "Bandas de Estabilidad: Límites físicos reales."]
    },
    conceptos: [
      { titulo: "Protón (P+)", desc: "Partícula con carga positiva (+1). Su cantidad (Z) define la identidad química del elemento." },
      { titulo: "Neutrón (N)", desc: "Partícula sin carga. Actúa como pegamento nuclear." },
      { titulo: "Isótopo", desc: "Variante de un elemento con diferente masa." }
    ]
  };

export default contenido;
