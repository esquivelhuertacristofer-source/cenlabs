const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));
export const cascadeStep = .002;
export const cascadeDuration = 8;
export function simulateCascade(positionGain, speedBandwidth, dt = cascadeStep) {
  const inertia = .02, friction = .055, torqueConstant = .22, currentBandwidth = 60;
  const target = 1.3, currentLimit = 3, speedLimit = 4;
  const alpha = Math.exp(-currentBandwidth * dt);
  let angle = 0, speed = 0, current = 0;
  let peakCurrent = 0, overshoot = 0, settling = 0, finalError = 0;
  const samples = [];
  for (let n = 0; n <= Math.round(cascadeDuration / dt); n++) {
    const time = n * dt;
    const load = time < 2 ? 0 : .012;
    const speedTarget = clamp(positionGain * (target - angle), speedLimit);
    const currentTarget = clamp((friction * speed + inertia * speedBandwidth * (speedTarget - speed)) / torqueConstant, currentLimit);
    samples.push({time, target, angle, speed, speedTarget, current, currentTarget, load});
    overshoot = Math.max(overshoot, angle - target);
    peakCurrent = Math.max(peakCurrent, Math.abs(current));
    if (time >= 2 && Math.abs(target - angle) > .03) settling = time - 2 + dt;
    if (time >= 7) finalError = Math.max(finalError, Math.abs(target - angle));
    current = currentTarget + (current - currentTarget) * alpha;
    speed += dt * (torqueConstant * current - friction * speed - load) / inertia;
    angle += dt * speed;
  }
  return {samples, peakCurrent, overshoot, settling, finalError, separation: speedBandwidth / positionGain};
}
