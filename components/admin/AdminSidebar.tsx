'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, BedDouble, CalendarCheck, Users, UserCog,
  BarChart3, MessageSquare, ExternalLink, DollarSign,
  Package, Warehouse, Brush, Clock, UtensilsCrossed, ChevronDown, ChevronRight, FileEdit
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const nav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Contenido', href: '/admin/contenido', icon: FileEdit },
  { label: 'Habitaciones', href: '/admin/habitaciones', icon: BedDouble },
  { label: 'Reservas', href: '/admin/reservas', icon: CalendarCheck },
  { label: 'Clientes', href: '/admin/clientes', icon: Users },
  {
    label: 'Personal', href: '/admin/personal', icon: UserCog,
    children: [
      { label: 'Empleados', href: '/admin/personal' },
      { label: 'Horarios', href: '/admin/horarios' },
    ]
  },
  { label: 'Limpieza', href: '/admin/limpieza', icon: Brush },
  {
    label: 'Almacen', href: '/admin/almacen', icon: Warehouse,
    children: [
      { label: 'Inventario', href: '/admin/almacen' },
      { label: 'Insumos', href: '/admin/almacen/movimientos' },
    ]
  },
  { label: 'Restaurante', href: '/admin/restaurante', icon: UtensilsCrossed },
  { label: 'Finanzas', href: '/admin/finanzas', icon: DollarSign },
  { label: 'Metricas', href: '/admin/metricas', icon: BarChart3 },
  { label: 'Chat', href: '/admin/chat', icon: MessageSquare },
];

export default function AdminSidebar() {
  const path = usePathname();
  const [expanded, setExpanded] = useState<string[]>([]);

  function toggle(href: string) {
    setExpanded(prev => prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]);
  }

  function isActive(href: string) {
    return path === href || (href !== '/admin' && path.startsWith(href));
  }

  return (
    <aside className="w-58 bg-[#152d42] flex flex-col h-screen sticky top-0 flex-shrink-0 select-none" style={{ width: '230px' }}>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-center">
          <div className="relative h-16 w-[136px]">
            <Image
              src="/Logo-Casagrande-1-2048x951.png"
              alt="Hotel Casagrande"
              fill
              className="object-contain"
            />
          </div>
        </div>
        <span className="text-[10px] text-white/40 font-medium mt-2 block uppercase tracking-widest text-center">Panel Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-0.5">
        {nav.map(item => {
          const active = isActive(item.href);
          const isExpanded = expanded.includes(item.href);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.href}>
              {hasChildren ? (
                <button
                  onClick={() => toggle(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                  }`}
                >
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-gold-300' : ''}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 opacity-60" /> : <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                  }`}
                >
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-gold-300' : ''}`} />
                  {item.label}
                </Link>
              )}

              {/* Children */}
              {hasChildren && isExpanded && (
                <div className="ml-7 mt-0.5 space-y-0.5 pl-2 border-l border-white/10">
                  {item.children!.map(child => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`flex items-center py-2 px-2 rounded-md text-xs font-medium transition-all ${
                        path === child.href ? 'text-gold-300 bg-white/10' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-xs transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver sitio web
        </Link>
      </div>
    </aside>
  );
}
