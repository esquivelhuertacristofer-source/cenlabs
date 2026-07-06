import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué dice el Principio de Le Châtelier?",
      opciones: ["Que las reacciones nunca terminan", "Que si un sistema en equilibrio es perturbado, este se desplazará para contrarrestar la perturbación", "Que el calor siempre ayuda", "Que la masa se conserva"],
      respuestaCorrecta: 1,
      explicacion: "Es como una ley de 'terquedad' química: el sistema busca volver a su estado de calma."
    },
    {
      pregunta: "En una reacción ENDOTÉRMICA, si aumentamos la temperatura, el equilibrio:",
      opciones: ["Se desplaza a la derecha (productos)", "Se desplaza a la izquierda (reactivos)", "No se mueve", "Se detiene"],
      respuestaCorrecta: 0,
      explicacion: "Como la reacción 'consume' calor, darle más calor es como darle más reactivo."
    },
    {
      pregunta: "Si aumentamos la presión en un equilibrio gaseoso, el sistema se desplaza hacia:",
      opciones: ["Donde hay más moles de gas", "Donde hay menos moles de gas", "La derecha siempre", "No le afecta la presión"],
      respuestaCorrecta: 1,
      explicacion: "Al haber menos espacio, el sistema busca la configuración que ocupe menos volumen (menos moléculas)."
    },
    {
      pregunta: "¿Qué indica una constante de equilibrio (Kc) muy grande (>1000)?",
      opciones: ["Que casi no hay productos", "Que la reacción favorece fuertemente la formación de productos", "Que la reacción es muy lenta", "Que el sistema no tiene equilibrio"],
      respuestaCorrecta: 1,
      explicacion: "Kc = [Productos]/[Reactivos]. Un valor alto significa un numerador mucho más grande."
    },
    {
      pregunta: "En el sistema N₂O₄ (incoloro) ⇌ 2NO₂ (café), si se oscurece al calentar, la reacción es:",
      opciones: ["Exotérmica", "Endotérmica", "De combustión", "Imposible"],
      respuestaCorrecta: 1,
      explicacion: "El calor favoreció al NO₂ (productos), por lo que absorbió energía para formarse."
    },
    {
      pregunta: "¿Cómo afecta un catalizador al estado de equilibrio?",
      opciones: ["Lo desplaza a la derecha", "Lo desplaza a la izquierda", "No afecta la posición del equilibrio, solo hace que se alcance más rápido", "Aumenta la constante Kc"],
      respuestaCorrecta: 2,
      explicacion: "El catalizador baja la energía de activación para AMBOS sentidos, por lo que no favorece a un lado sobre el otro."
    },
    {
      pregunta: "Si retiramos producto continuamente de un reactor en equilibrio:",
      opciones: ["La reacción se detiene", "El sistema producirá más producto para intentar compensar la pérdida", "Kc cambia", "La temperatura sube"],
      respuestaCorrecta: 1,
      explicacion: "Es el truco usado en la industria para forzar rendimientos del 100%."
    },
    {
      pregunta: "¿Qué es un equilibrio dinámico?",
      opciones: ["Cuando nada se mueve", "Cuando las velocidades de la reacción directa e inversa son iguales", "Cuando la reacción explota", "Cuando no hay reactivos"],
      respuestaCorrecta: 1,
      explicacion: "A nivel macroscópico no hay cambios, pero a nivel molecular la reacción sigue ocurriendo en ambos sentidos."
    },
    {
      pregunta: "¿Qué factores NO afectan el valor de la constante de equilibrio (Kc)?",
      opciones: ["Temperatura", "Concentración y Presión", "Volumen", "Catalizadores"],
      respuestaCorrecta: 1,
      explicacion: "Kc solo cambia con la temperatura. Las concentraciones cambian el equilibrio, pero Kc se mantiene."
    },
    {
      pregunta: "En una reacción EXOTÉRMICA, si enfriamos el sistema, el equilibrio:",
      opciones: ["Se desplaza a la derecha (productos)", "Se desplaza a la izquierda (reactivos)", "Se detiene", "Kc disminuye"],
      respuestaCorrecta: 0,
      explicacion: "Al quitar calor, el sistema busca producir más calor desplazándose hacia el lado exotérmico."
    },
    {
      pregunta: "¿Qué indica un valor de Kc cercano a 1?",
      opciones: ["Que solo hay reactivos", "Que solo hay productos", "Que en el equilibrio hay concentraciones significativas de ambos", "Que la reacción no ocurre"],
      respuestaCorrecta: 2,
      explicacion: "Indica que ni reactivos ni productos dominan de forma absoluta en el equilibrio."
    },
    {
      pregunta: "¿Cómo se escribe la expresión de Kc para la reacción: aA + bB ⇌ cC?",
      opciones: ["[A]^a [B]^b / [C]^c", "[C]^c / ([A]^a [B]^b)", "[A] + [B] / [C]", "a*b / c"],
      respuestaCorrecta: 1,
      explicacion: "Es el producto de las concentraciones de los productos elevado a sus coeficientes entre el de los reactivos."
    },
    {
      pregunta: "Si el Cociente de Reacción (Q) es menor que Kc (Q < Kc):",
      opciones: ["El sistema está en equilibrio", "La reacción procederá hacia la derecha para alcanzar el equilibrio", "La reacción procederá hacia la izquierda", "Kc debe aumentar"],
      respuestaCorrecta: 1,
      explicacion: "Todavía falta formar más producto para llegar al valor de equilibrio."
    },
    {
      pregunta: "¿Qué sustancias NO se incluyen en la expresión de Kc?",
      opciones: ["Gases", "Sólidos puros y líquidos puros", "Iones disueltos", "Ninguna"],
      respuestaCorrecta: 1,
      explicacion: "Su actividad o concentración efectiva se considera constante (1) y no afecta la expresión."
    }
  ];

export default quiz;
