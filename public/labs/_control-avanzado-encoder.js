export const countsPerTurn = 64;
const quadrature = [0, 2, 3, 1];
const modulo = (value, base) => (value % base + base) % base;
export const gray = sector => sector ^ (sector >>> 1);
export const channel = sector => quadrature[modulo(sector, 4)];
export function grayDecode(code) {
  let value = 0;
  for (let shifted = code; shifted; shifted >>>= 1) value ^= shifted;
  return value;
}
export function recordEncoder(rpm, sampleRate) {
  const samples = [];
  let previous = 0, counted = 0, invalid = 0;
  for (let i = 0; i <= sampleRate; i++) {
    const time = i / sampleRate;
    const exact = Math.floor(i * rpm * countsPerTurn / (sampleRate * 60));
    const index = modulo(exact, countsPerTurn);
    const transition = modulo(index - previous, 4);
    if (transition === 1) counted++;
    if (transition === 3) counted--;
    if (transition === 2) invalid++;
    previous = index;
    samples.push({time, exact, counted, invalid, absolute: grayDecode(gray(index)), code: gray(index), channels: channel(index)});
  }
  return {samples, error: counted - samples.at(-1).exact, invalid, edgeRate: Math.abs(rpm) * countsPerTurn / 60};
}
