'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, BedDouble, ClipboardList, Wrench, ShieldCheck, Plus, FileText, AlertTriangle, ChevronRight } from 'lucide-react';
import { Room, RoomStatus } from '@/lib/supabase';
import { buildRoomProfile, DemoRoomProfile, roomLegend } from '@/lib/casagrande-demo';

interface Props {
  room: (Room & { room_types?: { name: string } }) | null;
  onClose: () => void;
  onUpdate?: () => void;
}

const statusMeta: Record<RoomStatus, { label: string; cls: string }> = {
  available: { label: 'Disponible', cls: 'bg-green-100 text-green-700' },
  occupied: { label: 'Ocupada', cls: 'bg-red-100 text-red-700' },
  reserved: { label: 'Reservada', cls: 'bg-blue-100 text-blue-700' },
  cleaning: { label: 'Limpieza', cls: 'bg-amber-100 text-amber-700' },
  maintenance: { label: 'Mantenimiento', cls: 'bg-purple-100 text-purple-700' },
};

type NoteType = 'maintenance' | 'damage' | 'status' | 'tag';

export default function RoomDetailModal({ room, onClose }: Props) {
  const [profile, setProfile] = useState<DemoRoomProfile | null>(null);
  const [noteType, setNoteType] = useState<NoteType>('maintenance');
  const [noteText, setNoteText] = useState('');
  const [targetKey, setTargetKey] = useState('');

  useEffect(() => {
    if (!room) return;
    const nextProfile = buildRoomProfile(room.room_number, room.status);
    setProfile(nextProfile);
    const firstAsset = nextProfile.inventory[0]?.items[0];
    setTargetKey(firstAsset ? `${nextProfile.inventory[0].category}:${firstAsset.serial}` : '');
    setNoteText('');
    setNoteType('maintenance');
  }, [room]);

  const allAssets = useMemo(() => {
    return profile?.inventory.flatMap(group => group.items.map(item => ({
      group: group.category,
      item,
      key: `${group.category}:${item.serial}`,
    }))) || [];
  }, [profile]);

  if (!room || !profile) return null;

  const status = statusMeta[room.status];
  const currentAsset = allAssets.find(entry => entry.key === targetKey) || allAssets[0];

  function appendDetail() {
    if (!currentAsset || !noteText.trim()) return;
    setProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        inventory: prev.inventory.map(group => ({
          ...group,
          items: group.items.map(item => {
            const key = `${group.category}:${item.serial}`;
            if (key !== currentAsset.key) return item;
            const text = `${new Date('2026-07-06T00:00:00.000Z').toISOString().split('T')[0]}: ${noteText.trim()}`;
            return {
              ...item,
              state: noteType === 'status' ? noteText.trim() : item.state,
              tags: noteType === 'tag' ? Array.from(new Set([...item.tags, noteText.trim()])) : item.tags,
              maintenanceHistory: noteType === 'maintenance' ? [...item.maintenanceHistory, text] : item.maintenanceHistory,
              damageHistory: noteType === 'damage' ? [...item.damageHistory, text] : item.damageHistory,
            };
          }),
        })),
      };
    });
    setNoteText('');
  }

  const reservation = profile.currentReservation;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center p-0 lg:p-4 overflow-y-auto">
      <div className="bg-white w-full lg:max-w-6xl lg:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-white to-slate-50">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-navy">Ficha de cuarto</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.cls}`}>{status.label}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Hab. {room.room_number}</h2>
            <p className="text-sm text-gray-500 mt-1">{room.room_types?.name || 'Tipo no asignado'} · Piso {room.floor} · {profile.summary}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-0 overflow-hidden flex-1 min-h-0">
          <div className="p-6 space-y-4 overflow-y-auto border-r border-gray-100 bg-slate-50/40">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <BedDouble className="w-5 h-5 text-navy mb-2" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Estado</p>
                <p className="font-semibold text-gray-900">{status.label}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <ClipboardList className="w-5 h-5 text-olive mb-2" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Historial</p>
                <p className="font-semibold text-gray-900">{profile.reservationHistory.length} reservas</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <Wrench className="w-5 h-5 text-purple-600 mb-2" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Activos</p>
                <p className="font-semibold text-gray-900">{profile.inventory.reduce((sum, g) => sum + g.items.length, 0)} fichas</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-amber-600 mb-2" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Etiquetas</p>
                <p className="font-semibold text-gray-900">{profile.tags.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Reserva actual</p>
                  <h3 className="text-lg font-semibold text-gray-900">Estado en vivo</h3>
                </div>
                {reservation ? (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-navy-50 text-navy">{reservation.code}</span>
                ) : (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Sin reserva</span>
                )}
              </div>

              {reservation ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <p className="text-xs uppercase tracking-wider text-gray-400">Llegada</p>
                      <p className="font-medium text-gray-800">{reservation.checkIn}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <p className="text-xs uppercase tracking-wider text-gray-400">Salida</p>
                      <p className="font-medium text-gray-800">{reservation.checkOut}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <p className="text-xs uppercase tracking-wider text-gray-400">Total</p>
                      <p className="font-medium text-gray-800">{reservation.total}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <p className="text-xs uppercase tracking-wider text-gray-400">Pagado</p>
                      <p className="font-medium text-gray-800">{reservation.paid}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Manifiesto de huéspedes</p>
                    <div className="grid gap-3">
                      {reservation.guests.map((guest, index) => (
                        <div key={`${guest.fullName}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="font-medium text-gray-800">{guest.fullName}</p>
                            {guest.isMain && <span className="text-[10px] uppercase tracking-wider font-semibold bg-navy-50 text-navy px-2 py-1 rounded-full">Principal</span>}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                            <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Documento</span><span>{guest.documentType}</span></div>
                            <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Numero</span><span>{guest.documentNumber}</span></div>
                            <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Nacionalidad</span><span>{guest.nationality}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Observaciones</p>
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900/90">{reservation.notes}</div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                  Este cuarto no tiene reserva activa. El mapa conserva el historial y el inventario para control operativo.
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Historial</p>
                  <h3 className="text-lg font-semibold text-gray-900">Reservas anteriores</h3>
                </div>
                <FileText className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                {profile.reservationHistory.map(entry => (
                  <div key={entry.code} className="rounded-xl border border-gray-100 p-3 bg-slate-50/80">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-gray-800">{entry.guest}</p>
                      <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full bg-white text-gray-500 border border-gray-100">{entry.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>{entry.code}</span>
                      <span>{entry.checkIn} → {entry.checkOut}</span>
                      <span>{entry.total}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {entry.guests.map((guest, index) => (
                        <span key={`${entry.code}-${index}`} className="text-[10px] bg-white border border-gray-100 px-2 py-1 rounded-full text-gray-500">
                          {guest.fullName} · {guest.documentType} {guest.documentNumber}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Inventario completo</p>
                  <h3 className="text-lg font-semibold text-gray-900">Cuarto y baño por categorias</h3>
                </div>
                <ClipboardList className="w-4 h-4 text-gray-400" />
              </div>

              <div className="space-y-5">
                {profile.inventory.map(group => (
                  <div key={group.category} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">{group.category}</p>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">{group.items.length} activos</span>
                    </div>
                    <div className="grid gap-3">
                      {group.items.map(item => (
                        <div key={item.serial} className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="font-semibold text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.brand} · {item.type}</p>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-white text-gray-500 border border-gray-100">{item.state}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Serie</span><span>{item.serial}</span></div>
                            <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Adquisicion</span><span>{item.acquisitionYear}</span></div>
                            <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Detalles</span><span>{item.details}</span></div>
                            <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Descripcion</span><span>{item.description}</span></div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {item.tags.map(tag => (
                              <span key={tag} className="text-[10px] bg-white border border-gray-100 px-2 py-1 rounded-full text-gray-500">{tag}</span>
                            ))}
                          </div>
                          <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-gray-600 sm:grid-cols-2">
                            <div>
                              <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">Historial de mantenimiento</p>
                              <ul className="space-y-1">
                                {item.maintenanceHistory.map((entry, index) => <li key={`${item.serial}-m-${index}`}>{entry}</li>)}
                              </ul>
                            </div>
                            <div>
                              <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">Historial de daños</p>
                              <ul className="space-y-1">
                                {item.damageHistory.map((entry, index) => <li key={`${item.serial}-d-${index}`}>{entry}</li>)}
                              </ul>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Documentos</span><span>{item.documents.join(' · ')}</span></div>
                            <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Accion sugerida</span><span>{item.state.includes('Necesita') ? 'Crear orden de mantenimiento' : 'Listo para inspeccion'}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Agregar detalle</p>
                  <h3 className="text-lg font-semibold text-gray-900">Mantenimiento, daño o etiqueta</h3>
                </div>
                <Plus className="w-4 h-4 text-navy" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={targetKey} onChange={e => setTargetKey(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white">
                  {allAssets.map(entry => <option key={entry.key} value={entry.key}>{entry.group} · {entry.item.name}</option>)}
                </select>
                <select value={noteType} onChange={e => setNoteType(e.target.value as NoteType)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white">
                  <option value="maintenance">Historial de mantenimiento</option>
                  <option value="damage">Historial de daño</option>
                  <option value="status">Cambiar estado</option>
                  <option value="tag">Agregar etiqueta</option>
                </select>
              </div>
              <div className="mt-3 flex gap-2">
                <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Ej: 2026-07-06: cambio de griferia y prueba de caudal" className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                <button onClick={appendDetail} className="bg-navy hover:bg-navy-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" /> Agregar
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">El cambio queda en la ficha de la sesion y mantiene trazabilidad operativa para la demo.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">Etiquetas del cuarto</p>
              <div className="flex flex-wrap gap-2">
                {profile.tags.map(tag => <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">{tag}</span>)}
              </div>
              {profile.alerts.length > 0 && (
                <div className="mt-4 space-y-2">
                  {profile.alerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900/90">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {roomLegend.map(item => (
                  <span key={item.status} className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-gray-500">
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
