'use client';

import { useEffect, useState } from 'react';
import { Plus, Brush, CheckCircle, Clock, AlertTriangle, BedDouble, User, Calendar, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CleaningTask {
  id: string;
  room_id: string | null;
  assigned_to: string | null;
  task_type: string;
  status: string;
  priority: string;
  scheduled_date: string;
  scheduled_time: string | null;
  completed_at: string | null;
  notes: string | null;
  rooms?: { room_number: string };
  staff?: { first_name: string; last_name: string };
}

const taskTypeLabels: Record<string, string> = {
  limpieza_diaria: 'Limpieza Diaria',
  limpieza_profunda: 'Limpieza Profunda',
  post_checkout: 'Post Checkout',
  inspeccion: 'Inspeccion',
  mantenimiento_menor: 'Mant. Menor',
};

const priorityConfig: Record<string, { label: string; cls: string }> = {
  baja: { label: 'Baja', cls: 'bg-gray-100 text-gray-600' },
  normal: { label: 'Normal', cls: 'bg-blue-100 text-blue-700' },
  alta: { label: 'Alta', cls: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'Urgente', cls: 'bg-red-100 text-red-700' },
};

const statusConfig: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pendiente: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700', icon: Clock },
  en_proceso: { label: 'En Proceso', cls: 'bg-blue-100 text-blue-700', icon: Brush },
  completado: { label: 'Completado', cls: 'bg-green-100 text-green-700', icon: CheckCircle },
  omitido: { label: 'Omitido', cls: 'bg-gray-100 text-gray-500', icon: X },
};

export default function LimpiezaPage() {
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [rooms, setRooms] = useState<{ id: string; room_number: string }[]>([]);
  const [staff, setStaff] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    room_id: '', assigned_to: '', task_type: 'limpieza_diaria',
    priority: 'normal', scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '', notes: '',
  });

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('cleaning_tasks')
      .select('*, rooms(room_number), staff(first_name, last_name)')
      .eq('scheduled_date', filterDate)
      .order('scheduled_time');
    setTasks((data || []) as CleaningTask[]);
    setLoading(false);
  }

  useEffect(() => {
    supabase.from('rooms').select('id, room_number').eq('is_active', true).order('room_number').then(({ data }) => setRooms(data || []));
    supabase.from('staff').select('id, first_name, last_name').eq('is_active', true).order('first_name').then(({ data }) => setStaff(data || []));
  }, []);

  useEffect(() => { load(); }, [filterDate]);

  async function updateStatus(id: string, status: string) {
    await supabase.from('cleaning_tasks').update({
      status,
      completed_at: status === 'completado' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    load();
  }

  async function saveTask() {
    await supabase.from('cleaning_tasks').insert({
      ...form,
      room_id: form.room_id || null,
      assigned_to: form.assigned_to || null,
      scheduled_time: form.scheduled_time || null,
    });
    setShowForm(false);
    load();
  }

  const counts = Object.fromEntries(
    Object.keys(statusConfig).map(s => [s, tasks.filter(t => t.status === s).length])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Agenda de Limpieza</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion de tareas de housekeeping</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-navy hover:bg-navy-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Nueva Tarea
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <div key={key} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cfg.cls}`}>
              <cfg.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{counts[key] || 0}</p>
              <p className="text-xs text-gray-500">{cfg.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Task list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Tareas para {filterDate}</h2>
          <span className="text-sm text-gray-400">{tasks.length} tarea{tasks.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 shimmer rounded-lg" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <Brush className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No hay tareas programadas para esta fecha.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tasks.map(task => {
              const sConfig = statusConfig[task.status] || statusConfig.pendiente;
              const pConfig = priorityConfig[task.priority] || priorityConfig.normal;
              return (
                <div key={task.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800 text-sm">
                        {task.rooms?.room_number ? `Hab. ${task.rooms.room_number}` : 'Sin habitacion'}
                      </span>
                      <span className="text-xs font-medium text-gray-500">{taskTypeLabels[task.task_type] || task.task_type}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pConfig.cls}`}>{pConfig.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {task.staff && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {task.staff.first_name} {task.staff.last_name}
                        </span>
                      )}
                      {task.scheduled_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.scheduled_time.slice(0, 5)}
                        </span>
                      )}
                      {task.notes && <span className="truncate max-w-xs">{task.notes}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sConfig.cls}`}>{sConfig.label}</span>
                    <select
                      value={task.status}
                      onChange={e => updateStatus(task.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none bg-white"
                    >
                      {Object.entries(statusConfig).map(([k, c]) => (
                        <option key={k} value={k}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New task modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Nueva Tarea de Limpieza</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Habitacion</label>
                  <select value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
                    <option value="">Sin habitacion</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>Hab. {r.room_number}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Asignado a</label>
                  <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
                    <option value="">Sin asignar</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tipo de tarea</label>
                  <select value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
                    {Object.entries(taskTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Prioridad</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
                    {Object.entries(priorityConfig).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fecha</label>
                  <input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hora</label>
                  <input type="time" value={form.scheduled_time} onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notas</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 resize-none"
                  placeholder="Instrucciones adicionales..." />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={saveTask} className="flex-1 bg-navy hover:bg-navy-700 text-white font-semibold py-2.5 rounded-xl transition-colors">
                Guardar Tarea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
