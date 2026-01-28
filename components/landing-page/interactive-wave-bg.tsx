import React, { useEffect, useRef } from 'react';
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  PlaneGeometry,
  Mesh,
  ShaderMaterial,
  Vector3,
  Vector2,
  Clock,
  AdditiveBlending,
  NormalBlending,
  Color
} from 'three';

const vertexShader = `
precision highp float;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision mediump float;

uniform float iTime;
uniform vec3 iResolution;
uniform vec2 uMouse;
uniform float uHover;
uniform vec3 uColorHero;
uniform vec3 uColorBg;
uniform float uQuality; // New: quality multiplier for performance

mat2 rotate2d(float angle){
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

// Function returns vec4: RGB + Alpha
vec4 renderRibbon(
    vec2 uv,             
    vec2 center,         
    float angle,         
    float scale,         
    vec3 colorStart,     
    vec3 colorEnd,
    float timeOffset,    
    float phaseSpeed,    
    vec2 mousePos,
    float glowIntensity 
) {
    vec2 localUv = (uv - center) * rotate2d(angle) * scale;
    vec2 localMouse = (mousePos - center) * rotate2d(angle) * scale;
    
    vec3 accumulatedColor = vec3(0.0);
    float accumulatedAlpha = 0.0;
    
    float t = iTime * phaseSpeed + timeOffset;
    
    float gradientPos = smoothstep(-1.5, 1.5, localUv.x); 
    vec3 ribbonBaseColor = mix(colorStart, colorEnd, gradientPos);
    
    float blurLevel = smoothstep(1.0, 2.5, scale);
    
    // Adaptive loop count based on quality
    int maxIterations = int(15.0 * uQuality);
    
    for (int i = 0; i < 35; i++) {
        if (i >= maxIterations) break;
        
        float fi = float(i);
        float progress = fi / float(maxIterations); 
        
        float spineY = sin(localUv.x * 1.0 + t) * 0.3; 
        float twist = sin(localUv.x * 1.5 + t * 1.2) * 0.5 + 0.5; 
        float bundleOffset = (progress - 0.5) * 0.45 * (0.5 + twist);
        
        float mouseDistX = abs(localUv.x - localMouse.x);
        float mouseDistY = abs((spineY + bundleOffset) - localMouse.y);
        
        float influence = exp(-mouseDistX * 7.0) * exp(-mouseDistY * 5.0) * uHover;
        float vibration = sin(localUv.x * 40.0 - iTime * 20.0 + fi * 2.0) * 0.08 * influence;
        
        float lineY = spineY + bundleOffset + vibration;
        float dist = abs(localUv.y - lineY);
        
        float depthFade = 1.0 / (scale * 0.8);
        float edgeFade = smoothstep(2.5, 0.5, abs(localUv.x));
        
        float baseThickness = 0.003; 
        float blurThickness = 0.01; 
        float currentThickness = mix(baseThickness, blurThickness, blurLevel);
        
        float intensity = glowIntensity / (dist + currentThickness);
        float combinedFade = depthFade * edgeFade;
        
        accumulatedColor += ribbonBaseColor * intensity * combinedFade;
        accumulatedAlpha += intensity * combinedFade;
    }
    
    return vec4(accumulatedColor, accumulatedAlpha);
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
  
  vec3 finalColor = vec3(0.0);
  float finalAlpha = 0.0;
  
  vec4 ribbon;
  
  // 1. HERO
  ribbon = renderRibbon(
      uv, vec2(0.0, 0.0), 0.0, 1.0,                  
      uColorHero, uColorHero,  
      0.0, 0.5, uMouse,
      0.00069 
  );
  finalColor += ribbon.rgb;
  finalAlpha += ribbon.a;

  // 2. TOP LEFT
  ribbon = renderRibbon(
      uv, vec2(-0.96, 0.6), -0.8, 1.5,                  
      uColorBg, uColorBg, 
      2.0, 0.3, uMouse,
      0.0010 
  );
  finalColor += ribbon.rgb;
  finalAlpha += ribbon.a;

  // 3. BOTTOM RIGHT
  ribbon = renderRibbon(
      uv, vec2(0.96, -0.19), 1.6, 1.5,                  
      uColorBg, uColorBg, 
      4.0, 0.4, uMouse,
      0.0010 
  );

  finalColor += ribbon.rgb;
  finalAlpha += ribbon.a;
  
  gl_FragColor = vec4(finalColor, min(finalAlpha, 1.0));
}
`;

interface HelixCanvasProps {
  heroColor?: string;
  backgroundColor?: string;
  speed?: number;
  mouseDamping?: number;
  mixBlendMode?: React.CSSProperties['mixBlendMode'];
  opacity?: number;
  darkMode?: boolean;
}

function colorToVec3(colorString: string): Vector3 {
  const c = new Color(colorString);
  return new Vector3(c.r, c.g, c.b);
}

export default function HelixCanvas({
  heroColor = '#ffffff',
  backgroundColor = '#cccccc',
  speed = 1.0,
  mouseDamping = 0.1,
  mixBlendMode,
  opacity = 1,
  darkMode = true 
}: HelixCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<Vector2>(new Vector2(0, 0));
  const targetMouseRef = useRef<Vector2>(new Vector2(0, 0));
  const isHoveringRef = useRef<number>(0);
  
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const renderer = new WebGLRenderer({ 
      antialias: false, // Disable antialiasing for better performance
      alpha: true,
      powerPreference: 'high-performance' // Prefer performance over quality
    });
    
    // Detect device capabilities
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = isMobile || navigator.hardwareConcurrency <= 4;
    
    // Adaptive pixel ratio based on device
    const dpr = isLowEnd ? 1 : Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(dpr);
    
    const el = containerRef.current;
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    // Adaptive quality based on device
    const quality = isLowEnd ? 0.7 : 1.5; // Mobile: 10-11 iterations, Desktop: 22-23 iterations

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new Vector3(el.clientWidth * dpr, el.clientHeight * dpr, 1) },
      uMouse: { value: new Vector2(0, 0) },
      uHover: { value: 0 },
      uColorHero: { value: colorToVec3(heroColor) },
      uColorBg: { value: colorToVec3(backgroundColor) },
      uQuality: { value: quality }
    };

    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      blending: darkMode ? AdditiveBlending : NormalBlending,
      depthTest: false,
      transparent: true
    });

    const geometry = new PlaneGeometry(2, 2);
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    const clock = new Clock();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      renderer.setSize(w, h);
      uniforms.iResolution.value.set(w * dpr, h * dpr, 1);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(el);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const resX = uniforms.iResolution.value.x;
      const resY = uniforms.iResolution.value.y;
      
      const nx = (2.0 * x * dpr - resX) / resY;
      const ny = -((2.0 * y * dpr - resY) / resY);
      
      targetMouseRef.current.set(nx, ny);
      isHoveringRef.current = 1;
    };

    const handlePointerLeave = () => {
      isHoveringRef.current = 0;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling while touching the canvas
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = el.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const resX = uniforms.iResolution.value.x;
        const resY = uniforms.iResolution.value.y;
        
        const nx = (2.0 * x * dpr - resX) / resY;
        const ny = -((2.0 * y * dpr - resY) / resY);
        
        targetMouseRef.current.set(nx, ny);
        isHoveringRef.current = 1;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = el.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const resX = uniforms.iResolution.value.x;
        const resY = uniforms.iResolution.value.y;
        
        const nx = (2.0 * x * dpr - resX) / resY;
        const ny = -((2.0 * y * dpr - resY) / resY);
        
        targetMouseRef.current.set(nx, ny);
        isHoveringRef.current = 1;
      }
    };

    const handleTouchEnd = () => {
      isHoveringRef.current = 0;
    };

    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerleave', handlePointerLeave);
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    let raf = 0;
    let lastFrameTime = 0;
    const targetFPS = isLowEnd ? 30 : 60; // 30fps on mobile, 60fps on desktop
    const frameInterval = 1000 / targetFPS;
    
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTime;
      
      // Skip frame if not enough time has passed
      if (deltaTime < frameInterval) {
        raf = requestAnimationFrame(animate);
        return;
      }
      
      lastFrameTime = currentTime - (deltaTime % frameInterval);
      
      uniforms.iTime.value = clock.getElapsedTime() * speed;
      mouseRef.current.lerp(targetMouseRef.current, mouseDamping);
      uniforms.uMouse.value.copy(mouseRef.current);
      uniforms.uHover.value += (isHoveringRef.current - uniforms.uHover.value) * mouseDamping;
      
      // Only update colors if they've changed (avoid unnecessary CPU work)
      const newHeroColor = colorToVec3(heroColor);
      const newBgColor = colorToVec3(backgroundColor);
      if (!uniforms.uColorHero.value.equals(newHeroColor)) {
        uniforms.uColorHero.value.copy(newHeroColor);
      }
      if (!uniforms.uColorBg.value.equals(newBgColor)) {
        uniforms.uColorBg.value.copy(newBgColor);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate(0);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerleave', handlePointerLeave);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
      
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [heroColor, backgroundColor, speed, mouseDamping, darkMode]); 

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        opacity: opacity,
        mixBlendMode: mixBlendMode,
        pointerEvents: 'auto',
        touchAction: 'none' // Prevent default touch behaviors
      }}
    />
  );
}