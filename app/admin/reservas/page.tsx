'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Eye } from 'lucide-react';
import { supabase, Reservation, ReservationStatus } from '@/lib/supabase';
import ReservationModal from '@/components/admin/ReservationModal';
import ReservationDetailModal from '@/components/admin/ReservationDetailModal';

const statusMap: Record<ReservationStatus, { label: string; cls: string }> = {
  pending:    { label: 'Pendiente',   cls: 'bg-yellow-100 text-yellow-700' },
  confirmed:  { label: 'Confirmada',  cls: 'bg-blue-100 text-blue-700' },
  checked_in: { label: 'En Casa',     cls: 'bg-green-100 text-green-700' },
  checked_out:{ label: 'Completada',  cls: 'bg-gray-100 text-gray-600' },
  cancelled:  { label: 'Cancelada',   cls: 'bg-red-100 text-red-700' },
  no_show:    { label: 'No Show',     cls: 'bg-orange-100 text-orange-700' },
};

export default function ReservasAdmin() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<Reservation | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('reservations')
      .select('*, customers(first_name, last_name, email, phone), rooms(room_number, room_types(name))')
      .order('created_at', { ascending: false });
    setReservations((data || []) as Reservation[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: ReservationStatus) {
    await supabase.from('reservations').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  const filtered = reservations.filter(r => {
    const customer = r.customers as { first_name: string; last_name: string } | undefined;
    const matchSearch = !search || (
      r.reservation_code.toLowerCase().includes(search.toLowerCase()) ||
      (customer && `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(search.toLowerCase()))
    );
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar reserva o cliente..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-200 w-64"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as ReservationStatus | 'all')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-200"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-navy-DEFAULT hover:bg-navy-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva Reserva
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Codigo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Habitacion</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-in</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-out</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">No se encontraron reservas.</td>
                </tr>
              ) : filtered.map(r => {
                const s = statusMap[r.status];
                const customer = r.customers as { first_name: string; last_name: string } | undefined;
                const room = r.rooms as { room_number: string; room_types?: { name: string } } | undefined;
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-600">{r.reservation_code}</td>
                    <td className="px-4 py-3.5 font-medium text-gray-800">
                      {customer ? `${customer.first_name} ${customer.last_name}` : 'Sin asignar'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">
                      {room ? `Hab. ${room.room_number}` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">{r.check_in}</td>
                    <td className="px-4 py-3.5 text-gray-600">{r.check_out}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-800">S/ {r.total_amount?.toFixed(0)}</td>
                    <td className="px-4 py-3.5">
                      <select
                        value={r.status}
                        onChange={e => updateStatus(r.id, e.target.value as ReservationStatus)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-navy-200 cursor-pointer ${s.cls}`}
                      >
                        {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setDetail(r)}
                        className="p-1.5 hover:bg-navy-50 text-gray-400 hover:text-navy-DEFAULT rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-50 text-xs text-gray-400">
          {filtered.length} reserva{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {showCreate && <ReservationModal onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); load(); }} />}
      {detail && <ReservationDetailModal reservation={detail} onClose={() => setDetail(null)} onUpdate={() => { setDetail(null); load(); }} />}
    </div>
  );
}
