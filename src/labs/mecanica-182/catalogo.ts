import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Motorreductor de tornillo sin fin: par útil, pérdidas y reversibilidad",
  duracion: "40 min",
  teoria: "OT-182 · Verifica un accionamiento de posicionamiento que necesita100 N·m de salida. Debes documentar rendimiento y reversibilidad sin confundirla con un freno de seguridad. Tacómetro, cálculo de par y balance de potencia virtuales. Tornillo de una entrada, corona40 dientes; γ=8°, φ=atanμ. Modelo de tornillo ideal: η=tanγ/tan(γ+φ). Tsalida=40ηTentrada y pérdidas=(1−η)Tentradaωentrada. Entrada60 rpm. Condición estática ideal de no reversibilidad γ≤φ. La geometría de paso usa radio del tornillo40 mm y radio de corona40r tanγ; se amplía tres veces. Modelo de rozamiento seco uniforme. Sin temperatura, viscosidad de lubricante, desgaste, contacto de dientes, rodadura real, rodamientos o vibración. No se usa el autobloqueo como freno de seguridad; no certifica sostener una carga real. El perfil de dientes y la rosca visible son esquemáticos, no una geometría de fabricación.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/verificacion-motorreductor-sinfin.html"
};
export default catalogo;
