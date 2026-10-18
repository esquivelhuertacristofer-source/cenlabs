import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Transformaciones Geométricas", mision: "Lleva la nave a la silueta objetivo combinando escala, rotación y traslación", ecuacion: "V' = M · V + T", formulaGfx: "Escala → Rotación → Traslación",
    pasos: [
      { id: 1, text: "Compara tu nave con la silueta objetivo: tamaño, orientación y posición.", icon: "maximize" },
      { id: 2, text: "Ajusta la escala s y la rotación θ.", icon: "rotate-cw" },
      { id: 3, text: "Traslada en X e Y; la matriz M = T·R·S del panel resume tu transformación.", icon: "move" },
      { id: 4, text: "Valida cuando coincidan (±0,2 en posición, ±5° en giro, ±0,1 en escala).", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Comprender cómo las matrices de transformación alteran la posición, orientación y tamaño de un objeto.",
      friccion: "El orden de las operaciones es crítico. Rotar después de trasladar produce resultados distintos.",
      puntosClave: ["Traslación: Suma vectorial.", "Rotación: Cambio de base angular.", "Homotecia: Multiplicación escalar del área al cuadrado."]
    },
    conceptos: [
      { titulo: "Traslación", desc: "Desplazamiento de todos los puntos en una dirección fija." },
      { titulo: "Isometría", desc: "Transformación que conserva las distancias (Rotación y Traslación)." },
      { titulo: "Homotecia", desc: "Transformación que altera el tamaño manteniendo la forma." }
    ]
  };

export default contenido;
