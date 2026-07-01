'use client';

import { useState } from 'react';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImage {
  id: number;
  src: string;
  thumb: string;
  title: string;
  category: string;
}

const images: GalleryImage[] = [
  { id: 1, category: 'Habitaciones', title: 'Suite con sala', src: '/hotel/real-10.webp', thumb: '/hotel/real-10.webp' },
  { id: 2, category: 'Habitaciones', title: 'Suite Ejecutiva', src: '/hotel/real-37.webp', thumb: '/hotel/real-37.webp' },
  { id: 3, category: 'Habitaciones', title: 'Suite', src: '/hotel/real-36.webp', thumb: '/hotel/real-36.webp' },
  { id: 4, category: 'Habitaciones', title: 'Habitación Matrimonial', src: '/hotel/real-04.webp', thumb: '/hotel/real-04.webp' },
  { id: 5, category: 'Habitaciones', title: 'Habitación Matrimonial', src: '/hotel/real-16.webp', thumb: '/hotel/real-16.webp' },
  { id: 6, category: 'Habitaciones', title: 'Habitación Matrimonial', src: '/hotel/real-64.webp', thumb: '/hotel/real-64.webp' },
  { id: 7, category: 'Habitaciones', title: 'Habitación', src: '/hotel/real-57.webp', thumb: '/hotel/real-57.webp' },
  { id: 8, category: 'Habitaciones', title: 'Habitación Doble', src: '/hotel/real-07.webp', thumb: '/hotel/real-07.webp' },
  { id: 9, category: 'Habitaciones', title: 'Habitación Doble', src: '/hotel/real-08.webp', thumb: '/hotel/real-08.webp' },
  { id: 10, category: 'Habitaciones', title: 'Habitación Doble', src: '/hotel/real-22.webp', thumb: '/hotel/real-22.webp' },
  { id: 11, category: 'Habitaciones', title: 'Habitación Simple', src: '/hotel/real-26.webp', thumb: '/hotel/real-26.webp' },
  { id: 12, category: 'Habitaciones', title: 'Habitación con balcón', src: '/hotel/real-45.webp', thumb: '/hotel/real-45.webp' },
  { id: 13, category: 'Restaurante', title: 'Restaurante', src: '/hotel/real-54.webp', thumb: '/hotel/real-54.webp' },
  { id: 14, category: 'Restaurante', title: 'Salón de eventos', src: '/hotel/real-17.webp', thumb: '/hotel/real-17.webp' },
  { id: 15, category: 'Restaurante', title: 'Desayuno', src: '/hotel/real-18.webp', thumb: '/hotel/real-18.webp' },
  { id: 16, category: 'Restaurante', title: 'Desayuno buffet', src: '/hotel/real-52.webp', thumb: '/hotel/real-52.webp' },
  { id: 17, category: 'Restaurante', title: 'Buffet', src: '/hotel/real-50.webp', thumb: '/hotel/real-50.webp' },
  { id: 18, category: 'Restaurante', title: 'Estación de buffet', src: '/hotel/real-20.webp', thumb: '/hotel/real-20.webp' },
  { id: 19, category: 'Restaurante', title: 'Bar & comedor', src: '/hotel/real-71.webp', thumb: '/hotel/real-71.webp' },
  { id: 20, category: 'Restaurante', title: 'Gastronomía', src: '/hotel/real-67.webp', thumb: '/hotel/real-67.webp' },
  { id: 21, category: 'Exteriores', title: 'Fachada de noche', src: '/hotel/real-46.webp', thumb: '/hotel/real-46.webp' },
  { id: 22, category: 'Exteriores', title: 'Edificio y jardines', src: '/hotel/real-63.webp', thumb: '/hotel/real-63.webp' },
  { id: 23, category: 'Exteriores', title: 'Fachada del hotel', src: '/hotel/real-30.webp', thumb: '/hotel/real-30.webp' },
  { id: 24, category: 'Exteriores', title: 'Jardines', src: '/hotel/real-34.webp', thumb: '/hotel/real-34.webp' },
  { id: 25, category: 'Exteriores', title: 'Jardín y terraza', src: '/hotel/real-40.webp', thumb: '/hotel/real-40.webp' },
  { id: 26, category: 'Exteriores', title: 'Áreas verdes', src: '/hotel/real-29.webp', thumb: '/hotel/real-29.webp' },
  { id: 27, category: 'Exteriores', title: 'Jardín principal', src: '/hotel/real-01.webp', thumb: '/hotel/real-01.webp' },
  { id: 28, category: 'Exteriores', title: 'Jardín interior', src: '/hotel/real-60.webp', thumb: '/hotel/real-60.webp' },
  { id: 29, category: 'Exteriores', title: 'Ingreso', src: '/hotel/real-65.webp', thumb: '/hotel/real-65.webp' },
  { id: 30, category: 'Exteriores', title: 'Fachada — Av. Luna Pizarro 202', src: '/hotel/real-74.webp', thumb: '/hotel/real-74.webp' },
  { id: 31, category: 'Exteriores', title: 'Vista del entorno', src: '/hotel/real-13.webp', thumb: '/hotel/real-13.webp' },
  { id: 32, category: 'Servicios', title: 'Recepción', src: '/hotel/real-42.webp', thumb: '/hotel/real-42.webp' },
  { id: 33, category: 'Servicios', title: 'Recepción', src: '/hotel/real-44.webp', thumb: '/hotel/real-44.webp' },
  { id: 34, category: 'Servicios', title: 'Lobby', src: '/hotel/real-75.webp', thumb: '/hotel/real-75.webp' },
  { id: 35, category: 'Servicios', title: 'Sala de estar', src: '/hotel/real-72.webp', thumb: '/hotel/real-72.webp' },
  { id: 36, category: 'Servicios', title: 'Sala de estar', src: '/hotel/real-80.webp', thumb: '/hotel/real-80.webp' },
  { id: 37, category: 'Servicios', title: 'Sala de eventos', src: '/hotel/real-41.webp', thumb: '/hotel/real-41.webp' },
  { id: 38, category: 'Servicios', title: 'Sala de reuniones', src: '/hotel/real-51.webp', thumb: '/hotel/real-51.webp' },
  { id: 39, category: 'Servicios', title: 'Luna de miel', src: '/hotel/real-09.webp', thumb: '/hotel/real-09.webp' },
  { id: 40, category: 'Servicios', title: 'Bodas & eventos', src: '/hotel/real-14.webp', thumb: '/hotel/real-14.webp' },
  { id: 41, category: 'Servicios', title: 'Baño privado', src: '/hotel/real-81.webp', thumb: '/hotel/real-81.webp' },
];

const categories = ['Todos', 'Habitaciones', 'Restaurante', 'Exteriores', 'Servicios'];

export default function GaleriaPage() {
  const [active, setActive] = useState('Todos');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered = active === 'Todos' ? images : images.filter(i => i.category === active);
  const lbImg = lightbox !== null ? images.find(i => i.id === lightbox) : null;

  function navLightbox(dir: 1 | -1) {
    const idx = images.findIndex(i => i.id === lightbox);
    const next = (idx + dir + images.length) % images.length;
    setLightbox(images[next].id);
  }

  return (
    <div>
      <div className="relative h-72 md:h-80">
        <img
          src="/hotel/real-63.webp"
          alt="Galeria"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay flex items-end pb-10 justify-center text-center">
          <div>
            <p className="font-serif italic text-gold-300 text-xl mb-2">Visual</p>
            <h1 className="font-serif text-4xl md:text-6xl text-white font-light">Galeria de Fotos</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filter tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-10 justify-center">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActive(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                active === cat ? 'bg-navy text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {cat}
              <span className="ml-1.5 text-xs opacity-70">
                ({cat === 'Todos' ? images.length : images.filter(i => i.category === cat).length})
              </span>
            </button>
          ))}
        </div>

        {/* Masonry grid */}
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {filtered.map((img, i) => (
            <div key={img.id} className="break-inside-avoid group cursor-pointer rounded-xl overflow-hidden relative shadow-sm hover:shadow-xl transition-all duration-300"
              onClick={() => setLightbox(img.id)} style={{ animationDelay: `${i * 0.05}s` }}>
              <img src={img.thumb} alt={img.title}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-sm rounded-xl p-2.5">
                  <ZoomIn className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-medium">{img.title}</p>
                <p className="text-white/60 text-[10px]">{img.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lbImg && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-colors z-10"
            onClick={() => setLightbox(null)}>
            <X className="w-5 h-5" />
          </button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-colors z-10"
            onClick={e => { e.stopPropagation(); navLightbox(-1); }}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-colors z-10"
            onClick={e => { e.stopPropagation(); navLightbox(1); }}>
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="max-w-5xl max-h-[85vh] relative" onClick={e => e.stopPropagation()}>
            <img src={lbImg.src} alt={lbImg.title}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" />
            <div className="text-center mt-3">
              <p className="text-white font-medium">{lbImg.title}</p>
              <p className="text-white/50 text-sm">{lbImg.category}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
