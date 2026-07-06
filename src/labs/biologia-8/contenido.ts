import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Electrocardiograma", mision: "Monitorea la actividad eléctrica del corazón y realiza una prueba de esfuerzo", ecuacion: "T = 60 / BPM", formulaGfx: "P-QRS-T Sync",
    pasos: [
      { id: 1, text: "Identifica el objetivo de BPM para la prueba de esfuerzo del paciente.", icon: "target" },
      { id: 2, text: "Ajusta el nivel de actividad o estrés para modular el ritmo cardíaco.", icon: "activity" },
      { id: 3, text: "Observa la sincronía entre el impulso eléctrico y la contracción mecánica.", icon: "heart" },
      { id: 4, text: "Registra la prueba cuando el ritmo coincida exactamente con el objetivo.", icon: "check-circle" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la relación entre la actividad eléctrica del corazón y su función mecánica.",
      friccion: "Taquicardia Extrema: A 180 BPM, el alumno debe notar que la diástole se acorta, comprometiendo el llenado ventricular, lo que explica la fatiga.",
      puntosClave: ["Ciclo Cardíaco: Sístole (contracción) y Diástole (relajación).", "ECG: Representación gráfica de los potenciales eléctricos del corazón.", "Sistema de Conducción: Nodos SA y AV, y fibras de Purkinje."]
    },
    conceptos: [
      { titulo: "Frecuencia Cardíaca", desc: "Número de veces que el corazón se contrae por unidad de tiempo; se mide en BPM." },
      { titulo: "Onda PQRST", desc: "Conjunto de deflexiones que representan la despolarización y repolarización cardíaca." },
      { titulo: "Débito Cardíaco", desc: "Volumen de sangre expulsado por el corazón en un minuto." }
    ]
  };

export default contenido;
