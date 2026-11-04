import {simulatePid, sampleTime, duration} from './_control-avanzado-pid.js';
import {margins, openLoop} from './_control-avanzado-bode.js';
import {servoPoles} from './_control-avanzado-raices.js';
import {simulateCascade, cascadeStep} from './_control-avanzado-cascada.js';
import {exchange} from './_control-avanzado-modbus.js';
import {schedule} from './_control-avanzado-ciclo-io.js';
import {simulateDrive, driveStep} from './_control-avanzado-variador.js';
import {recordEncoder} from './_control-avanzado-encoder.js';
import {stopCycle, predict, history, alarm} from './_control-avanzado-diagnostico.js';
export const defaults = {
  291: {gain: 1, tracking: 0}, 292: {gain: 8, lead: 1}, 293: {gain: 10, lag: .35},
  294: {positionGain: 7, speedBandwidth: 4}, 295: {transport: 1, address: 105},
  296: {io: 9, updateIndex: 3}, 297: {ramp: 1000, limit: 2},
  298: {rpm: 1200, sampleRate: 500}, 299: {architecture: 1, fault: 1},
  300: {window: 50, interval: 5}
};
let predictionKey, predictionCache;
export function prediction(p) {
  const key = p.window + '/' + p.interval;
  if (predictionKey !== key) {
    predictionCache = predict(p.window, p.interval);
    predictionKey = key;
  }
  return predictionCache;
}
let cascadeKey, cascadeCache;
let driveKey, driveCache;
let encoderKey, encoderCache;
export function encoderTrial(p) {
  const key = p.rpm + '/' + p.sampleRate;
  if (encoderKey !== key) {
    encoderCache = recordEncoder(p.rpm, p.sampleRate);
    encoderKey = key;
  }
  return encoderCache;
}
export function driveTrial(p) {
  const key = p.ramp + '/' + p.limit;
  if (driveKey !== key) {
    driveCache = simulateDrive(p.ramp, p.limit);
    driveKey = key;
  }
  return driveCache;
}
export function cascadeTrial(p) {
  const key = p.positionGain + '/' + p.speedBandwidth;
  if (cascadeKey !== key) {
    cascadeCache = simulateCascade(p.positionGain, p.speedBandwidth);
    cascadeKey = key;
  }
  return cascadeCache;
}
let cachedKey, cachedTrial;
export function trial(p) {
  const key = p.gain + '/' + p.tracking;
  if (cachedKey !== key) {
    cachedTrial = simulatePid(p.gain, p.tracking);
    cachedKey = key;
  }
  return cachedTrial;
}
export function model(id, time, p) {
  if (id === 299) {
    const point = stopCycle(p.architecture, p.fault, time <= duration ? time : time % (duration + 2));
    return {...point, duration, signal: point.speed, reference: point.power};
  }
  if (id === 300) {
    const {day, rms} = history[Math.min(60, Math.floor((time <= duration ? time : time % (duration + 2)) * 60 / duration))];
    return {...prediction(p), day, rms, duration, angle: time * 4, signal: rms, reference: alarm};
  }
  if (id === 298) {
    const elapsed = time <= duration ? time : time % (duration + 2);
    const sample = encoderTrial(p).samples[Math.min(p.sampleRate, Math.floor(elapsed * p.sampleRate / 8))];
    return {...sample, duration, angle: sample.time * p.rpm * Math.PI / 30, signal: sample.counted, reference: sample.exact};
  }
  if (id === 297) {
    const elapsed = time <= duration ? time : time % (duration + 2);
    const samples = driveTrial(p).samples;
    const point = samples[Math.min(samples.length - 1, Math.floor(elapsed / driveStep))];
    return {...point, duration, signal: point.speedRpm, reference: point.target};
  }
  if (id === 296) {
    const event = schedule(p.io, p.updateIndex);
    const timeMs = time % 4 / 4 * (event.latency + 2);
    return {...event, duration, timeMs, signal: Number(timeMs >= event.consumed), reference: 1};
  }
  if (id === 295) {
    const message = exchange(p.transport, p.address);
    return {
      ...message, duration, phase: time % 4, requestBytes: message.request.length,
      responseBytes: message.response.length, address: p.address,
      signal: message.status, reference: 1
    };
  }
  if (id === 294) {
    const response = cascadeTrial(p);
    const elapsed = time <= duration ? time : time % (duration + 2);
    const point = response.samples[Math.min(response.samples.length - 1, Math.floor(elapsed / cascadeStep))];
    return {...point, duration, signal: point.angle, reference: point.target};
  }
  if (id === 293) {
    const poles = servoPoles(p.gain, p.lag);
    const elapsed = time <= duration ? time : time % (duration + 2);
    const angle = .005 * Math.exp(poles.real * Math.min(elapsed, duration)) * Math.cos(poles.imaginary * elapsed);
    return {...poles, duration, angle, signal: angle * 180 / Math.PI, reference: 0};
  }
  if (id === 292) {
    const result = margins(p.gain, p.lead);
    const angle = result.crossover * time;
    const phase = openLoop(result.crossover, p.gain, p.lead).phase;
    return {...result, duration, signal: Math.sin(angle + phase), reference: Math.sin(angle)};
  }
  const response = trial(p);
  const elapsed = time <= duration ? time : time % (duration + 2);
  const point = response.samples[Math.min(response.samples.length - 1, Math.floor(elapsed / sampleTime))];
  return {...point, duration, signal: point.speed * 100, reference: point.target * 100};
}
export function criteria(id, p) {
  if (id === 299) {
    const point = stopCycle(p.architecture, p.fault, 6);
    const checks = [
      {name: 'Fallo único inyectado', value: Number(point.welded), unit: '', ok: point.welded},
      {name: 'Potencia interrumpida', value: Number(point.cut), unit: '', ok: point.cut},
      {name: 'Rearme bloqueado', value: point.blocked, unit: '', ok: point.blocked === 1}
    ];
    return {checks, ok: checks.every(check => check.ok)};
  }
  if (id === 300) {
    const point = prediction(p);
    const checks = [
      {name: 'Tiempo hasta alarma', value: point.remaining, unit: 'd', ok: point.remaining >= 7 && point.remaining <= 12},
      {name: 'Muestras', value: point.count, unit: '', ok: point.count >= 5},
      {name: 'Residuo RMS', value: point.residual, unit: 'mm/s', ok: point.residual <= .11}
    ];
    return {checks, ok: checks.every(check => check.ok)};
  }
  if (id === 298) {
    const result = encoderTrial(p);
    const checks = [
      {name: 'Error de conteo', value: result.error, unit: 'cuentas', ok: result.error === 0},
      {name: 'Saltos inválidos', value: result.invalid, unit: '', ok: result.invalid === 0},
      {name: 'Velocidad de trabajo', value: p.rpm, unit: 'rpm', ok: p.rpm >= 900 && p.rpm <= 1300},
      {name: 'Presupuesto de muestreo', value: p.sampleRate, unit: 'Hz', ok: p.sampleRate <= 1700}
    ];
    return {checks, ok: checks.every(check => check.ok)};
  }
  if (id === 297) {
    const result = driveTrial(p);
    const checks = [
      {name: 'Error máximo de seguimiento', value: result.maxError, unit: 'rpm', ok: result.maxError <= 65},
      {name: 'Corriente pico', value: result.peak, unit: 'A', ok: result.peak <= 4.5},
      {name: 'Tiempo hasta ±20 rpm', value: result.stop, unit: 's', ok: result.stop <= 2.2}
    ];
    return {checks, ok: checks.every(check => check.ok)};
  }
  if (id === 296) {
    const event = schedule(p.io, p.updateIndex);
    const checks = [
      {name: 'Latencia máxima', value: event.latency, unit: 'ms', ok: event.latency <= 10},
      {name: 'Periodo IO-Link', value: p.io, unit: 'ms', ok: p.io >= 3 && p.io <= 6},
      {name: 'Actualización PROFINET', value: event.pn, unit: 'ms', ok: event.pn >= 2 && event.pn <= 4}
    ];
    return {checks, ok: checks.every(check => check.ok)};
  }
  if (id === 295) {
    const result = exchange(p.transport, p.address);
    const checks = [
      {name: 'Transporte TCP', value: p.transport === 2 ? 1 : 0, unit: '', ok: p.transport === 2},
      {name: 'Dirección de inicio', value: p.address, unit: '', ok: p.address === 107},
      {name: 'Registros recibidos', value: result.registers.length, unit: '', ok: result.registers.length === 3}
    ];
    return {checks, ok: checks.every(check => check.ok)};
  }
  if (id === 294) {
    const response = cascadeTrial(p);
    const checks = [
      {name: 'Separación de lazos', value: response.separation, unit: '', ok: response.separation >= 3},
      {name: 'Sobreimpulso', value: response.overshoot, unit: 'rad', ok: response.overshoot <= .03},
      {name: 'Error bajo carga', value: response.finalError, unit: 'rad', ok: response.finalError <= .018},
      {name: 'Pico de corriente', value: response.peakCurrent, unit: 'A', ok: response.peakCurrent <= 3}
    ];
    return {checks, ok: checks.every(check => check.ok)};
  }
  if (id === 293) {
    const poles = servoPoles(p.gain, p.lag);
    const checks = [
      {name: 'Amortiguamiento', value: poles.damping, unit: '', ok: poles.damping >= .2},
      {name: 'Caída al 5 %', value: poles.decayTime, unit: 's', ok: poles.decayTime <= 4},
      {name: 'Frecuencia amortiguada', value: poles.imaginary, unit: 'rad/s', ok: poles.imaginary >= 3 && poles.imaginary <= 8}
    ];
    return {checks, ok: checks.every(check => check.ok)};
  }
  if (id === 292) {
    const result = margins(p.gain, p.lead);
    const checks = [
      {name: 'Margen de fase', value: result.phaseMargin, unit: '°', ok: result.phaseMargin >= 45 && result.phaseMargin <= 70},
      {name: 'Margen de ganancia', value: result.gainMargin, unit: 'dB', ok: result.gainMargin >= 8},
      {name: 'Frecuencia de cruce', value: result.crossover, unit: 'rad/s', ok: result.crossover >= 4.5}
    ];
    return {checks, ok: checks.every(check => check.ok)};
  }
  const response = trial(p);
  const checks = [
    {name: 'Recuperación', value: response.recovery, unit: 's', ok: response.recovery <= 1.8},
    {name: 'Error final', value: response.tailError * 100, unit: 'puntos', ok: response.tailError <= .01},
    {name: 'Factor Z–N', value: p.gain, unit: '', ok: p.gain >= .6 && p.gain <= 1.2}
  ];
  return {checks, ok: checks.every(check => check.ok)};
}
