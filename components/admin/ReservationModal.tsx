'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase, Room, Customer, RoomType } from '@/lib/supabase';

interface Props {
  onClose: () => void;
  onSave: () => void;
}

type RoomWithType = Room & { room_types: RoomType };

export default function ReservationModal({ onClose, onSave }: Props) {
  const [rooms, setRooms] = useState<RoomWithType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({
    customer_id: '',
    room_id: '',
    check_in: '',
    check_out: '',
    adults: 2,
    children: 0,
    status: 'confirmed',
    source: 'direct',
    breakfast_included: false,
    special_requests: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('rooms').select('*, room_types(*)').eq('is_active', true).eq('status', 'available'),
      supabase.from('customers').select('*').order('first_name'),
    ]).then(([{ data: r }, { data: c }]) => {
      setRooms((r || []) as RoomWithType[]);
      setCustomers(c || []);
    });
  }, []);

  function calcTotal(): number {
    const room = rooms.find(r => r.id === form.room_id);
    if (!room || !form.check_in || !form.check_out) return 0;
    const nights = Math.max(1, Math.ceil((new Date(form.check_out).getTime() - new Date(form.check_in).getTime()) / 86400000));
    const price = room.price_override ?? room.room_types?.base_price ?? 0;
    const breakfast = form.breakfast_included ? 35 * form.adults * nights : 0;
    return price * nights + breakfast;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.room_id || !form.check_in || !form.check_out) {
      setError('Habitacion y fechas son requeridas.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.from('reservations').insert({
      customer_id: form.customer_id || null,
      room_id: form.room_id,
      check_in: form.check_in,
      check_out: form.check_out,
      adults: form.adults,
      children: form.children,
      status: form.status,
      total_amount: calcTotal(),
      paid_amount: 0,
      source: form.source,
      breakfast_included: form.breakfast_included,
      special_requests: form.special_requests || null,
      notes: form.notes || null,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    onSave();
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white";
  const labelCls = "text-xs font-medium text-gray-600 block mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
          <h2 className="font-semibold text-gray-800">Nueva Reserva</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Cliente</label>
            <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))} className={inputCls}>
              <option value="">Sin cliente asignado</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.email}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Habitacion *</label>
            <select value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))} className={inputCls} required>
              <option value="">Seleccionar habitacion</option>
              {rooms.map(r => <option key={r.id} value={r.id}>Hab. {r.room_number} — {r.room_types?.name} (S/ {r.price_override ?? r.room_types?.base_price}/noche)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Check-in *</label>
              <input type="date" value={form.check_in} onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Check-out *</label>
              <input type="date" value={form.check_out} onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Adultos</label>
              <input type="number" min={1} value={form.adults} onChange={e => setForm(f => ({ ...f, adults: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ninos</label>
              <input type="number" min={0} value={form.children} onChange={e => setForm(f => ({ ...f, children: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="checked_in">En Casa</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Canal de origen</label>
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className={inputCls}>
                <option value="direct">Directo</option>
                <option value="web">Web</option>
                <option value="phone">Telefono</option>
                <option value="email">Email</option>
                <option value="booking">Booking.com</option>
                <option value="expedia">Expedia</option>
                <option value="airbnb">Airbnb</option>
                <option value="agent">Agente</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="bf" checked={form.breakfast_included} onChange={e => setForm(f => ({ ...f, breakfast_included: e.target.checked }))} className="w-4 h-4 accent-navy" />
            <label htmlFor="bf" className="text-sm text-gray-600 cursor-pointer">Desayuno incluido (+S/ 35/persona/noche)</label>
          </div>
          <div>
            <label className={labelCls}>Solicitudes especiales</label>
            <textarea value={form.special_requests} onChange={e => setForm(f => ({ ...f, special_requests: e.target.value }))} className={inputCls + ' resize-none'} rows={2} />
          </div>

          {calcTotal() > 0 && (
            <div className="bg-navy-50 rounded-lg p-3 text-sm flex justify-between items-center">
              <span className="text-gray-600">Total estimado:</span>
              <span className="font-bold text-navy text-base">S/ {calcTotal().toFixed(0)}</span>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
              {loading ? 'Guardando...' : 'Crear Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
