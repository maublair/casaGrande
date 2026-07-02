'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { BedDouble, Users, Star, Wifi, Car, Coffee, Waves, ChevronRight, ArrowRight, CalendarCheck } from 'lucide-react';
import { getRooms, getAvailability, type WpRoom } from '@/lib/wp';
import BookingModal from '@/components/hotel/BookingModal';
import type { RoomType } from '@/lib/supabase';
interface Room { id: string; status: string; room_type_id: string; }
type RoomTypeWithRooms = RoomType & { rooms: Room[] };

const amenityIcons: Record<string, React.ElementType> = {
  wifi: Wifi, parking: Car, breakfast: Coffee, pool: Waves,
};

const fallbackImages = [
  '/hotel/real-26.webp',
  '/hotel/real-07.webp',
  '/hotel/real-10.webp',
  '/hotel/real-37.webp',
];

function mapRooms(types: WpRoom[]): RoomTypeWithRooms[] {
  return types.map((t, i) => ({
    ...t,
    images: t.images?.length ? t.images : [fallbackImages[i % fallbackImages.length]],
    rooms: new Array(t.available || 0).fill(0),
  })) as unknown as RoomTypeWithRooms[];
}

const isDateStr = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const fmtDay = (s: string) =>
  new Date(s + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
const nightsBetween = (a: string, b: string) =>
  Math.max(1, Math.round((+new Date(b + 'T12:00:00') - +new Date(a + 'T12:00:00')) / 86400000));

interface SearchDates { checkIn: string; checkOut: string; adults: number }

export default function HabitacionesClient({ initialRooms }: { initialRooms: WpRoom[] }) {
  const [roomTypes, setRoomTypes] = useState<RoomTypeWithRooms[]>(mapRooms(initialRooms));
  const [loading, setLoading] = useState(initialRooms.length === 0);
  const [, setSelected] = useState<RoomType | null>(null);
  const [bookingRoom, setBookingRoom] = useState<RoomTypeWithRooms | null>(null);
  const [searchDates, setSearchDates] = useState<SearchDates | null>(null);
  const [availByType, setAvailByType] = useState<Record<string, number>>({});

  useEffect(() => {
    getRooms().then((types) => {
      if (types.length) setRoomTypes(mapRooms(types));
      setLoading(false);
    });
  }, []);

  // Lee los params de búsqueda del BookingWidget desde window.location (compatible con export estático).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const checkIn = params.get('checkIn') || '';
    const checkOut = params.get('checkOut') || '';
    const adultsRaw = parseInt(params.get('adults') || '', 10);
    const adults = Number.isFinite(adultsRaw) && adultsRaw >= 1 ? adultsRaw : 2;
    if (!isDateStr(checkIn) || !isDateStr(checkOut) || checkOut <= checkIn) return;
    setSearchDates({ checkIn, checkOut, adults });
    getAvailability(checkIn, checkOut).then((rows) => {
      const map: Record<string, number> = {};
      rows.forEach((r) => {
        map[r.id] = r.available;
        if (map[r.name] === undefined) map[r.name] = r.available;
      });
      setAvailByType(map);
    });
  }, []);

  function clearSearch() {
    window.history.replaceState(null, '', window.location.pathname);
    setSearchDates(null);
    setAvailByType({});
  }

  return (
    <div className="pt-0">
      {/* Hero */}
      <div className="relative h-72 md:h-96">
        <img
          src="/hotel/real-10.webp"
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
        {searchDates && (
          <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-cream border border-gold-200 rounded-2xl px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5 text-gold-700" />
              </span>
              <p className="text-sm text-navy-900">
                Disponibilidad del <span className="font-semibold">{fmtDay(searchDates.checkIn)}</span> al{' '}
                <span className="font-semibold">{fmtDay(searchDates.checkOut)}</span>{' '}
                · {nightsBetween(searchDates.checkIn, searchDates.checkOut)} noche{nightsBetween(searchDates.checkIn, searchDates.checkOut) !== 1 ? 's' : ''}{' '}
                · {searchDates.adults} huésped{searchDates.adults !== 1 ? 'es' : ''}
              </p>
            </div>
            <button
              onClick={clearSearch}
              className="self-start sm:self-auto text-xs font-semibold text-navy bg-white border border-navy-100 hover:bg-navy-50 px-4 py-2 rounded-lg transition-colors"
            >
              Limpiar
            </button>
          </div>
        )}
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
              const availableCount = type.rooms.length;
              const isEven = idx % 2 === 0;
              const img = type.images[0] || fallbackImages[idx % fallbackImages.length];
              const searchAvail = searchDates
                ? (availByType[type.id] !== undefined ? availByType[type.id] : availByType[type.name])
                : undefined;
              const soldOut = searchDates !== null && searchAvail === 0;
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
                      {searchDates && searchAvail !== undefined ? (
                        searchAvail > 0 ? (
                          <div className="absolute top-4 left-4 bg-olive-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                            {searchAvail} libre{searchAvail > 1 ? 's' : ''} para tus fechas
                          </div>
                        ) : (
                          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                            Sin disponibilidad para tus fechas
                          </div>
                        )
                      ) : availableCount > 0 ? (
                        <div className="absolute top-4 left-4 bg-olive-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                          {availableCount} disponible{availableCount > 1 ? 's' : ''}
                        </div>
                      ) : null}
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
                      <button
                        onClick={soldOut ? undefined : () => setBookingRoom(type)}
                        disabled={soldOut}
                        className={`flex items-center gap-2 bg-navy text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md ${soldOut ? 'opacity-50 cursor-not-allowed' : 'hover:bg-navy-700 hover:shadow-lg'}`}
                      >
                        Reservar <ArrowRight className="w-4 h-4" />
                      </button>
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

      {bookingRoom && (
        <BookingModal
          room={bookingRoom}
          initialCheckIn={searchDates?.checkIn}
          initialCheckOut={searchDates?.checkOut}
          initialAdults={searchDates?.adults}
          onClose={() => setBookingRoom(null)}
        />
      )}
    </div>
  );
}
