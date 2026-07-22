import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Fasores de Señales Senoidales: Representación y Medición de Desfase",
  duracion: "30 min",
  teoria: "Una señal senoidal de corriente alterna v(t)=Vm·sen(ωt+φ) se representa como un fasor: un vector de magnitud Vm y ángulo φ que 'congela' la rotación implícita a la frecuencia angular ω. Comparar dos señales de la misma frecuencia se reduce entonces a comparar sus fasores en un diagrama polar, y la diferencia angular entre ellas —el desfase— se mide con un osciloscopio de dos canales ubicando el instante en que cada señal cruza cero en el mismo sentido, nunca comparando picos. Este laboratorio practica esa técnica de medición con un osciloscopio de dos trazos y un diagrama fasorial sincronizados en tiempo real.",
  estado: "activo",
  simuladorHtml: "/labs/fasores-desfase.html",
};

export default catalogo;
