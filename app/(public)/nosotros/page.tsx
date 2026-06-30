import Link from 'next/link';
import { Award, HeartHandshake, Sparkles, Building2, MapPin, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Nosotros — Hotel Boutique Casagrande',
  description: 'Mas de 20 anos de hospitalidad en Arequipa. Conoce la historia del Hotel Boutique Casagrande.',
};

const stats = [
  { value: '+20', label: 'Anos de experiencia' },
  { value: '1994', label: 'Nuestros inicios' },
  { value: '3', label: 'Edificios' },
  { value: '100%', label: 'Atencion personalizada' },
];

const valores = [
  {
    icon: Sparkles,
    title: 'Atencion al detalle',
    text: 'Cuidamos cada elemento de tu estancia para crear un ambiente de tranquilidad y bienestar.',
  },
  {
    icon: HeartHandshake,
    title: 'Servicio personalizado',
    text: 'Un trato calido y cercano que equilibra la tradicion con las comodidades contemporaneas.',
  },
  {
    icon: Award,
    title: 'Tradicion y modernidad',
    text: 'Conservamos el caracter historico de la casona mientras evolucionamos como hotel moderno.',
  },
];

export default function NosotrosPage() {
  return (
    <div>
      {/* Hero */}
      <div className="relative h-[60vh] min-h-[420px]">
        <img
          src="https://deykard.com/uploads/imagenes/hotel-casagrande-2.jpg"
          alt="Hotel Boutique Casagrande"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay flex items-center justify-center text-center px-4">
          <div>
            <p className="text-gold-300 text-xs font-medium tracking-[0.4em] uppercase mb-4">Nuestra Historia</p>
            <h1 className="font-serif text-4xl sm:text-6xl text-white font-light tracking-wide mb-4">
              Mas de 20 anos de <span className="italic text-gold-300">hospitalidad</span>
            </h1>
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              Una casona con alma, en el corazon de Arequipa.
            </p>
          </div>
        </div>
      </div>

      {/* Historia */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-olive text-xs font-medium tracking-[0.4em] uppercase mb-3">Desde 1994</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6 leading-snug">
              De casona europea a hotel boutique
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                El Hotel Boutique Casagrande nace en 1994 como una elegante casona de estilo europeo. Desde
                entonces ha crecido hasta convertirse en un hotel moderno y completo, conservando siempre su
                caracter historico y acogedor.
              </p>
              <p>
                A lo largo de los anos hemos recibido a miles de huespedes que buscan algo mas que una
                habitacion: un lugar donde la tradicion arequipena y la calidez del servicio se encuentran.
              </p>
              <p>
                Hoy seguimos fieles a esa esencia, ofreciendo una experiencia autentica en uno de los barrios
                mas tranquilos y tradicionales de la Ciudad Blanca.
              </p>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://deykard.com/uploads/imagenes/hotel-casagrande-9.jpg"
              alt="Interiores Casagrande"
              className="rounded-2xl shadow-xl w-full h-[420px] object-cover"
            />
            <div className="absolute -bottom-6 -left-6 hidden sm:block bg-navy text-white rounded-2xl px-7 py-5 shadow-2xl">
              <p className="font-serif text-3xl text-gold-300">1994</p>
              <p className="text-white/70 text-sm">El comienzo de nuestra historia</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-navy">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className="font-serif text-4xl sm:text-5xl text-gold-300 mb-1">{s.value}</p>
              <p className="text-white/70 text-sm tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Esencia / valores */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-olive text-xs font-medium tracking-[0.4em] uppercase mb-3">Nuestra Esencia</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
              Tu <span className="italic text-gold">Bienestar</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Mas que un hotel, somos un espacio donde cada estancia se vive con calidez y cuidado.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {valores.map(v => (
              <div key={v.title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-navy-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <v.icon className="w-7 h-7 text-navy" />
                </div>
                <h3 className="font-serif text-xl text-navy mb-3">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Estructura / edificios */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-14 items-center">
          <div className="order-2 lg:order-1">
            <img
              src="https://deykard.com/uploads/imagenes/hotel-casagrande-11.jpg"
              alt="Edificios del hotel"
              className="rounded-2xl shadow-xl w-full h-[420px] object-cover"
            />
          </div>
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-5">
              <Building2 className="w-6 h-6 text-gold" />
              <p className="text-olive text-xs font-medium tracking-[0.4em] uppercase">Nuestras instalaciones</p>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6 leading-snug">
              Tres edificios, un mismo espiritu
            </h2>
            <ul className="space-y-5">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-gold/15 text-gold font-bold flex items-center justify-center">1</span>
                <div>
                  <p className="font-semibold text-navy">Edificio principal</p>
                  <p className="text-gray-500 text-sm">Cuatro pisos con ascensor y todas las comodidades modernas.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-gold/15 text-gold font-bold flex items-center justify-center">2</span>
                <div>
                  <p className="font-semibold text-navy">Edificio de tres pisos</p>
                  <p className="text-gray-500 text-sm">Ambientes mas intimos y privados para una estancia tranquila.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-gold/15 text-gold font-bold flex items-center justify-center">3</span>
                <div>
                  <p className="font-semibold text-navy">Edificio de dos pisos</p>
                  <p className="text-gray-500 text-sm">El rincon mas reservado, ideal para descansar lejos del ruido.</p>
                </div>
              </li>
            </ul>
            <div className="flex items-center gap-2 mt-8 text-gray-500 text-sm">
              <MapPin className="w-4 h-4 text-gold" />
              Av. Luna Pizarro 202, Vallecito, Arequipa, Peru
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy-900 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-serif text-3xl sm:text-4xl text-white font-light mb-4">
            Ven a vivir la experiencia Casagrande
          </h2>
          <p className="text-white/60 mb-8">Reserva directa con la mejor tarifa garantizada.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/habitaciones" className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-600 text-navy-900 font-semibold px-8 py-3.5 rounded-lg transition-colors">
              Ver habitaciones <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contacto" className="inline-flex items-center justify-center gap-2 border border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-3.5 rounded-lg transition-colors">
              Contactanos
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
