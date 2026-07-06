import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué establece la Ley de Hooke?",
      opciones: ["F = m * a", "F = k * x", "E = m * c²", "P = F / A"],
      respuestaCorrecta: 1,
      explicacion: "La fuerza ejercida por un resorte es directamente proporcional a su estiramiento o compresión (x)."
    },
    {
      pregunta: "La unidad de la constante elástica (k) en el SI es:",
      opciones: ["Newtons", "Metros", "N / m", "Joules"],
      respuestaCorrecta: 2,
      explicacion: "k representa cuánta fuerza se necesita para estirar el resorte un metro."
    },
    {
      pregunta: "Si un resorte tiene k = 100 N/m y se estira 0.1 m, ¿cuánta fuerza ejerce?",
      opciones: ["10 N", "1000 N", "1 N", "100 N"],
      respuestaCorrecta: 0,
      explicacion: "F = 100 * 0.1 = 10 Newtons."
    },
    {
      pregunta: "¿Qué sucede si superamos el 'límite elástico' de un material?",
      opciones: ["Se estira más rápido", "Se deforma permanentemente o se rompe", "Se vuelve más fuerte", "No pasa nada"],
      respuestaCorrecta: 1,
      explicacion: "Más allá de este límite, el material ya no recupera su forma original al quitar la fuerza."
    },
    {
      pregunta: "En un gráfico de Fuerza vs Estiramiento, k representa:",
      opciones: ["El área bajo la curva", "La pendiente de la recta", "El punto de corte con Y", "La velocidad"],
      respuestaCorrecta: 1,
      explicacion: "Como F = kx, la pendiente de la línea recta es precisamente la constante k."
    },
    {
      pregunta: "La energía almacenada en un resorte estirado se llama:",
      opciones: ["Energía Cinética", "Energía Potencial Elástica", "Energía Térmica", "Energía Química"],
      respuestaCorrecta: 1,
      explicacion: "Es energía acumulada debido a la configuración del sistema (U = 1/2 kx²)."
    },
    {
      pregunta: "¿Por qué los amortiguadores de los autos usan resortes fuertes (k alta)?",
      opciones: ["Para que el auto sea más alto", "Para soportar grandes fuerzas con poco desplazamiento", "Para ahorrar combustible", "Por estética"],
      respuestaCorrecta: 1,
      explicacion: "Se requiere mucha fuerza para comprimir el resorte, lo que absorbe los impactos del camino."
    },
    {
      pregunta: "Si conectamos dos resortes iguales en serie, la constante equivalente es:",
      opciones: ["El doble (2k)", "La mitad (k/2)", "La misma (k)", "Cero"],
      respuestaCorrecta: 1,
      explicacion: "En serie, el sistema se vuelve más 'blando' o flexible, reduciendo la constante total."
    },
    {
      pregunta: "Si conectamos dos resortes iguales en paralelo, la constante equivalente es:",
      opciones: ["El doble (2k)", "La mitad (k/2)", "La misma (k)", "k²"],
      respuestaCorrecta: 0,
      explicacion: "En paralelo, ambos resortes ayudan a soportar la carga, haciendo el sistema más rígido."
    },
    {
      pregunta: "Un material que NO recupera su forma se llama:",
      opciones: ["Elástico", "Plástico", "Inerte", "Líquido"],
      respuestaCorrecta: 1,
      explicacion: "La plasticidad es la propiedad de deformarse permanentemente bajo esfuerzo."
    },
    {
      pregunta: "¿Qué representa el área bajo la curva en un gráfico F vs x?",
      opciones: ["La constante k", "La energía potencial elástica almacenada", "La velocidad", "La masa"],
      respuestaCorrecta: 1,
      explicacion: "El trabajo realizado (energía) es el área de integración del gráfico Fuerza-Desplazamiento."
    },
    {
      pregunta: "¿Cuál es la unidad de la Energía en el SI?",
      opciones: ["Watt", "Newton", "Joule (J)", "Pascal"],
      respuestaCorrecta: 2,
      explicacion: "Un Joule equivale a un Newton-metro."
    },
    {
      pregunta: "El signo negativo en F = -kx indica:",
      opciones: ["Que la fuerza es débil", "Que la fuerza se opone al desplazamiento (fuerza restauradora)", "Que el resorte se rompe", "Error matemático"],
      respuestaCorrecta: 1,
      explicacion: "Si estiras el resorte (+x), la fuerza tira hacia atrás (-F)."
    },
    {
      pregunta: "Si un resorte se comprime en lugar de estirarse, ¿se cumple la Ley de Hooke?",
      opciones: ["No, solo para estirar", "Sí, funciona igual para compresión (mientras sea elástico)", "Solo si es de metal", "Depende de la gravedad"],
      respuestaCorrecta: 1,
      explicacion: "La ley es válida para ambos sentidos de deformación dentro del rango elástico."
    }
  ];

export default quiz;
