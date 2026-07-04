'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getSlides } from '@/lib/wp';

interface Slide {
  image: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  ctaLabel?: string;
  ctaLink?: string;
}

// Fallback: si WordPress no devuelve slides, se usan estos (mismas fotos del front).
const fallbackSlides: Slide[] = [
  { image: '/hotel/real-63.webp', eyebrow: 'Hotel Boutique Casagrande', title: 'Una Experiencia', titleAccent: 'Inolvidable', subtitle: 'Hotel Boutique en el corazon de Vallecito, Arequipa' },
  { image: '/hotel/real-10.webp', eyebrow: 'Hotel Boutique Casagrande', title: 'Suites de', titleAccent: 'Lujo', subtitle: 'Disena cada detalle de tu estancia con nosotros' },
  { image: '/hotel/real-54.webp', eyebrow: 'Hotel Boutique Casagrande', title: 'Gastronomia', titleAccent: 'Arequipena', subtitle: 'Sabores autenticos en nuestro restaurante boutique' },
  { image: '/hotel/real-40.webp', eyebrow: 'Hotel Boutique Casagrande', title: 'Jardines', titleAccent: 'Privados', subtitle: 'Un remanso de paz en el barrio de Vallecito' },
];

export default function HeroSlider() {
  const [slides, setSlides] = useState<Slide[]>(fallbackSlides);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Cargar slides administrados desde WordPress (hero editable / promociones).
  useEffect(() => {
    let alive = true;
    getSlides()
      .then(rows => {
        if (!alive || !rows || rows.length === 0) return;
        const mapped: Slide[] = rows.map(r => ({
          image: r.image,
          eyebrow: r.eyebrow || 'Hotel Boutique Casagrande',
          title: r.title,
          titleAccent: r.accent || '',
          subtitle: r.subtitle,
          ctaLabel: r.cta_label || undefined,
          ctaLink: r.cta_link || undefined,
        }));
        setSlides(mapped);
        setCurrent(0);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Precargar imagenes para evitar parpadeo al cambiar.
  useEffect(() => {
    slides.forEach(s => { const img = new window.Image(); img.src = s.image; });
  }, [slides]);

  useEffect(() => {
    const timer = setInterval(() => goTo((current + 1) % slides.length), 5500);
    return () => clearInterval(timer);
  }, [current, slides.length]);

  function goTo(idx: number) {
    if (isTransitioning || idx === current) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(idx);
      setIsTransitioning(false);
    }, 300);
  }

  const slide = slides[current] || fallbackSlides[0];

  return (
    <div className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
      <div
        key={current}
        className={`absolute inset-0 bg-cover bg-center kenburns transition-opacity duration-700 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{ backgroundImage: `url(${slide.image})` }}
      />
      <div className="absolute inset-0 hero-overlay" />

      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 pb-24">
        <div className={`transition-all duration-700 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <p className="text-gold-300 text-sm font-medium tracking-[0.4em] uppercase mb-4">
            {slide.eyebrow}
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl text-white leading-tight mb-4">
            {slide.title} {slide.titleAccent && <span className="text-gold-300 italic">{slide.titleAccent}</span>}
          </h1>
          <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto font-light mb-10">
            {slide.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={slide.ctaLink || '#reservar'}
              className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-600 text-navy-900 font-semibold px-8 py-4 rounded-lg transition-all shadow-lg hover:shadow-xl text-sm tracking-wide uppercase"
            >
              {slide.ctaLabel || 'Reservar Ahora'}
            </a>
            <a
              href="/tour-virtual"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-lg transition-all text-sm tracking-wide uppercase backdrop-blur-sm"
            >
              Tour Virtual 360°
            </a>
          </div>
        </div>
      </div>

      <button
        onClick={() => goTo((current - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full border border-white/20 backdrop-blur-sm transition-all hover:scale-110"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => goTo((current + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full border border-white/20 backdrop-blur-sm transition-all hover:scale-110"
        aria-label="Siguiente"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`transition-all duration-300 rounded-full ${i === current ? 'w-8 h-2 bg-gold' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
