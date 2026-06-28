'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Mail, Phone, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase, Staff, Department } from '@/lib/supabase';
import StaffFormModal from '@/components/admin/StaffFormModal';

const deptColors: Record<Department, string> = {
  recepcion:     'bg-blue-100 text-blue-700',
  housekeeping:  'bg-teal-100 text-teal-700',
  cocina:        'bg-orange-100 text-orange-700',
  mantenimiento: 'bg-yellow-100 text-yellow-700',
  administracion:'bg-purple-100 text-purple-700',
  seguridad:     'bg-red-100 text-red-700',
};

const deptLabels: Record<Department, string> = {
  recepcion: 'Recepcion',
  housekeeping: 'Housekeeping',
  cocina: 'Cocina',
  mantenimiento: 'Mantenimiento',
  administracion: 'Administracion',
  seguridad: 'Seguridad',
};

export default function PersonalAdmin() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState<Department | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('staff').select('*').order('department').order('first_name');
    setStaff(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('staff').update({ is_active: !active }).eq('id', id);
    setStaff(prev => prev.map(s => s.id === id ? { ...s, is_active: !active } : s));
  }

  const filtered = staff.filter(s => {
    const matchSearch = !search || `${s.first_name} ${s.last_name} ${s.role}`.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'all' || s.department === filterDept;
    return matchSearch && matchDept;
  });

  const totalSalary = staff.filter(s => s.is_active).reduce((sum, s) => sum + (s.salary || 0), 0);
  const depts = Object.keys(deptLabels) as Department[];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-navy-DEFAULT">{staff.filter(s => s.is_active).length}</p>
          <p className="text-xs text-gray-500 mt-1">Personal Activo</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-gray-400">{staff.filter(s => !s.is_active).length}</p>
          <p className="text-xs text-gray-500 mt-1">Personal Inactivo</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-red-500">S/ {totalSalary.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Planilla Mensual</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-olive-DEFAULT">{depts.filter(d => staff.some(s => s.department === d && s.is_active)).length}</p>
          <p className="text-xs text-gray-500 mt-1">Departamentos Activos</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar personal..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-200 w-56"
            />
          </div>
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value as Department | 'all')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-200"
          >
            <option value="all">Todos los departamentos</option>
            {depts.map(d => <option key={d} value={d}>{deptLabels[d]}</option>)}
          </select>
        </div>
        <button
          onClick={() => { setEditStaff(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-navy-DEFAULT hover:bg-navy-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar Personal
        </button>
      </div>

      {/* Staff table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Empleado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Departamento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Salario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingreso</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : filtered.map(s => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${!s.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-navy-DEFAULT rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {s.first_name[0]}{s.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{s.first_name} {s.last_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{s.role}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${deptColors[s.department]}`}>
                      {deptLabels[s.department]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-xs">
                    <div className="space-y-0.5">
                      {s.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.email}</p>}
                      {s.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-gray-800">
                    {s.salary ? `S/ ${s.salary.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-xs">{s.hire_date}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditStaff(s); setShowForm(true); }} className="p-1.5 hover:bg-navy-50 text-gray-400 hover:text-navy-DEFAULT rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleActive(s.id, s.is_active)} className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-lg transition-colors">
                        {s.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <StaffFormModal staff={editStaff} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); load(); }} />}
    </div>
  );
}
