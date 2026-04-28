"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

interface Atomic3DSceneProps {
    protons: number;
    neutrons: number;
    electrons: number;
    instability: number; 
}

const CinematicShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "time": { value: 0.0 },
        "distortion": { value: 0.0015 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float distortion;
        varying vec2 vUv;
        float rand(vec2 co){ return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); }
        void main() {
            vec2 offset = vec2(distortion * (vUv.x - 0.5), distortion * (vUv.y - 0.5));
            float r = texture2D(tDiffuse, vUv + offset).r;
            float g = texture2D(tDiffuse, vUv).g;
            float b = texture2D(tDiffuse, vUv - offset).b;
            vec3 color = vec3(r, g, b);
            vec2 uv = vUv * (1.0 - vUv.yx);
            float vig = uv.x * uv.y * 15.0; 
            vig = pow(vig, 0.3);
            color *= vig;
            float noise = (rand(vUv * time) - 0.5) * 0.04;
            color += noise;
            gl_FragColor = vec4(color, 1.0);
        }
    `
};

export default function Atomic3DScene({ protons, neutrons, electrons, instability }: Atomic3DSceneProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const stateRef = useRef({ protons, neutrons, electrons, instability });
    
    useEffect(() => {
        stateRef.current = { protons, neutrons, electrons, instability };
    }, [protons, neutrons, electrons, instability]);

    const engineRef = useRef<{
        scene?: THREE.Scene, camera?: THREE.PerspectiveCamera, renderer?: THREE.WebGLRenderer,
        composer?: EffectComposer, controls?: OrbitControls,
        nucleusGroup?: THREE.Group, electronsGroup?: THREE.Group,
        hudGroup?: THREE.Group, nebulaPoints?: THREE.Points, dustPoints?: THREE.Points,
        nucleonMeshes: any[], electronMeshes: any[],
        cinematicPass?: ShaderPass, frameId?: number, clock: THREE.Clock,
        baseCameraPos: THREE.Vector3
    }>({
        nucleonMeshes: [], electronMeshes: [], clock: new THREE.Clock(),
        baseCameraPos: new THREE.Vector3(0, 6, 28)
    });

    const buildAtom = () => {
        const eng = engineRef.current;
        const { protons: p, neutrons: n, electrons: e } = stateRef.current;
        if (!eng.scene || !eng.nucleusGroup || !eng.electronsGroup) return;

        while(eng.nucleusGroup.children.length > 0) eng.nucleusGroup.remove(eng.nucleusGroup.children[0]); 
        while(eng.electronsGroup.children.length > 0) eng.electronsGroup.remove(eng.electronsGroup.children[0]); 
        eng.electronMeshes = []; eng.nucleonMeshes = [];

        // MATERIALES VOLUMÉTRICOS (SIN PARPADEO)
        const protonMat = new THREE.MeshPhysicalMaterial({
            color: 0xff1a40,
            emissive: 0xff1a40,
            emissiveIntensity: 0.5, // Brillo propio para distribución uniforme
            roughness: 0.3,
            metalness: 0.1,
            transmission: 0.05,
            clearcoat: 0.5
        });

        const neutronMat = new THREE.MeshPhysicalMaterial({
            color: 0x1a66ff,
            emissive: 0x1a66ff,
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.1,
            transmission: 0.05,
            clearcoat: 0.5
        });
        const electronMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const cloudMat = new THREE.PointsMaterial({ color: 0x00ffcc, size: 0.04, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false });

        // NUCLEO
        const totalNucleons = p + n;
        const phi = Math.PI * (3 - Math.sqrt(5));
        let nucleons: string[] = [];
        for(let i=0; i<p; i++) nucleons.push('p');
        for(let i=0; i<n; i++) nucleons.push('n');
        for (let i = nucleons.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [nucleons[i], nucleons[j]] = [nucleons[j], nucleons[i]]; }

        const geoNuc = new THREE.SphereGeometry(0.45, 32, 32);
        nucleons.forEach((type, i) => {
            const y = 1 - (i / (totalNucleons - 1 || 1)) * 2; 
            const radius = Math.sqrt(1 - y * y); 
            const theta = phi * i; 
            const spread = Math.max(0.8, Math.pow(totalNucleons, 1/3) * 0.45);
            const basePos = new THREE.Vector3(Math.cos(theta) * radius * spread, y * spread, Math.sin(theta) * radius * spread);
            const mesh = new THREE.Mesh(geoNuc, type === 'p' ? protonMat : neutronMat);
            mesh.position.copy(basePos);
            eng.nucleonMeshes.push({ mesh, basePos, phase: Math.random() * Math.PI * 2 });
            eng.nucleusGroup!.add(mesh);
        });

        // ELECTRONES
        const eGeo = new THREE.SphereGeometry(0.15, 16, 16); 
        for(let i = 0; i < e; i++) {
            let sIdx = 0; let ePrev = 0;
            const caps = [2, 8, 18, 32];
            for(let s = 0; s < caps.length; s++) { if (i < ePrev + caps[s]) { sIdx = s; break; } ePrev += caps[s]; }
            const oR = 4.5 + (sIdx * 3.5);
            const oG = new THREE.Group();
            oG.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
            oG.add(new THREE.Mesh(new THREE.TorusGeometry(oR, 0.012, 16, 100), new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending })));
            
            const cloudPtsGeo = new THREE.BufferGeometry();
            const cloudArray = [];
            for(let p = 0; p < 300; p++) {
                const u = Math.random() * Math.PI * 2;
                const rF = oR + (Math.random() + Math.random() - 1) * 0.4;
                const hF = (Math.random() + Math.random() - 1) * 0.2;
                cloudArray.push(Math.cos(u) * rF, hF, Math.sin(u) * rF);
            }
            cloudPtsGeo.setAttribute('position', new THREE.Float32BufferAttribute(cloudArray, 3));
            oG.add(new THREE.Points(cloudPtsGeo, cloudMat));

            const eM = new THREE.Mesh(eGeo, electronMat);
            eM.add(new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })));
            oG.add(eM); eng.electronsGroup!.add(oG);
            eng.electronMeshes.push({ mesh: eM, radius: oR, speed: (4 - sIdx * 0.6) * (Math.random() > 0.5 ? 1 : -1), angle: Math.random() * Math.PI * 2, flyOutDist: 0 });
        }
    };

    useEffect(() => {
        if (!containerRef.current) return;
        const eng = engineRef.current;
        const container = containerRef.current!;

        const init3D = () => {
            eng.scene = new THREE.Scene();
            eng.scene.fog = new THREE.FogExp2(0x020205, 0.015);
            eng.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
            eng.camera.position.set(0, 6, 28);
            eng.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
            eng.renderer.setSize(container.clientWidth, container.clientHeight);
            eng.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            eng.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            eng.renderer.toneMappingExposure = 1.2;
            container.appendChild(eng.renderer.domElement);

            eng.composer = new EffectComposer(eng.renderer);
            eng.composer.addPass(new RenderPass(eng.scene, eng.camera));
            eng.composer.addPass(new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 0.8, 0.5, 0.1));
            eng.cinematicPass = new ShaderPass(CinematicShader);
            eng.composer.addPass(eng.cinematicPass);

            eng.controls = new OrbitControls(eng.camera, eng.renderer.domElement);
            eng.controls.enableDamping = true; eng.controls.dampingFactor = 0.03; eng.controls.enablePan = false; eng.controls.minDistance = 8; eng.controls.maxDistance = 60;

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Más luz base
            eng.scene.add(ambientLight);
            
            const kL = new THREE.DirectionalLight(0xffffff, 1.5); kL.position.set(15, 20, 15); eng.scene.add(kL);
            const rL = new THREE.DirectionalLight(0x00ffcc, 1.0); rL.position.set(-15, -10, -15); eng.scene.add(rL);
            // Eliminada PointLight central para evitar puntos de parpadeo

            eng.nucleusGroup = new THREE.Group(); eng.scene.add(eng.nucleusGroup);
            eng.electronsGroup = new THREE.Group(); eng.scene.add(eng.electronsGroup);

            // PARTÍCULAS GALÁCTICAS 1:1
            const gD = new THREE.BufferGeometry(); const pD = new Float32Array(800 * 3);
            for(let i=0; i<800*3; i++) pD[i] = (Math.random()-0.5)*40;
            gD.setAttribute('position', new THREE.BufferAttribute(pD, 3));
            eng.scene.add(new THREE.Points(gD, new THREE.PointsMaterial({ color: 0x00ffcc, size: 0.05, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending })));

            const gN = new THREE.BufferGeometry(); const pN = new Float32Array(3000 * 3); const cN = new Float32Array(3000 * 3);
            const c1 = new THREE.Color(0x001133); const c2 = new THREE.Color(0x330033);
            for(let i=0; i<3000*3; i+=3) {
                pN[i] = (Math.random()-0.5)*200; pN[i+1] = (Math.random()-0.5)*200; pN[i+2] = (Math.random()-0.5)*200;
                const mC = c1.clone().lerp(c2, Math.random()); cN[i] = mC.r; cN[i+1] = mC.g; cN[i+2] = mC.b;
            }
            gN.setAttribute('position', new THREE.BufferAttribute(pN, 3)); gN.setAttribute('color', new THREE.BufferAttribute(cN, 3));
            eng.scene.add(new THREE.Points(gN, new THREE.PointsMaterial({ size: 0.2, vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending })));

            eng.hudGroup = new THREE.Group(); eng.hudGroup.position.y = -12; 
            const hM = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.15, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
            const r1 = new THREE.Mesh(new THREE.RingGeometry(14, 14.1, 64), hM);
            const r2 = new THREE.Mesh(new THREE.RingGeometry(12, 12.05, 64), hM);
            const r3 = new THREE.Mesh(new THREE.RingGeometry(18, 18.2, 32, 1, 0, Math.PI), hM);
            r1.rotation.x = r2.rotation.x = r3.rotation.x = Math.PI / 2;
            eng.hudGroup.add(r1, r2, r3);
            const gH = new THREE.GridHelper(30, 30, 0x00ffcc, 0x00ffcc); gH.material.opacity = 0.05; gH.material.transparent = true; gH.position.y = 0.1;
            eng.hudGroup.add(gH); eng.scene.add(eng.hudGroup);
        };

        const animate = () => {
            const eng = engineRef.current; 
            const state = stateRef.current;
            const isExploding = state.instability >= 3; // Definida al inicio para todo el bucle

            eng.frameId = requestAnimationFrame(animate);
            const delta = eng.clock.getDelta(); const time = eng.clock.getElapsedTime();
            if (eng.controls) eng.controls.update();
            if (eng.cinematicPass) eng.cinematicPass.uniforms["time"].value = time * 2.0;
            if (eng.hudGroup) { eng.hudGroup.children[0].rotation.z += delta * 0.1; eng.hudGroup.children[1].rotation.z -= delta * 0.15; eng.hudGroup.children[2].rotation.z += delta * 0.05; }
            
            if (eng.nucleusGroup) {
                const nI = Math.max(0, state.instability - 1); 

                eng.nucleusGroup.rotation.y += delta * (isExploding ? 2.0 : 0.15);
                eng.nucleusGroup.rotation.z += delta * (isExploding ? 1.0 : 0.08);

                eng.nucleonMeshes.forEach(n => {
                    if (isExploding) {
                        // FÍSICA DE EXPLOSIÓN
                        n.mesh.position.add(n.mesh.position.clone().normalize().multiplyScalar(delta * 20));
                        n.mesh.scale.multiplyScalar(0.98); // Se desintegran
                        if (eng.composer?.passes[1]) (eng.composer.passes[1] as any).strength = 4.0; // Flash!
                    } else {
                        const wave1 = Math.sin(time * 12 + n.phase) * 0.02;
                        const wave2 = nI > 0 ? Math.sin(time * 40 + n.phase) * 0.04 * nI : 0;
                        const jitter = wave1 + wave2;
                        n.mesh.position.copy(n.basePos).multiplyScalar(1 + jitter);
                        if (eng.composer?.passes[1]) (eng.composer.passes[1] as any).strength = 0.8; 
                    }
                });
            }
            eng.electronMeshes.forEach((el, index) => {
                el.angle += el.speed * delta; let cR = el.radius;
                const eI = Math.max(0, state.instability - 1.5); 
                if (eI > 0 && index >= state.protons + 3) {
                    el.flyOutDist += delta * (15 + Math.random() * 5); cR += el.flyOutDist;
                    if (el.mesh.children[0]) el.mesh.children[0].material.color.setHex(0xff0044);
                    if (cR > 50) el.flyOutDist = 0;
                } else {
                    el.flyOutDist = 0; if (el.mesh.children[0]) el.mesh.children[0].material.color.setHex(0x00ffcc);
                }
                el.mesh.position.set(Math.cos(el.angle) * cR, el.flyOutDist > 0 ? (Math.random() - 0.5) * el.flyOutDist * 0.5 : 0, Math.sin(el.angle) * cR);
            });
            if (eng.camera) {
                // Solo agitar si hay inestabilidad crítica, sin bloquear los controles de mouse
                if (state.instability > 2) {
                    const sAmt = 0.15; 
                    eng.camera.position.x += (Math.random() - 0.5) * sAmt; 
                    eng.camera.position.y += (Math.random() - 0.5) * sAmt;
                }
                
                // Si el átomo se resetea (0 partículas), devolvemos la cámara a la base
                if (state.protons === 0 && state.neutrons === 0 && !isExploding) {
                    eng.camera.position.lerp(eng.baseCameraPos, 0.05);
                }
            }
            if (eng.composer) eng.composer.render();
        };

        init3D(); buildAtom(); animate();
        const res = new ResizeObserver(() => {
            const w = container.clientWidth, h = container.clientHeight; if (w === 0 || h === 0) return;
            eng.camera!.aspect = w / h; eng.camera!.updateProjectionMatrix();
            eng.renderer!.setSize(w, h); eng.composer!.setSize(w, h);
        });
        res.observe(container);
        return () => {
            res.disconnect(); if (eng.frameId) cancelAnimationFrame(eng.frameId);
            if (eng.renderer) { eng.renderer.dispose(); if (container.contains(eng.renderer.domElement)) container.removeChild(eng.renderer.domElement); }
        };
    }, []);

    useEffect(() => { buildAtom(); }, [protons, neutrons, electrons]);

    return <div ref={containerRef} className="w-full h-full" style={{ background: '#020205' }} />;
}
