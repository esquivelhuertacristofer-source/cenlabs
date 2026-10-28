import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Corte por agua: presión, orificio y potencia",
  duracion: "40 min",
  teoria: "OT-246 · Obtén velocidad ≥700 m/s, agua ≤2 L/min, potencia hidráulica ≤12 kW y avance equivalente ≥0,3 mm/s. Cabezal de corte, placa sobre apoyos y balance de caudal y potencia. Agua incompresibleρ=1000 kg/m³; v=0,97√(2Δp/ρ), Q=0,65A√(2Δp/ρ), Ph=ΔpQ, Pj=½ρQv². Arranque sintético=0,08Pj/(200 J/mm³). Placa10 mm y ranura0,8 mm: avance=arranque/(10·0,8). Corte recto100 mm. Reacción=ρQv. El avance es un balance sintético de energía; no predice calidad o capacidad de corte de agua pura/abrasivo. Sin compresibilidad a alta presión, mezcla abrasiva, desgaste, taper o breakup. Avance visual×50; marcadores de chorro×1/100000 y diámetro visual ampliado. No es procedimiento de puesta en marcha de alta presión.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/corte-agua-presion-orificio.html"
};
export default catalogo;
