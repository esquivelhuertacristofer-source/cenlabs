import {THREE,group,box,cylinder,lathe,foot,mergeByMaterial,arrow} from './_proceso-piezas.js';
import {bearingPressure,meanFlowTrace} from './_elementos-hidrodinamica.js';
const S=30,AMP=60,N=128,TAU=2*Math.PI;
function filmGeometry(){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*4*3),3));geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(N*4*3),3));const triangles=[];
 for(let i=0;i<N;i++){const j=(i+1)%N,fi=i,fj=j,fo=N+i,foj=N+j,bi=2*N+i,bj=2*N+j,bo=3*N+i,boj=3*N+j;triangles.push(fi,fo,fj,fo,foj,fj,bi,bj,bo,bj,boj,bo,fo,bo,foj,bo,boj,foj,fi,fj,bi,fj,bj,bi);}geometry.setIndex(triangles);return geometry;}
export function buildHydrodynamic(scene,m,state){
 m.paint.color.setHex(0x376b96);const hero=group(scene),fixed=group(hero),core=group(hero,0,1.45,0),v={id:265,hero,fixed,core,m,S:state,detail:[core],views:{assembly:hero},floorY:-.29,floorYs:{assembly:-.29,inspection:.1}};foot(fixed,m,3.5,2.2);
 box(fixed,2.15,.40,.82,m.paint,0,.16,-.16);box(fixed,2.45,.10,1.12,m.steel,0,.01,-.16);for(const x of [-1.03,1.03])for(const z of [-.53,.21]){const bolt=cylinder(fixed,.05,.035,m.steel,x,.09,z);bolt.geometry.dispose();bolt.geometry=new THREE.CylinderGeometry(.05,.05,.035,6);}
 const housing=group(core);housing.rotation.x=Math.PI/2;const inner=(.025+50e-6*AMP)*S;lathe(housing,[[inner,-.3],[1.18,-.3],[1.25,-.24],[1.25,-.07],[1.18,0],[inner,0],[inner,-.3]],m.copper);
 for(let i=0;i<6;i++){const a=i*TAU/6,g=group(core,1.06*Math.cos(a),1.06*Math.sin(a),.018),head=new THREE.Mesh(new THREE.CylinderGeometry(.037,.037,.035,6),m.steel);head.rotation.x=Math.PI/2;g.add(head);}
 v.rotor=group(core);v.rotor.name='eje-hidrodinamico';const shaftMaterial=m.steel.clone();shaftMaterial.metalness=.65;shaftMaterial.roughness=.42;const shaft=cylinder(v.rotor,.025*S,1.2,shaftMaterial,0,0,-.6);shaft.rotation.x=Math.PI/2;box(v.rotor,.035,.45,.008,m.copper,0,.39,.006);const center=cylinder(v.rotor,.12,.02,m.aluminum,0,0,.012);center.rotation.x=Math.PI/2;
 // This transparent mesh is a false-colour pressure overlay, not a claim
 // about the oil's actual colour; no specular lighting may obscure the map.
 v.film=new THREE.Mesh(filmGeometry(),new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.82,side:THREE.DoubleSide,depthWrite:false}));v.film.name='pelicula-de-aceite';v.film.renderOrder=2;core.add(v.film);
 v.pressureVectors=Array.from({length:15},(_,i)=>({theta:(i+1)*Math.PI/16,arrow:arrow(core,[1,0,.04],[.9,0,.04],0x7edfd5)}));
 v.flow=new THREE.InstancedMesh(new THREE.SphereGeometry(.007,10,8),new THREE.MeshBasicMaterial({color:0xc9f9f2}),48);v.flow.visible=false;v.flow.frustumCulled=false;v.flow.renderOrder=3;core.add(v.flow);v.flowSamples=[];v.housingMaterial=housing.children[0].material=m.copper.clone();v.shaftMaterial=shaftMaterial;
 v.force=arrow(core,[0,1.18,.04],[0,.78,.04],0xeeb978);mergeByMaterial(fixed);return v;
}
export function updateHydrodynamic(v,q,p){
 const ex=q.centerX*AMP*S,ey=q.centerY*AMP*S;v.rotor.position.set(ex,ey,0);v.rotor.rotation.z=q.thetaShaft;v.force.position.set(ex,ey+q.R*S+.48,.04);v.force.setLength(q.targetLoad*.0002);
 if(v.flow.visible){const object=new THREE.Object3D();v.flowSamples=[];for(let i=0;i<48;i++){const trace=meanFlowTrace(q,q.phase,i),a=trace.theta+q.gamma,nx=Math.cos(a),ny=Math.sin(a),R=q.R*S,dot=ex*nx+ey*ny,inner=dot+Math.sqrt(R*R-ex*ex-ey*ey+dot*dot),outer=(q.R+q.c*AMP)*S,r=(inner+outer)/2,radius=Math.min(.007,(outer-inner)*.18);object.position.set(r*nx,r*ny,trace.z*S);object.scale.setScalar(radius/.007);object.updateMatrix();v.flow.setMatrixAt(i,object.matrix);v.flowSamples.push({...trace,position:object.position.toArray(),radius});}v.flow.instanceMatrix.needsUpdate=true;v.flow.computeBoundingBox();}
 const signature=p.viscosity+'|'+p.speed;if(v.signature===signature)return;v.signature=signature;const position=v.film.geometry.attributes.position,colors=v.film.geometry.attributes.color,R=q.R*S,outer=(q.R+q.c*AMP)*S,color=new THREE.Color();
 for(const sample of v.pressureVectors){const a=sample.theta+q.gamma,nx=Math.cos(a),ny=Math.sin(a),P=bearingPressure(q,sample.theta,0),length=P*6e-8,g=sample.arrow;g.visible=length>1e-5;g.position.set(ex+(R+length)*nx,ey+(R+length)*ny,.045);g.setDirection(new THREE.Vector3(-nx,-ny,0));g.setLength(Math.max(1e-6,length),Math.min(.08,length*.35),Math.min(.04,length*.18));}
 for(let i=0;i<N;i++){const theta=i*TAU/N,a=theta+q.gamma,nx=Math.cos(a),ny=Math.sin(a),dot=ex*nx+ey*ny,inner=dot+Math.sqrt(R*R-ex*ex-ey*ey+dot*dot);
  for(let side=0;side<2;side++){const z=side===0?0:-q.L/2,P=bearingPressure(q,theta,z);color.setHSL(.61-.59*Math.min(1,P/20e6),.8,.49);for(let radial=0;radial<2;radial++){const index=(side*2+radial)*N+i,r=radial?outer:inner;position.setXYZ(index,r*nx,r*ny,z*S);colors.setXYZ(index,color.r,color.g,color.b);}}
 }
 position.needsUpdate=colors.needsUpdate=true;v.film.geometry.computeVertexNormals();v.film.geometry.computeBoundingSphere();
}
