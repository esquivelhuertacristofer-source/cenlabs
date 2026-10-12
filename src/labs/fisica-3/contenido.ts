import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Geofísica: Péndulo Simple", mision: "¡Iniciando protocolo de Gravimetría! Tu misión es determinar la aceleración de la gravedad local analizando el isocronismo de un péndulo simple. Deberás configurar con precisión la longitud del sistema, minimizar el error experimental mediante el cronometraje de oscilaciones múltiples y validar la relación teórica entre el periodo y la longitud. Tu éxito técnico dependerá de tu capacidad para mantener ángulos de oscilación pequeños (Movimiento Armónico Simple) y tu rigor en el procesamiento estadístico de los datos temporales. ¡Domina la mecánica planetaria y despeja la gravedad!", ecuacion: "T = 2π·√(L/g)", formulaGfx: "g = 4π²L / T²",
    pasos: [
      { id: 1, text: "Elige una longitud L (0.5 – 3 m) y una masa.", icon: "zap" },
      { id: 2, text: "Suelta el péndulo desde 10° (oscilaciones pequeñas).", icon: "activity" },
      { id: 3, text: "Mide el tiempo de 10 oscilaciones completas.", icon: "timer" },
      { id: 4, text: "Repite con otra masa y con tres longitudes; despeja g = 4π²L/T².", icon: "target" }
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
