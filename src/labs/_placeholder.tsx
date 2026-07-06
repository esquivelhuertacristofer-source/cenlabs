'use client';

/**
 * src/labs/_placeholder.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Piloto/Bitácora provisional para labs recién andamiados con
 * `node scripts/new-lab.mjs <id>`. El `components.ts` generado apunta aquí por
 * defecto, de modo que un lab a medio construir COMPILA y CORRE (muestra este
 * panel) en vez de romper el build o dejar la pantalla en blanco.
 *
 * Al construir el simulador real, reemplaza en `components.ts` los imports
 * `../_placeholder` por `@/components/Piloto<Nombre>` y
 * `@/components/bitacoras/Bitacora<Nombre>`. Cuando ya no queden referencias a
 * este archivo, puede borrarse.
 */
export default function EnConstruccion() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 p-8">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="text-5xl" role="img" aria-label="En construcción">
          🚧
        </span>
        <h2 className="text-lg font-black uppercase tracking-widest text-slate-600">
          Simulador en construcción
        </h2>
        <p className="text-sm text-slate-400">
          Este laboratorio fue andamiado con <code>scripts/new-lab.mjs</code> pero
          su componente aún no se ha implementado. Reemplaza el import de{' '}
          <code>../_placeholder</code> en <code>components.ts</code> por el
          componente real.
        </p>
      </div>
    </div>
  );
}
