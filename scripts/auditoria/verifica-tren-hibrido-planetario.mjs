// Verificación de la física del lab tren-hibrido-planetario: extrae el bloque FISICA del HTML publicado TAL CUAL
// y lo prueba contra cálculos independientes (formas cerradas, conservación, barridos numéricos).
// uso: node verifica.mjs [ruta del html o de un archivo que contenga el bloque]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
// por defecto prueba el HTML publicado junto a este script (scripts/auditoria/ → ../../public/labs/) o, si no existe, el del repo
const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = 'C:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard/public/labs/tren-hibrido-planetario.html';
const RUTA = process.argv[2] || resolve(AQUI, '../../public/labs/tren-hibrido-planetario.html');
import { existsSync } from 'node:fs';
const src = readFileSync(existsSync(RUTA) ? RUTA : REPO, 'utf8');
const i0 = src.indexOf('/* FISICA:INICIO */'), i1 = src.indexOf('/* FISICA:FIN */');
if (i0 < 0 || i1 < 0) throw new Error('no encuentro el bloque FISICA');
const F = new Function(src.slice(i0, i1) + '\nreturn {DOSPI,RPM,PSD,VEH,COMB,ICE,MG1,MG2,ETA_INV,PACK,GEO,vocDe,wSol,wPorta,wCorona,wSatelite,reparto,wRueda,wCoronaDe,potCrucero,parMaxICE,caudal,bsfc,optimoMotor,perdidaMG,dcDe,punto,residuoBalance,residuoMecanico,neutro,optimoVehiculo,consumoL100,pasoSOC,contornoEngrane,invEv};')();
let ok = 0, mal = 0;
const prueba = (nombre, cond, det = '') => { if (cond) ok++; else mal++; console.log((cond ? '  ✓ ' : '  ✗ ') + nombre + (det ? '  · ' + det : '')); };
const cerca = (a, b, tol) => Math.abs(a - b) <= tol;
const f = (x, d = 3) => (+x).toFixed(d);
const { PSD, RPM, DOSPI } = F;
let semilla = 12345; const alea = () => { semilla = (semilla * 1664525 + 1013904223) % 4294967296; return semilla / 4294967296; };
const rango = (a, b) => a + (b - a) * alea();

console.log('1 · Willis: Zs·ωs + Zr·ωr = (Zs+Zr)·ωc');
{ let mx = 0, mx2 = 0, mx3 = 0, mx4 = 0;
  for (let i = 0; i < 20000; i++) { const ws = rango(-1200, 1200), wr = rango(-600, 600), wc = F.wPorta(ws, wr);
    mx = Math.max(mx, Math.abs(PSD.Zs * ws + PSD.Zr * wr - (PSD.Zs + PSD.Zr) * wc) / 1000);
    mx2 = Math.max(mx2, Math.abs(F.wSol(wc, wr) - ws), Math.abs(F.wCorona(ws, wc) - wr));
    // palanca: tres puntos alineados con distancias Zr (sol-porta) y Zs (porta-corona)
    const xS = 0, xC = PSD.Zr, xR = PSD.Zr + PSD.Zs; mx3 = Math.max(mx3, Math.abs((wc - ws) / (xC - xS) - (wr - ws) / (xR - xS)));
    // el satélite engrana con el solar (cambia de sentido) y con la corona (misma relación)
    const wp = F.wSatelite(ws, wc); mx4 = Math.max(mx4, Math.abs((wr - wc) - (PSD.Zp / PSD.Zr) * (wp - wc)), Math.abs((wp - wc) * PSD.Zp + (ws - wc) * PSD.Zs));
  }
  prueba('Willis a 1e-12 (20 000 casos)', mx < 1e-12, mx.toExponential(2));
  prueba('despejes ωs y ωr ida y vuelta', mx2 < 1e-9, mx2.toExponential(2));
  prueba('palanca: sol, portasatélites y corona alineados', mx3 < 1e-12, mx3.toExponential(2));
  prueba('satélite: Zp·(ωp−ωc) = −Zs·(ωs−ωc) y corona (ωr−ωc) = (Zp/Zr)(ωp−ωc)', mx4 < 1e-9, mx4.toExponential(2));
  prueba('Zr = Zs + 2·Zp', PSD.Zr === PSD.Zs + 2 * PSD.Zp);
  prueba('ρ = Zs/Zr = 0,3846', cerca(PSD.rho, 30 / 78, 1e-15), f(PSD.rho, 4));
  prueba('montaje: (Zs+Zr)/3 entero (3 satélites a 120°)', (PSD.Zs + PSD.Zr) % 3 === 0);
}
console.log('2 · Reparto de pares y potencia sin pérdidas');
{ let mx = 0, mr = 0;
  for (let i = 0; i < 20000; i++) { const Tc = rango(0, 120), ws = rango(-1000, 1000), wr = rango(0, 600), wc = F.wPorta(ws, wr), { Ts, Tr } = F.reparto(Tc);
    mx = Math.max(mx, Math.abs(Ts + Tr - Tc), Math.abs(Ts * ws + Tr * wr - Tc * wc) / 100000);
    mr = Math.max(mr, Math.abs(Ts / Tc - 30 / 108) + Math.abs(Tr / Tc - 78 / 108)); }
  prueba('Ts + Tr = Tc y Ts·ωs + Tr·ωr = Tc·ωc', mx < 1e-12, mx.toExponential(2));
  prueba('Ts : Tc : Tr = Zs : (Zs+Zr) : Zr (= 0,2778 : 1 : 0,7222)', mr < 1e-12);
}
console.log('3 · Balance de potencia (mecánico y de energía total)');
{ let mM = 0, mE = 0, n = 0;
  const fallas = [null, null, null, 'mg1', 'bloq', 'mg2'];
  for (let i = 0; i < 6000; i++) { const v = rango(0, 44), Pw = rango(-25e3, 45e3), n_ = rango(1000, 5200), Te = rango(0, 115), falla = fallas[Math.floor(alea() * fallas.length)];
    const we = alea() < 0.15 ? 0 : n_ * RPM, p = F.punto({ v, Pw, we, Te, falla, soc: rango(0.4, 0.8) });
    if (!p.fisico) continue;
    mM = Math.max(mM, Math.abs(F.residuoMecanico(p)) / Math.max(1, Math.abs(p.Pe) + Math.abs(p.P1sh) + Math.abs(p.P2sh)));
    mE = Math.max(mE, Math.abs(F.residuoBalance(p)) / Math.max(1, p.Pfuel + Math.abs(p.Pchem))); n++; }
  prueba('mecánico: Pe + P_MG1 + P_MG2 = P_corona + pérdida del engranaje (rel.)', mM < 1e-12, mM.toExponential(2) + ' en ' + n + ' casos');
  prueba('energía: combustible + química = rueda + auxiliares + todas las pérdidas (rel.)', mE < 1e-12, mE.toExponential(2));
}
console.log('4 · Motor térmico');
{ let mejor = [1e9];
  for (let n = 1000; n <= 5200; n += 10) for (let T = 2; T <= F.parMaxICE(n * RPM); T += 0.5) { const b = F.bsfc(n * RPM, T); if (b < mejor[0]) mejor = [b, n, T]; }
  const eta = 3.6e6 / (mejor[0] / 1000 * F.COMB.LHV);
  prueba('mínimo del mapa ≈ 222 g/kWh en torno a 2700 rpm y 105 N·m', cerca(mejor[0], 222, 3) && Math.abs(mejor[1] - 2700) < 250 && Math.abs(mejor[2] - 105) < 10, f(mejor[0], 1) + ' g/kWh a ' + mejor[1] + ' rpm, ' + f(mejor[2], 1) + ' N·m');
  prueba('rendimiento de combustible η = 3,6·10⁶/(bsfc·LHV) ≈ 0,377', cerca(eta, 0.377, 0.004), f(eta, 4));
  prueba('plena carga: 115 N·m a 4000 rpm; 57 kW ± 1 a 5000 rpm', cerca(F.parMaxICE(4000 * RPM), 115, 1e-9) && cerca(F.parMaxICE(5000 * RPM) * 5000 * RPM / 1000, 57.4, 1), f(F.parMaxICE(5000 * RPM) * 5000 * RPM / 1000, 2) + ' kW');
  let peor = -1, mejora = 0, nOk = 0;
  for (const Pe of [3e3, 5e3, 8e3, 12e3, 18e3, 25e3, 35e3, 45e3, 52e3]) { const o = F.optimoMotor(Pe); let m = [1e9];
    for (let n = 1000; n <= 5200; n += 0.5) { const w = n * RPM, T = Pe / w; if (T > F.parMaxICE(w)) continue; const q = F.caudal(w, T); if (q < m[0]) m = [q, n]; }
    peor = Math.max(peor, (o.f - m[0]) / m[0]); mejora = Math.max(mejora, (m[0] - o.f) / m[0]); if (Math.abs(o.n - m[1]) < 2.5 || o.n === 1000) nOk++; }
  prueba('optimoMotor nunca peor que el barrido bruto de 0,5 rpm (y lo mejora < 1e-4)', peor < 1e-9 && mejora < 1e-4, 'peor ' + peor.toExponential(2) + ' · mejora ' + mejora.toExponential(2));
  prueba('optimoMotor: mismo régimen que el barrido (±2,5 rpm)', nOk === 9, nOk + '/9');
  const o25 = F.optimoMotor(25e3); prueba('a 25 kW el óptimo cae cerca de 2400 rpm y ~224 g/kWh', Math.abs(o25.n - 2375) < 120 && cerca(o25.bsfc, 224, 3), f(o25.n, 0) + ' rpm, ' + f(o25.bsfc, 1) + ' g/kWh');
}
console.log('5 · Casos de libro del vehículo');
{ const we = 1500 * RPM, Te = 60, p = F.punto({ v: 0, Pw: 0, we, Te });
  prueba('parado: ωs = 3,6·ωc (n_s = 5400 rpm a 1500 rpm)', cerca(p.ws / RPM, 3.6 * 1500, 1e-9), f(p.ws / RPM, 3) + ' rpm');
  prueba('parado: MG1 absorbe Ts·ωs = (30/108)·Te·3,6·ωe', cerca(-p.P1sh, 30 / 108 * Te * 3.6 * we, 1e-6), f(-p.P1sh / 1000, 3) + ' kW');
  prueba('parado: la corona no recibe potencia y MG2 sólo sostiene el par', p.Pring === 0 && cerca(p.T2, -Te * 78 / 108, 1e-9) && cerca(p.P2sh, 0, 1e-9));
  prueba('parado: la batería se carga con (MG1 − pérdidas)', p.Pbat < 0);
  const vLim = 10000 * RPM * PSD.Zs / PSD.Zr * F.VEH.Rw / F.VEH.ifd, pe = F.punto({ v: vLim * 0.999, Pw: 10e3, we: 0, Te: 0 }), pf = F.punto({ v: vLim * 1.01, Pw: 10e3, we: 0, Te: 0 });
  prueba('EV: ωs = −(Zr/Zs)·ωr', cerca(pe.ws, -PSD.Zr / PSD.Zs * pe.wr, 1e-9));
  prueba('EV: el MG1 llega a 10 000 rpm a ' + f(vLim * 3.6, 1) + ' km/h (límite activo justo después)', !pe.lim.mg1v && pf.lim.mg1v, f(vLim * 3.6, 2) + ' km/h');
  const v = 100 / 3.6, Pc = F.potCrucero(v);
  prueba('crucero a 100 km/h: ' + f(Pc / 1000, 2) + ' kW (fuerza ' + f(Pc / v, 0) + ' N)', cerca(Pc, (1380 * 9.80665 * 0.009 + 0.5 * 1.2 * 0.58 * v * v) * v, 1e-9));
  const pw = F.punto({ v, Pw: Pc, we: 0, Te: 0 });
  prueba('n_corona = v·i_f/R·(30/π)', cerca(pw.wr / RPM, v * 3.905 / 0.317 / RPM, 1e-9), f(pw.wr / RPM, 1) + ' rpm');
  const pr = F.punto({ v, Pw: -15e3, we: 0, Te: 0 });
  prueba('regeneración (−15 kW en la rueda): la batería se carga', pr.Pbat < 0 && pr.P2sh < 0, f(pr.Pbat / 1000, 2) + ' kW');
}
console.log('6 · SOC neutro y óptimo del vehículo contra barrido numérico');
{ const casos = [[40, 8e3], [60, 12e3], [80, 18e3], [100, 15e3], [100, 25e3], [130, 30e3], [140, 20e3], [50, 40e3], [20, 6e3], [160, 35e3]];
  let nBat = 0, nOpt = 0, peor = -1, mejora = 0, nMot = 0; const filas = [];
  for (const [kmh, Pw] of casos) { const v = kmh / 3.6, o = F.optimoVehiculo(v, Pw);
    if (!o.motor) { filas.push([kmh, Pw / 1000, 'sin motor']); continue; }
    nMot++; if (Math.abs(o.p.Pbat) < 1e-3) nBat++;
    let m = null;
    for (let n = 1000; n <= 5200; n += 1) { const we = n * RPM, r = F.neutro(v, Pw, we); if (!r.ok || r.sobra) continue; const p = F.punto({ v, Pw, we, Te: r.Te });
      if (p.lim.mg1v || p.lim.mg1T || p.lim.mg1P || p.lim.mg2T || p.lim.mg2P || p.lim.iceT) continue; if (!m || p.mf < m.mf) m = { n, mf: p.mf }; }
    const rel = (o.p.mf - m.mf) / m.mf; peor = Math.max(peor, rel); mejora = Math.max(mejora, -rel); if (o.p.mf <= m.mf * (1 + 1e-9) && Math.abs(o.n - m.n) < 1.5) nOpt++;
    filas.push([kmh + ' km/h', f(Pw / 1000, 0) + ' kW', f(o.n, 1) + ' rpm', f(o.Te, 1) + ' N·m', f(o.p.mf, 4) + ' g/s', f(o.p.bsfc, 1) + ' g/kWh', 'ns=' + f(o.p.ws / RPM, 0), f(F.consumoL100(o.p.mf, v), 2) + ' L/100km']); }
  for (const r of filas) console.log('     ', r.join(' · '));
  prueba('en el óptimo la batería queda en 0 (|P_bat| < 1 mW)', nBat === nMot, nBat + '/' + nMot);
  prueba('óptimo del vehículo nunca peor que el barrido de 1 rpm en consumo', peor < 1e-9 && mejora < 3e-4, 'peor ' + peor.toExponential(2) + ' · mejora ' + mejora.toExponential(2));
  prueba('el régimen coincide con el del barrido (±1,5 rpm)', nOpt === nMot, nOpt + '/' + nMot);
}
console.log('7 · Batería y SOC');
{ const soc = 0.6, Vo = F.vocDe(soc);
  let mx = 0; for (const P of [-20e3, -5e3, 0, 3e3, 15e3, 21e3]) { const s1 = F.pasoSOC(soc, P, 1), I = (Vo - Math.sqrt(Vo * Vo - 4 * 0.3 * P)) / 0.6;
    mx = Math.max(mx, Math.abs((soc - s1) - I / (3600 * 6.5))); if (P === 0) prueba('P = 0: el SOC no se mueve', s1 === soc); }
  prueba('ΔSOC = I·dt/(3600·Q) con V_oc·I − R·I² = P', mx < 1e-15, mx.toExponential(2));
  const p = F.punto({ v: 20, Pw: 12e3, we: 0, Te: 0, soc }); prueba('V_oc·I − R·I² = P_bat', cerca(p.Pchem - p.Lbat, p.Pbat, 1e-6), f(p.Pbat / 1000, 3) + ' kW, I = ' + f(p.I, 1) + ' A');
  prueba('la química entrega más que el bus (I²R > 0)', p.Pchem > p.Pbat);
}
console.log('8 · Fallas');
{ const v = 80 / 3.6, wr = F.wCoronaDe(v), a = F.punto({ v, Pw: 15e3, we: 2000 * RPM, Te: 80, falla: 'bloq' });
  prueba('MG1 bloqueado: ωs = 0 y el motor queda atado ωc = (Zr/(Zs+Zr))·ωr', a.ws === 0 && cerca(a.we, 78 / 108 * wr, 1e-9), f(a.we / RPM, 1) + ' rpm');
  const b = F.punto({ v, Pw: 15e3, we: 2000 * RPM, Te: 80, falla: 'mg1' });
  prueba('MG1 sin par: el motor se embala al corte y no transmite par (Ts = Tr = 0)', cerca(b.we / RPM, 5200, 1e-9) && b.Ts === 0 && b.Tr === 0);
  const c = F.punto({ v: 0, Pw: 0, we: 1500 * RPM, Te: 60, falla: 'mg2' }), d = F.punto({ v: 0, Pw: 0, we: 1500 * RPM, Te: 60 });
  prueba('MG2 sin par: T2 = 0', c.T2 === 0 && d.T2 !== 0);
  const e = F.punto({ v: 20, Pw: 20e3, we: 2200 * RPM, Te: 90, falla: 'mg2' });
  prueba('MG2 sin par: la rueda recibe sólo el camino mecánico (< lo pedido)', e.Pw_real < e.Pw && cerca(e.Tring_act, e.Tr_ef, 1e-12), f(e.Pw_real / 1000, 2) + ' de ' + f(e.Pw / 1000, 2) + ' kW');
}
console.log('9 · Geometría de los dientes: engrane sin interferencias');
{ const m = PSD.mod, cs = F.contornoEngrane(30, m, { fase: 0 }), cr = F.contornoEngrane(78, m, { interno: true, fase: Math.PI / 78 });
  const dentro = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
  const rot = (poly, a, cx = 0, cy = 0) => poly.map(([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
  const area = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a / 2; };
  prueba('contorno antihorario (área > 0) y área del sol ≈ π·r_p²', area(cs) > 0 && cerca(area(cs) / (Math.PI * (m * 15) ** 2), 1, 0.06), f(area(cs) / (Math.PI * (m * 15) ** 2), 4));
  let choques = 0, fuera = 0, total = 0;
  for (const [ths, thc] of [[0, 0], [0.37, 0.1], [-1.9, 0.6], [4.1, -0.8], [11.3, 2.2], [-0.05, 3.3]]) {
    const thr = (PSD.Zs + PSD.Zr) / PSD.Zr * thc - PSD.Zs / PSD.Zr * ths, thp0 = Math.PI / 24;
    const solido = rot(cs, ths);
    for (let i = 0; i < 3; i++) {
      const bet = thc + i * DOSPI / 3, cx = F.GEO.Rc * Math.cos(bet), cy = F.GEO.Rc * Math.sin(bet), thp = thc - PSD.Zs / PSD.Zp * (ths - thc) + thp0;
      const sat = rot(F.contornoEngrane(24, m, { fase: 0 }), thp, cx, cy), coro = rot(cr, thr);
      for (const pt of sat) { total++; if (dentro(pt, solido)) choques++; if (!dentro(pt, coro)) fuera++; }
      for (const pt of solido) if (dentro(pt, sat)) choques++;
    }
  }
  prueba('ningún vértice del satélite entra en el solar (ni al revés) en 6 posiciones de Willis', choques === 0, choques + ' choques / ' + total);
  prueba('todos los vértices del satélite quedan dentro del hueco de la corona', fuera === 0, fuera + ' fuera');
  prueba('r_r = R_c + r_p exacto y R_c = ' + f(F.GEO.Rc * 1000, 3) + ' mm', cerca(F.GEO.rr, F.GEO.Rc + F.GEO.rp, 1e-15));
}
console.log(`\nRESULTADO: ${ok} pruebas bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
