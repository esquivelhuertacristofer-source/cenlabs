import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Motor Eléctrico", mision: "Convierte energía eléctrica en torque mecánico", ecuacion: "τ = N · I · A · B · sinφ", formulaGfx: "F = I · L x B",
    pasos: [
      { id: 1, text: "Coloca la bobina de cobre entre los imanes permanentes.", icon: "zap" },
      { id: 2, text: "Asegura el contacto de las escobillas con el conmutador.", icon: "activity" },
      { id: 3, text: "Alimenta el sistema con una batería de 9V.", icon: "play" },
      { id: 4, text: "Aumenta el flujo magnético para subir las RPM.", icon: "activity" }
    ],
    guiaMaestro: {
      objetivo: "Entender la fuerza de Lorentz y el principio de inducción electromagnética.",
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
