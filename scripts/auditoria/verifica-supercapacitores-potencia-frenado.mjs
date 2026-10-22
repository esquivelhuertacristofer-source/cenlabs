import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../../public/labs/supercapacitores-potencia-frenado.html',import.meta.url),'utf8');
const block=html.split('/* FISICA:INICIO */')[1]?.split('/* FISICA:FIN */')[0];
const p=vm.runInNewContext(block+';({CELL,bank,pulse,cycle,dimension})');
let n=0;const check=(ok,msg)=>{n++;if(!ok)throw Error(msg);};const near=(a,b,t,msg)=>check(Math.abs(a-b)<=t,`${msg}: ${a} frente a ${b}`);
for(let np=1;np<=8;np++){
 const b=p.bank(np);near(b.C,25*np,1e-12,'Serie y paralelo C');near(b.R,.0276/np,1e-14,'Serie y paralelo R');near(b.max,324,1e-12,'Tensión máxima');
 for(const v0 of [150,220,270,320])for(const I of [-150,0,200])for(const t of [0,.1,2,8]){
  const a=p.pulse(b,v0,I,t);near(a.initial-a.energy,a.delivered+a.heat,1e-7,'Balance energético exacto');near(a.heat,I*I*b.R*a.t,1e-10,'Joule');near(a.v,v0-I*a.t/b.C,1e-11,'Carga y tensión');check(a.v>=0&&a.v<=b.max+1e-10,'Protección de tensión');
  if(!a.limited&&t>0){const avgTerminal=(v0+a.v)/2-I*b.R;near(a.delivered,I*avgTerminal*t,1e-7,'Integral analítica de potencia');}
 }
 for(let t=0;t<14;t+=.05){const c=p.cycle(b,250,t);near(c.initial-c.energy,c.delivered+c.heat,1e-7,'Balance en ciclo con frenado');check(c.heat>=0,'Calor no negativo al frenar');}
}
const ideal={...p.bank(3),R:0};const a=p.pulse(ideal,250,200,8);near(a.delivered,.5*ideal.C*(250**2-a.v**2),1e-8,'Capacitor sin pérdidas');
check(p.pulse(p.bank(1),10,200,8).limited,'Corte al agotar');check(p.pulse(p.bank(1),320,-150,8).limited,'Corte por sobretensión');
check(!p.dimension(1,320).ok,'Inicio no resuelto');check(p.dimension(3,250).ok,'Solución interior');
for(const np of [1,8])for(let v=150;v<=320;v++)check(!p.dimension(np,v).ok,'Ramas de borde no resuelven');
for(const v of [150,320])for(let np=1;np<=8;np++)check(!p.dimension(np,v).ok,'Tensión de borde no resuelve');
let valid=0;for(let np=1;np<=8;np++)for(let v=150;v<=320;v++)if(p.dimension(np,v).ok)valid++;
console.log(`Supercapacitores: ${n}/${n} comprobaciones · ${valid} ajustes válidos`);
console.log('Referencia del motor:',JSON.stringify(p.dimension(3,250)));
