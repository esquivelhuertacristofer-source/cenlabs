export interface SimuladorState {
  // Core
  timer: number;
  isRunning: boolean;
  score: number;
  pasoActual: number;
  bitacoraData: Record<string, any>;
  badges: string[];
  
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  updateScore: (points: number) => void;
  setPasoActual: (paso: number) => void;
  setBitacora: (data: Record<string, any>) => void;
  unlockBadge: (badgeId: string) => void;
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;
  resetPractica: () => void;

  // QUÍMICA
  particulas: { protones: number; neutrones: number; electrones: number; isStable: boolean; message: string; };
  setParticulas: (p: number, n: number, e: number) => void;
  validarEstructura: () => boolean;

  gases: { T: number; V: number; P: number; pTarget: number; isExploded: boolean; };
  updateGases: (t: number, v: number) => void;
  resetGases: () => void;
  generarSemillaGases: () => void;

  balanceo: { coeficientes: number[]; isBalanced: boolean; };
  setCoeficiente: (index: number, value: number) => void;
  resetBalanceo: () => void;

  limitante: { mN2: number; mH2: number; limitanteReal: string; excesoReal: number; isRunning: boolean; status: 'idle' | 'success' | 'error'; };
  generarSemillaP4: () => void;
  validarP4: (ansLimitante: string, ansExceso: number) => boolean;
  resetP4: () => void;

  soluciones: { 
    mTarget: number; vTarget: number; mRequerida: number; 
    balanza: { polvo: number; tara: boolean; encendida: boolean; }; 
    matraz: { polvo: number; agua: number; }; 
    status: 'idle' | 'transferred' | 'success' | 'error'; 
  };
  generarSemillaP5: () => void;
  addPolvo: (amount: number) => void;
  toggleTara: () => void;
  transferirPolvo: () => void;
  setAgua: (amount: number) => void;
  validarP5: () => boolean;
  resetP5: () => void;

  solubilidad: { temp: number; salAgregada: number; ubicacion: 'mesa' | 'parrilla' | 'hielo'; status: 'idle' | 'heating' | 'cooling' | 'success' | 'error'; };
  setUbicacionVaso: (loc: 'mesa' | 'parrilla' | 'hielo') => void;
  addSalKNO3: (amount: number) => void;
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
  validarP10: () => boolean;
  resetP10: () => void;

  // FÍSICA
  plano2: { angulo: number; coefRozamiento: number; friccion: number; masa: number; animando: boolean; resultado: 'exito' | 'error' | null; };
  setPlano2: (data: Partial<SimuladorState['plano2']>) => void;

  pendulo3: { longitud: number; masa: number; anguloInicial: number; animando: boolean; periodo: number; oscilando: boolean; resultado: 'exito' | 'error' | null; };
  setPendulo3: (data: Partial<SimuladorState['pendulo3']>) => void;

  hooke4: { k: number; masa: number; estiramiento: number; amplitud: number; oscilando: boolean; animando: boolean; t: number; resultado: 'exito' | 'error' | null; };
  setHooke4: (data: Partial<SimuladorState['hooke4']>) => void;

  colisiones5: { m1: number; v1: number; m2: number; v2: number; tipo: 'elastica' | 'inelastica'; animando: boolean; phase: string; resultado: 'exito' | 'error' | null; };
  setColisiones5: (data: Partial<SimuladorState['colisiones5']>) => void;

  arquimedes6: { fluido: string; densidadCuerpo: number; volumenCuerpo: number; sumergido: number; resultado: 'exito' | 'error' | null; };
  setArquimedes6: (data: Partial<SimuladorState['arquimedes6']>) => void;

  dilatacion7: { material: string; tempIni: number; tempFin: number; longitud: number; resultado: 'exito' | 'error' | null; };
  setDilatacion7: (data: Partial<SimuladorState['dilatacion7']>) => void;

  leyOhm8: { voltaje: number; resistencia: number; modo: 'serie' | 'paralelo'; resultado: 'exito' | 'error' | null; };
  setLeyOhm8: (data: Partial<SimuladorState['leyOhm8']>) => void;
  ohm8: { voltaje: number; resistencia: number; switchOn: boolean; ledRoto: boolean; };
  setOhm8: (data: Partial<SimuladorState['ohm8']>) => void;

  electrostatica9: { q1: number; q2: number; distancia: number; resultado: 'exito' | 'error' | null; };
  setElectrostatica9: (data: Partial<SimuladorState['electrostatica9']>) => void;

  motor10: { imanIzq: 'N' | 'S'; imanDer: 'N' | 'S'; voltaje: number; espiras: number; interruptor: boolean; carga: number; rpm: number; encendido: boolean; resultado: 'exito' | 'error' | null; };
  setMotor10: (data: Partial<SimuladorState['motor10']>) => void;

  tiro1: { angulo: number; velocidad: number; disparando: boolean; };
  setTiro1: (data: Partial<SimuladorState['tiro1']>) => void;

  // MATEMÁTICAS
  cuadraticas: { a: number; b: number; c: number; target: { a: number; b: number; c: number }; status: 'idle' | 'success' | 'error'; };
  setCoefsM1: (a: number, b: number, c: number) => void;
  generarSemillaM1: () => void;
  validarM1: () => boolean;
  resetM1: () => void;

  sistemas2x2: { m1: number; b1: number; m2: number; b2: number; target: { x: number; y: number }; status: 'idle' | 'success' | 'error'; };
  setSistemasCoefsM2: (m1: number, b1: number, m2: number, b2: number) => void;
  generarSemillaM2: () => void;
  validarM2: () => boolean;
  resetM2: () => void;

  richter: { magnitudBase: number; magnitudActual: number; targetM: number; userInputFactor: string; isLogView: boolean; status: 'idle' | 'success' | 'error'; };
  setMagnitudM3: (m: number) => void;
  setUserInputM3: (val: string) => void;
  toggleLogViewM3: () => void;
  generarSemillaM3: () => void;
  validarM3: () => boolean;
  resetM3: () => void;

  pitagoras: { catetoA: number; catetoB: number; llenado: number; userInputC: string; status: 'idle' | 'success' | 'error'; };
  setCatetosM4: (a: number, b: number) => void;
  setLlenadoM4: (val: number) => void;
  setUserInputM4: (val: string) => void;
  validarM4: () => boolean;
  resetM4: () => void;

  trigonometria: { angulo: number; animando: boolean; verSeno: boolean; verCoseno: boolean; status: 'idle' | 'success' | 'error'; };
  setAnguloM5: (a: number) => void;
  setAnimandoM5: (val: boolean) => void;
  setTogglesM5: (seno: boolean, cos: boolean) => void;
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
  validarM8: () => boolean;
  resetM8: () => void;

  integral9: { n: number; metodo: 'izquierda' | 'derecha' | 'punto_medio'; animandoLimite: boolean; status: 'idle' | 'success' | 'error'; };
  setIntegralM9: (n: number, metodo: 'izquierda' | 'derecha' | 'punto_medio') => void;
  setAnimandoM9: (val: boolean) => void;
  validarM9: (errorPorcentual: number) => boolean;
  resetM9: () => void;

  galton10: { poblacion: number; probabilidad: number; simulando: boolean; contenedores: number[]; status: 'idle' | 'success' | 'error'; };
  setGaltonM10: (poblacion: number, probabilidad: number) => void;
  lanzarBolitasM10: () => void;
  setSimulandoM10: (val: boolean) => void;
  vaciarGaltonM10: () => void;
  validarM10: () => boolean;
  resetM10: () => void;

  // BIOLOGÍA
  microscopio: { muestra: 'animal' | 'vegetal' | 'bacteria'; aumento: number; iluminacion: number; posicionX: number; posicionY: number; objetivo: string; status: 'idle' | 'success' | 'error'; };
  setMicroscopio: (data: Partial<SimuladorState['microscopio']>) => void;
  generarSemillaB1: () => void;
  validarB1: () => boolean;
  resetB1: () => void;

  transporte: { concExt: number; concInt: number; tipoCelula: 'animal' | 'vegetal'; verParticulas: boolean; volumen: number; presionOsmotica: number; history: { time: number; volumen: number }[]; status: 'idle' | 'success' | 'error'; };
  setTransporte: (data: Partial<SimuladorState['transporte']>) => void;
  tickTransporte: (dt: number) => void;
  generarSemillaB2: () => void;
  validarB2: () => boolean;
  resetB2: () => void;

  sintesis: { fase: 'transcripcion' | 'traduccion'; adnPlantilla: string; arnMensajero: string; proteina: { name: string; color: string }[]; errores: number; currentIndex: number; lastAddedBase: string | null; isCorrect: boolean | null; status: 'idle' | 'success' | 'error'; };
  addNucleotido: (base: string) => void;
  advanceRibosoma: () => void;
  generarSemillaB3: () => void;
  resetB3: () => void;

  fotosintesis: { distancia: number; color: 'blanco' | 'rojo' | 'azul' | 'verde'; oxigenoAcumulado: number; tiempo: number; simulando: boolean; targetO2: number; status: 'idle' | 'success' | 'error'; };
  setFotosintesis: (data: Partial<SimuladorState['fotosintesis']>) => void;
  tickFotosintesis: (dt: number) => void;
  generarSemillaB4: () => void;
  resetB4: () => void;

  genetica: { padre1: string; padre2: string; poblacionF1: { id: number; genotipo: string; fenotipo: string; x: number; y: number }[]; tamanioMuestra: number; status: 'idle' | 'success' | 'error'; };
  setGenetica: (data: Partial<SimuladorState['genetica']>) => void;
  generarF1: () => void;
  resetB5: () => void;

  evolucion: { ambiente: 'limpio' | 'industrial'; generacion: number; clara: number; oscura: number; cazadasClaras: number; cazadasOscuras: number; tiempo: number; isRunning: boolean; historial: { gen: number; clara: number; oscura: number }[]; bugs: { id: number; tipo: 'clara' | 'oscura'; x: number; y: number; angle: number; speed: number; cazada: boolean }[]; };
  setEvolucion: (data: Partial<SimuladorState['evolucion']>) => void;
  tickEvolucion: (dt: number) => void;
  cazarPolilla: (id: number) => void;
  finalizarGeneracion: () => void;
  resetB6: () => void;

  sistemaNervioso: { fuerzaGolpe: number; integridadMielina: number; estado: 'reposo' | 'golpe' | 'viajando_sensorial' | 'sinapsis' | 'viajando_motor' | 'contraccion'; latenciaMedida: number; velocidadConduccion: number; status: 'idle' | 'success' | 'error'; };
  setB7State: (data: Partial<SimuladorState['sistemaNervioso']>) => void;
  dispararReflejo: () => void;
  generarSemillaB7: () => void;
  resetB7: () => void;

  cardio: { ritmoBPM: number; estadoFisiologico: 'Sueño' | 'Reposo' | 'Actividad' | 'Estrés'; faseActual: 'Diástole' | 'Onda P' | 'QRS' | 'Onda T'; targetBPM: number; status: 'idle' | 'success' | 'error'; };
  setCardio: (data: Partial<SimuladorState['cardio']>) => void;
  generarSemillaB8: () => void;
  resetB8: () => void;

  digestion: { macronutriente: 'almidon' | 'proteina' | 'lipido'; enzimaSeleccionada: 'amilasa' | 'pepsina' | 'lipasa' | null; nivelPH: number; estado: 'intacto' | 'desnaturalizado' | 'digerido' | 'absorbido'; monomerosAbsorbidos: number; status: 'idle' | 'success' | 'error'; };
  setDigestion: (data: Partial<SimuladorState['digestion']>) => void;
  generarSemillaB9: () => void;
  resetB9: () => void;

  ecosistema: { poblacionPresas: number; poblacionDepredadores: number; alfa: number; beta: number; gamma: number; delta: number; tiempoVirtual: number; historial: Array<{ t: number, x: number, y: number }>; simulando: boolean; status: 'idle' | 'success' | 'error' | 'extinction'; };
  setEcosistema: (data: Partial<SimuladorState['ecosistema']>) => void;
  tickEcosistema: (dt: number) => void;
  generarSemillaB10: () => void;
  resetB10: () => void;
}
