"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

interface Destilacion3DSceneProps {
    temp: number;
    volMezcla: number; // 0 to 100
    volDestilado: number; // 0 to 100
    pureza: number;
}

// Cinematic Shader - Diamond State Standard
const CinematicShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "amount": { value: 0.0015 },
        "vignette": { value: 0.5 },
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
            
            float r = texture2D(tDiffuse, uv + vec2(amount, 0.0)).r;
            float g = texture2D(tDiffuse, uv).g;
            float b = texture2D(tDiffuse, uv - vec2(amount, 0.0)).b;
            
            float noise = (random(uv + time * 0.01) - 0.5) * 0.03;
            float dist = distance(uv, vec2(0.5));
            float vig = smoothstep(1.0, 0.1, dist * vignette);
            
            vec3 finalColor = vec3(r, g, b) + noise;
            gl_FragColor = vec4(finalColor, 1.0) * vig;
        }
    `
};

export default function Destilacion3DScene({ temp, volMezcla, volDestilado, pureza }: Destilacion3DSceneProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        composer: EffectComposer;
        controls: OrbitControls;
        frameId: number;
        liquidMezcla?: THREE.Mesh;
        liquidDestilado?: THREE.Mesh;
        bubbleParticles?: THREE.Points;
        steamParticles?: THREE.Points;
        dripParticles?: THREE.Points;
    } | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x02040a);
        scene.fog = new THREE.FogExp2(0x02040a, 0.01);

        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
        camera.position.set(0, 15, 45);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        containerRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.maxPolarAngle = Math.PI / 2;

        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), 1.2, 0.4, 0.85));
        const cinematicPass = new ShaderPass(CinematicShader);
        composer.addPass(cinematicPass);

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.2));
        const mainLight = new THREE.SpotLight(0xffffff, 100);
        mainLight.position.set(20, 40, 20);
        scene.add(mainLight);

        const rimLight = new THREE.PointLight(0x0ea5e9, 30);
        rimLight.position.set(-20, 10, -10);
        scene.add(rimLight);

        // --- MODELS ---

        // 1. Manta de Calentamiento
        const mantleGeo = new THREE.CylinderGeometry(6, 6, 4, 32);
        const mantleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.5 });
        const mantle = new THREE.Mesh(mantleGeo, mantleMat);
        mantle.position.set(-12, 2, 0);
        scene.add(mantle);

        // 2. Matraz de Destilación (Bola)
        const matrazGeo = new THREE.SphereGeometry(5, 32, 32);
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 0.95,
            roughness: 0.05,
            thickness: 0.5,
            transparent: true,
            opacity: 0.2
        });
        const matraz = new THREE.Mesh(matrazGeo, glassMat);
        matraz.position.set(-12, 7, 0);
        scene.add(matraz);

        // Líquido Mezcla
        const liquidGeo = new THREE.SphereGeometry(4.8, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI);
        const liquidMat = new THREE.MeshPhysicalMaterial({
            color: 0x3b82f6,
            transmission: 0.5,
            transparent: true,
            opacity: 0.7
        });
        const liquidMezcla = new THREE.Mesh(liquidGeo, liquidMat);
        liquidMezcla.position.set(-12, 7, 0);
        scene.add(liquidMezcla);

        // 3. Columna de Fraccionamiento (Cilindro con perlas)
        const colGeo = new THREE.CylinderGeometry(1, 1, 12, 32);
        const col = new THREE.Mesh(colGeo, glassMat);
        col.position.set(-12, 16, 0);
        scene.add(col);

        // 4. Refrigerante (Tubo inclinado)
        const refGeo = new THREE.CylinderGeometry(1.5, 1.5, 25, 32);
        const ref = new THREE.Mesh(refGeo, glassMat);
        ref.rotation.z = -Math.PI / 4;
        ref.position.set(-2, 15, 0);
        scene.add(ref);

        // 5. Matraz Receptor (Erlenmeyer)
        const createErlenmeyer = (x: number, y: number) => {
            const group = new THREE.Group();
            const bodyGeo = new THREE.CylinderGeometry(1, 5, 8, 32);
            const body = new THREE.Mesh(bodyGeo, glassMat);
            group.add(body);
            group.position.set(x, y, 0);
            return group;
        };
        const receptor = createErlenmeyer(10, 4);
        scene.add(receptor);

        // Líquido Destilado
        const destLiquidGeo = new THREE.CylinderGeometry(1, 4.8, 8, 32);
        const destLiquidMat = new THREE.MeshPhysicalMaterial({
            color: 0x10b981,
            transmission: 0.5,
            transparent: true,
            opacity: 0.6
        });
        const liquidDestilado = new THREE.Mesh(destLiquidGeo, destLiquidMat);
        liquidDestilado.position.set(10, 4, 0);
        scene.add(liquidDestilado);

        // --- PARTICLES ---
        const createParticles = (count: number, color: number, size: number) => {
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(count * 3);
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
            return new THREE.Points(geo, mat);
        };

        const bubbles = createParticles(30, 0xffffff, 0.1);
        const steam = createParticles(50, 0xffffff, 0.2);
        const drips = createParticles(10, 0x60a5fa, 0.3);
        scene.add(bubbles, steam, drips);

        engineRef.current = {
            scene, camera, renderer, composer, controls, frameId: 0,
            liquidMezcla, liquidDestilado, bubbleParticles: bubbles, steamParticles: steam, dripParticles: drips
        };

        let time = 0;
        const animate = () => {
            time += 0.016;
            const eng = engineRef.current;
            if (!eng) return;

            eng.controls.update();
            cinematicPass.uniforms.time.value = time;

            // Sync Liquids
            const mezLevel = (volMezcla / 100);
            eng.liquidMezcla!.scale.set(1, mezLevel, 1);
            eng.liquidMezcla!.position.y = 7 - (1 - mezLevel) * 2.5;

            const destLevel = (volDestilado / 100);
            eng.liquidDestilado!.scale.set(1, destLevel, 1);
            eng.liquidDestilado!.position.y = 4 - (1 - destLevel) * 4;
            
            // Color de pureza
            (eng.liquidDestilado!.material as THREE.MeshPhysicalMaterial).color.setHSL(0.4, 0.8, 0.4 + (pureza/200));

            // Animación Burbujas (Ebullición)
            if (temp > 78) {
                const bPos = eng.bubbleParticles!.geometry.attributes.position.array as Float32Array;
                (eng.bubbleParticles!.material as THREE.PointsMaterial).opacity = Math.min(0.8, (temp - 78) / 10);
                for(let i=0; i<30; i++) {
                    const t = (time + i/30) % 1;
                    bPos[i*3] = -12 + (Math.random() - 0.5) * 6 * mezLevel;
                    bPos[i*3+1] = 7 - 4 + t * 8 * mezLevel;
                    bPos[i*3+2] = (Math.random() - 0.5) * 6 * mezLevel;
                }
                eng.bubbleParticles!.geometry.attributes.position.needsUpdate = true;
            }

            // Animación Vapor (Columna)
            if (temp > 80) {
                const sPos = eng.steamParticles!.geometry.attributes.position.array as Float32Array;
                (eng.steamParticles!.material as THREE.PointsMaterial).opacity = Math.min(0.4, (temp - 80) / 15);
                for(let i=0; i<50; i++) {
                    const t = (time * 0.5 + i/50) % 1;
                    sPos[i*3] = -12 + (Math.random() - 0.5) * 1.5;
                    sPos[i*3+1] = 10 + t * 15;
                    sPos[i*3+2] = (Math.random() - 0.5) * 1.5;
                }
                eng.steamParticles!.geometry.attributes.position.needsUpdate = true;
            }

            // Animación Goteo (Receptor)
            if (temp > 78.5) {
                const dPos = eng.dripParticles!.geometry.attributes.position.array as Float32Array;
                (eng.dripParticles!.material as THREE.PointsMaterial).opacity = 1;
                for(let i=0; i<10; i++) {
                    const t = (time * 1.2 + i/10) % 1;
                    dPos[i*3] = 10;
                    dPos[i*3+1] = 10 - t * 6;
                    dPos[i*3+2] = 0;
                }
                eng.dripParticles!.geometry.attributes.position.needsUpdate = true;
            } else {
                (eng.dripParticles!.material as THREE.PointsMaterial).opacity = 0;
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

    return <div ref={containerRef} className="w-full h-full outline-none" />;
}
