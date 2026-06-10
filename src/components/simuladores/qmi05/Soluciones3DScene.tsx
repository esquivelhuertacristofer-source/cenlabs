"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }    from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass }    from 'three/examples/jsm/postprocessing/ShaderPass.js';

// ── Vignette + film grain (no bloom — bloom was causing overexposure) ──────────
const CinematicShader = {
  uniforms: { tDiffuse:{value:null}, vignette:{value:0.28}, time:{value:0} },
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`
    uniform sampler2D tDiffuse;uniform float vignette,time;varying vec2 vUv;
    float rand(vec2 c){return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453);}
    void main(){
      vec4 col=texture2D(tDiffuse,vUv);
      float grain=(rand(vUv+time*.007)-.5)*.014;
      float vig=smoothstep(1.,.2,distance(vUv,vec2(.5))*vignette);
      gl_FragColor=vec4((col.rgb+grain)*vig,1.);
    }`,
};

interface SceneProps {
  polvo:number; tara:boolean;
  matrazPolvo:number; matrazAgua:number; vTarget:number;
  salColor:string;
  phase:'prelab'|'weighing'|'dissolving'|'aforo';
  mRequerida?:number;
}

// ── LCD display canvas ─────────────────────────────────────────────────────────
function makeDisplay():[CanvasRenderingContext2D,THREE.CanvasTexture]{
  const c=document.createElement('canvas'); c.width=512; c.height=192;
  return [c.getContext('2d')!, new THREE.CanvasTexture(c)];
}
function paintDisplay(ctx:CanvasRenderingContext2D,tex:THREE.CanvasTexture,
  polvo:number,tara:boolean,mReq:number){
  const W=512,H=192;
  ctx.fillStyle='#060f08'; ctx.fillRect(0,0,W,H);
  for(let y=0;y<H;y+=4){ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(0,y,W,1);}
  ctx.font='bold 13px monospace'; ctx.textAlign='center';
  ctx.fillStyle='#164424'; ctx.fillText('ANALYTICAL BALANCE',W/2,20);
  const inRange=!tara&&mReq>0&&Math.abs(polvo-mReq)/mReq<=0.05;
  const col=tara?'#3a8a4a':inRange?'#20e860':'#00d4f0';
  ctx.save();
  ctx.font='bold 82px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowBlur=12; ctx.shadowColor=col; ctx.fillStyle=col;
  ctx.fillText((tara?'0.000':polvo.toFixed(3))+'  g',W/2,H/2+6);
  ctx.restore();
  if(mReq>0&&!tara){
    const pct=Math.max(0,100-Math.abs(polvo-mReq)/mReq*100);
    const c2=pct>95?'#20e860':pct>70?'#f0c020':'#e04040';
    ctx.font='bold 15px monospace'; ctx.fillStyle=c2; ctx.shadowBlur=4; ctx.shadowColor=c2;
    ctx.fillText(`${pct.toFixed(1)}%  |  target ${mReq} g`,W/2,H-14);
  }
  tex.needsUpdate=true;
}

interface Eng {
  renderer:THREE.WebGLRenderer; scene:THREE.Scene;
  camera:THREE.PerspectiveCamera; composer:EffectComposer;
  controls:OrbitControls; cin:ShaderPass;
  frameId:number; time:number;
  balPowder:THREE.Mesh; dispCtx:CanvasRenderingContext2D; dispTex:THREE.CanvasTexture;
  balRing:THREE.Mesh;
  bodyLiq:THREE.Mesh; neckLiq:THREE.Mesh; sediment:THREE.Mesh;
  liqSurface:THREE.Mesh; calibRing:THREE.Mesh;
  molPts:THREE.Points; transPts:THREE.Points;
  transCurve:THREE.QuadraticBezierCurve3; transT:number;
  cached:SceneProps;
}

export default function Soluciones3DScene(props:SceneProps){
  const containerRef=useRef<HTMLDivElement>(null);
  const engRef=useRef<Eng|null>(null);

  useEffect(()=>{
    const el=containerRef.current; if(!el) return;
    const W=el.clientWidth||900, H=el.clientHeight||600;

    // ── Renderer ─────────────────────────────────────────────────────────────
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    renderer.setSize(W,H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
    renderer.toneMapping=THREE.ReinhardToneMapping;
    renderer.toneMappingExposure=1.55;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.domElement.style.cssText='display:block;width:100%;height:100%;';
    el.appendChild(renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0x0c1828);
    scene.fog=new THREE.Fog(0x0c1828,60,130);

    // ── Camera ────────────────────────────────────────────────────────────────
    const camera=new THREE.PerspectiveCamera(52,W/H,0.1,300);
    camera.position.set(0,18,46);
    camera.lookAt(0,5,0);

    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true; controls.dampingFactor=0.06;
    controls.target.set(0,6,0);
    controls.maxPolarAngle=Math.PI/2.0;
    controls.minDistance=14; controls.maxDistance=70;

    // ── Post — only vignette, NO bloom ───────────────────────────────────────
    const composer=new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene,camera));
    const cin=new ShaderPass(CinematicShader);
    composer.addPass(cin);

    // ── LIGHTING — professional 3-point + environment ────────────────────────
    // Hemisphere: sky cool / ground warm bounce
    const hemi=new THREE.HemisphereLight(0xc8dcf0,0x4a6070,2.2);
    scene.add(hemi);

    // Key: warm overhead front-right, with shadows
    const key=new THREE.DirectionalLight(0xfff8f0,3.2);
    key.position.set(10,30,20);
    key.castShadow=true;
    key.shadow.mapSize.set(2048,2048);
    key.shadow.camera.near=1; key.shadow.camera.far=120;
    key.shadow.camera.left=-35; key.shadow.camera.right=35;
    key.shadow.camera.top=30; key.shadow.camera.bottom=-10;
    key.shadow.bias=-0.001;
    scene.add(key);

    // Fill: cool from left
    const fill=new THREE.DirectionalLight(0xb8d0f0,1.6);
    fill.position.set(-15,12,18);
    scene.add(fill);

    // Rim: behind for silhouette separation
    const rim=new THREE.DirectionalLight(0x7aaad0,1.0);
    rim.position.set(0,12,-18);
    scene.add(rim);

    // Floor bounce: simulates reflective lab floor
    const bounce=new THREE.DirectionalLight(0x8ab0d0,0.8);
    bounce.position.set(0,-8,12);
    scene.add(bounce);

    // Overhead strip light (ceiling — fills upper scene)
    const ceiling=new THREE.DirectionalLight(0xddeeff,1.4);
    ceiling.position.set(0,50,5);
    scene.add(ceiling);

    // ── ENVIRONMENT ───────────────────────────────────────────────────────────
    // Floor — polished lab tile
    const floorMat=new THREE.MeshStandardMaterial({
      color:0x1a2e44,roughness:0.15,metalness:0.55,
    });
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),floorMat);
    floor.rotation.x=-Math.PI/2; floor.position.y=-0.3;
    floor.receiveShadow=true;
    scene.add(floor);

    // Grid
    const grid=new THREE.GridHelper(80,40,0x243a52,0x162438);
    grid.position.y=-0.28;
    scene.add(grid);

    // Lab bench — visible slate surface
    const benchMat=new THREE.MeshStandardMaterial({
      color:0x2a3e54,roughness:0.38,metalness:0.30,
    });
    const bench=new THREE.Mesh(new THREE.BoxGeometry(80,1.2,18),benchMat);
    bench.position.y=-0.6; bench.receiveShadow=true; bench.castShadow=true;
    scene.add(bench);

    // Bench edge highlight
    const edgeMat=new THREE.MeshStandardMaterial({
      color:0x3a5878,roughness:0.2,metalness:0.7,
      emissive:0x162840,emissiveIntensity:1.2,
    });
    const edge=new THREE.Mesh(new THREE.BoxGeometry(80,0.07,0.3),edgeMat);
    edge.position.set(0,0.02,9);
    scene.add(edge);

    // Back wall — medium dark, clearly visible
    const wallMat=new THREE.MeshStandardMaterial({color:0x1e3048,roughness:0.88});
    const wall=new THREE.Mesh(new THREE.PlaneGeometry(120,55),wallMat);
    wall.position.set(0,24,-15);
    scene.add(wall);

    // Wall tile lines (horizontal — lab aesthetic)
    const tileMat=new THREE.MeshStandardMaterial({
      color:0x243850,roughness:0.9,
      emissive:0x0e1e30,emissiveIntensity:0.5,
    });
    for(let y=2;y<40;y+=8){
      const tile=new THREE.Mesh(new THREE.BoxGeometry(120,0.05,0.1),tileMat);
      tile.position.set(0,y,-14.9);
      scene.add(tile);
    }

    // Overhead lab neon strip (emissive — gives ambient ceiling feel)
    const neonMat=new THREE.MeshStandardMaterial({
      color:0xffffff,emissive:0xddeeff,emissiveIntensity:1.5,
    });
    const neon=new THREE.Mesh(new THREE.BoxGeometry(28,0.15,1.2),neonMat);
    neon.position.set(0,36,0);
    scene.add(neon);

    // ── ANALYTICAL BALANCE — medium gray (realistic, not white-overblown) ─────
    const BX=-12;
    const balGrp=new THREE.Group(); balGrp.position.set(BX,-0.5,0);

    const houseMat=new THREE.MeshStandardMaterial({
      color:0xa8b4be,   // light-medium gray — realistic analytical balance
      metalness:0.08,roughness:0.48,
    });

    const base=new THREE.Mesh(new THREE.BoxGeometry(9.5,0.7,7.2),houseMat);
    base.position.y=0.35; base.castShadow=true; base.receiveShadow=true; balGrp.add(base);

    const housing=new THREE.Mesh(new THREE.BoxGeometry(8.8,9.0,6.5),houseMat);
    housing.position.y=5.1; housing.castShadow=true; housing.receiveShadow=true; balGrp.add(housing);

    const topCapMat=new THREE.MeshStandardMaterial({color:0x6878888,roughness:0.5,metalness:0.1});
    const topCap=new THREE.Mesh(new THREE.BoxGeometry(8.8,0.4,6.5),topCapMat);
    topCap.position.y=9.8; balGrp.add(topCap);

    // Glass chamber — very subtle, barely visible
    const glassDoor=new THREE.MeshPhysicalMaterial({
      color:0xe0ecff,transparent:true,opacity:0.10,
      roughness:0.0,metalness:0,side:THREE.DoubleSide,
    });
    const door=new THREE.Mesh(new THREE.PlaneGeometry(7.4,6.8),glassDoor);
    door.position.set(0,5.9,3.26); balGrp.add(door);
    [-3.26,3.26].forEach(z=>{
      const side=new THREE.Mesh(new THREE.PlaneGeometry(6.0,6.8),glassDoor);
      side.position.set(z>0?4.45:-4.45,5.9,0);
      side.rotation.y=Math.PI/2; balGrp.add(side);
    });

    // Control strip
    const ctrlMat=new THREE.MeshStandardMaterial({color:0x707880,roughness:0.55,metalness:0.12});
    const ctrl=new THREE.Mesh(new THREE.BoxGeometry(8.8,2.0,0.5),ctrlMat);
    ctrl.position.set(0,1.3,3.26); balGrp.add(ctrl);

    // Buttons
    const btnMat=new THREE.MeshStandardMaterial({color:0x3a5068,roughness:0.4,metalness:0.3});
    [-2,-0.5,1].forEach(x=>{
      const btn=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.12,12),btnMat);
      btn.rotation.x=Math.PI/2; btn.position.set(x,1.3,3.52); balGrp.add(btn);
    });

    // Display inset
    const dispInset=new THREE.Mesh(
      new THREE.BoxGeometry(6.2,1.6,0.05),
      new THREE.MeshStandardMaterial({color:0x060c08,roughness:0.3})
    );
    dispInset.position.set(0,1.2,3.54); balGrp.add(dispInset);

    const [dispCtx,dispTex]=makeDisplay();
    paintDisplay(dispCtx,dispTex,props.polvo,props.tara,props.mRequerida??0);
    const dispMesh=new THREE.Mesh(
      new THREE.PlaneGeometry(5.8,1.4),
      new THREE.MeshBasicMaterial({map:dispTex})
    );
    dispMesh.position.set(0,1.2,3.57); balGrp.add(dispMesh);

    // Column + pan
    const silvMat=new THREE.MeshStandardMaterial({color:0x8898a8,metalness:0.85,roughness:0.12});
    const col=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,2.4,16),silvMat);
    col.position.set(0,11.2,-0.5); balGrp.add(col);

    const pan=new THREE.Mesh(new THREE.CylinderGeometry(2.9,2.5,0.14,40),silvMat);
    pan.position.set(0,12.5,-0.5); pan.castShadow=true; balGrp.add(pan);

    // Active ring (emissive accent — the ONLY thing that glows)
    const balRing=new THREE.Mesh(
      new THREE.TorusGeometry(2.9,0.07,8,48),
      new THREE.MeshStandardMaterial({
        color:0x00ccee,emissive:0x00ccee,emissiveIntensity:0.0,
        roughness:0.2,metalness:0.3,
      })
    );
    balRing.rotation.x=Math.PI/2; balRing.position.set(0,12.62,-0.5); balGrp.add(balRing);

    // Powder pile
    const balPowder=new THREE.Mesh(
      new THREE.CylinderGeometry(2.3,2.5,0.8,32),
      new THREE.MeshStandardMaterial({color:0xeeeae0,roughness:0.90,metalness:0.0})
    );
    balPowder.position.set(0,12.95,-0.5); balPowder.visible=false;
    balPowder.castShadow=true; balGrp.add(balPowder);

    scene.add(balGrp);

    // ── VOLUMETRIC FLASK — clear borosilicate glass ───────────────────────────
    const FX=12;
    const flaskGrp=new THREE.Group(); flaskGrp.position.set(FX,-0.5,0);

    // Borosilicate: very low opacity, subtle blue tint — looks like real lab glass
    const glassMat=new THREE.MeshPhysicalMaterial({
      color:0xdceeff,
      transparent:true, opacity:0.22,
      roughness:0.04, metalness:0.0,
      side:THREE.DoubleSide,
    });

    const bulb=new THREE.Mesh(new THREE.SphereGeometry(5,32,24),glassMat);
    bulb.position.y=5.2; bulb.castShadow=true; flaskGrp.add(bulb);

    const shoulder=new THREE.Mesh(new THREE.CylinderGeometry(1.4,4.6,3.5,32),glassMat);
    shoulder.position.y=11.4; flaskGrp.add(shoulder);

    const neck=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,9,24),glassMat);
    neck.position.y=16.4; flaskGrp.add(neck);

    // Neck rim — stainless
    const rimMat=new THREE.MeshStandardMaterial({color:0x788898,metalness:0.7,roughness:0.18});
    const neckRim=new THREE.Mesh(new THREE.TorusGeometry(1.5,0.12,8,32),rimMat);
    neckRim.position.y=20.8; flaskGrp.add(neckRim);

    // Calibration mark — the main emissive accent of the flask
    const calibRing=new THREE.Mesh(
      new THREE.TorusGeometry(1.46,0.09,8,64),
      new THREE.MeshStandardMaterial({
        color:0xff3300,emissive:0xff2200,emissiveIntensity:2.0,
      })
    );
    calibRing.position.y=13.5; flaskGrp.add(calibRing);

    // Volume graduation marks (thin white rings for detail)
    [12.0,11.0,10.0].forEach((y,i)=>{
      const mark=new THREE.Mesh(
        new THREE.TorusGeometry(1.48,0.025,4,48),
        new THREE.MeshStandardMaterial({
          color:0xffffff,emissive:0x888888,
          emissiveIntensity:i===0?0.6:0.3,
        })
      );
      mark.position.y=y; flaskGrp.add(mark);
    });

    // Stand
    const standMat=new THREE.MeshStandardMaterial({color:0x3c4a58,metalness:0.82,roughness:0.22});
    const standRing=new THREE.Mesh(new THREE.TorusGeometry(3.6,0.48,8,32),standMat);
    standRing.rotation.x=Math.PI/2; standRing.position.y=0.2;
    standRing.castShadow=true; flaskGrp.add(standRing);
    for(let a=0;a<3;a++){
      const ang=a*(Math.PI*2/3);
      const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.22,1.5,8),standMat);
      leg.position.set(Math.cos(ang)*2.8,-0.55,Math.sin(ang)*2.8);
      flaskGrp.add(leg);
    }

    // ── LIQUID ────────────────────────────────────────────────────────────────
    const liqBaseMat=new THREE.MeshStandardMaterial({
      color:0x60a5fa,transparent:true,opacity:0.80,
      roughness:0.04,emissive:0x1a3a80,emissiveIntensity:0.2,
    });

    const bodyLiq=new THREE.Mesh(
      new THREE.CylinderGeometry(4.5,4.5,1,36),
      liqBaseMat.clone()
    );
    bodyLiq.position.y=0.5; bodyLiq.visible=false; flaskGrp.add(bodyLiq);

    const neckLiq=new THREE.Mesh(
      new THREE.CylinderGeometry(1.3,1.3,1,24),
      liqBaseMat.clone()
    );
    neckLiq.position.y=13.5; neckLiq.visible=false; flaskGrp.add(neckLiq);

    const liqSurfMat=new THREE.MeshStandardMaterial({
      color:0x93c5fd,emissive:0x2a60c0,emissiveIntensity:0.35,
      transparent:true,opacity:0.55,
    });
    const liqSurface=new THREE.Mesh(new THREE.CircleGeometry(4.3,32),liqSurfMat.clone());
    liqSurface.rotation.x=-Math.PI/2; liqSurface.position.y=0.5; liqSurface.visible=false;
    flaskGrp.add(liqSurface);

    const sediment=new THREE.Mesh(
      new THREE.CylinderGeometry(3.4,1.0,0.5,32),
      new THREE.MeshStandardMaterial({color:0xeeeae0,roughness:0.88,transparent:true,opacity:0.65})
    );
    sediment.position.y=0.8; sediment.visible=false; flaskGrp.add(sediment);

    scene.add(flaskGrp);

    // ── MOLECULE PARTICLES ────────────────────────────────────────────────────
    const N=70;
    const molGeo=new THREE.BufferGeometry();
    molGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3));
    const molPts=new THREE.Points(molGeo,new THREE.PointsMaterial({
      color:0x93c5fd,size:0.26,transparent:true,opacity:0,
      blending:THREE.AdditiveBlending,depthWrite:false,
    }));
    scene.add(molPts);

    // ── TRANSFER PARTICLES ────────────────────────────────────────────────────
    const T=60;
    const transGeo=new THREE.BufferGeometry();
    transGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(T*3),3));
    const transPts=new THREE.Points(transGeo,new THREE.PointsMaterial({
      color:0xffffff,size:0.28,transparent:true,opacity:0,
      blending:THREE.AdditiveBlending,depthWrite:false,
    }));
    scene.add(transPts);

    const transCurve=new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(BX,13.5,0),
      new THREE.Vector3(0,30,0),
      new THREE.Vector3(FX,22,0)
    );

    // ── Engine ref ────────────────────────────────────────────────────────────
    engRef.current={
      renderer,scene,camera,composer,controls,cin,frameId:0,time:0,
      balPowder,dispCtx,dispTex,balRing,
      bodyLiq,neckLiq,sediment,liqSurface,calibRing,
      molPts,transPts,transCurve,transT:0,
      cached:{...props},
    };

    // Resize
    const ro=new ResizeObserver(()=>{
      if(!el) return;
      const w=el.clientWidth,h=el.clientHeight;
      renderer.setSize(w,h); composer.setSize(w,h);
      camera.aspect=w/h; camera.updateProjectionMatrix();
    });
    ro.observe(el);

    // ── ANIMATION LOOP ────────────────────────────────────────────────────────
    const BODY_MAX_H=9.4;
    const NECK_START_Y=13;
    const NECK_MAX_H=6.5;

    const animate=()=>{
      const eng=engRef.current; if(!eng) return;
      eng.time+=0.016;
      const t=eng.time; const p=eng.cached;
      cin.uniforms.time.value=t;
      controls.update();

      // Balance powder
      if(p.polvo>0.001){
        const h=Math.min(2.0,p.polvo*0.28);
        eng.balPowder.scale.y=Math.max(0.01,h);
        eng.balPowder.position.set(0,12.55+h*0.5,-0.5);
        eng.balPowder.visible=true;
        const inRange=!!(p.mRequerida&&Math.abs(p.polvo-p.mRequerida)/p.mRequerida<=0.05);
        const rm=eng.balRing.material as THREE.MeshStandardMaterial;
        const targetIntensity=inRange?3.5:0.6;
        rm.emissiveIntensity=THREE.MathUtils.lerp(rm.emissiveIntensity,targetIntensity,0.08);
        const ringColor=inRange?0x22ee66:0x00ccee;
        rm.color.setHex(ringColor); rm.emissive.setHex(ringColor);
      } else {
        eng.balPowder.visible=false;
        const rm=eng.balRing.material as THREE.MeshStandardMaterial;
        rm.emissiveIntensity=THREE.MathUtils.lerp(rm.emissiveIntensity,0,0.06);
      }

      // Flask liquid
      const fr=p.matrazAgua/Math.max(1,p.vTarget);
      if(p.matrazAgua>0){
        const bodyR=Math.min(1,fr/0.8);
        const bodyH=Math.max(0.001,bodyR*BODY_MAX_H);
        eng.bodyLiq.visible=true;
        eng.bodyLiq.scale.y=bodyH;
        eng.bodyLiq.position.y=0.5+bodyH*0.5;
        eng.liqSurface.visible=true;
        eng.liqSurface.position.y=0.5+bodyH;
      } else {
        eng.bodyLiq.visible=false;
        eng.liqSurface.visible=false;
      }
      if(fr>0.8){
        const neckR=(fr-0.8)/0.2;
        const neckH=Math.max(0.001,neckR*NECK_MAX_H);
        eng.neckLiq.visible=true;
        eng.neckLiq.scale.y=neckH;
        eng.neckLiq.position.y=NECK_START_Y+neckH*0.5;
        eng.liqSurface.position.y=NECK_START_Y+neckH;
      } else {
        eng.neckLiq.visible=false;
      }
      eng.sediment.visible=p.matrazPolvo>0;

      // Calibration ring — red stays, turns cyan when near target
      const nearMark=p.matrazAgua>p.vTarget*0.88;
      const cm=eng.calibRing.material as THREE.MeshStandardMaterial;
      cm.emissive.setHex(nearMark?0x00ffdd:0xff2200);
      cm.color.setHex(nearMark?0x00ffdd:0xff3300);
      cm.emissiveIntensity=THREE.MathUtils.lerp(cm.emissiveIntensity,nearMark?3.5:2.0,0.07);

      // Liquid color
      if(p.matrazPolvo>0){
        const lc=new THREE.Color(p.salColor);
        const setLiqColor=(m:THREE.Material)=>{
          const ms=m as THREE.MeshStandardMaterial;
          ms.color.set(lc); ms.emissive.set(lc); ms.emissiveIntensity=0.18;
        };
        setLiqColor(eng.bodyLiq.material as THREE.Material);
        setLiqColor(eng.neckLiq.material as THREE.Material);
        setLiqColor(eng.liqSurface.material as THREE.Material);
        (eng.sediment.material as THREE.MeshStandardMaterial).color.set(lc);
      }

      // Molecule particles
      const hasSol=p.matrazPolvo>0&&p.matrazAgua>0&&p.phase!=='dissolving';
      const mm=eng.molPts.material as THREE.PointsMaterial;
      mm.opacity=THREE.MathUtils.lerp(mm.opacity,hasSol?0.65:0,0.04);
      if(hasSol){
        mm.color.set(p.salColor);
        const pos=eng.molPts.geometry.attributes.position.array as Float32Array;
        const fillH=Math.min(BODY_MAX_H,fr*BODY_MAX_H);
        for(let i=0;i<N;i++){
          const a=t*0.18+i*(Math.PI*2/N);
          const r=((i%4)+1)*0.88;
          const yo=Math.sin(t*0.4+i*0.62)*0.7;
          pos[i*3]  =FX+r*Math.cos(a);
          pos[i*3+1]=-0.5+1+(i/N)*fillH*0.9+yo;
          pos[i*3+2]=r*Math.sin(a);
        }
        eng.molPts.geometry.attributes.position.needsUpdate=true;
      }

      // Transfer particles
      const tm=eng.transPts.material as THREE.PointsMaterial;
      if(p.phase==='dissolving'){
        eng.transT=Math.min(1,eng.transT+0.007);
        tm.opacity=THREE.MathUtils.lerp(tm.opacity,0.8,0.08);
        const pos=eng.transPts.geometry.attributes.position.array as Float32Array;
        for(let i=0;i<T;i++){
          const param=(eng.transT+(i/T)*0.65)%1;
          const pt=eng.transCurve.getPoint(param);
          const j=(Math.sin(t*3+i)-.5)*0.55;
          pos[i*3]=pt.x+j; pos[i*3+1]=pt.y+j*.3; pos[i*3+2]=pt.z+j;
        }
        eng.transPts.geometry.attributes.position.needsUpdate=true;
      } else {
        eng.transT=0;
        tm.opacity=THREE.MathUtils.lerp(tm.opacity,0,0.1);
      }

      composer.render();
      eng.frameId=requestAnimationFrame(animate);
    };
    animate();

    return ()=>{
      ro.disconnect();
      if(engRef.current) cancelAnimationFrame(engRef.current.frameId);
      controls.dispose();
      scene.traverse(obj=>{
        if(obj instanceof THREE.Mesh){
          obj.geometry.dispose();
          if(Array.isArray(obj.material)) obj.material.forEach(m=>m.dispose());
          else obj.material.dispose();
        }
      });
      composer.dispose();
      renderer.dispose();
      if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      engRef.current=null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // ── Sync props → engine ────────────────────────────────────────────────────
  useEffect(()=>{
    const eng=engRef.current; if(!eng) return;
    eng.cached={...props};
    paintDisplay(eng.dispCtx,eng.dispTex,props.polvo,props.tara,props.mRequerida??0);
    switch(props.phase){
      case 'prelab':   controls_focus(eng,0,6,0); break;
      case 'weighing': controls_focus(eng,-6,8,0); break;
      case 'dissolving': controls_focus(eng,0,10,0); break;
      case 'aforo':
        controls_focus(eng,
          props.matrazAgua>props.vTarget*0.88?12:8,
          props.matrazAgua>props.vTarget*0.88?14:8,
          0
        ); break;
    }
  },[props]);

  return <div ref={containerRef} className="w-full h-full outline-none"/>;
}

function controls_focus(eng:Eng,x:number,y:number,z:number){
  eng.controls.target.set(x,y,z);
}
