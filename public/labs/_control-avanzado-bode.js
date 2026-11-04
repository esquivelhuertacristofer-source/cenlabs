const degrees = radians => radians * 180 / Math.PI;

export function openLoop(frequency, gain, lead) {
  const x = frequency / 4;
  const magnitude = gain / ((1 + x * x) * Math.hypot(1, x / lead));
  const phase = -2 * Math.atan(x) - Math.atan(x / lead);
  return {magnitude, phase, db: 20 * Math.log10(magnitude)};
}

export function margins(gain, lead) {
  if (!(gain > 1 && lead >= 1)) throw new RangeError('El banco requiere K > 1 y adelanto ≥ 1');
  let low = 0, high = 4 * Math.sqrt(gain);
  for (let index = 0; index < 55; index++) {
    const midpoint = (low + high) / 2;
    if (openLoop(midpoint, gain, lead).magnitude > 1) low = midpoint;
    else high = midpoint;
  }
  const crossover = (low + high) / 2;
  // At phase -π the imaginary part of (1+jx)^2(1+jx/lead) is zero.
  const phaseCrossover = 4 * Math.sqrt(1 + 2 * lead);
  return {
    crossover,
    phaseMargin: 180 + degrees(openLoop(crossover, gain, lead).phase),
    gainMargin: -openLoop(phaseCrossover, gain, lead).db,
    phaseCrossover
  };
}
