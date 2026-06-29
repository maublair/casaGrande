'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, ChevronDown, Lock } from 'lucide-react';
import Logo from './Logo';

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Habitaciones', href: '/habitaciones' },
  { label: 'Restaurante', href: '/restaurante' },
  { label: 'Tour Virtual', href: '/tour-virtual' },
  { label: 'Galeria', href: '/galeria' },
  { label: 'Contacto', href: '/contacto' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const transparent = isHome && !scrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
        transparent ? 'py-5 bg-transparent' : 'py-3 bg-white/98 backdrop-blur-xl shadow-sm border-b border-gray-100/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        <Link href="/" className="flex-shrink-0">
          <Logo variant={transparent ? 'light' : 'dark'} size="md" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map(link => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 text-sm font-medium tracking-wide rounded-md transition-all duration-200 ${
                  active
                    ? transparent
                      ? 'text-gold-300 bg-white/10'
                      : 'text-navy bg-navy-50'
                    : transparent
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : 'text-gray-700 hover:text-navy hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a
            href="tel:54214000"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              transparent ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-navy'
            }`}
          >
            <Phone className="w-4 h-4" />
            54-214000
          </a>
          <Link
            href="/login"
            className={`hidden sm:flex items-center gap-1.5 text-sm font-medium transition-colors ${
              transparent ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-navy'
            }`}
          >
            <Lock className="w-4 h-4" />
            Acceso
          </Link>
          <Link
            href="/#reservar"
            className="bg-gold hover:bg-gold-600 text-navy-900 text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            Reservar
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className={`lg:hidden p-2 rounded-lg transition-colors ${
            transparent ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-0.5">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`py-3 px-3 rounded-lg font-medium text-sm transition-colors ${
                  pathname === link.href
                    ? 'text-navy bg-navy-50'
                    : 'text-gray-700 hover:text-navy hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 pb-1 border-t border-gray-100 mt-1 flex flex-col gap-2">
              <a
                href="tel:54214000"
                className="flex items-center gap-2 text-sm text-gray-600 py-2 px-3"
              >
                <Phone className="w-4 h-4" /> 54-214000
              </a>
              <Link
                href="/#reservar"
                onClick={() => setOpen(false)}
                className="bg-gold text-navy-900 text-center font-semibold py-3 rounded-lg hover:bg-gold-600 transition-colors"
              >
                Reservar Ahora
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
