'use client';

import { useEffect, useState } from 'react';
import { supabase, RoomType } from '@/lib/supabase';
import { Save, Plus, Trash2, Image as ImageIcon, Check, Loader2, BedDouble, LayoutPanelTop } from 'lucide-react';

interface Setting { key: string; value: string | null; description: string | null }

export default function ContenidoPage() {
  const [tab, setTab] = useState<'rooms' | 'site'>('rooms');
  const [types, setTypes] = useState<RoomType[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase.from('room_types').select('*').order('base_price'),
      supabase.from('hotel_settings').select('key,value,description').order('key'),
    ]);
    setTypes((t || []) as RoomType[]);
    setSettings((s || []) as Setting[]);
    setLoading(false);
  }

  function flash(k: string) { setSavedKey(k); setTimeout(() => setSavedKey(c => (c === k ? null : c)), 1800); }

  // ---------- Habitaciones (room_types) ----------
  function patchType(id: string, patch: Partial<RoomType>) {
    setTypes(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  }
  async function saveType(t: RoomType) {
    await supabase.from('room_types').update({
      name: t.name, description: t.description, base_price: Number(t.base_price),
      capacity: Number(t.capacity), amenities: t.amenities, images: t.images,
    }).eq('id', t.id);
    flash(t.id);
  }
  async function addType() {
    const { data } = await supabase.from('room_types')
      .insert({ name: 'Nueva habitacion', description: '', base_price: 0, capacity: 2, amenities: [], images: [] })
      .select('*').single();
    if (data) setTypes(prev => [...prev, data as RoomType]);
  }
  async function removeType(id: string) {
    if (!confirm('¿Eliminar este tipo de habitacion?')) return;
    await supabase.from('room_types').delete().eq('id', id);
    setTypes(prev => prev.filter(t => t.id !== id));
  }

  // ---------- Contenido del sitio (hotel_settings) ----------
  function patchSetting(key: string, value: string) {
    setSettings(prev => prev.map(s => (s.key === key ? { ...s, value } : s)));
  }
  async function saveSettings() {
    await Promise.all(settings.map(s =>
      supabase.from('hotel_settings').update({ value: s.value, updated_at: new Date().toISOString() }).eq('key', s.key)
    ));
    flash('__site__');
  }

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 text-navy animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-navy-900">Contenido del sitio (CMS)</h1>
        <p className="text-sm text-gray-500 mt-1">Edita las habitaciones, precios, descripciones, imagenes y los textos de la web publica.</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('rooms')} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'rooms' ? 'bg-navy text-white' : 'bg-white text-navy-700 border border-gray-200 hover:bg-navy-50'}`}>
          <BedDouble className="w-4 h-4" /> Habitaciones
        </button>
        <button onClick={() => setTab('site')} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'site' ? 'bg-navy text-white' : 'bg-white text-navy-700 border border-gray-200 hover:bg-navy-50'}`}>
          <LayoutPanelTop className="w-4 h-4" /> Textos del sitio
        </button>
      </div>

      {tab === 'rooms' && (
        <div className="space-y-5">
          {types.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre</label>
                  <input value={t.name} onChange={e => patchType(t.id, { name: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Precio (S/)</label>
                    <input type="number" value={t.base_price} onChange={e => patchType(t.id, { base_price: Number(e.target.value) as never })}
                      className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Capacidad</label>
                    <input type="number" value={t.capacity} onChange={e => patchType(t.id, { capacity: Number(e.target.value) as never })}
                      className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300" />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Descripcion</label>
                <textarea value={t.description || ''} onChange={e => patchType(t.id, { description: e.target.value })} rows={2}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300 resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amenidades (una por linea)</label>
                  <textarea value={(t.amenities || []).join('\n')} onChange={e => patchType(t.id, { amenities: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) })} rows={4}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300 resize-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> Imagenes (URLs, una por linea)</label>
                  <textarea value={(t.images || []).join('\n')} onChange={e => patchType(t.id, { images: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) })} rows={4}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300 resize-none" />
                  <div className="flex gap-2 mt-2">
                    {(t.images || []).slice(0, 4).map((u, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={u} alt="" className="w-12 h-12 rounded-md object-cover border border-gray-200" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => removeType(t.id)} className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-600 text-sm">
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
                <button onClick={() => saveType(t)} className="inline-flex items-center gap-2 bg-gold hover:bg-gold-600 text-navy-900 font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
                  {savedKey === t.id ? <><Check className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> Guardar</>}
                </button>
              </div>
            </div>
          ))}
          <button onClick={addType} className="inline-flex items-center gap-2 text-navy-700 border border-dashed border-navy-300 rounded-xl px-5 py-3 text-sm hover:bg-navy-50 transition-colors w-full justify-center">
            <Plus className="w-4 h-4" /> Agregar tipo de habitacion
          </button>
        </div>
      )}

      {tab === 'site' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {settings.map(s => (
              <div key={s.key} className={s.key.includes('text') || s.key.includes('about') ? 'md:col-span-2' : ''}>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.description || s.key}</label>
                {(s.value || '').length > 70 ? (
                  <textarea value={s.value || ''} onChange={e => patchSetting(s.key, e.target.value)} rows={3}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300 resize-none" />
                ) : (
                  <input value={s.value || ''} onChange={e => patchSetting(s.key, e.target.value)}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300" />
                )}
                <p className="text-[11px] text-gray-400 mt-1">{s.key}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
            <button onClick={saveSettings} className="inline-flex items-center gap-2 bg-gold hover:bg-gold-600 text-navy-900 font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
              {savedKey === '__site__' ? <><Check className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> Guardar contenido</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
