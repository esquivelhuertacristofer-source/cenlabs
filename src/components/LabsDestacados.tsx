import Link from 'next/link';
import { Play, Sparkles } from 'lucide-react';

export interface LabDestacado {
  href: string;
  titulo: string;
  modulo: string;
}

/**
 * Franja de prácticas destacadas de una categoría (las marcadas con
 * `destacada: true` en su catalogo.ts); se muestran sólo las 4 mejores. Desde 2026-10-13 son los labs de
 * «clase mundial»: una categoría puede tener varias, así que se pintan todas
 * en rejilla y no sólo la primera. El color de acento llega como hex para no
 * depender de clases de Tailwind generadas en tiempo de compilación.
 */
export const MAX_DESTACADAS = 4;

/** Las 4 mejores de cada pilar (por href), en el orden en que se muestran. */
export const MEJORES_POR_CATEGORIA: Record<string, string[]> = {
  fisica: ['fisica-10', 'fisica-6', 'fisica-9', 'fisica-1'],
  quimica: ['quimica-1', 'quimica-9', 'quimica-10', 'quimica-7'],
  biologia: ['biologia-4', 'biologia-3', 'biologia-8', 'biologia-7'],
  matematicas: ['matematicas-5', 'matematicas-8', 'matematicas-9', 'matematicas-10'],
  mecanica: ['mecanica-166', 'mecanica-165', 'mecanica-169', 'mecanica-127'],
};

export default function LabsDestacados({ items: todas, acento, categoria }: { items: LabDestacado[]; acento: string; categoria?: string }) {
  const orden = (categoria && MEJORES_POR_CATEGORIA[categoria]) || [];
  const clave = (h: string) => h.split('/').pop() ?? h;
  const elegidas = orden.map((id) => todas.find((it) => clave(it.href) === id)).filter((x): x is LabDestacado => !!x);
  const items = [...elegidas, ...todas.filter((it) => !elegidas.includes(it))].slice(0, MAX_DESTACADAS);
  if (items.length === 0) return null;
  const varias = items.length > 1;
  return (
    <section className="w-full mb-12" aria-label="Prácticas destacadas">
      <p className="flex items-center gap-2 text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
        <Sparkles size={16} style={{ color: acento }} />
        {varias ? `Destacadas · ${items.length} labs de nueva generación 3D` : 'Práctica destacada · nueva generación 3D'}
      </p>
      <div className={`grid gap-4 ${varias ? 'lg:grid-cols-2' : ''}`}>
        {items.map((it) => (
          <div
            key={it.href}
            className="bg-white dark:bg-[#0A1121] border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-colors border-t-4"
            style={{ borderTopColor: acento }}
          >
            <div className="flex items-center gap-5 min-w-0">
              <div
                className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border"
                style={{ backgroundColor: `${acento}14`, borderColor: `${acento}33` }}
              >
                <Play className="w-7 h-7" style={{ color: acento }} fill="currentColor" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">⭐ {it.modulo}</p>
                <p className="text-lg sm:text-xl font-black text-[#023047] dark:text-white leading-snug">{it.titulo}</p>
              </div>
            </div>
            <Link
              href={it.href}
              className="px-6 py-3 rounded-xl font-black text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 whitespace-nowrap shrink-0"
              style={{ backgroundColor: acento }}
            >
              <Play size={18} fill="currentColor" />
              Iniciar
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
