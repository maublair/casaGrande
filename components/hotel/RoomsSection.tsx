'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, ArrowRight, Star } from 'lucide-react';
import { supabase, RoomType } from '@/lib/supabase';

export default function RoomsSection() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('room_types').select('*').order('base_price').then(({ data }) => {
      if (data) setRoomTypes(data);
      setLoading(false);
    });
  }, []);

  const roomImages = [
    'https://deykard.com/uploads/imagenes/hotel-casagrande-8.jpg',
    'https://deykard.com/uploads/imagenes/hotel-casagrande-7.jpg',
    'https://deykard.com/uploads/imagenes/hotel-casagrande-2.jpg',
    'https://deykard.com/uploads/imagenes/hotel-casagrande-9.jpg',
    'https://deykard.com/uploads/imagenes/hotel-casagrande-11.jpg',
  ];

  if (loading) return (
    <section className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-80 bg-gray-200 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </section>
  );

  return (
    <section id="habitaciones" className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-olive-DEFAULT text-xs font-medium tracking-[0.4em] uppercase mb-3">Nuestras Habitaciones</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-navy-DEFAULT mb-4">
            Espacios Disenados para el <span className="italic text-gold-DEFAULT">Descanso</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Cada habitacion es un refugio cuidadosamente decorado que combina el estilo boutique con las comodidades modernas.
          </p>
        </div>

        {/* Room cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomTypes.map((room, i) => (
            <div
              key={room.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-400 hover:-translate-y-1 border border-gray-100"
            >
              {/* Image */}
              <div className="relative overflow-hidden h-52">
                <img
                  src={room.images[0] || roomImages[i % roomImages.length]}
                  alt={room.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-navy-DEFAULT text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {room.capacity} {room.capacity === 1 ? 'persona' : 'personas'}
                </div>
                {i >= 3 && (
                  <div className="absolute top-3 left-3 bg-gold-DEFAULT text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Premium
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-serif text-xl text-navy-DEFAULT mb-2">{room.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{room.description}</p>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {room.amenities.slice(0, 4).map(a => (
                    <span key={a} className="text-[11px] text-olive-700 bg-olive-50 px-2 py-0.5 rounded-full border border-olive-100">
                      {a}
                    </span>
                  ))}
                  {room.amenities.length > 4 && (
                    <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      +{room.amenities.length - 4} mas
                    </span>
                  )}
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-xs text-gray-400">Desde</span>
                    <p className="text-2xl font-bold text-navy-DEFAULT">
                      S/ {room.base_price.toFixed(0)}
                      <span className="text-sm font-normal text-gray-400">/noche</span>
                    </p>
                  </div>
                  <Link
                    href={`/habitaciones?tipo=${encodeURIComponent(room.name)}`}
                    className="flex items-center gap-1.5 text-gold-DEFAULT hover:text-gold-700 text-sm font-semibold group/btn transition-colors"
                  >
                    Reservar
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/habitaciones"
            className="inline-flex items-center gap-2 border-2 border-navy-DEFAULT text-navy-DEFAULT hover:bg-navy-DEFAULT hover:text-white font-semibold px-8 py-3.5 rounded-lg transition-all"
          >
            Ver todas las habitaciones
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
