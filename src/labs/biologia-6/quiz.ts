import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Quién propuso la teoría de la evolución por selección natural?",
      opciones: ["Mendel", "Charles Darwin", "Einstein", "Pasteur"],
      respuestaCorrecta: 1,
      explicacion: "En su obra 'El origen de las especies' (1859)."
    },
    {
      pregunta: "¿Cuál es el motor principal de la selección natural?",
      opciones: ["El deseo de cambiar", "La variabilidad genética y la presión del entorno", "La magia", "La falta de comida solamente"],
      respuestaCorrecta: 1,
      explicacion: "Individuos con rasgos ventajosos sobreviven más y dejan más descendencia."
    },
    {
      pregunta: "¿Qué es una adaptación?",
      opciones: ["Un cambio que ocurre en un solo individuo durante su vida", "Un rasgo heredable que aumenta la supervivencia en un ambiente", "Aprender a nadar", "Mudarse de casa"],
      respuestaCorrecta: 1,
      explicacion: "Son rasgos refinados por la selección a lo largo de muchas generaciones."
    },
    {
      pregunta: "En el caso de las polillas de Manchester, ¿por qué aumentaron las oscuras?",
      opciones: ["Por la contaminación que oscureció los árboles (mejor camuflaje)", "Porque hacía más calor", "Porque eran más fuertes", "Fue por azar"],
      respuestaCorrecta: 0,
      explicacion: "La selección favoreció a las que no eran vistas por los pájaros en troncos llenos de hollín."
    },
    {
      pregunta: "La selección natural actúa sobre:",
      opciones: ["Los genes directamente", "El fenotipo (el individuo)", "Solo las crías", "Las rocas"],
      respuestaCorrecta: 1,
      explicacion: "El ambiente 'elige' a los individuos; esto cambia la frecuencia de los genes en la población después."
    },
    {
      pregunta: "¿Qué sucede con una especie que no puede adaptarse a un cambio ambiental rápido?",
      opciones: ["Se vuelve inmortal", "Corre el riesgo de extinguirse", "Cambia sus genes a voluntad", "Se duplica"],
      respuestaCorrecta: 1,
      explicacion: "Si la tasa de cambio ambiental supera la tasa de evolución, la población colapsa."
    },
    {
      pregunta: "La 'supervivencia del más apto' significa:",
      opciones: ["El más fuerte físicamente", "El que mejor se reproduce y transmite sus genes", "El más inteligente", "El que vive más años"],
      respuestaCorrecta: 1,
      explicacion: "En biología, 'aptitud' es éxito reproductivo."
    },
    {
      pregunta: "¿Qué es una mutación en el contexto evolutivo?",
      opciones: ["Algo malo siempre", "La fuente original de variabilidad genética", "Un cambio de color", "Un error de copia sin importancia"],
      respuestaCorrecta: 1,
      explicacion: "Sin mutaciones, todos los individuos serían clones y no habría evolución."
    },
    {
      pregunta: "Las estructuras homólogas son aquellas que:",
      opciones: ["Tienen funciones iguales pero origen distinto", "Tienen origen común pero pueden tener funciones distintas (ej: ala de murciélago y brazo humano)", "Son iguales en todo", "No sirven para nada"],
      respuestaCorrecta: 1,
      explicacion: "Evidencian un ancestro común."
    },
    {
      pregunta: "La Selección Artificial es realizada por:",
      opciones: ["La naturaleza", "Los humanos (ej: razas de perros)", "Las máquinas", "El azar"],
      respuestaCorrecta: 1,
      explicacion: "Elegimos rasgos que nos convienen (productividad, estética)."
    },
    {
      pregunta: "¿Qué es un fósil?",
      opciones: ["Una roca vieja", "Restos o evidencias de organismos que vivieron en el pasado", "Un animal vivo", "Una herramienta de piedra"],
      respuestaCorrecta: 1,
      explicacion: "Permiten reconstruir la historia de la vida."
    },
    {
      pregunta: "El mimetismo es una adaptación donde:",
      opciones: ["Un organismo imita a otro o al entorno para protección", "Un organismo cambia de casa", "Un organismo duerme mucho", "Un organismo corre rápido"],
      respuestaCorrecta: 0,
      explicacion: "Ejemplo: mariposas que parecen ojos de búho."
    },
    {
      pregunta: "Jean-Baptiste Lamarck proponía erróneamente que:",
      opciones: ["Los caracteres adquiridos se heredan", "La selección natural manda", "Las jirafas no existen", "El ADN es una hélice"],
      respuestaCorrecta: 0,
      explicacion: "Creía que si un atleta ganaba músculo, su hijo nacería musculoso."
    },
    {
      pregunta: "La Especiación es el proceso de:",
      opciones: ["Muerte de una especie", "Formación de una nueva especie", "Viajar al espacio", "Clonar animales"],
      respuestaCorrecta: 1,
      explicacion: "Ocurre cuando poblaciones se separan y evolucionan de forma distinta hasta no poder reproducirse entre sí."
    }
  ];

export default quiz;
