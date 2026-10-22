import {THREE,box,studioMaterials,mergeByMaterial} from './_insignia-auto.js';

// Lenguaje acotado: sólo instrucciones de la celda, sin ejecutar código del alumno.
export function compileBlocks(blocks){
 const root=[],stack=[root];let expanded=0;
 for(const [i,b] of blocks.entries()){
  if(++expanded>40)throw Error('Máximo 40 bloques.');
  if(b.type==='end'){if(stack.length===1)throw Error(`Bloque ${i+1}: cierre sin inicio.`);if(!stack.at(-1).length)throw Error('El grupo está vacío.');stack.pop();continue;}
  const n={...b,index:i};stack.at(-1).push(n);
  if(['repeat','ifHeld'].includes(b.type)){n.children=[];stack.push(n.children);}
 }
 if(stack.length!==1)throw Error('Falta un bloque «Fin de grupo».');
 return root;
}
export const gripCapacity=n=>2*.45*n;
export const smooth=s=>s*s*s*(10+s*(-15+6*s));
const stations={entrada:[.55,.90,.48],soporte:[1.05,.90,0],salida:[1.25,.90,-.48],casa:[.65,1.15,0],rack:[.32,1.05,-.48]};
const names={move:'Mover a',grip:'Garra',tool:'Herramienta',polish:'Pulir',wait:'Esperar',repeat:'Repetir',ifHeld:'Si tiene pieza',end:'Fin de grupo'};
export function installCell(app,cfg,physics){
 const {S,visual:v}=app,mats=studioMaterials(),parent=v.wristYaw;
 const gripper=new THREE.Group();parent.add(gripper);
 box(gripper,.12,.12,.32,mats.paint,.09,0,0);box(gripper,.04,.08,.44,mats.steel,.16,0,0);
 const jaws=[-1,1].map(sign=>{const g=new THREE.Group();g.position.z=sign*.32;gripper.add(g);box(g,.22,.065,.035,mats.aluminum,.25,0,0);box(g,.10,.06,.012,mats.rubber,.29,0,-sign*.023);mergeByMaterial(g);return g;});
 const fixtures=new THREE.Group();v.hero.add(fixtures);
 for(const [key,color] of [['entrada',0x258e84],['salida',0xc48b35]]){const p=stations[key],mat=mats.paint.clone();mat.color.setHex(color);box(fixtures,.55,.05,.55,mat,p[0],.57,p[2]);for(const dx of [-.20,.20])for(const dz of [-.20,.20])box(fixtures,.045,.63,.045,mats.steel,p[0]+dx,.23,p[2]+dz);}
 box(fixtures,.30,.48,.28,mats.steel,.32,.20,-.48);box(fixtures,.35,.04,.33,mats.copper,.32,.46,-.48);mergeByMaterial(fixtures);
 const parkedTool=v.end.group.clone(true);parkedTool.traverse(o=>{if(o.isMesh)o.geometry=o.geometry.clone();});parkedTool.position.set(.32,.49,-.48);parkedTool.rotation.z=Math.PI/2;v.hero.add(parkedTool);
 const parkedGrip=gripper.clone(true);parkedGrip.traverse(o=>{if(o.isMesh)o.geometry=o.geometry.clone();});parkedGrip.position.copy(parkedTool.position);parkedGrip.rotation.copy(parkedTool.rotation);v.hero.add(parkedGrip);
 const gripDetail=new THREE.Group();app.scene.add(gripDetail);const zoomGrip=gripper.clone(true);zoomGrip.traverse(o=>{if(o.isMesh)o.geometry=o.geometry.clone();});gripDetail.add(zoomGrip);gripDetail.rotation.z=-Math.PI/2;gripDetail.scale.setScalar(2.5);v.views.gripper=gripDetail;gripDetail.visible=false;v.floorYs.gripper=-1.45;
 const sample=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.12,64),mats.aluminum);sample.rotation.z=Math.PI/2;sample.position.x=.29;zoomGrip.add(sample);
 const sides=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.06,72,1,true),mats.aluminum);sides.position.y=.03;v.workpiece.add(sides);
 const C={active:false,running:false,finished:false,held:false,location:'entrada',tool:'garra',force:60,open:true,polished:false,pose:[...stations.casa],action:null,frames:[],steps:0,status:'Construye la secuencia de trabajo.',current:-1};
 let blocks=[{type:'move',value:'entrada'},{type:'grip',value:'cerrar',force:60}],last=-1,programTime=0;
 const style=document.createElement('style');style.textContent=`
 #cellBar{position:absolute;left:16px;bottom:66px;z-index:4;max-width:calc(100% - 32px);display:flex;gap:8px;align-items:center;background:#102534eF;padding:9px;border:1px solid #377079;border-radius:12px}#cellStatus{font-size:11px;max-width:245px;color:#b9e6e1}#cellEditor{position:fixed;inset:60px 18px 24px;z-index:80;background:#0d1e2afc;border:1px solid #387180;border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:12px;box-shadow:0 25px 90px #000b}#cellEditor[hidden]{display:none}.cellHead{display:flex;justify-content:space-between;align-items:center;gap:12px}.cellHead h2{margin:0;color:#d8f7f0}.cellBody{display:grid;grid-template-columns:220px 1fr;gap:20px;min-height:0;flex:1}.cellPalette,.cellWorkspace{overflow:auto;padding:10px;background:#102b38;border-radius:12px}.cellPalette button{display:block;width:100%;margin:8px 0;text-align:left}.cellBlock{border:1px solid #4ba99c;border-left:7px solid #51c4b2;border-radius:7px 14px 14px 7px;padding:12px;margin:8px 0;background:#173d48;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.cellBlock[data-kind=repeat],.cellBlock[data-kind=ifHeld],.cellBlock[data-kind=end]{border-color:#bf944b;background:#413621}.cellBlock select,.cellBlock input{background:#0c202c;color:#e4f5f2;border:1px solid #70919e;border-radius:5px;padding:6px;max-width:140px}.cellBlock input{width:65px}.cellBlock button{padding:4px 9px}.cellBlock.active{outline:2px solid #ffe09a}.cellNote{font-size:12px;color:#a7c6cf;margin:0}#cellError{color:#ffd396;min-height:18px;font-size:13px}@media(max-width:700px){#cellEditor{inset:8px;padding:12px}.cellBody{grid-template-columns:1fr;grid-template-rows:130px 1fr;gap:8px}.cellPalette{display:flex;flex-wrap:wrap;gap:5px}.cellPalette button{width:auto;margin:0;font-size:11px}.cellHead h2{font-size:17px}#cellBar{bottom:43px;left:8px;padding:6px}#cellStatus{max-width:170px;font-size:10px}}`;
 document.head.append(style);
 const mobileStyle=document.createElement('style');mobileStyle.textContent='@media(max-width:700px){#cellBar{bottom:34px;max-width:calc(100% - 16px);gap:6px;padding:4px}#cellBar button{font-size:10px;padding:6px;white-space:nowrap}#cellStatus{max-width:150px;font-size:9px;line-height:1.25}}';document.head.append(mobileStyle);
 const bar=document.createElement('div');bar.id='cellBar';bar.innerHTML='<button id="editCell">Programar con bloques</button><button id="stopCell" hidden>Detener</button><span id="cellStatus" role="status"></span>';document.getElementById('stage').append(bar);
 const editor=document.createElement('section');editor.id='cellEditor';editor.hidden=true;editor.setAttribute('aria-label','Editor de bloques');editor.innerHTML='<div class="cellHead"><h2>Tu programa · celda robotizada</h2><button id="closeCell">Volver al 3D</button></div><p class="cellNote">Entrada → soporte → pulido → salida. Arrastra o usa ↑ ↓. La garra sostiene 2,5 kg por fricción (μ = 0,45); la fuerza se aplica en cada mordaza.</p><div class="cellBody"><div class="cellPalette" id="cellPalette"></div><div class="cellWorkspace" id="cellWorkspace"></div></div><div id="cellError" role="status"></div><div class="cellHead"><button id="runCell">Ejecutar en 3D</button><button id="resetCell">Vaciar programa</button></div>';document.body.append(editor);
 const $=id=>document.getElementById(id),say=t=>{C.status=t;$('cellStatus').textContent=t;};
 const stationLabels=Object.entries({entrada:'01 · ENTRADA',soporte:'02 · PULIDO',salida:'03 · SALIDA',rack:'CAMBIADOR'}).map(([key,text])=>{const el=document.createElement('span');el.textContent=text;el.style.cssText='position:absolute;pointer-events:none;font-size:10px;letter-spacing:.08em;padding:4px 7px;border:1px solid #497d88;border-radius:5px;background:#102734d9;color:#ceefe9;transform:translate(-50%,-50%);z-index:2';$('stage').append(el);return {key,el};});
 function persist(){try{localStorage.setItem('cen164-programa-v1',JSON.stringify(blocks));}catch{ /* Almacenamiento opcional. */ }}
 try{const saved=JSON.parse(localStorage.getItem('cen164-programa-v1'));if(Array.isArray(saved)&&saved.length<=40&&saved.every(b=>names[b.type]))blocks=saved;}catch{ /* Empieza con dos bloques. */ }
 function redraw(){const ws=$('cellWorkspace');ws.replaceChildren();blocks.forEach((b,i)=>{
  const row=document.createElement('div');row.className='cellBlock';row.dataset.kind=b.type;row.draggable=true;row.innerHTML=`<b>${i+1}. ${names[b.type]}</b>`;
  const opts=b.type==='move'?['entrada','soporte','salida','casa']:b.type==='grip'?['abrir','cerrar']:b.type==='tool'?['garra','pulidora']:null;
  if(opts){const sel=document.createElement('select');sel.setAttribute('aria-label',`Parámetro del bloque ${i+1}`);opts.forEach(x=>sel.add(new Option(x,x)));sel.value=b.value||opts[0];b.value=sel.value;sel.onchange=()=>{b.value=sel.value;persist();};row.append(sel);}
  if(['grip','repeat','wait'].includes(b.type)){const input=document.createElement('input');input.type='number';input.min=b.type==='grip'?10:1;input.max=b.type==='grip'?100:4;input.value=b.type==='grip'?(b.force||60):(b.count||1);input.setAttribute('aria-label',b.type==='grip'?'Fuerza por mordaza en N':'Cantidad');input.onchange=()=>{const n=Math.max(+input.min,Math.min(+input.max,+input.value||1));input.value=n;b[b.type==='grip'?'force':'count']=n;persist();};row.append(input,document.createTextNode(b.type==='grip'?'N / mordaza':b.type==='wait'?'s':'veces'));}
  for(const [label,fn] of [['↑',()=>{if(i)[blocks[i-1],blocks[i]]=[blocks[i],blocks[i-1]];}],['↓',()=>{if(i<blocks.length-1)[blocks[i+1],blocks[i]]=[blocks[i],blocks[i+1]];}],['×',()=>blocks.splice(i,1)]]){const btn=document.createElement('button');btn.textContent=label;btn.setAttribute('aria-label',`${label} bloque ${i+1}`);btn.onclick=()=>{fn();persist();redraw();};row.append(btn);}
  row.ondragstart=e=>e.dataTransfer.setData('text/plain',String(i));row.ondragover=e=>e.preventDefault();row.ondrop=e=>{e.preventDefault();const from=+e.dataTransfer.getData('text/plain');if(Number.isInteger(from)&&from>=0&&from<blocks.length){const [item]=blocks.splice(from,1);blocks.splice(i,0,item);persist();redraw();}};ws.append(row);
 });persist();}
 for(const type of Object.keys(names)){const b=document.createElement('button');b.textContent='+ '+names[type];b.dataset.block=type;b.onclick=()=>{if(blocks.length>=40){$('cellError').textContent='Máximo 40 bloques.';return;}blocks.push({type});redraw();};$('cellPalette').append(b);}
 $('editCell').onclick=()=>{S.paused=true;editor.hidden=false;redraw();};$('closeCell').onclick=()=>{editor.hidden=true;S.paused=false;};$('resetCell').onclick=()=>{blocks=[];redraw();};
 function fail(message){C.running=false;C.action=null;C.finished=false;say('Detenido: '+message);}
 $('stopCell').onclick=()=>fail('Ejecución cancelada. Puedes editar y volver a empezar.');
 function place(location){v.hero.attach(v.workpiece);const p=stations[location];v.workpiece.position.set(p[0],.60,p[2]);v.workpiece.rotation.set(0,0,0);C.location=location;C.held=false;}
 function motion(points,done){C.action={kind:'move',points:[C.pose.slice(),...points],segment:0,start:programTime,duration:.85,done};}
 function travel(target,done){motion([[C.pose[0],1.15,C.pose[2]],[target[0],1.15,target[2]],target.slice()],done);}
 function next(){while(C.frames.length){const f=C.frames.at(-1);if(f.i>=f.nodes.length){if(--f.left>0)f.i=0;else C.frames.pop();continue;}const n=f.nodes[f.i++];if(++C.steps>128)throw Error('Se superaron 128 instrucciones.');if(n.type==='repeat'){C.frames.push({nodes:n.children,i:0,left:Math.max(1,Math.min(4,n.count||1))});continue;}if(n.type==='ifHeld'){if(C.held)C.frames.push({nodes:n.children,i:0,left:1});continue;}return n;}return null;}
 function start(n){C.current=n.index;say(`Bloque ${n.index+1}: ${names[n.type]} ${n.value||''}`);
  if(n.type==='move'){travel(stations[n.value],()=>{});return;}
  if(n.type==='wait'){C.action={kind:'wait',start:programTime,duration:n.count||1,done:()=>{}};return;}
  if(n.type==='tool'){if(C.held)throw Error('Suelta la pieza en un soporte antes de cambiar herramienta.');travel(stations.rack,()=>{C.tool=n.value;C.open=true;});return;}
  if(n.type==='grip'){
   if(C.tool!=='garra')throw Error('Necesitas montar la garra.');
   C.action={kind:'wait',start:programTime,duration:.45,done:()=>{C.open=n.value==='abrir';if(C.open){if(C.held){const loc=Object.keys(stations).filter(k=>['entrada','soporte','salida'].includes(k)).find(k=>Math.hypot(...C.pose.map((x,i)=>x-stations[k][i]))<.045);if(!loc)throw Error('No abras en el aire: lleva la pieza a una estación.');place(loc);}}else{C.force=n.force||60;if(C.held)return;const p=stations[C.location];if(Math.hypot(...C.pose.map((x,i)=>x-p[i]))>.045)throw Error('La garra no está alineada con la pieza.');if(gripCapacity(C.force)<2.5*9.81)throw Error(`La pieza pesa 24,5 N; la garra sólo sostiene ${gripCapacity(C.force).toFixed(1)} N. Aumenta la fuerza.`);parent.updateWorldMatrix(true,true);gripper.attach(v.workpiece);C.held=true;C.location='garra';}}};return;
  }
  if(n.type==='polish'){if(C.tool!=='pulidora')throw Error('Monta la pulidora en el cambiador.');if(C.location!=='soporte'||C.held)throw Error('Coloca y suelta la pieza en el soporte antes de pulir.');if(!physics.cobotChallenge(S.values.K,S.values.B).ok)throw Error('El contacto no cumple los tres límites. Ajusta rigidez y freno.');const m=physics.contact(0,S.values.K,S.values.B);travel([1.22,1.07-5*m.x,0],()=>{C.action={kind:'polish',start:programTime,duration:Math.PI*5,done:()=>{C.polished=true;C.pose=[1.22,1.07-5*physics.contact(Math.PI,S.values.K,S.values.B).x,0];}};});return;}
  throw Error('Bloque desconocido.');
 }
 $('runCell').onclick=()=>{try{const ast=compileBlocks(blocks);if(!ast.length)throw Error('Añade al menos un bloque.');Object.assign(C,{active:true,running:true,finished:false,held:false,tool:'garra',force:60,open:true,polished:false,pose:[...stations.casa],action:null,frames:[{nodes:ast,i:0,left:1}],steps:0,current:-1});place('entrada');S.solved=false;S.t=0;last=-1;programTime=0;editor.hidden=true;S.paused=false;app.view('robot');$('cellError').textContent='';say('Programa iniciado.');}catch(e){$('cellError').textContent=e.message;}};
 const originalModel=cfg.model,originalUpdate=cfg.update,originalChallenge=cfg.challenge;
 cfg.model=(t,values,state)=>{
  if(C.active&&C.running&&t!==last){last=t;programTime=t*5;try{
   const a=C.action;if(a){const elapsed=programTime-a.start;
    if(a.kind==='move'){const from=a.points[a.segment],to=a.points[a.segment+1],s=Math.min(1,elapsed/a.duration),u=smooth(s);C.pose=from.map((x,i)=>x+(to[i]-x)*u);
     if(C.held){const d2=60*s-180*s*s+120*s*s*s,acc=from.map((x,i)=>(to[i]-x)*d2/a.duration**2);const load=2.5*Math.hypot(acc[0],acc[1]+9.81,acc[2]);if(load>gripCapacity(C.force))throw Error('La aceleración supera el agarre disponible. Aumenta la fuerza de mordaza.');}
     if(s>=1){a.segment++;a.start=programTime;if(a.segment>=a.points.length-1){C.action=null;a.done();}}
    }else if(elapsed>=a.duration){C.action=null;a.done();}
   }
   if(!C.action){const n=next();if(n)start(n);else{C.running=false;C.finished=C.polished&&C.location==='salida'&&!C.held;say(C.finished?'Ciclo completo: pieza pulida y entregada. Valida el reto.':'Programa terminado: falta pulir y entregar la pieza.');}}
  }catch(e){fail(e.message);}}
  const polishing=C.active&&C.action?.kind==='polish',tau=polishing?(programTime-C.action.start)/5:t;
  const m=originalModel(tau,values,state);if(C.active&&!polishing)m.force=0;return m;
 };
 cfg.update=(vis,m,values,state)=>{
  originalUpdate(vis,m,values,state);gripper.visible=C.active&&C.tool==='garra';vis.end.group.visible=!C.active||C.tool==='pulidora';parkedTool.visible=C.active&&C.tool==='garra';parkedGrip.visible=!parkedTool.visible;$('stopCell').hidden=!C.running;
  for(const {key,el} of stationLabels){const p=stations[key],point=new THREE.Vector3(p[0],key==='rack'?.48:.56,p[2]).project(app.camera);el.hidden=state.view!=='robot'||(innerWidth<700&&!state.labels);el.style.left=(point.x*.5+.5)*$('stage').clientWidth+'px';el.style.top=(-point.y*.5+.5)*$('stage').clientHeight+'px';}
  if(!C.active)return;
  if(C.action?.kind!=='polish'){const q=physics.cobotIK(...C.pose);if(q){vis.yaw.rotation.y=q.yaw;vis.shoulder.rotation.z=q.shoulder;vis.elbow.rotation.z=q.elbow;vis.wrist.rotation.z=q.wrist;vis.wristYaw.rotation.x=q.yaw;}}
  else vis.wristYaw.rotation.x=vis.yaw.rotation.y;
  jaws.forEach((j,i)=>j.position.z=(i?1:-1)*(C.open?.32:.269-C.force/12000));
 };
 cfg.challenge=(values,state)=>{const r=originalChallenge(values,state);r.checks.push({name:'Ciclo programado',value:C.finished?'Pieza pulida en salida':'Pendiente',ok:C.finished});r.ok=r.ok&&C.finished;return r;};
 cfg.change=()=>{if(C.active){C.running=false;C.finished=false;say('Ajuste cambiado. Ejecuta otra vez el programa.');}};
 cfg.success='Ciclo completo: agarre, traslado, cambio de herramienta, pulido estable y entrega.';
 cfg.failure='Comprueba el contacto y completa la secuencia programada hasta la salida.';
 $('task').textContent='Programa la carga, el pulido y la entrega. Mantén ±4 N, decaimiento ≤1,2 s y desplazamiento en aire ≤30 mm.';
 const oldRestart=$('restart').onclick;$('restart').onclick=()=>{C.active=false;C.running=false;C.finished=false;place('soporte');visReset();oldRestart();say('Demostración del contacto. Abre los bloques para programar.');};
 function visReset(){v.wristYaw.rotation.x=0;}
 window.__labDebug.programa=()=>({active:C.active,running:C.running,finished:C.finished,held:C.held,location:C.location,tool:C.tool,polished:C.polished,status:C.status,current:C.current,force:C.force,steps:C.steps,blocks:JSON.parse(JSON.stringify(blocks))});
 say('Demostración del pulido · abre los bloques para crear el ciclo.');redraw();app.frame();
}
