import {shaftJoint} from './_elementos-uniones-eje.js';
export {shaftJoint,hubField} from './_elementos-uniones-eje.js';
import {fourBarModel} from './_elementos-cuatro-barras.js';
export {fourBar,fourBarModel,pathMetrics} from './_elementos-cuatro-barras.js';
import {bandBrake} from './_elementos-freno.js';
export {bandBrake} from './_elementos-freno.js';
import {spring} from './_elementos-resorte.js';
export {spring} from './_elementos-resorte.js';
// SI. Junta axial concéntrica: dos resortes lineales, contacto unilateral.
import {hydrodynamic} from './_elementos-hidrodinamica.js';
import {rollingBearing} from './_elementos-rodamientos.js';
export {rollingBearing} from './_elementos-rodamientos.js';
export {hydrodynamic,bearingPressure,bearingFromEccentricity,shortBearingLoad,meanFlowTrace} from './_elementos-hidrodinamica.js';
export const defaults={261:{preload:12,load:30},262:{load:10,eccentricity:180},263:{beta:35,width:20},264:{fixed:3,speed:960},265:{viscosity:20,speed:1200},266:{bearing:1,radial:1400},267:{wire:2,coil:30},268:{friction:.18,arm:10},269:{coupler:144,rocker:94},270:{length:28,interference:12}};
export const solutions={261:{preload:24,load:25},262:{load:8,eccentricity:120},263:{beta:23,width:26},264:{fixed:2,speed:960},265:{viscosity:45,speed:1500},266:{bearing:2,radial:1100},267:{wire:2.4,coil:32},268:{friction:.27,arm:13},269:{coupler:132,rocker:104},270:{length:48,interference:18}};
export function bolted(p,external=p.load*1000){
 const kb=200e6,kj=800e6,C=kb/(kb+kj),Fi=p.preload*1000,separation=Fi/(1-C),P=external;
 const closed=P<=separation,Fb=closed?Fi+C*P:P,Fc=closed?Fi-(1-C)*P:0,gap=closed?0:(P-separation)/kb;
 const extension=(Fb-Fi)/kb,compression=Fc/kj;
 return {kb,kj,C,Fi,P,separation,Fb,Fc,gap,extension,compression,torque:.2*.012*Fi,stress:Fb/84.3e-6,closed};
}
export function eccentric(p){
 const F=p.load*1000,e=p.eccentricity/1000,M=-F*e,a=.004,L=.12,x=.04,y=.06,d=.008;
 const Jline=2*L*x*x+L**3/6,Jpoints=4*(x*x+y*y),area=Math.PI*d*d/4;
 const points=[[-x,-y],[-x,y],[x,-y],[x,y]];
 const rivets=points.map(([x,y])=>({x,y,fx:-M*y/Jpoints,fy:-F/4+M*x/Jpoints}));
 const weldAt=(x,y)=>({x,y,tx:-M*y/(a*Jline),ty:-F/(2*a*L)+M*x/(a*Jline)});
 const welds=points.map(([x,y])=>weldAt(x,y)),weldPeak=Math.max(...welds.map(q=>Math.hypot(q.tx,q.ty))),rivetPeak=Math.max(...rivets.map(q=>Math.hypot(q.fx,q.fy)/area));
 return {F,e,M,a,L,Jline,Jpoints,area,rivets,welds,weldPeak,rivetPeak,utilization:Math.max(weldPeak/60e6,rivetPeak/100e6)};
}
export function model(id,t,p){
 if(id===270)return shaftJoint(p,t);
 if(id===269)return fourBarModel(p,t);
 if(id===268)return bandBrake(p,t);
 if(id===267)return spring(p,t);
 if(id===266)return rollingBearing(p,t);
 if(id===265){const q=hydrodynamic(p);return {...q,thetaShaft:q.omega*t/200,phase:t,duration:8,signal:q.minFilm*1e6,reference:12,warning:q.lambda<3?'Película insuficiente para la separación objetivo: no se modela contacto de asperezas.':''};}
 if(id===264)return planetary(p,t);
 if(id===263){const q=helical(p),theta1=2*Math.PI*t/10,theta2=Math.PI+Math.PI/q.z2-theta1*q.z1/q.z2;return {...q,theta1,theta2,contacts:helicalContacts(q,theta1),phase:t,duration:8,signal:q.Fa,reference:q.Ft};}
 if(id===262){const q=eccentric(p),live=eccentric({...p,load:p.load*(.75-.25*Math.cos(2*Math.PI*t/8))});return {...q,live,phase:t,duration:8,signal:live.weldPeak/1e6,reference:live.rivetPeak/1e6};}
 if(id!==261)throw Error('Elemento desconocido '+id);
 const q=bolted(p),fraction=.5+.5*(.5-.5*Math.cos(2*Math.PI*t/8)),live=bolted(p,q.P*fraction);
 return {...q,live,phase:t,duration:8,signal:live.Fb/1000,reference:live.Fc/1000};
}
export function criteria(id,p){if(id===270){const q=shaftJoint(p),checks=[{name:"Reserva de chaveta",value:q.Tkey/250,unit:"",ok:q.Tkey>=375},{name:"Reserva de estriado",value:q.Tspline/250,unit:"",ok:q.Tspline>=375},{name:"Reserva de interferencia",value:q.Tfit/250,unit:"",ok:q.Tfit>=375},{name:"Presión máxima",value:q.pressure/1e6,unit:"MPa",ok:q.pressure<=45e6},{name:"Longitud disponible",value:q.L*1000,unit:"mm",ok:q.L<=.05}];return {checks,ok:checks.every(c=>c.ok)};}if(id===269){const q=fourBarModel(p),checks=[{name:"Error RMS",value:q.rms*1000,unit:"mm",ok:q.rms<=.002},{name:"Error máximo",value:q.maxError*1000,unit:"mm",ok:q.maxError<=.003},{name:"Transmisión mínima",value:q.minAngle,unit:"°",ok:q.minAngle>=45}];return {checks,ok:checks.every(c=>c.ok)};}if(id===268){const q=bandBrake(p),checks=[{name:"Par mínimo",value:q.torque,unit:"N·m",ok:q.torque>=300},{name:"Par máximo",value:q.torque,unit:"N·m",ok:q.torque<=400},{name:"Tensión de banda",value:q.T1,unit:"N",ok:q.T1<=2800},{name:"Tiempo de parada",value:q.stopTime,unit:"s",ok:q.stopTime<=3}];return {checks,ok:checks.every(c=>c.ok)};}if(id===267){const q=spring(p),checks=[{name:"Frecuencia mínima",value:q.fn,unit:"Hz",ok:q.fn>=3},{name:"Frecuencia máxima",value:q.fn,unit:"Hz",ok:q.fn<=3.6},{name:"Compresión mínima",value:q.deflection*1000,unit:"mm",ok:q.deflection>=.018},{name:"Compresión máxima",value:q.deflection*1000,unit:"mm",ok:q.deflection<=.028},{name:"Cortante pico",value:q.stress/1e6,unit:"MPa",ok:q.stress<=220e6},{name:"Diámetro exterior",value:(q.D+q.d)*1000,unit:"mm",ok:q.D+q.d<=.036}];return {checks,ok:checks.every(c=>c.ok)};}if(id===266){const q=rollingBearing(p),checks=[{name:"Vida nominal L10h",value:q.L10h,unit:"h",ok:q.L10h>=15000},{name:"Carga radial útil",value:q.Fr,unit:"N",ok:q.Fr>=1000},{name:"Diámetro disponible",value:q.D*1000,unit:"mm",ok:q.D<=.055},{name:"Ancho disponible",value:q.B*1000,unit:"mm",ok:q.B<=.016}];return {checks,ok:checks.every(c=>c.ok)};}if(id===265){const q=hydrodynamic(p),checks=[{name:'Película mínima',value:q.minFilm*1e6,unit:'µm',ok:q.minFilm>=12e-6},{name:'Potencia viscosa',value:q.power,unit:'W',ok:q.power<=90},{name:'Régimen útil',value:p.speed,unit:'rpm',ok:p.speed>=1200},{name:'Viscosidad limitada',value:p.viscosity,unit:'mPa·s',ok:p.viscosity<=55}];return {checks,ok:checks.every(c=>c.ok)};}if(id===264){const q=planetary(p),checks=[{name:'Salida del portaplanetas',value:q.carrier,unit:'rpm',ok:q.carrier>=200&&q.carrier<=260},{name:'Entrada mínima',value:p.speed,unit:'rpm',ok:p.speed>=900},{name:'Entrada máxima',value:p.speed,unit:'rpm',ok:p.speed<=1000}];return {checks,ok:checks.every(c=>c.ok)};}if(id===263){const q=helical(p),checks=[{name:'Recubrimiento total',value:q.total,unit:'',ok:q.total>=2.5},{name:'Empuje axial',value:q.Fa,unit:'N',ok:q.Fa<=350},{name:'Ancho disponible',value:p.width,unit:'mm',ok:p.width<=28},{name:'Ancho mínimo',value:p.width,unit:'mm',ok:p.width>=16}];return {checks,ok:checks.every(c=>c.ok)};}if(id===262){const q=eccentric(p),checks=[{name:'Cortante en soldadura',value:q.weldPeak/1e6,unit:'MPa',ok:q.weldPeak<=60e6},{name:'Cortante en remache',value:q.rivetPeak/1e6,unit:'MPa',ok:q.rivetPeak<=100e6},{name:'Carga útil',value:p.load,unit:'kN',ok:p.load>=7},{name:'Alcance requerido',value:p.eccentricity,unit:'mm',ok:p.eccentricity>=100}];return {checks,ok:checks.every(c=>c.ok)};}const q=bolted(p),checks=[
 {name:'Compresión residual',value:q.Fc/1000,unit:'kN',ok:q.Fc>=3000},
 {name:'Tracción del tornillo',value:q.Fb/1000,unit:'kN',ok:q.Fb<=34000},
 {name:'Carga de servicio',value:q.P/1000,unit:'kN',ok:q.P>=24000},
 {name:'Precarga limitada',value:q.Fi/1000,unit:'kN',ok:q.Fi<=28000},
 ];return {checks,ok:checks.every(q=>q.ok)};}
export function helical(p,z1=24,z2=48,mn=.003,T=30){
 const beta=p.beta*Math.PI/180,b=p.width/1000,alphaN=20*Math.PI/180,alphaT=Math.atan(Math.tan(alphaN)/Math.cos(beta)),mt=mn/Math.cos(beta),R1=mt*z1/2,R2=mt*z2/2,ra1=R1+mn,ra2=R2+mn,rb1=R1*Math.cos(alphaT),rb2=R2*Math.cos(alphaT),root1=R1-1.25*mn,root2=R2-1.25*mn,center=R1+R2,pb=Math.PI*mt*Math.cos(alphaT),approach=Math.sqrt(ra2*ra2-rb2*rb2)-R2*Math.sin(alphaT),recess=Math.sqrt(ra1*ra1-rb1*rb1)-R1*Math.sin(alphaT),transverse=(approach+recess)/pb,overlap=b*Math.sin(beta)/(Math.PI*mn),Ft=T/R1,Fa=Ft*Math.tan(beta),Fr=Ft*Math.tan(alphaT),Fn=Math.hypot(Ft,Fa,Fr);
 return {z1,z2,mn,T,beta,b,alphaN,alphaT,mt,R1,R2,ra1,ra2,rb1,rb2,root1,root2,center,pb,approach,recess,transverse,overlap,total:transverse+overlap,Ft,Fa,Fr,Fn,power:T*20*Math.PI};
}
// Nominal involute contact lines in the plane of action, clipped by face width
// and by the two addendum circles. One common physical clock drives both gears.
export function helicalContacts(q,theta){
 const slope=Math.tan(q.beta)*Math.cos(q.alphaT),offset=q.rb1*(theta+Math.PI/(2*q.z1)),lines=[];
 const low=offset-q.b*slope/2,high=offset+q.b*slope/2;
 for(let k=Math.ceil((low-q.recess)/q.pb);k<=Math.floor((high+q.approach)/q.pb);k++){
  const start=Math.max(-q.b/2,(-q.approach-offset+k*q.pb)/slope),end=Math.min(q.b/2,(q.recess-offset+k*q.pb)/slope);
  if(end-start>1e-12){const point=z=>{const s=offset+z*slope-k*q.pb;return [q.R1+s*Math.sin(q.alphaT),s*Math.cos(q.alphaT),z];};lines.push({k,start:point(start),end:point(end)});}
 }return lines;
}
export function planetary(p,t=0){
 const zs=24,zp=24,zr=72,module=.003,orbit=module*(zs+zp)/2,Rs=zs*module/2,Rp=zp*module/2,Rr=zr*module/2;
 let sun,ring,carrier;if(p.fixed===1){carrier=0;sun=p.speed;ring=-zs/zr*sun;}else if(p.fixed===2){ring=0;sun=p.speed;carrier=zs/(zs+zr)*sun;}else if(p.fixed===3){sun=0;ring=p.speed;carrier=zr/(zs+zr)*ring;}else throw Error('Miembro fijo inválido');
 const planet=carrier-zs/zp*(sun-carrier),scale=2*Math.PI*t/(60*100),thetaSun=sun*scale,thetaRing=ring*scale,thetaCarrier=carrier*scale,thetaPlanet=planet*scale;
 const planets=Array.from({length:3},(_,i)=>{const phi=i*2*Math.PI/3,angle=thetaCarrier+phi;return {x:orbit*Math.cos(angle),y:orbit*Math.sin(angle),angle:thetaPlanet+(zs+zp)/zp*phi+Math.PI/zp};});
 return {zs,zp,zr,module,orbit,Rs,Rp,Rr,sun,ring,carrier,planet,thetaSun,thetaRing,thetaCarrier,thetaPlanet,planets,duration:8,phase:t,signal:carrier,reference:sun};
}
