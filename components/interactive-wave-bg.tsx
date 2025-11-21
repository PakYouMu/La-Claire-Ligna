"use client";

import { WAVE_CONFIG, REDUCED_MOTION_CONFIG } from '@/wave.config';
import { MousePositionContext } from './context/mouse-position-context';
import React, { useRef, useLayoutEffect, useCallback, useContext } from 'react';

// OPTIMIZATION: Inline constants (JIT can inline these better than object properties)
const F_X = 0, F_Y = 1, F_TIME = 2, F_INTENSITY = 3, F_STRENGTH = 4, STRIDE = 5;
const PI = 3.141592653589793;
const TWO_PI = 6.283185307179586;
const HALF_PI = 1.5707963267948966;
const INV_PI = 0.3183098861837907;

// OPTIMIZATION: Combined lookup tables into single typed array for cache locality
// Layout: [0-4095: sine, 4096-4351: noise]
const LUT_SIZE = 4096 + 256;
const LUT = new Float32Array(LUT_SIZE);
const SIN_MASK = 4095;
const NOISE_OFFSET = 4096;
const NOISE_MASK = 255;
const SIN_SCALE = 651.8986469044033; // 4096 / TWO_PI

// Initialize combined LUT
for (let i = 0; i < 4096; i++) LUT[i] = Math.sin((i / 4096) * TWO_PI);
for (let i = 0; i < 256; i++) LUT[NOISE_OFFSET + i] = 0.4 + (Math.abs(Math.sin(i * 12.9898 + i) * 43758.5453) % 1) * 0.6;

// OPTIMIZATION: Inline lookup with direct array access
const sin = (x: number): number => LUT[(x * SIN_SCALE) & SIN_MASK];
const cos = (x: number): number => LUT[((x + HALF_PI) * SIN_SCALE) & SIN_MASK];
const noise = (i: number): number => LUT[NOISE_OFFSET + (i & NOISE_MASK)];

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
    const offCanvas = useRef<HTMLCanvasElement | null>(null);
    const offCtx = useRef<CanvasRenderingContext2D | null>(null);
    const mainCtx = useRef<CanvasRenderingContext2D | null>(null);
    
    // OPTIMIZATION: Single typed array for all wave data (better cache locality)
    const MAX_SRC = 25;
    const waveData = useRef(new Float32Array(MAX_SRC * STRIDE));
    const srcCount = useRef(0);
    const srcIdx = useRef(0);
    
    // OPTIMIZATION: Pack booleans into single number (bit flags)
    const flags = useRef(0); // bit 0: mouseOver, bit 1: initialized
    const FLAG_MOUSE_OVER = 1;
    const FLAG_INITIALIZED = 2;
    
    // OPTIMIZATION: Pack position data into typed array instead of object
    const mouseState = useRef(new Float64Array(5)); // [rectLeft, rectTop, lastX, lastY, lastTime]
    const MS_RECT_L = 0, MS_RECT_T = 1, MS_LAST_X = 2, MS_LAST_Y = 3, MS_LAST_T = 4;
    
    const velocity = useRef(0);
    const phase = useRef(0);
    
    // OPTIMIZATION: Pack wave params into typed array
    const waveParams = useRef(new Float32Array(3)); // [freq, speed, amp]
    const WP_FREQ = 0, WP_SPEED = 1, WP_AMP = 2;

    const strokeStyle = useRef('hsl(0 0% 0%)');
    
    // Buffers - will be allocated on resize
    const buffers = useRef<{
        disp: Float32Array;
        fall: Float32Array;
        y: Float32Array;
        stamp: Float32Array;
        numPts: number;
        stampSize: number;
    } | null>(null);
    
    // OPTIMIZATION: Pack dimensions into typed array
    const dims = useRef(new Float32Array(4)); // [width, height, centerY, invCenterY]
    const D_W = 0, D_H = 1, D_CY = 2, D_ICY = 3;
    
    // OPTIMIZATION: Pack ALL config into typed array (eliminates object property access)
    const cfg = useRef(new Float32Array(14));
    const C_GFREQ = 0, C_GAMP = 1, C_INF = 2, C_IINF = 3, C_DAMP = 4, C_LW = 5;
    const C_LVT = 6, C_ILVT = 7, C_MINL = 8, C_LRNG = 9, C_VT = 10, C_IVT = 11;
    const C_BPHASE = 12, C_PRNG = 13;

    const randomizeWaveParams = useCallback(() => {
        const wp = waveParams.current;
        wp[WP_FREQ] = 0.02 + Math.random() * 0.05;
        wp[WP_SPEED] = 0.5 + Math.random() * 0.4;
        wp[WP_AMP] = 0.1 + Math.random() * 0.2;
    }, []);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;
        mainCtx.current = ctx;
        ctx.imageSmoothingEnabled = false;
        
        offCanvas.current = document.createElement('canvas');
        const octx = offCanvas.current.getContext('2d', { alpha: true });
        if (!octx) return;
        offCtx.current = octx;

        const wd = waveData.current;
        const ms = mouseState.current;
        const c = cfg.current;
        const d = dims.current;
        const wp = waveParams.current;
        const STEP = 3;
        const vDecay = config.velocityDecayFactor;
        
        // Cache all config into typed array
        c[C_GFREQ] = config.globalFrequency;
        c[C_GAMP] = config.globalAmplitude;
        c[C_INF] = config.horizontalInfluence;
        c[C_IINF] = 1 / config.horizontalInfluence;
        c[C_DAMP] = config.amplitudeDampening;
        c[C_LW] = config.lineWidth;
        c[C_LVT] = config.lingerVelocityThreshold;
        c[C_ILVT] = 1 / config.lingerVelocityThreshold;
        c[C_MINL] = config.minLinger;
        c[C_LRNG] = config.maxLinger - config.minLinger;
        c[C_VT] = config.velocityThreshold;
        c[C_IVT] = 1 / config.velocityThreshold;
        c[C_BPHASE] = config.basePhaseIncrement;
        c[C_PRNG] = config.maxPhaseIncrement - config.basePhaseIncrement;

        // Precompute stamp
        const stampPx = ((c[C_INF] * 2 / STEP) | 0) + 1;
        const stamp = new Float32Array(stampPx);
        const invInf = c[C_IINF];
        for (let i = 0; i < stampPx; i++) {
            const localX = i * STEP - c[C_INF];
            const nd = (localX < 0 ? -localX : localX) * invInf;
            const t = 1 - nd;
            stamp[i] = t > 0 ? t * t * (3 - t - t) : 0;
        }

        const updateStroke = () => {
            const s = getComputedStyle(canvas);
            const fg = s.getPropertyValue('--foreground').trim();
            strokeStyle.current = fg ? `hsl(${fg})` : 'hsl(0 0% 0%)';
        };
        updateStroke();

        const themeObs = new MutationObserver(() => requestAnimationFrame(updateStroke));
        themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-mode'] });
        document.body && themeObs.observe(document.body, { attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-mode'] });
        
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', updateStroke);

        const updateRect = () => {
            const r = canvas.getBoundingClientRect();
            ms[MS_RECT_L] = r.left;
            ms[MS_RECT_T] = r.top;
        };

        const resize = (w: number, h: number) => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const oc = offCanvas.current!;
            
            canvas.width = oc.width = w * dpr;
            canvas.height = oc.height = h * dpr;
            canvas.style.width = oc.style.width = `${w}px`;
            canvas.style.height = oc.style.height = `${h}px`;
            
            ctx.scale(dpr, dpr);
            octx!.scale(dpr, dpr);
            
            d[D_W] = w;
            d[D_H] = h;
            d[D_CY] = h * 0.5;
            d[D_ICY] = 2 / h;
            
            const numPts = ((w / STEP) | 0) + 2;
            buffers.current = {
                disp: new Float32Array(numPts),
                fall: new Float32Array(numPts),
                y: new Float32Array(numPts),
                stamp,
                numPts,
                stampSize: stampPx
            };
            
            updateRect();
            updateStroke();
        };

        const onMove = (e: MouseEvent) => {
            if (!(flags.current & FLAG_MOUSE_OVER) || reducedMotion) return;

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
            
            const sc = srcCount.current;
            let idx: number;
            if (sc < MAX_SRC) {
                idx = sc * STRIDE;
                srcCount.current = sc + 1;
            } else {
                idx = srcIdx.current * STRIDE;
                srcIdx.current = (srcIdx.current + 1) % MAX_SRC;
            }

            wd[idx] = x;
            wd[idx + 1] = y;
            wd[idx + 2] = now;
            wd[idx + 3] = velocity.current;
            wd[idx + 4] = 1;
        };

        const onLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
                flags.current &= ~(FLAG_MOUSE_OVER | FLAG_INITIALIZED);
            }
        };

        const onEnter = (e: MouseEvent) => {
            if (!(flags.current & FLAG_INITIALIZED)) {
                randomizeWaveParams();
                flags.current |= FLAG_INITIALIZED;
            }
            flags.current |= FLAG_MOUSE_OVER;
            updateRect();
            ms[MS_LAST_X] = e.clientX - ms[MS_RECT_L];
            ms[MS_LAST_Y] = e.clientY - ms[MS_RECT_T];
            ms[MS_LAST_T] = performance.now();
        };

        // OPTIMIZATION: Main draw loop - maximally optimized
        const draw = () => {
            const buf = buffers.current;
            const oc = offCanvas.current;
            const octx = offCtx.current;
            const mctx = mainCtx.current;
            
            if (!buf || !oc || !octx || !mctx) {
                rafId.current = requestAnimationFrame(draw);
                return;
            }

            const now = performance.now();
            const { disp, fall, y, stamp: stmp, numPts, stampSize } = buf;
            const w = d[D_W], h = d[D_H], cy = d[D_CY], icy = d[D_ICY];
            const inf = c[C_INF], iinf = c[C_IINF], damp = c[C_DAMP];
            const ilvt = c[C_ILVT], minL = c[C_MINL], lrng = c[C_LRNG];
            const gfreq = c[C_GFREQ], gamp = c[C_GAMP];
            const mfreq = wp[WP_FREQ], mspeed = wp[WP_SPEED], mamp = wp[WP_AMP];
            const ph = phase.current;

            // OPTIMIZATION: Unrolled buffer clear (faster than .fill(0) for small buffers)
            // For larger buffers, .fill is faster, but we'll use a hybrid approach
            let i = 0;
            const len = numPts;
            // Unroll by 8 for the bulk
            const len8 = len - (len % 8);
            for (; i < len8; i += 8) {
                disp[i] = disp[i+1] = disp[i+2] = disp[i+3] = 
                disp[i+4] = disp[i+5] = disp[i+6] = disp[i+7] = 0;
                fall[i] = fall[i+1] = fall[i+2] = fall[i+3] = 
                fall[i+4] = fall[i+5] = fall[i+6] = fall[i+7] = 0;
            }
            // Handle remainder
            for (; i < len; i++) { disp[i] = 0; fall[i] = 0; }

            // Physics + stamping in single pass
            i = 0;
            let sc = srcCount.current;
            while (i < sc) {
                const base = i * STRIDE;
                const intensity = wd[base + F_INTENSITY];
                const created = wd[base + F_TIME];
                
                let ratio = intensity * ilvt;
                if (ratio > 1) ratio = 1;
                const linger = minL + lrng * ratio;
                const age = now - created;

                if (age >= linger) {
                    // Swap-and-pop
                    const last = (sc - 1) * STRIDE;
                    if (base !== last) {
                        wd[base] = wd[last];
                        wd[base+1] = wd[last+1];
                        wd[base+2] = wd[last+2];
                        wd[base+3] = wd[last+3];
                        wd[base+4] = wd[last+4];
                    }
                    sc--;
                    continue;
                }

                const prog = age / linger;
                const inv = 1 - prog;
                const str = inv * inv;
                wd[base + F_STRENGTH] = str;
                
                const sx = wd[base], sy = wd[base + 1];
                const distY = sy < cy ? cy - sy : sy - cy;
                const advAmp = (1 - distY * icy) * cy * damp;

                // Stamp contribution
                let si = ((sx - inf) / STEP) | 0;
                if (si < 0) si = 0;
                let ei = ((sx + inf) / STEP) | 0;
                if (ei >= numPts) ei = numPts - 1;

                // OPTIMIZATION: Unrolled inner stamp loop by 4
                const loopEnd = ei - ((ei - si + 1) % 4);
                let j = si;
                
                for (; j <= loopEnd; j += 4) {
                    // Iteration 1
                    let x = j * STEP;
                    let sti = ((x - sx + inf) / STEP) | 0;
                    if (sti >= 0 && sti < stampSize) {
                        let fo = stmp[sti] * str;
                        let wph = x * mfreq + ph * mspeed;
                        let ni = (wph * INV_PI) | 0;
                        let a1 = LUT[NOISE_OFFSET + (ni & NOISE_MASK)];
                        let a2 = LUT[NOISE_OFFSET + ((ni + 1) & NOISE_MASK)];
                        let fp = (wph - ni * PI) * INV_PI;
                        let sf = (1 - cos(fp * PI)) * 0.5;
                        let ia = a1 + (a2 - a1) * sf;
                        disp[j] += sin(wph) * advAmp * fo * mamp * ia;
                        if (fo > fall[j]) fall[j] = fo;
                    }
                    
                    // Iteration 2
                    x = (j+1) * STEP;
                    sti = ((x - sx + inf) / STEP) | 0;
                    if (sti >= 0 && sti < stampSize) {
                        let fo = stmp[sti] * str;
                        let wph = x * mfreq + ph * mspeed;
                        let ni = (wph * INV_PI) | 0;
                        let a1 = LUT[NOISE_OFFSET + (ni & NOISE_MASK)];
                        let a2 = LUT[NOISE_OFFSET + ((ni + 1) & NOISE_MASK)];
                        let fp = (wph - ni * PI) * INV_PI;
                        let sf = (1 - cos(fp * PI)) * 0.5;
                        let ia = a1 + (a2 - a1) * sf;
                        disp[j+1] += sin(wph) * advAmp * fo * mamp * ia;
                        if (fo > fall[j+1]) fall[j+1] = fo;
                    }
                    
                    // Iteration 3
                    x = (j+2) * STEP;
                    sti = ((x - sx + inf) / STEP) | 0;
                    if (sti >= 0 && sti < stampSize) {
                        let fo = stmp[sti] * str;
                        let wph = x * mfreq + ph * mspeed;
                        let ni = (wph * INV_PI) | 0;
                        let a1 = LUT[NOISE_OFFSET + (ni & NOISE_MASK)];
                        let a2 = LUT[NOISE_OFFSET + ((ni + 1) & NOISE_MASK)];
                        let fp = (wph - ni * PI) * INV_PI;
                        let sf = (1 - cos(fp * PI)) * 0.5;
                        let ia = a1 + (a2 - a1) * sf;
                        disp[j+2] += sin(wph) * advAmp * fo * mamp * ia;
                        if (fo > fall[j+2]) fall[j+2] = fo;
                    }
                    
                    // Iteration 4
                    x = (j+3) * STEP;
                    sti = ((x - sx + inf) / STEP) | 0;
                    if (sti >= 0 && sti < stampSize) {
                        let fo = stmp[sti] * str;
                        let wph = x * mfreq + ph * mspeed;
                        let ni = (wph * INV_PI) | 0;
                        let a1 = LUT[NOISE_OFFSET + (ni & NOISE_MASK)];
                        let a2 = LUT[NOISE_OFFSET + ((ni + 1) & NOISE_MASK)];
                        let fp = (wph - ni * PI) * INV_PI;
                        let sf = (1 - cos(fp * PI)) * 0.5;
                        let ia = a1 + (a2 - a1) * sf;
                        disp[j+3] += sin(wph) * advAmp * fo * mamp * ia;
                        if (fo > fall[j+3]) fall[j+3] = fo;
                    }
                }
                
                // Handle remainder
                for (; j <= ei; j++) {
                    const x = j * STEP;
                    const sti = ((x - sx + inf) / STEP) | 0;
                    if (sti < 0 || sti >= stampSize) continue;
                    const fo = stmp[sti] * str;
                    const wph = x * mfreq + ph * mspeed;
                    const ni = (wph * INV_PI) | 0;
                    const a1 = LUT[NOISE_OFFSET + (ni & NOISE_MASK)];
                    const a2 = LUT[NOISE_OFFSET + ((ni + 1) & NOISE_MASK)];
                    const fp = (wph - ni * PI) * INV_PI;
                    const sf = (1 - cos(fp * PI)) * 0.5;
                    const ia = a1 + (a2 - a1) * sf;
                    disp[j] += sin(wph) * advAmp * fo * mamp * ia;
                    if (fo > fall[j]) fall[j] = fo;
                }
                
                i++;
            }
            srcCount.current = sc;

            velocity.current *= vDecay;
            
            let spd = velocity.current * c[C_IVT];
            if (spd > 1) spd = 1;
            const phaseInc = c[C_BPHASE] + c[C_PRNG] * spd;

            // OPTIMIZATION: Compute Y with unrolled loop
            const yLen4 = numPts - (numPts % 4);
            for (i = 0; i < yLen4; i += 4) {
                const x0 = i * STEP, x1 = (i+1) * STEP, x2 = (i+2) * STEP, x3 = (i+3) * STEP;
                y[i] = cy + sin(x0 * gfreq + ph) * gamp * (1 - fall[i]) + disp[i];
                y[i+1] = cy + sin(x1 * gfreq + ph) * gamp * (1 - fall[i+1]) + disp[i+1];
                y[i+2] = cy + sin(x2 * gfreq + ph) * gamp * (1 - fall[i+2]) + disp[i+2];
                y[i+3] = cy + sin(x3 * gfreq + ph) * gamp * (1 - fall[i+3]) + disp[i+3];
            }
            for (; i < numPts; i++) {
                y[i] = cy + sin(i * STEP * gfreq + ph) * gamp * (1 - fall[i]) + disp[i];
            }

            // Draw
            octx.clearRect(0, 0, w, h);
            octx.beginPath();
            octx.moveTo(0, y[0]);
            
            // OPTIMIZATION: Unrolled path building
            const pathLen4 = numPts - (numPts % 4);
            for (i = 1; i < pathLen4; i += 4) {
                octx.lineTo(i * STEP, y[i]);
                octx.lineTo((i+1) * STEP, y[i+1]);
                octx.lineTo((i+2) * STEP, y[i+2]);
                octx.lineTo((i+3) * STEP, y[i+3]);
            }
            for (; i < numPts; i++) octx.lineTo(i * STEP, y[i]);
            octx.lineTo(w, cy);

            octx.strokeStyle = strokeStyle.current;
            octx.lineWidth = c[C_LW];
            octx.stroke();

            mctx.clearRect(0, 0, w, h);
            mctx.drawImage(oc, 0, 0, w, h);

            phase.current += phaseInc;
            rafId.current = requestAnimationFrame(draw);
        };

        const resizeObs = new ResizeObserver(e => {
            const entry = e[0];
            if (entry) resize(entry.contentRect.width, entry.contentRect.height);
        });
        resizeObs.observe(container);
        
        if (!(flags.current & FLAG_INITIALIZED)) {
            randomizeWaveParams();
            flags.current |= FLAG_INITIALIZED;
        }
        
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
    }, [config, randomizeWaveParams, reducedMotion]);

    return (
        <main ref={containerRef} className="absolute inset-0 w-full h-full grid">
            <canvas ref={canvasRef} className="z-0 col-start-1 row-start-1" />
            <div className="z-10 col-start-1 row-start-1 grid place-items-center pointer-events-none">
              {children}
            </div>
        </main>
    )
};

export default InteractiveWaveBackground;