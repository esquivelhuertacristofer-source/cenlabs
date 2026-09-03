/* =====================================================================
   MEC-99 · d4-07 — Circuitos electroneumáticos con relevadores
   ---------------------------------------------------------------------
   El bloque MOTOR está pegado VERBATIM desde el verificador numérico
   scratchpad/verif_electroneum.mjs (308 comprobaciones, 0 fallos). No se
   toca aquí: si hay que cambiar física, se cambia en el verificador y se
   vuelve a pegar. Sus comentarios y sus textos van sin acentos porque el
   verificador es ASCII; ese texto llega tal cual a la interfaz.

   Qué decide el alumno, en tres ejes independientes:
     · válvula → 3/2 monoestable, 5/2 monoestable, 5/2 biestable, 5/3 de
       centros cerrados. Decide el comportamiento al faltar la tensión.
     · mando   → pulsadores momentáneos, relé con sello, selector
       mantenido o cadena de dos relés. Decide quién sostiene la orden.
     · cierre  → orden del operario, final de carrera reed o relé
       temporizado. Decide quién dice «ya llegó».

   Ref: IEC 60617 (símbolos eléctricos) · ISO 1219-1 (símbolos
   neumáticos) · IEC 60204-1 §7.5 (no rearranque al volver la tensión) ·
   IEC 60947-5-1 (aparamenta de mando) · IEC 61131-3 (citada).
   ===================================================================== */

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[5.6,3.0,7.4],target:[1.60,1.00,0.45],bgTop:'#0d1017',bgBot:'#05060a',bloom:0.42,minD:3.0,maxD:20});
const {scene}=S;
const synth=makeSynth({type:'square',type2:'sine',filterFreq:2400,Q:0.7});
const el=id=>document.getElementById(id);

// ===================== 2. MOTOR =====================
const DT=1;                    // paso de integracion del mando, ms
// Tiempos de los aparatos, en ms. Nominales representativos dentro del rango de
// catalogo; el rango se declara porque cada fabricante da el suyo.
const T_REL_ON=8;              // rele de mando 24 V CD, tiempo de operacion (rango 5-15)
const T_REL_OFF=4;             // rele de mando 24 V CD, tiempo de reposicion (rango 2-10)
const T_SOL=12;                // excitacion del solenoide de la electrovalvula (rango 10-30)
const T_CARRETE=8;             // carrera del carrete (rango 5-12)
const T_MUELLE=20;             // retorno por muelle de la valvula (rango 15-40)
const T_REED=1;                // respuesta del sensor reed (rango 0,5-3)
const T_V_ON=T_SOL+T_CARRETE;  // 20 ms: orden electrica -> carrete en posicion
const T_V_OFF=T_MUELLE+T_CARRETE; // 28 ms: cae la orden -> carrete en reposo
const VENT_REED=4;             // ventana magnetica del reed, mm (rango 2-6)
const P_BOB=4.5;               // potencia de una bobina de electrovalvula, W (rango 2-6)
const DERIVA=0.005;            // deriva del actuador con centros cerrados, carrera/s (fugas del carrete)
const TOL=0.02;                // tolerancia de posicion (fraccion de carrera)
const TOL_CONG=0.10;           // "se queda donde esta" = menos del 10 % de la carrera. El centrado del
                               // carrete tarda 28 ms y el aire comprimido no se detiene en seco: en un
                               // cilindro rapido esos 28 ms ya son un 9 % de la carrera.
const TOL_MOV=0.03;            // desplazamiento minimo que se considera movimiento tras volver la tension
const T_MARCHA=[200,450];      // pulso de marcha del operario (250 ms)
const T_DOBLE=[4200,4450];     // segunda pulsacion de marcha en la prueba de orden doble
const T_RETORNO=[4000,5500];   // orden de retroceso del operario, mantenida
const T_FIN=8000;              // duracion del ensayo de ciclo
const T_CORTE=600;             // duracion del corte de tension
const T_OBS=2000;              // observacion tras restablecerse la tension
const K_TEMP=1.10;             // el temporizador se ajusta al peor caso mas un 10 %

const VALV={
  mono3_2:{id:'mono3_2',nom:'3/2 monoestable',abr:'3/2 mono',efecto:'simple',sols:1,memoria:false,centro:false,
    det:'Una sola bobina y muelle de retorno. Al faltar tensión el muelle devuelve el carrete a reposo y el cilindro de simple efecto vuelve por su propio muelle.'},
  mono5_2:{id:'mono5_2',nom:'5/2 monoestable',abr:'5/2 mono',efecto:'doble',sols:1,memoria:false,centro:false,
    det:'Una sola bobina y muelle de retorno para un cilindro de doble efecto. Al faltar tensión el actuador retrocede siempre: es la elección de seguridad cuando lo seguro es replegarse.'},
  bies5_2:{id:'bies5_2',nom:'5/2 biestable',abr:'5/2 biest',efecto:'doble',sols:2,memoria:true,centro:false,
    det:'Dos bobinas y ninguna posición de reposo: el carrete se queda en la última posición ordenada. Al faltar tensión NO congela el actuador, congela la ORDEN: el cilindro termina su movimiento y se queda ahí.'},
  centros5_3:{id:'centros5_3',nom:'5/3 de centros cerrados',abr:'5/3 cerr',efecto:'doble',sols:2,memoria:false,centro:true,
    det:'Dos bobinas y muelles al centro. Sin orden, las dos vías de trabajo quedan cerradas y el actuador se para donde esté. Ni así lo congela del todo: el aire es compresible y el carrete tiene fugas.'},
};
const VALVS=['mono3_2','mono5_2','bies5_2','centros5_3'];

const MANDO={
  momentaneo:{id:'momentaneo',nom:'Pulsadores momentáneos',abr:'Momentáneo',reles:0,sensores:0,
    det:'Sin relevadores: el pulsador de marcha excita directamente la bobina de avance y la orden de retroceso excita la de retroceso. Sólo sirve si la válvula recuerda, porque la orden dura lo que dura el dedo.'},
  sello:{id:'sello',nom:'Relé con sello',abr:'Sello',reles:1,sensores:0,
    det:'Un relé que se autorretiene por su propio contacto: K1 = (marcha O K1) Y paro Y no-fin. La orden sobrevive al pulsador, pero muere con la tensión: al volver la tensión el relé está caído.'},
  mantenido:{id:'mantenido',nom:'Selector mantenido',abr:'Mantenido',reles:0,sensores:0,
    det:'Un selector de dos posiciones que sostiene la orden por sí mismo, sin relevadores. Es el más barato y el que menos cierra: mientras el selector siga dado, la orden de avance revive en cuanto el actuador se separa del tope, así que el vástago se queda temblando fuera en vez de volver.'},
  cadena:{id:'cadena',nom:'Cadena de dos relés',abr:'Cadena',reles:2,sensores:1,
    det:'Dos etapas selladas y encadenadas: K1 manda el avance, K2 manda el retroceso y desactiva a K1; el sensor de reposo desactiva a K2. Al volver la tensión no hay ninguna etapa activa.'},
};
const MANDOS=['momentaneo','sello','mantenido','cadena'];

const CIERRE={
  operario:{id:'operario',nom:'Orden del operario',abr:'Operario',reles:0,sensores:0,
    det:'El retroceso lo ordena una persona. No cuesta nada y no cierra ningún ciclo por sí solo: la máquina espera indefinidamente.'},
  fc:{id:'fc',nom:'Final de carrera reed',abr:'Final de carrera',reles:0,sensores:1,
    det:'Un sensor magnético en la camisa confirma que el vástago llegó. Cierra el ciclo en cuanto llega de verdad, no cuando toca por reloj. Necesita una posición final repetible.'},
  temporizador:{id:'temporizador',nom:'Relé temporizado',abr:'Temporizador',reles:1,sensores:0,
    det:'Un relé con retardo a la conexión ordena el retroceso al cumplirse el tiempo ajustado. Hay que ajustarlo al peor caso, así que en el caso normal siempre sobra tiempo. Y necesita una orden mantenida para contar.'},
};
const CIERRES=['operario','fc','temporizador'];

const EJES=['valvula','mando','cierre'];

const CRIT=[
  {k:'okEfecto',rot:'Válvula acorde al cilindro',det:'Un cilindro de simple efecto tiene una sola cámara útil: se manda con una 3/2. Uno de doble efecto tiene dos: se manda con una 5/2 o una 5/3. No es una preferencia, es cuántos orificios tiene la pieza.'},
  {k:'okSalida',rot:'Completa la carrera de trabajo',det:'El actuador llega al final de su carrera útil. Con un pulso corto sólo lo consigue una válvula con memoria; con las demás el vástago se para en cuanto se suelta el dedo.'},
  {k:'okCiclo',rot:'Sale y vuelve al reposo',det:'Al acabar el ensayo el actuador ha salido y está recogido. Un mando que deja viva la orden de avance no cierra el ciclo: con final de carrera el vástago se queda temblando contra el tope y con temporizador vibra al ritmo del scan, pero no vuelve.'},
  {k:'okFalla',rot:'Comportamiento correcto al faltar la tensión',det:'Cada estación exige una cosa distinta al quedarse sin tensión: retirarse, sostener la carga o pararse donde esté. Las tres las decide la válvula, no el programa.'},
  {k:'okArranque',rot:'Sin rearranque al volver la tensión',det:'IEC 60204-1 apartado 7.5: al restablecerse la alimentación la máquina no debe ponerse en marcha por sí sola. Se mide el desplazamiento en los 2 s siguientes sin ninguna acción del operario.'},
  {k:'okModo',rot:'Automático o manual según se pide',det:'Si la estación pide ciclo automático, el retroceso debe producirse sin tocar nada. Si pide mando manual, el retroceso debe esperar la orden de una persona.'},
  {k:'okRitmo',rot:'Ritmo de producción',det:'La cadencia real sale del tiempo eléctrico más la carrera más la pausa de proceso. El temporizador, ajustado al peor caso, tira todos los ciclos el tiempo que no necesita.'},
];

// -------------------- banco de estaciones --------------------
// Los tiempos de carrera son DATO DE BANCO: medidos en la estacion, con su
// dispersion por presion de red (5,0-6,5 bar) y por carga (0-100 %). Este
// laboratorio calcula la parte ELECTRICA del ciclo, no la neumatica.
const POOL=[
  {id:'pinza',nom:'Pinza de sujeción',efecto:'doble',falla:'sostiene',auto:false,manual:true,
   ritmo:0,xTope:1,carrera:25,tOut:420,tIn:380,tOutMin:380,tOutMax:520,pausa:0,vert:false,
   pide:'sostener la pieza aunque se caiga la tensión',
   proc:'la pieza no se puede soltar mientras la fresa está dentro',
   nota:'Carrera corta (25 mm) y ventana del reed de 4 mm: el sensor confirma con un 16 % de la carrera sin recorrer.'},
  {id:'expulsor',nom:'Expulsor de la prensa',efecto:'doble',falla:'retrae',auto:true,manual:false,
   ritmo:2250,xTope:1,carrera:100,tOut:320,tIn:280,tOutMin:290,tOutMax:400,pausa:0.9,vert:false,
   pide:'retirarse si falta la tensión y volver solo, al ritmo de la prensa',
   proc:'la prensa entrega una pieza cada 1,6 s y el expulsor no puede ser el cuello de botella',
   nota:'Posición final repetible y carrera de 100 mm: el final de carrera es fiable y rápido.'},
  {id:'revistero',nom:'Empujador del almacén',efecto:'simple',falla:'retrae',auto:true,manual:false,
   ritmo:860,xTope:0.82,carrera:160,tOut:520,tIn:300,tOutMin:470,tOutMax:640,pausa:2.4,vert:false,
   pide:'retirarse si falta la tensión y volver solo, sin final de carrera posible',
   proc:'el almacén entrega una revista cada 4,2 s',
   nota:'El empujador se detiene contra la pila, y la pila baja según se vacía: la posición final varía entre el 62 % y el 90 % de la carrera (se simula un 82 % representativo). No hay sitio donde poner el reed.'},
  {id:'mesa',nom:'Mesa elevadora',efecto:'doble',falla:'congela',auto:true,manual:false,
   ritmo:270,xTope:1,carrera:400,tOut:900,tIn:700,tOutMin:820,tOutMax:1150,pausa:11.5,vert:true,
   pide:'quedarse donde esté si falta la tensión y volver sola',
   proc:'el robot deposita una capa cada 11,5 s',
   nota:'Carga vertical: si el actuador se suelta, la mesa baja con la carga encima.'},
  {id:'prensa',nom:'Prensa de marcado manual',efecto:'doble',falla:'retrae',auto:false,manual:true,
   ritmo:0,xTope:1,carrera:120,tOut:480,tIn:400,tOutMin:430,tOutMax:590,pausa:0,vert:false,
   pide:'subir si falta la tensión, y que el retroceso lo decida el operario',
   proc:'el operario coloca, marca y comprueba la pieza antes de soltarla',
   nota:'La pieza se coloca a mano bajo la herramienta: la prensa no puede bajar sola nunca.'},
];

// -------------------- utilidades --------------------
function f1(x,d){
  if(!isFinite(x))return '—';
  const n=Number(x).toFixed(d==null?2:d);
  const p=n.split('.');
  p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  return p.join(',');
}
function preset(sc){return Math.round(K_TEMP*sc.tOutMax);}
function coste(cfg){
  return VALV[cfg.valvula].sols+MANDO[cfg.mando].reles+MANDO[cfg.mando].sensores
        +CIERRE[cfg.cierre].reles+CIERRE[cfg.cierre].sensores;
}
function costeDet(cfg){
  const V=VALV[cfg.valvula],M=MANDO[cfg.mando],C=CIERRE[cfg.cierre];
  return {sols:V.sols,reles:M.reles+C.reles,sensores:M.sensores+C.sensores};
}
function cfgWith(cfg,eje,v){const o={valvula:cfg.valvula,mando:cfg.mando,cierre:cfg.cierre};o[eje]=v;return o;}
function opciones(eje){return eje==='valvula'?VALVS:(eje==='mando'?MANDOS:CIERRES);}
function rotEje(eje){return eje==='valvula'?'Válvula':(eje==='mando'?'Mando':'Cierre del ciclo');}
function rotVal(eje,v){return eje==='valvula'?VALV[v].nom:(eje==='mando'?MANDO[v].nom:CIERRE[v].nom);}
function rotCfg(cfg){return VALV[cfg.valvula].abr+' + '+MANDO[cfg.mando].abr+' + '+CIERRE[cfg.cierre].abr;}

// -------------------- simulacion del mando --------------------
function paso(st,cond,on,off){
  if(cond===st.v){st.a=0;return;}
  st.a+=DT;
  if(st.a>=(cond?on:off)){st.v=cond;st.a=0;}
}
function simular(sc,cfg,opt){
  opt=opt||{};
  const cortes=opt.cortes||[];
  const tFin=opt.tFin||T_FIN;
  const V=VALV[cfg.valvula];
  const PT=preset(sc);
  const umb=VENT_REED/sc.carrera;
  const ev=cortes.map(c=>({t0:c[0],t1:c[0]+c[1],xIni:0,xFin:0,mov:0}));
  const tz=opt.traza?[]:null;
  const K1={v:false,a:0},K2={v:false,a:0},B0={v:true,a:0},B1={v:false,a:0};
  let x=0,spool='B',tCmd=0,eT=0,KT=false,dos=0,wms=0,nConm=0;
  let salio=false,tSalio=Infinity,tMedio=Infinity,maxX=0;
  let volvioSolo=false,volvioConOrden=false,tVolvio=Infinity,nCiclos=0,fase=0;
  let Y1=false,Y2=false,U=true;
  for(let t=0;t<=tFin;t+=DT){
    U=true;
    for(let i=0;i<cortes.length;i++)if(t>=cortes[i][0]&&t<cortes[i][0]+cortes[i][1])U=false;
    const S1=(t>=T_MARCHA[0]&&t<T_MARCHA[1])||(opt.doble&&t>=T_DOBLE[0]&&t<T_DOBLE[1]);
    const S3=(t>=T_MARCHA[0]);
    // opt.sinOrden: el ensayo de corte de tension se hace SIN accion del operario,
    // que es lo que exige medir IEC 60204-1 7.5. Si no se suprime la orden de
    // retroceso, un retroceso mandado a mano dentro de la ventana de observacion
    // se contaria como rearranque automatico, que es justo lo contrario.
    const SR=(!opt.sinOrden)&&(t>=T_RETORNO[0]&&t<T_RETORNO[1]);
    const S2n=true;
    // 1) senal de fin de la carrera de trabajo (contactos del scan anterior)
    const FIN=cfg.cierre==='operario'?SR:(cfg.cierre==='fc'?B1.v:KT);
    // 2) ordenes del circuito de mando
    let AV=false,RE=false;
    if(cfg.mando==='momentaneo'){AV=S1;RE=FIN;}
    else if(cfg.mando==='sello'){AV=K1.v;RE=!K1.v;}
    else if(cfg.mando==='mantenido'){AV=S3&&!FIN;RE=!(S3&&!FIN);}
    else{AV=K1.v&&!K2.v;RE=K2.v;}
    // 3) bobinas realmente excitadas
    Y1=U&&AV;
    Y2=U&&RE&&V.sols===2;
    if(Y1&&Y2)dos+=DT;
    wms+=(Y1?P_BOB:0)+(Y2?P_BOB:0);
    // 4) bobinas de los reles del mando
    let cK1=false,cK2=false;
    if(cfg.mando==='sello')cK1=U&&S2n&&(S1||K1.v)&&!FIN;
    else if(cfg.mando==='cadena'){cK1=U&&S2n&&(S1||K1.v)&&!K2.v;cK2=U&&((FIN&&K1.v)||K2.v)&&!B0.v;}
    // 5) temporizador: cuenta mientras la orden de avance se mantiene
    if(cfg.cierre==='temporizador'){if(U&&AV)eT+=DT;else eT=0;KT=eT>=PT;}
    else{eT=0;KT=false;}
    // 6) carrete de la valvula
    let c;
    if(V.sols===1)c=Y1?'A':'B';
    else if(V.memoria)c=(Y1&&!Y2)?'A':((Y2&&!Y1)?'B':spool);
    else c=(Y1&&!Y2)?'A':((Y2&&!Y1)?'B':'C');
    if(c!==spool){
      tCmd+=DT;
      const porBobina=(c==='A')||(c==='B'&&V.sols===2);
      if(tCmd>=(porBobina?T_V_ON:T_V_OFF)){spool=c;tCmd=0;nConm++;}
    }else tCmd=0;
    // 7) actuador
    if(spool==='A')x=Math.min(sc.xTope,x+DT/sc.tOut);
    else if(spool==='B')x=Math.max(0,x-DT/sc.tIn);
    else if(sc.vert)x=Math.max(0,x-DERIVA*DT/1000);
    // 8) sensores reed
    paso(B0,x<=umb,T_REED,T_REED);
    paso(B1,x>=1-umb,T_REED,T_REED);
    // 9) reles del mando
    paso(K1,cK1,T_REL_ON,T_REL_OFF);
    paso(K2,cK2,T_REL_ON,T_REL_OFF);
    // 10) medidas
    if(x>maxX)maxX=x;
    const fuera=x>=sc.xTope-TOL,reposo=x<=TOL;
    if(fuera&&!salio){salio=true;tSalio=t;}
    if(x>=0.5*sc.xTope&&!isFinite(tMedio))tMedio=t;
    if(fuera&&fase===0)fase=1;
    else if(reposo&&fase===1){
      fase=0;nCiclos++;
      if(t<T_RETORNO[0])volvioSolo=true;else volvioConOrden=true;
      if(!isFinite(tVolvio))tVolvio=t;
    }
    for(let i=0;i<ev.length;i++){
      const e=ev[i];
      if(t===e.t0)e.xIni=x;
      if(t===e.t1)e.xFin=x;
      if(t>e.t1&&t<=e.t1+T_OBS){const m=Math.abs(x-e.xFin);if(m>e.mov)e.mov=m;}
    }
    if(tz&&t%20===0)tz.push({t,x,spool,K1:K1.v,K2:K2.v,Y1,Y2,B0:B0.v,B1:B1.v,U,KT});
  }
  return {
    x,salio,tSalio,tMedio,maxX,volvioSolo,volvioConOrden,tVolvio,nCiclos,nConm,
    enReposoFinal:x<=TOL,
    tCicloAuto:volvioSolo?tVolvio-T_MARCHA[0]:Infinity,
    tElectrico:isFinite(tSalio)?tSalio-T_MARCHA[0]:Infinity,
    dos,wh:wms/1000/3600,ev,tz,PT,umb,
  };
}

// -------------------- evaluacion de una propuesta --------------------
function evalCfg(sc,cfg){
  const V=VALV[cfg.valvula];
  const A=simular(sc,cfg,{});
  const tMid=isFinite(A.tMedio)?A.tMedio:1000;
  const tCut2=isFinite(A.tSalio)?A.tSalio+200:3000;
  const B1s=simular(sc,cfg,{cortes:[[tMid,T_CORTE]],tFin:tMid+T_CORTE+T_OBS,sinOrden:true});
  const B2s=simular(sc,cfg,{cortes:[[tCut2,T_CORTE]],tFin:tCut2+T_CORTE+T_OBS,sinOrden:true});
  const e1=B1s.ev[0],e2=B2s.ev[0];
  const retrajo=e1.xFin<=TOL;
  const siguio=e1.xFin>=sc.xTope-TOL&&e1.xIni<sc.xTope-TOL;
  const quedo=Math.abs(e1.xFin-e1.xIni)<=TOL_CONG;
  const sostuvo=e2.xFin>=sc.xTope-TOL;
  const movTras=e1.mov>TOL_MOV||e2.mov>TOL_MOV;
  const ciclosH=isFinite(A.tCicloAuto)?3600/(A.tCicloAuto/1000+sc.pausa):0;
  const C=simular(sc,cfg,{doble:true});
  const r={
    okEfecto:V.efecto===sc.efecto,
    okSalida:A.salio,
    okCiclo:A.salio&&A.enReposoFinal&&(A.volvioSolo||A.volvioConOrden),
    okFalla:sc.falla==='retrae'?retrajo:(sc.falla==='congela'?quedo:sostuvo),
    okArranque:!movTras,
    okModo:sc.auto?A.volvioSolo:(sc.manual?(!A.volvioSolo&&A.volvioConOrden):true),
    okRitmo:sc.ritmo>0?ciclosH>=sc.ritmo:true,
    retrajo,siguio,quedo,sostuvo,movTras,ciclosH,
    tCiclo:A.tCicloAuto,tElectrico:A.tElectrico,nCiclos:A.nCiclos,nConm:A.nConm,
    salio:A.salio,maxX:A.maxX,x:A.x,volvioSolo:A.volvioSolo,volvioConOrden:A.volvioConOrden,
    enReposoFinal:A.enReposoFinal,dosBobinas:C.dos,wh:A.wh,PT:A.PT,umb:A.umb,
    xCorteIni:e1.xIni,xCorteFin:e1.xFin,movTras1:e1.mov,movTras2:e2.mov,xCorte2:e2.xFin,
    tCorte1:tMid,tCorte2:tCut2,coste:coste(cfg),
  };
  r.vale=CRIT.every(cr=>r[cr.k]);
  return r;
}

// -------------------- barrido, minimo y calificacion --------------------
function todasCfg(){
  const out=[];
  VALVS.forEach(v=>MANDOS.forEach(m=>CIERRES.forEach(c=>out.push({valvula:v,mando:m,cierre:c}))));
  return out;
}
const _cacheGood={};
function GOOD(sc){
  if(_cacheGood[sc.id])return _cacheGood[sc.id];
  let best=null,bc=Infinity;
  todasCfg().forEach(cfg=>{
    const e=evalCfg(sc,cfg);
    if(!e.vale)return;
    const k=coste(cfg);
    if(k<bc){bc=k;best=cfg;}
  });
  _cacheGood[sc.id]=best;
  return best;
}
function costeMin(sc){return coste(GOOD(sc));}
function okEje(sc,eje,v){
  const g=GOOD(sc);
  if(!g)return false;
  const cfg=cfgWith(g,eje,v);
  const e=evalCfg(sc,cfg);
  return e.vale&&coste(cfg)===costeMin(sc);
}
// El primer criterio que falla, en el orden de CRIT: es el que se le ensena al
// alumno. Que porQue() se apoye en esta funcion garantiza que el diagnostico
// mostrado y la tabla de criterios no puedan desincronizarse.
function primerFallo(e){
  for(let i=0;i<CRIT.length;i++)if(!e[CRIT[i].k])return CRIT[i].k;
  return null;
}
function motivo(sc,e,nom){
  const k=primerFallo(e);
  if(k==='okEfecto')return nom+': el cilindro de la estación es de '+sc.efecto+' efecto y esta válvula es para el otro.';
  if(k==='okSalida')return nom+': el actuador no llega al final de su carrera (se queda en el '+f1(100*e.maxX,0)+' %). La orden se apaga antes de tiempo.';
  if(k==='okCiclo')return nom+': el ciclo no cierra. El actuador acaba el ensayo fuera, en el '+f1(100*e.x,0)+
    ' % de la carrera, después de '+f1(e.nConm,0)+' conmutaciones del carrete: la orden de avance nunca se apaga del todo.';
  if(k==='okFalla'){
    const q=e.retrajo?'se retrae':(e.siguio?'termina el movimiento y se queda fuera':'se queda donde está');
    const p=sc.falla==='retrae'?'retirarse':(sc.falla==='congela'?'pararse donde esté':'sostener la carga');
    return nom+': al faltar la tensión '+q+', y esta estación necesita '+p+'.';
  }
  if(k==='okArranque')return nom+': al volver la tensión el actuador se mueve solo ('+f1(100*Math.max(e.movTras1,e.movTras2),0)+' % de la carrera). IEC 60204-1 7.5 lo prohíbe.';
  if(k==='okModo')return nom+': la estación pide ciclo '+(sc.auto?'automático y el retroceso espera a una persona':'manual y el retroceso se dispara solo')+'.';
  if(k==='okRitmo')return nom+': solo da '+f1(e.ciclosH,0)+' ciclos/h y la estación pide '+f1(sc.ritmo,0)+'.';
  return '';
}
function porQue(sc,eje,v){
  const g=GOOD(sc);
  const cfg=cfgWith(g,eje,v);
  const e=evalCfg(sc,cfg);
  const m=motivo(sc,e,rotVal(eje,v));
  if(m)return m;
  if(coste(cfg)>costeMin(sc))return rotVal(eje,v)+': funciona, pero cuesta '+coste(cfg)+' aparatos frente a los '+costeMin(sc)+' de la solución mínima.';
  return '';
}
function startCfg(sc){
  const g=GOOD(sc);
  const mal=eje=>opciones(eje).find(v=>v!==g[eje]);
  return {valvula:mal('valvula'),mando:mal('mando'),cierre:mal('cierre')};
}

// ===================== 3. LECTURA HONESTA DEL ENSAYO =====================
/* evalCfg() devuelve criterios booleanos, pero el alumno tiene que ver QUÉ pasa
   en el banco, no sólo que algo falla. Estas tres funciones redactan el ensayo
   tal como sale de la simulación, sin suavizarlo. Los tres desenlaces que más
   se confunden son:
     · el selector mantenido con final de carrera NO cicla sin parar: el vástago
       se queda temblando contra el tope (160-185 conmutaciones del carrete) y
       nunca vuelve al reposo;
     · donde la ventana del reed pesa mucho (la pinza: 4 mm de ventana en 25 mm
       de carrera, un 16 %) ese temblor impide incluso completar la carrera y el
       vástago se queda en el 89-91 %;
     · donde el reed no es alcanzable (el empujador del almacén se detiene en el
       82 % de la carrera y el reed pide un 97,5 %) no hay temblor: el vástago se
       queda clavado empujando la pila con una sola conmutación. */
const TEMBLOR=10;   // conmutaciones del carrete a partir de las cuales hay temblor, no maniobra
function finTxt(sc,e){
  if(e.salio&&e.enReposoFinal)return e.volvioSolo?'sale y vuelve solo al reposo':'sale y vuelve cuando lo ordena el operario';
  if(!e.salio&&e.nConm>=TEMBLOR)return 'no llega al final: se queda en el '+f1(100*e.maxX,0)+' % temblando contra la carga, '+f1(e.nConm,0)+' conmutaciones del carrete';
  if(!e.salio)return 'no llega al final de la carrera: se queda en el '+f1(100*e.maxX,0)+' %';
  if(e.nConm>=TEMBLOR)return 'se queda fuera, en el '+f1(100*e.x,0)+' %, temblando contra el tope: '+f1(e.nConm,0)+' conmutaciones del carrete en los '+f1(T_FIN/1000,0)+' s del ensayo';
  return 'se queda fuera, clavado en el '+f1(100*e.x,0)+' % de la carrera, con '+f1(e.nConm,0)+' conmutación del carrete';
}
function cortaTxt(sc,e){
  if(e.retrajo)return 'el actuador se retrae hasta el reposo';
  if(e.siguio)return 'el actuador termina el movimiento y se queda fuera';
  return 'el actuador se para donde está (se mueve un '+f1(100*Math.abs(e.xCorteFin-e.xCorteIni),0)+' % durante el corte)';
}
function arranqueTxt(sc,e){
  const m=Math.max(e.movTras1,e.movTras2);
  return e.okArranque
    ? 'al volver la tensión no se mueve ('+f1(100*m,1)+' % de la carrera en 2 s)'
    : 'al volver la tensión arranca solo y recorre un '+f1(100*m,0)+ ' % de la carrera sin que nadie toque nada';
}
function ritmoTxt(sc,e){
  if(sc.ritmo<=0)return 'estación manual: no se le pide cadencia';
  if(!isFinite(e.tCiclo))return 'no cierra el ciclo por sí sola, así que no da ninguna cadencia';
  return f1(e.ciclosH,0)+' ciclos/h frente a los '+f1(sc.ritmo,0)+' que pide el proceso';
}

// ===================== 4. TRAZAS PARA LA ANIMACIÓN Y LOS CRONOGRAMAS =====================
/* simular() ya devuelve la traza muestreada a 20 ms cuando se le pide: 401
   muestras que cubren los 8 000 ms del ensayo. La animación no cronometra el
   banco, reproduce esa traza en ANIM_CICLO segundos de reloj. */
const ANIM_CICLO=9.0;
const DT_TZ=20;
function frameEn(tz,tms){
  const i=Math.max(0,Math.min(tz.length-1,Math.round(tms/DT_TZ)));
  return tz[i];
}

// ===================== 5. ESTADO =====================
let mode='valvula';
let vlIdx=0, vlVal='mono5_2';
let mnIdx=1, mnMan='momentaneo';
let ciIdx=1, ciCie='operario';
let retoK=0, retoCh=null;
let retoChecked=false, retoOkValvula=false, retoOkMando=false, retoOkCierre=false, retoSolved=false, retoMsg='';
let solved=false, autoRunning=false, QUIZ={};
let animT=0;

function pickIdx(n,ex){if(n<=1)return 0;let i=ex;while(i===ex)i=Math.floor(Math.random()*n);return i;}
function hexA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}

const retoSc=()=>POOL[retoK];
const retoCfg=()=>({valvula:retoCh.valvula,mando:retoCh.mando,cierre:retoCh.cierre});
function seedReto(k){
  retoK=(k==null)?pickIdx(POOL.length,retoK):k;
  retoCh=startCfg(retoSc());
  retoChecked=false;retoOkValvula=false;retoOkMando=false;retoOkCierre=false;retoSolved=false;retoMsg='';
}
seedReto(0);

function curSc(){
  if(mode==='valvula')return POOL[vlIdx];
  if(mode==='mando')return POOL[mnIdx];
  if(mode==='cierre')return POOL[ciIdx];
  return retoSc();
}
/* En cada modo de exploración se aísla UN eje: los otros dos se mantienen en el
   valor de la solución mínima, para que lo que se observe sea consecuencia del
   eje que se toca y de nada más. En el reto los tres están sin elegir. */
function curCfg(){
  const sc=curSc(), g=GOOD(sc);
  if(mode==='valvula')return cfgWith(g,'valvula',vlVal);
  if(mode==='mando')return cfgWith(g,'mando',mnMan);
  if(mode==='cierre')return cfgWith(g,'cierre',ciCie);
  return retoCfg();
}
const cfgKey=(sc,cfg)=>sc.id+'|'+cfg.valvula+'|'+cfg.mando+'|'+cfg.cierre;
/* evalCfg() encadena cuatro simulaciones de 8 000 pasos. La animación pide el
   estado 60 veces por segundo, así que se memoriza por configuración: mientras
   no se toque ningún botón, el resultado es el mismo objeto. */
let _evK='',_ev=null;
function curEval(){
  const sc=curSc(), cfg=curCfg(), k=cfgKey(sc,cfg);
  if(k!==_evK){_evK=k;_ev=evalCfg(sc,cfg);}
  return _ev;
}
let _tzK='',_tz=null;
function curTZ(){
  const sc=curSc(), cfg=curCfg(), k=cfgKey(sc,cfg);
  if(k!==_tzK){_tzK=k;_tz=simular(sc,cfg,{traza:true}).tz;}
  return _tz;
}
/* Traza del ensayo de corte de tensión: el mismo corte que mide evalCfg() para
   okFalla y okArranque, con la misma supresión de la orden del operario. */
let _tcK='',_tc=null;
function curTC(){
  const sc=curSc(), cfg=curCfg(), e=curEval(), k=cfgKey(sc,cfg);
  if(k!==_tcK){
    _tcK=k;
    const t0=e.tCorte1;
    _tc={t0,t1:t0+T_CORTE,tFin:t0+T_CORTE+T_OBS,
         tz:simular(sc,cfg,{cortes:[[t0,T_CORTE]],tFin:t0+T_CORTE+T_OBS,sinOrden:true,traza:true}).tz};
  }
  return _tc;
}

// ===================== 6. MATERIALES =====================
function std(color,rough,metal){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function brush(base){return std(base,0.55,0.35);}
const MAT={
  bench:brush(0x2b2f34), frame:brush(0x22262c), leg:brush(0x14161b),
  barrel:std(0x9aa4b2,0.35,0.75), rod:std(0xd6dde8,0.22,0.9), tapa:std(0x6f7885,0.4,0.7),
  valve:std(0x14171b,0.5,0.3), spool:std(0xb9c3d1,0.3,0.85), plate:brush(0x3a4048),
  bobina:std(0x8a5a2b,0.6,0.2), carga:std(0x3a2f24,0.7,0.15), post:brush(0x2a3038),
  tuboP:std(0x8f97a5,0.45,0.5), tuboA:std(0x4a90d9,0.4,0.4), tuboB:std(0xC08CF8,0.4,0.4),
  cable:std(0x2a2f36,0.6,0.2), rele:std(0x1a1f26,0.5,0.3), boton:std(0x2a3038,0.5,0.3),
};
const AZUL='#8AB4F8', OK_HEX='#7CD992', BAD_HEX='#ff6b6b', WARN_HEX='#E9C46A', VIO='#C08CF8', GRIS='#8f97a5';
const NARANJA='#F2A65A';

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

// ===================== 7. PIZARRÓN =====================
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
function nota(c,y,txt,col,h){
  const hh=h||78;
  c.fillStyle=hexA(col||WARN_HEX,0.10);c.fillRect(30,y,650,hh);
  c.strokeStyle=hexA(col||WARN_HEX,0.45);c.lineWidth=1;c.strokeRect(30.5,y+0.5,649,hh-1);
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
function texto(c,t,x,y,col,font,align){
  c.fillStyle=col||'#F4EFEA';c.font=font||'12px Outfit, sans-serif';
  c.textAlign=align||'center';c.textBaseline='middle';c.fillText(t,x,y);
}
function linea(c,x1,y1,x2,y2,col,dash,lw){
  c.save();c.strokeStyle=col;c.lineWidth=lw||2;if(dash)c.setLineDash(dash);
  c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore();
}

// ===================== 8. SÍMBOLOS ISO 1219-1 =====================
/* Una válvula se dibuja con tantos cuadros como posiciones tenga. Dentro de
   cada cuadro van las vías de ESA posición; el cuadro alineado con las
   conexiones es la posición actual del carrete. Los pilotajes van a los lados:
   solenoide (rectángulo con diagonal) o muelle (zigzag). */
function glifo(c,bx,by,bw,bh,g,col){
  const x1=bx+bw*0.30, x2=bx+bw*0.70, yT=by+9, yB=by+bh-9;
  c.save();c.strokeStyle=col;c.lineWidth=2;c.fillStyle=col;
  const flecha=(xa,ya,xb,yb)=>{
    c.beginPath();c.moveTo(xa,ya);c.lineTo(xb,yb);c.stroke();
    const a=Math.atan2(yb-ya,xb-xa);
    c.beginPath();c.moveTo(xb,yb);
    c.lineTo(xb-8*Math.cos(a-0.42),yb-8*Math.sin(a-0.42));
    c.lineTo(xb-8*Math.cos(a+0.42),yb-8*Math.sin(a+0.42));
    c.closePath();c.fill();
  };
  const tope=(xa,ya,dir)=>{
    c.beginPath();c.moveTo(xa,ya);c.lineTo(xa,ya+dir*8);c.stroke();
    c.beginPath();c.moveTo(xa-6,ya+dir*8);c.lineTo(xa+6,ya+dir*8);c.stroke();
  };
  if(g==='par'){flecha(x1,yB,x1,yT);flecha(x2,yT,x2,yB);}
  else if(g==='cruz'){flecha(x1,yB,x2,yT);flecha(x2,yB,x1,yT);}
  else if(g==='paso'){flecha(bx+bw/2,yB,bx+bw/2,yT);}
  else if(g==='esc'){flecha(bx+bw/2,yT,bx+bw/2,yB);}
  else{tope(x1,yT,1);tope(x2,yT,1);tope(x1,yB,-1);tope(x2,yB,-1);}
  c.restore();
}
function muelle(c,x,y,w,h,col){
  c.save();c.strokeStyle=col;c.lineWidth=1.6;c.beginPath();
  c.moveTo(x,y+h/2);
  for(let i=0;i<4;i++){c.lineTo(x+w*(i+0.25)/4,y+3);c.lineTo(x+w*(i+0.75)/4,y+h-3);}
  c.lineTo(x+w,y+h/2);c.stroke();c.restore();
}
function solen(c,x,y,w,h,on,rot){
  c.fillStyle=on?hexA(OK_HEX,0.22):'rgba(255,255,255,0.03)';
  c.fillRect(x,y,w,h);
  c.strokeStyle=on?OK_HEX:GRIS;c.lineWidth=on?2.4:1.5;c.strokeRect(x+0.5,y+0.5,w-1,h-1);
  c.beginPath();c.moveTo(x+4,y+h-4);c.lineTo(x+w-4,y+4);c.stroke();
  if(rot)texto(c,rot,x+w/2,y-12,on?OK_HEX:GRIS,'bold 12px Outfit, sans-serif');
}
const GLIFOS={
  mono3_2:{cajas:['A','B'],g:{A:'paso',B:'esc'}},
  mono5_2:{cajas:['A','B'],g:{A:'par',B:'cruz'}},
  bies5_2:{cajas:['A','B'],g:{A:'par',B:'cruz'}},
  centros5_3:{cajas:['A','C','B'],g:{A:'par',C:'cerr',B:'cruz'}},
};
/* w es el ancho de UN cuadro; el símbolo completo mide w·nCajas. */
function simbValv(c,x,y,w,h,vid,spool,Y1,Y2){
  const V=VALV[vid], G=GLIFOS[vid], n=G.cajas.length;
  G.cajas.forEach((k,i)=>{
    const bx=x+i*w, act=(k===spool);
    c.fillStyle=act?hexA(AZUL,0.13):'rgba(255,255,255,0.025)';
    c.fillRect(bx,y,w,h);
    c.strokeStyle=act?AZUL:'rgba(255,255,255,0.22)';c.lineWidth=act?2.5:1.2;
    c.strokeRect(bx+0.5,y+0.5,w-1,h-1);
    glifo(c,bx,y,w,h,G.g[k],act?'#F4EFEA':'rgba(255,255,255,0.28)');
  });
  const act=Math.max(0,G.cajas.indexOf(spool)), ax=x+act*w;
  const puertos=(vid==='mono3_2')
    ? [['A',ax+w*0.5,y,-1],['1 P',ax+w*0.5,y+h,1],['3 R',ax+w*0.24,y+h,1]]
    : [['4 A',ax+w*0.30,y,-1],['2 B',ax+w*0.70,y,-1],['1 P',ax+w*0.5,y+h,1],['5 R',ax+w*0.12,y+h,1],['3 S',ax+w*0.88,y+h,1]];
  puertos.forEach(([rot,px,py,dir])=>{
    linea(c,px,py,px,py+dir*12,GRIS,null,1.6);
    texto(c,rot,px,py+dir*24,GRIS,'11px Outfit, sans-serif');
  });
  solen(c,x-26,y+h*0.25,22,h*0.5,Y1,'Y1');
  if(V.sols===2)solen(c,x+n*w+4,y+h*0.25,22,h*0.5,Y2,'Y2');
  else muelle(c,x+n*w+4,y+h*0.28,24,h*0.44,GRIS);
  if(V.centro){muelle(c,x-52,y+h*0.30,22,h*0.4,GRIS);muelle(c,x+n*w+32,y+h*0.30,22,h*0.4,GRIS);}
  texto(c,V.nom,x+n*w/2,y+h+46,AZUL,'bold 14px Outfit, sans-serif');
}
/* Cilindro con el émbolo en la posición frac (0 = recogido) y sus dos reed. */
function simbCil(c,x,y,w,h,frac,efecto,rot,B0,B1){
  const bw=w*0.66, px=x+8+(bw-24)*Math.max(0,Math.min(1,frac));
  c.fillStyle='rgba(255,255,255,0.03)';c.fillRect(x,y,bw,h);
  c.strokeStyle=GRIS;c.lineWidth=2;c.strokeRect(x+0.5,y+0.5,bw,h);
  c.fillStyle=hexA(AZUL,0.13);c.fillRect(x+1,y+1,px-x-1,h-2);
  if(efecto==='simple')muelle(c,px+12,y+5,Math.max(10,bw-(px-x)-16),h-10,GRIS);
  c.fillStyle='#d6dde8';c.fillRect(px,y+3,11,h-6);
  linea(c,px+11,y+h/2,x+w,y+h/2,'#d6dde8',null,5);
  c.fillStyle=hexA(WARN_HEX,0.30);c.fillRect(x+w,y+1,17,h-2);
  c.strokeStyle=WARN_HEX;c.lineWidth=1.5;c.strokeRect(x+w+0.5,y+1.5,16,h-3);
  [[x+11,B0,'B0'],[x+bw-11,B1,'B1']].forEach(([sx,on,r])=>{
    c.fillStyle=on?OK_HEX:'rgba(255,255,255,0.16)';
    c.beginPath();c.arc(sx,y-8,5,0,Math.PI*2);c.fill();
    texto(c,r,sx,y-22,on?OK_HEX:GRIS,'11px Outfit, sans-serif');
  });
  if(rot)texto(c,rot,x+bw/2,y+h+18,GRIS,'12px Outfit, sans-serif');
}

// ===================== 9. ESQUEMA ELÉCTRICO IEC 60617 =====================
/* Escalera: dos carriles verticales (L+ 24 V a la izquierda, M a la derecha) y
   un peldaño por ecuación lógica. Los contactos van a la izquierda y la bobina
   pegada al carril de retorno. Los peldaños están numerados en el mismo orden
   en que el motor los resuelve, que es el orden del scan: primero la señal de
   fin de carrera, después las órdenes, después las bobinas de las
   electroválvulas, después las bobinas de los relés y por último el
   temporizador. Esa demora de un scan es la que hace que un relé no vea su
   propio contacto hasta el ciclo siguiente. */
const RAIL0=64, RAIL1=662;
function contacto(c,cx,y,tipo,nc,on,rot){
  const col=on?OK_HEX:GRIS;
  c.save();c.strokeStyle=col;c.lineWidth=on?2.6:1.8;
  c.beginPath();c.moveTo(cx-8,y-11);c.lineTo(cx-8,y+11);c.stroke();
  c.beginPath();c.moveTo(cx+8,y-11);c.lineTo(cx+8,y+11);c.stroke();
  if(nc){c.beginPath();c.moveTo(cx-13,y+9);c.lineTo(cx+13,y-9);c.stroke();}
  if(tipo==='pb'){
    c.beginPath();c.moveTo(cx,y-11);c.lineTo(cx,y-19);c.stroke();
    c.beginPath();c.moveTo(cx-7,y-19);c.lineTo(cx+7,y-19);c.stroke();
  }else if(tipo==='sel'){
    c.beginPath();c.moveTo(cx,y-11);c.lineTo(cx,y-16);c.stroke();
    c.beginPath();c.moveTo(cx-8,y-22);c.lineTo(cx+8,y-15);c.stroke();
  }else if(tipo==='sens'){
    c.beginPath();c.arc(cx,y-17,5,0,Math.PI*2);c.stroke();
    c.beginPath();c.moveTo(cx,y-12);c.lineTo(cx,y-11);c.stroke();
  }
  c.restore();
  if(rot)texto(c,rot,cx,y+24,col,'11px Outfit, sans-serif');
}
function bobina(c,cx,y,tipo,on,rot){
  const col=on?OK_HEX:GRIS;
  c.save();c.strokeStyle=col;c.lineWidth=on?2.6:1.8;
  c.beginPath();c.arc(cx,y,12,Math.PI/2.3,-Math.PI/2.3);c.stroke();
  c.beginPath();c.arc(cx,y,12,Math.PI+Math.PI/2.3,Math.PI-Math.PI/2.3);c.stroke();
  if(tipo==='timer'){
    c.beginPath();c.moveTo(cx-5,y-5);c.lineTo(cx+5,y-5);c.moveTo(cx,y-5);c.lineTo(cx,y+5);c.stroke();
  }else if(tipo==='sol'){
    c.beginPath();c.moveTo(cx-7,y+6);c.lineTo(cx+7,y-6);c.stroke();
  }
  c.restore();
  if(rot)texto(c,rot,cx,y+26,col,'bold 11px Outfit, sans-serif');
}
/* Un elemento es {t:'na'|'pb'|'sel'|'sens', nc:bool, on:bool, rot:''}.
   Un elemento puede ser {par:[rama,rama]} y cada rama es una lista de
   elementos en serie: así se dibuja un sello o una memoria de dos relés. */
function pesoEl(it){return it.par?Math.max(1.5,...it.par.map(b=>b.length)):1;}
function drawLadder(c,rungs,y0,dy){
  const yF=y0+(rungs.length-1)*dy;
  linea(c,RAIL0,y0-32,RAIL0,yF+32,AZUL,null,2.5);
  linea(c,RAIL1,y0-32,RAIL1,yF+32,AZUL,null,2.5);
  texto(c,'L+ 24 V CD',RAIL0+6,y0-44,AZUL,'bold 12px Outfit, sans-serif');
  texto(c,'M',RAIL1,y0-44,AZUL,'bold 12px Outfit, sans-serif');
  const xC=RAIL1-56;
  rungs.forEach((r,ri)=>{
    const y=y0+ri*dy;
    const x0=RAIL0+30, x1=xC-46;
    const pesos=r.els.map(pesoEl), tot=pesos.reduce((a,b)=>a+b,0), u=(x1-x0)/tot;
    linea(c,RAIL0,y,x0,y,GRIS,null,1.5);
    let xa=x0;
    r.els.forEach((it,i)=>{
      const xb=xa+u*pesos[i], cx=(xa+xb)/2;
      if(it.par){
        const off=19;
        linea(c,xa,y,xa+9,y,GRIS,null,1.5);
        linea(c,xb-9,y,xb,y,GRIS,null,1.5);
        linea(c,xa+9,y-off,xa+9,y+off,GRIS,null,1.5);
        linea(c,xb-9,y-off,xb-9,y+off,GRIS,null,1.5);
        it.par.forEach((br,bi)=>{
          const yy=y+(bi===0?-off:off), ub=(xb-18-(xa))/br.length;
          linea(c,xa+9,yy,xb-9,yy,GRIS,null,1.5);
          br.forEach((e,j)=>{
            const ecx=xa+9+ub*(j+0.5);
            contacto(c,ecx,yy,e.t,e.nc,e.on,null);
            texto(c,e.rot,ecx,yy+(bi===0?-27:27),e.on?OK_HEX:GRIS,'11px Outfit, sans-serif');
          });
        });
      }else{
        linea(c,xa,y,cx-8,y,GRIS,null,1.5);
        linea(c,cx+8,y,xb,y,GRIS,null,1.5);
        contacto(c,cx,y,it.t,it.nc,it.on,it.rot);
      }
      xa=xb;
    });
    linea(c,x1,y,xC-12,y,GRIS,null,1.5);
    linea(c,xC+12,y,RAIL1,y,GRIS,null,1.5);
    bobina(c,xC,y,r.out.t,r.out.on,r.out.rot);
    texto(c,String(ri+1),RAIL0-18,y,'rgba(255,255,255,0.35)','11px Outfit, sans-serif');
    if(r.det)texto(c,r.det,x0,y+(dy>60?42:34),GRIS,'11px Outfit, sans-serif','left');
  });
  return yF+34;
}
/* Reconstrucción de las señales que el motor calcula dentro del bucle y que la
   traza no guarda: los pulsadores dependen sólo del reloj y FIN/AV/RE salen de
   las mismas expresiones de simular(). */
function senales(sc,cfg,fr,sinOrden){
  const t=fr.t;
  const S1=(t>=T_MARCHA[0]&&t<T_MARCHA[1]);
  const S3=(t>=T_MARCHA[0]);
  const SR=(!sinOrden)&&(t>=T_RETORNO[0]&&t<T_RETORNO[1]);
  const FIN=cfg.cierre==='operario'?SR:(cfg.cierre==='fc'?fr.B1:fr.KT);
  let AV=false,RE=false;
  if(cfg.mando==='momentaneo'){AV=S1;RE=FIN;}
  else if(cfg.mando==='sello'){AV=fr.K1;RE=!fr.K1;}
  else if(cfg.mando==='mantenido'){AV=S3&&!FIN;RE=!(S3&&!FIN);}
  else{AV=fr.K1&&!fr.K2;RE=fr.K2;}
  return {S1,S3,SR,FIN,AV,RE};
}
const FINROT={operario:'S4',fc:'B1',temporizador:'KT'};
const FINTIPO={operario:'pb',fc:'sens',temporizador:'na'};
function elFin(cfg,g,nc){return {t:FINTIPO[cfg.cierre],nc:!!nc,on:g.FIN,rot:FINROT[cfg.cierre]};}
/* Los peldaños son la traducción literal de los pasos 2, 4 y 5 de simular(). */
function rungsDe(sc,cfg,fr,sinOrden){
  const g=senales(sc,cfg,fr,sinOrden), V=VALV[cfg.valvula];
  const R=[];
  const detY2=V.sols===2?null:'válvula monoestable: no hay Y2, el muelle repone el carrete';
  if(cfg.mando==='momentaneo'){
    R.push({els:[{t:'pb',on:g.S1,rot:'S1 marcha'}],out:{t:'sol',on:fr.Y1,rot:'Y1'},
            det:'la orden dura lo que dura el dedo sobre el pulsador'});
    R.push({els:[elFin(cfg,g)],out:{t:'sol',on:fr.Y2,rot:'Y2'},det:detY2});
  }else if(cfg.mando==='sello'){
    R.push({els:[{par:[[{t:'pb',on:g.S1,rot:'S1 marcha'}],[{t:'na',on:fr.K1,rot:'K1 sello'}]]},
                 {t:'pb',nc:true,on:true,rot:'S2 paro'},elFin(cfg,g,true)],
            out:{t:'rel',on:fr.K1,rot:'K1'},
            det:'K1 se sostiene por su propio contacto; la señal de fin de carrera lo suelta'});
    R.push({els:[{t:'na',on:fr.K1,rot:'K1'}],out:{t:'sol',on:fr.Y1,rot:'Y1'}});
    R.push({els:[{t:'na',nc:true,on:fr.K1,rot:'K1'}],out:{t:'sol',on:fr.Y2,rot:'Y2'},det:detY2});
  }else if(cfg.mando==='mantenido'){
    R.push({els:[{t:'sel',on:g.S3,rot:'S3 selector'},elFin(cfg,g,true)],
            out:{t:'sol',on:fr.Y1,rot:'Y1'},
            det:'mientras el selector siga cerrado, en cuanto se suelte el fin de carrera vuelve a haber avance'});
    R.push({els:[{par:[[{t:'sel',nc:true,on:g.S3,rot:'S3'}],[elFin(cfg,g)]]}],
            out:{t:'sol',on:fr.Y2,rot:'Y2'},det:detY2});
  }else{
    R.push({els:[{par:[[{t:'pb',on:g.S1,rot:'S1 marcha'}],[{t:'na',on:fr.K1,rot:'K1'}]]},
                 {t:'pb',nc:true,on:true,rot:'S2 paro'},{t:'na',nc:true,on:fr.K2,rot:'K2'}],
            out:{t:'rel',on:fr.K1,rot:'K1 ida'}});
    R.push({els:[{par:[[elFin(cfg,g),{t:'na',on:fr.K1,rot:'K1'}],[{t:'na',on:fr.K2,rot:'K2'}]]},
                 {t:'sens',nc:true,on:fr.B0,rot:'B0'}],
            out:{t:'rel',on:fr.K2,rot:'K2 vuelta'},
            det:'K2 memoriza que ya llegó y sólo cae cuando B0 confirma el reposo'});
    R.push({els:[{t:'na',on:fr.K1,rot:'K1'},{t:'na',nc:true,on:fr.K2,rot:'K2'}],
            out:{t:'sol',on:fr.Y1,rot:'Y1'}});
    R.push({els:[{t:'na',on:fr.K2,rot:'K2'}],out:{t:'sol',on:fr.Y2,rot:'Y2'},det:detY2});
  }
  if(cfg.cierre==='temporizador'){
    R.push({els:[{t:'na',on:g.AV,rot:'AV · la misma orden que Y1'}],
            out:{t:'timer',on:fr.KT,rot:'KT '+f1(preset(sc),0)+' ms'},
            det:'el temporizador cuenta sólo mientras la orden de avance se mantiene: si cae, se pone a cero'});
  }
  return R;
}

// ===================== 10. CRONOGRAMAS =====================
function crono(c,x,y,w,h,tz,filas,tau,tMax){
  const LW=96, px0=x+LW, pw=w-LW, rh=h/filas.length;
  c.fillStyle='rgba(255,255,255,0.03)';c.fillRect(px0,y,pw,h);
  c.strokeStyle='rgba(255,255,255,0.12)';c.lineWidth=1;c.strokeRect(px0+0.5,y+0.5,pw-1,h-1);
  for(let s=1;s*1000<tMax;s++){
    const gx=px0+pw*(s*1000/tMax);
    linea(c,gx,y,gx,y+h,'rgba(255,255,255,0.07)',null,1);
    texto(c,s+' s',gx,y+h+12,'rgba(255,255,255,0.32)','10px Outfit, sans-serif');
  }
  filas.forEach((f,i)=>{
    const yT=y+i*rh+6, yB=y+(i+1)*rh-6, col=f.col||AZUL;
    texto(c,f.rot,x+LW-12,y+i*rh+rh/2,col,'12px Outfit, sans-serif','right');
    if(i)linea(c,px0,y+i*rh,px0+pw,y+i*rh,'rgba(255,255,255,0.07)',null,1);
    c.save();c.strokeStyle=col;c.lineWidth=1.8;c.beginPath();
    let py=null;
    for(let k=0;k<tz.length;k++){
      const fr=tz[k];
      if(fr.t>tMax)break;
      const gx=px0+pw*(fr.t/tMax);
      const v=f.ana?Math.max(0,Math.min(1,f.get(fr))):(f.get(fr)?1:0);
      const gy=yB-(yB-yT)*v;
      if(py===null)c.moveTo(gx,gy);
      else if(f.ana)c.lineTo(gx,gy);
      else{c.lineTo(gx,py);c.lineTo(gx,gy);}
      py=gy;
    }
    c.stroke();c.restore();
  });
  if(tau!=null){
    const cx=px0+pw*Math.max(0,Math.min(1,tau/tMax));
    linea(c,cx,y-4,cx,y+h+4,'#F4EFEA',[4,3],1.5);
  }
  return y+h+18;
}
/* Ensayo de corte de tensión: la banda roja es el tiempo sin alimentación y la
   franja siguiente es la ventana de 2 s en la que IEC 60204-1 §7.5 exige que la
   máquina no se ponga en marcha sola. El ensayo se hace sin que el operario
   toque nada: si no, un retroceso mandado a mano se confundiría con un
   rearranque automático. */
function plotCorte(c,x,y,w,h,tc){
  const tz=tc.tz, tMax=tc.tFin, gx=t=>x+w*(t/tMax);
  c.fillStyle='rgba(255,255,255,0.03)';c.fillRect(x,y,w,h);
  c.strokeStyle='rgba(255,255,255,0.12)';c.lineWidth=1;c.strokeRect(x+0.5,y+0.5,w-1,h-1);
  c.fillStyle=hexA(BAD_HEX,0.16);c.fillRect(gx(tc.t0),y+1,gx(tc.t1)-gx(tc.t0),h-2);
  c.fillStyle=hexA(WARN_HEX,0.08);c.fillRect(gx(tc.t1),y+1,gx(tc.tFin)-gx(tc.t1),h-2);
  texto(c,'sin tensión',(gx(tc.t0)+gx(tc.t1))/2,y+13,BAD_HEX,'11px Outfit, sans-serif');
  texto(c,'ventana de observación · 2 s',(gx(tc.t1)+gx(tc.tFin))/2,y+13,WARN_HEX,'11px Outfit, sans-serif');
  c.save();c.strokeStyle=AZUL;c.lineWidth=2;c.beginPath();
  tz.forEach((fr,k)=>{
    const px=gx(fr.t), py=y+h-8-(h-24)*Math.max(0,Math.min(1,fr.x));
    if(k===0)c.moveTo(px,py);else c.lineTo(px,py);
  });
  c.stroke();c.restore();
  texto(c,'posición del vástago',x+10,y+h-10,GRIS,'11px Outfit, sans-serif','left');
}

// ===================== 11. VISTAS DEL PIZARRÓN =====================
/* evalCfg() encadena cuatro ensayos completos, y las tablas comparan las tres o
   cuatro opciones de un eje. Como el resultado sólo depende de (estación,
   configuración), se memoriza de una vez para siempre. */
const _EVC=new Map();
function EV(sc,cfg){
  const k=cfgKey(sc,cfg);
  if(!_EVC.has(k))_EVC.set(k,evalCfg(sc,cfg));
  return _EVC.get(k);
}
const CRITCORTO={okEfecto:'efecto',okSalida:'carrera',okCiclo:'ciclo',okFalla:'corte',
                 okArranque:'rearranque',okModo:'modo',okRitmo:'ritmo'};
function veredicto(e,cfg,sc){
  if(e.vale)return coste(cfg)>costeMin(sc)?['sí, pero sobra',WARN_HEX]:['sí',OK_HEX];
  return ['no · '+CRITCORTO[primerFallo(e)],BAD_HEX];
}
/* En el modo válvula lo que se reproduce es el ENSAYO DE CORTE; en los demás,
   el ciclo completo de 8 s. La animación es la misma traza que miden los
   criterios, no una recreación aparte. */
function traza(){return mode==='valvula'?curTC().tz:curTZ();}
function tFinTraza(){return mode==='valvula'?curTC().tFin:T_FIN;}
function tauMs(){return animT*tFinTraza();}
function sinOrdenAhora(){return mode==='valvula';}
function curFrame(){return frameEn(traza(),tauMs());}

function dotCrit(c,x,y,ok,rot,mostrar){
  const col=mostrar?(ok?OK_HEX:BAD_HEX):'rgba(255,255,255,0.22)';
  c.fillStyle=col;c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.fill();
  texto(c,rot,x+14,y,mostrar?'#F4EFEA':GRIS,'12px Outfit, sans-serif','left');
}
function panelCriterios(c,e,mostrar){
  rpanel(c,PX.x,532,PX.w,210,'Criterios de aceptación');
  CRIT.forEach((cr,i)=>dotCrit(c,PX.x+18,576+i*26,e[cr.k],cr.rot,mostrar!==false));
}
function panelCoste(c,y,cfg,sc){
  const d=costeDet(cfg), k=coste(cfg), m=costeMin(sc);
  rpanel(c,PX.x,y,PX.w,144,'Aparatos');
  prow(c,PX.x,y+52,PX.w,'Bobinas de electroválvula',f1(d.sols,0));
  prow(c,PX.x,y+78,PX.w,'Relevadores',f1(d.reles,0));
  prow(c,PX.x,y+104,PX.w,'Sensores',f1(d.sensores,0));
  prow(c,PX.x,y+130,PX.w,'Total / mínimo posible',f1(k,0)+' / '+f1(m,0),k===m?OK_HEX:WARN_HEX);
}
function chip(c,x,y,w,h,rot,val,estado){
  const col=estado==null?AZUL:(estado?OK_HEX:BAD_HEX);
  c.fillStyle=hexA(col,0.10);c.fillRect(x,y,w,h);
  c.strokeStyle=hexA(col,0.5);c.lineWidth=1.5;c.strokeRect(x+0.5,y+0.5,w-1,h-1);
  texto(c,rot,x+w/2,y+22,GRIS,'12px Outfit, sans-serif');
  texto(c,val,x+w/2,y+48,col,'bold 15px Outfit, sans-serif');
  if(estado!=null)texto(c,estado?'✓ es la pieza mínima que sirve':'✗ no sirve o sobra',x+w/2,y+70,col,'11px Outfit, sans-serif');
}
function barraCiclo(c,x,y,w,h,segs){
  const tot=segs.reduce((a,s)=>a+s.v,0)||1;
  let xx=x;
  segs.forEach(s=>{
    const sw=w*s.v/tot;
    c.fillStyle=hexA(s.col,0.30);c.fillRect(xx,y,sw,h);
    c.strokeStyle=s.col;c.lineWidth=1.5;c.strokeRect(xx+0.5,y+0.5,sw-1,h-1);
    if(sw>72){
      texto(c,s.rot,xx+sw/2,y+h/2-8,s.col,'11px Outfit, sans-serif');
      texto(c,f1(s.v,0)+' ms',xx+sw/2,y+h/2+10,'#F4EFEA','bold 12px Outfit, sans-serif');
    }
    xx+=sw;
  });
}

// ---------- modo 1: la válvula ----------
function drawValvula(c){
  const sc=POOL[vlIdx], cfg=curCfg(), e=curEval(), tc=curTC(), fr=curFrame();
  title2(c,'La válvula decide qué pasa cuando falta la tensión',
    sc.nom+' · '+sc.proc+'. La animación reproduce el ensayo de corte: se quita la tensión '+
    f1(T_CORTE,0)+' ms en plena carrera y se observan los 2 s siguientes sin que nadie toque nada.');
  simbCil(c,60,118,260,56,fr.x/sc.xTope,VALV[cfg.valvula].efecto,'cilindro de '+sc.efecto+' efecto · carrera '+f1(sc.carrera,0)+' mm',fr.B0,fr.B1);
  simbValv(c,380,130,84,92,cfg.valvula,fr.spool,fr.Y1,fr.Y2);
  if(!fr.U){
    c.fillStyle=hexA(BAD_HEX,0.10);c.fillRect(30,96,650,180);
    texto(c,'sin tensión',355,108,BAD_HEX,'bold 13px Outfit, sans-serif');
  }
  plotCorte(c,30,300,650,110,tc);
  const filas=VALVS.map(v=>{
    const cf=cfgWith(GOOD(sc),'valvula',v), ee=EV(sc,cf), V=VALV[v];
    const q=ee.retrajo?'se retrae al reposo':(ee.siguio?'termina y se queda fuera':'se para donde está');
    const [ver,col]=veredicto(ee,cf,sc);
    return {c:[V.nom,V.efecto,f1(V.sols,0),V.efecto===sc.efecto?q:'—',ver],
            cols:[null,null,null,GRIS,col],hl:v===cfg.valvula};
  });
  tabla(c,30,428,650,[150,80,80,215,125],filas,['Válvula','Cilindro','Bobinas','Al faltar la tensión','¿Sirve aquí?']);
  nota(c,580,VALV[cfg.valvula].det,AZUL,78);
  const pq=porQue(sc,'valvula',vlVal);
  nota(c,668,pq||(VALV[vlVal].nom+': cumple los siete criterios de esta estación con el mínimo de aparatos.'),pq?WARN_HEX:OK_HEX,78);

  rpanel(c,PX.x,70,PX.w,144,'La estación pide');
  prow(c,PX.x,122,PX.w,'Al faltar la tensión',sc.falla==='retrae'?'retirarse':(sc.falla==='congela'?'pararse':'sostener'),WARN_HEX);
  prow(c,PX.x,148,PX.w,'Cilindro',sc.efecto+' efecto');
  prow(c,PX.x,174,PX.w,'Carrera',f1(sc.carrera,0)+' mm');
  prow(c,PX.x,200,PX.w,'Ventana del reed',f1(100*e.umb,1)+' % de la carrera');
  rpanel(c,PX.x,224,PX.w,144,'Ensayo de corte');
  prow(c,PX.x,276,PX.w,'Corte en',f1(tc.t0,0)+' ms');
  prow(c,PX.x,302,PX.w,'Posición al cortar',f1(100*e.xCorteIni,0)+' %');
  prow(c,PX.x,328,PX.w,'Al volver la tensión',f1(100*e.xCorteFin,0)+' %');
  prow(c,PX.x,354,PX.w,'Se mueve después',f1(100*Math.max(e.movTras1,e.movTras2),1)+' %',e.okArranque?OK_HEX:BAD_HEX);
  panelCoste(c,378,cfg,sc);
  panelCriterios(c,e);
}

// ---------- modo 2: el mando ----------
function drawMando(c){
  const sc=POOL[mnIdx], cfg=curCfg(), e=curEval(), tz=curTZ(), fr=curFrame();
  title2(c,'El mando decide quién sostiene la orden',
    sc.nom+' · '+sc.proc+'. El esquema está vivo: los contactos y las bobinas se pintan con el estado real del ensayo en el instante que marca el cursor.');
  drawLadder(c,rungsDe(sc,cfg,fr,false),140,68);
  crono(c,30,470,650,150,tz,[
    {rot:'Y1 avance',get:f=>f.Y1,col:OK_HEX},
    {rot:'Y2 retroceso',get:f=>f.Y2,col:VIO},
    {rot:'K1',get:f=>f.K1,col:AZUL},
    {rot:'K2',get:f=>f.K2,col:AZUL},
    {rot:'vástago',get:f=>f.x/sc.xTope,col:NARANJA,ana:true},
  ],tauMs(),T_FIN);
  const pq=porQue(sc,'mando',mnMan);
  nota(c,650,(pq?pq+' ':'')+'Ensayo: '+finTxt(sc,e)+'. Conmutaciones del carrete: '+f1(e.nConm,0)+'.',pq?WARN_HEX:OK_HEX,86);

  rpanel(c,PX.x,70,PX.w,144,'Mando elegido');
  prow(c,PX.x,122,PX.w,'Circuito',MANDO[mnMan].abr,AZUL);
  prow(c,PX.x,148,PX.w,'Relevadores',f1(MANDO[mnMan].reles,0));
  prow(c,PX.x,174,PX.w,'Cierra el ciclo con',CIERRE[cfg.cierre].abr);
  prow(c,PX.x,200,PX.w,'Válvula del banco',VALV[cfg.valvula].abr);
  rpanel(c,PX.x,224,PX.w,144,'Lo que hace el vástago');
  prow(c,PX.x,276,PX.w,'Llega al final',e.salio?'sí':'no ('+f1(100*e.maxX,0)+' %)',colOk(e.salio));
  prow(c,PX.x,302,PX.w,'Acaba en reposo',e.enReposoFinal?'sí':'no',colOk(e.enReposoFinal));
  prow(c,PX.x,328,PX.w,'Conmutaciones',f1(e.nConm,0),e.nConm>=TEMBLOR?BAD_HEX:'#F4EFEA');
  prow(c,PX.x,354,PX.w,'Tiempo eléctrico',isFinite(e.tElectrico)?f1(e.tElectrico,0)+' ms':'—');
  panelCoste(c,378,cfg,sc);
  panelCriterios(c,e);
}

// ---------- modo 3: el cierre del ciclo ----------
function drawCierre(c){
  const sc=POOL[ciIdx], cfg=curCfg(), e=curEval(), tz=curTZ();
  title2(c,'El cierre del ciclo decide quién dice «ya llegó»',
    sc.nom+' · '+sc.proc+'. El reloj no sabe dónde está el vástago y el sensor no sabe de tiempo: cada uno paga un precio distinto.');
  crono(c,30,118,650,150,tz,[
    {rot:FINROT[cfg.cierre]+' fin',get:f=>senales(sc,cfg,f,false).FIN,col:WARN_HEX},
    {rot:'Y1 avance',get:f=>f.Y1,col:OK_HEX},
    {rot:'Y2 retroceso',get:f=>f.Y2,col:VIO},
    {rot:'vástago',get:f=>f.x/sc.xTope,col:NARANJA,ana:true},
  ],tauMs(),T_FIN);
  if(isFinite(e.tCiclo)){
    barraCiclo(c,30,296,650,44,[
      {v:e.tElectrico,rot:'tiempo eléctrico',col:AZUL},
      {v:Math.max(0,e.tCiclo-e.tElectrico),rot:'retorno',col:VIO},
      {v:sc.pausa*1000,rot:'pausa de proceso',col:GRIS},
    ]);
    texto(c,'Reparto de un ciclo automático: '+f1(e.tCiclo+sc.pausa*1000,0)+' ms en total → '+f1(e.ciclosH,0)+' ciclos/h',30,354,GRIS,'12px Outfit, sans-serif','left');
  }else{
    c.fillStyle=hexA(BAD_HEX,0.08);c.fillRect(30,296,650,44);
    texto(c,'Con este cierre el ciclo no se cierra solo: no hay cadencia que repartir.',355,318,BAD_HEX,'13px Outfit, sans-serif');
  }
  const filas=CIERRES.map(v=>{
    const cf=cfgWith(GOOD(sc),'cierre',v), ee=EV(sc,cf), C=CIERRE[v];
    const [ver,col]=veredicto(ee,cf,sc);
    return {c:[C.nom,f1(C.reles+C.sensores,0),isFinite(ee.tCiclo)?f1(ee.tCiclo,0)+' ms':'no cierra',
               sc.ritmo>0?f1(ee.ciclosH,0):'—',ver],
            cols:[null,null,GRIS,ee.okRitmo?OK_HEX:BAD_HEX,col],hl:v===cfg.cierre};
  });
  tabla(c,30,366,650,[170,90,150,110,130],filas,['Cierre del ciclo','Aparatos','Ciclo medido','ciclos/h','¿Sirve aquí?']);
  nota(c,490,CIERRE[ciCie].det,AZUL,78);
  nota(c,580,'Ajuste del temporizador: PT = 1,10 × (carrera más lenta medida en el banco) = 1,10 × '+
    f1(sc.tOutMax,0)+' ms = '+f1(e.PT,0)+' ms. La carrera típica de esta estación son '+f1(sc.tOut,0)+
    ' ms: cada ciclo tira '+f1(e.PT-sc.tOut,0)+' ms esperando a un peor caso que casi nunca ocurre.',WARN_HEX,78);
  const pq=porQue(sc,'cierre',ciCie);
  nota(c,668,pq||(CIERRE[ciCie].nom+': cierra el ciclo como pide la estación y con el mínimo de aparatos.'),pq?WARN_HEX:OK_HEX,78);

  rpanel(c,PX.x,70,PX.w,144,'El proceso pide');
  prow(c,PX.x,122,PX.w,'Modo',sc.auto?'automático':'manual',WARN_HEX);
  prow(c,PX.x,148,PX.w,'Cadencia',sc.ritmo>0?f1(sc.ritmo,0)+' ciclos/h':'sin cadencia');
  prow(c,PX.x,174,PX.w,'Pausa de proceso',f1(sc.pausa,1)+' s');
  prow(c,PX.x,200,PX.w,'Carrera más lenta',f1(sc.tOutMax,0)+' ms');
  rpanel(c,PX.x,224,PX.w,144,'Medido en el ensayo');
  prow(c,PX.x,276,PX.w,'Tiempo eléctrico',isFinite(e.tElectrico)?f1(e.tElectrico,0)+' ms':'—');
  prow(c,PX.x,302,PX.w,'Ciclo completo',isFinite(e.tCiclo)?f1(e.tCiclo,0)+' ms':'no cierra',colOk(isFinite(e.tCiclo)));
  prow(c,PX.x,328,PX.w,'Cadencia real',sc.ritmo>0?f1(e.ciclosH,0)+' ciclos/h':'—',e.okRitmo?OK_HEX:BAD_HEX);
  prow(c,PX.x,354,PX.w,'Ciclos en 8 s',f1(e.nCiclos,0));
  panelCoste(c,378,cfg,sc);
  panelCriterios(c,e);
}

// ---------- modo 4: el reto ----------
function drawReto(c){
  const sc=retoSc(), cfg=retoCfg(), e=curEval();
  title2(c,'Reto · '+sc.nom,
    'Elige la válvula, el mando y el cierre del ciclo. Tiene que cumplir los siete criterios con el menor número de aparatos posible. El informe de abajo es el ensayo real, no una pista.');
  c.fillStyle='rgba(255,255,255,0.035)';c.fillRect(30,104,650,104);
  c.strokeStyle='rgba(255,255,255,0.13)';c.lineWidth=1;c.strokeRect(30.5,104.5,649,103);
  c.fillStyle=AZUL;c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.textBaseline='alphabetic';
  c.fillText('Pliego de la estación',46,128);
  c.fillStyle='#F4EFEA';c.font='13px Outfit, sans-serif';
  let yy=wrapText(c,'Proceso: '+sc.proc+'. Pide '+sc.pide+'.',46,152,618,19);
  c.fillStyle=GRIS;
  wrapText(c,sc.nota+(sc.ritmo>0?' Cadencia exigida: '+f1(sc.ritmo,0)+' ciclos/h.':' Estación manual.'),46,yy+21,618,19);
  const anchoCh=206;
  chip(c,30,224,anchoCh,88,'Válvula',VALV[cfg.valvula].abr,retoChecked?retoOkValvula:null);
  chip(c,252,224,anchoCh,88,'Mando',MANDO[cfg.mando].abr,retoChecked?retoOkMando:null);
  chip(c,474,224,anchoCh,88,'Cierre del ciclo',CIERRE[cfg.cierre].abr,retoChecked?retoOkCierre:null);
  c.fillStyle='rgba(255,255,255,0.035)';c.fillRect(30,336,650,410);
  c.strokeStyle='rgba(255,255,255,0.13)';c.lineWidth=1;c.strokeRect(30.5,336.5,649,409);
  c.fillStyle=AZUL;c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.textBaseline='alphabetic';
  c.fillText('Informe del ensayo de 8 s',46,360);
  const lineas=[
    ['Carrera de trabajo',finTxt(sc,e)],
    ['Al faltar la tensión','se corta '+f1(T_CORTE,0)+' ms en el '+f1(100*e.xCorteIni,0)+' % de la carrera y '+cortaTxt(sc,e)],
    ['Al volver la tensión',arranqueTxt(sc,e)],
    ['Cadencia',ritmoTxt(sc,e)],
    ['Aparatos',f1(e.coste,0)+' en total: '+f1(costeDet(cfg).sols,0)+' bobina(s), '+f1(costeDet(cfg).reles,0)+' relé(s) y '+f1(costeDet(cfg).sensores,0)+' sensor(es)'],
  ];
  let y=390;
  lineas.forEach(([l,v])=>{
    c.fillStyle=GRIS;c.font='12px Outfit, sans-serif';c.fillText(l,46,y);
    c.fillStyle='#F4EFEA';c.font='13px Outfit, sans-serif';
    y=wrapText(c,v,46,y+20,618,19)+30;
  });
  if(retoChecked){
    const col=retoSolved?OK_HEX:BAD_HEX;
    c.fillStyle=hexA(col,0.10);c.fillRect(46,y-8,618,700-y>80?76:76);
    c.strokeStyle=hexA(col,0.45);c.lineWidth=1;c.strokeRect(46.5,y-7.5,617,75);
    c.fillStyle=col;c.font='13px Outfit, sans-serif';
    wrapText(c,retoMsg,60,y+14,590,19);
  }else{
    c.fillStyle=GRIS;c.font='12px Outfit, sans-serif';
    wrapText(c,'Pulsa «Comprobar la propuesta» para que se califiquen los siete criterios.',46,y+2,618,19);
  }
  rpanel(c,PX.x,70,PX.w,144,'Lo que pide la estación');
  prow(c,PX.x,122,PX.w,'Cilindro',sc.efecto+' efecto');
  prow(c,PX.x,148,PX.w,'Al faltar la tensión',sc.falla==='retrae'?'retirarse':(sc.falla==='congela'?'pararse':'sostener'),WARN_HEX);
  prow(c,PX.x,174,PX.w,'Modo',sc.auto?'automático':'manual');
  prow(c,PX.x,200,PX.w,'Cadencia',sc.ritmo>0?f1(sc.ritmo,0)+' ciclos/h':'—');
  rpanel(c,PX.x,224,PX.w,144,'Tu propuesta, medida');
  prow(c,PX.x,276,PX.w,'Llega al final',e.salio?'sí':'no ('+f1(100*e.maxX,0)+' %)',colOk(e.salio));
  prow(c,PX.x,302,PX.w,'Vuelve al reposo',e.enReposoFinal?(e.volvioSolo?'sola':'con orden'):'no',colOk(e.enReposoFinal));
  prow(c,PX.x,328,PX.w,'Se mueve al volver',f1(100*Math.max(e.movTras1,e.movTras2),1)+' %',e.okArranque?OK_HEX:BAD_HEX);
  prow(c,PX.x,354,PX.w,'Cadencia',sc.ritmo>0?f1(e.ciclosH,0)+' ciclos/h':'—',e.okRitmo?OK_HEX:BAD_HEX);
  panelCoste(c,378,cfg,sc);
  panelCriterios(c,e,retoChecked);
}

function drawBoard(){
  const c=bCv.getContext('2d');
  bg(c);
  if(mode==='valvula')drawValvula(c);
  else if(mode==='mando')drawMando(c);
  else if(mode==='cierre')drawCierre(c);
  else drawReto(c);
  bTex.needsUpdate=true;
}
function boardClick(){
  const sc=curSc(), cfg=curCfg(), e=curEval();
  if(mode==='valvula')showToast('<b>'+VALV[cfg.valvula].nom+'</b> · '+VALV[cfg.valvula].det+
    '<br>En esta estación, al cortar la tensión en el '+f1(100*e.xCorteIni,0)+' % de la carrera, '+cortaTxt(sc,e)+'.');
  else if(mode==='mando')showToast('<b>'+MANDO[cfg.mando].nom+'</b> · '+MANDO[cfg.mando].det+
    '<br>Aquí el ensayo termina así: '+finTxt(sc,e)+'.');
  else if(mode==='cierre')showToast('<b>'+CIERRE[cfg.cierre].nom+'</b> · '+CIERRE[cfg.cierre].det+
    '<br>Medido en esta estación: '+ritmoTxt(sc,e)+'.');
  else showToast('<b>'+sc.nom+'</b> pide '+sc.pide+'. '+sc.nota+
    '<br>Los siete criterios se califican al comprobar la propuesta; el informe de abajo es el ensayo tal cual sale.');
}

// ===================== 12. BANCO 3D =====================
/* Las cinco estaciones se montan sobre el MISMO banco horizontal: lo que cambia
   entre ellas son la carrera, los tiempos y lo que exige el proceso, no la
   geometría. La mesa elevadora es la única de carga vertical y su verticalidad
   vive en los números (deriva del actuador suelto), no en el dibujo. */
const bench=roundedBox(4.4,0.5,1.9,MAT.bench,0.05);bench.position.set(1.85,0.25,0.50);scene.add(bench);
[[-0.05,-0.30],[3.75,-0.30],[-0.05,1.30],[3.75,1.30]].forEach(p=>{
  const l=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.5,12),MAT.leg);
  l.position.set(p[0],0.25,p[1]);scene.add(l);
});
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

// --- cilindro ---
const ZC=0.28, YC=0.80, X0=0.72, X1=1.86, LROD=0.94;
/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde
   ya importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={
  aluminio: std(0x757d85,0.58,0.45), acero: std(0x848c93,0.42,0.75),
  cromo: std(0xaeb6bb,0.26,0.88),    chapa: std(0x6f777e,0.50,0.65),
  cobre: std(0xb87333,0.35,0.75),    negro: std(0x14181e,0.62,0.06),
  goma: std(0x101418,0.92,0.02),     blanco: std(0xd7dee6,0.42,0.15),
  rojo: std(0xd64545,0.50,0.10),     ceramica: std(0xd9dcd6,0.62,0.04),
};
/* EL CILINDRO, con lo que de verdad lo hace reconocible: las dos tapas, los
   cuatro TIRANTES que las sujetan contra la presión —por eso un cilindro de
   tirantes se puede desarmar y uno soldado no— y las tomas de aire, una a cada
   lado del émbolo. Antes eran dos cilindros lisos escalados, que es la silueta
   de cualquier cosa. Se rearma sólo cuando cambia el diámetro de la estación,
   no en cada fotograma, porque un cilindro de tirantes no se puede estirar con
   `scale` sin deformarle las tapas. Y el vástago se coloca en carrera·(p−1):
   así en p = 0 asoma sólo lo que sobresale de la tapa —el cilindro está
   DENTRO— y en p = 1 ha hecho la carrera entera. */
const D_CIL=0.27, VAS_CIL=0.124;
const cilG=new THREE.Group();cilG.position.set(0,YC,ZC);scene.add(cilG);
const cilP3=P3.cilindroHidraulico(MATP,{d:D_CIL,carrera:LROD,vastago:VAS_CIL,
  tirantes:4,horquilla:false,tomas:true});
cilP3.rotation.z=-Math.PI/2;                   // el +Y de la pieza es el +X del banco
cilP3.position.set(X0+(LROD+D_CIL*0.85)/2,0,0);
cilP3.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
cilG.add(cilP3);
/* La punta del vástago en x del banco, sacada de la geometría de la pieza. */
const puntaCil=(p)=>X0+LROD+1.17*D_CIL+LROD*p;
const carga=roundedBox(0.26,0.36,0.36,MAT.carga,0.03);scene.add(carga);
const soporte=roundedBox(0.16,0.42,0.44,MAT.post,0.03);soporte.position.set(X0-0.16,0.63,ZC);scene.add(soporte);
const tope=roundedBox(0.10,0.44,0.44,MAT.post,0.03);tope.position.set(X1+LROD+0.40,0.72,ZC);scene.add(tope);
function reed(x){
  const m=new THREE.Mesh(new THREE.SphereGeometry(0.040,14,10),std(0x8f97a5,0.35,0.2));
  m.material.emissive=new THREE.Color(0x000000);m.position.set(x,YC+0.16,ZC);scene.add(m);return m;
}
const reedB0=reed(X0+0.16), reedB1=reed(X1-0.16);

// --- electroválvula ---
const valG=new THREE.Group();valG.position.set(-0.02,0.66,ZC);scene.add(valG);
const cuerpo=roundedBox(0.44,0.28,0.40,MAT.valve,0.03);valG.add(cuerpo);
const spool3=roundedBox(0.14,0.09,0.09,MAT.spool,0.02);spool3.position.set(0,0,0.21);valG.add(spool3);
function bobina3(x){
  const g=new THREE.Group();g.position.set(x,0,0);
  const b=new THREE.Mesh(GEO_CIL,MAT.bobina.clone());b.rotation.z=Math.PI/2;b.scale.set(0.10,0.16,0.10);g.add(b);
  b.material.emissive=new THREE.Color(0x000000);
  valG.add(g);return {g,b};
}
const solY1=bobina3(-0.30), solY2=bobina3(0.30);
function muelle3(x,s){
  const g=new THREE.Group();g.position.set(x,0,0);
  for(let i=0;i<4;i++){
    const a=new THREE.Mesh(new THREE.TorusGeometry(0.055,0.012,6,14),MAT.spool);
    a.rotation.y=Math.PI/2;a.position.set(s*(i*0.035),0,0);g.add(a);
  }
  valG.add(g);return g;
}
const mueL=muelle3(-0.30,-1), mueR=muelle3(0.30,1);
const tubA=tuboAB(MAT.tuboA), tubB=tuboAB(MAT.tuboB), tubP=tuboAB(MAT.tuboP);
setTuboAB(tubA,[0.14,0.72,ZC+0.14],[X0,YC,ZC+0.14],0.018);
setTuboAB(tubB,[0.14,0.72,ZC-0.14],[X1,YC,ZC-0.14],0.018);
setTuboAB(tubP,[-0.02,0.50,ZC],[-0.02,0.30,ZC],0.020);

// --- armario eléctrico ---
const panelG=new THREE.Group();panelG.position.set(3.30,0,0.45);scene.add(panelG);
const placaE=roundedBox(0.12,1.46,1.50,MAT.plate,0.03);placaE.position.set(0,1.28,0);panelG.add(placaE);
function cajaRele(z,rot){
  const g=new THREE.Group();g.position.set(0.10,1.68,z);panelG.add(g);
  const b=roundedBox(0.10,0.26,0.22,MAT.rele,0.02);g.add(b);
  const led=new THREE.Mesh(new THREE.SphereGeometry(0.034,14,10),std(0x8f97a5,0.3,0.1));
  led.material.emissive=new THREE.Color(0x000000);led.position.set(0.07,0.06,0);g.add(led);
  return {g,b,led,rot};
}
const RK1=cajaRele(-0.45,'K1'), RK2=cajaRele(0.00,'K2'), RKT=cajaRele(0.45,'KT');
function pulsador(y,z,color,seta){
  const g=new THREE.Group();g.position.set(0.09,y,z);panelG.add(g);
  const base=new THREE.Mesh(GEO_CIL,MAT.boton);base.rotation.z=Math.PI/2;base.scale.set(0.055,0.06,0.055);g.add(base);
  const cab=new THREE.Mesh(GEO_CIL,std(color,0.4,0.2));cab.rotation.z=Math.PI/2;
  cab.scale.set(seta?0.075:0.048,0.05,seta?0.075:0.048);cab.position.set(0.055,0,0);
  cab.material.emissive=new THREE.Color(0x000000);g.add(cab);
  return {g,cab};
}
const BTN_S1=pulsador(1.16,-0.45,0x7CD992,false);
const BTN_S2=pulsador(1.16,0.00,0xff6b6b,true);
const BTN_S3=pulsador(1.16,0.45,0xE9C46A,false);
const BTN_S4=pulsador(0.82,-0.45,0x8AB4F8,false);
const Q1=pulsador(0.82,0.45,0x8f97a5,false);
function makeLED(x){
  const m=new THREE.Mesh(new THREE.SphereGeometry(0.042,16,12),std(0x8f97a5,0.3,0.1));
  m.material.emissive=new THREE.Color(0x000000);m.material.emissiveIntensity=0.1;
  m.position.set(x,0.53,1.32);scene.add(m);return m;
}
const LEDS=CRIT.map((cr,i)=>makeLED(0.62+i*0.30));

// --- placa de datos ---
const pCv=document.createElement('canvas');pCv.width=256;pCv.height=160;
const pTex=new THREE.CanvasTexture(pCv);
const placa=new THREE.Mesh(new THREE.PlaneGeometry(0.66,0.41),new THREE.MeshBasicMaterial({map:pTex}));
placa.position.set(3.26,2.30,0.45);placa.lookAt(6.4,2.8,5.2);scene.add(placa);
function drawPlaca(sc,cfg,e){
  const c=pCv.getContext('2d');
  c.fillStyle='#0c1016';c.fillRect(0,0,256,160);
  c.strokeStyle=e.vale?OK_HEX:BAD_HEX;c.lineWidth=3;c.strokeRect(1.5,1.5,253,157);
  c.fillStyle='#F4EFEA';c.font='bold 15px Outfit, sans-serif';c.textAlign='left';c.textBaseline='alphabetic';
  c.fillText(sc.nom.length>22?sc.nom.slice(0,22)+'…':sc.nom,12,24);
  c.font='11px Outfit, sans-serif';c.fillStyle=GRIS;
  c.fillText('carrera '+f1(sc.carrera,0)+' mm · '+sc.efecto+' efecto',12,42);
  const rows=[
    ['Válvula',VALV[cfg.valvula].abr],
    ['Mando',MANDO[cfg.mando].abr],
    ['Cierre',CIERRE[cfg.cierre].abr],
    ['Aparatos',f1(e.coste,0)+' (mín '+f1(costeMin(sc),0)+')'],
    ['Ciclo',isFinite(e.tCiclo)?f1(e.tCiclo,0)+' ms':'no cierra'],
    ['Cadencia',sc.ritmo>0?f1(e.ciclosH,0)+' / '+f1(sc.ritmo,0)+' /h':'manual'],
  ];
  rows.forEach((r,i)=>{
    const y=62+i*14;
    c.fillStyle=GRIS;c.font='11px Outfit, sans-serif';c.textAlign='left';c.fillText(r[0],12,y);
    c.fillStyle='#F4EFEA';c.font='bold 12px Outfit, sans-serif';c.textAlign='right';c.fillText(r[1],244,y);
  });
  c.fillStyle=e.vale?OK_HEX:BAD_HEX;c.font='bold 13px Outfit, sans-serif';c.textAlign='right';
  c.fillText(e.vale?'cumple los siete criterios':'falla: '+CRITCORTO[primerFallo(e)],244,152);
  pTex.needsUpdate=true;
}

// --- etiquetas y picking ---
cilG.userData={title:'Cilindro de la estación',info:'El mismo banco horizontal sirve a las cinco estaciones: lo que cambia son la carrera, los tiempos de ida y vuelta y lo que el proceso exige. La carga vertical de la mesa elevadora vive en los números (la deriva del actuador suelto), no en el dibujo.'};
addHoverLabel(cilG,'Cilindro',AZUL,[(X0+X1)/2,YC+0.42,ZC],0.62);
cuerpo.userData={title:'Electroválvula',info:'La válvula es la que decide qué pasa cuando falta la tensión: con muelle vuelve sola a su posición de reposo, con memoria biestable se queda donde estaba y con centros cerrados bloquea el actuador donde esté.'};
addHoverLabel(cuerpo,'Electroválvula',VIO,[-0.02,1.02,ZC],0.66);
solY1.b.userData={title:'Bobina Y1 · avance',info:'Una bobina no es un contacto: pilota el carrete. Mientras esté excitada consume; una válvula monoestable hay que sostenerla toda la carrera, una biestable sólo necesita un pulso.'};
solY2.b.userData={title:'Bobina Y2 · retroceso',info:'Sólo existe en las válvulas de dos solenoides. Si se excitan Y1 e Y2 a la vez, la biestable no se mueve y la de centros se va al centro: por eso el circuito debe enclavarlas.'};
reedB0.userData={title:'Detector B0 · vástago dentro',info:'Reed magnético sujeto al tubo. Conmuta con el imán del émbolo, y su ventana de detección de unos 4 mm pesa mucho o poco según la carrera: en la pinza de 25 mm es el 16 % del recorrido.'};
reedB1.userData={title:'Detector B1 · vástago fuera',info:'Confirma que la carrera de trabajo se completó. Si el actuador tope antes de llegar a la zona del reed, la confirmación no llega nunca y el circuito se queda esperando.'};
RK1.b.userData={title:'Relevador K1',info:'El relé de sello: sus propios contactos sostienen su bobina cuando se suelta el pulsador de marcha. Es la memoria eléctrica que hace innecesario tener el dedo puesto.'};
RK2.b.userData={title:'Relevador K2',info:'Segundo escalón de la cadena. Recuerda que la carrera de trabajo ya terminó, para que el retorno no vuelva a arrancar el avance mientras el vástago no esté dentro.'};
RKT.b.userData={title:'Relevador temporizado KT',info:'Cierra el ciclo por reloj, no por posición. Se ajusta al peor caso medido en el banco, así que cada ciclo bueno tira el margen que sobra.'};
BTN_S1.cab.userData={title:'S1 · marcha',info:'Pulsador de contacto normalmente abierto. Da la orden, pero no la sostiene: quien la sostiene es el circuito.'};
BTN_S2.cab.userData={title:'S2 · paro',info:'Seta de paro con contacto normalmente cerrado. Se dibuja cerrado porque en reposo conduce: si el cable se corta, el circuito se para solo.'};
BTN_S3.cab.userData={title:'S3 · selector mantenido',info:'Un selector no suelta la orden: la deja puesta. Con un final de carrera cerrando el ciclo, eso no da un ciclo continuo, da un vástago temblando contra el tope.'};
BTN_S4.cab.userData={title:'S4 · retroceso',info:'Orden de retorno del operario. Es lo que distingue una estación manual de una automática: aquí el ciclo lo cierra una persona, no el circuito.'};
Q1.cab.userData={title:'Q1 · interruptor general',info:'Corta la tensión de mando. Al volver, la norma IEC 60204-1 §7.5 exige que la máquina NO se ponga en marcha sola: hace falta una orden nueva.'};
placaE.userData={title:'Armario de mando',info:'24 V CD entre los raíles L+ y L−. Todo el esquema de escalera de esta práctica cuelga de aquí: contactos arriba, bobinas siempre pegadas al raíl de la derecha.'};
LEDS.forEach((l,i)=>{l.userData={title:'Criterio · '+CRIT[i].rot,info:CRIT[i].det};});

function ledCol(m,on,colOn,colOff,inten){
  const cOn=colOn==null?0x7CD992:colOn, cOff=colOff==null?0x8f97a5:colOff;
  m.material.color.set(on?cOn:cOff);
  m.material.emissive.set(on?cOn:0x000000);
  m.material.emissiveIntensity=on?(inten==null?1.2:inten):0;
}
function updateHW(){
  const sc=curSc(), cfg=curCfg(), e=curEval(), fr=curFrame();
  const V=VALV[cfg.valvula], M=MANDO[cfg.mando];
  const sg=senales(sc,cfg,fr,sinOrdenAhora());
  const p=Math.max(0,Math.min(1,fr.x));
  cilP3.userData.vastago.position.y=LROD*(p-1);       // en p = 0 está DENTRO
  carga.position.set(puntaCil(p)+0.15,YC,ZC);
  tope.position.set(X1+LROD+0.42,0.72,ZC);
  ledCol(reedB0,fr.B0);ledCol(reedB1,fr.B1);
  spool3.position.set(fr.spool==='A'?-0.13:(fr.spool==='B'?0.13:0),0,0.21);
  solY2.g.visible=V.sols===2;
  mueR.visible=V.sols===1||V.centro;
  mueL.visible=!!V.centro;
  ledCol(solY1.b,fr.Y1,0xE9C46A,0x8a5a2b,0.9);
  ledCol(solY2.b,fr.Y2,0xC08CF8,0x8a5a2b,0.9);
  RK1.g.visible=M.reles>=1;
  RK2.g.visible=M.reles>=2;
  RKT.g.visible=cfg.cierre==='temporizador';
  ledCol(RK1.led,fr.K1);ledCol(RK2.led,fr.K2);ledCol(RKT.led,fr.KT,0xE9C46A);
  BTN_S3.g.visible=cfg.mando==='mantenido';
  BTN_S1.g.visible=cfg.mando!=='mantenido';
  BTN_S4.g.visible=cfg.cierre==='operario';
  ledCol(BTN_S1.cab,sg.S1,0x7CD992,0x3f6b4c,0.8);
  ledCol(BTN_S3.cab,sg.S3,0xE9C46A,0x6b5a2c,0.8);
  ledCol(BTN_S4.cab,sg.SR,0x8AB4F8,0x2e4a6b,0.8);
  ledCol(BTN_S2.cab,false,0xff6b6b,0xff6b6b,0);
  ledCol(Q1.cab,fr.U,0x7CD992,0xff6b6b,0.7);
  Q1.cab.material.emissive.set(fr.U?0x7CD992:0xff6b6b);
  Q1.cab.material.emissiveIntensity=fr.U?0.7:0.9;
  CRIT.forEach((cr,i)=>{
    const ok=e[cr.k], L=LEDS[i];
    L.material.color.set(ok?0x7CD992:0xff6b6b);
    L.material.emissive.set(ok?0x7CD992:0xff6b6b);
    L.material.emissiveIntensity=ok?1.3:0.5;
  });
  setTuboAB(tubA,[0.14,0.72,ZC+0.14],[X0,YC,ZC+0.14],0.018);
  setTuboAB(tubB,[0.14,0.72,ZC-0.14],[X1,YC,ZC-0.14],0.018);
  tubA.material=fr.spool==='A'?MAT.tuboA:MAT.tuboP;
  tubB.material=fr.spool==='B'?MAT.tuboB:MAT.tuboP;
  drawPlaca(sc,cfg,e);
}

// ===================== 13. HUD Y PANEL =====================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Hidráulica y Neumática · Mecánica</div>
  <h2>Circuitos electroneumáticos con relevadores</h2>
  <p>Un mando electroneumático se proyecta en tres decisiones que no son independientes: la <b>válvula</b> decide qué hace el actuador cuando falta la tensión, el <b>mando</b> decide quién sostiene la orden cuando se suelta el pulsador y el <b>cierre del ciclo</b> decide quién dice «ya llegó». El esquema de escalera se lee de arriba abajo y de izquierda a derecha: cada bobina cambia el estado de sus contactos <b>después</b> del renglón que la excita, y ese retardo de exploración es exactamente lo que hace posible el sello.</p>
  <div class="formula">K1 = (S1 + K1) · S̄2 · F̄IN · · · Y1 = K1 · · · Y2 = K̄1 · · · PT = 1,10 · t<sub>peor caso</sub></div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#7CD992"></span>criterio cumplido / contacto cerrado</div>
    <div class="li"><span class="dot" style="background:#E9C46A"></span>bobina Y1 excitada / límite</div>
    <div class="li"><span class="dot" style="background:#C08CF8"></span>bobina Y2 excitada</div>
    <div class="li"><span class="dot" style="background:#ff6b6b"></span>criterio incumplido / sin tensión</div>
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>relevadores y esquema</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> exploración cíclica del esquema con retardo de un ciclo entre bobina y contacto (8 ms de cierre y 4 ms de apertura por relevador); las cuatro válvulas ISO 1219-1 con su tiempo de conmutación por bobina y por muelle, y el carrete que sólo cambia si la orden se sostiene; la ventana real de detección del reed sobre la carrera de cada estación; el ensayo de corte de tensión de 600 ms con 2 s de observación posterior; el rearranque al restablecer la tensión; el conteo de ciclos, la cadencia por hora y la energía de las bobinas.</div>
    <div class="fl no"><b>NO modela:</b> la dinámica del aire (caudal, presión y ISO 6358 se estudian en las prácticas de neumática; aquí la carrera se describe por su tiempo medido); el rebote mecánico de los contactos y su antirrebote; la categoría de seguridad de la parada de emergencia (IEC 60204-1 §9.2 y ISO 13849, citadas); el cableado real, las secciones y las protecciones; la programación en PLC del mismo esquema (IEC 61131-3, citada); las cinco estaciones se dibujan sobre el mismo banco horizontal, y la carga vertical de la mesa vive en los números, no en la geometría.</div>
  </div>
  <div class="src">Ref: IEC 60617 (símbolos eléctricos) · ISO 1219-1 (símbolos neumáticos) · IEC 60204-1 §7.5 (rearranque) · IEC 60947-5-1 (aparamenta de mando) · IEC 61131-3 (citada)</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Electroneumática · <span id="p_mode" style="color:var(--accent2)">Válvula</span></h4>
  <div class="modebar">
    <button class="b on" id="m_valvula">🔀 Válvula</button>
    <button class="b" id="m_mando">🪜 Mando</button>
    <button class="b" id="m_cierre">⏱️ Cierre</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="scenarioInfo" style="font-size:12px;color:var(--ink);margin:2px 0 8px;display:none"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Propuesta de mando</h4>
  <div id="retoBox" style="display:none">
    <div id="retoSpec" style="font-size:12px;color:var(--ink);margin:2px 0 8px"></div>
    <div class="btns"><button class="b primary" id="btnCheck">✅ Comprobar la propuesta</button></div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
    <button class="b primary" id="btnNew">🔀 Nueva estación</button>
  </div>`;

// ===================== 14. TOAST =====================
function showToast(html){
  const t=el('toast');t.innerHTML=html;t.classList.add('show');
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),4600);
}

// ===================== 15. MODOS Y CONTROLES =====================
const MODE_META={
  valvula:{nombre:'Válvula',cam:[[3.4,2.3,5.4],[0.85,0.85,0.35]],
    mision:'Corta la tensión en plena carrera y mira qué hace el actuador con cada válvula.'},
  mando:{nombre:'Mando',cam:[[6.2,2.8,5.0],[2.95,1.30,0.45]],
    mision:'Lee el esquema de escalera vivo: quién sostiene la orden cuando se suelta el pulsador.'},
  cierre:{nombre:'Cierre',cam:[[4.6,2.6,6.4],[1.75,0.95,0.40]],
    mision:'Decide quién dice «ya llegó»: el operario, un final de carrera o un reloj.'},
  reto:{nombre:'Reto',cam:[[5.6,3.0,7.4],[1.60,1.00,0.45]],
    mision:'Proyecta el mando completo con el mínimo de aparatos que cumple los siete criterios.'},
};
function lbl(t){return `<span class="lbl">${t}</span>`;}
function optBtns(key,opts,cur){
  return opts.map(([v,t])=>`<button class="b sm ${String(cur)===String(v)?'on':''}" data-${key}="${v}">${t}</button>`).join('');
}
const beep=()=>synth.beep(680,0.05,0.04);
const estOpts=()=>POOL.map((s,i)=>[i,s.nom]);
const ejeOpts=eje=>opciones(eje).map(v=>[v,rotVal(eje,v)]);

function buildControls(){
  const bar=el('selbar');
  let h='';
  if(mode==='valvula'){
    h+=lbl('Estación')+optBtns('est',estOpts(),vlIdx);
    h+=lbl('Válvula')+optBtns('vl',ejeOpts('valvula'),vlVal);
  }else if(mode==='mando'){
    h+=lbl('Estación')+optBtns('est',estOpts(),mnIdx);
    h+=lbl('Mando')+optBtns('mn',ejeOpts('mando'),mnMan);
  }else if(mode==='cierre'){
    h+=lbl('Estación')+optBtns('est',estOpts(),ciIdx);
    h+=lbl('Cierre del ciclo')+optBtns('ci',ejeOpts('cierre'),ciCie);
  }else{
    h+=lbl('Válvula')+optBtns('rvl',ejeOpts('valvula'),retoCh.valvula);
    h+=lbl('Mando')+optBtns('rmn',ejeOpts('mando'),retoCh.mando);
    h+=lbl('Cierre del ciclo')+optBtns('rci',ejeOpts('cierre'),retoCh.cierre);
  }
  bar.innerHTML=h;bar.style.display='flex';
  bar.querySelectorAll('[data-est]').forEach(b=>b.onclick=()=>{
    if(autoRunning)return;
    const i=+b.dataset.est;
    if(mode==='valvula')vlIdx=i;else if(mode==='mando')mnIdx=i;else ciIdx=i;
    animT=0;beep();afterEdit();
  });
  bar.querySelectorAll('[data-vl]').forEach(b=>b.onclick=()=>{if(autoRunning)return;vlVal=b.dataset.vl;animT=0;beep();afterEdit();});
  bar.querySelectorAll('[data-mn]').forEach(b=>b.onclick=()=>{if(autoRunning)return;mnMan=b.dataset.mn;animT=0;beep();afterEdit();});
  bar.querySelectorAll('[data-ci]').forEach(b=>b.onclick=()=>{if(autoRunning)return;ciCie=b.dataset.ci;animT=0;beep();afterEdit();});
  bar.querySelectorAll('[data-rvl]').forEach(b=>b.onclick=()=>retoSet('valvula',b.dataset.rvl));
  bar.querySelectorAll('[data-rmn]').forEach(b=>b.onclick=()=>retoSet('mando',b.dataset.rmn));
  bar.querySelectorAll('[data-rci]').forEach(b=>b.onclick=()=>retoSet('cierre',b.dataset.rci));
}
function retoSet(field,v){
  if(autoRunning)return;
  retoCh[field]=v;
  retoChecked=false;retoOkValvula=false;retoOkMando=false;retoOkCierre=false;retoSolved=false;retoMsg='';solved=false;
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
  box.innerHTML=`<b>${sc.nom}</b> · cilindro de ${sc.efecto} efecto · carrera ${f1(sc.carrera,0)} mm · ${sc.auto?'automática':'manual'}${sc.ritmo>0?' · pide '+f1(sc.ritmo,0)+' ciclos/h':''}<br><span style="color:var(--muted)">${MODE_META[mode].mision}</span>`;
}
function setMode(k){
  mode=k;
  ['valvula','mando','cierre','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
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
  if(mode==='valvula'){vlIdx=pickIdx(POOL.length,vlIdx);vlVal=VALVS[Math.floor(Math.random()*VALVS.length)];}
  else if(mode==='mando'){mnIdx=pickIdx(POOL.length,mnIdx);mnMan=MANDOS[Math.floor(Math.random()*MANDOS.length)];}
  else if(mode==='cierre'){ciIdx=pickIdx(POOL.length,ciIdx);ciCie=CIERRES[Math.floor(Math.random()*CIERRES.length)];}
  else{seedReto(null);solved=false;}
  animT=0;
  clearDx();refreshQuestion();
  afterEdit();
}

// ===================== 16. TELEMETRÍA =====================
function teleRow(l,v,cls){return `<div class="trow"><span class="tl">${l}</span><span class="tv ${cls||''}">${v}</span></div>`;}
const PIDE_FALLA={retrae:'retirarse',congela:'pararse',sostiene:'sostener'};
function updateTele(){
  const sc=curSc(), cfg=curCfg(), e=curEval();
  let h='';
  if(mode==='valvula'){
    const hace=e.retrajo?'se retrae':(e.siguio?'termina y se queda fuera':'se para donde está');
    h+=teleRow('Estación',sc.nom);
    h+=teleRow('Válvula',VALV[cfg.valvula].nom,e.okEfecto?'ok':'bad');
    h+=teleRow('El proceso pide',PIDE_FALLA[sc.falla],'warn');
    h+=teleRow('Al faltar la tensión',hace,e.okFalla?'ok':'bad');
    h+=teleRow('Posición al cortar',f1(100*e.xCorteIni,0)+' %');
    h+=teleRow('Al restablecer',f1(100*Math.max(e.movTras1,e.movTras2),1)+' % en 2 s',e.okArranque?'ok':'bad');
    h+=teleRow('Bobinas / aparatos',f1(costeDet(cfg).sols,0)+' / '+f1(e.coste,0));
    h+=teleRow('Criterios cumplidos',CRIT.filter(cr=>e[cr.k]).length+' de '+CRIT.length,e.vale?'ok':'bad');
  }else if(mode==='mando'){
    h+=teleRow('Estación',sc.nom);
    h+=teleRow('Mando',MANDO[cfg.mando].nom);
    h+=teleRow('Relevadores',f1(MANDO[cfg.mando].reles,0));
    h+=teleRow('Llega al final',e.salio?'sí':'no ('+f1(100*e.maxX,0)+' %)',e.okSalida?'ok':'bad');
    h+=teleRow('Vuelve al reposo',e.enReposoFinal?(e.volvioSolo?'sola':'con orden'):'no',e.okCiclo?'ok':'bad');
    h+=teleRow('Conmutaciones del carrete',f1(e.nConm,0),e.nConm>=TEMBLOR?'bad':'');
    h+=teleRow('Tiempo eléctrico',isFinite(e.tElectrico)?f1(e.tElectrico,0)+' ms':'—');
    h+=teleRow('Criterios cumplidos',CRIT.filter(cr=>e[cr.k]).length+' de '+CRIT.length,e.vale?'ok':'bad');
  }else if(mode==='cierre'){
    h+=teleRow('Estación',sc.nom);
    h+=teleRow('Cierre del ciclo',CIERRE[cfg.cierre].nom);
    h+=teleRow('Señal de fin',FINROT[cfg.cierre]);
    h+=teleRow('Ciclo completo',isFinite(e.tCiclo)?f1(e.tCiclo,0)+' ms':'no cierra',isFinite(e.tCiclo)?'ok':'bad');
    h+=teleRow('Cadencia',sc.ritmo>0?f1(e.ciclosH,0)+' / '+f1(sc.ritmo,0)+' /h':'manual',e.okRitmo?'ok':'bad');
    h+=teleRow('Modo de trabajo',e.volvioSolo?'automático':'manual',e.okModo?'ok':'bad');
    h+=teleRow('Preajuste PT',f1(e.PT,0)+' ms','warn');
    h+=teleRow('Ventana del reed',f1(100*e.umb,1)+' % de la carrera',sc.xTope<1-e.umb?'bad':'');
  }else{
    h+=teleRow('Válvula',VALV[cfg.valvula].abr,retoChecked?(retoOkValvula?'ok':'bad'):'');
    h+=teleRow('Mando',MANDO[cfg.mando].abr,retoChecked?(retoOkMando?'ok':'bad'):'');
    h+=teleRow('Cierre del ciclo',CIERRE[cfg.cierre].abr,retoChecked?(retoOkCierre?'ok':'bad'):'');
    h+=teleRow('Aparatos',f1(e.coste,0)+' (mín '+f1(costeMin(sc),0)+')',e.coste===costeMin(sc)?'ok':'warn');
    h+=teleRow('Sale y vuelve',e.salio?(e.enReposoFinal?'sí':'sale y no vuelve'):'no sale',e.okCiclo?'ok':'bad');
    h+=teleRow('Cadencia',sc.ritmo>0?f1(e.ciclosH,0)+' / '+f1(sc.ritmo,0)+' /h':'manual',e.okRitmo?'ok':'bad');
    h+=teleRow('Criterios cumplidos',CRIT.filter(cr=>e[cr.k]).length+' de '+CRIT.length,e.vale?'ok':'bad');
    h+=teleRow('Estado',retoChecked?(retoSolved?'aceptado':'rechazado'):'sin comprobar',retoChecked?(retoSolved?'ok':'bad'):'');
  }
  el('tele').innerHTML=h;
}
function updateReport(){
  const sc=curSc(), cfg=curCfg(), e=curEval();
  let h='';
  if(mode==='valvula'){
    const okv=VALVS.filter(v=>EV(sc,cfgWith(GOOD(sc),'valvula',v)).vale);
    h='<b>'+sc.nom+'</b> · '+VALV[cfg.valvula].nom+'<br>'+
      'Ensayo de corte: se quita la tensión en el '+f1(100*e.xCorteIni,0)+' % de la carrera y '+cortaTxt(sc,e)+'; '+arranqueTxt(sc,e)+'.<br>'+
      (e.okFalla&&e.okArranque?'<span style="color:#7CD992">Es lo que pide el proceso: '+PIDE_FALLA[sc.falla]+'.</span>'
        :'<span style="color:#ff6b6b">'+(porQue(sc,'valvula',cfg.valvula)||'No es lo que pide el proceso.')+'</span>')+
      '<br>Válvulas que sirven en esta estación: '+(okv.length?okv.map(v=>VALV[v].abr).join(', '):'ninguna')+'.';
  }else if(mode==='mando'){
    h='<b>'+sc.nom+'</b> · '+MANDO[cfg.mando].nom+'<br>'+
      'El vástago '+finTxt(sc,e)+'.<br>'+
      (e.vale?'<span style="color:#7CD992">'+MANDO[cfg.mando].det+'</span>'
        :'<span style="color:#ff6b6b">'+(porQue(sc,'mando',cfg.mando)||'No cumple lo que pide la estación.')+'</span>');
  }else if(mode==='cierre'){
    h='<b>'+sc.nom+'</b> · '+CIERRE[cfg.cierre].nom+'<br>'+
      'Cadencia: '+ritmoTxt(sc,e)+'.<br>'+
      (e.vale?'<span style="color:#7CD992">Cierra el ciclo como pide el proceso con '+f1(e.coste,0)+' aparatos.</span>'
        :'<span style="color:#ff6b6b">'+(porQue(sc,'cierre',cfg.cierre)||'No cierra el ciclo como pide el proceso.')+'</span>')+
      '<br>El temporizador se ajusta al peor caso ('+f1(sc.tOutMax,0)+' ms + 10 %); el reed confirma la posición real pero necesita un '+f1(100*e.umb,1)+' % de la carrera para conmutar.';
  }else{
    h='<b>'+sc.nom+'</b><br>'+
      (retoChecked?(retoSolved?'<span style="color:#7CD992">Propuesta aceptada: cumple los siete criterios con los '+f1(costeMin(sc),0)+' aparatos mínimos.</span>':'<span style="color:#ff6b6b">'+retoMsg+'</span>')
        :'Elige la válvula, el mando y el cierre del ciclo y pulsa «Comprobar la propuesta».')+
      '<br>Criterios: '+CRIT.map(cr=>(retoChecked?(e[cr.k]?'🟢':'🔴'):'⚪')+' '+cr.rot).join(' · ');
  }
  el('report').innerHTML=h;
}
function refreshAll(){drawBoard();updateTele();updateReport();updateHW();}

// ===================== 17. RETO =====================
function updateRetoSpec(){
  const sc=retoSc();
  el('retoSpec').innerHTML=`<b>${sc.nom}</b> · ${sc.proc}<br>`+
    `Cilindro de ${sc.efecto} efecto, carrera ${f1(sc.carrera,0)} mm (${f1(sc.tOut,0)} ms de ida, ${f1(sc.tIn,0)} ms de vuelta).<br>`+
    `Al faltar la tensión debe <b>${PIDE_FALLA[sc.falla]}</b>; trabajo <b>${sc.auto?'automático':'manual'}</b>`+
    (sc.ritmo>0?` a <b>${f1(sc.ritmo,0)} ciclos/h</b>`:'')+`.<br>`+
    `<span style="color:var(--muted)">${sc.nota} Se acepta la propuesta que cumple los siete criterios con el menor número de aparatos.</span>`;
}
function retoExplain(){
  return EJES.map(ej=>porQue(retoSc(),ej,retoCfg()[ej])).filter(Boolean).join(' · ');
}
function checkReto(){
  const sc=retoSc(), cfg=retoCfg();
  retoOkValvula=okEje(sc,'valvula',cfg.valvula);
  retoOkMando=okEje(sc,'mando',cfg.mando);
  retoOkCierre=okEje(sc,'cierre',cfg.cierre);
  retoChecked=true;
  retoSolved=retoOkValvula&&retoOkMando&&retoOkCierre;
  solved=retoSolved;
  retoMsg=retoSolved
    ?'Válvula, mando y cierre correctos, y con el mínimo de aparatos.'
    :(retoExplain()||'La propuesta funciona, pero hay otra que cumple lo mismo con menos aparatos.');
  synth.beep(retoSolved?880:200,0.10,0.05);
  refreshAll();
  if(!autoRunning){
    showToast((retoSolved?'✅ <b>Propuesta aceptada.</b> ':'❌ <b>Propuesta rechazada.</b> ')+retoMsg);
  }
  return retoSolved;
}
function retoSolveBuild(){
  const g=GOOD(retoSc());
  retoCh={valvula:g.valvula,mando:g.mando,cierre:g.cierre};
  retoChecked=false;retoOkValvula=false;retoOkMando=false;retoOkCierre=false;retoSolved=false;retoMsg='';
}

// ===================== 18. CUESTIONARIO =====================
function buildQuiz(){
  QUIZ={
    valvula:{
      pregunta:'Una válvula 5/2 biestable se describe como «segura ante fallo de tensión». ¿Qué congela realmente cuando se corta la alimentación?',
      opciones:[
        {t:'La ORDEN, no el actuador: el carrete se queda donde estaba y sigue enviando aire al mismo lado',ok:true,
         why:'Exacto. La biestable es una memoria: sin tensión conserva la última orden y el aire sigue empujando. Si lo que se necesita es que el actuador se pare donde está, hace falta una 5/3 de centros cerrados, que corta las dos vías.'},
        {t:'El actuador: sin tensión el vástago queda bloqueado en la posición en que estaba',ok:false,
         why:'No. Es el error más caro de esta práctica: la biestable mantiene la orden, así que el actuador TERMINA su carrera aunque nadie lo mande. En la mesa elevadora del banco eso significa que la mesa sigue subiendo o bajando sin tensión de mando.'},
        {t:'Las dos cosas a la vez, porque el aire también se corta',ok:false,
         why:'El aire de red no se corta al faltar la tensión de mando: son dos energías distintas. Ésa es justamente la razón de que el actuador siga moviéndose.'},
        {t:'Nada: al faltar la tensión todas las válvulas vuelven a su posición de reposo',ok:false,
         why:'Vuelven las monoestables, que tienen muelle. La biestable no tiene posición de reposo, y por eso no vuelve.'},
      ],
    },
    mando:{
      pregunta:'Un selector mantenido deja la orden de avance puesta y el ciclo lo cierra el final de carrera. ¿Qué hace la máquina?',
      opciones:[
        {t:'El vástago se queda contra el tope conmutando el carrete sin parar: ni cicla ni vuelve al reposo',ok:true,
         why:'Correcto, y se mide en el banco: el final de carrera pide retroceso, el selector vuelve a pedir avance en cuanto el reed se abre, y así 160 a 185 veces en 8 s. Donde la ventana del reed pesa mucho —la pinza, 4 mm en 25 mm de carrera— ese temblor impide incluso completar la carrera.'},
        {t:'Cicla indefinidamente, que es justo para lo que sirve un selector mantenido',ok:false,
         why:'No. Para ciclar de verdad hace falta que el final de carrera desenganche la orden y algo la vuelva a dar; un selector no la suelta nunca, así que el circuito se pelea consigo mismo contra el tope.'},
        {t:'Hace una sola carrera y se para fuera, exactamente igual que con un pulsador',ok:false,
         why:'Con un pulsador momentáneo la orden desaparece al soltarlo. Con el selector la orden sigue puesta, y el resultado no es «lo mismo»: es un vástago temblando.'},
        {t:'No arranca, porque el final de carrera de reposo lo impide',ok:false,
         why:'Arranca: el vástago está dentro y la orden está dada. El problema aparece al final de la carrera, no al principio.'},
      ],
    },
    cierre:{
      pregunta:'¿Por qué un temporizador ajustado al peor caso da menos ciclos por hora que un final de carrera?',
      opciones:[
        {t:'Porque espera siempre el tiempo del peor caso, aunque la carrera real termine antes: el margen se tira en cada ciclo',ok:true,
         why:'Exacto. En el expulsor la carrera típica son 320 ms y el peor caso 380; el temporizador se ajusta a 440 ms y regala más de 100 ms en cada ciclo. Con 2 250 ciclos/h exigidos, ese margen es la diferencia entre cumplir y no cumplir.'},
        {t:'Porque el relé temporizado es más lento que un reed al conmutar',ok:false,
         why:'Los tiempos de conmutación de ambos son de milisegundos y muy parecidos. Lo que pesa no es el aparato, es el criterio: reloj contra posición.'},
        {t:'Porque un temporizador no puede ajustarse con precisión',ok:false,
         why:'Se ajusta con toda la precisión que se quiera, y aun así hay que ajustarlo al caso más lento. El problema no es la precisión del ajuste sino la dispersión de la carrera.'},
        {t:'No da menos: el temporizador siempre es más rápido porque no espera confirmación',ok:false,
         why:'Al revés. Precisamente por no esperar confirmación tiene que esperar el peor caso; el reed cierra el ciclo en cuanto el vástago llega de verdad. Sólo gana el reloj cuando el reed no es alcanzable.'},
      ],
    },
    reto:{
      pregunta:'Al volver la tensión tras un corte, el vástago completa solo la carrera que había dejado a medias. ¿Se acepta el mando?',
      opciones:[
        {t:'No: IEC 60204-1 §7.5 exige que el restablecimiento de la tensión no ponga la máquina en marcha; hace falta una orden nueva',ok:true,
         why:'Correcto. El arranque automático al reponer la energía es un fallo de proyecto, no una comodidad: quien esté con las manos dentro no tiene forma de saber que la máquina va a moverse. Un mando con sello se cae al faltar la tensión y no rearranca solo.'},
        {t:'Sí, siempre que el movimiento que completa sea el mismo que estaba haciendo',ok:false,
         why:'La norma no distingue si el movimiento es el mismo: prohíbe la puesta en marcha automática al restablecer la alimentación. Lo que estaba a medias se reanuda con una orden del operario, no sola.'},
        {t:'Sí, si el corte duró menos de un segundo',ok:false,
         why:'No hay ninguna duración de corte que autorice el rearranque automático. En el ensayo del banco el corte dura 600 ms y ya basta para revelar el defecto.'},
        {t:'No, pero sólo si el actuador mueve una carga vertical',ok:false,
         why:'La carga vertical agrava el riesgo, no lo crea. El requisito de no rearranque vale para toda la máquina, no sólo para los ejes con carga suspendida.'},
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

// ===================== 19. PICKING Y HOVER =====================
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit){return;}
  let o=hit.object;
  if(o===board||o===frame){boardClick();return;}
  while(o){
    if(o.userData&&o.userData.title){synth.beep(560,0.05,0.04);showToast('<b>'+o.userData.title+'</b><br>'+(o.userData.info||''));return;}
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

// ===================== 20. RECORRIDO AUTOMÁTICO =====================
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runAuto(){
  if(autoRunning)return;
  autoRunning=true;
  const btn=el('btnAuto'),label=btn.textContent;
  btn.disabled=true;btn.classList.add('on');btn.textContent='⏳ Recorriendo…';
  synth.init();synth.resume();clearDx();
  try{
    // --- 1. VÁLVULA: qué hace el actuador cuando falta la tensión ---
    setMode('valvula');
    vlIdx=0;vlVal='mono5_2';animT=0;afterEdit();
    const scP=POOL[0];
    let e=curEval();
    showToast('🔀 <b>'+scP.nom+'</b>: si falta la tensión la pieza tiene que seguir sujeta. Con la <b>5/2 monoestable</b> el muelle devuelve el carrete en cuanto se corta el mando, el aire cambia de lado y la pinza se abre desde el <b>'+f1(100*e.xCorteIni,0)+' %</b> de la carrera. La pieza se cae.');
    await sleep(5800);
    vlVal='bies5_2';animT=0;afterEdit();
    e=curEval();
    showToast('✅ La <b>5/2 biestable</b> no tiene posición de reposo: es una memoria. Sin tensión conserva la última orden, el aire sigue empujando y la pinza <b>sostiene</b> en el '+f1(100*e.xCorteIni,0)+' %. Y al volver la tensión no se mueve sola.');
    await sleep(5800);
    vlIdx=3;vlVal='bies5_2';animT=0;afterEdit();
    const scM=POOL[3];
    e=curEval();
    showToast('⚠️ La misma memoria en la <b>'+scM.nom+'</b> es un peligro: la orden sigue puesta sin tensión, así que la mesa <b>termina la carrera sola</b> hasta el '+f1(100*e.maxX,0)+' %. Lo que congela la biestable es la ORDEN, no el actuador.');
    await sleep(6000);
    vlVal='centros5_3';animT=0;afterEdit();
    e=curEval();
    showToast('✅ La <b>5/3 de centros cerrados</b> bloquea las dos vías a la vez: la mesa se para donde está, en el <b>'+f1(100*e.xCorteIni,0)+' %</b>, y sólo deriva un '+f1(100*Math.abs(e.xCorteFin-e.xCorteIni),1)+' % durante el corte. Ésta es la única válvula que congela el actuador.');
    await sleep(6000);

    // --- 2. MANDO: quién sostiene la orden ---
    setMode('mando');
    mnIdx=1;mnMan='momentaneo';animT=0;afterEdit();
    const scE=POOL[1];
    e=curEval();
    showToast('🪜 <b>'+scE.nom+'</b> con pulsador momentáneo: la orden dura lo que dura el dedo. Al soltar S1 el carrete vuelve y el vástago se queda a medias, en el <b>'+f1(100*e.maxX,0)+' %</b>. El sello existe exactamente para esto.');
    await sleep(5800);
    mnMan='mantenido';animT=0;afterEdit();
    e=curEval();
    showToast('❌ Y el <b>selector mantenido</b> no da un ciclo continuo: el final de carrera pide retroceso, el selector vuelve a pedir avance, y el vástago se queda temblando contra el tope con <b>'+f1(e.nConm,0)+' conmutaciones</b> del carrete en 8 s. Nunca vuelve al reposo.');
    await sleep(6200);
    mnMan='sello';animT=0;afterEdit();
    e=curEval();
    showToast('✅ <b>K1 = (S1 + K1) · S̄2 · F̄IN</b>. El propio contacto de K1 sostiene su bobina cuando se suelta S1, y la señal de fin lo desengancha: sale, vuelve y queda en reposo en <b>'+f1(e.tCiclo,0)+' ms</b> con un solo relevador.');
    await sleep(5800);
    mnIdx=3;mnMan='cadena';animT=0;afterEdit();
    e=curEval();
    showToast('🔗 La '+scM.nom+' exige <b>dos</b> relevadores: K1 recuerda que hay marcha y K2 recuerda que la carrera de trabajo ya terminó, para que el retorno no vuelva a lanzar el avance. '+f1(e.coste,0)+' aparatos, y ninguno sobra.');
    await sleep(6000);

    // --- 3. CIERRE DEL CICLO: quién dice «ya llegó» ---
    setMode('cierre');
    ciIdx=1;ciCie='operario';animT=0;afterEdit();
    e=curEval();
    showToast('⏱️ El '+scE.nom.toLowerCase()+' trabaja en <b>automático</b>: no puede depender de que alguien pulse el retorno. Con cierre por operario el vástago sale y se queda fuera esperando una mano que en una línea automática no existe.');
    await sleep(5800);
    ciCie='temporizador';animT=0;afterEdit();
    e=curEval();
    showToast('⚠️ El reloj sí cierra el ciclo, pero hay que ajustarlo al peor caso: <b>PT = 1,10 × '+f1(scE.tOutMax,0)+' ms = '+f1(e.PT,0)+' ms</b>. Cada ciclo tira el margen que sobra y salen '+f1(e.ciclosH,0)+' ciclos/h frente a los <b>'+f1(scE.ritmo,0)+'</b> que pide la línea.');
    await sleep(6200);
    ciIdx=2;ciCie='fc';animT=0;afterEdit();
    const scR=POOL[2];
    e=curEval();
    const eT=EV(scR,cfgWith(GOOD(scR),'cierre','temporizador'));
    showToast('❌ En el <b>'+scR.nom.toLowerCase()+'</b> el reed <b>no es alcanzable</b>: el tope está en el '+f1(100*scR.xTope,0)+' % y la ventana de detección empieza en el '+f1(100*(1-e.umb),1)+' %. Aquí no hay temblor: <b>'+f1(e.nConm,0)+' conmutación</b> y el vástago se queda clavado empujando. El reloj es la única salida: '+f1(eT.ciclosH,0)+' ciclos/h.');
    await sleep(6400);
    ciCie='temporizador';animT=0;afterEdit();
    await sleep(3600);

    // --- 4. RETO ---
    setMode('reto');
    seedReto(3);afterEdit();
    checkReto();
    showToast('🎯 <b>Reto · '+retoSc().nom+'</b>. La propuesta de partida arranca mal en los tres ejes a propósito: '+retoMsg);
    await sleep(6400);
    retoSolveBuild();afterEdit();
    await sleep(900);
    checkReto();
    const gR=GOOD(retoSc());
    showToast('✅ Propuesta aceptada: <b>'+VALV[gR.valvula].abr+'</b> para pararse donde está, <b>'+MANDO[gR.mando].abr+'</b> para que al volver la tensión no rearranque sola (IEC 60204-1 §7.5) y <b>'+CIERRE[gR.cierre].abr+'</b> para confirmar la posición real. '+f1(costeMin(retoSc()),0)+' aparatos, el mínimo posible.');
    await sleep(6200);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));
  }finally{
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

// ===================== 21. ANIMACIÓN, EVENTOS E INICIO =====================
/* El pizarrón está vivo en los cuatro modos: el cursor de los cronogramas, los
   contactos del esquema y el carrete se mueven con la misma fase. Redibujar un
   lienzo de 1024×768 sesenta veces por segundo es un gasto inútil, así que la
   escena va a la tasa del navegador y el pizarrón a unos 20 cuadros por segundo. */
let _accB=0;
S.setAnimate((dt)=>{
  animT=(animT+dt/ANIM_CICLO)%1;
  updateHW();
  _accB+=dt;
  if(_accB>=0.05){_accB=0;drawBoard();}
});
['valvula','mando','cierre','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnAuto').onclick=()=>{if(!autoRunning)runAuto();};
el('btnNew').onclick=()=>{if(autoRunning)return;newSignal();};
el('btnCheck').onclick=()=>{if(autoRunning)return;checkReto();};
const soundBtn=el('soundBtn');if(soundBtn){soundBtn.onclick=()=>{synth.toggle();soundBtn.textContent=synth.isOn()?'🔊':'🔇';};}
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});
buildQuiz();
S.start();
setMode('valvula');

// ===================== DEBUG HOOK =====================
window.__labDebug={
  mode:()=>mode,setMode,
  // constantes selladas
  DT:()=>DT,T_REL_ON:()=>T_REL_ON,T_REL_OFF:()=>T_REL_OFF,T_SOL:()=>T_SOL,T_CARRETE:()=>T_CARRETE,
  T_MUELLE:()=>T_MUELLE,T_REED:()=>T_REED,T_V_ON:()=>T_V_ON,T_V_OFF:()=>T_V_OFF,VENT_REED:()=>VENT_REED,
  P_BOB:()=>P_BOB,DERIVA:()=>DERIVA,TOL:()=>TOL,TOL_CONG:()=>TOL_CONG,TOL_MOV:()=>TOL_MOV,
  T_FIN:()=>T_FIN,T_CORTE:()=>T_CORTE,T_OBS:()=>T_OBS,K_TEMP:()=>K_TEMP,TEMBLOR:()=>TEMBLOR,
  POOL:()=>POOL,VALV:()=>VALV,MANDO:()=>MANDO,CIERRE:()=>CIERRE,CRIT:()=>CRIT,
  VALVS:()=>VALVS,MANDOS:()=>MANDOS,CIERRES:()=>CIERRES,EJES:()=>EJES,
  // motor
  f1,preset,coste,costeDet,cfgWith,opciones,rotEje,rotVal,rotCfg,paso,simular,evalCfg,
  todasCfg,GOOD,costeMin,okEje,primerFallo,motivo,porQue,startCfg,
  // lectura y trazas
  finTxt,cortaTxt,arranqueTxt,ritmoTxt,frameEn,senales,rungsDe,
  animT:()=>animT,setAnimT:(t)=>{animT=t;refreshAll();},
  // estado
  curSc,curCfg,curEval,curTZ,curTC,
  vlGet:()=>({idx:vlIdx,valvula:vlVal}),
  vlSet:(o)=>{if(o.idx!==undefined)vlIdx=o.idx;if(o.valvula)vlVal=o.valvula;animT=0;afterEdit();},
  mnGet:()=>({idx:mnIdx,mando:mnMan}),
  mnSet:(o)=>{if(o.idx!==undefined)mnIdx=o.idx;if(o.mando)mnMan=o.mando;animT=0;afterEdit();},
  ciGet:()=>({idx:ciIdx,cierre:ciCie}),
  ciSet:(o)=>{if(o.idx!==undefined)ciIdx=o.idx;if(o.cierre)ciCie=o.cierre;animT=0;afterEdit();},
  // reto
  retoK:()=>retoK,seedReto:(k)=>{seedReto(k);afterEdit();},retoName:()=>retoSc().nom,retoId:()=>retoSc().id,
  retoGet:()=>retoCfg(),retoSet,retoSolveBuild:()=>{retoSolveBuild();afterEdit();},checkReto,retoExplain,
  retoChecked:()=>retoChecked,retoOkValvula:()=>retoOkValvula,retoOkMando:()=>retoOkMando,retoOkCierre:()=>retoOkCierre,
  retoSolved:()=>retoSolved,retoMsg:()=>retoMsg,retoGood:()=>GOOD(retoSc()),retoStart:()=>startCfg(retoSc()),
  // cuestionario
  quizCorrectIndex:()=>QUIZ[mode].opciones.findIndex(o=>o.ok),
  quizAnswer:answer,newSignal,
  solved:()=>solved,autoRunning:()=>autoRunning,
};
