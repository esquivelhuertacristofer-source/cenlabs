import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../../public/labs/sensor-lluvia-optico.html',import.meta.url),'utf8');
const block=html.split('/* FISICA:INICIO */')[1]?.split('/* FISICA:FIN */')[0];
if(!block)throw Error('Falta bloque físico');
const p=vm.runInNewContext(block+';({OPT,critical,fresnel,optics,accumulate,wipeCoverage,challenge})');
let n=0;
function check(ok,name){n++;if(!ok)throw Error(name);}
function near(a,b,tol,name){check(Math.abs(a-b)<=tol,`${name}: ${a} frente a ${b}`);}
for(const [n1,n2]of [[1.5,1],[1.5,1.333],[1,1.5],[1.333,1]]){
  near(p.fresnel(n1,n2,0).R,((n1-n2)/(n1+n2))**2,1e-14,'Reflexión normal');
  const brewster=Math.atan(n2/n1)*180/Math.PI;
  near(p.fresnel(n1,n2,brewster).Rp,0,1e-25,'Brewster');
  for(let a=0;a<90;a+=.5){const f=p.fresnel(n1,n2,a);near(f.R+f.T,1,1e-14,'Conservación');check(f.R>=0&&f.R<=1,'Potencia acotada');
    if(f.transmitted!==null)near(n1*Math.sin(a*Math.PI/180),n2*Math.sin(f.transmitted*Math.PI/180),1e-13,'Snell');
    else check(n1>n2&&a>=p.critical(n1,n2),'Reflexión total sobre crítico');}
}
near(p.critical(1.5,1),41.810314895778596,1e-12,'Crítico vidrio–aire');
for(const a of [43,48,55,60]){
  near(p.optics(a,0).returned,1,1e-14,'Seco refleja todo');
  const wet=p.optics(a,1);check(wet.returned<1,'Agua transmite');
  for(let c=0;c<=1;c+=.05){const o=p.optics(a,c);near(o.returned,(1-c)+c*wet.returned,1e-14,'Mezcla de áreas');near(o.loss,c*o.contrast,1e-14,'Caída relativa');near(o.voltage,o.power*.55*2200,1e-14,'Receptor');}
}
near(p.optics(72,.8).loss,0,1e-14,'Agua refleja sobre su crítico');
near(p.optics(48,.3,.45).loss,p.optics(48,.3).loss,1e-14,'Calibración cancela acoplamiento');
for(const a of [0,.04,.12,.28])for(const c of [0,.2,.8,1]){
  const exact=p.accumulate(c,a,10);let stepped=c;for(let k=0;k<1000;k++)stepped=p.accumulate(stepped,a,.01);
  near(stepped,exact,1e-12,'Solución exacta independiente del paso');near(p.wipeCoverage(c),c*.12,1e-14,'Residuo');
}
check(!p.challenge(48,.52).ok,'Inicio no resuelto');check(p.challenge(48,.27).ok,'Solución interior');
for(const a of [30,78])for(const t of [.05,.27,.65])check(!p.challenge(a,t).ok,'Ángulos de borde no resuelven');
for(const t of [.05,.65])check(!p.challenge(48,t).ok,'Umbrales de borde no resuelven');
let success=0;for(let a=30;a<=78;a++)for(let t=.05;t<=.651;t+=.01)if(p.challenge(a,t).ok)success++;
check(success>0,'Ventana no vacía');
console.log(`Sensor de lluvia: ${n}/${n} comprobaciones · ${success} ajustes válidos`);
console.log('Cifras del motor:',JSON.stringify({criticoAgua:p.critical(1.5,1.333),secoV:p.optics(48,0).voltage,mojado50V:p.optics(48,.5).voltage}));
