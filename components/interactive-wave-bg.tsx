"use client";

import { WAVE_CONFIG, REDUCED_MOTION_CONFIG } from '@/wave.config';
import { MousePositionContext } from './context/mouse-position-context';
import React, { useRef, useLayoutEffect, useCallback, useContext } from 'react';

type WaveSource = {
    id: number;
    x: number;
    y: number;
    strength: number;
    creationTime: number;
    initialIntensity: number;
};

const InteractiveWaveBackground = ({
    children,
    reducedMotion = false
}: {
    children: React.ReactNode;
    reducedMotion?: boolean;
}) => {
    // Hook needed for component lifecycle, but we bypass it for physics
    useContext(MousePositionContext);

    const config = reducedMotion ? REDUCED_MOTION_CONFIG : WAVE_CONFIG;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);
    
    // OPTIMIZATION: Pre-allocate array to avoid dynamic resizing overhead
    const waveSources = useRef<WaveSource[]>([]);
    const MAX_SOURCES = 25; 
    
    const nextSourceId = useRef(0);
    const isMouseOver = useRef(false);
    const hasInitialized = useRef(false);
    
    const lastMousePosition = useRef<{ x: number; y: number; timestamp: number }>({ x: 0, y: 0, timestamp: 0 });
    const mouseVelocity = useRef(0);
    const phase = useRef(0);
    
    // Visual params
    const mouseWaveFrequency = useRef(0.04);
    const mouseWaveSpeed = useRef(1.69);
    const mouseWaveAmplitude = useRef(1.0);

    // OPTIMIZATION: Stateless pseudo-random function replaces the memory-heavy Map
    // Returns a consistent value between 0.4 and 1.0 for any given integer index
    const getAmplitudeNoise = (index: number) => {
        // Simple hash function (sine fracture)
        const noise = Math.abs(Math.sin(index * 12.9898 + index) * 43758.5453) % 1;
        return 0.4 + (noise * 0.6);
    };

    const randomizeWaveParameters = useCallback(() => {
        mouseWaveFrequency.current = 0.02 + Math.random() * 0.05;
        mouseWaveSpeed.current = 0.5 + Math.random() * 0.4;
        mouseWaveAmplitude.current = 0.1 + Math.random() * 0.2;
    }, []);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;
        
        // Performance: Sharp lines are faster to render
        ctx.imageSmoothingEnabled = false;
        
        offscreenCanvasRef.current = document.createElement('canvas');
        offscreenCtxRef.current = offscreenCanvasRef.current.getContext('2d', { alpha: true });
        const offscreenCtx = offscreenCtxRef.current;
        if (!offscreenCtx) return;

        const nodeSpacing = Math.PI;

        const resizeCanvas = (width: number, height: number) => {
            canvas.width = width;
            canvas.height = height;
            if (offscreenCanvasRef.current) {
                offscreenCanvasRef.current.width = width;
                offscreenCanvasRef.current.height = height;
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isMouseOver.current || reducedMotion) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // OPTIMIZATION: Spatial Throttling
            // Don't add sources if mouse moved less than 3 pixels.
            // This saves processing power when the mouse is idle or micro-jittering.
            const dist = Math.abs(x - lastMousePosition.current.x) + Math.abs(y - lastMousePosition.current.y);
            if (dist < 3) return; 
            
            const now = performance.now();
            const deltaTime = now - lastMousePosition.current.timestamp;
            
            if (deltaTime > 0) {
                const deltaX = x - lastMousePosition.current.x;
                const deltaY = y - lastMousePosition.current.y;
                const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
                const instantaneousVelocity = distance / deltaTime;
                
                const VELOCITY_SMOOTHING_FACTOR = 0.2;
                mouseVelocity.current = (instantaneousVelocity * VELOCITY_SMOOTHING_FACTOR) + (mouseVelocity.current * (1 - VELOCITY_SMOOTHING_FACTOR));
            }
            
            lastMousePosition.current = { x, y, timestamp: now };
            
            // Add new source
            waveSources.current.push({
                id: nextSourceId.current++,
                x,
                y,
                strength: 1.0,
                creationTime: now,
                initialIntensity: mouseVelocity.current,
            });

            // OPTIMIZATION: Hard Limit (FIFO)
            if (waveSources.current.length > MAX_SOURCES) {
                waveSources.current.shift();
            }
        };

        const handleDocumentMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
                isMouseOver.current = false;
                hasInitialized.current = false;
            }
        };

        const handleDocumentMouseEnter = (e: MouseEvent) => {
            if (!hasInitialized.current) {
                randomizeWaveParameters();
                hasInitialized.current = true;
            }
            isMouseOver.current = true;
            const rect = canvas.getBoundingClientRect();
            lastMousePosition.current = { 
                x: e.clientX - rect.left, 
                y: e.clientY - rect.top, 
                timestamp: performance.now() 
            };
        };

        const draw = () => {
            const now = performance.now();
            const offscreenCanvas = offscreenCanvasRef.current;
            const offscreenCtx = offscreenCtxRef.current;
            
            if (!offscreenCtx || !offscreenCanvas || offscreenCanvas.width <= 0 || offscreenCanvas.height <= 0) {
                animationFrameId.current = requestAnimationFrame(draw);
                return;
            }

            // OPTIMIZATION: In-Place Array Update (Zero Garbage Collection)
            // Instead of .map().filter() which creates new arrays every frame,
            // we iterate, update, and compact the array manually.
            let activeCount = 0;
            const sources = waveSources.current;
            
            for (let i = 0; i < sources.length; i++) {
                const source = sources[i];
                
                // Update strength logic
                const intensityRatio = Math.min(source.initialIntensity / config.lingerVelocityThreshold, 1.0);
                const lingerDuration = config.minLinger + (config.maxLinger - config.minLinger) * intensityRatio;
                const age = now - source.creationTime;
                
                // If alive, update and keep
                if (age < lingerDuration) {
                    const progress = age / lingerDuration; // 0 to 1
                    // Original decay formula
                    source.strength = (1.0 - progress) ** 2;
                    
                    // Compact array: move to front if needed
                    if (i !== activeCount) {
                        sources[activeCount] = source;
                    }
                    activeCount++;
                }
            }
            // Truncate array to remove dead items
            sources.length = activeCount;

            // Physics Update
            mouseVelocity.current *= config.velocityDecayFactor;
            
            const speedInterpolation = Math.min(mouseVelocity.current / config.velocityThreshold, 1.0);
            const dynamicPhaseIncrement = config.basePhaseIncrement + (config.maxPhaseIncrement - config.basePhaseIncrement) * speedInterpolation;
            
            // Draw
            const width = offscreenCanvas.width;
            const height = offscreenCanvas.height;
            const centerY = height / 2;
            
            offscreenCtx.clearRect(0, 0, width, height);
            offscreenCtx.beginPath();
            offscreenCtx.moveTo(0, centerY);

            // OPTIMIZATION: Spatial Downsampling
            // Step 3 is visually indistinguishable from Step 1 but 3x faster
            const STEP = 3; 
            
            // Cache constants outside loop
            const globalFreq = config.globalFrequency;
            const globalAmp = config.globalAmplitude;
            const influence = config.horizontalInfluence;
            const dampening = config.amplitudeDampening;
            const currentMouseWaveFreq = mouseWaveFrequency.current;
            const currentMouseWaveSpeed = mouseWaveSpeed.current;
            const currentMouseWaveAmp = mouseWaveAmplitude.current;
            const currentPhase = phase.current;

            for (let i = 0; i <= width; i += STEP) {
                const globalWave = Math.sin((i * globalFreq) + currentPhase) * globalAmp;
                let totalMouseDisplacement = 0;
                let totalFalloff = 0;

                // Inner loop (Sources)
                for (let j = 0; j < activeCount; j++) {
                    const source = sources[j];
                    
                    // OPTIMIZATION: Bounding Box Check
                    // Skip calculation if x is too far away
                    if (i < source.x - influence || i > source.x + influence) continue;

                    const distanceToSourceX = Math.abs(i - source.x);
                    const normalizedDistance = distanceToSourceX / influence;
                    
                    // Smoothstep Falloff
                    const t = 1.0 - normalizedDistance;
                    const horizontalFalloff = t * t * (3.0 - 2.0 * t);
                    
                    const currentDistance = Math.abs(source.y - centerY);
                    const adverseAmplitude = (1 - (currentDistance / centerY)) * centerY * dampening;
                    
                    const wavePhase = (i * currentMouseWaveFreq) + (currentPhase * currentMouseWaveSpeed);
                    const sineWave = Math.sin(wavePhase);
                    
                    // Stateless Amplitude Noise (Replaces Map)
                    const nodeIndex1 = Math.floor(wavePhase / nodeSpacing);
                    const nodeIndex2 = nodeIndex1 + 1;
                    const amp1 = getAmplitudeNoise(nodeIndex1);
                    const amp2 = getAmplitudeNoise(nodeIndex2);
                    
                    const fractionalPos = (wavePhase % nodeSpacing) / nodeSpacing;
                    const smoothFractionalPos = (1 - Math.cos(fractionalPos * Math.PI)) / 2;
                    const interpolatedAmplitude = amp1 * (1 - smoothFractionalPos) + amp2 * smoothFractionalPos;
                    
                    const displacement = sineWave * adverseAmplitude * horizontalFalloff * currentMouseWaveAmp * interpolatedAmplitude * source.strength;
                    totalMouseDisplacement += displacement;
                    
                    // Track max falloff for blending
                    if (horizontalFalloff * source.strength > totalFalloff) {
                        totalFalloff = horizontalFalloff * source.strength;
                    }
                }
                
                // Combine
                const finalY = centerY + (globalWave * (1 - totalFalloff)) + totalMouseDisplacement;
                offscreenCtx.lineTo(i, finalY);
            }
            
            // Finish Line
            offscreenCtx.lineTo(width, centerY);

            const style = getComputedStyle(canvas);
            const foregroundColorValue = style.getPropertyValue('--foreground');
            offscreenCtx.strokeStyle = `hsl(${foregroundColorValue})`;
            offscreenCtx.lineWidth = config.lineWidth;
            offscreenCtx.stroke();

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(offscreenCanvas, 0, 0);

            phase.current += dynamicPhaseIncrement;
            animationFrameId.current = requestAnimationFrame(draw);
        };

        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) resizeCanvas(entry.contentRect.width, entry.contentRect.height);
        });
        observer.observe(container);
        
        if (!hasInitialized.current) {
            randomizeWaveParameters();
            hasInitialized.current = true;
        }
        
        canvas.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleDocumentMouseLeave);
        document.addEventListener('mouseenter', handleDocumentMouseEnter);
        animationFrameId.current = requestAnimationFrame(draw);

        return () => {
            observer.disconnect();
            canvas.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleDocumentMouseLeave);
            document.removeEventListener('mouseenter', handleDocumentMouseEnter);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [config, randomizeWaveParameters, reducedMotion]);

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