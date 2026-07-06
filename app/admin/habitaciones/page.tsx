'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Wrench, CheckCircle, BedDouble, Brush, Eye } from 'lucide-react';
import { supabase, Room, RoomType, RoomStatus } from '@/lib/supabase';
import RoomFormModal from '@/components/admin/RoomFormModal';
import RoomDetailModal from '@/components/admin/RoomDetailModal';
import { roomLegend } from '@/lib/casagrande-demo';

type RoomWithType = Room & { room_types: RoomType };

const statusConfig: Record<RoomStatus, { label: string; cls: string; icon: React.ElementType; soft: string }> = {
  available:   { label: 'Disponible',   cls: 'status-available',   icon: CheckCircle, soft: 'bg-green-50 border-green-100 text-green-700' },
  occupied:    { label: 'Ocupada',       cls: 'status-occupied',    icon: BedDouble,  soft: 'bg-red-50 border-red-100 text-red-700' },
  reserved:    { label: 'Reservada',     cls: 'status-reserved',    icon: BedDouble,  soft: 'bg-blue-50 border-blue-100 text-blue-700' },
  cleaning:    { label: 'Limpieza',      cls: 'status-cleaning',    icon: Brush,      soft: 'bg-amber-50 border-amber-100 text-amber-700' },
  maintenance: { label: 'Mantenimiento', cls: 'status-maintenance', icon: Wrench,     soft: 'bg-purple-50 border-purple-100 text-purple-700' },
};

const ALL_STATUSES = Object.entries(statusConfig) as [RoomStatus, typeof statusConfig[RoomStatus]][];

export default function HabitacionesAdmin() {
  const [rooms, setRooms] = useState<RoomWithType[]>([]);
  const [filter, setFilter] = useState<RoomStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithType | null>(null);

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
    setSelectedRoom(prev => prev && prev.id === id ? { ...prev, status } : prev);
  }

  const counts = useMemo(() => Object.fromEntries(
    Object.keys(statusConfig).map(s => [s, rooms.filter(r => r.status === s).length])
  ) as Record<RoomStatus, number>, [rooms]);

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ALL_STATUSES.map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? 'all' : key)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                filter === key ? 'border-navy bg-navy-50' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-2 text-navy" />
              <p className="text-2xl font-bold text-gray-900">{counts[key]}</p>
              <p className="text-xs text-gray-500 mt-0.5">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mapa de cuartos en vivo</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} cuarto{filtered.length !== 1 ? 's' : ''} visibles · click en cualquier cuarto para abrir su ficha completa</p>
        </div>
        <button
          onClick={() => { setEditRoom(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-navy hover:bg-navy-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva Habitacion
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Estado en vivo</p>
              <h2 className="text-lg font-semibold text-gray-900">Mapa del hotel</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setFilter(filter === key ? 'all' : key)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    filter === key ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(12)].map((_, i) => <div key={i} className="h-28 bg-gray-50 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map(room => {
                const cfg = statusConfig[room.status];
                const StatusIcon = cfg.icon;
                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`group rounded-2xl border p-4 text-left shadow-sm hover:shadow-md transition-all ${cfg.soft}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${cfg.soft}`}>
                        <StatusIcon className="w-5 h-5 text-navy" />
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{room.room_number}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{room.room_types?.name || 'Tipo no asignado'}</p>
                      </div>
                      <Eye className="w-4 h-4 text-gray-400 group-hover:text-navy transition-colors" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Piso {room.floor}{room.price_override ? ` · S/ ${room.price_override}` : ''}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">Indice de color</p>
            <div className="space-y-3">
              {roomLegend.map(item => {
                const cfg = statusConfig[item.status];
                return (
                  <div key={item.status} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <span className={`w-4 h-4 rounded-sm border mt-0.5 ${cfg.soft}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.hint}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Como funciona</p>
              <h3 className="text-lg font-semibold text-gray-900">Ficha al hacer click</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Reserva actual con huespedes y documentos.</li>
              <li>• Historial de reservas anteriores.</li>
              <li>• Inventario del cuarto y del baño por categorias.</li>
              <li>• Mantenimiento, danos y etiquetas editables.</li>
            </ul>
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              En pantallas pequenas este indice baja debajo del mapa para mantener la lectura responsiva.
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Resumen rapido</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {ALL_STATUSES.map(([key, cfg]) => (
                <div key={key} className="rounded-2xl border border-gray-100 bg-slate-50 p-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{cfg.label}</p>
                  <p className="text-xl font-bold text-gray-900">{counts[key]}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {showForm && (
        <RoomFormModal
          room={editRoom}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); load(); }}
        />
      )}

      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}
