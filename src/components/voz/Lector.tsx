'use client';

/**
 * LA BOCINA DE LA PORTADA DE MISIÓN.
 *
 * POR QUÉ NO ES `speechSynthesis`. El navegador trae un sintetizador gratis y
 * la plataforma lo usaba —`audio.playGuide()` en `src/utils/audioEngine.ts`—,
 * pero la voz que sale es la que ESA máquina tenga instalada: en la laptop de
 * una escuela suele ser la SAPI vieja de Windows. Dos salones oyen a dos
 * personas distintas y ninguna es la que se aprobó. Aquí el audio viene grabado
 * con `es-MX-DaliaNeural`, así que suena igual en todas partes, y un MP3 de
 * 40 KB pesa menos que casi cualquier imagen de la misma página.
 *
 * DOS ELEMENTOS DE AUDIO, NO UNO, y esa es la razón de que esto no sea diez
 * líneas. La portada se narra frase por frase para que cada una lleve el ritmo
 * de su papel; con un solo `<audio>` habría que asignarle el `src` siguiente al
 * terminar el anterior, y el hueco que tarda el navegador en abrir el archivo
 * se oye entre frase y frase. Con dos alternándose, mientras suena una ya está
 * cargada la otra, y el silencio que queda entre las dos es el que puso la
 * dirección y no el que puso la red.
 *
 * LA PAUSA ES PARTE DEL TEXTO. `pausaEntre` la saca de la tabla de papeles: un
 * `giro` entra después de cuatro décimas de silencio y un `contraste` entra casi
 * encima de la frase anterior. Es la mitad de la dirección —la otra es el ritmo,
 * que ya está grabado— y sin ella un párrafo suena plano por bien leído que
 * esté.
 *
 * SE PARA Y HACE COLA. Nunca suenan dos cosas a la vez y nada arranca solo:
 * arranca cuando alguien lo pide. Un botón que ya está sonando se convierte en
 * el de parar, que es el primero que se busca.
 *
 * UN CLIP QUE FALTA NO ROMPE LA FILA. Si un MP3 no está —porque su lab se narró
 * a medias, o porque el texto cambió y todavía no se ha vuelto a grabar— se
 * salta al siguiente en vez de dejar la cola colgada delante del grupo.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { pausaEntre, RECORTE } from '@/lib/voz/decir';
import type { Papel } from '@/lib/voz/decir';
import { rutaVoz } from '@/lib/voz/claves';
import type { Clip } from '@/lib/voz/claves';

interface Lector {
  /** Si es `false` este lab no tiene voz grabada y las bocinas no se pintan. */
  activo: boolean;
  /** La clave que suena en este momento, para iluminar su frase. */
  sonando: string | null;
  leer: (clips: Clip[]) => void;
  parar: () => void;
}

const Ctx = createContext<Lector>({
  activo: false, sonando: null, leer: () => {}, parar: () => {},
});

export function useLector(): Lector {
  return useContext(Ctx);
}

/** ¿Es esta la frase que se está diciendo ahora? Para marcarla en pantalla. */
export function useSuena(clave: string): boolean {
  return useContext(Ctx).sonando === clave;
}

export function ProveedorLector({
  labId, activo, children,
}: {
  labId: string;
  activo: boolean;
  children: React.ReactNode;
}) {
  /* Los dos elementos que se turnan. `vivo` es un contador que sube al parar:
     cualquier temporizador que despierte con un número viejo sabe que su cola
     ya no existe y no hace nada. Sin eso, parar durante una pausa deja
     programado un `play()` que arranca solo medio segundo después. */
  const audios = useRef<HTMLAudioElement[]>([]);
  const cola = useRef<Clip[]>([]);
  const actual = useRef(-1);
  const anterior = useRef<Papel | null>(null);
  const vivo = useRef(0);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sonando, setSonando] = useState<string | null>(null);

  /* `suena` se llama a sí misma para encadenar; la referencia rompe el ciclo
     sin rehacer la función en cada clip. */
  const encadena = useRef<(n: number) => void>(() => {});

  const parar = useCallback(() => {
    vivo.current += 1;
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = null;
    cola.current = [];
    actual.current = -1;
    anterior.current = null;
    for (const a of audios.current) { a.pause(); a.removeAttribute('src'); }
    setSonando(null);
  }, []);

  /** Deja cargado el clip `n` en el elemento que le toca, sin sonarlo. */
  const precarga = useCallback((n: number) => {
    const clip = cola.current[n];
    const a = audios.current[n % 2];
    if (!clip || !a) return;
    a.src = rutaVoz(labId, clip.clave);
    a.load();
  }, [labId]);

  const suena = useCallback((n: number) => {
    const generacion = vivo.current;
    const clip = cola.current[n];
    if (!clip) { setSonando(null); actual.current = -1; anterior.current = null; return; }

    const a = audios.current[n % 2];
    if (!a) return;
    actual.current = n;

    // Normalmente ya está precargado; si no —el primero de la cola—, se pone.
    const url = rutaVoz(labId, clip.clave);
    if (!a.src.endsWith(url)) { a.src = url; a.load(); }

    setSonando(clip.clave);
    anterior.current = clip.papel;
    // El siguiente se va cargando mientras éste suena.
    precarga(n + 1);

    /* UN SOLO AVANCE POR CLIP. Hay dos caminos que pueden pedirlo —el salto
       programado y el `ended` de respaldo— y sin este guardia los dos se
       cumplirían y la cola se saltaría una frase. */
    const avanza = () => {
      if (generacion !== vivo.current || actual.current !== n) return;
      a.pause();
      encadena.current(n + 1);
    };

    const preparar = () => {
      if (generacion !== vivo.current || actual.current !== n) return;
      /* Se entra al clip ya empezado, saltando el silencio del motor. */
      try { a.currentTime = RECORTE.entrada; } catch { /* sin metadatos todavía */ }

      /* Y se salta al siguiente ANTES de que acabe: esperar a `ended` sería
         esperar las ocho décimas de silencio del final, que es justo lo que
         aplana la dirección. */
      const dur = a.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      const restante = dur - RECORTE.salida - RECORTE.entrada;
      if (restante <= 0) return;    // clip cortísimo: que termine solo por `ended`
      const pausa = n + 1 < cola.current.length
        ? pausaEntre(clip.papel, cola.current[n + 1].papel)
        : 0;
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(avanza, (restante + pausa) * 1000);
    };

    if (a.readyState >= 1) preparar();
    else a.addEventListener('loadedmetadata', preparar, { once: true });

    void a.play().catch(() => { if (generacion === vivo.current) parar(); });
  }, [labId, parar, precarga]);

  useEffect(() => { encadena.current = suena; }, [suena]);

  useEffect(() => {
    if (!activo) return undefined;

    const hechos = [new Audio(), new Audio()];
    for (const a of hechos) a.preload = 'auto';
    audios.current = hechos;

    /* `ended` y `error` van al mismo sitio a propósito: un clip que falta se
       comporta igual que uno que ya terminó, así que la cola sigue en vez de
       quedarse colgada a media clase. Es también la red por si el salto
       programado no llegó a fijarse (duración desconocida). */
    const alTerminar = (ev: Event) => {
      const cual = audios.current.indexOf(ev.currentTarget as HTMLAudioElement);
      const n = actual.current;
      if (n < 0 || cual !== n % 2) return;   // eco de un elemento que ya no manda
      encadena.current(n + 1);
    };
    for (const a of hechos) {
      a.addEventListener('ended', alTerminar);
      a.addEventListener('error', alTerminar);
    }
    return () => {
      for (const a of hechos) {
        a.removeEventListener('ended', alTerminar);
        a.removeEventListener('error', alTerminar);
        a.pause();
      }
      if (temporizador.current) clearTimeout(temporizador.current);
      audios.current = [];
      cola.current = [];
    };
  }, [activo]);

  const leer = useCallback((clips: Clip[]) => {
    if (!activo || clips.length === 0) return;
    parar();
    cola.current = clips;
    anterior.current = null;
    precarga(0);
    suena(0);
  }, [activo, parar, precarga, suena]);

  const valor = useMemo<Lector>(
    () => ({ activo, sonando, leer, parar }),
    [activo, sonando, leer, parar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

/**
 * Se calla al cambiar de pestaña o al salir de la portada.
 *
 * Sin esto, tocar «Aplicaciones» mientras se lee la bienvenida deja a la
 * locutora describiendo un texto que ya no está en pantalla.
 */
export function CallarAlCambiar({ testigo }: { testigo: unknown }) {
  const { parar } = useLector();
  useEffect(() => parar, [testigo, parar]);
  return null;
}

function IconoBocina() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-full h-full">
      <path d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4z" fill="currentColor" />
      <path
        d="M15.6 9.2a4 4 0 0 1 0 5.6M18.3 6.5a7.8 7.8 0 0 1 0 11"
        stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
      />
    </svg>
  );
}

function IconoParar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-full h-full">
      <rect x="6.5" y="6.5" width="11" height="11" rx="2.2" fill="currentColor" />
    </svg>
  );
}

/**
 * El botón que lee un bloque entero.
 *
 * `etiqueta` es lo que oye un lector de pantalla y lo que sale en el `title`:
 * decir «Escuchar» a secas delante de cuatro bocinas iguales no orienta a nadie.
 */
export function Bocina({
  clips, etiqueta, compacta = false,
}: {
  clips: Clip[];
  etiqueta: string;
  compacta?: boolean;
}) {
  const { activo, sonando, leer, parar } = useLector();
  if (!activo || clips.length === 0) return null;

  const suena = sonando !== null && clips.some((c) => c.clave === sonando);
  return (
    <button
      type="button"
      onClick={() => (suena ? parar() : leer(clips))}
      aria-label={suena ? `Parar la lectura de ${etiqueta}` : `Escuchar ${etiqueta}`}
      title={suena ? 'Parar' : `Escuchar ${etiqueta}`}
      className={[
        'inline-flex items-center gap-2 rounded-full border transition-all shrink-0',
        compacta ? 'h-8 w-8 justify-center p-0' : 'h-9 px-3',
        suena
          ? 'bg-cyan-400/20 border-cyan-300/60 text-cyan-200 shadow-[0_0_18px_-4px_rgba(34,211,238,0.8)]'
          : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:text-white',
      ].join(' ')}
    >
      <span className="w-4 h-4 shrink-0">{suena ? <IconoParar /> : <IconoBocina />}</span>
      {!compacta && (
        <span className="text-[11px] font-bold uppercase tracking-wider">
          {suena ? 'Parar' : 'Escuchar'}
        </span>
      )}
    </button>
  );
}
