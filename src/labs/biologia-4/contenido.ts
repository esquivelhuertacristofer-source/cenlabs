import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Fotosíntesis", mision: "Diseña ensayos con una ramita de Elodea y alcanza la meta de O₂ sin calentar el agua", ecuacion: "6CO₂ + 6H₂O + Luz → C₆H₁₂O₆ + 6O₂", formulaGfx: "P_neta = Pmax·(1 − e^(−φ·η(λ)·I/Pmax)) − R ;  I ∝ 1/d²",
    pasos: [
      { id: 1, text: "Elige el color de la lámpara LED (todas emiten el mismo flujo de fotones).", icon: "palette" },
      { id: 2, text: "Ajusta la distancia: la luz cae con el cuadrado, pero no puedes acercarte más del límite térmico.", icon: "move" },
      { id: 3, text: "Mide 10 min y anota el O₂ recogido; cambia una sola variable por ensayo.", icon: "droplets" },
      { id: 4, text: "Con tu tabla, elige la combinación que alcanza la meta y valida.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Medir cómo la intensidad (distancia) y la longitud de onda cambian la tasa neta de O₂, controlando variables.",
      friccion: "Mito del verde: muchos creen que la luz verde no sirve. Con igual flujo de fotones rinde menos que la roja, pero SÍ produce O₂ (McCree, 1972). Y acercar la lámpara deja de ayudar cuando la fotosíntesis se satura.",
      puntosClave: ["Por fotón, el rojo-naranja rinde más; azul y verde menos (espectro de acción de McCree).", "Intensidad ∝ 1/d², pero la tasa se satura (curva luz-respuesta).", "Lo que se mide es la tasa NETA: fotosíntesis menos respiración.", "El O₂ viene de la fotólisis del agua."]
    },
    conceptos: [
      { titulo: "Clorofila", desc: "Pigmento que absorbe sobre todo azul y rojo; los pigmentos accesorios y la hoja también aprovechan parte del verde." },
      { titulo: "Espectro de acción", desc: "O₂ producido por fotón de cada longitud de onda; no es igual al espectro de absorción de la clorofila aislada." },
      { titulo: "Fotólisis del Agua", desc: "Etapa de la fase clara donde se libera oxígeno como subproducto." }
    ]
  };

export default contenido;
