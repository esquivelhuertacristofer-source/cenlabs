import {pieza} from './inspeccion';
import {THREE,grupo,caja,cilindro,torno,varilla,tubo,fusionar,paleta,banco,material,type EscenaConstruida,type Paleta} from './kit';
import {floculacion as modeloFloculos} from '@/domain/ciencias/procesos';
function vaso(g:THREE.Group,m:Paleta,r=.65,h=1.4){const wall=torno(g,[[0,0],[r,0],[r+.025,.06],[r+.025,h],[r,h+.015],[r-.015,h],[r-.015,.06],[0,.06]],m.vidrio);wall.name='vaso-de-vidrio';return wall;}
function liquido(g:THREE.Group,r=.63,h=1,color=0x4b9baa){return cilindro(g,r,h,new THREE.MeshPhysicalMaterial({color,metalness:0,roughness:.22,transparent:true,opacity:.22,transmission:.15}),0,h/2+.06,0);}
function agitador(g:THREE.Group,m:Paleta,h=1.7){const shaft=grupo(g);varilla(shaft,[0,.25,0],[0,h,0],.022,m.acero);for(let i=0;i<4;i++){const blade=caja(shaft,.38,.09,.035,m.acero,0,.28,0);blade.rotation.y=i*Math.PI/2;blade.position.x=.12*Math.cos(i*Math.PI/2);blade.position.z=.12*Math.sin(i*Math.PI/2);}return shaft;}
function puntos(g:THREE.Group,n:number,r:number,color:number){const q=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(r,1),material(color,.12,.5),n);g.add(q);return q;}
function celda(){const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,3.1,2.4);const vessel=grupo(fixed,0,.15,0);vaso(vessel,m,.8,1.45);liquido(vessel,.775,1.1);for(const x of [-.45,.45]){varilla(fixed,[x,1.2,0],[x,1.9,0],.018,m.acero);tubo(fixed,[[x,1.9,0],[x*2,2,.2],[x*2,.3,.9]],.018,x<0?m.goma:m.cobre);}return {root,m,fixed};}
export function reactor():EscenaConstruida{
 const {root,m,fixed}=celda();for(const x of [-.7,.7])varilla(fixed,[x,.1,-.3],[x,1.7,-.3],.04,m.acero);caja(fixed,1.7,.10,.50,m.pintura,0,1.65,0);cilindro(fixed,.16,.4,m.pintura,0,1.92,0);for(const s of [-1,1])tubo(fixed,[[s*1.25,.45,0],[s*1.25,1.5,0],[s*.72,1.5,0],[s*.72,1,0]],.025,m.acero);fusionar(fixed);const stirrer=agitador(root,m,1.7),particles=puntos(root,120,.025,0x62c9bd),o=new THREE.Object3D();

 pieza(stirrer,'Agitador y mezcla','Modifica el caudal para explorar el tiempo de residencia del reactor.',0);pieza(particles,'Especie reactiva','Cambia la concentración de alimentación y compara la respuesta del efluente.',1);
 return {root,direction:[1.2,1,2.7],update(v,p,t){stirrer.rotation.y=t*5;for(let i=0;i<120;i++){const a=i*2.399963+t*5,r=.65*Math.sqrt((i+.5)/120);o.position.set(r*Math.cos(a),.34+(i%13)*.065,r*Math.sin(a));o.scale.setScalar(i<120*v.concentration/p.feed?1:.00001);o.updateMatrix();particles.setMatrixAt(i,o.matrix);}particles.instanceMatrix.needsUpdate=true;}};
}
export function calorimetria():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,2.9,2.2);const cup=grupo(fixed,0,.2,0);const outer=torno(cup,[[.66,0],[.8,0],[.8,1.3],[.72,1.35],[.66,1.3],[.66,0]],m.pintura);outer.geometry.dispose();outer.geometry=new THREE.LatheGeometry([[.66,0],[.8,0],[.8,1.3],[.72,1.35],[.66,1.3],[.66,0]].map(p=>new THREE.Vector2(...p)),48,Math.PI*.32,Math.PI*1.7);vaso(cup,m,.64,1.25);liquido(cup,.615,.95,0x4babb1);cilindro(fixed,.80,.09,m.negro,0,1.56,0);varilla(fixed,[.25,.65,0],[.25,1.9,0],.023,m.acero);const sensor=cilindro(root,.018,.65,new THREE.MeshBasicMaterial({color:0xe4a478}),.25,.95,0);pieza(cup,'Calorímetro en sección','Explora la respuesta del ensayo al cambiar la concentración.',0);fusionar(fixed);

 pieza(sensor,'Sonda térmica','Cambia el volumen de mezcla y contrasta la señal térmica.',1);
 return {root,direction:[1.7,1,2.5],update(v){sensor.scale.y=.65+(v.temperature-22)/20;sensor.position.y=.625+.325*sensor.scale.y;}};
}
export function precipitacion():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,3.2,2.2);const vessel=grupo(fixed,0,.15,0);vaso(vessel,m,.75,1.5);liquido(vessel,.72,1.05,0x3778b4);varilla(fixed,[-1,.1,0],[-1,2.0,0],.03,m.acero);varilla(fixed,[-1,1.95,0],[0,1.95,0],.03,m.acero);const dropper=torno(fixed,[[.03,0],[.08,.1],[.08,.65],[.03,.7],[.03,0]],m.vidrio,0,1.45,0);dropper.name='dosificador-ph';pieza(dropper,'Dosificador de reactivo','Modifica el pH y observa qué especie precipita.',0);fusionar(fixed);
 const copper=puntos(root,120,.037,0x4bb7c0),magnesium=puntos(root,120,.037,0xc0c7c0),o=new THREE.Object3D();

 pieza(copper,'Precipitado de cobre','Explora la escala de recuperación al modificar el volumen tratado.',1);
 return {root,direction:[1.2,1.2,2.7],update(v){for(let j=0;j<2;j++){const fraction=j===0?v.recovery:1-v.mg/.01,q=j===0?copper:magnesium;for(let i=0;i<120;i++){const a=i*2.399963,r=.66*Math.sqrt((i+.5)/120);o.position.set(r*Math.cos(a),.25+Math.floor(i/30)*.055+(j*.025),r*Math.sin(a));o.scale.setScalar(i<120*fraction?1:.00001);o.updateMatrix();q.setMatrixAt(i,o.matrix);}q.instanceMatrix.needsUpdate=true;}}};
}
export function floculacion():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,4.1,2.1);const jars=[-.95,.0,.95].map(x=>{const g=grupo(root,x,.16,0);vaso(g,m,.42,1.35);liquido(g,.40,.95);return g;});for(const x of [-1.5,1.5])varilla(fixed,[x,.1,-.5],[x,1.85,-.5],.04,m.acero);caja(fixed,3.2,.16,.4,m.pintura,0,1.85,-.4);fusionar(fixed);
 const stirrers=jars.map(g=>agitador(g,m,1.75)),flocs=jars.map(g=>puntos(g,80,.035,0xa1b5a3)),o=new THREE.Object3D();

 pieza(jars[0],'Dosis menor','Compara el primer vaso con el ensayo central al cambiar la dosis.',0);pieza(jars[1],'Ensayo central','Explora la agitación y observa el descenso de los flóculos.',1);pieza(jars[2],'Dosis mayor','Compara los tres ensayos bajo la misma duración.',0);
 return {root,direction:[1.2,1.2,2.8],update(_v,p,t){jars.forEach((g,j)=>{const v=modeloFloculos({...p,dose:p.dose*[.6,1,1.4][j]},t).values;stirrers[j].rotation.y=t*p.mixing/20;for(let i=0;i<80;i++){const a=i*2.399963,r=.34*Math.sqrt((i+.5)/80),y=Math.max(.09,.10+(i%11)/11*.80-v.velocity*v.seconds*3.8);o.position.set(r*Math.cos(a),y,r*Math.sin(a));o.scale.setScalar(.5+v.radius/100);o.updateMatrix();flocs[j].setMatrixAt(i,o.matrix);}flocs[j].instanceMatrix.needsUpdate=true;});}};
}
export function adsorcion():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,2.7,2.2);varilla(fixed,[-.85,.1,0],[-.85,2.3,0],.04,m.acero);for(const y of [.55,1.9])varilla(fixed,[-.85,y,0],[0,y,0],.03,m.acero);const vessel=grupo(fixed,0,.38,0);vaso(vessel,m,.40,1.6);for(const y of [.35,1.95]){torno(fixed,[[.33,0],[.48,0],[.48,.08],[.33,.08],[.33,0]],m.acero,0,y,0);}tubo(fixed,[[0,2.0,0],[0,2.3,0],[.9,2.3,0]],.035,m.acero);tubo(fixed,[[0,.40,0],[0,.25,.7],[.85,.25,.7]],.035,m.acero);pieza(vessel,'Columna de tratamiento','Cambia la concentración de entrada y compara el avance del frente.',1);fusionar(fixed);
 const beads=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.055,1),material(0x182d37,.2,.75),260),o=new THREE.Object3D(),color=new THREE.Color();root.add(beads);
 pieza(beads,'Lecho de carbón','Modifica la longitud del lecho y observa la progresión de la saturación.',0);
 return {root,direction:[1.2,.9,2.6],update(v){for(let i=0;i<260;i++){const a=i*2.399963,r=.32*Math.sqrt((i%31+.5)/31),y=.55+(i/260)*1.24,front=Math.min(1,v.minutes/v.breakthrough);o.position.set(r*Math.cos(a),y,r*Math.sin(a));o.updateMatrix();beads.setMatrixAt(i,o.matrix);color.setHex((1-i/260)<front?0x5b8b72:0x18313d);beads.setColorAt(i,color);}beads.instanceMatrix.needsUpdate=true;if(beads.instanceColor)beads.instanceColor.needsUpdate=true;}};
}
export function aleacion():EscenaConstruida{
 const root=new THREE.Group(),m=paleta();banco(root,m,2.9,2.4);const holder=grupo(root);torno(holder,[[.85,0],[1.0,0],[1.0,.1],[.85,.14],[.85,0]],m.acero,0,.12,0);const liquid=cilindro(root,.84,.50,new THREE.MeshPhysicalMaterial({color:0xc39961,metalness:.8,roughness:.2,transparent:true,opacity:.3}),0,.43,0),grains=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.115,1),m.aluminio,100),o=new THREE.Object3D();root.add(grains);fusionar(holder);

 pieza(grains,'Granos de fase sólida','Cambia la temperatura y observa la fracción de fase sólida.',0);pieza(liquid,'Fase líquida','Modifica la composición y contrasta el equilibrio de fases.',1);
 return {root,direction:[1.2,1.7,2.5],update(v){for(let i=0;i<100;i++){const a=i*2.399963,r=.70*Math.sqrt((i+.5)/100);o.position.set(r*Math.cos(a),.28+(i%3)*.14,r*Math.sin(a));o.rotation.set(i*.17,i*.51,i*.23);o.scale.setScalar(i<100*v.fraction?1:.00001);o.updateMatrix();grains.setMatrixAt(i,o.matrix);}grains.instanceMatrix.needsUpdate=true;(liquid.material as THREE.MeshPhysicalMaterial).opacity=.06+.35*(1-v.fraction);}};
}
export function corrosion():EscenaConstruida{
 const {root,m,fixed}=celda();const specimen=caja(root,.48,1.15,.09,m.acero,0,.90,0),oxide=caja(root,.49,1.15,.009,material(0x9a5a3b,.15,.7),0,.90,.05);for(const x of [-.5,.5])varilla(fixed,[x,.55,0],[x,1.4,0],.018,m.acero);fusionar(fixed);

 pieza(specimen,'Probeta metálica','Modifica el potencial para explorar el estado activo o pasivo.',0);pieza(oxide,'Capa superficial','Cambia la duración de exposición y observa la pérdida de material ampliada.',1);
 return {root,direction:[1.3,1,2.6],update(v){const loss=Math.min(.06,v.loss*50);specimen.scale.z=Math.max(.12,1-loss/.09);oxide.position.z=.05-loss/2;(oxide.material as THREE.MeshStandardMaterial).color.setHSL(.07+v.passive*.07,.45,.22+.15*v.passive);}};
}
export function deposito():EscenaConstruida{
 const {root,m,fixed}=celda();const cathode=caja(fixed,.55,.9,.04,m.acero,.32,.85,0);caja(fixed,.55,.9,.04,m.cobre,-.32,.85,0);pieza(cathode,'Cátodo de depósito','Modifica la corriente que atraviesa la celda.',0);fusionar(fixed);void cathode;const coat=caja(root,.56,.91,.006,m.cobre,.32,.85,.027);
 pieza(coat,'Recubrimiento','Cambia el tiempo de depósito y compara el crecimiento del espesor ampliado.',1);
 return {root,direction:[1.3,1,2.6],update(v){coat.scale.z=.12+v.thickness*3;coat.position.z=.022+.003*coat.scale.z;}};
}
export function electrolisis():EscenaConstruida{
 const {root,m,fixed}=celda();for(const x of [-.35,.35]){varilla(fixed,[x,.35,0],[x,1.35,0],.03,m.acero);torno(fixed,[[.13,0],[.16,0],[.16,1.35],[.13,1.35],[.13,0]],m.vidrio,x,.35,0);}caja(fixed,.025,1.0,1.1,m.vidrio,0,.78,0);fusionar(fixed);const gases=[-.35,.35].map((x,j)=>cilindro(root,.12,1,new THREE.MeshPhysicalMaterial({color:j?0x7fc4dc:0x8bdfc5,transparent:true,opacity:.25}),x,1.50,0)),bubbles=puntos(root,60,.018,0xace5e2),o=new THREE.Object3D();

 pieza(gases[0],'Colector de hidrógeno','Cambia la corriente y observa la acumulación relativa de gas.',0);pieza(gases[1],'Colector de oxígeno','Modifica el voltaje y contrasta el balance energético del ensayo.',1);
 return {root,direction:[1.3,1,2.6],update(v,p,t){gases.forEach((q,j)=>{const h=v.moles*300/(j?2:1);q.scale.y=Math.max(.0001,h);q.position.y=1.62-h/2;});for(let i=0;i<60;i++){const j=i<40?0:1,f=(t*p.current/20+i/60)%1;o.position.set(j?.35:-.35,.40+f*.9,.06*Math.sin(i*2.4));o.scale.setScalar(.6+.4*f);o.updateMatrix();bubbles.setMatrixAt(i,o.matrix);}bubbles.instanceMatrix.needsUpdate=true;}};
}
