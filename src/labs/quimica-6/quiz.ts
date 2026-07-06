import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué es la solubilidad?",
      opciones: ["La velocidad de disolución", "La cantidad máxima de soluto que se puede disolver en un solvente a una temperatura dada", "El color de la solución", "La dureza del cristal"],
      respuestaCorrecta: 1,
      explicacion: "Es una propiedad física que depende fuertemente de la temperatura y la naturaleza química."
    },
    {
      pregunta: "En la mayoría de los sólidos, si la temperatura aumenta, la solubilidad:",
      opciones: ["Disminuye", "Aumenta", "Se mantiene igual", "Se vuelve cero"],
      respuestaCorrecta: 1,
      explicacion: "El calor ayuda a romper las fuerzas intermoleculares del sólido, facilitando que entre en el solvente."
    },
    {
      pregunta: "¿Qué sucede en una solución SOBRESATURADA?",
      opciones: ["Es muy estable", "Contiene más soluto del que puede disolver en equilibrio; es inestable", "No tiene soluto", "Es un gas"],
      respuestaCorrecta: 1,
      explicacion: "Se logra calentando y enfriando con cuidado. Cualquier perturbación hará que el exceso de soluto cristalice."
    },
    {
      pregunta: "La cristalización se utiliza principalmente para:",
      opciones: ["Destruir sustancias", "Purificar sólidos", "Medir el pH", "Aumentar el volumen"],
      respuestaCorrecta: 1,
      explicacion: "Al cristalizar, las moléculas se ordenan en una red perfecta, dejando las impurezas fuera en el líquido (aguas madres)."
    },
    {
      pregunta: "¿Qué inicia el proceso de cristalización en una solución saturada?",
      opciones: ["Aumento de temperatura", "Disminución de temperatura o evaporación del solvente", "Agregar más agua", "Agitar muy lento"],
      respuestaCorrecta: 1,
      explicacion: "Al enfriar, la solubilidad cae; el soluto ya no cabe en el agua y debe salir en forma de cristales."
    },
    {
      pregunta: "La nucleación es:",
      opciones: ["La explosión del núcleo", "El primer paso de la formación del cristal donde las moléculas se agrupan", "El cambio de color", "La filtración"],
      respuestaCorrecta: 1,
      explicacion: "Es el nacimiento de los cristales; a partir de pequeños núcleos, el cristal crece."
    },
    {
      pregunta: "Si enfriamos MUY rápido (choque térmico), los cristales suelen ser:",
      opciones: ["Muy grandes y perfectos", "Pequeños y numerosos", "No se forman cristales", "Se vuelven negros"],
      respuestaCorrecta: 1,
      explicacion: "Un enfriamiento rápido crea muchos núcleos simultáneamente, resultando en cristales pequeños."
    },
    {
      pregunta: "¿Qué es una solución insaturada?",
      opciones: ["La que tiene exceso de soluto", "La que contiene menos soluto del máximo permitido a esa temperatura", "La que está hirviendo", "Una mezcla de gases"],
      respuestaCorrecta: 1,
      explicacion: "Todavía tiene capacidad de disolver más soluto si se le agrega."
    },
    {
      pregunta: "¿Cómo afecta la presión a la solubilidad de un GAS en un líquido (Ley de Henry)?",
      opciones: ["A mayor presión, mayor solubilidad", "A mayor presión, menor solubilidad", "No le afecta", "Hace que el gas se congele"],
      respuestaCorrecta: 0,
      explicacion: "Por eso los refrescos tienen gas bajo presión; al abrir la tapa, la presión baja y el gas sale (burbujas)."
    },
    {
      pregunta: "El proceso inverso a la disolución es la:",
      opciones: ["Evaporación", "Precipitación / Cristalización", "Fusión", "Sublimación"],
      respuestaCorrecta: 1,
      explicacion: "Cuando el soluto sale de la fase líquida para volver a ser sólido."
    },
    {
      pregunta: "¿Qué es una 'Siembra' de cristales?",
      opciones: ["Plantar semillas en el jardín", "Agregar un pequeño cristal puro a una solución sobresaturada para iniciar el crecimiento", "Usar tierra en el laboratorio", "Hervir la solución"],
      respuestaCorrecta: 1,
      explicacion: "Proporciona una superficie de nucleación inmediata para que el soluto se deposite."
    },
    {
      pregunta: "En una curva de solubilidad, el eje Y suele representar:",
      opciones: ["Temperatura", "Gramos de soluto por cada 100g de solvente", "Presión", "Tiempo"],
      respuestaCorrecta: 1,
      explicacion: "Muestra la capacidad máxima de disolución frente a la variable X (Temperatura)."
    },
    {
      pregunta: "¿Qué significa 'Semejante disuelve a semejante'?",
      opciones: ["Que solo se mezclan líquidos", "Que sustancias con polaridad similar se disuelven entre sí", "Que el agua disuelve todo", "Que los metales se disuelven en ácidos"],
      respuestaCorrecta: 1,
      explicacion: "Lo polar (como el agua) disuelve lo polar (sal); lo no polar (aceite) disuelve lo no polar (grasa)."
    },
    {
      pregunta: "¿Cuál es el solvente universal?",
      opciones: ["Alcohol", "Acetona", "Agua", "Ácido Sulfúrico"],
      respuestaCorrecta: 2,
      explicacion: "El agua disuelve una enorme variedad de sustancias debido a su naturaleza polar y puentes de hidrógeno."
    }
  ];

export default quiz;
