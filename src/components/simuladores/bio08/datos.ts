/**
 * bio08/datos.ts — carga (una vez por calidad y por sesión) del corazón calculado.
 *
 * Se construye en un Web Worker; si el navegador no lo permite, en el hilo
 * principal tras un respiro. La promesa se guarda: volver a montar la escena no
 * recalcula nada.
 */
import { construirCorazon, type CalidadCorazon, type DatosCorazon } from './corazon';

const cache: Partial<Record<CalidadCorazon, Promise<DatosCorazon>>> = {};

/** Sólo en desarrollo: deja constancia de dónde se construyó (la sonda lo lee). */
function anotar(origen: 'worker' | 'principal', ms: number) {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return;
  (window as unknown as { __bio08Origen?: unknown }).__bio08Origen = { origen, ms: Math.round(ms) };
}

function enHiloPrincipal(calidad: CalidadCorazon): Promise<DatosCorazon> {
  const t0 = performance.now();
  return new Promise<DatosCorazon>((res, rej) => setTimeout(() => { try { const d = construirCorazon(calidad); anotar('principal', performance.now() - t0); res(d); } catch (e) { rej(e); } }, 60));
}

export function cargarCorazon(calidad: CalidadCorazon): Promise<DatosCorazon> {
  const hecha = cache[calidad];
  if (hecha) return hecha;
  const p = new Promise<DatosCorazon>((res, rej) => {
    let w: Worker | null = null;
    try {
      w = new Worker(new URL('./corazon.worker.ts', import.meta.url));
    } catch {
      w = null;
    }
    if (!w) { enHiloPrincipal(calidad).then(res, rej); return; }
    const trabajador = w;
    const t0 = performance.now();
    trabajador.onmessage = (e: MessageEvent<{ ok: boolean; datos?: DatosCorazon; error?: string }>) => {
      trabajador.terminate();
      if (e.data.ok && e.data.datos) { anotar('worker', performance.now() - t0); res(e.data.datos); }
      else enHiloPrincipal(calidad).then(res, rej);
    };
    trabajador.onerror = (ev) => {
      ev.preventDefault?.();
      trabajador.terminate();
      enHiloPrincipal(calidad).then(res, rej);
    };
    trabajador.postMessage({ calidad });
  });
  cache[calidad] = p;
  p.catch(() => { delete cache[calidad]; });
  return p;
}
