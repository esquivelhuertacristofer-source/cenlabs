export const updates = [1, 2, 4, 8];
const plcPeriod = 4;
const nextTick = (time, period, phase) => phase + Math.ceil((time - phase) / period) * period;
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const lcm = (a, b) => a * b / gcd(a, b);

export function schedule(io, updateIndex) {
  const pn = updates[updateIndex];
  if (!Number.isInteger(io) || io < 2 || pn === undefined) throw new RangeError('Ciclos inválidos');
  const horizon = lcm(lcm(io, pn), plcPeriod);
  let worst;
  for (let sample = 0; sample < horizon; sample += io) {
    const network = nextTick(sample + .25, pn, .5);
    const program = nextTick(network, plcPeriod, .75);
    const arrival = sample - io;
    const latency = program - arrival;
    if (!worst || latency > worst.latency) {
      worst = {latency, acquired: sample - arrival, sent: network - arrival, consumed: program - arrival};
    }
  }
  return {...worst, io, pn, plcPeriod, upperBound: io + .25 + pn + plcPeriod};
}
