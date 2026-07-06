import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué es la Molaridad (M)?",
      opciones: ["Gramos de soluto por litro", "Moles de soluto por litro de solución", "Moles de soluto por kg de solvente", "Densidad de la mezcla"],
      respuestaCorrecta: 1,
      explicacion: "Es la unidad de concentración más común en química analítica."
    },
    {
      pregunta: "¿Para qué sirve el aforo en un matraz volumétrico?",
      opciones: ["Para decorar", "Para indicar el volumen exacto de calibración", "Para sujetarlo", "Para medir la temperatura"],
      respuestaCorrecta: 1,
      explicacion: "El matraz está diseñado para contener un volumen preciso solo cuando el menisco está en el aforo."
    },
    {
      pregunta: "Para preparar 1L de solución 1M de NaCl (masa molar ≈ 58.5g/mol), necesito pesar:",
      opciones: ["1 gramo", "100 gramos", "58.5 gramos", "22.4 gramos"],
      respuestaCorrecta: 2,
      explicacion: "M = n/V. Si M=1 y V=1, entonces n=1 mol. 1 mol de NaCl pesa su masa molar."
    },
    {
      pregunta: "¿Cómo debe leerse el menisco en una solución acuosa?",
      opciones: ["Desde la parte superior de la curva", "Desde la parte inferior (punto más bajo de la panza)", "En diagonal", "No importa"],
      respuestaCorrecta: 1,
      explicacion: "La tensión superficial crea una curva; la medida estándar es la base de esa curva."
    },
    {
      pregunta: "Una solución saturada es aquella que:",
      opciones: ["Tiene mucha agua", "No admite más soluto a esa temperatura", "Está muy caliente", "Es transparente"],
      respuestaCorrecta: 1,
      explicacion: "Ha alcanzado el límite de solubilidad; cualquier soluto extra se irá al fondo sin disolverse."
    },
    {
      pregunta: "¿Qué significa 'Aforar'?",
      opciones: ["Pesar el soluto", "Llenar el matraz hasta la marca de precisión", "Limpiar el equipo", "Agitar la mezcla"],
      respuestaCorrecta: 1,
      explicacion: "Es la acción crítica de llevar el volumen al nivel exacto de la marca (aforo)."
    },
    {
      pregunta: "Si diluyo 100ml de solución 2M agregando 100ml de agua pura, la nueva concentración es:",
      opciones: ["2 M", "4 M", "1 M", "0.5 M"],
      respuestaCorrecta: 2,
      explicacion: "Al duplicar el volumen, la concentración se reduce a la mitad (C1V1 = C2V2)."
    },
    {
      pregunta: "¿Qué es el 'Soluto'?",
      opciones: ["El componente que disuelve", "La sustancia que se disuelve (presente en menor cantidad)", "El líquido transparente", "El matraz"],
      respuestaCorrecta: 1,
      explicacion: "Es el componente que se dispersa en el solvente para formar la solución."
    },
    {
      pregunta: "¿Qué es el 'Solvente' o 'Disolvente'?",
      opciones: ["La sustancia que disuelve al soluto", "El polvo blanco", "La balanza", "El resultado de la mezcla"],
      respuestaCorrecta: 0,
      explicacion: "Generalmente es el componente en mayor cantidad (como el agua)."
    },
    {
      pregunta: "¿Qué indica la 'Normalidad' (N)?",
      opciones: ["Es lo mismo que Molaridad", "Equivalentes de soluto por litro", "Masa por volumen", "Grado de pureza"],
      respuestaCorrecta: 1,
      explicacion: "Se usa a menudo en titulaciones ácido-base para considerar la valencia."
    },
    {
      pregunta: "¿Qué sucede con la molaridad si el volumen de la solución se reduce por evaporación?",
      opciones: ["Aumenta", "Disminuye", "No cambia", "Se vuelve negativa"],
      respuestaCorrecta: 0,
      explicacion: "Al haber menos solvente para la misma cantidad de soluto, la solución se vuelve más concentrada."
    },
    {
      pregunta: "Una solución 0.5 M contiene:",
      opciones: ["0.5 moles en 500ml", "0.5 moles en 1 litro", "1 mol en 1 litro", "5 moles en 10 litros"],
      respuestaCorrecta: 1,
      explicacion: "La molaridad siempre se refiere a moles por cada 1000ml (1L)."
    },
    {
      pregunta: "¿Por qué se usa agua destilada en lugar de agua de grifo?",
      opciones: ["Para que sea potable", "Para evitar contaminar la solución con iones externos", "Porque es más barata", "Porque no tiene burbujas"],
      respuestaCorrecta: 1,
      explicacion: "Los minerales del grifo podrían reaccionar con el soluto y falsear la concentración."
    },
    {
      pregunta: "El término 'Partes por Millón' (ppm) se usa para concentraciones:",
      opciones: ["Muy altas", "Muy bajas (trazas)", "Medias", "Solo de gases"],
      respuestaCorrecta: 1,
      explicacion: "Equivale a 1 mg de soluto en 1 kg o litro de solución."
    }
  ];

export default quiz;
