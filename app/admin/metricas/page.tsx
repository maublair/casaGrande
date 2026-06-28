'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { TrendingUp, BedDouble, Users, DollarSign } from 'lucide-react';

interface MonthData {
  month: string;
  ingresos: number;
  gastos: number;
  utilidad: number;
  reservas: number;
}

const COLORS = ['#1a4a6b', '#7a8c3f', '#c9a84c', '#2a74bb', '#84a630', '#e8be49'];

export default function MetricasAdmin() {
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [sourceData, setSourceData] = useState<{ name: string; value: number }[]>([]);
  const [roomTypeData, setRoomTypeData] = useState<{ name: string; reservas: number; ingresos: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [occupancyRate, setOccupancyRate] = useState(0);
  const [avgDailyRate, setAvgDailyRate] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalGuests, setTotalGuests] = useState(0);

  useEffect(() => {
    async function load() {
      const year = new Date().getFullYear();

      // Monthly revenue and expenses
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return d.toISOString().slice(0, 7);
      });

      const monthlyResults = await Promise.all(months.map(async m => {
        const [start, end] = [`${m}-01`, `${m}-31`];
        const [{ data: pays }, { data: exps }, { data: ress }] = await Promise.all([
          supabase.from('payments').select('amount').eq('status', 'completed').gte('paid_at', start).lte('paid_at', `${end}T23:59:59`),
          supabase.from('expenses').select('amount').gte('expense_date', start).lte('expense_date', end),
          supabase.from('reservations').select('id').gte('created_at', start).lte('created_at', `${end}T23:59:59`),
        ]);
        const ingresos = (pays || []).reduce((s, p) => s + p.amount, 0);
        const gastos = (exps || []).reduce((s, e) => s + e.amount, 0);
        const label = new Date(m + '-15').toLocaleDateString('es-PE', { month: 'short', year: '2-digit' });
        return { month: label, ingresos, gastos, utilidad: ingresos - gastos, reservas: (ress || []).length };
      }));
      setMonthlyData(monthlyResults);

      // Source distribution
      const { data: resBySource } = await supabase.from('reservations').select('source').not('status', 'eq', 'cancelled');
      const sourceCounts = (resBySource || []).reduce((acc, r) => {
        acc[r.source] = (acc[r.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const sourceLabels: Record<string, string> = { direct: 'Directo', web: 'Web', phone: 'Telefono', email: 'Email', booking: 'Booking', expedia: 'Expedia', airbnb: 'Airbnb', agent: 'Agente' };
      setSourceData(Object.entries(sourceCounts).map(([k, v]) => ({ name: sourceLabels[k] || k, value: v })));

      // Room type performance
      const { data: resWithRooms } = await supabase.from('reservations').select('total_amount, rooms(room_types(name))').not('status', 'eq', 'cancelled');
      const typeAgg = (resWithRooms || []).reduce((acc, r) => {
        const typeName = (r.rooms as { room_types?: { name: string } } | null)?.room_types?.name || 'Desconocido';
        if (!acc[typeName]) acc[typeName] = { reservas: 0, ingresos: 0 };
        acc[typeName].reservas += 1;
        acc[typeName].ingresos += r.total_amount || 0;
        return acc;
      }, {} as Record<string, { reservas: number; ingresos: number }>);
      setRoomTypeData(Object.entries(typeAgg).map(([name, d]) => ({ name, ...d })));

      // Overall stats
      const { data: allRooms } = await supabase.from('rooms').select('status').eq('is_active', true);
      const occupied = (allRooms || []).filter(r => r.status === 'occupied').length;
      setOccupancyRate(allRooms && allRooms.length > 0 ? Math.round((occupied / allRooms.length) * 100) : 0);

      const { data: allPays } = await supabase.from('payments').select('amount').eq('status', 'completed').gte('paid_at', `${year}-01-01`);
      const rev = (allPays || []).reduce((s, p) => s + p.amount, 0);
      setTotalRevenue(rev);
      const { data: allRes } = await supabase.from('reservations').select('check_in, check_out, total_amount').not('status', 'eq', 'cancelled');
      const totalNights = (allRes || []).reduce((s, r) => {
        const nights = Math.max(1, Math.ceil((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 86400000));
        return s + nights;
      }, 0);
      setAvgDailyRate(totalNights > 0 ? Math.round(rev / totalNights) : 0);
      const { data: custCount } = await supabase.from('customers').select('id');
      setTotalGuests(custCount?.length || 0);

      setLoading(false);
    }
    load();
  }, []);

  const kpis = [
    { label: 'Ocupacion Actual', value: `${occupancyRate}%`, icon: BedDouble, color: 'text-navy-DEFAULT', bg: 'bg-navy-50' },
    { label: 'Ingresos del Ano', value: `S/ ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Tarifa Media/Noche', value: `S/ ${avgDailyRate}`, icon: DollarSign, color: 'text-gold-DEFAULT', bg: 'bg-gold-50' },
    { label: 'Total Clientes', value: totalGuests, icon: Users, color: 'text-olive-DEFAULT', bg: 'bg-olive-50' },
  ];

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-64 bg-white rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`${k.bg} rounded-2xl p-5 border border-white shadow-sm`}>
            <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue vs Expenses area chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-5">Ingresos vs Gastos (Ultimos 6 meses)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="ingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1a4a6b" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1a4a6b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `S/${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => `S/ ${v.toLocaleString()}`} />
            <Legend />
            <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#1a4a6b" strokeWidth={2} fill="url(#ingGrad)" />
            <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" strokeWidth={2} fill="url(#gasGrad)" />
            <Area type="monotone" dataKey="utilidad" name="Utilidad" stroke="#7a8c3f" strokeWidth={2} fill="none" strokeDasharray="5 5" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room type bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-5">Ingresos por Tipo de Habitacion</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={roomTypeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `S/${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={90} />
              <Tooltip formatter={(v: number) => `S/ ${v.toLocaleString()}`} />
              <Bar dataKey="ingresos" name="Ingresos" radius={[0, 4, 4, 0]}>
                {roomTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source pie chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-5">Canal de Reservas</h3>
          {sourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v} reservas`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin datos de reservas aun.</div>
          )}
        </div>
      </div>

      {/* Monthly reservations bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-5">Reservas Mensuales</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip />
            <Bar dataKey="reservas" name="Reservas" fill="#c9a84c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
