import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Dinámica de Poblaciones", mision: "Ajusta los parámetros de Lotka-Volterra para que presas y depredadores coexistan 50 años", ecuacion: "dx/dt = αx − βxy ;  dy/dt = δxy − γy", formulaGfx: "x* = γ/δ ;  y* = α/β",
    pasos: [
      { id: 1, text: "Corre 50 años con los parámetros iniciales y observa cómo colapsa el ecosistema.", icon: "play" },
      { id: 2, text: "Calcula el punto de equilibrio (γ/δ, α/β) y compáralo con la población inicial.", icon: "activity" },
      { id: 3, text: "Ajusta α, β, γ y δ para acercar el equilibrio al punto de arranque.", icon: "zap" },
      { id: 4, text: "Corre de nuevo desde el inicio: si nadie baja de 1 individuo en 50 años, valida.", icon: "target" }
    ],
    guiaMaestro: {
      objetivo: "Comprender la interdependencia presa-depredador y leer un sistema de ecuaciones diferenciales a través de su punto de equilibrio.",
      friccion: "Cuanto más lejos del equilibrio arranca el sistema, más amplias son las oscilaciones y más fácil que una población caiga por debajo de 1 individuo. Lotka-Volterra no es caótico: sus órbitas son ciclos cerrados (se integra con RK4 para no deformarlos).",
      puntosClave: ["Modelo Lotka-Volterra (1925-1926): ecuaciones diferenciales de interacción.", "Punto de equilibrio: x* = γ/δ, y* = α/β.", "Ciclos cerrados en el plano de fase; el pico de depredadores va retrasado respecto al de presas.", "El modelo clásico no tiene capacidad de carga (eso requiere un término logístico)."]
    },
    conceptos: [
      { titulo: "Punto de equilibrio", desc: "Poblaciones en las que ambas tasas de cambio son cero; el sistema gira a su alrededor." },
      { titulo: "Depredación", desc: "Interacción biológica donde un individuo caza a otro para subsistir." },
      { titulo: "Plano de fase", desc: "Gráfica presas vs. depredadores: en Lotka-Volterra cada condición inicial traza un ciclo cerrado." }
    ]
  };

export default contenido;
