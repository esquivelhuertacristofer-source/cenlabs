import { readFileSync } from 'node:fs';
const RUTA = process.env.RUTA_FISICA || decodeURIComponent(new URL('../../public/labs/dinamica-lateral-esc.html', import.meta.url).pathname).replace(/^\/(\w:)/,'$1');
export function cargaFisica(ruta=RUTA){
  const src = readFileSync(ruta, 'utf8');
  const i0 = src.indexOf('/* FISICA:INICIO */'), i1 = src.indexOf('/* FISICA:FIN */');
  if (i0 < 0 || i1 < 0) throw new Error('no encuentro el bloque FISICA');
  return new Function(src.slice(i0, i1) + '\nreturn {DOSPI,G,RAD,clamp,angNorm,VEH,SUPERFICIES,coefs,pacejka,fyEje,vCritica,gananciaGuinada,guinadaDeseada,guinadaLineal,fuerzas,deriv,rk4,energiaCinetica,PISTA,pistaLargo,pistaPunto,pistaProyecta,ESC_P,nuevaCorrida,pasoCorrida,muestra,simula,velocidadLimite};')();
}
