/* ============================================================
   LAB — MOTOR DE INDUCCIÓN (JAULA DE ARDILLA): DESLIZAMIENTO Y CURVA PAR-VELOCIDAD
   (Dominio D5 · máquinas eléctricas — motor asíncrono trifásico)
   MOLDE E+S — ensamble 3D (molde E) que desbloquea la simulación (molde S).
   Referencia curricular: programa ELE-II.1 / EM-II.1 (máquinas de inducción).
   Normas ancla citadas en la lista maestra (d5-06): IEEE 112 e IEC 60034 —
   citadas de forma general; cláusulas específicas sin confirmar, flag ⚑.

   VERSIÓN DE ESCAPARATE. El motor se arma pieza a pieza sobre un banco y, al
   cerrarlo, se corta como un motor de corte de taller de formación: una
   ventana en el cuarto de arriba-delante deja ver la jaula del rotor, las
   cabezas de bobina, el anillo, el rodamiento y el ventilador, y un plano de
   corte transversal enseña la chapa con sus 36 ranuras, el devanado de doble
   capa y las 28 barras. Sobre esa cara se dibuja el CAMPO GIRATORIO —las
   líneas de flujo de la onda fundamental— y el rotor gira, más despacio que
   él, al ritmo del modelo. Todo lo que se mueve o se enciende sale del mismo
   reloj y de las mismas ecuaciones que pintan la curva del panel.

   Modelo de ingeniería (didáctico, ecuación de Kloss simplificada, sin
   resistencia de estátor — Fitzgerald/Kingsley/Umans, Chapman):
     · ns   = 120·f / p                     (velocidad síncrona)
     · s    = (ns − n) / ns                 (deslizamiento)
     · T(s) = 2·Tmáx / (s/sm + sm/s)         (curva par-deslizamiento)
   Punto de operación estable (rama 0<s≤sm), forma cerrada exacta:
     s(TL) = sm · (1 − √(1 − k²)) / k,    k = TL/Tmáx
   Si TL > Tmáx el motor se cala (s=1, n=0) y entrega el par de arranque T(1).
   Parámetros del motor ilustrativo (NO un datasheet): Tmáx=22 N·m, sm=0.18.
   CERO Math.random() en la física: la única aleatoriedad está en la
   SELECCIÓN de escenario del modo Reto.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.4,2.5,4.2],target:[0,1.25,0],bgTop:'#0e1a1f',bgBot:'#040607',
  bloom:0.32,minD:1.1,maxD:13,exposure:1.0,envInt:0.95});
const {scene}=S;
S.renderer.localClippingEnabled=true;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2400,Q:0.8});
const el=id=>document.getElementById(id);
const tf=(x,d=0)=>Number(x).toFixed(d);
const DEG=Math.PI/180;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function ease(x){return x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;}
const easeOut=x=>1-Math.pow(1-x,3);
/* Cifras del panel en castellano: coma decimal y espacio FINO (U+202F) entre
   millares —el que no parte la cifra al final de una línea—. */
const FINO=' ';
function fN(x,d=0){
  if(!isFinite(x)) return '—';
  const s=Math.abs(x).toFixed(d).split('.');
  s[0]=s[0].replace(/\B(?=(\d{3})+(?!\d))/g,FINO);
  return (x<0&&Number(s.join('.'))!==0?'−':'')+s.join(',');
}
const REDUCIDO=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- toast ---------- */
let toastT=null;
function showToast(html,ms=3300){ const t=el('toast'); t.innerHTML=html; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),ms); }

/* ===================== 1. FÍSICA (pura, sin three) =====================
   El script de verificación extrae este bloque TAL CUAL —entre las dos marcas—
   y lo prueba contra valores de referencia: lo que se prueba es lo que corre. */
/* FISICA:INICIO */
const SM=0.18, TMAX=22;
function Tcurve(s){ return 2*TMAX/(s/SM + SM/s); }
function motorState(f,p,TL){
  const ns=120*f/p;
  if(TL<=0) return {ns,s:0,n:ns,T:0,stalled:false,w:ns*2*Math.PI/60,Pmech:0};
  if(TL>TMAX){ const Tarr=Tcurve(1); return {ns,s:1,n:0,T:Tarr,stalled:true,w:0,Pmech:0}; }
  const k=TL/TMAX;
  const s=SM*(1-Math.sqrt(1-k*k))/k;
  const n=ns*(1-s);
  const w=n*2*Math.PI/60;
  const Pmech=TL*w;
  return {ns,s,n,T:TL,stalled:false,w,Pmech};
}
const DOSPI=2*Math.PI, TERCIO=DOSPI/3;
const Q1=36, Q2=28;                       // ranuras del estátor, barras del rotor
/* Las tres corrientes de fase, normalizadas a su pico Im. */
function corrientesFase(psi){ return [Math.cos(psi), Math.cos(psi-TERCIO), Math.cos(psi-2*TERCIO)]; }
/* EL VECTOR ESPACIAL: cada corriente empuja a lo largo del eje de su fase (0°,
   120°, 240°). La suma no late: es un vector de módulo constante 1,5·Im que
   gira a la pulsación de la red. Ésa es toda la razón de que haya campo
   giratorio sin piezas que giren. */
function vectorEspacial(psi){
  const i=corrientesFase(psi); let re=0, im=0;
  for(let k=0;k<3;k++){ re+=i[k]*Math.cos(k*TERCIO); im+=i[k]*Math.sin(k*TERCIO); }
  return {re,im,mod:Math.hypot(re,im),ang:Math.atan2(im,re)};
}
/* B(θ,t) ∝ Σ i_k(t)·cos(P·θ − k·120°): el campo del entrehierro con P pares de
   polos (θ mecánico). Es 1,5·cos(Pθ − ψ): una onda que avanza a ω/P. */
function campoFases(th,psi,P){ const i=corrientesFase(psi); let b=0; for(let k=0;k<3;k++) b+=i[k]*Math.cos(P*th-k*TERCIO); return b; }
function anguloRanura(k){ return (k+0.5)*DOSPI/Q1; }
function pasoBobina(P){ return Math.max(1,Math.round(Q1/(2*P))); }
/* EL DEVANADO DE DOBLE CAPA. Cada ranura lleva dos lados de bobina: el de
   arriba (junto al entrehierro) por la banda de 60° eléctricos en la que cae,
   A+, C−, B+, A−, C+, B−, y el de abajo es la VUELTA de la bobina que empezó
   «paso» ranuras antes, con el sentido cambiado. Con 36 ranuras eso da un
   devanado realizable para 2, 4, 6 y 8 polos —con 8 es de ranura fraccionaria,
   q = 1,5—, y la fundamental de su lámina de corriente se calcula aquí de los
   72 conductores, no se supone. `gam` es el desfase de esa onda. */
function devanado(P){
  const y=pasoBobina(P), sup=[];
  const BANDA=[[0,1],[2,-1],[1,1],[0,-1],[2,1],[1,-1]];
  for(let k=0;k<Q1;k++){
    const a=((P*anguloRanura(k))%DOSPI+DOSPI)%DOSPI;
    sup.push(BANDA[Math.floor((a+1e-9)/(Math.PI/3))%6]);
  }
  const cond=[];
  for(let k=0;k<Q1;k++){
    const [phT,sgT]=sup[k], [phB,sgB]=sup[(k-y+Q1)%Q1];
    cond.push({k,capa:0,ph:phT,sg:sgT,th:anguloRanura(k)});
    cond.push({k,capa:1,ph:phB,sg:-sgB,th:anguloRanura(k)});
  }
  let re=0, im=0;
  for(const c of cond){ const i=c.sg*Math.cos(-c.ph*TERCIO); re+=i*Math.cos(P*c.th); im-=i*Math.sin(P*c.th); }
  const gam=-Math.atan2(im,re);
  const bobinas=[]; for(let k=0;k<Q1;k++) bobinas.push({k,k2:(k+y)%Q1,ph:sup[k][0],sg:sup[k][1]});
  return {P,y,cond,gam,bobinas};
}
function corrienteConductor(c,psi){ return c.sg*Math.cos(psi-c.ph*TERCIO); }
/* Fundamental (armónico P) de la lámina de corriente de los 72 conductores. */
function fundamentalLamina(dv,psi){
  let re=0, im=0;
  for(const c of dv.cond){ const i=corrienteConductor(c,psi); re+=i*Math.cos(dv.P*c.th); im-=i*Math.sin(dv.P*c.th); }
  return {mod:Math.hypot(re,im),arg:Math.atan2(im,re)};
}
/* LÍNEAS DE FLUJO. Con hierro lineal y sin ranuras, la onda fundamental se
   resuelve con la ecuación de Laplace en dos regiones: dentro del radio de la
   lámina de corriente Rg, A ∝ (r/Rg)^P; fuera, la combinación que se anula en
   el borde exterior de la corona Ro (no sale flujo por la carcasa). Las
   curvas de nivel de A son las líneas de flujo y entre dos vecinas pasa
   siempre el mismo flujo: donde se juntan, el campo es más fuerte. */
function Gradial(r,P,Rg,Ro){
  if(r<Rg) return Math.pow(r/Rg,P);
  return (Math.pow(r/Ro,-P)-Math.pow(r/Ro,P))/(Math.pow(Rg/Ro,-P)-Math.pow(Rg/Ro,P));
}
function flujoA(r,th,psi,P,gam,Rg,Ro){ return Gradial(r,P,Rg,Ro)*Math.cos(P*th-psi-gam); }
/* B radial en el entrehierro (normalizado): positivo = sale del rotor y entra
   al estátor. Br = (1/r)·∂A/∂θ con A = G·cos(Pθ−ψ−γ). */
function bRadial(th,psi,P,gam){ return -Math.sin(P*th-psi-gam); }
/* LA CORRIENTE DE LAS BARRAS. El campo barre las barras a la velocidad del
   deslizamiento: la f.e.m. de cada barra es proporcional a s·Br en ella y la
   corriente la sigue con el retraso de la reactancia del rotor, φ₂ = atan(s/sm).
   Su amplitud, normalizada a la de rotor bloqueado con s→∞, es s/√(s²+sm²).
   (sm = R₂/X₂ es exactamente el deslizamiento de par máximo de Kloss.) */
function rotorCorriente(s){ return {amp:s/Math.sqrt(s*s+SM*SM), fase:Math.atan2(s,SM)}; }
function iBarra(thb,psi,P,gam,s){ const {amp,fase}=rotorCorriente(s); return amp*Math.cos(P*thb-psi-gam+Math.PI/2+fase); }
/* El par que dan ESAS barras en ESE campo: Σ i_j·Br(θ_j). Normalizado, es la
   curva de Kloss — así el brillo de las barras y la curva del panel no pueden
   contradecirse. */
function parDeBarras(s,psi,P,gam,thR){
  let t=0; for(let j=0;j<Q2;j++){ const th=thR+j*DOSPI/Q2; t+=iBarra(th,psi,P,gam,s)*bRadial(th,psi,P,gam); }
  return 2*TMAX*(2/Q2)*t;
}
/* ESTROBOSCOPIO a la frecuencia de red: el campo y las corrientes del estátor
   repiten cada destello y se quedan quietos; una marca repetida en cada par de
   polos avanza (1−s)·2π/P por destello, que el ojo lee como un retroceso de
   s·ns mientras s ≤ ½ (más allá, lo lee como avance de (1−s)·ns). */
function velEstrobo(s,ws){ return s<=0.5 ? -s*ws : (1-s)*ws; }
const VEL_N=[20,50,100,200,500,1000];
/* Cámara lenta automática: el campo da ~0,3 vueltas por segundo en pantalla. */
function camaraLentaAuto(ns){ const obj=ns/60/0.3; let b=VEL_N[0];
  for(const n of VEL_N) if(Math.abs(Math.log(n/obj))<Math.abs(Math.log(b/obj))) b=n; return b; }
/* En el estroboscopio la velocidad aparente ya es lenta (s·ns): se frena sólo lo
   justo para que la marca no pase de ~0,35 vueltas por segundo en pantalla. */
const VEL_E=[1,2,5,10,20,50,100];
function lentoEstrobo(wAp){ const rps=Math.abs(wAp)/DOSPI; for(const n of VEL_E) if(rps/n<=0.35) return n; return VEL_E[VEL_E.length-1]; }
/* FISICA:FIN */

/* ===================== 2. COTAS DE LA MÁQUINA =====================
   1 unidad de escena = 200 mm. Proporciones de un motor TEFC de ~2 kW y cuatro
   polos en carcasa IEC 100L (las del motor ilustrativo de Kloss). El eje de la
   máquina es +X; las secciones se dibujan en el plano (u, v) con u → −Z y
   v → +Y, que es como se ve la cara de corte desde +X: θ se mide desde u,
   en sentido antihorario visto desde el lado de acople. */
const D={
  rEje:0.085, rEjeRod:0.075, rEjeExt:0.07,
  rRot:0.2375, rSi:0.2415, rSo:0.3875,
  rFi:0.3887, rFs:0.4375, rFt:0.515,
  lc:0.60, xCarc:0.62, vuelo:0.13, yEje:1.33,
};
const RAN=(function(){ // ranura del estátor, semicerrada y de dientes paralelos
  const b0=0.010, h0=0.004, r1=D.rSi+0.013, diente=0.022, rFondo=0.3165;
  const ancho=r=>r*DOSPI/Q1-diente;
  const r2=(rFondo*2+diente)/(DOSPI/Q1+2), w2=ancho(r2);
  return {b0,h0,r1,diente,rFondo,r2,w1:ancho(r1),w2,ancho,
    rTop:(r1+(r1+r2)/2)/2+0.003, rBot:(r2+(r1+r2)/2)/2+0.004, rMid:(r1+r2)/2};
})();
const BAR=(function(){ // ranura (y barra) del rotor, en pera, abierta 2 mm a la superficie
  const ab=0.010, rC=D.rRot-0.024, rA=0.0155, rB=0.0065, rCb=D.rRot-0.068;
  return {ab,rC,rA,rB,rCb,rGl:(rC+rCb)/2+0.006};
})();
const X_VENT=0.16, X_CORTE=0.28, X_SIN=3.0;   // fin de la ventana; plano de corte; «sin corte»
const VENT=[110*DEG,200*DEG];                 // la ventana, en θ de la sección
const GIRO_TOT=DOSPI/Q1;                      // inclinación de las barras: un paso de ranura
const giroEn=x=>GIRO_TOT*(x/D.lc);
const M0=new THREE.Vector3(0,D.yEje,0);       // centro del motor en el banco
const Y_MESA=0.80;

/* ===================== 3. CALIDAD Y ESTUDIO ===================== */
const CAL={nivel:'alta',motivo:''};
(function(){
  const q=(location.search.match(/[?&]calidad=(alta|media)\b/)||[])[1];
  const movil=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const nucleos=navigator.hardwareConcurrency||8;
  const flojo=movil||innerWidth<820||nucleos<=2;
  CAL.nivel=q||(flojo?'media':'alta');
  CAL.motivo=q?'elegida en la dirección':(flojo?(movil?'móvil':(innerWidth<820?'pantalla estrecha':'el equipo declara '+nucleos+' núcleos')):'');
})();
const calAlta=()=>CAL.nivel==='alta';
const SEG=()=>calAlta()?56:32;
/* El desenfoque de profundidad del molde se apaga: un motor de catálogo se
   mira nítido de punta a punta, y ese pase era el que emborronaba las aristas. */
for(const p of S.composer.passes) if(p.materialBokeh||(p.uniforms&&p.uniforms.aperture)) p.enabled=false;
S.bloom.threshold=0.86; S.bloom.strength=0.30; S.bloom.radius=0.42;
/* Luz de estudio: clave cálida y alta, contra fría que recorta el canto de las
   aletas, relleno bajo y frío; el suelo, mate y sin los anillos del molde. */
const LUZ={};
scene.traverse(o=>{
  if(o.isDirectionalLight&&o.castShadow) LUZ.clave=o;
  else if(o.isSpotLight) LUZ.contra=o;
  else if(o.isDirectionalLight) LUZ.relleno=o;
  else if(o.isHemisphereLight) LUZ.hemi=o;
});
if(LUZ.clave){ const k=LUZ.clave; k.color.set('#fff3e6'); k.intensity=2.35; k.position.set(3.2,8.5,6.4);
  k.shadow.bias=-0.0004; k.shadow.normalBias=0.012; k.shadow.radius=4;
  Object.assign(k.shadow.camera,{left:-4.2,right:4.2,top:4.2,bottom:-3.2}); k.shadow.camera.updateProjectionMatrix(); }
if(LUZ.contra){ LUZ.contra.color.set('#cfe2ff'); LUZ.contra.intensity=7.5; LUZ.contra.position.set(-5.5,5.5,-5); }
if(LUZ.relleno){ LUZ.relleno.color.set('#9fc0e0'); LUZ.relleno.intensity=0.42; LUZ.relleno.position.set(4.5,2.2,5); }
if(LUZ.hemi) LUZ.hemi.intensity=0.24;
for(const o of scene.children.slice()){
  if(!o.isMesh||!o.geometry) continue;
  if(o.geometry.type==='RingGeometry') scene.remove(o);
  else if(o.geometry.type==='CircleGeometry'&&o.geometry.parameters.radius>=30){
    o.material.color.set('#0c0f12'); o.material.roughness=0.72; o.material.metalness=0.08; o.material.envMapIntensity=0.35; }
}

/* ===================== 4. MATERIALES =====================
   PBR con entorno. Ninguna textura lleva poro ni grano fino —se leía como lija
   sobre caras grandes—: sólo variaciones lentas de rugosidad y, donde la pieza
   las tiene de verdad, rayas regulares (las chapas del paquete, los hilos de
   la cabeza de bobina). Todas las texturas son periódicas: se repiten sin
   costura. */
function ruidoPeriodico(semilla,periodo){
  const g=(x,y)=>{ x=((x%periodo)+periodo)%periodo; y=((y%periodo)+periodo)%periodo;
    const s=Math.sin(x*127.1+y*311.7+semilla*13.13)*43758.5453; return s-Math.floor(s); };
  return (x,y)=>{ const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi;
    const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
    return g(xi,yi)*(1-u)*(1-v)+g(xi+1,yi)*u*(1-v)+g(xi,yi+1)*(1-u)*v+g(xi+1,yi+1)*u*v; };
}
function fbmP(semilla,periodo,oct){ const ns=[]; for(let o=0;o<oct;o++) ns.push(ruidoPeriodico(semilla+o*7,periodo*(1<<o)));
  return (x,y)=>{ let v=0,a=0.5; for(let o=0;o<oct;o++){ v+=ns[o](x*(1<<o),y*(1<<o))*a; a*=0.5; } return v; }; }
/* Mapa de rugosidad y de normales de variación lenta (pintura, fundición). */
function pielLenta(semilla,{px=256,celdas=4,oct=3,rug0=0.45,rugA=0.10,relieve=0.6}={}){
  const f=fbmP(semilla,celdas,oct), k=celdas/px;
  const c=cv(px), x=c.getContext('2d'), im=x.createImageData(px,px);
  for(let j=0;j<px;j++) for(let i=0;i<px;i++){ const v=clamp(rug0+(f(i*k,j*k)-0.5)*2*rugA,0,1)*255, o=(j*px+i)*4;
    im.data[o]=im.data[o+1]=im.data[o+2]=v; im.data[o+3]=255; }
  x.putImageData(im,0,0);
  const nrm=normalFromHeight(px,(i,j)=>f(i*k,j*k),relieve);
  return {roughnessMap:tex(c),normalMap:tex(nrm)};
}
/* Las chapas del paquete: rayas regulares a lo largo del eje (coordenada v de
   las uv del barrido = metros de eje). Cada chapa con su tono de barniz. */
function texChapas(){
  const px=256, nCh=32, c=cv(px), x=c.getContext('2d'), im=x.createImageData(px,px);
  const azar=k=>{ const s=Math.sin(k*91.7+3.1)*43758.5453; return s-Math.floor(s); };
  const h=(i,j)=>{ const t=j/px*nCh, k=Math.floor(t), f=t-k; return 0.5+0.5*Math.cos(f*DOSPI)*0.5+azar(k)*0.15; };
  for(let j=0;j<px;j++) for(let i=0;i<px;i++){ const t=j/px*nCh, k=Math.floor(t);
    const v=clamp(0.40+(azar(k)-0.5)*0.12+0.06*Math.cos((t-k)*DOSPI),0,1)*255, o=(j*px+i)*4;
    im.data[o]=im.data[o+1]=im.data[o+2]=v; im.data[o+3]=255; }
  x.putImageData(im,0,0);
  return {roughnessMap:tex(c),normalMap:tex(normalFromHeight(px,h,0.9))};
}
/* Los hilos de una cabeza de bobina: rayas a lo largo del haz (uv de TubeGeometry: v rodea el tubo). */
function texHilos(){
  const px=128, n=10, c=cv(px), x=c.getContext('2d'), im=x.createImageData(px,px);
  const h=(i,j)=>0.5+0.5*Math.cos(j/px*n*DOSPI);
  for(let j=0;j<px;j++) for(let i=0;i<px;i++){ const v=(0.30+0.08*Math.cos(j/px*n*DOSPI))*255, o=(j*px+i)*4;
    im.data[o]=im.data[o+1]=im.data[o+2]=v; im.data[o+3]=255; }
  x.putImageData(im,0,0);
  return {roughnessMap:tex(c),normalMap:tex(normalFromHeight(px,h,1.6))};
}
const T_PINT=pielLenta(11,{celdas:5,rug0:0.40,rugA:0.08,relieve:0.45});
const T_FUND=pielLenta(23,{celdas:6,rug0:0.46,rugA:0.10,relieve:0.7});
const T_CHAP=texChapas(), T_HILO=texHilos();
const T_MESA=pielLenta(31,{celdas:3,rug0:0.62,rugA:0.08,relieve:0.25});
for(const t of [T_CHAP.roughnessMap,T_CHAP.normalMap]) t.repeat.set(1,1/0.012);   // una tesela = 12 mm de paquete
for(const t of [T_HILO.roughnessMap,T_HILO.normalMap]) t.repeat.set(6,1);
for(const t of [T_PINT.roughnessMap,T_PINT.normalMap]) t.repeat.set(2,2);
const nS=k=>new THREE.Vector2(k,k);
const pbr=(o)=>new THREE.MeshStandardMaterial(o);
const fis=(o)=>new THREE.MeshPhysicalMaterial(o);
/* Ojo: three MULTIPLICA roughness por el canal del roughnessMap. Las pieles ya
   traen la rugosidad real (≈0,40 la pintura y la chapa, ≈0,46 la fundición),
   así que el factor va cerca de 1: con 0,4 × 0,4 todo salía espejado y quemado. */
const MAT={
  pintura:  fis({color:0x3e5a6e,roughness:0.85,metalness:0.12,clearcoat:0.45,clearcoatRoughness:0.32,
              roughnessMap:T_PINT.roughnessMap,normalMap:T_PINT.normalMap,normalScale:nS(0.35),envMapIntensity:0.9}),
  chapa:    pbr({color:0x60676f,roughness:0.92,metalness:0.72,roughnessMap:T_CHAP.roughnessMap,
              normalMap:T_CHAP.normalMap,normalScale:nS(0.55),envMapIntensity:0.95}),
  cobre:    fis({color:0xc4734a,roughness:0.30,metalness:1.0,clearcoat:0.6,clearcoatRoughness:0.25,envMapIntensity:1.1}),
  aluCage:  pbr({color:0xc6cbd0,roughness:0.95,metalness:0.92,roughnessMap:T_FUND.roughnessMap,
              normalMap:T_FUND.normalMap,normalScale:nS(0.25),envMapIntensity:1.0}),
  eje:      pbr({color:0xc4c9ce,roughness:0.32,metalness:1.0,envMapIntensity:0.95}),
  rodam:    pbr({color:0xcfd4d9,roughness:0.12,metalness:1.0,envMapIntensity:1.3}),
  bola:     pbr({color:0xe8ecef,roughness:0.06,metalness:1.0,envMapIntensity:1.4}),
  polimero: pbr({color:0x343c44,roughness:0.48,metalness:0.0,envMapIntensity:0.8}),
  chapaCub: fis({color:0x3e5a6e,roughness:0.40,metalness:0.15,clearcoat:0.4,clearcoatRoughness:0.3,envMapIntensity:0.9}),
  negro:    pbr({color:0x15181b,roughness:0.6,metalness:0.2}),
  cuna:     pbr({color:0xd9c9a0,roughness:0.7,metalness:0.0}),          // cuña de cierre de ranura
  junta:    pbr({color:0x1a1c1e,roughness:0.85,metalness:0.0}),         // retén de goma
  // banco
  mesa:     pbr({color:0x24272b,roughness:1.0,metalness:0.18,roughnessMap:T_MESA.roughnessMap,
              normalMap:T_MESA.normalMap,normalScale:nS(0.2),envMapIntensity:0.6}),
  canto:    pbr({color:0x8e959c,roughness:0.32,metalness:0.9,envMapIntensity:0.9}),
  tapete:   pbr({color:0x1d2a31,roughness:0.88,metalness:0.0,envMapIntensity:0.4}),
  pata:     pbr({color:0x2c3136,roughness:0.5,metalness:0.6}),
  placa:    pbr({color:0x6c737a,roughness:0.34,metalness:0.88,envMapIntensity:0.9}),
  anod:     pbr({color:0x5f7480,roughness:0.36,metalness:0.75,envMapIntensity:0.9}),
};
/* Esmalte de cada fase en las cabezas de bobina: el cobre es el mismo, cambia
   el barniz (como el hilo esmaltado de colores). Rojo, ámbar y verde, los
   mismos colores que llevan las tres fases en el panel. */
const COL_FASE=['#d0533c','#e2a83a','#4fb38a'];
const ESMALTE=[0xb4462e,0xc9902f,0x3f8f6c];
const MAT_FASE=ESMALTE.map(c=>fis({color:c,roughness:1.0,metalness:0.55,clearcoat:0.8,clearcoatRoughness:0.2,
  roughnessMap:T_HILO.roughnessMap,normalMap:T_HILO.normalMap,normalScale:nS(0.5),emissive:new THREE.Color(COL_FASE[0]),emissiveIntensity:0,envMapIntensity:1.0}));
MAT_FASE.forEach((m,i)=>m.emissive.set(COL_FASE[i]));

/* ---------- EL CORTE VIVO ----------
   Un plano de corte (x ≤ xc en coordenadas del motor) que recorta todas las
   piezas del motor a la vez. La CARA de sección no se modela pieza por pieza:
   se pinta con la cara interior del propio sólido. Cuando el plano abre una
   pieza cerrada, lo único que queda a la vista detrás del plano es su cara
   de DENTRO (las caras traseras); el sombreador las pinta planas, con la
   normal del plano y el color de sección de cada material, y sin sombra
   arrojada —esa cara es la de corte, no la de dentro—. Así la sección sale
   exacta en cualquier posición del plano y el corte puede barrer la máquina. */
const CLIP=new THREE.Plane(new THREE.Vector3(-1,0,0),X_SIN);
const CAP_N=new THREE.Vector3(1,0,0);
const LUCES_SIN_SOMBRA_DENTRO=THREE.ShaderChunk.lights_fragment_begin
  .split('( directLight.visible && receiveShadow )').join('( directLight.visible && receiveShadow && gl_FrontFacing )');
/* RAYADO DE SECCIÓN (o.rayado): líneas finas a 45° en coordenadas de MUNDO,
   como el rayado de un plano de taller; con `todo`, también en las caras de
   frente (las caras planas de la ventana). Se desvanece solo cuando las líneas
   quedarían a menos de ~3 px: nunca hace muaré. */
function conCorte(mat,o){
  mat.side=THREE.DoubleSide; mat.clippingPlanes=[CLIP]; mat.clipShadows=true;
  const u={uCapCol:{value:new THREE.Color(o.color)},uCapRough:{value:o.rough??0.5},uCapMetal:{value:o.metal??0.0},uCapN:{value:CAP_N},
    uRaya:{value:o.rayado?1:0},uRayaTodo:{value:o.todo?1:0}};
  const prev=mat.onBeforeCompile;
  mat.onBeforeCompile=(sh,r)=>{
    if(prev) prev.call(mat,sh,r);
    Object.assign(sh.uniforms,u);
    sh.vertexShader=sh.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 vWc;')
      .replace('#include <project_vertex>','#include <project_vertex>\n vWc=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader=sh.fragmentShader
      .replace('#include <common>','#include <common>\nuniform vec3 uCapCol; uniform float uCapRough; uniform float uCapMetal; uniform vec3 uCapN; uniform float uRaya; uniform float uRayaTodo; varying vec3 vWc;\n'+
        'float rayado(){ float d=dot(vWc,vec3(0.57735))/0.0105; float fw=fwidth(d); float h=abs(fract(d)-0.5)*2.0;'+
        ' float l=1.0-smoothstep(0.30-fw,0.30+fw,h); return l*(1.0-smoothstep(0.18,0.34,fw)); }')
      .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\n if(!gl_FrontFacing){ diffuseColor.rgb=uCapCol; roughnessFactor=uCapRough; metalnessFactor=uCapMetal; }\n'+
        ' if(uRaya>0.5&&(!gl_FrontFacing||uRayaTodo>0.5)) diffuseColor.rgb*=1.0-0.30*rayado();')
      .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n if(!gl_FrontFacing){ normal=normalize((viewMatrix*vec4(uCapN,0.0)).xyz); }')
      .replace('#include <clearcoat_normal_fragment_maps>','#include <clearcoat_normal_fragment_maps>\n#ifdef USE_CLEARCOAT\n if(!gl_FrontFacing){ clearcoatNormal=normal; }\n#endif')
      .replace('#include <lights_fragment_begin>',LUCES_SIN_SOMBRA_DENTRO);
  };
  const k0=mat.customProgramCacheKey?mat.customProgramCacheKey.bind(mat):()=>'';
  mat.customProgramCacheKey=()=>k0()+'|corte'+(o.clave||'');
  return mat;
}
/* Brillo por elemento: cada conductor (o cada barra) lleva su índice como
   atributo, y su corriente llega en un arreglo uniforme. Una sola malla, una
   sola llamada de dibujo, setenta y dos brillos distintos. */
function conBrillo(mat,n,color,clave,fases){
  // con `fases`, cada elemento brilla con el color de su fase (uF[i] = 0, 1, 2), el mismo del panel
  const u={uI:{value:new Float32Array(n)},uGlow:{value:new THREE.Color(color)},uGain:{value:1},
    uF:{value:new Float32Array(n)},uC:{value:(fases||[color,color,color]).map(c=>new THREE.Color(c))}};
  const prev=mat.onBeforeCompile;
  mat.onBeforeCompile=(sh,r)=>{
    if(prev) prev.call(mat,sh,r);
    Object.assign(sh.uniforms,u);
    sh.vertexShader=sh.vertexShader
      .replace('#include <common>','#include <common>\nattribute float aIdx; uniform float uI['+n+']; uniform float uF['+n+']; uniform vec3 uC[3]; varying float vGlow; varying vec3 vGcol;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\n int iq=int(aIdx+0.5); vGlow=abs(uI[iq]); vGcol=uC[int(uF[iq]+0.5)];');
    sh.fragmentShader=sh.fragmentShader
      .replace('#include <common>','#include <common>\nuniform vec3 uGlow; uniform float uGain; varying float vGlow; varying vec3 vGcol;')
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+='+(fases?'vGcol':'uGlow')+'*uGain*vGlow;');
  };
  const k0=mat.customProgramCacheKey?mat.customProgramCacheKey.bind(mat):()=>'';
  mat.customProgramCacheKey=()=>k0()+'|brillo'+n+(clave||'');
  mat.userData.brillo=u;
  return mat;
}
/* LOS POLOS EN LA PARED DEL AGUJERO (estátor en el banco). La cara de los
   dientes se tiñe con el signo de Br = −sin(Pθ − ψ − γ) en el entrehierro:
   rojo donde el flujo sale del estátor (su polo norte), azul donde entra. Es
   el mismo Br del bloque de física y de la capa del corte, en el marco de la
   pieza (uMEst lleva del mundo al estátor, que puede ir en la mano). */
function conPolos(mat){
  const u={uPolos:{value:0},uMEst:{value:new THREE.Matrix4()},uPp:{value:2},uPsiP:{value:0},uGamP:{value:0},uRgP:{value:D.rSi}};
  const prev=mat.onBeforeCompile;
  mat.onBeforeCompile=(sh,r)=>{
    if(prev) prev.call(mat,sh,r);
    Object.assign(sh.uniforms,u);
    sh.vertexShader=sh.vertexShader
      .replace('#include <common>','#include <common>\nuniform mat4 uMEst; varying vec3 vLoc;')
      .replace('#include <project_vertex>','#include <project_vertex>\n vLoc=(uMEst*modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader=sh.fragmentShader
      .replace('#include <common>','#include <common>\nuniform float uPolos,uPp,uPsiP,uGamP,uRgP; varying vec3 vLoc;')
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n if(uPolos>0.001&&gl_FrontFacing){ float rr=length(vLoc.yz); float bb=-sin(uPp*atan(vLoc.y,-vLoc.z)-uPsiP-uGamP);'+
        ' float ww=(1.0-smoothstep(uRgP+0.003,uRgP+0.012,rr))*(1.0-smoothstep(0.29,0.30,abs(vLoc.x)));'+
        ' totalEmissiveRadiance+=(bb<0.0?vec3(1.0,0.28,0.16):vec3(0.22,0.50,1.0))*abs(bb)*ww*uPolos; }');
  };
  const k0=mat.customProgramCacheKey?mat.customProgramCacheKey.bind(mat):()=>'';
  mat.customProgramCacheKey=()=>k0()+'|polos';
  mat.userData.polos=u;
  return mat;
}
/* Los materiales del MOTOR se clonan con el corte (las piezas del banco son las
   mismas: mientras se arma, el plano está lejos y no recorta nada). */
// sección de fundición y chapa: teja oscura, poco saturada, con rayado fino (se lee como corte, no como adorno)
const ROJO_CORTE='#6f3e37', CARA_CHAPA='#4f5861';
const MC={
  pintura: conCorte(MAT.pintura.clone(),{color:ROJO_CORTE,rough:0.55,metal:0.05,rayado:true,clave:'pint'}),
  chapa:   conPolos(conCorte(MAT.chapa.clone(),{color:CARA_CHAPA,rough:0.42,metal:0.70,clave:'chapa'})),
  aluCage: conCorte(MAT.aluCage.clone(),{color:'#cfd4d8',rough:0.30,metal:0.9,clave:'alu'}),
  eje:     conCorte(MAT.eje.clone(),{color:'#c9ced3',rough:0.28,metal:1.0,clave:'eje'}),
  rodam:   conCorte(MAT.rodam.clone(),{color:'#c9ced3',rough:0.28,metal:1.0,clave:'rod'}),
  bola:    conCorte(MAT.bola.clone(),{color:'#d0d5da',rough:0.2,metal:1.0,clave:'bola'}),
  polimero:conCorte(MAT.polimero.clone(),{color:'#3a3f45',rough:0.6,metal:0,clave:'pol'}),
  chapaCub:conCorte(MAT.chapaCub.clone(),{color:ROJO_CORTE,rough:0.55,metal:0.05,rayado:true,clave:'cub'}),
  negro:   conCorte(MAT.negro.clone(),{color:ROJO_CORTE,rough:0.55,metal:0.05,rayado:true,clave:'negro'}),
  cuna:    conCorte(MAT.cuna.clone(),{color:'#d9c9a0',rough:0.7,metal:0,clave:'cuna'}),
  junta:   conCorte(MAT.junta.clone(),{color:'#2a2c2e',rough:0.8,metal:0,clave:'junta'}),
  cobreC:  conBrillo(conCorte(MAT.cobre.clone(),{color:'#c97a52',rough:0.30,metal:1.0,clave:'cobre'}),2*Q1,'#ffd2a0','est',COL_FASE),
  barras:  conBrillo(conCorte(MAT.aluCage.clone(),{color:'#c4cad0',rough:0.30,metal:0.95,clave:'barra'}),Q2,'#ff9440','rot'),
  rojo:    conCorte(pbr({color:ROJO_CORTE,roughness:0.62,metalness:0.05,envMapIntensity:0.6}),{color:ROJO_CORTE,rough:0.62,metal:0.05,rayado:true,todo:true,clave:'rojo'}),
  chapaCara:conCorte(pbr({color:CARA_CHAPA,roughness:0.42,metalness:0.70,envMapIntensity:0.9}),{color:CARA_CHAPA,rough:0.42,metal:0.70,clave:'cara'}),
  fase:    MAT_FASE.map((m,i)=>conCorte(m.clone(),{color:'#d2845a',rough:0.3,metal:1.0,clave:'fase'+i})),
  // el paquete del rotor, torneado y recocido: más oscuro que el del estátor (y así sus barras se leen)
  chapaRot:conCorte(pbr({color:0x3a4046,roughness:0.64,metalness:0.55,
              normalMap:T_CHAP.normalMap,normalScale:nS(0.5),envMapIntensity:0.85}),{color:CARA_CHAPA,rough:0.42,metal:0.70,clave:'chapaRot'}),
};
MC.fase.forEach((m,i)=>{ m.emissive.set(COL_FASE[i]); m.emissiveIntensity=0; });
const TODOS_MC=[MC.rojo,MC.chapaCara,MC.chapaRot,MC.pintura,MC.chapa,MC.aluCage,MC.eje,MC.rodam,MC.bola,MC.polimero,MC.chapaCub,MC.negro,MC.cuna,MC.junta,MC.cobreC,MC.barras,...MC.fase];

/* ===================== 5. GEOMETRÍA =====================
   Tres operaciones bastan para toda la máquina: BARRER una sección a lo largo
   del eje (chapas, barras, conductores, carcasa con aletas), REVOLUCIONAR un
   perfil —con su ventana de corte y las dos caras que deja— (tapas, anillos,
   eje, cubierta) y TENDER un tubo por una curva (cabezas de bobina). */
function area2(c){ let a=0; for(let i=0;i<c.length;i++){ const p=c[i], q=c[(i+1)%c.length]; a+=p[0]*q[1]-q[0]*p[1]; } return a/2; }
function limpia(c){ const r=[]; for(const p of c){ const u=r[r.length-1]; if(!u||Math.hypot(u[0]-p[0],u[1]-p[1])>1e-6) r.push([p[0],p[1]]); }
  while(r.length>2&&Math.hypot(r[0][0]-r[r.length-1][0],r[0][1]-r[r.length-1][1])<1e-6) r.pop(); return r; }
const polar=(r,a)=>[r*Math.cos(a),r*Math.sin(a)];
/* Lleva una sección (u, v) a coordenadas del motor: x = eje, y = v, z = −u. */
/**
 * BARRIDO de una sección con huecos a lo largo del eje, con giro opcional
 * (las barras inclinadas del rotor). Devuelve una geometría NO indexada con
 * grupos: 0 = paredes, y los que diga `fA(a,b)` por arista (null = no se
 * levanta; {g, x0, x1} = grupo y tramo de eje) y `gT0/gT1` para las tapas.
 * Las aristas se duplican donde la sección dobla más de `arista` grados: así un
 * canto de ranura sale vivo y el diámetro sale liso.
 */
function barrido(lazos,x0,x1,o={}){
  const {pasos=1,giro=null,tapa0=true,tapa1=true,arista=38,fA=null,gT0=0,gT1=0}=o;
  const L=lazos.map((c,i)=>{ c=limpia(c); const a=area2(c); return (i===0?a<0:a>0)?c.slice().reverse():c; });
  const G={}; const put=(g,P,N,U)=>{ const b=G[g]||(G[g]={p:[],n:[],u:[]}); for(const v of P) b.p.push(v); for(const v of N) b.n.push(v); for(const v of U) b.u.push(v); };
  const cosL=Math.cos(arista*DEG);
  const rot=(p,a)=>a?[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a)]:p;
  const gx=x=>giro?giro(x):0;
  for(const c of L){
    const n=c.length, en=[];
    for(let i=0;i<n;i++){ const a=c[i], b=c[(i+1)%n], dx=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dx,dy)||1; en.push([dy/l,-dx/l]); }
    const nV=(i,lado)=>{ // normal del vértice i para la arista que sale (lado=1) o llega (lado=0)
      const ePrev=en[(i-1+n)%n], eNext=en[i], d=ePrev[0]*eNext[0]+ePrev[1]*eNext[1];
      if(d<cosL) return lado?eNext:ePrev;
      const m=[ePrev[0]+eNext[0],ePrev[1]+eNext[1]], l=Math.hypot(m[0],m[1])||1; return [m[0]/l,m[1]/l]; };
    let s=0;
    for(let i=0;i<n;i++){
      const A=c[i], B=c[(i+1)%n], lAB=Math.hypot(B[0]-A[0],B[1]-A[1]);
      const f=fA?fA(A,B):{g:0}; if(f===null){ s+=lAB; continue; }
      const xa=f.x0??x0, xb=f.x1??x1, g=f.g??0;
      const np=Math.max(1,Math.round(pasos*(xb-xa)/(x1-x0)));
      const nA=nV(i,1), nB=nV((i+1)%n,0);
      for(let k=0;k<np;k++){
        const xs=xa+(xb-xa)*k/np, xt=xa+(xb-xa)*(k+1)/np, g0=gx(xs), g1=gx(xt);
        const a0=rot(A,g0), b0=rot(B,g0), a1=rot(A,g1), b1=rot(B,g1);
        const na0=rot(nA,g0), nb0=rot(nB,g0), na1=rot(nA,g1), nb1=rot(nB,g1);
        const V=(p,x)=>[x,p[1],-p[0]], Nn=q=>[0,q[1],-q[0]];
        // triángulos (A_s, B_s, B_t) y (A_s, B_t, A_t): normales hacia fuera
        put(g,[...V(a0,xs),...V(b0,xs),...V(b1,xt), ...V(a0,xs),...V(b1,xt),...V(a1,xt)],
          [...Nn(na0),...Nn(nb0),...Nn(nb1), ...Nn(na0),...Nn(nb1),...Nn(na1)],
          [s,xs, s+lAB,xs, s+lAB,xt, s,xs, s+lAB,xt, s,xt]);
      }
      s+=lAB;
    }
  }
  // tapas: triangulación de la sección con sus huecos
  const cont=L[0].map(p=>new THREE.Vector2(p[0],p[1])), hu=L.slice(1).map(h=>h.map(p=>new THREE.Vector2(p[0],p[1])));
  const todos=[...L[0],...L.slice(1).flat()];
  const tris=(tapa0||tapa1)?THREE.ShapeUtils.triangulateShape(cont,hu):[];
  const tapa=(x,sgn,g)=>{ const a=gx(x), P=[], N=[], U=[];
    for(const t of tris){ let [i,j,k]=t; const p=todos[i], q=todos[j], r=todos[k];
      const ar=(q[0]-p[0])*(r[1]-p[1])-(r[0]-p[0])*(q[1]-p[1]);
      if((ar>0)!==(sgn>0)){ const z=j; j=k; k=z; }
      for(const m of [i,j,k]){ const pr=rot(todos[m],a); P.push(x,pr[1],-pr[0]); N.push(sgn,0,0); U.push(todos[m][0],todos[m][1]); } }
    put(g,P,N,U); };
  if(tapa0) tapa(x0,-1,gT0);
  if(tapa1) tapa(x1,1,gT1);
  const geo=new THREE.BufferGeometry(), claves=Object.keys(G).map(Number).sort((a,b)=>a-b);
  let nv=0; for(const g of claves) nv+=G[g].p.length/3;
  const P=new Float32Array(nv*3), N=new Float32Array(nv*3), U=new Float32Array(nv*2); let off=0;
  for(const g of claves){ const c=G[g].p.length/3; P.set(G[g].p,off*3); N.set(G[g].n,off*3); U.set(G[g].u,off*2); geo.addGroup(off,c,g); off+=c; }
  geo.setAttribute('position',new THREE.BufferAttribute(P,3));
  geo.setAttribute('normal',new THREE.BufferAttribute(N,3));
  geo.setAttribute('uv',new THREE.BufferAttribute(U,2));
  geo.computeBoundingSphere();
  return geo;
}
/* Une geometrías conservando un grupo de material por cada una. */
function uneGrupos(lista){
  const conA=lista.some(([g])=>g.attributes.aIdx), partes=[]; let nv=0;
  for(const [g0,mi] of lista){ const g=g0.index?g0.toNonIndexed():g0; partes.push([g0,g,mi]); nv+=g.attributes.position.count; }
  const P=new Float32Array(nv*3), N=new Float32Array(nv*3), U=new Float32Array(nv*2), A=conA?new Float32Array(nv):null, grupos=[];
  let o=0;
  for(const [g0,g,mi] of partes){ const c=g.attributes.position.count;
    P.set(g.attributes.position.array,o*3); N.set(g.attributes.normal.array,o*3);
    if(g.attributes.uv) U.set(g.attributes.uv.array,o*2);
    if(A&&g.attributes.aIdx) A.set(g.attributes.aIdx.array,o);
    if(g.groups&&g.groups.length&&!g0.index) for(const gr of g.groups) grupos.push([o+gr.start,gr.count,(mi===null?gr.materialIndex:mi)]);
    else grupos.push([o,c,mi||0]);
    o+=c; }
  const r=new THREE.BufferGeometry();
  r.setAttribute('position',new THREE.BufferAttribute(P,3));
  r.setAttribute('normal',new THREE.BufferAttribute(N,3));
  r.setAttribute('uv',new THREE.BufferAttribute(U,2));
  if(A) r.setAttribute('aIdx',new THREE.BufferAttribute(A,1));
  for(const [st,c,m] of grupos) r.addGroup(st,c,m);
  r.computeBoundingSphere(); return r;
}
function conIndice(geo,k){ const c=geo.attributes.position.count; geo.setAttribute('aIdx',new THREE.Float32BufferAttribute(new Float32Array(c).fill(k),1)); return geo; }
/**
 * REVOLUCIÓN con su eje en +X del motor. `perfil` = [[r, x], …] cerrado.
 * Con `ventana`, deja fuera el sector de la ventana de corte y pone las dos
 * caras planas que deja (grupo 1), para que la pieza no se vea hueca.
 */
const PHI_VENT0=VENT[1]-Math.PI, PHI_VENTL=DOSPI-(VENT[1]-VENT[0]);   // en ángulo de LatheGeometry
function revolucionX(perfil,o={}){
  const {seg=SEG(),ventana=false}=o;
  const cerrado=P3.perfilCerrado(perfil);
  if(!ventana){ const g=P3.revolucion(cerrado,{seg}); g.rotateZ(-Math.PI/2); g.clearGroups(); g.addGroup(0,g.index?g.index.count:g.attributes.position.count,0); return g; }
  const n=Math.max(8,Math.round(seg*PHI_VENTL/DOSPI));
  const cuerpo=P3.revolucion(cerrado,{seg:n,fase:PHI_VENT0,arco:PHI_VENTL});
  const pts=limpia(perfil.map(([r,y])=>[Math.max(0,r),y]));
  const tri=THREE.ShapeUtils.triangulateShape(pts.map(p=>new THREE.Vector2(p[0],p[1])),[]);
  const cara=(phi,sgn)=>{ const P=[],N=[],U=[], t=[Math.cos(phi),0,-Math.sin(phi)];
    for(const [i,j,k] of tri){ const m=[i,j,k].map(q=>[pts[q][0]*Math.sin(phi),pts[q][1],pts[q][0]*Math.cos(phi)]);
      const e1=[m[1][0]-m[0][0],m[1][1]-m[0][1],m[1][2]-m[0][2]], e2=[m[2][0]-m[0][0],m[2][1]-m[0][1],m[2][2]-m[0][2]];
      const cx=e1[1]*e2[2]-e1[2]*e2[1], cy=e1[2]*e2[0]-e1[0]*e2[2], cz=e1[0]*e2[1]-e1[1]*e2[0];
      const ok=(cx*t[0]+cy*t[1]+cz*t[2])*sgn>0; const ord=ok?[0,1,2]:[0,2,1];
      for(const q of ord){ P.push(...m[q]); N.push(t[0]*sgn,t[1]*sgn,t[2]*sgn); U.push(pts[[i,j,k][q]][0],pts[[i,j,k][q]][1]); } }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
    g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); return g; };
  const g=uneGrupos([[cuerpo,0],[cara(PHI_VENT0,-1),1],[cara(PHI_VENT0+PHI_VENTL,1),1]]);
  g.rotateZ(-Math.PI/2); return g;
}
/* ¿Cae el ángulo de sección θ dentro de la ventana? */
const enVentana=(th,m=0)=>{ const t=((th%DOSPI)+DOSPI)%DOSPI; return t>VENT[0]-m&&t<VENT[1]+m; };
/* Un tubo por una curva (cabeza de bobina) en coordenadas del motor. */
function tubo(pts,r,tseg,rseg){ return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,'centripetal'),tseg,r,rseg,false); }
const malla=(geo,mat,sombra=true)=>{ const m=new THREE.Mesh(geo,mat); m.castShadow=sombra; m.receiveShadow=true; return m; };

/* ===================== 6. LAS PIEZAS =====================
   Todas se construyen en coordenadas del MOTOR (origen en el centro del eje, eje
   +X) y se cuelgan de un grupo «pieza» cuyo origen es su centro de montaje. */
function pieza(xc){ const g=new THREE.Group(), dentro=new THREE.Group(); dentro.position.x=-xc; g.add(dentro); g.userData.dentro=dentro; return g; }
/* COMPACTAR UNA PIEZA: todas sus mallas se funden en UNA por material (las de
   varios materiales se separan por grupo antes). Mismo dibujo, muchas menos
   llamadas: una tapa con ocho tornillos y diez nervios pasa de 25 mallas a 5.
   No se tocan las que viven aparte: las de brillo por elemento (llevan aIdx)
   y las cabezas de bobina, que se rehacen al cambiar de polos. */
function compacta(raiz){
  raiz.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(raiz.matrixWorld).invert(), M=new THREE.Matrix4();
  const lotes=new Map(), quitar=[];
  raiz.traverse(o=>{
    if(!o.isMesh) return;
    for(let p=o.parent;p&&p!==raiz;p=p.parent) if(p.userData&&p.userData.vivo) return;
    const g=o.geometry; if(g.attributes.aIdx||!g.attributes.normal) return;
    M.multiplyMatrices(inv,o.matrixWorld);
    const gi=g, nI=g.index?g.index.count:g.attributes.position.count;   // sin índice, los grupos cuentan vértices
    const mats=Array.isArray(o.material)?o.material:[o.material];
    const grupos=(Array.isArray(o.material)&&g.groups.length)?g.groups:[{start:0,count:nI,materialIndex:0}];
    for(const gr of grupos){ const mat=mats[gr.materialIndex]; if(!mat) continue;
      const k=mat.uuid+'|'+(o.castShadow?1:0)+(o.receiveShadow?1:0);
      if(!lotes.has(k)) lotes.set(k,{mat,cs:o.castShadow,rs:o.receiveShadow,piezas:[]});
      lotes.get(k).piezas.push({g:gi,m:M.clone(),a:gr.start,n:Math.min(gr.count,nI-gr.start)}); }
    quitar.push(o);
  });
  if(quitar.length<2) return raiz;
  for(const o of quitar) o.parent.remove(o);
  const nm=new THREE.Matrix3(), v=new THREE.Vector3();
  for(const {mat,cs,rs,piezas} of lotes.values()){
    let nV=0,nI=0; for(const q of piezas){ nV+=q.g.attributes.position.count; nI+=q.n; }
    const pos=new Float32Array(nV*3), nor=new Float32Array(nV*3), uv=new Float32Array(nV*2), idx=new Uint32Array(nI);
    let oV=0,oI=0;
    for(const q of piezas){ const P=q.g.attributes.position, N=q.g.attributes.normal, U=q.g.attributes.uv, c=P.count; nm.getNormalMatrix(q.m);
      for(let i=0;i<c;i++){ v.fromBufferAttribute(P,i).applyMatrix4(q.m); pos[(oV+i)*3]=v.x; pos[(oV+i)*3+1]=v.y; pos[(oV+i)*3+2]=v.z;
        v.fromBufferAttribute(N,i).applyMatrix3(nm).normalize(); nor[(oV+i)*3]=v.x; nor[(oV+i)*3+1]=v.y; nor[(oV+i)*3+2]=v.z;
        if(U){ uv[(oV+i)*2]=U.getX(i); uv[(oV+i)*2+1]=U.getY(i); } }
      const I=q.g.index; for(let i=0;i<q.n;i++) idx[oI+i]=(I?I.getX(q.a+i):q.a+i)+oV;
      oV+=c; oI+=q.n; }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));
    geo.setAttribute('uv',new THREE.BufferAttribute(uv,2)); geo.setIndex(new THREE.BufferAttribute(idx,1)); geo.computeBoundingSphere();
    const m=new THREE.Mesh(geo,mat); m.castShadow=cs; m.receiveShadow=rs; raiz.add(m);
  }
  return raiz;
}

/* ---- 6.1 · Chapa del estátor: 36 ranuras semicerradas de dientes paralelos ---- */
function ranuraEst(){ // puntos (t, r) de una ranura, de la boca izquierda a la derecha
  const {b0,h0,r1,w1,r2,w2}=RAN, P=[[-b0/2,D.rSi],[-b0/2,D.rSi+h0],[-w1/2,r1],[-w2/2,r2]];
  for(let i=1;i<8;i++){ const a=Math.PI-i*Math.PI/8; P.push([w2/2*Math.cos(a),r2+w2/2*Math.sin(a)]); }
  P.push([w2/2,r2],[w1/2,r1],[b0/2,D.rSi+h0],[b0/2,D.rSi]); return P;
}
const aSec=(t,r,a)=>[r*Math.cos(a)-t*Math.sin(a),r*Math.sin(a)+t*Math.cos(a)];
/* Borde del agujero del estátor (diámetro interior con ranuras), de thA a thB en sentido antihorario. */
function bordeEstator(thA,thB){
  const pts=[], paso=DOSPI/Q1, boca=Math.asin(RAN.b0/2/D.rSi), sl=ranuraEst();
  const arco=(a0,a1)=>{ if(a1<=a0) return; const n=Math.max(1,Math.ceil((a1-a0)/(2*DEG))); for(let i=0;i<=n;i++) pts.push(polar(D.rSi,a0+(a1-a0)*i/n)); };
  let cur=thA;
  for(let k=Math.floor(thA/paso)-1;k<=Math.ceil(thB/paso)+1;k++){ const tk=(k+0.5)*paso; if(tk-boca<thA||tk+boca>thB) continue;
    arco(cur,tk-boca); for(const [t,r] of sl) pts.push(aSec(t,r,tk)); cur=tk+boca; }
  arco(cur,thB); return pts;
}
function arcoR(r,a0,a1,paso=2*DEG){ const n=Math.max(1,Math.ceil(Math.abs(a1-a0)/paso)), p=[]; for(let i=0;i<=n;i++) p.push(polar(r,a0+(a1-a0)*i/n)); return p; }
/* Región de un sector [thA, thB] entre un borde interior y uno exterior, como un solo lazo. */
function sector(bordeInt,bordeExt){ return [...bordeExt,...bordeInt.slice().reverse()]; }
/* ¿Es la arista AB uno de los dos cortes radiales de la ventana? */
function esRadialVent(A,B){ const t=p=>((Math.atan2(p[1],p[0])%DOSPI)+DOSPI)%DOSPI;
  for(const v of VENT) if(Math.abs(t(A)-v)<1e-3&&Math.abs(t(B)-v)<1e-3) return true; return false; }

/* ---- 6.2 · Carcasa con aletas ---- */
function bordeCarcasa(thA,thB){ // borde exterior con aletas de thA a thB (antihorario)
  const pts=[], paso=9*DEG, off=4.5*DEG, hb=0.0080/D.rFs, ht=0.0034/D.rFt;
  const sinAleta=t=>{ const d=((t%DOSPI)+DOSPI)%DOSPI; return (d>76*DEG&&d<104*DEG)||(d>250*DEG&&d<290*DEG); };
  let cur=thA;
  for(let m=Math.floor((thA-off)/paso)-1;m<=Math.ceil((thB-off)/paso)+1;m++){ const c=off+m*paso;
    if(c-hb<thA+0.2*DEG||c+hb>thB-0.2*DEG||sinAleta(c)) continue;
    pts.push(...arcoR(D.rFs,cur,c-hb));
    const tip=[[-hb,D.rFs],[-ht*1.35,D.rFt-0.012],[-ht,D.rFt-0.004],[-ht*0.55,D.rFt-0.0008],[0,D.rFt],[ht*0.55,D.rFt-0.0008],[ht,D.rFt-0.004],[ht*1.35,D.rFt-0.012],[hb,D.rFs]];
    for(const [da,r] of tip) pts.push(polar(r,c+da));
    cur=c+hb; }
  pts.push(...arcoR(D.rFs,cur,thB)); return pts;
}
function construyeCarcasa(){
  const g=pieza(0), d=g.userData.dentro, x0=-D.xCarc, x1=D.xCarc;
  const thC0=VENT[1], thC1=VENT[0]+DOSPI;
  const lazoC=sector(arcoR(D.rFi,thC0,thC1),bordeCarcasa(thC0,thC1));
  const lazoW=sector(arcoR(D.rFi,VENT[0],VENT[1]),bordeCarcasa(VENT[0],VENT[1]));
  const gC=barrido([lazoC],x0,x1,{fA:(A,B)=>esRadialVent(A,B)?{g:1,x1:X_VENT}:{g:0}});
  const gW=barrido([lazoW],X_VENT,x1,{fA:(A,B)=>esRadialVent(A,B)?null:{g:0},gT0:1});
  const cuerpo=malla(uneGrupos([[gC,null],[gW,null]]),[MC.pintura,MC.rojo]); d.add(cuerpo);
  // las patas, fundidas con la carcasa
  const pata=P3.contornoRedondeado([[-0.245,-0.50],[0.245,-0.50],[0.245,-0.452],[0.165,-0.428],[0.125,-0.392],[-0.125,-0.392],[-0.165,-0.428],[-0.245,-0.452]],0.012,3);
  for(const [a,b] of [[-0.55,-0.30],[0.10,0.35]]) d.add(malla(barrido([pata],a,b),MC.pintura));
  // caja de bornes con su tapa y el prensaestopas
  const caja=roundedBox(0.30,0.15,0.26,MC.pintura,0.12); caja.position.set(-0.10,D.rFs+0.06,0); d.add(caja);
  const tapa=roundedBox(0.32,0.035,0.28,MC.pintura,0.2); tapa.position.set(-0.10,D.rFs+0.15,0); d.add(tapa);
  const pren=malla(revolucionX([[0,0],[0.024,0],[0.024,0.034],[0.019,0.042],[0.019,0.062],[0,0.062]],{seg:24}),MC.negro);
  pren.rotation.y=-Math.PI/2; pren.position.set(-0.10,D.rFs+0.06,0.13); d.add(pren);
  for(const sx of [-1,1]) for(const sz of [-1,1]){ const t=malla(new THREE.CylinderGeometry(0.010,0.010,0.012,12),MC.eje,false);
    t.position.set(-0.10+sx*0.13,D.rFs+0.171,sz*0.11); d.add(t); }
  // cáncamo de izado
  const can=malla(new THREE.TorusGeometry(0.038,0.011,10,28),MC.eje); can.position.set(0.20,D.rFt+0.045,0); d.add(can);
  const cuello=malla(new THREE.CylinderGeometry(0.016,0.022,0.05,14),MC.eje); cuello.position.set(0.20,D.rFt+0.005,0); d.add(cuello);
  return compacta(g);
}

/* ---- 6.3 · Estátor: chapa, conductores de doble capa, cuñas y cabezas de bobina ---- */
function seccionConductor(capa){ // (t, r) del conductor, separado 2 mm de la pared (aislante de ranura)
  const {r1,r2,w2,rMid,ancho}=RAN, e=0.0024, g=0.0016;
  if(capa===0){ const ra=r1+0.0016, rb=rMid-g/2;
    return P3.contornoRedondeado([[-ancho(ra)/2+e,ra],[ancho(ra)/2-e,ra],[ancho(rb)/2-e,rb],[-ancho(rb)/2+e,rb]],0.0022,3); }
  const ra=rMid+g/2, P=[[-ancho(ra)/2+e,ra],[ancho(ra)/2-e,ra],[w2/2-e,r2]];
  for(let i=1;i<8;i++){ const a=i*Math.PI/8; P.push([(w2/2-e)*Math.cos(a),r2+(w2/2-e)*Math.sin(a)]); }
  P.push([-(w2/2-e),r2]); return P3.contornoRedondeado(P,[0.0022,0.0022,0,0,0,0,0,0,0,0,0],3);
}
function centroideConductor(capa){ const c=seccionConductor(capa); let a=0,cx=0,cy=0;
  for(let i=0;i<c.length;i++){ const p=c[i], q=c[(i+1)%c.length], k=p[0]*q[1]-q[0]*p[1]; a+=k; cx+=(p[0]+q[0])*k; cy+=(p[1]+q[1])*k; }
  return [cx/(3*a),cy/(3*a)]; }
const R_GLIFO=[centroideConductor(0)[1],centroideConductor(1)[1]];
const ESTATOR={dv:null,cabezas:[]};
function construyeEstator(){
  const g=pieza(0), d=g.userData.dentro, x0=-D.lc/2, x1=D.lc/2;
  const thC0=VENT[1], thC1=VENT[0]+DOSPI;
  const lazoC=sector(bordeEstator(thC0,thC1),arcoR(D.rSo,thC0,thC1));
  const lazoW=sector(bordeEstator(VENT[0],VENT[1]),arcoR(D.rSo,VENT[0],VENT[1]));
  const gC=barrido([lazoC],x0,x1,{fA:(A,B)=>esRadialVent(A,B)?{g:0,x1:X_VENT}:{g:0},gT0:1,gT1:1});
  const gW=barrido([lazoW],X_VENT,x1,{fA:(A,B)=>esRadialVent(A,B)?null:{g:0},gT0:1,gT1:1});
  d.add(malla(uneGrupos([[gC,null],[gW,null]]),[MC.chapa,MC.chapaCara]));
  // los 72 conductores, una sola malla con su índice (2k + capa)
  const conds=[], cunas=[];
  const {b0,h0,r1,w1}=RAN;
  for(let k=0;k<Q1;k++){ const tk=anguloRanura(k), vent=enVentana(tk), a=vent?X_VENT:-D.lc/2-0.012;
    for(const capa of [0,1]) conds.push([conIndice(barrido([seccionConductor(capa).map(([t,r])=>aSec(t,r,tk))],a,D.lc/2+0.012),2*k+capa),0]);
    const cu=[[-b0/2+0.0006,D.rSi+h0+0.0004],[-w1/2+0.001,r1-0.0008],[w1/2-0.001,r1-0.0008],[b0/2-0.0006,D.rSi+h0+0.0004]];
    cunas.push([barrido([cu.map(([t,r])=>aSec(t,r,tk))],vent?X_VENT:-D.lc/2,D.lc/2),0]); }
  d.add(malla(uneGrupos(conds),MC.cobreC));
  d.add(malla(uneGrupos(cunas),MC.cuna,false));
  const cab=new THREE.Group(); cab.name='cabezas'; cab.userData.vivo=true; d.add(cab); g.userData.cabezas=cab;
  return compacta(g);
}
/* Las CABEZAS DE BOBINA dependen del número de polos (el paso de bobina): se
   rehacen cuando el alumno cambia p. Cada bobina sale por arriba de su ranura
   y vuelve por abajo de la ranura que está un paso más allá, abriéndose hacia
   fuera: así se entrelazan como en un devanado imbricado de verdad. */
function rehaceCabezas(grupo,P){
  const dv=devanado(P);
  for(const m of grupo.children.slice()){ m.geometry.dispose(); grupo.remove(m); }
  const paso=DOSPI/Q1, rT=R_GLIFO[0], rB=R_GLIFO[1], ts=calAlta()?30:20, rs=calAlta()?7:5;
  for(const lado of [-1,1]){
    const porFase=[[],[],[]];
    for(const b of dv.bobinas){
      const ta=anguloRanura(b.k), tb=ta+dv.y*paso;
      if(lado<0){ let cruza=false; for(let t=ta;t<=tb+1e-9;t+=paso/2) if(enVentana(t,1*DEG)) cruza=true; if(cruza) continue; }
      const xC=lado*D.lc/2, pts=[];
      const N=9;
      pts.push(new THREE.Vector3(xC-lado*0.006,...(()=>{ const p=polar(rT,ta); return [p[1],-p[0]]; })()));
      for(let i=0;i<=N;i++){ const u=i/N, th=ta+(tb-ta)*u, r=rT+(rB-rT)*u+0.020*Math.sin(Math.PI*u), x=xC+lado*(0.012+(D.vuelo-0.018)*Math.sin(Math.PI*u));
        const p=polar(r,th); pts.push(new THREE.Vector3(x,p[1],-p[0])); }
      pts.push(new THREE.Vector3(xC-lado*0.006,...(()=>{ const p=polar(rB,tb); return [p[1],-p[0]]; })()));
      porFase[b.ph].push(tubo(pts,0.0092,ts,rs));
    }
    porFase.forEach((lista,ph)=>{ if(!lista.length) return; const m=malla(P3.fusiona(lista),MC.fase[ph]); m.userData.lado=lado; grupo.add(m); lista.forEach(t=>t.dispose()); });
  }
  return dv;
}

/* ---- 6.4 · Rotor de jaula: chapa con 28 ranuras en pera, barras inclinadas, anillos con aletas, eje ---- */
function ranuraRotor(){ // (t, r): boca de 2 mm, cabeza redonda, tangentes y cola estrecha
  const {ab,rC,rA,rB,rCb}=BAR, dl=Math.asin((rA-rB)/(rC-rCb));
  const h=Math.sqrt(rA*rA-ab*ab/4), aL=Math.atan2(h,-ab/2), aR=Math.atan2(h,ab/2), P=[[-ab/2,D.rRot]];
  const arcoC=(cr,rr,a0,a1,n)=>{ for(let i=0;i<=n;i++){ const a=a0+(a1-a0)*i/n; P.push([rr*Math.cos(a),cr+rr*Math.sin(a)]); } };
  arcoC(rC,rA,aL,Math.PI+dl,8); arcoC(rCb,rB,Math.PI+dl,DOSPI-dl,10); arcoC(rC,rA,-dl,aR,8);
  P.push([ab/2,D.rRot]); return limpia(P);
}
function bordeRotor(){ // contorno exterior de la chapa del rotor con las bocas de las ranuras
  const pts=[], paso=DOSPI/Q2, sl=ranuraRotor(), boca=Math.asin(BAR.ab/2/D.rRot);
  let cur=0; const arco=(a0,a1)=>{ const n=Math.max(1,Math.ceil((a1-a0)/(2*DEG))); for(let i=0;i<=n;i++) pts.push(polar(D.rRot,a0+(a1-a0)*i/n)); };
  for(let j=0;j<Q2;j++){ const tj=j*paso+paso/2; arco(cur,tj-boca); for(const [t,r] of sl) pts.push(aSec(t,r,tj)); cur=tj+boca; }
  arco(cur,DOSPI); pts.pop(); return pts;
}
function construyeRotor(){
  const g=pieza(0), d=g.userData.dentro, x0=-D.lc/2, x1=D.lc/2, pasos=calAlta()?24:14;
  // el agujero del paquete 1,2 mm (de modelo) mayor que el eje: dos cilindros coincidentes se pelean en el z-buffer
  const nucleo=barrido([bordeRotor(),arcoR(D.rEje+0.0012,0,DOSPI,4*DEG).slice(0,-1)],x0,x1,{pasos,giro:giroEn,gT0:1,gT1:1});
  d.add(malla(nucleo,[MC.chapaRot,MC.chapaCara]));
  const paso=DOSPI/Q2, sl=ranuraRotor(), bars=[];
  const inset=c=>{ const cx=c.reduce((s,p)=>s+p[0],0)/c.length, cy=c.reduce((s,p)=>s+p[1],0)/c.length;
    return c.map(([x,y])=>{ const dx=x-cx, dy=y-cy, l=Math.hypot(dx,dy)||1; return [x-dx/l*0.0007,y-dy/l*0.0007]; }); };
  for(let j=0;j<Q2;j++){ const tj=j*paso+paso/2;
    bars.push([conIndice(barrido([inset(sl).map(([t,r])=>aSec(t,r,tj))],x0-0.026,x1+0.026,{pasos,giro:giroEn}),j),0]); }
  d.add(malla(uneGrupos(bars),MC.barras));
  // anillos de cortocircuito con sus aletas de ventilación (fundidos de una pieza con las barras)
  for(const s of [-1,1]){
    const a=s*(D.lc/2-0.002), b=s*(D.lc/2+0.052), lo=Math.min(a,b), hi=Math.max(a,b);
    const geos=[revolucionX([[D.rRot-0.074,lo],[D.rRot-0.004,lo],[D.rRot-0.004,hi-0.008],[D.rRot-0.012,hi],[D.rRot-0.066,hi],[D.rRot-0.074,hi-0.008]],{seg:SEG()})];
    for(let i=0;i<14;i++){ const an=i/14*DOSPI; const bx=new THREE.BoxGeometry(0.034,0.050,0.009);
      bx.translate(s*(D.lc/2+0.052+0.017),D.rRot-0.042,0); bx.rotateX(an); geos.push(bx.toNonIndexed()); }
    d.add(malla(uneGrupos(geos.map(q=>[q,0])),MC.aluCage));
  }
  // el eje, torneado: asiento del ventilador, rodamientos, paquete y punta de acople con chavetero
  const eje=[[0,-0.985],[0.050,-0.985],[0.055,-0.980],[0.055,-0.80],[0.065,-0.80],[0.065,-0.745],[D.rEjeRod,-0.745],[D.rEjeRod,-0.62],
    [D.rEje,-0.62],[D.rEje,0.62],[D.rEjeRod,0.62],[D.rEjeRod,0.745],[D.rEjeExt,0.745],[D.rEjeExt,1.012],[D.rEjeExt-0.008,1.02],[0,1.02]];
  d.add(malla(revolucionX(eje,{seg:SEG()}),MC.eje));
  const chav=roundedBox(0.19,0.026,0.04,MC.eje,0.2); chav.position.set(0.90,D.rEjeExt+0.004,0); d.add(chav);
  return compacta(g);
}

/* ---- 6.5 · Tapas (escudos portacojinetes) con su rodamiento ---- */
function rodamientoX(xc){ // rodamiento rígido de bolas 6206 (30×62×16 mm), eje X
  const g=new THREE.Group(), w=0.04;
  g.add(malla(revolucionX([[0.128,xc-w],[0.155,xc-w],[0.155,xc+w],[0.128,xc+w],[0.124,xc+w*0.5],[0.124,xc-w*0.5]]),MC.rodam));
  g.add(malla(revolucionX([[D.rEjeRod,xc-w],[0.101,xc-w],[0.105,xc-w*0.5],[0.105,xc+w*0.5],[0.101,xc+w],[D.rEjeRod,xc+w]]),MC.rodam));
  const bolas=[]; for(let i=0;i<9;i++){ const a=i/9*DOSPI, b=new THREE.SphereGeometry(0.0205,16,12); b.translate(xc,0.1145*Math.cos(a),0.1145*Math.sin(a)); bolas.push(b); }
  g.add(malla(P3.fusiona(bolas),MC.bola));
  return g;
}
function perfilTapa(s){ // s = −1: lado ventilador (NDE); +1: lado acople (DE). x del motor.
  const xe=s*D.xCarc, P=[[0.155,-0.065],[0.212,-0.065],[0.224,-0.045],[0.33,-0.034],[0.405,-0.016],[D.rFs,-0.004],[D.rFs,0.0],
    [D.rFs,0.05],[D.rFi-0.001,0.05],[D.rFi-0.001,0.064],[D.rFi-0.014,0.064],[D.rFi-0.014,0.046],[0.33,0.022],[0.226,0.036],[0.205,0.05],[0.155,0.05]];
  return P.map(([r,y])=>[r,xe+s*(0.05-y)]);
}
function construyeTapa(s){
  const xc=s*0.67, g=pieza(xc), d=g.userData.dentro, vent=s<0;
  d.add(malla(revolucionX(perfilTapa(s),{seg:SEG(),ventana:vent}),vent?[MC.pintura,MC.rojo]:MC.pintura));
  // nervios de la fundición, del cubo al borde
  for(let i=0;i<8;i++){ const a=(i+0.5)/8*DOSPI; if(vent&&enVentana(a,6*DEG)) continue;
    const c=P3.contornoRedondeado([[0.215,0],[0.405,0],[0.405,0.014],[0.215,0.052]],0.004,2);
    const geo=P3.extruido(c,{espesor:0.014,bisel:0.002}); // en el plano (r, axial)
    geo.rotateZ(0); const m=malla(geo,MC.pintura);
    // r → dirección radial a; axial → hacia fuera de la tapa
    const p=polar(1,a); m.matrixAutoUpdate=false;
    const er=new THREE.Vector3(0,p[1],-p[0]), ex=new THREE.Vector3(s,0,0), en=new THREE.Vector3().crossVectors(er,ex);
    m.matrix.makeBasis(er,ex,en).setPosition(s*(D.xCarc+0.06),0,0); d.add(m); }
  // tornillos de la tapa
  for(let i=0;i<4;i++){ const a=(i+0.5)/4*DOSPI+0.2; if(vent&&enVentana(a,4*DEG)) continue;
    const t=P3.tornilloHex({acero:MC.eje},{d:0.024,largo:0.03}); const p=polar(0.418,a);
    t.rotation.z=s>0?-Math.PI/2:Math.PI/2; t.position.set(s*(D.xCarc+0.052),p[1],-p[0]); d.add(t); }
  d.add(rodamientoX(s*0.67));
  if(s>0){ // retén de goma en la salida del eje
    d.add(malla(revolucionX([[D.rEjeExt+0.001,0.712],[0.10,0.712],[0.10,0.735],[D.rEjeExt+0.001,0.742]]),MC.junta)); }
  return compacta(g);
}

/* ---- 6.6 · Ventilador y su cubierta ---- */
function construyeVentilador(){
  const xc=-0.86, g=pieza(xc), d=g.userData.dentro;
  d.add(malla(revolucionX([[0.054,-0.91],[0.098,-0.91],[0.104,-0.90],[0.104,-0.82],[0.098,-0.81],[0.054,-0.81]]),MC.polimero));
  d.add(malla(revolucionX([[0.10,-0.835],[0.372,-0.835],[0.38,-0.828],[0.38,-0.818],[0.10,-0.818]]),MC.polimero));
  /* Palas RADIALES y planas: el motor gira en los dos sentidos y el ventilador
     tiene que soplar igual en los dos. */
  for(let i=0;i<10;i++){ const a=i/10*DOSPI;
    const geo=P3.extruido(P3.contornoRedondeado([[0.10,0],[0.395,0],[0.395,0.058],[0.37,0.086],[0.10,0.086]],0.006,2),{espesor:0.013,bisel:0.002});
    const m=malla(geo,MC.polimero); const p=polar(1,a); m.matrixAutoUpdate=false;
    const er=new THREE.Vector3(0,p[1],-p[0]), ex=new THREE.Vector3(-1,0,0), en=new THREE.Vector3().crossVectors(er,ex);
    m.matrix.makeBasis(er,ex,en).setPosition(-0.82,0,0); d.add(m); }
  return compacta(g);
}
function construyeCubierta(){
  const xc=-0.89, g=pieza(xc), d=g.userData.dentro;
  const cas=[[0.486,-0.705],[0.500,-0.705],[0.500,-1.03],[0.494,-1.052],[0.478,-1.066],[0.455,-1.075],[0.40,-1.075],[0.40,-1.063],[0.452,-1.063],[0.470,-1.055],[0.484,-1.040],[0.488,-1.02]];
  d.add(malla(revolucionX(cas,{seg:SEG(),ventana:true}),[MC.chapaCub,MC.rojo]));
  // rejilla: anillos concéntricos, radios y el cubo
  for(const r of [0.105,0.175,0.245,0.315,0.385]) d.add(malla(revolucionX([[r-0.011,-1.075],[r+0.011,-1.075],[r+0.011,-1.063],[r-0.011,-1.063]],{seg:SEG(),ventana:true}),[MC.chapaCub,MC.rojo]));
  d.add(malla(revolucionX([[0,-1.077],[0.062,-1.077],[0.062,-1.061],[0,-1.061]],{seg:28}),MC.chapaCub));
  for(let i=0;i<10;i++){ const a=(i+0.5)/10*DOSPI; if(enVentana(a,5*DEG)) continue;
    const bx=new THREE.BoxGeometry(0.012,0.36,0.014); bx.translate(-1.069,0.06+0.18,0); bx.rotateX(a-Math.PI/2);
    d.add(malla(bx,MC.chapaCub)); }
  return compacta(g);
}

/* ===================== 7. EL BANCO DE ENSAMBLE =====================
   Mesa de montaje de taller: tablero de compacto grafito con canto de
   aluminio, tapete de trabajo donde descansan las piezas, placa base
   rectificada con ranuras en T bajo las patas del motor, dos soportes en V
   para el rotor (apoyado en los asientos de rodamiento, como se hace) y un
   aro de apoyo para el estátor, de pie, para que no cargue en las cabezas. */
const BANCO=new THREE.Group(); scene.add(BANCO);
const SOPORTES={};
(function(){
  const W=5.2, Dp=2.9, cx=0, cz=0.55, e=0.07;
  const MESA=new THREE.Group(); BANCO.add(MESA);
  const top=roundedBox(W,e,Dp,MAT.mesa,0.25); top.position.set(cx,Y_MESA-e/2,cz); MESA.add(top);
  for(const s of [-1,1]){ const c=roundedBox(W+0.03,0.032,0.026,MAT.canto,0.3); c.position.set(cx,Y_MESA-0.022,cz+s*(Dp/2+0.004)); MESA.add(c); }
  for(const s of [-1,1]){ const c=roundedBox(0.026,0.032,Dp+0.03,MAT.canto,0.3); c.position.set(cx+s*(W/2+0.004),Y_MESA-0.022,cz); MESA.add(c); }
  for(const sx of [-1,1]) for(const sz of [-1,1]){ const p=new THREE.Mesh(new THREE.BoxGeometry(0.09,Y_MESA-e,0.09),MAT.pata);
    p.position.set(cx+sx*(W/2-0.16),(Y_MESA-e)/2,cz+sz*(Dp/2-0.16)); p.castShadow=true; MESA.add(p); }
  for(const sz of [-1,1]){ const t=new THREE.Mesh(new THREE.BoxGeometry(W-0.3,0.06,0.05),MAT.pata); t.position.set(cx,0.16,cz+sz*(Dp/2-0.16)); MESA.add(t); }
  const tap=roundedBox(4.7,0.008,1.42,MAT.tapete,0.5); tap.position.set(0.05,Y_MESA+0.004,1.22); tap.receiveShadow=true; MESA.add(tap);
  const base=roundedBox(1.5,0.03,0.66,MAT.placa,0.18); base.position.set(-0.12,Y_MESA+0.015,0); MESA.add(base);
  for(const z of [-0.18,0,0.18]){ const r=new THREE.Mesh(new THREE.BoxGeometry(1.42,0.004,0.022),MAT.negro); r.position.set(-0.12,Y_MESA+0.0302,z); MESA.add(r); }
  compacta(MESA);
  // soportes en V del rotor: V de 90° bajo cada asiento de rodamiento (ø 150 de modelo), con la
  // garganta a la altura justa para que el eje APOYE (centro a 0,30 sobre el tapete)
  const v=P3.contornoRedondeado([[-0.09,0],[0.09,0],[0.09,0.24],[0.046,0.24],[0,0.194],[-0.046,0.24],[-0.09,0.24]],0.005,2);
  SOPORTES.v=[];
  for(const dx of [-0.68,0.68]){ const geo=P3.extruido(v,{espesor:0.07,bisel:0.004}); const m=new THREE.Mesh(geo,MAT.anod);
    m.rotation.y=Math.PI/2;   // la garganta corre a lo largo del eje del rotor
    m.castShadow=m.receiveShadow=true; BANCO.add(m); SOPORTES.v.push({m,dx}); }
  // cunas del estátor: el estátor descansa TUMBADO, con la boca hacia quien mira (así se ve su campo)
  const R=D.rSo+0.002, H=0.4175, cun=[[-0.31,0],[0.31,0]];
  for(let i=0;i<=24;i++){ const u=0.31-0.62*i/24; cun.push([u,H-Math.sqrt(R*R-u*u)]); }
  const cuna=new THREE.Group(); SOPORTES.cuna=cuna; SOPORTES.cunaH=H;
  for(const s of [-1,1]){ const m=new THREE.Mesh(P3.extruido(cun,{espesor:0.08,bisel:0}),MAT.anod); m.position.z=s*0.23;
    m.castShadow=m.receiveShadow=true; cuna.add(m); }
  BANCO.add(cuna);
})();

/* ===================== 8. ENSAMBLE ===================== */
const PARTS=[
  {id:'estator',      name:'Estátor (devanado trifásico)', build:()=>construyeEstator(),   homeX:0,     entrada:1.30, req:null,
   note:'Paquete de chapa con 36 ranuras y el devanado trifásico de doble capa: crea el campo magnético giratorio a ns = 120·f/p.'},
  {id:'rotor',        name:'Rotor (jaula de ardilla)',     build:()=>construyeRotor(),     homeX:0,     entrada:1.72, req:'estator',
   note:'Barras de aluminio inclinadas un paso de ranura y cortocircuitadas por dos anillos: el campo induce corriente en ellas sin ninguna conexión externa.'},
  {id:'tapaT',        name:'Tapa trasera (NDE)',           build:()=>construyeTapa(-1),    homeX:-0.67, entrada:-0.46, req:'rotor',
   note:'Cierra el extremo trasero y sostiene el rodamiento que centra el rotor en un entrehierro de décimas de milímetro.'},
  {id:'tapaD',        name:'Tapa delantera (DE)',          build:()=>construyeTapa(1),     homeX:0.67,  entrada:0.46, req:'rotor',
   note:'Cierra el extremo de acople; su rodamiento y su retén sacan el eje hacia la carga.'},
  {id:'ventilador',   name:'Ventilador externo',           build:()=>construyeVentilador(),homeX:-0.86, entrada:-0.46, req:'tapaT',
   note:'Calado al eje: enfría la carcasa por convección forzada (TEFC). Palas radiales: sopla igual en los dos sentidos de giro.'},
  {id:'cubiertaVent', name:'Cubierta del ventilador',      build:()=>construyeCubierta(),  homeX:-0.89, entrada:-0.56, req:'ventilador',
   note:'Encauza el aire del ventilador sobre las aletas de la carcasa y protege las partes que giran.'},
];
const ORDER=PARTS.map(p=>p.id);
const PART=Object.fromEntries(PARTS.map(p=>[p.id,p]));
/* Dónde descansa cada pieza en el banco (mundo) y cómo: el ángulo z lleva el
   eje de la pieza a la vertical (de pie) o lo deja horizontal. */
const REPOSO={
  cubiertaVent:{p:[-1.80,0,1.05],rz:-Math.PI/2,base:0.187},
  ventilador:  {p:[-1.05,0,1.40],rz:-Math.PI/2,base:0.05},
  tapaT:       {p:[-0.30,0,1.08],rz:-Math.PI/2,base:0.066},
  tapaD:       {p:[0.62,0,1.10],rz:Math.PI/2,base:0.066},
  // tumbado, la boca hacia la cámara del banco y la ventana de corte girada hacia abajo (rx: 155° → 270°)
  estator:     {p:[1.52,0,1.02],rz:0,ry:-Math.atan2(0.92,0.40),rx:115*DEG,base:0.4175},
  rotor:       {p:[-0.15,0,1.62],rz:0,base:0.30},
};
function poseReposo(id){ const r=REPOSO[id]; return {p:new THREE.Vector3(r.p[0],Y_MESA+0.008+r.base,r.p[2]),q:new THREE.Quaternion().setFromEuler(new THREE.Euler(r.rx||0,r.ry||0,r.rz,'YXZ'))}; }
function colocaSoportes(){ // los soportes, bajo sus piezas
  const r=poseReposo('rotor'); for(const s of SOPORTES.v){ s.m.position.set(r.p.x+s.dx,Y_MESA+0.008,r.p.z); s.m.visible=true; }
  // las cunas: su extrusión (z) a lo largo del eje del estátor, que es la x local de la pieza girada
  const e=poseReposo('estator'), c=SOPORTES.cuna; c.position.set(e.p.x,Y_MESA+0.008,e.p.z);
  c.rotation.set(0,(REPOSO.estator.ry||0)+Math.PI/2,0); c.visible=true;
}
colocaSoportes();
/* Un soporte vacío se recoge bajo el tablero (como los topes escamoteables de
   una mesa de montaje): el banco se despeja a medida que el motor se arma. */
function recoge(m){ const y0=m.position.y;
  tweens.push({obj:m,t:0,dur:REDUCIDO?0.3:1.4,upd:u=>{ const k=ease(clamp((u-0.35)/0.65,0,1)); m.position.y=y0-0.24*k; },onDone:()=>{ m.visible=false; }}); }

const groups={}, ghosts={};
let placed={}, selectedId=null, progress=0, simUnlocked=false;
const tweens=[];
const trayObjs=[], ghostObjs=[];
const carcasa=construyeCarcasa(); carcasa.position.copy(M0); scene.add(carcasa);
carcasa.userData.kind='fija'; carcasa.userData.nombre='Carcasa con aletas (fija, TEFC)';

function ghostMat(){ return new THREE.MeshStandardMaterial({color:0x4FD1C5,transparent:true,opacity:0.22,metalness:0,roughness:0.6,
  emissive:0x2A9D8F,emissiveIntensity:0.55,depthWrite:false}); }
function makeGhost(part){
  const gh=part.build(); if(part.id==='estator') rehaceCabezas(gh.userData.cabezas,STATE.p/2);
  const gm=ghostMat();
  gh.traverse(o=>{ if(o.isMesh){ o.material=gm; o.castShadow=false; o.receiveShadow=false; } });
  gh.position.copy(M0).add(new THREE.Vector3(part.homeX,0,0));
  gh.userData={...gh.userData,kind:'slot',id:part.id,gm,homeX:gh.position.x,shake:0,fading:false}; return gh;
}
function showGhostFor(id){
  ghostObjs.forEach(gh=>{ if(gh.parent) scene.remove(gh); });
  if(id&&!placed[id]&&ghosts[id]){ const gh=ghosts[id]; gh.userData.fading=false; gh.userData.gm.opacity=0.22; gh.visible=true; scene.add(gh); }
}
function makePart(part){
  const g=part.build(); if(part.id==='estator'){ ESTATOR.dv=rehaceCabezas(g.userData.cabezas,STATE.p/2); }
  const r=poseReposo(part.id); g.position.copy(r.p); g.quaternion.copy(r.q);
  Object.assign(g.userData,{kind:'part',id:part.id,baseY:r.p.y,lift:0,hover:0,nombre:part.name});
  g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; } });
  return g;
}
function initAssembly(){
  if(CAMPO_B.m.parent) CAMPO_B.m.parent.remove(CAMPO_B.m);
  [...trayObjs,...ghostObjs].forEach(o=>{ scene.remove(o); o.traverse(m=>{ if(m.isMesh&&m.geometry) m.geometry.dispose(); }); });
  trayObjs.length=ghostObjs.length=tweens.length=0; colocaSoportes();
  placed={}; selectedId=null; progress=0; simUnlocked=false;
  PARTS.forEach(p=>{ const g=makePart(p); groups[p.id]=g; scene.add(g); trayObjs.push(g); if(p.id==='estator') g.add(CAMPO_B.m);
    const gh=makeGhost(p); ghosts[p.id]=gh; ghostObjs.push(gh); });
  showGhostFor(null);
  renderChecklist(); renderProg();
  syncCtrlbar();
  if(mode!=='ensamble') setMode('ensamble'); else ponVista('banco');
  el('asmStatus').innerHTML='Toca una <b>pieza</b> del banco y luego su <b>hueco luminoso</b> en el motor.';
  pintaVivo();
}

/* ---------- selección / colocación ---------- */
function selectPart(id){
  if(placed[id]) return;
  const req=PART[id].req;
  if(req&&!placed[req]){ el('asmStatus').innerHTML=`Antes va <b>${PART[req].name}</b>: ${id==='rotor'?'el rotor entra por el agujero del estátor.':(id==='ventilador'?'el ventilador se cala en el eje, por fuera de la tapa trasera.':(id==='cubiertaVent'?'la cubierta tapa el ventilador.':'la tapa se apoya en el rodamiento del eje del rotor.'))}`;
    synth.beep(300,0.08,0.05); return; }
  selectedId=id; showGhostFor(id);
  el('asmStatus').innerHTML=`▶ <b style="color:var(--accent2)">${PART[id].name}</b> — ahora toca su <b>hueco luminoso</b> en el motor.`;
  synth.beep(660,0.06,0.05);
  renderChecklist();
}
function deselect(){ selectedId=null; showGhostFor(null); renderChecklist(); }
/* LA TRAYECTORIA DE MONTAJE: la pieza sube del banco, gira hasta quedar con su
   eje en el del motor, llega a la boca de entrada —delante del hueco, sobre el
   mismo eje— y entra DESLIZANDO por él, frenando al asentar. Así se monta de
   verdad un motor: el rotor no cae dentro del estátor, se enhebra. */
function trayecto(obj,dest,ent,dur,alAsentar){
  const p0=obj.position.clone(), q0=obj.quaternion.clone(), q1=new THREE.Quaternion();
  const alto=Math.max(p0.y,ent.y)+0.55;
  const curva=new THREE.CatmullRomCurve3([p0,new THREE.Vector3(p0.x,alto,p0.z),
    new THREE.Vector3((p0.x+ent.x)/2,alto+0.05,(p0.z+ent.z)/2),new THREE.Vector3(ent.x,ent.y+0.30,ent.z),ent],false,'centripetal');
  return {obj,t:0,dur,upd:u=>{
    if(u<0.66){ const k=ease(u/0.66); obj.position.copy(curva.getPoint(k)); obj.quaternion.copy(q0).slerp(q1,ease(Math.min(1,u/0.52))); }
    else { const k=easeOut((u-0.66)/0.34); obj.position.lerpVectors(ent,dest,k); obj.quaternion.copy(q1); }
  },onDone:()=>{ obj.position.copy(dest); obj.quaternion.identity(); if(alAsentar) alAsentar(); }};
}
function placePart(id){
  const p=PART[id], g=groups[id], gh=ghosts[id];
  const dest=M0.clone().add(new THREE.Vector3(p.homeX,0,0)), ent=dest.clone().add(new THREE.Vector3(p.entrada,0,0));
  tweens.push(trayecto(g,dest,ent,REDUCIDO?0.6:1.9,()=>{ synth.beep(196,0.07,0.06); setTimeout(()=>synth.beep(392,0.05,0.04),60); }));
  if(gh) gh.userData.fading=true;
  if(id==='rotor') SOPORTES.v.forEach(s=>recoge(s.m)); if(id==='estator') recoge(SOPORTES.cuna);
  g.userData.kind='placed'; g.userData.lift=0;
  placed[id]=true; selectedId=null; progress++;
  synth.beep(880,0.08,0.05); setTimeout(()=>synth.beep(1174,0.1,0.05),110);
  showToast(`<span style="color:var(--good)">✔ ${p.name} colocada.</span><br><span style="color:var(--dim);font-size:11px">${p.note}</span>`);
  renderChecklist(); renderProg(); pintaVivo();
  if(progress>=PARTS.length) finishAssembly();
  else el('asmStatus').innerHTML=`Bien. Faltan <b>${PARTS.length-progress}</b>: toca otra pieza y luego su hueco.`;
}
function wrongSlot(slotId){
  synth.beep(180,0.16,0.06);
  const g=ghosts[slotId]; if(g) g.userData.shake=0.5;
  showToast(`<span style="color:var(--bad)">✗ Ahí no va esa pieza.</span><br><span style="color:var(--dim);font-size:11px">Ese hueco es para: ${PART[slotId].name}.</span>`);
}
let tFinal=null;
function finishAssembly(){
  simUnlocked=true;
  syncCtrlbar();
  el('asmStatus').innerHTML='<span style="color:var(--good)">✅ Motor ensamblado.</span> Se abre en corte para que veas el campo.';
  showToast('<span style="color:var(--good)">✅ Motor armado.</span><br><span style="color:var(--dim);font-size:11px">Lo abrimos en corte: el campo gira y el rotor lo persigue.</span>',4200);
  synth.beep(1046,0.14,0.06); setTimeout(()=>synth.beep(1568,0.16,0.06),150);
  clearTimeout(tFinal);
  // el último asiento tarda ~1,9 s; luego, el motor pasa a media sección y arranca
  tFinal=setTimeout(()=>{ if(mode==='ensamble'&&simUnlocked) setMode('operacion'); },REDUCIDO?700:2300);
}

/* ---------- picker: tocar pieza → tocar hueco ---------- */
function tagged(obj){ let o=obj; while(o){ if(o.userData&&o.userData.kind) return o; o=o.parent; } return null; }
/* Si hay una pieza elegida, su hueco gana aunque haya otra pieza delante en el
   rayo: el hueco del rotor está DENTRO del estátor ya montado. Lo que el plano
   de corte ha quitado no se puede tocar. */
function golpes(ray){ return ray.intersectObjects(scene.children,true).filter(h=>{
  const m=Array.isArray(h.object.material)?h.object.material[0]:h.object.material;
  return !(m&&m.clippingPlanes&&m.clippingPlanes.length&&h.point.x>CLIP.constant+1e-4); }); }
(function(){
  const ray=new THREE.Raycaster(), m=new THREE.Vector2(); let down=null;
  mount.addEventListener('pointerdown',e=>{ down=[e.clientX,e.clientY]; });
  mount.addEventListener('pointerup',e=>{
    if(!down) return; const movido=Math.abs(e.clientX-down[0])+Math.abs(e.clientY-down[1])>6; down=null; if(movido) return;
    const r=mount.getBoundingClientRect(); m.x=((e.clientX-r.left)/r.width)*2-1; m.y=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera(m,S.camera);
    const hits=golpes(ray);
    if(selectedId&&hits.some(h=>{ const t=tagged(h.object); return t&&t.userData.kind==='slot'&&t.userData.id===selectedId; })){ placePart(selectedId); return; }
    const t=hits.length?tagged(hits[0].object):null;
    if(!t||t.userData.kind==='fija'){ if(selectedId&&!t) deselect(); return; }
    if(t.userData.kind==='part'){ selectPart(t.userData.id); }
    else if(t.userData.kind==='slot'){
      if(!selectedId){ el('asmStatus').innerHTML='Primero toca una <b>pieza</b> del banco.'; synth.beep(300,0.08,0.05); }
      else if(selectedId===t.userData.id){ placePart(selectedId); }
      else { wrongSlot(t.userData.id); }
    }
    else if(t.userData.kind==='placed'){ const p=PART[t.userData.id]; if(p) showToast(`<b>${p.name}</b><br><span style="color:var(--dim);font-size:11px">${p.note}</span>`); }
  });
})();
/* El primer clic despierta el audio (los navegadores no dejan sonar antes). */
mount.addEventListener('pointerdown',()=>{ synth.init(); synth.resume(); },{once:true});

/* ---------- checklist / progreso ---------- */
function renderChecklist(){
  el('checklist').innerHTML=PARTS.map(p=>{
    const done=placed[p.id], sel=selectedId===p.id;
    const mk=done?'<span style="color:var(--good)">●</span>':sel?'<span style="color:var(--accent2)">◉</span>':'<span style="color:#48555f">○</span>';
    const c=done?'color:var(--good)':sel?'color:var(--accent2)':'color:var(--dim)';
    return `<div style="${c}">${mk} ${p.name}</div>`;
  }).join('');
}
function renderProg(){ el('p_prog').textContent=`${progress} / ${PARTS.length}`; el('p_prog').className=progress>=PARTS.length?'good':''; }

/* ===================== 9. LA CAPA DEL CAMPO =====================
   Un disco en el plano de corte que se pinta en el sombreador, con las MISMAS
   ecuaciones del bloque de física: las curvas de nivel de A(r,θ) son las
   líneas de flujo de la onda fundamental (entre dos vecinas pasa el mismo
   flujo); el anillo del entrehierro se tiñe con Br —rojo donde el flujo sale
   del estátor (su polo norte), azul donde entra—; cada conductor lleva su
   corriente con la notación de plano (⊙ hacia ti, ⊗ hacia dentro) y las P
   marcas del rotor son las de un disco de estroboscopio. Sobre el cobre y el
   aluminio las líneas se atenúan: el flujo va por el hierro. */
function capaCampo(conRotor){
  const u={uP:{value:2},uPsi:{value:0},uGam:{value:0},uThR:{value:0},uAlfa:{value:0},uMarca:{value:1},
    uRotor:{value:conRotor?1:0},uN:{value:new THREE.Vector3(1,0,0)},uTinte:{value:conRotor?0.34:1.3},uGanancia:{value:conRotor?1:1.25},uLinea:{value:conRotor?1.05:0.45},
    uRg:{value:D.rSi},uRo:{value:D.rSo},uRr:{value:D.rRot},uRsh:{value:D.rEje},
    uR1:{value:RAN.r1},uRf:{value:RAN.rFondo},uDiente:{value:RAN.diente},
    uRt:{value:R_GLIFO[0]},uRb:{value:R_GLIFO[1]},uRbar:{value:BAR.rGl},
    uBc:{value:new THREE.Vector4(BAR.rC,BAR.rA,BAR.rCb,BAR.rB)},
    uIs:{value:new Float32Array(2*Q1)},uIb:{value:new Float32Array(Q2)}};
  const vs=`varying vec2 vP; varying vec3 vW; void main(){ vP=position.xy; vW=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
  const fs=`
precision highp float;
uniform float uP,uPsi,uGam,uThR,uAlfa,uMarca,uRg,uRo,uRr,uRsh,uR1,uRf,uDiente,uRt,uRb,uRbar,uRotor,uTinte,uGanancia,uLinea;
uniform vec3 uN;
uniform vec4 uBc;
uniform float uIs[${2*Q1}]; uniform float uIb[${Q2}];
varying vec2 vP; varying vec3 vW;
const float TAU=6.283185307179586;
float Gr(float r){ if(r<uRg) return pow(r/uRg,uP);
  float a=pow(r/uRo,-uP)-pow(r/uRo,uP), b=pow(uRg/uRo,-uP)-pow(uRg/uRo,uP); return a/b; }
float banda(float d,float w,float px){ return 1.0-smoothstep(w,w+1.3*px,d); }
// glifo de corriente: aro + punto (hacia ti) o aspa (hacia dentro)
float glifo(vec2 d,float I,float R,float px){
  float dd=length(d), lw=max(0.0007,0.9*px);
  float aro=banda(abs(dd-R*0.95),lw*0.5,px);
  float pto=banda(dd,R*0.30,px);
  vec2 dr=vec2(d.x+d.y,d.x-d.y)*0.7071;
  float asp=banda(min(abs(dr.x),abs(dr.y)),lw*0.55,px)*step(dd,R*0.66);
  return aro*0.55+(I>0.0?pto:asp);
}
void main(){
  float r=length(vP); if(r>uRo) discard;
  float th=atan(vP.y,vP.x); if(th<0.0) th+=TAU;
  float px=max(fwidth(r),1e-5);
  float ph=uP*th-uPsi-uGam;
  // --- líneas de flujo: curvas de nivel de A ---
  float A=Gr(r)*cos(ph), n=6.0, L=A*n-0.5;
  float dL=abs(L-floor(L+0.5)), wL=max(fwidth(L),1e-5);
  float lin=1.0-smoothstep(0.42*wL,1.30*wL,dL);
  lin*=smoothstep(0.0,0.006,uRo-r)*mix(1.0,smoothstep(uRsh*0.6,uRsh,r),uRotor);
  // --- ranura del estátor que toca a este punto (marco de ranura: t, r) ---
  float paso=TAU/${Q1}.0, k=floor(th/paso), tk=(k+0.5)*paso;
  vec2 q=vec2(dot(vP,vec2(-sin(tk),cos(tk))),dot(vP,vec2(cos(tk),sin(tk))));
  float enRan=step(uR1,q.y)*step(q.y,uRf)*step(abs(q.x),0.5*(q.y*paso-uDiente));
  // --- barra del rotor (marco del rotor) ---
  float thr=th-uThR; thr=thr-TAU*floor(thr/TAU);
  float pb=TAU/${Q2}.0, j=floor(thr/pb), tj=(j+0.5)*pb+uThR;
  vec2 qb=vec2(dot(vP,vec2(-sin(tj),cos(tj))),dot(vP,vec2(cos(tj),sin(tj))));
  float hb=clamp((qb.y-uBc.z)/(uBc.x-uBc.z),0.0,1.0);
  float enBar=step(length(vec2(qb.x,qb.y-mix(uBc.z,uBc.x,hb))),mix(uBc.w,uBc.y,hb)+0.0005)*step(qb.y,uRr)*uRotor;
  lin*=1.0-0.75*max(enRan,enBar);
  // --- anillo del entrehierro teñido con Br ---
  float b=-sin(ph);
  float anillo=smoothstep(uRr-0.012,uRr-0.005,r)*(1.0-smoothstep(uRg+0.005,uRg+0.013,r));
  vec3 cB=b<0.0?vec3(1.0,0.26,0.16):vec3(0.20,0.50,1.0);
  float aB=anillo*(0.12+0.88*abs(b));
  // --- los polos: la componente radial de B tiñe dientes y yugo cercano (rojo N, azul S) ---
  float br=-(uRg/r)*Gr(r)*sin(ph);
  // sin rotor, el agujero entero se tiñe: los P pares de polos se ven como pétalos que giran
  float r0=mix(0.0,uBc.z-0.03,uRotor);
  float zona=smoothstep(r0,r0+0.03,r)*(1.0-smoothstep(uRf,uRf+0.025,r));
  vec3 cP=br<0.0?vec3(1.0,0.30,0.18):vec3(0.22,0.52,1.0);
  float aP=zona*abs(br)*(1.0-0.6*max(enRan,enBar));
  // --- glifos de corriente ---
  float vis=smoothstep(2.2,4.5,0.0072/px), gl=0.0;
  int ki=int(k);
  for(int c=0;c<2;c++){ float rc=c==0?uRt:uRb; float I=uIs[2*ki+c];
    gl=max(gl,glifo(q-vec2(0.0,rc),I,0.0070,px)*clamp(abs(I)*1.8,0.0,1.0)); }
  float Ib=uIb[int(j)];
  gl=max(gl,glifo(qb-vec2(0.0,uRbar),Ib,0.0068,px)*clamp(abs(Ib)*2.4,0.0,1.0)*uRotor);
  gl*=vis;
  // --- marcas del rotor (una por par de polos, como un disco de estroboscopio) ---
  float dm=thr*uP/TAU; dm=dm-floor(dm+0.5);
  float marca=banda(abs(dm)*TAU/uP*r,0.0024,px)*step(0.105,r)*step(r,0.150)*uMarca*uRotor;
  vec3 col=(vec3(0.50,0.86,1.0)*lin*uLinea+cB*aB*1.5+cP*aP*uTinte+vec3(1.0,0.96,0.86)*gl*1.1+vec3(1.0)*marca*1.1)*uGanancia;
  // de canto, las líneas se apiñan en un borrón blanco: la capa se apaga si se mira rasante
  float frente=abs(dot(normalize(cameraPosition-vW),uN));
  gl_FragColor=vec4(col,uAlfa*smoothstep(0.22,0.5,frente));
}`;
  const mat=new THREE.ShaderMaterial({uniforms:u,vertexShader:vs,fragmentShader:fs,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const m=new THREE.Mesh(new THREE.CircleGeometry(D.rSo,192),mat);
  m.rotation.y=Math.PI/2; m.raycast=()=>{}; m.renderOrder=5; m.visible=false; m.frustumCulled=false;
  return {m,u};
}
const CAMPO=capaCampo(true);
CAMPO.m.position.copy(M0).add(new THREE.Vector3(X_CORTE+0.0012,0,0)); scene.add(CAMPO.m);
/* EL GANCHO DEL BANCO: el estátor que espera en el banco ya está energizado.
   Sin rotor, el campo de la onda fundamental en el agujero vacío tiene la
   MISMA forma (r/Rg)^P·cos(Pθ − ψ − γ) —es la solución de Laplace dentro de
   la lámina de corriente—; cambia su magnitud, no su dibujo ni su giro a ns.
   Una segunda capa, sin barras ni marcas de rotor, va pegada a la cara
   superior del paquete y viaja con la pieza. Se apaga al montar el estátor. */
const CAMPO_B=capaCampo(false);
CAMPO_B.u.uIs.value=CAMPO.u.uIs.value; CAMPO_B.u.uIb.value=CAMPO.u.uIb.value;
CAMPO_B.m.position.set(D.lc/2+0.013,0,0);
// un vidrio ahumado en la boca: el agujero vacío deja ver el banco a través y el campo
// (aditivo) se lavaba contra ese fondo claro; detrás de la capa, sólo dentro del agujero
CAMPO_B.fondo=new THREE.Mesh(new THREE.CircleGeometry(D.rSi-0.001,96),new THREE.MeshBasicMaterial({color:0x04080b,transparent:true,opacity:0,depthWrite:false}));
CAMPO_B.fondo.position.z=-0.0008; CAMPO_B.fondo.renderOrder=4; CAMPO_B.fondo.raycast=()=>{};   // hijo de la capa: mismo plano, un pelo detrás
CAMPO_B.m.add(CAMPO_B.fondo);

/* ===================== 10. EL RELOJ ÚNICO =====================
   Un solo reloj mueve todo: ψ (ángulo eléctrico de la red) y θr (ángulo del
   rotor). De ellos salen, en cada cuadro, el giro del rotor y del ventilador,
   el brillo de los 72 conductores, de las 28 barras y de las cabezas de cada
   fase, las líneas de flujo, el diagrama de fasores del panel y el punto de la
   curva. La cámara lenta divide el tiempo real por N; el estroboscopio congela
   ψ y deja correr al rotor al ritmo aparente del deslizamiento. */
const STATE={f:60, p:4, TL:10};
const RELOJ={pausa:REDUCIDO,N:100,Ne:1,auto:true,estrobo:false,psi:0,thR:0,esc:0};
let DV=devanado(STATE.p/2);
// cada conductor brilla con el color de SU fase (el mismo del panel)
function fasesBrillo(){ const uF=MC.cobreC.userData.brillo.uF.value; DV.cond.forEach((c,i)=>{ uF[i]=c.ph; }); }
fasesBrillo();
const enSim=()=>simUnlocked&&(mode==='operacion'||mode==='curva'||mode==='reto');
// en el reto la máquina se queda quieta y sin capa de campo: se calcula con la placa, no se mide
const anima=()=>enSim()&&mode!=='reto';
// el estátor espera en el banco (o va de camino, aún sin asentar): ya está energizado
const enBanco=()=>mode==='ensamble'&&!placed.estator&&!!groups.estator;
function ajustaCamaraLenta(){ const st=motorState(STATE.f,STATE.p,STATE.TL);
  if(RELOJ.auto) RELOJ.N=camaraLentaAuto(st.ns);
  RELOJ.Ne=lentoEstrobo(velEstrobo(st.stalled?1:st.s,DOSPI*STATE.f/(STATE.p/2))); }
function cambiaPolos(){
  const P=STATE.p/2;
  if(groups.estator) DV=rehaceCabezas(groups.estator.userData.cabezas,P); else DV=devanado(P);
  fasesBrillo();
  if(ghosts.estator) rehaceCabezas(ghosts.estator.userData.cabezas,P), ghosts.estator.traverse(o=>{ if(o.isMesh) o.material=ghosts.estator.userData.gm; });
}

/* ---------- el corte que barre la máquina ---------- */
const CORTE={x:X_SIN,de:X_SIN,a:X_SIN,t:1,dur:1.7};
function ponCorte(on){ const meta=on?X_CORTE:X_SIN; if(Math.abs(CORTE.a-meta)<1e-6&&CORTE.t>=1) return;
  CORTE.de=CORTE.x; CORTE.a=meta; CORTE.t=0;
  // el plano entra desde la punta del eje, no desde el infinito
  if(on&&CORTE.de>1.2) CORTE.de=1.12;
  CORTE.dur=REDUCIDO?0.01:(on?1.8:1.0); }
function corteListo(){ return Math.abs(CORTE.x-X_CORTE)<0.002; }

/* ---------- cámaras encajadas en el hueco libre de la pantalla ---------- */
// los paneles son position:fixed: su offsetParent es SIEMPRE null, no sirve para saber si se ven
function seVe(e){ if(!e) return false; const b=e.getBoundingClientRect(); return b.width>0&&b.height>0&&getComputedStyle(e).display!=='none'; }
function huecoLibre(){
  const W=innerWidth, H=innerHeight, r=id=>{ const e=el(id); return seVe(e)?e.getBoundingClientRect():null; };
  const hud=r('hud'), pan=r('panel'), tb=r('tbar'), vb=r('vbar');
  let x0=8, x1=W-8, y0=60, y1=H-12;
  if(W>820){ if(hud&&hud.width) x0=hud.right+12; if(pan&&pan.width) x1=pan.left-12;
    if(vb&&vb.height) y0=Math.max(y0,vb.bottom+8); if(tb&&tb.height) y1=Math.min(y1,tb.top-8); }
  else { y1=H*0.52; }
  return {x0,x1,y0,y1};
}
function encaja(t,dir,pts,caja,margen=0){
  if(margen){ const mx=(caja.x1-caja.x0)*margen, my=(caja.y1-caja.y0)*margen; caja={x0:caja.x0+mx,x1:caja.x1-mx,y0:caja.y0+my,y1:caja.y1-my}; }
  const cam=S.camera.clone(), W=innerWidth, H=innerHeight, tan=Math.tan(cam.fov*DEG/2);
  cam.aspect=W/H; cam.updateProjectionMatrix();
  const cw=caja.x1-caja.x0, ch=caja.y1-caja.y0, cx=(caja.x0+caja.x1)/2, cy=(caja.y0+caja.y1)/2;
  let dist=5; const q=new THREE.Vector3(), der=new THREE.Vector3(), arr=new THREE.Vector3(); t=t.clone();
  for(let it=0;it<7;it++){
    cam.position.copy(t).addScaledVector(dir,dist); cam.lookAt(t); cam.updateMatrixWorld();
    let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;
    for(const p of pts){ q.copy(p).project(cam); const sx=(q.x+1)/2*W, sy=(1-q.y)/2*H;
      a0=Math.min(a0,sx); a1=Math.max(a1,sx); b0=Math.min(b0,sy); b1=Math.max(b1,sy); }
    const k=Math.max((a1-a0)/cw,(b1-b0)/ch), wpp=2*tan*dist/H;
    der.setFromMatrixColumn(cam.matrixWorld,0); arr.setFromMatrixColumn(cam.matrixWorld,1);
    t.addScaledVector(der,((a0+a1)/2-cx)*wpp).addScaledVector(arr,-((b0+b1)/2-cy)*wpp);
    dist*=k;
  }
  const p=t.clone().addScaledVector(dir,dist);
  return [[p.x,p.y,p.z],[t.x,t.y,t.z]];
}
const caja3=(a,b)=>{ const r=[]; for(const x of [a[0],b[0]]) for(const y of [a[1],b[1]]) for(const z of [a[2],b[2]]) r.push(new THREE.Vector3(x,y,z)); return r; };
const enMundo=(x,y,z)=>new THREE.Vector3(M0.x+x,M0.y+y,M0.z+z);
const VISTA={actual:'banco'};
function vistaCam(v){
  const H=huecoLibre();
  if(v==='banco'){
    const pts=caja3([-2.0,Y_MESA,-0.45],[2.05,M0.y+0.62,1.75]);
    return encaja(new THREE.Vector3(0.05,1.05,0.7),new THREE.Vector3(0.40,0.66,0.92).normalize(),pts,H,0.02);
  }
  if(v==='frente'){
    const pts=[]; for(let i=0;i<24;i++){ const a=i/24*DOSPI; pts.push(enMundo(X_CORTE,0.53*Math.sin(a),0.53*Math.cos(a))); }
    pts.push(enMundo(X_CORTE,-0.50,0),enMundo(X_CORTE,D.rFs+0.17,0));
    return encaja(enMundo(X_CORTE,0,0),new THREE.Vector3(1,0.12,0.20).normalize(),pts,H,0.07);
  }
  if(v==='jaula'){
    const pts=caja3([M0.x-0.80,M0.y-0.05,M0.z-0.05],[M0.x+0.32,M0.y+0.50,M0.z+0.50]);
    return encaja(enMundo(-0.20,0.18,0.18),new THREE.Vector3(0.30,0.62,0.74).normalize(),pts,H,0.03);
  }
  // '34': la máquina entera, de la cubierta del ventilador a la cara de corte
  const pts=caja3([M0.x-1.09,M0.y-0.50,M0.z-0.53],[M0.x+X_CORTE+0.02,M0.y+0.64,M0.z+0.53]);
  return encaja(enMundo(-0.35,0.04,0),new THREE.Vector3(0.80,0.40,0.72).normalize(),pts,H,0.08);
}
function ponVista(v,dur){ VISTA.actual=v; const c=vistaCam(v); S.moveTo(c[0],c[1],dur===undefined?(REDUCIDO?0.01:1.3):dur); pintaBarras(); }

/* ---------- el lazo de animación ---------- */
let ultimoDock=0;
S.setAnimate((dt0,t)=>{
  const dt=Math.min(dt0,0.1);
  for(let i=tweens.length-1;i>=0;i--){ const w=tweens[i]; w.t=Math.min(1,w.t+dt/w.dur); w.upd(w.t);
    if(w.t>=1){ tweens.splice(i,1); if(w.onDone) w.onDone(); } }
  // piezas del banco: la elegida se levanta; la que está bajo el ratón, apenas; la que
  // toca montar ahora «respira» un poco (sin nada elegido), para invitar al primer clic
  const sig=selectedId?null:(ORDER.find(id=>!placed[id]&&(!PART[id].req||placed[PART[id].req]))||null);
  for(const g of trayObjs){ if(g.userData.kind!=='part') continue;
    const sel=selectedId===g.userData.id, hov=HOVER.id===g.userData.id;
    const resp=(sig===g.userData.id&&!REDUCIDO)?0.016*(0.5-0.5*Math.cos(t*2.6)):0;
    g.userData.lift=clamp(g.userData.lift+(sel?1:-1)*dt*3.0,0,1);
    g.userData.hover=clamp(g.userData.hover+(hov&&!sel?1:-1)*dt*6,0,1);
    g.position.y=g.userData.baseY+ease(g.userData.lift)*0.24+ease(g.userData.hover)*0.03+(sel?0.012*Math.sin(t*2.2):0)+resp; }
  for(const gh of ghostObjs){ if(!gh.parent) continue; const gm=gh.userData.gm;
    if(gh.userData.fading){ gm.opacity=Math.max(0,gm.opacity-dt*1.2); if(gm.opacity<=0){ gh.visible=false; scene.remove(gh); } continue; }
    gm.opacity=0.16+0.10*(0.5+0.5*Math.sin(t*3.0));
    if(gh.userData.shake>0){ gh.userData.shake=Math.max(0,gh.userData.shake-dt*2.2); gh.position.x=gh.userData.homeX+Math.sin(t*45)*0.04*gh.userData.shake; }
    else gh.position.x=gh.userData.homeX; }
  // el plano de corte
  if(CORTE.t<1){ CORTE.t=Math.min(1,CORTE.t+dt/CORTE.dur); CORTE.x=CORTE.de+(CORTE.a-CORTE.de)*ease(CORTE.t); }
  else CORTE.x=CORTE.a;
  CLIP.constant=M0.x+CORTE.x;
  // el motor gira con la simulación abierta; en el banco, el estátor suelto ya hace girar su campo
  const sim=anima(), banco=enBanco();
  const st=motorState(STATE.f,STATE.p,STATE.TL), P=STATE.p/2, w=DOSPI*STATE.f, ws=w/P, s=st.stalled?1:st.s;
  RELOJ.esc+=((((sim||banco)&&!RELOJ.pausa)?1:0)-RELOJ.esc)*Math.min(1,dt*2.4);
  if(sim||banco){
    if(!RELOJ.estrobo||!sim){ const dts=dt*RELOJ.esc/RELOJ.N; RELOJ.psi+=w*dts; if(sim) RELOJ.thR+=(1-s)*ws*dts; }
    else RELOJ.thR+=velEstrobo(s,ws)*dt*RELOJ.esc/RELOJ.Ne;     // ψ congelado: cada destello cae en la misma fase
    RELOJ.psi%=DOSPI*12; RELOJ.thR%=DOSPI*12;
  }
  if(placed.rotor&&groups.rotor&&!tweens.some(x=>x.obj===groups.rotor)){ groups.rotor.rotation.set(RELOJ.thR,0,0); }
  if(placed.ventilador&&groups.ventilador&&!tweens.some(x=>x.obj===groups.ventilador)){ groups.ventilador.rotation.set(RELOJ.thR,0,0); }
  // brillos: corriente de cada conductor, de cada barra y de cada fase
  const encendido=(sim||banco)?1:0, uS=MC.cobreC.userData.brillo, uB=MC.barras.userData.brillo;
  for(let i=0;i<2*Q1;i++) CAMPO.u.uIs.value[i]=uS.uI.value[i]=corrienteConductor(DV.cond[i],RELOJ.psi);
  for(let j=0;j<Q2;j++) CAMPO.u.uIb.value[j]=uB.uI.value[j]=iBarra(RELOJ.thR+(j+0.5)*DOSPI/Q2,RELOJ.psi,P,DV.gam,s);
  BRILLO.est+=(encendido-BRILLO.est)*Math.min(1,dt*3); BRILLO.rot+=((sim?1:0)-BRILLO.rot)*Math.min(1,dt*3);
  uS.uGain.value=0.75*BRILLO.est; uB.uGain.value=2.6*BRILLO.rot;
  // en el banco, las cabezas de bobina se encienden más: son lo primero que ve el alumno
  const kF=banco?0.85:0.42, iF=corrientesFase(RELOJ.psi); MC.fase.forEach((m,k)=>{ m.emissiveIntensity=kF*Math.abs(iF[k])*BRILLO.est; });
  // la capa del campo
  const u=CAMPO.u, vis=sim&&corteListo();
  u.uAlfa.value+=((vis?1:0)-u.uAlfa.value)*Math.min(1,dt*(vis?2.2:6));
  CAMPO.m.visible=u.uAlfa.value>0.01;
  u.uP.value=P; u.uPsi.value=RELOJ.psi; u.uGam.value=DV.gam; u.uThR.value=RELOJ.thR+giroEn(X_CORTE);
  // la del banco: mismo ψ, misma fase γ, normal = el eje de la pieza (de pie, mira hacia arriba)
  const ub=CAMPO_B.u, vb=banco&&!!CAMPO_B.m.parent;
  ub.uAlfa.value+=((vb?1:0)-ub.uAlfa.value)*Math.min(1,dt*(vb?1.6:5));
  CAMPO_B.m.visible=ub.uAlfa.value>0.01; CAMPO_B.fondo.material.opacity=0.78*ub.uAlfa.value;
  ub.uP.value=P; ub.uPsi.value=RELOJ.psi; ub.uGam.value=DV.gam;
  if(CAMPO_B.m.parent) ub.uN.value.set(1,0,0).applyQuaternion(CAMPO_B.m.parent.quaternion);
  // y los polos en la pared del agujero del estátor suelto
  const up=MC.chapa.userData.polos;
  up.uPolos.value+=((banco?1.15:0)-up.uPolos.value)*Math.min(1,dt*(banco?1.6:5));
  if(groups.estator&&up.uPolos.value>0.001){ groups.estator.updateMatrixWorld(); up.uMEst.value.copy(groups.estator.matrixWorld).invert(); }
  up.uPp.value=P; up.uPsiP.value=RELOJ.psi; up.uGamP.value=DV.gam;
  // el panel: el diagrama de fasores sigue al mismo ψ (a ~30 cuadros por segundo)
  if(sim&&t-ultimoDock>1/30){ ultimoDock=t; pintaFasores(); }
  if(ROT.on) colocaRotulos();
});
const BRILLO={est:0,rot:0};

/* ===================== 11. EL PANEL Y EL DOCK =====================
   Nada de texto ni gráficas dentro de la escena: la curva y los fasores viven
   en un dock del DOM, en lienzos medidos en píxeles de pantalla
   (devicePixelRatio), con la tipografía del laboratorio. A la izquierda, lo
   que se controla; a la derecha, lo que se mide; lo largo, plegado. */
(function(){
  const css=document.createElement('style');
  css.textContent=`
:root{--hudW:322px;--dockW:420px}
@media (max-width:1699px){:root{--hudW:300px;--dockW:382px}}
@media (max-width:1439px){:root{--hudW:276px;--dockW:338px}}
.hint,.inspectHint{display:none!important}
.toast{top:108px;max-width:min(600px,calc(100vw - var(--hudW) - var(--dockW) - 80px));line-height:1.5;border-radius:16px;font-size:12.5px}
.hud{top:66px;width:var(--hudW);max-width:none;max-height:calc(100vh - 80px);padding:15px 16px 12px;display:flex;flex-direction:column;gap:9px;overflow-y:auto;scrollbar-width:thin}
.hud .eyebrow{margin:0;font-size:10px}
.hud h2{font-size:19px;line-height:1.18;margin:0}
.hud .intro{font-size:12.8px;line-height:1.5;color:var(--dim);margin:0}
.hud .modebar{margin:0;gap:4px}
.hud .modebar .b{padding:7px 2px;font-size:11px;border-radius:8px;line-height:1.2}
.hud .modebar .b:disabled{opacity:.42;cursor:not-allowed}
.hud .console{margin:0;min-height:0;font-size:11.5px}
.hud #checklist{font-family:var(--mono);font-size:11.5px;line-height:1.75;margin:0}
.hud .btns{margin:0;gap:6px}
.hud .btns .b{padding:8px;font-size:12px}
.hud .cg .cl{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin-bottom:3px;display:flex;justify-content:space-between;gap:6px}
.hud .cg .cl b{letter-spacing:0;text-transform:none;font-size:12px;color:var(--accent2);font-weight:600;font-variant-numeric:tabular-nums}
.hud .cg{margin-bottom:6px}
.hud input[type=range]{width:100%;accent-color:#4FD1C5}
.hud details{border:1px solid var(--line);border-radius:10px;background:rgba(0,0,0,.18)}
.hud details>summary{list-style:none;cursor:pointer;padding:7px 10px;font-size:12px;color:var(--ink);display:flex;gap:7px;align-items:baseline}
.hud details>summary::-webkit-details-marker{display:none}
.hud details>summary:before{content:'▸';color:var(--accent2);font-size:11px;transition:transform .15s}
.hud details[open]>summary:before{transform:rotate(90deg)}
.hud details>.cuerpo{padding:2px 10px 10px;font-size:11.5px;line-height:1.5;color:#c4d0da;max-height:40vh;overflow:auto}
.hud details .formula{font-family:var(--mono);color:var(--accent2);font-size:11.5px;line-height:1.6;margin:4px 0;padding:6px 8px;background:rgba(0,0,0,.25);border-radius:8px}
.hud details .fl{margin:5px 0}.hud details .fl b{color:var(--ink)}.hud details .no b{color:var(--hv)}
.hud .retoBox{border:1px solid rgba(255,183,3,.35);background:rgba(255,183,3,.06);border-radius:10px;padding:9px 10px;display:flex;flex-direction:column;gap:7px}
.hud .retoBox .rt{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--hv)}
.hud .retoBox input{width:100%;padding:7px 8px;border-radius:8px;border:1px solid var(--line);background:#0f1a1d;color:var(--ink);font-family:var(--mono);font-size:13px}
.hud .retoBox .fila{display:flex;gap:6px}.hud .retoBox .fila .b{flex:1;padding:7px 6px;font-size:12px}
@media (max-width:1439px){ .fg b{font-size:15.5px} .fg b small{font-size:10px} .fg{padding:4px 7px} .fg b small.pct{display:none} }
@media (max-height:820px){ .hud{gap:6px;padding:12px 14px 10px}.hud h2{font-size:17px}.hud .intro{font-size:12.2px;line-height:1.42}
  .hud #checklist{line-height:1.6}.hud .btns .b{padding:6px} }
/* ---- el estátor energizado del banco ---- */
.hud .vivo{display:flex;gap:8px;align-items:baseline;font-size:11.8px;line-height:1.45;color:#c9f3ee;margin:0;
  background:rgba(79,209,197,.07);border:1px solid rgba(79,209,197,.28);border-radius:9px;padding:6px 9px}
.hud .vivo i{flex:none;width:7px;height:7px;border-radius:50%;background:#4FD1C5;box-shadow:0 0 8px #4FD1C5;transform:translateY(-1px);animation:latido 1.6s ease-in-out infinite}
.hud .vivo b{color:#fff;font-weight:600}
@keyframes latido{50%{opacity:.3}}
@media (prefers-reduced-motion:reduce){.hud .vivo i{animation:none}}
/* ---- dock de instrumentos ---- */
.panel{top:66px;bottom:14px;width:var(--dockW);max-height:none;padding:13px 14px 12px;display:flex;flex-direction:column;gap:7px;overflow:hidden}
body.enEnsamble .panel{display:none}
.dk-t{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.dk-t #p_mode{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent2);font-weight:700}
.dk-t .sub{font-size:11.5px;color:var(--dim)}
.dk-fig{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
.fg{background:rgba(0,0,0,.22);border:1px solid rgba(30,58,52,.9);border-radius:9px;padding:5px 8px;min-width:0}
.fg .fl{display:block;font-size:10px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg b{display:block;font-size:18px;line-height:1.15;color:var(--ink);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg b small{font-size:11px;color:var(--dim);font-weight:500}
.fg b.bad{color:#ff9a9a}
.dk-aviso{display:none;font-size:11.5px;line-height:1.45;border-radius:9px;padding:6px 9px}
.dk-aviso.on{display:block}.dk-aviso.mal{background:rgba(244,71,94,.12);color:#ffb3bd;border:1px solid rgba(244,71,94,.35)}
.dk-aviso.ojo{background:rgba(255,183,3,.08);color:#ffd88a;border:1px solid rgba(255,183,3,.30)}
.dk-tit{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin:2px 2px -2px}
.dk-g{position:relative;flex:1.7 1 0;min-height:120px;border-radius:10px;background:rgba(0,0,0,.20);border:1px solid rgba(30,58,52,.7)}
.dk-g.b{flex:1 1 0;min-height:96px}
.dk-g canvas{position:absolute;left:0;top:0;width:100%;height:100%}
.dk-ley{display:flex;flex-wrap:wrap;gap:3px 12px;font-size:10.5px;color:#b4c9c4;margin:-2px 2px 0}
.dk-ley .lg{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.dk-ley i{display:inline-block;width:16px;height:0;border-top:2px solid var(--c)}
.dk-ley i.dash{border-top:2px dashed var(--c)}
.dk-ley i.pt{width:9px;height:9px;border:0;border-radius:50%;background:var(--c)}
body.enReto #dkSub,body.enReto .dk-fig,body.enReto .dk-aviso,body.enReto .dk-tit,body.enReto .dk-g,body.enReto .dk-ley{display:none!important}
.dk-reto{display:none;flex-direction:column;gap:10px;flex:1}
body.enReto .dk-reto{display:flex}
.placa{border-radius:12px;padding:14px 16px;background:linear-gradient(160deg,#c9cfd3,#9aa3aa);color:#1b2328;box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 6px 18px rgba(0,0,0,.35);font-family:var(--mono)}
.placa .pl-t{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:800;border-bottom:1.5px solid rgba(27,35,40,.45);padding-bottom:6px;margin-bottom:8px;display:flex;justify-content:space-between}
.placa .pl-f{display:flex;justify-content:space-between;font-size:13px;padding:3px 0;border-bottom:1px dashed rgba(27,35,40,.25)}
.placa .pl-f b{font-size:15px;font-variant-numeric:tabular-nums}
.placa .pl-f.tac{background:rgba(27,35,40,.08);border-radius:6px;padding:4px 6px;margin-top:4px;border:0}
.dk-reto .pl-q{font-size:14px;line-height:1.45;color:#ffd88a}
.dk-reto .pl-ok{font-size:13px;color:var(--good)}
.dk-reto .pl-h{font-size:11.5px;color:var(--dim);line-height:1.5}
/* ---- barras de vistas (arriba) y de reproducción (abajo), centradas en el hueco ---- */
.vbar,.tbar{position:fixed;z-index:16;display:flex;align-items:center;gap:5px;background:var(--panel);backdrop-filter:blur(14px);
  border:1px solid var(--line);border-radius:12px;font-family:var(--mono);font-size:11px;color:var(--dim);transform:translateX(-50%)}
.vbar{top:62px;padding:4px 6px}
.vbar .sep{width:1px;height:18px;background:var(--line);margin:0 3px}
.vbar .b.sm,.tbar .b.sm{padding:4px 10px;font-size:11.5px;border-radius:7px;line-height:1.2}
body.enEnsamble .vbar .sim{display:none}
.tbar{bottom:14px;padding:6px 10px;gap:7px}
body.enEnsamble .tbar,body.enReto .tbar{display:none}
.tbar select{background:#1b242f;color:var(--ink);border:1px solid var(--line);border-radius:7px;padding:3px 5px;font-size:11.5px;font-family:inherit}
.tbar .lento{color:var(--hv);font-size:11.5px;white-space:nowrap}
.tbar #tb_est.on{background:rgba(79,209,197,.18);border-color:var(--accent);color:var(--accent2)}
.tip3{position:fixed;z-index:30;pointer-events:none;font-family:var(--mono);font-size:11.5px;color:#e6f0f2;background:rgba(9,22,24,.9);
  border:1px solid rgba(79,209,197,.4);padding:4px 9px;border-radius:7px;white-space:nowrap;display:none}
.rot3{position:fixed;z-index:13;pointer-events:none;font-family:var(--mono);font-size:11px;color:#e6f0f2;background:rgba(9,22,24,.84);
  border:1px solid rgba(79,209,197,.32);padding:3px 8px;border-radius:7px;white-space:nowrap}
.rot3svg{position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:12;pointer-events:none;overflow:visible}
@media(max-width:820px){
  .hud,.panel{top:auto;bottom:8px;left:8px;right:8px;width:auto;max-height:44vh;overflow-y:auto}
  .hud{bottom:calc(8px + 44vh + 8px);max-height:30vh}
  .vbar{top:58px;left:50%!important}.tbar{top:96px;bottom:auto;left:50%!important}
  .dk-g{min-height:150px}.rot3svg,.rot3{display:none}
}`;
  document.head.appendChild(css);
})();

const INTRO={
  ensamble:'Arma el motor de jaula de ardilla: toca una pieza del banco y luego su hueco luminoso. Al cerrarlo, se abre en corte.',
  operacion:'Tres corrientes desfasadas 120° hacen girar el campo a ns. El rotor lo persigue sin alcanzarlo: esa diferencia es el deslizamiento. Sube la carga y míralo quedarse atrás.',
  curva:'El motor trabaja donde su curva corta la recta de la carga. Si la carga supera el par máximo, no hay cruce: el motor se cala.',
  reto:'Calcula con las fórmulas: la telemetría queda oculta hasta que aciertes.',
};
el('hud').innerHTML=`
  <div class="eyebrow">Máquinas eléctricas · Inducción</div>
  <h2>El rotor que persigue al campo</h2>
  <p class="intro" id="hudIntro"></p>
  <div class="modebar">
    <button class="b on" id="m_ensamble">① Ensamble</button>
    <button class="b" id="m_operacion" disabled>② Operación</button>
    <button class="b" id="m_curva" disabled>③ Curva</button>
    <button class="b" id="m_reto" disabled>④ Reto</button>
  </div>
  <div id="secEnsamble">
    <div class="console" id="asmStatus"></div>
    <div class="vivo" id="asmVivo"><i></i><span id="asmVivoTxt"></span></div>
    <div class="g" style="margin:7px 0 3px"><div class="gl"><span>Piezas colocadas</span><b id="p_prog">0 / 6</b></div></div>
    <div id="checklist"></div>
    <div class="btns" style="margin-top:7px">
      <button class="b auto" id="btnAuto">✨ Armado automático (guiado)</button>
      <button class="b" id="btnReset">↺ Reiniciar ensamble</button>
    </div>
  </div>
  <div id="secParam" style="display:none">
    <div class="cg"><div class="cl"><span>Frecuencia de red f</span><b id="t_f">60 Hz</b></div>
      <input id="sl_f" type="range" min="50" max="60" value="60" step="1"></div>
    <div class="cg"><div class="cl"><span>Número de polos p</span><b id="t_p">4 polos</b></div>
      <input id="sl_p" type="range" min="2" max="8" value="4" step="2"></div>
    <div class="cg"><div class="cl"><span>Par de carga TL</span><b id="t_tl">10,0 N·m</b></div>
      <input id="sl_tl" type="range" min="0" max="26" value="10" step="0.5"></div>
    <div class="btns"><button class="b auto" id="btnAuto2">✨ Barrido guiado (automático)</button></div>
  </div>
  <div id="secReto" style="display:none">
    <div class="retoBox">
      <div class="rt">④ Reto — calcula el valor</div>
      <div class="console" id="retoText">Lee la placa (derecha) para ver el escenario.</div>
      <input id="retoInput" type="number" step="0.001" placeholder="valor numérico">
      <div class="fila"><button class="b primary" id="btnCheck">✔ Verificar</button><button class="b" id="btnNew">🎲 Nuevo reto</button></div>
    </div>
  </div>
  <details id="dEc"><summary>Ecuaciones del modelo</summary><div class="cuerpo">
    <div class="formula">ns = 120·f / p<br>s = (ns − n) / ns<br>T(s) = 2·Tmáx / (s/sm + sm/s)<br>s(TL) = sm·(1 − √(1 − k²))/k, k = TL/Tmáx<br>f₂ = s·f</div>
    <div class="fl">El campo: tres corrientes i<sub>k</sub> = Im·cos(ωt − k·120°) en tres devanados a 120° dan B(θ,t) ∝ Σ i<sub>k</sub>·cos(Pθ − k·120°) = 1,5·Im·cos(Pθ − ωt): una onda de módulo constante que gira a ω/P, es decir, a ns.</div>
    <div class="fl">Las barras: su corriente es ∝ s/√(s² + sm²), retrasada φ₂ = atan(s/sm). El par que hacen en ese campo, sumado barra a barra, es exactamente la curva de Kloss.</div>
  </div></details>
  <details id="dFid"><summary>Contrato de fidelidad y fuentes</summary><div class="cuerpo">
    <div class="fl">SÍ modela: <b>ns = 120·f/p; s = (ns − n)/ns; la curva de Kloss con sm y Tmáx fijos; el punto estable 0 &lt; s ≤ sm y el calado si TL &gt; Tmáx; el campo giratorio de la onda fundamental del devanado real de 36 ranuras; la corriente de cada barra y su frecuencia f₂ = s·f.</b></div>
    <div class="fl no">NO modela: <b>el circuito equivalente completo (R1, X1, Xm), la relación V/f de un variador, la corriente de arranque, el calentamiento ni el transitorio de arranque. El estátor se dibuja con su corriente magnetizante normalizada (la que crea el campo); su componente de carga, no. Las líneas de flujo son las de hierro lineal sin ranuras: las reales se apiñan en los dientes.</b></div>
    <div class="fl no">Geometría: <b>un motor TEFC de ~2 kW (carcasa IEC 100L) a escala; 36 ranuras, 28 barras inclinadas un paso de ranura; entrehierro dibujado de 0,8 mm (el real ronda 0,3 mm). El devanado se redibuja para el número de polos elegido; un motor real lo trae fijo de fábrica.</b></div>
    <div class="fl">Motor ilustrativo, <b>no un datasheet</b>: Tmáx = 22 N·m, sm = 0,18; T(s=1) = 7,67 N·m. Referencias generales: IEEE 112 e IEC 60034; programa ELE-II.1 / EM-II.1.</div>
  </div></details>`;

el('panel').innerHTML=`
  <div class="dk-t"><b id="p_mode">Ensamble</b><span class="sub" id="dkSub"></span></div>
  <div class="dk-fig">
    <div class="fg" title="Velocidad síncrona: la del campo giratorio"><span class="fl">síncrona ns</span><b id="t_ns">—</b></div>
    <div class="fg" title="Velocidad del rotor"><span class="fl">rotor n</span><b id="t_n">—</b></div>
    <div class="fg" title="Deslizamiento s = (ns − n)/ns"><span class="fl">deslizamiento s</span><b id="t_s">—</b></div>
    <div class="fg" title="Par entregado en el punto de operación"><span class="fl">par T</span><b id="t_t">—</b></div>
    <div class="fg" title="Frecuencia de las corrientes del rotor, f₂ = s·f"><span class="fl">frecuencia f₂</span><b id="t_f2">—</b></div>
    <div class="fg" title="Potencia mecánica en el eje, T·ω"><span class="fl">potencia</span><b id="t_pmech">—</b></div>
  </div>
  <div class="dk-aviso" id="dkAviso"></div>
  <div class="dk-tit">Curva par–velocidad</div>
  <div class="dk-g" id="gCurva"><canvas class="g"></canvas></div>
  <div class="dk-ley">
    <span class="lg"><i style="--c:#4FD1C5"></i>motor (estable)</span><span class="lg"><i class="dash" style="--c:#6f8a86"></i>inestable</span>
    <span class="lg"><i style="--c:#FFB703"></i>carga TL</span><span class="lg"><i class="pt" style="--c:#e8fffb"></i>punto de operación</span></div>
  <div class="dk-tit">Las tres corrientes y su suma</div>
  <div class="dk-g b" id="gFasor"><canvas class="g"></canvas></div>
  <div class="dk-ley">
    <span class="lg"><i style="--c:${COL_FASE[0]}"></i>i<sub>a</sub></span><span class="lg"><i style="--c:${COL_FASE[1]}"></i>i<sub>b</sub></span>
    <span class="lg"><i style="--c:${COL_FASE[2]}"></i>i<sub>c</sub></span><span class="lg"><i style="--c:#ffffff"></i>suma: campo (1,5·Im)</span></div>
  <div class="dk-reto" id="dkReto"></div>`;

/* ---- barras de vistas y de reproducción ---- */
(function(){
  const b=document.createElement('div'); b.className='vbar'; b.id='vbar';
  b.innerHTML='<button class="b sm sim" data-vista="34" title="La máquina en corte, en tres cuartos">3/4</button>'+
    '<button class="b sm sim" data-vista="frente" title="La cara de corte de frente: el campo giratorio">Frente</button>'+
    '<button class="b sm sim" data-vista="jaula" title="Por la ventana: la jaula del rotor y sus barras">Jaula</button>'+
    '<span class="sep sim"></span><button class="b sm sim" id="tb_rot" title="Los nombres de las piezas">Rótulos</button>'+
    '<span class="sep sim"></span><button class="b sm" id="tb_cal"></button>';
  document.body.appendChild(b);
  b.querySelectorAll('[data-vista]').forEach(x=>{ x.onclick=()=>ponVista(x.getAttribute('data-vista')); });
  el('tb_rot').onclick=()=>{ ROT.on=!ROT.on; pintaRotulos(); pintaBarras(); };
  el('tb_cal').onclick=()=>{ CAL.nivel=calAlta()?'media':'alta'; CAL.motivo='elegida a mano'; aplicaCalidad(); pintaBarras(); };
  const t=document.createElement('div'); t.className='tbar'; t.id='tbar';
  t.innerHTML='<button class="b sm" id="tb_play" title="Reproducir o pausar (espacio)">⏸</button>'+
    '<select id="tb_vel" title="Cámara lenta respecto a la velocidad real"><option value="auto">auto</option>'+VEL_N.map(n=>'<option value="'+n+'">×1/'+fN(n)+'</option>').join('')+'</select>'+
    '<span class="lento" id="tb_txt"></span>'+
    '<button class="b sm" id="tb_est" title="Destella a la frecuencia de red: el campo se queda quieto y el rotor se ve retroceder al ritmo del deslizamiento">Estroboscopio</button>';
  document.body.appendChild(t);
  el('tb_play').onclick=()=>{ RELOJ.pausa=!RELOJ.pausa; pintaBarras(); };
  el('tb_vel').onchange=e=>{ const v=e.target.value; RELOJ.auto=v==='auto'; if(!RELOJ.auto) RELOJ.N=Number(v); ajustaCamaraLenta(); pintaBarras(); };
  el('tb_est').onclick=()=>{ RELOJ.estrobo=!RELOJ.estrobo; ajustaCamaraLenta(); pintaBarras(); };
  document.addEventListener('keydown',e=>{
    if(/INPUT|SELECT|TEXTAREA/.test((e.target&&e.target.tagName)||'')) return;
    if(e.code==='Space'&&enSim()){ e.preventDefault(); RELOJ.pausa=!RELOJ.pausa; pintaBarras(); }
  });
})();
/* La línea del estátor energizado: sólo mientras espera en el banco. */
function pintaVivo(){
  const e=el('asmVivo'); if(!e) return; const on=enBanco(); e.style.display=on?'':'none'; if(!on) return;
  const ns=motorState(STATE.f,STATE.p,STATE.TL).ns;
  el('asmVivoTxt').innerHTML=`El estátor solo ya hace girar el campo, a <b>ns = ${fN(ns)} rpm</b> `+
    (RELOJ.pausa?'(quieto: movimiento reducido)':`(aquí ×1/${fN(RELOJ.N)})`)+'. Mete el rotor y verás cómo lo persigue.';
}
function colocaBarras(){
  if(innerWidth<=820){ for(const id of ['vbar','tbar']) el(id).style.left='50%'; return; }
  const a=el('hud').getBoundingClientRect(), p=el('panel'), b=seVe(p)?p.getBoundingClientRect():{left:innerWidth-8};
  const cx=(a.right+b.left)/2+'px'; el('vbar').style.left=cx; el('tbar').style.left=cx;
}
function pintaBarras(){
  document.querySelectorAll('#vbar [data-vista]').forEach(x=>x.classList.toggle('on',x.getAttribute('data-vista')===VISTA.actual));
  el('tb_rot').classList.toggle('on',ROT.on);
  el('tb_cal').innerHTML='Calidad: <b>'+CAL.nivel+'</b>';
  el('tb_cal').title='Calidad de imagen: '+CAL.nivel+(CAL.motivo?' ('+CAL.motivo+')':'')+'. Pulsa para pasar a '+(calAlta()?'media: menos resolución, sombras simples y sin resplandor; la física no cambia.':'alta.');
  el('tb_play').textContent=RELOJ.pausa?'▶':'⏸';
  el('tb_vel').value=RELOJ.auto?'auto':String(RELOJ.N);
  if(RELOJ.estrobo){ const st=motorState(STATE.f,STATE.p,STATE.TL);
    el('tb_txt').textContent=st.stalled?'destellos a '+fN(STATE.f)+' Hz · rotor parado':'destellos a '+fN(STATE.f)+' Hz · el rotor retrocede '+fN(st.s*st.ns)+' rpm · ×1/'+fN(RELOJ.Ne); }
  else el('tb_txt').textContent=RELOJ.pausa?'en pausa — ▶ o espacio para girar (×1/'+fN(RELOJ.N)+')':'×1/'+fN(RELOJ.N)+' — cámara lenta';
  el('tb_vel').disabled=RELOJ.estrobo;
  el('tb_est').classList.toggle('on',RELOJ.estrobo);
  colocaBarras();
}
function aplicaCalidad(){
  const alta=calAlta(), pr=alta?Math.min(devicePixelRatio,2):Math.min(devicePixelRatio,1.5);
  S.renderer.setPixelRatio(pr); if(S.composer.setPixelRatio) S.composer.setPixelRatio(pr); S.resize();
  if(LUZ.clave){ const n=alta?2048:1024; if(LUZ.clave.shadow.mapSize.x!==n){ LUZ.clave.shadow.mapSize.set(n,n); if(LUZ.clave.shadow.map){ LUZ.clave.shadow.map.dispose(); LUZ.clave.shadow.map=null; } } }
  S.bloom.enabled=alta;   // en media, sin resplandor: es el pase de posproceso más caro que queda
  // en media, fuera la oclusión ambiental (GTAO): es el pase caro y repinta la escena entera
  for(const ps of S.composer.passes) if(/GTAO/.test((ps.constructor&&ps.constructor.name)||'')||'gtaoMaterial' in ps) ps.enabled=alta;
}

/* ---- ratón: nombre de la pieza al pasar por encima ---- */
const HOVER={id:null,t:0};
(function(){
  const tip=document.createElement('div'); tip.className='tip3'; document.body.appendChild(tip);
  const ray=new THREE.Raycaster(), m=new THREE.Vector2(); let ult=0, abajo=false;
  mount.addEventListener('pointerdown',()=>{ abajo=true; }); addEventListener('pointerup',()=>{ abajo=false; });
  mount.addEventListener('pointerleave',()=>{ tip.style.display='none'; HOVER.id=null; });
  mount.addEventListener('pointermove',e=>{
    const ahora=performance.now(); if(abajo||ahora-ult<70) return; ult=ahora;
    const r=mount.getBoundingClientRect(); m.x=((e.clientX-r.left)/r.width)*2-1; m.y=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera(m,S.camera);
    const hits=golpes(ray);
    let nom=null, id=null;
    for(const h of hits){ const t=tagged(h.object); if(!t) continue;
      id=t.userData.id||null; nom=t.userData.kind==='slot'?('Hueco de: '+PART[t.userData.id].name):(t.userData.nombre||(PART[id]&&PART[id].name)); break; }
    HOVER.id=id;
    if(nom){ tip.textContent=nom; tip.style.display='block'; tip.style.left=(e.clientX+14)+'px'; tip.style.top=(e.clientY+12)+'px'; mount.style.cursor='pointer'; }
    else { tip.style.display='none'; mount.style.cursor=''; }
  });
})();

/* ---- rótulos opcionales (sólo con la simulación abierta) ---- */
const ROT={on:false,els:[]};
const ANCLAS=[
  ['Carcasa con aletas (TEFC)',()=>enMundo(-0.46,0.52,0.03)],
  ['Chapa del estátor · 36 ranuras',()=>enMundo(X_CORTE,0.31,-0.16)],
  ['Cabezas de bobina (3 fases)',()=>enMundo(-0.40,-0.17,0.24)],
  ['Barras de la jaula',()=>enMundo(-0.10,0.10,0.215)],
  ['Anillo de cortocircuito',()=>enMundo(-0.33,0.11,0.17)],
  ['Rodamiento',()=>enMundo(-0.67,0.06,0.115)],
  ['Ventilador',()=>enMundo(-0.87,0.16,0.27)],
  ['Entrehierro: el campo',()=>enMundo(X_CORTE,0.17,0.17)],
];
(function(){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('class','rot3svg'); svg.id='rotSvg'; document.body.appendChild(svg);
  for(const [txt] of ANCLAS){ const d=document.createElement('div'); d.className='rot3'; d.textContent=txt; d.style.display='none'; document.body.appendChild(d);
    const ln=document.createElementNS('http://www.w3.org/2000/svg','path'); ln.setAttribute('stroke','rgba(79,209,197,.55)'); ln.setAttribute('fill','none'); ln.setAttribute('stroke-width','1.2'); svg.appendChild(ln);
    ROT.els.push({d,ln}); }
})();
function pintaRotulos(){ const vis=ROT.on&&enSim(); ROT.els.forEach(e=>{ e.d.style.display=vis?'block':'none'; e.ln.style.display=vis?'':'none'; }); }
function colocaRotulos(){
  if(!enSim()){ pintaRotulos(); return; }
  const H=huecoLibre(), q=new THREE.Vector3(), cx=(H.x0+H.x1)/2, izq=[], der=[];
  ANCLAS.forEach(([txt,f],i)=>{ q.copy(f()).project(S.camera); const x=(q.x+1)/2*innerWidth, y=(1-q.y)/2*innerHeight; (x<cx?izq:der).push({i,x,y}); });
  for(const [col,lado] of [[izq,-1],[der,1]]){ col.sort((a,b)=>a.y-b.y); let yMin=H.y0+4;
    for(const c of col){ const e=ROT.els[c.i], w=e.d.offsetWidth||120, h=e.d.offsetHeight||22;
      const y=Math.max(yMin,c.y-h/2); yMin=y+h+6;
      const x=lado<0?H.x0+6:H.x1-6-w; e.d.style.left=x+'px'; e.d.style.top=y+'px';
      const xa=lado<0?x+w:x; e.ln.setAttribute('d','M'+xa+' '+(y+h/2)+' L'+c.x+' '+c.y);
      e.ln.setAttribute('marker-end',''); } }
}

/* ---- los lienzos del dock ---- */
const FUENTE='Outfit,system-ui,"Segoe UI",Roboto,sans-serif';
function lienzo(id){ const box=el(id), c=box.querySelector('canvas'); return {box,c,ctx:c.getContext('2d'),w:0,h:0,dpr:1}; }
function abre(L){ const r=L.box.getBoundingClientRect(), dpr=Math.min(3,window.devicePixelRatio||1);
  const w=Math.max(20,Math.round(r.width)), h=Math.max(20,Math.round(r.height));
  if(L.w!==w||L.h!==h||L.dpr!==dpr){ L.c.width=Math.round(w*dpr); L.c.height=Math.round(h*dpr); L.w=w; L.h=h; L.dpr=dpr; }
  const x=L.ctx; x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,w,h); return x; }
const LC=lienzo('gCurva'), LF=lienzo('gFasor');
function txt(x,t,px,py,col,size,align,peso){ x.fillStyle=col; x.font=(peso||'600')+' '+(size||11)+'px '+FUENTE; x.textAlign=align||'left'; x.textBaseline='alphabetic'; x.fillText(t,px,py); }
function lin(x,x1,y1,x2,y2,col,w,dash){ x.strokeStyle=col; x.lineWidth=w||1; x.setLineDash(dash||[]); x.beginPath(); x.moveTo(x1,y1); x.lineTo(x2,y2); x.stroke(); x.setLineDash([]); }
function redondo(v){ const p=[300,500,600,900,1000,1200,1500,1800,2000,2400,3000,3600,4000]; for(const q of p) if(q>=v) return q; return Math.ceil(v/500)*500; }
function pintaCurva(){
  const x=abre(LC), W=LC.w, H=LC.h, st=motorState(STATE.f,STATE.p,STATE.TL);
  const P={x:46,y:14,w:W-46-14,h:H-14-34};
  const nMax=redondo(st.ns*1.06), TM=26;
  const X=n=>P.x+P.w*n/nMax, Y=T=>P.y+P.h-P.h*T/TM;
  const pasoN=nMax<=1000?200:(nMax<=2000?400:(nMax<=3000?600:800));
  x.strokeStyle='rgba(143,179,172,0.10)'; x.lineWidth=1;
  for(let n=0;n<=nMax+1;n+=pasoN){ const xx=Math.round(X(n))+0.5; x.beginPath(); x.moveTo(xx,P.y); x.lineTo(xx,P.y+P.h); x.stroke(); txt(x,fN(n),xx,P.y+P.h+14,'#8fa6a1',10.5,'center','500'); }
  for(let T=0;T<=25;T+=5){ const yy=Math.round(Y(T))+0.5; x.beginPath(); x.moveTo(P.x,yy); x.lineTo(P.x+P.w,yy); x.stroke(); txt(x,fN(T),P.x-6,yy+4,'#8fa6a1',10.5,'right','500'); }
  lin(x,P.x,P.y+P.h+0.5,P.x+P.w,P.y+P.h+0.5,'#3d5550',1); lin(x,P.x-0.5,P.y,P.x-0.5,P.y+P.h,'#3d5550',1);
  txt(x,'velocidad n (rpm)',P.x+P.w/2,H-4,'#b4c9c4',11,'center','600');
  x.save(); x.translate(12,P.y+P.h/2); x.rotate(-Math.PI/2); txt(x,'par T (N·m)',0,0,'#b4c9c4',11,'center','600'); x.restore();
  // la curva: rama estable llena, inestable a trazos
  const tramo=(s0,s1,col,w,dash)=>{ x.strokeStyle=col; x.lineWidth=w; x.setLineDash(dash||[]); x.lineJoin='round'; x.beginPath();
    for(let i=0;i<=240;i++){ const s=s0*Math.pow(s1/s0,i/240), n=st.ns*(1-s); const px=X(n), py=Y(Tcurve(s)); if(i) x.lineTo(px,py); else x.moveTo(px,py); }
    x.stroke(); x.setLineDash([]); };
  tramo(1e-4,SM,'#4FD1C5',2.4); tramo(SM,1,'#6f8a86',2,[6,5]);
  // ns, par máximo y par de arranque
  lin(x,X(st.ns),P.y,X(st.ns),P.y+P.h,'rgba(79,209,197,.35)',1,[3,4]);
  txt(x,'ns',X(st.ns)-4,P.y+11,'#7fd6cc',11,'right','700');
  const pv=[X(st.ns*(1-SM)),Y(TMAX)]; x.fillStyle='#f4c95d'; x.beginPath(); x.arc(pv[0],pv[1],3.5,0,DOSPI); x.fill();
  { const t='par máx. '+fN(TMAX)+' N·m'; x.font='600 10.5px '+FUENTE; const wt=x.measureText(t).width;
    // si no cabe a la derecha del punto (pisaría «ns»), va a su izquierda
    if(pv[0]+7+wt>X(st.ns)-14) txt(x,t,pv[0]-7,pv[1]-6,'#f4c95d',10.5,'right','600'); else txt(x,t,pv[0]+7,pv[1]-6,'#f4c95d',10.5,'left','600'); }
  x.fillStyle='#9fb2ad'; x.beginPath(); x.arc(X(0),Y(Tcurve(1)),3,0,DOSPI); x.fill();
  txt(x,'arranque',X(0)+7,Y(Tcurve(1))+14,'#9fb2ad',10.5,'left','600');
  // la recta de la carga (par constante)
  if(STATE.TL>0){ const yl=Y(STATE.TL); lin(x,P.x,yl,P.x+P.w,yl,'#FFB703',1.8);
    txt(x,'carga TL',P.x+6,yl<P.y+24?yl+14:yl-5,'#FFB703',10.5,'left','700'); }
  // el punto de operación y el deslizamiento en el eje
  const op=[X(st.n),Y(st.T)];
  if(!st.stalled&&st.s>0.004){ const yb=P.y+P.h-7; lin(x,X(st.n),yb,X(st.ns),yb,'#e8fffb',1.4); lin(x,X(st.n),yb-4,X(st.n),yb+4,'#e8fffb',1.4); lin(x,X(st.ns),yb-4,X(st.ns),yb+4,'#e8fffb',1.4);
    txt(x,'s·ns',(X(st.n)+X(st.ns))/2,yb-6,'#e8fffb',10.5,'center','700'); }
  lin(x,op[0],op[1],op[0],P.y+P.h,'rgba(232,255,251,.35)',1,[2,3]);
  x.fillStyle=st.stalled?'rgba(255,107,107,.25)':'rgba(79,209,197,.25)'; x.beginPath(); x.arc(op[0],op[1],10,0,DOSPI); x.fill();
  x.fillStyle=st.stalled?'#ff6b6b':'#e8fffb'; x.beginPath(); x.arc(op[0],op[1],5,0,DOSPI); x.fill();
}
function pintaFasores(){
  if(!seVe(el('panel'))||document.body.classList.contains('enReto')) return;
  const x=abre(LF), W=LF.w, H=LF.h, psi=RELOJ.psi;
  const R=Math.min(H*0.40,W*0.20), cx=W-R-22, cy=H/2+2;
  const P={x:12,y:12,w:cx-R-40-12,h:H-24};
  // las ondas: el último periodo y cuarto, con el "ahora" en el borde derecho
  lin(x,P.x,P.y+P.h/2,P.x+P.w,P.y+P.h/2,'rgba(143,179,172,0.18)',1);
  for(let k=0;k<3;k++){ x.strokeStyle=COL_FASE[k]; x.lineWidth=1.8; x.beginPath();
    for(let i=0;i<=120;i++){ const a=psi-2.5*Math.PI*(1-i/120); const v=Math.cos(a-k*TERCIO); const px=P.x+P.w*i/120, py=P.y+P.h/2-v*P.h*0.42; if(i) x.lineTo(px,py); else x.moveTo(px,py); }
    x.stroke(); }
  lin(x,P.x+P.w,P.y,P.x+P.w,P.y+P.h,'rgba(255,255,255,.55)',1,[2,3]);
  txt(x,'ahora',P.x+P.w-3,P.y+9,'#cfe3df',10,'right','600');
  // la suma de los tres fasores: cada corriente empuja a lo largo de su eje
  const sc=R/1.5;
  x.strokeStyle='rgba(255,255,255,.18)'; x.setLineDash([3,4]); x.beginPath(); x.arc(cx,cy,R,0,DOSPI); x.stroke(); x.setLineDash([]);
  const iF=corrientesFase(psi); let px=cx, py=cy;
  for(let k=0;k<3;k++){ const a=k*TERCIO; lin(x,cx,cy,cx+Math.cos(a)*R*1.08,cy-Math.sin(a)*R*1.08,'rgba(143,179,172,.22)',1);
    txt(x,'abc'[k],cx+Math.cos(a)*(R*1.08+9),cy-Math.sin(a)*(R*1.08+9)+4,'#8fa6a1',10.5,'center','700'); }
  const flecha=(x0,y0,x1,y1,col,w)=>{ lin(x,x0,y0,x1,y1,col,w); const a=Math.atan2(y1-y0,x1-x0), l=Math.min(8,Math.hypot(x1-x0,y1-y0)*0.5);
    x.fillStyle=col; x.beginPath(); x.moveTo(x1,y1); x.lineTo(x1-l*Math.cos(a-0.4),y1-l*Math.sin(a-0.4)); x.lineTo(x1-l*Math.cos(a+0.4),y1-l*Math.sin(a+0.4)); x.closePath(); x.fill(); };
  for(let k=0;k<3;k++){ const a=k*TERCIO, nx=px+Math.cos(a)*iF[k]*sc, ny=py-Math.sin(a)*iF[k]*sc; flecha(px,py,nx,ny,COL_FASE[k],2); px=nx; py=ny; }
  flecha(cx,cy,px,py,'#ffffff',2.6);
  txt(x,'|suma| = 1,5 × Im',cx-R-6,H-6,'#e8fffb',11,'left','700');
}
function pintaReto(){
  const box=el('dkReto'); if(!box) return;
  const R=RETO, dec=R.kind==='s'?4:0;
  const fila=(a,b,c)=>`<div class="pl-f${c?' '+c:''}"><span>${a}</span><b>${b}</b></div>`;
  let filas=fila('Frecuencia',fN(R.f)+' Hz')+fila('Polos',String(R.p));
  if(R.kind!=='ns') filas+=fila('Velocidad síncrona',fN(R.ns)+' rpm');
  if(R.kind==='s') filas+=fila('Tacómetro: n',fN(R.nMeasured)+' rpm','tac');
  if(R.kind==='n') filas+=fila('Deslizamiento nominal',fN(R.s0,3));
  const q=R.kind==='ns'?'¿Cuál es la velocidad síncrona ns (rpm)?':(R.kind==='s'?'¿Cuál es el deslizamiento s (como fracción, ej. 0.05)?':'¿Cuál es la velocidad n (rpm)?');
  box.innerHTML=`<div class="placa"><div class="pl-t"><span>Placa de datos</span><span>3~ · jaula</span></div>${filas}</div>
    <div class="pl-q">${q}</div>
    ${retoSolved?`<div class="pl-ok">✔ Correcto: ${tf(R.target,dec)}</div>`:`<div class="pl-h">ns = 120·f/p · s = (ns − n)/ns<br>Intentos fallidos: ${intentos}/3</div>`}`;
}

/* ===================== 12. TELEMETRÍA ===================== */
function updateTele(){
  const st=motorState(STATE.f,STATE.p,STATE.TL);
  el('t_f').textContent=`${fN(STATE.f)} Hz`;
  el('t_p').textContent=`${STATE.p} polos`;
  el('t_tl').textContent=`${fN(STATE.TL,1)} N·m`;
  el('t_ns').innerHTML=`${fN(st.ns)} <small>rpm</small>`;
  el('t_n').innerHTML=`${fN(st.n)} <small>rpm</small>`; el('t_n').className=st.stalled?'bad':'';
  el('t_s').innerHTML=st.stalled?'1 <small>calado</small>':`${fN(st.s,4)} <small class="pct">${fN(st.s*100,1)} %</small>`; el('t_s').className=st.stalled?'bad':'';
  el('t_t').innerHTML=`${fN(st.T,2)} <small>N·m</small>`;
  el('t_f2').innerHTML=`${fN((st.stalled?1:st.s)*STATE.f,2)} <small>Hz</small>`;
  el('t_pmech').innerHTML=`${fN(st.Pmech)} <small>W</small>`;
  el('dkSub').textContent=`${fN(STATE.f)} Hz · ${STATE.p} polos · TL ${fN(STATE.TL,1)} N·m`;
  const av=el('dkAviso');
  if(st.stalled){ av.className='dk-aviso on mal'; av.textContent=`⚠ TL supera el par máximo (${fN(TMAX)} N·m): no hay cruce estable y el motor se cala. Rotor parado (s = 1): sus barras llevan la corriente de rotor bloqueado, a f₂ = f.`; }
  else if(STATE.TL>Tcurve(1)){ av.className='dk-aviso on ojo'; av.textContent=`TL supera el par de arranque (${fN(Tcurve(1),2)} N·m): parado no arrancaría. El punto es el de un motor que ya giraba.`; }
  else { av.className='dk-aviso'; av.textContent=''; }
}
function refreshAll(){ ajustaCamaraLenta(); updateTele(); pintaVivo(); if(mode==='operacion'||mode==='curva') pintaCurva(); if(mode==='reto') drawReto(); pintaBarras(); }

/* ===================== 13. MÁQUINA DE MODOS ===================== */
const MODE_META={
  ensamble:{nombre:'Ensamble'},
  operacion:{nombre:'Operación'},
  curva:{nombre:'Curva par–velocidad'},
  reto:{nombre:'Reto'},
};
const modes=['ensamble','operacion','curva','reto'];
let mode='ensamble';
function setMode(k){
  if(k!=='ensamble' && !simUnlocked){ showToast('<span style="color:var(--bad)">🔒 Termina el ensamble primero.</span>'); synth.beep(220,0.08,0.05); return; }
  const antes=mode; mode=k;
  modes.forEach(m=>{ const b=el('m_'+m); if(b) b.classList.toggle('on',m===k); });
  el('p_mode').textContent=MODE_META[k].nombre;
  el('secEnsamble').style.display=k==='ensamble'?'':'none';
  el('secParam').style.display=(k==='operacion'||k==='curva')?'':'none';
  el('secReto').style.display=k==='reto'?'':'none';
  el('hudIntro').textContent=INTRO[k];
  document.body.classList.toggle('enEnsamble',k==='ensamble');
  document.body.classList.toggle('enReto',k==='reto');
  // la máquina se abre en corte al salir del ensamble y se cierra al volver
  ponCorte(k!=='ensamble');
  if(k==='ensamble') ponVista('banco');
  else if(antes==='ensamble'){ RELOJ.esc=0; ponVista(k==='curva'?'frente':'34'); }
  else pintaBarras();
  if(k==='reto' && !RETO.active) newChallenge();
  pintaRotulos();
  refreshAll();
  requestAnimationFrame(()=>{ colocaBarras(); if(k==='operacion'||k==='curva'){ pintaCurva(); pintaFasores(); } });
}
function syncCtrlbar(){ modes.forEach(m=>{ const b=el('m_'+m); if(b && m!=='ensamble') b.disabled=!simUnlocked; }); }

/* ---------- reto numérico (criterio intacto) ---------- */
const F_SET=[50,60], P_SET=[2,4,6,8], S0_SET=[0.02,0.03,0.045,0.06,0.08,0.10,0.13,0.16], KIND_SET=['ns','s','n'];
let RETO={active:false, f:60, p:4, ns:1800, kind:'ns', s0:null, nMeasured:null, target:1800};
let retoSolved=false, intentos=0;
function newChallenge(){
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const f=pick(F_SET), p=pick(P_SET), ns=120*f/p;
  const kind=pick(KIND_SET);
  let s0=null, nMeasured=null, target;
  if(kind==='ns'){ target=ns; }
  else if(kind==='s'){ s0=pick(S0_SET); nMeasured=ns*(1-s0); target=s0; }
  else { s0=pick(S0_SET); target=ns*(1-s0); }
  RETO={active:true,f,p,ns,kind,s0,nMeasured,target};
  retoSolved=false; intentos=0;
  const inp=el('retoInput'); if(inp) inp.value='';
  drawReto();
  showToast('🎲 Nuevo reto generado.');
  synth.beep(520,0.08,0.05);
}
function retoTol(){
  // La tolerancia debe rechazar la respuesta ingenua: en «n» contestar ns (olvidar el deslizamiento) difiere de n
  // en s0·ns ≥ 15 rpm (con s0=0,02 y p=8, 50 Hz), así que la banda no puede pasar de ~±2 rpm (0,3 %).
  // En «s» el tacómetro se muestra redondeado a rpm (error de s hasta ±0,5/ns ≈ 7·10⁻⁴), de ahí el piso de 0,0015.
  if(RETO.kind==='ns') return 1;
  if(RETO.kind==='s') return Math.max(0.0015,0.04*RETO.target);
  return Math.max(0.003*RETO.target,2);
}
function checkReto(){
  const inp=el('retoInput'); if(!inp) return;
  if(retoSolved) return;
  const v=parseFloat(inp.value);
  if(Number.isNaN(v)){ showToast('<span style="color:var(--bad)">Escribe un número.</span>'); return; }
  const ok=Math.abs(v-RETO.target)<=retoTol();
  retoSolved=ok;
  const dec=RETO.kind==='s'?4:0;
  if(ok){ showToast(`<span style="color:var(--good)">✔ Correcto: ${tf(RETO.target,dec)}</span>`); synth.beep(1046,0.12,0.06); drawReto(); return; }
  intentos++; synth.beep(180,0.14,0.06);
  if(intentos>=3){ newChallenge(); showToast('<span style="color:var(--bad)">✗ Tres intentos fallidos: te dejo un reto NUEVO. Repasa las dos fórmulas antes de calcular.</span>'); return; }
  // retroalimentación cualitativa: ni la respuesta ni el sentido del error
  const pista = RETO.kind==='ns' ? 'Revisa de dónde sale ns y las unidades (rpm).'
    : RETO.kind==='s' ? 'Recuerda que s es una fracción de ns, no una diferencia de rpm.'
    : 'Recuerda que el rotor siempre gira por debajo de la velocidad síncrona: ¿qué te dice s sobre cuánto?';
  showToast(`<span style="color:var(--bad)">✗ No es correcto (intento ${intentos}/3). ${pista}</span>`);
  drawReto();
}
/* El escenario va a la placa del dock y, en texto, a #retoText (lectores de
   pantalla y pruebas). La escena nunca enseña el escenario del reto. */
function drawReto(){
  let dataLine, qLine;
  if(RETO.kind==='ns'){
    dataLine=`Datos de placa: f = ${tf(RETO.f,0)} Hz   ·   p = ${RETO.p} polos`;
    qLine='¿Cuál es la velocidad síncrona ns (rpm)?';
  } else if(RETO.kind==='s'){
    dataLine=`f = ${tf(RETO.f,0)} Hz · p = ${RETO.p} polos (ns=${tf(RETO.ns,0)} rpm)   ·   Tacómetro: n = ${tf(RETO.nMeasured,0)} rpm`;
    qLine='¿Cuál es el deslizamiento s (como fracción, ej. 0.05)?';
  } else {
    dataLine=`f = ${tf(RETO.f,0)} Hz · p = ${RETO.p} polos (ns=${tf(RETO.ns,0)} rpm)   ·   Deslizamiento nominal de placa: s = ${tf(RETO.s0,3)}`;
    qLine='¿Cuál es la velocidad n (rpm)?';
  }
  const dec=RETO.kind==='s'?4:0;
  const rt=el('retoText');
  if(rt) rt.textContent=dataLine+' — '+qLine+(retoSolved?` ✔ Correcto: ${tf(RETO.target,dec)}`:` (intentos fallidos: ${intentos}/3)`);
  pintaReto();
}

/* ---------- demos guiados ---------- */
const sleep=ms=>new Promise(res=>setTimeout(res,ms));
let autoRunning=false;
async function autoAssemble(){
  if(autoRunning) return; autoRunning=true; const btn=el('btnAuto'); if(btn) btn.disabled=true;
  for(const id of ORDER){ if(placed[id]) continue; selectPart(id); await sleep(REDUCIDO?150:600); placePart(id); await sleep(REDUCIDO?650:1950); }   // cada pieza asienta antes de que salga la siguiente
  if(btn) btn.disabled=false; autoRunning=false;
}
async function autoSweep(){
  if(autoRunning) return; autoRunning=true; const btn=el('btnAuto2'); if(btn) btn.disabled=true;
  const prev={...STATE};   // demostración: al terminar se devuelven los controles al alumno
  const seq=[[60,4,0],[60,4,10],[60,4,20],[60,4,23],[60,8,10],[50,4,10]];
  const pon=(f,p,TL)=>{ STATE.f=f; STATE.TL=TL; if(p!==STATE.p){ STATE.p=p; cambiaPolos(); }
    el('sl_f').value=f; el('sl_p').value=p; el('sl_tl').value=TL; refreshAll(); };
  for(const [f,p,TL] of seq){ pon(f,p,TL); await sleep(1700); }
  pon(prev.f,prev.p,prev.TL);
  if(btn) btn.disabled=false; autoRunning=false;
}

/* ---------- wiring ---------- */
modes.forEach(m=>{ const b=el('m_'+m); if(b) b.onclick=()=>{
  if(mode==='reto'&&!retoSolved&&m!=='reto'){
    showToast('<span style="color:var(--bad)">🔒 Resuelve el reto (calcula el valor pedido a partir de f, p y los datos dados) antes de salir a otro modo — en Operación/Curva podrías reproducir estos mismos f/p y leer la respuesta en la telemetría.</span>');
    synth.beep(220,0.1,0.05);
    return;
  }
  setMode(m);
}; });
el('btnReset').onclick=()=>initAssembly();
el('btnAuto').onclick=()=>autoAssemble();
el('btnAuto2').onclick=()=>autoSweep();
el('btnCheck').onclick=()=>checkReto();
el('btnNew').onclick=()=>newChallenge();
el('sl_f').oninput=e=>{ STATE.f=+e.target.value; refreshAll(); };
el('sl_p').oninput=e=>{ const p=+e.target.value; if(p!==STATE.p){ STATE.p=p; cambiaPolos(); } refreshAll(); };
el('sl_tl').oninput=e=>{ STATE.TL=+e.target.value; refreshAll(); };
const soundBtn=document.getElementById('soundBtn');
soundBtn.onclick=()=>{const on=synth.toggle();soundBtn.textContent=on?'🔊':'🔇';soundBtn.classList.toggle('on',on);};
window.addEventListener('resize',()=>{ colocaBarras(); clearTimeout(window.__rzInd);
  window.__rzInd=setTimeout(()=>{ ponVista(VISTA.actual,0.01); if(mode==='operacion'||mode==='curva'){ pintaCurva(); pintaFasores(); } },140); });

/* ---------- arranque ---------- */
aplicaCalidad();
initAssembly();
syncCtrlbar();
setMode('ensamble');
ponVista('banco',0.001);
S.start();

window.__labDebug={
  state:()=>({...STATE}),
  motor:()=>motorState(STATE.f,STATE.p,STATE.TL),
  mode:()=>mode,
  progress:()=>({placed:{...placed},progress,simUnlocked}),
  reto:()=>({...RETO,solved:retoSolved,intentos}),
  solved:()=>retoSolved, intentos:()=>intentos, checkReto, newChallenge, retoTol,
  // la escena, para las pruebas de coherencia con la curva (mismo reloj)
  escena:()=>({psi:RELOJ.psi,thR:RELOJ.thR,N:RELOJ.N,estrobo:RELOJ.estrobo,pausa:RELOJ.pausa,esc:RELOJ.esc,P:STATE.p/2,
    gam:DV.gam,corte:CORTE.x,campo:CAMPO.u.uAlfa.value,vista:VISTA.actual,calidad:CAL.nivel}),
  vista:v=>{ if(v) ponVista(v,0.01); return VISTA.actual; },
  reloj:o=>{ if(o) Object.assign(RELOJ,o); pintaBarras(); return {...RELOJ}; },
  elige:id=>selectPart(id), coloca:id=>placePart(id),
  vuelos:()=>tweens.map(w=>({id:(w.obj&&w.obj.userData&&w.obj.userData.id)||null,t:+w.t.toFixed(3)})),
  camara:()=>({pos:S.camera.position.toArray().map(v=>+v.toFixed(3)),mira:S.controls.target.toArray().map(v=>+v.toFixed(3)),
    hueco:huecoLibre(),meta:vistaCam(VISTA.actual)}),
};
