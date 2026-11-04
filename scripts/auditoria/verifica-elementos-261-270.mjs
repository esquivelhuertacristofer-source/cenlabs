import assert from 'node:assert/strict';
import {bolted,eccentric,helical,helicalContacts,planetary,hydrodynamic,bearingPressure,bearingFromEccentricity,meanFlowTrace,criteria,solutions} from '../../public/labs/_elementos-modelos.js';
import {gearSection,toothHalfWidth,internalHalfWidth} from '../../public/labs/_elementos-geometria.js';
export {solutions};let checks=0;
const near=(x,y,tol=1e-9)=>{assert(Math.abs(x-y)<=tol*Math.max(1,Math.abs(y)),`${x} ≠ ${y}`);checks++;};
const q=bolted({preload:24,load:25});near(q.Fb,29000);near(q.Fc,4000);near(q.separation,30000);near(q.torque,57.6);near(q.extension,25e-6);near(q.gap,0);
const open=bolted({preload:12,load:30});near(open.Fb,30000);near(open.Fc,0);near(open.gap,75e-6);
for(let Fi=8;Fi<=36;Fi++)for(let P=10;P<=45;P++){
 const p={preload:Fi,load:P},m=bolted(p);near(m.Fb-m.Fc,P*1000);assert(m.Fc>=0&&m.gap>=0);checks++;
 // Absolute lengths from independent compatibility, including the initial preload.
 const boltRest=.04-Fi*1000*(1/m.kb+1/m.kj),boltLength=boltRest+m.Fb/m.kb,plates=.04-m.Fc/m.kj;
 near(boltLength-plates,m.gap);near(m.Fc*m.gap,0);near(m.extension,(m.Fb-Fi*1000)/m.kb);
 if(m.closed)near(m.extension,(Fi*1000-m.Fc)/m.kj);
 const a=bolted(p,m.separation-1e-4),b=bolted(p,m.separation+1e-4);near(a.Fb,b.Fb,2e-8);assert(a.closed&&!b.closed);checks++;
}
assert(criteria(261,solutions[261]).ok);checks++;assert(!criteria(261,{preload:12,load:30}).ok);checks++;
console.log('Elementos261: '+checks+' comprobaciones correctas.');
const before=checks,r=eccentric({load:8,eccentricity:120});near(r.M,-960);near(r.Jpoints,.0208);near(r.Jline,.000672);near(r.rivets[2].fx,-36000/13);near(r.rivets[2].fy,-50000/13);near(r.welds[2].tx,-150e6/7);near(r.welds[2].ty,-475e6/21);
for(const load of [2,4,8,12])for(const eccentricity of [60,100,120,200]){
 const q=eccentric({load,eccentricity});near(q.rivets.reduce((s,r)=>s+r.fx,0),0);near(q.rivets.reduce((s,r)=>s+r.fy,0),-q.F);near(q.rivets.reduce((s,r)=>s+r.x*r.fy-r.y*r.fx,0),q.M);
 // Independent midpoint quadrature of the two continuous weld lines.
 let fx=0,fy=0,moment=0;const n=2000,dy=.12/n;
 for(const x of [-.04,.04])for(let i=0;i<n;i++){const y=-.06+(i+.5)*dy,tx=-q.M*y/(.004*.000672),ty=-q.F/(.004*.24)+q.M*x/(.004*.000672);fx+=tx*.004*dy;fy+=ty*.004*dy;moment+=(x*ty-y*tx)*.004*dy;}
 near(fx,0);near(fy,-q.F);near(moment,q.M,2e-7);
 const half=eccentric({load:load/2,eccentricity});near(q.weldPeak,2*half.weldPeak);near(q.rivetPeak,2*half.rivetPeak);near(q.utilization,2*half.utilization);
}
assert(criteria(262,solutions[262]).ok);checks++;assert(!criteria(262,{load:10,eccentricity:180}).ok);checks++;
console.log('Elementos262: '+(checks-before)+' comprobaciones correctas; total '+checks+'.');
const beforeGear=checks,reference=helical({beta:15,width:20},20,40,.002);
near(reference.transverse,1.561,.0005);near(reference.overlap,.824,.0005);near(reference.total,2.385,.0005);
const wrap=(angle,z)=>angle-Math.round(angle*z/(2*Math.PI))*2*Math.PI/z;
for(const beta of [10,15,23,35])for(const width of [10,26,40]){
 const q=helical({beta,width});near(q.Ft*q.R1,30);near(q.Fa,30*Math.sin(q.beta)/(.003*12));near(q.Fr,30*Math.tan(20*Math.PI/180)/(.003*12));near(q.Fn*q.Fn,q.Ft*q.Ft+q.Fa*q.Fa+q.Fr*q.Fr);
 let contacts=0;
 for(let j=0;j<1200;j++){const theta=j*2*Math.PI/(q.z1*1200),lines=helicalContacts(q,theta);contacts+=lines.length;
  for(const line of lines)for(const [x,y,z]of [line.start,line.end]){
   assert(Math.abs(z)<=q.b/2+1e-12);checks++;
   for(const index of [1,2]){const X=x-(index===2?q.center:0),r=Math.hypot(X,y),phase=(index===1?theta:Math.PI+Math.PI/q.z2-theta*q.z1/q.z2)+(index===1?1:-1)*z*Math.tan(q.beta)/q['R'+index];near(Math.abs(wrap(Math.atan2(y,X)-phase,q['z'+index])),toothHalfWidth(q,index,r,0),1e-8);assert(r<=q['ra'+index]+1e-12);checks++;}
  }
 }near(contacts/1200,q.total,.001);
 // Independent occupancy check: sampled swept tooth vertices never enter the
 // opposite involute solid, across helix angle, depth and rotation phase.
 const outline=gearSection(q,1);
 for(const z of [-q.b/2,0,q.b/2])for(let phase=0;phase<12;phase++){
  const theta=phase*2*Math.PI/(q.z1*12),a1=theta+z*Math.tan(q.beta)/q.R1,a2=Math.PI+Math.PI/q.z2-theta*q.z1/q.z2-z*Math.tan(q.beta)/q.R2;
  for(const [x,y]of outline){const X=x*Math.cos(a1)-y*Math.sin(a1)-q.center,Y=x*Math.sin(a1)+y*Math.cos(a1),r=Math.hypot(X,Y);if(r>=q.ra2-1e-10)continue;const delta=Math.abs(wrap(Math.atan2(Y,X)-a2,q.z2));assert(r>=q.root2-1e-9&&delta>=toothHalfWidth(q,2,r)-1e-8,'Sin penetración de dientes');checks++;}
 }
}
assert(criteria(263,solutions[263]).ok);checks++;assert(!criteria(263,{beta:35,width:12}).ok);checks++;
console.log('Elementos263: '+(checks-beforeGear)+' comprobaciones correctas; total '+checks+'.');
const beforePlanet=checks,spur=helical({beta:0,width:24},24,24),outlinePlanet=gearSection(spur,1),qReference=planetary({fixed:2,speed:960});near(qReference.carrier,240);near(qReference.planet,-480);near(qReference.Rr,qReference.Rs+2*qReference.Rp);near((qReference.zs+qReference.zr)/3,32);
for(const fixed of [1,2,3])for(const speed of [200,960,1600])for(let j=0;j<36;j++){
 const q=planetary({fixed,speed},j/7);near(q.zs*q.sun+q.zr*q.ring,(q.zs+q.zr)*q.carrier);near(q.orbit*q.carrier-q.Rp*q.planet,q.Rs*q.sun);near(q.orbit*q.carrier+q.Rp*q.planet,q.Rr*q.ring);near([q.carrier,q.ring,q.sun][fixed-1],0);
 for(const p of q.planets){near(Math.hypot(p.x,p.y),q.orbit);const phi=Math.atan2(p.y,p.x),a=q.zs*q.thetaSun+q.zp*p.angle-(q.zs+q.zp)*phi,b=q.zr*q.thetaRing-q.zp*p.angle-(q.zr-q.zp)*phi;near(Math.cos(a),-1);near(Math.sin(a),0);near(Math.cos(b),-1);near(Math.sin(b),0);
  for(const [x,y]of outlinePlanet){const X=p.x+x*Math.cos(p.angle)-y*Math.sin(p.angle),Y=p.y+x*Math.sin(p.angle)+y*Math.cos(p.angle),r=Math.hypot(X,Y),delta=Math.abs(wrap(Math.atan2(Y,X)-q.thetaRing,q.zr));assert(r<q.Rr-q.module+1e-9||(r<q.Rr+1.25*q.module&&delta>=internalHalfWidth(r,q.zr,q.module)-1e-8),'Planeta sin penetrar corona');checks++;
   if(r<spur.ra1){const ds=Math.abs(wrap(Math.atan2(Y,X)-q.thetaSun,q.zs));assert(r>=spur.root1&&ds>=toothHalfWidth(spur,1,r)-1e-8,'Planeta sin penetrar sol');checks++;}
  }
 }
}
assert(criteria(264,solutions[264]).ok);checks++;assert(!criteria(264,{fixed:3,speed:960}).ok);checks++;
console.log('Elementos264: '+(checks-beforePlanet)+' comprobaciones correctas; total '+checks+'.');
const beforeBearing=checks,concentric=bearingFromEccentricity(0,.03,100);near(concentric.frictionForce,1.5*Math.PI);near(concentric.power,3.75*Math.PI);near(concentric.minFilm,50e-6);assert.equal(concentric.frictionCoefficient,null);checks++;
for(const viscosity of [10,20,45,65])for(const speed of [600,1500,3000]){
 const q=hydrodynamic({viscosity,speed});near(q.load,2000);near(q.minFilm,q.c*(1-q.e));near(Math.hypot(q.centerX,q.centerY),q.e*q.c);
 // Simpson quadrature on the actual pressure field, not the closed load law.
 let wx=0,wy=0;const nt=4096,nz=8,dt=Math.PI/nt,dz=q.L/nz;
 for(let i=0;i<=nt;i++){const theta=i*dt,wt=(i===0||i===nt?1:i%2?4:2)*dt/3;for(let j=0;j<=nz;j++){const z=-q.L/2+j*dz,wz=(j===0||j===nz?1:j%2?4:2)*dz/3,P=bearingPressure(q,theta,z);assert(P>=0&&Number.isFinite(P));checks++;wx+=P*Math.cos(theta)*q.R*wt*wz;wy+=P*Math.sin(theta)*q.R*wt*wz;}}
 near(wx,q.Wx,2e-7);near(wy,q.Wy,2e-7);near(-wx*Math.cos(q.gamma)+wy*Math.sin(q.gamma),0,2e-5);near(-wx*Math.sin(q.gamma)-wy*Math.cos(q.gamma),2000,2e-7);
 let friction=0;for(let i=0;i<nt;i++){const theta=i*2*Math.PI/nt,h=q.c*(1+q.e*Math.cos(theta));friction+=q.mu*q.omega*q.R*q.R*q.L/h*2*Math.PI/nt;}near(friction,q.frictionForce,2e-9);
 let discharge=0;for(let i=0;i<=1024;i++){const theta=i*Math.PI/1024,weight=(i===0||i===1024?1:i%2?4:2)*Math.PI/1024/3,h=q.c*(1+q.e*Math.cos(theta)),step=q.L*.001,gradient=(-4*bearingPressure(q,theta,q.L/2-step)+bearingPressure(q,theta,q.L/2-2*step))/(2*step);discharge+=-2*h**3/(12*q.mu)*gradient*q.R*weight;}near(discharge,q.oilFlow,1e-12);
 for(let lane=0;lane<6;lane++){const index=lane*8,exit=meanFlowTrace(q,0,index).exit,time=.3*exit*400/q.omega,delta=1e-4,a=meanFlowTrace(q,time,index),b=meanFlowTrace(q,time+delta,index),c=meanFlowTrace(q,time-delta,index),h=q.c*(1+q.e*Math.cos(a.theta));near(a.z*h,a.invariant,1e-16);near((b.theta-c.theta)/(2*delta),q.omega/400,1e-8);near((b.z-c.z)/(2*delta),q.omega*q.c*q.e*Math.sin(a.theta)*a.z/(400*h),1e-9);assert(a.z>=-q.L/2&&a.z<0);checks++;}
 for(const theta of [.3,1.1,2.6]){const h=q.c*(1+q.e*Math.cos(theta)),step=q.L*.001,second=(bearingPressure(q,theta,step)-2*bearingPressure(q,theta,0)+bearingPressure(q,theta,-step))/(step*step);near(second,-6*q.mu*q.omega*q.c*q.e*Math.sin(theta)/h**3,2e-7);near(bearingPressure(q,theta,-q.L/2),0);near(bearingPressure(q,theta,q.L/2),0);}
 near(bearingPressure(q,0),0);near(bearingPressure(q,Math.PI),0);near(bearingPressure(q,Math.PI*1.5),0);assert(q.pressureMax>=bearingPressure(q,q.thetaPressureMax-.001)&&q.pressureMax>=bearingPressure(q,q.thetaPressureMax+.001));checks++;
}
assert(criteria(265,solutions[265]).ok);checks++;assert(!criteria(265,{viscosity:20,speed:1200}).ok);checks++;assert.throws(()=>hydrodynamic({viscosity:0,speed:1200}));checks++;
console.log('Elementos265: '+(checks-beforeBearing)+' comprobaciones correctas; total '+checks+'.');

await import('./verifica-rodamiento-carga-vida-l10.mjs');
await import('./verifica-resorte-helicoidal-rigidez-frecuencia.mjs');
await import('./verifica-freno-banda-autoenergizado.mjs');
await import('./verifica-cuatro-barras-sintesis-trayectoria.mjs');
await import('./verifica-eje-cubo-chaveta-estriado-interferencia.mjs');
