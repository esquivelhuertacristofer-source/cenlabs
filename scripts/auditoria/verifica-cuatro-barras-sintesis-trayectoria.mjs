import assert from 'node:assert/strict';
import {fourBar,fourBarModel,pathMetrics} from '../../public/labs/_elementos-cuatro-barras.js';
import {criteria,solutions} from '../../public/labs/_elementos-modelos.js';
let checks=0;const near=(x,y,tol=1e-9)=>{assert(Math.abs(x-y)<=tol*Math.max(1,Math.abs(y)),`${x} != ${y}`);checks++;};
const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const ref=fourBarModel(solutions[269],1);near(ref.rms,0);near(ref.minAngle,48.368620460647016);near(ref.P[0],.08426476095460685);near(ref.P[1],.0979464903633373);
for(let coupler=110;coupler<=150;coupler+=2)for(let rocker=90;rocker<=120;rocker+=2){
 const p={coupler,rocker},a=coupler/1000,b=rocker/1000,sorted=[.04,.14,a,b].sort((x,y)=>x-y);assert(sorted[0]+sorted[3]<sorted[1]+sorted[2]);checks++;
 const metrics=pathMetrics(a,b);let rms=0,maxError=0,minAngle=90;
 // Independent angular closure: angle between AD and AB from cosine law.
 for(let i=0;i<360;i++){
  const theta=i*2*Math.PI/360,q=fourBar(a,b,theta),A=[.04*Math.cos(theta),.04*Math.sin(theta)],delta=[.14-A[0],-A[1]],s=Math.hypot(...delta),phi=Math.atan2(delta[1],delta[0])+Math.acos((a*a+s*s-b*b)/(2*a*s)),B=[A[0]+a*Math.cos(phi),A[1]+a*Math.sin(phi)],P=[A[0]+.65*a*Math.cos(phi)-.025*Math.sin(phi),A[1]+.65*a*Math.sin(phi)+.025*Math.cos(phi)];
  near(length(q.A,[0,0]),.04);near(length(q.A,q.B),a);near(length(q.B,[.14,0]),b);near(q.B[0],B[0]);near(q.B[1],B[1]);near(q.P[0],P[0]);near(q.P[1],P[1]);
  const target=fourBar(.132,.104,theta),error=length(P,target.P);rms+=error*error;maxError=Math.max(maxError,error);minAngle=Math.min(minAngle,q.transmission);
 }
 near(metrics.rms,Math.sqrt(rms/360));near(metrics.maxError,maxError);near(metrics.minAngle,minAngle);
 // Extremal transmission comes from the two collinear crank/ground postures.
 const extreme=[.10,.18].map(s=>Math.acos(Math.abs((a*a+b*b-s*s)/(2*a*b)))*180/Math.PI);near(metrics.minAngle,Math.min(...extreme));
 const before=fourBar(a,b,-1e-7),after=fourBar(a,b,1e-7);assert(length(before.P,after.P)<1e-7);checks++;
 for(let i=0;i<16;i++){const t=i*.47,m=fourBarModel(p,t),dt=1e-5,lo=fourBarModel(p,t-dt),hi=fourBarModel(p,t+dt);near(m.Pdot[0],(hi.P[0]-lo.P[0])/(2*dt),1e-8);near(m.Pdot[1],(hi.P[1]-lo.P[1])/(2*dt),1e-8);near(m.speed,Math.hypot(...m.Pdot));}
}
assert(criteria(269,solutions[269]).ok);assert(!criteria(269,{coupler:144,rocker:94}).ok);assert.throws(()=>fourBar(.02,.02,Math.PI));checks+=3;
console.log(`Elementos269: ${checks} comprobaciones correctas.`);
