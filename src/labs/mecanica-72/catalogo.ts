import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Sistemas Trifásicos Y/Δ Balanceados y Secuencia de Fases",
  duracion: "30 min",
  teoria: "Casi toda la energía eléctrica se distribuye en tres fases desfasadas 120°. Una carga balanceada de tres impedancias iguales Z=|Z|∠φ puede conectarse en estrella (Y) o en delta (Δ). En estrella cada impedancia recibe la tensión de fase VF=VL/√3 y la corriente de línea es la de fase (IL=IF); en delta cada impedancia recibe la tensión de línea completa (VF=VL) y la corriente de línea es √3 veces la de fase (IL=√3·IF). Como la potencia por rama va con el cuadrado de la tensión, a igual impedancia y tensión de línea la conexión delta entrega exactamente el TRIPLE de potencia que la estrella. La potencia trifásica total es P=√3·VL·IL·cosφ, con Q=√3·VL·IL·senφ, S=√3·VL·IL y FP=cosφ; en balanceado la corriente de neutro es nula. La secuencia de fases (ABC positiva vs ACB negativa) no cambia las magnitudes en balanceado, pero invierte el sentido de giro de un motor de inducción: permutar dos líneas basta para invertirlo.",
  estado: "activo",
  simuladorHtml: "/labs/sistemas-trifasicos.html",
};

export default catalogo;
