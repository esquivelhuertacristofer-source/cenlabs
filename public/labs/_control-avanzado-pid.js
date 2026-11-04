export const ultimateGain = 8;
export const ultimatePeriod = 2 * Math.PI * 0.25 / Math.sqrt(3);
export const sampleTime = 0.005;
export const duration = 8;

export function simulatePid(gain, tracking, dt = sampleTime) {
  const kp = 0.6 * ultimateGain * gain;
  const ki = kp / (ultimatePeriod / 2);
  const kd = kp * ultimatePeriod / 8;
  const decay = Math.exp(-dt / 0.25);
  const step = dt / 0.25;
  let first = 0, second = 0, speed = 0, integral = 0, angle = 0;
  let excess = 0, tailError = 0, saturation = 0, recovery = 0;
  const samples = [];
  for (let index = 0; index <= Math.round(duration / dt); index++) {
    const time = index * dt;
    const target = time < 2.5 ? 1.4 : 0.55;
    const error = target - speed;
    const command = kp * error + integral - kd * (second - speed) / 0.25;
    const voltage = Math.min(1, Math.max(0, command));
    samples.push({ time, target, speed, command, voltage, integral, angle });
    if (time >= 2.5) {
      excess = Math.max(excess, speed - target);
      if (Math.abs(error) > 0.03) recovery = time - 2.5 + dt;
    }
    if (time >= 7) tailError = Math.max(tailError, Math.abs(error));
    if (index === Math.round(duration / dt)) break;
    if (voltage !== command) saturation += dt;
    integral += dt * (ki * error + tracking * (voltage - command));
    // Exact zero-order hold of the three equal lags for each applied command.
    angle += dt * speed * 2 * Math.PI;
    speed = voltage + decay * (speed - voltage + step * (second - voltage) + step ** 2 / 2 * (first - voltage));
    second = voltage + decay * (second - voltage + step * (first - voltage));
    first = voltage + decay * (first - voltage);
  }
  return { samples, recovery, excess, tailError, saturation, kp, ki, kd };
}
