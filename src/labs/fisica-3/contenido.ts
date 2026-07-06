import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Geofísica: Péndulo Simple", mision: "¡Iniciando protocolo de Gravimetría! Tu misión es determinar la aceleración de la gravedad local analizando el isocronismo de un péndulo simple. Deberás configurar con precisión la longitud del sistema, minimizar el error experimental mediante el cronometraje de oscilaciones múltiples y validar la relación teórica entre el periodo y la longitud. Tu éxito técnico dependerá de tu capacidad para mantener ángulos de oscilación pequeños (Movimiento Armónico Simple) y tu rigor en el procesamiento estadístico de los datos temporales. ¡Domina la mecánica planetaria y despeja la gravedad!", ecuacion: "T = 2π·√(L/g)", formulaGfx: "g = 4π²L / T²",
    pasos: [
      { id: 1, text: "Ajusta la longitud de la cuerda a 1.0 metro.", icon: "zap" },
      { id: 2, text: "Desplaza la masa 10° (Pequeñas oscilaciones).", icon: "activity" },
      { id: 3, text: "Mide el tiempo de 10 oscilaciones completas.", icon: "timer" },
      { id: 4, text: "Calcula el periodo y despeja la gravedad.", icon: "target" }
    ],
    guiaMaestro: {
      objetivo: "Analizar el movimiento armónico simple y su dependencia de la longitud.",
      friccion: "El error común es creer que el periodo depende de la masa.",
      puntosClave: ["Isocronismo: T constante para ángulos pequeños.", "Efecto de L: A mayor L, mayor T.", "Energía: Intercambio entre Cinética y Potencial."]
    },
    conceptos: [
      { titulo: "Periodo (T)", desc: "Tiempo requerido para una oscilación completa." },
      { titulo: "Frecuencia (f)", desc: "Número de oscilaciones por unidad de tiempo." },
      { titulo: "Longitud (L)", desc: "Distancia del pivote al centro de masa." }
    ]
  };

export default contenido;
