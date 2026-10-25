import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Ajuste de un sensor láser de triangulación",
  duracion: "40 min",
  teoria: "OT-196 · Mantén el punto dentro de±512 px y la incertidumbre≤0,8 mm con base≤90 mm. Emisor láser, receptor óptico y blanco móvil. Proyección paraxial con receptor descentrado: u=fpx(b/z−tanφ), fpx=800. σu=0,2 px; propagación σz=z²σu/(fpx b). Se comprueban los extremosz=0,2 y0,5 m. Cámara de proyección ideal con término de descentrado; φ es un ajuste equivalente del centro de imagen, no una rotación completa de cámara. Sin speckle, saturación, reflectancia, calibración radial ni oclusión. Haz visible esquemático.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/sensor-laser-triangulacion.html"
};
export default catalogo;
