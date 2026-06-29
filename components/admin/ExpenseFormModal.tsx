'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase, ExpenseCategory, Department } from '@/lib/supabase';

interface Props {
  onClose: () => void;
  onSave: () => void;
}

export default function ExpenseFormModal({ onClose, onSave }: Props) {
  const [form, setForm] = useState({
    description: '',
    category: 'otros' as ExpenseCategory,
    amount: '',
    department: 'general' as Department | 'general',
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.amount) { setError('Descripcion y monto son requeridos.'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.from('expenses').insert({
      description: form.description,
      category: form.category,
      amount: Number(form.amount),
      department: form.department === 'general' ? null : form.department,
      expense_date: form.expense_date,
      notes: form.notes || null,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    onSave();
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300";
  const labelCls = "text-xs font-medium text-gray-600 block mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
          <h2 className="font-semibold text-gray-800">Registrar Gasto</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Descripcion *</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Ej: Compra de suministros de limpieza" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Categoria *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))} className={inputCls}>
                <option value="salarios">Salarios</option>
                <option value="suministros">Suministros</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="marketing">Marketing</option>
                <option value="servicios">Servicios</option>
                <option value="alimentos">Alimentos</option>
                <option value="equipamiento">Equipamiento</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Monto (S/) *</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} placeholder="0.00" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Departamento</label>
              <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value as Department | 'general' }))} className={inputCls}>
                <option value="general">General</option>
                <option value="recepcion">Recepcion</option>
                <option value="housekeeping">Housekeeping</option>
                <option value="cocina">Cocina</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="administracion">Administracion</option>
                <option value="seguridad">Seguridad</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Fecha</label>
              <input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Notas</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls + ' resize-none'} rows={2} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
              {loading ? 'Guardando...' : 'Guardar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
