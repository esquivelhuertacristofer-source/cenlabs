import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Ensayo de un embrague centrífugo: ralentí, acoplamiento y calor",
  duracion: "40 min",
  teoria: "OT-184 · Revisa un accionamiento de máquina ligera que arrastra al ralentí. Debes ajustar la retención y comprobar el arranque contra la carga de prueba. Tacómetros, traza de deslizamiento y balance térmico virtuales. Tres zapatas: N=max(0,mrω²−Fs), m=0,12 kg y r=45 mm. Tcap=3μRN, μ=0,32, R=60 mm. Entrada a giro constante; carga8 N·m e inercia de tambor0,08 kg·m². Si Tcap>8: α=(Tcap−8)/J y ts=Jω/(Tcap−8). El deslizamiento termina al igualar velocidades. Calor=∫Tcap(ωentrada−ωtambor)dt. Ralentí de referencia1200 rpm. Se comprueba balance de trabajo, energía cinética, carga y calor. Fricción y normal constantes durante cada arranque, sin recorrido real de zapata, elasticidad, variación de μ con temperatura, desgaste ni refrigeración. El paso de fuerza a contacto es idealizado. Cada4 s se reinicia un arranque independiente; no es frenado físico de la carga. El régimen está impuesto y no incluye dinámica del motor.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/ensayo-embrague-centrifugo.html"
};
export default catalogo;
