import { readFileSync } from 'node:fs';
const RUTA = process.env.RUTA_FISICA || decodeURIComponent(new URL('../../public/labs/autonomia-ve-carga-de-ruta.html', import.meta.url).pathname).replace(/^\/(\w:)/,'$1');
export function cargaFisica(ruta=RUTA){
  const src = readFileSync(ruta, 'utf8');
  const i0 = src.indexOf('/* FISICA:INICIO */'), i1 = src.indexOf('/* FISICA:FIN */');
  if (i0 < 0 || i1 < 0) throw new Error('no encuentro el bloque FISICA');
  return new Function(src.slice(i0, i1) + '\nreturn {DOSPI,G,RAD,clamp,suave,AIRE,rhoAlt,VEH,KWH,RUTA,zRuta,zDe,rutaLlana,fuerzas,potenciaElec,aQuimica,simulaRuta,muestraRuta,acumulaRuta,consumoCte,autonomiaCte,vOptima,autonomiaDidactica,PLAN,SOC_MIN,SOC_PISO,evaluaPlan,barridoPlan,generaReto,AVERIAS,parAveria,tramoDeRuta};')();
}
