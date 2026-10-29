import {pieza} from './inspeccion';
import {THREE,grupo,caja,cilindro,torno,esfera,varilla,tubo,fusionar,paleta,banco,material,type EscenaConstruida} from './kit';
export function hplc():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,4.4,2.8);for(const x of [-1.7,-1.2]){torno(fixed,[[0,0],[.16,0],[.16,.55],[.08,.65],[.08,.75],[0,.75]],m.vidrio,x,.17,-.7);cilindro(fixed,.085,.08,m.negro,x,.94,-.7);}caja(fixed,.65,.55,.65,m.pintura,-1.45,.5,.45);for(const x of [-1.65,-1.25]){const head=cilindro(fixed,.10,.15,m.acero,x,.5,.84);head.rotation.x=Math.PI/2;}
 const column=torno(fixed,[[.10,-1.1],[.14,-1.1],[.14,1.1],[.10,1.1],[.10,-1.1]],m.vidrio,.25,.85,0);column.rotation.z=Math.PI/2;for(const x of [-.9,1.4]){const cap=cilindro(fixed,.18,.13,m.acero,x,.85,0,12);cap.rotation.z=Math.PI/2;varilla(fixed,[x,.2,0],[x,.65,0],.04,m.acero);}tubo(fixed,[[-1.2,.94,-.7],[-.95,1.2,-.6],[-1.4,.75,.2],[-.9,.85,0]],.018,m.acero);tubo(fixed,[[1.5,.85,0],[1.8,.85,.3],[1.8,.45,.55]],.018,m.acero);caja(fixed,.45,.45,.55,m.pintura,1.75,.4,.55);pieza(column,'Columna cromatográfica','Cambia el caudal y sigue la migración de las bandas.',0);fusionar(fixed);
 const colors=[0x6ccdc9,0xc19cdd],bands=colors.map(color=>{const q=cilindro(root,.097,.12,new THREE.MeshPhysicalMaterial({color,transparent:true,opacity:.6,roughness:.3}),0,.85,0);q.rotation.z=Math.PI/2;return q;}),packing=new THREE.InstancedMesh(new THREE.SphereGeometry(.016,6,4),material(0x9ab3bf,.2,.6),300),obj=new THREE.Object3D();for(let i=0;i<300;i++){const a=i*2.399963,r=.085*Math.sqrt((i%17+.5)/17);obj.position.set(-.8+(i/300)*2.1,.85+r*Math.cos(a),r*Math.sin(a));obj.updateMatrix();packing.setMatrixAt(i,obj.matrix);}root.add(packing);

 pieza(packing,'Fase estacionaria','Modifica la selectividad y contrasta la separación de los analitos.',1);
 return {root,direction:[.7,1.3,2.8],update(v){bands.forEach((q,j)=>{const tr=j?v.tr2:v.tr1,s=j?v.w2/4:v.w1/4,f=v.minutes/tr;q.position.x=-.8+Math.min(1.05,f)*2.1;q.scale.y=Math.max(.1,s/tr*14);q.visible=f<=1.05;});}};
}
export function ftir():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=grupo(root);banco(root,m,3.8,2.8);const points:[[number,number,number],[number,number,number],[number,number,number],[number,number,number]]=[[-1.3,.65,0],[0,.65,0],[0,.65,-.95],[1.15,.65,0]];for(const p of points){caja(fixed,.25,.12,.35,m.pintura,p[0],.2,p[2]);varilla(fixed,[p[0],.2,p[2]],p,.025,m.acero);}const source=cilindro(fixed,.15,.4,m.acero,-1.3,.65,0);source.rotation.z=Math.PI/2;
 for(const z of [-.95,.95]){const mirror=caja(fixed,.45,.5,.025,m.aluminio,0,.65,z);mirror.name='espejo-interferometro';}const splitter=caja(fixed,.42,.5,.018,m.vidrio,0,.65,0);splitter.rotation.y=Math.PI/4;const detector=cilindro(fixed,.15,.3,m.pintura,1.2,.65,0);detector.rotation.z=Math.PI/2;
 const beamMat=new THREE.MeshBasicMaterial({color:0xe2aa81,transparent:true,opacity:.35});varilla(fixed,[-1.1,.65,0],[1,.65,0],.012,beamMat);varilla(fixed,[0,.65,-.95],[0,.65,.95],.012,beamMat);fusionar(fixed);
 const molecule=grupo(root,.65,1.25,.45),carbon=esfera(molecule,.14,material(0x2a4554,.2,.4),-.25,0,0),oxygen=esfera(molecule,.17,material(0xc6786c,.1,.4),.25,0,0),bonds=[-.04,.04].map(z=>varilla(molecule,[-.2,0,z],[.2,0,z],.022,m.aluminio));void carbon;

 pieza(molecule,'Enlace molecular','Cambia la rigidez del enlace y observa la vibración.',0);pieza(oxygen,'Isótopo del oxígeno','Cambia la masa isotópica y contrasta la vibración y el espectro.',1);
 return {root,direction:[1.3,1.4,2.8],update(v){oxygen.position.x=.25+v.displacement;for(const bond of bonds){bond.scale.y=.4+v.displacement;bond.position.x=v.displacement/2;}}};
}
