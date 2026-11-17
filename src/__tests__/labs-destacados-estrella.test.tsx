/**
 * src/__tests__/labs-destacados-estrella.test.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Práctica estrella por pilar de ciencias (2026-11-16). En Química, Física,
 * Matemáticas y Biología la franja de destacadas muestra SOLO su práctica
 * estrella, con acento dorado y un único enlace. Mecánica, que no tiene estrella,
 * conserva su franja de hasta cuatro destacadas.
 * Cada estrella debe existir, estar activa y marcada como destacada en su catalogo.ts.
 * Se monta con `createRoot` y el `act` de React 19 (sin Testing Library).
 */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import fs from 'node:fs';
import path from 'node:path';
import LabsDestacados, { ESTRELLA_POR_CATEGORIA, MAX_DESTACADAS } from '@/components/LabsDestacados';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const item = (id: string) => ({ href: `/alumno/simulador/${id}`, titulo: `Título ${id}`, modulo: `Módulo ${id}` });

function montar(el: React.ReactElement) {
  const div = document.createElement('div'); document.body.appendChild(div);
  let raiz: Root | null = null;
  act(() => { raiz = createRoot(div); raiz.render(el); });
  return { div, cerrar: () => act(() => raiz!.unmount()) };
}

describe('Práctica estrella por pilar de ciencias', () => {
  it('son exactamente las cuatro elegidas', () => {
    expect(ESTRELLA_POR_CATEGORIA).toEqual({ quimica: 'quimica-9', fisica: 'fisica-10', matematicas: 'matematicas-10', biologia: 'biologia-8' });
  });

  it.each(Object.entries(ESTRELLA_POR_CATEGORIA))('%s: la estrella %s existe, está activa y es destacada', (_cat, id) => {
    const txt = fs.readFileSync(path.join(process.cwd(), 'src', 'labs', id, 'catalogo.ts'), 'utf8');
    expect(txt).toMatch(/["']?estado["']?\s*:\s*["']activo["']/);
    expect(txt).toMatch(/["']?destacada["']?\s*:\s*true/);
  });

  it.each(Object.entries(ESTRELLA_POR_CATEGORIA))('%s: la franja muestra solo %s, aunque haya otras destacadas', (cat, id) => {
    const otras = [1, 2, 3, 4, 5, 6].map((n) => `${cat}-${n}`).filter((x) => x !== id);
    const { div, cerrar } = montar(<LabsDestacados categoria={cat} acento="#10b981" items={[...otras.map(item), item(id)]} />);
    const enlaces = [...div.querySelectorAll('a')];
    expect(enlaces).toHaveLength(1);
    expect(enlaces[0].getAttribute('href')).toBe(`/alumno/simulador/${id}`);
    expect(div.textContent).toContain('Práctica estrella');
    expect(div.textContent).toContain(`Título ${id}`);
    expect(div.querySelector('section')?.getAttribute('aria-label')).toBe('Práctica estrella');
    cerrar();
  });

  it('si la estrella no llega en la lista, la franja vuelve a las destacadas normales', () => {
    const { div, cerrar } = montar(<LabsDestacados categoria="quimica" acento="#FB8500" items={['quimica-1', 'quimica-7'].map(item)} />);
    expect(div.querySelectorAll('a')).toHaveLength(2);
    expect(div.textContent).not.toContain('Práctica estrella');
    cerrar();
  });

  it('mecánica no tiene estrella y conserva hasta cuatro destacadas', () => {
    const ids = ['mecanica-166', 'mecanica-165', 'mecanica-169', 'mecanica-127', 'mecanica-1', 'mecanica-2'];
    const { div, cerrar } = montar(<LabsDestacados categoria="mecanica" acento="#2A9D8F" items={ids.map(item)} />);
    const enlaces = [...div.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(enlaces).toEqual(ids.slice(0, MAX_DESTACADAS).map((id) => `/alumno/simulador/${id}`));
    expect(div.textContent).not.toContain('Práctica estrella');
    cerrar();
  });
});
