'use client';

import { useEffect, useState } from 'react';
import { Plus, Package, AlertTriangle, TrendingDown, TrendingUp, Search, X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface InvCategory { id: string; name: string; }
interface InvItem {
  id: string; category_id: string | null; name: string; description: string | null;
  unit: string; current_stock: number; min_stock: number; max_stock: number | null;
  unit_cost: number | null; supplier: string | null; location: string | null; sku: string | null;
  is_active: boolean;
  inventory_categories?: { name: string };
}

export default function AlmacenPage() {
  const [items, setItems] = useState<InvItem[]>([]);
  const [categories, setCategories] = useState<InvCategory[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterAlert, setFilterAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMovForm, setShowMovForm] = useState<InvItem | null>(null);
  const [movForm, setMovForm] = useState({ type: 'entrada', quantity: '', notes: '' });
  const [form, setForm] = useState({
    category_id: '', name: '', unit: 'unidad', current_stock: '', min_stock: '',
    max_stock: '', unit_cost: '', supplier: '', location: '', sku: '',
  });

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('inventory_items')
      .select('*, inventory_categories(name)')
      .eq('is_active', true)
      .order('name');
    setItems((data || []) as InvItem[]);
    setLoading(false);
  }

  useEffect(() => {
    supabase.from('inventory_categories').select('*').order('name').then(({ data }) => setCategories(data || []));
    load();
  }, []);

  async function saveItem() {
    await supabase.from('inventory_items').insert({
      ...form,
      category_id: form.category_id || null,
      current_stock: parseFloat(form.current_stock) || 0,
      min_stock: parseFloat(form.min_stock) || 0,
      max_stock: form.max_stock ? parseFloat(form.max_stock) : null,
      unit_cost: form.unit_cost ? parseFloat(form.unit_cost) : null,
      supplier: form.supplier || null,
      location: form.location || null,
      sku: form.sku || null,
    });
    setShowForm(false);
    load();
  }

  async function saveMovement() {
    if (!showMovForm) return;
    const qty = parseFloat(movForm.quantity);
    if (!qty) return;
    const newStock = movForm.type === 'entrada'
      ? showMovForm.current_stock + qty
      : movForm.type === 'salida'
      ? showMovForm.current_stock - qty
      : qty;
    await supabase.from('inventory_movements').insert({
      item_id: showMovForm.id, type: movForm.type, quantity: qty, notes: movForm.notes || null,
    });
    await supabase.from('inventory_items').update({
      current_stock: Math.max(0, newStock),
      last_restocked_at: movForm.type === 'entrada' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    }).eq('id', showMovForm.id);
    setShowMovForm(null);
    setMovForm({ type: 'entrada', quantity: '', notes: '' });
    load();
  }

  const filtered = items.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(search.toLowerCase()) || item.sku?.includes(search);
    const matchCat = !filterCat || item.category_id === filterCat;
    const matchAlert = !filterAlert || item.current_stock <= item.min_stock;
    return matchSearch && matchCat && matchAlert;
  });

  const alertCount = items.filter(i => i.current_stock <= i.min_stock).length;

  function stockStatus(item: InvItem) {
    if (item.current_stock <= 0) return { label: 'Sin stock', cls: 'bg-red-100 text-red-700', bar: 'bg-red-500' };
    if (item.current_stock <= item.min_stock) return { label: 'Stock bajo', cls: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500' };
    return { label: 'Normal', cls: 'bg-green-100 text-green-700', bar: 'bg-green-500' };
  }

  function stockPct(item: InvItem) {
    if (!item.max_stock) return Math.min(100, (item.current_stock / (item.min_stock * 3 || 1)) * 100);
    return Math.min(100, (item.current_stock / item.max_stock) * 100);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Almacen e Inventario</h1>
          <p className="text-sm text-gray-500 mt-0.5">Control de stock y movimientos</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-navy-DEFAULT hover:bg-navy-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Insumo
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total insumos', value: items.length, icon: Package, cls: 'bg-navy-50 text-navy-DEFAULT' },
          { label: 'Alertas de stock', value: alertCount, icon: AlertTriangle, cls: alertCount > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400' },
          { label: 'Categorias', value: categories.length, icon: Package, cls: 'bg-olive-50 text-olive-DEFAULT' },
          { label: 'Sin stock', value: items.filter(i => i.current_stock <= 0).length, icon: TrendingDown, cls: 'bg-orange-50 text-orange-600' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.cls}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar insumo, proveedor, SKU..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-DEFAULT/30" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-DEFAULT/30 bg-white">
          <option value="">Todas las categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => setFilterAlert(!filterAlert)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            filterAlert ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          <AlertTriangle className="w-4 h-4" />
          Solo alertas {alertCount > 0 && `(${alertCount})`}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-100">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Insumo</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nivel</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Costo</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ubicacion</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="p-3"><div className="h-8 shimmer rounded" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-14 text-center text-gray-400">No se encontraron insumos.</td></tr>
              ) : (
                filtered.map(item => {
                  const st = stockStatus(item);
                  const pct = stockPct(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        {item.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-xs">{item.inventory_categories?.name || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-gray-800">{item.current_stock}</span>
                        <span className="text-gray-400 text-xs ml-1">{item.unit}</span>
                        <p className="text-[10px] text-gray-400 mt-0.5">Min: {item.min_stock}</p>
                      </td>
                      <td className="px-5 py-3.5 min-w-[100px]">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${st.bar} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{Math.round(pct)}%</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-xs">
                        {item.unit_cost ? `S/ ${item.unit_cost.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{item.location || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setShowMovForm(item)}
                          className="flex items-center gap-1 text-xs text-navy-DEFAULT hover:bg-navy-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium">
                          <TrendingUp className="w-3.5 h-3.5" /> Movimiento
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement modal */}
      {showMovForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Registrar Movimiento</h3>
              <button onClick={() => setShowMovForm(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="font-medium text-gray-800">{showMovForm.name}</p>
              <p className="text-sm text-gray-500">Stock actual: <strong>{showMovForm.current_stock} {showMovForm.unit}</strong></p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['entrada', 'salida', 'ajuste'] as const).map(t => (
                    <button key={t} onClick={() => setMovForm(f => ({ ...f, type: t }))}
                      className={`py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                        movForm.type === t ? 'bg-navy-DEFAULT text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Cantidad ({showMovForm.unit})
                  {movForm.type === 'ajuste' && ' — Nuevo total'}
                </label>
                <input type="number" min="0" step="0.01" value={movForm.quantity}
                  onChange={e => setMovForm(f => ({ ...f, quantity: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-DEFAULT/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notas</label>
                <input type="text" value={movForm.notes} onChange={e => setMovForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-DEFAULT/30"
                  placeholder="Motivo del movimiento..." />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowMovForm(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={saveMovement} disabled={!movForm.quantity}
                className="flex-1 bg-navy-DEFAULT hover:bg-navy-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New item modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Nuevo Insumo</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nombre *</label>
                  <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-DEFAULT/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Categoria</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-DEFAULT/30">
                    <option value="">Sin categoria</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Unidad</label>
                  <input type="text" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-DEFAULT/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Stock actual</label>
                  <input type="number" min="0" value={form.current_stock} onChange={e => setForm(f => ({ ...f, current_stock: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-DEFAULT/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Stock minimo</label>
                  <input type="number" min="0" value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-DEFAULT/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Costo unitario (S/)</label>
                  <input type="number" min="0" step="0.01" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-DEFAULT/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Proveedor</label>
                  <input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-DEFAULT/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ubicacion</label>
                  <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Ej: Almacen 1, Estante A"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-DEFAULT/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">SKU</label>
                  <input type="text" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-DEFAULT/30" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={saveItem} disabled={!form.name}
                className="flex-1 bg-navy-DEFAULT hover:bg-navy-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
