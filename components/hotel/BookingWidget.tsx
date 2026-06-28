'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Users, Search } from 'lucide-react';

export default function BookingWidget() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ checkIn, checkOut, adults: String(adults), children: String(children) });
    router.push(`/habitaciones?${params}`);
  }

  return (
    <form onSubmit={handleSearch} className="booking-glass rounded-xl shadow-2xl p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Check-in */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-navy-700 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" /> Llegada
          </label>
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={e => {
              setCheckIn(e.target.value);
              if (e.target.value >= checkOut) {
                const d = new Date(e.target.value);
                d.setDate(d.getDate() + 1);
                setCheckOut(d.toISOString().split('T')[0]);
              }
            }}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
            required
          />
        </div>

        {/* Check-out */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-navy-700 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" /> Salida
          </label>
          <input
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={e => setCheckOut(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
            required
          />
        </div>

        {/* Huespedes */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-navy-700 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Huespedes
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col">
              <span className="text-[10px] text-gray-500 mb-1">Adultos</span>
              <select
                value={adults}
                onChange={e => setAdults(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-2 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex-1 flex flex-col">
              <span className="text-[10px] text-gray-500 mb-1">Ninos</span>
              <select
                value={children}
                onChange={e => setChildren(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-2 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
              >
                {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Buscar */}
        <div className="flex flex-col justify-end">
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-gold-DEFAULT hover:bg-gold-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-[0.98] w-full"
          >
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </div>
      </div>
    </form>
  );
}
