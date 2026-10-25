import assert from 'node:assert/strict';
import {model,criteria,defaults,solutions,modal,receptance,reflectometer,harmonicState,phaseCurrent,currentSignal,currentSpectrum,allocate,TAU} from '../../public/labs/_servicio-modelos.js';
export {solutions};let count=0;
const near=(a,b,tol=1e-7)=>{assert(Number.isFinite(a)&&Number.isFinite(b),`${a}, ${b}`);assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} ≠ ${b}`);count++;};
const index=process.argv.indexOf('--solo'),only=index>=0?+process.argv[index+1]:0;
for(let id=201;id<=210;id++){if(only&&only!==id)continue;const start=count,p=solutions[id];assert(criteria(id,p).ok,JSON.stringify(criteria(id,p)));assert(!criteria(id,defaults[id]).ok);count+=2;
 for(let i=0;i<=120;i++){const t=.02+i*.037,m=model(id,t,p),h=1e-5,a=model(id,t-h,p),b=model(id,t+h,p);assert(Object.values(m).filter(v=>typeof v==='number').every(Number.isFinite));count++;
  if(id===201){const q=modal(t,p),qa=modal(t-h,p),qb=modal(t+h,p);near((qb.x-qa.x)/(2*h),q.v,1e-6);near((qb.v-qa.v)/(2*h),q.acc,1e-6);near(p.mass*q.acc+p.damping*q.v+200000*q.x,0,1e-6);const H=receptance(30,p),re=200000-p.mass*(TAU*30)**2,im=p.damping*TAU*30;near(H.re*re-H.im*im,1);near(H.re*im+H.im*re,0);}
  if(id===202){near(m.resolution,.66*299792458*p.pulse*1e-9/2);near(m.bandwidth,Math.SQRT2*Math.log(2)/(Math.PI*p.pulse)*1000);near(m.gamma,0);assert(m.x>=0&&m.x<=18);count++;}
  if(id===203){near(m.Fcap,p.force*.85/1.15);near(m.peak,p.stiffness*.7);near(m.sag*1000,3/p.stiffness);near(m.residual+m.correction,.0008);assert(m.depth>=0&&m.depth<=.025);count++;}
  if(id===204){near(m.read100,100);near(m.read200,200);near(m.raw100,106.023);near(m.raw200,206.046);assert(m.probeY>=.35-1e-10&&m.probeY<=.85+1e-10);count++;}
  if(id===205){near(m.tstop,80/p.torque);near(m.required,2000*(.05+80/p.torque)+120);near(m.reserve,p.distance-m.required);const age=t%3;if(age<1.05-1e-4||age>1.05+1e-4&&age<1.05+m.tstop-1e-4||age>1.05+m.tstop+1e-4){near((b.angle-a.angle)/(2*h),m.omega,1e-5);}if(age>1.05){const delta=m.angle-8*1.05;near(p.torque*delta,320-.5*10*m.omega*m.omega,1e-6);}}
  if(id===206){near(m.pf,.95/Math.sqrt(1+(m.THD/100)**2));near(m.rms*m.rms,400+m.harmonics.reduce((s,x)=>s+x*x,0));near(m.drop,TAU*60*(p.inductance/1000)*20);near(phaseCurrent(t,p,0)+phaseCurrent(t,p,TAU/3)+phaseCurrent(t,p,-TAU/3),0,1e-6);}
  if(id===207){near(m.separation*m.lambda,Math.log(4));near(m.residence*p.flow,30);near(m.stress,7800*(p.rpm*TAU/60)**2*.01/1e6);if(m.age<m.separation-.01)near((b.r-a.r)/(2*h),m.lambda*m.r,1e-5);}
  if(id===208){near(m.frequency*m.frequency*4*.45*.45*.15,p.tension);near(m.tight-m.slack,p.power*1000/(.06*1500*TAU/60));near(m.tight+m.slack,2*p.tension);near(m.A*m.A*p.tension*Math.PI*Math.PI/(4*.45),.001);}
  if(id===209){near(m.spacing,120*(.005+.035*p.load/100));near(m.resolution,1/p.duration);near(m.rpm,1800*(1-m.slip));assert(m.spec.bins.length===m.spec.N/2+1);count++;}
  if(id===210){near(m.total,p.thrust);near(m.roll,.25);near(m.pitch,.15);near(m.yaw,p.yaw);m.thrusts.forEach((T,j)=>near(T,1.8e-5*m.omega[j]**2));const hh=1e-4,qa=model(id,t-hh,p),qb=model(id,t+hh,p);near(.08*(qb.rollAngle-2*m.rollAngle+qa.rollAngle)/(hh*hh)+.25*(qb.rollAngle-qa.rollAngle)/(2*hh)+4*m.rollAngle,m.roll,1e-5);}
 }
 if(id===201){near(modal(0,p).v,4/p.mass);near(modal(0,p).x,0);let loss=0;const N=20000,dt=2/N;for(let i=0;i<N;i++){const v=modal((i+.5)*dt,p).v;loss+=p.damping*v*v*dt;}const end=modal(2,p);near(loss+.5*p.mass*end.v**2+.5*200000*end.x**2,16/(2*p.mass),1e-6);}
 if(id===202){const B=Math.SQRT2*Math.log(2)/(Math.PI*p.pulse*1e-9),N=20000,dt=8*p.pulse*1e-9/N;let dc=0,ac=0;for(let i=0;i<N;i++){const t=(-4*p.pulse*1e-9)+(i+.5)*dt,y=Math.exp(-4*Math.log(2)*(t/(p.pulse*1e-9))**2);dc+=y;ac+=y*Math.cos(TAU*B*t);}near(ac/dc,1/Math.SQRT2,1e-6);const tof=2*6/(.66*299792458)*1e9;near(reflectometer(tof,p),.18,1e-5);}
 if(id===204){const h1=106.023/200,h2=206.046/200;for(const [t,x]of [[1,-h1],[4,h1],[7,-h2],[10,h2]]){const m=model(id,t,p);near(m.probeX,x);near(m.probeY,.35);}const a=model(id,12-1e-7,p),b=model(id,12+1e-7,p);near(a.probeX,b.probeX);near(a.probeZ,b.probeZ);}
 if(id===206){let rms=0,power=0;const N=12000;for(let i=0;i<N;i++){const t=(i+.5)/N/60,I=phaseCurrent(t,p);rms+=I*I/N;power+=3*Math.SQRT2*230*Math.sin(TAU*60*t)*I/N;}near(rms,harmonicState(p).rms**2,1e-6);near(power,3*230*20*.95,1e-6);}
 if(id===209){const spec=currentSpectrum(p),main=spec.bins.reduce((a,b)=>Math.abs(a.f-60)<Math.abs(b.f-60)?a:b);near(main.a,9.6,.002);const s=model(id,0,p),side=spec.bins.filter(q=>Math.abs(q.f-(60-s.spacing))<.6).reduce((a,b)=>a.a>b.a?a:b);near(side.a,s.sideband,.03);let energy=0;const N=102400;for(let i=0;i<N;i++)energy+=currentSignal(i/2048,p)**2/N;near(energy,s.I1**2+2*s.sideband**2+(.1*s.I1)**2,1e-6);}
 if(id===210){const bad=allocate({thrust:12,yaw:.30});assert(bad.min<0);assert(bad.thrusts.every(T=>T>=0&&T<=8));assert(Math.abs(bad.yaw-.30)>.001);count+=3;near(bad.total,bad.thrusts.reduce((a,b)=>a+b,0));}
 console.log(`${id}: ${count-start} comprobaciones correctas; inicio rechazado y solución interior aceptada`);
}
console.log(`TOTAL: ${count} comprobaciones correctas`);
