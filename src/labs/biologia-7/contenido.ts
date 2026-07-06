import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Sistema Nervioso", mision: "Rastrea el arco reflejo rotuliano y evalúa la conducción nerviosa", ecuacion: "v = Δx / Δt", formulaGfx: "Integridad Mielina (%)",
    pasos: [
      { id: 1, text: "Ajusta la integridad de la vaina de mielina al 100% para un estado sano.", icon: "zap" },
      { id: 2, text: "Configura la fuerza del martillo y aplica el estímulo en el tendón.", icon: "hammer" },
      { id: 3, text: "Observa la propagación del potencial de acción hacia la médula.", icon: "activity" },
      { id: 4, text: "Valida si el reflejo ocurre dentro del rango normal (< 30ms).", icon: "check-circle" }
    ],
    guiaMaestro: {
      objetivo: "Analizar el arco reflejo como respuesta involuntaria y el papel de la mielina en la velocidad nerviosa.",
      friccion: "Ley del Todo o Nada: Si el golpe es < 20%, no hay respuesta. Desmielinización: A < 50% de mielina, el retraso visual debe ser evidente para el alumno.",
      puntosClave: ["Transmisión Saltatoria: Función de la vaina de mielina.", "Arco Reflejo: Vía sensorial, interneurona (médula) y vía motora.", "Sinapsis: Comunicación química/eléctrica en el asta gris."]
    },
    conceptos: [
      { titulo: "Mielina", desc: "Capa aislante que permite que los impulsos se transmitan de manera rápida y eficiente." },
      { titulo: "Potencial de Acción", desc: "Onda de descarga eléctrica que viaja a lo largo de la membrana celular de la neurona." },
      { titulo: "Arco Reflejo", desc: "Ruta neuronal que controla un reflejo; la mayoría no pasan directamente al cerebro." }
    ]
  };

export default contenido;
