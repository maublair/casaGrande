import { Award, Users, Star, MapPin } from 'lucide-react';

const stats = [
  { icon: Award, value: '+20', label: 'Anos de Experiencia' },
  { icon: Users, value: '+15k', label: 'Huespedes Satisfechos' },
  { icon: Star, value: '4.8', label: 'Calificacion Promedio' },
  { icon: MapPin, value: '13', label: 'Habitaciones Exclusivas' },
];

export default function HistorySection() {
  return (
    <section id="historia" className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Images collage */}
          <div className="relative pb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="h-48 rounded-2xl overflow-hidden shadow-md">
                  <img
                    src="/hotel/real-42.webp"
                    alt="Lobby Casagrande"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="h-36 rounded-2xl overflow-hidden shadow-md">
                  <img
                    src="/hotel/real-54.webp"
                    alt="Restaurante"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="h-36 rounded-2xl overflow-hidden shadow-md">
                  <img
                    src="/hotel/real-57.webp"
                    alt="Habitacion"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="h-48 rounded-2xl overflow-hidden shadow-md">
                  <img
                    src="/hotel/real-40.webp"
                    alt="Jardin"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gold text-navy-900 px-6 py-3 rounded-xl shadow-xl text-center">
              <p className="text-xs tracking-widest uppercase font-medium opacity-80">Fundado en</p>
              <p className="font-serif text-2xl font-semibold leading-tight">2003</p>
            </div>
          </div>

          {/* Text content */}
          <div>
            <p className="text-olive text-xs font-medium tracking-[0.4em] uppercase mb-4">
              Nuestra Historia
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl text-navy leading-tight mb-6">
              Mas de Dos Decadas de{' '}
              <span className="italic text-gold">Hospitalidad</span>
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed text-[15px]">
              <p>
                El Hotel Boutique Casagrande nacio del sueno de ofrecer a Lima una experiencia de alojamiento distinta: intima, elegante y profundamente peruana. Desde 2003, nuestra casona historica de San Isidro ha sido el hogar transitorio de miles de viajeros que buscaban algo mas que una habitacion.
              </p>
              <p>
                Cada rincon del hotel cuenta una historia. Los jardines centenarios, la arquitectura de estilo europeo y la calidez del servicio personalizado crean una atmosfera unica que nuestros huespedes describen como &quot;sentirse en casa, pero en un sueno&quot;.
              </p>
              <p>
                Hoy, con 13 habitaciones cuidadosamente disenadas, un restaurante boutique y un equipo de profesionales apasionados, seguimos comprometidos con hacer de cada estancia un recuerdo que dure para siempre.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 mt-10">
              {stats.map(stat => (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
                >
                  <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <stat.icon className="w-5 h-5 text-navy" />
                  </div>
                  <div>
                    <p className="font-bold text-navy text-xl leading-none">{stat.value}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
