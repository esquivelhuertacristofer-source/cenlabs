import {rankine, refrigeration} from './_dinamica-propiedades.js';

const G = 9.81;
const gamma = 1.4;

function bisect(lo, hi, residual) {
  const negative = residual(lo) < 0;
  for (let n = 0; n < 42; n++) {
    const mid = (lo + hi) / 2;
    if ((residual(mid) < 0) === negative) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function darcyFactor(re, roughness) {
  const turbulent = reynolds => .25 / Math.log10(roughness / 3.7 + 5.74 / reynolds ** .9) ** 2;
  if (re <= 2300) return 64 / re;
  if (re >= 4000) return turbulent(re);
  const fraction = (re - 2300) / 1700;
  return (1 - fraction) * 64 / 2300 + fraction * turbulent(4000);
}

const areaMach = m => (2 * (1 + .2 * m * m) / (gamma + 1)) ** 3 / m;
const staticRatio = m => (1 + .2 * m * m) ** -3.5;
const machAt = (ratio, supersonic) => ratio <= 1 + 1e-12 ? 1 : bisect(supersonic ? 1 : .00001, supersonic ? 8 : 1, m => areaMach(m) - ratio);
const jump = m => Math.sqrt((1 + .2 * m * m) / (1.4 * m * m - .2));
const shockPressure = m => 1 + 2 * gamma * (m * m - 1) / (gamma + 1);

const throat = .4;
let nozzleKey, nozzleState;

function nozzleCondition(exitArea, back) {
  const exitSub = machAt(exitArea, false);
  const exitSuper = machAt(exitArea, true);
  const chokePressure = staticRatio(exitSub);
  const exitShockPressure = staticRatio(exitSuper) * shockPressure(exitSuper);
  if (back >= chokePressure) {
    const outletMach = Math.sqrt(5 * (back ** (-2 / 7) - 1));
    const criticalArea = exitArea / areaMach(outletMach);
    return {criticalArea, exitMach: outletMach, shock: -1, regime: 0, totalRatio: 1};
  }
  if (back <= exitShockPressure) {
    return {criticalArea: 1, exitMach: exitSuper, shock: -1, regime: 2, totalRatio: 1};
  }
  function downstream(shockArea) {
    const before = machAt(shockArea, true);
    const after = jump(before);
    const criticalArea = shockArea / areaMach(after);
    const totalRatio = staticRatio(before) * shockPressure(before) / staticRatio(after);
    const exitMach = machAt(exitArea / criticalArea, false);
    return {criticalArea, exitMach, totalRatio, exitPressure: totalRatio * staticRatio(exitMach)};
  }
  const shockArea = bisect(1, exitArea, ar => downstream(ar).exitPressure - back);
  const shock = throat + (1 - throat) * Math.sqrt((shockArea - 1) / (exitArea - 1));
  const state = downstream(shockArea);
  return {criticalArea: state.criticalArea, exitMach: state.exitMach, shock, regime: 1, totalRatio: state.totalRatio};
}

export function nozzle(exitArea, back, x) {
  const key = exitArea + '/' + back;
  if (key !== nozzleKey) {
    nozzleState = nozzleCondition(exitArea, back);
    nozzleKey = key;
  }
  const {criticalArea, exitMach, shock, regime, totalRatio} = nozzleState;
  const area = x <= throat ? 1 + ((throat - x) / throat) ** 2 : 1 + (exitArea - 1) * ((x - throat) / (1 - throat)) ** 2;
  const upstream = regime === 2 || (regime === 1 && x <= shock);
  const mach = upstream ? machAt(area, x >= throat) : machAt(area / criticalArea, false);
  return {mach, pressure: staticRatio(mach) * (upstream ? 1 : totalRatio), exitMach, shock, regime};
}

export function solveThermal(id, a, b, time) {
  const u = time / 8;
  let m1, m2, m3, signal, reference, profile, flowProbe;
  let x = u;
  let y = 0;
  let theta = 2 * Math.PI * time / 2;
  if (id === 281) {
    const cr = b;
    const ntu = a;
    const exponent = Math.exp(-ntu * (1 - cr));
    const effectiveness = cr === 1 ? ntu / (1 + ntu) : (1 - exponent) / (1 - cr * exponent);
    const q = effectiveness * 60;
    m1 = effectiveness * 100;
    m2 = 80 - q;
    m3 = 20 + cr * q;
    const dq = cr === 1 ? q * u : q * (1 - Math.exp(-ntu * (1 - cr) * u)) / (1 - exponent);
    signal = 80 - dq;
    reference = m3 - cr * dq;
  } else if (id === 282) {
    const k = a;
    const h = b;
    const thickness = .003;
    const length = .085;
    const mL = length * Math.sqrt(2 * h / (k * thickness));
    m1 = 100 * Math.tanh(mL) / mL;
    m2 = 22 + 78 / Math.cosh(mL);
    m3 = 2 * h * .06 * length * 78 * m1 / 100;
    signal = 22 + 78 * Math.cosh(mL * (1 - u)) / Math.cosh(mL);
    reference = 22;
  } else if (id === 283 || id === 284) {
    [m1, m2, m3, profile] = (id === 283 ? rankine : refrigeration)[a + '/' + b];
    if (id === 283) {
      m1 *= 100;
      m2 *= 100;
    }
    const state = Math.min(3, Math.floor(u * 4));
    signal = profile[state];
    reference = profile[0];
  } else if (id === 285) {
    const valve = b;
    const rpmRatio = a / 1800;
    m1 = Math.sqrt((28 * rpmRatio ** 2 - 7) / (.027 + valve));
    m2 = 7 + valve * m1 ** 2;
    const npshAvailable = 6.5 - .005 * m1 ** 2;
    const npshRequired = 1.2 + .004 * m1 ** 2;
    m3 = npshAvailable - npshRequired;
    const headAtZero = 28 * rpmRatio ** 2;
    flowProbe = u * Math.sqrt(headAtZero / .027);
    signal = headAtZero - .027 * flowProbe ** 2;
    reference = 7 + valve * flowProbe ** 2;
    theta = time * a / 200;
  } else if (id === 286) {
    const velocity = a;
    const re = velocity * .04 / 1e-6;
    const f = darcyFactor(re, b);
    m1 = re;
    m2 = f;
    m3 = (f * 25 / .04 + 3) * velocity ** 2 / (2 * G);
    signal = 12 - m3 * u;
    reference = 12;
    x = u * velocity * 2;
  } else if (id === 287) {
    const speed = Math.sqrt(2 * G * a);
    const runner = b * speed;
    const flow = Math.PI * .014 ** 2 / 4 * speed;
    const force = 1000 * flow * (speed - runner) * (1 + .85 * Math.cos(Math.PI / 12));
    m1 = force * runner / 1000;
    m2 = 100 * force * runner / (.5 * 1000 * flow * speed ** 2);
    m3 = force;
    signal = speed - (1 + .85 * Math.cos(Math.PI / 12)) * (speed - runner) * u;
    reference = runner;
    theta = time * runner / 2;
  } else if (id === 288) {
    const inlet = 298;
    const exponent = .3 / 1.3;
    const ratio = a ** (1 / b);
    const stageExit = inlet * ratio ** exponent;
    m1 = b * 1.3 / .3 * .287 * (stageExit - inlet);
    m2 = stageExit - 273.15;
    m3 = 100 * (1 - m1 / (1.3 / .3 * .287 * inlet * (a ** exponent - 1)));
    const within = (u * b) % 1;
    signal = inlet * ratio ** (exponent * within) - 273.15;
    reference = inlet - 273.15;
  } else if (id === 289) {
    const inner = .008;
    const radius = inner + a / 1000;
    const k = .045;
    const resistance = r => Math.log(r / inner) / (2 * Math.PI * k) + 1 / (2 * Math.PI * r * b);
    m1 = 1000 * k / b;
    m2 = 58 / resistance(radius);
    m3 = 100 * (m2 * resistance(inner) / 58 - 1);
    signal = 58 / resistance(inner + u * .036);
    reference = 58 / resistance(inner);
    y = radius / .044;
  } else {
    const state = nozzle(a, b, u);
    m1 = state.exitMach;
    m2 = state.shock < 0 ? 0 : state.shock * 100;
    m3 = state.regime;
    signal = state.mach;
    reference = 1;
    y = state.shock;
  }
  return {m1, m2, m3, signal, reference, x, y, theta, profile, flowProbe, a, b};
}
