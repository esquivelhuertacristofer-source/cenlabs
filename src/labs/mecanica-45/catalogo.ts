import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Máquinas Eléctricas",
  titulo: "Circuito Equivalente por Ensayos de Vacío y Cortocircuito",
  duracion: "50 min",
  teoria:
    'El circuito equivalente de un transformador monofásico se obtiene de dos ensayos de rutina complementarios. El ensayo de vacío excita el devanado de baja tensión (X1-X2) con tensión reducida, dejando el de alta tensión (H1-H2) en circuito abierto: del triángulo de potencias S0=Voc·Ioc, Q0=√(S0²−Poc²) se obtiene la rama de magnetización Rc=Voc²/Poc (pérdidas en el núcleo) y Xm=Voc²/Q0 (reactancia de magnetización), referidas al lado de alta tensión multiplicando por a²=(N1/N2)². El ensayo de cortocircuito cortocircuita el devanado de baja tensión y excita el de alta hasta la corriente nominal: del triángulo de impedancias Zeq=Vsc/Isc, Req=Psc/Isc², Xeq=√(Zeq²−Req²) se obtiene la rama serie equivalente. Con Req y Xeq ya referidos, la regulación de voltaje a plena carga se estima con la fórmula aproximada %VR=%Req·cosθ+%Xeq·sinθ+(%Xeq·cosθ−%Req·sinθ)²/200 (FP en atraso), y la eficiencia se calcula directamente de las pérdidas medidas con η(x)=x·S·FP/(x·S·FP+Poc+x²·Psc), cuyo máximo ocurre cuando las pérdidas fijas igualan a las variables, x_máx=√(Poc/Psc) (IEC 60076-1, Cláusulas 11.4 y 11.5; ANSI/IEEE C57.12.90, Cláusula 8).',
  estado: "activo",
  simuladorHtml: "/labs/circuito-equivalente-transformador.html",
};

export default catalogo;
