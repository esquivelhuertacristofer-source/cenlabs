import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Clasificación por visión: sincronizar cámara, cinta y expulsor",
  duracion: "40 min",
  teoria: "La cámara identifica una pieza y el expulsor actúa después de un retardo. Si cambia la velocidad de cinta, el mismo retardo deja de servir. Movimiento uniforme x=vt. Error del disparo e=vτ−1,20 m. Producción 60v/0,40, con paso entre piezas de 400 mm. El circuito visual es continuo de 3,2 m y tiene ocho piezas con ese mismo paso. El expulsor actúa 0,12 s y sólo desvía la pieza si |e|≤45 mm. Se representa la identificación por color, no el procesamiento real de una imagen. Sin inferencia de visión, fallos de detección, deslizamiento de cinta, variación de velocidad, encoder discreto, latencia aleatoria o dinámica de impacto. La clasificación ya está dada; se estudia la sincronización temporal. El desvío es una trayectoria cinemática impuesta, sin calcular fuerza de impacto.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/vision-cinta-clasificacion.html"
};
export default catalogo;
