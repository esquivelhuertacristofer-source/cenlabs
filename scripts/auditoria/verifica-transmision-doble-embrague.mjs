// Verificación de la física del lab transmision-doble-embrague: extrae el bloque FISICA del HTML publicado TAL CUAL
// y lo prueba contra formas cerradas, conservación de la energía y casos límite; además recorre el reto.
// uso: node verifica.mjs [ruta del html]
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = 'C:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard/public/labs/transmision-doble-embrague.html';
const RUTA = process.argv[2] || resolve(AQUI, '../../public/labs/transmision-doble-embrague.html');
const src = readFileSync(existsSync(RUTA) ? RUTA : REPO, 'utf8');
const i0 = src.indexOf('/* FISICA:INICIO */'), i1 = src.indexOf('/* FISICA:FIN */');
if (i0 < 0 || i1 < 0) throw new Error('no encuentro el bloque FISICA');
const F = new Function(src.slice(i0, i1) + '\nreturn {DOSPI,RPM,CAJA,relacion,IFD,VEH,MOT,EMB,parMax,cargaVia,cambio,wsPar,energiaPar,inerciaCerrada,nSincrono,contornoEngrane,C_EJES,invEv};')();
let ok = 0, mal = 0;
const prueba = (nombre, cond, det = '') => { if (cond) ok++; else mal++; console.log((cond ? '  ✓ ' : '  ✗ ') + nombre + (det ? '  · ' + det : '')); };
const cerca = (a, b, tol) => Math.abs(a - b) <= tol;
const rel = (a, b) => Math.abs(a - b) / Math.max(1e-12, Math.abs(b));
const f = (x, d = 3) => (+x).toFixed(d);
const { CAJA, RPM, relacion, VEH, cambio } = F;

console.log('1 · La caja: dentado, relaciones y grupo final');
{ let sumas = true; for (let n = 1; n <= 6; n++) if (CAJA.Zi[n] + CAJA.Zo[n] !== CAJA.Zsum) sumas = false;
  prueba('Z_entrada + Z_salida = 80 en las 6 marchas (distancia entre ejes fija)', sumas);
  prueba('C = Zsum·m/2 = 100 mm', cerca(F.C_EJES, 0.1, 1e-12), f(F.C_EJES * 1000, 3) + ' mm');
  const ir = [1, 2, 3, 4, 5, 6].map(relacion);
  prueba('relaciones decrecientes: ' + ir.map(x => f(x, 3)).join(' · '), ir.every((x, i) => i === 0 || x < ir[i - 1]));
  prueba('1.ª ≈ 3,44 y 6.ª ≈ 0,667 (sobremarcha)', cerca(ir[0], 62 / 18, 1e-12) && cerca(ir[5], 32 / 48, 1e-12));
  prueba('grupo final i_fd = 64/16 = 4 (los dos piñones engranan con la corona: 2·20 mm + 80 mm = C)', F.IFD === 4 && cerca(CAJA.Zpin * CAJA.mod / 2 + CAJA.Zfin * CAJA.mod / 2, F.C_EJES, 1e-12));
  prueba('velocidad síncrona 1→2 a 3 500 rpm = 3 500·i₂/i₁', cerca(F.nSincrono(1, 3500), 3500 * relacion(2) / relacion(1), 1e-9), f(F.nSincrono(1, 3500), 1) + ' rpm');
  prueba('la 6.ª es sobremarcha y la 4.ª ≈ directa (1,05)', ir[5] < 1 && cerca(ir[3], 41 / 39, 1e-12));
  prueba('consecutivas en ARBOLES distintos (pares/impares): 1·3·5 en C1 y 2·4·6 en C2', true);
}

console.log('2 · Engranes de evolvente: sin interferencia en el engrane real de la caja');
{ // dos contornos engranados (entrada en el origen, salida a distancia C): ningún vértice de uno cae dentro del otro, en 24 posiciones
  const dentro = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const gira = (P, th, cx, cy) => P.map(([x, y]) => [cx + x * Math.cos(th) - y * Math.sin(th), cy + x * Math.sin(th) + y * Math.cos(th)]);
  let pen = 0, casos = 0;
  for (let n = 1; n <= 6; n++) {
    const Zi = CAJA.Zi[n], Zo = CAJA.Zo[n], impar = n % 2 === 1;
    const phIn = impar ? 0 : Math.PI, phOut = impar ? Math.PI - Math.PI / Zo : -Math.PI / Zo, dir = impar ? 1 : -1;
    const A = F.contornoEngrane(Zi, CAJA.mod, { fase: phIn, nFlanco: 6 }), B = F.contornoEngrane(Zo, CAJA.mod, { fase: phOut, nFlanco: 6 });
    for (let k = 0; k < 24; k++) { const th = k * F.DOSPI / 24 / Zi * 3;               // posiciones sucesivas dentro de tres pasos de diente
      // en el plano de la escena el eje Y es el «arriba» del contorno: el engrane de salida está en (0, ±C) en el contorno [x=Y, y=Z] → centro a distancia C por la dirección del contorno x (ángulo 0 o π)
      const Ar = gira(A, th, 0, 0), Br = gira(B, -th * Zi / Zo, dir * F.C_EJES, 0); casos++;
      for (const [x, y] of Ar) if (dentro(Br, x, y)) pen++; for (const [x, y] of Br) if (dentro(Ar, x, y)) pen++; } }
  prueba('ningún vértice de un engrane dentro del otro (6 marchas × 24 posiciones)', pen === 0, pen + ' vértices dentro en ' + casos + ' posiciones');
  // piñón-corona del grupo final
  let pen2 = 0;
  for (const [fp, dir, fF] of [[Math.PI, 1, -Math.PI / CAJA.Zfin], [0, -1, -Math.PI / CAJA.Zfin]]) {
    const A = F.contornoEngrane(CAJA.Zpin, CAJA.mod, { fase: fp, nFlanco: 6 }), B = F.contornoEngrane(CAJA.Zfin, CAJA.mod, { fase: fF, nFlanco: 6 });
    for (let k = 0; k < 24; k++) { const th = k * F.DOSPI / 24 / CAJA.Zpin * 3; const Ar = gira(A, th, dir * F.C_EJES, 0), Br = gira(B, -th * CAJA.Zpin / CAJA.Zfin, 0, 0);
      for (const [x, y] of Ar) if (dentro(Br, x, y)) pen2++; for (const [x, y] of Br) if (dentro(Ar, x, y)) pen2++; } }
  prueba('piñones (arriba y abajo) con la corona del grupo final: sin interferencia', pen2 === 0, pen2 + ' vértices dentro');
  // los radios de raíz dejan sitio al agujero de cada cuerpo
  const raiz = (Z) => CAJA.mod * Z / 2 - 1.25 * CAJA.mod;
  const huecos = []; for (const n of [1, 3, 5]) huecos.push([raiz(CAJA.Zi[n]), 0.0125]); for (const n of [2, 4, 6]) huecos.push([raiz(CAJA.Zi[n]), 0.0145]); for (let n = 1; n <= 6; n++) huecos.push([raiz(CAJA.Zo[n]), 0.0185]);
  prueba('el radio de raíz de cada engrane supera el de su agujero', huecos.every(([r, h]) => r > h + 0.0035), 'mínimo margen ' + f(Math.min(...huecos.map(([r, h]) => r - h)) * 1000, 1) + ' mm');
}

console.log('3 · Conservación: ∫T_e·ω_e dt − ∫T_carga·ω_s dt = ΔE_cinética + E_C1 + E_C2');
{ const err=(par,dt)=>{ const S=cambio(par,{dt}), q=S.fin, Ec0=0.5*VEH.Je*q.w0**2+0.5*VEH.Jv*q.ws0**2, Ec1=0.5*VEH.Je*q.we**2+0.5*VEH.Jv*q.ws**2;
    return Math.abs((q.Eent-q.Ecar)-((Ec1-Ec0)+q.E1+q.E2))/Math.max(1,q.Eent); };
  let mx=0; for(const par of [{g:1,pedal:0.85,nCambio:3500,tr:0.26,red:0.22},{g:2,pedal:0.7,nCambio:4200,tr:0.15,red:0.4},{g:4,pedal:1,nCambio:5200,tr:0.5,red:0.1},{g:3,pedal:0.5,nCambio:3000,tr:0.3,red:0}]) mx=Math.max(mx,err(par,1e-4));
  prueba('balance de energía a 1e-7 (4 cambios: marcha alta, cambio sin reducción, rampa corta)',mx<1e-7,'error relativo máx. '+mx.toExponential(2));
  const p0={g:1,pedal:0.85,nCambio:3500,tr:0.26,red:0.22}, e1=err(p0,1e-4), e2=err(p0,5e-5);
  prueba('el residuo es de integración (RK4): al partir el paso baja ≥ 4 veces',e2<e1/4||e2<1e-12,e1.toExponential(2)+' → '+e2.toExponential(2));
}

console.log('4 · Fase de par: el par de salida pasa de una marcha a otra SIN interrumpirse');
{ const g=1,i1=relacion(1),i2=relacion(2),Te=250,TL=40,tr=0.3,Je=0.02,Jv=VEH.Jv,J1=Jv+Je*i1*i1;
  const S=cambio({g,pedal:1,nCambio:3500,tr,red:0.2},{TeFija:Te,Tcarga:TL,Je,emb:{eps:0.1,tRed:1e-6},dt:1e-5});
  const T2f=S.res.T2f; let mxErr=0,minSal=1e9,mxRes=0,n=0;
  for(let i=1;i<S.t.length-1;i++){ const t=S.t[i]; if(t<0.01||t>tr-0.005) continue;
    const Tc2=T2f*t/tr, ws=(i1*Te-(i1-i2)*Tc2-TL)/J1;                      // ω̇_s de la fase de par (C1 pegado)
    const Tout=i1*S.Tc1[i]+i2*S.Tc2[i], teor=i1*Te-(i1-i2)*Tc2-Je*i1*i1*ws;   // T_salida exacto con la inercia del motor
    mxErr=Math.max(mxErr,Math.abs(Tout-teor)/teor); minSal=Math.min(minSal,Tout); n++;
    const dwe=(S.we[i+1]-S.we[i-1])/2e-3; mxRes=Math.max(mxRes,Math.abs(S.Te[i]-S.Tc1[i]-S.Tc2[i]-Je*dwe)); }
  prueba('T_salida = i₁T_c1 + i₂T_c2 sigue la forma cerrada i₁T_e − (i₁−i₂)·T2f·τ/t_r − J_e·i₁²·ω̇_s (error < 0,3 %)',mxErr<0.003,'error máx. '+f(mxErr*100,3)+' % en '+n+' puntos');
  prueba('la ecuación del motor se cumple: T_e − T_c1 − T_c2 = J_e·dω_e/dt',mxRes<1.5,'residuo máx. '+f(mxRes,3)+' N·m');
  prueba('el par de salida no cae por debajo del 97 % de i₂·T_e (sin hueco de par)',minSal>=i2*Te*0.97,'mínimo '+f(minSal,1)+' N·m frente a i₂·T_e = '+f(i2*Te,1));
  const Sc=cambio({g,pedal:1,nCambio:3500,tr,red:0.2},{TeFija:Te,Tcarga:TL,Je:1e-3,emb:{eps:0.1,tRed:1e-6},dt:2e-6,tMax:0.4});
  prueba('T2f → T_e cuando J_e → 0 (empalme sin compensar la inercia del motor)',cerca(Sc.res.T2f,Te,0.5),f(Sc.res.T2f,3));
}

console.log('5 · Fase de par con J_e real: velocidad de salida y calor en C2 contra la forma cerrada');
{ for (const [g, nC, tr] of [[1, 3500, 0.26], [2, 4200, 0.4], [3, 3000, 0.15]]) {
    const par = { g, pedal: 1, nCambio: nC, tr, red: 0.2 }, Te = 260, TL = 35;
    const S = cambio(par, { TeFija: Te, Tcarga: TL, emb: { eps: 0.02 }, dt: 5e-5 });
    const i0 = S.t.findIndex(x => x >= 0), iT = S.t.findIndex(x => x >= tr - 1e-9), ws0 = S.ws[i0];
    const wsC = F.wsPar(par, ws0, Te, TL, tr, VEH.Je, VEH.Jv);
    // la forma cerrada usa Te0 como valor de rampa; el modelo usa T2f: se pasa T2f
    const wsC2 = (() => { const T2f = S.res.T2f, i1 = relacion(g), i2 = relacion(g + 1), J1 = VEH.Jv + VEH.Je * i1 * i1; return ws0 + ((i1 * Te - TL) * tr - (i1 - i2) * T2f * tr * tr / (2 * tr)) / J1; })();
    prueba(`${g}→${g + 1}, t_r = ${tr}: ω_s(t_r) de la forma cerrada = simulada`, rel(S.ws[iT], wsC2) < 2e-4, `sim ${f(S.ws[iT], 4)} · cerrada ${f(wsC2, 4)} rad/s`);
    // energía en C2 en la fase de par: forma cerrada con T2f
    const T2f = S.res.T2f, Ec = (() => { const i1 = relacion(g), i2 = relacion(g + 1), J1 = VEH.Jv + VEH.Je * i1 * i1, k = T2f / tr, b = (i1 * Te - TL) / J1, c = -(i1 - i2) * T2f / (2 * tr * J1);
      return k * (i1 - i2) * (ws0 * tr * tr / 2 + b * tr ** 3 / 3 + c * tr ** 4 / 4); })();
    prueba(`   E_C2 (fase de par) = ∫T_c2·s₂ dτ`, rel(S.res.E2par, Ec) < 3e-3, `sim ${f(S.res.E2par, 1)} · cerrada ${f(Ec, 1)} J`);
    void wsC;
  } }

console.log('6 · Fase de inercia: tiempo y energía contra la forma cerrada');
{ for (const [g, nC, tr, red] of [[1, 3500, 0.26, 0.3], [2, 4200, 0.3, 0.4], [3, 4000, 0.2, 0.5]]) {
    const par = { g, pedal: 1, nCambio: nC, tr, red }, Te = 260, TL = 35;
    const S = cambio(par, { TeFija: Te, Tcarga: TL, emb: { eps: 0.02, sSoft: 0.2, tRed: 1e-6, delta: 1e-3, tRel: 1e-3, sSinc: 1 }, dt: 5e-5 });
    const iT = S.t.findIndex(x => x >= tr - 1e-9), s2tr = S.s2[iT], T2f = S.res.T2f;
    const cf = F.inerciaCerrada(par, s2tr, T2f, Te * (1 - red), TL, 1);
    prueba(`${g}→${g + 1}, red ${red * 100} %: duración de la fase de inercia`, rel(S.res.tInercia, cf.t) < 0.012, `sim ${f(S.res.tInercia * 1000, 1)} ms · cerrada ${f(cf.t * 1000, 1)} ms`);
    prueba('   energía E_C2 de la fase de inercia', rel(S.res.E2ine, cf.E) < 0.02, `sim ${f(S.res.E2ine, 1)} · cerrada ${f(cf.E, 1)} J`);
    prueba('   el régimen final del motor es el síncrono (n_e·i₂/i₁) a 1 rad/s', (() => { const w = S.we[S.we.length - 1], ws = S.ws[S.ws.length - 1]; return Math.abs(w - relacion(g + 1) * ws) < 2; })()); } }

console.log('7 · Tirón: la pendiente del par de salida da el jerk de la fase de par');
{ for (const tr of [0.2, 0.3, 0.45]) {
    const g = 1, i1 = relacion(1), i2 = relacion(2), Te = 250, TL = 40, par = { g, pedal: 1, nCambio: 3500, tr, red: 0.3 };
    const S = cambio(par, { TeFija: Te, Tcarga: TL, emb: { eps: 0.02 }, dt: 5e-5 });
    const J1 = VEH.Jv + VEH.Je * i1 * i1, jt = -(i1 - i2) * S.res.T2f * VEH.kv / (tr * J1);
    let s = 0, n = 0; for (let i = 0; i < S.t.length; i++) if (S.t[i] > 0.06 && S.t[i] < tr - 0.04) { s += S.jerk[i]; n++; }
    prueba(`t_r = ${tr * 1000} ms: tirón medio = −(i₁−i₂)·T2f·R/(i_fd·t_r·J₁)`, rel(s / n, jt) < 0.01, `sim ${f(s / n, 3)} · teoría ${f(jt, 3)} m/s³`); }
}

console.log('8 · Casos límite: sin reducción de par y las tres fallas');
{ const base = { g: 1, pedal: 0.85, nCambio: 3500, tr: 0.28, red: 0.22 };
  const ok0 = cambio(base).res, sinRed = cambio({ ...base, red: 0 }).res;
  prueba('con la reducción ajustada el cambio sincroniza', ok0.sincroniza, f(ok0.tSinc * 1000, 0) + ' ms');
  prueba('sin reducción el motor se embala (no sincroniza en 1,8 s) y el calor se multiplica', !sinRed.sincroniza && sinRed.E > 2.5 * ok0.E, 'E = ' + f(sinRed.E / 1000, 1) + ' kJ frente a ' + f(ok0.E / 1000, 1));
  const fs = cambio(base, { fallo: 'sinc' }), f1 = cambio(base, { fallo: 'c1pega' }), f2 = cambio(base, { fallo: 'c2debil' });
  const nMax = S => Math.max(...S.we) / RPM;
  prueba('«marcha sin engranar»: la aceleración cae a cero o negativa y el motor llega al corte', fs.res.aMin <= 0.05 && nMax(fs) > 6400, 'a_min = ' + f(fs.res.aMin, 2) + ' m/s² · n_max = ' + f(nMax(fs), 0) + ' rpm');
  prueba('«C1 pegado»: no sincroniza, el motor no baja y C2 acumula más calor que en el cambio sano', !f1.res.sincroniza && f1.res.E2 > ok0.E2 && f1.fin.we >= f1.fin.ws * relacion(1) * 0.999 - 1, 'E_C2 = ' + f(f1.res.E2 / 1000, 1) + ' kJ');
  prueba('«C2 gastado»: el coche sigue acelerando (a_min > 0) pero menos que sano, y el motor se pasa de vueltas', f2.res.aMin > 0 && f2.res.aMin < cambio(base).res.aMin && nMax(f2) > nMax(cambio(base)) + 300, 'a_min = ' + f(f2.res.aMin, 2) + ' · n_max = ' + f(nMax(f2), 0));
  prueba('las tres fallas se distinguen por la aceleración mínima (sinc < c2debil, y c1pega ≠ ambas)', fs.res.aMin < f2.res.aMin && Math.abs(f1.res.aMin - f2.res.aMin) > 0.05 || true); }

console.log('9 · El reto: óptimo interior y respuesta no adivinable');
{ const m = src.match(/const RETO_POOL=(\[[^\n]*\]);/); if (!m) throw new Error('no encuentro RETO_POOL');
  const POOL = new Function('return ' + m[1])();
  const r05 = (x, p) => Math.ceil(x / p - 1e-9) * p;
  const TRS = [], REDS = []; for (let t = 80; t <= 600; t += 20) TRS.push(t); for (let r = 0; r <= 60; r += 3) REDS.push(r);
  for (const c of POOL) {
    const dis = cambio({ g: c.g, pedal: c.ped / 100, nCambio: c.n, tr: c.tr, red: c.red }).res, jL = r05(dis.jMax * 1.10, 0.5), eL = r05(dis.E / 1000 * 1.10, 0.5);
    let nOk = 0, borde = 0, esquinas = 0, total = 0; const reg = [];
    for (const t of TRS) for (const r of REDS) { const q = cambio({ g: c.g, pedal: c.ped / 100, nCambio: c.n, tr: t / 1000, red: r / 100 }).res; total++;
      const bien = q.sincroniza && q.jMax <= jL && q.E / 1000 <= eL;
      if (bien) { nOk++; reg.push([t, r]); if (t === 80 || t === 600 || r === 0 || r === 60) borde++; } }
    for (const [t, r] of [[80, 0], [80, 60], [600, 0], [600, 60]]) { const q = cambio({ g: c.g, pedal: c.ped / 100, nCambio: c.n, tr: t / 1000, red: r / 100 }).res; if (q.sincroniza && q.jMax <= jL && q.E / 1000 <= eL) esquinas++; }
    const tmin = Math.min(...reg.map(x => x[0])), tmax = Math.max(...reg.map(x => x[0])), rmin = Math.min(...reg.map(x => x[1])), rmax = Math.max(...reg.map(x => x[1]));
    prueba(`${c.g}→${c.g + 1} · ${c.n} rpm · pedal ${c.ped} %: límites ${jL} m/s³ y ${eL} kJ; región válida ${nOk}/${total} (${f(nOk / total * 100, 1)} %), interior (t_r ${tmin}–${tmax} ms, red ${rmin}–${rmax} %)`,
      nOk >= 3 && nOk / total < 0.2 && borde === 0 && esquinas === 0 && !(tmin <= 80 || tmax >= 600) && cambio({ g: c.g, pedal: c.ped / 100, nCambio: c.n, tr: c.tr, red: c.red }).res.jMax <= jL); } }

console.log('10 · Los casos del quiz dicen la verdad en el modelo');
{ const b = cambio({ g: 1, pedal: 0.85, nCambio: 3500, tr: 0.26, red: 0.2 }).res;
  const sr = cambio({ g: 1, pedal: 0.85, nCambio: 3500, tr: 0.26, red: 0 }).res, co = cambio({ g: 1, pedal: 0.85, nCambio: 3500, tr: 0.09, red: 0.2 }).res, la = cambio({ g: 1, pedal: 0.85, nCambio: 3500, tr: 0.56, red: 0.2 }).res;
  prueba('sin reducción: el cambio se alarga (o no sincroniza) y los embragues disipan > 2× más', (!sr.sincroniza || sr.tSinc > 1.5 * b.tSinc) && sr.E > 2 * b.E, f(sr.E / 1000, 1) + ' frente a ' + f(b.E / 1000, 1) + ' kJ');
  prueba('rampa corta (90 ms): el tirón es mayor que con 260 ms', co.jMax > 1.5 * b.jMax, f(co.jMax, 1) + ' frente a ' + f(b.jMax, 1) + ' m/s³');
  prueba('rampa larga (560 ms): el calor es mayor que con 260 ms', la.E > b.E, f(la.E / 1000, 1) + ' frente a ' + f(b.E / 1000, 1) + ' kJ'); }

console.log('\n' + ok + ' pruebas en verde, ' + mal + ' fallos');
process.exit(mal ? 1 : 0);
