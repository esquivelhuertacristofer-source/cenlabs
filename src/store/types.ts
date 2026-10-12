import { Session } from '@supabase/supabase-js';
import { Profile } from '../lib/supabase-helpers';
import type {
  EstadoTiro1, EstadoPlano2, EstadoPendulo3, EstadoHooke4, EstadoPrensa5,
  EstadoArquimedes6, EstadoDilatacion7, EstadoOhm8, EstadoElectrostatica9, EstadoMotor10,
} from '../domain/fisica';

export interface QuizQuestion {
  pregunta: string;
  opciones: string[];
  respuestaCorrecta: number;
  explicacion: string;
}

export interface BitacoraEntry {
  tipo: string;
  timestamp: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

export interface BitacoraData {
  hallazgos: BitacoraEntry[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/** Veredicto de un lab: `ok` y, si falla, qué decirle al alumno. */
export interface ResultadoValidacion {
  ok: boolean;
  mensaje?: string;
}

export interface SimuladorState {
  // Auth & Sync
  user: Profile | null;
  session: Session | null;
  currentIntentoId: string | null;
  syncStatus: 'synced' | 'pending' | 'offline' | 'error';
  setSession: (session: Session | null) => void;
  setUser: (user: Profile | null) => void;
  setCurrentIntentoId: (id: string | null) => void;
  setSyncStatus: (status: 'synced' | 'pending' | 'offline' | 'error') => void;

  // Core
  timer: number;
  isRunning: boolean;
  score: number;
  pasoActual: number;
  bitacoraData: BitacoraData;
  badges: string[];
  audio: {
    playClick: () => void;
    playPop: () => void;
    playSuccess: () => void;
    playError: () => void;
    playNotification: () => void;
    playVictory: () => void;
  };
  
  asistente: {
    visible: boolean;
    text: string;
    mascot: 'dr_quantum' | 'dra_helix';
    pose: 'neutral' | 'happy' | 'warning' | 'thinking' | 'disappointed' | 'puzzled';
  };
  setAsistente: (data: Partial<SimuladorState['asistente']>) => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  updateScore: (points: number) => void;
  setPasoActual: (paso: number) => void;
  setBitacora: (data: BitacoraData) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registrarHallazgo: (tipo: string, data: Record<string, any>) => void;
  unlockBadge: (badgeId: string) => void;
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;
  resetPractica: () => void;
  resetQuimica: () => void;
  resetFisica: () => void;
  resetBiologia: () => void;
  resetMatematicas: () => void;

  // Entrada y validación por lab. `entrarLab` deja el lab en un intento NUEVO
  // (reset + semilla) cada vez que se abre; `validarLab` es el único juez que
  // usa el botón «Validar práctica». Cada materia resuelve los suyos en su slice.
  entrarLab: (id: string) => void;
  validarLab: (id: string) => ResultadoValidacion;
  entrarQuimica: (n: number) => void;
  entrarFisica: (n: number) => void;
  entrarBiologia: (n: number) => void;
  entrarMatematicas: (n: number) => void;
  validarLabQuimica: (n: number) => ResultadoValidacion;
  validarLabFisica: (n: number) => ResultadoValidacion;
  validarLabBiologia: (n: number) => ResultadoValidacion;
  validarLabMatematicas: (n: number) => ResultadoValidacion;
  showQuiz: boolean;
  setShowQuiz: (show: boolean) => void;
  quizQuestions: QuizQuestion[];
  setQuizQuestions: (questions: QuizQuestion[]) => void;

  // QUÍMICA
  particulas: { 
    protones: number; 
    neutrones: number; 
    electrones: number; 
    targetZ: number; 
    targetA: number; 
    targetCharge: number; 
    intentos: number;
    estrellas: number;
    isStable: boolean; 
    message: string; 
  };
  setParticulas: (p: number, n: number, e: number) => void;
  validarEstructura: () => boolean;
  setTargetElement: (z: number, a: number) => void;
  setTargetCharge: (charge: number) => void;
  resetParticulas: () => void;

  gases: {
    missionId: 'sandbox' | 'boyle' | 'charles' | 'gaylussac' | 'avogadro';
    T: number;
    V: number;
    P: number;
    n: number;
    pTarget: number;
    isExploded: boolean;
    gasType: string;
    mw: number;
    status: 'idle' | 'success' | 'error';
  };
  updateGases: (t: number, v: number, n?: number) => void;
  resetGases: () => void;
  generarSemillaGases: () => void;
  validarQ2: () => boolean;
  validarQ3: () => boolean;
  setGasesMission: (missionId: 'sandbox' | 'boyle' | 'charles' | 'gaylussac' | 'avogadro') => void;
  setGasType: (type: 'He' | 'Ne' | 'CO2') => void;

  balanceo: {
    reaccionActual: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reacciones: any[];
    coeficientes: number[]; 
    isBalanced: boolean; 
    atomosReactivos: Record<string, number>;
    atomosProductos: Record<string, number>;
    masaReactivos: number;
    masaProductos: number;
    reaccionesCompletadas: string[];
  };
  setCoeficiente: (index: number, value: number) => void;
  setReaccion: (index: number) => void;
  resetBalanceo: () => void;

  limitante: {
    reaccionActual: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reacciones: any[];
    inputMasses: number[];
    targetYield: number;
    results: {
      moles: number[];
      limitingIdx: number;
      theoreticalYield: number;
      excessMass: number;
    };
    isRunning: boolean; 
    status: 'idle' | 'success' | 'error'; 
    // Lo que el alumno registra en la consola: el validador lee esto, no el panel.
    respuesta: { limitanteIdx: number | null; exceso: number | null };
  };
  setReaccionLimitante: (index: number) => void;
  setInputMass: (idx: number, mass: number) => void;
  generarSemillaP4: () => void;
  setRespuestaP4: (limitanteIdx: number | null, exceso: number | null) => void;
  validarP4: () => boolean;
  resetP4: () => void;

  soluciones: { 
    mTarget: number; vTarget: number; mRequerida: number; 
    sal?: { nombre: string; formula: string; pm: number; purity: number };
    balanza: { polvo: number; tara: boolean; encendida: boolean; }; 
    matraz: { polvo: number; agua: number; }; 
    interaccion?: { holding: string | null; jarraAbierta: boolean };
    status: 'idle' | 'transferred' | 'success' | 'error'; 
  };
  generarSemillaP5: () => void;
  addPolvo: (amount: number) => void;
  toggleTara: () => void;
  transferirPolvo: () => void;
  setAgua: (amount: number) => void;
  setHolding: (item: string | null) => void;
  toggleJar: () => void;
  setSal: (idx: number) => void;
  validarP5: () => boolean;
  resetP5: () => void;

  solubilidad: { 
    temp: number; 
    salAgregada: number; 
    ubicacion: 'mesa' | 'parrilla' | 'hielo'; 
    status: 'idle' | 'heating' | 'cooling' | 'success' | 'error'; 
    sustanciaIdx: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sustancias: any[];
    // true cuando toda la sal añadida quedó disuelta en caliente siendo más de la
    // que admite el agua a 20 °C (la disolución que cristaliza al enfriar).
    disueltoEnCaliente: boolean;
  };
  setUbicacionVaso: (loc: 'mesa' | 'parrilla' | 'hielo') => void;
  setSustanciaSolubilidad: (idx: number) => void;
  addSalSolubilidad: (amount: number) => void;
  updateTemperaturaP6: (dt: number) => void;
  validarP6: () => boolean;
  resetP6: () => void;

  titulacion: { ca: number; va: number; cb: number; volumenBase: number; purgada: boolean; indicador: boolean; status: 'idle' | 'success' | 'alert' | 'error'; history: { vol: number; ph: number; }[]; respuestaCa: number | null; };
  generarSemillaP7: () => void;
  addDropNaOH: (amount: number) => void;
  toggleIndicadorP7: () => void;
  togglePurgaP7: () => void;
  setRespuestaP7: (ca: number | null) => void;
  validarP7: () => boolean;
  resetP7: () => void;

  equilibrio: { jeringas: { id: number; ubicacion: 'mesa' | 'caliente' | 'hielo'; temp: number; }[]; status: 'idle' | 'success' | 'error'; observaciones: Record<number, string>; };
  setUbicacionJeringa: (id: number, loc: 'mesa' | 'caliente' | 'hielo') => void;
  updateTemperaturaP8: (dt: number) => void;
  setObservacionP8: (id: number, color: string) => void;
  validarP8: () => boolean;
  resetP8: () => void;
  generarSemillaP8: () => void;
  autoResolveP8: () => void;

  // voltaje: lectura con signo del voltímetro (COM al vaso izquierdo, V al derecho).
  celda: { vasoIzq: string | null; vasoDer: string | null; puenteSalino: boolean; cablesConectados: boolean; status: 'idle' | 'success' | 'error'; seedMetales: string[]; voltaje: number; respuesta: { anodo: string | null; catodo: string | null }; };
  generarSemillaP9: () => void;
  setMetalVaso: (vaso: 'izq' | 'der', metal: string | null) => void;
  togglePuenteSalino: () => void;
  toggleCables: () => void;
  setRespuestaP9: (anodo: string | null, catodo: string | null) => void;
  validarP9: () => boolean;
  resetP9: () => void;

  // purezaDestilado: % v/v de etanol del destilado ACUMULADO (volEtanolDest / volDestilado).
  destilacion: { calorManta: number; tempMezcla: number; tempCabeza: number; tasa: number; volEtanolMatraz: number; volAguaMatraz: number; volDestilado: number; volEtanolDest: number; purezaDestilado: number; status: 'idle' | 'boiling' | 'success' | 'error'; };
  setCalorManta: (temp: number) => void;
  updateDestilacion: (dt: number) => void;
  validarP10: () => boolean;
  resetP10: () => void;

  // FÍSICA (las formas del estado viven en src/domain/fisica.ts)
  plano2: EstadoPlano2;
  setPlano2: (data: Partial<SimuladorState['plano2']>) => void;
  validarF2: () => boolean;

  pendulo3: EstadoPendulo3;
  setPendulo3: (data: Partial<SimuladorState['pendulo3']>) => void;
  validarF3: () => boolean;

  hooke4: EstadoHooke4;
  setHooke4: (data: Partial<SimuladorState['hooke4']>) => void;
  validarF4: () => boolean;

  prensa5: EstadoPrensa5;
  setPrensa5: (data: Partial<SimuladorState['prensa5']>) => void;
  validarF5: () => boolean;

  arquimedes6: EstadoArquimedes6;
  setArquimedes6: (data: Partial<SimuladorState['arquimedes6']>) => void;
  validarF6: () => boolean;

  dilatacion7: EstadoDilatacion7;
  setDilatacion7: (data: Partial<SimuladorState['dilatacion7']>) => void;
  validarF7: () => boolean;

  ohm8: EstadoOhm8;
  setOhm8: (data: Partial<SimuladorState['ohm8']>) => void;
  validarF8: () => boolean;

  electrostatica9: EstadoElectrostatica9;
  setElectrostatica9: (data: Partial<SimuladorState['electrostatica9']>) => void;
  validarF9: () => boolean;

  motor10: EstadoMotor10;
  setMotor10: (data: Partial<SimuladorState['motor10']>) => void;
  validarF10: () => boolean;

  tiro1: EstadoTiro1;
  setTiro1: (data: Partial<SimuladorState['tiro1']>) => void;
  generarSemillaF1: () => void;
  ejecutarDisparoF1: () => void;
  validarF1: () => boolean;
  resetF1: () => void;
  resetF2: () => void;
  resetF3: () => void;
  resetF4: () => void;
  resetF5: () => void;
  resetF6: () => void;
  resetF7: () => void;
  resetF8: () => void;
  resetF9: () => void;
  resetF10: () => void;

  // MATEMÁTICAS
  cuadraticas: { 
    a: number; b: number; c: number; 
    target: { a: number; b: number; c: number }; 
    status: 'idle' | 'success' | 'error';
    intentos: number;
    estrellas: number;
    hallazgos: Array<{ id: string; eq: string; delta: number; h: number; k: number; timestamp: string }>;
    mensajeFeedback?: string;
    deltaVerified?: boolean;
    vertexVerified?: boolean;
    escenario: 'parabola_basica' | 'lanzamiento_proyectil' | 'arquitectura_arco' | 'focalizacion_antena';
  };
  setCoefsM1: (a: number, b: number, c: number) => void;
  generarSemillaM1: () => void;
  validarM1: () => boolean;
  registrarHallazgoM1: () => void;
  resetM1: () => void;
  setDeltaVerified: (v: boolean) => void;
  setVertexVerified: (v: boolean) => void;

  sistemas2x2: { 
    m1: number; b1: number; m2: number; b2: number; 
    target: { x: number; y: number }; 
    status: 'idle' | 'success' | 'error';
    escenario: 'rastreo_satelital' | 'interseccion_rutas' | 'triangulacion_torres';
  };
  setSistemasCoefsM2: (m1: number, b1: number, m2: number, b2: number) => void;
  generarSemillaM2: () => void;
  validarM2: () => boolean;
  resetM2: () => void;

  richter: { 
    magnitudBase: number; 
    magnitudActual: number; 
    targetM: number; 
    userInputFactor: string; 
    isLogView: boolean; 
    status: 'idle' | 'success' | 'error'; 
    escenario: 'simulacion_libre' | 'valdivia_1960' | 'cdmx_1985' | 'tohoku_2011' | 'haiti_2010' | 'sumatra_2004' | 'sanfrancisco_1906';
  };
  setMagnitudM3: (m: number) => void;
  setUserInputM3: (val: string) => void;
  toggleLogViewM3: () => void;
  generarSemillaM3: () => void;
  validarM3: () => boolean;
  resetM3: () => void;

  pitagoras: { 
    catetoA: number; 
    catetoB: number; 
    llenado: number; 
    userInputC: string; 
    status: 'idle' | 'success' | 'error'; 
    escenario: 'pitagoras_basico' | 'diseno_rampas' | 'navegacion_maritima';
  };
  setCatetosM4: (a: number, b: number) => void;
  setLlenadoM4: (val: number) => void;
  setUserInputM4: (val: string) => void;
  generarSemillaM4: (forcedEsc?: 'pitagoras_basico' | 'diseno_rampas' | 'navegacion_maritima') => void;
  validarM4: () => boolean;
  resetM4: () => void;

  trigonometria: { 
    angulo: number; 
    animando: boolean; 
    verSeno: boolean; 
    verCoseno: boolean; 
    status: 'idle' | 'success' | 'error'; 
    hallazgos?: Array<{ id: number; angulo: number; sin: number; cos: number; }>;
    /** Ecuación a resolver: sen θ = valor o cos θ = valor (dos soluciones en una vuelta). */
    objetivo?: { funcion: 'sen' | 'cos'; valor: number; texto: string };
  };
  setAnguloM5: (a: number) => void;
  generarSemillaM5: () => void;
  limpiarHallazgosM5: () => void;
  setAnimandoM5: (val: boolean) => void;
  setTogglesM5: (seno: boolean, cos: boolean) => void;
  registrarHallazgoM5: () => void;
  validarM5: () => boolean;
  resetM5: () => void;

  geometria6: { tx: number; ty: number; rotacion: number; escala: number; target: { tx: number; ty: number; rotacion: number; escala: number; }; status: 'idle' | 'success' | 'error'; };
  setTransformM6: (tx: number, ty: number, rot: number, s: number) => void;
  generarSemillaM6: () => void;
  validarM6: () => boolean;
  resetM6: () => void;

  optica7: { n1: number; n2: number | 'misterio'; n2Misterio: number; anguloIncidencia: number; userInputN2: string; status: 'idle' | 'success' | 'error'; };
  setOpticaM7: (n1: number, n2: number | 'misterio', angulo: number) => void;
  setUserInputM7: (val: string) => void;
  setAnguloM7: (angulo: number) => void;
  generarSemillaM7: () => void;
  validarM7: () => boolean;
  resetM7: () => void;

  /** s(t) = −k·t³ + m·t² (cohete); xActual = instante t que el alumno marca. */
  derivada8: { xActual: number; k: number; m: number; mostrarDerivada: boolean; status: 'idle' | 'success' | 'error'; };
  setXActualM8: (x: number) => void;
  setMostrarDerivadaM8: (val: boolean) => void;
  setDerivada8: (data: Partial<SimuladorState['derivada8']>) => void;
  generarSemillaM8: () => void;
  validarM8: () => boolean;
  resetM8: () => void;

  /** metodoReto: método que exige el reto (cada uno con su tolerancia de error relativo). */
  integral9: { n: number; metodo: 'izquierda' | 'derecha' | 'punto_medio'; metodoReto: 'izquierda' | 'derecha' | 'punto_medio'; animandoLimite: boolean; status: 'idle' | 'success' | 'error'; };
  setIntegralM9: (n: number, metodo: 'izquierda' | 'derecha' | 'punto_medio') => void;
  setAnimandoM9: (val: boolean) => void;
  validarM9: () => boolean;
  generarSemillaM9: () => void;
  resetM9: () => void;

  galton10: { 
    poblacion: number; 
    probabilidad: number; 
    simulando: boolean; 
    contenedores: number[]; 
    bolitasPendientes: number; 
    status: 'idle' | 'success' | 'error'; 
    /** Predicción teórica del alumno (texto tal como lo escribe). */
    prediccionMedia: string;
    prediccionSigma: string;
  };
  setProbabilidadM10: (p: number) => void;
  setPrediccionM10: (media: string, sigma: string) => void;
  setGaltonM10: (poblacion: number, probabilidad: number) => void;
  lanzarBolitasM10: () => void;
  contarBolitaM10: (bin: number) => void;
  setSimulandoM10: (val: boolean) => void;
  vaciarGaltonM10: () => void;
  validarM10: () => boolean;
  generarSemillaM10: () => void;
  setGalton10: (data: Partial<SimuladorState['galton10']>) => void;
  resetM10: () => void;

  // BIOLOGÍA — formas de estado en las interfaces `*StateB*` (final del archivo);
  // la ciencia y los validadores viven en src/domain/biologia.ts.
  microscopio: MicroscopioStateB1;
  setMicroscopio: (data: Partial<MicroscopioStateB1>) => void;
  generarSemillaB1: () => void;
  validarB1: () => boolean;
  resetB1: () => void;
  tomarCaptura: (url: string) => void;

  transporte: TransporteStateB2;
  setTransporte: (data: Partial<TransporteStateB2>) => void;
  generarSemillaB2: () => void;
  validarB2: () => boolean;
  resetB2: () => void;

  sintesis: SintesisStateB3;
  addNucleotido: (base: string) => void;
  advanceRibosoma: (eleccion: string) => void;   // anticodón del ARNt elegido o LIBERACION_B3
  validarB3: () => boolean;
  generarSemillaB3: () => void;
  resetB3: () => void;

  fotosintesis: FotosintesisStateB4;
  setFotosintesis: (data: Partial<FotosintesisStateB4>) => void;
  registrarEnsayoB4: () => void;
  validarB4: () => boolean;
  generarSemillaB4: () => void;
  resetB4: () => void;

  genetica: GeneticaStateB5;
  setGenetica: (data: Partial<GeneticaStateB5>) => void;
  validarB5: () => boolean;
  generarF1: () => void;
  generarSemillaB5: () => void;
  resetB5: () => void;

  evolucion: EvolucionStateB6;
  setEvolucion: (data: Partial<EvolucionStateB6>) => void;
  cazarPolilla: (id: number) => void;
  finalizarGeneracion: () => void;
  generarSemillaB6: () => void;
  validarB6: () => boolean;
  resetB6: () => void;

  sistemaNervioso: SistemaNerviosoStateB7;
  setB7State: (data: Partial<SistemaNerviosoStateB7>) => void;
  registrarGolpeB7: () => EnsayoReflejoB7;
  validarB7: () => boolean;
  generarSemillaB7: () => void;
  resetB7: () => void;

  cardio: CardioStateB8;
  setCardio: (data: Partial<CardioStateB8>) => void;
  administrarFarmacoB8: (farmaco: FarmacoB8) => void;
  generarSemillaB8: () => void;
  validarB8: () => boolean;
  resetB8: () => void;

  digestion: DigestionStateB9;
  setDigestion: (data: Partial<DigestionStateB9>) => void;
  incubarB9: () => void;
  generarSemillaB9: () => void;
  validarB9: () => boolean;
  resetB9: () => void;

  ecosistema: EcosistemaStateB10;
  setEcosistema: (data: Partial<EcosistemaStateB10>) => void;
  registrarCorridaB10: (corrida: NonNullable<EcosistemaStateB10['corrida']>, presas: number, depredadores: number, historial: EcosistemaStateB10['historial']) => void;
  generarSemillaB10: () => void;
  validarB10: () => boolean;
  resetB10: () => void;
}

// ─── Slice type aliases for StateCreator 4th param ───────────────────────────
export type CoreSlice = Pick<SimuladorState,
  | 'user' | 'session' | 'currentIntentoId' | 'syncStatus'
  | 'setSession' | 'setUser' | 'setCurrentIntentoId' | 'setSyncStatus'
  | 'timer' | 'isRunning' | 'score' | 'pasoActual' | 'bitacoraData' | 'badges' | 'audio' | 'asistente' | 'language'
  | 'setAsistente' | 'startTimer' | 'stopTimer' | 'resetTimer' | 'tick'
  | 'updateScore' | 'setPasoActual' | 'setBitacora' | 'registrarHallazgo' | 'unlockBadge' | 'setLanguage'
  | 'resetPractica' | 'showQuiz' | 'setShowQuiz' | 'quizQuestions' | 'setQuizQuestions'
  | 'entrarLab' | 'validarLab'
>;

export type QuimicaSlice = Pick<SimuladorState,
  | 'particulas' | 'setParticulas' | 'validarEstructura' | 'setTargetElement' | 'setTargetCharge' | 'resetParticulas'
  | 'gases' | 'updateGases' | 'resetGases' | 'generarSemillaGases' | 'validarQ2' | 'validarQ3' | 'setGasesMission' | 'setGasType'
  | 'balanceo' | 'setCoeficiente' | 'setReaccion' | 'resetBalanceo'
  | 'limitante' | 'setReaccionLimitante' | 'setInputMass' | 'generarSemillaP4' | 'setRespuestaP4' | 'validarP4' | 'resetP4'
  | 'soluciones' | 'generarSemillaP5' | 'addPolvo' | 'toggleTara' | 'transferirPolvo' | 'setAgua' | 'setHolding' | 'toggleJar' | 'setSal' | 'validarP5' | 'resetP5'
  | 'solubilidad' | 'setUbicacionVaso' | 'setSustanciaSolubilidad' | 'addSalSolubilidad' | 'updateTemperaturaP6' | 'validarP6' | 'resetP6'
  | 'titulacion' | 'generarSemillaP7' | 'addDropNaOH' | 'toggleIndicadorP7' | 'togglePurgaP7' | 'setRespuestaP7' | 'validarP7' | 'resetP7'
  | 'equilibrio' | 'setUbicacionJeringa' | 'updateTemperaturaP8' | 'setObservacionP8' | 'validarP8' | 'resetP8' | 'generarSemillaP8' | 'autoResolveP8'
  | 'celda' | 'generarSemillaP9' | 'setMetalVaso' | 'togglePuenteSalino' | 'toggleCables' | 'setRespuestaP9' | 'validarP9' | 'resetP9'
  | 'destilacion' | 'setCalorManta' | 'updateDestilacion' | 'validarP10' | 'resetP10'
  | 'resetQuimica' | 'entrarQuimica' | 'validarLabQuimica'
>;

export type FisicaSlice = Pick<SimuladorState,
  | 'plano2' | 'setPlano2' | 'validarF2'
  | 'pendulo3' | 'setPendulo3' | 'validarF3'
  | 'hooke4' | 'setHooke4' | 'validarF4'
  | 'prensa5' | 'setPrensa5' | 'validarF5'
  | 'arquimedes6' | 'setArquimedes6' | 'validarF6'
  | 'dilatacion7' | 'setDilatacion7' | 'validarF7'
  | 'ohm8' | 'setOhm8' | 'validarF8'
  | 'electrostatica9' | 'setElectrostatica9' | 'validarF9'
  | 'motor10' | 'setMotor10' | 'validarF10'
  | 'tiro1' | 'setTiro1' | 'generarSemillaF1' | 'ejecutarDisparoF1' | 'validarF1'
  | 'resetF1' | 'resetF2' | 'resetF3' | 'resetF4' | 'resetF5' | 'resetF6' | 'resetF7' | 'resetF8' | 'resetF9' | 'resetF10'
  | 'resetFisica' | 'entrarFisica' | 'validarLabFisica'
>;

export type MatematicasSlice = Pick<SimuladorState,
  | 'cuadraticas' | 'setCoefsM1' | 'generarSemillaM1' | 'validarM1' | 'registrarHallazgoM1' | 'resetM1' | 'setDeltaVerified' | 'setVertexVerified'
  | 'sistemas2x2' | 'setSistemasCoefsM2' | 'generarSemillaM2' | 'validarM2' | 'resetM2'
  | 'richter' | 'setMagnitudM3' | 'setUserInputM3' | 'toggleLogViewM3' | 'generarSemillaM3' | 'validarM3' | 'resetM3'
  | 'pitagoras' | 'setCatetosM4' | 'setLlenadoM4' | 'setUserInputM4' | 'generarSemillaM4' | 'validarM4' | 'resetM4'
  | 'trigonometria' | 'setAnguloM5' | 'setAnimandoM5' | 'setTogglesM5' | 'registrarHallazgoM5' | 'validarM5' | 'resetM5' | 'generarSemillaM5' | 'limpiarHallazgosM5'
  | 'geometria6' | 'setTransformM6' | 'generarSemillaM6' | 'validarM6' | 'resetM6'
  | 'optica7' | 'setOpticaM7' | 'setUserInputM7' | 'setAnguloM7' | 'generarSemillaM7' | 'validarM7' | 'resetM7'
  | 'derivada8' | 'setXActualM8' | 'setMostrarDerivadaM8' | 'setDerivada8' | 'generarSemillaM8' | 'validarM8' | 'resetM8'
  | 'integral9' | 'setIntegralM9' | 'setAnimandoM9' | 'validarM9' | 'generarSemillaM9' | 'resetM9'
  | 'galton10' | 'setGaltonM10' | 'lanzarBolitasM10' | 'contarBolitaM10' | 'setSimulandoM10' | 'vaciarGaltonM10' | 'validarM10' | 'generarSemillaM10' | 'setGalton10' | 'resetM10' | 'setProbabilidadM10' | 'setPrediccionM10'
  | 'resetMatematicas' | 'entrarMatematicas' | 'validarLabMatematicas'
>;

export type BiologiaSlice = Pick<SimuladorState,
  | 'microscopio' | 'setMicroscopio' | 'generarSemillaB1' | 'validarB1' | 'resetB1' | 'tomarCaptura'
  | 'transporte' | 'setTransporte' | 'generarSemillaB2' | 'validarB2' | 'resetB2'
  | 'sintesis' | 'addNucleotido' | 'advanceRibosoma' | 'validarB3' | 'generarSemillaB3' | 'resetB3'
  | 'fotosintesis' | 'setFotosintesis' | 'registrarEnsayoB4' | 'validarB4' | 'generarSemillaB4' | 'resetB4'
  | 'genetica' | 'setGenetica' | 'validarB5' | 'generarF1' | 'generarSemillaB5' | 'resetB5'
  | 'evolucion' | 'setEvolucion' | 'cazarPolilla' | 'finalizarGeneracion' | 'generarSemillaB6' | 'validarB6' | 'resetB6'
  | 'sistemaNervioso' | 'setB7State' | 'registrarGolpeB7' | 'validarB7' | 'generarSemillaB7' | 'resetB7'
  | 'cardio' | 'setCardio' | 'administrarFarmacoB8' | 'generarSemillaB8' | 'validarB8' | 'resetB8'
  | 'digestion' | 'setDigestion' | 'incubarB9' | 'generarSemillaB9' | 'validarB9' | 'resetB9'
  | 'ecosistema' | 'setEcosistema' | 'registrarCorridaB10' | 'generarSemillaB10' | 'validarB10' | 'resetB10'
  | 'resetBiologia' | 'entrarBiologia' | 'validarLabBiologia'
>;

// ── BIOLOGÍA: estado de cada lab ─────────────────────────────────────────────
// Lo que el Piloto escribe y lo que el validador de dominio lee. Los campos
// marcados «oculto» son la incógnita del intento: el panel no los muestra.
type StatusLabBio = 'idle' | 'success' | 'error';
export type ObjetivoMagB1 = 4 | 10 | 40 | 100;
export type MuestraB1 = 'vegetal' | 'animal' | 'bacteria';

export interface MicroscopioStateB1 {
  muestra: MuestraB1;
  objetivoMag: ObjetivoMagB1;
  enfoqueMacro: number;          // 0..100
  enfoqueMicro: number;          // 0..10 (décimas del macro)
  enfoqueZ: number;              // macro + micro/10
  focoIdealZ: number;            // oculto: plano focal de la preparación
  iluminacion: number;           // % del reóstato
  aceiteInmersionAplicado: boolean;
  posicionX: number;
  posicionY: number;
  muestraObjetivo: MuestraB1;    // misión: preparación a observar
  targetOrganelle: string;       // misión: estructura a localizar
  magMin: ObjetivoMagB1;         // oculto: objetivo mínimo que la resuelve
  capturas: string[];
  magnificacionVerified: boolean;
  abbeVerified: boolean;
  status: StatusLabBio;
}

export interface TransporteStateB2 {
  concExt: number;               // NaCl del medio (mol/L)
  glucosaExt: number;            // glucosa del medio (mol/L)
  concInt: number;               // oculto: NaCl-equivalente del citoplasma (mol/L)
  temperatura: number;           // °C
  tipoCelula: 'animal' | 'vegetal';
  volumen: number;               // % del volumen inicial (última lectura)
  lisada: boolean;               // hemólisis: irreversible hasta nueva muestra
  status: StatusLabBio;
}

export interface AminoacidoB3 { id: string; name: string; color: string }
export interface SintesisStateB3 {
  fase: 'transcripcion' | 'traduccion';
  adnPlantilla: string;          // hebra molde 3'→5'
  arnMensajero: string;          // 5'→3'
  proteina: AminoacidoB3[];
  errores: number;
  currentIndex: number;
  terminada: boolean;            // el ribosoma llegó al codón de paro
  status: StatusLabBio;
}

export type ColorLuzB4 = 'blanco' | 'rojo' | 'azul' | 'verde' | 'amarillo';
export interface EnsayoB4 { color: ColorLuzB4; distancia: number; o2: number }
export interface FotosintesisStateB4 {
  distancia: number;             // cm de la lámpara a la ramita
  color: ColorLuzB4;
  dMin: number;                  // cm: más cerca el agua se calienta (dato)
  meta: number;                  // mL de O₂ en un ensayo (dato)
  ensayos: EnsayoB4[];
  status: StatusLabBio;
}

export type ProporcionB5 = [number, number, number, number];
export interface CruzaB5 {
  padre1: string; padre2: string; n: number;
  prediccion: ProporcionB5;      // la que el alumno tenía al cruzar
  observados: ProporcionB5;      // amarilla-lisa, amarilla-rugosa, verde-lisa, verde-rugosa
}
export interface GeneticaStateB5 {
  padre1: string;
  padre2: string;
  prediccion: ProporcionB5;
  tamanioMuestra: number;
  poblacionF1: string[];         // genotipos de la descendencia de la última cruza
  cruza: CruzaB5 | null;
  status: StatusLabBio;
}

export type GenotipoB6 = 'CC' | 'Cc' | 'cc';
export interface PolillaB6 {
  id: number; genotipo: GenotipoB6; tipo: 'clara' | 'oscura';
  x: number; y: number; angle: number; cazada: boolean;
}
export interface EvolucionStateB6 {
  ambiente: 'limpio' | 'industrial';
  generacion: number;            // generación en el tronco (1 = inicial)
  cuota: number;                 // polillas que caza el ave por generación
  bugs: PolillaB6[];
  pInicialFav: number;           // frecuencia inicial del alelo favorecido
  // selectividad: fracción de cazadas que contrastaban con la corteza menos su
  // fracción en la población (0 = caza al azar, > 0 = el ave caza lo visible).
  historial: { gen: number; pFav: number; fOscuras: number; selectividad: number }[];
  status: StatusLabBio;
}

export interface EnsayoReflejoB7 { fuerza: number; respuesta: boolean; latencia: number | null }
export interface SistemaNerviosoStateB7 {
  fuerzaGolpe: number;           // % de la fuerza máxima del martillo
  integridadMielina: number;     // oculto: % de mielina del paciente
  umbral: number;                // oculto: fuerza mínima que dispara el reflejo
  distancia: number;             // m: receptor → médula → cuádriceps (dato)
  ensayos: EnsayoReflejoB7[];
  velocidadEstimada: number | null;
  diagnostico: 'normal' | 'desmielinizante' | null;
  status: StatusLabBio;
}

export type FarmacoB8 = 'atropina' | 'metoprolol' | 'adrenalina';
export interface CardioStateB8 {
  tipo: 'bradicardia' | 'taquicardia';  // oculto: ritmo del paciente al llegar
  fcInicial: number;             // oculto
  ritmoBPM: number;              // oculto: FC actual (se LEE en el trazo)
  dosis: Record<FarmacoB8, number>;
  diagnostico: 'bradicardia' | 'taquicardia' | 'normal' | null;
  lecturaFC: number | null;      // FC que el alumno midió en el trazo
  status: StatusLabBio;
}

export type MacronutrienteB9 = 'almidon' | 'proteina' | 'lipido';
export type EnzimaB9 = 'amilasa' | 'pepsina' | 'tripsina' | 'lipasa';
export type OrganoB9 = 'boca' | 'estomago' | 'delgado' | 'grueso';
export type ResultadoIncubacionB9 = 'sin_reaccion' | 'desnaturalizada' | 'parcial' | 'completa';
export interface IncubacionB9 {
  enzima: EnzimaB9; pH: number; bilis: boolean;
  resultado: ResultadoIncubacionB9; hidrolisis: number;  // 0..1
}
export interface DigestionStateB9 {
  macronutriente: MacronutrienteB9;
  enzimaSeleccionada: EnzimaB9 | null;
  nivelPH: number;
  bilis: boolean;
  ensayo: IncubacionB9 | null;
  organoRespuesta: OrganoB9 | null;
  absorcionRespuesta: OrganoB9 | null;
  status: StatusLabBio;
}

export interface ParametrosLVB10 { alpha: number; beta: number; gamma: number; delta: number }
export interface EcosistemaStateB10 {
  poblacionPresas: number;
  poblacionDepredadores: number;
  presasIniciales: number;
  depredadoresIniciales: number;
  parametros: ParametrosLVB10;
  tiempoVirtual: number;         // años de la última corrida
  historial: Array<{ t: number; presas: number; depredadores: number }>;
  simulando: boolean;
  corrida: { t: number; extincion: false | 'presas' | 'depredadores'; parametros: ParametrosLVB10 } | null;
  status: StatusLabBio | 'extinction';
}
