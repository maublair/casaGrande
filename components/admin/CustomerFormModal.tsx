'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase, Customer } from '@/lib/supabase';

interface Props {
  customer: Customer | null;
  onClose: () => void;
  onSave: () => void;
}

export default function CustomerFormModal({ customer, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    first_name: customer?.first_name || '',
    last_name: customer?.last_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    document_type: customer?.document_type || 'DNI',
    document_number: customer?.document_number || '',
    nationality: customer?.nationality || 'Peruana',
    address: customer?.address || '',
    city: customer?.city || '',
    country: customer?.country || 'Peru',
    preferences: customer?.preferences || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name || !form.last_name) { setError('Nombre y apellido son requeridos.'); return; }
    setLoading(true);
    setError('');
    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email || null,
      phone: form.phone || null,
      document_type: form.document_type,
      document_number: form.document_number || null,
      nationality: form.nationality,
      address: form.address || null,
      city: form.city || null,
      country: form.country,
      preferences: form.preferences || null,
      updated_at: new Date().toISOString(),
    };
    const { error: err } = customer
      ? await supabase.from('customers').update(payload).eq('id', customer.id)
      : await supabase.from('customers').insert(payload);
    if (err) { setError(err.message); setLoading(false); return; }
    onSave();
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300";
  const labelCls = "text-xs font-medium text-gray-600 block mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
          <h2 className="font-semibold text-gray-800">{customer ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
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
            <label className={labelCls}>Tipo documento</label>
            <select value={form.document_type} onChange={e => setForm(f => ({ ...f, document_type: e.target.value }))} className={inputCls}>
              <option value="DNI">DNI</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="CE">Carnet Extranjeria</option>
              <option value="RUC">RUC</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>N documento</label>
            <input value={form.document_number} onChange={e => setForm(f => ({ ...f, document_number: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Nacionalidad</label>
            <input value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Ciudad</label>
            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Direccion</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Preferencias</label>
            <textarea value={form.preferences} onChange={e => setForm(f => ({ ...f, preferences: e.target.value }))} className={inputCls + ' resize-none'} rows={2} placeholder="Preferencias, alergias, notas especiales..." />
          </div>
          {error && <p className="col-span-2 text-red-500 text-sm">{error}</p>}
          <div className="col-span-2 flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-navy-DEFAULT hover:bg-navy-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
