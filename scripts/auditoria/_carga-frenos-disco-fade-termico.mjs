import { readFileSync } from 'node:fs';
const RUTA = process.env.RUTA_FISICA || decodeURIComponent(new URL('../../public/labs/frenos-disco-fade-termico.html', import.meta.url).pathname).replace(/^\/(\w:)/,'$1');
export function cargaFisica(ruta=RUTA){
  const src = readFileSync(ruta, 'utf8');
  const i0 = src.indexOf('/* FISICA:INICIO */'), i1 = src.indexOf('/* FISICA:FIN */');
  if (i0 < 0 || i1 < 0) throw new Error('no encuentro el bloque FISICA');
  return new Function(src.slice(i0, i1) + '\nreturn {DOSPI,G,RAD,SIGMA,clamp,suave,VEH,DISCO,EFUS,GAMMA,disco,hConv,PAD,fMu,muRel,muPad,fade,cargasEje,fracIdeal,puntoIdeal,betaIdeal,zBloqueo,zCruce,equilibrio,calentamientoExacto,serie,muestrea,B_MIN,B_MAX,D_MIN,D_MAX,evaluaReto,ventanaReto,generaReto,generaDx};')();
}
