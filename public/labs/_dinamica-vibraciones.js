const TAU = 2 * Math.PI;
const G = 9.81;
const wheelMean = 150 * TAU / 60;
const wheelSteps = 256;
let wheelRatio, wheelAngles;

function integrateWheel(phase, ratio) {
  if (ratio !== wheelRatio) {
    wheelAngles = new Float64Array(wheelSteps + 1);
    const step = TAU / wheelSteps;
    let previous = 1;
    for (let i = 1; i <= wheelSteps; i++) {
      const speed = Math.sqrt(1 + ratio * Math.sin(i * step));
      wheelAngles[i] = wheelAngles[i - 1] + step * (speed + previous) / 2;
      previous = speed;
    }
    wheelRatio = ratio;
  }
  const cycles = Math.floor(phase / TAU);
  const stepIndex = (phase % TAU) / TAU * wheelSteps;
  const i = Math.min(wheelSteps - 1, Math.floor(stepIndex));
  return cycles * wheelAngles[wheelSteps] + wheelAngles[i] + (stepIndex - i) * (wheelAngles[i + 1] - wheelAngles[i]);
}

function free(mass, damping, stiffness, time) {
  const natural = Math.sqrt(stiffness / mass);
  const decay = damping / (2 * mass);
  const ratio = decay / natural;
  const discriminant = natural ** 2 - decay ** 2;
  let x;
  if (Math.abs(discriminant) < 1e-9) {
    x = (1 + decay * time) * Math.exp(-decay * time);
  } else if (discriminant > 0) {
    const wd = Math.sqrt(discriminant);
    x = Math.exp(-decay * time) * (Math.cos(wd * time) + decay / wd * Math.sin(wd * time));
  } else {
    const gap = Math.sqrt(-discriminant);
    x = ((decay + gap) * Math.exp((-decay + gap) * time) - (decay - gap) * Math.exp((-decay - gap) * time)) / (2 * gap);
  }
  return {x, natural, ratio};
}

function forced(frequency, ratio) {
  const gain = 1 / Math.hypot(1 - frequency ** 2, 2 * ratio * frequency);
  return {gain, phase: Math.atan2(2 * ratio * frequency, 1 - frequency ** 2), transmit: gain * Math.hypot(1, 2 * ratio * frequency)};
}

export function cantileverShape(beta, fraction) {
  const sigma = (Math.cosh(beta) + Math.cos(beta)) / (Math.sinh(beta) + Math.sin(beta));
  const p = beta * fraction;
  return Math.cosh(p) - Math.cos(p) - sigma * (Math.sinh(p) - Math.sin(p));
}

export function solveVibration(id, a, b, t) {
  if (id === 271) {
    const {x, natural, ratio} = free(a, b, 100, t);
    return {signal: 50 * x, reference: 0, x, y: 0, theta: 0, m1: natural / TAU, m2: ratio, m3: 50 * x};
  }
  if (id === 272) {
    const {gain, transmit, phase} = forced(a, b);
    const theta = TAU * a * t;
    const x = gain * Math.sin(theta - phase);
    return {signal: x, reference: Math.sin(theta), x: x / 3, y: 0, theta, m1: gain, m2: transmit, m3: phase * 180 / Math.PI};
  }
  if (id === 273) {
    const ratio = a / 1500;
    const spin = b * ratio;
    const roots = Math.hypot(2, spin);
    const forward = (roots + spin) / 2;
    const backward = (roots - spin) / 2;
    const amplitude = .15 * ratio ** 2 * forced(ratio / forward, .07).gain;
    const theta = t * a * TAU / 600;
    const x = amplitude * Math.cos(theta);
    const y = amplitude * Math.sin(theta);
    return {signal: x, reference: y, x, y, theta, m1: amplitude, m2: 1500 * forward, m3: 1500 * backward};
  }
  if (id === 274) {
    const ratio = a;
    const mass = b;
    const absorber = mass * ratio ** 2;
    const real = -absorber * mass;
    const imaginary = .10 * (absorber - mass);
    const den = real ** 2 + imaginary ** 2;
    const theta = TAU * t;
    const main = (absorber - mass) * (real * Math.cos(theta) + imaginary * Math.sin(theta)) / den;
    const secondary = absorber * (real * Math.cos(theta) + imaginary * Math.sin(theta)) / den;
    return {signal: main, reference: secondary, x: main / 10, y: secondary / 10, theta, m1: Math.abs(absorber - mass) / Math.sqrt(den), m2: absorber / Math.sqrt(den), m3: mass};
  }
  if (id === 275) {
    const omega = a * TAU / 60;
    const crank = omega * t / 20;
    const phases = [0, Math.PI, Math.PI + b * Math.PI / 180, b * Math.PI / 180];
    const harmonics = order => {
      const real = phases.reduce((sum, phase) => sum + Math.cos(order * phase), 0);
      const imaginary = phases.reduce((sum, phase) => sum + Math.sin(order * phase), 0);
      return {real, imaginary, amplitude: Math.hypot(real, imaginary)};
    };
    const first = harmonics(1);
    const second = harmonics(2);
    const force = .45 * .045 * omega ** 2;
    const firstNow = force * (first.real * Math.cos(crank) - first.imaginary * Math.sin(crank));
    const secondNow = .3 * force * (second.real * Math.cos(2 * crank) - second.imaginary * Math.sin(2 * crank));
    return {signal: firstNow + secondNow, reference: secondNow, x: 0, y: 0, theta: crank, phase: b * Math.PI / 180, m1: force * first.amplitude, m2: .3 * force * second.amplitude, m3: a};
  }
  if (id === 276) {
    const natural = Math.sqrt(a * 1000 / 48);
    const ratio = TAU * 12 / natural;
    const response = forced(ratio, b);
    const theta = TAU * 1.2 * t;
    const x = response.transmit * Math.sin(theta - response.phase + Math.atan2(2 * b * ratio, 1));
    return {signal: x, reference: Math.sin(theta), x: response.gain * Math.sin(theta - response.phase) / 3, y: 0, theta, m1: response.transmit, m2: 48 * G / a, m3: natural / TAU};
  }
  if (id === 277) {
    const beta = [1.875104, 4.694091, 7.854757][b - 1];
    const omega = beta ** 2 / a ** 2 * Math.sqrt(200e9 * .012 ** 2 / (12 * 7850));
    const theta = TAU * t / 2;
    return {signal: Math.sin(theta), reference: 0, x: 0, y: Math.sin(theta), theta, beta, m1: omega / TAU, m2: a, m3: b};
  }
  if (id === 278) {
    const theta = TAU * 1.1 * t;
    const ratio = b / a;
    const orbit = Math.min(1, ratio);
    const x = orbit * Math.cos(theta);
    const y = orbit * Math.sin(theta);
    return {signal: x * a, reference: y * a, x, y, theta, m1: a, m2: orbit * a, m3: a - b};
  }
  if (id === 279) {
    const cycle = Math.min(t, 8);
    const strike = 2;
    const speed = Math.sqrt(2 * G * a);
    const after = Math.max(0, (cycle - strike) / 3);
    const height = cycle < strike ? a * (1 - (cycle / strike) ** 2) : Math.max(0, b * speed * after - G * after ** 2 / 2);
    return {signal: height, reference: b ** 2 * a, x: 0, y: height, theta: 0, m1: speed, m2: b ** 2 * a, m3: 2 * G * a * (1 - b ** 2)};
  }
  const mean = wheelMean;
  const phase = t * mean / 5;
  const max = Math.sqrt(mean ** 2 + b / a);
  const min = Math.sqrt(mean ** 2 - b / a);
  const omega = Math.sqrt(mean ** 2 + b / a * Math.sin(phase));
  const theta = integrateWheel(phase, b / a / mean ** 2);
  return {signal: omega, reference: mean, x: 0, y: 0, theta, inertia: a, m1: 100 * (max - min) / mean, m2: .5 * a * mean ** 2, m3: (max - min) * 60 / TAU};
}
