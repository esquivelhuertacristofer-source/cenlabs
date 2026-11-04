import {launch as workOrder} from './_industria-runtime.js';
import {definitions} from './_control-avanzado-definiciones.js';
import {duration} from './_control-avanzado-pid.js';
import {openLoop, margins} from './_control-avanzado-bode.js';
import {servoPoles} from './_control-avanzado-raices.js';
import {defaults, model, criteria, trial, cascadeTrial, driveTrial, encoderTrial} from './_control-avanzado-modelos.js';
import {build, update} from './_control-avanzado-escenas.js';
import {preciseFraming} from './_elementos-encuadre.js';
import {stopCycle, examplePfh, history, currentDay, alarm} from './_control-avanzado-diagnostico.js';
import {prediction} from './_control-avanzado-modelos.js';
import {attachReviewCursor} from './_banco-revision-ensayo.js';

function drawBode(ctx, width, height, p, view) {
  const result = margins(p.gain, p.lead);
  if (view === 'peak') {
    [`Margen de fase: ${result.phaseMargin.toFixed(1)}°`,
     `Margen de ganancia: ${result.gainMargin.toFixed(1)} dB`,
     `Cruce de magnitud: ${result.crossover.toFixed(2)} rad/s`,
     `Cruce de fase: ${result.phaseCrossover.toFixed(2)} rad/s`]
      .forEach((row, i) => ctx.fillText(row, 12, 26 + 30 * i));
    return;
  }
  const phase = view === 'low';
  const left = 44, right = width - 20, top = 36, bottom = height - 27;
  const x = frequency => left + (right - left) * Math.log(frequency / .5) / Math.log(128);
  const y = value => top + (bottom - top) * (phase ? -value / 270 : (25 - value) / 100);
  ctx.fillText(phase ? 'Fase (°) · referencia −180°' : 'Magnitud (dB) · referencia 0 dB', 12, 20, width - 24);
  const reference = y(phase ? -180 : 0);
  ctx.strokeStyle = '#a88e68';
  ctx.beginPath();
  ctx.moveTo(left, reference);
  ctx.lineTo(right, reference);
  ctx.stroke();
  ctx.strokeStyle = '#7ee4d7';
  ctx.beginPath();
  for (let i = 0; i <= 160; i++) {
    const frequency = .5 * 128 ** (i / 160);
    const response = openLoop(frequency, p.gain, p.lead);
    const value = phase ? response.phase * 180 / Math.PI : response.db;
    if (i === 0) ctx.moveTo(x(frequency), y(value));
    else ctx.lineTo(x(frequency), y(value));
  }
  ctx.stroke();
  const crossing = phase ? result.phaseCrossover : result.crossover;
  ctx.fillStyle = '#ebbd7f';
  ctx.beginPath();
  ctx.arc(x(crossing), reference, 4, 0, 2 * Math.PI);
  ctx.fill();
  for (const tick of [.5, 2, 8, 32, 64]) ctx.fillText(String(tick), x(tick) - 6, height - 10);
}

function drawRoots(ctx, width, height, p, view) {
  const poles = servoPoles(p.gain, p.lag);
  const left = 35, right = width - 16, top = 38, bottom = height - 26;
  if (view === 'peak') {
    const rows = [
      `Polo real: ${poles.realPole.toFixed(2)} s⁻¹`,
      `Par: ${poles.real.toFixed(2)} ± j${poles.imaginary.toFixed(2)} s⁻¹`,
      `Amortiguamiento: ${poles.damping.toFixed(3)}`,
      Number.isFinite(poles.decayTime) ? `Caída al 5 %: ${poles.decayTime.toFixed(2)} s` : 'La envolvente no decae.'
    ];
    rows.forEach((row, i) => ctx.fillText(row, 12, 26 + 30 * i));
    return;
  }
  const waveform = view === 'low';
  const maxReal = 1.15 / p.lag;
  const minReal = -3.55 / p.lag;
  const maxImaginary = 2.12 / p.lag;
  const extent = .005 * Math.exp(8 * Math.max(poles.real, 0));
  const x = value => waveform ? left + (right - left) * value / 8 : left + (right - left) * (value - minReal) / (maxReal - minReal);
  const y = value => (bottom + top) / 2 - (bottom - top) * value / (2 * (waveform ? extent : maxImaginary));
  ctx.fillText(waveform ? 'Perturbación y envolvente · 0 a 8 s' : 'Lugar de raíces · Re(s) horizontal e Im(s) vertical', 12, 20, width - 24);
  ctx.strokeStyle = '#5b7483';
  ctx.beginPath();
  ctx.moveTo(left, y(0)); ctx.lineTo(right, y(0));
  if (!waveform) {ctx.moveTo(x(0), top); ctx.lineTo(x(0), bottom);}
  ctx.stroke();
  for (const branch of [0, 1, -1]) {
    ctx.strokeStyle = branch === 0 ? '#7ee4d7' : '#a7b8d0';
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const t = 8 * i / 120;
      const root = waveform ? poles : servoPoles(12 * i / 120, p.lag);
      const re = waveform ? t : branch === 0 ? root.realPole : root.real;
      const im = waveform
        ? .005 * Math.exp(root.real * t) * (branch === 0 ? Math.cos(root.imaginary * t) : branch)
        : branch * root.imaginary;
      if (i === 0) ctx.moveTo(x(re), y(im));
      else ctx.lineTo(x(re), y(im));
    }
    ctx.stroke();
  }
  if (!waveform) {
    ctx.fillStyle = '#ebbd7f';
    for (const [re, im] of [[poles.realPole, 0], [poles.real, poles.imaginary], [poles.real, -poles.imaginary]]) {
      ctx.beginPath(); ctx.arc(x(re), y(im), 4, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.fillText('0', x(0) - 3, height - 9);
  }
}
function drawTimedSignals(ctx, width, height, samples, traces, units, marker, markerLabel) {
  const values = samples.flatMap(sample => traces.map(field => sample[field]));
  const minimum = Math.min(0, ...values), maximum = Math.max(1, ...values);
  const x = t => 33 + (width - 50) * t / 8;
  const y = value => height - 26 - (height - 65) * (value - minimum) / (maximum - minimum);
  ctx.fillText(units + ' · solicitada dorada y medida verde', 12, 20, width - 24);
  ctx.strokeStyle = '#6b7b86';
  ctx.beginPath();
  ctx.moveTo(x(marker), 35); ctx.lineTo(x(marker), height - 26); ctx.stroke();
  traces.forEach((field, index) => {
    ctx.strokeStyle = index ? '#7ee4d7' : '#ebbd7f';
    ctx.beginPath();
    samples.forEach((sample, i) => {
      if (i === 0) ctx.moveTo(x(sample.time), y(sample[field]));
      else ctx.lineTo(x(sample.time), y(sample[field]));
    });
    ctx.stroke();
  });
  ctx.fillText('0 s', x(0), height - 9);
  ctx.fillText(markerLabel, x(marker) - 10, height - 9);
  ctx.fillText('8 s', x(8) - 18, height - 9);
}
function drawCascade(ctx, width, height, p, view) {
  const {samples} = cascadeTrial(p);
  const traces = view === 'low' ? ['speedTarget', 'speed'] : view === 'peak' ? ['currentTarget', 'current'] : ['target', 'angle'];
  const units = view === 'low' ? 'Velocidad (rad/s)' : view === 'peak' ? 'Corriente (A)' : 'Posición (rad)';
  drawTimedSignals(ctx, width, height, samples, traces, units, 2, 'Carga a 2 s');
}
function drawDrive(ctx, width, height, p, view) {
  const result = driveTrial(p);
  if (view === 'peak') {
    [`Pico: ${result.peak.toFixed(2)} A`, `Error máximo: ${result.maxError.toFixed(1)} rpm`, `Parada: ${result.stop.toFixed(2)} s`]
      .forEach((row, i) => ctx.fillText(row, 12, 26 + 31 * i));
    return;
  }
  const current = view === 'low';
  drawTimedSignals(ctx, width, height, result.samples, current ? ['requested','current'] : ['target','speedRpm'],
    current ? 'Corriente (A)' : 'Velocidad (rpm)', 5.5, 'Parada a 5,5 s');
}
function drawModbus(ctx, width, point, view) {
  const hex = bytes => bytes.map(byte => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  const dump = (label, bytes, top) => {
    ctx.fillText(label, 12, top, width - 24);
    for (let i = 0; i < bytes.length; i += 8) {
      ctx.fillText(hex(bytes.slice(i, i + 8)), 12, top + 22 + 18 * (i / 8));
    }
  };
  if (view === 'peak') {
    const status = point.status === 1 ? 'Lectura correcta' : point.status === 0 ? 'Excepción 02 · dirección ilegal' : 'CRC incorrecto · sin respuesta';
    ctx.fillText(status, 12, 25, width - 24);
    point.registers.forEach((value, i) => ctx.fillText('Registro ' + (point.address + i) + ': ' + value, 12, 57 + 27 * i));
    return;
  }
  dump('Petición (hexadecimal)', point.request, 22);
  dump(point.response.length ? 'Respuesta (hexadecimal)' : 'Sin respuesta por descarte de trama', point.response, 104);
}
function drawTiming(ctx, width, point, view) {
  const rows = [['Captura IO-Link', point.acquired], ['Actualización PN', point.sent], ['Lectura de programa', point.consumed]];
  ctx.fillText(view === 'peak' ? 'Eventos en milisegundos' : 'Espera acumulada desde el evento físico', 12, 21, width - 24);
  rows.forEach(([label, value], i) => {
    const y = 50 + i * 40;
    ctx.fillStyle = '#d7e8ee';
    ctx.fillText(label + ' · ' + value.toFixed(2) + ' ms', 12, y, width - 24);
    if (view !== 'peak') {
      ctx.fillStyle = i === 2 ? '#7ee4d7' : '#95b7d7';
      ctx.fillRect(12, y + 6, (width - 24) * value / point.upperBound, 6);
    }
  });
  ctx.fillStyle = '#d7e8ee';
  ctx.fillText('Cota por periodos: ' + point.upperBound.toFixed(2) + ' ms', 12, 178);
}
function drawEncoder(ctx, width, height, p, view) {
  const record = encoderTrial(p);
  const final = record.samples.at(-1);
  if (view === 'peak') {
    const rows = [
      'Flancos por segundo: ' + record.edgeRate.toFixed(1),
      'Error de conteo: ' + record.error,
      'Saltos inválidos: ' + record.invalid,
      'Gray final: ' + final.code.toString(2).padStart(6,'0') + '  ·  sector ' + final.absolute
    ];
    rows.forEach((row, i) => ctx.fillText(row, 12, 26 + 30 * i, width - 24));
    return;
  }
  const window = view === 'low' ? record.samples.slice(0, 22) : record.samples;
  const max = Math.max(1, final.exact);
  ctx.fillText(view === 'low' ? 'Primeras muestras · A verde, B dorado' : 'Cuentas · referencia dorada y medida verde', 12, 21, width - 24);
  const traces = view === 'low' ? [0, 1] : ['exact', 'counted'];
  traces.forEach((field, index) => {
    ctx.strokeStyle = index ? '#7ee4d7' : '#ebbd7f';
    ctx.beginPath();
    window.forEach((sample, i) => {
      const x = 25 + (width - 42) * i / (window.length - 1);
      const y = view === 'low' ? 143 - 66 * index - 26 * ((sample.channels >>> field) & 1)
        : height - 23 - (height - 65) * sample[field] / max;
      if (i === 0) ctx.moveTo(x, y);
      else {
        if (view === 'low') ctx.lineTo(x, 143 - 66 * index - 26 * ((window[i-1].channels >>> field) & 1));
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  });
}
function drawInstrument(ctx, width, height, id, point, p, ready, view) {
  ctx.clearRect(0, 0, width, height);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#d7e8ee';
  if (!ready) {
    ctx.fillText('Ensaya el ajuste para registrar sus señales.', 12, 22);
    return;
  }
  if (id === 292) return drawBode(ctx, width, height, p, view);
  if (id === 293) return drawRoots(ctx, width, height, p, view);
  if (id === 294) return drawCascade(ctx, width, height, p, view);
  if (id === 295) return drawModbus(ctx, width, point, view);
  if (id === 296) return drawTiming(ctx, width, point, view);
  if (id === 297) return drawDrive(ctx, width, height, p, view);
  if (id === 298) return drawEncoder(ctx, width, height, p, view);
  if (id === 299) {
    if (view === 'peak') {
      const end = stopCycle(p.architecture, p.fault, 7.5);
      ['Paro a 2 s · rearme a 5 s · marcha a 7 s',
        end.cut ? 'La alimentación se interrumpió.' : 'La alimentación siguió presente.',
        end.blocked ? 'EDM bloqueó el rearme.' : 'No se bloqueó el rearme.',
        'Ejemplo PFHᴅ: ' + examplePfh.toExponential(1) + ' h⁻¹ · banda d'
      ].forEach((line, i) => ctx.fillText(line, 12, 25 + 24 * i, width - 24));
      return;
    }
    const samples = Array.from({length: 161}, (_, i) => ({time: i / 20, ...stopCycle(p.architecture, p.fault, i / 20)}));
    return drawTimedSignals(ctx, width, height, samples,
      view === 'low' ? [['k1', '#ebbd7f'], ['k2', '#7ee4d7']] : [['power', '#ebbd7f'], ['speed', '#7ee4d7']],
      view === 'low' ? 'K1 (dorado) / K2 (verde)' : 'Potencia (dorado) / velocidad (verde)', 2, 'Paro');
  }
  if (id === 300) {
    const fit = prediction(p);
    const crossing = currentDay + fit.remaining;
    if (view === 'peak') {
      ['Pendiente: ' + fit.slope.toFixed(3) + ' mm/s por día',
        'Muestras: ' + fit.count + ' · Residuo: ' + fit.residual.toFixed(3) + ' mm/s',
        'Alarma estimada en ' + fit.remaining.toFixed(1) + ' días'
      ].forEach((line, i) => ctx.fillText(line, 12, 25 + 24 * i, width - 24));
      return;
    }
    const points = view === 'low' ? fit.points : history;
    const end = Math.max(74, crossing + 3);
    const x = day => 30 + (width - 45) * (day - points[0].day) / (end - points[0].day);
    const y = rms => height - 24 - (height - 57) * rms / 5;
    function line(a, b, color) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x(a[0]), y(a[1]));
      ctx.lineTo(x(b[0]), y(b[1]));
      ctx.stroke();
    }
    line([points[0].day, alarm], [end, alarm], '#ebbd7f');
    const start = fit.points[0].day;
    line([start, fit.intercept + fit.slope * start], [crossing, alarm], '#7ee4d7');
    ctx.fillStyle = '#d7e8ee';
    for (const sample of points) ctx.fillRect(x(sample.day) - 1.5, y(sample.rms) - 1.5, 3, 3);
    ctx.fillText('RMS (mm/s) · datos / tendencia / alarma', 12, 19, width - 24);
    ctx.fillText('Día ' + points[0].day, 25, height - 6);
    ctx.fillText('Día ' + crossing.toFixed(1), Math.min(x(crossing) - 22, width - 62), height - 6);
    return;
  }
  const response = trial(p);
  if (view === 'peak') {
    const rows = [
      'Recuperación: ' + response.recovery.toFixed(2) + ' s',
      'Error final máximo: ' + (response.tailError * 100).toFixed(2) + ' puntos',
      'Tiempo saturado: ' + response.saturation.toFixed(2) + ' s',
      'Kp = ' + response.kp.toFixed(3) + '   Ki = ' + response.ki.toFixed(3) + '   Kd = ' + response.kd.toFixed(3)
    ];
    rows.forEach((row, i) => ctx.fillText(row, 12, 26 + 30 * i));
    return;
  }
  const voltage = view === 'low';
  const traces = voltage ? [['command', '#ebbd7f'], ['voltage', '#7ee4d7']] : [['target', '#ebbd7f'], ['speed', '#7ee4d7']];
  const yMin = voltage ? Math.min(0, ...response.samples.map(s => s.command)) : 0;
  const yMax = voltage ? Math.max(1, ...response.samples.map(s => s.command)) : 1.5;
  const x = t => 36 + (width - 52) * t / duration;
  const y = value => height - 30 - (height - 67) * (value - yMin) / (yMax - yMin);
  ctx.fillText(voltage ? 'Mando calculado (dorado) / aplicado (verde)' : 'Consigna (dorado) / velocidad (verde)', 12, 20, width - 24);
  for (const [field, color] of traces) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    response.samples.forEach((sample, i) => {
      if (i === 0) ctx.moveTo(x(sample.time), y(sample[field]));
      else ctx.lineTo(x(sample.time), y(sample[field]));
    });
    ctx.stroke();
  }
  ctx.fillText('0 s', x(0), height - 10);
  ctx.fillText('8 s', x(8) - 18, height - 10);
}
export function launch(id) {
  const app = workOrder(id, {definitions, defaults, model, criteria, build, update, drawInstrument,
    formatParameter: (control, value) => control.format ? control.format(value) : value
  });
  attachReviewCursor(app);
  preciseFraming(app, definitions.find(item => item.id === id));
  return app;
}
