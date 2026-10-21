import { readFileSync } from 'node:fs';
const RUTA = process.env.RUTA_FISICA || decodeURIComponent(new URL('../../public/labs/convertidor-par-transmision-automatica.html', import.meta.url).pathname).replace(/^\/(\w:)/,'$1');
export function cargaFisica(ruta=RUTA){
  const src = readFileSync(ruta, 'utf8');
  const i0 = src.indexOf('/* FISICA:INICIO */'), i1 = src.indexOf('/* FISICA:FIN */');
  if (i0 < 0 || i1 < 0) throw new Error('no encuentro el bloque FISICA');
  return new Function(src.slice(i0, i1) + '\nreturn {DOSPI,G,RAD,clamp,suave,rpm,rad,VEH,PLAN,MOT,MARCHAS,relMarcha,GT,Tneto,Tfric,corteRev,pedalRalenti,Te,CONV0,FALLAS,TRde,eficiencia,Tabsorbido,Kcap,kappaDeCalado,caladoReal,willisC,tren,fasesPlanetario,wEstator,banco,V_OBJ,VLOCK_MIN,VLOCK_NO,NS_MIN,NS_MAX,LU,ACEITE,simula,muestraEn,evaluaReto,rejilla,generaReto,escenario,BANCO_RETOS,NS_LISTA,VL_LISTA,generaDx};')();
}
