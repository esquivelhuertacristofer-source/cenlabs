import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Dinámica de Poblaciones", mision: "Equilibra el ecosistema mediante el modelo Lotka-Volterra", ecuacion: "dx/dt = αx - βxy", formulaGfx: "Oscilación Armónica",
    pasos: [
      { id: 1, text: "Inicia la simulación para observar el desequilibrio inicial del ecosistema.", icon: "play" },
      { id: 2, text: "Ajusta la tasa de natalidad de las presas para evitar su colapso.", icon: "activity" },
      { id: 3, text: "Modula la eficacia de caza de los depredadores para prevenir la sobrepoblación.", icon: "zap" },
      { id: 4, text: "Estabiliza las oscilaciones y sobrevive 50 años virtuales sin extinciones.", icon: "target" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la interdependencia de las especies y el caos determinista en ecología.",
      friccion: "Exceso de Protección: Si el alumno elimina a los depredadores, las presas crecen hasta agotar los recursos, demostrando que la depredación es necesaria para el equilibrio.",
      puntosClave: ["Modelo Lotka-Volterra: Ecuaciones diferenciales de interacción.", "Resiliencia: Capacidad del ecosistema para volver al equilibrio.", "Diagrama de Fase: Representación de ciclos cerrados en el espacio de estados."]
    },
    conceptos: [
      { titulo: "Capacidad de Carga", desc: "Población máxima que un entorno puede sustentar indefinidamente." },
      { titulo: "Depredación", desc: "Interacción biológica donde un individuo caza a otro para subsistir." },
      { titulo: "Caos Determinista", desc: "Sistemas sensibles a condiciones iniciales que siguen leyes matemáticas precisas." }
    ]
  };

export default contenido;
