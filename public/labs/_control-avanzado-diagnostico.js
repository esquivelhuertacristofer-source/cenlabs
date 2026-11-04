export function stopCycle(architecture, fault, time) {
  const stop = time >= 2;
  const reset = time >= 5;
  const redundant = architecture > 1;
  const welded = fault === 1 || (fault === 2 && redundant);
  const blocked = architecture === 3 && welded;
  const coil = !stop || (time >= 7 && !blocked);
  const k1 = coil || fault === 1;
  const k2 = redundant && (coil || fault === 2);
  const power = k1 && (!redundant || k2);
  const cut = redundant || fault !== 1;
  const deceleration = t => Math.exp(-t / .62);
  const speed = !cut || !stop ? 1 : power ? 1 - (1 - deceleration(5)) * deceleration(time - 7) : deceleration(time - 2);
  const angle = 4 * (!stop || !cut ? time : 2 + .62 * (1 - deceleration(Math.min(time - 2, power ? 5 : Infinity)))
    + (power ? time - 7 - .62 * (1 - deceleration(5)) * (1 - deceleration(time - 7)) : 0));
  return {k1: Number(k1), k2: Number(k2), power: Number(power), speed, angle, blocked: Number(reset && blocked), cut, welded, reset};
}

export const examplePfh = 4e-8 + 8e-8 + 2e-7;

export const alarm = 4.5;
export const currentDay = 60;
export const history = Array.from({length: currentDay + 1}, (_, day) => ({
  day,
  rms: 1.15 + .007 * day + .00165 * Math.max(0, day - 24) ** 2
    + .075 * Math.sin(1.1 * day) + .04 * Math.cos(.37 * day)
}));

export function predict(window, interval) {
  const samples = history.slice(-window);
  const points = samples.filter(({day}) => (currentDay - day) % interval === 0);
  const count = points.length;
  const xMean = points.reduce((sum, p) => sum + p.day, 0) / count;
  const yMean = points.reduce((sum, p) => sum + p.rms, 0) / count;
  const xx = points.reduce((sum, p) => sum + (p.day - xMean) ** 2, 0);
  const xy = points.reduce((sum, p) => sum + (p.day - xMean) * (p.rms - yMean), 0);
  const slope = xy / xx;
  const intercept = yMean - slope * xMean;
  const residual = Math.sqrt(points.reduce((sum, p) => sum + (p.rms - intercept - slope * p.day) ** 2, 0) / count);
  const remaining = Math.max(0, (alarm - intercept) / slope - currentDay);
  return {points, count, slope, intercept, residual, remaining};
}
