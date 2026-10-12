import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Motor Eléctrico", mision: "Ajusta un motor de corriente directa de imán permanente para que gire a la velocidad y en el sentido pedidos con una carga dada", ecuacion: "τ = N · I · A · B · sinφ", formulaGfx: "F = I · L x B",
    pasos: [
      { id: 1, text: "Orienta los imanes con polos opuestos enfrentados para que el campo atraviese la bobina.", icon: "zap" },
      { id: 2, text: "Elige el bobinado: k = N·B·A fija el par por amperio y la contraelectromotriz.", icon: "activity" },
      { id: 3, text: "Calcula el voltaje: V = k·ω + I·Rₐ, con I = τ_carga/k.", icon: "play" },
      { id: 4, text: "Energiza y mide con el tacómetro: a igual carga, más voltaje da más RPM.", icon: "activity" }
    ],
    guiaMaestro: {
      objetivo: "Entender cómo la fuerza de Laplace produce par y cómo la fuerza contraelectromotriz fija la velocidad de un motor de CD.",
      friccion: "El alumno debe notar que sin conmutador, la bobina no giraría continuamente.",
      puntosClave: ["Torque: Fuerza de giro.", "Campo Magnético: Imán estator.", "Corriente: Energía de entrada."]
    },
    conceptos: [
      { titulo: "Inducción Magnética (B)", desc: "Densidad de flujo magnético." },
      { titulo: "Conmutador", desc: "Dispositivo para invertir la corriente cada media vuelta." },
      { titulo: "Torque (τ)", desc: "Momento de una fuerza que tiende a producir rotación." }
    ]
  };

export default contenido;
