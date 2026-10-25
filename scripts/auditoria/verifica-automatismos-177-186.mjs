import assert from 'node:assert/strict';
import {model,criteria,defaults,geneva,camLaw,camProfile,cycloidPoint,spectrum,fft,TAU} from '../../public/labs/_automatismos-modelos.js';
export const solutions={177:{slots:6,rpm:45},178:{beta:140,rpm:500},179:{length:80,torque:2.5},180:{bend:30,phase:0},181:{sample:2048,duration:1250},182:{mu:.16,torque:6},183:{rpm:100,eccentric:2},184:{rpm:3000,spring:80},185:{diameter:3.5,rpm:25},186:{feed:900,rpm:6000}};
const only=process.argv.includes('--solo')?+process.argv[process.argv.indexOf('--solo')+1]:0;
let count=0;const near=(a,b,e=1e-6)=>{assert(Number.isFinite(a)&&Number.isFinite(b));assert(Math.abs(a-b)<=e*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);count++;};
for(let id=177;id<=186;id++){
 if(only&&id!==only)continue;const start=count,p=solutions[id];assert(!criteria(id,defaults[id]).ok);assert(criteria(id,p).ok);count+=2;
 for(let i=0;i<121;i++){const t=.023+i*.027,m=model(id,t,p),h=1e-6,a=model(id,t-h,p),b=model(id,t+h,p);
  if(id===177){near((b.output-a.output)/(2*h),m.outSpeed);near((b.outSpeed-a.outSpeed)/(2*h),m.acc,1e-5);if(m.active){const pin=[Math.sin(Math.PI/p.slots)*Math.cos(m.phase)-1,Math.sin(Math.PI/p.slots)*Math.sin(m.phase)],q=Math.atan2(pin[1],pin[0]);let error=10;for(let j=0;j<p.slots;j++)error=Math.min(error,Math.abs(Math.sin(q-(Math.PI+Math.PI/p.slots+m.output+j*TAU/p.slots))));near(error,0);}else near(m.outSpeed,0);}
  if(id===178){const law=camLaw(m.phase,p.beta),profile=camProfile(m.phase,p.beta);near(Math.hypot(...profile.normal),1);near(Math.hypot(...profile.center.map((x,k)=>x-profile.point[k])),.008);near((b.s-a.s)/(2*h),m.velocity);near((b.velocity-a.velocity)/(2*h),m.acc,1e-5);near(m.normal,120+9000*law.s+.6*m.acc);}
  if(id===179){near(m.maxForce*2*m.L*Math.sin(m.theta),p.torque);near(2*(.1-m.L*Math.cos(m.theta)),.065);near(m.pressure*.0001,m.maxForce);near(m.capacity,m.maxForce);}
  if(id===180){near(m.ratio,1);near((b.out-a.out)/(2*h),m.omega);near(m.torque*m.omega,5000);const u=[0,-Math.sin(m.phase),Math.cos(m.phase)],v=[-Math.sin(m.b)*Math.cos(m.middle),Math.cos(m.b)*Math.cos(m.middle),Math.sin(m.middle)];near(u.reduce((s,x,k)=>s+x*v[k],0),0);}
  if(id===181){const spec=spectrum(p);near(spec.peak,96);near(spec.resolution,.8);near(spec.nyquist,1024);assert(spec.n===2560&&spec.N===4096);count++;}
  if(id===182){near(m.outputTorque*TAU/40+m.heat,m.power);near(m.output,m.phase/40);assert(model(id,t,{...p,mu:.14}).locked===false);assert(model(id,t,{...p,mu:.15}).locked===true);count+=2;}
  if(id===183){near(Math.hypot(m.x,m.y),.002);near(m.bearingForce*m.e,8);near(m.acc,m.e*(p.rpm*TAU/60)**2);for(let j=0;j<11;j++){const u=m.phase/10+j*TAU/11,point=cycloidPoint(u,m.e).point,c=Math.cos(m.output),s=Math.sin(m.output),world=[c*point[0]-s*point[1]+m.x,s*point[0]+c*point[1]+m.y],pin=[.1*Math.cos(j*TAU/11),.1*Math.sin(j*TAU/11)];near(Math.hypot(world[0]-pin[0],world[1]-pin[1]),.008);}}
  if(id===184){near(m.inputWork,m.E+m.loadWork+m.heat);assert(m.heat>=0&&m.drumSpeed<=p.rpm*TAU/60+1e-8);count++;if(m.age<m.sync-.001){near((b.drumAngle-a.drumAngle)/(2*h),m.drumSpeed);near((b.heat-a.heat)/(2*h),m.capacity*(p.rpm*TAU/60-m.drumSpeed),1e-5);}else near(m.drumSpeed,p.rpm*TAU/60);}
  if(id===185){near(m.pressure,4*2*m.shear/m.d);near(m.fluidPower/m.power,.85*.8);near(m.flow,m.Q*60e6);near(m.volume*p.rpm/60*.85,m.Q);}
  if(id===186){near(m.torque*p.rpm*TAU/60,m.power);near(Math.hypot(m.x,m.z),.025);near(Math.hypot((b.x-a.x)/(2*h),(b.z-a.z)/(2*h)),m.speed);const ri=Math.sqrt(.03**2-2*.004*.025),volumeRate=.5*(.03**2-ri**2)*.002*m.speed/.025;near(volumeRate*60e9,m.MRR);}
 }
 if(id===181){const N=512,re=Float64Array.from({length:N},(_,i)=>1.3*Math.sin(TAU*37*i/N)),im=new Float64Array(N),timeEnergy=re.reduce((s,x)=>s+x*x,0);fft(re,im);near(Math.hypot(re[37],im[37])*2/N,1.3);near(re.reduce((s,x,i)=>s+x*x+im[i]*im[i],0)/N,timeEnergy);const alias=spectrum({sample:512,duration:250}).bins.find(b=>b.f===124);assert(alias.a>.17&&alias.a<.23);count++;}
 console.log(`${id}: ${count-start} comprobaciones correctas; inicio rechazado y solución interior aceptada`);
}
console.log(`TOTAL: ${count} comprobaciones correctas`);
