import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Ingeniería: Ley de Ohm", 
    mision: "Diseña con la Ley de Ohm la resistencia limitadora que hace trabajar a un LED rojo a 20 mA sin quemarlo.", 
    ecuacion: "V = I · R", 
    formulaGfx: "P = V · I",
    pasos: [
      { id: 1, text: "Sin resistencia: conecta la fuente directo al LED y observa por qué se quema.", icon: "zap" },
      { id: 2, text: "Diseño: calcula R = (V − V_f)/I con V_f ≈ 2 V e I = 20 mA.", icon: "activity" },
      { id: 3, text: "Montaje: ajusta la caja de resistencias a tu valor y cierra el circuito; mide I, V_R y V_LED.", icon: "timer" },
      { id: 4, text: "Verificación: comprueba que I ≈ 20 mA y que V_R + V_LED ≈ V de la fuente.", icon: "play" }
    ],
    guiaMaestro: {
      objetivo: "Aplicar la Ley de Ohm al diseño de un circuito real con un componente no óhmico (LED) y su caída de tensión.",
      friccion: "El error típico es calcular R = V/I olvidando la caída del LED: la corriente resulta menor de la esperada. El LED no es óhmico.",
      puntosClave: ["Conductancia: Facilidad de flujo de electrones.", "Linealidad: la resistencia es óhmica; el LED no (su caída es casi constante).", "Potencia: Relación entre trabajo eléctrico y calor."]
    },
    conceptos: [
      { titulo: "Resistencia (Ω)", desc: "Oposición al flujo de corriente." },
      { titulo: "Corriente (A)", desc: "Flujo de carga eléctrica por segundo." },
      { titulo: "Voltaje (V)", desc: "Diferencia de potencial o fuerza electromotriz." }
    ]
  };

export default contenido;
