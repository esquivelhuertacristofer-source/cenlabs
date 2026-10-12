import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Sistema Nervioso", mision: "Mide la latencia del reflejo rotuliano, calcula la velocidad de conducción y diagnostica la mielina del paciente", ecuacion: "v = d / (t_lat − t_sinapsis − t_placa)", formulaGfx: "v = d / Δt_conducción",
    pasos: [
      { id: 1, text: "Golpea el tendón con distintas fuerzas: encuentra una que NO dispare el reflejo y otra que sí.", icon: "hammer" },
      { id: 2, text: "Lee la latencia en el EMG y comprueba si cambia con la fuerza.", icon: "activity" },
      { id: 3, text: "Resta los retardos de sinapsis y placa y divide la distancia del arco entre ese tiempo.", icon: "zap" },
      { id: 4, text: "Compara tu velocidad con el límite normal (45 m/s) y emite el diagnóstico.", icon: "check-circle" }
    ],
    guiaMaestro: {
      objetivo: "Analizar el arco reflejo como respuesta involuntaria y el papel de la mielina en la velocidad nerviosa.",
      friccion: "Todo o nada: el umbral cambia en cada paciente; por debajo no hay reflejo y por encima la latencia NO depende de la fuerza. Error típico: dividir la distancia entre la latencia completa sin restar los retardos sinápticos.",
      puntosClave: ["Conducción saltatoria: la mielina eleva la velocidad (≈ 50-65 m/s en fibras Ia/Aα sanas).", "El reflejo rotuliano es MONOSINÁPTICO: aferente Ia → motoneurona α en la médula L3-L4 → cuádriceps.", "Latencia = conducción + retardo sináptico (≈ 0.7 ms) + retardo de placa (≈ 0.8 ms).", "Velocidad < 45 m/s sugiere neuropatía desmielinizante."]
    },
    conceptos: [
      { titulo: "Mielina", desc: "Capa aislante que permite que los impulsos se transmitan de manera rápida y eficiente." },
      { titulo: "Potencial de Acción", desc: "Onda de descarga eléctrica que viaja a lo largo de la membrana celular de la neurona." },
      { titulo: "Arco Reflejo", desc: "Ruta neuronal que controla un reflejo; la mayoría no pasan directamente al cerebro." }
    ]
  };

export default contenido;
