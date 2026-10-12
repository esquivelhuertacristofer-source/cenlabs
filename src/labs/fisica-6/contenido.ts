import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Física de Fluidos: Empuje Estático", 
    mision: "Determina la densidad de un sólido desconocido pesándolo con un dinamómetro en el aire y sumergido (empuje de Arquímedes).", 
    ecuacion: "E = ρ_f · g · V_sub", 
    formulaGfx: "P_ap = P_real - E",
    pasos: [
      { id: 1, text: "Pesaje inicial: con el sólido fuera del fluido, registra su peso W en el dinamómetro.", icon: "scale" },
      { id: 2, text: "Inmersión: elige el fluido (agua, etanol o glicerina) y baja el sólido hasta que quede sumergido al 100 %.", icon: "droplets" },
      { id: 3, text: "Peso aparente: registra la nueva lectura W_ap; el empuje es E = W − W_ap.", icon: "activity" },
      { id: 4, text: "Densidad: de E = ρ_f·g·V obtén el volumen y calcula ρ = W/(g·V); escríbela y compruébala.", icon: "zap" }
    ],
    guiaMaestro: {
      objetivo: "Validar experimentalmente que el empuje es igual al peso del volumen de fluido desplazado por el cuerpo.",
      friccion: "Muchos alumnos asocian el empuje a la profundidad o al peso del objeto, ignorando que es el volumen desalojado el factor determinante.",
      puntosClave: ["Principio de Arquímedes: Fuerza vertical dirigida hacia arriba.", "Peso aparente: la lectura baja por el empuje; la masa del cuerpo no cambia.", "Flotabilidad: Análisis de fuerzas competitivas en medios líquidos."]
    },
    conceptos: [
      { titulo: "Fuerza de Empuje", desc: "Fuerza neta ascendente sobre un cuerpo sumergido." },
      { titulo: "Densidad", desc: "Propiedad intensiva de la materia." },
      { titulo: "Peso Aparente", desc: "Lectura del dinamómetro dentro del fluido." }
    ]
  };

export default contenido;
