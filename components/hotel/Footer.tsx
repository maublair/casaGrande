import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube, ArrowRight } from 'lucide-react';

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Habitaciones', href: '/habitaciones' },
  { label: 'Restaurante', href: '/restaurante' },
  { label: 'Tour Virtual', href: '/tour-virtual' },
  { label: 'Galeria', href: '/galeria' },
  { label: 'Contacto', href: '/contacto' },
];

const services = [
  'Desayuno incluido',
  'WiFi gratuito',
  'Estacionamiento',
  'Servicio al cuarto',
  'Lavanderia',
  'Transfer aeropuerto',
  'Sala de eventos',
];

const socials = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Youtube, href: '#', label: 'Youtube' },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-semibold text-xs uppercase tracking-[0.18em] text-gold-300 mb-5 after:block after:mt-2 after:h-px after:w-8 after:bg-gold/50">
      {children}
    </h4>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative bg-navy-900 text-white">
      {/* Acento dorado superior */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/70 to-transparent" />

      {/* Franja CTA */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <p className="text-gold-300 text-xs font-medium uppercase tracking-[0.22em] mb-2">Reserva directa</p>
            <h3 className="font-serif text-3xl md:text-4xl font-light leading-tight">
              ¿Listo para vivir la experiencia Casagrande?
            </h3>
            <p className="text-white/60 text-sm mt-2">
              Reserva directamente y obtiene la mejor tarifa garantizada.
            </p>
          </div>
          <Link
            href="/#reservar"
            className="group inline-flex items-center gap-2 flex-shrink-0 bg-gold hover:bg-gold-400 text-navy-900 font-semibold px-8 py-4 rounded-full transition-colors duration-200 shadow-lg shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900"
          >
            Reservar Ahora
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
          {/* Marca */}
          <div>
            <div className="inline-flex bg-cream rounded-xl px-5 py-4 shadow-md mb-5">
              <div className="relative h-14 w-[150px]">
                <Image
                  src="/Logo-Casagrande-1-2048x951.png"
                  alt="Hotel Boutique Casagrande"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <p className="text-white/55 text-sm leading-relaxed mb-6 max-w-xs">
              Hospitalidad boutique de lujo en Arequipa, Peru. Una experiencia autentica e inolvidable desde 2003.
            </p>
            <div className="flex gap-3">
              {socials.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-10 h-10 bg-white/5 border border-white/10 text-white/80 hover:bg-gold hover:border-gold hover:text-navy-900 rounded-full flex items-center justify-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
                >
                  <s.icon className="w-[18px] h-[18px]" />
                </a>
              ))}
            </div>
          </div>

          {/* Navegacion */}
          <div>
            <SectionTitle>Menu</SectionTitle>
            <ul className="space-y-3">
              {navLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-white/65 hover:text-gold-300 text-sm transition-colors duration-200"
                  >
                    <span className="h-px w-0 bg-gold-300 transition-all duration-200 group-hover:w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Servicios */}
          <div>
            <SectionTitle>Servicios</SectionTitle>
            <ul className="space-y-3">
              {services.map(s => (
                <li key={s} className="flex items-center gap-2 text-white/65 text-sm">
                  <span className="h-1 w-1 rounded-full bg-gold/70 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <SectionTitle>Contacto</SectionTitle>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-white/70 text-sm">
                <MapPin className="w-4 h-4 text-gold-300 mt-0.5 flex-shrink-0" />
                <span>Vallecito, Arequipa, Peru</span>
              </li>
              <li>
                <a href="tel:+5154214000" className="flex items-center gap-3 text-white/70 hover:text-gold-300 text-sm transition-colors duration-200">
                  <Phone className="w-4 h-4 text-gold-300 flex-shrink-0" />
                  <span>54-214000 | 942 330 137</span>
                </a>
              </li>
              <li>
                <a href="mailto:reservas@hotelcasagrande.pe" className="flex items-center gap-3 text-white/70 hover:text-gold-300 text-sm transition-colors duration-200 break-all">
                  <Mail className="w-4 h-4 text-gold-300 flex-shrink-0" />
                  <span>reservas@hotelcasagrande.pe</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/45">
          <p>&copy; {year} Hotel Boutique Casagrande. Todos los derechos reservados.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-gold-300 transition-colors duration-200">Privacidad</a>
            <a href="#" className="hover:text-gold-300 transition-colors duration-200">Terminos</a>
            <Link href="/admin" className="hover:text-gold-300 transition-colors duration-200">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
