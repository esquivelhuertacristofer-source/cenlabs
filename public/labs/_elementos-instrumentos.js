import {bolted,eccentric,helical,planetary,bearingPressure,rollingBearing,spring,bandBrake,fourBar,shaftJoint,hubField} from './_elementos-modelos.js';
export function drawInstrument(g,w,h,id,m,p,ready,mode='full',validated=false){
 g.clearRect(0,0,w,h);g.font='12px Outfit,system-ui';g.fillStyle='#b5d2e2';
 if(!ready){g.fillText('Prepara y completa el ensayo para registrar datos.',12,30,w-24);return;}
 if(id===266){drawRolling(g,w,h,m,p,mode,validated);return;}
 if(id===267){drawSpring(g,w,h,m,p,mode,validated);return;}
 if(id===268){drawBrake(g,w,h,m,p,mode,validated);return;}
 if(id===269){drawFourBar(g,w,h,m,mode,validated);return;}
 if(id===270){drawShaftJoint(g,w,h,m,p,mode,validated);return;}
 if(id===262){drawEccentric(g,w,h,m,p,mode,validated);return;}
 if(id===263){drawHelical(g,w,h,m,p,mode,validated);return;}
 if(id===264){drawPlanetary(g,w,h,m,p,mode,validated);return;}
 if(id===265){drawHydrodynamic(g,w,h,m,mode,validated);return;}
 if(!validated||mode==='peak'){for(const [i,text]of ['Tracción: '+(m.Fb/1000).toFixed(2)+' kN','Compresión: '+(m.Fc/1000).toFixed(2)+' kN','Abertura: '+(m.gap*1e6).toFixed(2)+' µm','Par orientativo: '+m.torque.toFixed(1)+' N·m'].entries())g.fillText(text,14,35+i*35);return;}
 const L=48,R=w-16,T=45,B=h-30,max=mode==='low'?200:50;
 g.fillText(mode==='low'?'Abertura y pérdida de contacto':'Reparto de carga · tornillo / junta',8,16,w-16);g.fillText(mode==='low'?'µm':'kN',4,31);
 g.strokeStyle='#355267';g.beginPath();for(let i=0;i<5;i++){const y=T+(B-T)*i/4;g.moveTo(L,y);g.lineTo(R,y);g.fillText((max*(1-i/4)).toFixed(0),6,y+4);}g.stroke();g.fillText('0',L,B+20);g.fillText('Carga exterior · 45 kN',Math.max(L,R-150),B+20);
 for(const [key,color]of (mode==='low'?[['gap','#edba7d']]:[['Fb','#78e4d5'],['Fc','#edba7d']])){g.strokeStyle=color;g.lineWidth=2;g.beginPath();for(let i=0;i<=180;i++){const P=45000*i/180,q=bolted(p,P),value=q[key]*(key==='gap'?1e6:.001),x=L+(R-L)*i/180,y=B-(B-T)*value/max;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}
}
function drawShaftJoint(g,w,h,m,p,mode,validated){
 if(!validated||mode==='peak'){['Chaveta: '+m.Tkey.toFixed(1)+' N·m','Estriado: '+m.Tspline.toFixed(1)+' N·m','Interferencia: '+m.Tfit.toFixed(1)+' N·m','Presión: '+(m.pressure/1e6).toFixed(2)+' MPa','Aro en el agujero: '+(m.hubHoop/1e6).toFixed(2)+' MPa'].forEach((s,i)=>g.fillText(s,14,35+i*35));return;}
 const field=mode==='low',L=48,R=w-16,T=45,B=h-30,lo=field?-Math.ceil(m.pressure/10e6)*10:0,hi=field?Math.ceil(m.hubHoop/10e6)*10:2500;
 g.fillText(field?'Lamé · aro dorado / radial turquesa':'Capacidad · chaveta / estriado / fricción',8,17,w-16);g.fillText(field?'MPa':'N·m',4,31);g.strokeStyle='#355267';g.beginPath();for(let i=0;i<=4;i++){const value=hi-(hi-lo)*i/4,y=T+(B-T)*i/4;g.moveTo(L,y);g.lineTo(R,y);g.fillText(value.toFixed(0),2,y+4);}g.stroke();g.fillText(field?'20':'20',L,B+20);g.fillText(field?'Radio · 37,5 mm':'Longitud · 60 mm',R-135,B+20);
 for(const [key,color]of (field?[['radial','#79e2d4'],['hoop','#eab67d']]:[['Tkey','#eab67d'],['Tspline','#94b5ed'],['Tfit','#79e2d4']])){g.strokeStyle=color;g.lineWidth=2;g.beginPath();for(let i=0;i<=180;i++){const q=field?hubField(m,m.d/2+(m.D-m.d)/2*i/180):shaftJoint({...p,length:20+40*i/180}),value=q[key]*(field?1e-6:1),x=L+(R-L)*i/180,y=B-(B-T)*(value-lo)/(hi-lo);i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}
 if(!field){g.strokeStyle='#c5d5df';g.setLineDash([4,4]);g.beginPath();g.moveTo(L,B-(B-T)*375/2500);g.lineTo(R,B-(B-T)*375/2500);g.stroke();g.setLineDash([]);}
}
function drawFourBar(g,w,h,m,mode,validated){
 if(!validated||mode==='peak'){['Error RMS: '+(m.rms*1000).toFixed(3)+' mm','Error máximo: '+(m.maxError*1000).toFixed(3)+' mm','Transmisión mínima: '+m.minAngle.toFixed(2)+'°','Velocidad del lápiz: '+(m.speed*1000).toFixed(2)+' mm/s'].forEach((s,i)=>g.fillText(s,14,35+i*35));return;}
 const L=48,R=w-16,T=45,B=h-30;
 if(mode==='low'){
  g.fillText('Ángulo agudo de transmisión · vuelta completa',8,17,w-16);g.fillText('°',6,31);g.strokeStyle='#355267';g.beginPath();for(let i=0;i<=3;i++){const y=T+(B-T)*i/3;g.moveTo(L,y);g.lineTo(R,y);g.fillText(String(90-30*i),8,y+4);}g.stroke();g.fillText('0',L,B+20);g.fillText('Manivela · 360°',R-116,B+20);
  g.strokeStyle='#79e2d4';g.lineWidth=2;g.beginPath();for(let i=0;i<=360;i++){const q=fourBar(m.a,m.b,i*2*Math.PI/360),x=L+(R-L)*i/360,y=B-(B-T)*q.transmission/90;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();g.strokeStyle='#eab67d';g.setLineDash([4,4]);g.beginPath();g.moveTo(L,(T+B)/2);g.lineTo(R,(T+B)/2);g.stroke();g.setLineDash([]);return;
 }
 g.fillText('Trayectoria · diseño turquesa / objetivo dorado',8,17,w-16);
 const curves=[[m.a,m.b,'#79e2d4'],[.132,.104,'#eab67d']].map(([a,b,color])=>({color,points:Array.from({length:361},(_,i)=>fourBar(a,b,i*2*Math.PI/360).P)})),all=curves.flatMap(c=>c.points),xmin=Math.min(...all.map(p=>p[0])),xmax=Math.max(...all.map(p=>p[0])),ymin=Math.min(...all.map(p=>p[1])),ymax=Math.max(...all.map(p=>p[1])),scale=Math.min((R-L)/(xmax-xmin),(B-T)/(ymax-ymin))*.90,ox=(L+R)/2-(xmin+xmax)*scale/2,oy=(T+B)/2+(ymin+ymax)*scale/2;
 g.fillText('XY · mm · escala igual en ambos ejes',8,31,w-16);
 for(const c of curves){g.strokeStyle=c.color;g.lineWidth=c.color==='#79e2d4'?3:1;g.beginPath();c.points.forEach((p,i)=>{const x=ox+p[0]*scale,y=oy-p[1]*scale;i?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();}g.fillText('Ancho: '+((xmax-xmin)*1000).toFixed(1)+' mm',L,B+20);
}
function drawBrake(g,w,h,m,p,mode,validated){
 if(!validated||mode==='peak'){['Capacidad: '+m.torque.toFixed(1)+' N·m','Tensión mayor: '+m.T1.toFixed(0)+' N','Parada: '+m.stopTime.toFixed(3)+' s','Calor registrado: '+(m.heat/1000).toFixed(2)+' kJ','Margen a−bE: '+(m.margin*1000).toFixed(2)+' mm'].forEach((s,i)=>g.fillText(s,14,35+i*35));return;}
 const compare=mode==='low',L=48,R=w-16,T=45,B=h-30,max=compare?Math.ceil(bandBrake({...p,friction:.30}).torque/100)*100:60;
 g.fillText(compare?'Capacidad · asistido / giro inverso':'Velocidad real · parada y reposo',8,17,w-16);g.fillText(compare?'N·m':'rad/s',4,31);g.strokeStyle='#355267';g.beginPath();for(let i=0;i<=4;i++){const y=T+(B-T)*i/4;g.moveTo(L,y);g.lineTo(R,y);g.fillText((max*(1-i/4)).toFixed(0),3,y+4);}g.stroke();g.fillText(compare?'0,10':'0',L,B+20);g.fillText(compare?'Fricción · 0,30':'Tiempo real · 8 s',R-125,B+20);
 for(const [key,color]of (compare?[['torque','#79e2d4'],['reverseTorque','#eab67d']]:[['omega','#79e2d4']])){g.strokeStyle=color;g.lineWidth=2;g.beginPath();for(let i=0;i<=200;i++){const q=compare?bandBrake({...p,friction:.1+.2*i/200}):bandBrake(p,8*i/200),x=L+(R-L)*i/200,y=B-(B-T)*q[key]/max;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}
}
function drawSpring(g,w,h,m,p,mode,validated){
 if(!validated||mode==='peak'){['Rigidez: '+(m.k/1000).toFixed(3)+' N/mm','Frecuencia real: '+m.fn.toFixed(3)+' Hz','Cortante pico: '+(m.stress/1e6).toFixed(1)+' MPa','Hasta bloque: '+(m.clearance*1000).toFixed(2)+' mm','Masa efectiva: '+m.effective.toFixed(4)+' kg'].forEach((s,i)=>g.fillText(s,14,35+i*35));return;}
 const force=mode==='low',L=48,R=w-16,T=45,B=h-30,max=force?80:4;
 g.fillText(force?'Fuerza / precarga · misma fase del carro':'Desplazamiento desde equilibrio · real',8,17,w-16);g.fillText(force?'N':'mm',4,31);g.strokeStyle='#355267';g.beginPath();for(let i=0;i<=4;i++){const y=T+(B-T)*i/4;g.moveTo(L,y);g.lineTo(R,y);g.fillText((force?max*(1-i/4):2-i).toFixed(0),8,y+4);}g.stroke();g.fillText('0',L,B+20);g.fillText('Demostración · 8 s',R-140,B+20);
 g.strokeStyle='#79e2d4';g.lineWidth=2;g.beginPath();for(let i=0;i<=240;i++){const q=spring(p,i*8/240),value=force?q.force:(q.L0-q.deflection-q.length)*1000,x=L+(R-L)*i/240,y=force?B-(B-T)*value/max:(T+B)/2-(B-T)*value/4;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();
 const time=Math.min(8,m.phase),q=spring(p,time),value=force?q.force:(q.L0-q.deflection-q.length)*1000,x=L+(R-L)*time/8,y=force?B-(B-T)*value/max:(T+B)/2-(B-T)*value/4;g.fillStyle='#eab67d';g.beginPath();g.arc(x,y,4,0,2*Math.PI);g.fill();
 if(force){g.strokeStyle='#eab67d';g.setLineDash([4,4]);g.beginPath();g.moveTo(L,B-(B-T)*m.F/max);g.lineTo(R,B-(B-T)*m.F/max);g.stroke();g.setLineDash([]);}
}
function drawRolling(g,w,h,m,p,mode,validated){
 if(!validated||mode==='peak'){['Rodamiento: '+m.name,'Carga equivalente: '+m.P.toFixed(0)+' N','Vida L10h: '+m.L10h.toFixed(0)+' h','Factores X / Y: '+m.X.toFixed(2)+' / '+m.Y.toFixed(3),'Seguridad estática s0: '+m.s0.toFixed(2)].forEach((s,i)=>g.fillText(s,14,35+i*35));return;}
 if(mode==='low'){
  g.fillText('Catálogo de esta edición · mismo agujero25mm',8,17,w-16);const L=70,C=(w-L-12)/3;g.textAlign='center';['6005','6205','6305'].forEach((s,i)=>g.fillText(s,L+C*(i+.5),40));g.textAlign='left';
  for(const [i,[key,label,scale]]of [['D','D (mm)',1000],['B','B (mm)',1000],['C','C (kN)',.001],['L10h','L10h (h)',1]].entries()){const y=69+30*i;g.fillStyle='#b5d2e2';g.fillText(label,8,y);g.textAlign='center';for(let bearing=1;bearing<=3;bearing++){const q=rollingBearing({...p,bearing});g.fillStyle=bearing===p.bearing?'#79e2d4':'#c5d1df';g.fillText((q[key]*scale).toFixed(key==='C'?1:0),L+C*(bearing-.5),y,C-4);}g.textAlign='left';}return;
 }
 const L=50,R=w-16,T=45,B=h-30,max=60000;g.fillText('L10h frente a carga radial · axial400N',8,17,w-16);g.fillText('h · techo60k',4,31);g.strokeStyle='#355267';g.beginPath();for(let i=0;i<=4;i++){const y=T+(B-T)*i/4;g.moveTo(L,y);g.lineTo(R,y);g.fillText((max*(1-i/4)/1000).toFixed(0)+'k',5,y+4);}g.stroke();g.fillText('400',L,B+20);g.fillText('Radial · 2200 N',R-112,B+20);
 for(const [bearing,color]of [[1,'#eab67d'],[2,'#79e2d4'],[3,'#94b5ed']]){g.strokeStyle=color;g.lineWidth=bearing===p.bearing?3:1;g.beginPath();for(let i=0;i<=180;i++){const value=Math.min(max,rollingBearing({bearing,radial:400+i*10}).L10h),x=L+(R-L)*i/180,y=B-(B-T)*value/max;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}
 g.strokeStyle='#c9d4dc';g.setLineDash([4,4]);g.beginPath();g.moveTo(L,B-(B-T)*15000/max);g.lineTo(R,B-(B-T)*15000/max);g.stroke();g.setLineDash([]);
}
function drawEccentric(g,w,h,m,p,mode,validated){
 if(!validated||mode==='peak'){['Soldadura: '+(m.weldPeak/1e6).toFixed(2)+' MPa','Remache: '+(m.rivetPeak/1e6).toFixed(2)+' MPa','Momento: '+(-m.M).toFixed(1)+' N·m','Utilización: '+m.utilization.toFixed(2)].forEach((t,i)=>g.fillText(t,14,35+i*35));return;}
 const L=48,R=w-16,T=45,B=h-30,lo=60,hi=200,max=mode==='low'?300:3;
 g.fillText(mode==='low'?'Cortante máximo · soldadura / remache':'Utilización · soldadura / remache',8,16,w-16);g.fillText(mode==='low'?'MPa':'τ / límite',4,31);g.strokeStyle='#355267';g.beginPath();for(let i=0;i<=4;i++){const y=T+(B-T)*i/4;g.moveTo(L,y);g.lineTo(R,y);g.fillText((max*(1-i/4)).toFixed(1),3,y+4);}g.stroke();g.fillText('60',L,B+20);g.fillText('Alcance · 200 mm',Math.max(L,R-130),B+20);
 for(const [key,color,limit]of [['weldPeak','#79e2d4',60e6],['rivetPeak','#eab67d',100e6]]){g.strokeStyle=color;g.lineWidth=2;g.beginPath();for(let i=0;i<=140;i++){const q=eccentric({...p,eccentricity:lo+(hi-lo)*i/140}),x=L+(R-L)*i/140,y=B-(B-T)*q[key]/(mode==='low'?1e6:limit)/max;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}
}
function drawHelical(g,w,h,m,p,mode,validated){
 if(!validated||mode==='peak'){['Empuje axial: '+m.Fa.toFixed(1)+' N','Fuerza tangencial: '+m.Ft.toFixed(1)+' N','Recubrimiento transversal: '+m.transverse.toFixed(3),'Recubrimiento axial: '+m.overlap.toFixed(3)].forEach((t,i)=>g.fillText(t,14,35+i*35));return;}
 const force=mode==='low',L=48,R=w-16,T=45,B=h-30,max=force?900:4.5,lo=10,hi=force?35:40;
 g.fillText(force?'Fuerzas Ft / Fa / Fr frente a la hélice':'Recubrimiento total / transversal / axial frente al ancho',8,16,w-16);g.fillText(force?'N':'ε',5,31);g.strokeStyle='#355267';g.beginPath();for(let i=0;i<=4;i++){const y=T+(B-T)*i/4;g.moveTo(L,y);g.lineTo(R,y);g.fillText((max*(1-i/4)).toFixed(force?0:1),4,y+4);}g.stroke();g.fillText('10',L,B+20);g.fillText(force?'Hélice · 35°':'Cara · 40 mm',Math.max(L,R-115),B+20);
 for(const [key,color]of (force?[['Ft','#79e2d4'],['Fa','#eab67d'],['Fr','#8eb7ed']]:[['total','#79e2d4'],['transverse','#eab67d'],['overlap','#8eb7ed']])){g.strokeStyle=color;g.lineWidth=2;g.beginPath();for(let i=0;i<=140;i++){const x=lo+(hi-lo)*i/140,q=helical({...p,[force?'beta':'width']:x}),X=L+(R-L)*i/140,Y=B-(B-T)*q[key]/max;i?g.lineTo(X,Y):g.moveTo(X,Y);}g.stroke();}
}
function drawPlanetary(g,w,h,m,p,mode,validated){
 if(!validated||mode==='peak'){[['Sol',m.sun],['Corona',m.ring],['Portador',m.carrier],['Planeta absoluto',m.planet]].forEach(([label,value],i)=>g.fillText(label+': '+value.toFixed(1)+' rpm',14,35+i*35));return;}
 if(mode==='full'){
  g.fillText('Tabla de velocidades absolutas · misma entrada',10,17,w-20);const left=65,col=(w-left-10)/3;
  g.font='11px Outfit,system-ui';g.fillText('Fijo:',8,40);g.textAlign='center';['Portador','Corona','Sol'].forEach((text,i)=>g.fillText(text,left+col*(i+.5),40,col-4));g.textAlign='left';
  for(const [i,[key,label]]of [['sun','Sol'],['ring','Corona'],['carrier','Portador'],['planet','Planeta']].entries()){const y=66+i*29;g.fillStyle='#adc4d1';g.fillText(label,8,y);g.strokeStyle='#355267';g.beginPath();g.moveTo(8,y+8);g.lineTo(w-10,y+8);g.stroke();g.textAlign='center';for(let fixed=1;fixed<=3;fixed++){g.fillStyle=p.fixed===fixed?'#7ce4d5':'#c1d3df';g.fillText(planetary({...p,fixed})[key].toFixed(0),left+col*(fixed-.5),y,col-4);}g.textAlign='left';}g.fillStyle='#adc4d1';g.fillText('rpm · signo negativo = giro inverso',8,h-10,w-16);return;
 }
 const rows=[['Sol',m.sun],['Corona',m.ring],['Portador',m.carrier],['Planeta',m.planet]],max=Math.max(1,...rows.map(r=>Math.abs(r[1]))),L=66,R=w-12,center=(L+R)/2,scale=(R-L)*.43/max;g.fillText('Sentido y magnitud · rpm',8,17,w-16);g.strokeStyle='#456075';g.beginPath();g.moveTo(center,30);g.lineTo(center,h-18);g.stroke();rows.forEach(([name,value],i)=>{const y=48+35*i;g.fillStyle='#b8ccda';g.fillText(name,6,y);g.fillStyle=value<0?'#eab67d':'#7ce4d5';g.fillRect(Math.min(center,center+value*scale),y-13,Math.max(1,Math.abs(value*scale)),16);g.fillStyle='#e0e9ef';g.textAlign='center';g.fillText(value.toFixed(0),center,y+16);g.textAlign='left';});
}
function drawHydrodynamic(g,w,h,m,mode,validated){
 if(!validated||mode==='peak'){['Película mínima: '+(m.minFilm*1e6).toFixed(2)+' µm','Coeficiente de fricción: '+m.frictionCoefficient.toFixed(4),'Pérdidas: '+m.power.toFixed(1)+' W','Presión pico: '+(m.pressureMax/1e6).toFixed(2)+' MPa','Caudal lateral: '+(m.oilFlow*6e7).toFixed(1)+' mL/min'].forEach((text,i)=>g.fillText(text,14,35+i*35));return;}
 const pressure=mode==='low',L=48,R=w-16,T=45,B=h-30,max=pressure?Math.max(20,Math.ceil(m.pressureMax/5e6)*5):100;
 g.fillText(pressure?'Presión central · color 0–20 MPa':'Película real · objetivo mínimo 12 µm',8,16,w-16);g.fillText(pressure?'MPa':'µm',4,31);g.strokeStyle='#355267';g.beginPath();for(let i=0;i<=4;i++){const y=T+(B-T)*i/4;g.moveTo(L,y);g.lineTo(R,y);g.fillText((max*(1-i/4)).toFixed(0),4,y+4);}g.stroke();g.fillText('0',L,B+20);g.fillText('Desde holgura máxima · 360°',Math.max(L,R-210),B+20);
 g.strokeStyle=pressure?'#edb87c':'#7ce4d5';g.lineWidth=2;g.beginPath();for(let i=0;i<=240;i++){const theta=i*2*Math.PI/240,value=pressure?bearingPressure(m,theta,0)/1e6:m.c*(1+m.e*Math.cos(theta))*1e6,x=L+(R-L)*i/240,y=B-(B-T)*value/max;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();if(!pressure){g.strokeStyle='#edb87c';g.setLineDash([4,4]);g.beginPath();g.moveTo(L,B-(B-T)*12/max);g.lineTo(R,B-(B-T)*12/max);g.stroke();g.setLineDash([]);}
}
