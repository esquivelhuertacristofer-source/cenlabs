/**
 * src/__tests__/briefing-carga.test.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * La portada de misión dejó de ser código y pasó a ser un activo estático
 * (public/labs-data/briefing/<id>.json), para sacar 823 KB de prosa del worker de
 * Cloudflare, que está topado en 3 MiB comprimidos. Ver @/data/briefingConfigs.
 *
 * Ese cambio sustituye una lectura de un objeto en memoria —que no podía fallar—
 * por una petición de red, que sí. Lo que aquí se protege son los cuatro modos de
 * fallo que ese cambio introduce, todos silenciosos:
 *
 *  1. El respaldo: un lab sin portada propia debe caer al del lab de referencia,
 *     igual que hacía `ALL_BRIEFING_CONFIGS[id] ?? ALL_BRIEFING_CONFIGS['...']`.
 *  2. El fallo total: si no hay ni portada ni respaldo, `config` queda en null y
 *     el llamador NO debe renderizar MissionBriefing (que da por hecho un config).
 *     Devolver un objeto a medias sería peor: reventaría dentro del componente.
 *  3. Una sola petición por lab: dos componentes que abren el mismo lab, o volver
 *     a él en la misma sesión, no deben repetir la red.
 *  4. Cambiar de lab vuelve a «cargando»: si no, se vería un instante la portada
 *     del lab anterior encima del simulador del nuevo.
 *
 * No se usa Testing Library (su peer `@testing-library/dom` no está instalado):
 * se monta con `createRoot` y el `act` que React 19 ya exporta, igual que en
 * hub-mecanica-modulos.test.tsx.
 */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import fs from 'node:fs';
import path from 'node:path';
import { briefingUrl } from '@/data/briefingConfigs';
import { useBriefing } from '@/hooks/useBriefing';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const BRIEFING_DIR = path.join(__dirname, '..', '..', 'public', 'labs-data', 'briefing');
const real = (id: string) =>
  JSON.parse(fs.readFileSync(path.join(BRIEFING_DIR, `${id}.json`), 'utf8'));

/**
 * Doble de `fetch` que sirve SÓLO los ids declarados, con el contenido real del
 * activo publicado. Cualquier otro id devuelve 404, que es lo que haría Cloudflare
 * con un lab sin portada. Cuenta las llamadas para poder probar la deduplicación.
 */
function servidorFalso(ids: string[]) {
  const rutas = new Map(ids.map((id) => [briefingUrl(id), real(id)]));
  const pedidas: string[] = [];
  const impl = jest.fn(async (url: string) => {
    pedidas.push(url);
    const cuerpo = rutas.get(url);
    if (!cuerpo) return { ok: false, status: 404, json: async () => ({}) } as Response;
    return { ok: true, status: 200, json: async () => cuerpo } as Response;
  });
  (globalThis as unknown as { fetch: unknown }).fetch = impl;
  return { pedidas };
}

/** Sonda: expone lo que devuelve el hook sin depender de cómo lo pinte un shell. */
type Visto = { config: unknown; cargando: boolean };
function Sonda({ id, respaldo, out }: { id: string; respaldo?: string; out: Visto[] }) {
  const r = useBriefing(id, respaldo);
  out.push({ config: r.config, cargando: r.cargando });
  return null;
}

let container: HTMLDivElement;
let root: Root;
const fetchOriginal = globalThis.fetch;

beforeEach(() => {
  jest.resetModules();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  globalThis.fetch = fetchOriginal;
});

/** Monta la sonda y deja que la promesa del fetch se resuelva. */
async function montar(id: string, respaldo: string | undefined, out: Visto[]) {
  await act(async () => {
    root.render(<Sonda id={id} respaldo={respaldo} out={out} />);
  });
}

describe('carga del briefing como activo estático', () => {
  it('sirve la portada del lab pedido y sale de «cargando»', async () => {
    servidorFalso(['mecanica-120']);
    const out: Visto[] = [];
    await montar('mecanica-120', 'mecanica-1', out);

    // El primer render SIEMPRE es «cargando»: es el estado que antes no existía.
    expect(out[0]).toEqual({ config: null, cargando: true });
    const fin = out[out.length - 1];
    expect(fin.cargando).toBe(false);
    expect(fin.config).toEqual(real('mecanica-120'));
  });

  it('cae al respaldo cuando el lab no tiene portada publicada', async () => {
    const { pedidas } = servidorFalso(['mecanica-1']);
    const out: Visto[] = [];
    await montar('mecanica-999', 'mecanica-1', out);

    const fin = out[out.length - 1];
    expect(fin.cargando).toBe(false);
    expect(fin.config).toEqual(real('mecanica-1'));
    // Se intentó el propio ANTES del respaldo, no directamente el respaldo.
    expect(pedidas).toEqual([briefingUrl('mecanica-999'), briefingUrl('mecanica-1')]);
  });

  it('deja config en null si fallan la portada y el respaldo', async () => {
    servidorFalso([]);
    const out: Visto[] = [];
    await montar('mecanica-999', 'mecanica-998', out);

    const fin = out[out.length - 1];
    expect(fin.cargando).toBe(false);
    // null, no un objeto a medias: los shells derivan de esto que NO deben
    // renderizar MissionBriefing, y entran directo al lab.
    expect(fin.config).toBeNull();
  });

  it('sobrevive a que fetch reviente (sin red), sin propagar el error', async () => {
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const out: Visto[] = [];
    await montar('mecanica-77', undefined, out);

    expect(out[out.length - 1]).toEqual({ config: null, cargando: false });
  });

  // OJO: la caché de aciertos vive en el módulo, así que persiste entre pruebas de
  // este archivo (`jest.resetModules()` no reinstancia un módulo ya importado
  // arriba). Por eso esta prueba usa un lab que ninguna otra ha pedido: si usara
  // uno ya cacheado contaría cero peticiones y pasaría por el motivo equivocado.
  it('pide una sola vez el mismo lab aunque lo monten dos componentes', async () => {
    const { pedidas } = servidorFalso(['mecanica-59']);
    const out: Visto[] = [];
    await act(async () => {
      root.render(
        <>
          <Sonda id="mecanica-59" out={out} />
          <Sonda id="mecanica-59" out={out} />
        </>
      );
    });

    expect(pedidas.filter((u) => u === briefingUrl('mecanica-59'))).toHaveLength(1);
    expect(out[out.length - 1].config).toEqual(real('mecanica-59'));
  });

  it('vuelve a «cargando» al cambiar de lab (no arrastra la portada anterior)', async () => {
    servidorFalso(['mecanica-120', 'mecanica-77']);
    const out: Visto[] = [];
    await montar('mecanica-120', undefined, out);
    expect(out[out.length - 1].config).toEqual(real('mecanica-120'));

    const desdeElCambio = out.length;
    await act(async () => {
      root.render(<Sonda id="mecanica-77" out={out} />);
    });

    const tras = out.slice(desdeElCambio);
    // En ningún render posterior al cambio se ve la portada del lab anterior.
    expect(tras.some((v) => JSON.stringify(v.config) === JSON.stringify(real('mecanica-120')))).toBe(false);
    expect(out[out.length - 1].config).toEqual(real('mecanica-77'));
  });
});
