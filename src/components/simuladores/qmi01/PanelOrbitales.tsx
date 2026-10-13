'use client';
/**
 * qmi01/PanelOrbitales.tsx — piezas DOM del modelo cuántico (sin three):
 *   · DiagramaCajas: cajas 1s / 2s / 2pₓ 2p_y 2p_z con flechas ↑↓ (Aufbau, Hund,
 *     Pauli), Z_eff de Slater y ⟨r⟩ de cada subcapa. Cada caja enfoca su orbital
 *     en la escena (las demás nubes se atenúan).
 *   · GraficaRadial: densidad radial P(r) = Σ ocupación·r²R_nl² (e⁻/pm) por subcapa
 *     y total, con ⟨r⟩ marcado. Lee el MISMO reloj que la escena: cuando la nube
 *     se contrae, la curva se corre a la izquierda en el mismo cuadro.
 */
import React, { useMemo } from 'react';
import { A0_PM, ORBITALES, densidadRadial, radioMedio, type EstadoAtomo, type IdOrbital } from './orbitales';
import { useVersionReloj, type RelojAtomo } from './reloj';

export const COL_SUBCAPA: Record<'1s' | '2s' | '2p', string> = { '1s': '#f4c76b', '2s': '#7fd3ff', '2p': '#d29cff' };

function Flechas({ espines }: { espines: number[] }) {
  return (
    <span className="flex items-center justify-center gap-[1px] font-mono text-[13px] font-bold leading-none text-white">
      <span className={espines.length >= 1 ? '' : 'opacity-0'}>↑</span>
      <span className={espines.length >= 2 ? '' : 'opacity-0'}>↓</span>
    </span>
  );
}

export function DiagramaCajas({ estado, foco, onFoco, cuantico }: {
  estado: EstadoAtomo; foco: IdOrbital | null; onFoco: (id: IdOrbital | null) => void; cuantico: boolean;
}) {
  const filas: { sub: '1s' | '2s' | '2p'; capa: string; ids: IdOrbital[] }[] = [
    { sub: '1s', capa: 'K', ids: ['1s'] },
    { sub: '2s', capa: 'L', ids: ['2s'] },
    { sub: '2p', capa: 'L', ids: ['2px', '2py', '2pz'] },
  ];
  const por = (id: IdOrbital) => estado.orbitales.find((o) => o.def.id === id)!;
  return (
    <div className="pointer-events-auto w-[248px] rounded-xl border border-white/10 bg-[#0a1420]/85 px-2.5 py-2 text-[11px] text-slate-300 shadow-lg shadow-black/30 backdrop-blur" data-diagrama-cajas="">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Configuración</span>
        <span className="font-mono text-[12px] font-semibold text-white">{estado.texto}</span>
      </div>
      <div className="flex flex-col gap-1">
        {filas.map((f) => {
          const o0 = por(f.ids[0]);
          const ocup = f.ids.reduce((s, id) => s + por(id).ocupacion, 0);
          const ligado = f.ids.some((id) => por(id).ligado);
          const noLig = f.ids.some((id) => por(id).ocupacion > 0 && !por(id).ligado);
          const rmed = ligado ? radioMedio(o0.def.n, o0.def.l, o0.zEff) * A0_PM : null;
          return (
            <div key={f.sub} className="flex items-center gap-1.5">
              <span className="w-[30px] shrink-0 text-[10px] text-slate-500">{f.capa} · <b className="font-semibold" style={{ color: COL_SUBCAPA[f.sub] }}>{f.sub}</b></span>
              <div className="flex gap-[3px]">
                {f.ids.map((id) => {
                  const o = por(id);
                  const activo = foco === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onFoco(activo ? null : id)}
                      title={`${o.def.nombre}: ${o.ocupacion} e⁻${o.ocupacion > 0 && !o.ligado ? ' (no ligado: Z_eff ≤ 0)' : ''}${cuantico ? ' · clic para aislar su nube' : ''}`}
                      aria-pressed={activo}
                      aria-label={`Orbital ${o.def.nombre}, ${o.ocupacion} electrones`}
                      data-orbital={id}
                      className={`relative flex h-[23px] w-[25px] items-center justify-center rounded-[4px] border transition-colors ${
                        o.ocupacion > 0 && !o.ligado ? 'border-red-400/70 bg-red-500/10'
                          : activo ? 'border-[#ffb347] bg-[#ffb347]/20'
                          : o.ocupacion > 0 ? 'border-white/35 bg-white/[0.08] hover:border-white/60'
                          : 'border-white/15 bg-transparent hover:border-white/40'}`}
                    >
                      <Flechas espines={o.espines} />
                      {o.def.l === 1 && <span className="pointer-events-none absolute -bottom-[1px] right-[2px] text-[7px] italic leading-none text-slate-500">{'xyz'[o.def.eje!]}</span>}
                    </button>
                  );
                })}
              </div>
              <span className="ml-auto whitespace-nowrap text-right font-mono text-[10px] tabular-nums text-slate-400">
                {!cuantico ? (
                  // en el esquema de Bohr no se mezclan cifras del modelo cuántico
                  <span className={ocup ? 'text-slate-100' : ''}>{ocup}/{f.ids.length * 2}</span>
                ) : ocup === 0 ? '—' : noLig && !ligado ? <span className="text-red-300">no ligado</span> : (
                  <>Z<sub className="text-[8px]">eff</sub> <span className="text-slate-100">{o0.zEff.toFixed(2)}</span> · ⟨r⟩ <span className="text-slate-100">{rmed!.toFixed(0)}</span> pm</>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-white/10 pt-1 text-[10px] text-slate-400">
        <span>Hund: <b className="text-slate-200">{estado.desapareados}</b> desapareado{estado.desapareados === 1 ? '' : 's'}</span>
        {cuantico && (
          <span className="flex items-center gap-1.5">fase ψ
            <i className="inline-block h-2 w-2 rounded-full bg-[#ffb347]" />+
            <i className="inline-block h-2 w-2 rounded-full bg-[#4fb6ff]" />−
          </span>
        )}
      </div>
    </div>
  );
}

const W = 248, H = 128, ML = 30, MR = 8, MT = 20, MB = 22;
const XMAX = 300; // pm
const NPUNTOS = 140;

/** Paso «bonito» para el eje y. */
function techo(v: number): number {
  if (!(v > 0)) return 0.01;
  const e = Math.pow(10, Math.floor(Math.log10(v)));
  for (const k of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (k * e >= v) return k * e;
  return 10 * e;
}

export function GraficaRadial({ estado, reloj }: { estado: EstadoAtomo; reloj: RelojAtomo }) {
  useVersionReloj(reloj);
  // escala vertical fija con el estado FINAL (no baila durante la transición)
  // Si el pico del 1s es mucho mayor que la capa L, la escala se toma de la capa L
  // y el 1s sale por arriba (se rotula su altura real): si no, la valencia no se ve.
  const { ymax, pico1s } = useMemo(() => {
    let m = 0, mL = 0, m1 = 0;
    for (let k = 1; k <= 400; k++) {
      const r = ((k / 400) * XMAX) / A0_PM;
      let s = 0, sL = 0;
      for (const o of estado.orbitales) {
        if (!o.ligado) continue;
        const v = o.ocupacion * densidadRadial(o.def.n, o.def.l, o.zEff, r);
        s += v;
        if (o.def.n === 2) sL += v;
      }
      m = Math.max(m, s / A0_PM);
      mL = Math.max(mL, sL / A0_PM);
      m1 = Math.max(m1, (s - sL) / A0_PM);
    }
    if (mL > 0 && m > 2.2 * mL) return { ymax: techo(mL * 1.5), pico1s: m1 };
    return { ymax: techo(m * 1.05), pico1s: 0 };
  }, [estado]);

  const sx = (r: number) => ML + (r / XMAX) * (W - ML - MR);
  const sy = (p: number) => H - MB - (Math.min(p, ymax * 1.12) / ymax) * (H - MT - MB);
  const subs: ('1s' | '2s' | '2p')[] = ['1s', '2s', '2p'];
  const curvas: Record<string, string> = {};
  const tot: [number, number][] = [];
  const zs = ORBITALES.map((_, i) => reloj.zEff[i]);
  const ocupadas = subs.filter((s) => estado.orbitales.some((o) => o.def.subcapa === s && o.ligado));
  for (const s of ocupadas) curvas[s] = '';
  for (let k = 0; k <= NPUNTOS; k++) {
    const rpm = (k / NPUNTOS) * XMAX;
    const r = rpm / A0_PM;
    let t = 0;
    for (const s of ocupadas) {
      let v = 0;
      estado.orbitales.forEach((o, i) => { if (o.def.subcapa === s && o.ligado && zs[i] > 0) v += o.ocupacion * densidadRadial(o.def.n, o.def.l, zs[i], r); });
      v /= A0_PM;
      t += v;
      curvas[s] += `${k ? 'L' : 'M'}${sx(rpm).toFixed(1)},${sy(v).toFixed(1)}`;
    }
    tot.push([sx(rpm), sy(t)]);
  }
  const pathTot = tot.map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  const area = `${pathTot}L${sx(XMAX).toFixed(1)},${(H - MB).toFixed(1)}L${sx(0).toFixed(1)},${(H - MB).toFixed(1)}Z`;
  const marcas = ocupadas.map((s) => {
    const i = estado.orbitales.findIndex((o) => o.def.subcapa === s && o.ligado);
    const o = estado.orbitales[i];
    return { s, r: radioMedio(o.def.n, o.def.l, zs[i]) * A0_PM };
  });

  return (
    <div className="pointer-events-none w-[248px] rounded-xl border border-white/10 bg-[#0a1420]/85 px-1 pb-1 pt-1.5 shadow-lg shadow-black/30 backdrop-blur" data-grafica-radial="">
      <div className="flex items-center justify-between px-1.5 text-[10px]">
        <span className="font-bold uppercase tracking-wider text-slate-400">Densidad radial P(r)</span>
        <span className="flex gap-1.5">
          {subs.map((s) => <span key={s} style={{ color: COL_SUBCAPA[s], opacity: ocupadas.includes(s) ? 1 : 0.35 }}>{s}</span>)}
          <span className="text-white">total</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width={W - 8} height={H - 8} className="block" role="img" aria-label="Densidad radial de probabilidad por subcapa">
        {/* ejes y rejilla */}
        {[0, 100, 200, 300].map((r) => (
          <g key={r}>
            <line x1={sx(r)} x2={sx(r)} y1={MT - 4} y2={H - MB} stroke="#ffffff" strokeOpacity={r ? 0.07 : 0.25} />
            <text x={sx(r)} y={H - MB + 11} fontSize={9} fill="#8fa3b4" textAnchor="middle">{r}</text>
          </g>
        ))}
        <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="#ffffff" strokeOpacity={0.25} />
        <text x={W - MR} y={H - 2} fontSize={9} fill="#8fa3b4" textAnchor="end">r (pm)</text>
        <text x={ML - 3} y={MT + 2} fontSize={8.5} fill="#8fa3b4" textAnchor="end">{ymax >= 0.1 ? ymax.toFixed(2) : ymax.toFixed(3)}</text>
        <text x={ML - 3} y={H - MB} fontSize={8.5} fill="#8fa3b4" textAnchor="end">0</text>
        <text x={ML - 3} y={MT - 9} fontSize={8} fill="#8fa3b4" textAnchor="end">e⁻/pm</text>
        <text x={W - MR} y={MT - 9} fontSize={8} fill="#8fa3b4" textAnchor="end">▲ ⟨r⟩</text>
        {ocupadas.length > 0 && <path d={area} fill="#ffffff" fillOpacity={0.06} />}
        {ocupadas.map((s) => <path key={s} d={curvas[s]} fill="none" stroke={COL_SUBCAPA[s]} strokeWidth={1.4} strokeOpacity={0.95} />)}
        {ocupadas.length > 1 && <path d={pathTot} fill="none" stroke="#ffffff" strokeWidth={1.6} strokeOpacity={0.9} strokeDasharray="0" />}
        {/* ⟨r⟩ de cada subcapa: línea fina y marca sobre el eje */}
        {marcas.map((m) => m.r <= XMAX && (
          <g key={m.s}>
            <line x1={sx(m.r)} x2={sx(m.r)} y1={MT} y2={H - MB} stroke={COL_SUBCAPA[m.s]} strokeDasharray="2 3" strokeOpacity={0.55} />
            <path d={`M${sx(m.r).toFixed(1)},${(H - MB - 1).toFixed(1)}l-3,-5h6z`} fill={COL_SUBCAPA[m.s]} />
          </g>
        ))}
        {pico1s > 0 && (
          <text x={sx(10) + 4} y={MT - 1} fontSize={8} fill={COL_SUBCAPA['1s']}>1s ↑ {pico1s.toFixed(2)}</text>
        )}
        {ocupadas.length === 0 && <text x={(ML + W - MR) / 2} y={(MT + H - MB) / 2} fontSize={10} fill="#8fa3b4" textAnchor="middle">sin electrones ligados</text>}
      </svg>
    </div>
  );
}
