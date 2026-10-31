import {pieza} from './inspeccion';
import {MarchingCubes} from 'three/examples/jsm/objects/MarchingCubes.js';
import {THREE,grupo,varilla,material,mesh,paleta,type EscenaConstruida} from './kit';
type Estructura={id:string;chains:Record<string,[number,number,number][]>};
const cache=new Map<string,Estructura>();
export async function prepararProteina(id:string){const code=id==='biologia-11'?'1lyz':id==='biologia-12'?'2xnd':null;if(!code||cache.has(code))return;const res=await fetch('/labs-data/ciencias/estructuras/'+code+'.json');if(!res.ok)throw Error('No se pudo cargar la estructura experimental');cache.set(code,await res.json());}
function centro(points:THREE.Vector3[]){return points.reduce((a,b)=>a.add(b),new THREE.Vector3()).divideScalar(points.length);}
function proteina(parent:THREE.Group,coords:THREE.Vector3[],color:number,scale:number,chain:string){
 const bounds=new THREE.Box3().setFromPoints(coords),center=bounds.getCenter(new THREE.Vector3()),extent=bounds.getSize(new THREE.Vector3()),span=Math.max(extent.x,extent.y,extent.z)+16,m=material(color,.12,.4),field=new MarchingCubes(32,m,false,false,18000);m.transparent=true;m.opacity=.24;m.depthWrite=false;field.isolation=65;
 for(const p of coords){const q=p.clone().sub(center).divideScalar(span).addScalar(.5);field.addBall(q.x,q.y,q.z,77*(3.5/span)**2,12);}field.update();
 const geo=new THREE.BufferGeometry();for(const key of ['position','normal']){const attr=field.geometry.getAttribute(key);geo.setAttribute(key,new THREE.Float32BufferAttribute((attr.array as Float32Array).slice(0,field.count*3),3));}field.geometry.dispose();geo.computeBoundingSphere();const shell=mesh(parent,geo,m);shell.scale.setScalar(span*scale/2);shell.position.copy(center).multiplyScalar(scale);
 const path=new THREE.CatmullRomCurve3(coords.map(p=>p.clone().multiplyScalar(scale))),backbone=mesh(parent,new THREE.TubeGeometry(path,Math.min(1200,coords.length*2),.72*scale,7,false),material(color,.08,.4));backbone.name='traza-carbono-alfa';shell.name='envolvente-calfa';
 // One bead per deposited Cα, not invented side chains or inferred secondary structure.
 const residues=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.12*scale,scale>.05?1:0),material(color,.16,.32),coords.length),o=new THREE.Object3D();
 coords.forEach((p,i)=>{o.position.copy(p).multiplyScalar(scale);o.updateMatrix();residues.setMatrixAt(i,o.matrix);});residues.name='residuos-carbono-alfa';residues.userData.sourceChain=chain;parent.add(residues);
}
export function enzimas():EscenaConstruida{
 const pdb=cache.get('1lyz');if(!pdb)throw Error('Falta1LYZ');const root=new THREE.Group(),coords=pdb.chains.A.map(p=>new THREE.Vector3(...p)),center=centro(coords);coords.forEach(p=>p.sub(center));const orient=new THREE.Quaternion().setFromUnitVectors(coords[34].clone().add(coords[51]).normalize(),new THREE.Vector3(.4,.2,.9).normalize());coords.forEach(p=>p.applyQuaternion(orient));proteina(root,coords,0x519fb2,.065,'A');
 const active=coords[34].clone().add(coords[51]).multiplyScalar(.5*.065),m=paleta();const site=mesh(root,new THREE.SphereGeometry(.14,24,16),new THREE.MeshBasicMaterial({color:0xf3b76d,transparent:true,opacity:.6}));site.position.copy(active);site.name='region-catalitica-esquematica';
 const substrates=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.075,1),m.cobre,40),products=new THREE.InstancedMesh(new THREE.OctahedronGeometry(.046,0),material(0x7ce3bf,.1,.3),80),inhibitors=new THREE.InstancedMesh(new THREE.TetrahedronGeometry(.10,0),material(0xbf8fe8,.1,.3),12),o=new THREE.Object3D();root.add(substrates,products,inhibitors);
 root.position.y=2;
 pieza(site,'Región catalítica','Cambia la concentración de sustrato y observa su encuentro con la enzima.',0);pieza(inhibitors,'Inhibidor competitivo','Modifica la concentración de inhibidor y contrasta la transformación de sustrato.',1);
 return {root,direction:[1.2,.6,2.6],update(v,p,t){for(let i=0;i<40;i++){const phase=(t*v.rate/300+i/40)%1,a=i*2.399963,r=.5+.4*(i%5)/5,pos=new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,2.0).lerp(active,phase);o.position.copy(pos);o.scale.setScalar(i<Math.max(1,p.substrate*4)?1:.00001);o.updateMatrix();substrates.setMatrixAt(i,o.matrix);for(let j=0;j<2;j++){const q=active.clone().lerp(new THREE.Vector3(-1.8,Math.sin(a+j*.4)*1.2,Math.cos(a+j*.4)*1.3),phase);o.position.copy(q);o.scale.setScalar(i<Math.max(1,p.substrate*4)?1:.00001);o.updateMatrix();products.setMatrixAt(i*2+j,o.matrix);}}for(let i=0;i<12;i++){const a=i*2.399963+t*v.rate/600;o.position.set(active.x+.4*Math.cos(a),active.y+.4*Math.sin(a),active.z+.15);o.scale.setScalar(i<p.inhibitor*2?1:.00001);o.updateMatrix();inhibitors.setMatrixAt(i,o.matrix);}substrates.instanceMatrix.needsUpdate=products.instanceMatrix.needsUpdate=inhibitors.instanceMatrix.needsUpdate=true;}};
}
export function atp():EscenaConstruida{
 const pdb=cache.get('2xnd');if(!pdb)throw Error('Falta2XND');const root=new THREE.Group(),rotor=grupo(root),fixed=grupo(root),m=paleta(),chains=Object.fromEntries(Object.entries(pdb.chains).map(([k,points])=>[k,points.map(p=>new THREE.Vector3(...p))]));
 const ring=centro(Object.entries(chains).filter(([k])=>k>='J').flatMap(([,v])=>v)),head=centro(['A','B','C','D','E','F'].flatMap(k=>chains[k])),axis=head.clone().sub(ring).normalize(),q=new THREE.Quaternion().setFromUnitVectors(axis,new THREE.Vector3(0,1,0));
 for(const [k,coords]of Object.entries(chains)){coords.forEach(p=>p.sub(ring).applyQuaternion(q));const rotating='GHIJKLMNOPQ'.includes(k);proteina(rotating?rotor:fixed,coords,k>='J'?0xd6a45e:k>='G'?0xc1b8df:'ABC'.includes(k)?0x498d9e:0x68b9b3,.025,k);}
 const lipidGeo=new THREE.SphereGeometry(.075,10,8),tailGeo=new THREE.CylinderGeometry(.012,.012,.22,5),lipidMaterial=material(0x638a9b,.1,.55),tailMaterial=material(0x366476,.1,.7),membrane=grupo(root),obj=new THREE.Object3D();
 for(const side of [-1,1]){const leaflet=grupo(membrane);leaflet.name=side>0?'monocapa-superior':'monocapa-inferior';const heads=new THREE.InstancedMesh(lipidGeo,lipidMaterial,500),tails=new THREE.InstancedMesh(tailGeo,tailMaterial,1000);let n=0;
  for(let x=-12;x<=12;x++)for(let z=-9;z<=9;z++){if(x*x+z*z<32)continue;obj.position.set(x*.14,side*.27,z*.14);obj.updateMatrix();heads.setMatrixAt(n,obj.matrix);for(let j=0;j<2;j++){obj.position.set(x*.14+(j-.5)*.035,side*.13,z*.14);obj.rotation.z=(j-.5)*.16;obj.updateMatrix();tails.setMatrixAt(n*2+j,obj.matrix);}obj.rotation.set(0,0,0);n++;}heads.count=n;tails.count=n*2;leaflet.add(heads,tails);
 }
 const heads=membrane;
 // Peripheral support is schematic: the deposited structure is an F1-c8 subcomplex.
 varilla(fixed,[.70,-.10,0],[.70,2.1,0],.065,m.acero);varilla(fixed,[.70,2.1,0],[0,2.25,0],.055,m.acero);
 rotor.name='rotor-c8';const protons=new THREE.InstancedMesh(new THREE.SphereGeometry(.028,10,8),new THREE.MeshBasicMaterial({color:0xffd18b}),32),atps=new THREE.InstancedMesh(new THREE.OctahedronGeometry(.055,0),material(0x9ce7bb,.1,.3),18);protons.name='protones-c8';atps.name='productos-atp';root.add(protons,atps);
 root.position.y=.4;
 pieza(rotor,'Rotor c8','Cambia el gradiente y sigue el giro del complejo.',0);pieza(fixed,'Cabeza catalítica F1','Modifica la energía requerida para explorar el acoplamiento energético.',1);pieza(heads,'Bicapa lipídica','Observa el complejo desde el plano de la membrana.',0);
 return {root,direction:[1.2,.8,2.7],update(v,_p,t){rotor.rotation.y=v.angle;for(let i=0;i<32;i++){const f=(t*v.flux/3200+i/32)%1,a=f*Math.PI*2;obj.position.set(.5*Math.cos(a),.5-f,.5*Math.sin(a));obj.scale.setScalar(v.flux>0?1:.00001);obj.updateMatrix();protons.setMatrixAt(i,obj.matrix);}for(let i=0;i<18;i++){const f=(t*v.rate/1800+i/18)%1,a=(i%3)*Math.PI*2/3;obj.position.set(Math.cos(a)*(.55+f*.7),1.6+f*.8,Math.sin(a)*(.55+f*.7));obj.scale.setScalar(v.rate>0?1:.00001);obj.updateMatrix();atps.setMatrixAt(i,obj.matrix);}protons.instanceMatrix.needsUpdate=atps.instanceMatrix.needsUpdate=true;}};
}
