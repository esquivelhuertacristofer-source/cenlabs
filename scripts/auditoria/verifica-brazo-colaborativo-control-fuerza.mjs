import {readFileSync} from 'node:fs';import vm from 'node:vm';
const html=readFileSync(new URL('../../public/labs/brazo-colaborativo-control-fuerza.html',import.meta.url),'utf8');
const source=html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const p=vm.runInNewContext(source+';({CO,contact,cobotIK,cobotFK,cobotChallenge})');
let n=0;const ok=(v,s)=>{n++;if(!v)throw Error(s);},near=(a,b,t,s)=>ok(Math.abs(a-b)<=t,`${s}: ${a} / ${b}`);
for(const K of [200,1000,1100,2000,4000])for(const B of [10,55,80,150,250]){
 let input=0,output=0;const N=800,T=2*Math.PI/p.CO.omega;
 for(let i=0;i<N;i++){const t=(i+.5)/N*T,m=p.contact(t,K,B);near(p.CO.mass*m.acceleration+B*m.v+K*(m.x-p.CO.force/p.CO.environment),p.CO.force-m.force,1e-11,'Ecuación de movimiento');ok(m.force>0,'No pierde contacto en el dominio');input+=p.CO.environment*m.h*m.v/N;output+=B*m.v*m.v/N;}
 near(input,output,1e-10,'Potencia media y disipación');near(output,p.contact(0,K,B).dampingPower,1e-10,'Integral vs forma cerrada');
}
for(let i=0;i<1000;i++){
 const a=i/1000*2*Math.PI,x=1.05+.17*Math.cos(a),z=.17*Math.sin(a),m=p.contact(a/2,1100,80),y=.72+.12-5*m.x+.23;
 const q=p.cobotIK(x,y,z);ok(!!q,'Trayectoria alcanzable');const f=p.cobotFK(q);near(f.x,x,1e-12,'Cinemática X');near(f.y,y,1e-12,'Cinemática Y');near(f.z,z,1e-12,'Cinemática Z');near(q.shoulder+q.elbow+q.wrist,-Math.PI/2,1e-14,'Orientación de herramienta');
}
ok(!p.cobotChallenge(3500,20).ok,'Inicio no resuelto');ok(p.cobotChallenge(1100,80).ok,'Solución interior');
for(const K of [200,4000])for(let B=10;B<=250;B+=5)ok(!p.cobotChallenge(K,B).ok,'Rigidez de borde no resuelve');
for(const B of [10,250])for(let K=200;K<=4000;K+=50)ok(!p.cobotChallenge(K,B).ok,'Amortiguamiento de borde no resuelve');
console.log(`Brazo colaborativo: ${n}/${n} comprobaciones`);console.log('Referencia:',JSON.stringify(p.contact(0,1100,80)));
