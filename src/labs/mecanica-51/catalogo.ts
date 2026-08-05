import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Máquinas Eléctricas",
  titulo: "Circuito Equivalente del Motor de Inducción por Ensayos",
  duracion: "45 min",
  teoria:
    'El circuito equivalente en T de un motor de inducción (R1, X1, Xm, R2\', X2\') no viene en la placa del motor: se deriva combinando tres ensayos normados por IEEE Std 112. El ensayo de CD, con el motor detenido, mide la resistencia entre terminales de línea del estátor y da R1=Rll/2 (conexión estrella). El ensayo de vacío, con el motor girando sin carga, aísla la rama de magnetización: la impedancia Znl=Vf/Inl se separa en Rnl_eff (pérdidas en el cobre del estátor más pérdidas rotacionales) y Xnl≈Xm+X1. El ensayo de rotor bloqueado, hecho a frecuencia reducida (≤25% de la nominal, IEEE 112 §5.9.1) para no distorsionar R2\' por efecto piel, aísla la impedancia serie: Zbl=Vf/Ibl da Rbl (con R2\'=Rbl−R1) y Xbl, que tras corregirse linealmente a la frecuencia nominal se reparte según NEMA Diseño B (X1=0.4·Xbl, X2\'=0.6·Xbl) y permite despejar Xm=Xnl−X1. Con el circuito completo, el equivalente de Thévenin en las terminales del rotor permite calcular la curva par-deslizamiento completa —incluyendo el par de arranque (s=1) y el par máximo (s=R2\'/√(Rth²+(Xth+X2\')²))— sin necesidad de ensayar jamás el motor a plena carga.',
  estado: "activo",
  simuladorHtml: "/labs/circuito-equivalente-motor-induccion.html",
};

export default catalogo;
