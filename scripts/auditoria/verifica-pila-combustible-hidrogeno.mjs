// Verificación de la física del lab pila-combustible-hidrogeno: extrae el bloque FISICA del HTML publicado
// TAL CUAL y lo prueba contra formas cerradas, conservación y casos de libro.
// uso: node verifica-pila-combustible-hidrogeno.mjs [ruta del html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const AQUI = dirname(fileURLToPath(import.meta.url));
const RUTA = process.argv[2] || join(AQUI, '..', '..', 'public', 'labs', 'pila-combustible-hidrogeno.html');
const src = readFileSync(RUTA, 'utf8');
const i0 = src.indexOf('/* FISICA:INICIO */'), i1 = src.indexOf('/* FISICA:FIN */');
if (i0 < 0 || i1 < 0) throw new Error('no encuentro el bloque FISICA');
const F = new Function(src.slice(i0, i1) + '\nreturn {FAR,RGAS,M_H2,M_H2O,M_AIRE,E_PCI,E_PCS,PCI_MASA,P_AMB,T_AMB,X_O2,CELDA,BOP,OPER,ESCENARIOS,FALLAS,psat,E0,nernst,lambdaMem,sigmaMem,condiciones,celda,JdePmax,compresor,pila,IparaPneta,pliego,celdasMinimas};')();
let ok = 0, mal = 0;
const prueba = (nombre, cond, det = '') => { if (cond) ok++; else mal++; console.log((cond ? '  ✓ ' : '  ✗ ') + nombre + (det ? '  · ' + det : '')); };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
const f = (x, d = 3) => (+x).toFixed(d);
const e = (x) => (+x).toExponential(1);
const { FAR, RGAS } = F;

console.log('1 · Constantes y la tensión reversible');
{ prueba('E_Nernst(25 °C, 1 atm de H₂ y de O₂) = 1,229 V', Math.abs(F.nernst(298.15, 1, 1) - 1.229) < 1e-12, 'E = ' + f(F.nernst(298.15, 1, 1), 4) + ' V');
  const dG = 237.13e3 / (2 * FAR); prueba('coincide con −ΔG°f/(2F) del agua líquida (237,13 kJ/mol) a 0,5 mV', Math.abs(F.E0(298.15) - dG) < 5e-4, 'ΔG/(2F) = ' + f(dG, 4) + ' V');
  prueba('pendiente dE₀/dT = −0,85 mV/K (ΔS/2F del libro, −164 J/mol·K)', Math.abs((F.E0(348.15) - F.E0(298.15)) / 50 + 0.85e-3) < 1e-12);
  prueba('E_PCI = 241 826 / (2F) = 1,2532 V y E_PCS = 285 830 / (2F) = 1,4812 V', Math.abs(F.E_PCI - 1.2532) < 1e-4 && Math.abs(F.E_PCS - 1.4812) < 1e-4, f(F.E_PCI, 5) + ' · ' + f(F.E_PCS, 5));
  prueba('PCI del H₂ = 119,96 MJ/kg', Math.abs(F.PCI_MASA / 1e6 - 119.96) < 0.01, f(F.PCI_MASA / 1e6, 3));
  const T = 353.15, d1 = F.nernst(T, 2, 1) - F.nernst(T, 1, 1), d2 = F.nernst(T, 1, 4) - F.nernst(T, 1, 1);
  prueba('duplicar p_H₂ suma (RT/2F)·ln 2 y cuadruplicar p_O₂ suma (RT/2F)·ln 2', rel(d1, RGAS * T / (2 * FAR) * Math.LN2) < 1e-12 && rel(d2, RGAS * T / (2 * FAR) * Math.LN2) < 1e-12, 'Δ = ' + f(d1 * 1000, 2) + ' mV');
  prueba('Nernst baja con la temperatura a presiones fijas (−0,85 mV/K + término RT)', F.nernst(353.15, 1, 1) < F.nernst(298.15, 1, 1)); }

console.log('2 · Presión de vapor, membrana (Springer 1991)');
{ for (const [C, ref, tol] of [[25, 3169, 0.004], [60, 19946, 0.004], [80, 47373, 0.004], [100, 101325, 0.004]]) prueba(`p_sat(${C} °C) = ${ref} Pa de las tablas de vapor (Buck, ±0,4 %)`, rel(F.psat(C + 273.15), ref) < tol, f(F.psat(C + 273.15), 0) + ' Pa');
  prueba('λ(a = 1) = 14,00 y λ(a = 0) = 0,043 (isoterma de Springer)', Math.abs(F.lambdaMem(1) - 14.003) < 1e-9 && Math.abs(F.lambdaMem(0) - 0.043) < 1e-12);
  prueba('σ(λ = 14, 303 K) = 0,005139·14 − 0,00326 = 0,0686 S/cm', rel(F.sigmaMem(14, 303), 0.005139 * 14 - 0.00326) < 1e-12, f(F.sigmaMem(14, 303), 4));
  prueba('σ crece con λ y con T', F.sigmaMem(10, 353) > F.sigmaMem(5, 353) && F.sigmaMem(10, 353) > F.sigmaMem(10, 303)); }

console.log('3 · La celda: curva de polarización');
{ const c = F.condiciones(353.15, 2e5, 0.9, null), RT = RGAS * c.T;
  const v0 = F.celda(0, c), ocv = c.E - RT / (F.CELDA.alfa * FAR) * Math.log(c.Jn / c.J0);
  prueba('OCV = E_N − (RT/αF)·ln(J_n/J₀) (potencial mixto)', rel(v0.V, ocv) < 1e-12, 'OCV = ' + f(v0.V, 4) + ' V');
  let mono = true, id = true, prev = Infinity;
  for (let J = 0; J <= c.JL * 0.999; J += 0.01) { const r = F.celda(J, c); if (r.V > prev + 1e-12) mono = false; prev = r.V; if (r.V > 0 && Math.abs(r.V - (r.E - r.Vact - r.Vohm - r.Vconc)) > 1e-12) id = false; }
  prueba('V decrece de forma monótona con J en todo el rango', mono);
  prueba('V = E − V_act − V_óhm − V_conc con identidad exacta', id);
  prueba('V_óhm = J·R con R = t_m/σ + R_el', rel(F.celda(1, c).Vohm, 1 * (F.CELDA.tm / F.sigmaMem(c.lam, c.T) + F.CELDA.Rel)) < 1e-12, 'R = ' + f(c.R * 1000, 1) + ' mΩ·cm²');
  prueba('V_conc → ∞ en la corriente límite: V = 0 en J ≥ J_L', F.celda(c.JL, c).V === 0 && F.celda(c.JL * 1.2, c).V === 0, 'J_L = ' + f(c.JL, 3) + ' A/cm²');
  const J1 = F.celda(1.4, c).V; prueba('cifra citada en la ficha: V(1,4 A/cm²) ≈ 0,63 V a 80 °C, 2 bar y 90 %', Math.abs(J1 - 0.634) < 0.01, f(J1, 3) + ' V');
  prueba('cifra citada: OCV ≈ 0,98 V', Math.abs(v0.V - 0.981) < 0.005, f(v0.V, 4));
  prueba('cifra citada: σ ≈ 0,12 S/cm a λ = 14 y 80 °C', Math.abs(F.sigmaMem(14, 353.15) - 0.1242) < 1e-3, f(F.sigmaMem(14, 353.15), 4));
  // la presión sube la tensión; la humedad baja R
  const cb = F.condiciones(353.15, 1.2e5, 0.9, null), ca = F.condiciones(353.15, 3e5, 0.9, null);
  prueba('más presión, más tensión de celda (Nernst y cinética)', F.celda(1, ca).V > F.celda(1, c).V && F.celda(1, c).V > F.celda(1, cb).V);
  prueba('gases secos: más resistencia óhmica y menos tensión', F.condiciones(353.15, 2e5, 0.4, null).R > c.R && F.celda(1, F.condiciones(353.15, 2e5, 0.4, null)).V < F.celda(1, c).V);
  prueba('J_L baja cuando los gases se saturan (correlación de inundación)', F.condiciones(353.15, 2e5, 1.0, null).JL < F.condiciones(353.15, 2e5, 0.8, null).JL); }

console.log('4 · La pila: Faraday, calor y balance de energía');
{ const c = F.condiciones(353.15, 2e5, 0.9, null), A = 300, N = 400, I = 400, p = F.pila(N, I, A, c);
  prueba('consumo de H₂ = N·I·M/(2F) (1 Ah → 0,0376 g)', rel(F.pila(1, 1, A, F.condiciones(353.15, 2e5, 0.9, null)).mH2 * 3600 * 1000, 0.037614) < 2e-4 && rel(p.mH2, N * I * F.M_H2 / (2 * FAR)) < 1e-14, f(p.mH2 * 1000, 3) + ' g/s');
  prueba('agua producida = consumo de H₂ × M_H₂O/M_H₂', rel(p.mH2O / p.mH2, F.M_H2O / F.M_H2) < 1e-12);
  prueba('aire = λ·(N·I/4F)·M_aire/x_O₂', rel(p.mAire, F.BOP.lamAire * N * I / (4 * FAR) / F.X_O2 * F.M_AIRE) < 1e-12, f(p.mAire * 1000, 1) + ' g/s');
  prueba('calor Q = N·I·(E_PCI − V_celda)', rel(p.Q, N * I * (F.E_PCI - p.Vc)) < 1e-12, f(p.Q / 1000, 1) + ' kW');
  prueba('balance: potencia química del H₂ = P_bruta + calor + purga (1e-12)', rel(p.Pquim, p.Pb + p.Q + p.Ppurga) < 1e-12, f(p.Pquim / 1000, 3) + ' kW');
  prueba('balance de la pila: P_bruta = P_neta + P_auxiliares', rel(p.Pb, p.Pnet + p.Paux) < 1e-12);
  prueba('P_química = ṁ_H₂ suministrado · PCI (con 98 % de utilización)', rel(p.Pquim, p.mH2 / F.BOP.muF * F.PCI_MASA) < 1e-12);
  prueba('η_neto = P_neta / P_química y η_neto < η_bruto < V/E_PCI ≤ 1', rel(p.etaNeto, p.Pnet / p.Pquim) < 1e-12 && p.etaNeto < p.etaBruto && p.etaBruto < p.Vc / F.E_PCI + 1e-12 && p.Vc / F.E_PCI < 1, 'η neto ' + f(p.etaNeto * 100, 2) + ' % · η bruto ' + f(p.etaBruto * 100, 2) + ' %');
  prueba('η_bruto = V·μ_f/E_PCI', rel(p.etaBruto, p.Vc * F.BOP.muF / F.E_PCI) < 1e-12); }

console.log('5 · El compresor');
{ const m = 0.09, PR = 2.2, P = PR * F.P_AMB, w = F.BOP.cp * F.BOP.Tin / F.BOP.etaC * (Math.pow(PR, (F.BOP.gam - 1) / F.BOP.gam) - 1);
  prueba('P_comp = ṁ·cp·T/(η_c·η_m)·(PR^((γ−1)/γ) − 1)', rel(F.compresor(m, P), m * w / F.BOP.etaM) < 1e-12, f(F.compresor(m, P) / 1000, 2) + ' kW');
  prueba('sin relación de presiones no hay trabajo', Math.abs(F.compresor(m, F.P_AMB)) < 1e-9);
  prueba('el trabajo crece con la presión y con el caudal', F.compresor(m, 3e5) > F.compresor(m, 2e5) && F.compresor(2 * m, 2e5) > 1.99 * F.compresor(m, 2e5)); }

console.log('6 · Potencia máxima por derivada');
{ const c = F.condiciones(353.15, 2e5, 0.9, null), Jm = F.JdePmax(c), pj = (J) => J * F.celda(J, c).V, h = 1e-5;
  const d = (pj(Jm + h) - pj(Jm - h)) / (2 * h);
  prueba('d(J·V)/dJ = 0 en J*', Math.abs(d) < 1e-4, 'J* = ' + f(Jm, 4) + ' A/cm² · derivada ' + e(d));
  let mx = 0, jx = 0; for (let J = 0.01; J < c.JL * 0.9999; J += 0.0005) { const p = pj(J); if (p > mx) { mx = p; jx = J; } }
  prueba('coincide con el barrido de fuerza bruta (paso 0,5 mA/cm²)', Math.abs(jx - Jm) < 1e-3 && rel(mx, pj(Jm)) < 1e-6, 'barrido J = ' + f(jx, 4) + ' · P = ' + f(mx, 4) + ' W/cm²'); }

console.log('7 · El reto: 100 kW netos con las menos celdas');
{ const { OPER, ESCENARIOS } = F; let todos = true, interior = true, noMenos = true, ndist = [];
  for (const sc of ESCENARIOS) {
    const o = F.celdasMinimas(sc); if (!o) { todos = false; console.log('   sin solución', JSON.stringify(sc)); continue; }
    ndist.push(o.N);
    const c = F.condiciones(sc.T, o.P, sc.RH, null), I = F.IparaPneta(o.N, sc.A, c, OPER.Pobj), pl = F.pila(o.N, I, sc.A, c), pq = F.pliego(pl, sc, o.N);
    prueba(`escenario A = ${sc.A} cm², ${f(sc.T - 273.15, 0)} °C, RH ${sc.RH}: N_mín = ${o.N} celdas a ${f(o.P / 1e5, 1)} bar y ${f(I, 0)} A`, pq.every(x => x.ok) && Math.abs(pl.Pnet - OPER.Pobj) < 1e-3, `P ${f(pl.Pnet / 1000, 2)} kW · η ${f(pl.etaNeto * 100, 2)} % · ${f(pl.Vs, 0)} V · Q ${f(pl.Q / 1000, 0)} kW · J ${f(pl.J, 2)}`);
    if (!(o.N > OPER.Nmin + 20 && o.N < OPER.Nmax - 20)) interior = false;
    // con una celda menos no hay (P, I) que cumpla en ninguna presión de la malla
    const Qmax = sc.UA * (sc.T - OPER.Tamb); let cumple = false;
    for (let P = OPER.Pmin; P <= OPER.Pmax + 1; P += 0.1e5) { const cc = F.condiciones(sc.T, P, sc.RH, null), II = F.IparaPneta(o.N - 1, sc.A, cc, OPER.Pobj); if (II == null) continue; const q = F.pila(o.N - 1, II, sc.A, cc); if (q.etaNeto >= sc.etaMin && q.Vs >= OPER.Vmin && q.Vs <= OPER.Vmax && q.Q <= Qmax && II <= OPER.Imax) cumple = true; }
    if (cumple) noMenos = false;
    // ¿está en el interior de las presiones? y ¿η_neto(p) tiene su máximo en el interior para N = N_mín + 30?
    const etas = []; for (let P = OPER.Pmin; P <= OPER.Pmax + 1; P += 0.1e5) { const cc = F.condiciones(sc.T, P, sc.RH, null), II = F.IparaPneta(o.N + 30, sc.A, cc, OPER.Pobj); etas.push(II == null ? -1 : F.pila(o.N + 30, II, sc.A, cc).etaNeto); }
    const imax = etas.indexOf(Math.max(...etas));
    prueba(`   η_neto(p) con N_mín + 30 celdas tiene su máximo en el INTERIOR del rango de presión`, imax > 0 && imax < etas.length - 1, 'máximo a ' + f((OPER.Pmin + imax * 0.1e5) / 1e5, 1) + ' bar (η ' + f(etas[imax] * 100, 2) + ' %)');
  }
  prueba('todos los escenarios tienen solución', todos);
  prueba('N_mín queda en el interior del rango del mando (no es el tope ni el piso)', interior, ndist.join(' · '));
  prueba('con una celda menos ningún punto de operación cumple (N_mín es mínimo)', noMenos);
  // «subir hasta el límite» no resuelve: con 600 celdas falla el criterio de N y/o la ventana de tensión
  let tope = true; for (const sc of ESCENARIOS) { const c = F.condiciones(sc.T, 2e5, sc.RH, null), I = F.IparaPneta(OPER.Nmax, sc.A, c, OPER.Pobj), pl = F.pila(OPER.Nmax, I, sc.A, c), o = F.celdasMinimas(sc), pq = F.pliego(pl, sc, o && o.N); if (pq.every(x => x.ok)) tope = false; }
  prueba('con el máximo de celdas (600) el pliego NO se cumple en ningún escenario', tope);
  let piso = true; for (const sc of ESCENARIOS) { const c = F.condiciones(sc.T, 2e5, sc.RH, null), I = F.IparaPneta(OPER.Nmin, sc.A, c, OPER.Pobj); if (I != null) { const pl = F.pila(OPER.Nmin, I, sc.A, c), o = F.celdasMinimas(sc), pq = F.pliego(pl, sc, o && o.N); if (pq.every(x => x.ok)) piso = false; } }
  prueba('con el mínimo de celdas (150) tampoco', piso);
  // IparaPneta es la raíz de la rama de menor corriente
  const sc = ESCENARIOS[0], c = F.condiciones(sc.T, 2e5, sc.RH, null), I = F.IparaPneta(450, sc.A, c, OPER.Pobj), pl = F.pila(450, I, sc.A, c);
  prueba('I(P_neta = 100 kW) es raíz exacta y de la rama de MENOR corriente (la de mejor rendimiento)', Math.abs(pl.Pnet - OPER.Pobj) < 1e-3 && I < F.JdePmax(c) * sc.A, f(I, 1) + ' A < ' + f(F.JdePmax(c) * sc.A, 0) + ' A'); }

console.log('8 · Las cuatro fallas del diagnóstico');
{ const T = 353.15, P = 2e5, RH = 0.9, sana = F.condiciones(T, P, RH, null), J = 1.2;
  const d = (fa, Jx) => (F.celda(Jx, sana).V - F.celda(Jx, F.condiciones(T, P, RH, fa)).V) * 1000;
  const s = F.condiciones(T, P, RH, 'seca'), i = F.condiciones(T, P, RH, 'inunda'), c = F.condiciones(T, P, RH, 'cruce'), k = F.condiciones(T, P, RH, 'cata');
  prueba('seca: la HFR sube ≥ 2×, el OCV no cambia y J_L tampoco', s.R > 2 * sana.R && Math.abs(d('seca', 0)) < 1e-9 && s.JL === sana.JL, `HFR ${f(sana.R * 1000, 0)} → ${f(s.R * 1000, 0)} mΩ·cm²`);
  prueba('seca: la caída crece con la corriente (dV a 1,2 > 4× la de 0,3)', d('seca', 1.2) > 4 * d('seca', 0.3), 'dV(0,3) = ' + f(d('seca', 0.3), 1) + ' mV · dV(1,2) = ' + f(d('seca', 1.2), 1) + ' mV');
  prueba('inunda: HFR y OCV iguales, J_L cae y la rodilla llega antes (poca diferencia a 0,5 A/cm², mucha cerca del límite)', i.R === sana.R && Math.abs(d('inunda', 0)) < 1e-9 && i.JL < 0.9 * sana.JL && d('inunda', 0.5) < 20 && d('inunda', 1.2) > 40 && d('inunda', 1.4) > 70, `J_L ${f(sana.JL, 2)} → ${f(i.JL, 2)} · dV(0,5) = ${f(d('inunda', 0.5), 1)} · dV(1,2) = ${f(d('inunda', 1.2), 0)} · dV(1,4) = ${f(d('inunda', 1.4), 0)} mV`);
  prueba('cruce: el OCV baja ≥ 60 mV pero a 1,2 A/cm² casi se juntan (< 10 mV)', d('cruce', 0) > 60 && d('cruce', J) < 10, `dOCV = ${f(d('cruce', 0), 0)} mV · dV(1,2) = ${f(d('cruce', J), 1)} mV`);
  prueba('cata: toda la curva baja casi en paralelo (≥ 80 mV a 0 y a 1,2 A/cm², razón < 2)', d('cata', 0) > 80 && d('cata', J) > 80 && d('cata', 0) / d('cata', J) < 2 && k.R === sana.R, `dOCV = ${f(d('cata', 0), 0)} mV · dV(1,2) = ${f(d('cata', J), 0)} mV`); }

console.log('9 · Coherencia de las cifras de la teoría (catálogo)');
{ const sc = F.ESCENARIOS[0], o = F.celdasMinimas(sc); console.log('   escenario 1: N_mín =', o.N, '· p =', f(o.P / 1e5, 1), 'bar · I =', f(o.I, 0), 'A · η =', f(o.pl.etaNeto * 100, 1), '%');
  const c = F.condiciones(353.15, 2e5, 0.9, null), p = F.pila(400, 425, 300, c);
  console.log('   marcha: 400 celdas, 425 A, 2 bar, 80 °C, 90 %: V =', f(p.Vc, 3), 'V · V_pila =', f(p.Vs, 0), 'V · P_neta =', f(p.Pnet / 1000, 1), 'kW · η_neto =', f(p.etaNeto * 100, 1), '% · Q =', f(p.Q / 1000, 0), 'kW · H₂ =', f(p.mH2 * 1000, 2), 'g/s · agua =', f(p.mH2O * 1000, 1), 'g/s'); }

console.log(`\n${ok} pruebas en verde, ${mal} fallan`);
process.exit(mal ? 1 : 0);
