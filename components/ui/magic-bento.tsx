"use client";

import { gsap } from 'gsap';
import React, { useRef, useEffect, useCallback } from 'react';

// --- Types ---
export interface BentoProps {
  children: React.ReactNode;
  className?: string;
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
  noPadding?: boolean;
}

// --- Constants ---
const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '16, 185, 129'; // Green emerald color

// --- Helpers ---
const createParticleElement = (x: number, y: number, color: string): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
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

const GlobalSpotlight: React.FC<{
  gridRef: React.RefObject<HTMLDivElement | null>;
  enabled?: boolean;
  radius?: number;
  color?: string;
  disableAnimations?: boolean;
}> = ({ gridRef, enabled, radius = DEFAULT_SPOTLIGHT_RADIUS, color = DEFAULT_GLOW_COLOR, disableAnimations = false }) => {
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const isInsideSection = useRef(false);

  useEffect(() => {
    if (!gridRef?.current || !enabled || disableAnimations) return;

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${color}, 0.15) 0%,
        rgba(${color}, 0.08) 15%,
        rgba(${color}, 0.04) 25%,
        rgba(${color}, 0.02) 40%,
        rgba(${color}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current || !gridRef.current) return;

      const section = gridRef.current.closest('.bento-section');
      const rect = section?.getBoundingClientRect();
      const mouseInside = rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      isInsideSection.current = mouseInside || false;
      const cards = gridRef.current.querySelectorAll('.magic-bento-card');

      if (!mouseInside) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
        cards.forEach(card => {
          (card as HTMLElement).style.setProperty('--glow-intensity', '0');
        });
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(radius);
      let minDistance = Infinity;

      cards.forEach(card => {
        const cardElement = card as HTMLElement;
        const cardRect = cardElement.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) -
          Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, radius);
      });

      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
        ease: 'power2.out'
      });

      const targetOpacity = minDistance <= proximity
        ? 0.8
        : minDistance <= fadeDistance
          ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
          : 0;

      gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      isInsideSection.current = false;
      gridRef.current?.querySelectorAll('.magic-bento-card').forEach(card => {
        (card as HTMLElement).style.setProperty('--glow-intensity', '0');
      });
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, enabled, radius, color, disableAnimations]);

  return null;
};

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className,
  title,
  icon,
  config,
  tiltIntensity,
  magnetStrength,
  noPadding = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef<HTMLDivElement[]>([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null);

  const {
    enableTilt = true,
    enableMagnetism = true,
    enableStars = true,
    clickEffect = true,
    disableAnimations = false,
    particleCount = DEFAULT_PARTICLE_COUNT,
    glowColor = DEFAULT_GLOW_COLOR,
    tiltIntensity: globalTilt = 4,
    magnetStrength: globalMagnet = 0.02
  } = config || {};

  const activeTilt = Number(tiltIntensity ?? globalTilt ?? 4);
  const activeMagnet = Number(magnetStrength ?? globalMagnet ?? 0.02);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current || disableAnimations || !enableStars) return;

    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor, disableAnimations, enableStars]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();

    particlesRef.current.forEach(particle => {
      gsap.killTweensOf(particle);
      particle.parentNode?.removeChild(particle);
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current || disableAnimations || !enableStars) return;

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        // Cap active particles to prevent unbounded accumulation
        if (particlesRef.current.length >= particleCount * 2) return;

        const clone = particle.cloneNode(true) as HTMLDivElement;
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(clone,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
        );

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true,
          overwrite: true
        });

        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true,
          overwrite: 'auto'
        });
      }, index * 100);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles, disableAnimations, enableStars]);

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
        gsap.to(el, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: 'power2.out',
          transformPerspective: 1000
        });
      }

      if (enableMagnetism) {
        const magnetX = (x - cx) * activeMagnet;
        const magnetY = (y - cy) * activeMagnet;
        magnetismAnimationRef.current = gsap.to(el, {
          x: magnetX,
          y: magnetY,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      if (enableStars) animateParticles();
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();

      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'power3.out'
      });
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `;
      el.appendChild(ripple);

      gsap.fromTo(ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        }
      );
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('click', handleClick);

    return () => {
      isHoveredRef.current = false;
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('click', handleClick);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism, enableStars, clickEffect, glowColor, activeTilt, activeMagnet]);

  const contentClass = noPadding
    ? "magic-bento-card__content magic-bento-card__content--no-padding flex flex-col h-full relative z-10"
    : "magic-bento-card__content flex flex-col h-full relative z-10";

  return (
    <div
      ref={cardRef}
      className={`magic-bento-card magic-bento-card--border-glow particle-container ${className || ''}`}
      style={{ '--glow-color': glowColor, position: 'relative', overflow: 'hidden' } as any}
    >
      <div className={contentClass}>
        {(title || icon) && !noPadding && (
          <div className="flex items-center gap-2 mb-4 text-muted-foreground select-none pointer-events-none">
            {icon}
            {title && <span className="text-xs font-bold uppercase tracking-wider">{title}</span>}
          </div>
        )}
        <div className={noPadding ? "h-full" : "flex-1"}>{children}</div>
      </div>
    </div>
  );
};

const MagicBento: React.FC<BentoProps> = (props) => {
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bento-section">
      <GlobalSpotlight
        gridRef={gridRef}
        enabled={props.enableSpotlight}
        radius={props.spotlightRadius}
        color={props.glowColor}
        disableAnimations={props.disableAnimations}
      />
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