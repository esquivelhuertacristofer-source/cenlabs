import {THREE,grupo,caja,cilindro,torno,varilla,tubo,mesh,material,paleta,fusionar,type Punto,type EscenaConstruida} from './kit';
import {pieza} from './inspeccion';
import {landscape,landscapeGradient} from '@/domain/ciencias/decisiones';

/** Hardware authored in the coordinates of each experiment. Opening the assembly is
 * an inspection operation, never a second simulation or a change of model data. */
export function montarEquipo(id:string,scene:EscenaConstruida){
 const root=scene.root,m=paleta(),assemblies:{object:THREE.Object3D;home:THREE.Vector3;offset:THREE.Vector3}[]=[];
 function registrar(object:THREE.Object3D,offset:Punto){assemblies.push({object,home:object.position.clone(),offset:new THREE.Vector3(...offset)});}
 const enamel=material(0xb7c9ce,.42,.31),ceramic=material(0xe4ded0,.08,.48);
 function conjunto(name:string,description:string,at:Punto,offset:Punto,build:(g:THREE.Group)=>void){
  const g=grupo(root,...at);build(g);fusionar(g);pieza(g,name,description+' Desmontaje didáctico; no modifica el ensayo.',-1);
  registrar(g,offset);return g;
 }
 function ring(g:THREE.Object3D,r:number,y:number,n=8){torno(g,[[r*.78,y-.025],[r,y-.025],[r,y+.025],[r*.78,y+.025],[r*.78,y-.025]],m.aluminio);for(let i=0;i<n;i++){const a=i*Math.PI*2/n;cilindro(g,.018,.035,m.cobre,r*.89*Math.cos(a),y+.035,r*.89*Math.sin(a),6);}}
 function wheel(g:THREE.Object3D,r=.16){const q=mesh(g,new THREE.TorusGeometry(r,.018,8,32),m.negro);q.rotation.x=Math.PI/2;for(let i=0;i<3;i++){const a=i*Math.PI*2/3;varilla(g,[0,0,0],[r*Math.cos(a),0,r*Math.sin(a)],.012,m.acero);}cilindro(g,.045,.06,m.acero);}
 function drive(g:THREE.Object3D,r=.14,h=.38){torno(g,[[0,0],[r*.8,0],[r,.035],[r,h-.04],[r*.8,h],[0,h]],m.pintura);for(let i=0;i<8;i++)ring(g,r*1.06,.06+i*(h-.1)/8,0);caja(g,r*1.1,.12,r*.8,m.negro,r*.6,h*.55,0);ring(g,r*1.2,0);cilindro(g,.035,.20,m.acero,0,-.10,0);}
 function rail(g:THREE.Object3D,length:number,width=.42){caja(g,length,.10,width,m.aluminio);for(const z of [-width*.34,width*.34])caja(g,length,.018,.025,m.negro,0,.055,z);for(const x of [-length*.43,length*.43])for(const z of [-width*.32,width*.32])cilindro(g,.025,.026,m.cobre,x,.065,z,6);}
 function stage(g:THREE.Object3D,w=.48){caja(g,w,.08,w,m.acero);for(const z of [-w*.34,w*.34])varilla(g,[-w*.6,.075,z],[w*.6,.075,z],.025,m.aluminio);caja(g,w*.65,.08,w*.8,m.pintura,0,.12,0);const screw=grupo(g,w*.7,.10,0);screw.rotation.z=Math.PI/2;cilindro(screw,.025,.35,m.acero);for(let i=0;i<9;i++)ring(screw,.031,-.14+i*.032,0);wheel(grupo(screw,0,.23,0),.09);}
 function optic(g:THREE.Object3D,r=.16,l=.36){const body=torno(g,[[r*.73,-l/2],[r,-l/2],[r,l/2],[r*.73,l/2],[r*.73,-l/2]],m.negro);body.rotation.z=Math.PI/2;for(const x of [-l*.38,l*.38]){const a=grupo(g,x,0,0);a.rotation.z=Math.PI/2;ring(a,r*1.10,0);}const lens=cilindro(g,r*.73,.018,m.vidrio,l*.39,0,0);lens.rotation.z=Math.PI/2;}
 function port(g:THREE.Object3D,x:number,y:number,z:number){const q=grupo(g,x,y,z);ring(q,.075,0,4);cilindro(q,.035,.16,m.acero,0,.08,0);cilindro(q,.045,.05,m.cobre,0,.17,0,6);}
 function pump(g:THREE.Object3D){caja(g,.52,.28,.42,enamel,0,.14,0);const d=grupo(g,0,.33,0);drive(d,.13,.28);for(const x of [-.18,.18]){const head=grupo(g,x,.16,.26);head.rotation.x=Math.PI/2;ring(head,.11,0,6);cilindro(head,.07,.10,m.acero);}for(const x of [-.18,.18])port(g,x,.28,.10);}
 function cabinet(g:THREE.Object3D,w:number,h:number,d:number,cutSides=false){
  // Open front and roof: a readable manufacturing cutaway, not a transparent cube.
  caja(g,w,.09,d,enamel,0,.045,0);caja(g,w,h,.055,enamel,0,h/2,-d/2);
  for(const x of [-w/2,w/2]){const sideHeight=cutSides?h*.38:h;caja(g,.055,sideHeight,d,enamel,x,sideHeight/2,0);for(let i=0;i<7;i++)caja(g,.012,.025,d*.4,m.negro,x*1.001,(cutSides?sideHeight*.15+i*sideHeight*.10:h*.25+i*.06),-d*.1);}
  for(const x of [-w*.42,w*.42]){varilla(g,[x,.1,-d*.4],[x,h-.05,-d*.4],.022,m.acero);cilindro(g,.055,.06,m.goma,x,-.07,d*.33);}
  caja(g,w,.045,.045,m.acero,0,h,d*.49);
 }
 function vessel(g:THREE.Object3D,r=.23,h=.60){torno(g,[[0,0],[r*.6,0],[r,.08],[r,h-.1],[r*.65,h],[0,h]],m.vidrio);ring(g,r*1.05,h-.08);port(g,0,h,0);for(const x of [-r*.6,r*.6])varilla(g,[x,-.10,0],[x,.1,0],.025,m.acero);}
 function heatExchanger(g:THREE.Object3D,w=.65,h=.55){for(let i=0;i<12;i++)caja(g,w,.018,.36,m.aluminio,0,i*h/12,0);for(const x of [-w*.35,w*.35])varilla(g,[x,-.04,0],[x,h+.04,0],.025,m.cobre);caja(g,w,.06,.4,m.pintura,0,-.04,0);}
 function gantry(g:THREE.Object3D,w:number,h:number,d:number){for(const x of [-w/2,w/2]){caja(g,.12,h,d,m.aluminio,x,h/2,0);for(const z of [-d*.32,d*.32])caja(g,.025,h,.018,m.negro,x,h/2,z);}caja(g,w+.2,.14,d,m.pintura,0,h,0);rail(grupo(g,0,.08,0),w+.2,d);}
 function valve(g:THREE.Object3D){const body=cilindro(g,.10,.27,m.acero);body.rotation.z=Math.PI/2;for(const x of [-.14,.14]){const flange=grupo(g,x,0,0);flange.rotation.z=Math.PI/2;ring(flange,.13,0,6);}varilla(g,[0,0,0],[0,.23,0],.025,m.acero);wheel(grupo(g,0,.25,0),.13);}
 const C=conjunto;
 switch(id){
 case 'quimica-11':
  C('Carcasa óptica seccionada','Identifica la cámara oscura y la separación entre fuente, muestra y detector.',[0,.12,-.05],[0,.45,-.65],g=>{cabinet(g,3.65,1.25,1.35);for(const x of [-1.05,.88]){caja(g,.04,.43,1.1,m.negro,x,.25,0);caja(g,.04,.24,.35,m.negro,x,.94,-.42);}rail(grupo(g,0,.15,0),3.2,.55);tubo(g,[[-1.5,.30,-.45],[-1.5,.15,-.5],[1.45,.15,-.5],[1.45,.60,-.3]],.018,m.goma);});
  C('Portamuestras y óptica de enfoque','Explora la platina de la cubeta, el tornillo micrométrico y los diafragmas.',[0,0,0],[0,0,.65],g=>{stage(grupo(g,.35,.31,0),.60);for(const x of [-.9,.92])optic(grupo(g,x,.95,0),.15,.22);const fan=grupo(g,-1.5,.68,-.54);heatExchanger(fan,.43,.35);});break;
 case 'quimica-12':
  scene.direction=[2.2,2.5,2.8];
  C('Módulo de bombeo y desgasificación','Sigue los cabezales, las conexiones y la amortiguación del circuito de eluyente.',[-1.43,.13,-.08],[-.35,.25,.55],g=>{cabinet(g,.86,.85,1.35);pump(grupo(g,0,.12,.40));vessel(grupo(g,.15,.15,-.35),.15,.42);tubo(g,[[.15,.7,-.35],[-.28,.7,-.30],[-.28,.42,.48]],.017,m.acero);});
  C('Horno de columna y detector abierto','Reconoce la camisa térmica, el aislamiento y las uniones de la columna.',[.28,.12,-.18],[0,.45,-.55],g=>{cabinet(g,2.4,1.12,.84,true);for(const x of [-.85,.85])stage(grupo(g,x,.15,.18),.28);heatExchanger(grupo(g,1.28,.12,.55),.30,.35);});break;
 case 'quimica-13':
  C('Bastidor del interferómetro','Observa la cámara óptica y los soportes de precisión de los espejos.',[0,.12,0],[0,.40,-.55],g=>{cabinet(g,3.25,.92,2.35);for(const z of [-.95,.95])stage(grupo(g,0,.20,z),.48);optic(grupo(g,-1.30,.53,0),.19,.40);});
  C('Módulo de muestra y enfoque','Identifica la apertura óptica y la platina de introducción de muestra.',[.70,.18,.45],[.35,.20,.55],g=>{stage(g,.52);for(const x of [-.28,.28]){const mount=grupo(g,x,.48,0);optic(mount,.19,.10);}});break;
 case 'quimica-14':
  C('Potenciostato en corte','Reconoce el gabinete y los conectores del instrumento; las lecturas se mantienen en el panel.',[-1.15,.12,-.65],[-.35,.25,-.35],g=>{cabinet(g,.8,.80,.65);heatExchanger(grupo(g,0,.1,0),.44,.38);for(const x of [-.22,0,.22])port(g,x,.16,.22);});
  C('Puente de electrodos','Inspecciona los pasamuros y las conexiones del ensayo electroquímico.',[0,1.35,0],[0,.55,0],g=>{caja(g,1.35,.07,.24,ceramic);for(const x of [-.45,0,.45])port(g,x,.05,0);});break;
 case 'quimica-15':
  C('Bomba de recirculación','Identifica la circulación auxiliar de la celda de electrodeposición.',[-1.25,.14,-.60],[-.35,.25,-.35],g=>{pump(g);tubo(g,[[.18,.4,.1],[.6,.4,.1],[.6,.15,.5]],.028,m.goma);});
  C('Barra colectora y bornes','Inspecciona las conexiones eléctricas que sujetan los electrodos.',[0,1.5,0],[0,.5,0],g=>{caja(g,1.5,.08,.18,m.cobre);for(const x of [-.55,.55]){port(g,x,.06,0);caja(g,.18,.20,.15,m.acero,x,-.10,0);}});break;
 case 'quimica-16':
  C('Colector de gases','Distingue las dos salidas del montaje y sus válvulas de aislamiento.',[0,.20,-.75],[0,.25,-.55],g=>{for(const x of [-.6,.6]){valve(grupo(g,x,.30,0));tubo(g,[[x,.3,0],[x,.3,.38],[x,.8,.38]],.026,m.vidrio);}});
  C('Puente aislante de la celda','Observa las fijaciones y el aislamiento de los terminales.',[0,1.35,0],[0,.5,0],g=>{caja(g,1.65,.08,.24,ceramic);for(const x of [-.6,.6])port(g,x,.05,0);});break;
 case 'quimica-17':
  C('Unidad de alimentación','Sigue la bomba dosificadora y su válvula antes de entrar al reactor.',[-1.25,.15,-.45],[-.35,.20,-.35],g=>{pump(g);valve(grupo(g,.45,.28,0));tubo(g,[[.45,.28,0],[.8,.28,0],[.8,.9,0]],.025,m.acero);});
  C('Camisa térmica abierta','Inspecciona el circuito de acondicionamiento y sus conexiones.',[.85,.14,-.55],[.35,.25,-.35],g=>{heatExchanger(g,.55,.60);port(g,.2,.6,0);tubo(g,[[.2,.75,0],[.5,.75,0],[.5,.2,.30]],.028,m.cobre);});break;
 case 'quimica-18':
  C('Aislamiento del calorímetro','Explora la doble pared y el soporte del recipiente calorimétrico.',[0,.15,0],[0,.20,-.7],g=>{const shell=mesh(g,new THREE.CylinderGeometry(.86,.86,1.35,48,1,true,Math.PI*.15,Math.PI*1.25),enamel,0,.68,0);shell.castShadow=true;ring(g,.88,.03);});
  C('Cabezal de medición','Identifica las entradas de sonda y el cierre del recipiente.',[0,1.60,0],[0,.50,0],g=>{ring(g,.66,0);for(const x of [-.26,.26])port(g,x,.04,0);});break;
 case 'quimica-19':
  C('Blindaje seccionado del difractómetro','Identifica la envolvente del goniómetro; es un corte didáctico de un equipo cerrado.',[0,.12,-.15],[0,.35,-.65],g=>{cabinet(g,3.25,1.5,2.6);for(const x of [-.9,.9])rail(grupo(g,x,.06,0),.55,1.8);});
  C('Etapa de alineación del cristal','Inspecciona los ajustes de posicionamiento del portamuestras.',[0,.50,0],[0,-.15,.65],g=>stage(g,.46));break;
 case 'quimica-20':
  C('Molde y canales de acondicionamiento','Inspecciona la placa, las conexiones y la sujeción del molde.',[0,.12,-.8],[0,.15,-.45],g=>{rail(g,2.30,.35);for(const x of [-.9,.9]){port(g,x,.12,0);tubo(g,[[x,.2,0],[x,.4,0],[x*.5,.4,0]],.025,m.cobre);}});
  C('Puente de cierre del molde','Reconoce las guías y las mordazas; se separan para examinar la red.',[0,.2,0],[0,.8,0],g=>{for(const x of [-1.15,1.15])varilla(g,[x,0,0],[x,1.05,0],.04,m.acero);caja(g,2.5,.10,.42,m.pintura,0,1.05,0);for(const x of [-.95,.95])wheel(grupo(g,x,1.15,0),.10);});break;
 case 'quimica-21':
  C('Dosificación de reactivo','Explora el depósito y el circuito de aporte al recipiente.',[-1.15,.15,-.60],[-.4,.25,-.35],g=>{vessel(g,.22,.65);valve(grupo(g,0,.05,.30));tubo(g,[[0,.15,.30],[.65,.15,.30],[.65,.8,.3]],.02,m.vidrio);});
  C('Soporte del agitador','Identifica el accionamiento y el bastidor que sostienen la mezcla.',[0,.10,-.65],[0,.45,-.4],g=>{gantry(g,1.7,1.9,.24);drive(grupo(g,0,2.0,.45),.12,.28);});break;
 case 'quimica-22':
  C('Accionamiento del ensayo de jarras','Reconoce el motor y la transmisión común de los agitadores.',[0,.12,-.75],[0,.45,-.4],g=>{gantry(g,3.2,1.5,.28);drive(grupo(g,0,1.6,0),.13,.30);for(const x of [-1,0,1])ring(grupo(g,x,1.5,.2),.10,0,4);});
  C('Dosificador de coagulante','Inspecciona las conexiones de aporte del tratamiento.',[-1.45,.12,.70],[-.25,.25,.35],g=>{vessel(g,.16,.42);valve(grupo(g,.23,.15,0));});break;
 case 'quimica-23':
  C('Circuito de regeneración','Explora la bomba, la derivación y las válvulas de la columna.',[-1.1,.14,-.65],[-.35,.2,-.35],g=>{pump(g);valve(grupo(g,.5,.25,0));tubo(g,[[.5,.25,0],[.9,.25,0],[.9,1,0]],.025,m.acero);});
  C('Cabezal distribuidor','Identifica los pernos y la entrada de la columna de adsorción.',[0,1.95,0],[0,.45,0],g=>{ring(g,.38,0);port(g,0,.06,0);});break;
 case 'quimica-24':
  C('Horno de inducción en corte','Observa el aislamiento y la bobina que rodea el crisol.',[0,.15,0],[0,.20,-.65],g=>{mesh(g,new THREE.CylinderGeometry(.95,.95,1.2,48,1,true,Math.PI*.15,Math.PI*1.25),ceramic,0,.65,0);const pts:Punto[]=Array.from({length:161},(_,i)=>{const a=i/160*Math.PI*10;return [.78*Math.cos(a),.18+i/160*.85,.78*Math.sin(a)];});tubo(g,pts,.027,m.cobre);});
  C('Refrigeración del horno','Identifica la unidad auxiliar y las conexiones de enfriamiento.',[1.30,.13,-.55],[.35,.20,-.30],g=>{heatExchanger(g,.40,.6);pump(grupo(g,0,0,.55));});break;
 case 'fisica-11':
  C('Excitador electrodinámico','Inspecciona el cuerpo del excitador que transmite la oscilación a la cuerda.',[-1.65,.12,-.40],[-.4,.2,-.3],g=>{cabinet(g,.55,.60,.62);const d=grupo(g,0,.42,.20);d.rotation.z=Math.PI/2;drive(d,.14,.28);});
  C('Tensado y anclaje','Reconoce la mordaza y el ajuste mecánico del extremo.',[1.55,.15,0],[.4,.15,.25],g=>{stage(g,.4);gantry(grupo(g,0,.14,0),.4,.55,.18);wheel(grupo(g,.28,.55,0),.10);});break;
 case 'fisica-12':
  C('Raíl óptico y carros','Explora las guías que alinean emisor, rendijas y pantalla.',[0,.22,0],[0,-.05,.55],g=>{rail(g,3.25,.62);for(const x of [-1.45,-.4,1.35])stage(grupo(g,x,.10,0),.36);});
  C('Cabezal láser y enfoque','Inspecciona las aletas térmicas y el barril de enfoque del emisor.',[-1.55,1,0],[-.4,.25,0],g=>{optic(g,.18,.45);for(let i=0;i<9;i++){const q=grupo(g,-.30+i*.035,0,0);q.rotation.z=Math.PI/2;ring(q,.21,0,0);}});break;
 case 'fisica-13':
  C('Bastidor de carga y mordazas','Identifica la estructura que sostiene la probeta en el polariscopio.',[0,.12,-.12],[0,.25,-.55],g=>{gantry(g,2.25,2.05,.38);for(const y of [.38,1.85]){caja(g,.70,.12,.40,m.acero,0,y,.12);cilindro(g,.09,.20,m.acero,0,y-.13,.12);}});
  C('Ajuste del analizador','Inspecciona el aro y su soporte de orientación.',[0,1.2,.43],[0,.25,.55],g=>{const q=grupo(g);q.rotation.x=Math.PI/2;ring(q,.94,0,12);stage(grupo(g,0,-.92,0),.50);});break;
 case 'fisica-14':
  C('Acoplador de fibra','Identifica el enfoque y el ajuste micrométrico de entrada.',[-1.5,.30,0],[-.4,.2,.35],g=>{stage(g,.50);optic(grupo(g,0,.60,0),.28,.38);});
  C('Receptor y conector óptico','Inspecciona el acoplador que recibe la luz a la salida.',[1.5,.30,0],[.4,.2,.35],g=>{stage(g,.50);optic(grupo(g,0,.60,0),.28,.38);});break;
 case 'fisica-15':
  C('Difusores acústicos','Observa las superficies de difusión de la cámara; no alteran el modelo de Sabine.',[0,.12,-1.05],[0,.25,-.45],g=>{for(let i=0;i<17;i++){const h=.25+.08*((i*i)%7);caja(g,.14,h,.13,enamel,-1.42+i*.177,.22+h/2,0);}});
  C('Conjunto de micrófono','Identifica la cápsula, la suspensión y la conexión de medida.',[1.05,.35,.65],[.35,.25,.35],g=>{const ringG=grupo(g,0,.35,0);ringG.rotation.x=Math.PI/2;ring(ringG,.14,0,4);for(const x of [-.10,.10])varilla(g,[x,.23,0],[-x,.47,0],.006,m.goma);tubo(g,[[0,.2,0],[.18,.05,0],[.35,.03,-.3]],.012,m.goma);});break;
 case 'fisica-16':
  C('Circuito caliente','Inspecciona el intercambiador y el circuito del foco caliente.',[-1.45,.15,-.65],[-.35,.25,-.35],g=>{heatExchanger(g,.45,.65);pump(grupo(g,0,0,.65));});
  C('Circuito frío','Identifica el intercambiador que evacúa calor del otro extremo.',[1.45,.15,-.65],[.35,.25,-.35],g=>{heatExchanger(g,.45,.65);tubo(g,[[0,.7,0],[0,.9,.4],[0,.45,.65]],.025,m.cobre);});break;
 case 'fisica-17':
  C('Bastidor del colector','Reconoce el apoyo orientable y sus fijaciones.',[0,.15,-.45],[0,.15,-.5],g=>{for(const x of [-.85,.85]){varilla(g,[x,0,-.1],[x,.75,.30],.035,m.acero);varilla(g,[x,0,.6],[x,.75,.30],.035,m.acero);}rail(g,2.0,.55);});
  C('Circuito térmico del colector','Sigue las uniones y la bomba del circuito de transferencia.',[1.1,.15,.55],[.35,.2,.35],g=>{pump(g);valve(grupo(g,-.40,.25,0));});break;
 case 'fisica-18':
  C('Enderezador de entrada','Inspecciona los canales del acondicionador; el campo LBM conserva su dominio original.',[-1.9,.20,0],[-.5,.2,0],g=>{for(let i=0;i<12;i++)caja(g,.16,.10,.025,m.aluminio,0,.08,-.86+i*.156);caja(g,.20,.025,1.85,m.acero,0,.15,0);});
  C('Circuito hidráulico auxiliar','Reconoce la bomba de recirculación del banco hidráulico.',[0,.12,-1.12],[0,.25,-.4],g=>{pump(g);for(const x of [-1.5,1.5])tubo(g,[[x,.05,.15],[x,.05,-.10],[x*.2,.05,-.10]],.045,m.acero);});break;
 case 'fisica-19':
  C('Acumulador y bypass','Inspecciona el depósito auxiliar y la derivación del circuito hidráulico.',[-1.35,.14,-.55],[-.35,.2,-.35],g=>{vessel(g,.24,.75);valve(grupo(g,.40,.20,0));});
  C('Actuador de la válvula','Reconoce el accionamiento del cierre que origina el transitorio.',[1.40,.15,-.45],[.35,.25,-.35],g=>{gantry(g,.45,.75,.24);drive(grupo(g,0,.85,0),.13,.27);});break;
 case 'fisica-20':
  C('Platina de nivelación','Identifica la base y los tres tornillos de ajuste del capilar.',[0,.15,0],[0,-.03,.5],g=>{stage(g,.90);for(const x of [-.35,.35])wheel(grupo(g,x,.16,.4),.08);});
  C('Pinza y columna de medida','Inspecciona la mordaza de altura y el soporte del tubo.',[-.45,.15,-.35],[-.35,.25,-.35],g=>{varilla(g,[0,0,0],[0,2.2,0],.035,m.acero);for(const y of [.8,1.75]){caja(g,.45,.10,.16,m.pintura,.2,y,0);wheel(grupo(g,0,y+.08,0),.08);}});break;
 case 'fisica-21':
  C('Sistema de vacío seccionado','Identifica la bomba y los acoplamientos del analizador de masas.',[-1.4,.12,-.65],[-.35,.2,-.35],g=>{pump(g);vessel(grupo(g,0,.32,0),.20,.40);});
  C('Yugo del electroimán','Observa el cierre posterior del circuito magnético sin ocultar la trayectoria iónica.',[0,.2,-.85],[0,.25,-.5],g=>{gantry(g,1.85,.95,.30);for(const x of [-.75,.75]){const q=grupo(g,x,.35,.2);q.rotation.z=Math.PI/2;for(let i=0;i<8;i++)ring(q,.20,i*.032,0);}});break;
 case 'fisica-22':
  C('Soporte del electroimán','Inspecciona el yugo y las bobinas del montaje Hall.',[0,.12,-.55],[0,.25,-.5],g=>{gantry(g,1.65,1.35,.32);for(const x of [-.6,.6]){const coil=grupo(g,x,.45,.1);for(let i=0;i<10;i++)ring(coil,.19,i*.035,0);}});
  C('Conexiones de cuatro terminales','Distingue los conectores y el soporte aislante del espécimen.',[0,.2,.6],[0,.15,.5],g=>{caja(g,1.8,.08,.24,ceramic);for(const x of [-.65,-.22,.22,.65])port(g,x,.05,0);});break;
 case 'fisica-23':
  C('Cámara de fotocátodo','Inspecciona la envolvente seccionada y los pasamuros de la celda fotoeléctrica.',[0,.12,-.1],[0,.25,-.5],g=>{cabinet(g,2.8,1.1,1.3);for(const x of [-.8,.8])stage(grupo(g,x,.12,0),.40);});
  C('Enfoque de iluminación','Identifica las lentes de entrada del experimento.',[-1.25,.90,0],[-.4,.2,0],g=>optic(g,.20,.40));break;
 case 'fisica-24':
  C('Pedestal de cardanes','Reconoce la base de apoyo y su nivelación.',[0,.13,0],[0,-.02,.55],g=>{stage(g,1.2);for(const x of [-.45,.45])varilla(g,[x,.15,0],[x,.65,0],.045,m.acero);});
  C('Accionamiento del rotor','Inspecciona el mecanismo auxiliar de puesta en giro; no añade otro modelo dinámico.',[-1.15,.14,-.55],[-.35,.25,-.35],g=>{drive(g,.17,.45);wheel(grupo(g,0,.53,0),.19);});break;
 case 'matematicas-11':
  C('Mesa de posicionamiento','Identifica las guías del banco de vectores y su ajuste geométrico.',[0,.13,0],[0,-.02,.55],g=>{rail(g,2.75,.8);stage(grupo(g,0,.10,0),.85);});
  C('Articulaciones de orientación','Explora las bisagras del montaje que representa los ejes.',[0,.30,-.75],[0,.25,-.4],g=>{for(const x of [-.65,.65]){const q=grupo(g,x,.10,0);q.rotation.z=Math.PI/2;ring(q,.18,0,8);}rail(g,1.7,.25);});break;
 case 'matematicas-12':
  C('Pórtico CNC y guías','Inspecciona el bastidor de la herramienta que sigue la curva de Bézier.',[0,.13,-.65],[0,.35,-.5],g=>{gantry(g,3.2,1.8,.30);rail(grupo(g,0,1.72,.20),3.1,.25);});
  C('Husillo y portaherramientas','Reconoce el cuerpo del accionamiento en el extremo del carro.',[1.35,.15,-.50],[.4,.25,-.35],g=>{drive(g,.15,.45);stage(grupo(g,0,0,.30),.45);});break;
 case 'matematicas-13':
  C('Circuito de alimentación','Identifica los equipos de dosificación de los recursos de la mezcla.',[0,.14,-.65],[0,.25,-.4],g=>{for(const x of [-.9,.9]){pump(grupo(g,x,0,0));valve(grupo(g,x,.15,.45));}});
  C('Bastidor de depósitos','Inspecciona los apoyos del montaje de optimización.',[0,.13,0],[0,-.02,.5],g=>{rail(g,2.8,.55);for(const x of [-.9,.9])ring(grupo(g,x,.12,0),.48,0,8);});break;
 case 'matematicas-14':
  C('Bastidor de tracción','Reconoce el marco de reacción y la unidad de carga del ensayo.',[0,.12,-.30],[0,.35,-.5],g=>{gantry(g,2.8,2.1,.44);for(const x of [-1.1,1.1])varilla(g,[x,.2,.12],[x,1.9,.12],.055,m.acero);});
  C('Mordazas de la probeta','Identifica las superficies de apriete y la alineación del espécimen.',[0,.50,0],[0,.25,.55],g=>{for(const y of [0,1.10]){caja(g,.44,.22,.42,m.acero,0,y,0);for(const x of [-.13,.13])caja(g,.08,.16,.22,m.negro,x,y,.17);}});break;
 case 'matematicas-15':
  C('Pórtico de medición','Inspecciona las guías y la rigidez del soporte de la sonda.',[0,.13,-.50],[0,.35,-.4],g=>{gantry(g,3.2,1.6,.32);rail(grupo(g,0,1.5,.15),3.0,.25);});
  C('Posicionador de la pieza','Reconoce el ajuste del espécimen medido en el estudio de capacidad.',[0,.16,.15],[0,.15,.5],g=>stage(g,.85));break;
 case 'matematicas-16':
  C('Estación de muestreo','Reconoce el apoyo y las guías de las piezas que llegan a inspección.',[-1,.13,-.65],[-.3,.25,-.35],g=>{gantry(g,1.5,1.1,.25);for(const x of [-.5,0,.5]){const q=cilindro(g,.07,1.35,m.acero,x,.12,.6);q.rotation.x=Math.PI/2;}});
  C('Canal de clasificación','Inspecciona la salida mecánica de la estación de control.',[1,.13,-.65],[.3,.25,-.35],g=>{gantry(g,1.5,.85,.25);rail(grupo(g,0,.12,.6),1.5,.7);});break;
 case 'matematicas-17':
  C('Bastidor del banco de fiabilidad','Inspecciona las guías y los apoyos del conjunto de rotores.',[0,.12,-1.0],[0,.25,-.4],g=>{gantry(g,3.15,1.05,.25);rail(grupo(g,0,.12,.8),3.1,.25);});
  C('Unidad de accionamiento','Reconoce la alimentación mecánica auxiliar del banco.',[-1.5,.14,.8],[-.35,.2,.35],g=>drive(g,.16,.34));break;
 case 'matematicas-18':
  C('Comparador de precisión','Identifica la columna y la platina del control dimensional.',[0,.13,-.55],[0,.3,-.4],g=>{gantry(g,2.7,1.45,.26);stage(grupo(g,0,.12,.35),.75);});
  C('Ajuste micrométrico','Explora el tambor de avance y el apoyo del instrumento.',[1.20,.55,.45],[.35,.2,.35],g=>{const q=grupo(g);q.rotation.z=Math.PI/2;cilindro(q,.08,.42,m.acero);for(let i=0;i<12;i++)ring(q,.085,-.20+i*.032,0);wheel(grupo(q,0,.3,0),.12);});break;
 case 'matematicas-19':
  C('Soporte de la maqueta de costo','Identifica el marco de referencia de la superficie matemática.',[0,.10,0],[0,-.02,.6],g=>{for(const z of [-3.05,3.05])rail(grupo(g,0,0,z),6.15,.14);for(const x of [-3.05,3.05]){const q=grupo(g,x,0,0);q.rotation.y=Math.PI/2;rail(q,6.1,.14);}});
  C('Campo de descenso','Las flechas muestran −∇f en planta: orientación y longitud proporcionales al gradiente analítico. Se elevan para inspección, sin alterar la superficie.',[0,0,0],[0,.45,0],g=>{const arrowMaterial=material(0xdab877,.22,.44);for(let i=-5;i<=5;i++)for(let j=-5;j<=5;j++){const x=i*.53,z=j*.53,[gx,gz]=landscapeGradient(x,z),length=Math.hypot(gx,gz)*.11;if(length<.015)continue;const a=new THREE.Vector3(x,landscape(x,z)*.35+.055,z),direction=new THREE.Vector3(-gx,0,-gz).normalize(),b=a.clone().addScaledVector(direction,length);varilla(g,a.toArray() as Punto,b.toArray() as Punto,.006,arrowMaterial);const tip=mesh(g,new THREE.ConeGeometry(.025,.065,8),arrowMaterial);tip.position.copy(b);tip.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);}});break;
 case 'matematicas-20':
  C('Bastidor de la placa','Inspecciona las guías de referencia usadas para integrar la distribución.',[0,.12,-1.18],[0,.15,-.4],g=>rail(g,3.2,.30));
  C('Etapa de posicionamiento','Identifica los carros de apoyo del espécimen.',[0,.12,.9],[0,.15,.4],g=>{for(const x of [-1.3,1.3])stage(grupo(g,x,0,0),.38);});break;
 case 'matematicas-21':
  C('Bastidor del banco numérico','Inspecciona los apoyos de los tres montajes comparados.',[0,.12,-.6],[0,.25,-.4],g=>{gantry(g,3.1,1.2,.25);for(const x of [-1.1,0,1.1])stage(grupo(g,x,.1,.3),.42);});
  C('Circuito de acondicionamiento','Reconoce los conectores auxiliares de los especímenes.',[0,.14,.8],[0,.15,.4],g=>{rail(g,2.9,.25);for(const x of [-1.1,0,1.1])port(g,x,.1,0);});break;
 case 'matematicas-22':
  C('Pórtico de inspección','Reconoce la estructura de la estación de clasificación probabilística.',[0,.12,-.65],[0,.3,-.4],g=>{gantry(g,3.2,1.65,.3);optic(grupo(g,0,1.45,.20),.12,.22);});
  C('Guías de clasificación','Inspecciona las salidas y el accionamiento auxiliar del transporte.',[1.35,.14,.65],[.35,.2,.35],g=>{drive(g,.13,.3);for(const z of [-.25,.25])rail(grupo(g,-.4,.08,z),1.1,.12);});break;
 case 'biologia-11':
  {const shell=root.getObjectByName('envolvente-calfa')!;pieza(shell,'Envolvente de la lisozima','Superficie aproximada a partir de Cα de 1LYZ; no es una superficie de solvente calculada. Desmontaje didáctico de capas visuales, sin desnaturalización simulada.',-1);registrar(shell,[.65,.12,-.25]);
  const backbone=root.getObjectByName('traza-carbono-alfa')!,residues=root.getObjectByName('residuos-carbono-alfa')!;
  C('Residuos y traza experimental','129 posiciones Cα del depósito 1LYZ. Las cuentas representan residuos; no son todos los átomos ni cadenas laterales.',[0,0,0],[-.45,0,.35],g=>{root.updateMatrixWorld(true);g.attach(backbone);g.attach(residues);});}break;
 case 'biologia-12':
  for(const [name,label,side]of [['monocapa-superior','Monocapa superior',1],['monocapa-inferior','Monocapa inferior',-1]] as const){const leaflet=root.getObjectByName(name)!;pieza(leaflet,label,'Cabezas polares y dos colas hidrofóbicas por lípido; colocación esquemática alrededor del rotor c8. Desmontaje didáctico; no simula ruptura de la membrana.',-1);registrar(leaflet,[0,side*.55,side*.18]);}break;
 case 'biologia-13':
  C('Sistema Peltier en corte','Identifica el disipador, las placas térmicas y la unidad de ventilación.',[0,.13,-.35],[0,-.02,-.55],g=>{heatExchanger(g,1.85,.34);caja(g,2,.04,1.3,ceramic,0,.38,0);for(const x of [-.7,.7])port(g,x,.4,-.3);});
  C('Bisagras y cierre térmico','Inspecciona el mecanismo de cierre del bloque de PCR.',[0,.13,-.95],[0,.35,-.35],g=>{for(const x of [-.85,.85]){const q=grupo(g,x,.60,0);q.rotation.z=Math.PI/2;ring(q,.13,0,6);}rail(g,2.4,.22);});break;
 case 'biologia-14':
  C('Bandeja de electroforesis','Identifica la cámara y los apoyos aislantes del gel.',[0,.12,0],[0,-.02,.5],g=>{rail(g,3.2,2.25);for(const x of [-1.45,1.45])caja(g,.10,.12,1.9,ceramic,x,.12,0);});
  C('Conexiones de seguridad','Reconoce los pasamuros y el puente de conexión del campo eléctrico.',[0,.12,-1.15],[0,.25,-.35],g=>{rail(g,2.8,.20);for(const x of [-1.25,1.25])port(g,x,.10,0);});break;
 case 'biologia-15':
  C('Circuito de esterilización y muestreo','Sigue el circuito auxiliar, sus válvulas y los acoplamientos del biorreactor.',[-1.02,.13,-.40],[-.4,.25,-.35],g=>{pump(g);vessel(grupo(g,0,.4,0),.15,.45);valve(grupo(g,.4,.28,0));tubo(g,[[.4,.28,0],[.55,.28,.35],[.55,1.2,.35]],.025,m.acero);});
  C('Manifold de gases','Identifica las conexiones de aireación y los filtros de entrada.',[.8,.13,-.55],[.35,.25,-.35],g=>{for(const x of [0,.28]){vessel(grupo(g,x,.25,0),.10,.45);port(g,x,.75,0);}rail(g,.65,.35);});break;
 case 'biologia-16':
  C('Circuito respiratorio','Inspecciona las conexiones y la válvula de la maqueta de ventilación.',[0,.13,-.65],[0,.25,-.4],g=>{pump(g);valve(grupo(g,.5,.2,0));tubo(g,[[.5,.2,0],[.75,.2,0],[.75,.8,0]],.045,m.vidrio);});
  C('Soporte anatómico','Identifica el marco que permite comparar los dos pulmones sin ocultarlos.',[0,.13,-.45],[0,.25,-.35],g=>gantry(g,2.5,1.85,.15));break;
 case 'biologia-17':
  C('Circuito de perfusión','Inspecciona la bomba y los acoplamientos del modelo hemodinámico.',[-1.2,.13,-.5],[-.35,.25,-.35],g=>{pump(g);vessel(grupo(g,0,.35,0),.16,.4);});
  C('Portamuestras vascular','Reconoce las fijaciones de la sección observada.',[0,.13,-.5],[0,.25,-.4],g=>{gantry(g,1.8,1.5,.20);for(const x of [-.7,.7])port(g,x,.3,.2);});break;
 case 'biologia-18':
  C('Marco del sarcómero','Identifica los apoyos de la maqueta; las distancias moleculares son esquemáticas.',[0,.10,-.7],[0,.25,-.4],g=>{gantry(g,3.0,1.3,.16);rail(grupo(g,0,.05,1.2),3.0,.16);});
  C('Etapas de longitud muscular','Inspecciona los carros que sostienen los extremos del montaje.',[0,.12,.55],[0,.15,.4],g=>{for(const x of [-1.3,1.3])stage(grupo(g,x,0,0),.38);});break;
 case 'biologia-19':
  C('Circuito de acondicionamiento del agua','Reconoce el filtro y la circulación auxiliar del ensayo de ecotoxicología.',[-1.35,.13,-.65],[-.35,.25,-.35],g=>{pump(g);vessel(grupo(g,0,.35,0),.16,.52);});
  C('Colector de muestras','Identifica las salidas para observación del agua del ensayo.',[1.25,.13,-.55],[.35,.25,-.35],g=>{rail(g,.6,.4);for(const x of [-.16,.16]){vessel(grupo(g,x,.13,0),.11,.4);port(g,x,.56,0);}});break;
 case 'biologia-20':
  C('Cabina de trabajo aséptico en corte','Identifica el techo filtrante y la superficie de trabajo; no certifica una cabina real.',[0,.13,-.25],[0,.4,-.6],g=>{cabinet(g,3.5,2.05,1.65);for(let i=0;i<20;i++)caja(g,.10,.025,1.2,m.aluminio,-1.5+i*3/19,2,0);});
  C('Estación de preparación','Inspecciona las bandejas y el soporte de consumibles del procedimiento.',[1.15,.15,.65],[.35,.20,.35],g=>{rail(g,.70,.48);for(const x of [-.22,0,.22])vessel(grupo(g,x,.1,0),.08,.25);});break;
 default:throw Error('Falta montaje de equipo: '+id);
 }
 root.userData.assemblyCount=assemblies.length;
 return ()=>{const f=THREE.MathUtils.clamp(Number(root.userData.desmontaje)||0,0,1);for(const a of assemblies)a.object.position.copy(a.home).addScaledVector(a.offset,f);};
}
