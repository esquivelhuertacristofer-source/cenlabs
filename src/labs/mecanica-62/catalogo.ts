import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Equivalentes de Thévenin y Norton: Caracterización Experimental de Caja Negra",
  duracion: "35 min",
  teoria: "Una red resistiva de dos terminales (fuente + 3 resistores) se resuelve en vivo por el mismo motor de análisis nodal modificado (MNA) de Kirchhoff y los divisores, extendido con un nuevo elemento de amperímetro ideal (fuente de 0 V) que permite leer la corriente de cortocircuito directamente del solver. El alumno mide el voltaje de circuito abierto (Voc = Vth) y la corriente de cortocircuito (Isc) con dos botones de instrumento virtual, calcula Rth = Voc/Isc y lo contrasta contra el método teórico de desactivar la fuente y combinar resistencias. Verifica que el equivalente de Thévenin predice exactamente el voltaje y la corriente de la red completa sobre cualquier carga externa, convierte el resultado a su equivalente Norton, y en el reto caracteriza una caja negra real usando solo las mediciones de Voc e Isc — sin ver los componentes internos.",
  estado: "activo",
  simuladorHtml: "/labs/equivalente-thevenin-norton.html",
};

export default catalogo;
