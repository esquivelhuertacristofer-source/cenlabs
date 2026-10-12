import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Reactivo Limitante", mision: "¡Bienvenido a la Planta de Síntesis! El reactor llega cargado con masas fijas de dos reactivos (síntesis de agua, proceso de Haber, combustión de metano o desplazamiento de plata). En la industria los recursos son limitados: deberás identificar con cálculo estequiométrico cuál de los reactivos se agotará primero (reactivo limitante) y cuántos gramos del otro quedarán sin reaccionar. Solo cuando registres una respuesta correcta el reactor ejecutará la síntesis y verás el rendimiento teórico. ¡Analiza los moles, no los gramos!", 
    ecuacion: "n = m / M ;  limitante = mín(n / coef)", formulaGfx: "Exceso = m − n_L · (coef_E / coef_L) · M_E",
    pasos: [
      { id: 1, text: "Lee la ecuación, las masas cargadas y las masas molares.", icon: "microscope" },
      { id: 2, text: "Calcula los moles y determina el limitante.", icon: "zap" },
      { id: 3, text: "Ingresa el limitante y los gramos sobrantes.", icon: "beaker" },
      { id: 4, text: "Valida: si aciertas, el reactor ejecuta la síntesis.", icon: "play" }
    ],
    guiaMaestro: {
      objetivo: "Identificar el reactivo limitante mediante cálculos estequiométricos.",
      friccion: "Muchos alumnos asumen que el reactivo con menos gramos es el limitante.",
      puntosClave: ["Comparar moles ÷ coeficiente, nunca gramos.", "Ej. Haber: 1 mol de N₂ consume 3 mol de H₂.", "Exceso: Masa que no reaccionó."]
    },
    conceptos: [
      { titulo: "Reactivo Limitante", desc: "Sustancia que se consume totalmente." },
      { titulo: "Reactivo en Exceso", desc: "Sustancia que sobra." },
      { titulo: "Eficiencia", desc: "Relación entre rendimiento real y teórico." }
    ]
  };

export default contenido;
