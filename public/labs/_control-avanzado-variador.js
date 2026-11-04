export const driveStep = .005;
const rpm = 60 / (2 * Math.PI);

export function simulateDrive(ramp, limit, dt = driveStep) {
  const inertia = .008, drag = .004, torqueConstant = .30;
  const samples = [];
  let speed = 0, angle = 0, peak = 0, maxError = 0, stop = 0;
  for (let n = 0; n <= Math.round(8 / dt); n++) {
    const time = n * dt;
    const target = time < 5.5 ? Math.min(1200, Math.max(0, time - .5) * ramp) : Math.max(0, 1200 - (time - 5.5) * ramp);
    const slope = time >= .5 && time < 5.5 && target < 1200 ? ramp : time >= 5.5 && target > 0 ? -ramp : 0;
    const requested = (drag * speed + inertia * (slope / rpm + 8 * (target / rpm - speed))) / torqueConstant;
    const current = Math.max(-limit, Math.min(limit, requested));
    const speedRpm = speed * rpm;
    samples.push({time, target, speedRpm, current, requested, angle, limited: Number(current !== requested)});
    peak = Math.max(peak, Math.abs(current));
    maxError = Math.max(maxError, Math.abs(target - speedRpm));
    if (time >= 5.5 && Math.abs(speedRpm) > 20) stop = time - 5.5 + dt;
    speed += dt * (torqueConstant * current - drag * speed) / inertia;
    angle += dt * speed / 20;
  }
  return {samples, peak, maxError, stop};
}
