import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
export {THREE};
export type Punto=[number,number,number];
export const TAU=2*Math.PI,V=(a:Punto)=>new THREE.Vector3(...a);
export function material(color:number,metalness=.65,roughness=.28){return new THREE.MeshStandardMaterial({color,metalness,roughness});}
export function grupo(parent:THREE.Object3D,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
export function mesh(parent:THREE.Object3D,geometry:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0){const q=new THREE.Mesh(geometry,m);q.position.set(x,y,z);q.castShadow=!(m.transparent&&m.opacity<.45);q.receiveShadow=true;parent.add(q);return q;}
export function caja(g:THREE.Object3D,w:number,h:number,d:number,m:THREE.Material,x=0,y=0,z=0){return mesh(g,new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.12),m,x,y,z);}
export function cilindro(g:THREE.Object3D,r:number,h:number,m:THREE.Material,x=0,y=0,z=0,n=40){return mesh(g,new THREE.CylinderGeometry(r,r,h,n),m,x,y,z);}
export function esfera(g:THREE.Object3D,r:number,m:THREE.Material,x=0,y=0,z=0){return mesh(g,new THREE.SphereGeometry(r,32,20),m,x,y,z);}
export function torno(g:THREE.Object3D,profile:[number,number][],m:THREE.Material,x=0,y=0,z=0){return mesh(g,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),56),m,x,y,z);}
export function varilla(g:THREE.Object3D,a:Punto,b:Punto,r:number,m:THREE.Material){const q=cilindro(g,r,1,m);setVarilla(q,a,b);return q;}
export function setVarilla(q:THREE.Mesh,a:Punto,b:Punto){const A=V(a),B=V(b),d=B.clone().sub(A);q.position.copy(A.add(B).multiplyScalar(.5));q.scale.y=d.length();q.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());}
export function tubo(g:THREE.Object3D,p:Punto[],r:number,m:THREE.Material){return mesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p.map(V)),64,r,10,false),m);}
export function fusionar(g:THREE.Group){
 g.updateMatrixWorld(true);const inv=g.matrixWorld.clone().invert(),map=new Map<THREE.Material,THREE.BufferGeometry[]>(),keep:{object:THREE.Object3D;matrix:THREE.Matrix4}[]=[];
 function collect(o:THREE.Object3D){if(o.name||o.userData.inspeccion){keep.push({object:o,matrix:inv.clone().multiply(o.matrixWorld)});return;}if(o instanceof THREE.Mesh&&!(o instanceof THREE.InstancedMesh)){const m=o.material as THREE.Material,arr=map.get(m)||[];arr.push((o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld).applyMatrix4(inv));map.set(m,arr);}else if(o instanceof THREE.InstancedMesh){keep.push({object:o,matrix:inv.clone().multiply(o.matrixWorld)});return;}for(const child of o.children)collect(child);}
 for(const child of g.children)collect(child);g.clear();for(const {object,matrix} of keep){matrix.decompose(object.position,object.quaternion,object.scale);g.add(object);}map.forEach((geos,m)=>{const geometry=mergeGeometries(geos,false);if(geometry)mesh(g,geometry,m);geos.forEach(q=>q.dispose());});
}

export function paleta(){return {aluminio:material(0xaebac2,.86,.25),acero:material(0x4d6575,.9,.23),negro:material(0x101f2c,.6,.32),pintura:material(0x368c9c,.55,.28),cobre:material(0xbf9158,.78,.29),goma:material(0x11171e,.1,.6),vidrio:new THREE.MeshPhysicalMaterial({color:0x8eb9c6,metalness:0,roughness:.08,transmission:.35,thickness:.08,ior:1.46,transparent:true,opacity:.26,envMapIntensity:.35,side:THREE.FrontSide})};}
export type Paleta=ReturnType<typeof paleta>;
export function banco(g:THREE.Object3D,m:Paleta,w=3.8,d=2.3){const fixed=grupo(g);caja(fixed,w,.16,d,m.negro,0,0,0);for(const x of [-w*.42,w*.42])for(const z of [-d*.35,d*.35])cilindro(fixed,.11,.12,m.goma,x,-.13,z);const geo=new THREE.CylinderGeometry(.018,.018,.008,8),bolts=new THREE.InstancedMesh(geo,m.acero,96),obj=new THREE.Object3D();for(let i=0;i<96;i++){obj.position.set(-w*.43+(i%12)*w*.86/11,.084,-d*.4+Math.floor(i/12)*d*.8/7);obj.updateMatrix();bolts.setMatrixAt(i,obj.matrix);}fixed.add(bolts);return fixed;}
export interface SondaCampo {xD:number;yD:number;u:number;v:number;t:number;}
export interface EscenaConstruida {probe?:(world:THREE.Vector3)=>SondaCampo|null;root:THREE.Group;update:(values:Record<string,number>,p:Record<string,number>,t:number)=>void;direction?:Punto;}
export function liberar(root:THREE.Object3D){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line||o instanceof THREE.Points){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});
 materials.forEach(m=>{for(const value of Object.values(m))if(value instanceof THREE.Texture)textures.add(value);if(m instanceof THREE.ShaderMaterial)for(const uniform of Object.values(m.uniforms))if(uniform.value instanceof THREE.Texture)textures.add(uniform.value);});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}
