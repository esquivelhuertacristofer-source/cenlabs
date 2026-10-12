import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Física: Electrostática", 
    mision: "Calcula con la Ley de Coulomb la fuerza entre dos cargas puntuales (en μC, separadas centímetros) y decide si se atraen o se repelen.", 
    ecuacion: "F = k · |q₁q₂| / r²", 
    formulaGfx: "k ≈ 8.99 x 10⁹ N·m²/C²",
    pasos: [
      { id: 1, text: "Exploración de cargas: cambia q₁ y q₂ y observa la dirección de las fuerzas.", icon: "zap" },
      { id: 2, text: "Exploración de distancia: separa las cargas entre 2 y 40 cm y observa cómo cae la fuerza.", icon: "target" },
      { id: 3, text: "Conversión: pasa las cargas a coulombs (1 μC = 10⁻⁶ C) y la distancia a metros.", icon: "activity" },
      { id: 4, text: "Reto: calcula |F| en newtons para la configuración dada e indica atracción o repulsión.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la naturaleza de las fuerzas centrales y la dependencia del inverso del cuadrado de la distancia.",
      friccion: "La escala de las fuerzas (Newton) frente a las cargas (Microcoulomb) suele generar confusión en las potencias de diez.",
      puntosClave: ["Interacción Electrostática: Cargas iguales se repelen; opuestas se atraen.", "Magnitud Vectorial: La fuerza actúa a lo largo de la línea que une las cargas.", "Proporcionalidad: F es proporcional al producto de las cargas e inversamente proporcional a r²."]
    },
    conceptos: [
      { titulo: "Carga Eléctrica (C)", desc: "Propiedad intrínseca de la materia." },
      { titulo: "Campo Eléctrico", desc: "Región de influencia de una carga." },
      { titulo: "Permitividad", desc: "Influencia del medio en la fuerza eléctrica." }
    ]
  };

export default contenido;
