import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué ocurre en el Ánodo de una celda galvánica?",
      opciones: ["Reducción", "Oxidación (pérdida de electrones)", "Se crea energía", "No ocurre nada"],
      respuestaCorrecta: 1,
      explicacion: "Mnemotecnia: AN-OX (Ánodo-Oxidación) y CA-RED (Cátodo-Reducción)."
    },
    {
      pregunta: "¿Cuál es la función del puente salino?",
      opciones: ["Transportar electrones", "Mantener la neutralidad eléctrica permitiendo el flujo de iones", "Calentar la celda", "Sujetar los vasos"],
      respuestaCorrecta: 1,
      explicacion: "Sin él, las soluciones se cargarían eléctricamente y la reacción se detendría en microsegundos."
    },
    {
      pregunta: "Los electrones fluyen a través del cable externo desde el:",
      opciones: ["Cátodo al Ánodo", "Ánodo al Cátodo", "Puente salino al voltímetro", "Positivo al Negativo siempre"],
      respuestaCorrecta: 1,
      explicacion: "Salen de donde se producen (oxidación en el ánodo) hacia donde se consumen (reducción en el cátodo)."
    },
    {
      pregunta: "Un potencial de celda (E°cell) positivo indica que la reacción es:",
      opciones: ["Espontánea", "No espontánea", "Muy lenta", "Explosiva"],
      respuestaCorrecta: 0,
      explicacion: "Significa que la energía química puede convertirse naturalmente en trabajo eléctrico (ΔG < 0)."
    },
    {
      pregunta: "En la serie de actividad, el metal más 'noble' (como el Oro o Plata):",
      opciones: ["Se oxida fácilmente", "Tiende a reducirse y ser el cátodo", "Flota", "Es un gas"],
      respuestaCorrecta: 1,
      explicacion: "Tienen potenciales de reducción altos, por lo que 'quieren' ganar electrones."
    },
    {
      pregunta: "La unidad de potencial eléctrico es el:",
      opciones: ["Amperio", "Vatio", "Voltio (V)", "Coulomb"],
      respuestaCorrecta: 2,
      explicacion: "Mide la 'fuerza electromotriz' o diferencia de energía potencial por unidad de carga."
    },
    {
      pregunta: "¿Qué sucede con el electrodo del cátodo a medida que avanza la reacción?",
      opciones: ["Se disuelve y pierde masa", "Aumenta su masa al depositarse metal sobre él", "Se vuelve líquido", "No cambia"],
      respuestaCorrecta: 1,
      explicacion: "Los iones en solución ganan electrones y se convierten en metal sólido sobre la superficie."
    },
    {
      pregunta: "¿Qué mide un Voltímetro en una celda galvánica?",
      opciones: ["La corriente", "La diferencia de potencial (voltaje) entre los electrodos", "La masa", "El pH"],
      respuestaCorrecta: 1,
      explicacion: "Indica la fuerza con la que los electrones son empujados a través del circuito."
    },
    {
      pregunta: "En una celda ELECTROLÍTICA, la reacción es:",
      opciones: ["Espontánea", "No espontánea (requiere energía externa)", "Rápida", "Fría"],
      respuestaCorrecta: 1,
      explicacion: "Se usa electricidad para forzar una reacción química que no ocurriría por sí sola."
    },
    {
      pregunta: "¿Cuál es la unidad de carga eléctrica?",
      opciones: ["Voltio", "Amperio", "Coulomb (C)", "Ohmio"],
      respuestaCorrecta: 2,
      explicacion: "Un mol de electrones tiene una carga de aproximadamente 96,500 Coulombs (Constante de Faraday)."
    },
    {
      pregunta: "La reducción siempre ocurre en el:",
      opciones: ["Ánodo", "Cátodo", "Puente salino", "Voltímetro"],
      respuestaCorrecta: 1,
      explicacion: "En el cátodo, las especies químicas ganan electrones."
    },
    {
      pregunta: "Si E°cell es 1.10 V y la concentración de iones cambia, el potencial se calcula con:",
      opciones: ["Ley de Ohm", "Ecuación de Nernst", "Ecuación de Einstein", "Ley de Newton"],
      respuestaCorrecta: 1,
      explicacion: "Nernst permite calcular el potencial en condiciones no estándar."
    },
    {
      pregunta: "Un agente oxidante es aquel que:",
      opciones: ["Se oxida", "Gana electrones (se reduce) provocando la oxidación de otro", "Libera gas", "Es un metal noble"],
      respuestaCorrecta: 1,
      explicacion: "Al 'robar' electrones a otro, causa que el otro se oxide."
    },
    {
      pregunta: "La corrosión de los metales es un proceso de:",
      opciones: ["Reducción", "Oxidación natural", "Fusión", "Destilación"],
      respuestaCorrecta: 1,
      explicacion: "El metal reacciona con el oxígeno o humedad perdiendo electrones."
    }
  ];

export default quiz;
