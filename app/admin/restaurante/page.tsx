'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, UtensilsCrossed, Eye, EyeOff, Star, StarOff, X, Edit2, Trash2, ReceiptText, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MenuCategory { id: string; name: string; display_order: number; icon: string; is_active: boolean; }
interface MenuItem {
  id: string; category_id: string | null; name: string; description: string | null;
  price: number; image_url: string | null; is_available: boolean; is_featured: boolean;
  tags: string[]; prep_time_minutes: number; display_order: number;
  menu_categories?: { name: string };
}

const emptyForm = {
  category_id: '', name: '', description: '', price: '',
  image_url: '', is_available: true, is_featured: false,
  tags: '', prep_time_minutes: '15', display_order: '0',
};

const demoRecipeCharges = [
  {
    id: 'room-205', room: '205', guest: 'Ana Maria Quispe', reservation: 'CG-205-01', dish: 'Lomo saltado', amount: 58,
    status: 'Pendiente', ingredients: [
      'Papa amarilla SKU PAPA-001 · 2 kg',
      'Salsa de tomate SKU SALSA-050 · 1 lata de 50 gr',
      'Carne SKU CARNE-120 · 300 gr',
    ],
  },
  {
    id: 'room-312', room: '312', guest: 'Carlos Soto', reservation: 'CG-312-02', dish: 'Desayuno completo', amount: 32,
    status: 'Cargado', ingredients: [
      'Huevos SKU HUEVO-010 · 2 u',
      'Pan SKU PAN-020 · 4 u',
      'Jugo SKU JUGO-250 · 2 vasos',
    ],
  },
  {
    id: 'room-101', room: '101', guest: 'Valeria Bustamante', reservation: 'CG-101-03', dish: 'Pollo a la plancha', amount: 46,
    status: 'Pendiente', ingredients: [
      'Pechuga SKU POLLO-180 · 220 gr',
      'Papa amarilla SKU PAPA-001 · 1 kg',
      'Ensalada SKU MIX-01 · 1 porcion',
    ],
  },
];

const recipeReference = [
  {
    dish: 'Lomo saltado', destination: 'Restaurante', note: 'El consumo sale del almacen y luego se suma a la cuenta del huesped encargado del pago.',
  },
  {
    dish: 'Papa amarilla con salsa', destination: 'Room service', note: 'Se registra la salida exacta por receta, no por cuarto inventado.',
  },
  {
    dish: 'Menu ejecutivo', destination: 'Restaurante', note: 'El cierre consolida consumos y deja el monto listo para cargar a la reserva.',
  },
];

export default function RestauranteAdminPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [roomCharges, setRoomCharges] = useState(demoRecipeCharges);
  const [chargeForm, setChargeForm] = useState({ room: '205', guest: 'Ana Maria Quispe', reservation: 'CG-205-01', dish: 'Lomo saltado', amount: '58' });

  async function load() {
    setLoading(true);
    const [{ data: cats }, { data: menuItems }] = await Promise.all([
      supabase.from('menu_categories').select('*').order('display_order'),
      supabase.from('menu_items').select('*, menu_categories(name)').order('display_order'),
    ]);
    setCategories(cats || []);
    setItems((menuItems || []) as MenuItem[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditItem(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }

  function openEdit(item: MenuItem) {
    setEditItem(item);
    setForm({
      category_id: item.category_id || '',
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      image_url: item.image_url || '',
      is_available: item.is_available,
      is_featured: item.is_featured,
      tags: item.tags.join(', '),
      prep_time_minutes: String(item.prep_time_minutes),
      display_order: String(item.display_order),
    });
    setShowForm(true);
  }

  async function saveItem() {
    const payload = {
      category_id: form.category_id || null,
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      image_url: form.image_url || null,
      is_available: form.is_available,
      is_featured: form.is_featured,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      prep_time_minutes: parseInt(form.prep_time_minutes) || 15,
      display_order: parseInt(form.display_order) || 0,
      updated_at: new Date().toISOString(),
    };
    if (editItem) {
      await supabase.from('menu_items').update(payload).eq('id', editItem.id);
    } else {
      await supabase.from('menu_items').insert(payload);
    }
    setShowForm(false);
    load();
  }

  async function toggleAvailable(item: MenuItem) {
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !item.is_available } : i));
  }

  async function toggleFeatured(item: MenuItem) {
    await supabase.from('menu_items').update({ is_featured: !item.is_featured }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_featured: !item.is_featured } : i));
  }

  async function deleteItem(id: string) {
    if (!confirm('¿Eliminar este plato del menu?')) return;
    await supabase.from('menu_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function addCharge() {
    setRoomCharges(prev => ([
      {
        id: `room-${Date.now()}`,
        room: chargeForm.room,
        guest: chargeForm.guest,
        reservation: chargeForm.reservation,
        dish: chargeForm.dish,
        amount: Number(chargeForm.amount) || 0,
        status: 'Pendiente',
        ingredients: ['Se cargara al folio de la reserva con consumo exacto por receta.'],
      },
      ...prev,
    ]));
    setChargeForm({ room: '205', guest: 'Ana Maria Quispe', reservation: 'CG-205-01', dish: 'Lomo saltado', amount: '58' });
  }

  const filtered = useMemo(() => activeTab === 'all' ? items : items.filter(i => i.category_id === activeTab), [activeTab, items]);
  const availableCount = items.filter(i => i.is_available).length;
  const featuredCount = items.filter(i => i.is_featured).length;
  const pendingCharges = roomCharges.filter(c => c.status === 'Pendiente').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gestion del Menu</h1>
          <p className="text-sm text-gray-500 mt-0.5">Menu, pedidos a habitacion, consumos por receta y cargos a la reserva dentro del CRM.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-navy hover:bg-navy-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Plato
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Platos totales', value: items.length, icon: UtensilsCrossed, cls: 'bg-navy-50 text-navy' },
          { label: 'Disponibles', value: availableCount, icon: CheckCircle2, cls: 'bg-green-50 text-green-600' },
          { label: 'Destacados', value: featuredCount, icon: Star, cls: 'bg-gold-50 text-gold-700' },
          { label: 'Cargos pendientes', value: pendingCharges, icon: ArrowRightLeft, cls: 'bg-amber-50 text-amber-600' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.cls}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button onClick={() => setActiveTab('all')} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'all' ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Todos ({items.length})
        </button>
        {categories.map(cat => {
          const count = items.filter(i => i.category_id === cat.id).length;
          return (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === cat.id ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plato</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiempo prep.</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Disponible</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Destacado</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="p-3"><div className="h-8 shimmer rounded" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <UtensilsCrossed className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400">No hay platos en esta categoria.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${!item.is_available ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{item.menu_categories?.name || '—'}</td>
                    <td className="px-5 py-3.5 font-bold text-navy">S/ {item.price.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{item.prep_time_minutes} min</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleAvailable(item)} className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${item.is_available ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {item.is_available ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {item.is_available ? 'Si' : 'No'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleFeatured(item)} className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${item.is_featured ? 'bg-gold-100 text-gold-700 hover:bg-gold-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {item.is_featured ? <Star className="w-3 h-3 fill-current" /> : <StarOff className="w-3 h-3" />}
                        {item.is_featured ? 'Si' : 'No'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-navy-50 text-gray-400 hover:text-navy rounded-lg transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] items-start">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">CRM restaurante</p>
              <h2 className="text-lg font-semibold text-gray-900">Consumos y cargos a reserva</h2>
            </div>
            <ReceiptText className="w-5 h-5 text-navy" />
          </div>
          <div className="space-y-3">
            {roomCharges.map(charge => (
              <div key={charge.id} className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{charge.dish}</p>
                    <p className="text-xs text-gray-500">Hab. {charge.room} · {charge.guest} · {charge.reservation}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full ${charge.status === 'Cargado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{charge.status}</span>
                    <span className="font-bold text-navy">S/ {charge.amount.toFixed(2)}</span>
                  </div>
                </div>
                <ul className="space-y-1 text-xs text-gray-600 mb-3">
                  {charge.ingredients.map((ingredient, index) => <li key={`${charge.id}-${index}`}>• {ingredient}</li>)}
                </ul>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Destino: restaurante / room service</span>
                  <button className="text-navy font-semibold hover:underline" onClick={() => setChargeForm({ room: charge.room, guest: charge.guest, reservation: charge.reservation, dish: charge.dish, amount: String(charge.amount) })}>
                    Usar como base
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Nueva carga</p>
              <h2 className="text-lg font-semibold text-gray-900">Agregar pedido a la reserva</h2>
            </div>
            <Plus className="w-5 h-5 text-navy" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Habitacion</label>
              <input value={chargeForm.room} onChange={e => setChargeForm(f => ({ ...f, room: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Huesped</label>
              <input value={chargeForm.guest} onChange={e => setChargeForm(f => ({ ...f, guest: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reserva</label>
              <input value={chargeForm.reservation} onChange={e => setChargeForm(f => ({ ...f, reservation: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Plato</label>
              <input value={chargeForm.dish} onChange={e => setChargeForm(f => ({ ...f, dish: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Monto (S/)</label>
              <input type="number" value={chargeForm.amount} onChange={e => setChargeForm(f => ({ ...f, amount: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy/30" />
            </div>
          </div>
          <button onClick={addCharge} className="w-full bg-navy hover:bg-navy-700 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Cargar a la reserva
          </button>

          <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">Ejemplos de consumo por receta</p>
            <div className="space-y-3">
              {recipeReference.map(recipe => (
                <div key={recipe.dish} className="rounded-xl bg-white border border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-gray-900">{recipe.dish}</p>
                    <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">Destino: {recipe.destination}</p>
                  <p className="text-xs text-gray-500 mt-1">{recipe.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{editItem ? 'Editar Plato' : 'Nuevo Plato'}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nombre *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Categoria</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
                    <option value="">Sin categoria</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Descripcion</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Precio (S/)</label>
                  <input type="number" min="0" step="0.5" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Prep. (min)</label>
                  <input type="number" min="1" value={form.prep_time_minutes} onChange={e => setForm(f => ({ ...f, prep_time_minutes: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Orden</label>
                  <input type="number" min="0" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">URL de imagen</label>
                <input type="url" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tags (separados por coma)</label>
                <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  placeholder="vegetariano, sin gluten, picante..." />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))}
                    className="w-4 h-4 accent-navy" />
                  <span className="text-sm text-gray-700 font-medium">Disponible</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                    className="w-4 h-4 accent-gold" />
                  <span className="text-sm text-gray-700 font-medium">Destacado</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={saveItem} disabled={!form.name || !form.price}
                className="flex-1 bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
                {editItem ? 'Guardar cambios' : 'Agregar al menu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
