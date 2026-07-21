import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Instrumentación",
  titulo: "Frenado Dinámico, Regenerativo y a Contracorriente",
  duracion: "35 min",
  teoria:
    'Detener eléctricamente un motor exige decidir a dónde va la energía cinética Ek=½Jω² almacenada en el rotor y la carga. El frenado dinámico la disipa por completo como calor, repartida entre un banco de resistencias externo y la resistencia interna del motor, con una constante de tiempo exponencial exacta τ=J(Rext+Ra)/kφ² y un tiempo de frenado al 95% (t95=τ·ln20). El frenado regenerativo devuelve una fracción de esa energía a la red o a un banco de baterías a través de un inversor, con una eficiencia de conversión η siempre menor al 100%. El frenado a contracorriente (plugging) invierte dos fases con el motor aún girando —el campo magnético gira en sentido contrario al rotor—, lo que produce el paro más rápido de los tres a cambio de disipar bastante más energía que la cinética original (idealmente 3× en el caso sin carga) y una corriente pico varias veces mayor que la nominal. Esta práctica no tiene norma ancla asignada en la lista maestra, así que las constantes del motor (J, Ra, kφ) son valores ilustrativos elegidos para un orden de magnitud pedagógico razonable, contrastados con literatura general de máquinas eléctricas y con el rango de corriente pico que reporta NEMA MG-1 para arranque/frenado a contracorriente. El laboratorio permite explorar cada método por separado, compararlos lado a lado para la misma velocidad inicial, y resolver un modo Reto con un escenario curado por método.',
  estado: "activo",
  simuladorHtml: "/labs/frenado-dinamico-regenerativo-contracorriente.html",
};

export default catalogo;
