import {pieza} from './inspeccion';
import {THREE,grupo,caja,cilindro,torno,esfera,varilla,mesh,fusionar,paleta,banco,material,setVarilla,type EscenaConstruida} from './kit';
import {landscape,erroresTolerancia} from '@/domain/ciencias/decisiones';
export function vectores():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,3.4,2.7);const part=torno(fixed,[[.3,0],[.8,0],[.8,.15],[.5,.25],[.5,.65],[.3,.72],[.3,0]],m.acero,-.6,.15,-.4);part.name='pieza-cad';for(const z of [-.8,.8])varilla(fixed,[-1.4,.25,z],[1.4,.25,z],.015,m.cobre);fusionar(fixed);
 const plane=mesh(root,new THREE.PlaneGeometry(3.5,3),new THREE.MeshPhysicalMaterial({color:0x6299b4,metalness:.1,roughness:.5,transparent:true,opacity:.18,side:THREE.DoubleSide}));const normal=new THREE.Vector3(1,2,2).normalize();plane.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);plane.position.copy(normal).multiplyScalar(4/3*.38).add(new THREE.Vector3(0,.7,0));const P=esfera(root,.07,m.cobre),H=esfera(root,.05,m.pintura),projection=varilla(root,[0,0,0],[1,0,0],.016,m.cobre);

 pieza(P,'Punto exterior','Modifica la coordenada horizontal y observa el pie de la proyección.',0);pieza(H,'Proyección ortogonal','Cambia la coordenada vertical y explora la perpendicular al plano.',1);
 return {root,direction:[1.3,.9,2.6],update(v){const a:[number,number,number]=[v.x*.38,.7+v.y*.38,v.z*.38],b:[number,number,number]=[v.px*.38,.7+v.py*.38,v.pz*.38];P.position.set(...a);H.position.set(...b);setVarilla(projection,a,b);}};
}
export function programacion():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,3.9,2.6);const tanks=[-.9,.9].map(x=>{const g=grupo(root,x,.18,0);torno(g,[[0,0],[.43,0],[.50,.1],[.50,1.5],[.43,1.6],[0,1.6]],m.vidrio);torno(fixed,[[.40,0],[.54,0],[.54,.10],[.40,.10],[.40,0]],m.acero,x,.15,0);varilla(fixed,[x,.1,-.6],[x,1.9,-.6],.035,m.acero);return g;});fusionar(fixed);const fills=tanks.map((g,i)=>cilindro(g,.45,1,new THREE.MeshPhysicalMaterial({color:i?0xc48f63:0x539fac,transparent:true,opacity:.45,roughness:.25}),0,.5,0));

 pieza(tanks[0],'Producto A','Cambia el recurso disponible y observa la distribución de producción.',0);pieza(tanks[1],'Producto B','Modifica el beneficio unitario y contrasta el plan de producción.',1);
 return {root,direction:[1.2,1.1,2.6],update(v,p,t){const progress=Math.min(t,6)/6;fills.forEach((q,j)=>{const h=Math.max(.02,(j?v.y:v.x)/(p.resource/2)*1.38*progress);q.scale.y=h;q.position.y=.1+h/2;});}};
}
export function regresion():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,3.5,2.2);for(const x of [-1.2,1.2])varilla(fixed,[x,.15,0],[x,1.9,0],.06,m.acero);caja(fixed,2.7,.22,.5,m.pintura,0,1.9,0);caja(fixed,1.4,.15,.9,m.acero,0,.35,0);fusionar(fixed);
 const crosshead=grupo(root,0,1.4,0);caja(crosshead,2.4,.14,.4,m.acero);cilindro(crosshead,.16,.20,m.acero,0,-.15,0);const specimen=cilindro(root,.13,.6,m.cobre,0,.75,0),extensometer=varilla(root,[.35,.40,.15],[.35,1,.15],.018,m.pintura);

 pieza(specimen,'Probeta de ensayo','Explora la curvatura del modelo y compárala con los datos registrados.',0);pieza(extensometer,'Extensómetro','Añade un dato atípico y compara su efecto en los residuos.',1);
 return {root,direction:[1.2,1.1,2.7],update(v){const height=.75-v.x*.05;crosshead.position.y=height+.46;specimen.scale.y=height/.6;specimen.position.y=.40+height/2;extensometer.scale.y=.6+v.y*.025;}};
}
export function tolerancias():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,3.6,2.4);caja(fixed,2.8,.16,1.6,m.acero,0,.18,0);for(const x of [-1.3,1.3]){caja(fixed,.18,.8,1.5,m.pintura,x,.61,0);for(const z of [-.6,.6])cilindro(fixed,.045,.035,m.cobre,x,1.03,z,8);}fusionar(fixed);
 const parts=[-.70,0,.70].map((x,i)=>caja(root,.65,.40,1.1,i===1?m.cobre:m.acero,x,.52,0)),gapGauge=varilla(root,[-1.1,1.2,0],[1.1,1.2,0],.012,m.pintura);

 pieza(parts[1],'Pieza central','Modifica la dispersión dimensional y observa la variación del ensamble.',1);pieza(gapGauge,'Separación de montaje','Cambia la holgura nominal y compara las muestras del ensamble.',0);
 return {root,direction:[1.3,1.4,2.6],update(v,p,t){const sample=Math.floor(t*6),errors=erroresTolerancia(p,sample);parts.forEach((q,i)=>{q.scale.x=1+errors[i]*1.5;q.position.x=(i-1)*(.68+p.gap*.5);});gapGauge.position.y=1.05+v.sigma*.8;}};
}
export function gradiente():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),geo=new THREE.PlaneGeometry(6,6,100,100);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,colors=new Float32Array(pos.count*3),color=new THREE.Color();for(let i=0;i<pos.count;i++){const y=landscape(pos.getX(i),pos.getZ(i))*.35;pos.setY(i,y);color.setHSL(.52-y*.17,.42,.26+y*.08);colors[i*3]=color.r;colors[i*3+1]=color.g;colors[i*3+2]=color.b;}geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.computeVertexNormals();const terrain=mesh(root,geo,new THREE.MeshStandardMaterial({vertexColors:true,metalness:.15,roughness:.45,side:THREE.DoubleSide}));caja(root,6.1,.15,6.1,m.negro,0,-.13,0);const probe=esfera(root,.09,m.cobre);

 pieza(probe,'Punto de búsqueda','Cambia la coordenada inicial y observa la trayectoria hacia un mínimo.',0);pieza(terrain,'Superficie de costo','Explora cómo cambia la búsqueda al desplazar el punto en el segundo eje.',1);
 return {root,direction:[1.4,1.8,2.4],update(v){probe.position.set(v.x,landscape(v.x,v.z)*.35+.11,v.z);}};
}
export function integral():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,4.2,3.1);for(const x of [-1.65,1.65])for(const z of [-1,1]){caja(fixed,.30,.18,.25,m.acero,x,.24,z);varilla(fixed,[x,.25,z],[x,.55,z],.027,m.cobre);}fusionar(fixed);const holder=grupo(root,0,.35,0),surface=mesh(holder,new THREE.BufferGeometry(),m.aluminio),cells=new THREE.InstancedMesh(new THREE.BoxGeometry(.09,.008,.09),new THREE.MeshBasicMaterial({color:0x62b5ba,transparent:true,opacity:.38}),600),o=new THREE.Object3D();holder.add(cells);const center=esfera(root,.055,m.cobre);let key='';

 pieza(surface,'Placa perforada','Mueve el centro del barreno y observa el dominio de integración.',0);pieza(cells,'Partición del dominio','Modifica el radio del barreno y observa qué elementos quedan fuera de la placa.',1);
 return {root,direction:[1.2,2,2.7],update(v){const current=v.holeX+','+v.radius;if(current!==key){key=current;const shape=new THREE.Shape();shape.moveTo(-1.5,-1);shape.lineTo(1.5,-1);shape.lineTo(1.5,1);shape.lineTo(-1.5,1);shape.closePath();const hole=new THREE.Path();hole.absarc(v.holeX-1.5,0,v.radius,0,Math.PI*2,true);shape.holes.push(hole);surface.geometry.dispose();surface.geometry=new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSegments:3,bevelSize:.008,bevelThickness:.008,curveSegments:64}).rotateX(-Math.PI/2);let count=0;for(let i=0;i<30;i++)for(let j=0;j<20;j++){const x=-1.45+i*.1,z=-.95+j*.1;if((x-(v.holeX-1.5))**2+z*z<v.radius**2)continue;o.position.set(x,.13,z);o.updateMatrix();cells.setMatrixAt(count++,o.matrix);}cells.count=count;cells.instanceMatrix.needsUpdate=true;}center.visible=!!v._accepted;center.position.set(v.centroid-1.5,.56,0);}};
}
export function numericos():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,3.9,2.1);const samples=[-1.1,0,1.1].map(x=>{torno(fixed,[[.33,0],[.43,0],[.43,.10],[.33,.10],[.33,0]],m.acero,x,.15,0);const body=cilindro(root,.30,1.1,material(0xa76e50,.4,.4),x,.8,0);for(let i=0;i<8;i++)torno(fixed,[[.29,0],[.37,0],[.37,.025],[.29,.025],[.29,0]],m.acero,x,.35+i*.12,0);return body;});fusionar(fixed);

 pieza(samples[0],'Aproximación de Euler','Cambia el paso de integración y compara la respuesta de las tres muestras.',0);pieza(samples[1],'Aproximación RK4','Contrasta el efecto del tamaño de paso con la solución de referencia.',0);pieza(samples[2],'Solución de referencia','Compara las aproximaciones con la evolución analítica.',0);
 return {root,direction:[1.2,1.2,2.7],update(v){[v.euler,v.rk,v.exact].forEach((T,i)=>{const normalized=Math.max(0,Math.min(1,(T-20)/60));(samples[i].material as THREE.MeshStandardMaterial).color.setHSL(.55-.50*normalized,.50,.28+.10*normalized);});}};
}
