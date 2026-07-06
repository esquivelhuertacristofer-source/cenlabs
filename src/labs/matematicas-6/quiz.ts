import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué tipo de transformación cambia el tamaño de una figura pero no su forma?",
      opciones: ["Rotación", "Traslación", "Dilatación o Escala", "Reflexión"],
      respuestaCorrecta: 2,
      explicacion: "La escala (homotecia) multiplica las coordenadas por un factor, agrandando o achicando la figura proporcionalmente."
    },
    {
      pregunta: "Si rotamos una figura 180 grados respecto al origen, el punto (x, y) se convierte en:",
      opciones: ["(y, x)", "(-x, -y)", "(-y, x)", "(x, -y)"],
      respuestaCorrecta: 1,
      explicacion: "Una rotación de 180° equivale a una simetría central, invirtiendo los signos de ambas coordenadas."
    },
    {
      pregunta: "Una traslación de vector (3, -2) significa:",
      opciones: ["Mover 3 arriba y 2 izquierda", "Mover 3 derecha y 2 abajo", "Rotar 3 grados", "Triplicar el tamaño"],
      respuestaCorrecta: 1,
      explicacion: "El primer componente afecta a X (derecha si es +) y el segundo a Y (abajo si es -)."
    },
    {
      pregunta: "Las transformaciones que mantienen las distancias y ángulos se llaman:",
      opciones: ["Isometrías", "Fractales", "Logarítmicas", "Afines"],
      respuestaCorrecta: 0,
      explicacion: "Las isometrías (traslación, rotación, reflexión) conservan la forma y tamaño exactos de la figura original."
    },
    {
      pregunta: "¿Qué sucede si aplicamos una escala de factor 0.5?",
      opciones: ["La figura se duplica", "La figura se reduce a la mitad", "La figura desaparece", "La figura se voltea"],
      respuestaCorrecta: 1,
      explicacion: "Un factor entre 0 y 1 produce una contracción o reducción de la figura."
    },
    {
      pregunta: "En una reflexión respecto al eje X, el punto (2, 5) pasa a ser:",
      opciones: ["(-2, 5)", "(2, -5)", "(5, 2)", "(-2, -5)"],
      respuestaCorrecta: 1,
      explicacion: "Al reflejar sobre X, la coordenada X se mantiene pero la Y cambia de signo."
    },
    {
      pregunta: "Para 'deshacer' una traslación de (5, 5), debemos aplicar una de:",
      opciones: ["(5, 5)", "(-5, -5)", "(0, 0)", "(1/5, 1/5)"],
      respuestaCorrecta: 1,
      explicacion: "La transformación inversa de una traslación es usar el vector opuesto."
    },
    {
      pregunta: "¿Qué sucede con el área de una figura si duplicamos su escala (factor 2)?",
      opciones: ["Se duplica", "Se mantiene igual", "Se cuadriplica", "Se triplica"],
      respuestaCorrecta: 2,
      explicacion: "Si los lados crecen por k, el área crece por k². En este caso 2² = 4."
    },
    {
      pregunta: "Una reflexión sobre el origen (0,0) equivale a una rotación de:",
      opciones: ["90°", "180°", "270°", "360°"],
      respuestaCorrecta: 1,
      explicacion: "Cambiar (x,y) por (-x,-y) es lo mismo que girar media vuelta."
    },
    {
      pregunta: "En una matriz de transformación, ¿qué representa la identidad [[1,0],[0,1]]?",
      opciones: ["Rotación de 90°", "Escala cero", "No aplicar ninguna transformación", "Reflexión"],
      respuestaCorrecta: 2,
      explicacion: "La matriz identidad mantiene las coordenadas originales sin cambios."
    },
    {
      pregunta: "¿Qué es una homotecia?",
      opciones: ["Un tipo de rotación", "Una transformación que escala desde un punto fijo", "Un desplazamiento lineal", "Un giro en el espacio"],
      respuestaCorrecta: 1,
      explicacion: "Es el nombre formal para las dilataciones o contracciones desde un centro."
    },
    {
      pregunta: "Si aplicamos una traslación (2, 3) y luego (-2, -3), el resultado es:",
      opciones: ["Moverse a (4,6)", "Volver al punto original", "Moverse a (2,3)", "Rotar 180°"],
      respuestaCorrecta: 1,
      explicacion: "Las traslaciones se suman vectorialmente. (2-2, 3-3) = (0,0)."
    },
    {
      pregunta: "¿Cómo se llama la transformación que 'voltea' la figura como un espejo?",
      opciones: ["Traslación", "Rotación", "Reflexión (Simetría)", "Escala"],
      respuestaCorrecta: 2,
      explicacion: "Invierte la orientación de la figura respecto a una recta o punto."
    },
    {
      pregunta: "Al rotar un punto (1, 0) 90° en sentido antihorario, obtenemos:",
      opciones: ["(0, 1)", "(-1, 0)", "(0, -1)", "(1, 1)"],
      respuestaCorrecta: 0,
      explicacion: "El punto se mueve del eje X positivo al eje Y positivo."
    }
  ];

export default quiz;
