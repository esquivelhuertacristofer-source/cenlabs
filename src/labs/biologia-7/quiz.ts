import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Cuál es la función principal de los reflejos?",
      opciones: ["Pensar rápido", "Protección y respuesta rápida ante estímulos sin intervención del cerebro consciente", "Hacer ejercicio", "Gastar energía"],
      respuestaCorrecta: 1,
      explicacion: "Los reflejos son automáticos y procesados principalmente en la médula espinal (arco reflejo)."
    },
    {
      pregunta: "¿Qué camino sigue el arco reflejo?",
      opciones: ["Receptor -> Cerebro -> Músculo", "Receptor -> Neurona Sensorial -> Médula -> Neurona Motora -> Músculo", "Músculo -> Nervio -> Corazón", "Piel -> Ojo -> Mano"],
      respuestaCorrecta: 1,
      explicacion: "Es un circuito corto que ahorra tiempo vital en situaciones de peligro."
    },
    {
      pregunta: "¿Qué sustancia acelera la conducción del impulso nervioso?",
      opciones: ["Agua", "Mielina", "Sangre", "Calcio"],
      respuestaCorrecta: 1,
      explicacion: "La vaina de mielina actúa como aislante eléctrico permitiendo la conducción saltatoria."
    },
    {
      pregunta: "El reflejo rotuliano (golpe en la rodilla) es un ejemplo de:",
      opciones: ["Reflejo condicionado", "Reflejo miotático (de estiramiento)", "Reflejo visual", "Enfermedad"],
      respuestaCorrecta: 1,
      explicacion: "Mide la integridad de los nervios espinales y la respuesta muscular básica."
    },
    {
      pregunta: "¿Qué es una sinapsis?",
      opciones: ["Un hueso del cráneo", "El espacio de comunicación entre dos neuronas", "Una parte del músculo", "El núcleo de la célula"],
      respuestaCorrecta: 1,
      explicacion: "Aquí se liberan neurotransmisores para pasar la señal química a la siguiente célula."
    },
    {
      pregunta: "La velocidad de un impulso nervioso puede ser de hasta:",
      opciones: ["1 km/h", "120 m/s (unos 430 km/h)", "La velocidad de la luz", "10 m/s"],
      respuestaCorrecta: 1,
      explicacion: "Es increíblemente rápida gracias a los nodos de Ranvier y la mielina."
    },
    {
      pregunta: "Si se daña la raíz dorsal de la médula, el paciente pierde:",
      opciones: ["El movimiento", "La sensibilidad", "La memoria", "La vista"],
      respuestaCorrecta: 1,
      explicacion: "La raíz dorsal lleva la información sensorial HACIA la médula."
    },
    {
      pregunta: "¿Qué es un neurotransmisor?",
      opciones: ["Una célula de la médula", "Una sustancia química que transmite señales entre neuronas", "Un hueso", "Una proteína del músculo"],
      respuestaCorrecta: 1,
      explicacion: "Ejemplos son la dopamina, serotonina y acetilcolina."
    },
    {
      pregunta: "El sistema nervioso central está compuesto por:",
      opciones: ["Los nervios de las manos", "El encéfalo y la médula espinal", "Solo el cerebro", "El corazón y pulmones"],
      respuestaCorrecta: 1,
      explicacion: "Es el centro de procesamiento principal del cuerpo."
    },
    {
      pregunta: "¿Qué sucede en el 'Umbral de Excitación'?",
      opciones: ["La neurona se muere", "Se dispara un potencial de acción (impulso nervioso)", "La neurona descansa", "Se detiene la sangre"],
      respuestaCorrecta: 1,
      explicacion: "Es el voltaje mínimo necesario para generar una señal eléctrica."
    },
    {
      pregunta: "La neurona motora (o eferente) se encarga de:",
      opciones: ["Sentir el calor", "Llevar la orden del sistema nervioso al músculo", "Pensar", "Ver colores"],
      respuestaCorrecta: 1,
      explicacion: "Produce la respuesta física (el movimiento)."
    },
    {
      pregunta: "El lóbulo occipital del cerebro se especializa en:",
      opciones: ["El oído", "La visión", "El olfato", "El equilibrio"],
      respuestaCorrecta: 1,
      explicacion: "Procesa toda la información que viene de los ojos."
    },
    {
      pregunta: "¿Qué parte del cerebro coordina el equilibrio y la motricidad fina?",
      opciones: ["Hipotálamo", "Cerebelo", "Bulbo raquídeo", "Amígdala"],
      respuestaCorrecta: 1,
      explicacion: "Es vital para caminar, escribir y tocar instrumentos."
    },
    {
      pregunta: "El sistema nervioso Autónomo controla:",
      opciones: ["Caminar", "Funciones involuntarias (latidos, digestión)", "Hablar", "Leer"],
      respuestaCorrecta: 1,
      explicacion: "Funciona sin que tengamos que pensar en ello."
    }
  ];

export default quiz;
