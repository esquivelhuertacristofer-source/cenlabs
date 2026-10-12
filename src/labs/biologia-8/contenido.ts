import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Electrocardiograma", mision: "Lee el ECG de un paciente, diagnostica su ritmo y llévalo a ritmo sinusal normal con el fármaco adecuado", ecuacion: "FC = 60 / RR(s) = 300 / n.º de cuadros grandes", formulaGfx: "FC = 60 / RR",
    pasos: [
      { id: 1, text: "Mide el intervalo R-R en el monitor (cuadro grande = 200 ms) y calcula la FC.", icon: "target" },
      { id: 2, text: "Diagnostica el ritmo de llegada: bradicardia (< 60) o taquicardia (> 100).", icon: "activity" },
      { id: 3, text: "Elige el fármaco según su mecanismo sobre el nodo SA y adminístralo por bolos.", icon: "heart" },
      { id: 4, text: "Vuelve a medir la FC, regístrala y valida cuando esté entre 60 y 100 lpm.", icon: "check-circle" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la relación entre la actividad eléctrica del corazón y su función mecánica.",
      friccion: "Eléctrico ≠ mecánico: el QRS es la despolarización ventricular y la contracción viene después. En la taquicardia lo que se acorta es sobre todo la diástole. Cada paciente llega con una FC distinta: hay que MEDIRLA, no se muestra.",
      puntosClave: ["Ciclo cardíaco: sístole y diástole.", "ECG: onda P, segmento PR (retraso en el nodo AV), QRS, segmento ST, onda T.", "Control autonómico: el vago frena el nodo SA (la atropina lo bloquea); β1 lo acelera (adrenalina) y el metoprolol bloquea β1.", "QT se acorta con la FC (corrección de Bazett)."]
    },
    conceptos: [
      { titulo: "Frecuencia Cardíaca", desc: "Número de veces que el corazón se contrae por unidad de tiempo; se mide en BPM." },
      { titulo: "Onda PQRST", desc: "Conjunto de deflexiones que representan la despolarización y repolarización cardíaca." },
      { titulo: "Débito Cardíaco", desc: "Volumen de sangre expulsado por el corazón en un minuto." }
    ]
  };

export default contenido;
