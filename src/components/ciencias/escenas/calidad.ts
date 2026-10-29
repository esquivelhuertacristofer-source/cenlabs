import {pieza} from './inspeccion';
import {THREE,grupo,caja,cilindro,torno,fusionar,paleta,banco,type EscenaConstruida} from './kit';
export function muestreo():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,3.7,2.8);for(const x of [-1.1,.9]){caja(fixed,1.5,.08,1.8,m.acero,x,.18,0);for(const z of [-.9,.9])caja(fixed,1.55,.18,.05,m.pintura,x,.30,z);}fusionar(fixed);const pieces=new THREE.InstancedMesh(new THREE.LatheGeometry([[.04,0],[.075,0],[.075,.12],[.04,.12],[.04,0]].map(p=>new THREE.Vector2(...p)),16),m.acero,100),o=new THREE.Object3D(),color=new THREE.Color();root.add(pieces);

 pieza(pieces,'Lote y muestra','Cambia el tamaño de muestra y observa cuántas piezas se inspeccionan.',0);pieza(fixed,'Estación de inspección','Modifica la fracción defectuosa y compara los resultados de muestreo.',1);
 return {root,direction:[1.2,1.6,2.6],update(v,p,t){for(let i=0;i<100;i++){const picked=i<p.sample&&i<Math.floor(t*18),defect=((Math.imul(i+3,1664525)+1013904223)>>>0)%1000/1000<v.p;o.position.set((picked?.9:-1.1)+((i%10)-4.5)*.12,.27+Math.floor(i/50)*.14,(Math.floor(i/10)%5-2)*.25);o.rotation.y=i*.45;o.updateMatrix();pieces.setMatrixAt(i,o.matrix);color.setHex(picked&&defect?0xc77e68:0x80a9b4);pieces.setColorAt(i,color);}pieces.instanceMatrix.needsUpdate=true;if(pieces.instanceColor)pieces.instanceColor.needsUpdate=true;}};
}
export function weibull():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,3.6,2.8);const rotors=Array.from({length:24},(_,i)=>{const x=(i%6-2.5)*.5,z=(Math.floor(i/6)-1.5)*.5;const g=grupo(root,x,.45,z);torno(fixed,[[.12,0],[.19,0],[.19,.12],[.12,.12],[.12,0]],m.acero,x,.18,z);cilindro(g,.11,.06,m.pintura);for(let j=0;j<3;j++){const fin=caja(g,.17,.04,.025,m.cobre);fin.position.set(Math.cos(j*2*Math.PI/3)*.08,.05,Math.sin(j*2*Math.PI/3)*.08);fin.rotation.y=-j*2*Math.PI/3;}fusionar(g);return g;});fusionar(fixed);

 pieza(rotors[8],'Rotor en ensayo','Cambia el parámetro de forma y observa la dispersión de las fallas.',0);pieza(rotors[15],'Muestra del banco','Modifica la duración del ensayo y observa qué unidades siguen activas.',1);
 return {root,direction:[1.2,1.7,2.5],update(v,p,t){rotors.forEach((q,i)=>{const failure=v.eta*(-Math.log(1-(i+.5)/24))**(1/p.shape),time=p.hours*Math.min(t,6)/6,alive=time<failure;q.rotation.y=Math.min(time,failure)*.012;q.position.y=alive?.45:.35;});}};
}
export function bayes():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,4.1,2.8);for(const z of [-.45,.45])caja(fixed,3.6,.20,.08,m.acero,0,.27,z);for(let i=0;i<20;i++){const roller=cilindro(fixed,.055,.9,m.aluminio,-1.8+i*3.6/19,.39,0,16);roller.rotation.x=Math.PI/2;}for(const x of [-.15,.15])caja(fixed,.08,.9,.1,m.pintura,x,.85,-.55);caja(fixed,.4,.1,1.1,m.pintura,0,1.27,0);fusionar(fixed);
 const parts=new THREE.InstancedMesh(new THREE.CylinderGeometry(.09,.10,.12,20),m.acero,80),o=new THREE.Object3D(),color=new THREE.Color();root.add(parts);

 pieza(parts,'Flujo de inspección','Modifica la prevalencia y compara defectos reales con alarmas.',0);pieza(fixed,'Estación de detección','Cambia la tasa de falsos positivos y observa el flujo rechazado.',1);
 return {root,direction:[1.2,1.4,2.7],update(v,_p,t){for(let i=0;i<80;i++){const f=(t*.12+i/80)%1,x=-1.75+3.5*f,defect=(i+.5)/80<v.prevalence,alarm=defect?((i*17)%100)<95:((i*37)%100)/100<v.falsePositive;o.position.set(x,.50,x>0&&alarm?.9*(x/1.75):0);o.rotation.y=i*.7;o.updateMatrix();parts.setMatrixAt(i,o.matrix);color.setHex(x>0&&alarm?(defect?0xb5846b:0xb89ec8):0x7eabb6);parts.setColorAt(i,color);}parts.instanceMatrix.needsUpdate=true;if(parts.instanceColor)parts.instanceColor.needsUpdate=true;}};
}
