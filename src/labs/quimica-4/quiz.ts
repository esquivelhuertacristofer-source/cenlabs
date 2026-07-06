import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué es el Reactivo Limitante?",
      opciones: ["El que es más peligroso", "El que se consume totalmente primero y detiene la reacción", "El que sobra al final", "El que tiene más masa"],
      respuestaCorrecta: 1,
      explicacion: "La reacción no puede continuar una vez que uno de los reactivos necesarios se agota."
    },
    {
      pregunta: "¿Cómo se identifica el reactivo limitante?",
      opciones: ["Viendo cuál tiene menos gramos", "Dividiendo los moles disponibles entre su coeficiente estequiométrico", "Por su color", "Pesando el producto"],
      respuestaCorrecta: 1,
      explicacion: "La proporción molar es la que determina la disponibilidad real frente a la necesidad de la receta química."
    },
    {
      pregunta: "Si tenemos 2 moles de A y 2 moles de B para la reacción A + 2B → C, ¿quién limita?",
      opciones: ["A", "B", "Ninguno", "Ambos"],
      respuestaCorrecta: 1,
      explicacion: "Necesitamos el doble de B que de A. Para 2 moles de A necesitaríamos 4 de B, pero solo tenemos 2. B se agota primero."
    },
    {
      pregunta: "¿Qué es el Rendimiento Teórico?",
      opciones: ["Lo que realmente obtengo en el laboratorio", "La cantidad máxima de producto calculada matemáticamente", "La velocidad de la reacción", "El costo de los reactivos"],
      respuestaCorrecta: 1,
      explicacion: "Es la cantidad 'ideal' que obtendrías si todo reaccionara perfectamente sin pérdidas."
    },
    {
      pregunta: "El Rendimiento Porcentual se calcula como:",
      opciones: ["(Real / Teórico) * 100", "(Teórico / Real) * 100", "Real + Teórico", "Masa / Volumen"],
      respuestaCorrecta: 0,
      explicacion: "Mide la eficiencia del proceso real frente al ideal matemático."
    },
    {
      pregunta: "¿Por qué el rendimiento real suele ser menor al teórico?",
      opciones: ["Por reacciones secundarias", "Por impurezas", "Por pérdida de material al trasvasar", "Todas las anteriores"],
      respuestaCorrecta: 3,
      explicacion: "En el mundo real, muchos factores impiden alcanzar la perfección estequiométrica."
    },
    {
      pregunta: "En la síntesis de Haber (N₂ + 3H₂ → 2NH₃), si tienes 1 mol de N₂ y 4 moles de H₂, el exceso es de:",
      opciones: ["1 mol de N₂", "1 mol de H₂", "0 moles", "2 moles de NH₃"],
      respuestaCorrecta: 1,
      explicacion: "1 N₂ consume 3 H₂. Sobra 4 - 3 = 1 mol de H₂."
    },
    {
      pregunta: "¿Qué componente de la estequiometría dicta cuánto producto se forma?",
      opciones: ["El reactivo en exceso", "El reactivo limitante", "El catalizador", "La presión"],
      respuestaCorrecta: 1,
      explicacion: "El limitante es el 'techo' de la reacción; una vez se acaba, no se puede producir más."
    },
    {
      pregunta: "Si el rendimiento real es igual al teórico, el rendimiento porcentual es:",
      opciones: ["0%", "50%", "100%", "200%"],
      respuestaCorrecta: 2,
      explicacion: "Indica una eficiencia perfecta en el proceso."
    },
    {
      pregunta: "En 2A + B -> C, si tenemos 10 moles de A y 10 moles de B, ¿quién es el limitante?",
      opciones: ["A", "B", "Ambos", "Ninguno"],
      respuestaCorrecta: 0,
      explicacion: "Para 10 de A se necesitan solo 5 de B. B sobra (exceso), A se acaba (limitante)."
    },
    {
      pregunta: "¿Qué significa que un reactivo esté en una proporción 1:1?",
      opciones: ["Que tienen la misma masa", "Que se requiere un mol de uno por cada mol del otro", "Que son el mismo elemento", "Que no reaccionan"],
      respuestaCorrecta: 1,
      explicacion: "Es la relación estequiométrica más simple en una ecuación balanceada."
    },
    {
      pregunta: "Si el rendimiento teórico es 50g y obtienes 40g, ¿cuál es el % de rendimiento?",
      opciones: ["90%", "80%", "75%", "40%"],
      respuestaCorrecta: 1,
      explicacion: "(40/50) * 100 = 80%."
    },
    {
      pregunta: "¿Cuál NO es una razón para un rendimiento bajo?",
      opciones: ["Reacciones incompletas", "Pérdida por filtración", "Uso de un catalizador", "Evaporación del producto"],
      respuestaCorrecta: 2,
      explicacion: "Un catalizador solo acelera la reacción, no debería reducir la cantidad final de producto."
    },
    {
      pregunta: "En estequiometría, los cálculos siempre deben basarse en:",
      opciones: ["El reactivo en exceso", "El reactivo limitante", "Cualquiera de los dos", "El volumen de agua"],
      respuestaCorrecta: 1,
      explicacion: "Solo el limitante garantiza que los productos calculados sean físicamente posibles."
    }
  ];

export default quiz;
