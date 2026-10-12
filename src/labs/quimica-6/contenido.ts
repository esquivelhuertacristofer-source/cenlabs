import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Solubilidad y Cristalización", mision: "¡Bienvenido al laboratorio de Termodinámica Molecular! Tu misión es inducir la formación de cristales puros de Nitrato de Potasio (KNO3) mediante un choque térmico controlado. Deberás añadir más sal de la que admite el agua a 20 °C, calentarla hasta que se disuelva por completo y luego enfriarla en un baño de hielo por debajo de 10 °C. Observa cómo la disminución de la solubilidad fuerza a los iones a organizarse en una red cristalina geométrica. Tu éxito depende de lograr una disolución completa antes del enfriamiento para evitar impurezas. ¡Desafía las leyes de la solubilidad!", ecuacion: "Cristales = m_sal − S(T)", formulaGfx: "KNO3 Cristalización",
    pasos: [
      { id: 1, text: "Añade 80g de KNO3 al vaso de precipitados.", icon: "scale" },
      { id: 2, text: "Mueve el vaso a la parrilla y calienta hasta disolver.", icon: "flame" },
      { id: 3, text: "Traslada el vaso al baño de hielo bruscamente.", icon: "snowflake" },
      { id: 4, text: "Espera a bajar de 10 °C y valida la cristalización.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la solubilidad como propiedad termodinámica dependiente.",
      friccion: "El alumno debe disolver completamente el soluto en caliente antes de enfriar, de lo contrario la recristalización será impura o incompleta.",
      puntosClave: ["KNO3: Solubilidad altamente sensible a T.", "Solubilidad: tablas CRC, g por 100 g de agua.", "Cristalización: Proceso de ordenamiento molecular."]
    },
    conceptos: [
      { titulo: "Solubilidad", desc: "Máxima cantidad de soluto que se disuelve en solvente a T fija." },
      { titulo: "Cristalización", desc: "Formación de sólidos con estructura geométrica ordenada." },
      { titulo: "Choque Térmico", desc: "Cambio brusco de temperatura que fuerza la precipitación." }
    ]
  };

export default contenido;
