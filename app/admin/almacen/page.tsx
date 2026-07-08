'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Package, AlertTriangle, TrendingDown, TrendingUp, Search, X, Filter, BadgeInfo, ArrowUpDown } from 'lucide-react';
import { supabase, InventoryItem } from '@/lib/supabase';
import { enrichWarehouseItem } from '@/lib/casagrande-demo';
import InventoryDetailModal from '@/components/admin/InventoryDetailModal';

interface InvCategory { id: string; name: string; }

export default function AlmacenPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InvCategory[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterAlert, setFilterAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showMovForm, setShowMovForm] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [sortKey, setSortKey] = useState<'name' | 'stock' | 'sku' | 'category'>('category');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [movForm, setMovForm] = useState({ type: 'entrada', quantity: '', notes: '', reference: '', documentType: 'Factura', documentNumber: '', purpose: 'Reposicion', warehouse: '', returnRef: '', fileAttached: '' });
  const [form, setForm] = useState({
    category_id: '', name: '', unit: 'unidad', current_stock: '', min_stock: '',
    max_stock: '', unit_cost: '', supplier: '', location: '', sku: '',
    brand: '', color: '', presentation: '', size: '', weight: '', volume: '', warehouse: '', frequency: 'Diario', is_essential: false
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
    const extraDetails = {
      brand: form.brand || '',
      color: form.color || '',
      presentation: form.presentation || '',
      size: form.size || '',
      weight: form.weight || '',
      volume: form.volume || '',
      warehouse: form.warehouse || '',
      frequency: form.frequency || '',
      is_essential: form.is_essential || false
    };

    await supabase.from('inventory_items').insert({
      category_id: form.category_id || null,
      name: form.name,
      unit: form.unit,
      current_stock: parseFloat(form.current_stock) || 0,
      min_stock: parseFloat(form.min_stock) || 0,
      max_stock: form.max_stock ? parseFloat(form.max_stock) : null,
      unit_cost: form.unit_cost ? parseFloat(form.unit_cost) : null,
      supplier: form.supplier || null,
      location: form.location || null,
      sku: form.sku || null,
      description: JSON.stringify(extraDetails),
    });

    setShowForm(false);
    setForm({
      category_id: '', name: '', unit: 'unidad', current_stock: '', min_stock: '',
      max_stock: '', unit_cost: '', supplier: '', location: '', sku: '',
      brand: '', color: '', presentation: '', size: '', weight: '', volume: '', warehouse: '', frequency: 'Diario', is_essential: false
    });
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
    
    const docRef = movForm.documentNumber 
      ? `${movForm.documentType} ${movForm.documentNumber}${movForm.returnRef ? ` (Ref Dev: ${movForm.returnRef})` : ''}` 
      : movForm.reference;

    await supabase.from('inventory_movements').insert({
      item_id: showMovForm.id,
      type: movForm.type,
      quantity: qty,
      notes: movForm.notes || null,
      reference: docRef || null,
    });

    await supabase.from('inventory_items').update({
      current_stock: Math.max(0, newStock),
      last_restocked_at: movForm.type === 'entrada' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    }).eq('id', showMovForm.id);

    setShowMovForm(null);
    setMovForm({ type: 'entrada', quantity: '', notes: '', reference: '', documentType: 'Factura', documentNumber: '', purpose: 'Reposicion', warehouse: '', returnRef: '', fileAttached: '' });
    load();
  }

  const enrichedItems = useMemo(() => items.map(item => {
    const categoryName = item.inventory_categories?.name || categories.find(c => c.id === item.category_id)?.name || 'Sin categoria';
    const meta = enrichWarehouseItem(item, categoryName);
    return { item, meta, categoryName };
  }), [items, categories]);

  const filteredItems = useMemo(() => enrichedItems.filter(({ item, meta, categoryName }) => {
    const hay = [item.name, item.description || '', item.sku || '', item.supplier || '', categoryName, meta.brand, meta.type, meta.color, meta.presentation, meta.warehouse, meta.frequency].join(' ').toLowerCase();
    const matchSearch = !search || hay.includes(search.toLowerCase());
    const matchCat = !filterCat || item.category_id === filterCat;
    const expired = meta.expiryDate ? new Date(meta.expiryDate).getTime() < Date.now() : false;
    const lowStock = meta.currentStock <= meta.minimumStock;
    const matchAlert = !filterAlert || lowStock || expired;
    return matchSearch && matchCat && matchAlert;
  }), [enrichedItems, search, filterCat, filterAlert]);

  const sortedItems = useMemo(() => [...filteredItems].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'stock') return (a.meta.currentStock - b.meta.currentStock) * dir;
    if (sortKey === 'sku') return (a.meta.sku || '').localeCompare(b.meta.sku || '') * dir;
    if (sortKey === 'name') return a.item.name.localeCompare(b.item.name) * dir;
    return a.categoryName.localeCompare(b.categoryName) * dir;
  }), [filteredItems, sortKey, sortDir]);

  const grouped = useMemo(() => sortedItems.reduce<Record<string, typeof sortedItems>>((acc, entry) => {
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

  const categorySummary = useMemo(() => categories.map(category => {
    const entries = enrichedItems.filter(entry => entry.item.category_id === category.id);
    const low = entries.filter(({ meta }) => meta.currentStock <= meta.minimumStock).length;
    return { category, count: entries.length, low };
  }), [categories, enrichedItems]);

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

      {/* Alert Notifications for Essential / High-Frequency Low Stock */}
      {enrichedItems.some(({ meta }) => meta.currentStock <= meta.minimumStock && (meta.is_essential || meta.frequency === 'Diario')) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-sm text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Notificación de Stock Crítico (Administrador)</p>
            <p className="text-red-700 mt-1">Los siguientes insumos de uso diario o imprescindibles están bajo el stock mínimo:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {enrichedItems
                .filter(({ meta }) => meta.currentStock <= meta.minimumStock && (meta.is_essential || meta.frequency === 'Diario'))
                .map(({ item, meta }) => (
                  <li key={item.id}>
                    <strong>{item.name}</strong> (SKU: {meta.sku}) — Stock actual: {meta.currentStock} {item.unit} (Mínimo: {meta.minimumStock} {item.unit})
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categorySummary.map(({ category, count, low }) => (
          <button key={category.id} onClick={() => setFilterCat(category.id === filterCat ? '' : category.id)} className={`text-left bg-white rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${filterCat === category.id ? 'border-navy-200 ring-2 ring-navy-100' : 'border-gray-100'}`}>
            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Categoria</p>
            <p className="font-semibold text-gray-900 mt-1 truncate">{category.name}</p>
            <p className="text-xs text-gray-500 mt-2">{count} items · {low} bajo stock</p>
          </button>
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
        <select value={sortKey} onChange={e => setSortKey(e.target.value as 'name' | 'stock' | 'sku' | 'category')} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white">
          <option value="category">Orden: categoria</option>
          <option value="name">Orden: nombre</option>
          <option value="stock">Orden: stock</option>
          <option value="sku">Orden: SKU</option>
        </select>
        <button onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
          <ArrowUpDown className="w-4 h-4" /> {sortDir === 'asc' ? 'Ascendente' : 'Descendente'}
        </button>
        <button onClick={() => setFilterAlert(!filterAlert)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${filterAlert ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <AlertTriangle className="w-4 h-4" />
          Solo alertas {alertCount > 0 && `(${alertCount})`}
        </button>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-navy text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            Tarjetas
          </button>
          <button onClick={() => setViewMode('table')} className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${viewMode === 'table' ? 'bg-navy text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            Tabla
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />)
        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
            No se encontraron insumos con estos filtros.
          </div>
        ) : viewMode === 'grid' ? (
          Object.entries(grouped).map(([categoryName, entries]) => (
            <section key={categoryName} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{categoryName}</h2>
                  <p className="text-xs text-gray-500">{entries.length} producto{entries.length !== 1 ? 's' : ''} en esta categoria</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">Cards por categoria</span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {entries.map(({ item, meta }) => {
                  const lowStock = meta.currentStock <= meta.minimumStock;
                  const expired = meta.expiryDate ? new Date(meta.expiryDate).getTime() < Date.now() : false;
                  return (
                    <article key={item.id} onClick={() => setSelectedItem(item)} className="cursor-pointer bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-5 border-b border-gray-50 bg-gradient-to-br from-white to-slate-50">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{categoryName}</p>
                            <h3 className="text-lg font-semibold text-gray-900 leading-tight">{item.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">SKU: {meta.sku} {meta.is_essential && <span className="text-red-500 text-[10px] font-bold ml-1.5">(Imprescindible)</span>}</p>
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
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Tamano</span><span className="font-medium text-gray-800">{meta.size || 'Variable'}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Peso / Litros</span><span className="font-medium text-gray-800">{meta.weight || '—'} · {meta.volume || '—'}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Valor</span><span className="font-medium text-gray-800">{meta.unitValue}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Cantidad usada</span><span className="font-medium text-gray-800">{meta.usedQuantityLabel}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Ingreso</span><span className="font-medium text-gray-800">{meta.entryDate}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Vencimiento</span><span className="font-medium text-gray-800">{meta.expiryDate || 'No aplica'}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Uso</span><span className="font-medium text-gray-800">{meta.useDate || 'No aplica'}</span></div>
                          <div><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Cantidad</span><span className="font-medium text-gray-800">{meta.quantityLabel}</span></div>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Descripcion</p>
                          <p className="text-sm text-gray-600">{item.description && item.description.startsWith('{') ? meta.details : (item.description || meta.details)}</p>
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
                            <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">Almacen</p>
                            <p>{meta.warehouse || 'Almacen general'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">Frecuencia</p>
                            <p>{meta.frequency || 'Mensual'}</p>
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
                          <button onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }} className="flex items-center gap-1 text-xs text-gray-600 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors font-medium">
                            <BadgeInfo className="w-3.5 h-3.5" /> Ficha
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setShowMovForm(item); }} className="flex items-center gap-1 text-xs text-navy hover:bg-navy-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium">
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
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => { setSortKey('name'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Insumo</th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => { setSortKey('sku'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>SKU</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Marca</th>
                    <th className="px-4 py-3">Presentación</th>
                    <th className="px-4 py-3">Color</th>
                    <th className="px-4 py-3">Tamaño</th>
                    <th className="px-4 py-3">Peso</th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => { setSortKey('stock'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Stock</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedItems.map(({ item, meta, categoryName }) => {
                    const lowStock = meta.currentStock <= meta.minimumStock;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedItem(item)}>
                        <td className="px-4 py-4 font-semibold text-gray-900">{item.name}</td>
                        <td className="px-4 py-4 text-gray-500 text-xs">{meta.sku}</td>
                        <td className="px-4 py-4 text-gray-600">{categoryName}</td>
                        <td className="px-4 py-4 text-gray-600">{meta.brand}</td>
                        <td className="px-4 py-4 text-gray-600">{meta.presentation}</td>
                        <td className="px-4 py-4 text-gray-600">{meta.color}</td>
                        <td className="px-4 py-4 text-gray-600">{meta.size || 'Variable'}</td>
                        <td className="px-4 py-4 text-gray-600">{meta.weight || '—'}</td>
                        <td className="px-4 py-4">
                          <span className={`font-bold px-2 py-1 rounded text-xs ${lowStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {item.current_stock} {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <button onClick={() => { setSelectedItem(item); }} className="text-xs text-gray-600 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors font-medium">Ficha</button>
                            <button onClick={() => { setShowMovForm(item); }} className="text-xs text-navy hover:bg-navy-50 px-2.5 py-1.5 rounded-lg transition-colors font-semibold">Movimiento</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedItem && (() => {
        const categoryName = selectedItem.inventory_categories?.name || categories.find(c => c.id === selectedItem.category_id)?.name || 'Sin categoria';
        const meta = enrichWarehouseItem(selectedItem, categoryName);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Ficha de inventario</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{selectedItem.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{categoryName} · SKU {meta.sku}</p>
                </div>
                <button onClick={() => setSelectedItem(null)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50">
                <div className="grid lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Marca</span><p className="font-medium text-gray-800 mt-1">{meta.brand}</p></div>
                      <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Tipo</span><p className="font-medium text-gray-800 mt-1">{meta.type}</p></div>
                      <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Presentacion</span><p className="font-medium text-gray-800 mt-1">{meta.presentation}</p></div>
                      <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Color</span><p className="font-medium text-gray-800 mt-1">{meta.color}</p></div>
                      <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Tamano</span><p className="font-medium text-gray-800 mt-1">{meta.size || 'Variable'}</p></div>
                      <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Peso</span><p className="font-medium text-gray-800 mt-1">{meta.weight || '—'}</p></div>
                      <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Litros / gramos</span><p className="font-medium text-gray-800 mt-1">{meta.volume || '—'}</p></div>
                      <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Almacen</span><p className="font-medium text-gray-800 mt-1">{meta.warehouse || 'General'}</p></div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 text-sm mt-4">
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                        <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Stock y rotacion</p>
                        <p className="text-gray-700">Cantidad: <strong>{meta.quantityLabel}</strong></p>
                        <p className="text-gray-700">Usado: <strong>{meta.usedQuantityLabel}</strong></p>
                        <p className="text-gray-700">Frecuencia: <strong>{meta.frequency || 'Mensual'}</strong></p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                        <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Fechas</p>
                        <p className="text-gray-700">Ingreso: <strong>{meta.entryDate}</strong></p>
                        <p className="text-gray-700">Vencimiento: <strong>{meta.expiryDate || 'No aplica'}</strong></p>
                        <p className="text-gray-700">Uso: <strong>{meta.useDate || 'No aplica'}</strong></p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Documentos y trazabilidad</p>
                      <div className="grid md:grid-cols-2 gap-3 text-xs text-gray-600">
                        <div className="rounded-xl bg-gray-50 p-3"><p className="font-semibold text-gray-800 mb-1">Documentos</p><p>{meta.documents.join(' · ')}</p></div>
                        <div className="rounded-xl bg-gray-50 p-3"><p className="font-semibold text-gray-800 mb-1">Estado</p><p>{meta.state}</p></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-3">Historial de movimientos</p>
                    <div className="space-y-3">
                      {meta.movementHistory?.map((entry, index) => (
                        <div key={`${meta.sku}-mv-${index}`} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                          <p className="font-semibold text-gray-900">{entry.date} · {entry.type}</p>
                          <p className="text-gray-600 mt-1">{entry.quantity}</p>
                          <p className="text-xs text-gray-500 mt-1">{entry.document}</p>
                          <p className="text-xs text-gray-500 mt-1">{entry.reason}</p>
                          <p className="text-xs text-gray-500 mt-1">Saldo: {entry.balance}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button onClick={() => { setShowMovForm(selectedItem); setSelectedItem(null); }} className="flex-1 bg-navy hover:bg-navy-700 text-white font-semibold py-2.5 rounded-xl transition-colors">Registrar movimiento</button>
                <button onClick={() => setSelectedItem(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}

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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Documento</label>
                  <select value={movForm.documentType} onChange={e => setMovForm(f => ({ ...f, documentType: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white">
                    <option value="Factura">Factura</option>
                    <option value="Boleta">Boleta</option>
                    <option value="Boleta interna">Boleta interna</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Numero</label>
                  <input type="text" value={movForm.documentNumber} onChange={e => setMovForm(f => ({ ...f, documentNumber: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" placeholder="F001-000123" />
                </div>
              </div>
              {movForm.type === 'entrada' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Referencia Boleta Retiro</label>
                  <input type="text" value={movForm.returnRef} onChange={e => setMovForm(f => ({ ...f, returnRef: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" placeholder="Ej: B001-00010 (Para saldar a cero)" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subir Comprobante (Factura / Boleta / Guía)</label>
                <div className="flex items-center gap-2">
                  <input type="file" onChange={e => setMovForm(f => ({ ...f, fileAttached: e.target.files?.[0]?.name || '' }))} className="hidden" id="file-uploader" />
                  <label htmlFor="file-uploader" className="cursor-pointer flex-1 border border-dashed border-gray-200 hover:border-navy text-xs font-semibold text-gray-600 px-3 py-2 rounded-xl text-center bg-gray-50/50 hover:bg-navy-50/20 transition-all">
                    {movForm.fileAttached ? `Archivo: ${movForm.fileAttached}` : 'Seleccionar Archivo (PDF, PNG, JPG)'}
                  </label>
                  {movForm.fileAttached && (
                    <button onClick={() => setMovForm(f => ({ ...f, fileAttached: '' }))} className="text-xs text-red-500 hover:underline">Limpiar</button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Uso / destino</label>
                <input type="text" value={movForm.purpose} onChange={e => setMovForm(f => ({ ...f, purpose: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" placeholder="Mantenimiento, restaurante, limpieza, catering..." />
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Marca</label>
                  <input type="text" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Presentación</label>
                  <input type="text" value={form.presentation} onChange={e => setForm(f => ({ ...f, presentation: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" placeholder="Botella, caja..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Color</label>
                  <input type="text" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tamaño</label>
                  <input type="text" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" placeholder="Grande, 40x40..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Peso</label>
                  <input type="text" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" placeholder="1kg, 500g..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Litros / volumen</label>
                  <input type="text" value={form.volume} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" placeholder="1L, 750ml..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Almacén Específico</label>
                  <select value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white">
                    <option value="Almacen General">Almacen General</option>
                    <option value="Cocina y Catering">Cocina y Catering</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Emergencias">Emergencias</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Frecuencia de Uso</label>
                  <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white">
                    <option value="Diario">Diario</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Mensual">Mensual</option>
                    <option value="Ocasional">Ocasional</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="is_essential" checked={form.is_essential} onChange={e => setForm(f => ({ ...f, is_essential: e.target.checked }))} className="w-4 h-4 text-navy rounded border-gray-300 focus:ring-navy" />
                <label htmlFor="is_essential" className="text-sm font-semibold text-gray-700 cursor-pointer">Marcar como insumo Imprescindible (Alerta bajo stock)</label>
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
