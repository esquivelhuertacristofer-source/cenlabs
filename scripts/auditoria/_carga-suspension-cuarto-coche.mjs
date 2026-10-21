import { readFileSync } from 'node:fs';
const RUTA = process.env.RUTA_FISICA || decodeURIComponent(new URL('../../public/labs/suspension-cuarto-coche.html', import.meta.url).pathname).replace(/^\/(\w:)/,'$1');
export function cargaFisica(ruta=RUTA){
  const src = readFileSync(ruta, 'utf8');
  const i0 = src.indexOf('/* FISICA:INICIO */'), i1 = src.indexOf('/* FISICA:FIN */');
  if (i0 < 0 || i1 < 0) throw new Error('no encuentro el bloque FISICA');
  return new Function(src.slice(i0, i1) + '\nreturn {DOSPI,G,clamp,NOMINAL,CSA,CAMINOS,N0,cMul,cDiv,cAbs,transf,WK_SEC,pesoWk,filtroWk,sw,metricas,frontera,polos,modos,autovalores,semilla,compsCamino,zCamino,zBache,generaCamino,metricasLineas,cEfectiva,derivCuarto,rk4Cuarto,accCuerpo,cargaDin,simulaMetricas,bandaConfort,ventanaC,MALLA_RAPIDA};')();
}
