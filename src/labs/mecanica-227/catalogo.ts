import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Interferómetro láser: ambiente y error de coseno",
  duracion: "40 min",
  teoria: "OT-227 · Obtén error ≤0,3 µm en patrones 50/100/150 mm, desalineación ≤0,1° y compensación ambiental dentro de 1 °C de la referencia. Banco óptico, reflector móvil y referencias de longitud. λvac=632,8 nm. Índice simplificado n(T)=1+0,00027·293,15/(273,15+T). N=2nrealLcosα/λvac; Lestimada=Nλvac/(2nestimado). Se evalúan tres longitudes conocidas. Movimiento L=75+50sin(2πt/8) mm. El termómetro patrón pertenece al banco y su valor se revela tras validar. El informe guarda fase fraccionaria y lectura de las tres referencias. Índice sintético dependiente sólo de temperatura; no ecuación Edlén completa ni compensación de presión/humedad. Conteo ideal de fase fraccionaria, sin ruido ni pérdidas de franjas. El detector visual muestrea una intensidad y no resuelve todas las oscilaciones ópticas. No certifica metrología real.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/interferometro-laser-compensacion.html"
};
export default catalogo;
