/* ============================================================
   LAB — DIAGNÓSTICO DEL SELLADO: COMPRESIÓN Y FUGAS
   (Dominio D6 · motor de combustión interna · práctica d6-04)

   Qué se monta y qué se mide
     · Se arma el puesto de prueba pieza a pieza: el motor en corte, el útil
       de bujías, el manómetro de compresión con su antirretorno, la aceitera
       de la prueba húmeda, el fugómetro con su restrictor calibrado, la línea
       de aire regulada y el estetoscopio.
     · Se hace la prueba de compresión golpe a golpe y se ve subir la aguja.
     · Se repite en húmedo y se compara el salto de cada cilindro.
     · Se presuriza el cilindro y se localiza POR DÓNDE sale el aire.

   Normatividad y fuentes de referencia
     · Manual de taller del fabricante — es el único documento que fija la
       compresión estándar, el límite de rechazo, la diferencia admisible
       entre cilindros y el porcentaje de fuga aceptable de UN motor concreto.
       Los cuatro motores de este banco NO son modelos comerciales.
     · SAE J604 — nomenclatura de motores alternativos.
     · Atmósfera estándar ISA para la corrección por altitud: es la que explica
       que el mismo motor sano marque un 28 % menos en el valle de Toluca.

   Modelo de ingeniería
     · Compresión de arranque integrada golpe a golpe con la válvula
       antirretorno del manómetro, el volumen muerto del útil y la fuga real
       por cada orificio.
     · Fugas en régimen estacionario: entra por el restrictor calibrado lo
       mismo que sale por las fugas, y se resuelve la presión de equilibrio.
     · Cada avería es un ÁREA equivalente hacia un destino. No hay tabla de
       «síntoma → avería»: el síntoma sale del balance de masa.
     · Flujo por orificio compresible con bloqueo sónico.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[7.6,5.0,11.6],target:[0.2,1.85,0.30],bgTop:'#111a1f',bgBot:'#05070a',bloom:0.22,minD:2.4,maxD:34});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:900,Q:0.80});
const el=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);

// ============================================================================
// MOTOR SELLADO — se copia tal cual desde el fichero de Capa 1, sin tocar una
// sola cifra. Lo unico que cambia es que se le quitan los `export`. Cualquier
// numero que aparezca en el pizarron, en la telemetria, en el informe o en el
// cuestionario sale de aqui: la interfaz no recalcula nada por su cuenta.
// ============================================================================

// ============================================================================
//  d6-04 · MOTOR SELLADO — diagnostico del sellado del cilindro
//
//  Dos pruebas que el taller confunde a diario:
//    · COMPRESION DE ARRANQUE. El motor gira con el de arranque, la valvula
//      antirretorno del manometro retiene el pico y la lectura SUBE golpe a
//      golpe hasta estabilizarse. Detecta que algo no sella, pero no dice que.
//    · FUGAS (leak-down). El cilindro se presuriza en el PMS con las valvulas
//      cerradas y se mide que fraccion de la presion de suministro se pierde a
//      traves de un orificio calibrado. Localiza: el aire sale por algun sitio
//      concreto y ese sitio es el diagnostico.
//
//  Todo lo que este fichero calcula sale de un balance de masa con orificios
//  compresibles reales. No hay tablas de "sintoma -> averia".
//
//  HONESTIDAD: los cuatro motores son ARQUETIPOS declarados. Las areas de fuga
//  de cada averia son valores representativos que reproducen las bandas que se
//  miden en taller; NO son la especificacion de ningun motor concreto. El
//  limite de fuga aceptable y la compresion minima de un motor real son datos
//  del manual de taller de ESE motor.
// ============================================================================

const DEG = Math.PI / 180;
const R_GAS = 287.0;            // J/kg K, aire
const GAMMA_A = 1.40;           // aire frio, para el flujo por orificio
const P_ATM0 = 101325;          // Pa a nivel del mar
const T_ATM0 = 288.15;          // K

// Politropico de un arranque: ni adiabatico (1,40) ni isotermo. La pared esta
// fria y el gas pierde calor, asi que el exponente real cae bajo el adiabatico.
const N_POLI = 1.32;
const CD_FUGA = 0.72;           // orificio de fuga: borde vivo, tortuoso
const CD_REST = 0.85;           // restrictor calibrado del fugometro
const D_REST = 1.00;            // mm, orificio del fugometro
const P_SUP = 6.0;              // bar relativos de suministro
const T_SUP = 293.15;           // K, aire del compresor

const V_MANG = 8.0;             // cm3, manguera + cuerpo del manometro
const N_GOLPES = 8;             // compresiones que se dan en la prueba
const H_INT = 0.5;              // grados de cigueñal por paso

// Llenado del cilindro arrastrando con el motor de arranque y el acelerador a
// fondo: no llega a la presion ambiente porque la admision estrangula.
const ETA_LLEN = 0.92;
const T_ADM = 300.0;            // K, aire de admision en un motor frio

// ---------------------------------------------------------------- atmosfera
// Atmosfera estandar ISA. Importa mas de lo que parece: media Mexico prueba
// motores por encima de los 2 000 m y compara contra una cifra de manual
// escrita a nivel del mar.
function pAtm(alt) { return P_ATM0 * Math.pow(1 - 2.25577e-5 * alt, 5.25588); }
function tAtm(alt) { return T_ATM0 - 0.0065 * alt; }

// ---------------------------------------------------------------- geometria
function radioManivela(e) { return e.S / 2; }
function areaPiston(e) { return Math.PI * e.B * e.B / 4; }              // mm2
function cilindradaUnit(e) { return areaPiston(e) * e.S / 1000; }        // cm3
function cilindradaTotal(e) { return cilindradaUnit(e) * e.ncil; }
function volCamara(e) { return cilindradaUnit(e) / (e.rc - 1); }         // cm3
/** Distancia del piston bajo el PMS, mm. Biela finita exacta. */
function pistonS(th, e) {
  const r = radioManivela(e), Lb = e.Lb, lam = r / Lb;
  const a = th * DEG, s = Math.sin(a);
  return r * (1 - Math.cos(a)) + Lb * (1 - Math.sqrt(1 - lam * lam * s * s));
}
function volumen(th, e) { return volCamara(e) + areaPiston(e) * pistonS(th, e) / 1000; }
/** Relacion de compresion DINAMICA: desde el cierre real de admision. */
function rcDinamica(e, ivc) { return volumen(ivc, e) / volCamara(e); }

// ------------------------------------------------------------------- flujo
/**
 * Gasto por un orificio compresible, kg/s. Con relacion de presiones por
 * debajo de la critica el orificio se bloquea y el gasto deja de depender de
 * lo que haya aguas abajo: por eso una fuga grande no crece sin limite.
 */
function flujo(Amm2, pUp, pDn, Tup, cd) {
  if (!(Amm2 > 0) || !(pUp > pDn)) return 0;
  const g = GAMMA_A;
  const rcrit = Math.pow(2 / (g + 1), g / (g - 1));
  const r = Math.max(pDn / pUp, rcrit);
  const psi = Math.sqrt(2 * g / (g - 1) * (Math.pow(r, 2 / g) - Math.pow(r, (g + 1) / g)));
  return (cd ?? CD_FUGA) * (Amm2 * 1e-6) * pUp / Math.sqrt(R_GAS * Tup) * psi;
}
const areaCirc = d => Math.PI * d * d / 4;   // mm2

// ============================================================================
//  AVERIAS
//
//  Cada averia se declara como AREA EQUIVALENTE de fuga hacia un destino. El
//  destino no es un adorno: es lo que se oye o se ve en la prueba de fugas, y
//  es lo unico que distingue una valvula de un segmento.
//    carter    -> se oye por la boca de llenado de aceite o por la varilla
//    admision  -> se oye por el cuerpo de aceleracion
//    escape    -> se oye por la cola del escape
//    agua      -> burbujea en el radiador con el tapon quitado
//    contiguo  -> sale por la bujia del cilindro de al lado
// ============================================================================
const RUTAS = ['carter', 'admision', 'escape', 'agua', 'contiguo'];
const RUTA_ROT = {
  carter: 'boca de llenado de aceite', admision: 'cuerpo de aceleracion',
  escape: 'cola del escape', agua: 'burbujas en el radiador',
  contiguo: 'bujia del cilindro contiguo',
};

// Las areas NO estan puestas a ojo: se han calibrado (scratchpad/calib_sello.mjs)
// contra las bandas de fuga que se manejan en taller con el fugometro estandar
// —restrictor de 1,00 mm y 6 bar de suministro—, resolviendo que area produce
// cada porcentaje. Cambiar el restrictor cambia el porcentaje sin que el motor
// haya cambiado nada, y eso el laboratorio lo deja comprobar.
// `mojaF` es el factor que multiplica el area que pasa por el CARTER cuando se
// echa el chorro de aceite. Un segmento gastado se sella casi del todo; una
// pared rayada, sólo a medias, porque el aceite no rellena un surco; y una
// valvula o una junta no se enteran de que hay aceite en la corona.
const FALLAS = {
  sano: { rot: 'Sin averia', area: {}, mojaF: 0.14,
    nota: 'Todo motor fuga algo por los segmentos: el asiento puede ser perfecto, el aro nunca lo es.' },
  segDesgaste: { rot: 'Segmentos desgastados', area: { carter: 0.51 }, mojaF: 0.14,
    nota: 'El aceite los sella temporalmente: la prueba humeda sube mucho y eso los delata.' },
  segPegados: { rot: 'Segmentos pegados o rotos', area: { carter: 1.08 }, mojaF: 0.14,
    nota: 'Mismo sintoma que el desgaste pero mas marcado, y tambien responde al aceite.' },
  cilRayado: { rot: 'Pared del cilindro rayada', area: { carter: 1.93 }, mojaF: 0.55,
    nota: 'Fuga grande al carter que el aceite sella SOLO A MEDIAS: el surco no se rellena. Ese medio salto lo separa de un segmento.' },
  valAdm: { rot: 'Valvula de admision mal asentada', area: { admision: 0.63 }, mojaF: 1.0,
    nota: 'El aceite en la corona no la toca: la compresion humeda no sube.' },
  valEsc: { rot: 'Valvula de escape quemada', area: { escape: 1.00 }, mojaF: 1.0,
    nota: 'La mas frecuente en motores de gas y en diesel con temperaturas altas de escape.' },
  taque: { rot: 'Valvula de escape sin juego de taque', area: { escape: 1.49 }, mojaF: 1.0,
    nota: 'La valvula no llega a asentar. Todo el aire sale por el escape y el aceite no cambia nada.' },
  juntaAgua: { rot: 'Junta de culata a la camisa de agua', area: { agua: 0.32 }, mojaF: 1.0,
    nota: 'Burbujea en el radiador con el tapon quitado. Puede no dar humo blanco todavia.' },
  juntaCil: { rot: 'Junta de culata entre dos cilindros', area: { contiguo: 0.75 }, mojaF: 1.0,
    nota: 'Tumba DOS cilindros contiguos a la vez y el aire de uno sale por la bujia del otro.' },
};
const FALLA_KEYS = Object.keys(FALLAS);

// Fuga de base de un motor en buen estado. No es cero, y por eso el criterio de
// taller nunca es "0 %": son 0,48 mm2 repartidos, que dan un 7 % con el util
// estandar.
const FUGA_BASE = { carter: 0.40, admision: 0.041, escape: 0.041 };

/** Suma las areas de base y las de la averia, por ruta. */
function areasDe(falla) {
  const a = Object.assign({}, FUGA_BASE);
  const f = FALLAS[falla] || FALLAS.sano;
  for (const k of Object.keys(f.area)) a[k] = (a[k] || 0) + f.area[k];
  return a;
}
const areaTotal = a => RUTAS.reduce((s, k) => s + (a[k] || 0), 0);

// ============================================================================
//  PRUEBA DE COMPRESION DE ARRANQUE
//
//  Se integra golpe a golpe. La valvula antirretorno del manometro solo deja
//  pasar hacia el manometro, asi que la lectura sube y se queda: lo que se lee
//  al final es el maximo alcanzado, no la presion de un ciclo cualquiera.
//  El conjunto manguera + manometro es volumen muerto, y se suma al cilindro en
//  cuanto la antirretorno abre. Por eso el mismo motor da otra cifra con otro
//  comprobador.
// ============================================================================
/**
 * @param {object} e   motor
 * @param {object} o   {falla, alt, rpm, humedo, ivcOff, golpes, vMan}
 * @returns {{golpes:number[], pico:number, primero:number, pAtm:number,
 *            rd:number, ivc:number, fugado:number, admitido:number}}
 */
function compresion(e, o = {}) {
  const falla = o.falla ?? 'sano';
  const alt = o.alt ?? 0, rpm = o.rpm ?? e.rpmArr;
  const nG = o.golpes ?? N_GOLPES;
  const vMan = (o.vMan ?? V_MANG) * 1e-6;                 // m3
  const pa = pAtm(alt);
  const areas = areasDe(falla);
  // El aceite de la prueba humeda sella el paso de los segmentos y ademas roba
  // un poco de camara. Solo actua sobre las averias que pasan por el carter.
  const moja = !!o.humedo;
  const fCar = moja ? (FALLAS[falla] || FALLAS.sano).mojaF : 1.0;
  const aCar = (areas.carter || 0) * fCar;
  const aOtras = areaTotal(areas) - (areas.carter || 0);
  const vAceite = moja ? 3.0 : 0;                          // cm3 de aceite en la corona

  const ivc = 180 + e.ivcAbdc + (o.ivcOff ?? 0);
  const Vc = (volCamara(e) - vAceite) * 1e-6;              // m3
  const Vd = th => Vc + areaPiston(e) * pistonS(th, e) * 1e-9;

  let pH = pa;                                             // presion retenida
  const lect = [];
  let fugado = 0, admitido = 0;
  for (let g = 0; g < nG; g++) {
    // arranca el golpe con el cilindro lleno a la presion de llenado
    let p = pa * ETA_LLEN, T = T_ADM;
    let V = Vd(ivc);
    let m = p * V / (R_GAS * T);
    admitido += m;
    let conectado = false;
    for (let th = ivc; th < 360; th += H_INT) {
      const Vn = Vd(th + H_INT) + (conectado ? vMan : 0);
      const Va = Vd(th) + (conectado ? vMan : 0);
      // fuga: sale por todas las rutas hacia la presion ambiente
      const dm = (flujo(aCar, p, pa, T) + flujo(aOtras, p, pa, T)) * (H_INT / (6 * rpm));
      const mNext = Math.max(m * 1e-9, m - dm);
      fugado += m - mNext;
      // politropico con perdida de masa
      p = p * Math.pow(Va / Vn, N_POLI) * (mNext / m);
      m = mNext;
      T = p * Vn / (m * R_GAS);
      if (!conectado && p > pH) {
        // abre la antirretorno: el volumen muerto del util entra en juego con
        // el gas que ya tenia dentro, a la misma presion, asi que no hay salto
        m += pH * vMan / (R_GAS * T);
        conectado = true;
      }
    }
    pH = Math.max(pH, p);
    lect.push(pH);
  }
  return {
    golpes: lect.map(x => x / 1e5),                        // bar absolutos
    pico: pH / 1e5, primero: lect[0] / 1e5,
    pAtm: pa / 1e5, ivc, rd: rcDinamica(e, ivc),
    fugado, admitido,
  };
}
/** Lectura del manometro en bar RELATIVOS, que es lo que marca la esfera. */
const barG = (pAbs, pa) => pAbs - pa;

// ============================================================================
//  PRUEBA DE FUGAS (LEAK-DOWN)
//
//  Regimen estacionario con el piston en el PMS y las dos valvulas cerradas.
//  Entra por el restrictor calibrado lo mismo que sale por las fugas, y el
//  manometro de salida marca la presion que se establece en el cilindro:
//      % de fuga = (p_suministro − p_cilindro) / p_suministro · 100
//  con las dos presiones RELATIVAS. Con fuga nula el cilindro llega a la
//  presion de suministro y marca 0 %; con el cilindro abierto marca 100 %.
// ============================================================================
function fugas(e, o = {}) {
  const falla = o.falla ?? 'sano', alt = o.alt ?? 0;
  const pSupG = (o.pSup ?? P_SUP) * 1e5;
  const pa = pAtm(alt), pSup = pa + pSupG;
  const areas = areasDe(falla);
  const aRest = areaCirc(o.dRest ?? D_REST);
  const salida = p => RUTAS.reduce((s, k) => s + flujo(areas[k] || 0, p, pa, T_SUP), 0);
  // biseccion: la entrada baja y la salida sube con p, asi que el balance es
  // monotono y tiene una unica raiz.
  let lo = pa, hi = pSup;
  for (let i = 0; i < 90; i++) {
    const m = 0.5 * (lo + hi);
    if (flujo(aRest, pSup, m, T_SUP, CD_REST) > salida(m)) lo = m; else hi = m;
  }
  const p = 0.5 * (lo + hi);
  const tot = salida(p);
  const rutas = {};
  for (const k of RUTAS) rutas[k] = tot > 0 ? flujo(areas[k] || 0, p, pa, T_SUP) / tot : 0;
  // La ruta que localiza la averia NO es la que mas aire lleva, sino la que se
  // sale de lo normal. Todo motor sopla por el carter; lo que no hace ningun
  // motor sano es burbujear en el radiador. Por eso se compara contra la fuga
  // de base y se senala el EXCESO, no el total.
  let dom = 'carter', exc = 0;
  for (const k of RUTAS) {
    const d = (areas[k] || 0) - (FUGA_BASE[k] || 0);
    if (d > exc + 1e-12) { exc = d; dom = k; }
  }
  return {
    pct: (pSup - p) / pSupG * 100, pCil: (p - pa) / 1e5, pSup: pSupG / 1e5,
    rutas, dominante: dom, fraccionDom: rutas[dom],
    gasto: tot, area: areaTotal(areas), pAtm: pa / 1e5,
  };
}

// ============================================================================
//  ESCENARIOS — lo que de verdad se encuentra uno al abrir el capo
//
//  Un escenario reparte averias por cilindro. Los hay de un solo cilindro, los
//  hay que tumban dos contiguos por la misma junta, y los hay que bajan TODOS
//  los cilindros por igual sin que ninguno este mal sellado: esos son los que
//  se diagnostican mal.
// ============================================================================
const ESCEN = {
  sano: { rot: 'Motor sano', asigna: () => 'sano', ivcOff: 0, rpmMul: 1,
    clave: 'nada que reparar' },
  seg1: { rot: 'Segmentos desgastados en un cilindro', asigna: (i, c) => i === c ? 'segDesgaste' : 'sano',
    ivcOff: 0, rpmMul: 1, clave: 'segmentos' },
  seg2: { rot: 'Segmentos pegados en un cilindro', asigna: (i, c) => i === c ? 'segPegados' : 'sano',
    ivcOff: 0, rpmMul: 1, clave: 'segmentos' },
  adm1: { rot: 'Valvula de admision mal asentada', asigna: (i, c) => i === c ? 'valAdm' : 'sano',
    ivcOff: 0, rpmMul: 1, clave: 'valvula de admision' },
  esc1: { rot: 'Valvula de escape quemada', asigna: (i, c) => i === c ? 'valEsc' : 'sano',
    ivcOff: 0, rpmMul: 1, clave: 'valvula de escape' },
  taque1: { rot: 'Valvula de escape sin juego', asigna: (i, c) => i === c ? 'taque' : 'sano',
    ivcOff: 0, rpmMul: 1, clave: 'valvula de escape' },
  agua1: { rot: 'Junta de culata a la camisa de agua', asigna: (i, c) => i === c ? 'juntaAgua' : 'sano',
    ivcOff: 0, rpmMul: 1, clave: 'junta de culata' },
  junta2: { rot: 'Junta de culata entre dos cilindros contiguos',
    asigna: (i, c) => (i === c || i === c + 1) ? 'juntaCil' : 'sano',
    ivcOff: 0, rpmMul: 1, clave: 'junta de culata' },
  rayado1: { rot: 'Pared de cilindro rayada', asigna: (i, c) => i === c ? 'cilRayado' : 'sano',
    ivcOff: 0, rpmMul: 1, clave: 'cilindro rayado' },
  distrib: { rot: 'Distribucion un diente retrasada', asigna: () => 'sano',
    ivcOff: 18, rpmMul: 1, clave: 'distribucion, no sellado' },
  bateria: { rot: 'Bateria baja: el motor gira despacio', asigna: () => 'sano',
    ivcOff: 0, rpmMul: 0.55, clave: 'arranque, no sellado' },
};
const ESCEN_KEYS = Object.keys(ESCEN);

/**
 * Lecturas completas de un escenario: por cilindro, compresion seca, compresion
 * humeda, % de fuga y por donde sale el aire.
 */
function lecturas(e, esc, o = {}) {
  const E = ESCEN[esc] || ESCEN.sano;
  const alt = o.alt ?? 0;
  const cil = o.cil ?? (o.cilAveriado ?? 0);
  const rpm = Math.round((o.rpm ?? e.rpmArr) * E.rpmMul);
  const out = [];
  for (let i = 0; i < e.ncil; i++) {
    const falla = E.asigna(i, cil);
    const base = { falla, alt, rpm, ivcOff: E.ivcOff };
    const seco = compresion(e, base);
    const hum = compresion(e, Object.assign({}, base, { humedo: true }));
    const fu = fugas(e, { falla, alt });
    out.push({
      cil: i + 1, falla,
      seco: barG(seco.pico, seco.pAtm), humedo: barG(hum.pico, hum.pAtm),
      primero: barG(seco.primero, seco.pAtm),
      subida: barG(hum.pico, hum.pAtm) - barG(seco.pico, seco.pAtm),
      fuga: fu.pct, rutas: fu.rutas, rd: seco.rd,
      // Se senala la ruta cuando el aire sale por donde NO debe —admision,
      // escape, agua o el cilindro de al lado— o cuando la fuga al carter pasa
      // del limite. Un soplido en el radiador se condena por el SITIO, aunque
      // el porcentaje quede por debajo del limite: no hay junta de culata
      // aceptable. Y el carter siempre sopla un poco: eso no es hallazgo.
      ruta: (fu.dominante !== 'carter' || fu.pct >= e.limFuga) ? fu.dominante : 'ninguna',
    });
  }
  const secos = out.map(c => c.seco);
  const mx = Math.max(...secos), mn = Math.min(...secos);
  // Las dos lecturas COMPARATIVAS son diferencias contra el resto del motor,
  // que es lo unico que un tecnico ve sin la ficha del fabricante delante: el
  // deficit contra el mejor cilindro y el salto al mojar contra la MEDIANA del
  // motor. La mediana y no el minimo, porque asi el SIGNO significa algo: un
  // cilindro que sube MAS que sus hermanos tiene los segmentos gastados, y uno
  // que sube MENOS tiene la fuga en un sitio al que el aceite no llega.
  // En un motor plano las dos valen cero en todos los cilindros, este el motor
  // sano o no: por eso ninguna de las dos ve una distribucion movida.
  const orden = out.map(c => c.subida).sort((a, b) => a - b);
  const med = orden.length % 2 ? orden[(orden.length - 1) / 2]
    : 0.5 * (orden[orden.length / 2 - 1] + orden[orden.length / 2]);
  out.forEach(c => { c.def = c.seco - mx; c.subDef = c.subida - med; });
  return {
    esc, rot: E.rot, clave: E.clave, cil: cil + 1, rpm, alt,
    pAtm: pAtm(alt) / 1e5, cilindros: out,
    max: mx, min: mn, relativa: mx > 0 ? mn / mx * 100 : 0,
    // Lo que exige un dato externo: la cifra absoluta del mejor cilindro, que
    // solo significa algo contra el limite CORREGIDO por altitud, y el regimen
    // real al que gira el motor de arranque.
    absoluto: mx, rpmArr: rpm,
    limite: limiteAlt(e, alt), limSeaLevel: e.limSeco, limFuga: e.limFuga,
  };
}
/**
 * Limite de compresion minima corregido por altitud. El manual publica una
 * cifra a nivel del mar; la presion de arranque escala con la del aire que
 * entra, asi que en Toluca el mismo motor sano marca un 28 % menos y no esta
 * malo. Sin esta correccion se condenan motores sanos.
 */
function limiteAlt(e, alt) { return e.limSeco * pAtm(alt) / P_ATM0; }

// ============================================================================
//  CENSO DE INSTRUMENTOS
//
//  Cuatro observaciones caben en esta prueba: compresion seca, salto al mojar,
//  % de fuga y por donde sale el aire. La pregunta util no es cuanto marca cada
//  una, sino cuantos escenarios distintos es capaz de separar cada subconjunto.
// ============================================================================
/**
 * Seis observaciones, cada una con la RESOLUCION del instrumento que la mide.
 * Dos de ellas son comparativas —lo que un tecnico ve sin ficha del fabricante,
 * comparando cilindro contra cilindro— y las otras exigen un dato externo: la
 * cifra absoluta corregida por altitud y el regimen real de arranque.
 */
const OBS = [
  { k: 'def', rot: 'Compresion, contra el mejor cilindro', res: 0.5, uni: 'bar', comparativa: true },
  { k: 'subDef', rot: 'Salto al mojar, contra el que menos sube', res: 0.5, uni: 'bar', comparativa: true },
  { k: 'fuga', rot: 'Porcentaje de fuga', res: 5, uni: '%', comparativa: true },
  { k: 'ruta', rot: 'Por donde sale el aire', res: null, uni: '', comparativa: true },
  { k: 'absoluto', rot: 'Compresion absoluta corregida por altitud', res: 0.5, uni: 'bar', global: true },
  { k: 'rpmArr', rot: 'Regimen real de arranque', res: 10, uni: 'rpm', global: true },
];
const cuant = (x, r) => Math.round(x / r) * r;

/** Firma de unas lecturas segun un subconjunto de observaciones. */
function firmaObs(L, sub) {
  const porCil = L.cilindros.map(c => sub.filter(m => !m.global).map(m =>
    m.res === null ? c[m.k] : cuant(c[m.k], m.res).toFixed(1)).join('/')).join('|');
  const glob = sub.filter(m => m.global).map(m => cuant(L[m.k], m.res).toFixed(1)).join('/');
  return porCil + '#' + glob;
}
/**
 * Censo: para cada subconjunto de observaciones, en cuantas firmas distintas
 * caen los once escenarios y —lo que de verdad importa— cuantos escenarios
 * quedan dentro de una firma que mezcla DOS diagnosticos distintos. Un
 * subconjunto que deja conflictos no es un metodo de diagnostico: es una
 * corazonada con numeros al lado.
 */
function censoSub(e, o = {}) {
  const cache = ESCEN_KEYS.map(k => ({ k, L: lecturas(e, k, o) }));
  const out = [];
  for (let m = 1; m < (1 << OBS.length); m++) {
    const sub = OBS.filter((_, i) => m & (1 << i));
    const grupos = new Map();
    for (const { k, L } of cache) {
      const f = firmaObs(L, sub);
      if (!grupos.has(f)) grupos.set(f, []);
      grupos.get(f).push({ k, clave: L.clave });
    }
    let conflictos = 0, enConflicto = 0;
    for (const g of grupos.values()) {
      const claves = new Set(g.map(x => x.clave));
      if (claves.size > 1) { conflictos++; enConflicto += g.length; }
    }
    out.push({
      mask: m, sub, clases: grupos.size, n: cache.length,
      conflictos, enConflicto, resueltos: cache.length - enConflicto,
    });
  }
  out.sort((a, b) => (b.resueltos - a.resueltos) || (a.sub.length - b.sub.length) || (b.clases - a.clases));
  return out;
}
/** Escenarios que el reto puede proponer: todos menos el sano. */
function casosReto(e) { return ESCEN_KEYS.filter(k => k !== 'sano'); }

// ============================================================================
//  ARQUETIPOS
//
//  HONESTIDAD: NO son modelos comerciales. Son arquetipos declarados cuyas
//  cifras caen dentro de las bandas publicadas para su familia. El limite de
//  compresion minima y el de fuga aceptable de un motor real son datos del
//  manual de taller de ESE motor.
// ============================================================================
// `estandar` es la compresion que el motor da sano y a nivel del mar, y
// `limSeco` el limite de rechazo del manual, que en la practica de taller se
// escribe en el 72 % de la cifra estandar. `tolRel` es la otra regla clasica:
// entre el cilindro mas alto y el mas bajo no debe haber mas de un 10 %.
const ARQ = {
  g16: {
    key: 'g16', nombre: 'Gasolina 1.6 DOHC 16 V', corto: '1.6 gasolina', ciclo: 'otto',
    ncil: 4, B: 79.0, S: 81.5, Lb: 133.0, rc: 10.5, ivcAbdc: 44,
    rpmArr: 250, estandar: 16.1, limSeco: 11.6, limFuga: 20, tolRel: 10,
  },
  g18: {
    key: 'g18', nombre: 'Gasolina 1.8 SOHC 8 V', corto: '1.8 gasolina', ciclo: 'otto',
    ncil: 4, B: 81.0, S: 87.4, Lb: 143.0, rc: 9.5, ivcAbdc: 34,
    rpmArr: 240, estandar: 15.0, limSeco: 10.8, limFuga: 20, tolRel: 10,
  },
  d20: {
    key: 'd20', nombre: 'Diesel 2.0 DOHC 16 V turbo', corto: '2.0 diesel', ciclo: 'diesel',
    ncil: 4, B: 81.0, S: 95.5, Lb: 144.0, rc: 18.5, ivcAbdc: 44,
    rpmArr: 200, estandar: 33.9, limSeco: 24.4, limFuga: 25, tolRel: 10,
  },
  v8: {
    key: 'v8', nombre: 'Gasolina 5.0 V8 OHV', corto: '5.0 V8', ciclo: 'otto',
    ncil: 8, B: 101.6, S: 76.2, Lb: 145.0, rc: 9.0, ivcAbdc: 32,
    rpmArr: 230, estandar: 14.2, limSeco: 10.2, limFuga: 20, tolRel: 10,
  },
};
const ARQ_KEYS = Object.keys(ARQ);

/** Altitudes de trabajo del banco, en metros. */
const ALTITUDES = [0, 1500, 2660];
const ALT_ROT = { 0: 'nivel del mar', 1500: 'altiplano, 1 500 m', 2660: 'Toluca, 2 660 m' };

// ============================================================================
// T1 · FORMATO, ESTADO Y CAPA DE MEMORIA
// ============================================================================

// Espacio fino no separable: el mismo que usa el resto del dominio D6. Nunca
// se llama a toLocaleString, que en este navegador formatea a la inglesa.
const NBSP=' ';
function num(x,d=1){
  if(!isFinite(x)) return '—';
  const s=Math.abs(x).toFixed(d);
  const [ent,dec]=s.split('.');
  let e=''; for(let i=0;i<ent.length;i++){ if(i>0 && (ent.length-i)%3===0) e+=NBSP; e+=ent[i]; }
  return (x<0?'−':'')+e+(dec?','+dec:'');
}
const bar=(x,d=1)=>num(x,d)+NBSP+'bar';
const pct=(x,d=0)=>num(x,d)+NBSP+'%';
const gr=x=>(x>=0?'+':'−')+num(Math.abs(x),1);

// --- estado observable ------------------------------------------------------
const G={
  maq:'g16',          // clave de ARQ
  esc:'sano',         // clave de ESCEN
  alt:0,              // m sobre el nivel del mar
  cilAv:1,            // cilindro al que el escenario asigna la avería (índice 0)
  cil:1,              // cilindro instrumentado, 1..ncil (donde está el manómetro)
  rpm:250,            // régimen de arranque que pide el técnico, antes de rpmMul
  golpes:N_GOLPES,    // golpes de la prueba de compresion
  dRest:D_REST,       // diametro del restrictor del fugometro, mm
  vMan:V_MANG,        // volumen muerto del util, cm3
  humedo:false,       // hay aceite en el cilindro instrumentado
  modo:'ensamble',
  simUnlocked:false,
  golpeVis:0,         // golpe que la aguja esta mostrando (animacion)
  soplando:false,     // hay aire metido por el fugometro
  resuelto:false
};
const MQ=()=>ARQ[G.maq];
const NCIL=()=>MQ().ncil;

// --- capa de memoria --------------------------------------------------------
// Los tres calculos del motor (compresion, fugas, lecturas) se piden muchas
// veces por fotograma. Se cachean por firma exacta de los argumentos: si la
// firma cambia en un solo digito se recalcula. Nunca se guarda una cifra
// "parecida": no hay interpolacion ni redondeo en la clave.
const MEMO=new Map();
function memo(k,fn){ if(MEMO.has(k)) return MEMO.get(k); const v=fn(); MEMO.set(k,v); return v; }
function invalida(){ MEMO.clear(); }

// Qué avería ve el cilindro c (1..ncil) en el escenario actual. Se lo pregunta
// al propio motor: `asigna` es la única autoridad sobre el reparto, y hay
// escenarios —distribución movida, batería baja— que no averían ningún
// cilindro y aun así hunden la lectura de todos.
const estadoCil=c=>ESCEN[G.esc].asigna(c-1,G.cilAv);
const rpmReal=()=>Math.round(G.rpm*ESCEN[G.esc].rpmMul);
function opcCompresion(c,humedo){
  const E=ESCEN[G.esc];
  return {falla:estadoCil(c), alt:G.alt, rpm:rpmReal(), humedo:!!humedo,
          ivcOff:E.ivcOff, golpes:G.golpes, vMan:G.vMan};
}
function COMP(c,humedo){
  const o=opcCompresion(c,humedo);
  return memo(`c|${G.maq}|${o.falla}|${o.alt}|${o.rpm}|${o.humedo}|${o.ivcOff}|${o.golpes}|${o.vMan}`,
              ()=>compresion(MQ(),o));
}
function FUGA(c){
  const f=estadoCil(c);
  return memo(`f|${G.maq}|${f}|${G.alt}|${G.dRest}`,
              ()=>fugas(MQ(),{falla:f, alt:G.alt, dRest:G.dRest}));
}
function LECT(){
  return memo(`l|${G.maq}|${G.esc}|${G.alt}|${G.cilAv}|${G.rpm}`,
              ()=>lecturas(MQ(),G.esc,{alt:G.alt, cil:G.cilAv, rpm:G.rpm}));
}
function CENSO(){ return memo(`n|${G.maq}|${G.cilAv}`,()=>censoSub(MQ(),{cil:G.cilAv})); }
const CIL=()=>LECT().cilindros[G.cil-1];
const LIM=()=>limiteAlt(MQ(),G.alt);
const PATM=()=>pAtm(G.alt)/1e5;

// Veredictos: los tres criterios del manual de taller, cada uno con su propio
// motivo. Se evaluan por separado porque el laboratorio demuestra que NO son
// equivalentes: hay averías que sólo caza uno de los tres.
function veredicto(){
  const L=LECT(), e=MQ();
  const bajo=L.cilindros.filter(c=>c.seco<L.limite);
  // OJO: `relativa` es min/max en tanto por ciento —100 en un motor perfectamente
  // parejo—, asi que la DIFERENCIA es 100 menos eso. Compararla directamente
  // contra tolRel declara fuera de norma hasta a un motor sano.
  const dif=100-L.relativa, disp=dif>e.tolRel;
  const fug=L.cilindros.filter(c=>c.fuga>=e.limFuga);
  const rut=L.cilindros.filter(c=>c.ruta!=='ninguna');
  return {bajo,disp,dif,fug,rut,
          malo:bajo.length>0||disp||fug.length>0||rut.length>0};
}

// --- materiales -------------------------------------------------------------
// El donante ya define castAluminum/brushedMetal/rubber/techPlastic. Aqui solo
// se declaran los que este laboratorio necesita y que no existen en el kit.
// std() se llama en forma de objeto para que componga con los spreads.
const std=o=>new THREE.MeshStandardMaterial(o);
const emis=(hex,i)=>std({color:hex,emissive:hex,emissiveIntensity:i,roughness:0.42,metalness:0.10});
const alu=castAluminum(), brush=brushedMetal(), plas=techPlastic(0.09,0.10,0.12), rub=rubber();

const AZUL='#8AB4F8', NARANJA='#F2A65A', OK_HEX='#7CD992', BAD_HEX='#ff6b6b',
      WARN_HEX='#E9C46A', VIO='#C08CF8', GRIS='#8f97a5', CIAN='#5BD4E5',
      TINTA='#dbe4f0', AMBAR='#E0A33E', ROSA='#EF8FB4';

const MAT={
  bloque: std({...alu, color:0x6f767f, metalness:0.55, roughness:0.72}),
  culata: std({...alu, color:0x7b828b, metalness:0.50, roughness:0.66}),
  acero:  std({...brush, metalness:1.0, roughness:0.32}),
  crom:   std({...brush, metalness:1.0, roughness:0.16}),
  piston: std({...alu, metalness:0.62, roughness:0.48}),
  biela:  std({...brush, metalness:1.0, roughness:0.34}),
  banco:  std({...plas, metalness:0.20, roughness:0.62}),
  caja:   std({...plas, metalness:0.24, roughness:0.54}),
  goma:   std({...rub, color:0x141a22, roughness:0.96, metalness:0.0}),
  vAdm:   std({color:0x8AB4F8, metalness:0.86, roughness:0.26}),
  vEsc:   std({color:0xF2A65A, metalness:0.86, roughness:0.26}),
  ok:     emis(0x7CD992,1.3),
  bad:    emis(0xff6b6b,1.5),
  avi:    emis(0xE9C46A,1.4),
  foco:   emis(0xFFFFFF,1.1),
};

/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde
   ya importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={aluminio:MAT.piston, acero:MAT.acero, hierro:MAT.bloque, cromo:MAT.crom,
  chapa:MAT.acero, negro:MAT.caja, goma:MAT.goma, cobre:MAT.crom,
  blanco:MAT.crom, ceramica:MAT.culata};
const MAT_CAMISA=std({color:0x8d959f,metalness:1.0,roughness:0.22,side:THREE.BackSide});
const MAT_ACEITE=std({color:0x6b4a12,metalness:0.10,roughness:0.35,transparent:true,opacity:0.72});
const MAT_ESFERA=std({color:0xf2f4f7,metalness:0.05,roughness:0.85});
const MAT_AGUJA=std({color:0xd8452f,metalness:0.30,roughness:0.45,emissive:0x2a0703});
const MAT_CRISTAL=std({color:0xbcd3e6,metalness:0.0,roughness:0.06,transparent:true,opacity:0.20});
const MAT_MANG=std({color:0x191d24,metalness:0.10,roughness:0.85});
const MAT_LATON=std({color:0xc9a23a,metalness:1.0,roughness:0.30});
const MAT_ROJO=std({color:0xff5a3c,metalness:0.20,roughness:0.40,emissive:0x3a0d05});
const MAT_HUECO=std({color:0x2bd4a8,transparent:true,opacity:0.16,side:THREE.DoubleSide,depthWrite:false});
const MAT_FANT=std({color:0x2bd4a8,transparent:true,opacity:0.30,wireframe:true});

// Color de cada ruta de fuga: es la misma clave en el 3D, en el pizarron y en
// la leyenda, para que el alumno no tenga que traducir entre vistas.
const COL_RUTA={carter:'#7f8ea3', admision:'#4fd0ff', escape:'#ff8a4f',
                agua:'#5ce07a', contiguo:'#ffd34f', ninguna:'#3a4756'};
const COL3_RUTA={carter:0x7f8ea3, admision:0x4fd0ff, escape:0xff8a4f,
                 agua:0x5ce07a, contiguo:0xffd34f};

// ============================================================ T2 · PIZARRÓN
// Un lienzo 2D de 1024×768 pegado a un panel 3D. Se llama `bcv` y no `cv`
// porque `cv` ya es la fábrica de lienzos del kit de la escena: reusar ese
// nombre rompe la página entera antes de que arranque nada.
const BW=1024, BH=768;
const bcv=document.createElement('canvas'); bcv.width=BW; bcv.height=BH;
const bx=bcv.getContext('2d');
const btex=new THREE.CanvasTexture(bcv);
btex.colorSpace=THREE.SRGBColorSpace;

const board=new THREE.Group();
scene.add(board);
// El pizarrón va siempre al costado izquierdo del motor, a distancia fija de su
// extremo. Fijar la coordenada a mano lo mete dentro del bloque en cuanto el
// motor es más largo, y eso no se ve venir escribiendo el número.
function colocaTablero(anchoTot){
  board.position.set(-(anchoTot/2+2.05),0,1.05);
  board.rotation.y=0.72;
}
// Encuadre del pizarrón: se calcula desde su propia transformada, no con
// coordenadas escritas a mano, porque el pizarrón se mueve con el ancho del
// motor y unas coordenadas fijas lo dejan medio fuera de cuadro en cuanto se
// cambia de arquetipo.
function camTablero(d){
  const c=board.position.clone(); c.y=1.88;
  const n=new THREE.Vector3(Math.sin(board.rotation.y),0,Math.cos(board.rotation.y));
  const p=c.clone().addScaledVector(n,d||5.85); p.y=2.38;
  // El HUD tapa la franja izquierda de la pantalla, asi que se apunta un poco a
  // la izquierda del centro del pizarron para que el pizarron caiga a su derecha.
  const tg=new THREE.Vector3(Math.cos(board.rotation.y),0,-Math.sin(board.rotation.y));
  p.addScaledVector(tg,-0.42); c.addScaledVector(tg,-0.42);
  return [[p.x,p.y,p.z],[c.x,c.y,c.z]];
}
{
  const marco=roundedBox(3.94,2.98,0.10,std({...plas,metalness:0.30,roughness:0.58}),0.05);
  marco.position.y=1.88; board.add(marco);
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(3.72,2.76),
    new THREE.MeshBasicMaterial({map:btex,toneMapped:false}));
  pl.position.set(0,1.88,0.056); board.add(pl);
  for(const sx of [-1,1]){
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.40,16),MAT.acero);
    p.position.set(sx*1.56,0.20,0); p.castShadow=true; board.add(p);
  }
}

// ------------------------------------------------------------- primitivas 2D
function bg(){
  const g=bx.createLinearGradient(0,0,0,BH);
  g.addColorStop(0,'#0d131c'); g.addColorStop(1,'#070a10');
  bx.fillStyle=g; bx.fillRect(0,0,BW,BH);
}
function texto(t,x,y,o={}){
  const s=o.s||16, w=o.b?'700':'400', it=o.it?'italic ':'';
  bx.font=it+w+' '+s+'px '+(o.mono?'ui-monospace,Menlo,Consolas,monospace':'Inter,system-ui,sans-serif');
  bx.fillStyle=o.c||TINTA; bx.textAlign=o.al||'left'; bx.textBaseline='alphabetic';
  bx.fillText(t,x,y);
}
function linea(pts,c,w,dash){
  if(pts.length<2) return;
  bx.save(); bx.strokeStyle=c; bx.lineWidth=w||2; bx.lineJoin='round'; bx.lineCap='round';
  if(dash) bx.setLineDash(dash);
  bx.beginPath(); bx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++) bx.lineTo(pts[i][0],pts[i][1]);
  bx.stroke(); bx.restore();
}
function wrapText(t,x,y,w,lh,o={}){
  const s=o.s||14;
  bx.font=(o.b?'700 ':'400 ')+s+'px Inter,system-ui,sans-serif';
  bx.fillStyle=o.c||'#9aa6b6'; bx.textAlign='left'; bx.textBaseline='alphabetic';
  let ln='', yy=y;
  for(const p of t.split(' ')){
    const test=ln?ln+' '+p:p;
    if(bx.measureText(test).width>w&&ln){ bx.fillText(ln,x,yy); yy+=lh; ln=p; }
    else ln=test;
  }
  if(ln){ bx.fillText(ln,x,yy); yy+=lh; }
  return yy;
}
function rpanel(x,y,w,h,c,bd,rad){
  const r=Math.min(rad===undefined?10:rad, w/2, h/2);
  bx.save(); bx.beginPath();
  bx.moveTo(x+r,y); bx.arcTo(x+w,y,x+w,y+h,r); bx.arcTo(x+w,y+h,x,y+h,r);
  bx.arcTo(x,y+h,x,y,r); bx.arcTo(x,y,x+w,y,r); bx.closePath();
  bx.fillStyle=c||'rgba(255,255,255,0.035)'; bx.fill();
  if(bd){ bx.strokeStyle=bd; bx.lineWidth=1.4; bx.stroke(); }
  bx.restore();
}
function chk(x,y,ok){
  bx.save(); bx.lineWidth=2.6; bx.lineCap='round';
  bx.strokeStyle=ok?OK_HEX:'#3a4658';
  bx.beginPath(); bx.arc(x,y,9,0,Math.PI*2); bx.stroke();
  if(ok){ bx.beginPath(); bx.moveTo(x-4.5,y); bx.lineTo(x-1,y+3.6); bx.lineTo(x+4.8,y-4); bx.stroke(); }
  bx.restore();
}
function tabla(x,y,cols,rows,o={}){
  const rh=o.rh||26, fs=o.s||14, gap=o.gap===undefined?14:o.gap;
  const ancho=cols.reduce((a,c)=>a+c.w+gap,0)-gap;
  let cx=x;
  cols.forEach(c=>{ texto(c.t,c.al==='right'?cx+c.w:cx,y,{s:fs,b:true,c:'#9aa6b6',al:c.al||'left'}); cx+=c.w+gap; });
  linea([[x,y+8],[x+ancho,y+8]],'#243043',1.2);
  rows.forEach((r,i)=>{
    const yy=y+rh*(i+1)+6;
    if(r.hl){ bx.save(); bx.fillStyle=r.hl; bx.fillRect(x-6,yy-rh+9,ancho+12,rh); bx.restore(); }
    let px=x;
    cols.forEach((c,j)=>{
      const cell=r.v[j];
      const val=Array.isArray(cell)?cell[0]:cell, col=Array.isArray(cell)?cell[1]:(r.c||TINTA);
      texto(val,c.al==='right'?px+c.w:px,yy,{s:fs,c:col,al:c.al||'left',mono:c.mono,b:r.b});
      px+=c.w+gap;
    });
  });
  return y+rh*(rows.length+1)+6;
}
// Título que se encoge hasta caber: cambiar de máquina cambia la longitud del
// rótulo, y un rótulo largo se monta encima del de al lado sin avisar.
function textoFit(t,x,y,maxW,o={}){
  let s=o.s||16;
  while(s>11){
    bx.font=(o.b?'700 ':'400 ')+s+'px Inter,system-ui,sans-serif';
    if(bx.measureText(t).width<=maxW) break;
    s-=0.5;
  }
  texto(t,x,y,Object.assign({},o,{s}));
}
function etiqueta(t,x,y,c,al){
  bx.font='400 12px Inter,system-ui,sans-serif';
  const w=bx.measureText(t).width+16, x0=(al==='right')?x-w:x;
  rpanel(x0,y-14,w,20,'rgba(8,12,18,0.80)',null,6);
  texto(t,x0+8,y,{s:12,c:c||TINTA});
}
function leyenda(x,y,items){
  bx.font='400 13px Inter,system-ui,sans-serif';
  const w=Math.max(...items.map(it=>bx.measureText(it[0]).width))+48;
  rpanel(x-10,y-19,w,items.length*22+8,'rgba(8,12,18,0.80)','#1e2836',8);
  let yy=y;
  items.forEach(it=>{
    bx.save(); bx.strokeStyle=it[1]; bx.lineWidth=3.2; bx.lineCap='round';
    if(it[2]) bx.setLineDash(it[2]);
    bx.beginPath(); bx.moveTo(x,yy-4); bx.lineTo(x+26,yy-4); bx.stroke(); bx.restore();
    texto(it[0],x+34,yy,{s:13,c:'#c3ccd8'});
    yy+=22;
  });
  return yy;
}
// Recorta al rectángulo de la gráfica. Sin esto, una barra o una curva que se
// sale por arriba se pinta sobre la cabecera y nadie lo nota.
function enCaja(P,fn){ bx.save(); bx.beginPath(); bx.rect(P.x,P.y,P.w,P.h); bx.clip(); fn(); bx.restore(); }

function ejes(P,x0,x1,y0,y1,rx,ry,fx,fy,nx,ny){
  const X=v=>P.x+(v-x0)/(x1-x0)*P.w;
  const Y=v=>P.y+P.h-(v-y0)/(y1-y0)*P.h;
  bx.save(); bx.strokeStyle='#1d2735'; bx.lineWidth=1;
  for(let i=0;i<=nx;i++){ const v=x0+(x1-x0)*i/nx, xx=X(v);
    bx.beginPath(); bx.moveTo(xx,P.y); bx.lineTo(xx,P.y+P.h); bx.stroke();
    if(fx) texto(fx(v),xx,P.y+P.h+19,{s:12,c:'#7b8697',al:'center'}); }
  for(let i=0;i<=ny;i++){ const v=y0+(y1-y0)*i/ny, yy=Y(v);
    bx.beginPath(); bx.moveTo(P.x,yy); bx.lineTo(P.x+P.w,yy); bx.stroke();
    if(fy) texto(fy(v),P.x-9,yy+4,{s:12,c:'#7b8697',al:'right'}); }
  bx.restore();
  bx.save(); bx.strokeStyle='#3a4658'; bx.lineWidth=1.5; bx.strokeRect(P.x,P.y,P.w,P.h); bx.restore();
  if(rx) texto(rx,P.x+P.w/2,P.y+P.h+44,{s:13,c:'#9aa6b6',al:'center'});
  if(ry){ bx.save(); bx.translate(P.x-58,P.y+P.h/2); bx.rotate(-Math.PI/2);
    texto(ry,0,0,{s:13,c:'#9aa6b6',al:'center'}); bx.restore(); }
  return {X,Y};
}
function serieXY(M,pts,c,w,dash){ linea(pts.map(p=>[M.X(p[0]),M.Y(p[1])]),c,w,dash); }
function punteo(M,x,y,c,r){
  bx.save(); bx.fillStyle=c; bx.beginPath(); bx.arc(M.X(x),M.Y(y),r||4.5,0,Math.PI*2); bx.fill(); bx.restore();
}
// Línea de referencia horizontal. Si el nivel cae fuera del recuadro no se
// pinta: una línea de límite dibujada sobre el borde miente sobre dónde está.
function nivel(P,M,v,c,rot,dash){
  const yy=M.Y(v);
  if(yy<P.y-1||yy>P.y+P.h+1) return;
  linea([[P.x,yy],[P.x+P.w,yy]],c,1.6,dash||[7,5]);
  if(rot) etiqueta(rot,P.x+P.w-8,yy-6,c,'right');
}

// Cabecera común: toda vista dice qué motor se mira, a qué altitud y con qué
// escenario montado. Una cifra sin su configuración al lado no significa nada.
function cabecera(t,sub){
  const e=MQ();
  textoFit(t,42,50,540,{s:26,b:true});
  texto(e.nombre+' · '+num(cilindradaTotal(e),0)+' cm³ · rc '+num(e.rc,1),
    BW-42,44,{s:13,c:CIAN,al:'right'});
  texto(ALT_ROT[G.alt]+' · p'+NBSP+'atm '+num(PATM(),3)+NBSP+'bar · arranque '+num(rpmReal(),0)+NBSP+'rpm',
    BW-42,68,{s:13,c:G.alt>0?WARN_HEX:'#8c98a9',al:'right'});
  wrapText(sub,42,92,BW-84,18,{s:13,c:'#8c98a9'});
  linea([[42,116],[BW-42,116]],'#1e2836',1.4);
}
// Rótulo del cilindro: el instrumentado va marcado, porque en el 3D sólo hay un
// manómetro y el alumno tiene que saber cuál está leyendo.
const rotCil=i=>'Cil'+NBSP+(i+1);

// ------------------------------------------------------------- vista ENSAMBLE
function vEnsamble(){
  cabecera('Puesto de prueba de sellado',
    'Monta el equipo antes de medir. Cada pieza va a su hueco: arrástrala del banco al motor. '+
    'Hasta que el puesto no esté completo no se puede ejecutar ninguna prueba.');
  let y=168;
  texto('Qué se monta y para qué sirve',42,y,{s:18,b:true}); y+=14;
  const filas=ORDEN.map(id=>{
    const p=PART[id], hecho=ASM.done.has(id);
    return {v:[hecho?'✓':'·', p.rot, p.para], c:hecho?OK_HEX:'#8b95a4'};
  });
  y=tabla(42,y+22,[{t:'',w:22},{t:'Pieza',w:270},{t:'Para qué',w:610}],filas,{rh:30,s:14});
  y+=26;
  rpanel(42,y-6,BW-84,150,'rgba(91,212,229,0.05)','#1c3a44',10);
  texto('Las dos pruebas no miden lo mismo',60,y+24,{s:16,b:true,c:CIAN});
  wrapText('La COMPRESIÓN se mide con el motor girando: dice cuánta presión levanta el cilindro, '+
    'pero no dice por dónde se pierde lo que falta. La prueba de FUGAS se hace con el motor parado en el PMS '+
    'y presión metida desde fuera: no dice cuánto comprime, dice POR DÓNDE se escapa. '+
    'La primera detecta, la segunda localiza. Ninguna de las dos sustituye a la otra.',
    60,y+50,BW-140,20,{s:14,c:'#a9b4c2'});
  texto('El manual de taller del fabricante es el único documento que fija el estándar, el límite y el % admisible.',
    60,y+130,{s:13,c:WARN_HEX});
}

// ----------------------------------------------------------- vista COMPRESIÓN
function vCompresion(){
  const e=MQ(), L=LECT(), V=veredicto();
  cabecera('Prueba de compresión de arranque',
    'Bujías fuera en TODOS los cilindros, acelerador a fondo, se dan '+G.golpes+
    ' golpes por cilindro. La antirretorno del manómetro deja la aguja en el máximo alcanzado.');
  // (a) barras por cilindro
  const P={x:96,y:150,w:404,h:300};
  const tope=Math.max(e.estandar*1.12, L.max*1.10);
  const M=ejes(P,0,e.ncil,0,tope,'cilindro','bar relativos',null,v=>num(v,0),e.ncil,6);
  enCaja(P,()=>{
    for(let i=0;i<e.ncil;i++){
      const c=L.cilindros[i], x0=M.X(i+0.18), x1=M.X(i+0.82);
      const mal=c.seco<L.limite, col=mal?BAD_HEX:(c.seco<L.max*0.94?WARN_HEX:OK_HEX);
      bx.save(); bx.fillStyle=col+'cc';
      bx.fillRect(x0,M.Y(c.seco),x1-x0,P.y+P.h-M.Y(c.seco)); bx.restore();
      if(i+1===G.cil){ bx.save(); bx.strokeStyle='#ffffff'; bx.lineWidth=2;
        bx.strokeRect(x0,M.Y(c.seco),x1-x0,P.y+P.h-M.Y(c.seco)); bx.restore(); }
      texto(num(c.seco,1),(x0+x1)/2,M.Y(c.seco)-8,{s:13,b:true,al:'center',c:col});
    }
  });
  for(let i=0;i<e.ncil;i++) texto(rotCil(i),M.X(i+0.5),P.y+P.h+19,{s:12,c:i+1===G.cil?TINTA:'#7b8697',al:'center'});
  nivel(P,M,e.estandar,CIAN,'estándar del manual '+num(e.estandar,1));
  nivel(P,M,L.limite,BAD_HEX,'límite corregido '+num(L.limite,1));
  // (b) construcción golpe a golpe del cilindro instrumentado
  const Q={x:596,y:150,w:372,h:300};
  const cc=COMP(G.cil,false), gp=cc.golpes.map(p=>barG(p,cc.pAtm));
  const M2=ejes(Q,0,G.golpes,0,tope,'golpe de compresión',null,v=>num(v,0),null,G.golpes,6);
  enCaja(Q,()=>{
    serieXY(M2,gp.map((v,i)=>[i+1,v]),AZUL,3);
    gp.forEach((v,i)=>punteo(M2,i+1,v,i+1<=G.golpeVis?AZUL:'#33405222',i+1<=G.golpeVis?5:3.5));
    if(G.humedo){
      const hh=COMP(G.cil,true), gh=hh.golpes.map(p=>barG(p,hh.pAtm));
      serieXY(M2,gh.map((v,i)=>[i+1,v]),AMBAR,2.6,[7,5]);
    }
  });
  nivel(Q,M2,L.limite,BAD_HEX,null);
  leyenda(Q.x+16,Q.y+28,G.humedo?[['seco',AZUL],['húmedo',AMBAR,[7,5]],['límite',BAD_HEX,[7,5]]]
                                 :[['seco',AZUL],['límite',BAD_HEX,[7,5]]]);
  etiqueta('1.er golpe '+num(gp[0],1),Q.x+Q.w-10,M2.Y(gp[0])+22,'#8b95a4','right');
  // (c) los tres criterios, cada uno con su motivo
  let y=520;
  texto('Los tres criterios del manual, y qué caza cada uno',42,y,{s:17,b:true}); y+=12;
  const rows=[
    {v:['Cifra absoluta',num(L.max,1)+' bar contra '+num(L.limite,1),
        V.bajo.length?('condena '+V.bajo.map(c=>'cil '+c.cil).join(', ')):'ningún cilindro por debajo'],
     c:V.bajo.length?BAD_HEX:OK_HEX},
    {v:['Diferencia entre cilindros',num(100-L.relativa,0)+' % contra '+num(e.tolRel,0)+' %',
        V.disp?'los cilindros no son iguales':'motor parejo'],
     c:V.disp?BAD_HEX:OK_HEX},
    {v:['Régimen de arranque',num(L.rpmArr,0)+' rpm contra '+num(e.rpmArr,0),
        L.rpmArr<e.rpmArr*0.8?'gira despacio: la cifra baja sin que el sellado esté mal':'normal'],
     c:L.rpmArr<e.rpmArr*0.8?WARN_HEX:OK_HEX},
  ];
  tabla(42,y+22,[{t:'Criterio',w:250},{t:'Lo medido',w:280},{t:'Veredicto',w:390}],rows,{rh:28,s:14});
}

// -------------------------------------------------------------- vista HÚMEDA
function vHumeda(){
  const e=MQ(), L=LECT();
  cabecera('Prueba húmeda: el aceite como reactivo',
    'Se echan unos centímetros cúbicos de aceite por el hueco de la bujía y se repite el golpeo. '+
    'El aceite sella los segmentos, pero no llega ni a una válvula ni a una junta: el SIGNO del salto separa familias.');
  const P={x:96,y:152,w:600,h:322};
  const tope=Math.max(...L.cilindros.map(c=>c.humedo))*1.12;
  const M=ejes(P,0,e.ncil,0,tope,'cilindro','bar relativos',null,v=>num(v,0),e.ncil,6);
  enCaja(P,()=>{
    for(let i=0;i<e.ncil;i++){
      const c=L.cilindros[i];
      const a0=M.X(i+0.14), a1=M.X(i+0.48), b0=M.X(i+0.52), b1=M.X(i+0.86);
      bx.save(); bx.fillStyle=AZUL+'cc'; bx.fillRect(a0,M.Y(c.seco),a1-a0,P.y+P.h-M.Y(c.seco));
      bx.fillStyle=AMBAR+'cc'; bx.fillRect(b0,M.Y(c.humedo),b1-b0,P.y+P.h-M.Y(c.humedo)); bx.restore();
      texto(gr(c.subida),M.X(i+0.5),M.Y(c.humedo)-10,{s:14,b:true,al:'center',
        c:c.subDef>0.4?ROSA:(c.subDef<-0.4?VIO:'#8b95a4')});
    }
  });
  for(let i=0;i<e.ncil;i++) texto(rotCil(i),M.X(i+0.5),P.y+P.h+19,{s:12,c:i+1===G.cil?TINTA:'#7b8697',al:'center'});
  nivel(P,M,L.limite,BAD_HEX,'límite '+num(L.limite,1));
  leyenda(P.x+16,P.y+28,[['seco',AZUL],['húmedo',AMBAR],['límite',BAD_HEX,[7,5]]]);
  // clave de lectura
  rpanel(724,152,258,322,'rgba(255,255,255,0.035)','#1e2836',10);
  texto('Cómo se lee el salto',744,182,{s:16,b:true});
  wrapText('Se compara contra la MEDIANA del motor, no contra cero: todos los cilindros suben algo, '+
    'porque ningún aro sella del todo.',744,206,220,18,{s:13});
  let y=272;
  const clav=[['sube MÁS que sus hermanos',ROSA,'segmentos o cilindro: el aceite tapa la fuga'],
              ['sube IGUAL que sus hermanos','#8b95a4','ese cilindro no tiene fuga por los aros'],
              ['sube MENOS que sus hermanos',VIO,'válvula o junta: el aceite no llega ahí']];
  clav.forEach(k=>{
    bx.save(); bx.fillStyle=k[1]; bx.fillRect(744,y-10,10,10); bx.restore();
    texto(k[0],762,y,{s:13,b:true,c:k[1]});
    y=wrapText(k[2],762,y+18,204,17,{s:12,c:'#8b95a4'})+14;
  });
  // el caso del rayado, que es el que rompe la regla binaria
  const ray=L.cilindros.find(c=>c.falla==='cilRayado');
  wrapText(ray?('El cilindro '+ray.cil+' sube '+gr(ray.subida)+' bar: ni tanto como unos segmentos ni tan poco como una válvula. '+
                'Una pared rayada se sella a medias porque el aceite no rellena un surco, y por eso el salto no es una prueba binaria.')
             :('El salto es un reactivo, no un interruptor. Con la pared del cilindro rayada la subida queda a medio camino '+
               'entre la de unos segmentos y la de una válvula: monta ese escenario y compáralo aquí mismo.'),
    42,528,BW-84,20,{s:14,c:ray?ROSA:'#8b95a4'});
  wrapText('Y una advertencia que cuesta cara: si el motor está sano, la prueba húmeda no aporta nada y deja aceite en la '+
    'cámara. No es un paso rutinario; es el paso que se da cuando la seca ya ha señalado a un cilindro.',
    42,600,BW-84,20,{s:14,c:WARN_HEX});
}

// ---------------------------------------------------------------- vista FUGAS
function vFugas(){
  const e=MQ(), L=LECT();
  cabecera('Prueba de fugas: por dónde se escapa',
    'Motor parado, cilindro en el PMS con las dos válvulas cerradas, aire regulado a '+num(P_SUP,1)+
    ' bar a través de un restrictor calibrado de '+num(G.dRest,2)+' mm. El porcentaje es del útil; la RUTA es del motor.');
  const P={x:96,y:152,w:560,h:300};
  const M=ejes(P,0,e.ncil,0,100,'cilindro','% de fuga',null,v=>num(v,0),e.ncil,5);
  enCaja(P,()=>{
    for(let i=0;i<e.ncil;i++){
      const c=L.cilindros[i], x0=M.X(i+0.18), x1=M.X(i+0.82);
      // barra apilada por ruta: se ve de un vistazo qué fracción va a cada sitio
      let acum=0;
      for(const r of RUTAS){
        const f=c.rutas[r]||0; if(f<=0.002) continue;
        const a=acum, b=acum+f*c.fuga;
        bx.save(); bx.fillStyle=COL_RUTA[r]+'dd';
        bx.fillRect(x0,M.Y(b),x1-x0,M.Y(a)-M.Y(b)); bx.restore();
        acum=b;
      }
      if(i+1===G.cil){ bx.save(); bx.strokeStyle='#ffffff'; bx.lineWidth=2;
        bx.strokeRect(x0,M.Y(c.fuga),x1-x0,P.y+P.h-M.Y(c.fuga)); bx.restore(); }
      texto(num(c.fuga,0)+'%',(x0+x1)/2,M.Y(c.fuga)-8,{s:13,b:true,al:'center',
        c:c.fuga>=e.limFuga?BAD_HEX:(c.ruta!=='ninguna'?WARN_HEX:OK_HEX)});
    }
  });
  for(let i=0;i<e.ncil;i++) texto(rotCil(i),M.X(i+0.5),P.y+P.h+19,{s:12,c:i+1===G.cil?TINTA:'#7b8697',al:'center'});
  nivel(P,M,e.limFuga,BAD_HEX,'límite del manual '+num(e.limFuga,0)+' %');
  leyenda(700,182,RUTAS.map(r=>[RUTA_ROT[r],COL_RUTA[r]]));
  // la ruta y el sitio donde se escucha
  const c=CIL(), fu=FUGA(G.cil);
  rpanel(700,320,282,132,'rgba(255,255,255,0.035)','#1e2836',10);
  texto('Cilindro '+G.cil+' — dónde escuchar',718,348,{s:15,b:true});
  texto(RUTA_ROT[fu.dominante],718,376,{s:16,b:true,c:COL_RUTA[fu.dominante]});
  texto(num(fu.rutas[fu.dominante]*100,0)+' % del caudal sale por ahí',718,400,{s:13,c:'#8b95a4'});
  texto(c.ruta==='ninguna'?'ruta normal: eso lo hace todo motor'
                          :'ruta ANORMAL: eso no lo hace ningún motor sano',
    718,428,{s:13,b:true,c:c.ruta==='ninguna'?OK_HEX:BAD_HEX});
  // el hallazgo que da sentido a la práctica
  const cond=L.cilindros.filter(x=>x.ruta!=='ninguna'&&x.fuga<e.limFuga);
  wrapText(cond.length
    ? ('El cilindro '+cond[0].cil+' fuga un '+num(cond[0].fuga,0)+' %, por debajo del límite del '+num(e.limFuga,0)+
       ' %, y aun así se condena: el aire sale por '+RUTA_ROT[cond[0].ruta]+', y eso no lo hace ningún motor sano. '+
       'La ruta localiza; el porcentaje sólo mide cuánto.')
    : ('La ruta que señala la avería no es la que más aire lleva, sino la que se sale de lo normal. Todo motor sopla por el '+
       'cárter: eso no es un hallazgo. Un burbujeo en el radiador lo es aunque el porcentaje quede bajo.'),
    42,510,BW-84,20,{s:14,c:cond.length?BAD_HEX:'#a9b4c2'});
  wrapText('El porcentaje depende del ÚTIL, no sólo del motor: cambia el restrictor y cambia la cifra sin que el motor haya '+
    'cambiado nada. Por eso dos talleres con dos fugómetros distintos discuten sobre el mismo motor. Compruébalo con el mando '+
    'del restrictor. Lo que no se mueve con el útil es por dónde sale el aire.',
    42,586,BW-84,20,{s:14,c:'#8b95a4'});
}

// ---------------------------------------------------------------- vista CENSO
function vCenso(){
  const e=MQ(), cen=CENSO(), n=ESCEN_KEYS.length;
  cabecera('¿Qué instrumentos hacen falta de verdad?',
    'Se recorren los 63 subconjuntos de las seis observaciones y se cuenta cuántos de los '+n+
    ' escenarios quedan sin ambigüedad. Un subconjunto que deja dos diagnósticos en la misma firma no es un método: es una corazonada con números al lado.');
  const solos=cen.filter(x=>x.sub.length===1).sort((a,b)=>b.resueltos-a.resueltos);
  let y=tabla(42,168,
    [{t:'Observación (una sola)',w:430},{t:'Resuelve',w:110,al:'right'},{t:'Firmas',w:100,al:'right'},{t:'Firmas con dos diagnósticos',w:250,al:'right'}],
    solos.map(r=>({v:[r.sub[0].rot,r.resueltos+'/'+r.n,String(r.clases),String(r.conflictos)],
      c:r.resueltos===r.n?OK_HEX:(r.resueltos>=r.n*0.7?WARN_HEX:'#8b95a4')})),
    {rh:27,s:14});
  const soloComp=cen.find(x=>x.sub.length===4 && x.sub.every(s=>s.comparativa));
  const min=cen.filter(x=>x.resueltos===x.n).sort((a,b)=>a.sub.length-b.sub.length)[0];
  // Rotulos cortos: el nombre completo de dos observaciones no cabe en la celda
  // y se derrama sobre la columna de al lado, que es peor que abreviar.
  const COR={def:'déficit contra el mejor cilindro', subDef:'salto al mojar', fuga:'% de fuga',
             ruta:'ruta del aire', absoluto:'compresión absoluta corregida', rpmArr:'régimen de arranque'};
  const todo=cen.find(x=>x.sub.length===OBS.length);
  y+=22;
  const rows=[
    {v:['Las cuatro comparativas (sin ficha del fabricante)',soloComp.resueltos+'/'+soloComp.n,String(soloComp.conflictos)],
     c:soloComp.resueltos===soloComp.n?OK_HEX:BAD_HEX},
    {v:['Las seis juntas',todo.resueltos+'/'+todo.n,String(todo.conflictos)],
     c:todo.resueltos===todo.n?OK_HEX:BAD_HEX},
    {v:[min?('Subconjunto MÍNIMO que lo resuelve todo: '+min.sub.map(s=>COR[s.k]||s.rot).join(' + ')):'Ningún subconjunto lo resuelve todo',
        min?(min.resueltos+'/'+min.n):'—', min?String(min.conflictos):'—'],
     c:min?OK_HEX:BAD_HEX, b:true},
  ];
  y=tabla(42,y,[{t:'Combinación',w:600},{t:'Resuelve',w:130,al:'right'},{t:'Conflictos',w:160,al:'right'}],rows,{rh:29,s:14});
  y+=24;
  rpanel(42,y-8,BW-84,178,'rgba(255,107,107,0.06)','#3d2028',10);
  texto('El teorema que hay que llevarse',60,y+20,{s:17,b:true,c:BAD_HEX});
  const sinAbs=cen.filter(x=>!x.sub.some(s=>s.k==='absoluto')).sort((a,b)=>b.resueltos-a.resueltos)[0];
  wrapText('Ningún subconjunto SIN la compresión absoluta corregida por altitud resuelve los '+n+' escenarios: el mejor llega a '+
    sinAbs.resueltos+'/'+sinAbs.n+'. Con sólo lo comparativo, motor sano, distribución movida y batería baja caen en la MISMA firma, '+
    'porque los tres bajan todos los cilindros por igual y ninguna comparación entre cilindros los distingue. '+
    'Comparar cilindro contra cilindro encuentra el cilindro malo; nunca dice que el motor entero está bajo.',
    60,y+48,BW-140,21,{s:14,c:'#c8b4b8'});
  texto('Y a la inversa: la cifra absoluta sola tampoco basta — dice que algo está bajo, no dice qué ni dónde.',
    60,y+156,{s:13,c:WARN_HEX});
}

// ----------------------------------------------------------------- vista RETO
function vReto(){
  const e=MQ();
  cabecera('Diagnóstico a ciegas',
    'El escenario está oculto. Mide lo que necesites —seca, húmeda, fugas, la altitud del taller— y entrega un diagnóstico. '+
    'No se pide adivinar el nombre de la pieza: se pide señalar la FAMILIA de avería y justificarla con lo medido.');
  let y=170;
  texto('Órdenes de trabajo',42,y,{s:18,b:true}); y+=26;
  RETO.pasos.forEach((p,i)=>{
    chk(56,y+2,RETO.hecho[i]);
    texto(p.rot,80,y+7,{s:15,c:RETO.hecho[i]?OK_HEX:TINTA});
    y+=34;
  });
  y+=8;
  rpanel(42,y,BW-84,120,'rgba(255,255,255,0.035)','#1e2836',10);
  texto('Lo que llevas medido',60,y+28,{s:15,b:true});
  wrapText(RETO.notas.length?RETO.notas.join('   ·   '):'Todavía no has tomado ninguna lectura en este caso.',
    60,y+54,BW-140,20,{s:14,c:RETO.notas.length?'#a9b4c2':'#6f7a8a'});
  y+=146;
  if(RETO.veredicto){
    const ok=RETO.veredicto.ok;
    rpanel(42,y,BW-84,190,ok?'rgba(124,217,146,0.07)':'rgba(255,107,107,0.07)',ok?'#1f4030':'#3d2028',10);
    texto(ok?'Diagnóstico correcto':'Diagnóstico incorrecto',60,y+30,{s:19,b:true,c:ok?OK_HEX:BAD_HEX});
    wrapText(RETO.veredicto.texto,60,y+60,BW-140,21,{s:14,c:'#c3ccd8'});
  }else{
    wrapText('Cuando tengas el diagnóstico, elígelo abajo y entrégalo. Se te dirá si acertaste y, sobre todo, QUÉ observación '+
      'lo demostraba: acertar por corazonada y acertar por método se parecen mucho en la respuesta y en nada en el taller.',
      42,y+16,BW-84,21,{s:14,c:'#8b95a4'});
  }
}

const VISTAS={ensamble:vEnsamble, compresion:vCompresion, humeda:vHumeda,
              fugas:vFugas, censo:vCenso, reto:vReto};
function pintaTablero(){
  bg();
  (VISTAS[G.modo]||vEnsamble)();
  btex.needsUpdate=true;
}

// ============================================================ T3a · EL MOTOR
// El motor se dibuja en corte y A ESCALA: un milímetro del arquetipo son
// ESC unidades de escena. Diámetro, carrera, biela y volumen de cámara salen
// del mismo objeto ARQ que usa el modelo numérico, así que cambiar de máquina
// cambia la geometría y las cifras a la vez, y no pueden desmentirse entre sí.
const ESC=0.010;
const YC=0.62;                       // eje del cigüeñal sobre la base del motor

// SIMPLIFICACIÓN DECLARADA: los cuatro arquetipos se dibujan con sus cilindros
// EN LÍNEA, también el V8. Ninguna cifra de esta práctica depende de la
// disposición —cada cilindro se mide por separado, con su propio manometro y su
// propio balance de fugas— y una V inclina el plano de corte hasta que deja de
// verse el interior, que es lo único que hay que ver aquí. Está dicho en el
// contrato de fidelidad y en la ficha.
function bancadas(e){ return [{ang:0, n:e.ncil, base:0}]; }
function dims(e){
  const B=e.B*ESC, Sc=e.S*ESC, Lb=e.Lb*ESC, r=Sc/2;
  const px=1.30*B;                                   // separación entre ejes
  const nb=e.ncil;
  return {B,S:Sc,Lb,r,px, ancho:px*nb,
    yDeck:YC+r+Lb+0.30*B,                            // plano de junta de culata
    hCul:Math.max(0.34,0.62*B)};                     // alto de la culata
}
// Posición del pistón sobre el PMI, en unidades de escena, para un ángulo de
// cigüeñal. Se la pregunta al motor sellado —pistonS trabaja en milímetros— y
// no se reimplementa aquí: dos versiones de la misma cinemática se separan.
const yPist=(th,e)=>pistonS(th,e)*ESC;

// Desfase de encendido: en un cuatro tiempos los cilindros van a 720/n grados.
// No cambia ninguna cifra medida —cada cilindro se mide por separado— pero sin
// él los cuatro pistones suben a la vez y la escena parece una maqueta.
const faseCil=(i,e)=>(720/e.ncil)*i;

const RIG={motor:null, pist:[], biel:[], val:[], bujia:[], cigu:null, destino:{}, flechas:null};

function limpiaMotor(){
  if(RIG.motor){ scene.remove(RIG.motor); RIG.motor.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
  RIG.motor=null; RIG.pist=[]; RIG.biel=[]; RIG.val=[]; RIG.bujia=[]; RIG.cigu=null; RIG.destino={};
}

function construyeMotor(){
  limpiaMotor();
  const e=MQ(), D=dims(e);
  const raiz=new THREE.Group(); raiz.position.set(0,0.86,0); scene.add(raiz); RIG.motor=raiz;

  // --- cárter y cigüeñal ----------------------------------------------------
  const anchoTot=Math.max(D.ancho, 1.3);
  const carter=roundedBox(anchoTot+0.24,0.52,1.05*D.B+0.30,MAT.bloque,0.05);
  carter.position.set(0,YC-0.16,0); carter.castShadow=true; raiz.add(carter);
  const bandeja=roundedBox(anchoTot+0.10,0.26,0.95*D.B+0.20,std({...brush,metalness:1.0,roughness:0.52}),0.05);
  bandeja.position.set(0,YC-0.52,0); raiz.add(bandeja);

  const cigu=new THREE.Group(); cigu.position.set(0,YC,0); raiz.add(cigu); RIG.cigu=cigu;
  {
    const eje=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.11,anchoTot+0.16,20),MAT.acero);
    eje.rotation.z=Math.PI/2; cigu.add(eje);
    const vol=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.10,40),std({...brush,metalness:1.0,roughness:0.44}));
    vol.rotation.z=Math.PI/2; vol.position.x=-(anchoTot/2+0.14); cigu.add(vol);
    // dentado del volante: es donde muerde el útil de bloqueo del PMS
    const cor=new THREE.Mesh(new THREE.TorusGeometry(0.42,0.035,10,64),MAT.crom);
    cor.position.x=-(anchoTot/2+0.14); cor.rotation.y=Math.PI/2; cigu.add(cor);
  }

  // --- bancadas -------------------------------------------------------------
  let idx=0;
  for(const bk of bancadas(e)){
    const banco=new THREE.Group(); banco.rotation.z=bk.ang; raiz.add(banco);
    const x0=-(bk.n-1)*D.px/2, anchoB=bk.n*D.px+0.16, alto=D.yDeck-YC;
    // EL CORTE. El bloque no es una caja: es una caja SIN la mitad delantera,
    // partida por el plano que pasa por los ejes de los cilindros. Si se dibuja
    // entera —que fue el primer intento— el motor se ve como una pared blanca y
    // no se ve ni un pistón, que es justo lo único que hay que ver aquí.
    const zPared=-0.34*D.B, dPared=0.34*D.B;      // el material queda DETRÁS del eje
    const blq=roundedBox(anchoB,alto,dPared,MAT.bloque,0.03);
    blq.position.set(0,YC+alto/2,zPared-dPared/2); blq.castShadow=true; banco.add(blq);
    // tabiques entre cilindros: se ven de canto, como en un motor seccionado
    for(let k=0;k<=bk.n;k++){
      const tab=roundedBox(0.055,alto,0.98*D.B,MAT.bloque,0.01);
      tab.position.set(x0-D.px/2+k*D.px,YC+alto/2,-0.16*D.B); banco.add(tab);
    }
    // plano de junta: la banda de aluminio sobre la que apoya la culata
    const deck=roundedBox(anchoB,0.05,0.98*D.B,MAT.bloque,0.01);
    deck.position.set(0,D.yDeck-0.025,-0.16*D.B); banco.add(deck);
    // culata, cortada igual, y su tapa
    const cul=roundedBox(anchoB,D.hCul,dPared,MAT.culata,0.03);
    cul.position.set(0,D.yDeck+D.hCul/2,zPared-dPared/2); cul.castShadow=true; banco.add(cul);
    for(let k=0;k<=bk.n;k++){
      const tab=roundedBox(0.045,D.hCul,0.98*D.B,MAT.culata,0.01);
      tab.position.set(x0-D.px/2+k*D.px,D.yDeck+D.hCul/2,-0.16*D.B); banco.add(tab);
    }
    const tapa=roundedBox(anchoB,0.10,0.98*D.B,std({...alu,color:0x7f868f,metalness:0.42,roughness:0.58}),0.03);
    tapa.position.set(0,D.yDeck+D.hCul+0.05,-0.16*D.B); banco.add(tapa);

    for(let k=0;k<bk.n;k++,idx++){
      const cil=bk.base+k+1, x=x0+k*D.px;
      // camisa: cara interior. Con BackSide se ve el pistón dentro sin recortar
      // nada, y no aparece el moiré que da una malla cilíndrica con textura.
      const cam=new THREE.Mesh(new THREE.CylinderGeometry(D.B/2,D.B/2,D.S+0.34,44,1,true),MAT_CAMISA);
      cam.position.set(x,YC+D.r+D.Lb-0.02,0); banco.add(cam);
      // pistón + biela
      /* EL PISTÓN CON SUS TRES RANURAS. En un laboratorio que va justamente de
         SELLADO no vale un cilindro liso con tres anillos pegados por fuera: lo
         que sella es un segmento alojado en su ranura, empujado contra la pared
         por el propio gas que hay encima, y el tercero —el rascador, más
         ancho— no sella nada, devuelve el aceite. Las tres ranuras, el escalón
         entre la zona de segmentos y la falda y la falda hueca salen de la
         biblioteca; el cilindro macizo de antes era una pieza que no podría
         funcionar. */
      const pis=new THREE.Group(); banco.add(pis);
      const pz=P3.piston(MATP,{D:D.B,hCorona:0.32*D.B,bulon:false,seg:34});
      pz.position.y=-pz.userData.alturaBulon;   // el bulón, en el origen del grupo
      pis.add(pz);
      // La biela, con su sombrerete: por ahí se abre para montarla sobre la
      // muñequilla, y sin él no se entiende cómo entra un cigüeñal de una pieza.
      const bie=P3.biela({...MATP,acero:MAT.biela},
        {largo:D.Lb, dPie:0.075, dCabeza:0.115, espesor:0.085});
      banco.add(bie);
      // muñequilla, para que se vea de dónde sale el movimiento
      const mun=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.10,16),MAT.acero);
      mun.rotation.z=Math.PI/2; banco.add(mun);
      RIG.pist.push({g:pis, x, fase:faseCil(idx,e), banco:bk.ang, bie, mun, cil});
      // válvulas: admisión y escape, inclinadas hacia fuera
      const vg=[];
      [['vAdm',-1],['vEsc',+1]].forEach(([m,sg])=>{
        /* La válvula, con su CHAFLÁN DE ASIENTO: los cuarenta y cinco grados
           que apoyan contra la culata son literalmente por donde sella, y en
           esta práctica —donde una válvula que no asienta manda el aire al
           colector— es la superficie que hay que poder señalar. Un cono y un
           palo no la enseñan. */
        const v=new THREE.Group(); banco.add(v);
        const vv=P3.valvula({...MATP,acero:MAT[m]},
          {d:0.34*D.B, largo:0.46*D.B, vastago:0.032});
        v.add(vv);
        v.position.set(x+sg*0.26*D.B, D.yDeck+0.03, 0);
        v.rotation.z=-sg*0.16;
        vg.push(v);
      });
      RIG.val.push(vg);
      // hueco de bujía: es el punto por el que entra todo en esta práctica
      const bh=new THREE.Group(); banco.add(bh);
      const tubo=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,D.hCul*0.9,16,1,true),MAT_CAMISA);
      bh.add(tubo);
      const buj=P3.bujia(MATP,{d:0.096, largo:D.hCul*0.62});
      buj.position.y=D.hCul*0.16; buj.userData.esBujia=true; bh.add(buj);
      bh.position.set(x,D.yDeck+D.hCul*0.52,0.05);
      RIG.bujia.push({g:bh, buj, cil, x, banco:bk.ang, yBoca:D.yDeck+D.hCul*0.95});
    }
  }

  // --- los cinco destinos del aire -----------------------------------------
  // No son adorno: son los sitios donde se pone el oído en la prueba de fugas,
  // y cada uno se ilumina cuando el aire sale por ahí. El color es el mismo del
  // pizarrón, para no obligar a traducir entre vistas.
  const dst=[
    ['carter',   new THREE.Vector3(-anchoTot/2-0.10, D.yDeck+0.30, 0.34), 'Boca de aceite'],
    ['admision', new THREE.Vector3(0, D.yDeck+D.hCul+0.44, 0.62), 'Cuerpo de aceleración'],
    ['escape',   new THREE.Vector3( anchoTot/2+0.42, YC-0.18, 0.30), 'Cola de escape'],
    ['agua',     new THREE.Vector3(-anchoTot/2-0.86, D.yDeck+0.52, 0.10), 'Radiador'],
    ['contiguo', new THREE.Vector3(0, D.yDeck+D.hCul+0.16, 0.05), 'Bujía contigua'],
  ];
  for(const [k,p,rot] of dst){
    const g=new THREE.Group(); g.position.copy(p); raiz.add(g);
    const cuerpo=new THREE.Mesh(new THREE.SphereGeometry(0.085,20,14),
      std({color:COL3_RUTA[k],emissive:COL3_RUTA[k],emissiveIntensity:0.10,roughness:0.5,metalness:0.2}));
    g.add(cuerpo);
    const et=labelSprite(rot,COL_RUTA[k]);
    et.position.set(0,0.22,0); et.scale.multiplyScalar(0.62); g.add(et);
    RIG.destino[k]={g,cuerpo,et};
  }
  // pieza física de cada destino, para que no floten esferas sueltas
  {
    const tapon=new THREE.Mesh(new THREE.CylinderGeometry(0.085,0.075,0.07,18),std({...plas,color:0x2a3340}));
    tapon.position.copy(RIG.destino.carter.g.position); raiz.add(tapon);
    const cuello=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.075,0.26,16),MAT.bloque);
    cuello.position.copy(RIG.destino.carter.g.position); cuello.position.y-=0.16; raiz.add(cuello);
    const adm=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,0.36,20),std({...plas,color:0x1e2632}));
    adm.rotation.x=Math.PI/2; adm.position.copy(RIG.destino.admision.g.position);
    adm.position.z-=0.16; raiz.add(adm);
    const esc=new THREE.Mesh(new THREE.CylinderGeometry(0.10,0.11,0.70,20),std({...brush,color:0x5a5148,roughness:0.72}));
    esc.rotation.z=Math.PI/2; esc.position.copy(RIG.destino.escape.g.position);
    esc.position.x-=0.30; raiz.add(esc);
    // El radiador: tubos y aletas, que es lo que hace de un radiador un
    // radiador. Una plancha vertical no dice por dónde pasa el aire.
    const rad=P3.panal({aluminio:std({...brush,color:0x8b939d,roughness:0.58})},
      {ancho:0.62, alto:0.70, prof:0.10, tubos:11, onda:11,
        colorTubo:0x3a4550, colorAleta:0x77828e});
    rad.rotation.y=Math.PI/2;
    rad.position.copy(RIG.destino.agua.g.position); rad.position.y-=0.18; raiz.add(rad);
  }

  // --- soporte ---------------------------------------------------------------
  {
    const base=roundedBox(anchoTot+0.70,0.10,1.20,MAT.banco,0.03);
    base.position.set(0,-0.80,0); base.receiveShadow=true; raiz.add(base);
    for(const sx of [-1,1]) for(const sz of [-1,1]){
      const p=new THREE.Mesh(new THREE.BoxGeometry(0.11,0.66,0.11),MAT.banco);
      p.position.set(sx*(anchoTot/2+0.22),-0.43,sz*0.46); raiz.add(p);
    }
  }
  raiz.position.y=0.86;
  // El 5.0 V8 en línea mide el doble de largo que el 1.6. Con un encuadre fijo
  // se sale del cuadro; con este factor la cámara y el pizarrón se separan lo
  // justo para que el motor entero quepa, sea cual sea el arquetipo.
  G.k=Math.max(1,(anchoTot+0.70)/4.9);
  colocaTablero(anchoTot);
  return raiz;
}

// ====================================================== T3b · EL KIT DE PRUEBA
const nuevaFantasma=()=>std({color:0x5BD4E5,transparent:true,opacity:0.26,
  depthWrite:false,side:THREE.DoubleSide});
function cil(r0,r1,h,mat,seg){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,seg||22),mat);
  m.castShadow=true; return m;
}
function tubo(pts,r,mat){
  const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),
    Math.max(12,pts.length*6),r,8,false),mat);
  m.castShadow=true; return m;
}
function centra(g){
  const dentro=new THREE.Group();
  while(g.children.length) dentro.add(g.children[0]);
  const caja=new THREE.Box3().setFromObject(dentro);
  const c=new THREE.Vector3(); caja.getCenter(c);
  dentro.position.copy(c).negate();
  g.add(dentro);
  g.userData.home=c.clone(); g.userData.minY=caja.min.y-c.y;
  g.position.copy(c); return g;
}
function borra(o){
  o.traverse(n=>{ if(n.isMesh&&n.geometry) n.geometry.dispose(); });
  if(o.userData.gm) o.userData.gm.dispose();
  if(o.parent) o.parent.remove(o);
}

// Esfera de manómetro reutilizable. Devuelve la aguja para que la anime quien
// corresponda: la aguja de la compresión sube golpe a golpe, y las dos del
// fugómetro marcan suministro y cilindro. Ninguna se mueve «a ojo»: todas
// reciben una fracción calculada por el motor sellado.
function esfera(r){
  const g=new THREE.Group();
  const caja=cil(r,r,0.055,MAT.crom,34); caja.rotation.x=Math.PI/2; g.add(caja);
  const cara=cil(r*0.92,r*0.92,0.010,MAT_ESFERA,34); cara.rotation.x=Math.PI/2;
  cara.position.z=0.029; g.add(cara);
  const vid=cil(r*0.93,r*0.93,0.006,MAT_CRISTAL,34); vid.rotation.x=Math.PI/2;
  vid.position.z=0.036; g.add(vid);
  for(let i=0;i<=10;i++){
    const a=(-135+i*27)*DEG;
    const m=new THREE.Mesh(new THREE.BoxGeometry(0.006,r*0.16,0.004),
      std({color:0x1a2029,roughness:0.9}));
    m.position.set(Math.sin(a)*r*0.76,Math.cos(a)*r*0.76,0.034);
    m.rotation.z=-a; g.add(m);
  }
  const ag=new THREE.Group(); ag.position.z=0.038; g.add(ag);
  const cuerpo=new THREE.Mesh(new THREE.BoxGeometry(0.010,r*1.52,0.006),MAT_AGUJA);
  cuerpo.position.y=r*0.50; ag.add(cuerpo);
  ag.add(cil(0.016,0.016,0.012,MAT.crom,14).rotateX(Math.PI/2));
  // fracción 0..1 del recorrido de 270°
  g.userData.setFrac=f=>{ ag.rotation.z=-(-135+clamp(f,0,1)*270)*DEG; };
  g.userData.setFrac(0);
  return g;
}

// ------------------------------------------------------------ las siete piezas
function bAdapt(){
  const g=new THREE.Group();
  /* La ROSCA de verdad, no un tubo liso: este adaptador se enrosca en el hueco
     de la bujía y su paso tiene que ser el del motor —M14×1,25 en casi todos—.
     Es la pieza que decide si el ensayo se puede hacer o no. */
  g.add(cil(0.046,0.046,0.16,MAT_LATON,18));
  const ros=P3.rosca({acero:MAT_LATON},{r:0.048,paso:0.024,vueltas:6,grueso:0.010});
  ros.position.y=-0.02; g.add(ros);
  const hex=new THREE.Mesh(P3.revolucion([[0,0],[0.070,0],[0.070,0.05],[0,0.05]],{seg:6}),MAT_LATON);
  hex.position.y=0.085; g.add(hex);
  const cop=cil(0.052,0.040,0.09,MAT.crom,18); cop.position.y=0.175; g.add(cop);
  return g;
}
function bManometro(){
  const g=new THREE.Group();
  const es=esfera(0.20); es.position.set(0,0.42,0); g.add(es);
  g.userData.aguja=es;
  const anti=cil(0.045,0.045,0.10,MAT_LATON,16); anti.position.set(0,0.12,0); g.add(anti);
  const purga=cil(0.018,0.018,0.06,MAT_ROJO,12);
  purga.rotation.z=Math.PI/2; purga.position.set(0.07,0.12,0); g.add(purga);
  g.add(tubo([new THREE.Vector3(0,0.06,0),new THREE.Vector3(0,-0.10,0.05),
              new THREE.Vector3(-0.16,-0.20,0.16),new THREE.Vector3(-0.36,-0.16,0.22)],0.022,MAT_MANG));
  return g;
}
function bAceitera(){
  const g=new THREE.Group();
  const cu=cil(0.11,0.13,0.26,std({...brush,color:0x9aa6b4,roughness:0.44}),22); g.add(cu);
  g.add(tubo([new THREE.Vector3(0,0.13,0),new THREE.Vector3(0.02,0.24,0),
              new THREE.Vector3(0.16,0.32,0)],0.014,MAT.crom));
  const gota=new THREE.Mesh(new THREE.SphereGeometry(0.030,14,10),MAT_ACEITE);
  gota.position.set(0.17,0.30,0); g.add(gota);
  return g;
}
function bFugometro(){
  const g=new THREE.Group();
  const caja=roundedBox(0.66,0.30,0.16,MAT.caja,0.03); g.add(caja);
  const e1=esfera(0.14); e1.position.set(-0.16,0.02,0.09); g.add(e1);
  const e2=esfera(0.14); e2.position.set(0.16,0.02,0.09); g.add(e2);
  g.userData.gEnt=e1; g.userData.gCil=e2;
  const per=cil(0.055,0.055,0.09,MAT_ROJO,18); per.position.set(0,-0.20,0.02); g.add(per);
  // el restrictor calibrado: es la pieza que fija la escala del porcentaje
  const rest=cil(0.030,0.030,0.08,MAT_LATON,16);
  rest.rotation.z=Math.PI/2; rest.position.set(-0.37,0,0); g.add(rest);
  g.add(tubo([new THREE.Vector3(0.33,0,0),new THREE.Vector3(0.48,-0.08,0.08),
              new THREE.Vector3(0.42,-0.30,0.22)],0.022,MAT_MANG));
  return g;
}
function bAire(){
  const g=new THREE.Group();
  const reg=cil(0.10,0.10,0.20,MAT_LATON,20); g.add(reg);
  const vaso=cil(0.075,0.075,0.11,MAT_CRISTAL,20); vaso.position.y=-0.15; g.add(vaso);
  const per=cil(0.070,0.055,0.06,MAT.caja,18); per.position.y=0.13; g.add(per);
  const es=esfera(0.11); es.position.set(0.16,0.10,0.02); g.add(es);
  g.userData.aguja=es;
  const pts=[];
  for(let i=0;i<=48;i++){ const t=i/48, a=t*Math.PI*5.4;
    pts.push(new THREE.Vector3(-0.16-t*0.30,-0.02+Math.sin(a)*0.06,Math.cos(a)*0.06)); }
  g.add(tubo(pts,0.018,std({...rub,color:0x2a68c4,roughness:0.86,metalness:0.0})));
  return g;
}
function bBloqueo(){
  const g=new THREE.Group();
  const bar=roundedBox(0.42,0.06,0.05,MAT.acero,0.01); g.add(bar);
  const dte=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.09,0.045),MAT.crom);
  dte.position.set(0.20,-0.06,0); g.add(dte);
  const tor=cil(0.030,0.030,0.10,MAT_LATON,14); tor.position.set(-0.16,0.06,0); g.add(tor);
  return g;
}
function bEstetoscopio(){
  const g=new THREE.Group();
  const son=cil(0.012,0.012,0.34,MAT.crom,12); son.position.y=-0.10; g.add(son);
  const cap=cil(0.045,0.030,0.05,MAT.caja,16); cap.position.y=0.10; g.add(cap);
  g.add(tubo([new THREE.Vector3(0,0.13,0),new THREE.Vector3(0.06,0.28,0.04),
              new THREE.Vector3(-0.02,0.40,0.10)],0.012,MAT_MANG));
  for(const sx of [-1,1]){
    const or=cil(0.016,0.016,0.10,MAT.crom,10);
    or.rotation.z=sx*0.5; or.position.set(sx*0.07,0.46,0.10); g.add(or);
  }
  return g;
}

const PARTS=[
  {id:'bloqueo', rot:'Útil de bloqueo del volante', build:bBloqueo,
   para:'Cala el cilindro en el PMS y aguanta el motor: sin él, el aire de la prueba de fugas hace girar el cigüeñal.',
   nota:'El volante queda trabado. Ya se puede meter presión sin que el motor se mueva.',
   pos:()=>({p:volanteXYZ(), r:0})},
  {id:'adapt', rot:'Adaptador de bujía', build:bAdapt,
   para:'Rosca en el hueco de la bujía y ofrece un acoplamiento rápido. Es lo único que conecta el kit al cilindro.',
   nota:'Roscado en el hueco de la bujía. Todo lo que se mida entra y sale por aquí.',
   pos:()=>({p:bocaXYZ(0.10), r:0})},
  {id:'manometro', rot:'Manómetro de compresión', build:bManometro,
   para:'Manguera, válvula antirretorno, purga y esfera. La antirretorno es la que deja la aguja en el máximo alcanzado.',
   nota:'La aguja sube golpe a golpe y no baja: eso es la antirretorno.',
   pos:()=>({p:bocaXYZ(0.40), r:0})},
  {id:'aceitera', rot:'Aceitera de la prueba húmeda', build:bAceitera,
   para:'Mete unos centímetros cúbicos de aceite en la cámara. El aceite sella los segmentos, pero no toca una válvula.',
   nota:'Con el aceite dentro, el salto de la lectura dice a qué familia pertenece la fuga.',
   pos:()=>({p:bocaXYZ(0.30).add(new THREE.Vector3(0.42,0.18,0.20)), r:-0.5})},
  {id:'fugometro', rot:'Fugómetro con restrictor calibrado', build:bFugometro,
   para:'Dos esferas —entrada y cilindro— separadas por un orificio calibrado. El porcentaje sale de comparar las dos.',
   nota:'El orificio calibrado fija la escala: otro restrictor, otro porcentaje, mismo motor.',
   pos:()=>({p:banquetaXYZ(0), r:0.22})},
  {id:'aire', rot:'Línea de aire regulada', build:bAire,
   para:'Regulador, vaso separador de agua y manguera. Sin presión estable el porcentaje de fuga no significa nada.',
   nota:'Suministro estable a '+num(P_SUP,1)+' bar. Ya se puede presurizar el cilindro.',
   pos:()=>({p:banquetaXYZ(1), r:0.22})},
  {id:'estetoscopio', rot:'Estetoscopio de mecánico', build:bEstetoscopio,
   para:'Localiza por dónde sale el aire. Es el instrumento que convierte un porcentaje en un diagnóstico.',
   nota:'Ahora se puede escuchar en la boca de aceite, en la admisión, en el escape y en el radiador.',
   pos:()=>({p:oidoXYZ(), r:0})},
];
const PART=Object.fromEntries(PARTS.map(p=>[p.id,p]));
const ORDEN=PARTS.map(p=>p.id);
const ASM={done:new Set(), sel:null};

// --- anclajes: se leen del motor ya construido, no se escriben a mano --------
const _v=new THREE.Vector3();
function bujiaAct(){
  return RIG.bujia.find(b=>b.cil===G.cil) || RIG.bujia[0];
}
// Boca del hueco de bujía del cilindro instrumentado, subiendo `d` a lo largo
// del eje del cilindro. En la V de ocho el eje va inclinado, así que el kit se
// inclina con él: eso es lo que pasa de verdad al medir un banco de una V.
function bocaXYZ(d){
  const b=bujiaAct(); if(!b) return new THREE.Vector3(0,2,0);
  b.g.getWorldPosition(_v);
  const a=b.banco;
  return _v.clone().add(new THREE.Vector3(-Math.sin(a)*d,Math.cos(a)*d,0));
}
const incBanco=()=>{ const b=bujiaAct(); return b?b.banco:0; };
function volanteXYZ(){
  const e=MQ(), D=dims(e), an=Math.max(D.ancho,1.3);
  return new THREE.Vector3(-(an/2+0.14),0.86+YC+0.46,0.16);
}
function banquetaXYZ(i){
  const e=MQ(), D=dims(e), an=Math.max(D.ancho,1.3);
  return new THREE.Vector3(an/2+0.92, 1.30-i*0.52, 0.62);
}
function oidoXYZ(){
  return RIG.destino.carter ? RIG.destino.carter.g.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0.10,0.24,0.16))
                            : new THREE.Vector3(-1,2,0);
}

// ---------------------------------------------------------------- el banco
const STAGE_S=0.62;
// El banco va DELANTE del motor, no a su costado: a un costado choca con el
// bloque en cuanto el motor tiene ocho cilindros.
const BENCH={cx:0.0,cz:3.55,top:1.00,cols:4,dx:0.98,dz:1.02,pedH:0.24};
const NFIL=Math.ceil(PARTS.length/BENCH.cols), PED_Y=BENCH.top+BENCH.pedH;
function pedXZ(i){
  const c=i%BENCH.cols, f=Math.floor(i/BENCH.cols);
  return [BENCH.cx+(c-(BENCH.cols-1)/2)*BENCH.dx, BENCH.cz+(f-(NFIL-1)/2)*BENCH.dz];
}
const peds=[];
(function levantaBanco(){
  const g=new THREE.Group();
  const w=BENCH.cols*BENCH.dx+0.42, d=NFIL*BENCH.dz+0.42;
  const losa=roundedBox(w,0.10,d,MAT.banco,0.04);
  losa.position.set(BENCH.cx,BENCH.top,BENCH.cz); g.add(losa);
  for(const sx of [-1,1]) for(const sz of [-1,1]){
    const pa=roundedBox(0.10,BENCH.top,0.10,MAT.acero,0.20);
    pa.position.set(BENCH.cx+sx*(w/2-0.15),BENCH.top/2,BENCH.cz+sz*(d/2-0.15)); g.add(pa);
  }
  PARTS.forEach((p,i)=>{
    const [x,z]=pedXZ(i), pg=new THREE.Group(); pg.position.set(x,0,z);
    const cu=cil(0.22,0.26,BENCH.pedH,MAT.banco,26);
    cu.position.y=BENCH.top+BENCH.pedH/2; pg.add(cu);
    const pl=cil(0.24,0.24,0.03,MAT.acero,26); pl.position.y=PED_Y; pg.add(pl);
    const mm2=emis(0x2AA6B8,0.85);
    const an=new THREE.Mesh(new THREE.TorusGeometry(0.25,0.013,10,40),mm2);
    an.rotation.x=-Math.PI/2; an.position.y=PED_Y+0.02; pg.add(an);
    const lb=labelSprite(String(i+1),'#9fb2c6');
    lb.position.set(0,BENCH.top+0.14,0); lb.scale.multiplyScalar(0.44); pg.add(lb);
    g.add(pg); peds.push({mat:mm2});
  });
  scene.add(g);
})();
function pedLibre(i){ const p=peds[i]; if(!p) return;
  p.mat.color.setHex(0x2AA6B8); p.mat.emissive.setHex(0x2AA6B8); p.mat.emissiveIntensity=0.85; }
function pedHecho(i){ const p=peds[i]; if(!p) return;
  p.mat.color.setHex(0x7CD992); p.mat.emissive.setHex(0x7CD992); p.mat.emissiveIntensity=0.30; }

// ---------------------------------------------------------------- ensamble
let fantasmas=[], moviles=[], tweens=[], montadas=[];
let TH=0, animT=0;
const ease=x=>x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
let toastT=null;
function showToast(html,ms){
  const t=el('toast'); t.innerHTML=html; t.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),ms||3800);
}
function limpiaKit(){
  [...fantasmas,...moviles,...montadas].forEach(o=>borra(o));
  fantasmas=[]; moviles=[]; montadas=[]; tweens=[]; ASM.sel=null;
}
function haz(p){ const g=p.build(); centra(g); g.userData.pid=p.id; return g; }
// Lleva cada pieza montada a su anclaje actual. Se llama al cambiar de motor y
// al cambiar de cilindro: el kit va donde está el hueco de bujía, no a una
// coordenada escrita a mano que dejaría de ser cierta al mover nada.
function reposiciona(){
  montadas.forEach(o=>{
    if(tweens.some(w=>w.o===o)) return;
    const p=PART[o.userData.id], t=p.pos();
    o.position.copy(t.p); o.rotation.set(0,0,(t.r||0)+(p.id==='bloqueo'?0:incBanco()));
  });
  fantasmas.forEach(f=>{
    const p=PART[f.userData.id], t=p.pos();
    f.position.copy(t.p); f.rotation.set(0,0,(t.r||0)+(p.id==='bloqueo'?0:incBanco()));
    f.userData.home=t.p.clone();
  });
}
function montaKit(){
  limpiaKit();
  PARTS.forEach(p=>{
    const g=haz(p); g.userData.kind='placed'; g.userData.id=p.id;
    scene.add(g); montadas.push(g); ASM.done.add(p.id);
  });
  peds.forEach((_,i)=>pedHecho(i));
  reposiciona();
}
function initAssembly(){
  limpiaKit(); ASM.done.clear();
  PARTS.forEach((p,i)=>{
    const g=haz(p);
    g.scale.setScalar(STAGE_S);
    const [x,z]=pedXZ(i);
    const baseY=PED_Y+0.03-g.userData.minY*STAGE_S;
    g.position.set(x,baseY,z);
    g.userData.kind='part'; g.userData.id=p.id;
    g.userData.baseY=baseY; g.userData.fase=i*1.7; g.userData.lift=0;
    scene.add(g); moviles.push(g);

    const f=haz(p), gm=nuevaFantasma();
    f.traverse(o=>{ if(o.isMesh){ o.material=gm; o.castShadow=false; o.receiveShadow=false; }
                    if(o.isSprite) o.visible=false; });
    f.userData.kind='slot'; f.userData.id=p.id; f.userData.gm=gm; f.userData.shake=0;
    scene.add(f); fantasmas.push(f);
    pedLibre(i);
  });
  reposiciona(); muestraHueco(null);
  G.simUnlocked=false; G.resuelto=false;
  S.setCinematicIdle(false);
  S.moveTo([7.0,4.8,10.6],[0.8,1.90,0.20],1.3);
}
function muestraHueco(id){
  fantasmas.forEach(f=>{ f.visible=!ASM.done.has(f.userData.id)&&(!id||f.userData.id===id); });
}
function selPieza(o){
  if(ASM.sel===o){ deselec(); return; }
  deselec(); ASM.sel=o; o.userData.lift=0.16;
  muestraHueco(o.userData.id); synth.beep(660,0.06,0.04);
  showToast('<b>'+PART[o.userData.id].rot+'</b> en la mano. Ahora toca su <b>hueco luminoso</b> sobre el motor.',2600);
}
function deselec(){ if(ASM.sel){ ASM.sel.userData.lift=0; ASM.sel=null; } muestraHueco(null); }
function colocaPieza(o,f){
  const p=PART[o.userData.id], i=ORDEN.indexOf(p.id), t=p.pos();
  f.visible=false;
  tweens.push({o, p0:o.position.clone(), p1:t.p.clone(), rot:(t.r||0)+(p.id==='bloqueo'?0:incBanco()),
    s0:o.scale.x, s1:1, t:0, dur:0.85,
    fin:()=>{ o.userData.kind='placed'; o.userData.lift=0; }});
  ASM.done.add(p.id); ASM.sel=null; pedHecho(i);
  montadas.push(o); moviles=moviles.filter(m=>m!==o);
  synth.beep(880,0.07,0.05); setTimeout(()=>synth.beep(1174,0.09,0.05),90);
  showToast('✔ <b>'+p.rot+'</b> montado. '+p.nota,4400);
  muestraHueco(null); pintaTablero();
  if(ASM.done.size===PARTS.length) finEnsamble();
}
function huecoMal(f){
  f.userData.shake=0.5; synth.beep(200,0.12,0.05);
  showToast('<span class="bad">✗ Esa pieza no va en ese hueco.</span>',2000);
}
function finEnsamble(){
  G.simUnlocked=true; syncCtrlbar();
  synth.beep(523,0.10,0.05); setTimeout(()=>synth.beep(784,0.14,0.05),130);
  showToast('🎉 <b>Puesto de prueba completo.</b> Se abren los cinco modos de medida.',4600);
  S.setCinematicIdle(true);
  afterEdit();
}
function autoAssemble(){
  const pend=PARTS.filter(p=>!ASM.done.has(p.id));
  pend.forEach((p,n)=>setTimeout(()=>{
    const o=moviles.find(m=>m.userData.id===p.id), f=fantasmas.find(x=>x.userData.id===p.id);
    if(o&&f&&!ASM.done.has(p.id)) colocaPieza(o,f);
  },320+n*640));
  return 320+pend.length*640+900;
}
function conEtiqueta(o){ let n=o; while(n){ if(n.userData&&n.userData.kind) return n; n=n.parent; } return null; }
pickerFor(scene,S.camera,mount,hit=>{
  if(!hit){ deselec(); return; }
  const t=conEtiqueta(hit.object);
  if(!t){ deselec(); return; }
  const k=t.userData.kind;
  if(k==='part') selPieza(t);
  else if(k==='slot'){
    if(!ASM.sel){ showToast('Primero toca una <b>pieza</b> del banco.',2200); return; }
    if(t.userData.id===ASM.sel.userData.id) colocaPieza(ASM.sel,t); else huecoMal(t);
  }else if(k==='placed'){
    showToast('<b>'+PART[t.userData.id].rot+'</b> — '+PART[t.userData.id].para,4600);
  }
});

// ------------------------------------------------ el motor y el kit en marcha
// Todo lo que se mueve lee del motor sellado. El pistón usa pistonS(), la aguja
// del manómetro lee compresion().golpes y las del fugómetro leen fugas(). No hay
// ninguna animación decorativa que pueda contradecir a una cifra del pizarrón.
function sigueMotor(th){
  const e=MQ(), D=dims(e);
  if(RIG.cigu) RIG.cigu.rotation.x=-th*DEG;
  // pistonS() devuelve el descenso desde el PMS en milímetros, así que el pasador
  // va en yPMS − pistonS. Escribirlo al revés da un motor que comprime en el PMI.
  RIG.pist.forEach(p=>{
    const t=th+p.fase, y=YC+D.r+D.Lb-yPist(t,e);
    p.g.position.set(p.x,y,0);
    const mx=p.x+D.r*Math.sin(t*DEG), my=YC+D.r*Math.cos(t*DEG);
    p.mun.position.set(mx,my,0);
    // La biela de la biblioteca tiene la CABEZA en su origen y el PIE en su
    // extremo: se ancla en la muñequilla, no en el punto medio.
    p.bie.position.set(mx,my,0);
    p.bie.rotation.z=Math.atan2(y-my,p.x-mx)-Math.PI/2;
  });
  // Válvulas: en esta práctica interesa que se vean CERRADAS en la prueba de
  // fugas —es su hipótesis— y abriendo en el ciclo cuando el motor gira.
  const cerrado=(G.modo==='fugas');
  RIG.val.forEach((par,i)=>{
    const t=(th+faseCil(i,e))%720;
    const abrA=Math.max(0,Math.sin((t-350)*DEG/2)), abrE=Math.max(0,Math.sin((t-130)*DEG/2));
    par[0].position.y=D.yDeck+0.03-(cerrado?0:abrA*0.09*D.B);
    par[1].position.y=D.yDeck+0.03-(cerrado?0:abrE*0.09*D.B);
  });
}

// ============================== T3c · EL AIRE QUE SE ESCAPA, Y EL LATIDO
// La prueba de fugas se entiende cuando se VE por dónde sale el aire. Cada ruta
// con caudal apreciable dibuja un chorro desde el cilindro instrumentado hasta
// su destino, con el grosor y la velocidad proporcionales a la FRACCIÓN de
// caudal que el motor sellado le asigna. Nada de esto es decorativo: si el
// pizarrón dice 62 % por el escape, el chorro grueso va al escape.
const CHORROS=[];
function limpiaChorros(){
  while(CHORROS.length){ const c=CHORROS.pop(); borra(c.g); }
}
function armaChorros(){
  limpiaChorros();
  if(!RIG.motor) return;
  const fu=FUGA(G.cil), org=bocaXYZ(0.02);
  for(const r of RUTAS){
    const f=fu.rutas[r]||0;
    if(f<0.02) continue;                       // por debajo del 2 % no se oye ni se ve
    const d=RIG.destino[r]; if(!d) continue;
    const fin=d.g.getWorldPosition(new THREE.Vector3());
    const med=org.clone().lerp(fin,0.5); med.y+=0.22; med.z+=0.18;
    const cur=new THREE.CatmullRomCurve3([org,med,fin]);
    const g=new THREE.Group(); scene.add(g);
    const mat=std({color:COL3_RUTA[r],emissive:COL3_RUTA[r],emissiveIntensity:0.9,
      transparent:true,opacity:0.30,roughness:0.4});
    const via=new THREE.Mesh(new THREE.TubeGeometry(cur,40,0.006+0.020*f,8,false),
      std({color:COL3_RUTA[r],transparent:true,opacity:0.14,depthWrite:false}));
    g.add(via);
    const n=Math.max(2,Math.round(2+9*f)), bolas=[];
    for(let i=0;i<n;i++){
      const b=new THREE.Mesh(new THREE.SphereGeometry(0.020+0.030*f,10,8),mat);
      g.add(b); bolas.push(b);
    }
    CHORROS.push({g,cur,bolas,f,ruta:r,mat});
  }
}
// El destino se enciende con la fracción que recibe. Un destino apagado es
// información: por ahí no sale aire.
function pintaDestinos(){
  const fu=RIG.motor?FUGA(G.cil):null;
  for(const k of RUTAS){
    const d=RIG.destino[k]; if(!d) continue;
    const f=(G.soplando&&fu)?(fu.rutas[k]||0):0;
    d.cuerpo.material.emissiveIntensity=0.10+1.5*f;
    d.et.material.opacity=G.soplando?(f>0.02?1.0:0.35):0.75;
  }
}

// --------------------------------------------------------------- las agujas
// Cada builder deja sus esferas en el userData del grupo que devuelve, y centra()
// conserva ese userData: basta con buscar la pieza montada y leerlo. Si la pieza
// todavía está en el banco, no hay aguja que mover — y eso es correcto, porque
// tampoco hay instrumento conectado.
function buscaUD(id,clave){
  const o=montadas.find(m=>m.userData.id===id);
  return o ? (o.userData[clave]||null) : null;
}
// Escala del manómetro de compresión: 1,6 veces el estándar del motor, redondeada
// al múltiplo de 5 superior. Es lo que hace un fabricante de útiles, y explica
// que un manómetro de gasolina se salga de escala en un diésel.
const escalaComp=()=>Math.ceil(MQ().estandar*1.6/5)*5;
function mueveAgujas(){
  const cc=COMP(G.cil,G.humedo);
  const lect=G.golpeVis>0 ? barG(cc.golpes[Math.min(G.golpeVis,cc.golpes.length)-1],cc.pAtm) : 0;
  const man=buscaUD('manometro','aguja');
  if(man) man.userData.setFrac(lect/escalaComp());
  const ent=buscaUD('fugometro','gEnt'), cilg=buscaUD('fugometro','gCil');
  const fu=FUGA(G.cil);
  if(ent) ent.userData.setFrac(G.soplando?fu.pSup/10:0);
  if(cilg) cilg.userData.setFrac(G.soplando?fu.pCil/10:0);
  const air=buscaUD('aire','aguja');
  if(air) air.userData.setFrac(G.soplando?fu.pSup/10:0);
  return lect;
}

// ------------------------------------------------------------------- latido
const FACTOR_ESC=0.55;
let corriendo=false, thAcum=0;
function pinta3D(dt){
  animT+=dt;
  const t=animT;
  for(let i=tweens.length-1;i>=0;i--){
    const w=tweens[i]; w.t+=dt;
    const u=clamp(w.t/w.dur,0,1), q=ease(u);
    w.o.position.lerpVectors(w.p0,w.p1,q);
    w.o.position.y+=Math.sin(q*Math.PI)*0.42;
    const s=w.s0+(w.s1-w.s0)*q; w.o.scale.setScalar(s);
    if(u>=1){ w.o.position.copy(w.p1); w.o.scale.setScalar(w.s1);
      w.o.rotation.set(0,0,w.rot||0); w.fin&&w.fin(); tweens.splice(i,1); }
  }
  moviles.forEach(o=>{
    if(o.userData.kind!=='part') return;
    const d=o.userData;
    o.position.y=d.baseY+Math.sin(t*1.6+d.fase)*0.02+d.lift;
    o.rotation.y=Math.sin(t*0.5+d.fase)*0.12;
  });
  fantasmas.forEach(f=>{
    const d=f.userData;
    if(d.gm) d.gm.opacity=0.22+0.13*Math.sin(t*3.2);
    if(d.shake>0){ d.shake=Math.max(0,d.shake-dt*1.7);
      f.position.x=(d.home?d.home.x:f.position.x)+Math.sin(t*48)*d.shake*0.04; }
  });
  // El motor sólo gira mientras dura la prueba de compresión. Cada 720° se
  // completa un golpe en el cilindro instrumentado.
  if(corriendo){
    // La escena gira el ciguenal a FACTOR_ESC veces la velocidad real. Se
    // ralentiza porque a 250 rpm reales un golpe dura 0,48 s y no se ve subir la
    // aguja; el factor es unico y esta declarado en la ficha, y el regimen que
    // entra en las cifras es el real, no el de la escena.
    const w=rpmReal()*6*FACTOR_ESC;             // °/s en pantalla
    TH=(TH+w*dt)%720; thAcum+=w*dt;
    const g=Math.min(G.golpes,Math.floor(thAcum/720));
    if(g!==G.golpeVis){ G.golpeVis=g; synth.beep(320+26*g,0.05,0.035); pintaTablero(); pintaTele(); }
    if(thAcum>=G.golpes*720+120){ paraCompresion(); }
  }
  if(RIG.motor) sigueMotor(corriendo?TH:(G.modo==='fugas'?0:TH));
  mueveAgujas();
  if(G.soplando){
    CHORROS.forEach((c,i)=>{
      c.bolas.forEach((b,k)=>{
        const u=((t*(0.25+0.9*c.f)+k/c.bolas.length+i*0.13)%1);
        b.position.copy(c.cur.getPoint(u));
        b.material.opacity=0.20+0.55*Math.sin(u*Math.PI);
      });
    });
  }
}

// ================================================ T4a · HUD, PANEL Y MANDOS
const MODES=['ensamble','compresion','humeda','fugas','censo','reto'];
const MODE_META={
  ensamble:  {n:'Montaje del puesto'},
  compresion:{n:'Compresión seca'},
  humeda:    {n:'Compresión húmeda'},
  fugas:     {n:'Prueba de fugas'},
  censo:     {n:'Censo de instrumentos'},
  reto:      {n:'Diagnóstico a ciegas'},
};
const HUD_TXT={
  ensamble:['Montaje','Arma el puesto de prueba',
    'Siete piezas sobre el banco y siete huecos luminosos sobre el motor. El útil de bloqueo del volante no es opcional: sin él, la presión de la prueba de fugas hace girar el cigüeñal y el cilindro se sale del PMS.',
    'p<sub>fuga</sub> = área equivalente → destino'],
  compresion:['Compresión','La aguja sube y no baja',
    'Bujías fuera en todos los cilindros, acelerador a fondo y unos cuantos golpes. La válvula antirretorno del manómetro deja la aguja en el máximo alcanzado: lo que se lee no es la presión de un ciclo, es el techo de todos.',
    'p<sub>n+1</sub> = trinquete(p<sub>n</sub>, V<sub>cil</sub>+V<sub>útil</sub>, fugas)'],
  humeda:['Húmeda','El aceite como reactivo',
    'Unos centímetros cúbicos de aceite por el hueco de la bujía sellan los segmentos, pero no llegan ni a un asiento de válvula ni a una junta de culata. El SIGNO del salto contra la mediana del motor separa las dos familias.',
    'Δ = p<sub>húmeda</sub> − p<sub>seca</sub>, contra la mediana'],
  fugas:['Fugas','Por dónde se escapa',
    'Motor parado, pistón en el PMS y aire regulado a través de un orificio calibrado. En equilibrio entra por el restrictor lo mismo que sale por las fugas, y la presión que se establece en el cilindro es la medida.',
    '% = (p<sub>sum</sub> − p<sub>cil</sub>) / p<sub>sum</sub> · 100'],
  censo:['Censo','¿Qué instrumentos hacen falta?',
    'Seis observaciones, 63 subconjuntos, once escenarios. La pregunta útil no es cuánto marca cada instrumento, sino cuántos escenarios distintos es capaz de separar. Hay un teorema aquí, y es incómodo.',
    'firma(sub) → clases de equivalencia'],
  reto:['Reto','Diagnostica a ciegas',
    'El escenario está oculto. Mide lo que necesites y entrega la FAMILIA de avería. Está construido para que ninguna medida sola baste: las cuatro comparativas dejan tres escenarios pegados en la misma firma.',
    'diagnóstico = f(déficit, salto, %, ruta, absoluto, rpm)'],
};
function pintaHUD(){
  const t=HUD_TXT[G.modo]||HUD_TXT.ensamble, e=MQ();
  el('hud').innerHTML=
    '<div class="eyebrow">Sellado del motor · '+t[0]+'</div>'+
    '<h2>'+t[1]+'</h2>'+
    '<p>'+t[2]+'</p>'+
    '<div class="formula">'+t[3]+'</div>'+
    '<div class="legend">'+
      RUTAS.map(r=>'<div class="li"><span class="dot" style="background:'+COL_RUTA[r]+'"></span>'+RUTA_ROT[r]+'</div>').join('')+
      '<div class="li"><span class="dot" style="background:'+OK_HEX+'"></span>dentro de norma</div>'+
      '<div class="li"><span class="dot" style="background:'+BAD_HEX+'"></span>fuera de norma</div>'+
    '</div>'+
    '<div class="fid">'+
      '<div class="ft">🔒 Contrato de fidelidad</div>'+
      '<div class="fl"><b>Sí modela:</b> compresión de arranque integrada golpe a golpe con la antirretorno del manómetro y el volumen muerto del útil; cierre real de admisión y relación de compresión dinámica; flujo por orificio compresible con bloqueo sónico; prueba de fugas resuelta como balance de caudales en régimen estacionario; y atmósfera ISA para corregir por altitud. El motor se dibuja a escala con el diámetro, la carrera y la biela del arquetipo.</div>'+
      '<div class="fl no"><b>NO modela:</b> la transferencia de calor a las paredes durante el arranque se resume en un exponente politrópico fijo; las averías se declaran como <b>área equivalente</b> hacia un destino, no como geometría de un asiento quemado; el aceite de la prueba húmeda se resume en un factor de sellado; la velocidad de giro se supone constante durante el golpeo; los cuatro arquetipos se dibujan con los cilindros <b>en línea</b>, también el V8, porque ninguna cifra depende de la disposición y una V inclina el plano de corte hasta ocultar el interior; y la escena gira el cigüeñal a <b>0,55 veces</b> la velocidad real para que los golpes se vean, aunque el régimen que entra en las cifras es el real. Los cuatro motores son arquetipos declarados, <b>no</b> modelos comerciales: el estándar, el límite y el porcentaje admisible de un motor real están en su manual de taller y en ningún otro sitio.</div>'+
    '</div>'+
    '<div class="src">Ref: manual de taller del fabricante (única fuente del estándar de compresión, del límite de rechazo y del % de fuga admisible de un motor concreto) · SAE J604, nomenclatura de motores alternativos · atmósfera estándar ISA para la corrección por altitud · Heywood, <i>Internal Combustion Engine Fundamentals</i> (1988) · Motor en pantalla: '+e.nombre+'.</div>';
}

el('panel').innerHTML=
  '<h4>Puesto de sellado <span id="p_mode"></span></h4>'+
  '<div class="modebar">'+
    '<button class="b" id="m_ensamble">1 · Montar</button>'+
    '<button class="b" id="m_compresion">2 · Seca</button>'+
    '<button class="b" id="m_humeda">3 · Húmeda</button>'+
  '</div>'+
  '<div class="modebar">'+
    '<button class="b" id="m_fugas">4 · Fugas</button>'+
    '<button class="b" id="m_censo">5 · Censo</button>'+
    '<button class="b" id="m_reto">6 · Reto</button>'+
  '</div>'+
  '<div id="ctrlbar"></div>'+
  '<div class="btns" id="accbar"></div>'+
  '<div id="tele"></div>'+
  '<div class="console" id="report"></div>'+
  '<h4 class="sec" id="retoTitle">Diagnóstico a ciegas</h4>'+
  '<div id="retoBox">'+
    '<div class="console" id="retoSpec"></div>'+
    '<div class="btns" id="dxreto"></div>'+
    '<div class="btns">'+
      '<button class="b" id="btnPista">💡 Pedir una pista</button>'+
      '<button class="b primary" id="btnCheck">Entregar el diagnóstico</button>'+
    '</div>'+
  '</div>'+
  '<h4 class="sec">Pregunta de ingeniería</h4>'+
  '<div id="q_text" class="console"></div>'+
  '<div class="btns" id="dxbtns"></div>'+
  '<div class="btns">'+
    '<button class="b auto" id="btnAuto">▶︎ Recorrido guiado</button>'+
    '<button class="b primary" id="btnNew">🔀 Otro caso</button>'+
  '</div>';

// ------------------------------------------------------------------ controles
// Los mandos se levantan desde el estado. Un mando que no puede hacer nada en el
// modo actual no se dibuja: un botón pulsable que no cambia nada enseña a
// desconfiar de la interfaz.
function fila(rot,attr,ops,cur){
  return '<div class="gl" style="margin:9px 0 4px"><span>'+rot+'</span></div>'+
    '<div class="modebar">'+ops.map(o=>
      '<button class="b'+(String(o[0])===String(cur)?' on':'')+'" '+attr+'="'+o[0]+'">'+o[1]+'</button>'
    ).join('')+'</div>';
}
const GOLPES_OPS=[4,8,14], REST_OPS=[0.80,1.00,1.30];
// El regimen nominal de arranque es una PROPIEDAD de la maquina —un diesel gira
// mas despacio que un gasolina— asi que siempre esta entre las opciones y es el
// valor al que se vuelve al cambiar de motor. Si no, el panel ofrece un regimen
// que ese motor de arranque no da, y la cifra sale por encima de su estandar.
const rpmOps=()=>[...new Set([120,180,MQ().rpmArr,320])].sort((a,b)=>a-b);
function buildControls(){
  const e=MQ(), reto=(G.modo==='reto');
  let h='';
  if(!reto) h+=fila('Motor en el banco','data-mk',ARQ_KEYS.map(k=>[k,ARQ[k].corto]),G.maq);
  else h+='<div class="gl" style="margin:9px 0 4px"><span>Motor bajo diagnóstico</span><b>'+e.corto+'</b></div>';

  if(!reto) h+=fila('Estado del motor','data-esc',
    ESCEN_KEYS.map(k=>[k,ESCEN[k].rot.length>26?ESCEN[k].rot.slice(0,24)+'…':ESCEN[k].rot]),G.esc);
  else h+='<div class="gl" style="margin:9px 0 4px"><span>Estado del motor</span><b class="warn">oculto</b></div>';

  h+=fila('Altitud del taller','data-alt',ALTITUDES.map(a=>[a,a===0?'0 m':num(a,0)+' m']),G.alt);
  h+=fila('Cilindro con el instrumento','data-cil',
    Array.from({length:e.ncil},(_,i)=>[i+1,String(i+1)]),G.cil);

  if(G.modo==='compresion'||G.modo==='humeda'||G.modo==='reto'){
    h+=fila('Golpes de compresión','data-gol',GOLPES_OPS.map(g=>[g,String(g)]),G.golpes);
    h+=fila('Régimen de arranque pedido','data-rpm',rpmOps().map(r=>[r,num(r,0)+(r===e.rpmArr?'*':'')]),G.rpm);
  }
  if(G.modo==='fugas'||G.modo==='reto')
    h+=fila('Restrictor del fugómetro','data-rst',REST_OPS.map(d=>[d.toFixed(2),num(d,2)+' mm']),G.dRest.toFixed(2));
  if(G.modo==='humeda'||G.modo==='reto')
    h+=fila('Aceite en el cilindro medido','data-hum',[['0','seco'],['1','con aceite']],G.humedo?'1':'0');
  if(G.modo==='compresion')
    h+=fila('Volumen muerto del útil','data-vol',[[8,'8 cm³'],[24,'24 cm³']],G.vMan);
  el('ctrlbar').innerHTML=h;

  // acciones: sólo la del modo en curso
  let a='';
  if(G.modo==='compresion'||G.modo==='humeda'||G.modo==='reto')
    a+='<button class="b primary" id="btnGirar">'+(corriendo?'⏹ Parar':'⏵ Dar los '+G.golpes+' golpes')+'</button>';
  if(G.modo==='fugas'||G.modo==='reto')
    a+='<button class="b'+(G.soplando?' on':'')+'" id="btnAire">'+(G.soplando?'⏹ Cerrar el aire':'💨 Meter aire')+'</button>';
  el('accbar').innerHTML=a;
  el('accbar').style.display=a?'':'none';
}
function syncCtrlbar(){
  MODES.forEach(m=>{
    const b=el('m_'+m); if(!b) return;
    const viva=(m==='ensamble')||G.simUnlocked;
    b.disabled=!viva; b.style.opacity=viva?'1':'0.45';
    b.classList.toggle('on',m===G.modo);
  });
  const rt=(G.modo==='reto');
  el('retoTitle').style.display=rt?'':'none';
  el('retoBox').style.display=rt?'':'none';
  el('p_mode').textContent=G.simUnlocked?('· '+MODE_META[G.modo].n):'· puesto incompleto';
  el('btnNew').textContent=rt?'🔀 Otro motor averiado'
    :(G.modo==='ensamble'?'🔁 Volver a montar':'🔀 Otro caso');
  el('btnAuto').disabled=autoRunning;
  buildControls();
}

// ---------------------------------------------------------------- telemetría
const gl=(l,v,c)=>'<div class="g"><div class="gl"><span>'+l+'</span><b'+(c?' class="'+c+'"':'')+'>'+v+'</b></div></div>';
function pintaTele(){
  if(!G.simUnlocked){
    el('tele').innerHTML=gl('Piezas montadas',ASM.done.size+' / '+PARTS.length,
      ASM.done.size===PARTS.length?'good':'warn')+
      gl('Siguiente','toca una pieza del banco','');
    return;
  }
  const e=MQ(), L=LECT(), c=CIL(), fu=FUGA(G.cil), cc=COMP(G.cil,G.humedo);
  const lect=G.golpeVis>0?barG(cc.golpes[Math.min(G.golpeVis,cc.golpes.length)-1],cc.pAtm):0;
  let h='';
  h+=gl('Cilindro instrumentado','n.º '+G.cil+' de '+e.ncil,'');
  if(G.modo==='compresion'||G.modo==='humeda'||G.modo==='reto'){
    h+=gl('Manómetro ('+G.golpeVis+'/'+G.golpes+' golpes)',bar(lect),
      G.golpeVis===0?'':(lect<L.limite?'bad':'good'));
    h+=gl('Al completar los golpes',bar(c[G.humedo?'humedo':'seco']),
      c[G.humedo?'humedo':'seco']<L.limite?'bad':'good');
    h+=gl('Límite corregido por altitud',bar(L.limite),'warn');
    h+=gl('Diferencia entre cilindros',pct(100-L.relativa)+' (máx '+num(e.tolRel,0)+' %)',
      (100-L.relativa)>e.tolRel?'bad':'good');
  }
  if(G.modo==='humeda'||G.modo==='reto')
    h+=gl('Salto al mojar, contra la mediana',gr(c.subDef)+NBSP+'bar',
      c.subDef>0.4?'warn':(c.subDef<-0.4?'bad':''));
  if(G.modo==='fugas'||G.modo==='reto'){
    h+=gl('Fuga del cilindro '+G.cil,pct(fu.pct,1)+' (máx '+num(e.limFuga,0)+' %)',
      fu.pct>=e.limFuga?'bad':(c.ruta!=='ninguna'?'warn':'good'));
    h+=gl('Presión en el cilindro',bar(fu.pCil,2)+' de '+bar(fu.pSup,1),'');
    h+=gl('El aire sale por',RUTA_ROT[fu.dominante]+' ('+pct(fu.rutas[fu.dominante]*100)+')',
      c.ruta==='ninguna'?'good':'bad');
  }
  if(G.modo==='censo'){
    const cen=CENSO(), min=cen.filter(x=>x.resueltos===x.n).sort((a,b)=>a.sub.length-b.sub.length)[0];
    const sc=cen.find(x=>x.sub.length===4&&x.sub.every(s=>s.comparativa));
    h+=gl('Escenarios en juego',String(ESCEN_KEYS.length),'');
    h+=gl('Sólo lo comparativo',sc.resueltos+' / '+sc.n,sc.resueltos===sc.n?'good':'bad');
    h+=gl('Instrumentos mínimos',min?String(min.sub.length):'—',min?'good':'bad');
  }
  h+=gl('Altitud · presión ambiente',ALT_ROT[G.alt]+' · '+bar(PATM(),3),G.alt>0?'warn':'');
  el('tele').innerHTML=h;
}

// ------------------------------------------------------------------ informe
// El informe dice el veredicto Y por qué criterio, porque el laboratorio
// demuestra que los tres criterios no son equivalentes.
function pintaInforme(){
  const R=el('report'), e=MQ();
  if(!G.simUnlocked){
    R.innerHTML='<span class="mono">Faltan '+(PARTS.length-ASM.done.size)+
      ' piezas del puesto de prueba.</span> Toca una pieza del banco y luego su hueco luminoso sobre el motor.';
    return;
  }
  if(G.modo==='reto'){ pintaReto(); return; }
  const L=LECT(), V=veredicto();
  let h='';
  if(!V.malo){
    h='<b class="good">Motor dentro de norma.</b> Ningún cilindro por debajo de '+bar(L.limite)+
      ', diferencia entre cilindros del '+pct(100-L.relativa)+' y ninguna ruta anormal. '+
      'Con el motor sano la prueba húmeda no aporta nada y deja aceite en la cámara: no es un paso rutinario.';
  }else{
    const parte=[];
    if(V.bajo.length) parte.push('<b class="bad">por debajo del límite:</b> '+
      V.bajo.map(c=>'cil '+c.cil+' ('+bar(c.seco)+')').join(', '));
    if(V.disp) parte.push('<b class="bad">diferencia entre cilindros</b> del '+pct(100-L.relativa)+
      ', por encima del '+pct(e.tolRel)+' que admite el manual');
    if(V.fug.length) parte.push('<b class="bad">fuga por encima del '+pct(e.limFuga)+':</b> '+
      V.fug.map(c=>'cil '+c.cil+' ('+pct(c.fuga)+')').join(', '));
    if(V.rut.length) parte.push('<b class="bad">ruta anormal:</b> '+
      V.rut.map(c=>'cil '+c.cil+' → '+RUTA_ROT[c.ruta]).join(', '));
    h='<b>Hallazgos:</b> '+parte.join(' · ')+'. ';
    // el criterio que se queda ciego, cuando lo hay: es el corazón de la práctica
    const ciegos=[];
    if(!V.bajo.length&&(V.fug.length||V.rut.length)) ciegos.push('la cifra absoluta no lo ve');
    if(!V.disp&&(V.fug.length||V.rut.length||V.bajo.length)) ciegos.push('la comparación entre cilindros no lo ve');
    if(!V.fug.length&&V.rut.length) ciegos.push('el porcentaje de fuga se queda por debajo del límite y aun así hay que condenarlo, por el SITIO');
    if(ciegos.length) h+='<span class="warn">Y esto es lo que hay que llevarse: '+ciegos.join('; ')+'.</span> ';
    h+='Escenario montado: <b>'+ESCEN[G.esc].rot+'</b> — '+ESCEN[G.esc].clave+'.';
  }
  R.innerHTML=h;
}

// ------------------------------------------------------------------- modos
function afterEdit(){
  invalida();
  if(G.cil>NCIL()) G.cil=1;
  armaChorros(); pintaDestinos();
  pintaTablero(); pintaTele(); pintaInforme(); syncCtrlbar();
}
function setMode(m){
  if(m!=='ensamble'&&!G.simUnlocked){
    showToast('Primero hay que <b>montar el puesto de prueba</b>.',2400);
    return;
  }
  if(G.modo==='ensamble'&&m!=='ensamble'&&ASM.done.size<PARTS.length){
    showToast('Faltan piezas por montar.',2200); return;
  }
  paraCompresion(); G.soplando=false;
  G.modo=m;
  // Volver a la vista de montaje NO desmonta lo ya montado. Si lo hiciera, mirar
  // como quedo el puesto costaria rehacerlo entero, y el alumno aprenderia a no
  // volver nunca. Para practicar el montaje otra vez esta «Volver a montar».
  if(m==='ensamble'){ if(ASM.done.size<PARTS.length) initAssembly(); }
  else if(ASM.done.size<PARTS.length){ montaKit(); }
  if(m==='fugas'){ G.soplando=true; armaChorros(); }
  else limpiaChorros();
  if(m==='humeda') G.humedo=true;
  if(m==='compresion') G.humedo=false;
  if(m==='reto') armaReto();
  G.golpeVis=0; TH=0; thAcum=0;
  pintaHUD(); afterEdit(); refrescaPregunta();
  const CAM={ensamble:[[7.0,4.8,10.6],[0.8,1.90,0.20]],
             compresion:[[3.6,3.9,7.4],[0.3,2.10,0.10]],
             humeda:[[3.2,4.2,7.0],[0.3,2.15,0.10]],
             fugas:[[5.6,4.4,9.0],[0.1,2.00,0.10]],
             reto:[[5.0,4.4,9.4],[0.2,2.00,0.10]]};
  if(m==='censo'){ const t=camTablero(); S.moveTo(t[0],t[1],1.1); return; }
  const c=CAM[m];
  // Las posiciones están escritas para el 1.6 y se escalan por G.k, que sale del
  // ancho real del motor montado. Sin eso el V8 no cabe en el cuadro.
  if(c){ const k=G.k||1;
    S.moveTo(c[0].map((v,i)=>i===1?v*Math.min(k,1.5):v*k), [c[1][0]*k,c[1][1],c[1][2]], 1.1); }
}
function paraCompresion(){
  if(!corriendo) return;
  corriendo=false; buildControls();
}
function corre(){
  if(corriendo){ paraCompresion(); return; }
  G.golpeVis=0; thAcum=0; TH=0; corriendo=true;
  buildControls(); pintaTablero(); pintaTele();
}

// ============================== T4b · RETO, CUESTIONARIO, RECORRIDO Y ARRANQUE
// Las familias que se pueden diagnosticar. Son exactamente las `clave` que
// declara el motor sellado: si mañana se añade un escenario con una clave nueva,
// esta lista se queda corta y el reto lo dice en voz alta en vez de fallar.
const FAMILIAS=[
  ['segmentos','Segmentos o aros'],
  ['cilindro rayado','Pared del cilindro rayada'],
  ['valvula de admision','Válvula de admisión'],
  ['valvula de escape','Válvula de escape'],
  ['junta de culata','Junta de culata'],
  ['distribucion, no sellado','Distribución: el sellado está bien'],
  ['arranque, no sellado','Arranque o batería: el sellado está bien'],
];
const RETO={caso:null, pasos:[], hecho:[], notas:[], veredicto:null, pistas:0, eleccion:null};

function barajaEn(a){                       // Fisher-Yates, para que la posición
  for(let i=a.length-1;i>0;i--){            // de la respuesta no sea la pista
    const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function armaReto(){
  const e=MQ(), casos=casosReto(e);
  RETO.caso=casos[Math.floor(Math.random()*casos.length)];
  G.esc=RETO.caso;
  G.cilAv=Math.floor(Math.random()*(e.ncil-1));   // −1 para que junta2 tenga vecino
  G.alt=ALTITUDES[Math.floor(Math.random()*ALTITUDES.length)];
  G.cil=1; G.humedo=false; G.golpeVis=0; G.dRest=D_REST;
  RETO.pasos=[
    {k:'seca',  rot:'Mide la compresión seca de todos los cilindros'},
    {k:'humeda',rot:'Repite en húmedo el cilindro que sospeches'},
    {k:'fugas', rot:'Presuriza ese cilindro y escucha por dónde sale el aire'},
  ];
  RETO.hecho=[false,false,false];
  RETO.notas=[]; RETO.veredicto=null; RETO.pistas=0; RETO.eleccion=null;
  pintaDxReto();
}
// Anota lo medido. Una nota se apunta una sola vez: la lista es el cuaderno del
// técnico, no un contador de clics.
function anota(txt,i){
  if(RETO.hecho[i]) return;
  RETO.hecho[i]=true; RETO.notas.push(txt);
  pintaTablero(); pintaReto();
}
function registraMedida(){
  if(G.modo!=='reto') return;
  const L=LECT(), c=CIL();
  if(G.golpeVis>=G.golpes&&!G.humedo)
    anota('seca cil '+G.cil+': '+bar(c.seco),0);
  if(G.golpeVis>=G.golpes&&G.humedo)
    anota('húmeda cil '+G.cil+': '+bar(c.humedo)+' ('+gr(c.subida)+')',1);
  if(G.soplando)
    anota('fuga cil '+G.cil+': '+pct(c.fuga)+' por '+RUTA_ROT[FUGA(G.cil).dominante],2);
}
function pintaDxReto(){
  const ops=barajaEn(FAMILIAS.slice());
  el('dxreto').innerHTML=ops.map(o=>
    '<button class="b'+(RETO.eleccion===o[0]?' on':'')+'" data-fam="'+o[0]+'">'+o[1]+'</button>').join('');
}
function pintaReto(){
  const R=el('report');
  let h='<b>Motor bajo diagnóstico:</b> '+MQ().nombre+' · taller a '+ALT_ROT[G.alt]+'. ';
  h+='Órdenes cumplidas: '+RETO.hecho.filter(Boolean).length+'/3. ';
  if(RETO.veredicto) h+=(RETO.veredicto.ok?'<b class="good">Acertaste.</b> ':'<b class="bad">Fallaste.</b> ')+RETO.veredicto.texto;
  else h+='Elige la familia de avería y entrega el diagnóstico.';
  R.innerHTML=h;
  const spec=el('retoSpec');
  spec.innerHTML=RETO.notas.length
    ? '<span class="mono">'+RETO.notas.join('<br>')+'</span>'
    : '<span class="mono">Sin lecturas todavía.</span> Cambia de modo, elige un cilindro y mide.';
  pintaTablero();
}
function pista(){
  const L=LECT(), e=MQ();
  const p=[
    'Empieza por la seca en los '+e.ncil+' cilindros: si todos marcan lo mismo, el problema no es de un cilindro.',
    'Si un cilindro está bajo, móntale aceite: el SIGNO del salto contra sus hermanos separa segmentos de válvula.',
    'Si la seca está pareja pero baja en todos, mira el régimen de arranque ('+num(L.rpmArr,0)+
      ' rpm) y la altitud ('+ALT_ROT[G.alt]+'): puede que el sellado no tenga nada que ver.',
  ];
  const i=Math.min(RETO.pistas,p.length-1);
  RETO.pistas++;
  showToast('💡 '+p[i],6000);
  synth.beep(520,0.07,0.04);
}
function checkReto(){
  if(!RETO.eleccion){ showToast('Elige primero una familia de avería.',2200); return; }
  const L=LECT(), ok=(RETO.eleccion===L.clave);
  const c=L.cilindros.find(x=>x.falla!=='sano');
  let txt;
  if(ok){
    txt=(c?('Era el cilindro '+c.cil+': '+FALLAS[c.falla].rot+'. '+FALLAS[c.falla].nota)
          :('No había ninguna fuga: era '+ESCEN[RETO.caso].rot.toLowerCase()+'. '+
            'Todos los cilindros bajaron por igual, y eso ninguna comparación entre cilindros lo distingue de un motor sano.'))+
      ' Lo que lo demostraba: '+(c?('la ruta del aire — '+RUTA_ROT[c.ruta==='ninguna'?'carter':c.ruta]+' — y el salto al mojar de '+gr(c.subida)+' bar')
                                  :('la compresión absoluta contra el límite corregido, '+bar(L.max)+' contra '+bar(L.limite)));
    if(!RETO.hecho.every(Boolean))
      txt+=' <span class="warn">Aunque acertaste, no cumpliste las tres órdenes: acertar por corazonada y acertar por método se parecen en la respuesta y en nada en el taller.</span>';
    G.resuelto=true;
    synth.beep(660,0.09,0.05); setTimeout(()=>synth.beep(880,0.13,0.05),110);
  }else{
    txt='Era <b>'+ESCEN[RETO.caso].rot+'</b> ('+L.clave+'). '+
      (c?('El cilindro '+c.cil+' fugaba un '+pct(c.fuga)+' por '+RUTA_ROT[FUGA(c.cil).dominante]+
          ' y saltó '+gr(c.subida)+' bar al mojar.')
        :('Ningún cilindro tenía fuga: los '+MQ().ncil+' marcaban lo mismo y el porcentaje de fuga estaba en norma. '+
          'Sin la cifra absoluta corregida por altitud, ese caso es indistinguible de un motor sano.'));
    synth.beep(180,0.14,0.05);
  }
  RETO.veredicto={ok,texto:txt};
  pintaReto(); pintaTablero();
}

// -------------------------------------------------------------- cuestionario
// Una pregunta por modo, con la respuesta calculada por el motor sellado y las
// opciones barajadas en cada refresco: la posición nunca es la pista.
function preguntaDe(m){
  const e=MQ(), L=LECT();
  if(m==='compresion'){
    const c8=compresion(e,{golpes:8,vMan:8}), c24=compresion(e,{golpes:8,vMan:24});
    const p8=barG(c8.pico,c8.pAtm), p24=barG(c24.pico,c24.pAtm);
    const u8=barG(c8.primero,c8.pAtm), u24=barG(c24.primero,c24.pAtm);
    return {q:'Se repite la prueba con un comprobador de manguera larga: '+num(24,0)+' cm³ de volumen muerto en vez de '+num(8,0)+
        '. ¿Qué cambia a los ocho golpes?',
      ops:[['Nada en la lectura final ('+bar(p8)+' contra '+bar(p24)+'): sólo baja el primer golpe, de '+bar(u8)+' a '+bar(u24),true],
           ['La lectura final baja en proporción al volumen añadido',false],
           ['La lectura final sube, porque hay más aire acumulado',false],
           ['Cambia el primer golpe y también la final, las dos por igual',false]],
      why:'La antirretorno hace de trinquete: sigue abriendo mientras el cilindro supere a la manguera, y deja de abrir justo cuando la manguera alcanza la presión que el cilindro daría sin ella. El volumen muerto cuesta GOLPES, no bares. Ojo: con un solo golpe sí baja la cifra, y por eso las prácticas de ciclo publican esa relación.'};
  }
  if(m==='humeda'){
    return {q:'Un cilindro sube MENOS que sus hermanos al echarle aceite. ¿Qué descarta eso?',
      ops:[['Los segmentos: el aceite los sellaría y la subida sería mayor, no menor',true],
           ['La válvula de escape, porque el aceite la enfría',false],
           ['La junta de culata, porque el aceite la taparía',false],
           ['Nada: el salto al mojar no distingue familias',false]],
      why:'El aceite se queda en la corona del pistón. Sella el hueco del aro y no llega ni al asiento de una válvula ni a la junta. Una subida por debajo de la de los demás dice que la fuga está donde el aceite no puede llegar.'};
  }
  if(m==='fugas'){
    const f0=fugas(e,{}), f13=fugas(e,{dRest:1.30});
    return {q:'Con el mismo motor sano, se cambia el restrictor de '+num(1.0,2)+' a '+num(1.30,2)+' mm. La fuga pasa del '+
        num(f0.pct,1)+' % al '+num(f13.pct,1)+' %. ¿Qué ha cambiado?',
      ops:[['El útil, no el motor: el porcentaje es del conjunto motor+fugómetro',true],
           ['El motor: ahora fuga más porque entra más aire',false],
           ['La medida está mal: el porcentaje no depende del restrictor',false],
           ['La altitud, que altera la presión de suministro',false]],
      why:'El porcentaje compara la caída contra un orificio de referencia. Al agrandar el de referencia, la misma fuga real pesa relativamente menos... o más, según de qué lado del equilibrio esté. Lo que NO cambia con el útil es por dónde sale el aire: por eso la ruta localiza y el porcentaje sólo cuantifica.'};
  }
  if(m==='censo'){
    const cen=CENSO(), sc=cen.find(x=>x.sub.length===4&&x.sub.every(s=>s.comparativa));
    return {q:'Con las cuatro observaciones comparativas —déficit, salto, % y ruta— se resuelven '+sc.resueltos+' de '+sc.n+
        ' escenarios. ¿Qué se queda fuera?',
      ops:[['Motor sano, distribución movida y batería baja: los tres bajan todos los cilindros por igual',true],
           ['Los que afectan a dos cilindros contiguos, como la junta de culata',false],
           ['Los de válvula, porque el aceite no los toca',false],
           ['Ninguno: las cuatro comparativas bastan',false]],
      why:'Comparar cilindro contra cilindro encuentra el cilindro malo. Nunca dice que el motor ENTERO está bajo, porque no hay contra qué compararlo dentro del motor. Para eso hace falta un dato externo: la cifra del manual, corregida por la altitud del taller.'};
  }
  if(m==='reto'){
    const fa=fugas(e,{falla:'juntaAgua'});
    return {q:'Un cilindro fuga un '+num(fa.pct,0)+' % —por debajo del límite del '+num(e.limFuga,0)+
        ' % que fija el manual— y el aire burbujea en el radiador. ¿Qué se hace?',
      ops:[['Se condena la junta de culata: no hay burbujeo aceptable, esté el porcentaje donde esté',true],
           ['Se acepta: por debajo del límite no hay hallazgo',false],
           ['Se repite con otro restrictor hasta que pase del límite',false],
           ['Se mide la compresión: si está en norma, no hay nada',false]],
      why:'El límite de porcentaje acota lo que un motor sano puede soplar por donde SÍ sopla —los aros, hacia el cárter—. Un destino que ningún motor sano usa no tiene límite tolerable: se condena por el sitio.'};
  }
  const alt=2660, s0=compresion(e,{alt:0}), s2=compresion(e,{alt});
  return {q:'El mismo motor sano se mide a nivel del mar y en un taller a '+num(alt,0)+' m. ¿Qué pasa?',
    ops:[['Marca menos ('+bar(barG(s2.pico,s2.pAtm))+' contra '+bar(barG(s0.pico,s0.pAtm))+') sin estar peor: hay que corregir el límite',true],
         ['Marca lo mismo: la compresión no depende del aire de fuera',false],
         ['Marca más, porque el aire frío de altura es más denso',false],
         ['Marca menos y hay que rectificarlo',false]],
    why:'La presión de arranque escala con la del aire que entra. Sin corregir el límite del manual por la altitud del taller se condenan motores sanos, y el factor de Toluca ('+num(pAtm(2660)/P_ATM0,3)+') es casi el mismo que la relación límite/estándar ('+num(e.limSeco/e.estandar,2)+'): un motor sano allí cae justo sobre el límite escrito a nivel del mar.'};
}
let QZ=null;
function construyeQuiz(){
  const p=preguntaDe(G.modo);
  QZ={q:p.q, why:p.why, ops:barajaEn(p.ops.map((o,i)=>({t:o[0],ok:o[1]})))};
  el('q_text').innerHTML=QZ.q;
  el('dxbtns').innerHTML=QZ.ops.map((o,i)=>'<button class="b" data-q="'+i+'">'+o.t+'</button>').join('');
}
function respondeQuiz(i){
  const b=el('dxbtns').querySelectorAll('button');
  QZ.ops.forEach((o,k)=>{ b[k].classList.add(o.ok?'ok':(k===i?'wrong':'no')); b[k].disabled=true; });
  // Las dos ramas llevan la lista de clases LITERAL, no concatenada: así el
  // verificador de CSS puede leerlas y comprobar que todas tienen regla.
  el('q_text').innerHTML=QZ.q+(QZ.ops[i].ok
    ? '<div class="dx good" style="margin-top:8px">✔ Correcto. '
    : '<div class="dx bad" style="margin-top:8px">✗ No. ')+QZ.why+'</div>';
  synth.beep(QZ.ops[i].ok?880:200,0.09,0.05);
}
function refrescaPregunta(){ construyeQuiz(); }

// ---------------------------------------------------------------- recorrido
let autoRunning=false;
function runAuto(){
  if(autoRunning) return 0;
  autoRunning=true; syncCtrlbar();
  const pasos=[];
  const add=(ms,fn)=>pasos.push([ms,fn]);
  add(200,()=>{ setMode('ensamble'); showToast('<b>1 · Montaje.</b> Siete piezas, siete huecos.',3200); });
  add(1200,()=>{ autoAssemble(); });
  add(320+PARTS.length*640+1200,()=>{
    G.maq='g16'; G.esc='seg1'; G.cilAv=1; G.alt=0; G.cil=2; setMode('compresion');
    showToast('<b>2 · Compresión seca.</b> El cilindro 2 tiene los segmentos gastados.',3600); afterEdit(); });
  add(1500,()=>{ corre(); });
  add(6200,()=>{ setMode('humeda'); showToast('<b>3 · Húmeda.</b> El aceite sella los aros y la lectura salta.',3600); corre(); });
  add(6200,()=>{ setMode('fugas'); showToast('<b>4 · Fugas.</b> El aire sale por la boca de aceite: eso es un aro.',3800); });
  add(4200,()=>{ G.esc='agua1'; afterEdit(); armaChorros();
    showToast('Ahora una junta al circuito de agua: <b>burbujea en el radiador</b> por debajo del límite, y se condena igual.',4600); });
  add(4600,()=>{ G.esc='sano'; G.alt=2660; afterEdit();
    showToast('<b>Altitud.</b> Motor sano en Toluca: marca un 28 % menos y no está malo.',4400); });
  add(4400,()=>{ setMode('censo'); showToast('<b>5 · Censo.</b> Sin la cifra absoluta no se resuelven los once escenarios.',4400); });
  add(4600,()=>{ G.alt=0; setMode('reto'); showToast('<b>6 · Reto.</b> Ahora te toca a ti.',3400);
    autoRunning=false; syncCtrlbar(); });
  let t=0; pasos.forEach(([ms,fn])=>{ t+=ms; setTimeout(fn,t); });
  return t+400;
}
function otroCaso(){
  if(G.modo==='ensamble'){ initAssembly(); pintaTablero(); pintaTele(); pintaInforme(); syncCtrlbar();
    showToast('Puesto desmontado: vuelve a armarlo pieza a pieza.',2800); return; }
  if(G.modo==='reto'){ armaReto(); afterEdit(); refrescaPregunta(); showToast('Otro motor averiado en el banco.',2400); return; }
  const otros=ESCEN_KEYS.filter(k=>k!==G.esc);
  G.esc=otros[Math.floor(Math.random()*otros.length)];
  G.cilAv=Math.floor(Math.random()*(NCIL()-1));
  G.golpeVis=0; afterEdit(); refrescaPregunta();
  showToast('Escenario: <b>'+ESCEN[G.esc].rot+'</b>.',2800);
}

// ------------------------------------------------------------------ cableado
// Nada de onclick en el HTML: los manejadores se cablean aquí, delegando en el
// panel, para que un botón que se repinta no pierda su comportamiento.
MODES.forEach(m=>el('m_'+m).addEventListener('click',()=>setMode(m)));
el('panel').addEventListener('click',ev=>{
  const b=ev.target.closest('button'); if(!b) return;
  const d=b.dataset;
  if(d.mk){ G.maq=d.mk; G.cil=1; G.cilAv=Math.min(1,ARQ[d.mk].ncil-2); G.rpm=ARQ[d.mk].rpmArr;
            construyeMotor(); (ASM.done.size===PARTS.length)?montaKit():initAssembly(); afterEdit(); refrescaPregunta(); return; }
  if(d.esc){ G.esc=d.esc; G.golpeVis=0; afterEdit(); return; }
  if(d.alt!==undefined&&d.alt!==''){ G.alt=+d.alt; G.golpeVis=0; afterEdit(); return; }
  if(d.cil){ G.cil=+d.cil; G.golpeVis=0; reposiciona(); armaChorros(); afterEdit(); return; }
  if(d.gol){ G.golpes=+d.gol; G.golpeVis=0; afterEdit(); return; }
  if(d.rpm){ G.rpm=+d.rpm; G.golpeVis=0; afterEdit(); return; }
  if(d.rst){ G.dRest=+d.rst; afterEdit(); return; }
  if(d.hum!==undefined&&d.hum!==''){ G.humedo=d.hum==='1'; G.golpeVis=0; afterEdit(); return; }
  if(d.vol){ G.vMan=+d.vol; G.golpeVis=0; afterEdit(); return; }
  if(d.fam){ RETO.eleccion=d.fam; pintaDxReto(); return; }
  if(d.q!==undefined&&d.q!=='') respondeQuiz(+d.q);
  if(b.id==='btnGirar') corre();
  if(b.id==='btnAire'){ G.soplando=!G.soplando; if(G.soplando) armaChorros(); else limpiaChorros();
                        pintaDestinos(); registraMedida(); buildControls(); pintaTele(); }
  if(b.id==='btnPista') pista();
  if(b.id==='btnCheck') checkReto();
  if(b.id==='btnAuto') runAuto();
  if(b.id==='btnNew') otroCaso();
});
el('soundBtn').addEventListener('click',()=>{
  const on=synth.toggle();
  el('soundBtn').classList.toggle('on',on);
  el('soundBtn').textContent=on?'🔊':'🔇';
});

// -------------------------------------------------------------------- arranque
construyeMotor();
initAssembly();
G.modo='ensamble';
pintaHUD(); syncCtrlbar(); construyeQuiz();
pintaTablero(); pintaTele(); pintaInforme(); pintaDestinos(); pintaDxReto();
el('retoTitle').style.display='none'; el('retoBox').style.display='none';
// El hook del bucle se registra con setAnimate: start() no acepta callback, y
// pasarselo lo descarta en silencio dejando la escena congelada.
S.setAnimate(dt=>pinta3D(dt));
S.start();

// --------------------------------------------------------------- ventana de pruebas
// Superficie de comprobación para el arnés de Playwright. Expone el ESTADO, no
// copias: si la interfaz y el motor se separan, el test lo ve.
window.__labDebug={
  get mode(){ return G.modo; },
  get unlocked(){ return G.simUnlocked; },
  get solved(){ return G.resuelto; },
  get running(){ return corriendo; },
  get soplando(){ return G.soplando; },
  get piezas(){ return ASM.done.size; },
  get total(){ return PARTS.length; },
  get st(){ return {maq:G.maq,esc:G.esc,alt:G.alt,cil:G.cil,cilAv:G.cilAv,rpm:G.rpm,
                    golpes:G.golpes,golpeVis:G.golpeVis,dRest:G.dRest,vMan:G.vMan,humedo:G.humedo}; },
  get maquina(){ return MQ(); },
  get lect(){ return LECT(); },
  get comp(){ return COMP(G.cil,G.humedo); },
  get fuga(){ return FUGA(G.cil); },
  get censo(){ return CENSO(); },
  get veredicto(){ return veredicto(); },
  get chorros(){ return CHORROS.map(c=>({ruta:c.ruta,f:c.f})); },
  get reto(){ return {caso:RETO.caso, hecho:RETO.hecho.slice(), notas:RETO.notas.slice(),
                      eleccion:RETO.eleccion, veredicto:RETO.veredicto}; },
  get quiz(){ return QZ?{q:QZ.q, ops:QZ.ops.map(o=>o.t), ok:QZ.ops.findIndex(o=>o.ok)}:null; },
  get autoRunning(){ return autoRunning; },
  get pistones(){ return RIG.pist.map(p=>({cil:p.cil, y:+p.g.position.y.toFixed(6)})); },
  get agujas(){ return {comp:escalaComp()}; },
  setMode:m=>setMode(m),
  setTh:t=>{ TH=t; thAcum=0; if(RIG.motor) sigueMotor(TH); return TH; },
  set:(k,v)=>{ G[k]=v; afterEdit(); },
  setMaquina:k=>{ G.maq=k; G.cil=1; G.cilAv=Math.min(1,ARQ[k].ncil-2); G.rpm=ARQ[k].rpmArr;
                  construyeMotor(); montaKit(); afterEdit(); },
  ensambla:()=>autoAssemble(),
  corre:()=>corre(),
  golpea:n=>{ G.golpeVis=clamp(n,0,G.golpes); pintaTablero(); pintaTele(); return G.golpeVis; },
  aire:v=>{ G.soplando=!!v; if(v) armaChorros(); else limpiaChorros(); pintaDestinos(); pintaTele(); },
  auto:()=>runAuto(),
  otro:()=>otroCaso(),
  retoNuevo:()=>{ armaReto(); afterEdit(); },
  retoSol:()=>LECT().clave,
  elige:f=>{ RETO.eleccion=f; pintaDxReto(); },
  entrega:()=>{ checkReto(); return RETO.veredicto; },
  pista:()=>pista(),
  responde:i=>respondeQuiz(i),
  cifras:()=>({estandar:MQ().estandar, limite:LIM(), pAtm:PATM(), rpm:rpmReal()}),
  texto:()=>el('panel').innerText+'\n'+el('hud').innerText,
  tablero:()=>bcv.toDataURL('image/png'),
};
