'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface ParchmentScrollProps {
  children: ReactNode;
  className?: string;
}

export default function ParchmentScroll({ children, className = '' }: ParchmentScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05, rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(el);

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elTop = rect.top;
      const elHeight = rect.height;
      const elBottom = rect.bottom;

      if (elBottom < 0 || elTop > windowHeight) return;

      const visibleStart = Math.max(0, -elTop);
      const totalScrollable = Math.max(1, elHeight - windowHeight);
      const progress = Math.max(0, Math.min(1, visibleStart / totalScrollable));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const topRollRotation = scrollProgress * 720;
  const bottomRollRotation = (1 - scrollProgress) * -720;

  return (
    <div ref={containerRef} className={`parchment-section ${className}`}>
      {/* Top roller */}
      <div className="parchment-roller parchment-roller-top" aria-hidden="true">
        <div
          className="parchment-roller-inner"
          style={{ transform: `rotate(${topRollRotation}deg)` }}
        >
          <div className="parchment-roller-cap left" />
          <div className="parchment-roller-cap right" />
          <div className="parchment-roller-texture" />
        </div>
        <div className="parchment-roller-shadow-top" />
      </div>

      {/* Parchment body */}
      <div className={`parchment-body ${inView ? 'parchment-body--visible' : ''}`}>
        <div className="parchment-edge-top" />
        <div className="parchment-content">
          {children}
        </div>
        <div className="parchment-edge-bottom" />
      </div>

      {/* Bottom roller */}
      <div className="parchment-roller parchment-roller-bottom" aria-hidden="true">
        <div className="parchment-roller-shadow-bottom" />
        <div
          className="parchment-roller-inner"
          style={{ transform: `rotate(${bottomRollRotation}deg)` }}
        >
          <div className="parchment-roller-cap left" />
          <div className="parchment-roller-cap right" />
          <div className="parchment-roller-texture" />
        </div>
      </div>
    </div>
  );
}
