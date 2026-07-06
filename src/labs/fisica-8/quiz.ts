import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué establece la Ley de Ohm?",
      opciones: ["V = I / R", "V = I * R", "I = V * R", "R = V * I"],
      respuestaCorrecta: 1,
      explicacion: "El voltaje es directamente proporcional a la corriente y a la resistencia del conductor."
    },
    {
      pregunta: "La unidad de medida de la resistencia eléctrica es el:",
      opciones: ["Amperio", "Voltio", "Ohmio (Ω)", "Vatio"],
      respuestaCorrecta: 2,
      explicacion: "Nombrada en honor a Georg Simon Ohm, mide la oposición al flujo de electrones."
    },
    {
      pregunta: "Si aumentamos el voltaje en un circuito con resistencia fija, la corriente:",
      opciones: ["Disminuye", "Aumenta", "Se mantiene igual", "Desaparece"],
      respuestaCorrecta: 1,
      explicacion: "Al haber más 'presión' eléctrica (voltaje), fluyen más electrones (corriente)."
    },
    {
      pregunta: "Un material 'Aislante' es aquel que tiene una resistencia:",
      opciones: ["Muy baja", "Muy alta", "Cero", "Variable"],
      respuestaCorrecta: 1,
      explicacion: "Los aislantes (como el plástico) impiden el paso de corriente debido a su altísima resistencia."
    },
    {
      pregunta: "En un circuito en SERIE, la corriente es:",
      opciones: ["Diferente en cada componente", "Igual en todos los puntos", "Cero", "Infinita"],
      respuestaCorrecta: 1,
      explicacion: "Solo hay un camino para los electrones, por lo que la corriente no tiene más opción que ser la misma en todo el lazo."
    },
    {
      pregunta: "¿Cuál es la función de una resistencia en un circuito con un LED?",
      opciones: ["Darle más energía", "Limitar la corriente para evitar que el LED se queme", "Cambiar el color del LED", "Almacenar carga"],
      respuestaCorrecta: 1,
      explicacion: "Los LED tienen muy poca resistencia interna; sin una externa, la corriente subiría demasiado y destruiría el componente."
    },
    {
      pregunta: "Si V = 12V e I = 2A, ¿cuál es la resistencia?",
      opciones: ["24 Ω", "6 Ω", "10 Ω", "14 Ω"],
      respuestaCorrecta: 1,
      explicacion: "R = V / I = 12 / 2 = 6 Ohmios."
    },
    {
      pregunta: "¿Qué es la corriente eléctrica?",
      opciones: ["La velocidad de los electrones", "El flujo de carga por unidad de tiempo", "La energía de la batería", "La presión de los cables"],
      respuestaCorrecta: 1,
      explicacion: "I = Q / t. Se mide en Amperios (C/s)."
    },
    {
      pregunta: "En un circuito en PARALELO, el voltaje es:",
      opciones: ["Diferente en cada rama", "Igual en todas las ramas", "La suma de los voltajes", "Cero"],
      respuestaCorrecta: 1,
      explicacion: "Todos los componentes están conectados a los mismos dos puntos de potencial."
    },
    {
      pregunta: "Si una bombilla se funde en un circuito en SERIE:",
      opciones: ["Las demás brillan más", "Las demás se apagan", "No pasa nada", "El circuito explota"],
      respuestaCorrecta: 1,
      explicacion: "Se rompe el único camino de la corriente, deteniendo el flujo en todo el circuito."
    },
    {
      pregunta: "¿Cuál es la función de un fusible?",
      opciones: ["Aumentar el voltaje", "Almacenar energía", "Cortar el circuito si la corriente es demasiado alta (protección)", "Cambiar la resistencia"],
      respuestaCorrecta: 2,
      explicacion: "Es un dispositivo de seguridad que se funde para evitar incendios o daños por sobrecarga."
    },
    {
      pregunta: "La potencia eléctrica se calcula como:",
      opciones: ["P = V * I", "P = V / I", "P = R * I", "P = V + I"],
      respuestaCorrecta: 0,
      explicacion: "La potencia (en Watts) es el producto del voltaje por la corriente."
    },
    {
      pregunta: "Si R1 = 10Ω y R2 = 10Ω están en serie, la R total es:",
      opciones: ["5 Ω", "10 Ω", "20 Ω", "100 Ω"],
      respuestaCorrecta: 2,
      explicacion: "En serie, las resistencias simplemente se suman."
    },
    {
      pregunta: "¿Qué mide un multímetro en modo 'Continuidad'?",
      opciones: ["El color del cable", "Si el circuito está cerrado y la corriente puede pasar (emite un pitido)", "La temperatura", "La capacidad de la batería"],
      respuestaCorrecta: 1,
      explicacion: "Verifica que no haya rupturas en el conductor eléctrico."
    }
  ];

export default quiz;
