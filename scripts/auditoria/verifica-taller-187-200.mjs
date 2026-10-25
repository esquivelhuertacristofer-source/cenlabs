import assert from 'node:assert/strict';
import {model,criteria,defaults,solutions,servo,robotPath,ultrasonic,TAU} from '../../public/labs/_taller-modelos.js';
export {solutions};
let count=0;const near=(a,b,tol=1e-7)=>{assert(Number.isFinite(a)&&Number.isFinite(b));assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} ≠ ${b}`);count++;};
const arg=process.argv.indexOf('--solo'),only=arg>=0?+process.argv[arg+1]:0;
for(let id=187;id<=200;id++){if(only&&id!==only)continue;const start=count,p=solutions[id];assert(!criteria(id,defaults[id]).ok,'El inicio no debe aprobar');assert(criteria(id,p).ok,'La solución debe aprobar');count+=2;
 for(let i=0;i<=120;i++){const t=.02+i*.11,m=model(id,t,p),h=1e-5,a=model(id,t-h,p),b=model(id,t+h,p);assert(Object.values(m).filter(v=>typeof v==='number').every(Number.isFinite));count++;
  if(id===187){near(Math.hypot(m.rx,m.rz),m.error/1000);near(m.rx,0);near(m.rz,0);const bad=model(id,t,{x:10,z:170});near(Math.hypot(bad.rx,bad.rz),Math.hypot(.002,.010));}
  if(id===188){near(1/p.focal,1/p.distance+1/m.image);near(m.field*m.magnification,8.8);near(m.pixel*2448,m.field);assert(m.near<p.distance&&m.far>p.distance);count++;}
  if(id===189){const q=servo(t,p.kp,p.kd),sa=servo(t-h,p.kp,p.kd),sb=servo(t+h,p.kp,p.kd);near((sb.x-sa.x)/(2*h),q.v,1e-6);near((sb.v-sa.v)/(2*h),q.acc,1e-6);near(5*q.acc+10*q.v,q.force);}
  if(id===190){near(p.voltage,m.v+m.current*1e6);const age=t*5;if(age<p.hold-.01){const dv=(b.v-a.v)/(2*h)/5;near(m.current,m.v/180e6+2e-6*dv,1e-8);}near(m.tau,1e6*180e6/(181e6)*2e-6);}
  if(id===191){near(m.peak,p.resistance?400/p.resistance:0);near(m.vc+p.resistance*m.current,400);const close=p.close/1000;if(t%1.6<close-.01){near((b.vc-a.vc)/(2*h)*.002,m.current,1e-6);}near(m.energy,.5*.002*(400**2-m.residual**2));}
  if(id===192){near(m.error,0);near(m.s*m.s+m.c*m.c,1);near(m.s,Math.sin(m.theta));near(m.c,Math.cos(m.theta));}
  if(id===193){near(ultrasonic(5,p),5);near(ultrasonic(15,p),15);near(m.reading,m.thickness);near(m.tof,2*m.thickness/5.9+.6);}
  if(id===194){near(m.delta/1000,1/Math.sqrt(Math.PI*p.frequency*1000*4e-7*Math.PI*35e6));assert(m.sensitivity>0&&m.sensitivity<1);count++;const farther=model(id,t,{...p,lift:.4});assert(farther.sensitivity<m.sensitivity);count++;}
  if(id===195){near(m.force,50e6*.0015*p.angle/360);near(m.stress,m.force/58);near(m.torque,m.force*(.0015/TAU+p.friction*.006));near(m.liveForce,m.force*Math.min(t%4/2,1));}
  if(id===196){near(m.z,m.b/(m.u/800+Math.tan(p.angle*Math.PI/180)));const du=.001,z1=m.b/((m.u-du)/800+Math.tan(p.angle*Math.PI/180)),z2=m.b/((m.u+du)/800+Math.tan(p.angle*Math.PI/180));near(Math.abs((z2-z1)/(2*du))*.2*1000,m.sigma,1e-6);}
  if(id===197){near(m.rate,101325*(.8e-6/60)/.001);near(m.estimate,m.drop/p.measure*.001/101325*60e6);assert(m.estimate>=.8&&m.estimate<.84);count++;near(m.total,p.warmup+p.measure);}
  if(id===198){near(m.offset,0);near(m.angular,0);near(m.far,m.offset+.3*m.angular);const common=model(id,t,{front:.1,rear:.1});near(common.angular,.6);}
  if(id===199){near(m.apparent,80);near(.6*(m.apparent+273.15)**4+.4*298.15**4,.6*353.15**4+.4*298.15**4);near(m.contrast,55);}
  if(id===200){const pose=robotPath(Math.min(t,15.99),p);near(pose.a,.1*(pose.right-pose.left)/.5);near(pose.ratio,1);const end=robotPath(16,p);near(end.error,0);near(end.a,TAU);}
 }
 if(id===190){const tau=(1/1e6+1/180e6)**-1*2e-6,expected=p.voltage*180/181*(1-Math.exp(-p.hold/tau));for(let j=0;j<26;j++){const held=model(id,p.hold/5+1+j,p);near(held.v,expected);near(held.current,(p.voltage-expected)/1e6);}}
 if(id===189){for(const kd of [5,10,Math.sqrt(4*5*1200)-10,180,200])for(const t of [0,.1,.3,1,3]){const a=servo(t,1200,kd);assert(Object.values(a).every(Number.isFinite));count++;}near(servo(0,1200,140).x,0);near(servo(0,1200,140).v,0);near(servo(6,1200,140).x,.1);}
 if(id===200){for(const time of [3,4,7,8,11,12,15,16]){const a=robotPath(time-1e-8,p),b=robotPath(time+1e-8,p);near(a.x,b.x);near(a.z,b.z);near(a.a,b.a);}near(robotPath(3,p).x,1);near(robotPath(7,p).z,1);}
 console.log(`${id}: ${count-start} comprobaciones; inicio rechazado y solución aceptada`);
}
console.log(`TOTAL: ${count} comprobaciones correctas`);
