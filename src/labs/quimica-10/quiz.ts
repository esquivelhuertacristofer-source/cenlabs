import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿En qué propiedad se basa la destilación para separar mezclas?",
      opciones: ["Densidad", "Solubilidad", "Diferencia en los puntos de ebullición", "Magnetismo"],
      respuestaCorrecta: 2,
      explicacion: "El componente más volátil (menor punto de ebullición) se convierte en vapor primero."
    },
    {
      pregunta: "¿Cuál es la función del condensador (refrigerante)?",
      opciones: ["Calentar el líquido", "Enfriar el vapor para que vuelva a ser líquido", "Filtrar impurezas", "Medir la presión"],
      respuestaCorrecta: 1,
      explicacion: "Usa un flujo de agua externa para extraer calor del vapor."
    },
    {
      pregunta: "¿Para qué sirven las 'piedras de ebullición' o perlas de vidrio en el matraz?",
      opciones: ["Para que pese más", "Para asegurar una ebullición suave y evitar proyecciones violentas", "Para dar sabor", "Para filtrar"],
      respuestaCorrecta: 1,
      explicacion: "Proporcionan puntos de nucleación para las burbujas, evitando el sobrecalentamiento."
    },
    {
      pregunta: "En una destilación fraccionada, la columna de fraccionamiento permite:",
      opciones: ["Ir más rápido", "Realizar múltiples ciclos de evaporación-condensación, mejorando la pureza", "Cambiar el color", "Ahorrar agua"],
      respuestaCorrecta: 1,
      explicacion: "Es esencial para separar líquidos con puntos de ebullición muy cercanos."
    },
    {
      pregunta: "Si destilamos una mezcla de agua (100°C) y acetona (56°C), ¿qué sale primero?",
      opciones: ["Agua", "Acetona", "Ambas al mismo tiempo", "Ninguna"],
      respuestaCorrecta: 1,
      explicacion: "La acetona es más volátil; su vapor saturará el sistema mucho antes que el del agua."
    },
    {
      pregunta: "¿Por qué el agua en el refrigerante debe entrar por la parte inferior?",
      opciones: ["Por gravedad", "Para asegurar que el tubo esté siempre lleno y el enfriamiento sea eficiente", "Porque la manguera es corta", "Para que no salpique"],
      respuestaCorrecta: 1,
      explicacion: "El flujo a contracorriente maximiza la transferencia de calor."
    },
    {
      pregunta: "Un 'Azeótropo' es una mezcla que:",
      opciones: ["No se puede mezclar", "Destila con una composición constante, como si fuera una sustancia pura", "Es explosiva", "Es muy densa"],
      respuestaCorrecta: 1,
      explicacion: "Como el alcohol al 96%; no se puede purificar más mediante destilación simple debido a interacciones moleculares."
    },
    {
      pregunta: "¿Qué es el 'Destilado'?",
      opciones: ["El líquido que queda en el matraz inicial", "El producto líquido recolectado después de la condensación", "El gas que se escapa", "El agua de enfriamiento"],
      respuestaCorrecta: 1,
      explicacion: "Es la sustancia purificada que ha pasado por la fase de vapor."
    },
    {
      pregunta: "¿Qué es el 'Residuo' en destilación?",
      opciones: ["Lo que se evapora", "Lo que queda en el matraz de ebullición al final", "El agua del condensador", "El termómetro"],
      respuestaCorrecta: 1,
      explicacion: "Son los componentes con mayor punto de ebullición o impurezas que no se evaporaron."
    },
    {
      pregunta: "¿Para qué se usa la destilación al vacío?",
      opciones: ["Para ir más rápido", "Para destilar sustancias que se descomponen a altas temperaturas", "Para que no huela", "Para ahorrar electricidad"],
      respuestaCorrecta: 1,
      explicacion: "Al bajar la presión, el punto de ebullición disminuye, permitiendo destilar a temperaturas más bajas."
    },
    {
      pregunta: "En el laboratorio, el termómetro debe colocarse:",
      opciones: ["Dentro del líquido", "A la altura de la salida lateral hacia el condensador", "En el fondo del matraz", "Fuera del equipo"],
      respuestaCorrecta: 1,
      explicacion: "Para medir con precisión la temperatura del VAPOR que realmente está entrando al condensador."
    },
    {
      pregunta: "La destilación simple es efectiva cuando la diferencia de puntos de ebullición es:",
      opciones: ["Menor a 5°C", "Mayor a 25-30°C", "Cero", "No importa la diferencia"],
      respuestaCorrecta: 1,
      explicacion: "Si los puntos están muy cerca, se requiere destilación fraccionada para una buena separación."
    },
    {
      pregunta: "¿Qué fuente de calor es más segura para destilar líquidos inflamables?",
      opciones: ["Mechero Bunsen (llama abierta)", "Manta de calentamiento eléctrica o baño de maría", "Velas", "Fricción"],
      respuestaCorrecta: 1,
      explicacion: "Evita el riesgo de ignición de los vapores en caso de fugas."
    },
    {
      pregunta: "La destilación es un proceso físico porque:",
      opciones: ["Cambia la estructura molecular", "Solo hay cambios de estado de la materia", "Produce fuego", "Usa mucha fuerza"],
      respuestaCorrecta: 1,
      explicacion: "No se rompen ni forman enlaces químicos, solo se separan sustancias por sus propiedades físicas."
    }
  ];

export default quiz;
