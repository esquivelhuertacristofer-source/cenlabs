export function attachReviewCursor(app) {
  const panel = document.getElementById('explorar');
  const status = document.getElementById('jobBadge');
  const label = document.createElement('label');
  label.id = 'reviewCursor';
  label.hidden = true;
  label.innerHTML = '<span>Revisar el ensayo <output id="reviewTime"></output></span>'
    + '<input id="reviewPosition" type="range" min="0" max="8" step="0.05" value="0" aria-label="Tiempo del ensayo en segundos">';
  panel.append(label);
  const position = label.querySelector('input');
  const readout = label.querySelector('output');
  const pause = document.getElementById('btnPause');
  const seconds = t => t.toFixed(2).replace('.', ',') + ' s';
  const style = document.createElement('style');
  style.textContent = '#reviewCursor{margin-top:8px;color:#bce1e0;font-size:11px}'
    + '#reviewCursor[hidden]{display:none!important}'
    + '#reviewCursor:not([hidden]){display:block}'
    + '#reviewCursor span{display:flex;justify-content:space-between;gap:5px}'
    + '#reviewCursor input{width:100%;accent-color:#79e4d8}';
  document.head.append(style);
  position.addEventListener('input', () => {
    if (!app.S.paused) pause.click();
    app.S.t = position.valueAsNumber;
    readout.value = seconds(app.S.t);
  });
  new MutationObserver(() => {
    const {completed, duration, running} = window.__labDebug.ensayo();
    if (running && !app.S.paused && pause.textContent === 'Continuar') pause.textContent = 'Pausar';
    if (!completed) {
      label.hidden = true;
    } else if (label.hidden) {
      position.max = String(duration);
      position.value = position.max;
      readout.value = seconds(duration);
      label.hidden = false;
    }
  }).observe(status, {childList: true});
}
