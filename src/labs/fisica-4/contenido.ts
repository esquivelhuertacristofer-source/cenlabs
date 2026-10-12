import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Ingeniería: Rigidez de un Resorte (Ley de Hooke)", mision: "¡Protocolo de calibración de suspensión! Antes de montar el resorte en el tren de aterrizaje hay que conocer su constante elástica k. La medirás por dos caminos independientes: colgando cargas y leyendo la elongación en reposo (F = k·x), y haciendo oscilar la carga para cronometrar su periodo (T = 2π√(m/k)). Si ambos métodos coinciden, el resorte queda certificado.", ecuacion: "F = -k·x", formulaGfx: "Ep = ½·k·x²",
    pasos: [
      { id: 1, text: "Cuelga una carga de prueba y espera a que quede en reposo.", icon: "box" },
      { id: 2, text: "Lee la elongación x en la regla; repite con otra carga.", icon: "target" },
      { id: 3, text: "Suelta la carga desde una amplitud A y cronometra 10 oscilaciones.", icon: "activity" },
      { id: 4, text: "Calcula k por los dos métodos y comprueba que coinciden.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Determinar la constante elástica de un resorte por el método estático y por el dinámico.",
      friccion: "No relacionar la elongación (x) con el peso de la carga (m·g), o creer que el periodo depende de la amplitud.",
      puntosClave: ["Rigidez Mecánica (k): Capacidad de absorción del impacto.", "Límite Elástico: Riesgo de falla catastrófica del chasis.", "Amortiguación: Disipación de energía cinética al tocar la superficie."]
    },
    conceptos: [
      { titulo: "Constante de Rigidez", desc: "Fuerza por unidad de deformación del resorte (N/m)." },
      { titulo: "Elongación", desc: "Aumento de longitud respecto a su estado libre." },
      { titulo: "Energía Potencial", desc: "Energía almacenada en el resorte deformado: ½·k·x²." }
    ]
  };

export default contenido;
