import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué parte del microscopio se usa para el enfoque inicial con objetivos de bajo aumento?",
      opciones: ["Tornillo Micrométrico", "Tornillo Macrométrico", "Condensador", "Revólver"],
      respuestaCorrecta: 1,
      explicacion: "El macrométrico mueve la platina grandes distancias para localizar la muestra rápidamente."
    },
    {
      pregunta: "Si usas un ocular de 10x y un objetivo de 40x, ¿cuál es el aumento total?",
      opciones: ["50x", "40x", "400x", "100x"],
      respuestaCorrecta: 2,
      explicacion: "El aumento total es el producto del aumento del ocular por el del objetivo (10 * 40 = 400)."
    },
    {
      pregunta: "¿Qué es la 'Apertura Numérica' (NA) de un objetivo?",
      opciones: ["El precio del lente", "La capacidad del lente para captar luz y resolver detalles finos", "El diámetro físico del lente", "El número de serie"],
      respuestaCorrecta: 1,
      explicacion: "A mayor NA, mayor es la resolución (capacidad de ver dos puntos cercanos como separados)."
    },
    {
      pregunta: "¿Para qué sirve el aceite de inmersión?",
      opciones: ["Para limpiar el lente", "Para evitar la refracción de la luz entre el vidrio y el aire en objetivos de 100x", "Para lubricar los tornillos", "Para que la muestra no se mueva"],
      respuestaCorrecta: 1,
      explicacion: "Tiene el mismo índice de refracción que el vidrio, permitiendo que más luz entre al objetivo."
    },
    {
      pregunta: "El límite de resolución depende de:",
      opciones: ["La intensidad de la luz", "La longitud de onda de la luz y la Apertura Numérica", "La marca del microscopio", "El tamaño de la pantalla"],
      respuestaCorrecta: 1,
      explicacion: "Según la ley de Abbe, d = λ / (2 * NA). Luz azul (λ corta) da mejor resolución que la roja."
    },
    {
      pregunta: "La función del condensador es:",
      opciones: ["Ampliar la imagen", "Concentrar la luz sobre la muestra", "Cambiar los objetivos", "Sujetar el portaobjetos"],
      respuestaCorrecta: 1,
      explicacion: "Ajusta el cono de luz para iluminar de forma óptima el campo visual."
    },
    {
      pregunta: "Al pasar de 10x a 40x, el campo de visión:",
      opciones: ["Se vuelve más grande", "Se vuelve más pequeño (ves menos área pero con más detalle)", "No cambia", "Se vuelve más brillante"],
      respuestaCorrecta: 1,
      explicacion: "A mayor aumento, el área real que observas en la platina disminuye significativamente."
    },
    {
      pregunta: "Un microscopio estereoscópico (lupa) se usa para:",
      opciones: ["Ver bacterias", "Ver objetos grandes en 3D", "Ver virus", "Ver átomos"],
      respuestaCorrecta: 1,
      explicacion: "Tienen dos oculares que dan una visión profunda de objetos macroscópicos."
    },
    {
      pregunta: "¿Qué sucede con la luminosidad al aumentar los aumentos?",
      opciones: ["Aumenta", "Disminuye", "No cambia", "Depende del color"],
      respuestaCorrecta: 1,
      explicacion: "Al ver un área más pequeña, entra menos luz al ojo, por lo que hay que abrir el diafragma."
    },
    {
      pregunta: "El tornillo micrométrico se usa para:",
      opciones: ["Mover la platina rápido", "Afinar el enfoque con alta precisión", "Encender la luz", "Girar el revólver"],
      respuestaCorrecta: 1,
      explicacion: "Mueve la platina distancias casi imperceptibles para lograr nitidez total."
    },
    {
      pregunta: "¿Cómo se debe limpiar un objetivo de inmersión?",
      opciones: ["Con la manga de la bata", "Con papel especial de lentes y solvente adecuado", "Con agua y jabón", "No se limpia"],
      respuestaCorrecta: 1,
      explicacion: "El aceite puede dañar los sellos si se deja secar o si se usa material abrasivo."
    },
    {
      pregunta: "La parte donde se coloca la muestra se llama:",
      opciones: ["Ocular", "Platina", "Pie", "Brazo"],
      respuestaCorrecta: 1,
      explicacion: "Es la plataforma horizontal con pinzas para sujetar el portaobjetos."
    },
    {
      pregunta: "El 'Revólver' del microscopio permite:",
      opciones: ["Disparar luz", "Cambiar entre los distintos objetivos", "Ajustar la altura", "Limpiar los lentes"],
      respuestaCorrecta: 1,
      explicacion: "Es la pieza giratoria que sostiene los objetivos de diferentes aumentos."
    },
    {
      pregunta: "¿Qué tipo de microscopio usa electrones en lugar de luz?",
      opciones: ["Óptico", "Electrónico", "De fase", "Fluorescente"],
      respuestaCorrecta: 1,
      explicacion: "Permite aumentos muchísimo mayores, llegando a ver estructuras internas de organelos."
    }
  ];

export default quiz;
