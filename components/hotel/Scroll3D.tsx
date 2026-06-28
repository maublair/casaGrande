'use client';

import { useEffect, useRef, ReactNode, useState } from 'react';

interface Scroll3DProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  rotateX?: boolean;
  rotateY?: boolean;
  translateZ?: boolean;
  scale?: boolean;
  fade?: boolean;
  blur?: boolean;
}

export default function Scroll3D({
  children,
  className = '',
  intensity = 1,
  rotateX = true,
  rotateY = false,
  translateZ = true,
  scale = true,
  fade = false,
  blur = false,
}: Scroll3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.08, rootMargin: '-40px 0px' }
    );
    observer.observe(el);

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;
      const distance = viewportCenter - elementCenter;
      const maxDistance = windowHeight * 0.6;
      const p = Math.max(-1, Math.min(1, distance / maxDistance));

      let transform = '';
      const absP = Math.abs(p);

      if (rotateX) {
        const rx = p * 12 * intensity;
        transform += ` perspective(1200px) rotateX(${rx}deg)`;
      }
      if (rotateY) {
        const ry = p * 8 * intensity;
        transform += ` rotateY(${ry}deg)`;
      }
      if (translateZ) {
        const tz = -absP * 60 * intensity;
        transform += ` translateZ(${tz}px)`;
      }
      if (scale) {
        const s = 1 - absP * 0.08 * intensity;
        transform += ` scale(${s})`;
      }

      const opacity = fade ? 1 - absP * 0.5 : 1 - absP * 0.15;
      const filterBlur = blur ? absP * 3 : 0;

      setStyle({
        transform,
        opacity: visible ? opacity : 0,
        filter: filterBlur > 0 ? `blur(${filterBlur}px)` : 'none',
        transition: visible ? 'transform 0.1s linear, opacity 0.6s ease, filter 0.1s linear' : 'opacity 0.6s ease',
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [intensity, rotateX, rotateY, translateZ, scale, fade, blur, visible]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
