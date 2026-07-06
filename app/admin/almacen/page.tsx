'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Package, AlertTriangle, TrendingDown, TrendingUp, Search, X, Filter } from 'lucide-react';
import { supabase, InventoryItem } from '@/lib/supabase';
import { enrichWarehouseItem } from '@/lib/casagrande-demo';

interface InvCategory { id: string; name: string; }

export default function AlmacenPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InvCategory[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterAlert, setFilterAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMovForm, setShowMovForm] = useState<InventoryItem | null>(null);
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
    setItems((data || []) as InventoryItem[]);
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
      ? Number(showMovForm.current_stock) + qty
      : movForm.type === 'salida'
      ? Number(showMovForm.current_stock) - qty
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

  const enrichedItems = useMemo(() => items.map(item => {
    const categoryName = item.inventory_categories?.name || categories.find(c => c.id === item.category_id)?.name || 'Sin categoria';
    const meta = enrichWarehouseItem(item, categoryName);
    return { item, meta, categoryName };
  }), [items, categories]);

  const filteredItems = useMemo(() => enrichedItems.filter(({ item, meta, categoryName }) => {
    const hay = [item.name, item.description || '', item.sku || '', item.supplier || '', categoryName, meta.brand, meta.type, meta.color, meta.presentation].join(' ').toLowerCase();
    const matchSearch = !search || hay.includes(search.toLowerCase());
    const matchCat = !filterCat || item.category_id === filterCat;
    const expired = meta.expiryDate ? new Date(meta.expiryDate).getTime() < Date.now() : false;
    const lowStock = meta.currentStock <= meta.minimumStock;
    const matchAlert = !filterAlert || lowStock || expired;
    return matchSearch && matchCat && matchAlert;
  }), [enrichedItems, search, filterCat, filterAlert]);

  const grouped = useMemo(() => filteredItems.reduce<Record<string, typeof filteredItems>>((acc, entry) => {
    const key = entry.categoryName || 'Sin categoria';
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {}), [filteredItems]);

  const alertCount = enrichedItems.filter(({ meta }) => meta.currentStock <= meta.minimumStock).length;
  const expiredCount = enrichedItems.filter(({ meta }) => meta.expiryDate && new Date(meta.expiryDate).getTime() < Date.now()).length;

  const stats = [
    { label: 'Total insumos', value: items.length, icon: Package, cls: 'bg-navy-50 text-navy' },
    { label: 'Alertas de stock', value: alertCount, icon: AlertTriangle, cls: alertCount > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400' },
    { label: 'Categorias', value: categories.length, icon: Filter, cls: 'bg-olive-50 text-olive' },
    { label: 'Vencidos', value: expiredCount, icon: TrendingDown, cls: expiredCount > 0 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Almacen e Inventario</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cards por categoria, con busqueda y trazabilidad para hotel, restaurante y catering.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-navy hover:bg-navy-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Insumo
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
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

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre, marca, SKU, sabor, envase o categoria..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white">
          <option value="">Todas las categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => setFilterAlert(!filterAlert)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${filterAlert ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <AlertTriangle className="w-4 h-4" />
          Solo alertas {alertCount > 0 && `(${alertCount})`}
        </button>
      </div>

      <div className="space-y-6">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />)
        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
            No se encontraron insumos con estos filtros.
          </div>
        ) : (
          Object.entries(grouped).map(([categoryName, entries]) => (
            <section key={categoryName} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{categoryName}</h2>
                  <p className="text-xs text-gray-500">{entries.length} producto{entries.length !== 1 ? 's' : ''} en esta categoria</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">Cards separadas por categoria</span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {entries.map(({ item, meta }) => {
                  const lowStock = meta.currentStock <= meta.minimumStock;
                  const expired = meta.expiryDate ? new Date(meta.expiryDate).getTime() < Date.now() : false;
                  return (
                    <article key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-5 border-b border-gray-50 bg-gradient-to-br from-white to-slate-50">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{categoryName}</p>
                            <h3 className="text-lg font-semibold text-gray-900 leading-tight">{item.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">SKU: {meta.sku}</p>
                          </div>
                          <div className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full ${lowStock ? 'bg-red-100 text-red-700' : expired ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {lowStock ? 'Stock bajo' : expired ? 'Vencido' : meta.state}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{meta.details}</p>
                      </div>

                      <div className="p-5 space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Marca</span><span className="font-medium text-gray-800">{meta.brand}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Tipo</span><span className="font-medium text-gray-800">{meta.type}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Sabor</span><span className="font-medium text-gray-800">{meta.flavor}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Envase</span><span className="font-medium text-gray-800">{meta.container}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Presentacion</span><span className="font-medium text-gray-800">{meta.presentation}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Color</span><span className="font-medium text-gray-800">{meta.color}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Valor</span><span className="font-medium text-gray-800">{meta.unitValue}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Cantidad usada</span><span className="font-medium text-gray-800">{meta.usedQuantityLabel}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Ingreso</span><span className="font-medium text-gray-800">{meta.entryDate}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Vencimiento</span><span className="font-medium text-gray-800">{meta.expiryDate || 'No aplica'}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Uso</span><span className="font-medium text-gray-800">{meta.useDate || 'No aplica'}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Cantidad</span><span className="font-medium text-gray-800">{meta.quantityLabel}</span></div>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Descripcion</p>
                          <p className="text-sm text-gray-600">{item.description || meta.details}</p>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {meta.tags.map(tag => <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{tag}</span>)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">Documentos</p>
                            <p>{meta.documents.join(' · ')}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">Ubicacion</p>
                            <p>{meta.location}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">Mantenimiento</p>
                            <ul className="space-y-1">
                              {meta.maintenanceHistory.map((entry, index) => <li key={`${meta.sku}-m-${index}`}>{entry}</li>)}
                            </ul>
                          </div>
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">Danos</p>
                            <ul className="space-y-1">
                              {meta.damageHistory.map((entry, index) => <li key={`${meta.sku}-d-${index}`}>{entry}</li>)}
                            </ul>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <button onClick={() => setShowMovForm(item)} className="flex items-center gap-1 text-xs text-navy hover:bg-navy-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium">
                            <TrendingUp className="w-3.5 h-3.5" /> Movimiento
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

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
                        movForm.type === t ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notas</label>
                <input type="text" value={movForm.notes} onChange={e => setMovForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  placeholder="Motivo del movimiento..." />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowMovForm(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={saveMovement} disabled={!movForm.quantity}
                className="flex-1 bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Unidad</label>
                  <input type="text" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Stock actual</label>
                  <input type="number" min="0" value={form.current_stock} onChange={e => setForm(f => ({ ...f, current_stock: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Stock minimo</label>
                  <input type="number" min="0" value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Costo unitario (S/)</label>
                  <input type="number" min="0" step="0.01" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Proveedor</label>
                  <input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ubicacion</label>
                  <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Ej: Almacen 1, Estante A"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">SKU</label>
                  <input type="text" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={saveItem} disabled={!form.name}
                className="flex-1 bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
