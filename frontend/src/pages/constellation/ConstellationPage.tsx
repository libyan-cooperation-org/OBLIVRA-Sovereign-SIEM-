import { onMount, onCleanup } from "solid-js";
import { Card } from "../../design-system/components/Card";
import { Badge } from "../../design-system/components/Badge";
import { Globe, Maximize2, Share2, Layers, Cpu, Zap, Shield } from "lucide-solid";
import * as THREE from "three";

export default function ConstellationPage() {
    let canvasRef: HTMLDivElement | undefined;
    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
    let points: THREE.Points;

    onMount(() => {
        if (!canvasRef) return;

        // Init THREE.js
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, canvasRef.clientWidth / canvasRef.clientHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(canvasRef.clientWidth, canvasRef.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        canvasRef.appendChild(renderer.domElement);

        // Create "Constellation"
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 5000; i++) {
            vertices.push(THREE.MathUtils.randFloatSpread(2000)); // x
            vertices.push(THREE.MathUtils.randFloatSpread(2000)); // y
            vertices.push(THREE.MathUtils.randFloatSpread(2000)); // z
        }
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0x6366f1, size: 2, transparent: true, opacity: 0.6 });
        points = new THREE.Points(geometry, material);
        scene.add(points);

        camera.position.z = 1000;

        const animate = () => {
            if (!renderer) return;
            requestAnimationFrame(animate);
            points.rotation.y += 0.001;
            points.rotation.x += 0.0005;
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (!canvasRef) return;
            camera.aspect = canvasRef.clientWidth / canvasRef.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvasRef.clientWidth, canvasRef.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        onCleanup(() => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
        });
    });

    return (
        <div class="h-[calc(100vh-10rem)] flex flex-col space-y-4 animate-in fade-in duration-700">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gradient">Constellation 3D</h1>
                    <p class="text-sm text-muted mt-0.5">Spatial visualization of global threat intelligence and asset relationships</p>
                </div>
                <div class="flex items-center gap-2">
                    <button class="p-2 rounded-lg bg-white/5 text-muted hover:text-white transition-colors border border-white/5">
                        <Share2 size={18} />
                    </button>
                    <button class="p-2 rounded-lg bg-white/5 text-muted hover:text-white transition-colors border border-white/5">
                        <Maximize2 size={18} />
                    </button>
                    <Badge variant="accent" class="ml-2 font-mono">GPU Accelerated</Badge>
                </div>
            </div>

            <div class="flex-1 relative bg-black/40 rounded-2xl border border-white/5 overflow-hidden group shadow-2xl">
                <div ref={canvasRef} class="absolute inset-0 cursor-move" />

                {/* HUD Overlay */}
                <div class="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                    <div class="flex justify-between items-start">
                        <div class="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl space-y-3 pointer-events-auto">
                            <h3 class="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                                <Layers size={14} /> Neural Layers
                            </h3>
                            <div class="space-y-2">
                                {[
                                    { name: "Asset Nodes", val: "4,092", active: true },
                                    { name: "C2 Overlays", val: "124", active: true },
                                    { name: "Risk Heatmap", val: "Enabled", active: false }
                                ].map(layer => (
                                    <div class="flex items-center justify-between gap-8 text-[11px]">
                                        <span class={layer.active ? 'text-white' : 'text-muted'}>{layer.name}</span>
                                        <span class="font-mono text-accent">{layer.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div class="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl pointer-events-auto flex items-center gap-4">
                            <div class="flex flex-col items-center">
                                <Cpu size={18} class="text-emerald-400 mb-1" />
                                <span class="text-[9px] text-muted font-bold">CORE</span>
                            </div>
                            <div class="h-8 w-px bg-white/10" />
                            <div class="flex flex-col items-center">
                                <Zap size={18} class="text-amber-400 mb-1" />
                                <span class="text-[9px] text-muted font-bold">FLOW</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-end justify-between">
                        <div class="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl pointer-events-auto">
                            <div class="flex items-center gap-3">
                                <div class="w-3 h-3 rounded-full bg-accent animate-ping" />
                                <span class="text-xs font-mono text-white">ORBITAL VIEW: ACTIVE</span>
                            </div>
                            <p class="text-[10px] text-muted mt-2">Vector rendering of global asset constellation based on realtime ingress.</p>
                        </div>
                        <div class="flex flex-col gap-2 pointer-events-auto">
                            <button class="w-10 h-10 rounded-lg bg-accent/20 border border-accent/40 text-accent flex items-center justify-center hover:bg-accent/40 transition-all font-bold text-lg">+</button>
                            <button class="w-10 h-10 rounded-lg bg-accent/20 border border-accent/40 text-accent flex items-center justify-center hover:bg-accent/40 transition-all font-bold text-lg">-</button>
                        </div>
                    </div>
                </div>

                {/* Grid Effect Overlay */}
                <div class="absolute inset-0 pointer-events-none opacity-20" style="background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 40px 40px;" />
            </div>

            <div class="bg-surface p-3 rounded-lg border border-white/5 flex items-center gap-6 text-[10px] text-muted uppercase tracking-widest font-bold">
                <span class="flex items-center gap-2"><Shield size={12} class="text-accent" /> Secure Rendering</span>
                <span class="flex items-center gap-2"><Globe size={12} class="text-blue-400" /> Latency: 12ms</span>
                <div class="flex-1" />
                <span class="text-white font-mono">Render Engine: OBLIVRA-3D-v1</span>
            </div>
        </div>
    );
}
