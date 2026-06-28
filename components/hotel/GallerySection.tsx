'use client';

import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

const galleryImages = [
  { url: 'https://deykard.com/uploads/imagenes/hotel-casagrande-2.jpg', label: 'Suite Ejecutiva' },
  { url: 'https://deykard.com/uploads/imagenes/hotel-casagrande-7.jpg', label: 'Habitacion Doble' },
  { url: 'https://deykard.com/uploads/imagenes/hotel-casagrande-3.jpg', label: 'Restaurante' },
  { url: 'https://deykard.com/uploads/imagenes/hotel-casagrande-5.jpg', label: 'Jardines' },
  { url: 'https://deykard.com/uploads/imagenes/hotel-casagrande-8.jpg', label: 'Habitacion Simple' },
  { url: 'https://deykard.com/uploads/imagenes/hotel-casagrande-12.jpg', label: 'Sala de Eventos' },
  { url: 'https://deykard.com/uploads/imagenes/hotel-casagrande-4.jpg', label: 'Lobby & Recepcion' },
  { url: 'https://deykard.com/uploads/imagenes/hotel-casagrande-16.jpg', label: 'Bano Privado' },
];

export default function GallerySection() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <section id="galeria" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-olive-DEFAULT text-xs font-medium tracking-[0.4em] uppercase mb-3">Galeria</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-navy-DEFAULT">
            Descubre Nuestra <span className="italic text-gold-DEFAULT">Esencia</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {galleryImages.map((img, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-xl cursor-zoom-in group ${
                i === 0 || i === 6 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
              style={{ height: i === 0 || i === 6 ? '320px' : '152px' }}
              onClick={() => setLightbox(img.url)}
            >
              <img
                src={img.url}
                alt={img.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8" />
              </div>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                {img.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightbox}
            alt="Gallery"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
