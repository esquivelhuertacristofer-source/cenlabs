"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

interface Galvanic3DSceneProps {
    metalIzq: string | null;
    metalDer: string | null;
    puenteSalino: boolean;
    cablesConectados: boolean;
    voltaje: number;
}

const METALES_STYLE: Record<string, { color: number; metalness: number; roughness: number; emissive?: number }> = {
    Zn: { color: 0xA1A1AA, metalness: 0.8, roughness: 0.2 },
    Cu: { color: 0xB45309, metalness: 0.9, roughness: 0.1 },
    Ag: { color: 0xF8FAFC, metalness: 1.0, roughness: 0.05, emissive: 0x222222 },
    Mg: { color: 0x475569, metalness: 0.7, roughness: 0.3 }
};

// Cinematic Shader - Diamond State Standard
const CinematicShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "amount": { value: 0.0012 },
        "vignette": { value: 0.6 },
        "time": { value: 0.0 }
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
        uniform float amount;
        uniform float vignette;
        uniform float time;
        varying vec2 vUv;

        float random(vec2 co) {
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
            vec2 uv = vUv;
            vec4 color = texture2D(tDiffuse, uv);
            
            // Aberración Cromática (Diamond Signature)
            float r = texture2D(tDiffuse, uv + vec2(amount, 0.0)).r;
            float g = texture2D(tDiffuse, uv).g;
            float b = texture2D(tDiffuse, uv - vec2(amount, 0.0)).b;
            
            // Grano cuántico cinematográfico
            float noise = (random(uv + time * 0.01) - 0.5) * 0.04;
            
            // Viñeteado de enfoque
            float dist = distance(uv, vec2(0.5));
            float vig = smoothstep(1.0, 0.2, dist * vignette);
            
            vec3 finalColor = vec3(r, g, b) + noise;
            gl_FragColor = vec4(finalColor, 1.0) * vig;
        }
    `
};

export default function Galvanic3DScene({ metalIzq, metalDer, puenteSalino, cablesConectados, voltaje }: Galvanic3DSceneProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasTextureRef = useRef<THREE.CanvasTexture | null>(null);
    const engineRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        composer: EffectComposer;
        controls: OrbitControls;
        frameId: number;
        electrodoIzq?: THREE.Mesh;
        electrodoDer?: THREE.Mesh;
        electronParticles?: THREE.Points;
        ionParticles?: THREE.Points;
        voltmeterScreen?: THREE.Mesh;
    } | null>(null);

    // Crear textura dinámica para el voltímetro digital
    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const updateTexture = () => {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Decoración tech
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            for(let i=0; i<canvas.width; i+=40) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
            }

            // Valor principal
            ctx.font = 'black 120px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const displayVolt = (voltaje || 0).toFixed(2);
            ctx.fillStyle = Math.abs(voltaje) < 0.01 ? '#1e293b' : (voltaje > 0 ? '#10b981' : '#f43f5e');
            
            // Brillo externo (glow)
            ctx.shadowBlur = 20;
            ctx.shadowColor = ctx.fillStyle as string;
            ctx.fillText(`${displayVolt}V`, canvas.width/2, canvas.height/2);
            
            // Sub-etiquetas
            ctx.shadowBlur = 0;
            ctx.font = 'bold 24px sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText('ELECTROCHEMICAL POTENTIAL', canvas.width/2, 40);
            ctx.fillText('DYNAMIC LOAD SENSOR', canvas.width/2, 220);

            if (canvasTextureRef.current) canvasTextureRef.current.needsUpdate = true;
        };

        if (!canvasTextureRef.current) {
            canvasTextureRef.current = new THREE.CanvasTexture(canvas);
        }
        updateTexture();
    }, [voltaje]);

    useEffect(() => {
        if (!containerRef.current) return;

        // --- INIT ENGINE ---
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x02040a);
        scene.fog = new THREE.FogExp2(0x02040a, 0.012);

        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
        camera.position.set(0, 18, 38);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        containerRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.04;
        controls.maxPolarAngle = Math.PI / 1.8;
        controls.minDistance = 20;
        controls.maxDistance = 80;

        // --- POST PROCESSING ---
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
        composer.addPass(bloomPass);

        const cinematicPass = new ShaderPass(CinematicShader);
        composer.addPass(cinematicPass);

        // --- LIGHTING (Diamond Setup) ---
        scene.add(new THREE.AmbientLight(0xffffff, 0.2));

        const mainSpot = new THREE.SpotLight(0xffffff, 150);
        mainSpot.position.set(20, 40, 20);
        mainSpot.angle = 0.4;
        mainSpot.penumbra = 1;
        mainSpot.castShadow = true;
        scene.add(mainSpot);

        const fillLight = new THREE.PointLight(0x0ea5e9, 40);
        fillLight.position.set(-20, 10, 10);
        scene.add(fillLight);

        const backLight = new THREE.PointLight(0xf43f5e, 30);
        backLight.position.set(0, 10, -20);
        scene.add(backLight);

        // --- MODELS ---

        // Lab Floor with reflection simulation
        const floorGeo = new THREE.PlaneGeometry(200, 200);
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: 0x050810, 
            roughness: 0.1, 
            metalness: 0.8 
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.1;
        scene.add(floor);

        const grid = new THREE.GridHelper(100, 40, 0x1e293b, 0x0f172a);
        grid.position.y = 0;
        scene.add(grid);

        // 1. Beakers (High Fidelity Glass)
        const createBeaker = (x: number, color: number) => {
            const group = new THREE.Group();
            
            const glassGeo = new THREE.CylinderGeometry(4.2, 4, 12, 48, 1, true);
            const glassMat = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                metalness: 0,
                roughness: 0,
                transmission: 0.98,
                thickness: 0.8,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide
            });
            const glass = new THREE.Mesh(glassGeo, glassMat);
            group.add(glass);

            const baseGeo = new THREE.CircleGeometry(4, 32);
            const base = new THREE.Mesh(baseGeo, glassMat);
            base.rotation.x = -Math.PI / 2;
            base.position.y = -6;
            group.add(base);

            // Electrolito
            const liquidGeo = new THREE.CylinderGeometry(4, 3.9, 9, 32);
            const liquidMat = new THREE.MeshPhysicalMaterial({
                color: color,
                metalness: 0.2,
                roughness: 0.1,
                transmission: 0.5,
                transparent: true,
                opacity: 0.8
            });
            const liquid = new THREE.Mesh(liquidGeo, liquidMat);
            liquid.position.y = -1.5;
            group.add(liquid);

            group.position.set(x, 6, 0);
            return group;
        };

        const vasoIzq = createBeaker(-12, 0x3b82f6);
        const vasoDer = createBeaker(12, 0xef4444);
        scene.add(vasoIzq, vasoDer);

        // 2. Puente Salino (Ionic Bridge)
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(-12, 12, 0),
            new THREE.Vector3(0, 18, 0),
            new THREE.Vector3(12, 12, 0)
        );
        const psGeo = new THREE.TubeGeometry(curve, 40, 1.0, 16, false);
        const psMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 0.9,
            thickness: 0.4,
            transparent: true,
            opacity: 0.3
        });
        const psMesh = new THREE.Mesh(psGeo, psMat);
        psMesh.name = "PuenteSalino";
        scene.add(psMesh);

        // 3. Voltímetro Digital 3D (Custom Tech Design)
        const vmGroup = new THREE.Group();
        const vmBodyGeo = new THREE.BoxGeometry(14, 10, 6, 1, 1, 1);
        const vmBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7 });
        const vmBody = new THREE.Mesh(vmBodyGeo, vmBodyMat);
        vmGroup.add(vmBody);
        
        const frameGeo = new THREE.BoxGeometry(12.5, 7.5, 0.5);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.z = 2.8;
        vmGroup.add(frame);

        const screenGeo = new THREE.PlaneGeometry(12, 7);
        const screenMat = new THREE.MeshBasicMaterial({ map: canvasTextureRef.current });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.z = 3.1;
        vmGroup.add(screen);

        vmGroup.position.set(0, 25, -8);
        scene.add(vmGroup);

        // 4. Partículas (Electrones e Iones)
        const createParticles = (count: number, color: number, size: number) => {
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(count * 3);
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({
                color: color,
                size: size,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            return new THREE.Points(geo, mat);
        };

        const electrons = createParticles(30, 0xfacc15, 0.5);
        const ions = createParticles(40, 0xffffff, 0.3);
        scene.add(electrons, ions);

        // --- ENGINE REF ---
        engineRef.current = {
            scene, camera, renderer, composer, controls, frameId: 0,
            electronParticles: electrons,
            ionParticles: ions,
            voltmeterScreen: screen
        };

        // --- ANIMATION ---
        let time = 0;
        const animate = () => {
            time += 0.016;
            const eng = engineRef.current;
            if (!eng) return;

            eng.controls.update();
            cinematicPass.uniforms.time.value = time;

            // Animación de Electrones (Circuito)
            if (eng.electronParticles && cablesConectados && puenteSalino && Math.abs(voltaje) > 0.01) {
                const pos = eng.electronParticles.geometry.attributes.position.array as Float32Array;
                const mat = eng.electronParticles.material as THREE.PointsMaterial;
                mat.opacity = THREE.MathUtils.lerp(mat.opacity, 1, 0.1);

                const isReversed = voltaje < 0;
                const curveElectrons = new THREE.QuadraticBezierCurve3(
                    isReversed ? new THREE.Vector3(12, 13, 0) : new THREE.Vector3(-12, 13, 0),
                    new THREE.Vector3(0, 35, -5),
                    isReversed ? new THREE.Vector3(-12, 13, 0) : new THREE.Vector3(12, 13, 0)
                );

                for (let i = 0; i < 30; i++) {
                    const t = (time * 0.4 + i / 30) % 1;
                    const p = curveElectrons.getPoint(t);
                    pos[i * 3] = p.x + (Math.random() - 0.5) * 0.4;
                    pos[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.4;
                    pos[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.4;
                }
                eng.electronParticles.geometry.attributes.position.needsUpdate = true;
            } else if (eng.electronParticles) {
                (eng.electronParticles.material as THREE.PointsMaterial).opacity = THREE.MathUtils.lerp((eng.electronParticles.material as THREE.PointsMaterial).opacity, 0, 0.1);
            }

            // Animación de Iones (Puente Salino)
            if (eng.ionParticles && puenteSalino && cablesConectados && Math.abs(voltaje) > 0.01) {
                const pos = eng.ionParticles.geometry.attributes.position.array as Float32Array;
                const mat = eng.ionParticles.material as THREE.PointsMaterial;
                mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.6, 0.1);

                const isReversed = voltaje < 0;
                const curveIons = new THREE.QuadraticBezierCurve3(
                    isReversed ? new THREE.Vector3(-12, 12, 0) : new THREE.Vector3(12, 12, 0),
                    new THREE.Vector3(0, 18, 0),
                    isReversed ? new THREE.Vector3(12, 12, 0) : new THREE.Vector3(-12, 12, 0)
                );

                for (let i = 0; i < 40; i++) {
                    const t = (time * 0.2 + i / 40) % 1;
                    const p = curveIons.getPoint(t);
                    pos[i * 3] = p.x + (Math.random() - 0.5) * 0.8;
                    pos[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.8;
                    pos[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.8;
                }
                eng.ionParticles.geometry.attributes.position.needsUpdate = true;
            } else if (eng.ionParticles) {
                (eng.ionParticles.material as THREE.PointsMaterial).opacity = THREE.MathUtils.lerp((eng.ionParticles.material as THREE.PointsMaterial).opacity, 0, 0.1);
            }

            eng.composer.render();
            eng.frameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (engineRef.current) {
                cancelAnimationFrame(engineRef.current.frameId);
                renderer.dispose();
            }
        };
    }, []);

    // Sync Electrodos
    useEffect(() => {
        const eng = engineRef.current;
        if (!eng) return;

        if (eng.electrodoIzq) eng.scene.remove(eng.electrodoIzq);
        if (eng.electrodoDer) eng.scene.remove(eng.electrodoDer);

        const createElectrodo = (metal: string | null, x: number) => {
            if (!metal) return undefined;
            const style = METALES_STYLE[metal] || { color: 0x888888, metalness: 0.5, roughness: 0.5 };
            const geo = new THREE.BoxGeometry(2, 14, 0.5);
            const mat = new THREE.MeshPhysicalMaterial({
                color: style.color,
                metalness: style.metalness,
                roughness: style.roughness,
                emissive: style.emissive || 0,
                emissiveIntensity: 0.1,
                clearcoat: 1
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, 10, 0);
            eng.scene.add(mesh);
            return mesh;
        };

        eng.electrodoIzq = createElectrodo(metalIzq, -12);
        eng.electrodoDer = createElectrodo(metalDer, 12);

        const ps = eng.scene.getObjectByName("PuenteSalino");
        if (ps) ps.visible = puenteSalino;

    }, [metalIzq, metalDer, puenteSalino]);

    return (
        <div ref={containerRef} className="w-full h-full outline-none" />
    );
}
