import {pieza} from './inspeccion';
import {THREE,grupo,caja,cilindro,torno,esfera,varilla,tubo,mesh,fusionar,paleta,banco,type EscenaConstruida} from './kit';
export function espectrometro():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,4.4,4.4);const field=grupo(root),sector=new THREE.CylinderGeometry(1,1,.12,64,1,false,0,Math.PI);
 for(const side of [-1,1])mesh(field,sector,side>0?m.pintura:m.negro,0,.60+side*.24,0);
 const rim=mesh(field,new THREE.TorusGeometry(1.06,.04,10,64,Math.PI),m.acero,0,.25,0);rim.rotation.x=-Math.PI/2;rim.rotation.z=-Math.PI/2;
 const source=grupo(fixed,-1.3,.6,.65);const sourceTube=cilindro(source,.13,.55,m.pintura);sourceTube.rotation.z=Math.PI/2;for(const x of [-1.1,-.9]){const electrode=mesh(fixed,new THREE.TorusGeometry(.10,.018,8,32),m.cobre,x,.6,.65);electrode.rotation.y=Math.PI/2;}fusionar(fixed);
 const detector=caja(root,.18,.35,.20,m.pintura,-.7,.6,-1),pathGeo=new THREE.BufferGeometry().setFromPoints(Array.from({length:129},()=>new THREE.Vector3())),path=new THREE.Line(pathGeo,new THREE.LineBasicMaterial({color:0x71e6d4}));root.add(path);const ions=new THREE.InstancedMesh(new THREE.SphereGeometry(.025,12,8),new THREE.MeshBasicMaterial({color:0xffd695}),24),obj=new THREE.Object3D();root.add(ions);

 pieza(field,'Sector magnético','Varía el campo y observa la curvatura de las trayectorias.',1);pieza(ions,'Paquete de iones','Modifica el potencial de aceleración y sigue la trayectoria hasta el detector.',0);
 return {root,direction:[1.1,2.4,2.1],update(v,_p,t){const radius=v.radius*9;field.position.set(-.7,0,.65-radius);field.scale.set(radius,1,radius);detector.position.z=.65-2*radius;for(let i=0;i<=128;i++){const a=i*Math.PI/128;pathGeo.attributes.position.setXYZ(i,-.7+radius*Math.sin(a),.6,.65-radius*(1-Math.cos(a)));}pathGeo.attributes.position.needsUpdate=true;pathGeo.computeBoundingSphere();for(let i=0;i<24;i++){const a=(t*v.speed/v.radius*1e-6+i/24*Math.PI)%Math.PI;obj.position.set(-.7+radius*Math.sin(a),.6,.65-radius*(1-Math.cos(a)));obj.updateMatrix();ions.setMatrixAt(i,obj.matrix);}ions.instanceMatrix.needsUpdate=true;}};
}
export function hall():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,3.4,2.1);const plate=caja(fixed,2,.045,.7,m.cobre,0,.75,0);plate.name='lamina-hall';for(const x of [-1.1,1.1]){caja(fixed,.25,.2,.85,m.pintura,x,.7,0);varilla(fixed,[x,.1,0],[x,.6,0],.05,m.acero);}for(const z of [-.5,.5])tubo(fixed,[[0,.75,z*.7],[0,.4,z],[1.4,.2,z]],.018,m.goma);const magnet=torno(fixed,[[.42,-.45],[.56,-.45],[.56,.45],[.42,.45],[.42,-.45]],m.acero,0,.80,0);magnet.rotation.x=Math.PI/2;pieza(plate,'Lámina conductora','Varía la corriente de excitación y observa los portadores.',0);pieza(magnet,'Región magnética','Cambia el campo transversal y contrasta la separación lateral.',1);fusionar(fixed);
 const carriers=new THREE.InstancedMesh(new THREE.SphereGeometry(.025,12,8),new THREE.MeshBasicMaterial({color:0x67e5ed}),72),o=new THREE.Object3D(),lines=grupo(root);for(let i=0;i<7;i++){varilla(lines,[-.75+i*.25,.25,-.25],[-.75+i*.25,1.25,-.25],.006,new THREE.MeshBasicMaterial({color:0x7baab9,transparent:true,opacity:.3}));}fusionar(lines);root.add(carriers);


 return {root,direction:[1.3,1.2,2.6],update(v,p,t){for(let i=0;i<72;i++){o.position.set(-.95+((t*p.current/18+i/72)%1)*1.9,.79,(i%6-2.5)*.085+.06*p.field);o.updateMatrix();carriers.setMatrixAt(i,o.matrix);}carriers.instanceMatrix.needsUpdate=true;lines.scale.y=.5+p.field;}};
}
export function giroscopio():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,2.6,2.1);torno(fixed,[[0,0],[.45,0],[.48,.08],[.28,.16],[.09,.22],[.09,1.3],[0,1.3]],m.pintura,0,.08,0);fusionar(fixed);
 const precession=grupo(root,0,1.38,0),tilt=grupo(precession),frame=grupo(tilt,.55,0,0),wheel=grupo(frame);varilla(tilt,[-.3,0,0],[1.2,0,0],.035,m.acero);for(const x of [-.2,.2]){const ring=mesh(frame,new THREE.TorusGeometry(.54,.025,10,64),m.acero,x,0,0);ring.rotation.y=Math.PI/2;}const rim=torno(wheel,[[.38,-.075],[.47,-.075],[.50,-.04],[.50,.04],[.47,.075],[.38,.075],[.38,-.075]],m.cobre);rim.rotation.z=Math.PI/2;const hub=cilindro(wheel,.13,.15,m.acero);hub.rotation.z=Math.PI/2;for(let i=0;i<8;i++){const a=i*Math.PI/4;varilla(wheel,[0,.10*Math.cos(a),.10*Math.sin(a)],[0,.42*Math.cos(a),.42*Math.sin(a)],.025,m.pintura);}esfera(tilt,.10,m.cobre,0,0,0);

 pieza(wheel,'Volante de inercia','Cambia la velocidad de giro y observa la precesión.',0);pieza(tilt,'Brazo de carga','Modifica la longitud del brazo y sigue el movimiento del conjunto.',1);
 return {root,direction:[1.2,.8,2.5],update(v,p){precession.rotation.y=v.angle;wheel.rotation.x=v.spin;frame.position.x=p.arm/100*10;}};
}
