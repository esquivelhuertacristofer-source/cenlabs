import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué representa un ecosistema?",
      opciones: ["Solo los animales", "La interacción entre factores bióticos (seres vivos) y abióticos (ambiente)", "Las plantas únicamente", "Un zoológico"],
      respuestaCorrecta: 1,
      explicacion: "Es una unidad funcional donde la materia y energía fluyen entre lo vivo y lo no vivo."
    },
    {
      pregunta: "¿Qué sucede en el modelo Presa-Depredador si hay demasiados depredadores?",
      opciones: ["Las presas aumentan", "La población de presas colapsa, seguida por la de depredadores (hambre)", "Nada, el ecosistema es infinito", "Los depredadores se vuelven vegetarianos"],
      respuestaCorrecta: 1,
      explicacion: "Es un ciclo de retroalimentación negativa que mantiene el equilibrio."
    },
    {
      pregunta: "¿Quiénes son los 'Productores' en una cadena trófica?",
      opciones: ["Los hongos", "Los leones", "Las plantas y algas (autótrofos)", "Los humanos"],
      respuestaCorrecta: 2,
      explicacion: "Son los únicos capaces de transformar energía solar en energía química (comida)."
    },
    {
      pregunta: "¿Qué es la capacidad de carga de un ecosistema?",
      opciones: ["El peso de la tierra", "El tamaño máximo de población que el ambiente puede soportar indefinidamente", "Cuánta comida hay en un camión", "La velocidad del viento"],
      respuestaCorrecta: 1,
      explicacion: "Llegado a este punto, la falta de recursos limita el crecimiento poblacional."
    },
    {
      pregunta: "¿Qué papel juegan los descomponedores (bacterias y hongos)?",
      opciones: ["Cazar animales", "Reciclar la materia orgánica convirtiéndola en inorgánica para los productores", "No sirven de nada", "Ensuciar el suelo"],
      respuestaCorrecta: 1,
      explicacion: "Sin ellos, los nutrientes quedarían atrapados en los cadáveres y la vida se detendría."
    },
    {
      pregunta: "La biodiversidad es importante porque:",
      opciones: ["Se ve bonito", "Aumenta la estabilidad y resiliencia del ecosistema ante cambios", "Hace que el aire sea más denso", "No es importante"],
      respuestaCorrecta: 1,
      explicacion: "Ecosistemas con más especies tienen más formas de recuperarse de desastres."
    },
    {
      pregunta: "Si una especie desaparece por completo, se dice que está:",
      opciones: ["En peligro", "Extinta", "Durmiendo", "Migrando"],
      respuestaCorrecta: 1,
      explicacion: "La extinción es la pérdida total de los individuos de una especie."
    },
    {
      pregunta: "¿Qué es un factor abiótico?",
      opciones: ["Un ser vivo", "Un elemento no vivo (luz, agua, temperatura, suelo)", "Un tipo de planta", "Un virus"],
      respuestaCorrecta: 1,
      explicacion: "Son las condiciones físicas y químicas del entorno."
    },
    {
      pregunta: "La relación de Simbiosis donde ambos se benefician se llama:",
      opciones: ["Parasitismo", "Mutualismo", "Comensalismo", "Competencia"],
      respuestaCorrecta: 1,
      explicacion: "Ejemplo: las abejas y las flores."
    },
    {
      pregunta: "¿Qué es la Huella Ecológica?",
      opciones: ["La marca de un zapato", "La medida del impacto humano sobre la capacidad de regeneración de la naturaleza", "Un camino en el bosque", "El peso de un animal"],
      respuestaCorrecta: 1,
      explicacion: "Mide cuánta tierra y agua necesitamos para mantener nuestro estilo de vida."
    },
    {
      pregunta: "El Efecto Invernadero es:",
      opciones: ["Malo siempre", "Un proceso natural que mantiene la temperatura de la Tierra apta para la vida", "Una máquina para plantas", "Cuando llueve mucho"],
      respuestaCorrecta: 1,
      explicacion: "El problema actual es su aumento excesivo por la contaminación (Calentamiento Global)."
    },
    {
      pregunta: "¿Qué es una población en ecología?",
      opciones: ["Todos los seres vivos del mundo", "Un grupo de individuos de la misma especie que viven en un mismo lugar", "Una ciudad", "Diferentes especies juntas"],
      respuestaCorrecta: 1,
      explicacion: "Comparten recursos y pueden reproducirse entre sí."
    },
    {
      pregunta: "En una pirámide de energía, ¿qué porcentaje se suele pasar al siguiente nivel?",
      opciones: ["100%", "90%", "Aproximadamente el 10%", "50%"],
      respuestaCorrecta: 2,
      explicacion: "La mayor parte de la energía se pierde como calor o en procesos vitales (Ley del Diezmo)."
    },
    {
      pregunta: "El 'Nicho Ecológico' de una especie es:",
      opciones: ["Su dirección física (dónde vive)", "Su función o papel en el ecosistema (qué come, quién lo come, etc.)", "Un agujero en una roca", "Su nombre científico"],
      respuestaCorrecta: 1,
      explicacion: "Es como su 'profesión' dentro de la comunidad biológica."
    }
  ];

export default quiz;
