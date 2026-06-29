'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Wrench, CheckCircle, BedDouble, AlertTriangle, Brush } from 'lucide-react';
import { supabase, Room, RoomType, RoomStatus } from '@/lib/supabase';
import RoomFormModal from '@/components/admin/RoomFormModal';

type RoomWithType = Room & { room_types: RoomType };

const statusConfig: Record<RoomStatus, { label: string; cls: string; icon: React.ElementType }> = {
  available:   { label: 'Disponible',   cls: 'status-available',   icon: CheckCircle },
  occupied:    { label: 'Ocupada',       cls: 'status-occupied',    icon: BedDouble },
  reserved:    { label: 'Reservada',     cls: 'status-reserved',    icon: BedDouble },
  cleaning:    { label: 'Limpieza',      cls: 'status-cleaning',    icon: Brush },
  maintenance: { label: 'Mantenimiento', cls: 'status-maintenance', icon: Wrench },
};

const ALL_STATUSES = Object.entries(statusConfig) as [RoomStatus, typeof statusConfig[RoomStatus]][];

export default function HabitacionesAdmin() {
  const [rooms, setRooms] = useState<RoomWithType[]>([]);
  const [filter, setFilter] = useState<RoomStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('rooms')
      .select('*, room_types(*)')
      .order('room_number');
    setRooms((data || []) as RoomWithType[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: RoomStatus) {
    await supabase.from('rooms').update({ status }).eq('id', id);
    setRooms(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  const counts = Object.fromEntries(
    Object.keys(statusConfig).map(s => [s, rooms.filter(r => r.status === s).length])
  ) as Record<RoomStatus, number>;

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ALL_STATUSES.map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? 'all' : key)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              filter === key ? 'border-navy bg-navy-50' : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <cfg.icon className="w-5 h-5 mb-2 text-navy" />
            <p className="text-2xl font-bold text-gray-900">{counts[key]}</p>
            <p className="text-xs text-gray-500 mt-0.5">{cfg.label}</p>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{filtered.length} habitacion{filtered.length !== 1 ? 'es' : ''}</p>
        <button
          onClick={() => { setEditRoom(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-navy hover:bg-navy-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva Habitacion
        </button>
      </div>

      {/* Room grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(room => {
            const cfg = statusConfig[room.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={room.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center text-navy font-bold text-lg">
                      {room.room_number}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="font-medium text-gray-800 text-sm mt-2">{room.room_types?.name || '—'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Piso {room.floor}</p>
                  {room.price_override && (
                    <p className="text-xs text-gold-600 mt-0.5">Precio: S/ {room.price_override}</p>
                  )}
                </div>
                <div className="border-t border-gray-50 p-2 flex gap-1">
                  <button
                    onClick={() => { setEditRoom(room); setShowForm(true); }}
                    className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-navy hover:bg-navy-50 py-1.5 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <select
                    value={room.status}
                    onChange={e => updateStatus(room.id, e.target.value as RoomStatus)}
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-1 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-navy-300 bg-white"
                  >
                    {ALL_STATUSES.map(([key, c]) => (
                      <option key={key} value={key}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <RoomFormModal
          room={editRoom}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}
