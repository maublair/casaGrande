'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase, Room, RoomType, RoomStatus } from '@/lib/supabase';

interface Props {
  room: Room | null;
  onClose: () => void;
  onSave: () => void;
}

export default function RoomFormModal({ room, onClose, onSave }: Props) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [form, setForm] = useState({
    room_number: room?.room_number || '',
    room_type_id: room?.room_type_id || '',
    floor: room?.floor || 1,
    status: room?.status || 'available' as RoomStatus,
    price_override: room?.price_override?.toString() || '',
    notes: room?.notes || '',
    is_active: room?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('room_types').select('*').order('base_price').then(({ data }) => {
      setRoomTypes(data || []);
      if (!room && data && data.length > 0) {
        setForm(f => ({ ...f, room_type_id: f.room_type_id || data[0].id }));
      }
    });
  }, [room]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.room_number || !form.room_type_id) {
      setError('Numero y tipo de habitacion son requeridos.');
      return;
    }
    setLoading(true);
    setError('');
    const payload = {
      room_number: form.room_number,
      room_type_id: form.room_type_id,
      floor: form.floor,
      status: form.status,
      price_override: form.price_override ? Number(form.price_override) : null,
      notes: form.notes || null,
      is_active: form.is_active,
    };
    const { error: e2 } = room
      ? await supabase.from('rooms').update(payload).eq('id', room.id)
      : await supabase.from('rooms').insert(payload);
    if (e2) { setError(e2.message); setLoading(false); return; }
    onSave();
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white";
  const labelCls = "text-xs font-medium text-gray-600 block mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
          <h2 className="font-semibold text-gray-800">{room ? 'Editar Habitacion' : 'Nueva Habitacion'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Numero *</label>
              <input value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} className={inputCls} placeholder="101" required />
            </div>
            <div>
              <label className={labelCls}>Piso *</label>
              <input type="number" min={1} value={form.floor} onChange={e => setForm(f => ({ ...f, floor: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Tipo de Habitacion *</label>
            <select value={form.room_type_id} onChange={e => setForm(f => ({ ...f, room_type_id: e.target.value }))} className={inputCls}>
              {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name} (S/ {t.base_price}/noche)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Estado</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as RoomStatus }))} className={inputCls}>
                <option value="available">Disponible</option>
                <option value="occupied">Ocupada</option>
                <option value="reserved">Reservada</option>
                <option value="cleaning">Limpieza</option>
                <option value="maintenance">Mantenimiento</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Precio especial (S/)</label>
              <input type="number" value={form.price_override} onChange={e => setForm(f => ({ ...f, price_override: e.target.value }))} className={inputCls} placeholder="Dejar vacio para precio base" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Notas internas</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls + ' resize-none'} rows={2} placeholder="Observaciones..." />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-navy-DEFAULT" />
            <label htmlFor="active" className="text-sm text-gray-600 cursor-pointer">Habitacion activa (visible para reservas)</label>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-navy-DEFAULT hover:bg-navy-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
