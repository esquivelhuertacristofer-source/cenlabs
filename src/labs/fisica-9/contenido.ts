import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Física: Electrostática", 
    mision: "Cuantifica la interacción de fuerzas fundamentales entre cargas puntuales, validando la Ley de Coulomb mediante el análisis de vectores de atracción y repulsión en un vacío controlado.", 
    ecuacion: "F = k · |q₁q₂| / r²", 
    formulaGfx: "k ≈ 8.99 x 10⁹ N·m²/C²",
    pasos: [
      { id: 1, text: "Configuración de Fuente: Posiciona la carga q₁ (estacionaria) en el origen del sistema de coordenadas.", icon: "zap" },
      { id: 2, text: "Ajuste de Probeta: Sitúa la carga q₂ a una distancia nanométrica controlada.", icon: "target" },
      { id: 3, text: "Análisis de Campo: Observa la magnitud y dirección de los vectores de fuerza resultantes.", icon: "activity" },
      { id: 4, text: "Certificación de Fuerza: Calcula la magnitud neta en Newtons para validar la constante de Coulomb.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la naturaleza de las fuerzas centrales y la dependencia del inverso del cuadrado de la distancia.",
      friccion: "La escala de las fuerzas (Newton) frente a las cargas (Microcoulomb) suele generar confusión en las potencias de diez.",
      puntosClave: ["Interacción Electrostática: Cargas iguales se repelen; opuestas se atraen.", "Magnitud Vectorial: La fuerza actúa a lo largo de la línea que une las cargas.", "Cuantización: Relación entre la cantidad de carga y la fuerza neta."]
    },
    conceptos: [
      { titulo: "Carga Eléctrica (C)", desc: "Propiedad intrínseca de la materia." },
      { titulo: "Campo Eléctrico", desc: "Región de influencia de una carga." },
      { titulo: "Permitividad", desc: "Influencia del medio en la fuerza eléctrica." }
    ]
  };

export default contenido;
