'use client';

import React, { useRef, useLayoutEffect, useCallback } from 'react';

type WaveSource = {
    id: number;
    x: number;
    y: number;
    strength: number;
    creationTime: number;
};

const InteractiveWaveBackground = ({ children }: { children: React.ReactNode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const waveSources = useRef<WaveSource[]>([]);
    const nextSourceId = useRef(0);
    const isMouseOver = useRef(false);

    // --- NEW: Refs for Velocity Calculation ---
    const lastMousePosition = useRef<{ x: number; y: number; timestamp: number }>({ x: 0, y: 0, timestamp: 0 });
    const mouseVelocity = useRef(0); // This will hold our smoothed velocity

    const phase = useRef(0);
    const mouseWaveFrequency = useRef(0.04);
    const mouseWaveSpeed = useRef(1.69);
    const mouseWaveAmplitude = useRef(1.0);
    const amplitudeNodes = useRef(new Map());

    const randomizeWaveParameters = useCallback(() => {
        mouseWaveFrequency.current = 0.02 + Math.random() * 0.05;
        mouseWaveSpeed.current = 0.5 + Math.random() * 0.4;
        mouseWaveAmplitude.current = 0.1 + Math.random() * 0.2;
    }, []);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const nodeSpacing = Math.PI;

        const getAmplitudeNode = (nodeIndex: number) => {
            if (!amplitudeNodes.current.has(nodeIndex)) {
                amplitudeNodes.current.set(nodeIndex, 0.4 + Math.random() * 0.6);
            }
            return amplitudeNodes.current.get(nodeIndex);
        };

        const resizeCanvas = (width: number, height: number) => {
            canvas.width = width;
            canvas.height = height;
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isMouseOver.current) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const now = performance.now();

            // --- VELOCITY CALCULATION & SMOOTHING ---
            const deltaTime = now - lastMousePosition.current.timestamp;
            if (deltaTime > 0) {
                const deltaX = x - lastMousePosition.current.x;
                const deltaY = y - lastMousePosition.current.y;
                const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
                const instantaneousVelocity = distance / deltaTime;

                // Smooth the velocity using an Exponential Moving Average
                const VELOCITY_SMOOTHING_FACTOR = 0.2;
                mouseVelocity.current = (instantaneousVelocity * VELOCITY_SMOOTHING_FACTOR) + (mouseVelocity.current * (1 - VELOCITY_SMOOTHING_FACTOR));
            }
            lastMousePosition.current = { x, y, timestamp: now };

            waveSources.current.push({
                id: nextSourceId.current++,
                x,
                y,
                strength: 1.0,
                creationTime: now,
            });
        };

        const handleMouseLeave = () => {
            isMouseOver.current = false;
        };

        const handleMouseEnter = (e: MouseEvent) => {
            isMouseOver.current = true;
             // Reset last mouse position on enter to prevent a huge velocity spike
            const rect = canvas.getBoundingClientRect();
            lastMousePosition.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                timestamp: performance.now()
            };
            randomizeWaveParameters();
        };

        const draw = () => {
            const now = performance.now();
            
            const MIN_LINGER_DURATION = 400;
            const MAX_LINGER_DURATION = 1800;
            const WAVE_COUNT_THRESHOLD = 100;
            const lingerInterpolation = Math.min(waveSources.current.length / WAVE_COUNT_THRESHOLD, 1.0);
            const dynamicLingerDuration = MIN_LINGER_DURATION + (MAX_LINGER_DURATION - MIN_LINGER_DURATION) * lingerInterpolation;

            waveSources.current = waveSources.current.map(source => {
                const age = now - source.creationTime;
                const decayFactor = 1.0 - Math.min(age / dynamicLingerDuration, 1.0);
                return { ...source, strength: decayFactor * decayFactor };
            }).filter(source => source.strength > 0.01);
            
            // --- DYNAMIC SPEED FROM VELOCITY ---
            const BASE_PHASE_INCREMENT = 0.069;
            const MAX_PHASE_INCREMENT = 0.369;
            const VELOCITY_THRESHOLD = 1.5; // pixels/ms to reach max speed. Adjust for sensitivity.

            // 1. Decay the velocity over time so it slows down when the mouse stops
            const VELOCITY_DECAY_FACTOR = 0.97;
            mouseVelocity.current *= VELOCITY_DECAY_FACTOR;

            // 2. Map the current velocity to the phase increment range
            const speedInterpolation = Math.min(mouseVelocity.current / VELOCITY_THRESHOLD, 1.0);
            const dynamicPhaseIncrement = BASE_PHASE_INCREMENT + (MAX_PHASE_INCREMENT - BASE_PHASE_INCREMENT) * speedInterpolation;


            if (canvas.width <= 0 || canvas.height <= 0) {
                animationFrameId.current = requestAnimationFrame(draw);
                return;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.moveTo(0, canvas.height / 2);

            const horizontalInfluenceRadius = 420.69;
            const globalWaveAmplitude = 5;
            const globalWaveFrequency = 0.02;

            for (let i = 0; i < canvas.width; i++) {
                const globalWave = Math.sin((i * globalWaveFrequency) + phase.current) * globalWaveAmplitude;
                let totalMouseDisplacement = 0;
                let totalFalloff = 0;

                for (const source of waveSources.current) {
                    const distanceToSourceX = Math.abs(i - source.x);

                    if (distanceToSourceX < horizontalInfluenceRadius) {
                        const normalizedDistance = distanceToSourceX / horizontalInfluenceRadius;
                        const t = 1.0 - normalizedDistance;
                        const horizontalFalloff = t * t * (3.0 - 2.0 * t);

                        const maxDistance = canvas.height / 2;
                        const currentDistance = Math.abs(source.y - maxDistance);
                        
                        const AMPLITUDE_DAMPENING_FACTOR = 0.3;
                        const adverseAmplitude = (1 - (currentDistance / maxDistance)) * maxDistance * AMPLITUDE_DAMPENING_FACTOR;

                        const wavePhase = (i * mouseWaveFrequency.current) + (phase.current * mouseWaveSpeed.current);
                        const sineWave = Math.sin(wavePhase);

                        const nodeIndex1 = Math.floor(wavePhase / nodeSpacing);
                        const nodeIndex2 = nodeIndex1 + 1;

                        const amp1 = getAmplitudeNode(nodeIndex1);
                        const amp2 = getAmplitudeNode(nodeIndex2);

                        const fractionalPos = (wavePhase % nodeSpacing) / nodeSpacing;
                        const smoothFractionalPos = (1 - Math.cos(fractionalPos * Math.PI)) / 2;
                        const interpolatedAmplitude = amp1 * (1 - smoothFractionalPos) + amp2 * smoothFractionalPos;
                        
                        const displacement = sineWave * adverseAmplitude * horizontalFalloff * mouseWaveAmplitude.current * interpolatedAmplitude * source.strength;
                        
                        totalMouseDisplacement += displacement;
                        totalFalloff = Math.max(totalFalloff, horizontalFalloff * source.strength);
                    }
                }
                
                const finalY = canvas.height / 2 + (globalWave * (1 - totalFalloff)) + totalMouseDisplacement;
                ctx.lineTo(i, finalY);
            }

            const style = getComputedStyle(canvas);
            const foregroundColorValue = style.getPropertyValue('--foreground');
            ctx.strokeStyle = `hsl(${foregroundColorValue})`;
            ctx.lineWidth = 3;
            ctx.stroke();
            
            phase.current += dynamicPhaseIncrement;

            const phaseAtLeftEdge = phase.current * mouseWaveSpeed.current;
            const firstVisibleNodeIndex = Math.floor(phaseAtLeftEdge / nodeSpacing);
            for (const key of amplitudeNodes.current.keys()) {
                if (key < firstVisibleNodeIndex - 20) {
                    amplitudeNodes.current.delete(key);
                }
            }

            animationFrameId.current = requestAnimationFrame(draw);
        };

        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                resizeCanvas(width, height);
            }
        });

        observer.observe(container);
        randomizeWaveParameters();
        
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('mouseenter', handleMouseEnter);

        animationFrameId.current = requestAnimationFrame(draw);

        return () => {
            observer.disconnect();
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.addEventListener('mouseenter', handleMouseEnter);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [randomizeWaveParameters]);

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