import {pieza} from './inspeccion';
import {THREE,grupo,caja,cilindro,varilla,esfera,mesh,fusionar,paleta,banco,setVarilla,type EscenaConstruida} from './kit';
import {bezierPoint} from '@/domain/ciencias/matematicas';
export function bezier():EscenaConstruida{
 const root=new THREE.Group(),m=paleta();banco(root,m,3.5,3.8);const fixed=grupo(root);
 for(const z of [-1.65,1.65]){caja(fixed,2.9,.15,.18,m.pintura,0,.19,z);varilla(fixed,[-1.4,.31,z],[1.4,.31,z],.035,m.aluminio);}
 for(const x of [-1.38,1.38]){caja(fixed,.22,.15,3.5,m.acero,x,.19,0);for(const z of [-1.65,1.65])cilindro(fixed,.04,.02,m.cobre,x,.28,z,8);}
 const gantry=grupo(root,0,.32,0);for(const z of [-1.65,1.65])caja(gantry,.20,.20,.32,m.pintura,0,0,z);caja(gantry,.15,.14,3.45,m.aluminio,0,.18,0);varilla(gantry,[0,.28,-1.7],[0,.28,1.7],.025,m.acero);
 const carriage=grupo(gantry,0,.35,0);caja(carriage,.34,.18,.3,m.pintura);const tool=cilindro(carriage,.075,.3,m.acero,0,-.2,0);tool.name='herramienta-cnc';cilindro(carriage,.012,.12,m.cobre,0,-.40,0);fusionar(fixed);
 const curveGeo=new THREE.BufferGeometry().setFromPoints(Array.from({length:161},()=>new THREE.Vector3())),curve=new THREE.Line(curveGeo,new THREE.LineBasicMaterial({color:0x58eadb}));root.add(curve);curve.name='trayectoria-bezier';
 const points=Array.from({length:4},(_,i)=>esfera(root,.05,i===0||i===3?m.cobre:m.pintura));const rods=Array.from({length:3},()=>varilla(root,[0,0,0],[1,0,0],.009,m.acero)),tangent=varilla(root,[0,0,0],[1,0,0],.012,m.cobre);let last='';

 pieza(points[1],'Punto de control P1','Modifica la primera altura de control y observa la curva y su tangente.',0);pieza(points[2],'Punto de control P2','Modifica la segunda altura de control y sigue la trayectoria de la herramienta.',1);pieza(carriage,'Carro CNC','Inspecciona cómo los dos ejes siguen la misma curva paramétrica.',0);
 return {root,direction:[1.3,2.2,2.1],update(v,p){const key=[p.h1,p.h2].join();if(key!==last){last=key;const a=curveGeo.attributes.position;for(let i=0;i<=160;i++){const q=bezierPoint(p,i/160);a.setXYZ(i,q.x*1.2,.115,q.y*1.2);}a.needsUpdate=true;curveGeo.computeBoundingSphere();const ps:[[number,number,number],[number,number,number],[number,number,number],[number,number,number]]=[[-1.2,.13,0],[-.6,.13,p.h1*1.2],[.6,.13,p.h2*1.2],[1.2,.13,0]];points.forEach((o,i)=>o.position.set(...ps[i]));rods.forEach((o,i)=>setVarilla(o,ps[i],ps[i+1]));}gantry.position.x=v.x*1.2;carriage.position.z=v.y*1.2;setVarilla(tangent,[v.x*1.2,.15,v.y*1.2],[v.x*1.2+.28*v.vx/Math.hypot(v.vx,v.vy),.15,v.y*1.2+.28*v.vy/Math.hypot(v.vx,v.vy)]);}};
}
function inverseNormal(u:number):number{ // Acklam, deterministic normal quantiles for the illustrative production stream.
 const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924],b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857],c=[-.00778489400243029,-.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878],d=[.00778469570904146,.32246712907004,2.445134137143,3.75440866190742];if(u<.02425){const q=Math.sqrt(-2*Math.log(u));return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}if(u>.97575)return -inverseNormal(1-u);const q=u-.5,r=q*q;return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
}
export function capacidad():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,3.8,1.9);
 for(const z of [-.6,.6])caja(fixed,3.4,.24,.12,m.pintura,0,.3,z);
 for(let i=0;i<18;i++){const roller=cilindro(fixed,.075,1.1,m.aluminio,-1.6+i*3.2/17,.40,0,20);roller.rotation.x=Math.PI/2;}
 for(const x of [-.15,.15]){caja(fixed,.10,.95,.12,m.acero,x,.9,-.65);caja(fixed,.08,.08,1.25,m.acero,x,1.33,0);}caja(fixed,.3,.12,.2,m.pintura,0,1.26,0);cilindro(fixed,.025,.18,m.cobre,0,1.12,0);fusionar(fixed);
 const pieces=Array.from({length:13},()=>{const g=grupo(root);const bearing=mesh(g,new THREE.LatheGeometry([[.15,-.12],[.23,-.12],[.25,-.08],[.25,.08],[.23,.12],[.15,.12],[.15,-.12]].map(p=>new THREE.Vector2(...p)),40),m.acero);bearing.rotation.x=Math.PI/2;return g;});
 const laser=varilla(root,[0,1.10,0],[0,.5,0],.008,new THREE.MeshBasicMaterial({color:0xef6769,transparent:true,opacity:.35}));laser.name='medicion-optica';

 pieza(pieces[6],'Pieza de producción','Cambia la dispersión dimensional del proceso y observa las piezas.',1);pieza(laser,'Sensor de medida','Modifica el desplazamiento medio y compara las mediciones del proceso.',0);
 return {root,direction:[1.4,1.25,2.5],update(v,_p,t){for(let i=0;i<pieces.length;i++){const x=((i*.28+t*.18)%3.64)-1.82,diameter=v.instantMean+v.sigma*inverseNormal((i+.5)/pieces.length);pieces[i].position.set(x,.71,0);pieces[i].scale.setScalar(diameter/20);pieces[i].rotation.z=t*.18/.25;}}};
}
