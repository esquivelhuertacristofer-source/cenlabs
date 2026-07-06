import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué es la ósmosis?",
      opciones: ["El paso de solutos a través de una membrana", "El movimiento neto de agua a través de una membrana semipermeable", "La respiración celular", "La división del núcleo"],
      respuestaCorrecta: 1,
      explicacion: "El agua se mueve de donde hay menos soluto (más agua) a donde hay más soluto (menos agua)."
    },
    {
      pregunta: "En un medio HIPERTÓNICO, una célula animal:",
      opciones: ["Se hincha y puede explotar (citólisis)", "Se arruga y pierde agua (crenación)", "No cambia", "Se divide"],
      respuestaCorrecta: 1,
      explicacion: "Como el exterior está más concentrado, el agua sale de la célula para intentar equilibrar."
    },
    {
      pregunta: "¿Qué evita que una célula vegetal explote en un medio hipotónico?",
      opciones: ["La membrana plasmática", "La pared celular rígida", "Las vacuolas", "El núcleo"],
      respuestaCorrecta: 1,
      explicacion: "La pared ejerce una presión contraria (presión de turgencia) que limita la entrada de agua."
    },
    {
      pregunta: "Una solución ISOTÓNICA es aquella donde:",
      opciones: ["La concentración de solutos es igual adentro y afuera de la célula", "Hay mucha sal afuera", "No hay agua", "La célula muere"],
      respuestaCorrecta: 0,
      explicacion: "No hay flujo neto de agua; la célula mantiene su volumen estable."
    },
    {
      pregunta: "El fenómeno de la plasmólisis en plantas ocurre cuando:",
      opciones: ["La célula gana agua", "La membrana se separa de la pared debido a la pérdida de agua", "La célula se divide", "La planta florece"],
      respuestaCorrecta: 1,
      explicacion: "Ocurre en medios hipertónicos; la vacuola se encoge y jala a la membrana."
    },
    {
      pregunta: "¿Qué tipo de transporte es la ósmosis?",
      opciones: ["Transporte Activo (usa ATP)", "Transporte Pasivo (difusión simple de agua)", "Endocitosis", "Exocitosis"],
      respuestaCorrecta: 1,
      explicacion: "No requiere gasto de energía celular; ocurre por gradiente de concentración."
    },
    {
      pregunta: "Si bebes mucha agua de mar (muy salada), tus células:",
      opciones: ["Se hidratan más", "Se deshidratan por ósmosis", "Se vuelven más fuertes", "No les pasa nada"],
      respuestaCorrecta: 1,
      explicacion: "El exceso de sal en la sangre crearía un medio hipertónico, sacando el agua de tus células."
    },
    {
      pregunta: "¿Qué componente da fluidez a la membrana celular animal?",
      opciones: ["Proteínas", "Colesterol", "Almidón", "Celulosa"],
      respuestaCorrecta: 1,
      explicacion: "El colesterol se intercala entre los fosfolípidos regulando la rigidez."
    },
    {
      pregunta: "El transporte de glucosa a favor del gradiente usando una proteína se llama:",
      opciones: ["Difusión simple", "Difusión facilitada", "Ósmosis", "Bomba de Sodio"],
      respuestaCorrecta: 1,
      explicacion: "Usa proteínas canal o transportadoras sin gastar ATP."
    },
    {
      pregunta: "¿Qué organelo es el 'centro de control' de la célula?",
      opciones: ["Vacuola", "Núcleo", "Lisosoma", "Ribosoma"],
      respuestaCorrecta: 1,
      explicacion: "Contiene el material genético (ADN) que dirige todas las funciones."
    },
    {
      pregunta: "Las mitocondrias son responsables de:",
      opciones: ["La fotosíntesis", "La respiración celular y producción de ATP", "La síntesis de proteínas", "La digestión"],
      respuestaCorrecta: 1,
      explicacion: "Son las centrales energéticas de la célula."
    },
    {
      pregunta: "¿Qué diferencia a una célula procariota de una eucariota?",
      opciones: ["La presencia de ADN", "La ausencia de un núcleo definido por membrana", "La pared celular", "El tamaño"],
      respuestaCorrecta: 1,
      explicacion: "Las procariotas (bacterias) tienen el ADN libre en el citoplasma."
    },
    {
      pregunta: "Los ribosomas se encargan de:",
      opciones: ["Sintetizar lípidos", "Sintetizar proteínas", "Mover la célula", "Almacenar agua"],
      respuestaCorrecta: 1,
      explicacion: "Leen el ARNm para ensamblar cadenas de aminoácidos."
    },
    {
      pregunta: "¿Qué estructura es exclusiva de la célula vegetal?",
      opciones: ["Membrana", "Cloroplastos y Pared Celular", "Núcleo", "Mitocondrias"],
      respuestaCorrecta: 1,
      explicacion: "Permiten realizar fotosíntesis y dar soporte rígido a la planta."
    }
  ];

export default quiz;
