/**
 * @jest-environment node
 *
 * biologia-3 (Síntesis de proteínas): la ciencia de la escena y del dock.
 *
 *  · ADN B: 10,5 pb por vuelta, 0,338 nm de subida, Ø 2,0 nm, surcos menor 1,2 nm y
 *    mayor 2,35 nm, hélice dextrógira.
 *  · Complementariedad (ADN→ARN, codón→anticodón) y puentes de H (2 en A–T/A–U, 3 en G–C).
 *  · Código genético completo (64 codones, 61 con sentido, 3 de paro, 20 aminoácidos) y
 *    traducción de secuencias de referencia (β-globina humana y su mutación falciforme),
 *    marco de lectura y paro.
 *  · Cinética rotulada (cámara lenta), Stokes–Einstein (ATP en agua ≈ 3,7·10⁻¹⁰ m²/s) y
 *    Zimm–Bragg (un péptido de 4–6 residuos no forma hélice α).
 *  · Burbuja de transcripción (≈ 13 nt, híbrido de 8 pb) y sitios E·P·A.
 *  · Superficies moleculares cerradas, orientadas y sin normales nulas.
 *  · El reloj: anima lo que el store decide y NUNCA expone la base ni el anticodón que
 *    tocaría antes de que el alumno los elija.
 */
import * as M from '@/components/simuladores/bio03/molecular';
import {
  superficieGaussiana, mallaDe, formaPolimerasa, formaSubunidadMenor, formaSubunidadMayor, formaARNt,
  formaFactorLiberacion, formaFactorAlargamiento, L_ARNT, type Malla,
} from '@/components/simuladores/bio03/superficie';
import { RelojSintesis, codificanteVisible, type EstadoSintesis } from '@/components/simuladores/bio03/reloj';
import { opcionesARNt } from '@/components/simuladores/bio03/opciones';
import * as B from '@/domain/biologia';
import { useSimuladorStore } from '@/store/simuladorStore';

const S = () => useSimuladorStore.getState();
const dist = (a: M.V3, b: M.V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// ═════════════════════════════ ADN B ═════════════════════════════

describe('ADN B con geometría real', () => {
  test('10,5 pb por vuelta, 0,338 nm de subida y paso de 3,55 nm', () => {
    expect(M.ADN_B.pbPorVuelta).toBe(10.5);
    expect(M.ADN_B.subida).toBeCloseTo(0.338, 3);
    expect(M.GIRO * 180 / Math.PI).toBeCloseTo(34.29, 1);
    expect(M.PASO_HELICE).toBeCloseTo(3.549, 2);
    // una vuelta completa son 10,5 pares: el travesaño vuelve al mismo acimut
    const a = M.nucleotidoDuplex(0, 0, 'A').azucar, b = M.nucleotidoDuplex(10.5, 0, 'A').azucar;
    expect(a[1]).toBeCloseTo(b[1], 9);
    expect(a[2]).toBeCloseTo(b[2], 9);
    expect(b[0] - a[0]).toBeCloseTo(M.PASO_HELICE, 9);
  });

  test('diámetro ≈ 2,0 nm y surcos menor ≈ 1,2 nm y mayor ≈ 2,35 nm', () => {
    expect(M.DIAMETRO_ADN).toBeGreaterThan(1.95);
    expect(M.DIAMETRO_ADN).toBeLessThan(2.1);
    const { menor, mayor } = M.surcos();
    expect(menor).toBeCloseTo(1.2, 6);
    expect(mayor).toBeCloseTo(2.349, 3);
    expect(menor + mayor).toBeCloseTo(M.PASO_HELICE, 9);
    // medido en la geometría: a acimut fijo, las dos hebras de fósforos se cruzan
    // separadas por el surco menor y el mayor a lo largo del eje
    const x1 = (phi: number, h: 0 | 1) => { // x en que la hebra h pasa por el acimut phi (primer cruce ≥ 0)
      const t0 = M.THETA0 + (h === 1 ? M.DESFASE_HEBRAS : 0);
      let u = (phi - t0) / M.GIRO;
      while (u < 0) u += M.ADN_B.pbPorVuelta;
      return u * M.ADN_B.subida;
    };
    const a = x1(1, 0), b = x1(1, 1);
    const sep = ((a - b) % M.PASO_HELICE + M.PASO_HELICE) % M.PASO_HELICE;
    expect(Math.min(sep, M.PASO_HELICE - sep)).toBeCloseTo(1.2, 6);
    expect(Math.max(sep, M.PASO_HELICE - sep)).toBeCloseTo(2.349, 3);
  });

  test('hélice dextrógira: torsión positiva', () => {
    // r(u) = (u·subida, R cos θ, R sin θ), θ = θ0 + u·giro: τ ∝ (r′ × r″)·r‴ > 0
    const R = M.ADN_B.radioP, c = M.ADN_B.subida, w = M.GIRO;
    const r1 = [c, -R * w * Math.sin(0), R * w * Math.cos(0)];
    const r2 = [0, -R * w * w * Math.cos(0), -R * w * w * Math.sin(0)];
    const r3 = [0, R * w ** 3 * Math.sin(0), -R * w ** 3 * Math.cos(0)];
    const cr = [r1[1] * r2[2] - r1[2] * r2[1], r1[2] * r2[0] - r1[0] * r2[2], r1[0] * r2[1] - r1[1] * r2[0]];
    const tau = cr[0] * r3[0] + cr[1] * r3[1] + cr[2] * r3[2];
    expect(tau).toBeGreaterThan(0);
    // y la geometría del módulo gira en ese sentido: θ crece con x
    const p0 = M.nucleotidoDuplex(0, 0, 'A').azucar, p1 = M.nucleotidoDuplex(1, 0, 'A').azucar;
    const a0 = Math.atan2(p0[2], p0[1]), a1 = Math.atan2(p1[2], p1[1]);
    expect(Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0))).toBeCloseTo(M.GIRO, 9);
  });

  test('cada par de bases cruza el eje: purina + pirimidina = travesaño completo', () => {
    for (const [t, c] of [['A', 'T'], ['G', 'C'], ['T', 'A'], ['C', 'G']]) {
      const m = M.nucleotidoDuplex(3, 0, t), k = M.nucleotidoDuplex(3, 1, c);
      expect(dist(m.punta, k.punta)).toBeLessThan(1e-9);           // se tocan
      expect(M.fraccionBase(t) + M.fraccionBase(c)).toBeCloseTo(1, 12);
    }
    // la purina ocupa más de la mitad
    expect(M.fraccionBase('A')).toBeGreaterThan(0.5);
    expect(M.fraccionBase('C')).toBeLessThan(0.5);
  });

  test('la base molde del sitio i+1 mira a la cámara (travesaño vertical, del lado +z)', () => {
    const m = M.nucleotidoDuplex(0, 0, 'A').azucar, k = M.nucleotidoDuplex(0, 1, 'A').azucar;
    expect(Math.abs(m[2] - k[2])).toBeLessThan(1e-9);          // vertical
    expect(m[1]).toBeGreaterThan(k[1]);                          // molde arriba, hueco del NTP abajo
    expect((m[2] + k[2]) / 2).toBeGreaterThan(0.2);              // de cara a la cámara
  });
});

// ═════════════════════════════ complementariedad ═════════════════════════════

describe('complementariedad y puentes de hidrógeno', () => {
  test('ADN molde → ARN: A→U, T→A, C→G, G→C', () => {
    expect('TACG'.split('').map(M.baseARN).join('')).toBe('AUGC');
    expect(B.transcribir('TACCAGGGTTACATT')).toBe('AUGGUCCCAAUGUAA');
  });
  test('anticodón = complemento del codón (alineado 3′→5′)', () => {
    expect(M.anticodonDe('AUG')).toBe('UAC');
    expect(M.anticodonDe('GGC')).toBe('CCG');
    for (const c of M.CODONES) expect(M.anticodonDe(c)).toBe(B.anticodonB3(c));
  });
  test('A–T y A–U: 2 puentes; G–C: 3; desapareadas: 0', () => {
    expect(M.puentesH('A', 'T')).toBe(2);
    expect(M.puentesH('U', 'A')).toBe(2);
    expect(M.puentesH('G', 'C')).toBe(3);
    expect(M.puentesH('C', 'G')).toBe(3);
    expect(M.puentesH('A', 'C')).toBe(0);
    expect(M.puentesH('G', 'U')).toBe(0);
    expect(M.puentesH('A', 'A')).toBe(0);
  });
});

// ═════════════════════════════ código genético ═════════════════════════════

describe('código genético completo y marco de lectura', () => {
  test('64 codones: 61 con sentido, 3 de paro, 20 aminoácidos; AUG es Met', () => {
    expect(M.CODONES).toHaveLength(64);
    expect(new Set(M.CODONES).size).toBe(64);
    expect([...M.CODONES_PARO].sort()).toEqual(['UAA', 'UAG', 'UGA']);
    const aas = new Set(M.CODONES.map(M.aminoacidoDe).filter((a) => a !== 'STOP'));
    expect(aas.size).toBe(20);
    expect(M.aminoacidoDe('AUG')).toBe('Met');
    // cada aminoácido tiene clase, volumen y propensión
    for (const a of aas) expect(M.AMINOACIDOS[a]).toBeDefined();
    // degeneración: Leu, Ser y Arg con 6; Met y Trp con 1
    const n = (aa: string) => M.CODONES.filter((c) => M.aminoacidoDe(c) === aa).length;
    expect([n('Leu'), n('Ser'), n('Arg'), n('Met'), n('Trp')]).toEqual([6, 6, 6, 1, 1]);
  });

  test('β-globina humana (HBB): MVHLTPEEK… y la mutación falciforme Glu6Val', () => {
    // codones 1–9 del ARNm de HBB (NM_000518)
    const hbb = 'AUGGUGCACCUGACUCCUGAGGAGAAG';
    const letras = (aas: string[]) => aas.map((a) => M.AMINOACIDOS[a].letra).join('');
    expect(letras(M.traducirDesdeAUG(hbb))).toBe('MVHLTPEEK');
    // GAG → GUG en el codón 7 (Glu6 contando sin la Met): anemia falciforme
    const falciforme = hbb.slice(0, 18) + 'GUG' + hbb.slice(21);
    expect(letras(M.traducirDesdeAUG(falciforme))).toBe('MVHLTPVEK');
  });

  test('el marco de lectura y el paro', () => {
    const arn = 'AUGGCCAUUGUAAUGGGCCGCUGAAAGGGU';
    expect(M.leerMarco(arn).map((c) => c.aa)).toEqual(['Met', 'Ala', 'Ile', 'Val', 'Met', 'Gly', 'Arg', 'STOP']);
    // corrido una base, el mensaje es otro
    expect(M.leerMarco(arn, 1).map((c) => c.aa).slice(0, 3)).toEqual(['Trp', 'Pro', 'Leu']);
    // traducirDesdeAUG coincide con el dominio en todas las semillas del lab
    const rng = B.rngConSemilla(7);
    for (let i = 0; i < 300; i++) {
      const arnGen = B.transcribir(B.semillaB3(rng));
      expect(M.traducirDesdeAUG(arnGen)).toEqual(B.traducir(arnGen));
      expect(M.leerMarco(arnGen).at(-1)!.aa).toBe('STOP');
    }
  });

  test('la 5′ UTR no tiene AUG y termina en el contexto de Kozak', () => {
    expect(M.SECUENCIAS.utr5).toHaveLength(M.UTR5);
    expect(M.SECUENCIAS.utr5.includes('AUG')).toBe(false);
    expect(M.SECUENCIAS.utr5.endsWith('GCCACC')).toBe(true);
    // la hebra molde de la UTR transcribe exactamente esa UTR
    expect(B.transcribir(M.SECUENCIAS.utr5Molde)).toBe(M.SECUENCIAS.utr5);
  });
});

// ═════════════════════════════ cinética, difusión, hélice ═════════════════════════════

describe('cinética rotulada, Stokes–Einstein y Zimm–Bragg', () => {
  test('cámara lenta = duración en pantalla × velocidad real', () => {
    expect(M.camaraLenta('transcripcion')).toBeCloseTo(M.DUR.incorporacion * M.TASA_POL_II, 9);
    expect(M.camaraLenta('traduccion')).toBeCloseTo(M.DUR.elongacion * M.TASA_RIBOSOMA, 9);
    expect(M.camaraLenta('transcripcion', 1 / 3)).toBeCloseTo(3 * M.camaraLenta('transcripcion'), 9);
    // la Pol II es más rápida que el ribosoma (nt/s frente a codones/s)
    expect(M.TASA_POL_II).toBeGreaterThan(3 * M.TASA_RIBOSOMA);
  });

  test('Stokes–Einstein: ATP en agua a 25 °C ≈ 3,7·10⁻¹⁰ m²/s', () => {
    const D = M.difusion(M.RADIO_HIDRO.ntp);
    expect(D).toBeGreaterThan(3.5e-10);
    expect(D).toBeLessThan(3.95e-10);
    // un ARNt (mayor) difunde más despacio, en proporción inversa al radio
    expect(M.difusion(M.RADIO_HIDRO.arnt) / D).toBeCloseTo(M.RADIO_HIDRO.ntp / M.RADIO_HIDRO.arnt, 9);
    // para ver 2 nm/s en pantalla hay que ir ~10⁸ veces más lento
    const f = M.factorBrowniano(D, 2);
    expect(f).toBeGreaterThan(1e8);
    expect(f).toBeLessThan(1e9);
  });

  test('Zimm–Bragg: hélice infinita a s = 1 → θ = ½; cadena larga con s > 1 → hélice; 4–6 residuos → no', () => {
    const larga = (s: number, n: number) => M.helicidadZB(Array(n).fill(s));
    expect(larga(1, 4000)).toBeCloseTo(0.5, 1);
    expect(larga(1.5, 400)).toBeGreaterThan(0.9);
    expect(larga(0.7, 400)).toBeLessThan(0.05);
    // los péptidos del lab (Met + 3–5 residuos) no se pliegan
    const rng = B.rngConSemilla(3);
    for (let i = 0; i < 200; i++) {
      const pep = B.traducir(B.transcribir(B.semillaB3(rng)));
      expect(M.helicidadPeptido(pep)).toBeLessThan(0.05);
    }
    // un poli-Ala de 40 sí (los péptidos AK de Baldwin son helicoidales)
    expect(M.helicidadPeptido(Array(40).fill('Ala'))).toBeGreaterThan(0.6);
  });

  test('cuentas del péptido: Cα–Cα 0,38 nm y radio por el volumen de Zamyatnin', () => {
    expect(M.CA_CA).toBeCloseTo(0.38, 3);
    expect(M.radioResiduo('Gly')).toBeCloseTo(0.243, 2);
    expect(M.radioResiduo('Trp')).toBeCloseTo(0.379, 2);
    expect(M.radioResiduo('Trp')).toBeGreaterThan(M.radioResiduo('Ala'));
  });
});

// ═════════════════════════════ burbuja y ribosoma ═════════════════════════════

describe('burbuja de transcripción y sitios del ribosoma', () => {
  test('la burbuja abre ≈ 13 nt y el híbrido ARN–ADN tiene 8 pb', () => {
    let abiertos = 0;
    for (let u = -20; u <= 10; u++) if (M.aperturaBurbuja(u) > 0.5) abiertos++;
    expect(abiertos).toBeGreaterThanOrEqual(12);
    expect(abiertos).toBeLessThanOrEqual(14);
    expect(M.BURBUJA.hibrido).toBe(8);
    expect(M.aperturaBurbuja(-30)).toBe(0);
    expect(M.aperturaBurbuja(8)).toBe(0);
    // en el híbrido el ARN aparea con la molde: sus puntas se tocan
    for (let u = -8; u <= -1; u++) {
      const arn = M.nucleotidoHibrido(u, 'G'), molde = M.nucleotidoDuplex(u, 0, 'C');
      expect(dist(arn.punta, molde.punta)).toBeLessThan(1e-9);
    }
  });

  test('la hebra codificante desplazada nunca cruza el eje (gira por fuera)', () => {
    for (let u = -13; u <= 3; u += 0.1) {
      const c = M.nucleotidoCodificante(u, 'A').azucar;
      expect(Math.hypot(c[1], c[2])).toBeGreaterThan(M.ADN_B.radioC1 - 1e-9);
    }
    // en el centro de la burbuja está en el bucle, por encima del ADN
    expect(M.nucleotidoCodificante(-5, 'A').azucar[1]).toBeGreaterThan(2);
  });

  test('el ARN sale del híbrido de forma continua y ya fuera se aleja', () => {
    const q = M.inicioSalidaARN();
    expect(dist(M.caminoSalidaARN(0, 0), q)).toBeLessThan(1e-9);
    let antes = M.caminoSalidaARN(0, 0);
    for (let s = 0.2; s < 30; s += 0.2) {
      const p = M.caminoSalidaARN(s, 0);
      expect(dist(p, antes)).toBeLessThan(0.45);   // sin saltos
      antes = p;
    }
    expect(dist(M.caminoSalidaARN(30, 0), q)).toBeGreaterThan(15);
  });

  test('sitios E·P·A separados un codón; el codón kP queda en el P al translocar', () => {
    expect(M.anclaSitio('A')[0] - M.anclaSitio('P')[0]).toBeCloseTo(M.LARGO_CODON, 9);
    expect(M.anclaSitio('P')[0] - M.anclaSitio('E')[0]).toBeCloseTo(M.LARGO_CODON, 9);
    for (const k of [0, 1, 2.5, 4]) {
      // el nucleótido central del codón k está en x = 0 cuando kP = k
      expect(M.xNucleotidoRibosoma(3 * k + 1, k)).toBeCloseTo(0, 9);
      // y el del codón siguiente, en el sitio A
      expect(M.xNucleotidoRibosoma(3 * (k + 1) + 1, k)).toBeCloseTo(M.LARGO_CODON, 9);
    }
  });

  test('los ARNt A y P, inclinados, llevan su extremo CCA al centro peptidiltransferasa', () => {
    const cca = (s: 'A' | 'P') => {
      const a = M.anclaSitio(s), ang = s === 'A' ? M.INCLINACION_AP : -M.INCLINACION_AP;
      const [x, y, z] = L_ARNT.cca;
      return [a[0] + x * Math.cos(ang) - y * Math.sin(ang), a[1] + x * Math.sin(ang) + y * Math.cos(ang), a[2] + z] as M.V3;
    };
    expect(Math.abs(cca('A')[0] - M.CPT[0])).toBeLessThan(0.05);
    expect(Math.abs(cca('P')[0] - M.CPT[0])).toBeLessThan(0.05);
    // ARNt en L de ≈ 7 nm: del anticodón al CCA
    expect(Math.hypot(L_ARNT.cca[1], L_ARNT.cca[2])).toBeGreaterThan(6.5);
    expect(Math.hypot(L_ARNT.cca[1], L_ARNT.cca[2])).toBeLessThan(8);
    // y el túnel de salida mide ≈ 10 nm desde el CPT
    expect(dist(M.caminoTunel(0), M.CPT)).toBeLessThan(1e-9);
  });
});

// ═════════════════════════════ superficies ═════════════════════════════

function revisarMalla(m: Malla) {
  let ceros = 0;
  for (let i = 0; i < m.normales.length; i += 3) if (!(Math.hypot(m.normales[i], m.normales[i + 1], m.normales[i + 2]) > 1e-6)) ceros++;
  const aristas = new Map<string, number>();
  for (let t = 0; t < m.indices.length; t += 3) for (let k = 0; k < 3; k++) {
    const a = m.indices[t + k], b = m.indices[t + ((k + 1) % 3)];
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    aristas.set(key, (aristas.get(key) ?? 0) + 1);
  }
  // borde abierto: arista de un número impar de caras; los pellizcos de «surface nets»
  // (una arista que comparten 4 caras, dos láminas que se tocan) no abren la superficie
  let abiertas = 0, pellizcos = 0;
  aristas.forEach((v) => { if (v % 2) abiertas++; else if (v > 2) pellizcos++; });
  return { ceros, abiertas, pellizcos, aristas: aristas.size, triangulos: m.indices.length / 3 };
}

describe('superficies moleculares (surface nets)', () => {
  test('una esfera: radio exacto, cerrada (χ = 2) y con las caras hacia fuera', () => {
    const m = superficieGaussiana([{ c: [0, 0, 0], r: 1, color: [1, 1, 1] }], { h: 0.1 });
    let rMin = 9, rMax = 0, fuera = 0;
    const P = m.posiciones, I = m.indices;
    for (let i = 0; i < P.length; i += 3) { const r = Math.hypot(P[i], P[i + 1], P[i + 2]); rMin = Math.min(rMin, r); rMax = Math.max(rMax, r); }
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      const u = [P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]], v = [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      if (n[0] * (P[a] + P[b] + P[c]) + n[1] * (P[a + 1] + P[b + 1] + P[c + 1]) + n[2] * (P[a + 2] + P[b + 2] + P[c + 2]) > 0) fuera++;
    }
    expect(rMin).toBeGreaterThan(0.99);
    expect(rMax).toBeLessThan(1.01);
    const r = revisarMalla(m);
    expect(r.ceros).toBe(0);
    expect(r.abiertas).toBe(0);
    expect(fuera).toBe(I.length / 3);
    const V = P.length / 3, F = I.length / 3;
    expect(V - (3 * F) / 2 + F).toBe(2);
  });

  test('polimerasa, subunidades, ARNt y factores: cerradas, sin normales nulas y dentro de presupuesto', () => {
    let total = 0;
    for (const f of [formaPolimerasa(), formaSubunidadMenor(), formaSubunidadMayor(), formaARNt(), formaFactorLiberacion(), formaFactorAlargamiento()]) {
      const r = revisarMalla(mallaDe(f));
      expect(r.ceros).toBe(0);
      expect(r.abiertas).toBe(0);
      expect(r.pellizcos / r.aristas).toBeLessThan(0.002);
      total += r.triangulos;
    }
    expect(total).toBeLessThan(150000);
  });

  test('la polimerasa deja libre el canal del ADN (Ø ≥ 2,4 nm)', () => {
    const m = mallaDe(formaPolimerasa());
    let dMin = Infinity;
    for (let i = 0; i < m.posiciones.length; i += 3) {
      const x = m.posiciones[i];
      if (Math.abs(x) < 6) dMin = Math.min(dMin, Math.hypot(m.posiciones[i + 1], m.posiciones[i + 2]));
    }
    expect(dMin).toBeGreaterThan(1.2);
  });
});

// ═════════════════════════════ reloj ═════════════════════════════

const estado = (): EstadoSintesis => {
  const s = S().sintesis;
  return { fase: s.fase, adnPlantilla: s.adnPlantilla, arnMensajero: s.arnMensajero, proteina: s.proteina, errores: s.errores, terminada: s.terminada };
};

describe('el reloj: un solo tiempo para escena y dock, y nada regalado', () => {
  test('cada acción del store se convierte en un acontecimiento que termina donde el store', () => {
    S().entrarLab('biologia-3');
    const r = new RelojSintesis(estado());
    r.escenaActiva = true;
    const correr = (seg: number) => { for (let k = 0; k < seg * 60; k++) r.paso(1 / 60); };
    const adn = S().sintesis.adnPlantilla;
    const arn = B.transcribir(adn);
    // un error: se anima un rechazo con la base elegida, sin tocar el ARN
    S().addNucleotido('G' === arn[0] ? 'C' : 'G');
    r.sincronizar(estado(), 'G' === arn[0] ? 'C' : 'G');
    expect(r.actual?.tipo ?? r.cola[0]?.tipo).toBe('rechazarNTP');
    correr(3);
    expect(r.arnVisible).toBe('');
    // la transcripción completa
    for (const b of arn) { S().addNucleotido(b); r.sincronizar(estado(), b); }
    // mientras corre, lo visible nunca va por delante del store
    for (let k = 0; k < 600; k++) {
      r.paso(1 / 60);
      expect(arn.startsWith(r.arnVisible)).toBe(true);
      expect(r.sTx).toBeLessThanOrEqual(arn.length + 1e-9);
    }
    correr(30);
    expect(r.arnVisible).toBe(arn);
    expect(r.acto).toBe('traduccion');
    // traducción hasta el paro
    for (let k = 0; k < 10 && !S().sintesis.terminada; k++) {
      const s = S().sintesis;
      const codon = s.arnMensajero.slice(s.currentIndex, s.currentIndex + 3);
      const op = B.CODIGO_GENETICO[codon].name === 'STOP' ? B.LIBERACION_B3 : B.anticodonB3(codon);
      S().advanceRibosoma(op);
      r.sincronizar(estado(), op);
    }
    correr(60);
    expect(r.peptido).toEqual(S().sintesis.proteina.map((a) => a.name));
    expect(r.hecho.terminada).toBe(true);
    expect(r.kP).toBe(S().sintesis.proteina.length - 1);
    expect(r.ensamblado).toBe(1);
    expect(r.separacion).toBe(1);
    expect(S().validarLab('biologia-3').ok).toBe(true);
  });

  test('un gen nuevo reinicia el reloj sin animar', () => {
    S().entrarLab('biologia-3');
    const r = new RelojSintesis(estado());
    r.escenaActiva = true;
    for (const b of B.transcribir(S().sintesis.adnPlantilla).slice(0, 4)) { S().addNucleotido(b); r.sincronizar(estado(), b); }
    S().resetB3();
    r.sincronizar(estado());
    expect(r.cola).toHaveLength(0);
    expect(r.actual).toBeNull();
    expect(r.arnVisible).toBe('');
    expect(r.hecho.adn).toBe(S().sintesis.adnPlantilla);
  });

  test('NO regala: ningún acontecimiento lleva la base o el anticodón correctos antes de elegir', () => {
    const rng = B.rngConSemilla(41);
    for (let i = 0; i < 25; i++) {
      S().entrarLab('biologia-3');
      const r = new RelojSintesis(estado());
      r.escenaActiva = true;
      const arn = B.transcribir(S().sintesis.adnPlantilla);
      for (let p = 0; p < arn.length; p++) {
        // antes de elegir, el reloj no conoce esa base
        expect(r.arnVisible.length).toBeLessThanOrEqual(p);
        expect(r.cola.every((e) => e.indice < p || e.tipo === 'rechazarNTP')).toBe(true);
        expect(r.hecho.arn.length).toBe(p);
        // la hebra codificante del gen sólo se colorea en lo ya transcrito
        for (let j = 0; j < arn.length; j++) expect(codificanteVisible(j, arn.length, r.hecho.nTx)).toBe(j < r.hecho.nTx);
        // a veces un error: el rechazo lleva la base ELEGIDA (no la correcta)
        if (rng() < 0.3) {
          const mala = ['A', 'U', 'C', 'G'].find((b) => b !== arn[p])!;
          S().addNucleotido(mala); r.sincronizar(estado(), mala);
          const ultimo = r.cola[r.cola.length - 1] ?? r.actual!;
          expect(ultimo.tipo).toBe('rechazarNTP');
          expect(ultimo.valor).toBe(mala);
        }
        S().addNucleotido(arn[p]); r.sincronizar(estado(), arn[p]);
        for (let k = 0; k < 20; k++) r.paso(1 / 30);
      }
      // traducción: el ARNt del codón que se decide no está en ningún sitio
      while (!S().sintesis.terminada && S().sintesis.errores <= B.MAX_ERRORES_B3 + 3) {
        const s = S().sintesis;
        const k = s.proteina.length;
        expect(r.cola.filter((e) => e.tipo === 'iniciar' || e.tipo === 'elongar').every((e) => e.indice < k)).toBe(true);
        const codon = s.arnMensajero.slice(s.currentIndex, s.currentIndex + 3);
        const op = B.CODIGO_GENETICO[codon].name === 'STOP' ? B.LIBERACION_B3 : B.anticodonB3(codon);
        S().advanceRibosoma(op); r.sincronizar(estado(), op);
        for (let q = 0; q < 30; q++) r.paso(1 / 30);
      }
    }
  });

  test('sin escena que lo anime, lo pendiente se aplica al instante', () => {
    S().entrarLab('biologia-3');
    const r = new RelojSintesis(estado());
    const arn = B.transcribir(S().sintesis.adnPlantilla);
    for (const b of arn) { S().addNucleotido(b); r.sincronizar(estado(), b); }
    expect(r.arnVisible).toBe(arn);
    expect(r.acto).toBe('traduccion');
  });

  test('reducir movimiento: ambiente en pausa y acontecimientos 4× más cortos', () => {
    S().entrarLab('biologia-3');
    const r = new RelojSintesis(estado(), true);
    r.escenaActiva = true;
    expect(r.pausa).toBe(true);
    const b = B.transcribir(S().sintesis.adnPlantilla)[0];
    S().addNucleotido(b); r.sincronizar(estado(), b);
    for (let k = 0; k < Math.ceil((M.DUR.incorporacion / 4) * 60) + 2; k++) r.paso(1 / 60);
    expect(r.arnVisible).toBe(b);
    expect(r.t).toBe(0);
  });
});

// ═════════════════════════════ opciones de ARNt ═════════════════════════════

describe('opciones de ARNt del Piloto', () => {
  test('cuatro distintas, una correcta y en posiciones que cambian', () => {
    const posiciones = new Set<number>();
    for (const c of M.CODONES) for (const i of [0, 3, 6, 9, 12]) {
      const op = opcionesARNt(c, i);
      expect(new Set(op).size).toBe(4);
      const correcta = M.aminoacidoDe(c) === 'STOP' ? B.LIBERACION_B3 : M.anticodonDe(c);
      expect(op.filter((o) => o === correcta)).toHaveLength(1);
      posiciones.add(op.indexOf(correcta));
    }
    expect(posiciones.size).toBe(4);
  });
});
