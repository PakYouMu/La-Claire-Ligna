"use client";

import { gsap } from 'gsap';
import React, { useRef, useEffect, useCallback } from 'react';

// --- Types ---
export interface BentoProps {
  children: React.ReactNode;
  className?: string; // <--- ADDED THIS
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  glowColor?: string;
  disableAnimations?: boolean;
  tiltIntensity?: number;
  magnetStrength?: number;
}

export interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  config?: Partial<BentoProps>;
  tiltIntensity?: number;
  magnetStrength?: number;
}

// --- Constants ---
const DEFAULT_PARTICLE_COUNT = 8;
const DEFAULT_SPOTLIGHT_RADIUS = 400;
const DEFAULT_GLOW_COLOR = '16, 185, 129';

// --- Helpers ---
const createParticleElement = (x: number, y: number, color: string): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute; width: 3px; height: 3px; border-radius: 50%;
    background: rgba(${color}, 1); box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none; z-index: 1; left: ${x}px; top: ${y}px; opacity: 0.6;
  `;
  return el;
};

const calculateSpotlightValues = (radius: number) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

const updateCardGlowProperties = (card: HTMLElement, mouseX: number, mouseY: number, glow: number, radius: number) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;
  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

// --- Components ---

const GlobalSpotlight: React.FC<{ gridRef: React.RefObject<HTMLDivElement | null>; enabled?: boolean; radius?: number; color?: string }> = ({ gridRef, enabled, radius = DEFAULT_SPOTLIGHT_RADIUS, color = DEFAULT_GLOW_COLOR }) => {
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!gridRef?.current || !enabled) return;

    const spotlight = document.createElement('div');
    spotlight.style.cssText = `
      position: fixed; width: ${radius * 2}px; height: ${radius * 2}px; border-radius: 50%;
      pointer-events: none; background: radial-gradient(circle, rgba(${color}, 0.1) 0%, transparent 70%);
      z-index: 9999; opacity: 0; transform: translate(-50%, -50%); mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current || !gridRef.current) return;

      gsap.to(spotlightRef.current, {
        left: e.clientX, top: e.clientY, opacity: 1, duration: 0.2, ease: 'power2.out'
      });

      const cards = gridRef.current.querySelectorAll('.magic-bento-card');
      const { proximity, fadeDistance } = calculateSpotlightValues(radius);

      cards.forEach(card => {
        const cardElement = card as HTMLElement;
        const rect = cardElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(rect.width, rect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) glowIntensity = 1;
        else if (effectiveDistance <= fadeDistance) glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);

        updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, radius);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      spotlightRef.current?.remove();
    };
  }, [gridRef, enabled, radius, color]);

  return null;
};

export const BentoCard: React.FC<BentoCardProps> = ({ children, className, title, icon, config, tiltIntensity, magnetStrength }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isHoveredRef = useRef(false);

  const { 
    enableTilt = true, enableMagnetism = true, enableStars = true, clickEffect = true, disableAnimations = false, 
    particleCount = DEFAULT_PARTICLE_COUNT, glowColor = DEFAULT_GLOW_COLOR,
    tiltIntensity: globalTilt = 4,
    magnetStrength: globalMagnet = 0.02
  } = config || {};

  const activeTilt = Number(tiltIntensity ?? globalTilt ?? 4);
  const activeMagnet = Number(magnetStrength ?? globalMagnet ?? 0.02);

  useEffect(() => {
    if (disableAnimations || !enableStars || !cardRef.current) {
      particlesRef.current.forEach(p => p.remove());
      particlesRef.current = [];
      return;
    }
    const { width, height } = cardRef.current.getBoundingClientRect();
    particlesRef.current.forEach(p => p.remove());
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      const p = createParticleElement(Math.random() * width, Math.random() * height, glowColor);
      cardRef.current.appendChild(p);
      particlesRef.current.push(p);
    }
  }, [disableAnimations, enableStars, particleCount, glowColor]);

  const animateParticles = useCallback(() => {
    if (disableAnimations || !isHoveredRef.current || !cardRef.current) return;
    particlesRef.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;
        const clone = particle.cloneNode(true) as HTMLDivElement;
        cardRef.current.appendChild(clone);
        gsap.fromTo(clone, 
          { scale: 1, opacity: 0.6 }, 
          { scale: 0, opacity: 0, duration: 1, ease: 'power2.out', onComplete: () => clone.remove() }
        );
        gsap.to(particle, {
            x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20,
            duration: 1, ease: 'power1.inOut', yoyo: true, repeat: 1
        });
      }, index * 50);
      timeoutsRef.current.push(timeoutId);
    });
  }, [disableAnimations]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    if (disableAnimations) {
      const onEnter = () => gsap.to(el, { y: -4, scale: 1.005, duration: 0.4, ease: 'power3.out' });
      const onLeave = () => gsap.to(el, { y: 0, scale: 1, duration: 0.4, ease: 'power3.out' });
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
      return () => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      };
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - cy) / cy) * -activeTilt;
        const rotateY = ((x - cx) / cx) * activeTilt;
        gsap.to(el, { rotateX, rotateY, duration: 0.4, ease: 'power3.out', transformPerspective: 1000 });
      }

      if (enableMagnetism) {
        gsap.to(el, { x: (x - cx) * activeMagnet, y: (y - cy) * activeMagnet, duration: 0.4, ease: 'power3.out' });
      }
    };

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      if (enableStars) animateParticles();
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      gsap.to(el, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.6, ease: 'power3.out' });
      timeoutsRef.current.forEach(clearTimeout);
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute; width: ${size}px; height: ${size}px; border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.3) 0%, transparent 70%);
        left: ${x - size/2}px; top: ${y - size/2}px; pointer-events: none; z-index: 10;
      `;
      el.appendChild(ripple);
      gsap.fromTo(ripple, 
        { scale: 0, opacity: 1 }, 
        { scale: 1, opacity: 0, duration: 0.6, ease: 'power2.out', onComplete: () => ripple.remove() }
      );
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('click', handleClick);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('click', handleClick);
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [disableAnimations, enableTilt, enableMagnetism, enableStars, clickEffect, animateParticles, glowColor, activeTilt, activeMagnet]);

  return (
    <div ref={cardRef} className={`magic-bento-card magic-bento-card--border-glow ${className || ''}`} style={{ '--glow-color': glowColor } as any}>
      <div className="magic-bento-card__content flex flex-col h-full relative z-10">
        {(title || icon) && (
          <div className="flex items-center gap-2 mb-4 text-muted-foreground select-none pointer-events-none">
            {icon}
            {title && <span className="text-xs font-bold uppercase tracking-wider">{title}</span>}
          </div>
        )}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

const MagicBento: React.FC<BentoProps> = (props) => {
  const gridRef = useRef<HTMLDivElement>(null);
  return (
    <div className="bento-section">
      <GlobalSpotlight gridRef={gridRef} enabled={props.enableSpotlight} radius={props.spotlightRadius} color={props.glowColor} />
      {/* ADDED: props.className here so you can pass "gap-4" etc. */}
      <div className={`card-grid ${props.className || ''}`} ref={gridRef}>
        {React.Children.map(props.children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as any, { config: props });
          }
          return child;
        })}
      </div>
    </div>
  );
};

export default MagicBento;