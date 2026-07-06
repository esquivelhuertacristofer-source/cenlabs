import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué fenómeno permite que un motor eléctrico funcione?",
      opciones: ["La fricción", "La fuerza de Lorentz (interacción corriente-campo magnético)", "La gravedad", "La presión"],
      respuestaCorrecta: 1,
      explicacion: "Cuando una corriente circula por un cable dentro de un campo magnético, experimenta una fuerza que lo hace moverse."
    },
    {
      pregunta: "En un motor de C.C., el 'Estator' es:",
      opciones: ["La parte que gira", "La parte fija (imanes)", "La batería", "El cable"],
      respuestaCorrecta: 1,
      explicacion: "El estator genera el campo magnético constante necesario para el empuje."
    },
    {
      pregunta: "El 'Rotor' o armadura es:",
      opciones: ["El interruptor", "La parte móvil que contiene las bobinas", "El chasis", "El ventilador"],
      respuestaCorrecta: 1,
      explicacion: "Es el componente que gira al recibir la fuerza magnética."
    },
    {
      pregunta: "¿Para qué sirve el conmutador y las escobillas?",
      opciones: ["Para limpiar el motor", "Para invertir la dirección de la corriente y mantener el giro constante", "Para frenar el motor", "Para aumentar el voltaje"],
      respuestaCorrecta: 1,
      explicacion: "Sin ellos, el motor daría media vuelta y se detendría; ellos aseguran que la fuerza siempre empuje en el mismo sentido de giro."
    },
    {
      pregunta: "Si invertimos la polaridad de la batería, el motor:",
      opciones: ["Se quema", "Gira en sentido contrario", "Se detiene", "Gira más rápido"],
      respuestaCorrecta: 1,
      explicacion: "Al cambiar el sentido de la corriente, cambia la dirección de la fuerza de Lorentz."
    },
    {
      pregunta: "¿Cómo podemos aumentar el torque (fuerza de giro) de nuestro motor?",
      opciones: ["Usando imanes más débiles", "Aumentando el número de espiras y la corriente", "Pintándolo de rojo", "Usando cables más largos"],
      respuestaCorrecta: 1,
      explicacion: "La fuerza magnética es proporcional a la corriente (I), al campo (B) y al número de vueltas de alambre (N)."
    },
    {
      pregunta: "Un motor eléctrico convierte energía:",
      opciones: ["Mecánica en Eléctrica", "Eléctrica en Mecánica", "Química en Térmica", "Solar en Eléctrica"],
      respuestaCorrecta: 1,
      explicacion: "Usa electricidad para generar movimiento físico."
    },
    {
      pregunta: "¿Qué establece la Ley de Faraday?",
      opciones: ["La corriente crea calor", "Un campo magnético variable induce una corriente eléctrica", "Las cargas se atraen", "Los motores son ruidosos"],
      respuestaCorrecta: 1,
      explicacion: "Es el principio inverso al motor, usado en generadores para crear electricidad."
    },
    {
      pregunta: "El torque es máximo cuando la bobina está:",
      opciones: ["Paralela al campo magnético", "Perpendicular al campo magnético", "A 45 grados", "Apagada"],
      respuestaCorrecta: 0,
      explicacion: "En esta posición, los brazos de la bobina reciben la fuerza máxima en la dirección del giro."
    },
    {
      pregunta: "¿Qué material se usa comúnmente para las escobillas de un motor?",
      opciones: ["Plástico", "Grafito (Carbón)", "Vidrio", "Madera"],
      respuestaCorrecta: 1,
      explicacion: "El grafito es conductor y autolubricante, ideal para el contacto rozante."
    },
    {
      pregunta: "Un electroimán es:",
      opciones: ["Un imán natural", "Un imán creado por corriente eléctrica en una bobina", "Un trozo de hierro", "Una batería"],
      respuestaCorrecta: 1,
      explicacion: "Permite tener un campo magnético que se puede encender y apagar a voluntad."
    },
    {
      pregunta: "La unidad de inducción magnética es el:",
      opciones: ["Voltio", "Tesla (T)", "Weber", "Ohmio"],
      respuestaCorrecta: 1,
      explicacion: "Llamada así por Nikola Tesla."
    },
    {
      pregunta: "¿Qué sucede si aumentamos el voltaje en el motor?",
      opciones: ["Se detiene", "Gira más rápido (aumenta la corriente y la fuerza)", "Se enfría", "Cambia de color"],
      respuestaCorrecta: 1,
      explicacion: "Mayor voltaje impulsa más corriente, generando una fuerza de Lorentz mayor."
    },
    {
      pregunta: "¿Cuál es el componente que permite el contacto eléctrico con el rotor giratorio?",
      opciones: ["El eje", "Las escobillas", "El chasis", "El ventilador"],
      respuestaCorrecta: 1,
      explicacion: "Las escobillas presionan contra el conmutador para cerrar el circuito móvil."
    }
  ];

export default quiz;
