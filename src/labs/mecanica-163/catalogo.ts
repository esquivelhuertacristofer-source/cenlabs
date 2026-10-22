import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Supercapacitores: potencia al acelerar y energía al frenar",
  duracion: "40 min",
  teoria: "Dimensiona un banco de supercapacitores para entregar energía al acelerar y dejar espacio para recuperarla al frenar. Se calculan capacitancia y resistencia equivalentes, E = ½ C V², evolución de tensión y calor I² R con conservación exacta de energía. El reto combina corriente, energía, tensión final y número de celdas; el diagnóstico distingue resistencia elevada, rama desconectada y banco demasiado lleno. Ciclo sintético de corriente constante, sin convertidor ni modelo térmico.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/supercapacitores-potencia-frenado.html",
};

export default catalogo;
