import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Ingeniería: Ley de Ohm", 
    mision: "Certifica la relación V=I·R analizando la respuesta de conductancia en un circuito de precisión bajo diferentes cargas de potencial.", 
    ecuacion: "V = I · R", 
    formulaGfx: "P = V · I",
    pasos: [
      { id: 1, text: "Configuración de Carga: Instala una resistencia patrón de 100Ω en el banco de pruebas.", icon: "zap" },
      { id: 2, text: "Barrido de Potencial: Aumenta el voltaje de la fuente para analizar la respuesta lineal.", icon: "activity" },
      { id: 3, text: "Telemetría de Corriente: Mide la intensidad (I) con el amperímetro digital en configuración serie.", icon: "timer" },
      { id: 4, text: "Certificación Óhmica: Valida que la pendiente V/I coincida con la resistencia nominal.", icon: "play" }
    ],
    guiaMaestro: {
      objetivo: "Analizar el comportamiento lineal de los materiales conductores y la disipación de energía por efecto Joule.",
      friccion: "El cortocircuito virtual es el error común; el alumno debe entender que el amperímetro no tiene resistencia interna.",
      puntosClave: ["Conductancia: Facilidad de flujo de electrones.", "Linealidad: Comportamiento de materiales óhmicos.", "Potencia: Relación entre trabajo eléctrico y calor."]
    },
    conceptos: [
      { titulo: "Resistencia (Ω)", desc: "Oposición al flujo de corriente." },
      { titulo: "Corriente (A)", desc: "Flujo de carga eléctrica por segundo." },
      { titulo: "Voltaje (V)", desc: "Diferencia de potencial o fuerza electromotriz." }
    ]
  };

export default contenido;
