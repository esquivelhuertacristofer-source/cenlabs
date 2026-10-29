import {pieza} from './inspeccion';
import {THREE,grupo,caja,cilindro,torno,esfera,varilla,mesh,fusionar,paleta,banco,material,type EscenaConstruida} from './kit';
export function conduccion():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,3.5,2.3);for(const x of [-1.3,1.3]){caja(fixed,.24,1.55,1.55,m.acero,x,.9,0);for(const z of [-.85,.85])varilla(fixed,[x,.15,z],[x,1.6,z],.028,m.acero);}for(const y of [.35,1.45])for(const z of [-.8,.8])varilla(fixed,[-1.4,y,z],[1.4,y,z],.024,m.acero);fusionar(fixed);
 const mats=[material(0xbb7951,.2,.45),material(0x5a94ac,.1,.55)],layers=mats.map((mat,i)=>caja(root,1,1.35,1.4,mat,i? .5:-.5,.9,0)),heat=new THREE.InstancedMesh(new THREE.ConeGeometry(.028,.10,8),new THREE.MeshBasicMaterial({color:0xffc08b}),40),o=new THREE.Object3D();root.add(heat);

 pieza(layers[0],'Primera capa','Cambia el espesor de la capa y observa la posición de la interfaz.',0);pieza(layers[1],'Segunda capa','Ajusta la conductividad y compara la respuesta térmica del conjunto.',1);
 return {root,direction:[1.4,1.1,2.7],update(v,_p,t){const total=v.L1+v.L2,w1=2.35*v.L1/total,w2=2.35*v.L2/total;layers[0].scale.x=w1;layers[0].position.x=-1.175+w1/2;layers[1].scale.x=w2;layers[1].position.x=1.175-w2/2;mats[0].color.setHSL(.02+.50*(80-(80+v.interfaceT)/2)/60,.6,.35);mats[1].color.setHSL(.02+.50*(80-(20+v.interfaceT)/2)/60,.6,.35);for(let i=0;i<40;i++){o.position.set(-1.25+((t*v.flux/300+i/40)%1)*2.5,.40+(i%5)*.25,-.55+Math.floor(i/5)*.15);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(1,0,0));o.updateMatrix();heat.setMatrixAt(i,o.matrix);}heat.instanceMatrix.needsUpdate=true;}};
}
export function solar():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,3.3,2.2);for(const x of [-.9,.9])varilla(fixed,[x,.08,0],[x,.65,0],.04,m.acero);const plate=caja(root,2.4,.08,1.65,material(0x263e4b,.25,.6),0,.7,0);plate.rotation.z=-.15;const lamp=grupo(fixed,-.65,2.2,0);const shade=torno(lamp,[[.18,-.25],[.24,-.25],[.45,.1],[.44,.13],[.15,-.20],[.18,-.25]],m.acero);shade.rotation.z=.2;pieza(lamp,'Fuente de irradiación','Modifica la irradiancia y sigue la evolución de la temperatura.',0);fusionar(fixed);
 const rays=new THREE.InstancedMesh(new THREE.CylinderGeometry(.006,.006,.22,6),new THREE.MeshBasicMaterial({color:0xffd79b,transparent:true,opacity:.55}),36),o=new THREE.Object3D();root.add(rays);

 pieza(plate,'Placa absorbente','Cambia la emisividad para investigar el intercambio radiativo.',1);
 return {root,direction:[1.1,1.3,2.5],update(v,p,t){(plate.material as THREE.MeshStandardMaterial).color.setHSL(.60-.58*Math.min(1,(v.T-293.15)/160),.4,.24);for(let i=0;i<36;i++){const f=(t*p.irradiance/1200+i/36)%1;o.position.set((i%6-2.5)*.29-.25*(1-f),2.1-1.3*f,(Math.floor(i/6)-2.5)*.22);o.rotation.z=-.15;o.updateMatrix();rays.setMatrixAt(i,o.matrix);}rays.instanceMatrix.needsUpdate=true;}};
}
export function golpe():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,4,1.7);const pipe=torno(fixed,[[.17,-1.6],[.20,-1.6],[.20,1.6],[.17,1.6],[.17,-1.6]],m.vidrio,0,.75,0);pipe.rotation.z=Math.PI/2;for(const x of [-1.6,-.7,.7,1.6]){const flange=mesh(fixed,new THREE.TorusGeometry(.22,.045,8,40),m.acero,x,.75,0);flange.rotation.y=Math.PI/2;if(Math.abs(x)>1){varilla(fixed,[x,.1,0],[x,.52,0],.055,m.pintura);}}
 const valve=grupo(root,1.45,.75,0),disk=cilindro(valve,.17,.025,m.cobre);disk.rotation.z=Math.PI/2;varilla(fixed,[1.45,.75,0],[1.45,1.35,0],.025,m.acero);mesh(fixed,new THREE.TorusGeometry(.16,.025,8,40),m.pintura,1.45,1.35,0);fusionar(fixed);
 const waveMat=new THREE.MeshBasicMaterial({color:0xd68d67,transparent:true,opacity:.30}),front=cilindro(root,.166,.09,waveMat,0,.75,0);front.rotation.z=Math.PI/2;

 pieza(valve,'Válvula de cierre','Explora un cierre rápido o lento y observa la onda que recorre la tubería.',1);pieza(front,'Frente de presión','Modifica la velocidad inicial para contrastar la intensidad de la perturbación.',0);
 return {root,direction:[.7,1.1,3],update(v){valve.rotation.y=Math.PI/2*Math.max(0,1-v.physical/v.closing);const progress=(v.physical/v.critical*2)%4,position=progress<2?1.45-progress*1.45:-1.45+(progress-2)*1.45;front.position.x=position;waveMat.opacity=.12+.4*Math.min(1,v.dp/2e6);}};
}
export function capilaridad():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,2.7,2.0);torno(fixed,[[.75,0],[.8,0],[.8,.65],[.76,.68],[.75,.1],[0,.1],[0,0]],m.vidrio,0,.13,0);const liquid=cilindro(fixed,.735,.45,new THREE.MeshPhysicalMaterial({color:0x348fa9,roughness:.2,transparent:true,opacity:.35}),0,.45,0);
 varilla(fixed,[-.95,.1,0],[-.95,2.15,0],.035,m.acero);varilla(fixed,[-.95,1.9,0],[0,1.9,0],.03,m.acero);const capillary=torno(root,[[.038,0],[.055,0],[.055,1.8],[.038,1.8],[.038,0]],m.vidrio,0,.45,0),water=cilindro(root,.035,1,material(0x39a4bc,.05,.2),0,.45,0),meniscus=esfera(root,.038,water.material,0,.5,0);meniscus.scale.y=.25;fusionar(fixed);void liquid;

 pieza(capillary,'Microcanal','Varía el radio del tubo y sigue el ascenso del menisco.',0);pieza(meniscus,'Menisco','Cambia el ángulo de contacto para explorar la mojabilidad.',1);
 return {root,direction:[1.3,.9,2.9],update(v){const h=v.height*15;water.scale.y=Math.max(.0001,h);water.position.y=.45+h/2;meniscus.position.y=.45+h;capillary.scale.x=capillary.scale.z=v.r/.0004;water.scale.x=water.scale.z=meniscus.scale.x=meniscus.scale.z=v.r/.0004;}};
}
