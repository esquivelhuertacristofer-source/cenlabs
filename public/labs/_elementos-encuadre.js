import {THREE} from './_insignia-auto.js';
// A rotating circular gear's transformed local AABB grows/shrinks even though
// the gear does not. Use actual world vertices at view/parameter changes only.
// The animation loop does not perform this scan or move the camera.
export function preciseFraming(app,definition){
 const stage=document.getElementById('stage'),root=()=>app.visual.views[app.S.view];
 function bounds(){app.scene.updateMatrixWorld(true);return new THREE.Box3().setFromObject(root(),true);}
 function corners(b){const points=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(new THREE.Vector3(x,y,z));return points;}
 function project(points){app.camera.updateMatrixWorld(true);const p=points.map(q=>q.clone().project(app.camera));return {xs:p.map(p=>p.x),ys:p.map(p=>p.y)};}
 app.frame=()=>{
  const r=stage.getBoundingClientRect();app.renderer.setSize(r.width,r.height);app.camera.aspect=r.width/r.height;app.camera.updateProjectionMatrix();
  const b=bounds(),center=b.getCenter(new THREE.Vector3()),dir=new THREE.Vector3(...(app.S.view==='inspection'?(definition.inspectionDir||[.35,.3,1.6]):innerWidth<761?[.6,.6,1.5]:[.8,.7,1.3])).normalize(),points=corners(b);let distance=Math.max(.3,b.getSize(new THREE.Vector3()).length()*1.4);
  for(let k=0;k<10;k++){app.camera.position.copy(center).addScaledVector(dir,distance);app.camera.lookAt(center);const {xs,ys}=project(points);distance*=Math.max((Math.max(...xs)-Math.min(...xs))/1.72,(Math.max(...ys)-Math.min(...ys))/1.30);}
  app.controls.target.copy(center);app.controls.update();
 };
 window.__labDebug.mideObjeto=()=>{const {xs,ys}=project(corners(bounds())),r=stage.getBoundingClientRect();return {vista:app.S.view,altoPorcentaje:(Math.max(...ys)-Math.min(...ys))*50,anchoPorcentaje:(Math.max(...xs)-Math.min(...xs))*50,lienzo:{w:r.width,h:r.height},metodo:'vértices reales en coordenadas de mundo'};};
 for(const el of document.querySelectorAll('[data-view],input[type="range"],#tourNext,#tourPrev,#btnAuto,#btnQuality'))el.addEventListener(el.matches('input')?'input':'click',()=>app.frame());
 new ResizeObserver(()=>app.frame()).observe(stage);requestAnimationFrame(()=>app.frame());
}
