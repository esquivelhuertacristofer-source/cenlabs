import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Máquinas Eléctricas",
  titulo: "Calidad eléctrica: armónicos y filtrado",
  duracion: "40 min",
  teoria: "OT-206 · Consigue THD ≤15 %, factor de potencia ≥0,93, corriente del filtro ≤4 A y caída fundamental ≤15 V. Analizador trifásico, pinzas, reactor y filtro activo virtuales. Red sinusoidal 230 V fase-neutro,60 Hz; I1=20 A eficaces y cosφ=0,95. Órdenes 5,7,11:8,6,3 A antes de atenuación. Modelo de filtro |Hn|=2/√(2²+(nωL)²), compensación activa fraccionaria f. THD=√ΣIh²/I1; FP=cosφ/√(1+THD²). Caída fundamental=ωLI1. Carga de corriente sintética y filtrado ideal independiente por armónico; fundamental y cosφ impuestos. No resuelve un convertidor conmutado, resonancias de red, estabilidad o cumplimiento normativo. No es una selección de hardware real. Las flechas son indicadores del sentido de corriente en estroboscopio, no movimiento visible real de cargas.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/analizador-calidad-energia.html"
};
export default catalogo;
