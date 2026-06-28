'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, LogOut } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

const titles: Record<string, string> = {
  '/admin': 'Dashboard General',
  '/admin/habitaciones': 'Gestion de Habitaciones',
  '/admin/reservas': 'Reservas',
  '/admin/clientes': 'Clientes',
  '/admin/personal': 'Personal',
  '/admin/horarios': 'Horarios y Turnos',
  '/admin/limpieza': 'Agenda de Limpieza',
  '/admin/almacen': 'Almacen e Inventario',
  '/admin/almacen/movimientos': 'Movimientos de Inventario',
  '/admin/restaurante': 'Menu del Restaurante',
  '/admin/finanzas': 'Finanzas y Gastos',
  '/admin/metricas': 'Metricas y Analisis',
  '/admin/chat': 'Chat y Consultas',
};

export default function AdminHeader() {
  const path = usePathname();
  const router = useRouter();
  const title = titles[path] || 'Panel Admin';
  const today = new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div>
        <h1 className="font-semibold text-gray-900 text-base">{title}</h1>
        <p className="text-xs text-gray-400 capitalize">{today}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Buscar..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-200 bg-gray-50/80 w-52"
          />
        </div>
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          title="Cerrar sesion"
        >
          <LogOut className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-navy-DEFAULT flex items-center justify-center text-white text-sm font-bold">
          A
        </div>
      </div>
    </header>
  );
}
