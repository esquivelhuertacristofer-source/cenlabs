export function servoPoles(gain, lag) {
  const radius = Math.cbrt(gain);
  const realPole = (-radius - 1) / lag;
  const real = (radius / 2 - 1) / lag;
  const imaginary = Math.sqrt(3) * radius / (2 * lag);
  const damping = -real / Math.hypot(real, imaginary);
  const decayTime = real < 0 ? Math.log(20) / -real : Infinity;
  return {realPole, real, imaginary, damping, decayTime};
}
