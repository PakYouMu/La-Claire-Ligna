"use client";

import { WAVE_CONFIG, REDUCED_MOTION_CONFIG } from '@/wave.config';
import { MousePositionContext } from './context/mouse-position-context';
import React, { useRef, useLayoutEffect, useCallback, useContext, useState, useEffect } from 'react';

// Type definitions for WASM module
interface WaveEngineInstance {
    configure(
        globalFreq: number,
        globalAmp: number,
        influence: number,
        dampening: number,
        lingerVelThreshold: number,
        minLinger: number,
        maxLinger: number
    ): void;
    resize(width: number, height: number): void;
    set_wave_params(freq: number, speed: number, amp: number): void;
    add_source(x: number, y: number, time: number, intensity: number): void;
    compute(now: number, phase: number): number; // Takes absolute phase now
    get_num_points(): number;
    get_step(): number;
    get_center_y(): number;
}

// Relaxed definition to support init result
interface WasmModule {
    default: (args?: any) => Promise<any>;
    WaveEngine: new () => WaveEngineInstance;
    memory: WebAssembly.Memory;
}

// Singleton WASM loader
let wasmModule: WasmModule | null = null;
let wasmLoadPromise: Promise<WasmModule> | null = null;

async function loadWasm(): Promise<WasmModule> {
    if (wasmModule) return wasmModule;
    if (wasmLoadPromise) return wasmLoadPromise;
    
    wasmLoadPromise = (async () => {
        try {
            const wasmImport = await import('@/wasm/wave-engine/pkg/wave_engine');
            const mw = wasmImport as unknown as any;

            let memory = mw.memory;

            if (typeof mw.default === 'function') {
                const initResult = await mw.default();
                if (!memory && initResult) {
                    memory = initResult.memory || initResult.exports?.memory;
                }
            }

            if (!memory) {
                memory = (mw as any).memory;
            }

            wasmModule = {
                default: mw.default,
                WaveEngine: mw.WaveEngine,
                memory: memory
            } as WasmModule;

            return wasmModule;
        } catch (e) {
            console.error("Critical WASM Load Error:", e);
            throw e;
        }
    })();
    
    return wasmLoadPromise;
}

const InteractiveWaveBackground = ({
    children,
    reducedMotion = false
}: {
    children: React.ReactNode;
    reducedMotion?: boolean;
}) => {
    useContext(MousePositionContext);
    
    const config = reducedMotion ? REDUCED_MOTION_CONFIG : WAVE_CONFIG;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rafId = useRef(0);
    
    // WASM state
    const [wasmReady, setWasmReady] = useState(false);
    const wasmRef = useRef<WasmModule | null>(null);
    const engineRef = useRef<WaveEngineInstance | null>(null);
    
    // Canvas contexts
    const mainCtx = useRef<CanvasRenderingContext2D | null>(null);
    const offCanvas = useRef<HTMLCanvasElement | null>(null);
    const offCtx = useRef<CanvasRenderingContext2D | null>(null);
    
    // State
    const flags = useRef(0);
    const FLAG_MOUSE_OVER = 1;
    const FLAG_INITIALIZED = 2;
    const mouseState = useRef(new Float64Array(5)); 
    const MS_RECT_L = 0, MS_RECT_T = 1, MS_LAST_X = 2, MS_LAST_Y = 3, MS_LAST_T = 4;
    
    const velocity = useRef(0);
    const phase = useRef(0); // Track total phase accumulation
    const strokeStyle = useRef('hsl(0 0% 0%)');
    const dims = useRef({ width: 0, height: 0 });

    // 1. Load WASM
    useEffect(() => {
        let mounted = true;
        loadWasm().then(wasm => {
            if (!mounted) return;
            wasmRef.current = wasm;
            engineRef.current = new wasm.WaveEngine();
            setWasmReady(true);
        }).catch(err => console.error('Failed to load WASM:', err));
        return () => { mounted = false; };
    }, []);

    const randomizeWaveParams = useCallback(() => {
        const engine = engineRef.current;
        if (!engine) return;
        const freq = 0.02 + Math.random() * 0.05;
        const speed = 0.5 + Math.random() * 0.4;
        const amp = 0.1 + Math.random() * 0.2;
        engine.set_wave_params(freq, speed, amp);
    }, []);

    // 2. Main Setup
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        
        if (!canvas || !container) return;

        if (!mainCtx.current) {
            const ctx = canvas.getContext('2d', { alpha: true });
            if (ctx) {
                mainCtx.current = ctx;
                ctx.imageSmoothingEnabled = false;
            }
        }
        
        if (!offCanvas.current) {
            offCanvas.current = document.createElement('canvas');
            const octx = offCanvas.current.getContext('2d', { alpha: true });
            if (octx) offCtx.current = octx;
        }

        const ms = mouseState.current;
        
        const updateStroke = () => {
            const s = getComputedStyle(canvas);
            const fg = s.getPropertyValue('--foreground').trim();
            strokeStyle.current = fg ? `hsl(${fg})` : 'hsl(0 0% 0%)';
        };
        updateStroke();

        const themeObs = new MutationObserver(() => requestAnimationFrame(updateStroke));
        themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
        
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', updateStroke);

        const updateRect = () => {
            const r = canvas.getBoundingClientRect();
            ms[MS_RECT_L] = r.left;
            ms[MS_RECT_T] = r.top;
        };

        const onEnter = (e: MouseEvent) => {
            flags.current |= FLAG_MOUSE_OVER;
            if (!(flags.current & FLAG_INITIALIZED)) {
                if (engineRef.current) randomizeWaveParams();
                flags.current |= FLAG_INITIALIZED;
            }
            updateRect();
            ms[MS_LAST_X] = e.clientX - ms[MS_RECT_L];
            ms[MS_LAST_Y] = e.clientY - ms[MS_RECT_T];
            ms[MS_LAST_T] = performance.now();
        };

        const onMove = (e: MouseEvent) => {
            if (reducedMotion) return;
            if (!(flags.current & FLAG_MOUSE_OVER)) onEnter(e);

            const x = e.clientX - ms[MS_RECT_L];
            const y = e.clientY - ms[MS_RECT_T];
            const dx = x - ms[MS_LAST_X];
            const dy = y - ms[MS_LAST_Y];
            const dSq = dx * dx + dy * dy;
            
            if (dSq < 9) return;
            
            const now = performance.now();
            const dt = now - ms[MS_LAST_T];
            
            if (dt > 0) {
                const v = Math.sqrt(dSq) / dt;
                velocity.current = v * 0.2 + velocity.current * 0.8;
            }
            
            ms[MS_LAST_X] = x;
            ms[MS_LAST_Y] = y;
            ms[MS_LAST_T] = now;
            
            if (engineRef.current) {
                engineRef.current.add_source(x, y, now, velocity.current);
            }
        };

        const onLeave = () => {
            flags.current &= ~FLAG_MOUSE_OVER;
        };

        const resize = (w: number, h: number) => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            
            if (offCanvas.current) {
                offCanvas.current.width = w * dpr;
                offCanvas.current.height = h * dpr;
                offCtx.current?.scale(dpr, dpr);
            }
            
            mainCtx.current?.scale(dpr, dpr);
            dims.current = { width: w, height: h };
            
            if (engineRef.current) {
                engineRef.current.resize(w, h);
            }
            
            updateRect();
            updateStroke();
        };

        // Sync Config with WASM
        if (wasmReady && engineRef.current) {
            const engine = engineRef.current;
            engine.configure(
                config.globalFrequency,
                config.globalAmplitude,
                config.horizontalInfluence,
                config.amplitudeDampening,
                config.lingerVelocityThreshold,
                config.minLinger,
                config.maxLinger
            );
            resize(dims.current.width || container.clientWidth, dims.current.height || container.clientHeight);
        }

        const draw = () => {
            const engine = engineRef.current;
            const wasm = wasmRef.current;
            const mctx = mainCtx.current;
            const octx = offCtx.current;
            const oc = offCanvas.current;

            if (!engine || !wasm || !mctx || !octx || !oc) {
                rafId.current = requestAnimationFrame(draw);
                return;
            }

            const now = performance.now();
            const { width, height } = dims.current;
            
            // Physics calculations
            velocity.current *= config.velocityDecayFactor;
            let spd = velocity.current / config.velocityThreshold;
            if (spd > 1) spd = 1;
            
            // Accumulate Phase (This makes the wave move)
            const phaseInc = config.basePhaseIncrement + (config.maxPhaseIncrement - config.basePhaseIncrement) * spd;
            phase.current += phaseInc;
            
            // Call WASM with total phase
            const yPtr = engine.compute(now, phase.current);
            const numPoints = engine.get_num_points();
            const step = engine.get_step();
            const centerY = engine.get_center_y();
            
            const yCoords = new Float32Array(wasm.memory.buffer, yPtr, numPoints);
            
            octx.clearRect(0, 0, width, height);
            octx.beginPath();
            octx.moveTo(0, yCoords[0]);
            
            const len4 = numPoints - (numPoints % 4);
            for (let i = 1; i < len4; i += 4) {
                octx.lineTo(i * step, yCoords[i]);
                octx.lineTo((i + 1) * step, yCoords[i + 1]);
                octx.lineTo((i + 2) * step, yCoords[i + 2]);
                octx.lineTo((i + 3) * step, yCoords[i + 3]);
            }
            for (let i = len4; i < numPoints; i++) {
                octx.lineTo(i * step, yCoords[i]);
            }
            octx.lineTo(width, centerY);

            octx.strokeStyle = strokeStyle.current;
            octx.lineWidth = config.lineWidth;
            octx.stroke();

            mctx.clearRect(0, 0, width, height);
            mctx.drawImage(oc, 0, 0, width, height);

            rafId.current = requestAnimationFrame(draw);
        };

        const resizeObs = new ResizeObserver(e => {
            const entry = e[0];
            if (entry) resize(entry.contentRect.width, entry.contentRect.height);
        });
        resizeObs.observe(container);
        
        canvas.addEventListener('mousemove', onMove);
        document.addEventListener('mouseleave', onLeave);
        document.addEventListener('mouseenter', onEnter);
        window.addEventListener('scroll', updateRect);
        
        rafId.current = requestAnimationFrame(draw);

        return () => {
            resizeObs.disconnect();
            themeObs.disconnect();
            mq.removeEventListener('change', updateStroke);
            canvas.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseleave', onLeave);
            document.removeEventListener('mouseenter', onEnter);
            window.removeEventListener('scroll', updateRect);
            cancelAnimationFrame(rafId.current);
        };
    }, [config, randomizeWaveParams, reducedMotion, wasmReady]);

    return (
        <main ref={containerRef} className="absolute inset-0 w-full h-full grid">
            <canvas ref={canvasRef} className="z-0 col-start-1 row-start-1" />
            <div className="z-10 col-start-1 row-start-1 grid place-items-center pointer-events-none">
              {children}
            </div>
        </main>
    );
};

export default InteractiveWaveBackground;