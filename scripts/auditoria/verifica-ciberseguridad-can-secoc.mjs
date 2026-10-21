// Verificación de la física de «Ciberseguridad del bus CAN: autenticación de mensajes y ataque de reproducción» (mecanica-152).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre) y lo contrasta
// con la trama CAN real (CRC-15, relleno de bits, cota de Davis), con formas cerradas (2^−m, 1−(1−2^−m)^N, carga del bus, retardo),
// con simulaciones de Monte Carlo (firma truncada, repetición con vuelta del contador, pérdida de sincronía) y con el diseño del reto.
// El MAC del lab es una mezcla de bits DIDÁCTICA: aquí sólo se prueba que se comporta como una función de mezcla (avalancha, uniformidad).
// uso: node scripts/auditoria/verifica-ciberseguridad-can-secoc.mjs [ruta al html (o a un .js con las marcas)]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const ruta = process.argv[2] || path.resolve(aqui, '../../public/labs/ciberseguridad-can-secoc.html');
const html = readFileSync(ruta, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {DOSPI,clamp,BUS,CAN_ID_FRENO,crc15,aBits,bitsTrama,rellena,bitsEnCable,bitsPeor,bitsMin,tTrama,MSG,usado,libres,dlcDe,FONDO,U_FONDO,cargaFreno,carga,tMac,retardo,pIntento,pForja,intentosMedios,edadMax,desincPorHora,mezcla32,macCompleto,macTrunc,CLAVE,nuevoEmisor,emite,nuevoReceptor,recibe,ESCENARIOS,LIM,evalua,RANGO,barrido,ventanaDe};`)();

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
// generador pseudoaleatorio con semilla (mulberry32): las pruebas de Monte Carlo son repetibles
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const quita = (bits) => { const o = []; let ult = -1, racha = 0; for (let i = 0; i < bits.length; i++) { const b = bits[i]; if (racha === 5) { racha = 1; ult = b; continue; } o.push(b); if (b === ult) racha++; else { ult = b; racha = 1; } } return o; };

console.log('1 · La trama CAN: CRC-15, relleno de bits y duración');
{ const R = rng(7);
  // propiedad del CRC: al añadir el CRC al mensaje, el residuo es cero
  let resCero = true, detecta = true;
  for (let k = 0; k < 400; k++) { const nb = 20 + Math.floor(R() * 80), bits = Array.from({ length: nb }, () => (R() < 0.5 ? 0 : 1)); const c = F.crc15(bits);
    if (F.crc15(bits.concat(F.aBits(c, 15))) !== 0) resCero = false;
    const j = Math.floor(R() * nb), m2 = bits.slice(); m2[j] ^= 1; if (F.crc15(m2) === c) detecta = false; }
  ok(resCero, 'CRC-15: mensaje + CRC deja residuo 0 (400 mensajes)'); ok(detecta, 'CRC-15: un solo bit cambiado siempre cambia el CRC (400 casos)');
  ok(F.crc15([]) === 0 && F.crc15([1]) === 0x4599, 'CRC-15 de un único 1 es el polinomio 0x4599');
  // relleno: nunca seis iguales seguidos y se deshace sin pérdida
  let sin6 = true, ida = true, entre = true, maxExtra = 0;
  for (let k = 0; k < 6000; k++) { const nB = 1 + Math.floor(R() * 8), by = Array.from({ length: nB }, () => Math.floor(R() * 256)); if (k % 7 === 0) by.fill(0); if (k % 11 === 0) by.fill(255);
    const base = F.bitsTrama(Math.floor(R() * 2048), by), st = F.rellena(base);
    let r = 1; for (let i = 1; i < st.length; i++) { r = st[i] === st[i - 1] ? r + 1 : 1; if (r > 5) sin6 = false; }
    if (JSON.stringify(quita(st)) !== JSON.stringify(base)) ida = false;
    const cab = F.bitsEnCable(0x0A0, by); const bits = F.rellena(F.bitsTrama(0x0A0, by)).length + 13;
    if (bits !== cab || cab > F.bitsPeor(nB) || cab < F.bitsMin(nB)) entre = false; maxExtra = Math.max(maxExtra, st.length - base.length); }
  ok(sin6, 'tras el relleno no hay seis bits iguales seguidos (6 000 tramas)'); ok(ida, 'quitar el relleno devuelve la trama original (6 000 tramas)');
  ok(entre, 'bits en el cable entre el mínimo (47 + 8n) y la cota del peor caso de Davis'); ok(maxExtra > 3, 'el relleno aparece de verdad', String(maxExtra));
  // formas cerradas de la cota
  ok(F.bitsPeor(8) === 135 && F.bitsMin(8) === 111, 'trama de 8 bytes: 111 bits sin relleno y 135 en el peor caso (libro)');
  cerca(F.tTrama(8), 270e-6, 1e-12, '135 bits a 500 kbit/s = 270 µs'); ok(F.bitsPeor(0) === 47 + Math.floor(33 / 4), 'sin datos: 47 + 8 bits de relleno');
  // el peor caso se alcanza en una trama de ceros y unos alternados por tandas de 4 + 1: se construye a propósito
  let mejor = 0; const R2 = rng(99); for (let k = 0; k < 200000; k++) { const by = Array.from({ length: 8 }, () => Math.floor(R2() * 256)); mejor = Math.max(mejor, F.bitsEnCable(Math.floor(R2() * 2048), by)); }
  ok(mejor <= 135 && mejor >= 121, 'la peor de 200 000 tramas al azar queda bajo 135 bits y cerca', String(mejor));
  const ceros = F.bitsEnCable(0, [0, 0, 0, 0, 0, 0, 0, 0]); ok(ceros > 111 + 12 && ceros <= 135, 'todo ceros: más relleno que lo normal y bajo la cota', String(ceros)); }

console.log('2 · El reparto de los 64 bits');
{ ok(F.MSG.D === 16 && F.MSG.C === 8, 'la orden de frenado ocupa 16 bits y el contador visible 8');
  for (const m of [0, 8, 24, 32, 40]) { ok(F.usado(m) + F.libres(m) === 64, `usado + libres = 64 (m=${m})`); }
  ok(F.libres(32) === 8 && F.libres(40) === 0 && F.libres(41) < 0, 'con 32 bits de firma quedan 8 libres; con 40, ninguno; con 41, no cabe');
  ok(F.dlcDe(0) === 3 && F.dlcDe(24) === 6 && F.dlcDe(25) === 7 && F.dlcDe(32) === 7 && F.dlcDe(33) === 8 && F.dlcDe(40) === 8, 'bytes que viajan = ⌈(16 + 8 + m)/8⌉'); }

console.log('3 · Carga del bus y retardo (formas cerradas)');
{ // fondo: 4×270 µs/10 ms + 6×270/20 + 8×270/50 + 10×270/100
  const cf = 4 * 0.27 / 10 + 6 * 0.27 / 20 + 8 * 0.27 / 50 + 10 * 0.27 / 100; cerca(F.U_FONDO, cf, 1e-12, 'carga de fondo = Σ n·270 µs/T'); cerca(F.U_FONDO, 0.2592, 1e-12, 'el resto del coche ocupa 25,92 %');
  for (const [T, m] of [[10, 24], [7, 28], [5, 8], [20, 0]]) { cerca(F.cargaFreno(T, m), F.bitsPeor(F.dlcDe(m)) * 2e-6 / (T / 1000), 1e-12, `carga del mensaje = bits·2 µs / T (T=${T}, m=${m})`); cerca(F.carga(T, m), F.U_FONDO + F.cargaFreno(T, m), 1e-12, 'carga total = fondo + frenado'); }
  let mono = true; for (let T = 2; T < 20; T++) for (const m of [0, 16, 32]) { if (!(F.carga(T + 1, m) < F.carga(T, m))) mono = false; } ok(mono, 'enviar más despacio baja la carga');
  let mm = true; for (let m = 0; m < 40; m++) { if (F.carga(10, m + 1) < F.carga(10, m)) mm = false; } ok(mm, 'una firma más larga nunca baja la carga (sube a escalones de un byte)');
  cerca(F.tMac(0), 30e-6, 1e-12, 'firmar y comprobar tarda 30 µs sin firma'); cerca(F.tMac(32), 94e-6, 1e-12, '… y 94 µs con 32 bits');
  cerca(F.retardo(10, 28), 0.010 + 270e-6 + F.tTrama(7) + 2 * (30e-6 + 56e-6), 1e-12, 'retardo = T + bloqueo + trama + 2 × tiempo de firma');
  ok(F.retardo(11, 28) <= 0.012 && F.retardo(12, 28) > 0.012, 'el tope de 12 ms deja T ≤ 11 ms con firma de 28 bits'); }

console.log('4 · Adivinar la firma: 2^−m y 1 − (1 − 2^−m)^N');
{ for (const m of [0, 1, 8, 16, 24, 32, 40]) cerca(F.pIntento(m), Math.pow(2, -m), 1e-15, `un intento acierta con 2^−${m}`);
  for (const [m, N] of [[8, 100], [10, 3000], [16, 20000], [12, 50]]) cerca(F.pForja(m, N), 1 - Math.pow(1 - Math.pow(2, -m), N), 1e-9, `P(N=${N}, m=${m}) = 1 − (1 − 2^−m)^N`);
  for (const [m, N] of [[30, 20000], [40, 3e5], [36, 1e4]]) cerca(F.pForja(m, N), N * Math.pow(2, -m), 2 * N * Math.pow(2, -m), `para p pequeña P ≈ N·2^−m (m=${m})`);
  ok(F.pForja(0, 5) === 1 && F.pForja(0, 1) === 1, 'sin firma (m = 0) el intruso acierta siempre');
  let mono = true; for (let m = 0; m < 40; m++) { const a = F.pForja(m, 20000), b = F.pForja(m + 1, 20000); if (!(m < 12 ? b <= a : b < a)) mono = false; } ok(mono, 'un bit más de firma baja P (monótona; saturada en 1 por debajo de 12 bits)');
  let mn = true; for (const N of [1, 10, 1000]) if (!(F.pForja(20, N * 10) > F.pForja(20, N))) mn = false; ok(mn, 'más intentos suben P');
  cerca(F.pForja(25, 20000) / F.pForja(24, 20000), 0.5, 2e-3, 'añadir un bit divide P por ≈ 2 mientras P es pequeña');
  ok(F.intentosMedios(20) === 1048576 && F.intentosMedios(24) === 16777216, 'intentos medios = 2^m: 1 048 576 con 20 bits y 16 777 216 con 24');
  // con N = 2^m intentos la probabilidad de haber acertado es 1 − 1/e ≈ 63,2 %
  cerca(F.pForja(20, Math.pow(2, 20)), 1 - Math.exp(-1), 2e-6, 'tras 2^m intentos P ≈ 1 − e⁻¹'); }

console.log('5 · La firma didáctica se comporta como una mezcla (avalancha, uniformidad, prefijos)');
{ const R = rng(5); let suma = 0, cnt = 0; const pop = (x) => { let c = 0; while (x) { c += x & 1; x >>>= 1; } return c; };
  for (let k = 0; k < 3000; k++) { const d = Math.floor(R() * 65536), fv = Math.floor(R() * 4e9), a = F.macCompleto(F.CLAVE, d, fv); const bit = Math.floor(R() * 48);
    const b = bit < 16 ? F.macCompleto(F.CLAVE, d ^ (1 << bit), fv) : F.macCompleto(F.CLAVE, d, fv ^ Math.pow(2, bit - 16)); suma += pop((a[0] ^ b[0]) >>> 0); cnt++; }
  const med = suma / cnt; ok(med > 15 && med < 17, 'avalancha: cambiar 1 bit de la entrada cambia ≈ 16 de 32 bits de salida', med.toFixed(2));
  // uniformidad de 8 bits: χ² con 255 grados de libertad
  const bins = new Array(256).fill(0), M = 256 * 400; for (let k = 0; k < M; k++) bins[F.macTrunc(F.CLAVE, k & 65535, Math.floor(k / 3) + 1, 8)]++;
  let chi = 0; const e = M / 256; for (const b of bins) chi += (b - e) * (b - e) / e; ok(chi > 255 - 5 * Math.sqrt(510) && chi < 255 + 5 * Math.sqrt(510), 'uniformidad: χ² de la firma de 8 bits dentro de ±5σ', chi.toFixed(1));
  let pref = true; for (let k = 0; k < 500; k++) { const d = k * 37, fv = k + 11; for (let m = 1; m < 32; m += 5) if (F.macTrunc(F.CLAVE, d, fv, m) !== Math.floor(F.macTrunc(F.CLAVE, d, fv, m + 1) / 2)) pref = false; } ok(pref, 'truncar = quedarse con los m bits de más peso (el de m es el prefijo del de m + 1)');
  let rango = true; for (const m of [1, 7, 24, 33, 40]) for (let k = 0; k < 400; k++) { const v = F.macTrunc(F.CLAVE, k, k * 5 + 1, m); if (!(v >= 0 && v < Math.pow(2, m) && Number.isInteger(v))) rango = false; } ok(rango, 'la firma de m bits es un entero en [0, 2^m) hasta m = 40');
  ok(F.macTrunc(F.CLAVE, 5, 5, 0) === 0, 'm = 0 no deja firma');
  ok(F.macTrunc(F.CLAVE, 5, 5, 24) === F.macTrunc(F.CLAVE, 5, 5, 24) && F.macTrunc(F.CLAVE, 5, 5, 24) !== F.macTrunc(F.CLAVE ^ 1, 5, 5, 24), 'es determinista y depende de la clave'); }

console.log('6 · Verificación con ventana de contador');
{ const m = 24, W = 6, em = F.nuevoEmisor(), rx = F.nuevoReceptor(); let todo = true;
  for (let k = 0; k < 600; k++) { const tr = F.emite(em, k & 65535, m); if (!F.recibe(rx, tr, m, W).ok) todo = false; } ok(todo, 'un flujo legítimo sin pérdidas se acepta entero (600 tramas, el contador de 8 bits da dos vueltas)');
  // pérdidas por debajo de la ventana: se sigue sincronizado
  for (let perdidas = 0; perdidas < W; perdidas++) { const e2 = F.nuevoEmisor(), r2 = F.nuevoReceptor(); F.recibe(r2, F.emite(e2, 1, m), m, W); for (let i = 0; i < perdidas; i++) F.emite(e2, 2, m); const r = F.recibe(r2, F.emite(e2, 3, m), m, W); ok(r.ok && r.avance === perdidas + 1, `se pierden ${perdidas} y el siguiente se acepta (avance ${perdidas + 1} ≤ W)`); }
  { const e2 = F.nuevoEmisor(), r2 = F.nuevoReceptor(); F.recibe(r2, F.emite(e2, 1, m), m, W); for (let i = 0; i < W; i++) F.emite(e2, 2, m); let rech = 0; for (let i = 0; i < 40; i++) if (!F.recibe(r2, F.emite(e2, 3, m), m, W).ok) rech++; ok(rech === 40, `si se pierden W = ${W} seguidos el módulo se queda desincronizado para siempre (40 de 40 rechazadas)`); }
  // repetir una trama vieja: fuera de ventana → 'contador'
  { const e2 = F.nuevoEmisor(), r2 = F.nuevoReceptor(); const grab = []; for (let i = 0; i < 100; i++) { const t = F.emite(e2, 0xABC, m); grab.push(t); F.recibe(r2, t, m, W); }
    let fuera = 0; for (let i = 0; i < 90; i++) { const r = F.recibe(r2, grab[i], m, W); if (!r.ok && r.motivo === 'contador') fuera++; } ok(fuera === 90, 'repetir una trama grabada hace 10 mensajes o más: rechazada por el contador (90 de 90)'); }
  // repetir tramas que el módulo NO vio (apagado): se aceptan hasta W de retraso, ni una más
  for (const W2 of [1, 4, 8]) { const e2 = F.nuevoEmisor(), r2 = F.nuevoReceptor(); F.recibe(r2, F.emite(e2, 1, m), m, W2); const grab = []; for (let i = 0; i < 20; i++) grab.push(F.emite(e2, 0xF0F, m));
    let acept = 0; const maxj = []; for (let j = 0; j < 20; j++) { const r3 = { ult: r2.ult }; if (F.recibe(r3, grab[j], m, W2).ok) { acept++; maxj.push(j + 1); } } ok(acept === W2 && maxj[maxj.length - 1] === W2, `módulo apagado y grabaciones repetidas: se aceptan exactamente las ${W2} primeras (edad ≤ W·T)`); }
  cerca(F.edadMax(10, 7), 70, 1e-12, 'edad máxima = W·T (7 × 10 ms = 70 ms)'); }

console.log('7 · Monte Carlo: la firma truncada, la vuelta del contador y los intentos al azar');
{ // 7a · falsificación con firma al azar: tasa de éxito = 2^−m, NO se multiplica por W
  for (const [m, W] of [[0, 5], [3, 5], [6, 7], [6, 1], [9, 12]]) { const R = rng(1000 + m * 31 + W), rx = F.nuevoReceptor(); rx.ult = 1000; let ac = 0; const N = 300000;
    for (let k = 0; k < N; k++) { const d = 1 + Math.floor(R() * W); const tr = { datos: 0xFFF, cnt: (rx.ult + d) & 255, mac: m === 0 ? 0 : Math.floor(R() * Math.pow(2, m)) }; const rr = { ult: rx.ult }; if (F.recibe(rr, tr, m, W).ok) ac++; }
    const p = Math.pow(2, -m), sd = Math.sqrt(N * p * (1 - p)); ok(Math.abs(ac - N * p) <= 4.5 * sd + (m === 0 ? 0 : 0), `falsificar con firma al azar: ${ac} de ${N} aceptadas ≈ ${(N * p).toFixed(0)} (m=${m}, W=${W})`); }
  // 7b · la vuelta del contador: repetir una trama grabada justo 255 mensajes después trae un contador "dentro de ventana", pero la firma era de otro contador largo
  for (const m of [0, 4, 8]) { const R = rng(77 + m), N = 60000; let ac = 0;
    for (let k = 0; k < N; k++) { const em = F.nuevoEmisor(), rx = F.nuevoReceptor(); em.fv = Math.floor(R() * 1e6); rx.ult = em.fv; const tr = F.emite(em, 0xBEE & 0xFFF, m); F.recibe(rx, tr, m, 8);
      for (let i = 0; i < 254; i++) F.recibe(rx, F.emite(em, 0x111, m), m, 8); // el flujo legítimo sigue hasta una vuelta de 8 bits menos uno
      if (F.recibe({ ult: rx.ult }, tr, m, 8).ok) ac++; }
    const p = Math.pow(2, -m), sd = Math.sqrt(N * p * (1 - p)); ok(Math.abs(ac - N * p) <= 4.5 * sd + 1e-9, `repetir justo tras una vuelta del contador (255 mensajes): ${ac} de ${N} ≈ ${(N * p).toFixed(0)} (m=${m}: ${m === 0 ? 'sin firma el contador solo NO protege' : '2^−m'})`); }
  // 7c · pérdida de sincronía: tasa por mensaje = (1 − q)·q^W
  for (const [q, W] of [[0.35, 2], [0.5, 3], [0.2, 1], [0.6, 4]]) { const R = rng(4000 + W), N = 2000000; let run = 0, ev = 0, prev = false;
    for (let k = 0; k < N; k++) { const perd = R() < q; if (perd) { run++; if (run === W && prev) ev++; } else { run = 0; prev = true; } if (k === 0) prev = !perd ? true : false; }
    const esp = N * (1 - q) * Math.pow(q, W), sd = Math.sqrt(esp); ok(Math.abs(ev - esp) <= 5 * sd, `rachas de ≥ ${W} pérdidas con q = ${q}: ${ev} ≈ ${esp.toFixed(0)} = N(1 − q)q^W`); }
  cerca(F.desincPorHora(10, 6, 0.03), 3.6e5 * 0.97 * Math.pow(0.03, 6), 1e-12, 'desincronizaciones por hora = (3,6·10⁶/T)(1 − q)q^W'); }

console.log('8 · El diseño del reto');
{ const [E1, E2] = F.ESCENARIOS;
  for (const E of F.ESCENARIOS) {
    const b = F.barrido(E), tot = 41 * 40 * 19; ok(b.length > 0, `${E.id}: hay soluciones`, String(b.length));
    const eje = (i) => { const v = b.map((x) => x[i]); return [Math.min(...v), Math.max(...v)]; };
    const [mA, mB] = eje(0), [wA, wB] = eje(1), [tA, tB] = eje(2);
    ok(mA > F.RANGO.m[0] && mB < F.RANGO.m[1] && wA > F.RANGO.W[0] && wB < F.RANGO.W[1] && tA > F.RANGO.T[0] && tB < F.RANGO.T[1], `${E.id}: la ventana es INTERIOR en los tres mandos (m ${mA}–${mB}, W ${wA}–${wB}, T ${tA}–${tB})`);
    ok(b.length / tot < 0.006, `${E.id}: sólo cumple el ${(100 * b.length / tot).toFixed(2)} % de las combinaciones`);
    const cuenta = { forja: 0, repite: 0, sync: 0, bus: 0, sitio: 0, lat: 0 }; // quién tira más abajo: cada criterio por sí solo deja pasar una fracción mayor que el conjunto
    for (let m = 0; m <= 40; m++) for (let W = 1; W <= 40; W++) for (let T = 2; T <= 20; T++) { const r = F.evalua(m, W, T, E); for (const k in cuenta) if (r.c[k]) cuenta[k]++; }
    for (const k in cuenta) ok(cuenta[k] > b.length && cuenta[k] < tot, `${E.id}: el criterio «${k}» solo no basta (${cuenta[k]} combinaciones lo cumplen)`);
    // cada mando tiene un extremo que falla por un criterio distinto
    ok(!b.some((x) => x[0] <= 20), `${E.id}: con firma de 20 bits o menos nadie cumple`); ok(!b.some((x) => x[0] > 32), `${E.id}: con más de 32 bits no quedan 8 libres`);
    ok(!b.some((x) => x[1] === 1) && !b.some((x) => x[1] >= 12), `${E.id}: ni la ventana de 1 ni las muy anchas sirven`);
    ok(!b.some((x) => x[2] <= 6) && !b.some((x) => x[2] >= 12), `${E.id}: ni enviar cada 6 ms o menos (carga) ni cada 12 o más (retardo)`);
    // el mismo diseño en que se piensa de entrada (todo a la mitad) no es la respuesta
    ok(!F.evalua(20, 20, 10, E).ok && !F.evalua(0, 1, 10, E).ok, `${E.id}: ni el punto medio ni «sin firma» son respuesta`);
    // la ventana mostrada tras validar existe y contiene al diseño bueno
    const [m0, W0, T0] = b[Math.floor(b.length / 2)]; for (const ej of ['m', 'W', 'T']) { const vv = F.ventanaDe(ej, m0, W0, T0, E); const x = { m: m0, W: W0, T: T0 }[ej]; ok(vv && vv[0] <= x && x <= vv[1] && vv[0] > F.RANGO[ej][0], `${E.id}: ventana de ${ej} contiene a la solución (${vv})`); } }
  // causas del diagnóstico: cada una rompe UN criterio distinto (síntoma único)
  const base = { m: 28, W: 7, T: 10 }, casos = { sinfirma: { ...base, m: 0 }, corta: { ...base, m: 12 }, ancha: { ...base, W: 40 }, estrecha: { ...base, W: 1 } };
  ok(F.evalua(base.m, base.W, base.T, E1).ok, 'el diseño de partida del diagnóstico (28, 7, 10) cumple todo en «taller»');
  for (const [k, c] of Object.entries(casos)) { const r = F.evalua(c.m, c.W, c.T, E1), mal = Object.entries(r.c).filter(([, v]) => !v).map(([x]) => x); console.log('   ', k, '→ falla:', mal.join(',') || '—', '· P', r.pF.toExponential(2), '· edad', r.edad, 'ms · desinc/h', r.des.toExponential(2)); }
  { const r0 = F.evalua(0, 7, 10, E1); ok(!r0.c.forja && r0.c.repite && r0.c.sync && r0.c.bus && r0.c.sitio && r0.c.lat && r0.pF === 1, 'sin firma: sólo falla la falsificación (P = 1)'); }
  ok(!F.evalua(12, 7, 10, E1).c.forja && F.evalua(12, 7, 10, E1).c.repite && F.evalua(12, 7, 10, E1).c.sync, 'firma corta: sólo falla la falsificación');
  ok(F.evalua(28, 40, 10, E1).c.forja && !F.evalua(28, 40, 10, E1).c.repite && F.evalua(28, 40, 10, E1).c.sync, 'ventana ancha: sólo falla la repetición (edad 400 ms)');
  ok(F.evalua(28, 1, 10, E1).c.forja && F.evalua(28, 1, 10, E1).c.repite && !F.evalua(28, 1, 10, E1).c.sync, 'ventana estrecha: sólo falla la sincronía');
  // cálculo de la fase 1
  for (const m of [16, 20, 22, 24]) ok(F.intentosMedios(m) === Math.pow(2, m), `fase 1: intentos medios con ${m} bits = ${Math.pow(2, m)}`);
  console.log(`   taller: ${F.barrido(E1).length} combinaciones · autopista: ${F.barrido(E2).length}`); }

console.log(`\n${n} comprobaciones · ${malas} fallos`);
if (malas) { console.log(fallos.join('\n')); process.exit(1); }
