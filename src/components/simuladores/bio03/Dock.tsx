'use client';
/**
 * bio03/Dock.tsx — el dock DOM de la síntesis de proteínas (lienzos a devicePixelRatio,
 * tipografía del lab). Se redibuja desde la suscripción al MISMO reloj que mueve la
 * escena: la ventana de la polimerasa o del ribosoma está siempre donde se ve en 3D.
 *
 *  · Pista de secuencia: hebra molde 3′→5′ (en la traducción, los sitios del ribosoma), ARNm 5′→3′ (sólo lo que el alumno ya apareó;
 *    el hueco siguiente va vacío), marco de lectura en tripletes y la cadena N→C debajo
 *    de los codones ya traducidos. Encima, la burbuja de la polimerasa (con el sitio i+1)
 *    o los sitios E·P·A del ribosoma.
 *  · Rueda del código genético: los 64 codones (1.ª base dentro, 3.ª fuera), con AUG de
 *    inicio y los tres de paro. Se marcan SÓLO los codones ya traducidos.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { COLOR_BASE, CLASES_AA, BASES_ARN, BURBUJA, aminoacidoDe, colorAA, AMINOACIDOS } from './molecular';
import type { RelojSintesis } from './reloj';

function familia() {
  return typeof document !== 'undefined' ? getComputedStyle(document.body).fontFamily : 'system-ui, sans-serif';
}
function useTamano<T extends HTMLElement>(): [React.RefObject<T | null>, { w: number; h: number }] {
  const ref = useRef<T>(null);
  const [t, setT] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setT({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, t];
}
const conAlfa = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
function cajaRedonda(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}

// ───────────────────────────── pista de secuencia ─────────────────────────────

export function dibujarPista(cv: HTMLCanvasElement, w: number, h: number, r: RelojSintesis) {
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const g = cv.getContext('2d'); if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  const fam = familia();
  const adn = r.hecho.adn, n = adn.length;
  const arn = r.hecho.arn;
  const nTx = r.hecho.nTx;
  const ev = r.actual;
  const traduciendo = r.acto !== 'transcripcion';
  const etiq = Math.min(92, Math.max(64, w * 0.12));
  const margen = 10;
  const paso = Math.min(30, (w - etiq - 2 * margen) / (n + 0.6));
  const lado = Math.max(12, paso - 3);
  const x0 = etiq + margen;
  const xi = (i: number) => x0 + i * paso;
  const fila = Math.min(30, (h - 14) / 3.6);
  const yADN = 8 + fila * 0.55, yARN = yADN + fila * 1.15, yAA = yARN + fila * 1.3;
  const tLetra = Math.max(10, Math.min(15, lado * 0.62));

  // etiquetas de las filas
  g.textBaseline = 'middle'; g.textAlign = 'left';
  const rotulo = (txt: string, sub: string, y: number, color: string) => {
    g.font = `600 ${Math.round(Math.min(11, etiq / 7.4))}px ${fam}`; g.fillStyle = color; g.fillText(txt, 6, y - 5);
    g.font = `500 ${Math.round(Math.min(10, etiq / 8.4))}px ${fam}`; g.fillStyle = 'rgba(148,163,184,0.9)'; g.fillText(sub, 6, y + 7);
  };
  // en la traducción el ADN se quedó en el núcleo: esa franja pasa a ser la del ribosoma
  if (traduciendo) rotulo('Ribosoma', 'sitios', yADN + lado / 2, '#bfdbfe');
  else rotulo('ADN molde', '3′ → 5′', yADN + lado / 2, '#cbd5e1');
  rotulo('ARNm', '5′ → 3′', yARN + lado / 2, '#e9d5ff');
  rotulo('Proteína', 'N → C', yAA + lado * 0.42, '#fde68a');

  // ventana de la máquina (debajo de las letras): burbuja de la polimerasa o sitios del ribosoma
  if (!traduciendo) {
    const s = r.sTx;
    const a = xi(s + BURBUJA.arriba + 0.5) - 2, b = xi(s + BURBUJA.abajo + 0.5) + 1;
    const xa = Math.max(x0 - 6, a), xb = Math.min(w - 4, b);
    if (xb > xa && nTx < n) {
      g.fillStyle = 'rgba(167,139,250,0.12)'; g.strokeStyle = 'rgba(196,181,253,0.45)'; g.lineWidth = 1;
      cajaRedonda(g, xa, yADN - 5, xb - xa, yARN - yADN + lado + 10, 9); g.fill(); g.stroke();
      // sitio i+1: la base molde que se lee
      const xs = xi(s);
      g.strokeStyle = 'rgba(165,243,252,0.95)'; g.lineWidth = 2;
      cajaRedonda(g, xs - 2, yADN - 2, lado + 4, lado + 4, 6); g.stroke();
    }
  } else {
    const kP = r.kP;
    const listo = r.ensamblado > 0.5 || (ev && ev.tipo !== 'exportar');
    if (r.hecho.acto === 'traduccion' && !r.hecho.terminada && listo !== false) {
      const sitios: [string, number][] = [['E', kP - 1], ['P', kP], ['A', kP + 1]];
      for (const [nom, k] of sitios) {
        const xa = xi(3 * k) - 2, wv = 3 * paso + 1;
        if (xa < x0 - 6 || xa + wv > w) continue;
        g.fillStyle = nom === 'A' ? 'rgba(52,211,153,0.10)' : 'rgba(147,197,253,0.10)';
        g.strokeStyle = nom === 'A' ? 'rgba(110,231,183,0.6)' : 'rgba(147,197,253,0.45)'; g.lineWidth = 1.2;
        cajaRedonda(g, xa, yARN - 5, wv, lado + 10, 7); g.fill(); g.stroke();
        g.font = `700 ${Math.round(tLetra * 0.72)}px ${fam}`; g.fillStyle = nom === 'A' ? '#6ee7b7' : '#93c5fd'; g.textAlign = 'center';
        g.fillText(nom, xa + wv / 2, yADN + lado / 2 + 2);
        g.strokeStyle = nom === 'A' ? 'rgba(110,231,183,0.35)' : 'rgba(147,197,253,0.3)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(xa + wv / 2, yADN + lado / 2 + tLetra * 0.5); g.lineTo(xa + wv / 2, yARN - 5); g.stroke();
      }
    }
  }

  // letras
  g.textAlign = 'center';
  const ficha = (x: number, y: number, b: string, alfa: number, borde: string | null) => {
    const c = COLOR_BASE[b] ?? '#94a3b8';
    g.fillStyle = conAlfa(c, 0.26 * alfa); g.strokeStyle = borde ?? conAlfa(c, 0.85 * alfa); g.lineWidth = 1.2;
    cajaRedonda(g, x, y, lado, lado, 5); g.fill(); g.stroke();
    g.fillStyle = `rgba(255,255,255,${0.95 * alfa})`;
    g.font = `700 ${Math.round(tLetra)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    g.fillText(b, x + lado / 2, y + lado / 2 + 0.5);
  };
  if (!traduciendo) for (let i = 0; i < n; i++) ficha(xi(i), yADN, adn[i], i < nTx ? 0.6 : 1, null);
  // ARNm: sólo lo ya apareado (el NTP que llega aparece al aparear)
  const llegando = ev?.tipo === 'incorporar' ? Math.min(1, Math.max(0, (r.fase - 0.35) / 0.25)) : 0;
  for (let i = 0; i < n; i++) {
    if (i < nTx) ficha(xi(i), yARN, arn[i], 1, null);
    else if (i === nTx && llegando > 0) ficha(xi(i), yARN, ev!.valor, llegando, null);
    else if (i === nTx && !traduciendo) {
      g.setLineDash([3, 3]); g.strokeStyle = 'rgba(165,243,252,0.7)'; g.lineWidth = 1.2;
      cajaRedonda(g, xi(i), yARN, lado, lado, 5); g.stroke(); g.setLineDash([]);
    } else {
      g.strokeStyle = 'rgba(148,163,184,0.16)'; g.lineWidth = 1;
      cajaRedonda(g, xi(i), yARN, lado, lado, 5); g.stroke();
    }
  }
  // marco de lectura: tripletes
  for (let k = 0; 3 * k + 3 <= n; k++) {
    const xa = xi(3 * k) + 1, xb = xi(3 * k + 2) + lado - 1, y = yARN + lado + 4;
    g.strokeStyle = 'rgba(203,213,225,0.35)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(xa, y - 2); g.lineTo(xa, y); g.lineTo(xb, y); g.lineTo(xb, y - 2); g.stroke();
  }
  // cadena: aminoácidos de los codones ya traducidos (y la pastilla de paro al terminar)
  const pep = r.peptido;
  const alto = Math.max(14, lado * 0.82);
  for (let k = 0; k < pep.length; k++) {
    const xa = xi(3 * k), wv = 3 * paso - 3;
    const c = colorAA(pep[k]);
    g.fillStyle = conAlfa(c, 0.85); cajaRedonda(g, xa, yAA, wv, alto, alto / 2); g.fill();
    g.fillStyle = '#0b1220'; g.font = `700 ${Math.round(Math.min(12, alto * 0.62))}px ${fam}`;
    g.fillText(pep[k], xa + wv / 2, yAA + alto / 2 + 0.5);
    if (k > 0) { g.strokeStyle = 'rgba(253,230,138,0.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(xa - 3, yAA + alto / 2); g.lineTo(xa, yAA + alto / 2); g.stroke(); }
  }
  if (r.hecho.terminada) {
    const k = pep.length, xa = xi(3 * k), wv = 3 * paso - 3;
    g.strokeStyle = 'rgba(248,113,113,0.8)'; g.lineWidth = 1.2; cajaRedonda(g, xa, yAA, wv, alto, alto / 2); g.stroke();
    g.fillStyle = '#fca5a5'; g.font = `700 ${Math.round(Math.min(11, alto * 0.58))}px ${fam}`; g.fillText('paro', xa + wv / 2, yAA + alto / 2 + 0.5);
  }
}

// ───────────────────────────── rueda del código genético ─────────────────────────────

/** Rueda: 1.ª base en el anillo interior, 2.ª en el medio, 3.ª fuera; aminoácidos por bloques. */
export function dibujarRueda(cv: HTMLCanvasElement, lado: number, r: RelojSintesis | null, grande = false) {
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  const W = Math.round(lado * dpr);
  if (cv.width !== W || cv.height !== W) { cv.width = W; cv.height = W; }
  const g = cv.getContext('2d'); if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, lado, lado);
  const fam = familia();
  const c = lado / 2;
  const R = lado / 2 - (grande ? 6 : 3);
  const r1 = R * 0.2, r2 = R * 0.38, r3 = R * 0.55, r4 = R * 0.66, r5 = R;
  const a0 = -Math.PI / 2;
  const sector = (ra: number, rb: number, ta: number, tb: number) => { g.beginPath(); g.arc(c, c, rb, ta, tb); g.arc(c, c, ra, tb, ta, true); g.closePath(); };
  const B = BASES_ARN;
  const marcados = new Set<string>();
  let ultimo = '';
  if (r) {
    const arn = r.hecho.arn;
    for (let k = 0; k < r.peptido.length; k++) { const cod = arn.slice(3 * k, 3 * k + 3); marcados.add(cod); ultimo = cod; }
    if (r.hecho.terminada) { const cod = arn.slice(3 * r.peptido.length, 3 * r.peptido.length + 3); marcados.add(cod); ultimo = cod; }
  }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const letra = (txt: string, rr: number, ang: number, size: number, color: string, peso = 700) => {
    g.save(); g.translate(c + rr * Math.cos(ang), c + rr * Math.sin(ang)); g.rotate(ang + Math.PI / 2);
    g.font = `${peso} ${size}px ${fam}`; g.fillStyle = color; g.fillText(txt, 0, 0); g.restore();
  };
  for (let i = 0; i < 4; i++) {
    const ta = a0 + (i * Math.PI) / 2, tb = ta + Math.PI / 2;
    sector(r1, r2, ta, tb); g.fillStyle = conAlfa(COLOR_BASE[B[i]], 0.5); g.fill();
    g.strokeStyle = '#0c1524'; g.lineWidth = 1.2; g.stroke();
    letra(B[i], (r1 + r2) / 2, (ta + tb) / 2, Math.round(R * 0.1), '#ffffff');
    for (let j = 0; j < 4; j++) {
      const sa = ta + (j * Math.PI) / 8, sb = sa + Math.PI / 8;
      sector(r2, r3, sa, sb); g.fillStyle = conAlfa(COLOR_BASE[B[j]], 0.36); g.fill(); g.stroke();
      letra(B[j], (r2 + r3) / 2, (sa + sb) / 2, Math.round(R * 0.072), '#f1f5f9');
      for (let k = 0; k < 4; k++) {
        const ca = sa + (k * Math.PI) / 32, cb = ca + Math.PI / 32;
        const cod = B[i] + B[j] + B[k];
        const aa = aminoacidoDe(cod);
        sector(r3, r4, ca, cb); g.fillStyle = conAlfa(COLOR_BASE[B[k]], 0.24); g.fill(); g.lineWidth = 0.6; g.stroke();
        if (grande || R > 70) letra(B[k], (r3 + r4) / 2, (ca + cb) / 2, Math.max(6, Math.round(R * 0.046)), 'rgba(241,245,249,0.85)', 600);
        sector(r4, r5, ca, cb);
        g.fillStyle = aa === 'STOP' ? 'rgba(127,29,29,0.85)' : cod === 'AUG' ? conAlfa('#f6c453', 0.95) : conAlfa(colorAA(aa), 0.55);
        g.fill(); g.lineWidth = 0.6; g.stroke();
      }
      // nombre del aminoácido por bloque contiguo dentro del sector de la 2.ª base
      let k = 0;
      while (k < 4) {
        const aa = aminoacidoDe(B[i] + B[j] + B[k]);
        let k2 = k;
        while (k2 + 1 < 4 && aminoacidoDe(B[i] + B[j] + B[k2 + 1]) === aa) k2++;
        const ang = sa + ((k + k2 + 1) / 2) * (Math.PI / 32);
        const nombre = aa === 'STOP' ? 'paro' : aa;
        const tam = Math.max(6, Math.round(R * (grande ? 0.05 : 0.056)));
        g.save(); g.translate(c + ((r4 + r5) / 2) * Math.cos(ang), c + ((r4 + r5) / 2) * Math.sin(ang));
        let rot = ang; if (Math.cos(ang) < 0) rot += Math.PI;
        g.rotate(rot); g.font = `700 ${tam}px ${fam}`; g.fillStyle = aa === 'STOP' ? '#fecaca' : '#0b1220'; g.fillText(nombre, 0, 0); g.restore();
        k = k2 + 1;
      }
    }
  }
  // codones ya traducidos: su camino por los tres anillos
  marcados.forEach((cod) => {
    const i = B.indexOf(cod[0] as never), j = B.indexOf(cod[1] as never), k = B.indexOf(cod[2] as never);
    if (i < 0 || j < 0 || k < 0) return;
    const ta = a0 + (i * Math.PI) / 2, sa = ta + (j * Math.PI) / 8, ca = sa + (k * Math.PI) / 32;
    const fuerte = cod === ultimo;
    g.strokeStyle = fuerte ? '#fef9c3' : 'rgba(254,249,195,0.55)'; g.lineWidth = fuerte ? 2.2 : 1.3;
    if (fuerte) { g.shadowColor = 'rgba(253,224,71,0.9)'; g.shadowBlur = 8; }
    sector(r1, r2, ta, ta + Math.PI / 2); g.stroke();
    sector(r2, r3, sa, sa + Math.PI / 8); g.stroke();
    sector(r3, r5, ca, ca + Math.PI / 32); g.stroke();
    g.shadowBlur = 0;
  });
  // centro
  g.beginPath(); g.arc(c, c, r1 - 1, 0, Math.PI * 2); g.fillStyle = '#0c1524'; g.fill();
  g.fillStyle = 'rgba(203,213,225,0.85)'; g.font = `600 ${Math.max(7, Math.round(R * 0.068))}px ${fam}`;
  g.fillText('5′→3′', c, c);
}

export default function DockSintesis({ reloj, onAmpliarRueda }: { reloj: RelojSintesis; onAmpliarRueda: () => void }) {
  const [cont, tamCont] = useTamano<HTMLDivElement>();
  const [caja, tam] = useTamano<HTMLDivElement>();
  const pista = useRef<HTMLCanvasElement>(null);
  const rueda = useRef<HTMLCanvasElement>(null);
  const conRueda = tamCont.w >= 520;
  const ultima = useRef('');
  const dibujar = useCallback((forzar = false) => {
    const r = reloj;
    const clave = [r.hecho.adn, r.hecho.nTx, r.peptido.length, r.hecho.terminada, r.acto, r.actual?.tipo ?? '', r.actual?.valor ?? '', Math.round(r.fase * 40), Math.round(r.sTx * 40), Math.round(r.kP * 40), r.ensamblado > 0.5, tam.w, tam.h].join('|');
    if (!forzar && clave === ultima.current) return;
    ultima.current = clave;
    if (pista.current && tam.w > 0) dibujarPista(pista.current, tam.w, tam.h, r);
    if (rueda.current && conRueda && tam.h > 0) dibujarRueda(rueda.current, tam.h, r);
  }, [reloj, tam.w, tam.h, conRueda]);
  useEffect(() => { dibujar(true); return reloj.suscribir(() => dibujar()); }, [reloj, dibujar]);
  return (
    <div ref={cont} className="flex h-[clamp(116px,23%,176px)] shrink-0 gap-2 border-t border-white/10 bg-[#0c1524] p-2" data-dock="sintesis">
      <div ref={caja} className="relative min-w-0 flex-1 overflow-hidden rounded-md bg-[#0a1220] ring-1 ring-white/[0.06]">
        <canvas ref={pista} className="absolute inset-0 h-full w-full" role="img"
          aria-label={`Secuencia: hebra molde de ${reloj.hecho.adn.length} bases, ${reloj.hecho.nTx} ya transcritas y ${reloj.peptido.length} aminoácidos unidos`} />
      </div>
      {conRueda && (
        <button type="button" onClick={onAmpliarRueda} title="Código genético (ampliar)" aria-label="Ampliar la rueda del código genético"
          className="group relative aspect-square h-full shrink-0 overflow-hidden rounded-md bg-[#0a1220] ring-1 ring-white/[0.06] hover:ring-amber-200/40">
          <canvas ref={rueda} className="absolute inset-0 h-full w-full" />
          <Maximize2 size={12} className="absolute right-1 top-1 text-slate-400 opacity-60 group-hover:opacity-100" />
        </button>
      )}
    </div>
  );
}

/** Leyenda corta de colores de las clases de aminoácido (para el panel). */
export const LEYENDA_AA = (Object.keys(CLASES_AA) as (keyof typeof CLASES_AA)[]).map((k) => ({ clave: k, ...CLASES_AA[k] }));
export const NOMBRE_AA = (aa: string) => AMINOACIDOS[aa]?.nombre ?? aa;
