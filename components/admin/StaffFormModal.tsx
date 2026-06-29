'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase, Staff, Department } from '@/lib/supabase';

interface Props {
  staff: Staff | null;
  onClose: () => void;
  onSave: () => void;
}

export default function StaffFormModal({ staff, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    first_name: staff?.first_name || '',
    last_name: staff?.last_name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    role: staff?.role || '',
    department: staff?.department || 'recepcion' as Department,
    salary: staff?.salary?.toString() || '',
    hire_date: staff?.hire_date || new Date().toISOString().split('T')[0],
    is_active: staff?.is_active ?? true,
    notes: staff?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.role) { setError('Nombre, apellido y cargo son requeridos.'); return; }
    setLoading(true);
    setError('');
    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email || null,
      phone: form.phone || null,
      role: form.role,
      department: form.department,
      salary: form.salary ? Number(form.salary) : null,
      hire_date: form.hire_date,
      is_active: form.is_active,
      notes: form.notes || null,
    };
    const { error: err } = staff
      ? await supabase.from('staff').update(payload).eq('id', staff.id)
      : await supabase.from('staff').insert(payload);
    if (err) { setError(err.message); setLoading(false); return; }
    onSave();
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300";
  const labelCls = "text-xs font-medium text-gray-600 block mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
          <h2 className="font-semibold text-gray-800">{staff ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nombre *</label>
            <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Apellido *</label>
            <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Telefono</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Cargo *</label>
            <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={inputCls} placeholder="Recepcionista" required />
          </div>
          <div>
            <label className={labelCls}>Departamento</label>
            <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value as Department }))} className={inputCls}>
              <option value="recepcion">Recepcion</option>
              <option value="housekeeping">Housekeeping</option>
              <option value="cocina">Cocina</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="administracion">Administracion</option>
              <option value="seguridad">Seguridad</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Salario mensual (S/)</label>
            <input type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} className={inputCls} placeholder="2000" />
          </div>
          <div>
            <label className={labelCls}>Fecha de ingreso</label>
            <input type="date" value={form.hire_date} onChange={e => setForm(f => ({ ...f, hire_date: e.target.value }))} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Notas</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls + ' resize-none'} rows={2} />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-navy" />
            <label htmlFor="active" className="text-sm text-gray-600 cursor-pointer">Empleado activo</label>
          </div>
          {error && <p className="col-span-2 text-red-500 text-sm">{error}</p>}
          <div className="col-span-2 flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
