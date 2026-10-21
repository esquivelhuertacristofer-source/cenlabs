import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Transmisión CVT de banda: relación continua, presión y deslizamiento",
  duracion: "40 min",
  teoria: `Una transmisión CVT de banda cambia de marcha sin escalones: dos poleas de garganta cónica (semiángulo de 11°) unidas por una banda metálica de empuje de 608 mm. Al acercar o separar las mitades de cada polea, la banda rueda a otro radio y la relación i = Rs/Rp recorre de 0,40 (primaria de 59,3 mm y secundaria de 23,7 mm) a 2,60 (23,0 mm y 59,8 mm) con la longitud de banda constante. La banda no tiene dientes: transmite por fricción, y la fuerza de apriete que evita el deslizamiento es F_ax = F_t·cosβ/(2μ). A 80 km/h en llano la rueda pide 366 N (8,1 kW), el par en la secundaria es de 33,4 N·m y con μ = 0,09 hacen falta 6,4 kN, es decir 2,0 MPa en un cilindro de 32 cm²; con la presión justa (uso del 80 %) son 2,5 MPa y el patinaje es de 0,8 %. Con 1,5 MPa el uso llega al 133 % y la banda patina. Apretar de más tampoco sale gratis: con 7 MPa la bomba gasta 3,0 kW frente a 0,52 kW. El motor (1,6 L, mínimo de 237 g/kWh hacia 2 660 rpm y alta carga) manda la relación: el consumo mínimo a 80 km/h es de 3,82 L/100 km con i = 0,51 (1 240 rpm y 72 N·m); con i = 1,2 el motor gira a 2 881 rpm y gasta 5,41 L/100 km (+42 %), y con i = 0,42 se ahoga. En la subida del 6 % a 60 km/h la ventana que cumple a la vez no patinar, no ahogar el motor y quedar a menos de 5 % del mínimo es i de 1,12 a 1,43 y presión de 4,2 a 6,6 MPa.`,
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/transmision-cvt-banda.html",
};

export default catalogo;
