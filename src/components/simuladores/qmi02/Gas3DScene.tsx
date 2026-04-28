"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls, EffectComposer, RenderPass, UnrealBloomPass } from 'three-stdlib';

interface Gas3DSceneProps {
    temperature: number;
    volume: number;
    moles: number;
    isExploded: boolean;
    gasType?: 'He' | 'Ne' | 'CO2';
}

const Gas3DScene: React.FC<Gas3DSceneProps> = ({ temperature, volume, moles, isExploded, gasType = 'He' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<{
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
        controls: OrbitControls,
        composer: EffectComposer,
        piston: THREE.Mesh,
        pistonRod: THREE.Mesh,
        heaterCoil: THREE.Mesh,
        gasFog: THREE.Mesh,
        heatLight: THREE.PointLight,
        glassCylinder: THREE.Mesh,
        particles: any[],
        pMat: THREE.SpriteMaterial,
        baseY: number,
        cylinderRadius: number,
        clock: THREE.Clock,
        frameId?: number
    } | null>(null);

    const stateRef = useRef({ temperature, volume, moles, isExploded, gasType });

    useEffect(() => {
        stateRef.current = { temperature, volume, moles, isExploded, gasType };
    }, [temperature, volume, moles, isExploded, gasType]);

    useEffect(() => {
        if (!containerRef.current) return;

        // --- CONSTANTES DEL PLASMA ENGINE ---
        const MAX_PARTICLES = 100;
        const CYLINDER_RADIUS = 8;
        const BASE_Y = -12;

        const GAS_PROPS = {
            He: { color: 0x38bdf8, size: 1.0 },
            Ne: { color: 0xfb8500, size: 1.5 },
            CO2: { color: 0xe2e8f0, size: 2.2 }
        };

        const currentGas = GAS_PROPS[gasType as keyof typeof GAS_PROPS] || GAS_PROPS.He;

        // --- CONFIGURACIÓN BASE (MÁS ILUMINADA) ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1e293b);
        scene.fog = new THREE.FogExp2(0x1e293b, 0.005); // Neblina más suave

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.set(30, 10, 45);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        
        // FIX ESTRICTO: Purgar cualquier canvas "zombie" generado por el StrictMode de React 18
        while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
        }
        containerRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, -2, 0);

        // --- POST-PROCESAMIENTO (BLOOM) EXACTO AL ORIGINAL ---
        const renderPass = new RenderPass(scene, camera);
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(1024, 1024), 1.6, 0.5, 0.85);
        const composer = new EffectComposer(renderer);
        composer.addPass(renderPass);
        composer.addPass(bloomPass);

        // --- ENTORNO ORIGINAL (SUELO Y GRID MÁS CLAROS) ---
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, metalness: 0.1 });
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -18;
        scene.add(floor);

        const grid = new THREE.GridHelper(200, 40, 0x475569, 0x334155);
        grid.position.y = -17.9;
        scene.add(grid);

        // --- ILUMINACIÓN DE ESTUDIO REFORZADA ---
        scene.add(new THREE.AmbientLight(0xffffff, 1.5)); // Base fuerte
        
        const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 1.0); // Rebote alineado al nuevo fondo
        scene.add(hemiLight);

        const frontLight = new THREE.DirectionalLight(0xffffff, 2.0); // Luz frontal directa para el cristal
        frontLight.position.set(0, 20, 30);
        scene.add(frontLight);

        const spotLight = new THREE.SpotLight(0xffffff, 2.0);
        spotLight.position.set(20, 50, 20);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 0.5;
        scene.add(spotLight);

        const heatLight = new THREE.PointLight(0xff3333, 0, 40);
        heatLight.position.set(0, BASE_Y + 2, 0);
        scene.add(heatLight);

        // --- CONSTRUCCIÓN DEL CONTENEDOR EXACTO ---
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.8 });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 11, 4, 32), baseMat);
        base.position.y = BASE_Y - 2;
        scene.add(base);

        const heaterCoil = new THREE.Mesh(
            new THREE.TorusGeometry(7, 0.4, 16, 64),
            new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x000000, emissiveIntensity: 0 })
        );
        heaterCoil.rotation.x = Math.PI / 2;
        heaterCoil.position.y = BASE_Y + 0.5;
        scene.add(heaterCoil);

        const glassCylinder = new THREE.Mesh(
            new THREE.CylinderGeometry(CYLINDER_RADIUS, CYLINDER_RADIUS, 30, 32, 1, true),
            new THREE.MeshStandardMaterial({
                color: 0x38bdf8,
                transparent: true,
                opacity: 0.25,
                roughness: 0.1,
                metalness: 0.8,
                emissive: 0x38bdf8,
                emissiveIntensity: 0.2, // Falso efecto de refracción/glow en los bordes
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        glassCylinder.position.y = BASE_Y + 15;
        scene.add(glassCylinder);

        // Anillos del cilindro originales
        for(let i=1; i<=5; i++) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(CYLINDER_RADIUS + 0.05, 0.05, 8, 64),
                new THREE.MeshBasicMaterial({ color: 0x475569 })
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.y = BASE_Y + (i * 5);
            scene.add(ring);
        }

        const pistonMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.5 });
        const piston = new THREE.Mesh(new THREE.CylinderGeometry(CYLINDER_RADIUS - 0.2, CYLINDER_RADIUS - 0.2, 1.5, 32), pistonMat);
        scene.add(piston);

        const pistonRod = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 40, 16), pistonMat);
        scene.add(pistonRod);

        const gasFog = new THREE.Mesh(
            new THREE.CylinderGeometry(CYLINDER_RADIUS - 0.1, CYLINDER_RADIUS - 0.1, 1, 32),
            new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        gasFog.geometry.translate(0, 0.5, 0); 
        gasFog.position.y = BASE_Y + 1;
        scene.add(gasFog);

        // --- PARTÍCULAS (PLASMA ENGINE) ---
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64);
        const plasmaTex = new THREE.CanvasTexture(canvas);

        const pMat = new THREE.SpriteMaterial({ 
            map: plasmaTex, 
            color: 0x38bdf8, // Sincronizado con var(--accent)
            transparent: true, 
            blending: THREE.AdditiveBlending, 
            depthWrite: false 
        });
        const particles: any[] = [];
        for(let i=0; i<MAX_PARTICLES; i++) {
            const sprite = new THREE.Sprite(pMat);
            const size = currentGas.size * (0.8 + Math.random() * 0.4); 
            sprite.scale.set(size, size, 1);
            scene.add(sprite);
            sprite.visible = false;
            
            const dir = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).normalize();
            
            sprite.position.set(
                (Math.random() - 0.5) * (CYLINDER_RADIUS - 2),
                BASE_Y + 5 + Math.random() * 5,
                (Math.random() - 0.5) * (CYLINDER_RADIUS - 2)
            );

            particles.push({ mesh: sprite, dir: dir, baseSize: size, phase: Math.random() * Math.PI * 2 });
        }

        engineRef.current = {
            scene, camera, renderer, controls, composer, piston, pistonRod, heaterCoil, gasFog, heatLight, glassCylinder, particles, pMat,
            baseY: BASE_Y, cylinderRadius: CYLINDER_RADIUS, clock: new THREE.Clock()
        };

        const animate = () => {
            const eng = engineRef.current; if (!eng) return;
            const state = stateRef.current;
            eng.frameId = requestAnimationFrame(animate);

            const delta = eng.clock.getDelta();
            const time = eng.clock.getElapsedTime();

            // Lógica de Pistón
            const targetPistonY = eng.baseY + (state.volume * 2);
            eng.piston.position.y += (targetPistonY - eng.piston.position.y) * 0.1;
            eng.pistonRod.position.y = eng.piston.position.y + 20;
            const currentCeilingY = eng.piston.position.y - 0.75;

            const T_TARGET = state.temperature;
            const V_TARGET = state.volume;
            const GAS_TYPE = state.gasType;
            const gasInfo = GAS_PROPS[GAS_TYPE as keyof typeof GAS_PROPS] || GAS_PROPS.He;

            // Estados Visuales (Temperatura)
            const tNorm = (T_TARGET - 100) / 900;
            const activeColor = new THREE.Color(0x0ea5e9).lerp(new THREE.Color(0xff3300), tNorm);
            
            if (!state.isExploded) {
                (eng.heaterCoil.material as THREE.MeshStandardMaterial).emissive.copy(activeColor);
                (eng.heaterCoil.material as THREE.MeshStandardMaterial).emissiveIntensity = tNorm * 4;
                eng.heatLight.color.copy(activeColor);
                eng.heatLight.intensity = tNorm * 15;
                (eng.gasFog.material as THREE.MeshBasicMaterial).color.copy(activeColor);
                eng.gasFog.scale.y = Math.max(0.1, currentCeilingY - (eng.baseY + 1));
                const density = state.moles / state.volume;
                (eng.gasFog.material as THREE.MeshBasicMaterial).opacity = Math.min(0.6, density * 1.5);
                // Color mezclado entre el gas y la temperatura
                eng.pMat.color.copy(activeColor).lerp(new THREE.Color(gasInfo.color), 0.5);
            } else {
                eng.glassCylinder.visible = false;
                eng.gasFog.visible = false;
                (eng.heaterCoil.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
                (eng.heaterCoil.material as THREE.MeshStandardMaterial).emissiveIntensity = 8;
            }

            // Partículas
            const activeCount = Math.floor(state.moles * 150); // Ajustado para 100 max
            const speedFactor = GAS_TYPE === 'He' ? 1.0 : GAS_TYPE === 'Ne' ? 0.6 : 0.3;
            const speed = state.isExploded ? 0.4 : (0.05 + (T_TARGET / 1000) * 0.4) * speedFactor;

            eng.particles.forEach((p, i) => {
                if (i < activeCount) {
                    p.mesh.visible = true;

                    // Reactividad del tamaño al tipo de gas
                    const targetSize = gasInfo.size * p.baseSize;
                    p.mesh.scale.lerp(new THREE.Vector3(targetSize, targetSize, 1), 0.1);

                    if (!state.isExploded) {
                        p.mesh.position.addScaledVector(p.dir, speed);
                        // Rebote
                        const r = 0.4;
                        if (p.mesh.position.y < eng.baseY + 1 + r) { p.mesh.position.y = eng.baseY + 1 + r; p.dir.y = Math.abs(p.dir.y); }
                        else if (p.mesh.position.y > currentCeilingY - r) { p.mesh.position.y = currentCeilingY - r; p.dir.y = -Math.abs(p.dir.y); }
                        
                        const dist = Math.hypot(p.mesh.position.x, p.mesh.position.z);
                        if (dist > eng.cylinderRadius - r) {
                            const nx = p.mesh.position.x / dist; const nz = p.mesh.position.z / dist;
                            const dot = p.dir.x * nx + p.dir.z * nz;
                            p.dir.x -= 2 * dot * nx; p.dir.z -= 2 * dot * nz;
                            p.mesh.position.x = nx * (eng.cylinderRadius - r);
                            p.mesh.position.z = nz * (eng.cylinderRadius - r);
                        }
                    } else {
                        p.dir.y -= 0.01; p.mesh.position.addScaledVector(p.dir, speed);
                        if (p.mesh.position.y < -18) { p.mesh.position.y = -18; p.dir.y *= -0.5; }
                    }
                } else { p.mesh.visible = false; }
            });

            eng.controls.update();
            eng.composer.render();
        };

        animate();

        const handleResize = () => {
            if (!containerRef.current || !engineRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            
            // Protección contra renders fantasma (w o h = 0)
            if (w === 0 || h === 0) return;

            engineRef.current.camera.aspect = w / h;
            engineRef.current.camera.updateProjectionMatrix();
            engineRef.current.renderer.setSize(w, h);
            engineRef.current.composer.setSize(w, h);
        };

        // Disparar resize inicial con un pequeño delay para asegurar que el DOM esté listo
        const resizeTimeout = setTimeout(handleResize, 100);
        
        // Usar ResizeObserver para detectar cuando el panel lateral se abre o cierra (Responsive Layout)
        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        });
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            clearTimeout(resizeTimeout);
            resizeObserver.disconnect();
            if (engineRef.current?.frameId) cancelAnimationFrame(engineRef.current.frameId);
            renderer.dispose();
            
            // ELIMINAR EL CANVAS DEL DOM AL DESMONTAR (Fix React 18 Strict Mode Double Render)
            if (containerRef.current && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={containerRef} className="w-full h-full" />;
};

export default Gas3DScene;
