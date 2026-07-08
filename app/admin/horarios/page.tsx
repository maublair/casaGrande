'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Clock, ChevronLeft, ChevronRight, User, X, CalendarDays, LayoutGrid } from 'lucide-react';
import { supabase, Staff, StaffSchedule } from '@/lib/supabase';
import { buildStaffProfile, staffColorFor, staffCodeFor } from '@/lib/casagrande-demo';

interface Schedule extends StaffSchedule {
  staff?: { first_name: string; last_name: string; role: string; department: string };
}

const shiftConfig: Record<string, { label: string; hours: string; cls: string; col: string }> = {
  manana: { label: 'Mañana', hours: '6:00 - 14:00', cls: 'bg-yellow-50 border-yellow-200 text-yellow-800', col: 'bg-yellow-100' },
  tarde:  { label: 'Tarde',  hours: '14:00 - 22:00', cls: 'bg-blue-50 border-blue-200 text-blue-800', col: 'bg-blue-100' },
  noche:  { label: 'Noche',  hours: '22:00 - 6:00', cls: 'bg-navy-50 border-navy-200 text-navy-800', col: 'bg-navy-100' },
  completo:{ label: 'Completo', hours: '8:00 - 20:00', cls: 'bg-olive-50 border-olive-200 text-olive-800', col: 'bg-olive-100' },
};

function getWeekDates(base: Date) {
  const monday = new Date(base);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function getMonthDates(base: Date) {
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return Array.from({ length: last.getDate() }, (_, i) => new Date(year, month, i + 1).toISOString().split('T')[0]);
}

const dayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

const operationalWindows = [
  { title: 'Turno Mañana', hours: '06:00 - 14:00', note: 'Recepción, desayuno y limpieza principal.' },
  { title: 'Turno Tarde', hours: '14:00 - 22:00', note: 'Check-ins, soporte al huésped y refuerzo de limpieza.' },
  { title: 'Turno Noche', hours: '22:00 - 06:00', note: 'Auditoría, incidencias y guardia operativa.' },
];

const cleaningWindows = [
  { title: 'Ocupadas', hours: '10:00 - 14:00', note: 'Limpieza ligera sin interrumpir al huésped.' },
  { title: 'Liberadas', hours: '11:30 - 15:30', note: 'Limpieza completa post checkout y cambio de blancos.' },
  { title: 'Vacias', hours: '08:00 - 10:00', note: 'Repaso preventivo y preparación para ingresos.' },
];

export default function HorariosPage() {
  const [weekBase, setWeekBase] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [form, setForm] = useState({ staff_id: '', work_date: '', shift: 'manana', notes: '' });

  const weekDates = useMemo(() => getWeekDates(weekBase), [weekBase]);
  const monthDates = useMemo(() => getMonthDates(weekBase), [weekBase]);
  const visibleDates = viewMode === 'week' ? weekDates : monthDates;
  const rangeStart = visibleDates[0];
  const rangeEnd = visibleDates[visibleDates.length - 1];

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('staff_schedules')
      .select('*, staff(first_name, last_name, role, department)')
      .gte('work_date', rangeStart)
      .lte('work_date', rangeEnd)
      .order('work_date', { ascending: true });
    setSchedules((data || []) as Schedule[]);
    setLoading(false);
  }

  useEffect(() => {
    supabase.from('staff').select('*').eq('is_active', true).order('first_name').then(({ data }) => setStaffList(data || []));
  }, []);

  useEffect(() => { load(); }, [rangeStart, rangeEnd, viewMode]);

  function prevPeriod() { const d = new Date(weekBase); d.setMonth(d.getMonth() - (viewMode === 'week' ? 0 : 1)); d.setDate(d.getDate() - (viewMode === 'week' ? 7 : 30)); setWeekBase(d); }
  function nextPeriod() { const d = new Date(weekBase); d.setMonth(d.getMonth() + (viewMode === 'week' ? 0 : 1)); d.setDate(d.getDate() + (viewMode === 'week' ? 7 : 30)); setWeekBase(d); }
  function goToday() { setWeekBase(new Date()); }

  async function saveSchedule() {
    await supabase.from('staff_schedules').upsert({
      staff_id: form.staff_id,
      work_date: form.work_date,
      shift: form.shift,
      notes: form.notes || null,
      status: 'programado',
    }, { onConflict: 'staff_id,work_date' });
    setShowForm(false);
    load();
  }

  const today = new Date().toISOString().split('T')[0];
  const roster = useMemo(() => staffList.map(person => ({
    person,
    code: staffCodeFor(person),
    tone: staffColorFor(person),
    profile: buildStaffProfile(person, schedules.filter(s => s.staff_id === person.id)),
  })), [staffList, schedules]);

  const groupedSchedules = useMemo(() => visibleDates.map(date => ({
    date,
    items: schedules.filter(s => s.work_date === date),
  })), [visibleDates, schedules]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Horarios del Personal</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vista semanal y mensual de turnos, códigos y asistencia</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button onClick={prevPeriod} className="p-2 hover:bg-gray-50 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
            <button onClick={goToday} className="px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy-50 rounded-lg transition-colors">Hoy</button>
            <button onClick={nextPeriod} className="p-2 hover:bg-gray-50 rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${viewMode === 'week' ? 'bg-navy text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              Semana
            </button>
            <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${viewMode === 'month' ? 'bg-navy text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              Mes
            </button>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-navy hover:bg-navy-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Agregar Turno
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-3">Definicion de turnos</p>
          <div className="space-y-3">
            {operationalWindows.map(item => (
              <div key={item.title} className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.note}</p>
                </div>
                <span className="text-xs font-semibold text-navy whitespace-nowrap">{item.hours}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-3">Horarios de limpieza</p>
          <div className="space-y-3">
            {cleaningWindows.map(item => (
              <div key={item.title} className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-amber-50/70 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.note}</p>
                </div>
                <span className="text-xs font-semibold text-amber-700 whitespace-nowrap">{item.hours}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <LayoutGrid className="w-4 h-4 text-navy" />
          <h2 className="font-semibold text-gray-800">Mapa de personal</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {roster.map(({ person, code, tone }) => (
            <button key={person.id} className={`text-left rounded-2xl border p-3 transition-all hover:shadow-md ${tone.soft} ${tone.border} ${!person.is_active ? 'opacity-60' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl ${tone.bg} flex items-center justify-center text-white text-sm font-extrabold`}>{code}</div>
              <p className="font-semibold text-gray-900 mt-3 truncate">{person.first_name} {person.last_name}</p>
              <p className="text-xs text-gray-500 truncate">{person.role}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-8 border-b border-gray-100">
          <div className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Personal</div>
          {visibleDates.slice(0, viewMode === 'week' ? 7 : 7).map((date, i) => {
            const isToday = date === today;
            return (
              <div key={date} className={`p-3 text-center border-l border-gray-50 ${isToday ? 'bg-navy-50' : ''}`}>
                <p className={`text-xs font-semibold ${isToday ? 'text-navy' : 'text-gray-400'}`}>{dayNames[i % 7]}</p>
                <p className={`text-sm font-bold mt-0.5 ${isToday ? 'text-navy' : 'text-gray-700'}`}>{new Date(date + 'T12:00:00').getDate()}</p>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 shimmer rounded-lg" />)}
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <User className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            No hay personal registrado.
          </div>
        ) : viewMode === 'week' ? (
          <div className="divide-y divide-gray-50">
            {staffList.map(person => {
              const profile = buildStaffProfile(person, schedules.filter(s => s.staff_id === person.id));
              const tone = staffColorFor(person);
              return (
                <div key={person.id} className="grid grid-cols-8 min-h-[52px]">
                  <div className="p-3 flex items-center gap-2.5 border-r border-gray-50">
                    <div className={`w-8 h-8 rounded-full ${tone.bg} flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`}>{profile.code.slice(0, 2)}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{person.first_name} {person.last_name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{person.role}</p>
                    </div>
                  </div>
                  {weekDates.map(date => {
                    const sched = schedules.find(s => s.staff_id === person.id && s.work_date === date);
                    const isToday = date === today;
                    return (
                      <div key={date} className={`p-1.5 border-l border-gray-50 ${isToday ? 'bg-navy-50/50' : ''}`}>
                        {sched ? (
                          <div className={`rounded-md px-1.5 py-1 text-[10px] border ${tone.soft} ${tone.border} ${tone.text}`}>
                            <p className="font-bold truncate">{profile.code}</p>
                            <p className="text-[9px] font-medium opacity-80">{shiftConfig[sched.shift]?.label || sched.shift}</p>
                          </div>
                        ) : (
                          <button onClick={() => { setForm(f => ({ ...f, staff_id: person.id, work_date: date })); setShowForm(true); }} className="w-full h-full min-h-[32px] rounded-md border border-dashed border-gray-200 hover:border-navy-300 hover:bg-navy-50 transition-colors flex items-center justify-center">
                            <Plus className="w-3 h-3 text-gray-300" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {groupedSchedules.map(day => (
              <div key={day.date} className={`rounded-2xl border ${day.date === today ? 'border-navy-200 bg-navy-50/40' : 'border-gray-100 bg-gray-50/60'} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dia</p>
                    <p className="text-sm font-bold text-gray-900">{day.date}</p>
                  </div>
                  <CalendarDays className={`w-4 h-4 ${day.date === today ? 'text-navy' : 'text-gray-400'}`} />
                </div>
                <div className="space-y-2">
                  {day.items.length > 0 ? day.items.map(item => {
                    const person = staffList.find(s => s.id === item.staff_id);
                    const tone = person ? staffColorFor(person) : staffColorFor({ id: item.staff_id, first_name: 'A', last_name: 'B', department: 'administracion', hire_date: '2026-01-01' } as Staff);
                    const code = person ? staffCodeFor(person) : '----';
                    return (
                      <div key={item.id} className={`rounded-xl border ${tone.border} ${tone.soft} px-3 py-2 text-xs`}>
                        <p className={`font-bold ${tone.text}`}>{code} · {shiftConfig[item.shift]?.label || item.shift}</p>
                        <p className="text-gray-600 mt-1">{item.staff?.first_name} {item.staff?.last_name}</p>
                      </div>
                    );
                  }) : <p className="text-xs text-gray-400">Sin turnos asignados.</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(shiftConfig).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${cfg.col}`} />
            <span className="text-xs text-gray-600">{cfg.label} ({cfg.hours})</span>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Asignar Turno</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Empleado</label>
                <select value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white">
                  <option value="">Seleccionar...</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.role}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fecha</label>
                  <input type="date" value={form.work_date} onChange={e => setForm(f => ({ ...f, work_date: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Turno</label>
                  <select value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white">
                    {Object.entries(shiftConfig).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notas</label>
                <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" placeholder="Observaciones opcionales..." />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={saveSchedule} disabled={!form.staff_id || !form.work_date} className="flex-1 bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
