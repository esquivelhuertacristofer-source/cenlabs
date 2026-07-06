import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Transformaciones Geométricas", mision: "Aterriza la sonda en la plataforma fantasma mediante isometrías", ecuacion: "V' = M · V + T", formulaGfx: "Escala → Rotación → Traslación",
    pasos: [
      { id: 1, text: "Ajusta el Factor de Escala para igualar el tamaño del objetivo.", icon: "maximize" },
      { id: 2, text: "Aplica la Rotación necesaria sobre el eje de origen.", icon: "rotate-cw" },
      { id: 3, text: "Desplaza la sonda en los ejes X e Y hasta el punto de acoplamiento.", icon: "move" },
      { id: 4, text: "Presiona 'Validar Acoplamiento' cuando la superposición sea perfecta.", icon: "check" }
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
