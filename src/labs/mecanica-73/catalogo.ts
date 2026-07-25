import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Desbalance Trifásico y Corriente por el Neutro",
  duracion: "30 min",
  teoria: "En un sistema trifásico de cuatro hilos (estrella con neutro), tres cargas independientes —una por fase— rara vez drenan la misma corriente. Cuando están desbalanceadas, sus corrientes de fase ya no se cancelan y el conductor de neutro transporta la diferencia de retorno. Esa corriente de neutro es la suma FASORIAL de las tres corrientes de fase (IN=IA+IB+IC), no su suma aritmética: como los fasores están a 120° entre sí, se cancelan en parte, y el neutro real es mucho menor que la suma de magnitudes. Solo si la carga está perfectamente balanceada (Ia=Ib=Ic) el neutro no lleva corriente (IN=0). El análisis se generaliza con las componentes simétricas de Fortescue: toda terna desbalanceada se descompone en secuencia positiva (I1, la parte balanceada útil), negativa (I2, que mide el desbalance y calienta motores) y cero (I0), con la relación central IN=3·I0. La corriente de neutro es exactamente tres veces la componente de secuencia cero, y el factor de desbalance se mide como |I2|/|I1|. En instalaciones reales, además del desbalance de cargas, los armónicos de orden triple de las cargas no lineales también se suman en el neutro y pueden sobrecargarlo.",
  estado: "activo",
  simuladorHtml: "/labs/desbalance-trifasico.html",
};

export default catalogo;
