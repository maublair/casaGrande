'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    image: 'https://deykard.com/uploads/imagenes/hotel-casagrande-1.jpg',
    title: 'Una Experiencia',
    titleAccent: 'Inolvidable',
    subtitle: 'Hotel Boutique en el corazon de Vallecito, Arequipa',
  },
  {
    image: 'https://deykard.com/uploads/imagenes/hotel-casagrande-2.jpg',
    title: 'Suites de',
    titleAccent: 'Lujo',
    subtitle: 'Disena cada detalle de tu estancia con nosotros',
  },
  {
    image: 'https://deykard.com/uploads/imagenes/hotel-casagrande-3.jpg',
    title: 'Gastronomia',
    titleAccent: 'Arequipena',
    subtitle: 'Sabores autenticos en nuestro restaurante boutique',
  },
  {
    image: 'https://deykard.com/uploads/imagenes/hotel-casagrande-5.jpg',
    title: 'Jardines',
    titleAccent: 'Privados',
    subtitle: 'Un remanso de paz en el barrio de Vallecito',
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => goTo((current + 1) % slides.length), 5500);
    return () => clearInterval(timer);
  }, [current]);

  function goTo(idx: number) {
    if (isTransitioning || idx === current) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(idx);
      setIsTransitioning(false);
    }, 300);
  }

  const slide = slides[current];

  return (
    <div className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Background image */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{ backgroundImage: `url(${slide.image})` }}
      />
      <div className="absolute inset-0 hero-overlay" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 pb-24">
        <div className={`transition-all duration-700 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <p className="text-gold-300 text-sm font-medium tracking-[0.4em] uppercase mb-4">
            Hotel Boutique Casagrande
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl text-white leading-tight mb-4">
            {slide.title} <span className="text-gold-300 italic">{slide.titleAccent}</span>
          </h1>
          <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto font-light mb-10">
            {slide.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#reservar"
              className="inline-flex items-center justify-center gap-2 bg-gold-DEFAULT hover:bg-gold-600 text-white font-semibold px-8 py-4 rounded-lg transition-all shadow-lg hover:shadow-xl text-sm tracking-wide uppercase"
            >
              Reservar Ahora
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

      {/* Arrows */}
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

      {/* Dots */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`transition-all duration-300 rounded-full ${i === current ? 'w-8 h-2 bg-gold-DEFAULT' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
