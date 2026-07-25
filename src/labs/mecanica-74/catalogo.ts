import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Dimensionamiento de Conductores y Protecciones",
  duracion: "30 min",
  teoria: "Elegir el calibre de un conductor de un circuito derivado no se reduce a que aguante la corriente. Un conductor debe cumplir dos criterios a la vez: su ampacidad —la corriente máxima que soporta sin sobrecalentarse— debe ser mayor o igual que la corriente de la carga, y la caída de tensión a lo largo de la corrida debe quedar por debajo del 3 % para que a la carga le llegue tensión suficiente. La caída se calcula con e=2·ρ·L·I/S, donde el factor 2 aparece porque la corriente recorre dos conductores (ida por la fase y regreso por el neutro), ρ es la resistividad del cobre (≈0.0175 Ω·mm²/m), L la longitud de un sentido, I la corriente y S la sección del conductor; el porcentaje es %e=e/V·100. El calibre correcto es el más delgado que cumple ambos criterios: ni se sobrecalienta, ni deja a la carga a media tensión, ni desperdicia cobre. En corridas largas la caída de tensión, no la ampacidad, es la que obliga a subir el calibre —una trampa clásica de diseño. Además, la protección (interruptor termomagnético) debe ser mayor o igual que la carga y menor o igual que el límite del conductor: por el Art. 240.4(D), los calibres 14/12/10 AWG tienen topes de protección de 15/20/30 A independientemente de su ampacidad de tabla, por lo que un circuito de 20 A exige calibre 12 y no 14.",
  estado: "activo",
  simuladorHtml: "/labs/dimensionamiento-conductor.html",
};

export default catalogo;
