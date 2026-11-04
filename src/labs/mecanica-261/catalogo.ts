import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Elementos de Máquina",
  titulo: "Unión atornillada: precarga y separación",
  duracion: "40 min",
  teoria: "OT-261 · Ajusta una junta axial para transmitir carga sin perder contacto ni sobrecargar el tornillo. Rigideces dadas: kb=200 MN/m, kj=800 MN/m; C=kb/(kb+kj)=0,2. Antes de separación: Fb=Fi+CP, Fc=Fi−(1−C)P. Psep=Fi/(1−C). Después: Fb=P, Fc=0 y abertura=(P−Psep)/kb. Extensión desde el estado precargado=(Fb−Fi)/kb. Área resistente didáctica 84,3 mm². Par orientativo T=K d Fi, K=0,20 y d=12 mm. Carga axial concéntrica, dos rigideces constantes y contacto unilateral; sin palanca de brida, plastificación, asentamiento, dispersión de rozamiento ni aflojamiento. Parámetros de ejemplo, no certificación de un tornillo ni clase normativa. Las deformaciones axiales se amplían ×80 respecto de la escala geométrica (25 unidades/m). Rosca y herramienta ilustrativas; la precarga se prescribe, no se deduce del giro de la llave. Demostración cuasiestática de 8 s entre 50 y 100 % de carga.",
  estado: "activo",
  simuladorHtml: "/labs/union-atornillada-precarga.html"
};
export default catalogo;
