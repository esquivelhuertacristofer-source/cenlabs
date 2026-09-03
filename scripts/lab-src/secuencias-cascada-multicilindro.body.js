/* =====================================================================
   MEC-98 · d4-06 — Secuencias multicilindro por método cascada
   ---------------------------------------------------------------------
   El bloque MOTOR está pegado VERBATIM desde el verificador numérico
   scratchpad/verif_cascada.mjs (236 comprobaciones, 0 fallos). No se toca
   aquí: si hay que cambiar física, se cambia en el verificador y se
   vuelve a pegar.

   Modelo:
   - Una secuencia multicilindro se rompe cuando un mismo cilindro tiene
     las dos órdenes (ida y vuelta) presentes a la vez sobre su memoria
     biestable. El método cascada lo evita repartiendo la secuencia en
     GRUPOS de forma que ningún cilindro se repita dentro de un grupo, y
     alimentando cada grupo desde su propia línea de presión: sólo una
     línea está viva a la vez, así que las órdenes de los demás grupos
     están físicamente muertas.
   - El número de grupos NO lo fija el número de cilindros, lo fija el
     ENTRELAZADO de la secuencia (la prensa de punzonado tiene 2
     cilindros y necesita 3 grupos; la encajadora tiene 3 cilindros y
     también 3).
   - La señal que cierra un grupo es el final de carrera del ÚLTIMO
     movimiento de ese grupo: es lo único que garantiza que el grupo ha
     terminado antes de conmutar la línea.
   - Cada grupo de más cuesta un inversor, tiempo muerto de llenado de
     línea y aire de mando tirado en cada ciclo.
   - El caudal se calcula por ISO 6358 (relación crítica b = 0,45), así
     que el tiempo de cada carrera depende de la contrapresión que impone
     la carga: un cilindro más grande tiene más fuerza y más margen, pero
     mueve más aire y no siempre es más rápido.

   Ref: ISO 1219-1 (símbolos), ISO 6358 (caudal), ISO 8778 (aire ANR de
   referencia), ISO 15552 (parejas émbolo-vástago), ISO 4414 (seguridad),
   ISO 8573-1 (calidad del aire, citada).
   ===================================================================== */

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[5.2,2.6,5.6],target:[1.9,0.95,0.55],bgTop:'#0d1017',bgBot:'#05060a',bloom:0.42,minD:3.0,maxD:20});
const {scene}=S;
const synth=makeSynth({type:'square',type2:'sine',filterFreq:2400,Q:0.7});
const el=id=>document.getElementById(id);

// ===================== 2. MOTOR (verbatim del verificador) =====================
const P_ANR=1.000, P_ATM=1.013;      // ISO 8778: aire de referencia ANR
const B_CRIT=0.45;                    // ISO 6358: relacion critica de presiones (rango 0,2-0,5)
const P_PILOT=2.5;                    // umbral de pilotaje de las valvulas (criterio de fabricante, rango 1,5-3,0)
const RENDIM=0.90;                    // rendimiento mecanico del cilindro (rango 0,85-0,95)
const CARGA_MAX=0.70;                 // relacion de carga maxima admisible (rango 0,50-0,80)
const V_MAX=1.00;                     // m/s: velocidad maxima con amortiguacion estandar (rango 0,5-1,5)
const E_AIRE=0.11;                    // kWh por m3 ANR a 7 bar (rango 0,10-0,12)
const C_MAN_1M=12.5;                  // conductancia sonica del tubo de mando 4x2,5 de 1 m, l/(min*bar) (rango 10-15)
const D_MAN=2.5;                      // mm: diametro interior del tubo de mando 4x2,5
const V_PIL=0.008;                    // l: volumen de pilotaje por valvula (rango 0,005-0,012)
const CIL_ISO={32:12,40:16,50:20,63:20,80:25,100:25};   // ISO 15552: parejas embolo-vastago
const DIAMS=[32,40,50,63,80,100];
const EJES=['cortes','cambio','diam'];

// --- secuencia: "A+ B+ B- A-" -> [{cil,dir}] ---
const SEQ=s=>s.trim().split(/\s+/).map(m=>({cil:m[0],dir:m[1]==='+'?1:-1}));
const rotMov=m=>m.cil+(m.dir>0?'+':'−');
const fcDe=m=>m.cil.toLowerCase()+(m.dir>0?'1':'0');
const rotSec=seq=>seq.map(rotMov).join(' ');

const POOL=[
  {id:'marcado', nom:'Marcadora de piezas', sec:'A+ B+ B- A-', pRed:6, qn:100, manL:8, ritmo:1200, prot:'B',
   cils:[{id:'A',nom:'Mordaza de sujecion',s:80,Fe:900,Fr:250,D:63},
         {id:'B',nom:'Cabezal marcador',s:120,Fe:1400,Fr:300}],
   proc:'la mordaza sujeta, el cabezal marca y se retira antes de soltar'},
  {id:'transfer', nom:'Transfer de dos ejes', sec:'A+ B+ A- B-', pRed:6, qn:200, manL:10, ritmo:1400, prot:'A',
   cils:[{id:'A',nom:'Carro horizontal',s:400,Fe:250,Fr:250},
         {id:'B',nom:'Elevador',s:150,Fe:400,Fr:350,D:63}],
   proc:'el carro lleva la pieza, el elevador la deposita y el carro vuelve en vacio'},
  {id:'punzonado', nom:'Prensa de punzonado', sec:'A+ A- B+ B-', pRed:6, qn:100, manL:6, ritmo:2000, prot:'A',
   cils:[{id:'A',nom:'Punzon',s:60,Fe:1600,Fr:400},
         {id:'B',nom:'Extractor de recorte',s:100,Fe:200,Fr:150,D:50}],
   proc:'el punzon corta y sube, y solo entonces el extractor saca el recorte'},
  {id:'encajado', nom:'Encajadora de producto', sec:'A+ B+ B- C+ C- A-', pRed:6, qn:200, manL:12, ritmo:1200, prot:'A',
   cils:[{id:'A',nom:'Empujador de cajas',s:300,Fe:350,Fr:350},
         {id:'B',nom:'Plegador de solapa',s:90,Fe:250,Fr:300,D:63},
         {id:'C',nom:'Sellador de cinta',s:120,Fe:900,Fr:250,D:63}],
   proc:'el empujador presenta la caja, se pliega la solapa y se sella antes de retirarla'},
  {id:'envasado', nom:'Envasadora vertical', sec:'A+ A- B+ B- C+ C-', pRed:6, qn:100, manL:9, ritmo:1000, prot:'C',
   cils:[{id:'A',nom:'Compuerta dosificadora',s:50,Fe:180,Fr:180,D:50},
         {id:'B',nom:'Empujador de bolsa',s:250,Fe:300,Fr:300,D:63},
         {id:'C',nom:'Mordaza de sellado',s:40,Fe:1500,Fr:400}],
   proc:'se dosifica abriendo y cerrando la compuerta, la bolsa avanza y se sella'},
];
POOL.forEach(s=>{s.seq=SEQ(s.sec);});

const SC=id=>POOL.find(s=>s.id===id);
const cilDe=(sc,id)=>sc.cils.find(c=>c.id===id);
const cilProt=sc=>cilDe(sc,sc.prot);
const fcOpts=sc=>sc.cils.flatMap(c=>[c.id.toLowerCase()+'0',c.id.toLowerCase()+'1']);

// --- reparto en grupos ---
function grupos(seq,cortes){
  const g=[];let cur=[];
  for(let i=0;i<seq.length;i++){ if(i>0&&cortes.indexOf(i)>=0){g.push(cur);cur=[];} cur.push(i); }
  g.push(cur);return g;
}
function sepVale(seq,gs){
  return gs.every(g=>{const s=new Set();for(const i of g){if(s.has(seq[i].cil))return false;s.add(seq[i].cil);}return true;});
}
function todosCortes(n){
  const out=[];
  for(let m=0;m<(1<<(n-1));m++){const c=[];for(let i=1;i<n;i++)if(m&(1<<(i-1)))c.push(i);out.push(c);}
  return out;
}
function cortesGreedy(seq){
  const c=[];let cur=new Set();
  for(let i=0;i<seq.length;i++){ if(cur.has(seq[i].cil)){c.push(i);cur=new Set();} cur.add(seq[i].cil); }
  return c;
}
function repartosMinimos(seq){
  let best=1e9,out=[];
  for(const c of todosCortes(seq.length)){
    const gs=grupos(seq,c); if(!sepVale(seq,gs))continue;
    if(gs.length<best){best=gs.length;out=[c];}
    else if(gs.length===best)out.push(c);
  }
  return {gMin:best,repartos:out};
}
const cortesIguales=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);

// --- ISO 6358: caudal masico expresado en l/min ANR ---
function qFlujo(C,p1abs,p2abs){
  if(p2abs>=p1abs)return 0;
  const r=p2abs/p1abs;
  if(r<=B_CRIT)return C*p1abs;
  const x=(r-B_CRIT)/(1-B_CRIT);
  return C*p1abs*Math.sqrt(Math.max(0,1-x*x));
}
const F_QN=7*Math.sqrt(1-Math.pow((6/7-B_CRIT)/(1-B_CRIT),2));
const cDeQn=qn=>qn/F_QN;

// --- llenado de un volumen a traves de una conductancia hasta el umbral de pilotaje ---
function tLlenado(V,C,pRed){
  const p1=pRed+P_ATM, pFin=P_PILOT+P_ATM;
  if(p1<=pFin||C<=0)return Infinity;
  const N=2000, dp=(pFin-P_ATM)/N;
  let p=P_ATM,t=0;
  for(let i=0;i<N;i++){
    const q=qFlujo(C,p1,p+dp/2);
    if(q<=0)return Infinity;
    t+=(V/P_ANR)*dp/q;
    p+=dp;
  }
  return t*60;
}
// --- linea de mando: tubo 4x2,5 + volumenes de pilotaje del grupo ---
const cMan=L=>C_MAN_1M/Math.sqrt(L);
const vTubo=L=>Math.PI*D_MAN*D_MAN*L/4000;
const vLinea=(sc,nMov)=>vTubo(sc.manL)+V_PIL*(nMov+1);
const tLinea=(sc,nMov)=>tLlenado(vLinea(sc,nMov),cMan(sc.manL),sc.pRed);
const aireLinea=(sc,nMov)=>vLinea(sc,nMov)*(sc.pRed+P_ATM)/P_ANR;

// --- movimiento de un cilindro ---
const areaEmb=D=>Math.PI*D*D/400;                       // cm2
const areaAnu=D=>(Math.PI*D*D-Math.PI*CIL_ISO[D]*CIL_ISO[D])/400;
function movDatos(cil,dir,D,pRed,qn){
  const A=dir>0?areaEmb(D):areaAnu(D);
  const F=dir>0?cil.Fe:cil.Fr;
  const p=F/(10*A*RENDIM);                              // bar necesarios para vencer la carga
  const carga=p/pRed;                                   // relacion de carga
  const Vg=A*cil.s/10000;                               // litros a presion de trabajo
  const q=qFlujo(cDeQn(qn),pRed+P_ATM,p+P_ATM);         // l/min ANR
  const vANR=Vg*(p+P_ATM)/P_ANR;
  const t=q>0?vANR/q*60:Infinity;
  const v=(isFinite(t)&&t>0)?(cil.s/1000)/t:0;
  return {A,F,p,carga,Vg,q,vANR,t,v};
}
const diamCil=(sc,cfg,id)=>id===sc.prot?cfg.diam:cilDe(sc,id).D;

// --- simulacion del mando en cascada (eventos exactos) ---
const fcPres=(x,s)=>{const id=s[0].toUpperCase();return s[1]==='1'?x[id]>=1-1e-9:x[id]<=1e-9;};
function simular(sc,cfg){
  const seq=sc.seq, gs=grupos(seq,cfg.cortes), G=gs.length;
  const cad=gs.map((g,i)=>i===0?cfg.cambio:fcDe(seq[g[g.length-1]]));
  const tLin=gs.map(g=>tLinea(sc,g.length));
  const T={};
  sc.cils.forEach(c=>{const D=diamCil(sc,cfg,c.id);T[c.id]={p:movDatos(c,1,D,sc.pRed,sc.qn),n:movDatos(c,-1,D,sc.pRed,sc.qn)};});
  const x={},mem={};
  sc.cils.forEach(c=>{x[c.id]=0;mem[c.id]=-1;});
  let t=0, linea=-1, pend=tLin[0], pendTo=0, orden=[], ev=0, bloqueo=null, tCiclo=Infinity;
  if(!isFinite(pend))return {ok:false,orden:[],tCiclo:Infinity,bloqueo:{tipo:'linea'},G,gs,cad,T,tLin};
  while(ev<400&&t<180){
    ev++;
    // 1. el cambio de grupo corta la linea: tiene prioridad sobre las ordenes del grupo
    if(pend<=0&&linea>=0&&fcPres(x,cad[linea])){
      const nx=(linea+1)%G;
      if(nx===0){tCiclo=t;break;}
      pendTo=nx;pend=tLin[nx];linea=-1;
      if(!isFinite(pend)){bloqueo={tipo:'linea'};break;}
      continue;
    }
    // 2. pilotajes alimentados por la linea viva
    const pil={};sc.cils.forEach(c=>pil[c.id]={ext:false,ret:false});
    if(pend<=0&&linea>=0){
      const g=gs[linea];
      for(let j=0;j<g.length;j++){
        const m=seq[g[j]];
        if(j===0||fcPres(x,fcDe(seq[g[j-1]]))){ if(m.dir>0)pil[m.cil].ext=true; else pil[m.cil].ret=true; }
      }
    }
    // 3. memorias biestables
    let opuestas=null;
    sc.cils.forEach(c=>{
      const p=pil[c.id];
      if(p.ext&&p.ret)opuestas=c.id;
      else if(p.ext)mem[c.id]=1;
      else if(p.ret)mem[c.id]=-1;
    });
    // 4. proximo evento
    let dt=Infinity;const mueve=[];
    sc.cils.forEach(c=>{
      const d=mem[c.id], obj=d>0?1:0;
      if(Math.abs(x[c.id]-obj)<1e-9)return;
      const dat=d>0?T[c.id].p:T[c.id].n;
      if(!isFinite(dat.t)||dat.t<=0)return;
      const rest=Math.abs(obj-x[c.id])*dat.t;
      mueve.push({id:c.id,d,obj,rest,tt:dat.t});
      if(rest<dt)dt=rest;
    });
    if(pend>0&&pend<dt)dt=pend;
    if(!isFinite(dt)){bloqueo=opuestas?{tipo:'opuestas',cil:opuestas}:{tipo:'sinsenal',linea,senal:linea>=0?cad[linea]:null};break;}
    // 5. avanzar
    t+=dt;
    mueve.forEach(mv=>{
      x[mv.id]+=mv.d*dt/mv.tt;
      if(Math.abs(x[mv.id]-mv.obj)<1e-9||(mv.d>0&&x[mv.id]>1)||(mv.d<0&&x[mv.id]<0)){
        x[mv.id]=mv.obj;orden.push(mv.id+(mv.d>0?'+':'−'));
      }
    });
    if(pend>0){pend-=dt;if(pend<=1e-12){pend=0;linea=pendTo;}}
  }
  const ok=isFinite(tCiclo)&&orden.join(' ')===rotSec(seq);
  return {ok,orden,tCiclo,bloqueo,G,gs,cad,T,tLin};
}

// --- ciclo: tiempos y aire ---
function ciclo(sc,cfg){
  const sim=simular(sc,cfg);
  const gs=sim.gs;
  const tLin=sim.tLin.reduce((a,b)=>a+b,0);
  let tMov=0,aireCil=0;
  sc.seq.forEach(m=>{const d=m.dir>0?sim.T[m.cil].p:sim.T[m.cil].n;tMov+=d.t;aireCil+=d.vANR;});
  const aireLin=gs.reduce((a,g)=>a+aireLinea(sc,g.length),0);
  const total=sim.ok?sim.tCiclo:Infinity;
  const ciclosH=(sim.ok&&isFinite(total)&&total>0)?3600/total:0;
  const aireTot=aireCil+aireLin;
  return {sim,tMov,tLin,total,ciclosH,aireCil,aireLin,aireTot,
          pctLin:aireTot>0?100*aireLin/aireTot:0,
          aireH:ciclosH*aireTot/1000, kwhH:ciclosH*aireTot/1000*E_AIRE};
}

// --- evaluacion de una propuesta completa ---
function evalCfg(sc,cfg){
  const gs=grupos(sc.seq,cfg.cortes), G=gs.length;
  const okSep=sepVale(sc.seq,gs);
  const okMin=G===sc.gMin;
  const okCam=cfg.cambio===fcDe(sc.seq[gs[0][gs[0].length-1]]);
  const cil=cilProt(sc);
  const de=movDatos(cil,1,cfg.diam,sc.pRed,sc.qn), dr=movDatos(cil,-1,cfg.diam,sc.pRed,sc.qn);
  const cargaMax=Math.max(de.carga,dr.carga);
  const velMax=Math.max(de.v,dr.v);
  const okFza=cargaMax<=CARGA_MAX+1e-9;
  const okVel=velMax<=V_MAX+1e-9;
  const cy=ciclo(sc,cfg);
  const okRit=cy.ciclosH>=sc.ritmo-1e-9;
  const vale=okSep&&okMin&&okCam&&okFza&&okVel&&okRit;
  return {okSep,okMin,okCam,okFza,okVel,okRit,vale,G,gs,de,dr,cargaMax,velMax,cy,
          coste:[G,DIAMS.indexOf(cfg.diam)]};
}
function cmpCoste(a,b){
  for(let i=0;i<a.length;i++){const d=a[i]-b[i];if(Math.abs(d)>1e-9)return d<0?-1:1;}
  return 0;
}
function GOOD(sc){
  const cortes=cortesGreedy(sc.seq);
  const gs=grupos(sc.seq,cortes);
  const cambio=fcDe(sc.seq[gs[0][gs[0].length-1]]);
  const diam=DIAMS.find(D=>evalCfg(sc,{cortes,cambio,diam:D}).vale);
  return {cortes,cambio,diam:diam===undefined?DIAMS[DIAMS.length-1]:diam};
}
const cfgWith=(g,eje,v)=>({cortes:g.cortes,cambio:g.cambio,diam:g.diam,[eje]:v});
function okEje(sc,eje,v){
  const g=GOOD(sc), e=evalCfg(sc,cfgWith(g,eje,v));
  return e.vale&&cmpCoste(e.coste,evalCfg(sc,g).coste)===0;
}

// --- diagnostico por eje ---
const f1=(x,n)=>{
  if(!isFinite(x))return '∞';
  const s=Math.abs(x).toFixed(n), p=s.split('.');
  return (x<0?'-':'')+p[0].replace(/\B(?=(\d{3})+(?!\d))/g,' ')+(p[1]?','+p[1]:'');
};
const rotCortes=(sc,cortes)=>grupos(sc.seq,cortes).map(g=>g.map(i=>rotMov(sc.seq[i])).join(' ')).join(' | ');
function cilRepe(seq,gs){
  for(let i=0;i<gs.length;i++){const s=new Set();for(const j of gs[i]){if(s.has(seq[j].cil))return {cil:seq[j].cil,g:i+1};s.add(seq[j].cil);}}
  return null;
}
function porQue(sc,eje,v){
  if(okEje(sc,eje,v))return '';
  const g=GOOD(sc), cfg=cfgWith(g,eje,v), e=evalCfg(sc,cfg);
  if(eje==='cortes'){
    if(!e.okSep){
      const r=cilRepe(sc.seq,e.gs), sim=e.cy.sim;
      const det=sim.bloqueo?(sim.bloqueo.tipo==='opuestas'
          ?`la maquina se para en seco: ${sim.bloqueo.cil} recibe las dos ordenes a la vez`
          :`la cascada se queda esperando ${sim.bloqueo.senal||'una senal'}, que ya no se va a pisar`)
        :`la cascada da la vuelta antes de llegar al conflicto y cierra el ciclo con ${sim.orden.length} de ${sc.seq.length} movimientos`;
      return `El cilindro ${r.cil} aparece dos veces en el grupo ${r.g}: los dos pilotajes de su valvula biestable cuelgan de la misma linea viva. Con este mando, ${det}.`;
    }
    if(!e.okMin){
      const extra=e.G-sc.gMin, cy=e.cy, cyG=ciclo(sc,g);
      return `El reparto es valido pero usa ${e.G} grupos donde bastan ${sc.gMin}: ${extra} inversor(es) de mas, ${f1(cy.tLin-cyG.tLin,3)} s de cambio de linea por ciclo y ${f1(cy.aireLin-cyG.aireLin,3)} l ANR tirados en cada ciclo.`;
    }
    return `El reparto no cumple: revisa el ritmo (${f1(e.cy.ciclosH,0)} ciclos/h frente a ${f1(sc.ritmo,0)} pedidos).`;
  }
  if(eje==='cambio'){
    const gs=grupos(sc.seq,g.cortes), ult=sc.seq[gs[0][gs[0].length-1]];
    const sim=e.cy.sim;
    const det=sim.bloqueo?(sim.bloqueo.tipo==='opuestas'
        ?`el cilindro ${sim.bloqueo.cil} recibe las dos ordenes a la vez`
        :`la cascada se queda esperando una senal que no llega`)
      :`la maquina ejecuta ${sim.orden.length?sim.orden.join(' '):'nada'} en vez de ${rotSec(sc.seq)}`;
    return `El grupo 1 termina con ${rotMov(ult)}, asi que quien debe cerrarlo es ${fcDe(ult)}. Con ${v}, ${det}.`;
  }
  if(!e.okFza){
    const peor=e.dr.carga>=e.de.carga?'retroceso (area anular)':'avance (area del embolo)';
    return `Con Ø${v} mm la relacion de carga en el ${peor} es ${f1(e.cargaMax,3)}, por encima del maximo admisible ${f1(CARGA_MAX,2)}.`;
  }
  if(!e.okVel)return `Con Ø${v} mm el embolo alcanza ${f1(e.velMax,3)} m/s, por encima de ${f1(V_MAX,2)} m/s: la amortiguacion estandar no absorbe ese impacto.`;
  if(!e.okRit)return `Con Ø${v} mm el ciclo dura ${f1(e.cy.total,3)} s: ${f1(e.cy.ciclosH,0)} ciclos/h frente a los ${f1(sc.ritmo,0)} que pide la linea.`;
  const gEv=evalCfg(sc,g);
  return `Con Ø${v} mm la estacion funciona, pero Ø${g.diam} mm tambien y consume menos aire (${f1(gEv.cy.aireTot,3)} l frente a ${f1(e.cy.aireTot,3)} l por ciclo): el criterio es el menor diametro que cumpla.`;
}

// completar gMin en el pool (parte del motor en el body)
POOL.forEach(s=>{const r=repartosMinimos(s.seq);s.gMin=r.gMin;s._rep=r.repartos;});
// recuento de repartos posibles y válidos (para el informe del pizarrón)
POOL.forEach(s=>{
  const todos=todosCortes(s.seq.length);
  s._tot=todos.length;
  s._val=todos.filter(c=>sepVale(s.seq,grupos(s.seq,c))).length;
});

// ===================== 2a. LECTURA HONESTA DE LA PARADA =====================
/* simular() sólo devuelve bloqueo != null cuando la máquina se para EN SECO,
   es decir cuando ya no hay ningún evento futuro. Hay un tercer modo de fallo,
   y es el más frecuente del banco: con la señal de cambio equivocada el final
   de carrera que debe cerrar el grupo 1 ya está pisado desde el arranque, así
   que la cascada da la vuelta entera conmutando de línea sin llegar a ordenar
   todo lo que tocaba, vuelve al grupo 1 y cierra el ciclo con la secuencia
   incompleta (o sin un solo movimiento). No hay bloqueo que enseñar, pero la
   máquina tampoco hace su trabajo: en el barrido de 480 mandos son 343 de los
   457 fallos. Mostrar ahí un guión sería mentir por omisión. */
function bloqTxt(sim,seq){
  if(sim.bloqueo){
    const b=sim.bloqueo;
    if(b.tipo==='opuestas')return 'órdenes opuestas en '+b.cil;
    if(b.tipo==='linea')return 'la línea de mando no llega a presión';
    return b.senal?('espera '+b.senal+', que ya no se va a pisar'):'espera una señal que no llega';
  }
  if(sim.ok)return '—';
  return sim.orden.length
    ? 'ninguno: la cascada da la vuelta con '+sim.orden.length+' de '+seq.length+' movimientos'
    : 'ninguno: la cascada da la vuelta sin ordenar ni un movimiento';
}
/* La misma lectura, redactada para ir dentro de una frase. */
function desenlaceTxt(sim){
  if(sim.bloqueo){
    const b=sim.bloqueo;
    if(b.tipo==='opuestas')return 'la máquina se para en seco porque el cilindro '+b.cil+' recibe las dos órdenes a la vez';
    if(b.tipo==='linea')return 'la línea de mando no llega a presión y la máquina no arranca';
    return 'la máquina se para esperando '+(b.senal||'una señal')+', que ya no se va a pisar';
  }
  if(sim.ok)return 'la máquina ejecuta la secuencia completa';
  return 'la cascada da la vuelta y el ciclo se cierra con la secuencia a medias';
}

// ===================== 2b. LÍNEA DE TIEMPO PARA LA ANIMACIÓN =====================
/* simular() devuelve el ORDEN exacto de los sucesos y el tiempo de ciclo, pero
   no una trayectoria indexada en el tiempo. timeline() la construye a partir de
   los mismos datos: llenado de la línea de cada grupo + una carrera por
   movimiento, con las duraciones que ya calcula el motor. Para una propuesta
   válida la suma coincide exactamente con ciclo().total (= tMov + tLin).
   Si el mando está roto se reproduce lo que llegó a ejecutarse y se queda en
   PARO: la animación NO intenta solapar dos movimientos simultáneos. */
const T_PARO=3.0;
function timeline(sc,cfg){
  const sim=simular(sc,cfg), gs=sim.gs, seq=sc.seq, ev=[];
  let t=0;
  if(sim.ok){
    gs.forEach((g,gi)=>{
      ev.push({tipo:'linea',g:gi,t0:t,t1:t+sim.tLin[gi]});t+=sim.tLin[gi];
      g.forEach(i=>{
        const m=seq[i], d=m.dir>0?sim.T[m.cil].p:sim.T[m.cil].n;
        ev.push({tipo:'mov',cil:m.cil,dir:m.dir,g:gi,t0:t,t1:t+d.t});t+=d.t;
      });
    });
    return {ok:true,ev,total:t,orden:sim.orden,sim};
  }
  const tl0=isFinite(sim.tLin[0])?sim.tLin[0]:0.4;
  ev.push({tipo:'linea',g:0,t0:0,t1:tl0});t=tl0;
  sim.orden.forEach(mv=>{
    const cil=mv[0], dir=mv[1]==='+'?1:-1;
    const d=dir>0?sim.T[cil].p:sim.T[cil].n;
    const dt=(d&&isFinite(d.t)&&d.t>0)?d.t:0.4;
    ev.push({tipo:'mov',cil,dir,g:0,t0:t,t1:t+dt});t+=dt;
  });
  ev.push({tipo:'paro',t0:t,t1:t+T_PARO});t+=T_PARO;
  return {ok:false,ev,total:t,orden:sim.orden,sim};
}
function estadoEn(sc,tl,tau){
  const pos={};sc.cils.forEach(c=>{pos[c.id]=0;});
  let linea=-1,lineaObj=-1,llen=1,fase='linea',hechos=0;
  for(const e of tl.ev){
    if(tau>=e.t1){
      if(e.tipo==='mov'){pos[e.cil]=e.dir>0?1:0;hechos++;}
      else if(e.tipo==='linea'){linea=e.g;lineaObj=e.g;llen=1;}
      continue;
    }
    const f=Math.max(0,Math.min(1,(tau-e.t0)/Math.max(e.t1-e.t0,1e-9)));
    if(e.tipo==='mov'){pos[e.cil]=e.dir>0?f:1-f;fase='mov';}
    else if(e.tipo==='linea'){linea=-1;lineaObj=e.g;llen=f;fase='linea';}
    else{fase='paro';}
    break;
  }
  return {pos,linea,lineaObj,llen,fase,hechos};
}

// ===================== 3. ESTADO =====================
const ANIM_CICLO=7.0;   // el banco conserva las PROPORCIONES del ciclo, no cronometra
let mode='reparto';
let rpIdx=2, rpCortes=[];
let mnIdx=0, mnCambio='a1';
let rtIdx=3, rtDiam=32;
let retoK=0, retoCh=null;
let retoChecked=false, retoOkCortes=false, retoOkCambio=false, retoOkDiam=false, retoSolved=false, retoMsg='';
let solved=false, autoRunning=false, QUIZ={};
let animT=0;

function pickIdx(n,ex){if(n<=1)return 0;let i=ex;while(i===ex)i=Math.floor(Math.random()*n);return i;}
function hexA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}

function startCfg(sc){
  const g=GOOD(sc);
  return {cortes:[],cambio:fcOpts(sc).find(k=>k!==g.cambio),diam:DIAMS[0]};
}
const retoSc=()=>POOL[retoK];
const retoCfg=()=>({cortes:retoCh.cortes.slice(),cambio:retoCh.cambio,diam:retoCh.diam});
function seedReto(k){
  retoK=(k==null)?pickIdx(POOL.length,retoK):k;
  retoCh=startCfg(retoSc());
  retoChecked=false;retoOkCortes=false;retoOkCambio=false;retoOkDiam=false;retoSolved=false;retoMsg='';
}
seedReto(0);

function curSc(){
  if(mode==='reparto')return POOL[rpIdx];
  if(mode==='mando')return POOL[mnIdx];
  if(mode==='ritmo')return POOL[rtIdx];
  return retoSc();
}
/* En cada modo de exploración se aísla UN eje: los otros dos se mantienen en
   valores válidos para que lo que se observe sea consecuencia del eje que se
   toca. En «reparto» la señal de cambio se DERIVA del reparto elegido (es la
   única coherente con él), no se copia de la solución. */
function curCfg(){
  const sc=curSc(), g=GOOD(sc);
  if(mode==='reparto'){
    const gs=grupos(sc.seq,rpCortes);
    return {cortes:rpCortes.slice(),cambio:fcDe(sc.seq[gs[0][gs[0].length-1]]),diam:g.diam};
  }
  if(mode==='mando')return {cortes:g.cortes.slice(),cambio:mnCambio,diam:g.diam};
  if(mode==='ritmo')return {cortes:g.cortes.slice(),cambio:g.cambio,diam:rtDiam};
  return retoCfg();
}
const curEval=()=>evalCfg(curSc(),curCfg());
const curCiclo=()=>ciclo(curSc(),curCfg());

let _tlKey='',_tl=null;
function curTL(){
  const sc=curSc(), cfg=curCfg();
  const k=sc.id+'|'+cfg.cortes.join(',')+'|'+cfg.cambio+'|'+cfg.diam;
  if(k!==_tlKey){_tlKey=k;_tl=timeline(sc,cfg);animT=Math.min(animT,_tl.total-1e-6);}
  return _tl;
}

const CRIT=[
  {k:'okSep',rot:'Sin repetir cilindro',det:'Ningún cilindro se mueve dos veces dentro del mismo grupo: si se repite, su memoria biestable recibe las dos órdenes a la vez.'},
  {k:'okMin',rot:'Grupos mínimos',det:'El reparto usa los grupos justos. Cada grupo de más es un inversor, tiempo muerto de línea y aire de mando en cada ciclo.'},
  {k:'okCam',rot:'Señal de cambio',det:'El grupo se cierra con el final de carrera del último movimiento de ese grupo, no con cualquier otro.'},
  {k:'okFza',rot:'Fuerza disponible',det:'La relación de carga se queda por debajo de 0,70 en el caso peor (avance o retroceso).'},
  {k:'okVel',rot:'Velocidad admisible',det:'El émbolo no pasa de 1,00 m/s: la amortiguación estándar no absorbe más.'},
  {k:'okRit',rot:'Ritmo de producción',det:'El ciclo completo entrega los ciclos por hora que pide la línea.'},
];

// ===================== 4. MATERIALES =====================
function std(color,rough,metal){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function brush(base){return std(base,0.55,0.35);}
const MAT={
  bench:brush(0x2b2f34), frame:brush(0x22262c), leg:brush(0x14161b),
  barrel:std(0x9aa4b2,0.35,0.75), rod:std(0xd6dde8,0.22,0.9), tapa:std(0x6f7885,0.4,0.7),
  valve:std(0x14171b,0.5,0.3), valve2:std(0x1a1f26,0.5,0.3), plate:brush(0x3a4048),
  spool:std(0xb9c3d1,0.3,0.85), carga:std(0x3a2f24,0.7,0.15), post:brush(0x2a3038),
  tuboP:std(0x8f97a5,0.45,0.5), tuboA:std(0x4a90d9,0.4,0.4), tuboB:std(0xC08CF8,0.4,0.4),
  knob:std(0xE9C46A,0.45,0.35),
};
const AZUL='#8AB4F8', OK_HEX='#7CD992', BAD_HEX='#ff6b6b', WARN_HEX='#E9C46A', VIO='#C08CF8', GRIS='#8f97a5';
const GCOL=['#8AB4F8','#7CD992','#E9C46A','#C08CF8','#4FC3B0'];

const HOVER_LABELS=new Map();
function addHoverLabel(obj,text,color,pos,scale){
  const cv=document.createElement('canvas');cv.width=256;cv.height=64;
  const c=cv.getContext('2d');
  c.fillStyle='rgba(8,10,14,0.86)';c.fillRect(0,0,256,64);
  c.strokeStyle=color||AZUL;c.lineWidth=2;c.strokeRect(1,1,254,62);
  c.fillStyle=color||'#F4EFEA';c.font='bold 22px Outfit, sans-serif';c.textAlign='center';c.textBaseline='middle';
  c.fillText(text,128,32);
  const tex=new THREE.CanvasTexture(cv);
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false,transparent:true}));
  spr.scale.set(scale||0.62,(scale||0.62)/4,1);
  spr.position.set(pos[0],pos[1],pos[2]);
  spr.renderOrder=999;spr.visible=false;
  scene.add(spr);HOVER_LABELS.set(obj,spr);
}

// ===================== 5. PIZARRÓN =====================
const boardG=new THREE.Group();
boardG.position.set(-1.55,0,-0.95);boardG.rotation.y=0.24;scene.add(boardG);
const frame=roundedBox(3.9,2.9,0.12,MAT.frame,0.06);frame.position.set(0,1.9,0);boardG.add(frame);
[-1.65,1.65].forEach(x=>{const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,1.9,16),MAT.leg);leg.position.set(x,0.92,0);boardG.add(leg);});
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.68,2.72),new THREE.MeshBasicMaterial({map:bTex}));
board.position.set(0,1.9,0.065);boardG.add(board);

function bg(c){c.fillStyle='#0c1016';c.fillRect(0,0,1024,768);}
function wrapText(c,text,x,y,maxW,lh){
  const words=String(text).split(' ');let line='',yy=y;
  for(const wd of words){
    const test=line?line+' '+wd:wd;
    if(c.measureText(test).width>maxW&&line){c.fillText(line,x,yy);line=wd;yy+=lh;}
    else line=test;
  }
  if(line)c.fillText(line,x,yy);
  return yy;
}
function rpanel(c,x,y,w,h,title){
  c.fillStyle='rgba(255,255,255,0.035)';c.fillRect(x,y,w,h);
  c.strokeStyle='rgba(255,255,255,0.13)';c.lineWidth=1;c.strokeRect(x+0.5,y+0.5,w-1,h-1);
  c.fillStyle=AZUL;c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.textBaseline='alphabetic';
  c.fillText(title,x+16,y+26);
}
function prow(c,x,y,w,l,v,col){
  c.fillStyle=GRIS;c.font='13px Outfit, sans-serif';c.textAlign='left';c.textBaseline='middle';
  c.fillText(l,x+16,y);
  c.fillStyle=col||'#F4EFEA';c.font='bold 15px Outfit, sans-serif';c.textAlign='right';
  c.fillText(v,x+w-14,y);
}
function title2(c,t,sub){
  c.fillStyle='#F4EFEA';c.font='bold 26px Outfit, sans-serif';c.textAlign='left';c.textBaseline='alphabetic';
  c.fillText(t,30,54);
  c.fillStyle=GRIS;c.font='14px Outfit, sans-serif';
  wrapText(c,sub,30,80,660,20);
}
function nota(c,y,txt,col){
  c.fillStyle=hexA(col||WARN_HEX,0.10);c.fillRect(30,y,650,78);
  c.strokeStyle=hexA(col||WARN_HEX,0.45);c.lineWidth=1;c.strokeRect(30.5,y+0.5,649,77);
  c.fillStyle=col||WARN_HEX;c.font='13px Outfit, sans-serif';c.textAlign='left';c.textBaseline='alphabetic';
  wrapText(c,txt,46,y+24,618,19);
}
const PX={x:706,y:70,w:300};
function hbar(c,x,y,w,h,frac,col){
  c.fillStyle='rgba(255,255,255,0.07)';c.fillRect(x,y,w,h);
  c.fillStyle=col;c.fillRect(x,y,w*Math.max(0,Math.min(1,frac)),h);
  c.strokeStyle='rgba(255,255,255,0.16)';c.lineWidth=1;c.strokeRect(x+0.5,y+0.5,w-1,h-1);
}
function marca(c,x,y,w,h,frac,col,txt){
  const mx=x+w*Math.max(0,Math.min(1,frac));
  c.save();c.strokeStyle=col;c.lineWidth=2;c.setLineDash([4,3]);
  c.beginPath();c.moveTo(mx,y-5);c.lineTo(mx,y+h+5);c.stroke();c.restore();
  if(txt){c.fillStyle=col;c.font='11px Outfit, sans-serif';c.textAlign='center';c.textBaseline='alphabetic';c.fillText(txt,mx,y-8);}
}
function tabla(c,x,y,w,widths,rows,heads){
  const rh=28;
  c.fillStyle=hexA(AZUL,0.10);c.fillRect(x,y,w,rh);
  c.strokeStyle='rgba(255,255,255,0.12)';c.lineWidth=1;c.strokeRect(x+0.5,y+0.5,w-1,rh-1);
  c.textBaseline='middle';
  let cx=x;
  heads.forEach((hh,i)=>{c.fillStyle=AZUL;c.font='bold 12px Outfit, sans-serif';c.textAlign='center';c.fillText(hh,cx+widths[i]/2,y+rh/2);cx+=widths[i];});
  let yy=y+rh;
  rows.forEach(r=>{
    if(r.hl){c.fillStyle=hexA(OK_HEX,0.13);c.fillRect(x,yy,w,rh);}
    c.strokeStyle='rgba(255,255,255,0.08)';c.lineWidth=1;c.strokeRect(x+0.5,yy+0.5,w-1,rh-1);
    let xx=x;
    r.c.forEach((cell,i)=>{
      c.fillStyle=(r.cols&&r.cols[i])||'#F4EFEA';
      c.font=(r.hl?'bold ':'')+'12px Outfit, sans-serif';c.textAlign='center';
      c.fillText(cell,xx+widths[i]/2,yy+rh/2);xx+=widths[i];
    });
    yy+=rh;
  });
  return yy;
}
function colOk(b){return b?OK_HEX:BAD_HEX;}

// ===================== 6. SÍMBOLOS ISO 1219 =====================
function conducto(c,x1,y1,x2,y2,col,dash,lw){
  c.save();c.strokeStyle=col;c.lineWidth=lw||2;if(dash)c.setLineDash([6,5]);
  c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore();
}
function texto(c,t,x,y,col,font,align){
  c.fillStyle=col||'#F4EFEA';c.font=font||'12px Outfit, sans-serif';
  c.textAlign=align||'center';c.textBaseline='middle';c.fillText(t,x,y);
}
/* Cilindro de doble efecto con el émbolo en la posición frac (0 = dentro). */
function simbCilB(c,x,y,w,h,frac,col,nom){
  const bw=w*0.62;
  c.strokeStyle=col;c.lineWidth=2;c.strokeRect(x+0.5,y+0.5,bw,h);
  const px=x+6+(bw-12)*Math.max(0,Math.min(1,frac));
  c.fillStyle=col;c.fillRect(px-4,y+3,8,h-6);
  conducto(c,px,y+h/2,x+bw+w*0.30,y+h/2,col,false,4);
  c.fillStyle=hexA(col,0.35);c.fillRect(x+bw+w*0.30,y+h*0.18,w*0.14,h*0.64);
  c.strokeStyle=col;c.lineWidth=2;c.strokeRect(x+bw+w*0.30+0.5,y+h*0.18+0.5,w*0.14,h*0.64);
  texto(c,nom,x+bw/2,y-14,col,'bold 15px Outfit, sans-serif');
  texto(c,nom.toLowerCase()+'0',x+4,y+h+14,GRIS,'11px Outfit, sans-serif','left');
  texto(c,nom.toLowerCase()+'1',x+bw-4,y+h+14,GRIS,'11px Outfit, sans-serif','right');
}
/* Válvula 5/2 biestable: dos cuadros, pilotajes a los lados. */
function simb52(c,x,y,w,h,col,derecha){
  const bw=w/2;
  for(let i=0;i<2;i++){
    const act=(i===1)===!!derecha;
    c.fillStyle=act?hexA(OK_HEX,0.16):'rgba(255,255,255,0.03)';
    c.fillRect(x+i*bw,y,bw,h);
    c.strokeStyle=act?OK_HEX:col;c.lineWidth=act?2.5:1.5;
    c.strokeRect(x+i*bw+0.5,y+0.5,bw,h);
    c.save();c.strokeStyle=act?OK_HEX:col;c.lineWidth=1.5;
    c.beginPath();
    if(i===0){c.moveTo(x+6,y+h-6);c.lineTo(x+bw-6,y+6);c.moveTo(x+6,y+6);c.lineTo(x+bw-6,y+h-6);}
    else{c.moveTo(x+bw+6,y+6);c.lineTo(x+2*bw-6,y+6);c.moveTo(x+bw+6,y+h-6);c.lineTo(x+2*bw-6,y+h-6);}
    c.stroke();c.restore();
  }
  c.strokeStyle=col;c.lineWidth=1.5;
  c.strokeRect(x-14.5,y+h*0.25,14,h*0.5);
  c.strokeRect(x+w+0.5,y+h*0.25,14,h*0.5);
}
/* Final de carrera de rodillo (3/2 monoestable). */
function simbFC(c,x,y,s,col,on){
  c.fillStyle=on?hexA(OK_HEX,0.18):'rgba(255,255,255,0.03)';
  c.fillRect(x,y,s,s);
  c.strokeStyle=on?OK_HEX:col;c.lineWidth=on?2.5:1.5;c.strokeRect(x+0.5,y+0.5,s,s);
  c.beginPath();c.arc(x+s/2,y-6,4,0,Math.PI*2);c.stroke();
  c.beginPath();c.moveTo(x+s/2,y-2);c.lineTo(x+s/2,y);c.stroke();
}
/* Inversor de línea (válvula 4/2 pilotada) entre dos grupos. */
function simbInv(c,x,y,w,h,col,on){
  c.fillStyle=on?hexA(OK_HEX,0.14):'rgba(255,255,255,0.03)';
  c.fillRect(x,y,w,h);
  c.strokeStyle=on?OK_HEX:col;c.lineWidth=on?2.5:1.5;c.strokeRect(x+0.5,y+0.5,w,h);
  c.beginPath();c.moveTo(x+5,y+h-5);c.lineTo(x+w-5,y+5);c.stroke();
}

// ===================== 7. VISTAS DEL PIZARRÓN =====================
function chipSec(c,sc,cortes,x,y,w,marcarRepe){
  const seq=sc.seq, gs=grupos(seq,cortes);
  const sep=16;
  const cw=Math.min(78,Math.floor((w-(gs.length-1)*sep)/seq.length));
  const repe=marcarRepe?cilRepe(seq,gs):null;
  let cx=x;
  gs.forEach((g,gi)=>{
    const col=GCOL[gi%GCOL.length], gx0=cx;
    const malo=repe&&repe.g===gi+1;
    g.forEach(i=>{
      const m=seq[i];
      const cc=(malo&&m.cil===repe.cil)?BAD_HEX:col;
      c.fillStyle=hexA(cc,0.18);c.fillRect(cx,y,cw-6,42);
      c.strokeStyle=cc;c.lineWidth=2;c.strokeRect(cx+0.5,y+0.5,cw-7,41);
      texto(c,rotMov(m),cx+(cw-6)/2,y+21,'#F4EFEA','bold 19px Outfit, sans-serif');
      cx+=cw;
    });
    texto(c,'grupo '+(gi+1),(gx0+cx-6)/2,y+58,malo?BAD_HEX:col,'12px Outfit, sans-serif');
    if(gi<gs.length-1){
      c.save();c.strokeStyle=WARN_HEX;c.lineWidth=3;c.setLineDash([5,4]);
      c.beginPath();c.moveTo(cx+sep/2-3,y-10);c.lineTo(cx+sep/2-3,y+50);c.stroke();c.restore();
      cx+=sep;
    }
  });
  return y+72;
}

function drawReparto(c){
  const sc=curSc(), cfg=curCfg(), e=curEval(), cy=curCiclo(), tl=curTL();
  const gs=grupos(sc.seq,cfg.cortes), G=gs.length, repe=cilRepe(sc.seq,gs);
  title2(c,'Reparto en grupos · '+sc.nom,
    'Parte la secuencia por donde haga falta para que ningún cilindro se mueva dos veces dentro del mismo grupo. Ésa es la única regla del método cascada; todo lo demás sale de ella.');
  let y=chipSec(c,sc,cfg.cortes,30,124,650,true);
  const filas=gs.map((g,i)=>({
    c:['L'+(i+1),g.map(j=>rotMov(sc.seq[j])).join(' '),String(g.length),fcDe(sc.seq[g[g.length-1]])],
    cols:[GCOL[i%GCOL.length],(repe&&repe.g===i+1)?BAD_HEX:'#F4EFEA','#F4EFEA',WARN_HEX],
  }));
  y=tabla(c,30,y+8,650,[80,300,110,160],filas,['Línea','Movimientos del grupo','Movim.','Lo cierra']);
  const notaTxt=repe
    ? `El cilindro ${repe.cil} aparece dos veces en el grupo ${repe.g}: mientras la línea de ese grupo esté viva, su memoria biestable tiene la orden de ida Y la de vuelta a la vez. El carrete no se mueve y la máquina se queda parada ahí.`
    : (G===sc.gMin
        ? `Reparto válido y con los grupos justos: ${G} grupos, ${G-1} inversor(es). El cambio de línea cuesta ${f1(cy.tLin,3)} s por ciclo (${f1(100*cy.tLin/cy.total,1)} % del tiempo) y ${f1(cy.aireLin,3)} l ANR de aire de mando (${f1(cy.pctLin,1)} % del aire del ciclo).`
        : `Reparto válido: la máquina ejecuta la secuencia. Pero usa ${G} grupos donde bastan ${sc.gMin}, así que paga ${G-sc.gMin} inversor(es) de más, ${f1(cy.tLin,3)} s de cambio de línea por ciclo y ${f1(cy.aireLin,3)} l ANR de aire que no mueve nada.`);
  nota(c,y+14,notaTxt,repe?BAD_HEX:(G===sc.gMin?OK_HEX:WARN_HEX));
  nota(c,y+104,'Que funcione en el banco no demuestra que el reparto sea el bueno: TODO reparto sin cilindros repetidos ejecuta la secuencia. Lo que distingue al bueno es lo que cuesta cada ciclo.',AZUL);

  rpanel(c,PX.x,70,PX.w,206,'Reparto elegido');
  prow(c,PX.x,102,PX.w,'Secuencia',rotSec(sc.seq));
  prow(c,PX.x,128,PX.w,'Grupos',String(G),colOk(G===sc.gMin));
  prow(c,PX.x,154,PX.w,'Mínimo posible',String(sc.gMin),AZUL);
  prow(c,PX.x,180,PX.w,'Inversores',String(G-1));
  prow(c,PX.x,206,PX.w,'Cilindro repetido',repe?repe.cil+' en el grupo '+repe.g:'ninguno',colOk(!repe));
  prow(c,PX.x,232,PX.w,'Ejecuta la secuencia',tl.ok?'sí':'no',colOk(tl.ok));
  prow(c,PX.x,258,PX.w,'Repartos válidos',String(sc._val),GRIS);

  rpanel(c,PX.x,296,PX.w,180,'Lo que cuesta este reparto');
  prow(c,PX.x,328,PX.w,'Tiempo muerto',f1(cy.tLin,3)+' s/ciclo');
  prow(c,PX.x,354,PX.w,'Tiempo de carreras',f1(cy.tMov,3)+' s/ciclo');
  prow(c,PX.x,380,PX.w,'Ciclo',isFinite(cy.total)?f1(cy.total,3)+' s':'no cierra',colOk(tl.ok));
  prow(c,PX.x,406,PX.w,'Aire de mando',f1(cy.aireLin,3)+' l ANR');
  prow(c,PX.x,432,PX.w,'Aire total',f1(cy.aireTot,3)+' l ANR');
  prow(c,PX.x,458,PX.w,'Peso del mando',f1(cy.pctLin,1)+' %',cy.pctLin>25?WARN_HEX:'#F4EFEA');

  rpanel(c,PX.x,496,PX.w,242,'Criterios');
  CRIT.forEach((cr,i)=>{
    const ok=e[cr.k];
    c.fillStyle=colOk(ok);c.beginPath();c.arc(PX.x+22,528+i*30,6,0,Math.PI*2);c.fill();
    c.fillStyle=ok?'#F4EFEA':GRIS;c.font='13px Outfit, sans-serif';c.textAlign='left';c.textBaseline='middle';
    c.fillText(cr.rot,PX.x+38,528+i*30);
  });
}

function drawMando(c){
  const sc=curSc(), cfg=curCfg(), e=curEval(), cy=curCiclo(), tl=curTL();
  const st=estadoEn(sc,tl,animT);
  const gs=grupos(sc.seq,cfg.cortes), G=gs.length;
  const ult=sc.seq[gs[0][gs[0].length-1]];
  title2(c,'Mando en cascada · '+sc.nom,
    'Cada grupo tiene su propia línea de presión y sólo una está viva. Lo que cierra un grupo es el final de carrera de su ÚLTIMO movimiento: es lo único que garantiza que el grupo ha terminado.');

  // --- cilindros y sus válvulas ---
  const n=sc.cils.length, cw=Math.floor(650/n);
  sc.cils.forEach((cil,i)=>{
    const x=30+i*cw;
    simbCilB(c,x+8,124,cw-26,58,st.pos[cil.id],AZUL,cil.id);
    simb52(c,x+8+(cw-26)/2-52,216,104,48,GRIS,st.pos[cil.id]>0.5);
    texto(c,cil.nom,x+(cw-26)/2+8,282,GRIS,'11px Outfit, sans-serif');
    conducto(c,x+8+(cw-26)/2,196,x+8+(cw-26)/2,216,AZUL,false,2);
  });

  // --- líneas de grupo ---
  const y0=316, dy=30, x0=86, x1=560;
  for(let g=0;g<G;g++){
    const y=y0+g*dy;
    const viva=(st.linea===g), llen=(st.lineaObj===g&&st.linea<0)?st.llen:(viva?1:0);
    const col=viva?OK_HEX:(st.fase==='paro'?BAD_HEX:GRIS);
    conducto(c,x0,y,x1,y,'rgba(255,255,255,0.10)',false,5);
    if(llen>0)conducto(c,x0,y,x0+(x1-x0)*llen,y,col,false,5);
    texto(c,'L'+(g+1),x0-18,y,GCOL[g%GCOL.length],'bold 13px Outfit, sans-serif','right');
    texto(c,gs[g].map(i=>rotMov(sc.seq[i])).join(' '),x1+14,y,viva?OK_HEX:GRIS,'12px Outfit, sans-serif','left');
    if(g<G-1)simbInv(c,42,y+6,26,18,GRIS,viva);
  }
  // señal de cambio elegida, colgada del final del grupo 1
  const yS=y0-24;
  simbFC(c,x1-24,yS-20,22,cfg.cambio===fcDe(ult)?OK_HEX:BAD_HEX,true);
  texto(c,'señal de cambio: '+cfg.cambio,x1-38,yS-10,cfg.cambio===fcDe(ult)?OK_HEX:BAD_HEX,'bold 13px Outfit, sans-serif','right');
  conducto(c,x1-13,yS+2,x1-13,y0,cfg.cambio===fcDe(ult)?OK_HEX:BAD_HEX,true,2);

  // --- traza ---
  const yT=y0+G*dy+18;
  c.fillStyle='rgba(255,255,255,0.035)';c.fillRect(30,yT,650,74);
  c.strokeStyle='rgba(255,255,255,0.13)';c.lineWidth=1;c.strokeRect(30.5,yT+0.5,649,73);
  texto(c,'Pedida',46,yT+22,GRIS,'12px Outfit, sans-serif','left');
  texto(c,rotSec(sc.seq),150,yT+22,'#F4EFEA','bold 15px Outfit, sans-serif','left');
  texto(c,'Ejecutada',46,yT+52,GRIS,'12px Outfit, sans-serif','left');
  texto(c,tl.orden.length?tl.orden.join(' '):'nada',150,yT+52,tl.ok?OK_HEX:BAD_HEX,'bold 15px Outfit, sans-serif','left');

  const det=tl.ok
    ? `Con ${cfg.cambio} la cascada conmuta cuando toca: la máquina completa la secuencia en ${f1(cy.total,3)} s y vuelve al principio.`
    : porQue(sc,'cambio',cfg.cambio) || 'El mando no ejecuta la secuencia pedida.';
  nota(c,Math.min(yT+92,660),det,tl.ok?OK_HEX:BAD_HEX);

  rpanel(c,PX.x,70,PX.w,180,'Señal de cambio');
  prow(c,PX.x,102,PX.w,'Grupo 1 termina con',rotMov(ult),AZUL);
  prow(c,PX.x,128,PX.w,'Final de carrera',fcDe(ult),AZUL);
  prow(c,PX.x,154,PX.w,'Señal elegida',cfg.cambio,colOk(e.okCam));
  prow(c,PX.x,180,PX.w,'Ejecuta',tl.ok?'sí':'no',colOk(tl.ok));
  prow(c,PX.x,206,PX.w,'Bloqueo',bloqTxt(tl.sim,sc.seq),tl.ok?GRIS:BAD_HEX);
  prow(c,PX.x,232,PX.w,'Movimientos hechos',tl.orden.length+' de '+sc.seq.length,colOk(tl.orden.length===sc.seq.length));

  rpanel(c,PX.x,270,PX.w,154,'Cascada');
  prow(c,PX.x,302,PX.w,'Grupos',String(G));
  prow(c,PX.x,328,PX.w,'Inversores',String(G-1));
  prow(c,PX.x,354,PX.w,'Línea viva',st.linea>=0?'L'+(st.linea+1):'conmutando');
  prow(c,PX.x,380,PX.w,'Llenado de línea',f1(100*st.llen,0)+' %');
  prow(c,PX.x,406,PX.w,'Tubo de mando',f1(sc.manL,0)+' m · Ø'+f1(D_MAN,1)+' mm',GRIS);

  rpanel(c,PX.x,444,PX.w,128,'Ciclo');
  prow(c,PX.x,476,PX.w,'Carreras',f1(cy.tMov,3)+' s');
  prow(c,PX.x,502,PX.w,'Cambios de línea',f1(cy.tLin,3)+' s');
  prow(c,PX.x,528,PX.w,'Total',isFinite(cy.total)?f1(cy.total,3)+' s':'no cierra',colOk(tl.ok));
  prow(c,PX.x,554,PX.w,'Ritmo',f1(cy.ciclosH,0)+' ciclos/h',colOk(e.okRit));

  rpanel(c,PX.x,592,PX.w,146,'Señales disponibles');
  const opts=fcOpts(sc);
  opts.forEach((o,i)=>{
    const bien=(o===fcDe(ult));
    c.fillStyle=o===cfg.cambio?hexA(bien?OK_HEX:BAD_HEX,0.20):'rgba(255,255,255,0.04)';
    const bx=PX.x+16+(i%3)*92, by=624+Math.floor(i/3)*40;
    c.fillRect(bx,by,84,30);
    c.strokeStyle=o===cfg.cambio?(bien?OK_HEX:BAD_HEX):'rgba(255,255,255,0.14)';c.lineWidth=1.5;
    c.strokeRect(bx+0.5,by+0.5,84,30);
    texto(c,o,bx+42,by+15,o===cfg.cambio?'#F4EFEA':GRIS,'bold 14px Outfit, sans-serif');
  });
}

function drawRitmo(c){
  const sc=curSc(), cfg=curCfg(), e=curEval(), cy=curCiclo();
  const cil=cilProt(sc);
  title2(c,'Ritmo y dimensionado · '+sc.nom,
    'El cilindro crítico es '+cil.nom.toLowerCase()+' ('+cil.id+'). Subir el diámetro da fuerza y baja la velocidad de impacto, pero mueve más aire: a partir de cierto punto el ciclo se ALARGA. El diámetro bueno es el menor que cumple las tres cosas.');

  const bx=30, bw=650;
  c.fillStyle=GRIS;c.font='13px Outfit, sans-serif';c.textAlign='left';c.textBaseline='alphabetic';
  c.fillText('Relación de carga (peor de avance y retroceso)',bx,128);
  hbar(c,bx,138,bw,22,e.cargaMax/1.2,colOk(e.okFza));
  marca(c,bx,138,bw,22,CARGA_MAX/1.2,WARN_HEX,'máx '+f1(CARGA_MAX,2));
  texto(c,f1(e.cargaMax,3),bx+bw-40,149,'#0c1016','bold 13px Outfit, sans-serif');

  c.fillStyle=GRIS;c.font='13px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Velocidad máxima del émbolo',bx,196);
  hbar(c,bx,206,bw,22,e.velMax/1.6,colOk(e.okVel));
  marca(c,bx,206,bw,22,V_MAX/1.6,WARN_HEX,'máx '+f1(V_MAX,2)+' m/s');
  texto(c,f1(e.velMax,3)+' m/s',bx+bw-52,217,'#0c1016','bold 13px Outfit, sans-serif');

  c.fillStyle=GRIS;c.font='13px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Ritmo conseguido',bx,264);
  const rMax=Math.max(sc.ritmo*1.4,cy.ciclosH*1.1,1);
  hbar(c,bx,274,bw,22,cy.ciclosH/rMax,colOk(e.okRit));
  marca(c,bx,274,bw,22,sc.ritmo/rMax,WARN_HEX,'pide '+f1(sc.ritmo,0)+'/h');
  texto(c,f1(cy.ciclosH,0)+' ciclos/h',bx+bw-64,285,'#0c1016','bold 13px Outfit, sans-serif');

  // reparto del ciclo
  const fMov=isFinite(cy.total)&&cy.total>0?cy.tMov/cy.total:0;
  c.fillStyle=GRIS;c.font='13px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Reparto del ciclo: carreras frente a cambios de línea',bx,332);
  c.fillStyle=hexA(AZUL,0.75);c.fillRect(bx,342,bw*fMov,20);
  c.fillStyle=hexA(WARN_HEX,0.75);c.fillRect(bx+bw*fMov,342,bw*(1-fMov),20);
  c.strokeStyle='rgba(255,255,255,0.16)';c.lineWidth=1;c.strokeRect(bx+0.5,342.5,bw-1,19);
  texto(c,'carreras '+f1(cy.tMov,3)+' s',bx+bw*fMov/2,352,'#0c1016','bold 12px Outfit, sans-serif');
  if(1-fMov>0.12)texto(c,'línea '+f1(cy.tLin,3)+' s',bx+bw*(fMov+(1-fMov)/2),352,'#0c1016','bold 12px Outfit, sans-serif');

  const filas=DIAMS.map(D=>{
    const ee=evalCfg(sc,{cortes:cfg.cortes,cambio:cfg.cambio,diam:D});
    const cc=ciclo(sc,{cortes:cfg.cortes,cambio:cfg.cambio,diam:D});
    return {c:['Ø'+D,f1(ee.cargaMax,3),f1(ee.velMax,3),isFinite(cc.total)?f1(cc.total,3):'—',f1(cc.ciclosH,0),f1(cc.aireTot,3)],
            cols:[AZUL,colOk(ee.okFza),colOk(ee.okVel),'#F4EFEA',colOk(ee.okRit),'#F4EFEA'],
            hl:D===cfg.diam};
  });
  tabla(c,30,382,650,[80,110,110,110,120,120],filas,['Ø mm','carga','v m/s','ciclo s','ciclos/h','aire l']);

  const okd=DIAMS.filter(D=>evalCfg(sc,{cortes:cfg.cortes,cambio:cfg.cambio,diam:D}).vale);
  const rMejor=DIAMS.reduce((a,D)=>{const cc=ciclo(sc,{cortes:cfg.cortes,cambio:cfg.cambio,diam:D});return cc.ciclosH>a.r?{D,r:cc.ciclosH}:a;},{D:0,r:-1});
  nota(c,608,`El ritmo NO crece con el diámetro: aquí el más rápido es el Ø${rMejor.D} con ${f1(rMejor.r,0)} ciclos/h, y el mayor de todos (Ø${DIAMS[DIAMS.length-1]}) mueve tanto aire que se queda en ${f1(ciclo(sc,{cortes:cfg.cortes,cambio:cfg.cambio,diam:DIAMS[DIAMS.length-1]}).ciclosH,0)}/h. Cumplen ${okd.length} de ${DIAMS.length} diámetros y se monta el menor de ellos.`,AZUL);

  rpanel(c,PX.x,70,PX.w,232,'Cilindro crítico · '+cil.id);
  prow(c,PX.x,102,PX.w,'Diámetro',' Ø'+cfg.diam+' mm',AZUL);
  prow(c,PX.x,128,PX.w,'Vástago ISO 15552','Ø'+CIL_ISO[cfg.diam]+' mm',GRIS);
  prow(c,PX.x,154,PX.w,'Área del émbolo',f1(areaEmb(cfg.diam),3)+' cm²');
  prow(c,PX.x,180,PX.w,'Área anular',f1(areaAnu(cfg.diam),3)+' cm²');
  prow(c,PX.x,206,PX.w,'Carrera',f1(cil.s,0)+' mm',GRIS);
  prow(c,PX.x,232,PX.w,'Fuerza de avance',f1(cil.Fe,0)+' N',GRIS);
  prow(c,PX.x,258,PX.w,'Fuerza de retroceso',f1(cil.Fr,0)+' N',GRIS);
  prow(c,PX.x,284,PX.w,'Rendimiento',f1(100*RENDIM,0)+' %',GRIS);

  rpanel(c,PX.x,322,PX.w,180,'Comportamiento');
  prow(c,PX.x,354,PX.w,'p avance',f1(e.de.p,3)+' bar');
  prow(c,PX.x,380,PX.w,'p retroceso',f1(e.dr.p,3)+' bar');
  prow(c,PX.x,406,PX.w,'Relación de carga',f1(e.cargaMax,3),colOk(e.okFza));
  prow(c,PX.x,432,PX.w,'Velocidad máx',f1(e.velMax,3)+' m/s',colOk(e.okVel));
  prow(c,PX.x,458,PX.w,'Ciclo',isFinite(cy.total)?f1(cy.total,3)+' s':'no cierra');
  prow(c,PX.x,484,PX.w,'Ritmo',f1(cy.ciclosH,0)+' / '+f1(sc.ritmo,0)+' ciclos/h',colOk(e.okRit));

  rpanel(c,PX.x,522,PX.w,216,'Aire y energía');
  prow(c,PX.x,554,PX.w,'Aire de cilindros',f1(cy.aireCil,3)+' l ANR');
  prow(c,PX.x,580,PX.w,'Aire de mando',f1(cy.aireLin,3)+' l ANR');
  prow(c,PX.x,606,PX.w,'Aire por ciclo',f1(cy.aireTot,3)+' l ANR');
  prow(c,PX.x,632,PX.w,'Peso del mando',f1(cy.pctLin,1)+' %');
  prow(c,PX.x,658,PX.w,'Consumo',f1(cy.aireH,1)+' m³/h');
  prow(c,PX.x,684,PX.w,'Energía',f1(cy.kwhH,2)+' kWh/h');
  prow(c,PX.x,710,PX.w,'Válvula',f1(sc.qn,0)+' l/min · C='+f1(cDeQn(sc.qn),3),GRIS);
}

function drawReto(c){
  const sc=retoSc(), cfg=retoCfg(), e=evalCfg(sc,cfg), cy=ciclo(sc,cfg), tl=curTL();
  const gs=grupos(sc.seq,cfg.cortes), G=gs.length;
  title2(c,'Reto · proyecta el mando de '+sc.nom,
    'Tres decisiones encadenadas: cómo se parte la secuencia, qué señal cierra el primer grupo y con qué diámetro se monta el cilindro crítico. Se califican por separado.');

  c.fillStyle=hexA(VIO,0.10);c.fillRect(30,110,650,92);
  c.strokeStyle=hexA(VIO,0.45);c.lineWidth=1;c.strokeRect(30.5,110.5,649,91);
  c.fillStyle=VIO;c.font='bold 13px Outfit, sans-serif';c.textAlign='left';c.textBaseline='alphabetic';
  c.fillText('Pliego de condiciones',46,134);
  c.fillStyle='#F4EFEA';c.font='13px Outfit, sans-serif';
  wrapText(c,`${rotSec(sc.seq)} · ${sc.proc}. Red ${f1(sc.pRed,0)} bar, válvulas de ${f1(sc.qn,0)} l/min, ${f1(sc.manL,0)} m de tubo de mando. La línea pide ${f1(sc.ritmo,0)} ciclos/h.`,46,158,618,19);

  chipSec(c,sc,cfg.cortes,30,224,650,true);

  const cy0=372;
  c.fillStyle='rgba(255,255,255,0.035)';c.fillRect(30,cy0,650,132);
  c.strokeStyle='rgba(255,255,255,0.13)';c.lineWidth=1;c.strokeRect(30.5,cy0+0.5,649,131);
  CRIT.forEach((cr,i)=>{
    const col=i%2, row=Math.floor(i/2);
    const x=46+col*326, y=cy0+30+row*30;
    const ok=e[cr.k];
    c.fillStyle=colOk(ok);c.beginPath();c.arc(x+7,y-5,6,0,Math.PI*2);c.fill();
    c.fillStyle=ok?'#F4EFEA':GRIS;c.font='13px Outfit, sans-serif';c.textAlign='left';c.textBaseline='alphabetic';
    c.fillText(cr.rot,x+24,y);
  });
  c.fillStyle=retoChecked?colOk(retoSolved):GRIS;c.font='bold 15px Outfit, sans-serif';c.textAlign='right';
  c.fillText(retoChecked?(retoSolved?'PROYECTO ACEPTADO':'PROYECTO RECHAZADO'):'sin comprobar',664,cy0+120);

  const dx=retoChecked?EJES.map(ej=>porQue(sc,ej,cfg[ej])).filter(Boolean):[];
  c.fillStyle='rgba(255,255,255,0.035)';c.fillRect(30,518,650,220);
  c.strokeStyle='rgba(255,255,255,0.13)';c.lineWidth=1;c.strokeRect(30.5,518.5,649,219);
  c.fillStyle=AZUL;c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.textBaseline='alphabetic';
  c.fillText('Informe de la revisión',46,544);
  c.font='13px Outfit, sans-serif';
  if(!retoChecked){
    c.fillStyle=GRIS;
    wrapText(c,'Elige el reparto, la señal de cambio y el diámetro y pulsa «Comprobar». El informe sale después de la revisión, no antes.',46,570,618,19);
  }else if(!dx.length){
    c.fillStyle=OK_HEX;
    wrapText(c,`Los tres ejes correctos: ${G} grupos (${rotCortes(sc,cfg.cortes)}), cambio con ${cfg.cambio} y Ø${cfg.diam} mm. Ciclo ${f1(cy.total,3)} s → ${f1(cy.ciclosH,0)} ciclos/h con ${f1(cy.aireTot,3)} l ANR por ciclo.`,46,570,618,19);
  }else{
    let yy=570;
    dx.forEach(t=>{
      c.fillStyle=BAD_HEX;c.beginPath();c.arc(52,yy-5,4,0,Math.PI*2);c.fill();
      c.fillStyle='#F4EFEA';
      yy=wrapText(c,t,66,yy,598,19)+30;
    });
  }

  const ejeP=(y,tit,val,okv,det)=>{
    rpanel(c,PX.x,y,PX.w,146,tit);
    prow(c,PX.x,y+32,PX.w,'Elegido',val,okv?OK_HEX:(retoChecked?BAD_HEX:GRIS));
    prow(c,PX.x,y+58,PX.w,'Estado',retoChecked?(okv?'correcto':'incorrecto'):'sin comprobar',retoChecked?colOk(okv):GRIS);
    c.fillStyle=GRIS;c.font='12px Outfit, sans-serif';c.textAlign='left';c.textBaseline='alphabetic';
    wrapText(c,det,PX.x+16,y+84,PX.w-32,16);
  };
  ejeP(70,'Eje 1 · Reparto en grupos',G+' grupos',retoOkCortes,'Ningún cilindro puede repetirse dentro de un grupo, y sobran los grupos que no hagan falta.');
  ejeP(228,'Eje 2 · Señal de cambio',cfg.cambio,retoOkCambio,'La cierra el final de carrera del último movimiento del grupo 1.');
  ejeP(386,'Eje 3 · Diámetro del crítico','Ø'+cfg.diam+' mm',retoOkDiam,'El menor que aguante la carga, no pase de 1,00 m/s y dé el ritmo pedido.');

  rpanel(c,PX.x,544,PX.w,194,'Números del montaje propuesto');
  prow(c,PX.x,574,PX.w,'Inversores',String(G-1));
  prow(c,PX.x,600,PX.w,'Ejecuta la secuencia',tl.ok?'sí':'no',colOk(tl.ok));
  prow(c,PX.x,626,PX.w,'Ciclo',isFinite(cy.total)?f1(cy.total,3)+' s':'no cierra');
  prow(c,PX.x,652,PX.w,'Ritmo',f1(cy.ciclosH,0)+' / '+f1(sc.ritmo,0)+' /h',colOk(e.okRit));
  prow(c,PX.x,678,PX.w,'Relación de carga',f1(e.cargaMax,3),colOk(e.okFza));
  prow(c,PX.x,704,PX.w,'Velocidad máx',f1(e.velMax,3)+' m/s',colOk(e.okVel));
  prow(c,PX.x,730,PX.w,'Aire por ciclo',f1(cy.aireTot,3)+' l ANR');
}

function drawBoard(){
  const c=bCv.getContext('2d');bg(c);
  if(mode==='mando')drawMando(c);
  else if(mode==='ritmo')drawRitmo(c);
  else if(mode==='reto')drawReto(c);
  else drawReparto(c);
  bTex.needsUpdate=true;
}
function boardClick(){
  if(mode==='reparto')showToast('<b>Reparto en grupos</b><br>La única regla: dentro de un grupo ningún cilindro se repite. El número de grupos lo fija el entrelazado de la secuencia, no cuántos cilindros haya.');
  else if(mode==='mando')showToast('<b>Mando en cascada</b><br>Sólo una línea está viva. El inversor conmuta cuando llega la señal del último movimiento del grupo, y con ella muere el grupo anterior: por eso las órdenes viejas no estorban.');
  else if(mode==='ritmo')showToast('<b>Ritmo y dimensionado</b><br>Fuerza, velocidad y ritmo tiran en direcciones distintas. Se monta el MENOR diámetro que cumpla los tres, no el más grande.');
  else showToast('<b>Reto</b><br>Reparto, señal de cambio y diámetro se califican por separado: puedes acertar dos y fallar uno.');
}

// ===================== 8. BANCO 3D =====================
const bench=roundedBox(4.8,0.5,2.1,MAT.bench,0.05);bench.position.set(1.95,0.25,0.55);scene.add(bench);
[[-0.25,-0.30],[4.15,-0.30],[-0.25,1.40],[4.15,1.40]].forEach(p=>{
  const l=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.5,12),MAT.leg);
  l.position.set(p[0],0.25,p[1]);scene.add(l);
});
/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde
   ya importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={
  aluminio: std(0x717981,0.60,0.45), acero: std(0x828a91,0.42,0.75),
  cromo: std(0xa9b1b6,0.26,0.88),    chapa: std(0x6f777e,0.50,0.65),
  cobre: std(0xb87333,0.35,0.75),    negro: std(0x14181e,0.62,0.06),
  goma: std(0x101418,0.92,0.02),     blanco: std(0xd7dee6,0.42,0.15),
  rojo: std(0xd64545,0.50,0.10),     ceramica: std(0xd9dcd6,0.62,0.04),
};

const GEO_CIL=new THREE.CylinderGeometry(1,1,1,28);
const GEO_TUB=new THREE.CylinderGeometry(1,1,1,14);
const _vA=new THREE.Vector3(),_vB=new THREE.Vector3(),_vD=new THREE.Vector3(),_up=new THREE.Vector3(0,1,0);
function tuboAB(mat){const m=new THREE.Mesh(GEO_TUB,mat);scene.add(m);return m;}
function setTuboAB(m,a,b,r){
  _vA.set(a[0],a[1],a[2]);_vB.set(b[0],b[1],b[2]);_vD.copy(_vB).sub(_vA);
  const L=_vD.length();
  m.position.copy(_vA).addScaledVector(_vD,0.5);
  m.scale.set(r,Math.max(L,0.001),r);
  m.quaternion.setFromUnitVectors(_up,_vD.normalize());
}
const CILZ=[0.00,0.58,1.16];
const EST=CILZ.map((z,i)=>{
  const g=new THREE.Group();g.position.set(0,0,z);scene.add(g);
  const soporte=roundedBox(0.14,0.34,0.36,MAT.post,0.03);soporte.position.set(0.58,0.67,0);g.add(soporte);
  const carga=roundedBox(0.22,0.28,0.34,MAT.carga,0.03);g.add(carga);
  const fc0=new THREE.Mesh(new THREE.SphereGeometry(0.036,14,10),std(0x8f97a5,0.35,0.2));fc0.position.set(0.66,0.86,0);g.add(fc0);
  const fc1=new THREE.Mesh(new THREE.SphereGeometry(0.036,14,10),std(0x8f97a5,0.35,0.2));fc1.position.set(1.90,0.86,0);g.add(fc1);
  /* LA MEMORIA 5/2 ES UNA VÁLVULA PILOTADA POR AIRE, no un taco: cuerpo de
     corredera sobre su base de placa —se cambia sin tocar la tubería—, sus
     cinco tomas por debajo y, en los extremos, las TAPAS DE PILOTAJE con su
     racor. No lleva bobinas a propósito: lo que la conmuta es la línea de
     presión del grupo, y ponerle solenoides diría que el mando es eléctrico. */
  const val=P3.valvulaDireccional(MATP,{ancho:0.34,alto:0.115,fondo:0.20,
    vias:5,solenoides:0,pilotos:2,base:true});
  val.position.set(0.16,0.70,0);g.add(val);
  const spool=roundedBox(0.11,0.05,0.05,MAT.spool,0.02);spool.position.set(0.06,0.775,0.11);g.add(spool);
  const tA=tuboAB(MAT.tuboA), tB=tuboAB(MAT.tuboB);
  return {g,z,carga,fc0,fc1,val,spool,tA,tB,soporte,cil:null,cilD:-1,cilCar:-1};
});

/* EL CILINDRO SE RECONSTRUYE, no se estira. Un cilindro de tirantes no se puede
   escalar a lo largo sin deformarle las tapas, así que se vuelve a armar sólo
   cuando cambia el diámetro o la carrera —al tocar la configuración, no en cada
   fotograma—. Y el vástago se coloca en `carrera·(p−1)`: así en p = 0 asoma
   sólo lo que sobresale de la tapa (el cilindro está DENTRO, que es lo que dice
   el final de carrera de retroceso) y en p = 1 ha hecho la carrera entera. */
const X_CULATA=0.62;
function ponCilindro(E,dC,vas,car){
  if(E.cilD===dC && E.cilCar===car) return;
  E.cilD=dC; E.cilCar=car;
  if(E.cil){ E.g.remove(E.cil); E.cil.traverse(o=>{ if(o.isMesh) o.geometry.dispose(); }); }
  const c=P3.cilindroHidraulico(MATP,{d:dC,carrera:car,vastago:vas,
    tirantes:4,horquilla:false,tomas:true});
  c.rotation.z=-Math.PI/2;                       // el +Y de la pieza es el +X del banco
  c.position.set(X_CULATA+(car+dC*0.85)/2, 0.72, 0);
  c.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  E.g.add(c); E.cil=c;
}
/* La punta del vástago, en x del banco, para colgar de ella la carga y el final
   de carrera. Sale de la propia geometría de la pieza, no de una cifra a mano. */
const puntaCil=(dC,car,p)=>X_CULATA+car+1.17*dC+car*p;

// panel de la cascada
const panelG=new THREE.Group();panelG.position.set(3.55,0,0.55);scene.add(panelG);
const placaP=roundedBox(0.10,1.42,1.72,MAT.plate,0.03);placaP.position.set(0,1.24,0);panelG.add(placaP);
/* Las cinco LÍNEAS DE PRESIÓN y sus inversores van en la cara de la placa que
   MIRA AL BANCO. Estaban en la de atrás: desde la cámara de entrada, el panel
   entero —que es donde se ve cuál es la línea viva, o sea el corazón del método
   cascada— era una plancha negra y lisa. */
const LIN=[0,1,2,3,4].map(i=>{
  const m=new THREE.Mesh(GEO_TUB,std(0x8f97a5,0.45,0.5));
  m.rotation.x=Math.PI/2;
  m.position.set(0.09,0.72+i*0.23,0);
  m.scale.set(0.030,1.52,0.030);
  panelG.add(m);return m;
});
const INV=[0,1,2,3].map(i=>{
  const b=roundedBox(0.16,0.17,0.22,MAT.valve2,0.02);
  b.position.set(0.16,0.835+i*0.23,-0.66);panelG.add(b);return b;
});
const alim=roundedBox(0.20,0.20,0.26,MAT.knob,0.03);alim.position.set(0.16,0.50,0.72);panelG.add(alim);
/* LA PLACA ROTULADA. Cinco tubos iguales no dicen cual es cual, y todo el metodo
   cascada consiste en saber que linea esta viva: sin los rotulos hay que
   contar de abajo arriba cada vez. Las alturas salen de la misma formula que
   coloca los tubos, no de una tabla escrita a mano. */
const rCv=document.createElement('canvas');rCv.width=512;rCv.height=424;
const rTex=new THREE.CanvasTexture(rCv);rTex.colorSpace=THREE.SRGBColorSpace;
rTex.minFilter=THREE.LinearFilter;rTex.generateMipmaps=false;
(function dibujaRotulos(){
  const c=rCv.getContext('2d'),W=rCv.width,H=rCv.height;
  c.fillStyle='#22262c';c.fillRect(0,0,W,H);
  c.fillStyle='#8f97a5';c.font='bold 26px Outfit, sans-serif';c.textBaseline='middle';
  c.textAlign='left';c.fillText('LÍNEAS DE PRESIÓN · CASCADA',26,34);
  c.strokeStyle='#3a4048';c.lineWidth=2;
  c.beginPath();c.moveTo(24,54);c.lineTo(W-24,54);c.stroke();
  for(let i=0;i<5;i++){
    const y=0.72+i*0.23;                       // la misma cota que el tubo i
    const py=(1.95-y)/1.42*H;
    c.fillStyle=GCOL[i];c.font='bold 30px Outfit, sans-serif';c.textAlign='right';
    c.fillText('L'+(i+1),44,py);
    c.strokeStyle='#2f353c';c.lineWidth=1.5;
    c.beginPath();c.moveTo(54,py);c.lineTo(W-26,py);c.stroke();
  }
  rTex.needsUpdate=true;
})();
const rotulos=new THREE.Mesh(new THREE.PlaneGeometry(1.72,1.42),
  new THREE.MeshBasicMaterial({map:rTex,toneMapped:false}));
rotulos.rotation.y=Math.PI/2;rotulos.position.set(0.053,1.24,0);
rotulos.raycast=()=>{};panelG.add(rotulos);

function makeLED(x,color){
  const m=new THREE.Mesh(new THREE.SphereGeometry(0.042,16,12),std(color,0.3,0.1));
  m.material.emissive=new THREE.Color(color);m.material.emissiveIntensity=0.1;
  m.position.set(x,0.53,-0.24);scene.add(m);return m;
}
const LEDS=CRIT.map((cr,i)=>makeLED(0.66+i*0.26));

// placa de datos
const pCv=document.createElement('canvas');pCv.width=256;pCv.height=160;
const pTex=new THREE.CanvasTexture(pCv);
const placa=new THREE.Mesh(new THREE.PlaneGeometry(0.66,0.41),new THREE.MeshBasicMaterial({map:pTex}));
placa.position.set(3.52,2.22,0.55);placa.lookAt(6.0,2.6,5.6);scene.add(placa);
function drawPlaca(sc,cfg,e,cy,tl){
  const c=pCv.getContext('2d');
  c.fillStyle='#0c1016';c.fillRect(0,0,256,160);
  c.strokeStyle=e.vale?OK_HEX:BAD_HEX;c.lineWidth=3;c.strokeRect(1.5,1.5,253,157);
  c.fillStyle='#F4EFEA';c.font='bold 15px Outfit, sans-serif';c.textAlign='left';c.textBaseline='alphabetic';
  c.fillText(sc.nom.length>22?sc.nom.slice(0,22)+'…':sc.nom,12,24);
  c.font='11px Outfit, sans-serif';c.fillStyle=GRIS;
  c.fillText(rotSec(sc.seq),12,42);
  const rows=[
    ['Grupos',String(grupos(sc.seq,cfg.cortes).length)+' (mín '+sc.gMin+')'],
    ['Cambio',cfg.cambio],
    ['Ø crítico',cfg.diam+' mm'],
    ['Ciclo',isFinite(cy.total)?f1(cy.total,3)+' s':'no cierra'],
    ['Ritmo',f1(cy.ciclosH,0)+' / '+f1(sc.ritmo,0)+' /h'],
    ['Aire',f1(cy.aireTot,3)+' l ANR'],
  ];
  rows.forEach((r,i)=>{
    const y=62+i*14;
    c.fillStyle=GRIS;c.font='11px Outfit, sans-serif';c.textAlign='left';c.fillText(r[0],12,y);
    c.fillStyle='#F4EFEA';c.font='bold 12px Outfit, sans-serif';c.textAlign='right';c.fillText(r[1],244,y);
  });
  c.fillStyle=tl.ok?OK_HEX:BAD_HEX;c.font='bold 13px Outfit, sans-serif';c.textAlign='right';
  c.fillText(tl.ok?'ejecuta la secuencia':(tl.sim.bloqueo?'la máquina se para':'el ciclo cierra a medias'),244,152);
  pTex.needsUpdate=true;
}

// etiquetas y picking
EST.forEach((st,i)=>{
  st.soporte.userData={title:'Cilindro '+String.fromCharCode(65+i),info:'Cilindro de doble efecto ISO 15552, de tirantes: son los cuatro tirantes los que sujetan las tapas contra la presión, y por eso este cilindro se puede desarmar. El área anular es siempre menor que la del émbolo, así que a igual presión el retroceso da menos fuerza pero se hace más rápido.'};
  st.val.userData={title:'Memoria biestable 5/2',info:'Es la memoria del cilindro: se queda en la última posición que le ordenaron. Si recibe las dos órdenes a la vez, no se mueve: eso es lo que rompe una secuencia mal repartida.'};
  st.fc0.userData={title:'Final de carrera de retroceso',info:'Confirma que el vástago está dentro. En cascada, el final de carrera del último movimiento de un grupo es la señal que conmuta la línea.'};
  st.fc1.userData={title:'Final de carrera de avance',info:'Confirma que el vástago está fuera. Sin confirmación no hay orden siguiente: la cascada encadena movimiento a movimiento.'};
  addHoverLabel(st.soporte,'Cilindro '+String.fromCharCode(65+i),AZUL,[1.25,1.18,st.z],0.62);
  addHoverLabel(st.val,'5/2 biestable',VIO,[0.16,1.02,st.z],0.58);
});
placaP.userData={title:'Panel de la cascada',info:'Una línea de presión por grupo. Sólo una está viva; las demás están a escape, y con ellas mueren todas las órdenes de sus grupos.'};
addHoverLabel(placaP,'Panel de cascada',OK_HEX,[3.55,2.05,0.55],0.72);
INV.forEach((b,i)=>{b.userData={title:'Inversor '+(i+1),info:'Cada inversor pasa la presión de una línea a la siguiente. Hacen falta tantos como grupos menos uno: por eso un grupo de más se paga en hardware.'};});
alim.userData={title:'Alimentación',info:'Aire de red tratado. Toda la cascada cuelga de aquí: si la línea de mando no llega al umbral de pilotaje, no hay orden que valga.'};
LEDS.forEach((l,i)=>{l.userData={title:'Criterio · '+CRIT[i].rot,info:CRIT[i].det};});

function updateHW(){
  const sc=curSc(), cfg=curCfg(), e=evalCfg(sc,cfg), cy=ciclo(sc,cfg), tl=curTL();
  const st=estadoEn(sc,tl,animT);
  const G=grupos(sc.seq,cfg.cortes).length;
  EST.forEach((E,i)=>{
    const cil=sc.cils[i];
    const vis=!!cil;
    E.g.visible=vis;E.tA.visible=vis;E.tB.visible=vis;
    if(!vis)return;
    const D=diamCil(sc,cfg,cil.id);
    const rB=0.055+D/1000*0.9, rR=rB*CIL_ISO[D]/D;
    const car=0.22+0.62*Math.min(1,cil.s/400);
    const p=Math.max(0,Math.min(1,st.pos[cil.id]));
    ponCilindro(E,2*rB,2*rR,car);
    E.cil.userData.vastago.position.y=car*(p-1);
    E.carga.position.set(puntaCil(2*rB,car,p)+0.13,0.72,0);
    E.fc0.position.set(X_CULATA+0.05,0.72+rB*1.55,0);
    E.fc1.position.set(puntaCil(2*rB,car,1)+0.06,0.72+rB*1.55,0);
    const on0=p<=1e-4, on1=p>=1-1e-4;
    E.fc0.material.color.set(on0?0x7CD992:0x8f97a5);
    E.fc0.material.emissive.set(on0?0x7CD992:0x000000);
    E.fc0.material.emissiveIntensity=on0?1.2:0;
    E.fc1.material.color.set(on1?0x7CD992:0x8f97a5);
    E.fc1.material.emissive.set(on1?0x7CD992:0x000000);
    E.fc1.material.emissiveIntensity=on1?1.2:0;
    E.spool.position.set(0.06+(p>0.5?0.19:0),0.775,0.11);
    setTuboAB(E.tA,[0.30,0.60,E.z+0.07],[X_CULATA+0.02,0.72,E.z+0.09],0.018);
    setTuboAB(E.tB,[0.30,0.60,E.z-0.07],[X_CULATA+car+2*rB*0.85-0.02,0.72,E.z-0.09],0.018);
  });
  LIN.forEach((m,i)=>{
    m.visible=i<G;
    if(!m.visible)return;
    const viva=(st.linea===i), llenando=(st.linea<0&&st.lineaObj===i);
    const col=viva?0x7CD992:(llenando?0xE9C46A:(st.fase==='paro'?0xff6b6b:0x8f97a5));
    m.material.color.set(col);
    m.material.emissive.set(col);
    m.material.emissiveIntensity=viva?1.1:(llenando?0.55*st.llen:0.06);
  });
  INV.forEach((b,i)=>{b.visible=i<G-1;});
  CRIT.forEach((cr,i)=>{
    const okv=e[cr.k];
    LEDS[i].material.color.set(okv?0x7CD992:0xff6b6b);
    LEDS[i].material.emissive.set(okv?0x7CD992:0xff6b6b);
    LEDS[i].material.emissiveIntensity=okv?1.3:0.55;
  });
  drawPlaca(sc,cfg,e,cy,tl);
}

// ===================== 9. HUD Y PANEL =====================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Hidráulica y Neumática · Mecánica</div>
  <h2>Secuencias multicilindro por método cascada</h2>
  <p>Una secuencia se rompe cuando un cilindro recibe la orden de ida y la de vuelta a la vez sobre la misma memoria biestable. El método cascada lo evita repartiendo la secuencia en <b>grupos</b> sin cilindros repetidos y dando a cada grupo su propia línea de presión: sólo una está viva, así que las órdenes de los demás grupos están físicamente muertas. El número de grupos no lo fija cuántos cilindros haya, lo fija el <b>entrelazado</b>.</p>
  <div class="formula">grupos = f(entrelazado) · · · inversores = grupos − 1 · · · Q = C·p₁·√(1 − ((r − b)/(1 − b))²)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#7CD992"></span>línea viva / criterio cumplido</div>
    <div class="li"><span class="dot" style="background:#E9C46A"></span>línea llenándose / límite</div>
    <div class="li"><span class="dot" style="background:#ff6b6b"></span>criterio incumplido / paro</div>
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>grupo 1</div>
    <div class="li"><span class="dot" style="background:#C08CF8"></span>pliego de condiciones</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> validez y minimalidad del reparto por barrido exhaustivo de todos los cortes posibles; ejecución paso a paso del mando en cascada con memorias biestables, finales de carrera e inversores; caudal por ISO 6358 con relación crítica b = 0,45; tiempo de cada carrera con la contrapresión que impone la carga; llenado de la línea de mando por el tubo 4×2,5 hasta el umbral de pilotaje; aire de los cilindros y de las líneas; ciclos por hora y energía equivalente.</div>
    <div class="fl no"><b>NO modela:</b> el solape temporal de dos movimientos simultáneos cuando el mando está roto (la animación los reproduce en secuencia; el orden de lo ejecutado y el paro sí son exactos); la inercia de la carga y la amortiguación final, que se sustituyen por un límite de velocidad; la caída de presión en los tubos de trabajo; los secuenciadores de módulos paso a paso, que se citan y no se simulan; la temperatura y la calidad del aire (ISO 8573-1, citada).</div>
  </div>
  <div class="src">Ref: ISO 1219-1 (símbolos) · ISO 6358 (caudal) · ISO 8778 (aire ANR) · ISO 15552 (émbolo-vástago) · ISO 4414 (seguridad) · ISO 8573-1 (citada)</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Cascada multicilindro · <span id="p_mode" style="color:var(--accent2)">Reparto</span></h4>
  <div class="modebar">
    <button class="b on" id="m_reparto">🧩 Reparto</button>
    <button class="b" id="m_mando">🔁 Mando</button>
    <button class="b" id="m_ritmo">⏱️ Ritmo</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="scenarioInfo" style="font-size:12px;color:var(--ink);margin:2px 0 8px;display:none"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Proyecto propuesto</h4>
  <div id="retoBox" style="display:none">
    <div id="retoSpec" style="font-size:12px;color:var(--ink);margin:2px 0 8px"></div>
    <div class="btns"><button class="b primary" id="btnCheck">✅ Comprobar</button></div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
    <button class="b primary" id="btnNew">🔀 Nuevo escenario</button>
  </div>`;

// ===================== 10. TOAST =====================
function showToast(html){
  const t=el('toast');t.innerHTML=html;t.classList.add('show');
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),4600);
}

// ===================== 11. MODOS Y CONTROLES =====================
const MODE_META={
  reparto:{nombre:'Reparto',cam:[[5.2,2.6,5.6],[1.90,0.95,0.55]],
    mision:'Parte la secuencia en grupos: dentro de un grupo ningún cilindro puede repetirse.'},
  mando:{nombre:'Mando',cam:[[5.4,2.7,5.6],[2.60,1.15,0.55]],
    mision:'Elige qué final de carrera cierra el grupo 1 y comprueba si la máquina ejecuta la secuencia pedida.'},
  ritmo:{nombre:'Ritmo',cam:[[2.4,2.2,4.8],[1.30,0.85,0.45]],
    mision:'Dimensiona el cilindro crítico: fuerza, velocidad y ciclos por hora tiran en direcciones distintas.'},
  reto:{nombre:'Reto',cam:[[5.4,3.0,7.6],[1.40,1.05,0.50]],
    mision:'Proyecta el mando completo: reparto, señal de cambio y diámetro.'},
};
function lbl(t){return `<span class="lbl">${t}</span>`;}
function optBtns(key,opts,cur){
  return opts.map(([v,t])=>`<button class="b sm ${String(cur)===String(v)?'on':''}" data-${key}="${v}">${t}</button>`).join('');
}
const beep=()=>synth.beep(680,0.05,0.04);
const estOpts=()=>POOL.map((s,i)=>[i,s.nom]);
const diamOpts=()=>DIAMS.map(D=>['' + D,'Ø'+D]);
const camOpts=sc=>fcOpts(sc).map(k=>[k,k]);
function corteBtns(sc,cortes,key){
  return sc.seq.slice(1).map((m,j)=>{
    const i=j+1, on=cortes.indexOf(i)>=0;
    return `<button class="b sm ${on?'on':''}" data-${key}="${i}">${rotMov(sc.seq[i-1])}${on?' ┃ ':' · '}${rotMov(m)}</button>`;
  }).join('');
}
function toggleCorte(arr,i){
  const out=arr.slice(), k=out.indexOf(i);
  if(k>=0)out.splice(k,1);else out.push(i);
  out.sort((a,b)=>a-b);
  return out;
}

function buildControls(){
  const bar=el('selbar');
  let h='';
  if(mode==='reparto'){
    h+=lbl('Estación')+optBtns('est',estOpts(),rpIdx);
    h+=lbl('Cortes')+corteBtns(POOL[rpIdx],rpCortes,'corte');
  }else if(mode==='mando'){
    h+=lbl('Estación')+optBtns('est',estOpts(),mnIdx);
    h+=lbl('Señal de cambio')+optBtns('cam',camOpts(POOL[mnIdx]),mnCambio);
  }else if(mode==='ritmo'){
    h+=lbl('Estación')+optBtns('est',estOpts(),rtIdx);
    h+=lbl('Diámetro')+optBtns('diam',diamOpts(),rtDiam);
  }else{
    h+=lbl('Cortes')+corteBtns(retoSc(),retoCh.cortes,'rcorte');
    h+=lbl('Señal de cambio')+optBtns('rcam',camOpts(retoSc()),retoCh.cambio);
    h+=lbl('Diámetro')+optBtns('rdiam',diamOpts(),retoCh.diam);
  }
  bar.innerHTML=h;bar.style.display='flex';
  bar.querySelectorAll('[data-est]').forEach(b=>b.onclick=()=>{
    if(autoRunning)return;
    const i=+b.dataset.est;
    if(mode==='reparto'){rpIdx=i;rpCortes=[];}
    else if(mode==='mando'){mnIdx=i;mnCambio=fcOpts(POOL[i])[0];}
    else rtIdx=i;
    animT=0;beep();afterEdit();
  });
  bar.querySelectorAll('[data-corte]').forEach(b=>b.onclick=()=>{
    if(autoRunning)return;
    rpCortes=toggleCorte(rpCortes,+b.dataset.corte);animT=0;beep();afterEdit();
  });
  bar.querySelectorAll('[data-cam]').forEach(b=>b.onclick=()=>{if(autoRunning)return;mnCambio=b.dataset.cam;animT=0;beep();afterEdit();});
  bar.querySelectorAll('[data-diam]').forEach(b=>b.onclick=()=>{if(autoRunning)return;rtDiam=+b.dataset.diam;animT=0;beep();afterEdit();});
  bar.querySelectorAll('[data-rcorte]').forEach(b=>b.onclick=()=>retoSet('cortes',toggleCorte(retoCh.cortes,+b.dataset.rcorte)));
  bar.querySelectorAll('[data-rcam]').forEach(b=>b.onclick=()=>retoSet('cambio',b.dataset.rcam));
  bar.querySelectorAll('[data-rdiam]').forEach(b=>b.onclick=()=>retoSet('diam',+b.dataset.rdiam));
}
function retoSet(field,v){
  if(autoRunning)return;
  retoCh[field]=v;
  retoChecked=false;retoOkCortes=false;retoOkCambio=false;retoOkDiam=false;retoSolved=false;retoMsg='';solved=false;
  animT=0;beep();afterEdit();
}
function afterEdit(){
  buildControls();updateScenarioInfo();
  if(mode==='reto')updateRetoSpec();
  refreshAll();
}
function updateScenarioInfo(){
  const sc=curSc();
  const box=el('scenarioInfo');
  box.style.display='block';
  box.innerHTML=`<b>${sc.nom}</b> · ${rotSec(sc.seq)} · red ${f1(sc.pRed,0)} bar · pide ${f1(sc.ritmo,0)} ciclos/h<br><span style="color:var(--muted)">${MODE_META[mode].mision}</span>`;
}
function setMode(k){
  mode=k;
  ['reparto','mando','ritmo','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('retoTitle').style.display=k==='reto'?'block':'none';
  el('retoBox').style.display=k==='reto'?'block':'none';
  buildControls();updateScenarioInfo();
  solved=k==='reto'?retoSolved:false;
  clearDx();buildQuiz();refreshQuestion();
  const cam=MODE_META[k].cam;S.moveTo(cam[0],cam[1]);
  if(k==='reto')updateRetoSpec();
  animT=0;
  refreshAll();
}
function newSignal(){
  if(mode==='reparto'){rpIdx=pickIdx(POOL.length,rpIdx);rpCortes=[];}
  else if(mode==='mando'){
    mnIdx=pickIdx(POOL.length,mnIdx);
    const o=fcOpts(POOL[mnIdx]);
    mnCambio=o[Math.floor(Math.random()*o.length)];
  }
  else if(mode==='ritmo'){rtIdx=pickIdx(POOL.length,rtIdx);rtDiam=DIAMS[Math.floor(Math.random()*DIAMS.length)];}
  else{seedReto(null);solved=false;}
  animT=0;
  clearDx();refreshQuestion();
  afterEdit();
}

// ===================== 12. TELEMETRÍA =====================
function teleRow(l,v,cls){return `<div class="trow"><span class="tl">${l}</span><span class="tv ${cls||''}">${v}</span></div>`;}
function updateTele(){
  const sc=curSc(), cfg=curCfg(), e=curEval(), cy=curCiclo(), tl=curTL();
  const gs=grupos(sc.seq,cfg.cortes), G=gs.length, repe=cilRepe(sc.seq,gs);
  let h='';
  if(mode==='reparto'){
    h+=teleRow('Secuencia',rotSec(sc.seq));
    h+=teleRow('Grupos',String(G),e.okMin?'ok':'bad');
    h+=teleRow('Mínimo posible',String(sc.gMin));
    h+=teleRow('Cilindro repetido',repe?repe.cil+' (grupo '+repe.g+')':'ninguno',repe?'bad':'ok');
    h+=teleRow('Inversores',String(G-1));
    h+=teleRow('Tiempo muerto',f1(cy.tLin,3)+' s/ciclo',cy.tLin>0.9?'warn':'');
    h+=teleRow('Aire de mando',f1(cy.aireLin,3)+' l ANR');
    h+=teleRow('Ejecuta la secuencia',tl.ok?'sí':'no',tl.ok?'ok':'bad');
  }else if(mode==='mando'){
    const ult=sc.seq[gs[0][gs[0].length-1]];
    h+=teleRow('Grupo 1',gs[0].map(i=>rotMov(sc.seq[i])).join(' '));
    h+=teleRow('Último movimiento',rotMov(ult));
    h+=teleRow('Señal elegida',cfg.cambio,e.okCam?'ok':'bad');
    h+=teleRow('Ejecutada',tl.orden.length?tl.orden.join(' '):'nada',tl.ok?'ok':'bad');
    h+=teleRow('Bloqueo',bloqTxt(tl.sim,sc.seq),tl.ok?'':'bad');
    h+=teleRow('Ciclo',isFinite(cy.total)?f1(cy.total,3)+' s':'no cierra',tl.ok?'ok':'bad');
    h+=teleRow('Ritmo',f1(cy.ciclosH,0)+' ciclos/h',e.okRit?'ok':'bad');
    const stM=estadoEn(sc,tl,animT);
    h+=teleRow('Línea viva',stM.fase==='paro'?'ninguna (paro)':(stM.linea>=0?'L'+(stM.linea+1)+' de '+G:'conmutando'),stM.fase==='paro'?'bad':'');
  }else if(mode==='ritmo'){
    h+=teleRow('Cilindro crítico',cilProt(sc).id+' · '+cilProt(sc).nom);
    h+=teleRow('Diámetro','Ø'+cfg.diam+' mm');
    h+=teleRow('Relación de carga',f1(e.cargaMax,3),e.okFza?'ok':'bad');
    h+=teleRow('Máximo admisible',f1(CARGA_MAX,2),'warn');
    h+=teleRow('Velocidad máxima',f1(e.velMax,3)+' m/s',e.okVel?'ok':'bad');
    h+=teleRow('Ciclo',isFinite(cy.total)?f1(cy.total,3)+' s':'no cierra');
    h+=teleRow('Ritmo',f1(cy.ciclosH,0)+' / '+f1(sc.ritmo,0)+' ciclos/h',e.okRit?'ok':'bad');
    h+=teleRow('Aire por ciclo',f1(cy.aireTot,3)+' l ANR');
  }else{
    h+=teleRow('Reparto',G+' grupos',retoChecked?(retoOkCortes?'ok':'bad'):'');
    h+=teleRow('Señal de cambio',cfg.cambio,retoChecked?(retoOkCambio?'ok':'bad'):'');
    h+=teleRow('Diámetro','Ø'+cfg.diam+' mm',retoChecked?(retoOkDiam?'ok':'bad'):'');
    h+=teleRow('Ejecuta la secuencia',tl.ok?'sí':'no',tl.ok?'ok':'bad');
    h+=teleRow('Ritmo',f1(cy.ciclosH,0)+' / '+f1(sc.ritmo,0)+' /h',e.okRit?'ok':'bad');
    h+=teleRow('Aire por ciclo',f1(cy.aireTot,3)+' l ANR');
    h+=teleRow('Criterios cumplidos',CRIT.filter(cr=>e[cr.k]).length+' de '+CRIT.length,e.vale?'ok':'bad');
    h+=teleRow('Estado',retoChecked?(retoSolved?'aceptado':'rechazado'):'sin comprobar',retoChecked?(retoSolved?'ok':'bad'):'');
  }
  el('tele').innerHTML=h;
}
function updateReport(){
  const sc=curSc(), cfg=curCfg(), e=curEval(), cy=curCiclo(), tl=curTL();
  const gs=grupos(sc.seq,cfg.cortes), G=gs.length, repe=cilRepe(sc.seq,gs);
  let h='';
  if(mode==='reparto'){
    h='<b>'+sc.nom+'</b> · '+rotSec(sc.seq)+'<br>'+
      'Reparto: '+rotCortes(sc,cfg.cortes)+'<br>'+
      (repe?'<span style="color:#ff6b6b">El cilindro '+repe.cil+' se repite en el grupo '+repe.g+': los dos pilotajes de su memoria cuelgan de la misma línea viva. Con la señal que sale de este reparto, '+desenlaceTxt(tl.sim)+': ejecuta «'+(tl.orden.join(' ')||'nada')+'» de «'+rotSec(sc.seq)+'».</span>'
        :(G===sc.gMin?'<span style="color:#7CD992">Válido y mínimo: '+G+' grupos, '+(G-1)+' inversor(es).</span>'
          :'<span style="color:#E9C46A">Válido pero con '+(G-sc.gMin)+' grupo(s) de más: la máquina funciona y cuesta '+f1(cy.tLin,3)+' s y '+f1(cy.aireLin,3)+' l ANR por ciclo en cambios de línea.</span>'))+
      '<br>De los '+f1(sc._tot,0)+' repartos posibles, '+f1(sc._val,0)+' son válidos y sólo '+f1(sc._rep.length,0)+' usa el mínimo de grupos.';
  }else if(mode==='mando'){
    const ult=sc.seq[gs[0][gs[0].length-1]];
    h='<b>'+sc.nom+'</b><br>Grupo 1: '+gs[0].map(i=>rotMov(sc.seq[i])).join(' ')+' → lo cierra <b>'+fcDe(ult)+'</b>.<br>'+
      (tl.ok?'<span style="color:#7CD992">Con '+cfg.cambio+' la cascada conmuta cuando toca: ciclo '+f1(cy.total,3)+' s.</span>'
        :'<span style="color:#ff6b6b">'+(porQue(sc,'cambio',cfg.cambio)||'El mando no ejecuta la secuencia.')+'</span>');
  }else if(mode==='ritmo'){
    const okd=DIAMS.filter(D=>evalCfg(sc,{cortes:cfg.cortes,cambio:cfg.cambio,diam:D}).vale);
    h='<b>'+sc.nom+'</b> · cilindro '+cilProt(sc).id+'<br>'+
      'Ø'+cfg.diam+' → carga '+f1(e.cargaMax,3)+', v '+f1(e.velMax,3)+' m/s, '+f1(cy.ciclosH,0)+' ciclos/h.<br>'+
      (e.vale?'<span style="color:#7CD992">Cumple los tres criterios.</span> ':'<span style="color:#ff6b6b">'+porQue(sc,'diam',cfg.diam)+'</span> ')+
      '<br>Diámetros que cumplen: '+(okd.length?okd.map(D=>'Ø'+D).join(', '):'ninguno')+'.';
  }else{
    h='<b>'+sc.nom+'</b><br>'+
      (retoChecked?(retoSolved?'<span style="color:#7CD992">Proyecto aceptado: reparto mínimo, señal correcta y diámetro justo.</span>':'<span style="color:#ff6b6b">'+retoMsg+'</span>')
        :'Elige el reparto, la señal de cambio y el diámetro y pulsa «Comprobar».')+
      '<br>Criterios: '+CRIT.map(cr=>(e[cr.k]?'🟢':'🔴')+' '+cr.rot).join(' · ');
  }
  el('report').innerHTML=h;
}
function refreshAll(){drawBoard();updateTele();updateReport();updateHW();}

// ===================== 13. RETO =====================
function updateRetoSpec(){
  const sc=retoSc();
  el('retoSpec').innerHTML=`<b>${sc.nom}</b> · ${rotSec(sc.seq)}<br>`+
    sc.cils.map(c=>`${c.id}: ${c.nom} (${f1(c.s,0)} mm, ${f1(c.Fe,0)}/${f1(c.Fr,0)} N)`).join(' · ')+`<br>`+
    `Red ${f1(sc.pRed,0)} bar · válvulas ${f1(sc.qn,0)} l/min · ${f1(sc.manL,0)} m de tubo de mando · ${f1(sc.ritmo,0)} ciclos/h porque ${sc.proc}.<br>`+
    `<span style="color:var(--muted)">Sólo el cilindro ${sc.prot} está sin elegir; los demás vienen dados.</span>`;
}
function retoExplain(){
  return EJES.map(ej=>porQue(retoSc(),ej,retoCfg()[ej])).filter(Boolean).join(' · ');
}
function checkReto(){
  const sc=retoSc(), cfg=retoCfg();
  retoOkCortes=okEje(sc,'cortes',cfg.cortes);
  retoOkCambio=okEje(sc,'cambio',cfg.cambio);
  retoOkDiam=okEje(sc,'diam',cfg.diam);
  retoChecked=true;
  retoSolved=retoOkCortes&&retoOkCambio&&retoOkDiam;
  solved=retoSolved;
  retoMsg=retoSolved?'Reparto mínimo, señal correcta y diámetro justo.':retoExplain();
  synth.beep(retoSolved?880:200,0.10,0.05);
  refreshAll();
  if(!autoRunning){
    showToast((retoSolved?'✅ <b>Proyecto aceptado.</b> ':'❌ <b>Proyecto rechazado.</b> ')+retoMsg);
  }
  return retoSolved;
}
function retoSolveBuild(){
  const g=GOOD(retoSc());
  retoCh={cortes:g.cortes.slice(),cambio:g.cambio,diam:g.diam};
  retoChecked=false;retoOkCortes=false;retoOkCambio=false;retoOkDiam=false;retoSolved=false;retoMsg='';
}

// ===================== 14. CUESTIONARIO =====================
function buildQuiz(){
  QUIZ={
    reparto:{
      pregunta:'¿Qué determina cuántos grupos necesita una secuencia en el método cascada?',
      opciones:[
        {t:'El entrelazado de la secuencia: dónde vuelve a aparecer un cilindro que ya se movió',ok:true,
         why:'Exacto. La prensa de punzonado (A+ A− B+ B−) tiene 2 cilindros y necesita 3 grupos; la encajadora (A+ B+ B− C+ C− A−) tiene 3 cilindros y también 3. El número de cilindros no manda: manda dónde se repiten.'},
        {t:'El número de cilindros: tantos grupos como cilindros',ok:false,
         why:'Falso en las dos direcciones. Hay secuencias de 2 cilindros que piden 3 grupos y secuencias de 3 cilindros que se resuelven con 3, o incluso con menos si no hay repeticiones cruzadas.'},
        {t:'El número de movimientos dividido entre dos',ok:false,
         why:'No. Con 4 movimientos hay secuencias de 2 grupos (A+ B+ B− A−) y de 3 (A+ A− B+ B−): el mismo número de movimientos y distinta respuesta.'},
        {t:'La presión de red: a menos presión, más grupos',ok:false,
         why:'La presión no interviene en el reparto. El reparto es un problema de lógica de señales; la presión aparece después, al dimensionar y al calcular tiempos.'},
      ],
    },
    mando:{
      pregunta:'Un mando en cascada de dos grupos ejecuta el primer movimiento y se queda parado. ¿Qué revisas primero?',
      opciones:[
        {t:'Qué señal cierra el grupo 1: debe ser el final de carrera del ÚLTIMO movimiento de ese grupo',ok:true,
         why:'Correcto. Si conmutas la línea con un final de carrera anterior, cortas la alimentación del grupo antes de que termine, y el resto de sus órdenes se quedan sin presión. Con la señal correcta, el cambio ocurre justo cuando el grupo ha acabado.'},
        {t:'El caudal de las válvulas: seguramente son pequeñas',ok:false,
         why:'Una válvula pequeña hace la máquina lenta, no la para. Si no se ejecuta un movimiento entero es un problema de señales, no de caudal.'},
        {t:'Las memorias biestables: hay que cambiarlas por monoestables',ok:false,
         why:'Al revés: la cascada necesita memorias biestables precisamente porque la línea que dio la orden se apaga después. Con monoestables el cilindro volvería solo al morir su grupo.'},
        {t:'El número de grupos: hay que añadir uno más',ok:false,
         why:'Añadir grupos no arregla una señal de cambio equivocada; sólo suma un inversor, tiempo muerto y aire. Primero se comprueba con qué señal conmuta cada línea.'},
      ],
    },
    ritmo:{
      pregunta:'Un cilindro cumple de sobra la fuerza con Ø63. ¿Por qué no montar directamente el Ø100 y olvidarse?',
      opciones:[
        {t:'Porque un émbolo mayor mueve mucho más aire por carrera y, pasado cierto punto, el ciclo se ALARGA en vez de acortarse',ok:true,
         why:'Exacto. En cuatro de las cinco estaciones del banco el mejor ritmo está en un diámetro intermedio, no en el mayor: el más grande nunca es el más rápido. Y además consume más aire cada ciclo.'},
        {t:'Porque el aire comprimido no llega a llenar un cilindro tan grande',ok:false,
         why:'Sí llega: acaba llenándolo. El problema es cuánto TARDA, y con él, cuántos ciclos por hora salen.'},
        {t:'Porque un cilindro grande no cabe en la máquina',ok:false,
         why:'El espacio importa, pero aquí el criterio es medible: el ciclo, el ritmo y el aire por ciclo. Se monta el menor diámetro que cumpla los tres criterios.'},
        {t:'Porque con más diámetro sube la velocidad y se pasa del límite de impacto',ok:false,
         why:'Es al revés: a igual válvula, un émbolo mayor va más despacio. El riesgo de velocidad aparece con los diámetros PEQUEÑOS, no con los grandes.'},
      ],
    },
    reto:{
      pregunta:'Un montaje con un grupo de más ejecuta la secuencia perfectamente en el banco. ¿Se acepta el proyecto?',
      opciones:[
        {t:'No: funciona, pero paga un inversor de más y entre 0,16 y 0,40 s de tiempo muerto y 0,26 a 0,47 l ANR por ciclo',ok:true,
         why:'Correcto. Todo reparto sin cilindros repetidos ejecuta la secuencia, así que «funciona en el banco» no demuestra nada. Lo que separa al bueno del que sobra es el hardware, el tiempo muerto y el aire de cada ciclo, que se pagan todos los días.'},
        {t:'Sí: si la secuencia sale bien, el reparto es correcto por definición',ok:false,
         why:'No. La prueba de banco sólo descarta los repartos rotos. Entre los que funcionan hay uno con los grupos justos y varios que sobran; los que sobran cuestan más en cada ciclo.'},
        {t:'No, porque un grupo de más hace que la máquina se pare a mitad de secuencia',ok:false,
         why:'No se para: los repartos válidos no mínimos ejecutan la secuencia completa. Lo que hacen es alargar el ciclo y tirar aire, que es un problema distinto y menos visible.'},
        {t:'Sí, siempre que el consumo de aire no suba más de un 10 %',ok:false,
         why:'No hay un umbral así en ninguna norma. El criterio de proyecto es el mínimo de grupos que resuelve la secuencia; el consumo es la consecuencia, no el permiso.'},
      ],
    },
  };
  Object.keys(QUIZ).forEach(k=>{
    const o=QUIZ[k].opciones;
    for(let i=o.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[o[i],o[j]]=[o[j],o[i]];}
  });
}
function clearDx(){el('dxbtns').innerHTML='';}
function refreshQuestion(){
  const q=QUIZ[mode];el('q_text').textContent=q.pregunta;
  el('dxbtns').innerHTML=q.opciones.map((o,i)=>`<button class="b sm" data-i="${i}">${String.fromCharCode(65+i)}) ${o.t}</button>`).join('');
  el('dxbtns').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>answer(+b.dataset.i));
}
function answer(i){
  const q=QUIZ[mode],o=q.opciones[i];
  el('dxbtns').querySelectorAll('[data-i]').forEach(b=>{
    b.disabled=true;
    const oo=q.opciones[+b.dataset.i];
    const cls=oo.ok?'right':(+b.dataset.i===i?'wrong':'');
    if(cls)b.classList.add(cls);
  });
  synth.beep(o.ok?880:200,0.09,0.05);
  showToast((o.ok?'✅ ':'❌ ')+o.why);
}

// ===================== 15. PICKING Y HOVER =====================
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit){return;}
  let o=hit.object;
  if(o===board||o===frame){boardClick();return;}
  while(o){
    if(o.userData&&o.userData.title){showToast('<b>'+o.userData.title+'</b><br>'+(o.userData.info||''));return;}
    o=o.parent;
  }
});
(function hoverLoop(){
  const ray=new THREE.Raycaster();const m=new THREE.Vector2(-2,-2);
  S.renderer.domElement.addEventListener('pointermove',ev=>{
    const r=S.renderer.domElement.getBoundingClientRect();
    m.x=((ev.clientX-r.left)/r.width)*2-1;m.y=-((ev.clientY-r.top)/r.height)*2+1;
  });
  function tick(){
    ray.setFromCamera(m,S.camera);
    const objs=[...HOVER_LABELS.keys()];
    const hits=ray.intersectObjects(objs,true);
    const hitSet=new Set();
    hits.forEach(h=>{let o=h.object;while(o){if(HOVER_LABELS.has(o)){hitSet.add(o);break;}o=o.parent;}});
    HOVER_LABELS.forEach((spr,obj)=>{spr.visible=hitSet.has(obj);});
    requestAnimationFrame(tick);
  }
  tick();
})();

// ===================== 16. RECORRIDO AUTOMÁTICO =====================
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runAuto(){
  if(autoRunning)return;
  autoRunning=true;
  const btn=el('btnAuto'),label=btn.textContent;
  btn.disabled=true;btn.classList.add('on');btn.textContent='⏳ Recorriendo…';
  synth.init();synth.resume();clearDx();
  try{
    // --- 1. REPARTO: la regla y de dónde sale el número de grupos ---
    setMode('reparto');
    rpIdx=2;rpCortes=[];afterEdit();
    const scP=POOL[2];
    showToast('🧩 <b>Prensa de punzonado</b>: '+rotSec(scP.seq)+'. Sin cortes hay un solo grupo, y en él A y B se mueven dos veces cada uno: la máquina no ejecuta <b>nada</b>.');
    await sleep(5400);
    rpCortes=[1];afterEdit();
    showToast('❌ Cortando después de A+ quedan dos grupos, pero en el segundo (A− B+ B−) el cilindro <b>B</b> aparece dos veces: los dos pilotajes de su válvula cuelgan de la misma línea. Y no se para en seco: la cascada <b>da la vuelta</b> y cierra el ciclo con «'+(curTL().orden.join(' ')||'nada')+'» de «'+rotSec(scP.seq)+'».');
    await sleep(5600);
    rpCortes=[1,3];afterEdit();
    const cyP=ciclo(scP,curCfg());
    showToast('✅ Con tres grupos ('+rotCortes(scP,[1,3])+') ningún cilindro se repite: la prensa completa el ciclo en <b>'+f1(cyP.total,3)+' s</b> ('+f1(cyP.ciclosH,0)+' ciclos/h). Dos cilindros y <b>tres</b> grupos.');
    await sleep(5600);
    rpIdx=3;rpCortes=[2,4];afterEdit();
    const scE=POOL[3];
    showToast('🔁 <b>Encajadora</b>: '+rotSec(scE.seq)+'. Tres cilindros y también <b>'+scE.gMin+'</b> grupos. Lo que manda no es cuántos cilindros hay, es dónde se repiten: el <b>entrelazado</b>.');
    await sleep(5600);
    rpCortes=[1,2,4];afterEdit();
    const cyX=ciclo(scE,curCfg()), cyB=ciclo(scE,GOOD(scE));
    showToast('⚠️ Con un grupo de más la encajadora <b>sigue funcionando</b>: por eso la prueba de banco no basta. Cuesta '+f1(cyX.tLin-cyB.tLin,3)+' s y '+f1(cyX.aireLin-cyB.aireLin,3)+' l ANR más en cada ciclo, y un inversor extra.');
    await sleep(5800);

    // --- 2. MANDO: la señal de cambio ---
    setMode('mando');
    mnIdx=0;mnCambio='a1';afterEdit();
    const scM=POOL[0], gM=GOOD(scM), gsM=grupos(scM.seq,gM.cortes);
    const ultM=scM.seq[gsM[0][gsM[0].length-1]];
    showToast('🔀 <b>Marcadora</b>: el grupo 1 es '+gsM[0].map(i=>rotMov(scM.seq[i])).join(' ')+'. Si conmuto con <b>a1</b> corto la línea antes de que el grupo termine: ejecuta «'+(curTL().orden.join(' ')||'nada')+'» de «'+rotSec(scM.seq)+'», la cascada da la vuelta y el ciclo se cierra a medias.');
    await sleep(5800);
    mnCambio=fcDe(ultM);afterEdit();
    const cyM=curCiclo();
    showToast('✅ La señal correcta es <b>'+fcDe(ultM)+'</b>, el final de carrera del ÚLTIMO movimiento del grupo ('+rotMov(ultM)+'). Ahora sí: ciclo '+f1(cyM.total,3)+' s, de los cuales '+f1(cyM.tLin,3)+' s son cambios de línea.');
    await sleep(5800);

    // --- 3. RITMO: el diámetro no es «cuanto más grande, mejor» ---
    setMode('ritmo');
    rtIdx=3;rtDiam=32;afterEdit();
    const scR=POOL[3];
    const e32=evalCfg(scR,curCfg()), c32=curCiclo();
    showToast('📏 <b>Encajadora</b> con Ø32: relación de carga <b>'+f1(e32.cargaMax,3)+'</b> frente al máximo '+f1(CARGA_MAX,2)+', y sólo '+f1(c32.ciclosH,0)+' ciclos/h de los '+f1(scR.ritmo,0)+' que pide la línea. Se queda corto por los dos lados.');
    await sleep(5600);
    rtDiam=40;afterEdit();
    const c40=curCiclo(), e40=curEval();
    showToast('✅ Con Ø40 la carga baja a '+f1(e40.cargaMax,3)+', la velocidad se queda en '+f1(e40.velMax,3)+' m/s y el ritmo sube a <b>'+f1(c40.ciclosH,0)+' ciclos/h</b>. Cumple los tres criterios.');
    await sleep(5600);
    rtDiam=100;afterEdit();
    const c100=curCiclo(), e100=curEval();
    showToast('📉 Y el Ø100, con una carga de sólo '+f1(e100.cargaMax,3)+', se hunde a <b>'+f1(c100.ciclosH,0)+' ciclos/h</b> y gasta '+f1(c100.aireTot,3)+' l ANR por ciclo frente a '+f1(c40.aireTot,3)+'. El más grande <b>no</b> es el más rápido.');
    await sleep(5800);

    // --- 4. RETO ---
    setMode('reto');
    seedReto(2);afterEdit();
    showToast('🎯 <b>Reto</b>: proyecta el mando de la prensa de punzonado. Arranca mal en los tres ejes a propósito.');
    await sleep(4600);
    checkReto();
    showToast('❌ Comprobado con la propuesta de arranque: '+retoMsg);
    await sleep(6000);
    retoSolveBuild();afterEdit();
    const gR=GOOD(POOL[2]);
    showToast('✅ La única propuesta <b>válida y mínima</b>: '+rotCortes(POOL[2],gR.cortes)+', cambio con <b>'+gR.cambio+'</b> y Ø'+gR.diam+' mm. Comprobamos.');
    await sleep(4800);
    checkReto();
    await sleep(700);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));
  }finally{
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

// ===================== 17. ANIMACIÓN, EVENTOS E INICIO =====================
S.setAnimate((dt)=>{
  const tl=curTL();
  const T=(isFinite(tl.total)&&tl.total>0)?tl.total:1;
  animT=(animT+dt*T/ANIM_CICLO)%T;
  updateHW();
});
['reparto','mando','ritmo','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnAuto').onclick=()=>{if(!autoRunning)runAuto();};
el('btnNew').onclick=()=>{if(autoRunning)return;newSignal();};
el('btnCheck').onclick=()=>{if(autoRunning)return;checkReto();};
const soundBtn=el('soundBtn');if(soundBtn){soundBtn.onclick=()=>{synth.toggle();soundBtn.textContent=synth.isOn()?'🔊':'🔇';};}
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});
buildQuiz();
S.start();
setMode('reparto');

// ===================== DEBUG HOOK =====================
window.__labDebug={
  mode:()=>mode,setMode,
  // constantes selladas
  P_ANR:()=>P_ANR,P_ATM:()=>P_ATM,B_CRIT:()=>B_CRIT,P_PILOT:()=>P_PILOT,RENDIM:()=>RENDIM,
  CARGA_MAX:()=>CARGA_MAX,V_MAX:()=>V_MAX,E_AIRE:()=>E_AIRE,C_MAN_1M:()=>C_MAN_1M,D_MAN:()=>D_MAN,
  V_PIL:()=>V_PIL,F_QN:()=>F_QN,CIL_ISO:()=>CIL_ISO,DIAMS:()=>DIAMS,
  POOL:()=>POOL,EJES:()=>EJES,CRIT:()=>CRIT,
  // motor
  areaEmb,areaAnu,qFlujo,cDeQn,tLlenado,cMan,vTubo,vLinea,tLinea,aireLinea,movDatos,
  grupos,sepVale,todosCortes,cortesGreedy,repartosMinimos,cilRepe,cilProt,cilDe,diamCil,
  simular,ciclo,evalCfg,cmpCoste,GOOD,okEje,porQue,cfgWith,rotSec,rotMov,rotCortes,fcDe,fcOpts,f1,
  // animación
  bloqTxt,desenlaceTxt,timeline,estadoEn,curTL,animT:()=>animT,setAnimT:(t)=>{animT=t;refreshAll();},
  // estado
  curSc,curCfg,curEval,curCiclo,
  rpGet:()=>({idx:rpIdx,cortes:rpCortes.slice()}),
  rpSet:(o)=>{if(o.idx!==undefined){rpIdx=o.idx;rpCortes=[];}if(o.cortes)rpCortes=o.cortes.slice();animT=0;afterEdit();},
  mnGet:()=>({idx:mnIdx,cambio:mnCambio}),
  mnSet:(o)=>{if(o.idx!==undefined){mnIdx=o.idx;mnCambio=fcOpts(POOL[o.idx])[0];}if(o.cambio)mnCambio=o.cambio;animT=0;afterEdit();},
  rtGet:()=>({idx:rtIdx,diam:rtDiam}),
  rtSet:(o)=>{if(o.idx!==undefined)rtIdx=o.idx;if(o.diam!==undefined)rtDiam=o.diam;animT=0;afterEdit();},
  // reto
  retoK:()=>retoK,seedReto,retoName:()=>retoSc().nom,retoId:()=>retoSc().id,
  retoGet:()=>retoCfg(),retoSet,retoSolveBuild,checkReto,retoExplain,
  retoChecked:()=>retoChecked,retoOkCortes:()=>retoOkCortes,retoOkCambio:()=>retoOkCambio,retoOkDiam:()=>retoOkDiam,
  retoSolved:()=>retoSolved,retoMsg:()=>retoMsg,retoGood:()=>GOOD(retoSc()),retoStart:()=>startCfg(retoSc()),
  // cuestionario
  quizCorrectIndex:()=>QUIZ[mode].opciones.findIndex(o=>o.ok),
  quizAnswer:answer,newSignal,
  solved:()=>solved,autoRunning:()=>autoRunning,
};
