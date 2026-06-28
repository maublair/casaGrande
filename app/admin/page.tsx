'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BedDouble, CalendarCheck, Users, DollarSign, TrendingUp, Clock, AlertCircle, CheckCircle2, UserCog, CalendarClock, UserX, ArrowLeftRight, ChevronRight } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { supabase, Reservation } from '@/lib/supabase';

interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  pendingReservations: number;
  monthRevenue: number;
  totalCustomers: number;
  occupancyRate: number;
  recentReservations: Reservation[];
}

interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  presentToday: number;
  absentToday: number;
  onLeave: number;
  shiftChanges: number;
  byDept: { dept: string; count: number }[];
  todaySchedules: { id: string; staff_name: string; role: string; shift: string; status: string; department: string }[];
}

const deptLabels: Record<string, string> = {
  recepcion: 'Recepcion',
  housekeeping: 'Housekeeping',
  cocina: 'Cocina',
  mantenimiento: 'Mantenimiento',
  administracion: 'Administracion',
  seguridad: 'Seguridad',
};

const shiftLabels: Record<string, string> = {
  manana: 'Mañana',
  tarde: 'Tarde',
  noche: 'Noche',
  completo: 'Completo',
};

const statusLabels: Record<string, { label: string; cls: string }> = {
  programado: { label: 'Programado', cls: 'bg-blue-100 text-blue-700' },
  completado: { label: 'Completado', cls: 'bg-green-100 text-green-700' },
  ausente: { label: 'Ausente', cls: 'bg-red-100 text-red-700' },
  licencia: { label: 'Licencia', cls: 'bg-gray-100 text-gray-600' },
};

const resStatusLabels: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmada', cls: 'bg-blue-100 text-blue-700' },
  checked_in: { label: 'En Casa', cls: 'bg-green-100 text-green-700' },
  checked_out: { label: 'Completada', cls: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Cancelada', cls: 'bg-red-100 text-red-700' },
  no_show: { label: 'No Show', cls: 'bg-orange-100 text-orange-700' },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      const [
        { data: rooms },
        { data: todayIns },
        { data: todayOuts },
        { data: pending },
        { data: revenue },
        { data: customers },
        { data: recent },
        { data: staff },
        { data: todaySched },
      ] = await Promise.all([
        supabase.from('rooms').select('status, is_active').eq('is_active', true),
        supabase.from('reservations').select('id').eq('check_in', today).in('status', ['confirmed', 'checked_in']),
        supabase.from('reservations').select('id').eq('check_out', today).eq('status', 'checked_in'),
        supabase.from('reservations').select('id').eq('status', 'pending'),
        supabase.from('payments').select('amount').eq('status', 'completed').gte('paid_at', monthStart),
        supabase.from('customers').select('id'),
        supabase.from('reservations').select('*, customers(first_name, last_name), rooms(room_number, room_types(name))').order('created_at', { ascending: false }).limit(6),
        supabase.from('staff').select('id, department, is_active'),
        supabase.from('staff_schedules').select('id, shift, status, staff(first_name, last_name, role, department)').eq('work_date', today),
      ]);

      const total = rooms?.length || 0;
      const available = rooms?.filter(r => r.status === 'available').length || 0;
      const occupied = rooms?.filter(r => r.status === 'occupied').length || 0;
      const monthRev = (revenue || []).reduce((sum, p) => sum + p.amount, 0);

      setStats({
        totalRooms: total,
        availableRooms: available,
        occupiedRooms: occupied,
        todayCheckIns: todayIns?.length || 0,
        todayCheckOuts: todayOuts?.length || 0,
        pendingReservations: pending?.length || 0,
        monthRevenue: monthRev,
        totalCustomers: customers?.length || 0,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
        recentReservations: (recent || []) as Reservation[],
      });

      // Staff stats
      const activeStaff = (staff || []).filter(s => s.is_active);
      const todaySchedules = (todaySched || []).map(s => {
        const st = s.staff as unknown as { first_name: string; last_name: string; role: string; department: string } | null;
        return {
          id: s.id,
          staff_name: st ? `${st.first_name} ${st.last_name}` : 'N/A',
          role: st?.role || '',
          shift: s.shift,
          status: s.status,
          department: st?.department || '',
        };
      });

      const present = todaySchedules.filter(s => s.status === 'completado' || s.status === 'programado').length;
      const absent = todaySchedules.filter(s => s.status === 'ausente').length;
      const onLeave = todaySchedules.filter(s => s.status === 'licencia').length;

      const deptCounts: Record<string, number> = {};
      activeStaff.forEach(s => {
        deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
      });

      setStaffStats({
        totalStaff: staff?.length || 0,
        activeStaff: activeStaff.length,
        presentToday: present,
        absentToday: absent,
        onLeave,
        shiftChanges: 0,
        byDept: Object.entries(deptCounts).map(([dept, count]) => ({ dept, count })),
        todaySchedules,
      });

      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
    </div>
  );

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {stats.pendingReservations > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-amber-800 text-sm">
            Tienes <strong>{stats.pendingReservations}</strong> reserva{stats.pendingReservations > 1 ? 's' : ''} pendiente{stats.pendingReservations > 1 ? 's' : ''} por confirmar.
            <Link href="/admin/reservas" className="ml-2 underline hover:no-underline">Ver reservas</Link>
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Habitaciones Disponibles" value={stats.availableRooms} subtitle={`de ${stats.totalRooms} total`} icon={BedDouble} color="green" />
        <StatCard title="Ocupacion" value={`${stats.occupancyRate}%`} subtitle={`${stats.occupiedRooms} habitaciones`} icon={TrendingUp} color="navy" />
        <StatCard title="Reservas del Mes" value={stats.totalCustomers} subtitle="clientes registrados" icon={CalendarCheck} color="olive" />
        <StatCard title="Ingresos del Mes" value={`S/ ${stats.monthRevenue.toLocaleString()}`} subtitle="pagos completados" icon={DollarSign} color="gold" />
      </div>

      {/* Today activity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.todayCheckIns}</p>
            <p className="text-sm text-gray-500">Check-ins hoy</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.todayCheckOuts}</p>
            <p className="text-sm text-gray-500">Check-outs hoy</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            <p className="text-sm text-gray-500">Clientes totales</p>
          </div>
        </div>
      </div>

      {/* Gestion de Personal Section */}
      {staffStats && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-navy-DEFAULT" />
              <h2 className="font-semibold text-gray-800 text-lg">Gestion de Personal</h2>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/personal" className="text-sm text-navy-DEFAULT hover:underline font-medium flex items-center gap-1">
                Ver personal <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/admin/horarios" className="text-sm text-navy-DEFAULT hover:underline font-medium flex items-center gap-1">
                Ver horarios <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Staff stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center">
                  <UserCog className="w-5 h-5 text-navy-DEFAULT" />
                </div>
                <span className="text-xs text-gray-400">Activos</span>
              </div>
              <p className="text-2xl font-bold text-navy-DEFAULT">{staffStats.activeStaff}</p>
              <p className="text-xs text-gray-500 mt-1">Personal Activo</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs text-gray-400">Hoy</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{staffStats.presentToday}</p>
              <p className="text-xs text-gray-500 mt-1">Asistencias Hoy</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <UserX className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-xs text-gray-400">Hoy</span>
              </div>
              <p className="text-2xl font-bold text-red-500">{staffStats.absentToday}</p>
              <p className="text-xs text-gray-500 mt-1">Faltas Hoy</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-xs text-gray-400">Mes</span>
              </div>
              <p className="text-2xl font-bold text-amber-500">{staffStats.onLeave}</p>
              <p className="text-xs text-gray-500 mt-1">En Licencia</p>
            </div>
          </div>

          {/* Staff by department + today schedules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* By department */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-navy-DEFAULT" />
                Personal por Departamento
              </h3>
              <div className="space-y-3">
                {staffStats.byDept.map(({ dept, count }) => {
                  const maxCount = Math.max(...staffStats.byDept.map(d => d.count), 1);
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={dept}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{deptLabels[dept] || dept}</span>
                        <span className="text-sm font-bold text-gray-900">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-navy-DEFAULT rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {staffStats.byDept.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No hay personal registrado.</p>
                )}
              </div>
            </div>

            {/* Today schedules */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-navy-DEFAULT" />
                  Turnos de Hoy
                </h3>
                <Link href="/admin/horarios" className="text-sm text-navy-DEFAULT hover:underline font-medium">Ver todos</Link>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {staffStats.todaySchedules.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {staffStats.todaySchedules.map(s => {
                      const st = statusLabels[s.status] || { label: s.status, cls: 'bg-gray-100 text-gray-600' };
                      return (
                        <div key={s.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-navy-50 rounded-full flex items-center justify-center text-navy-DEFAULT text-xs font-bold">
                              {s.staff_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{s.staff_name}</p>
                              <p className="text-xs text-gray-400">{s.role} · {deptLabels[s.department] || s.department}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{shiftLabels[s.shift] || s.shift}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <CalendarClock className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm">No hay turnos programados para hoy.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/admin/personal" className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-navy-200 transition-all group">
              <UserCog className="w-5 h-5 text-navy-DEFAULT mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-semibold text-gray-800">Registrar Personal</p>
              <p className="text-xs text-gray-400 mt-0.5">Altas, bajas, edicion</p>
            </Link>
            <Link href="/admin/horarios" className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-navy-200 transition-all group">
              <CalendarClock className="w-5 h-5 text-navy-DEFAULT mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-semibold text-gray-800">Asignar Horarios</p>
              <p className="text-xs text-gray-400 mt-0.5">Turnos semanales</p>
            </Link>
            <Link href="/admin/horarios" className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-navy-200 transition-all group">
              <UserX className="w-5 h-5 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-semibold text-gray-800">Faltas y Asistencias</p>
              <p className="text-xs text-gray-400 mt-0.5">Control diario</p>
            </Link>
            <Link href="/admin/horarios" className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-navy-200 transition-all group">
              <ArrowLeftRight className="w-5 h-5 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-semibold text-gray-800">Cambios de Turno</p>
              <p className="text-xs text-gray-400 mt-0.5">Permutas y licencias</p>
            </Link>
          </div>
        </div>
      )}

      {/* Recent reservations */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Reservas Recientes</h2>
          <Link href="/admin/reservas" className="text-sm text-navy-DEFAULT hover:underline font-medium">Ver todas</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Codigo</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Habitacion</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-in</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentReservations.map(r => {
                const s = resStatusLabels[r.status] || { label: r.status, cls: 'bg-gray-100 text-gray-600' };
                const customer = r.customers as { first_name: string; last_name: string } | undefined;
                const room = r.rooms as { room_number: string; room_types?: { name: string } } | undefined;
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{r.reservation_code}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {customer ? `${customer.first_name} ${customer.last_name}` : 'Sin cliente'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {room ? `Hab. ${room.room_number}` : '—'} {room?.room_types?.name ? `(${room.room_types.name})` : ''}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.check_in}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">S/ {r.total_amount?.toFixed(0)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
                    </td>
                  </tr>
                );
              })}
              {stats.recentReservations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">No hay reservas aun.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
