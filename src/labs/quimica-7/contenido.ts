import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Titulación Ácido-Base", mision: "¡Bienvenido al Laboratorio de Química Analítica! Tu misión es realizar una valoración ácido-base de alta precisión para determinar la concentración desconocida de Ácido Clorhídrico (HCl). Deberás controlar la bureta con maestría técnica, añadiendo Hidróxido de Sodio (NaOH) gota a gota hasta alcanzar el punto de equivalencia estequiométrico. La Fenolftaleína será tu sensor visual: el primer viraje a rosa pálido persistente marcará el éxito de tu análisis. Un exceso de una sola gota invalidará la muestra. ¡Demuestra tu destreza en el manejo volumétrico!", 
    ecuacion: "Ca · Va = Cb · Vb", formulaGfx: "NaOH 0.1 M (Base)",
    pasos: [
      { id: 1, text: "Purga la bureta para eliminar burbujas de aire.", icon: "zap" },
      { id: 2, text: "Añade 3 gotas de Fenolftaleína al matraz.", icon: "droplets" },
      { id: 3, text: "Titula con NaOH usando goteo lento (Gota a Gota).", icon: "beaker" },
      { id: 4, text: "Detente al observar el primer viraje a rosa pálido.", icon: "check" }
    ],
    guiaMaestro: {
      objetivo: "Determinar el punto de equivalencia mediante calorimetría visual.",
      friccion: "El 'salto de pH' es la parte más difícil; si el alumno se distrae, la muestra se vuelve fucsia y debe reiniciar.",
      puntosClave: ["Punto de Equivalencia: Moles H+ = Moles OH-.", "Indicador: Rango de viraje pH 8.2 - 10.", "Menisco: Lectura en la parte cóncava."]
    },
    conceptos: [
      { titulo: "Valoración", desc: "Técnica para determinar concentraciones desconocidas." },
      { titulo: "Punto Final", desc: "Momento visual donde el indicador cambia de color." },
      { titulo: "Alícuota", desc: "Volumen fijo de muestra (20mL en este caso)." }
    ]
  };

export default contenido;
