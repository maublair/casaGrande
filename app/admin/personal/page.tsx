'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Mail, Phone, Edit2, ToggleLeft, ToggleRight, BadgeInfo, UserCog } from 'lucide-react';
import { supabase, Staff, Department } from '@/lib/supabase';
import StaffFormModal from '@/components/admin/StaffFormModal';
import StaffDetailModal from '@/components/admin/StaffDetailModal';
import { buildStaffProfile, staffCodeFor, staffColorFor } from '@/lib/casagrande-demo';

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
  const [detailStaff, setDetailStaff] = useState<Staff | null>(null);

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

  const filtered = useMemo(() => staff.filter(s => {
    const matchSearch = !search || `${s.first_name} ${s.last_name} ${s.role}`.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'all' || s.department === filterDept;
    return matchSearch && matchDept;
  }), [staff, search, filterDept]);

  const totalSalary = staff.filter(s => s.is_active).reduce((sum, s) => sum + (s.salary || 0), 0);
  const depts = Object.keys(deptLabels) as Department[];
  const activeCount = staff.filter(s => s.is_active).length;
  const inactiveCount = staff.filter(s => !s.is_active).length;
  const roster = useMemo(() => filtered.map(s => ({ staff: s, code: staffCodeFor(s), tone: staffColorFor(s), profile: buildStaffProfile(s) })), [filtered]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-navy">{activeCount}</p>
          <p className="text-xs text-gray-500 mt-1">Personal Activo</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-gray-400">{inactiveCount}</p>
          <p className="text-xs text-gray-500 mt-1">Personal Inactivo</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-red-500">S/ {totalSalary.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Planilla Mensual</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-olive">{depts.filter(d => staff.some(s => s.department === d && s.is_active)).length}</p>
          <p className="text-xs text-gray-500 mt-1">Departamentos Activos</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
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
          className="flex items-center gap-2 bg-navy hover:bg-navy-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar Personal
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <UserCog className="w-4 h-4 text-navy" />
          <h2 className="font-semibold text-gray-800">Mapa de personal</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {roster.map(({ staff: person, code, tone }) => (
            <button
              key={person.id}
              onClick={() => setDetailStaff(person)}
              className={`text-left rounded-2xl border p-3 transition-all hover:shadow-md ${tone.soft} ${tone.border} ${!person.is_active ? 'opacity-60' : ''}`}
            >
              <div className={`w-10 h-10 rounded-2xl ${tone.bg} flex items-center justify-center text-white text-sm font-extrabold`}>{code}</div>
              <p className="font-semibold text-gray-900 mt-3 truncate">{person.first_name} {person.last_name}</p>
              <p className="text-xs text-gray-500 truncate">{deptLabels[person.department]}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="h-4 bg-gray-100 rounded animate-pulse" />
              <div className="h-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
            No se encontro personal con estos filtros.
          </div>
        ) : (
          filtered.map(s => {
            const profile = buildStaffProfile(s);
            const tone = staffColorFor(s);
            return (
              <article key={s.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md ${!s.is_active ? 'opacity-60' : ''}`}>
                <div className={`px-5 py-4 ${tone.soft} border-b ${tone.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tone.soft} ${tone.text} border ${tone.border}`}>{profile.code}</span>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${deptColors[s.department]}`}>{deptLabels[s.department]}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mt-2 leading-tight">{s.first_name} {s.last_name}</h3>
                      <p className="text-sm text-gray-500">{s.role}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.is_active ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <span className="block text-gray-400 uppercase tracking-wider text-[10px]">Contacto</span>
                      <p className="font-medium text-gray-800 mt-1 truncate">{s.email || s.phone || 'Sin datos'}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <span className="block text-gray-400 uppercase tracking-wider text-[10px]">Ingreso</span>
                      <p className="font-medium text-gray-800 mt-1">{s.hire_date}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <span className="block text-gray-400 uppercase tracking-wider text-[10px]">Salario</span>
                      <p className="font-medium text-gray-800 mt-1">{s.salary ? `S/ ${s.salary.toLocaleString()}` : '—'}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <span className="block text-gray-400 uppercase tracking-wider text-[10px]">Turno</span>
                      <p className="font-medium text-gray-800 mt-1">{profile.currentShift}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4 text-sm space-y-2">
                    <p className="flex items-center gap-2 font-semibold text-gray-900"><BadgeInfo className="w-4 h-4 text-navy" /> Gratificacion estimada</p>
                    <p className="text-gray-600 text-xs leading-relaxed">{profile.gratification.regimeLabel} · {profile.gratification.monthsWorked} meses · {profile.gratification.eligible ? `S/ ${profile.gratification.total.toFixed(2)}` : 'No aplica'}</p>
                    <p className="text-gray-500 text-xs">Formula: {profile.gratification.formula}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <button onClick={() => setDetailStaff(s)} className="flex items-center gap-1 text-xs text-navy hover:bg-navy-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium">
                      <BadgeInfo className="w-3.5 h-3.5" /> Ficha
                    </button>
                    <button onClick={() => { setEditStaff(s); setShowForm(true); }} className="flex items-center gap-1 text-xs text-gray-600 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors font-medium">
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button onClick={() => toggleActive(s.id, s.is_active)} className="flex items-center gap-1 text-xs text-gray-600 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors font-medium">
                      {s.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />} Estado
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {showForm && <StaffFormModal staff={editStaff} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); load(); }} />}
      {detailStaff && <StaffDetailModal staff={detailStaff} onClose={() => setDetailStaff(null)} />}
    </div>
  );
}
