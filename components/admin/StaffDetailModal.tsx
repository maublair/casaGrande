'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, BadgeInfo, CalendarDays, Clock3, DollarSign, ShieldCheck, ClipboardList, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase, Staff, StaffSchedule } from '@/lib/supabase';
import { buildStaffProfile, calculateGratification, EmploymentRegime, staffColorFor, staffCodeFor, enrichWarehouseItem } from '@/lib/casagrande-demo';

interface Props {
  staff: Staff;
  onClose: () => void;
}

const regimeOptions: Array<{ value: EmploymentRegime; label: string; note: string }> = [
  { value: 'regimen_privado', label: 'Régimen privado', note: 'Aplica gratificacion por semestre laborado.' },
  { value: 'plazo_fijo', label: 'Plazo fijo', note: 'Aplica igual si esta en actividad privada.' },
  { value: 'tiempo_parcial', label: 'Tiempo parcial', note: 'Tambien puede acceder si esta en regimen privado.' },
  { value: 'servicios_no_personales', label: 'Servicios no personales', note: 'No corresponde gratificacion laboral.' },
];

export default function StaffDetailModal({ staff, onClose }: Props) {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [regime, setRegime] = useState<EmploymentRegime>('regimen_privado');
  const [monthsWorked, setMonthsWorked] = useState(6);
  const [salary, setSalary] = useState<number>(staff.salary || 0);

  const [invItems, setInvItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [actionItem, setActionItem] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'entrada' | 'salida' | null>(null);
  const [actionForm, setActionForm] = useState({
    quantity: '',
    documentType: 'Boleta interna',
    documentNumber: '',
    purpose: '',
    notes: '',
    returnRef: '',
  });

  async function loadInventory() {
    const { data: catData } = await supabase.from('inventory_categories').select('*').order('name');
    const { data: itemData } = await supabase.from('inventory_items').select('*, inventory_categories(name)').eq('is_active', true).order('name');
    const cats = catData || [];
    if (!cats.some(c => c.name.toLowerCase().includes('cuarto') || c.name.toLowerCase().includes('hab') || c.name.toLowerCase().includes('mobiliario'))) {
      cats.push({ id: 'mobiliario_cuartos', name: 'Mobiliario de Cuartos' });
    }
    setCategories(cats);
    setInvItems(itemData || []);
  }

  useEffect(() => {
    loadInventory();
  }, []);

  async function saveTransaction() {
    if (!actionItem) return;
    const qty = parseFloat(actionForm.quantity);
    if (!qty) return;
    const newStock = actionType === 'entrada'
      ? Number(actionItem.current_stock) + qty
      : Number(actionItem.current_stock) - qty;

    await supabase.from('inventory_movements').insert({
      item_id: actionItem.id,
      type: actionType,
      quantity: qty,
      notes: actionForm.notes || null,
      reference: actionForm.documentNumber || null,
    });

    await supabase.from('inventory_items').update({
      current_stock: Math.max(0, newStock),
      last_restocked_at: actionType === 'entrada' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    }).eq('id', actionItem.id);

    setActionItem(null);
    setActionType(null);
    setActionForm({
      quantity: '',
      documentType: 'Boleta interna',
      documentNumber: '',
      purpose: '',
      notes: '',
      returnRef: '',
    });
    loadInventory();
  }

  useEffect(() => {
    setSalary(staff.salary || 0);
    setMonthsWorked(Math.max(1, Math.min(6, Math.floor((Date.now() - new Date(staff.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 30)) || 1)));
    setRegime(staff.department === 'seguridad' ? 'plazo_fijo' : staff.department === 'housekeeping' ? 'tiempo_parcial' : 'regimen_privado');
  }, [staff]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('staff_schedules')
        .select('*')
        .eq('staff_id', staff.id)
        .order('work_date', { ascending: false })
        .limit(12);
      if (!alive) return;
      setSchedules((data || []) as StaffSchedule[]);
      setLoading(false);
    }
    load();
    return () => { alive = false; };
  }, [staff.id]);

  const profile = useMemo(() => buildStaffProfile(staff, schedules), [staff, schedules]);
  const grat = useMemo(() => calculateGratification(regime, salary, monthsWorked), [regime, salary, monthsWorked]);
  const color = staffColorFor(staff);
  const code = staffCodeFor(staff);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col">
        <div className={`px-6 py-5 border-b border-gray-100 bg-gradient-to-r ${color.soft} to-white flex items-start justify-between gap-4`}>
          <div>
            <p className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] ${color.text}`}>
              <BadgeInfo className="w-4 h-4" /> Ficha de personal
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">{staff.first_name} {staff.last_name}</h2>
            <p className="text-sm text-gray-500 mt-1">{staff.role} · {staff.department}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/70 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50">
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Codigo interno</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{profile.code}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${color.bg} flex items-center justify-center text-white font-extrabold`}>{code}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Ingreso</p>
                  <p className="font-semibold text-gray-900 mt-1">{staff.hire_date}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Salario</p>
                  <p className="font-semibold text-gray-900 mt-1">{salary ? `S/ ${salary.toLocaleString()}` : '—'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Turno actual</p>
                  <p className="font-semibold text-gray-900 mt-1">{profile.currentShift}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Horario</p>
                  <p className="font-semibold text-gray-900 mt-1">{profile.currentWindow}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">Gratificacion estimada</h3>
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo de contrato</label>
                <select value={regime} onChange={e => setRegime(e.target.value as EmploymentRegime)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white">
                  {regimeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <p className="text-xs text-gray-500">{regimeOptions.find(opt => opt.value === regime)?.note}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Meses trabajados</label>
                    <input type="number" min={0} max={6} value={monthsWorked} onChange={e => setMonthsWorked(Number(e.target.value || 0))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Sueldo base</label>
                    <input type="number" min={0} value={salary} onChange={e => setSalary(Number(e.target.value || 0))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 space-y-2 text-sm">
                <p className="font-semibold text-emerald-900">{grat.eligible ? `Monto estimado: S/ ${grat.total.toFixed(2)}` : 'No elegible para gratificacion laboral'}</p>
                <p className="text-emerald-900/80">Formula: {grat.formula}</p>
                <p className="text-emerald-900/80">Gratificacion bruta: S/ {grat.gross.toFixed(2)} · Bonificacion extraordinaria 9%: S/ {grat.bonus9.toFixed(2)}</p>
                <p className="text-emerald-900/80 text-xs">{grat.note}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-4 h-4 text-navy" />
                <h3 className="font-semibold text-gray-900">Horario e historial</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-gray-100 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Asignacion actual</p>
                  <p className="font-semibold text-gray-900 mt-1">{profile.assignmentCadence}</p>
                  <p className="text-gray-600 mt-1 flex items-center gap-2"><Clock3 className="w-3.5 h-3.5" /> {profile.currentWindow}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Resumen</p>
                  <p className="text-gray-600 mt-1 leading-relaxed">La asignacion puede ser por dia, semana, quincena, mes o personalizada segun la necesidad operativa del administrador.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-orange-500" />
                <h3 className="font-semibold text-gray-900">Registro de asignaciones</h3>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />)}
                  </div>
                ) : profile.scheduleHistory.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay historial de horarios cargado.</p>
                ) : (
                  profile.scheduleHistory.map(entry => (
                    <div key={`${entry.date}-${entry.shift}-${entry.assignment}`} className="rounded-xl border border-gray-100 bg-slate-50 p-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">{entry.date} · {entry.shift}</p>
                        <p className="text-xs text-gray-500 mt-1">{entry.assignment} · {entry.cadence}</p>
                        <p className="text-xs text-gray-500 mt-1">{entry.note}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                        <p>{entry.start} - {entry.end}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-gray-900">Notas de gestion</h3>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Regimen sugerido</p>
                  <p className="font-semibold text-gray-900 mt-1">{profile.regimeLabel}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Meses estimados en semestre</p>
                  <p className="font-semibold text-gray-900 mt-1">{profile.estimatedMonths}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Codigo de referencia</p>
                  <p className="font-semibold text-gray-900 mt-1">{profile.code} · {code}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Color de mapa</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full ${color.bg}`} />
                    <p className="text-gray-600">Se usa en el mapa visual de turnos semanal y mensual.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-navy" />
              <h3 className="font-bold text-gray-900 text-lg">Control de Inventario y Almacén</h3>
            </div>
            <p className="text-xs text-gray-500">Categorías de almacén e inventario mobiliario por habitación. Selecciona una categoría para ver los productos e insumos asignados y realizar retiros o devoluciones.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {categories.map(cat => {
                const count = invItems.filter(item => cat.id === 'mobiliario_cuartos' ? (item.category_id === null || item.name.toLowerCase().includes('colchon') || item.name.toLowerCase().includes('tv') || item.name.toLowerCase().includes('inodoro')) : item.category_id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedCat === cat.id ? 'border-navy bg-navy/5 ring-2 ring-navy/10' : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{count} items registrados</p>
                  </button>
                );
              })}
            </div>

            {selectedCat && (
              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-slate-50/50 p-4 space-y-3">
                <h4 className="font-semibold text-gray-800 text-sm">Insumos y Productos en {categories.find(c => c.id === selectedCat)?.name}</h4>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {invItems
                    .filter(item => selectedCat === 'mobiliario_cuartos' ? (item.category_id === null || item.name.toLowerCase().includes('colchon') || item.name.toLowerCase().includes('tv') || item.name.toLowerCase().includes('inodoro')) : item.category_id === selectedCat)
                    .map(item => {
                      const meta = enrichWarehouseItem(item, categories.find(c => c.id === selectedCat)?.name || '');
                      return (
                        <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col justify-between gap-3 shadow-sm">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">SKU: {meta.sku} · Stock: <span className="font-semibold text-gray-800">{item.current_stock} {item.unit}</span></p>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{item.description || meta.details}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setActionItem(item); setActionType('salida'); }}
                              className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                            >
                              <TrendingDown className="w-3.5 h-3.5" /> Retirar
                            </button>
                            <button
                              onClick={() => { setActionItem(item); setActionType('entrada'); }}
                              className="flex-1 flex items-center justify-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                            >
                              <TrendingUp className="w-3.5 h-3.5" /> Devolver
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {actionItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{actionType === 'salida' ? 'Registrar Retiro (Salida)' : 'Registrar Devolución (Ingreso)'}</h3>
              <button onClick={() => setActionItem(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                <p className="font-semibold text-gray-900">{actionItem.name}</p>
                <p className="text-xs text-gray-500 mt-1">Stock actual: {actionItem.current_stock} {actionItem.unit} · Solicitante: {staff.first_name} {staff.last_name}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cantidad a {actionType === 'salida' ? 'retirar' : 'devolver'} *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={actionForm.quantity}
                  onChange={e => setActionForm(f => ({ ...f, quantity: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Documento</label>
                  <select
                    value={actionForm.documentType}
                    onChange={e => setActionForm(f => ({ ...f, documentType: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white"
                  >
                    <option value="Boleta interna">Boleta interna</option>
                    <option value="Factura">Factura</option>
                    <option value="Boleta">Boleta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Número de Doc</label>
                  <input
                    type="text"
                    value={actionForm.documentNumber}
                    onChange={e => setActionForm(f => ({ ...f, documentNumber: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                    placeholder="B001-00012"
                  />
                </div>
              </div>

              {actionType === 'entrada' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Referencia Boleta Retiro</label>
                  <input
                    type="text"
                    value={actionForm.returnRef}
                    onChange={e => setActionForm(f => ({ ...f, returnRef: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                    placeholder="Ej: B001-00010 (Para saldar a cero)"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Destino / Uso *</label>
                <input
                  type="text"
                  required
                  value={actionForm.purpose}
                  onChange={e => setActionForm(f => ({ ...f, purpose: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  placeholder="Ej: reposición de toallas, mantenimiento de baño..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notas adicionales</label>
                <textarea
                  value={actionForm.notes}
                  onChange={e => setActionForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 resize-none"
                  rows={2}
                  placeholder="Detalles sobre el retiro/ingreso..."
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setActionItem(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button
                onClick={saveTransaction}
                disabled={!actionForm.quantity || !actionForm.purpose}
                className="flex-1 bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
