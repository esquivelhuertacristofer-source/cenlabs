/**
 * EL PUENTE: LO QUE PASA DENTRO DEL LAB TIENE QUE SALIR DE ÉL.
 *
 * EL AGUJERO QUE TAPA. Los 120 labs de mecánica son 3/4 del catálogo y hasta
 * hoy no le contaban NADA a la plataforma: ni un `postMessage` en los 121
 * archivos, ni un `addEventListener('message')` en el shell que los embebe. Un
 * alumno podía resolver los ciento veinte y el panel del profesor seguía en
 * cero, no porque fallara sino porque nunca hubo por dónde. Esa es también la
 * razón de que no haya puntaje, ni racha, ni competencia: no se puede premiar
 * lo que no se mide.
 *
 * DE DÓNDE SACA LO QUE SABE. De `window.__labDebug`, el gancho que los labs ya
 * exponen para poder verificarlos con Playwright. Se contaron: lo tienen 94 de
 * los 121, y las claves que de verdad se repiten son `mode` (79), `solved`
 * (53), `retoSolved` (35) y `quizAnswer`/`quizCorrectIndex` (40/36). O sea que
 * el gancho existía y ya publicaba lo que hacía falta; lo que faltaba era
 * alguien escuchando.
 *
 * DICE LO QUE NO PUEDE VER, Y ESO NO ES UN DETALLE. Veintisiete labs no tienen
 * gancho. De ésos se puede medir el tiempo y los modos que el alumno recorrió
 * —eso se lee del DOM— pero no si acertó. Un informe que en ese caso publicara
 * «0 aciertos» estaría acusando al alumno de no haber hecho nada. Por eso todo
 * mensaje lleva `cobertura`, y el panel tiene que distinguir «no acertó» de
 * «aquí no se puede saber».
 *
 * SE SONDEA, NO SE ESCUCHA. Los labs no emiten eventos cuando cambian de estado
 * —habría que tocar los 121 cuerpos para eso— así que esto mira el gancho cada
 * segundo y avisa sólo cuando algo cambió. Un sondeo de 1 Hz sobre cinco campos
 * no se nota al lado de una escena de three.js a 60 fps, y a cambio no hay que
 * editar un solo lab.
 *
 * NO ROMPE UN LAB SUELTO. Si esto se abre fuera de un iframe —un profesor que
 * abre el HTML directo para proyectarlo— `parent === window` y no manda nada.
 * Y todo va dentro de un try: un lab con el gancho a medias tiene que seguir
 * funcionando, que para eso el alumno lo abrió.
 */
(function () {
  'use strict';

  /** Suelto, sin shell alrededor: no hay a quién contarle nada. */
  if (window.parent === window) return;

  var VERSION = 1;
  var FUENTE = 'cen-lab';

  /** Cada cuánto se mira el gancho. Ver «SE SONDEA, NO SE ESCUCHA». */
  var SONDEO_MS = 1000;
  /** Cada cuánto se manda el avance aunque no haya cambiado nada, para el reloj. */
  var LATIDO_MS = 15000;

  /** El lab, deducido de su propio archivo: `/labs/gases-verificacion.html`. */
  var slug = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');

  var arranque = Date.now();
  var modos = [];
  var ultimoLatido = 0;
  var previo = '';

  function manda(tipo, datos) {
    try {
      var msg = { fuente: FUENTE, v: VERSION, tipo: tipo, slug: slug };
      for (var k in datos) if (Object.prototype.hasOwnProperty.call(datos, k)) msg[k] = datos[k];
      // El destino va sin comodín: el shell vive en el mismo origen que el lab
      // —los dos los sirve `public/`— así que no hay razón para abrirlo a todos.
      window.parent.postMessage(msg, location.origin);
    } catch (e) { /* un puente roto no puede tirar el lab */ }
  }

  /** El gancho, si el lab lo tiene y responde. */
  function gancho() {
    var d = window.__labDebug;
    return d && typeof d === 'object' ? d : null;
  }

  function llama(d, nombre) {
    try {
      var v = d[nombre];
      return typeof v === 'function' ? v() : v;
    } catch (e) { return undefined; }
  }

  /** El primer booleano de verdad de la lista; `undefined` si no hay ninguno. */
  function primerBooleano(lista) {
    for (var i = 0; i < lista.length; i++) if (typeof lista[i] === 'boolean') return lista[i];
    return undefined;
  }

  /** El primero de esos campos que sea booleano dentro del objeto, si lo es. */
  function dentro(obj, campos) {
    if (!obj || typeof obj !== 'object') return undefined;
    for (var i = 0; i < campos.length; i++) {
      if (typeof obj[campos[i]] === 'boolean') return obj[campos[i]];
    }
    return undefined;
  }

  /**
   * Lo que el lab dice de sí mismo ahora mismo.
   *
   * `resuelto` es deliberadamente `null` y no `false` cuando no se puede saber:
   * son tres estados —resuelto, no resuelto, no observable— y aplanarlos a dos
   * es exactamente el error que produce informes que culpan al alumno.
   */
  function estado() {
    var d = gancho();
    var modo = null;
    var resuelto = null;
    var quiz = null;

    if (d) {
      var m = llama(d, 'mode');
      if (typeof m === 'string') modo = m;

      /* «¿RESOLVIÓ EL RETO?» TIENE TANTOS NOMBRES COMO TANDAS DE LABS.
         El gancho `__labDebug` se escribió para poder verificar cada lab con
         Playwright, no como contrato de reporte, así que cada tanda le puso el
         nombre que le vino bien: `solved`, `retoSolved`, un `reto()` con la
         bandera dentro, o un `state()` con `resuelto`. Se prueban todas las
         formas que existen de verdad —salieron de leer los 121— y ninguna que
         no exista: adivinar aquí produciría notas inventadas.

         Lo que NO se hace: llamar a `checkReto()` para averiguarlo. Esa función
         no consulta, EVALÚA: correrla desde fuera le entregaría el reto al
         alumno sin que él lo pidiera. */
      var s = primerBooleano([
        llama(d, 'solved'),
        llama(d, 'retoSolved'),
        dentro(llama(d, 'reto'), ['solved', 'resuelto', 'hecho']),
        dentro(llama(d, 'state'), ['resuelto', 'solved', 'retoSolved']),
        dentro(llama(d, 'progress'), ['solved', 'resuelto']),
      ]);
      if (typeof s === 'boolean') resuelto = s;

      var respondida = llama(d, 'quizAnswer');
      var correcta = llama(d, 'quizCorrectIndex');
      if (typeof correcta === 'number') {
        quiz = {
          respondida: typeof respondida === 'number' && respondida >= 0,
          acierto: typeof respondida === 'number' && respondida === correcta,
        };
      }
    }

    if (modo === null) {
      // Sin gancho todavía queda el DOM: la barra de modos marca el activo.
      var activo = document.querySelector('[data-mode].on, [data-mode][aria-pressed="true"]');
      if (activo) modo = activo.getAttribute('data-mode');
    }

    if (modo && modos.indexOf(modo) === -1) modos.push(modo);

    return {
      /* `completa` = el lab publica si se resolvió. `parcial` = sólo se puede
         medir tiempo y recorrido. El panel NO debe pintarlas igual. */
      cobertura: resuelto === null ? 'parcial' : 'completa',
      segundos: Math.round((Date.now() - arranque) / 1000),
      modo: modo,
      modos: modos.slice(),
      resuelto: resuelto,
      quiz: quiz,
    };
  }

  /** Lo que decide si vale la pena volver a hablar. El reloj no cuenta. */
  function huella(e) {
    return [e.modo, e.resuelto, e.quiz && e.quiz.respondida, e.quiz && e.quiz.acierto].join('|');
  }

  function tic() {
    var e;
    try { e = estado(); } catch (err) { return; }
    var h = huella(e);
    var ahora = Date.now();
    if (h !== previo) {
      previo = h;
      ultimoLatido = ahora;
      manda('avance', e);
      return;
    }
    if (ahora - ultimoLatido >= LATIDO_MS) {
      ultimoLatido = ahora;
      manda('avance', e);
    }
  }

  /* Se avisa cuando el lab ya está montado de verdad —hay canvas—, no cuando el
     HTML terminó de parsear: entre las dos cosas está toda la carga de three.js
     y la construcción de la escena, y un shell que crea que el lab ya está
     puede tapar su propia pantalla de carga demasiado pronto. */
  function esperaMontaje(intentos) {
    if (document.querySelector('canvas')) {
      arranque = Date.now();
      manda('listo', { conGancho: !!gancho() });
      setInterval(tic, SONDEO_MS);
      tic();
      return;
    }
    if (intentos <= 0) { manda('listo', { conGancho: false, sinCanvas: true }); return; }
    setTimeout(function () { esperaMontaje(intentos - 1); }, 250);
  }

  // 240 intentos de 250 ms = un minuto. Una escena grande rasterizada por
  // software en una laptop de escuela puede tardar bastante más que en un
  // escritorio; por debajo de eso se estaría declarando roto un lab que sólo va
  // despacio.
  esperaMontaje(240);

  /* La última palabra antes de que se cierre la pestaña. `pagehide` y no
     `unload`: es el que los navegadores móviles disparan de verdad. */
  window.addEventListener('pagehide', function () {
    try { manda('cierre', estado()); } catch (e) { /* nada que hacer ya */ }
  });
})();
