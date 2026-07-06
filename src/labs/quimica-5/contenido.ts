import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Preparación de Soluciones", mision: "¡Ingresas al Laboratorio de Análisis de Precisión! Tu objetivo es preparar una solución estándar de Cloruro de Sodio (NaCl) con una molaridad específica. La exactitud es tu prioridad: deberás usar la balanza analítica para pesar el soluto considerando la masa del vidrio de reloj (TARA) y luego transferirlo a un matraz aforado. Tu éxito depende del control del menisco al añadir el solvente; una gota extra sobre la línea de aforo invalidará el proceso por dilución excesiva. ¡Domina el arte del aforo y alcanza la concentración perfecta!", 
    ecuacion: "M = n / V (L)", formulaGfx: "n = m / PM",
    pasos: [
      { id: 1, text: "Usa la balanza analítica para pesar el soluto exacto.", icon: "scale" },
      { id: 2, text: "Recuerda aplicar la TARA al vidrio de reloj (12.5g).", icon: "zap" },
      { id: 3, text: "Transfiere al matraz y afora con agua destilada.", icon: "droplets" },
      { id: 4, text: "No sobrepases la línea de aforo del matraz.", icon: "target" }
    ],
    guiaMaestro: {
      objetivo: "Dominar la técnica de pesaje y aforo volumétrico.",
      friccion: "La principal dificultad es el control del menisco.",
      puntosClave: ["PM NaCl = 58.44.", "Aforo: Medida de volumen exacto.", "Vidrio de Reloj: Masa amortiguadora."]
    },
    conceptos: [
      { titulo: "Molaridad (M)", desc: "Moles de soluto por litro de solución." },
      { titulo: "Aforo", desc: "Marca circular que indica el volumen exacto." },
      { titulo: "Soluto", desc: "Sustancia que se disuelve." }
    ]
  };

export default contenido;
