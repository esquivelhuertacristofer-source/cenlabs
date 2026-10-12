import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Preparación de Soluciones", mision: "¡Ingresas al Laboratorio de Análisis de Precisión! Tu objetivo es preparar una solución estándar (NaCl, CuSO₄, KMnO₄ o K₂Cr₂O₇) con la molaridad y el volumen que te asigne la misión. Primero calculas la masa necesaria corrigiendo por la pureza del reactivo; luego la pesas en la balanza analítica descontando el vidrio de reloj (TARA) y la transfieres a un matraz aforado. Tu éxito depende del control del menisco: si el agua rebasa la línea de aforo, la solución queda diluida y hay que prepararla de nuevo. La molaridad final debe quedar a ±5 % de la pedida.", 
    ecuacion: "M = n / V (L)", formulaGfx: "n = m / PM",
    pasos: [
      { id: 1, text: "Usa la balanza analítica para pesar el soluto exacto.", icon: "scale" },
      { id: 2, text: "Aplica la TARA con el vidrio de reloj (12.5 g) sobre el platillo.", icon: "zap" },
      { id: 3, text: "Transfiere al matraz y afora con agua destilada.", icon: "droplets" },
      { id: 4, text: "No sobrepases la línea de aforo del matraz.", icon: "target" }
    ],
    guiaMaestro: {
      objetivo: "Dominar la técnica de pesaje y aforo volumétrico.",
      friccion: "La principal dificultad es el control del menisco.",
      puntosClave: ["m = M · V(L) · PM / pureza.", "Aforo: Medida de volumen exacto.", "Vidrio de Reloj: Masa amortiguadora."]
    },
    conceptos: [
      { titulo: "Molaridad (M)", desc: "Moles de soluto por litro de solución." },
      { titulo: "Aforo", desc: "Marca circular que indica el volumen exacto." },
      { titulo: "Soluto", desc: "Sustancia que se disuelve." }
    ]
  };

export default contenido;
