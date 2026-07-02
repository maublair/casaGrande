'use client';

import { useEffect } from 'react';

/**
 * Componente sin UI: aplica un efecto de aparición al hacer scroll
 * sobre cada <section> dentro de <main>. Las clases sr-hidden / sr-show
 * se agregan solo vía JS, de modo que sin JavaScript todo sigue visible.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const sections = document.querySelectorAll('main section');
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sr-show');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    sections.forEach(section => {
      section.classList.add('sr-hidden');
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
