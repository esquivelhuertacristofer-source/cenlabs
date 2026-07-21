import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Instrumentación",
  titulo: "Inversión de Giro con Contactores y Enclavamiento",
  duracion: "40 min",
  teoria:
    'Un arrancador reversible controla un motor trifásico en dos sentidos de giro intercambiando dos de sus tres fases: el contactor KM1 (Adelante) conecta L1-U, L2-V, L3-W, mientras que KM2 (Reversa) invierte dos líneas para conectar L1-W, L2-V, L3-U. Energizar ambos contactores a la vez produciría un cortocircuito fase-fase, así que todo arrancador reversible requiere dos barreras independientes: un enclavamiento mecánico (una barra física que impide cerrar un contactor si el otro ya está cerrado) y un enclavamiento eléctrico (un contacto normalmente cerrado de cada contactor cableado en la bobina del contrario). El laboratorio arma primero ese arrancador pieza por pieza y solo después desbloquea un tablero de circuito —donde se puede desactivar el enclavamiento a propósito para ver la falla que previene—, un tablero térmico que aplica la fórmula de IEC 60947-4-1 para el tiempo máximo de disparo de un relevador térmico de clase 10/20/30, y un modo de reto de selección de clase.',
  estado: "activo",
  simuladorHtml: "/labs/inversion-giro-contactores.html",
};

export default catalogo;
