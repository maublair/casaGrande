import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube } from 'lucide-react';

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Habitaciones', href: '/habitaciones' },
  { label: 'Restaurante', href: '/restaurante' },
  { label: 'Tour Virtual', href: '/tour-virtual' },
  { label: 'Galeria', href: '/galeria' },
  { label: 'Contacto', href: '/contacto' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-navy-DEFAULT text-white">
      {/* Top CTA */}
      <div className="bg-gold-DEFAULT/10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl font-light">¿Listo para vivir la experiencia Casagrande?</h3>
            <p className="text-white/70 text-sm mt-1">Reserva directamente y obtiene la mejor tarifa garantizada.</p>
          </div>
          <Link
            href="/#reservar"
            className="flex-shrink-0 bg-gold-DEFAULT hover:bg-gold-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            Reservar Ahora
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <div className="relative h-20 w-[170px] mb-3">
                <Image
                  src="/Logo-Casagrande-1-2048x951.png"
                  alt="Hotel Casagrande"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Hospitalidad boutique de lujo en Arequipa, Peru. Una experiencia autentica e inolvidable desde 2003.
            </p>
            <div className="flex gap-2.5">
              {[
                { icon: Instagram, href: '#', label: 'Instagram' },
                { icon: Facebook, href: '#', label: 'Facebook' },
                { icon: Youtube, href: '#', label: 'Youtube' },
              ].map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 bg-white/10 hover:bg-gold-DEFAULT text-white rounded-lg flex items-center justify-center transition-all hover:scale-105"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-widest text-white/50 mb-5">Menu</h4>
            <ul className="space-y-2.5">
              {navLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/65 hover:text-gold-300 text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-widest text-white/50 mb-5">Servicios</h4>
            <ul className="space-y-2.5">
              {['Desayuno incluido', 'WiFi gratuito', 'Estacionamiento', 'Servicio al cuarto', 'Lavanderia', 'Transfer aeropuerto', 'Sala de eventos'].map(s => (
                <li key={s} className="text-white/65 text-sm">{s}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-widest text-white/50 mb-5">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-white/65 text-sm">
                <MapPin className="w-4 h-4 text-gold-300 mt-0.5 flex-shrink-0" />
                <span>Arequipa, Peru</span>
              </li>
              <li className="flex items-center gap-3 text-white/65 text-sm">
                <Phone className="w-4 h-4 text-gold-300 flex-shrink-0" />
                <span>54-214000 | 942 330 137</span>
              </li>
              <li className="flex items-center gap-3 text-white/65 text-sm">
                <Mail className="w-4 h-4 text-gold-300 flex-shrink-0" />
                <span>reservas@hotelcasagrande.pe</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/35">
          <p>&copy; {year} Hotel Boutique Casagrande. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white/60 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terminos</a>
            <Link href="/admin" className="hover:text-white/60 transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
