// Modelos didácticos puros. mm, s, A, W y °C, salvo unidades indicadas.
export const TAU=2*Math.PI,RAD=Math.PI/180;
export const defaults={211:{angle:3,offset:18},212:{current:240,speed:9},213:{height:.32,speed:110},214:{views:30,photons:1000},215:{power:2.4,seconds:120},216:{center:.25,tilt:.30},217:{resistance:15,capacity:.8},218:{scale:-200,square:-80},219:{clearance:180,turn:.8},220:{head:-4,flow:4}};
export const solutions={211:{angle:8,offset:35},212:{current:180,speed:6},213:{height:.20,speed:70},214:{views:150,photons:8000},215:{power:1.8,seconds:80},216:{center:.08,tilt:.04},217:{resistance:32,capacity:2},218:{scale:90,square:60},219:{clearance:180,turn:2.2},220:{head:-1,flow:3}};
export const smooth=u=>{u=Math.max(0,Math.min(1,u));return u*u*u*(10+u*(-15+6*u));};
export const pattern=[[-100,-60],[0,-60],[100,-60],[-100,60],[0,60],[100,60]];
export function transform2(q,angle,tx,ty=-20){const a=angle*RAD,c=Math.cos(a),s=Math.sin(a);return [c*q[0]-s*q[1]+tx,s*q[0]+c*q[1]+ty];}
export function handEye(p){const measured=pattern.map(q=>transform2(q,8,35)),estimated=pattern.map(q=>transform2(q,p.angle,p.offset)),errors=estimated.map((q,i)=>q.map((x,j)=>x-measured[i][j])),norms=errors.map(q=>Math.hypot(...q)),rms=Math.hypot(...norms)/Math.sqrt(norms.length);return {measured,estimated,errors,rms,maxError:Math.max(...norms),pixels:rms*800/600,coverage:Math.hypot(200,120)};}
export function scara(t){const q1=.45+.35*Math.sin(TAU*t/12),q2=-1.0+.30*Math.cos(TAU*t/12),L1=.85,L2=.65;return {q1,q2,elbow:[L1*Math.cos(q1),L1*Math.sin(q1)],tcp:[L1*Math.cos(q1)+L2*Math.cos(q1+q2),L1*Math.sin(q1)+L2*Math.sin(q1+q2)]};}
export function deposition(p){const power=.75*22*p.current,heat=power/p.speed,wireArea=Math.PI*.5**2,volumeRate=wireArea*6000/60,area=volumeRate/p.speed;return {power,heat,volumeRate,area,width:Math.sqrt(8*area/Math.PI),duration:100/p.speed};}
export function printState(p){const area=p.height*(.45-p.height)+Math.PI*p.height**2/4,flow=area*p.speed,applied=Math.min(8,flow),ratio=applied/flow,layers=Math.ceil(20/p.height),length=TAU*18,lifetime=length*layers/p.speed;return {height:p.height,area,flow,applied,ratio,layers,length,lifetime,filament:applied/(Math.PI*1.75**2/4),displayWidth:.45*ratio};}
// Fantoma circular de radio 16 mm con tres poros circulares. Proyección analítica.
export const pores=[{x:-5,y:3,r:2.5},{x:5,y:-4,r:1.8},{x:3,y:6,r:1.2}];
export function chord(s,r){return Math.abs(s)<r?2*Math.sqrt(r*r-s*s):0;}
export function rayLength(s,theta){return chord(s,16)-pores.reduce((a,p)=>a+chord(s-p.x*Math.cos(theta)-p.y*Math.sin(theta),p.r),0);}
export function transmission(s,theta,N){return N*Math.exp(-.10*rayLength(s,theta));}
const ctCache=new Map();
export function tomography(p){const key=p.views+':'+p.photons;if(ctCache.has(key))return ctCache.get(key);const n=64,ds=.625,rows=[],filtered=[];let seed=214;
 const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return (seed+.5)/4294967296;};
 for(let a=0;a<p.views;a++){const angle=a*Math.PI/p.views,row=new Float64Array(n);for(let j=0;j<n;j++){const N=transmission((j-(n-1)/2)*ds,angle,p.photons),noise=Math.sqrt(-2*Math.log(rand()))*Math.cos(TAU*rand()),count=Math.max(1,N+Math.sqrt(N)*noise);row[j]=-Math.log(count/p.photons);}rows.push(row);
  const f=new Float64Array(n);for(let j=0;j<n;j++)for(let k=0;k<n;k++){const d=j-k,h=d===0?1/(4*ds*ds):Math.abs(d)%2===1?-1/(Math.PI*Math.PI*d*d*ds*ds):0;f[j]+=row[k]*h*ds;}filtered.push(f);
 }
 const image=new Float64Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const xx=(x-(n-1)/2)*ds,yy=(y-(n-1)/2)*ds;let sum=0;for(let a=0;a<p.views;a++){const angle=a*Math.PI/p.views,j=(xx*Math.cos(angle)+yy*Math.sin(angle))/ds+(n-1)/2,k=Math.floor(j),u=j-k;if(k>=0&&k<n-1)sum+=(1-u)*filtered[a][k]+u*filtered[a][k+1];}image[y*n+x]=sum*Math.PI/p.views;}
 const q={n,ds,rows,image,sampling:Math.PI*16/p.views,noise:1/Math.sqrt(p.photons*Math.exp(-3.2)),dose:p.views*p.photons/1e6};ctCache.set(key,q);if(ctCache.size>3)ctCache.delete(ctCache.keys().next().value);return q;}
export function temperature(seconds,p){const C=2.8*460,H=6;return 20+.72*p.power*1000/H*(-Math.expm1(-H*seconds/C));}
export function hotFit(p){const hot=temperature(p.seconds,p),arrival=20+(hot-20)*Math.exp(-10*4/(2.8*460)),expansion=80*11.5e-6*(arrival-20),clearance=expansion-.040;return {hot,arrival,expansion,clearance,energy:p.power*p.seconds};}
export function toothContact(p){const b=20,K=1000,F=400,s=Math.tan(p.tilt*RAD),a=Math.abs(s),full=F/(K*b)>=a*b/2,delta=full?F/(K*b):Math.sqrt(2*a*F/K)-a*b/2,pressure=x=>K*Math.max(0,delta-s*x),length=full?b:Math.sqrt(2*F/(K*Math.max(a,1e-12))),peak=pressure(s>=0?-b/2:b/2);return {b,K,F,s,delta,pressure,length,coverage:length/b*100,peak,peakRatio:peak/(F/b),backlash:.08+2*p.center*Math.tan(20*RAD)};}
export function playTriangle(t,A,r,period=6){r=Math.min(A,Math.max(0,r));const u=((t%period)+period)%period/period,x=u<.5?A-4*A*u:-A+4*A*(u-.5),y=u<.5?Math.min(A-r,x+r):Math.max(-A+r,x-r);return {x,y};}
export const eisFrequencies=Array.from({length:41},(_,i)=>.1*10**(i/10));
export function impedance(f,R,C){const a=TAU*f*R*C;return {re:.008+R/(1+a*a),im:-R*a/(1+a*a)};}
export function eisFit(p){const measured=eisFrequencies.map(f=>impedance(f,.032,2)),fit=eisFrequencies.map(f=>impedance(f,p.resistance/1000,p.capacity)),rms=1000*Math.sqrt(fit.reduce((s,z,i)=>s+(z.re-measured[i].re)**2+(z.im-measured[i].im)**2,0)/fit.length),peak=1/(TAU*(p.resistance/1000)*p.capacity);return {measured,fit,rms,peak,tau:p.resistance/1000*p.capacity,diameter:p.resistance};}
export function ballbar(theta,p){const R=100,e=(90-p.scale)*1e-6,s=(60-p.square)*Math.PI/(180*3600),nominal=[R*Math.cos(theta),R*Math.sin(theta)],point=[(1+e)*nominal[0]+Math.tan(s)*nominal[1],nominal[1]];return {nominal,point,radial:(Math.hypot(...point)-R)*1000};}
export const program=['orientar','subir','tomar','desbloquear','extraer','girar','insertar','bloquear','liberar'];
export const blockNames=['Orientar husillo','Subir a cota','Tomar herramientas','Desbloquear cono','Extraer conos','Girar brazo','Insertar conos','Bloquear husillo','Liberar pinzas'];
export function toolSequence(t,p){const commands=(p.program||program.join(',')).split(','),programOK=commands.length===program.length&&commands.every((s,i)=>s===program[i]),clear=p.clearance>=150,ds=[.5,p.clearance/150,.5,.4,.8,p.turn,.8,.4,1.3],cycle=ds.reduce((s,x)=>s+x,0),age=((t%cycle)+cycle)%cycle;let step=0,start=0;while(step<8&&age>=start+ds[step])start+=ds[step++];const u=smooth((age-start)/ds[step]),radius=.22,inertia=2*1.4*radius*radius,peakSpeed=radius*1.875*Math.PI/p.turn,peakTorque=inertia*(10*Math.sqrt(3)/3)*Math.PI/p.turn**2;return {commands,programOK,clear,ds,cycle,step:programOK&&clear?step:0,u:programOK&&clear?u:0,age,peakSpeed,peakTorque,rotation:programOK&&clear?(step<5?0:step===5?Math.PI*u:Math.PI):0,drop:programOK&&clear?(step<4?0:step===4?.24*u:step===5?.24:step===6?.24*(1-u):0):0};}
export function suction(p){const rho=998,g=9.81,Q=p.flow/1000,A=Math.PI*.04**2/4,v=Q/A,loss=(.025*10/.04+4)*v*v/(2*g),available=(101325-2340)/(rho*g)+p.head-loss,required=2+.12*p.flow**2,margin=available-required,severity=Math.max(0,Math.min(1,-margin/required)),nominalHead=25-.8*p.flow**2,deliveredHead=nominalHead*(1-.15*severity),power=available>0?rho*g*Q*deliveredHead/.68:NaN;return {rho,g,Q,A,v,loss,available,required,margin,severity,nominalHead,deliveredHead,power,valid:available>0};}
export function model(id,t,p){let m={phase:t};
 if(id===211){const q=handEye(p);m={...m,...q,...scara(t),signal:q.rms,reference:.5};}
 if(id===212){const q=deposition(p),age=t%q.duration,x=age*p.speed;m={...m,...q,age,x,progress:x/100,signal:q.heat/1000,reference:q.area/20};}
 if(id===213){const q=printState(p),physical=t*20,progress=physical%q.lifetime/q.lifetime,index=progress*q.layers,layer=Math.floor(index),angle=TAU*(index-layer);m={...m,...q,progress,layer,angle,z:Math.min(20,layer*p.height),signal:q.flow/8,reference:q.ratio};}
 if(id===214){const q=tomography(p),angle=TAU*t/12;m={...m,...q,angle,signal:transmission(0,angle,p.photons)/p.photons,reference:q.noise};}
 if(id===215){const q=hotFit(p),age=t%12,heatAge=Math.min(1,age/8)*p.seconds,T=age<8?temperature(heatAge,p):20+(q.hot-20)*Math.exp(-10*(age-8)/(2.8*460));m={...m,...q,age,T,diameter:80*(1+11.5e-6*(T-20)),lift:smooth((age-8.5)/.8),transfer:smooth((age-9.3)/1.4),lower:q.clearance>=.015?smooth((age-10.7)/1.3):0,signal:(T-20)/100,reference:q.clearance*10};}
 if(id===216){const q=toothContact(p),play=playTriangle(t,.16,Math.max(0,q.backlash)/(2*20));m={...m,...q,input:play.x,output:-play.y/2,signal:play.x-play.y,reference:q.backlash/40};}
 if(id===217){const q=eisFit(p),z=impedance(1,.032,2),current=.1*Math.sin(TAU*t),voltage=.1*(z.re*Math.sin(TAU*t)+z.im*Math.cos(TAU*t));m={...m,...q,current,voltage,signal:current,reference:voltage*30};}
 if(id===218){const theta=TAU*t/8,q=ballbar(theta,p),values=Array.from({length:361},(_,i)=>ballbar(TAU*i/360,p).radial);m={...m,...q,theta,values,circularity:Math.max(...values)-Math.min(...values),maxError:Math.max(...values.map(Math.abs)),signal:q.radial/100,reference:0};}
 if(id===219){const q=toolSequence(t,p);m={...m,...q,signal:q.rotation/Math.PI,reference:q.drop/.24,warning:q.programOK?(q.clear?'':'Interbloqueo: falta cota de intercambio. La secuencia permanece detenida.'):'Programa incoherente: revisa el orden antes de mover herramientas.'};}
 if(id===220){const q=suction(p);m={...m,...q,spin:1450*TAU/60*t/120,signal:q.severity,reference:Math.max(0,q.margin)/10,warning:q.valid?'':'El caudal solicitado queda fuera de la hipótesis de líquido continuo.'};}
 return m;
}
const check=(name,value,unit,ok)=>({name,value,unit,ok});
export function criteria(id,p){const m=model(id,0,p);let checks=[];
 if(id===211)checks=[check('Error RMS',m.rms,'mm',m.rms<=.5),check('Error máximo',m.maxError,'mm',m.maxError<=.7),check('Reproyección equivalente',m.pixels,'px',m.pixels<=.7)];
 if(id===212)checks=[check('Aporte térmico',m.heat,'J/mm',m.heat>=400&&m.heat<=650),check('Sección depositada',m.area,'mm²',m.area>=10&&m.area<=15),check('Duración del cordón',m.duration,'s',m.duration<=20)];
 if(id===213)checks=[check('Demanda volumétrica',m.flow,'mm³/s',m.flow<=8),check('Altura de capa',p.height,'mm',p.height<=.24),check('Tiempo de pieza',m.lifetime,'s',m.lifetime<=220),check('Material entregado',m.ratio*100,'%',m.ratio>=.99)];
 if(id===214)checks=[check('Paso angular periférico',m.sampling,'mm',m.sampling<=.4),check('Ruido relativo central',m.noise*100,'%',m.noise<=6),check('Exposición relativa',m.dose,'M relativas',m.dose<=1.5)];
 if(id===215)checks=[check('Holgura a la llegada',m.clearance*1000,'µm',m.clearance>=.015),check('Temperatura máxima',m.hot,'°C',m.hot<=110),check('Tiempo de calentamiento',p.seconds,'s',p.seconds<=100)];
 if(id===216)checks=[check('Juego tangencial',m.backlash,'mm',m.backlash>=.10&&m.backlash<=.20),check('Contacto útil',m.coverage,'%',m.coverage>=90),check('Concentración de carga',m.peakRatio,'veces media',m.peakRatio<=1.6)];
 if(id===217)checks=[check('Residuo complejo RMS',m.rms,'mΩ',m.rms<=.6),check('Tiempo equivalente',m.tau,'s',Math.abs(m.tau-.064)<=.004)];
 if(id===218)checks=[check('Desviación circular',m.circularity,'µm',m.circularity<=3),check('Error radial máximo',m.maxError,'µm',m.maxError<=2)];
 if(id===219)checks=[check('Secuencia coherente',m.programOK?1:0,'',m.programOK),check('Cota de intercambio',p.clearance,'mm',p.clearance>=150),check('Velocidad de herramienta',m.peakSpeed,'m/s',m.peakSpeed<=.7),check('Par de aceleración',m.peakTorque,'N·m',m.peakTorque<=.7),check('Tiempo de ciclo',m.cycle,'s',m.cycle<=8.5)];
 if(id===220)checks=[check('Margen NPSH didáctico',m.margin,'m',m.margin>=1),check('Caudal solicitado',p.flow,'L/s',p.flow>=2.5),check('Potencia estimada',m.power,'W',m.power<=1200),check('Hipótesis de líquido',m.available,'m NPSHa',m.valid)];
 return {checks,ok:checks.every(c=>c.ok)};
}
