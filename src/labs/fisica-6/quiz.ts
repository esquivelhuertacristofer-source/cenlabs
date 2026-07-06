import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué establece el Principio de Arquímedes?",
      opciones: ["Que los cuerpos pesados siempre se hunden", "Que todo cuerpo sumergido experimenta un empuje vertical hacia arriba igual al peso del fluido desalojado", "Que la presión aumenta con la profundidad", "Que el agua es azul"],
      respuestaCorrecta: 1,
      explicacion: "El empuje es una fuerza creada por la diferencia de presiones sobre el objeto sumergido."
    },
    {
      pregunta: "¿De qué depende la fuerza de empuje (E)?",
      opciones: ["De la masa del objeto", "Del volumen sumergido y la densidad del fluido", "Del color del fluido", "De la forma del objeto únicamente"],
      respuestaCorrecta: 1,
      explicacion: "E = ρ_fluido * g * V_sumergido. No importa de qué esté hecho el objeto, solo cuánto espacio ocupa."
    },
    {
      pregunta: "Si un objeto flota, significa que:",
      opciones: ["Su densidad es mayor que la del fluido", "Su densidad es menor que la del fluido", "No tiene peso", "Está lleno de aire"],
      respuestaCorrecta: 1,
      explicacion: "Al ser menos denso, el volumen de agua necesario para igualar su peso es menor a su volumen total."
    },
    {
      pregunta: "¿Qué es el 'Peso Aparente'?",
      opciones: ["El peso real multiplicado por dos", "La diferencia entre el peso real y el empuje", "El peso del agua", "Una ilusión óptica"],
      respuestaCorrecta: 1,
      explicacion: "Es lo que marca una balanza cuando el objeto está sumergido; se siente más ligero porque el agua lo 'ayuda' a subir."
    },
    {
      pregunta: "Un barco de hierro flota porque:",
      opciones: ["El hierro flota en agua salada", "Su diseño desplaza un volumen de agua cuyo peso es igual al peso total del barco", "Tiene motores potentes", "La pintura lo hace ligero"],
      respuestaCorrecta: 1,
      explicacion: "Aunque el hierro es denso, la forma hueca del barco desplaza muchísima agua, generando un empuje enorme."
    },
    {
      pregunta: "¿Por qué es más fácil flotar en el Mar Muerto que en una piscina?",
      opciones: ["Porque hay más sol", "Porque el agua salada es más densa, generando más empuje", "Porque el agua es más profunda", "Porque no hay olas"],
      respuestaCorrecta: 1,
      explicacion: "A mayor densidad del fluido (ρ_fluido), mayor es la fuerza de empuje para el mismo volumen sumergido."
    },
    {
      pregunta: "Si un objeto desaloja 1 litro de agua, el empuje es de aproximadamente:",
      opciones: ["1 Newton", "9.8 Newtons", "100 Newtons", "0.1 Newtons"],
      respuestaCorrecta: 1,
      explicacion: "1 litro de agua pesa 1 kg. Su peso es m*g = 1 * 9.8 = 9.8 N."
    },
    {
      pregunta: "Si un objeto está totalmente sumergido, ¿cuánto vale el volumen desalojado?",
      opciones: ["La mitad de su volumen", "El doble de su volumen", "Exactamente su propio volumen", "Cero"],
      respuestaCorrecta: 2,
      explicacion: "Al entrar al agua, el objeto ocupa un espacio igual a su cuerpo, desplazando esa misma cantidad de agua."
    },
    {
      pregunta: "¿Qué sucede si el empuje es mayor que el peso?",
      opciones: ["El objeto se hunde", "El objeto sube a la superficie y flota", "El objeto explota", "No pasa nada"],
      respuestaCorrecta: 1,
      explicacion: "La fuerza neta es hacia arriba, impulsando al objeto hasta que parte de él salga del agua y el empuje se iguale al peso."
    },
    {
      pregunta: "Un submarino se sumerge aumentando su:",
      opciones: ["Volumen", "Empuje", "Peso (llenando tanques de agua)", "Velocidad"],
      respuestaCorrecta: 2,
      explicacion: "Al meter agua en sus tanques, aumenta su densidad promedio hasta ser mayor que la del mar."
    },
    {
      pregunta: "¿Por qué es más fácil levantar a alguien dentro de una piscina?",
      opciones: ["Porque somos más fuertes en el agua", "Por la fuerza de empuje que ayuda a sostener a la persona", "Porque el agua nos hace más ligeros", "Porque la gravedad es menor"],
      respuestaCorrecta: 1,
      explicacion: "El agua ejerce una fuerza hacia arriba que contrarresta parte del peso real."
    },
    {
      pregunta: "La densidad del agua pura es aproximadamente:",
      opciones: ["100 kg/m³", "1000 kg/m³", "1 kg/m³", "10,000 kg/m³"],
      respuestaCorrecta: 1,
      explicacion: "Equivale a 1 gramo por centímetro cúbico (1 g/cm³)."
    },
    {
      pregunta: "Si un objeto pesa 50N en el aire y 30N en el agua, el empuje es:",
      opciones: ["80N", "20N", "50N", "30N"],
      respuestaCorrecta: 1,
      explicacion: "Empuje = Peso_real - Peso_aparente = 50 - 30 = 20 Newtons."
    },
    {
      pregunta: "¿Qué sucede con el empuje si bajamos a mucha profundidad (sin cambiar el volumen)?",
      opciones: ["Aumenta mucho", "Disminuye", "Se mantiene casi igual (el agua es incompresible)", "Se vuelve cero"],
      respuestaCorrecta: 2,
      explicacion: "Como la densidad del agua casi no cambia con la profundidad, el empuje permanece constante."
    }
  ];

export default quiz;
