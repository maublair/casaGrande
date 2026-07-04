import Link from 'next/link';
import {
  Heart, Presentation, UtensilsCrossed, Wifi, Coffee, Projector,
  Trees, Wrench, Car, BedDouble, ConciergeBell, Wine, ArrowRight, Check,
} from 'lucide-react';

export const metadata = {
  title: 'Servicios — Hotel Boutique Casagrande',
  description: 'Luna de miel, salas de reuniones y catering para eventos en el Hotel Boutique Casagrande, Arequipa.',
};

const servicios = [
  {
    icon: Heart,
    title: 'Luna de Miel',
    image: '/hotel/real-09.webp',
    text: 'Una experiencia pensada para recien casados.',
    features: [
      'Habitaciones comodas previas al evento',
      'Suite exclusiva decorada para la primera noche',
      'Jardines para una sesion de fotos inolvidable',
      'Desayuno buffet al dia siguiente',
    ],
  },
  {
    icon: Presentation,
    title: 'Salas de Reuniones',
    image: '/hotel/real-51.webp',
    text: 'Tres espacios multiproposito adaptables a tu evento.',
    features: [
      'Montaje Auditorio para conferencias',
      'Montaje Escuela para capacitaciones',
      'Montaje en U para reuniones de trabajo',
      'WiFi de alta velocidad, proyeccion y soporte tecnico',
    ],
  },
  {
    icon: UtensilsCrossed,
    title: 'Catering y Eventos',
    image: '/hotel/real-54.webp',
    text: 'Gastronomia a la medida para cada ocasion.',
    features: [
      'Desayunos buffet',
      'Almuerzos y cenas a la carta',
      'Paquetes personalizados para eventos corporativos',
      'Coffee breaks con bebidas calientes y bocaditos',
    ],
  },
];

const amenidades = [
  { icon: UtensilsCrossed, label: 'Restaurante' },
  { icon: Wifi, label: 'WiFi alta velocidad' },
  { icon: Projector, label: 'Equipo audiovisual' },
  { icon: Trees, label: 'Jardines' },
  { icon: Wrench, label: 'Asistencia tecnica' },
  { icon: Coffee, label: 'Coffee breaks' },
  { icon: Car, label: 'Estacionamiento' },
  { icon: ConciergeBell, label: 'Servicio al cuarto' },
  { icon: BedDouble, label: 'Habitaciones equipadas' },
  { icon: Wine, label: 'Menus personalizados' },
];

export default function ServiciosPage() {
  return (
    <div>
      {/* Hero */}
      <div className="relative h-[55vh] min-h-[400px]">
        <img
          src="/hotel/real-41.webp"
          alt="Servicios Casagrande"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay flex items-center justify-center text-center px-4">
          <div>
            <p className="text-gold-300 text-xs font-medium tracking-[0.4em] uppercase mb-4">Servicios</p>
            <h1 className="font-serif text-4xl sm:text-6xl text-white font-light tracking-wide mb-4">
              Experiencias para <span className="italic text-gold-300">cada ocasion</span>
            </h1>
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              Bodas, eventos corporativos y celebraciones con el sello Casagrande.
            </p>
          </div>
        </div>
      </div>

      {/* Servicios principales */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 space-y-16">
          {servicios.map((s, i) => (
            <div
              key={s.title}
              className={`grid lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}
            >
              <div className="relative">
                <img src={s.image} alt={s.title} className="rounded-2xl shadow-xl w-full h-[360px] object-cover" />
              </div>
              <div>
                <div className="w-14 h-14 bg-navy-50 rounded-2xl flex items-center justify-center mb-5">
                  <s.icon className="w-7 h-7 text-navy" />
                </div>
                <h2 className="font-serif text-3xl text-navy mb-3">{s.title}</h2>
                <p className="text-gray-500 mb-6 leading-relaxed">{s.text}</p>
                <ul className="space-y-3">
                  {s.features.map(f => (
                    <li key={f} className="flex items-start gap-3 text-gray-700">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-olive-50 text-olive-700 flex items-center justify-center mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-sm leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contacto"
                  className="inline-flex items-center gap-2 mt-7 text-gold hover:text-gold-700 font-semibold text-sm transition-colors"
                >
                  Solicitar informacion <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Amenidades */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-olive text-xs font-medium tracking-[0.4em] uppercase mb-3">Comodidades</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy">
              Todo lo que necesitas, <span className="italic text-gold">en un solo lugar</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {amenidades.map(a => (
              <div key={a.label} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <a.icon className="w-6 h-6 text-navy" />
                </div>
                <p className="text-sm font-medium text-gray-700">{a.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy-900 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-serif text-3xl sm:text-4xl text-white font-light mb-4">
            Planifiquemos tu proximo evento
          </h2>
          <p className="text-white/60 mb-8">Cuentanos que necesitas y armamos una propuesta a tu medida.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contacto" className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-600 text-navy-900 font-semibold px-8 py-3.5 rounded-lg transition-colors">
              Cotizar evento <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/51942330137?text=Hola%2C%20quiero%20informacion%20sobre%20los%20servicios%20para%20eventos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-3.5 rounded-lg transition-colors"
            >
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
