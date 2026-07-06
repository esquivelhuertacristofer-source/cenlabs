import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Sistemas Hidráulicos de Elevación", 
    mision: "Optimiza la ventaja mecánica mediante el Principio de Pascal para la movilización de carga industrial.", 
    ecuacion: "F₁ / A₁ = F₂ / A₂", 
    formulaGfx: "P₁ = P₂",
    pasos: [
      { id: 1, text: "Calibración de Entrada: Ajusta el radio del émbolo primario (r1) para definir la densidad de fuerza inicial.", icon: "settings" },
      { id: 2, text: "Configuración de Multiplicador: Define el radio del émbolo de salida (r2) para maximizar la ganancia mecánica.", icon: "maximize" },
      { id: 3, text: "Prueba de Carga: Selecciona la masa crítica de transporte en el pistón mayor.", icon: "box" },
      { id: 4, text: "Maniobra de Elevación: Aplica presión controlada hasta lograr la estabilidad gravitatoria de la carga.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Certificar la comprensión de la transmisión hidrostática de presión y la multiplicación de fuerzas en sistemas cerrados.",
      friccion: "Es común la confusión entre el radio y el área. El alumno debe notar que duplicar el radio cuadriplica la ventaja mecánica.",
      puntosClave: ["Principio de Pascal: Transmisión isométrica de presión.", "Ventaja Mecánica: Transformación de presión en fuerza de elevación masiva.", "Balance de Energía: Relación inversa entre fuerza y desplazamiento axial."]
    },
    conceptos: [
      { titulo: "Presión Hidráulica", desc: "Fuerza ejercida por el fluido por unidad de área." },
      { titulo: "Pistón / Émbolo", desc: "Superficie móvil que recibe o transmite la fuerza." },
      { titulo: "Fluido Incompresible", desc: "Líquido que no reduce su volumen bajo presión." }
    ]
  };

export default contenido;
