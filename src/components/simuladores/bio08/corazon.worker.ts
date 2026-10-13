/**
 * bio08/corazon.worker.ts — construye el corazón (rejilla, eikonal, dipolo, mallas)
 * fuera del hilo principal: la escena sigue a 60 fps mientras tanto.
 */
import { construirCorazon, transferibles, type CalidadCorazon } from './corazon';

const ctx = self as unknown as { onmessage: ((e: MessageEvent<{ calidad: CalidadCorazon }>) => void) | null; postMessage: (m: unknown, t: Transferable[]) => void };
ctx.onmessage = (e) => {
  try {
    const d = construirCorazon(e.data.calidad);
    ctx.postMessage({ ok: true, datos: d }, transferibles(d));
  } catch (err) {
    ctx.postMessage({ ok: false, error: String(err) }, []);
  }
};
