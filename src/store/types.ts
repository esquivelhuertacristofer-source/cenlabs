import { Profile } from '../lib/supabase';

export interface SimuladorState {
  // Auth & Sync
  user: Profile | null;
  session: any | null;
  currentIntentoId: string | null;
  syncStatus: 'synced' | 'pending' | 'offline' | 'error';
  setSession: (session: any) => void;
  setUser: (user: Profile | null) => void;
  setCurrentIntentoId: (id: string | null) => void;
  setSyncStatus: (status: 'synced' | 'pending' | 'offline' | 'error') => void;

  // Core
  timer: number;
  isRunning: boolean;
  score: number;
  pasoActual: number;
  bitacoraData: Record<string, any>;
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
    pose: 'neutral' | 'happy' | 'warning' | 'thinking';
  };
  setAsistente: (data: Partial<SimuladorState['asistente']>) => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  updateScore: (points: number) => void;
  setPasoActual: (paso: number) => void;
  setBitacora: (data: Record<string, any>) => void;
  registrarHallazgo: (tipo: string, data: any) => void;
  unlockBadge: (badgeId: string) => void;
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;
  resetPractica: () => void;
  showQuiz: boolean;
  setShowQuiz: (show: boolean) => void;
  quizQuestions: any[];
  setQuizQuestions: (questions: any[]) => void;

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
  };
  updateGases: (t: number, v: number, n?: number) => void;
  resetGases: () => void;
  generarSemillaGases: () => void;
  validarQ2: () => boolean;
  setGasesMission: (missionId: 'sandbox' | 'boyle' | 'charles' | 'gaylussac' | 'avogadro') => void;
  setGasType: (type: 'He' | 'Ne' | 'CO2') => void;

  balanceo: { 
    reaccionActual: number; 
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
  };
  setReaccionLimitante: (index: number) => void;
  setInputMass: (idx: number, mass: number) => void;
  generarSemillaP4: () => void;
  validarP4: (ansLimitanteIdx: number, ansExceso: number) => boolean;
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
  validarP5: () => boolean;
  resetP5: () => void;

  solubilidad: { 
    temp: number; 
    salAgregada: number; 
    ubicacion: 'mesa' | 'parrilla' | 'hielo'; 
    status: 'idle' | 'heating' | 'cooling' | 'success' | 'error'; 
    sustanciaIdx: number;
    sustancias: any[];
  };
  setUbicacionVaso: (loc: 'mesa' | 'parrilla' | 'hielo') => void;
  setSustanciaSolubilidad: (idx: number) => void;
  addSalSolubilidad: (amount: number) => void;
  updateTemperaturaP6: (dt: number) => void;
  validarP6: () => boolean;
  resetP6: () => void;

  titulacion: { ca: number; va: number; cb: number; volumenBase: number; purgada: boolean; indicador: boolean; status: 'idle' | 'success' | 'alert' | 'error'; history: { vol: number; ph: number; }[]; };
  generarSemillaP7: () => void;
  addDropNaOH: (amount: number) => void;
  toggleIndicadorP7: () => void;
  togglePurgaP7: () => void;
  validarP7: (ansCa: number) => boolean;
  resetP7: () => void;

  equilibrio: { jeringas: { id: number; ubicacion: 'mesa' | 'caliente' | 'hielo'; temp: number; }[]; status: 'idle' | 'success' | 'error'; };
  setUbicacionJeringa: (id: number, loc: 'mesa' | 'caliente' | 'hielo') => void;
  updateTemperaturaP8: (dt: number) => void;
  validarP8: (d1: string, d2: string, d3: string) => boolean;
  resetP8: () => void;
  generarSemillaP8: () => void;
  autoResolveP8: () => void;

  celda: { vasoIzq: string | null; vasoDer: string | null; puenteSalino: boolean; cablesConectados: boolean; status: 'idle' | 'success' | 'error'; seedMetales: string[]; voltaje: number; };
  generarSemillaP9: () => void;
  setMetalVaso: (vaso: 'izq' | 'der', metal: string | null) => void;
  togglePuenteSalino: () => void;
  toggleCables: () => void;
  validarP9: (anodo: string, catodo: string, voltaje: number) => boolean;
  resetP9: () => void;

  destilacion: { calorManta: number; tempMezcla: number; volEtanolMatraz: number; volAguaMatraz: number; volDestilado: number; purezaDestilado: number; status: 'idle' | 'boiling' | 'success' | 'error'; };
  setCalorManta: (temp: number) => void;
  updateDestilacion: (dt: number) => void;
  validarP10: (pureza: number) => boolean;
  resetP10: () => void;

  // FÍSICA
  plano2: { angulo: number; coefRozamiento: number; friccion: number; masa: number; animando: boolean; resultado: 'exito' | 'error' | null; };
  setPlano2: (data: Partial<SimuladorState['plano2']>) => void;
  validarF2: () => boolean;

  pendulo3: { longitud: number; masa: number; anguloInicial: number; animando: boolean; periodo: number; oscilando: boolean; resultado: 'exito' | 'error' | null; };
  setPendulo3: (data: Partial<SimuladorState['pendulo3']>) => void;
  validarF3: () => boolean;

  hooke4: { k: number; masa: number; estiramiento: number; amplitud: number; oscilando: boolean; animando: boolean; t: number; resultado: 'exito' | 'error' | null; };
  setHooke4: (data: Partial<SimuladorState['hooke4']>) => void;
  validarF4: () => boolean;

  prensa5: { f1: number; r1: number; r2: number; masaCarga: number; ratio: number; presion: number; isLifting: boolean; resultado: 'exito' | 'error' | null; };
  setPrensa5: (data: Partial<SimuladorState['prensa5']>) => void;
  validarF5: () => boolean;

  arquimedes6: { fluido: string; densidadCuerpo: number; densidadLiquido?: number; volumenCuerpo: number; sumergido: number; radio?: number; isRunning?: boolean; resultado: 'exito' | 'error' | null; };
  setArquimedes6: (data: Partial<SimuladorState['arquimedes6']>) => void;
  validarF6: () => boolean;

  dilatacion7: { material: string; tempIni: number; tempFin: number; longitud: number; resultado: 'exito' | 'error' | null; };
  setDilatacion7: (data: Partial<SimuladorState['dilatacion7']>) => void;
  validarF7: () => boolean;

  ohm8: { 
    nivel: number; 
    voltaje: number; 
    resistencia: number; 
    switchOn: boolean; 
    ledRoto: boolean; 
    bateriaConectada: boolean; 
    resistenciaConectada: boolean; 
    ledConectado: boolean; 
    enfoqueMacro?: number;
    enfoqueMicro?: number;
    resultado: 'exito' | 'error' | null; 
  };
  setOhm8: (data: Partial<SimuladorState['ohm8']>) => void;
  validarF8: () => boolean;

  electrostatica9: { q1: number; q2: number; distancia: number; resultado: 'exito' | 'error' | null; };
  setElectrostatica9: (data: Partial<SimuladorState['electrostatica9']>) => void;
  validarF9: () => boolean;

  motor10: { imanIzq: 'N' | 'S'; imanDer: 'N' | 'S'; voltaje: number; espiras: number; interruptor: boolean; carga: number; rpm: number; encendido: boolean; resultado: 'exito' | 'error' | null; };
  setMotor10: (data: Partial<SimuladorState['motor10']>) => void;
  validarF10: () => boolean;

  tiro1: { 
    angulo: number; 
    velocidad: number; 
    disparando: boolean; 
    targetX: number; 
    resultado: 'exito' | 'fallo' | 'colision' | null; 
    distanciaReal: number; 
    estado: 'idle' | 'success'; 
    y0: number; 
    obsX: number; 
    obsY: number; 
    municion: number; 
    viento: number; 
    densidadAire: number; 
    yImpacto: number;
    escenario: 'tierra' | 'luna' | 'marte' | 'jupiter';
  };
  setTiro1: (data: Partial<SimuladorState['tiro1']>) => void;
  generarSemillaF1: () => void;
  ejecutarDisparoF1: () => void;
  validarF1: () => boolean;
  resetF1: () => void;

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
  };
  setAnguloM5: (a: number) => void;
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
  generarSemillaM7: () => void;
  validarM7: () => boolean;
  resetM7: () => void;

  derivada8: { xActual: number; mostrarDerivada: boolean; status: 'idle' | 'success' | 'error'; };
  setXActualM8: (x: number) => void;
  setMostrarDerivadaM8: (val: boolean) => void;
  setDerivada8: (data: Partial<SimuladorState['derivada8']>) => void;
  validarM8: () => boolean;
  resetM8: () => void;

  integral9: { n: number; metodo: 'izquierda' | 'derecha' | 'punto_medio'; animandoLimite: boolean; status: 'idle' | 'success' | 'error'; };
  setIntegralM9: (n: number, metodo: 'izquierda' | 'derecha' | 'punto_medio') => void;
  setAnimandoM9: (val: boolean) => void;
  validarM9: (errorPorcentual: number) => boolean;
  resetM9: () => void;

  galton10: { 
    poblacion: number; 
    probabilidad: number; 
    simulando: boolean; 
    contenedores: number[]; 
    bolitasPendientes: number; 
    status: 'idle' | 'success' | 'error'; 
  };
  setGaltonM10: (poblacion: number, probabilidad: number) => void;
  lanzarBolitasM10: () => void;
  contarBolitaM10: (bin: number) => void;
  setSimulandoM10: (val: boolean) => void;
  vaciarGaltonM10: () => void;
  validarM10: () => boolean;
  generarSemillaM10: () => void;
  setGalton10: (data: Partial<SimuladorState['galton10']>) => void;
  resetM10: () => void;

  // BIOLOGÍA
  microscopio: { 
    muestra: 'animal' | 'vegetal' | 'bacteria' | 'nervioso'; 
    objetivoMag: 4 | 10 | 40 | 100;
    enfoqueZ: number;
    focoIdealZ: number;
    iluminacion: number; 
    diafragmaIris: number;
    aceiteInmersionAplicado: boolean;
    posicionX: number; 
    posicionY: number; 
    targetOrganelle: string; 
    capturas: string[];
    magnificacionVerified: boolean;
    abbeVerified: boolean;
    enfoqueMacro: number;
    enfoqueMicro: number;
    status: 'idle' | 'success' | 'error'; 
  };
  setMicroscopio: (data: Partial<SimuladorState['microscopio']>) => void;
  generarSemillaB1: () => void;
  validarB1: () => boolean;
  resetB1: () => void;
  tomarCaptura: (url: string) => void;

  transporte: { 
    concExt: number; 
    concInt: number; 
    glucosaExt: number;
    temperatura: number;
    tipoCelula: 'animal' | 'vegetal'; 
    verParticulas: boolean; 
    volumen: number; 
    presionOsmotica: number; 
    history: { time: number; volumen: number }[]; 
    status: 'idle' | 'success' | 'error'; 
  };
  setTransporte: (data: Partial<SimuladorState['transporte']>) => void;
  tickTransporte: (dt: number) => void;
  generarSemillaB2: () => void;
  validarB2: () => boolean;
  resetB2: () => void;

  sintesis: { fase: 'transcripcion' | 'traduccion'; adnPlantilla: string; arnMensajero: string; proteina: { id: string; name: string; color: string }[]; errores: number; currentIndex: number; lastAddedBase: string | null; isCorrect: boolean | null; status: 'idle' | 'success' | 'error'; };
  addNucleotido: (base: string) => void;
  advanceRibosoma: () => void;
  validarB3: () => boolean;
  generarSemillaB3: () => void;
  resetB3: () => void;

  fotosintesis: { 
    escenario: 'optimizacion_espectro' | 'ley_distancia' | 'supervivencia_marte';
    distancia: number; 
    color: 'blanco' | 'rojo' | 'azul' | 'verde' | 'amarillo'; 
    oxigenoAcumulado: number; 
    tiempo: number; 
    simulando: boolean; 
    targetO2: number; 
    status: 'idle' | 'success' | 'error'; 
  };
  setFotosintesis: (data: Partial<SimuladorState['fotosintesis']>) => void;
  tickFotosintesis: (dt: number) => void;
  validarB4: () => boolean;
  generarSemillaB4: () => void;
  resetB4: () => void;

  genetica: { padre1: string; padre2: string; poblacionF1: any[]; tamanioMuestra: number; status: 'idle' | 'success' | 'error'; };
  setGenetica: (data: Partial<SimuladorState['genetica']>) => void;
  validarB5: () => boolean;
  generarF1: () => void;
  resetB5: () => void;

  evolucion: { ambiente: 'limpio' | 'industrial'; generacion: number; clara: number; oscura: number; cazadasClaras: number; cazadasOscuras: number; tiempo: number; isRunning: boolean; historial: { gen: number; clara: number; oscura: number }[]; bugs: any[]; };
  setEvolucion: (data: Partial<SimuladorState['evolucion']>) => void;
  tickEvolucion: (dt: number) => void;
  cazarPolilla: (id: number) => void;
  finalizarGeneracion: () => void;
  validarB6: () => boolean;
  resetB6: () => void;

  sistemaNervioso: { fuerzaGolpe: number; integridadMielina: number; estado: 'reposo' | 'golpe' | 'viajando_sensorial' | 'sinapsis' | 'viajando_motor' | 'contraccion'; latenciaMedida: number; velocidadConduccion: number; status: 'idle' | 'success' | 'error'; };
  setB7State: (data: Partial<SimuladorState['sistemaNervioso']>) => void;
  dispararReflejo: () => void;
  validarB7: () => boolean;
  generarSemillaB7: () => void;
  resetB7: () => void;

  cardio: { ritmoBPM: number; estadoFisiologico: 'Sueño' | 'Reposo' | 'Actividad' | 'Estrés'; faseActual: 'Diástole' | 'Onda P' | 'QRS' | 'Onda T'; targetBPM: number; status: 'idle' | 'success' | 'error'; };
  setCardio: (data: Partial<SimuladorState['cardio']>) => void;
  generarSemillaB8: () => void;
  validarB8: () => boolean;
  resetB8: () => void;

  digestion: { macronutriente: 'almidon' | 'proteina' | 'lipido'; enzimaSeleccionada: 'amilasa' | 'pepsina' | 'lipasa' | null; nivelPH: number; estado: 'intacto' | 'desnaturalizado' | 'digerido' | 'absorbido'; monomerosAbsorbidos: number; status: 'idle' | 'success' | 'error'; };
  setDigestion: (data: Partial<SimuladorState['digestion']>) => void;
  generarSemillaB9: () => void;
  validarB9: () => boolean;
  resetB9: () => void;

  ecosistema: { 
    poblacionPresas: number; 
    poblacionDepredadores: number; 
    parametros: {
      alpha: number;
      beta: number;
      gamma: number;
      delta: number;
    };
    tiempoVirtual: number; 
    historial: Array<{ t: number, presas: number, depredadores: number }>; 
    simulando: boolean; 
    status: 'idle' | 'success' | 'error' | 'extinction'; 
  };
  setEcosistema: (data: Partial<SimuladorState['ecosistema']>) => void;
  tickEcosistema: (dt: number) => void;
  generarSemillaB10: () => void;
  validarB10: () => boolean;
  resetB10: () => void;
}
