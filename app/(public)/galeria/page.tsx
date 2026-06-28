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
  // Habitaciones
  { id: 1, category: 'Habitaciones', title: 'Suite Premium', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-2.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-2.jpg' },
  { id: 2, category: 'Habitaciones', title: 'Habitacion Doble', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-7.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-7.jpg' },
  { id: 3, category: 'Habitaciones', title: 'Habitacion Simple', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-8.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-8.jpg' },
  { id: 4, category: 'Habitaciones', title: 'Suite Ejecutiva', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-9.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-9.jpg' },
  { id: 5, category: 'Habitaciones', title: 'Detalle de Cama', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-11.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-11.jpg' },
  // Restaurante
  { id: 6, category: 'Restaurante', title: 'Comedor Principal', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-3.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-3.jpg' },
  { id: 7, category: 'Restaurante', title: 'Salon de Eventos', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-12.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-12.jpg' },
  { id: 8, category: 'Restaurante', title: 'Desayuno Buffet', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-13.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-13.jpg' },
  { id: 9, category: 'Restaurante', title: 'Sala de Reuniones', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-14.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-14.jpg' },
  // Exteriores
  { id: 10, category: 'Exteriores', title: 'Fachada del Hotel', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-1.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-1.jpg' },
  { id: 11, category: 'Exteriores', title: 'Jardines', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-5.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-5.jpg' },
  { id: 12, category: 'Exteriores', title: 'Terraza', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-6.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-6.jpg' },
  // Servicios
  { id: 13, category: 'Servicios', title: 'Lobby & Recepcion', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-4.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-4.jpg' },
  { id: 14, category: 'Servicios', title: 'Sala de Estar', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-15.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-15.jpg' },
  { id: 15, category: 'Servicios', title: 'Bano Premium', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-16.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-16.jpg' },
  { id: 16, category: 'Servicios', title: 'Area Social', src: 'https://deykard.com/uploads/imagenes/hotel-casagrande-17.jpg', thumb: 'https://deykard.com/uploads/imagenes/hotel-casagrande-17.jpg' },
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
          src="https://deykard.com/uploads/imagenes/hotel-casagrande-1.jpg"
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
                active === cat ? 'bg-navy-DEFAULT text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
