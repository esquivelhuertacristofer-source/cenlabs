import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Mantenimiento de carril (LKA): el volante que se corrige solo",
  duracion: "40 min",
  teoria: `Un sistema de mantenimiento de carril gira el volante para devolver el coche al centro: una cámara mide el desvío y el rumbo respecto de las rayas y un controlador PD ordena el ángulo, con P según el desvío y D según la rapidez con que se acerca a la raya. El coche es un modelo lateral de bicicleta linealizado (L = 2,7 m, gradiente de subviraje K = 2,71·10⁻³ rad por m/s², velocidad característica 113,6 km/h) al que la curva empuja: en régimen necesita δ = (L + K·v²)·κ, es decir 0,65° en las ruedas (10° de volante) en una curva de 420 m a 100 km/h, con un empuje lateral de 1,8 m/s². Con la cámara retrasada 100 ms, P = 3 y D = 8 °/m dejan que el coche se abra hasta 1,30 m (la raya está a 0,85 m); con P = 10 y D = 3 zigzaguea 11 veces hasta 2,19 m; con P = 12 y D = 10 se corrige en 1,5 s y no pasa de 0,42 m. La velocidad cuenta: con P = 9 y D = 6 el desvío máximo es 0,40 m a 60 km/h y 0,84 m a 130 km/h, y el tiempo hasta la raya (TLC) baja de 3,3 s a 0,2 s; y con P = 14 y D = 5 el sistema es estable con 50 ms de retardo y zigzaguea con 180 ms. La ventana que cumple a la vez no pisar la raya, no zigzaguear, no hacer temblar el volante y no disparar el aviso (TLC menor de 1 s) es el 10,9 % de las combinaciones en la autopista: P de 7 a 29 y D de 6 a 20 °/m.`,
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/mantenimiento-carril-lka.html",
};

export default catalogo;
