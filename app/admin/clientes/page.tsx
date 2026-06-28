'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Mail, Phone, Star, Eye } from 'lucide-react';
import { supabase, Customer } from '@/lib/supabase';
import CustomerFormModal from '@/components/admin/CustomerFormModal';

export default function ClientesAdmin() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    setCustomers(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(s) ||
      (c.email || '').toLowerCase().includes(s) ||
      (c.phone || '').includes(s) ||
      (c.document_number || '').includes(s)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-navy-DEFAULT">{customers.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Clientes</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-olive-DEFAULT">{customers.filter(c => c.total_stays >= 3).length}</p>
          <p className="text-xs text-gray-500 mt-1">Clientes Frecuentes</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-gold-DEFAULT">S/ {customers.reduce((s, c) => s + c.total_spent, 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Ingresos Totales</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-200 w-64"
          />
        </div>
        <button
          onClick={() => { setEditCustomer(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-navy-DEFAULT hover:bg-navy-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      {/* Customer cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-navy-DEFAULT rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {c.first_name[0]}{c.last_name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{c.first_name} {c.last_name}</p>
                    <p className="text-xs text-gray-400">{c.nationality} &middot; {c.document_type}: {c.document_number || '—'}</p>
                  </div>
                </div>
                {c.total_stays >= 3 && (
                  <span className="flex items-center gap-1 bg-gold-50 text-gold-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold-200 flex-shrink-0">
                    <Star className="w-2.5 h-2.5 fill-current" /> VIP
                  </span>
                )}
              </div>

              <div className="space-y-1.5 mb-4">
                {c.email && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Mail className="w-3 h-3 text-gray-400" /> {c.email}
                  </p>
                )}
                {c.phone && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Phone className="w-3 h-3 text-gray-400" /> {c.phone}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="flex gap-4 text-center">
                  <div>
                    <p className="font-bold text-navy-DEFAULT text-sm">{c.total_stays}</p>
                    <p className="text-[10px] text-gray-400">Estancias</p>
                  </div>
                  <div>
                    <p className="font-bold text-olive-DEFAULT text-sm">S/ {c.total_spent.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">Gastado</p>
                  </div>
                </div>
                <button
                  onClick={() => { setEditCustomer(c); setShowForm(true); }}
                  className="flex items-center gap-1 text-xs text-navy-DEFAULT hover:bg-navy-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Ver
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 text-center text-gray-400">No se encontraron clientes.</div>
          )}
        </div>
      )}

      {showForm && (
        <CustomerFormModal
          customer={editCustomer}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}
