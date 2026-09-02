/* ============================================================================
   CEN Labs · Ficha técnica (Capa B del molde de lab 3D)  —  componente compartido
   ----------------------------------------------------------------------------
   Renderiza el overlay estándar de 6 secciones a partir de un objeto de datos y
   crea su propio botón flotante (📋), sin depender del HUD interno de cada lab.
   Un solo motor para todos los labs → se arregla aquí una vez y se propaga.

   Uso (en un archivo _ficha-<lab>.js cargado después de éste):
     fichaTecnica({
       title:  'Subsistema — variante',
       intro:  '<b>...</b> ...',                       // párrafo introductorio (HTML)
       s1: { presentes:'<b>Presentes...</b> ...',      // §1 Componentes reales
             omitidos:['<b>X</b>: por qué existe...'] },
       s2: { title:'Fijaciones y pares de apriete',    // §2 tabla (título configurable)
             warn:'⚠ Valores representativos...',      // opcional
             rows:[ ['Unión','Fijación','Par'], ['a','b','c'] ] },  // fila 0 = encabezado
       s3: ['herramienta / consumible...'],            // §3 Herramientas de servicio
       s4: { intro:'El orden del lab es...', items:['paso real añadido...'] }, // §4
       s5: { modela:'...', noModela:'...' },            // §5 física/lógica
       s6: ['norma / manual real...'],                  // §6 Normas y fuentes
       foot: '...'                                       // opcional (hay default)
     });

   Regla de honestidad: NO cifras exactas inventadas → rangos + "consulta el
   manual del fabricante"; normas citadas por nombre. (Ver ESTANDAR-MOLDE-LAB-3D.)
   ========================================================================== */
(function () {
  if (window.fichaTecnica) return;               // guarda contra doble carga

  var CSS = [
    '#fichaOv{position:fixed;inset:0;z-index:9990;display:none;align-items:center;justify-content:center;background:rgba(4,7,10,.74);backdrop-filter:blur(4px);padding:20px}',
    '#fichaOv.show{display:flex}',
    '#fichaCard{width:min(780px,94vw);max-height:88vh;overflow:auto;background:#0d151b;border:1px solid rgba(79,209,197,.22);border-radius:16px;padding:22px 24px;color:#c6d2da;font:13px/1.55 system-ui,Segoe UI,Roboto,sans-serif;box-shadow:0 24px 60px rgba(0,0,0,.6)}',
    '#fichaCard h3{margin:0;font-size:17px;color:#eaf2f5;font-weight:700}',
    '#fichaCard .eyf{font:600 11px/1 var(--mono,monospace);letter-spacing:.14em;text-transform:uppercase;color:#4FD1C5;margin-bottom:6px}',
    '#fichaCard .fhrow{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:12px;margin-bottom:4px}',
    '#fichaClose{flex:none;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#c6d2da;width:30px;height:30px;border-radius:8px;cursor:pointer;font-size:15px;line-height:1}',
    '#fichaClose:hover{background:rgba(255,255,255,.12)}',
    '#fichaCard .fh{color:#4FD1C5;font-weight:700;font-size:13px;margin:16px 0 5px;letter-spacing:.02em}',
    '#fichaCard p{margin:5px 0}',
    '#fichaCard ul{margin:5px 0;padding-left:2px;list-style:none}',
    '#fichaCard li{margin:4px 0;padding-left:15px;position:relative}',
    '#fichaCard li:before{content:"\\25B8";position:absolute;left:0;color:#4FD1C5;opacity:.7}',
    '#fichaCard li.omit:before{content:"\\25CB";color:#F6AD55}',
    '#fichaCard .refs li:before{content:"\\2014";color:#8fa2b0}',
    '#fichaCard b{color:#eaf2f5}',
    '#fichaCard .warn{background:rgba(246,173,85,.09);border:1px solid rgba(246,173,85,.28);border-radius:9px;padding:8px 11px;margin:8px 0;color:#F6AD55;font-size:12px}',
    '#fichaCard table{width:100%;border-collapse:collapse;margin:7px 0;font-size:12px}',
    '#fichaCard th,#fichaCard td{text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.07);vertical-align:top}',
    '#fichaCard th{color:#8fa2b0;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em}',
    '#fichaCard td.tq{font-family:var(--mono,monospace);color:#eaf2f5;white-space:nowrap}',
    '#fichaCard .foot{margin-top:16px;padding-top:11px;border-top:1px solid rgba(255,255,255,.08);color:#7f8c96;font-size:11px}',
    /* Botón flotante (top-center: única franja libre en ambas familias de HUD) */
    '#fichaFab{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:45;display:flex;flex-direction:column;align-items:center;gap:1px;cursor:pointer;',
    'background:rgba(13,21,27,.86);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(79,209,197,.32);border-radius:12px;padding:6px 15px;color:#eaf2f5;font-family:system-ui,Segoe UI,Roboto,sans-serif;transition:.15s;box-shadow:0 8px 24px rgba(0,0,0,.4)}',
    '#fichaFab:hover{border-color:rgba(79,209,197,.6);background:rgba(16,26,33,.95);transform:translateX(-50%) translateY(1px)}',
    '#fichaFab .ft1{font-size:12px;font-weight:600;letter-spacing:.01em}',
    '#fichaFab .ft2{font-size:9px;letter-spacing:.09em;text-transform:uppercase;color:#4FD1C5;opacity:.85}',
    '@media (max-width:760px){#fichaFab{top:auto;bottom:10px;left:10px;transform:none;flex-direction:row;gap:7px;padding:8px 12px}#fichaFab:hover{transform:translateY(1px)}#fichaFab .ft2{display:none}}'
  ].join('\n');

  function injectStyleOnce() {
    if (document.getElementById('fichaStyle')) return;
    var s = document.createElement('style');
    s.id = 'fichaStyle';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function renderList(items, cls) {
    if (!items || !items.length) return '';
    var lis = items.map(function (i) {
      if (typeof i === 'string') return '<li>' + i + '</li>';
      return '<li class="' + (i.omit ? 'omit' : '') + '">' + i.html + '</li>';
    }).join('');
    return '<ul' + (cls ? ' class="' + cls + '"' : '') + '>' + lis + '</ul>';
  }

  function renderTable(t) {
    if (!t || !t.rows || !t.rows.length) return '';
    var warn = t.warn ? '<div class="warn">' + t.warn + '</div>' : '';
    var body = t.rows.map(function (r, ri) {
      if (ri === 0) return '<tr>' + r.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>';
      var last = r.length - 1;
      return '<tr>' + r.map(function (c, ci) {
        return ci === last ? '<td class="tq">' + c + '</td>' : '<td>' + c + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return warn + '<table>' + body + '</table>';
  }

  var DEFAULT_FOOT = 'Modelo didáctico CEN Labs · geometría procedural en three.js · física/lógica de parámetros concentrados con valores representativos. La fidelidad geométrica 1:1 se prevé en una fase posterior con modelos CAD reales.';

  window.fichaTecnica = function (c) {
    if (document.getElementById('fichaOv')) return;   // ya montada
    injectStyleOnce();

    var parts = [];
    parts.push('<div id="fichaOv"><div id="fichaCard">');
    parts.push('<div class="fhrow"><div><div class="eyf">' + (c.eyebrow || 'Ficha técnica · ¿en qué se basa?') + '</div>' +
      '<h3>' + (c.title || 'Ficha técnica') + '</h3></div>' +
      '<button id="fichaClose" title="Cerrar">✕</button></div>');

    if (c.intro) parts.push('<p>' + c.intro + '</p>');

    // §1 Componentes reales
    if (c.s1) {
      parts.push('<div class="fh">1 · Componentes reales</div>');
      if (c.s1.presentes) parts.push('<p>' + c.s1.presentes + '</p>');
      if (c.s1.omitidos && c.s1.omitidos.length) {
        parts.push('<p><b>Omitidos en el 3D</b> (existen en el equipo real y son clave):</p>');
        parts.push(renderList(c.s1.omitidos.map(function (h) { return { omit: true, html: h }; })));
      }
    }

    // §2 Tabla (título configurable: fijaciones/torques o especificaciones)
    if (c.s2) {
      parts.push('<div class="fh">2 · ' + (c.s2.title || 'Fijaciones y especificaciones') + '</div>');
      parts.push(renderTable(c.s2));
    }

    // §3 Herramientas de servicio
    if (c.s3) {
      parts.push('<div class="fh">3 · Herramientas de servicio</div>');
      parts.push(renderList(c.s3));
    }

    // §4 Procedimiento didáctico vs. real
    if (c.s4) {
      parts.push('<div class="fh">4 · Procedimiento didáctico vs. real</div>');
      if (c.s4.intro) parts.push('<p>' + c.s4.intro + '</p>');
      parts.push(renderList(c.s4.items));
    }

    // §5 Qué modela y qué no
    if (c.s5) {
      parts.push('<div class="fh">5 · Qué modela y qué no</div>');
      // Admite texto corrido o una lista. Con un array, concatenarlo con `+` lo
      // pegaba separado por comas y sin viñetas: una tira ilegible.
      var m5 = function (rot, v) {
        if (!v) return;
        if (Array.isArray(v)) { parts.push('<p><b>' + rot + '</b></p>'); parts.push(renderList(v)); }
        else parts.push('<p><b>' + rot + '</b> ' + v + '</p>');
      };
      m5('Sí modela:', c.s5.modela);
      m5('No modela:', c.s5.noModela);
    }

    // §6 Normas y fuentes
    if (c.s6) {
      parts.push('<div class="fh">6 · Normas y fuentes (diagramas y manuales reales)</div>');
      parts.push(renderList(c.s6, 'refs'));
    }

    parts.push('<div class="foot">' + (c.foot || DEFAULT_FOOT) + '</div>');
    parts.push('</div></div>');

    var fab = '<button id="fichaFab" title="Abrir la ficha técnica (fuentes, componentes, normas)">' +
      '<span class="ft1">📋 Ficha técnica</span>' +
      '<span class="ft2">modelo didáctico · fuentes reales</span></button>';

    document.body.insertAdjacentHTML('beforeend', fab + parts.join(''));

    var ov = document.getElementById('fichaOv');
    var openB = document.getElementById('fichaFab');
    var closeB = document.getElementById('fichaClose');
    var show = function (v) { ov.classList.toggle('show', v); };
    if (openB) openB.onclick = function () { show(true); };
    if (closeB) closeB.onclick = function () { show(false); };
    ov.addEventListener('click', function (e) { if (e.target === ov) show(false); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') show(false); });
  };
})();
