'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { BedDouble, Users, Star, Wifi, Car, Coffee, Waves, ChevronRight, ArrowRight } from 'lucide-react';
import { getRooms } from '@/lib/wp';
import type { RoomType } from '@/lib/supabase';
interface Room { id: string; status: string; room_type_id: string; }
type RoomTypeWithRooms = RoomType & { rooms: Room[] };

const amenityIcons: Record<string, React.ElementType> = {
  wifi: Wifi, parking: Car, breakfast: Coffee, pool: Waves,
};

const fallbackImages = [
  'https://deykard.com/uploads/imagenes/hotel-casagrande-8.jpg',
  'https://deykard.com/uploads/imagenes/hotel-casagrande-7.jpg',
  'https://deykard.com/uploads/imagenes/hotel-casagrande-2.jpg',
  'https://deykard.com/uploads/imagenes/hotel-casagrande-9.jpg',
];

export default function HabitacionesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomTypeWithRooms[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setSelected] = useState<RoomType | null>(null);

  useEffect(() => {
    async function load() {
      const types = await getRooms();
      const merged = types.map((t, i) => ({
        ...t,
        images: t.images?.length ? t.images : [fallbackImages[i % fallbackImages.length]],
        rooms: new Array(t.available || 0).fill(0),
      })) as unknown as RoomTypeWithRooms[];
      setRoomTypes(merged);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="pt-0">
      {/* Hero */}
      <div className="relative h-72 md:h-96">
        <img
          src="https://deykard.com/uploads/imagenes/hotel-casagrande-2.jpg"
          alt="Habitaciones Casagrande"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay flex items-end pb-12 justify-center text-center">
          <div>
            <p className="font-serif italic text-gold-300 text-xl mb-2">Hotel Boutique</p>
            <h1 className="font-serif text-4xl md:text-6xl text-white font-light tracking-wide">Nuestras Habitaciones</h1>
            <p className="text-white/75 mt-3 text-lg">Cada espacio diseñado para tu bienestar</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="h-64 shimmer" />
                <div className="p-6 space-y-3">
                  <div className="h-5 shimmer rounded w-3/4" />
                  <div className="h-4 shimmer rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : roomTypes.length === 0 ? (
          <div className="text-center py-24">
            <BedDouble className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay tipos de habitacion configurados aun.</p>
          </div>
        ) : (
          <div className="space-y-20">
            {roomTypes.map((type, idx) => {
              const availableCount = type.rooms.filter(r => r.status === 'available').length;
              const isEven = idx % 2 === 0;
              const img = type.images[0] || fallbackImages[idx % fallbackImages.length];
              return (
                <div
                  key={type.id}
                  className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-12 items-center`}
                >
                  <div className="lg:w-1/2 w-full">
                    <div className="relative rounded-2xl overflow-hidden group h-80 lg:h-[420px] shadow-xl">
                      <img
                        src={img}
                        alt={type.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {availableCount > 0 && (
                        <div className="absolute top-4 left-4 bg-olive-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                          {availableCount} disponible{availableCount > 1 ? 's' : ''}
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-gold-300 text-gold-300" />
                        <Star className="w-3 h-3 fill-gold-300 text-gold-300" />
                        <Star className="w-3 h-3 fill-gold-300 text-gold-300" />
                        <Star className="w-3 h-3 fill-gold-300 text-gold-300" />
                        <Star className="w-3 h-3 fill-gold-300 text-gold-300" />
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-1/2 w-full space-y-5">
                    <div>
                      <p className="font-serif italic text-gold text-base mb-1">Categoria</p>
                      <h2 className="font-serif text-3xl lg:text-4xl text-gray-900 font-light">{type.name}</h2>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-navy" /> Hasta {type.capacity} personas</span>
                      <span className="flex items-center gap-1.5"><BedDouble className="w-4 h-4 text-navy" /> {type.rooms.length} habitacion{type.rooms.length !== 1 ? 'es' : ''}</span>
                    </div>

                    {type.description && (
                      <p className="text-gray-600 leading-relaxed">{type.description}</p>
                    )}

                    {type.amenities && type.amenities.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Incluye</p>
                        <div className="flex flex-wrap gap-2">
                          {type.amenities.map(a => (
                            <span key={a} className="bg-navy-50 text-navy text-xs font-medium px-3 py-1.5 rounded-full border border-navy-100">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-end justify-between pt-2">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Desde</p>
                        <p className="text-3xl font-light text-navy">
                          S/ <span className="font-semibold">{type.base_price.toFixed(0)}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">por noche</p>
                      </div>
                      <a
                        href="/#reservar"
                        className="flex items-center gap-2 bg-navy hover:bg-navy-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
                      >
                        Reservar <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Policies */}
        <div className="mt-20 grid md:grid-cols-3 gap-6">
          {[
            { title: 'Check-in / Check-out', body: 'Check-in: 2:00 PM — Check-out: 12:00 PM. Llegada anticipada o salida tarde segun disponibilidad.' },
            { title: 'Cancelacion', body: 'Cancelacion gratuita hasta 48 horas antes de la llegada. Despues se aplica cargo de 1 noche.' },
            { title: 'Politica de mascotas', body: 'No se admiten mascotas en las instalaciones. Consulta por excepciones.' },
          ].map(p => (
            <div key={p.title} className="bg-cream rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-2">{p.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}
