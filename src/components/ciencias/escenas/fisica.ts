import {pieza} from './inspeccion';
import {THREE,grupo,caja,cilindro,torno,varilla,mesh,fusionar,paleta,banco,type EscenaConstruida} from './kit';
export function fotoelasticidad():EscenaConstruida{
 const root=new THREE.Group(),m=paleta(),fixed=banco(root,m,3.35,1.6),rig=grupo(root);void fixed;
 for(const x of [-1.40,1.40]){caja(rig,.25,1.50,.40,m.pintura,x,.83,0);for(const z of [-.13,.13])varilla(rig,[x,.2,z],[x,1.7,z],.025,m.acero);const jaw=grupo(rig,x<0?-1.19:1.19,1.2,0);for(const z of [-.09,.09]){caja(jaw,.22,1.04,.075,m.negro,0,0,z);for(const y of [-.35,.35]){const bolt=cilindro(jaw,.035,.03,m.cobre,0,y,z+(z<0?-.05:.05),12);bolt.rotation.x=Math.PI/2;}}}
 const shape=new THREE.Shape();shape.moveTo(-1.2,-.6);shape.lineTo(1.2,-.6);shape.lineTo(1.2,.6);shape.lineTo(-1.2,.6);shape.closePath();const hole=new THREE.Path();hole.absarc(0,0,.16,0,Math.PI*2,true);shape.holes.push(hole);
 const plate=grupo(root,0,1.2,0);plate.name='placa-fotoelastica';const solid=mesh(plate,new THREE.ExtrudeGeometry(shape,{depth:.08,bevelEnabled:false,curveSegments:64}),m.vidrio,0,0,-.04);solid.name='placa-solida';
 const shader=new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:{stress:{value:1e6},thickness:{value:.004}},vertexShader:'varying vec2 loc;void main(){loc=position.xy/20.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 loc;uniform float stress;uniform float thickness;void main(){float a=.008;float r=max(a,length(loc));float th=atan(loc.y,loc.x);float q=a*a/(r*r);float rr=.5*stress*(1.-q)+.5*stress*(1.-4.*q+3.*q*q)*cos(2.*th);float tt=.5*stress*(1.+q)-.5*stress*(1.+3.*q*q)*cos(2.*th);float rt=-.5*stress*(1.+2.*q-3.*q*q)*sin(2.*th);float ds=sqrt((rr-tt)*(rr-tt)+4.*rt*rt);vec3 phase=3.14159265*7.5e-11*thickness*ds/vec3(650e-9,550e-9,450e-9);vec3 rgb=pow(sin(phase),vec3(2.));gl_FragColor=vec4(rgb*.9+.012,1.);}`});
 const fringes=mesh(plate,new THREE.ShapeGeometry(shape,64),shader,0,0,.042);fringes.name='franjas-kirsch';for(const z of [-.4,.4]){const ring=torno(rig,[[.88,-.02],[.98,-.02],[1.02,.02],[.98,.07],[.88,.07],[.88,-.02]],m.negro,0,1.2,z);ring.rotation.x=Math.PI/2;for(const x of [-.53,.53])varilla(rig,[x,.1,z],[x,.35,z],.024,m.acero);}
 const arrows=[-1,1].map(side=>{const q=new THREE.ArrowHelper(new THREE.Vector3(side,0,0),new THREE.Vector3(side*1.28,1.2,.3),.3,0xe0a05b,.09,.06);root.add(q);return q;});fusionar(rig);

 pieza(plate,'Placa con agujero','Cambia la fuerza aplicada y observa la concentración de franjas junto al agujero.',0);pieza(solid,'Espesor de la probeta','Modifica el espesor y compara la respuesta fotoelástica.',1);
 return {root,direction:[.35,.55,3.0],update(v){shader.uniforms.stress.value=v.stress;shader.uniforms.thickness.value=v.thickness;solid.scale.z=v.thickness/.004;solid.position.z=-.04*solid.scale.z;fringes.position.z=.04*solid.scale.z+.002;for(const a of arrows)a.setLength(.14+.15*v.force/1000,.07,.045);}};
}
export function fotoelectrico():EscenaConstruida{
 const root=new THREE.Group(),m=paleta();banco(root,m,3.4,1.8);const fixed=grupo(root);
 for(const x of [-.8,.8]){torno(fixed,[[0,0],[.3,0],[.32,.06],[.16,.12],[.11,.40],[.18,.46],[0,.46]],m.pintura,x,.08,0);const flange=torno(fixed,[[.44,-.045],[.54,-.045],[.57,0],[.54,.045],[.44,.045],[.44,-.045]],m.acero,x,1,0);flange.rotation.z=Math.PI/2;for(let i=0;i<8;i++){const a=i*Math.PI/4,b=cilindro(fixed,.025,.04,m.cobre,x+.055,.51*Math.cos(a)+1,.51*Math.sin(a),8);b.rotation.z=Math.PI/2;}}
 const tubeMaterial=m.vidrio.clone();tubeMaterial.opacity=.13;tubeMaterial.transmission=.5;const glass=torno(fixed,[[.48,-.82],[.52,-.82],[.52,.82],[.48,.82],[.48,-.82]],tubeMaterial,0,1,0);glass.rotation.z=Math.PI/2;
 const cathode=cilindro(fixed,.38,.045,m.cobre,-.8,1,0);cathode.rotation.z=Math.PI/2;const anode=cilindro(fixed,.38,.045,m.aluminio,.8,1,0);anode.rotation.z=Math.PI/2;
 const lamp=grupo(fixed,-1.35,1.88,.1);const lampBody=cilindro(lamp,.13,.35,m.pintura);lampBody.rotation.z=-.7;varilla(fixed,[-1.52,.1,-.3],[-1.52,1.85,-.3],.035,m.acero);varilla(fixed,[-1.52,1.85,-.3],[-1.35,1.88,.1],.04,m.acero);
 const beam=varilla(root,[-1.22,1.72,.1],[-.77,1.12,.05],.027,new THREE.MeshBasicMaterial({color:0xa994ff,transparent:true,opacity:.5}));beam.name='luz-fotoelectrica';
 for(const x of [-.9,.9])varilla(fixed,[x,.65,-.1],[x,.2,-.5],.016,m.goma);
 const dots=new THREE.InstancedMesh(new THREE.SphereGeometry(.016,8,6),new THREE.MeshBasicMaterial({color:0x67e8df}),48);dots.name='fotoelectrones';root.add(dots);const o=new THREE.Object3D();pieza(cathode,'Fotocátodo','Cambia la longitud de onda y observa si los electrones pueden salir del cátodo.',0);pieza(anode,'Electrodo colector','Ajusta el potencial de frenado y sigue el alcance de los fotoelectrones.',1);fusionar(fixed);


 return {root,direction:[1.2,.85,2.6],update(v,p,t){for(let i=0;i<48;i++){const tau=((t+i*.083)%4)/1e7,speed=v.vmax*Math.sqrt((i+.5)/48),acceleration=1.602176634e-19*p.voltage/(9.1093837139e-31*.1),x=speed*tau-.5*acceleration*tau*tau,visible=x>=0&&x<=.1;const a=i*Math.PI*.618,r=.25*Math.sqrt((i%11)/11);o.position.set(-.8+x*16,1+r*Math.cos(a),r*Math.sin(a));o.scale.setScalar(visible?1:.00001);o.updateMatrix();dots.setMatrixAt(i,o.matrix);}dots.instanceMatrix.needsUpdate=true;}};
}
