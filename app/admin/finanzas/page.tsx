'use client';

import { useEffect, useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Receipt } from 'lucide-react';
import { supabase, Expense, ExpenseCategory } from '@/lib/supabase';
import ExpenseFormModal from '@/components/admin/ExpenseFormModal';

const categoryLabels: Record<ExpenseCategory, string> = {
  salarios: 'Salarios',
  suministros: 'Suministros',
  mantenimiento: 'Mantenimiento',
  marketing: 'Marketing',
  servicios: 'Servicios',
  alimentos: 'Alimentos',
  equipamiento: 'Equipamiento',
  otros: 'Otros',
};

const categoryColors: Record<ExpenseCategory, string> = {
  salarios:     'bg-red-100 text-red-700',
  suministros:  'bg-blue-100 text-blue-700',
  mantenimiento:'bg-yellow-100 text-yellow-700',
  marketing:    'bg-purple-100 text-purple-700',
  servicios:    'bg-teal-100 text-teal-700',
  alimentos:    'bg-orange-100 text-orange-700',
  equipamiento: 'bg-gray-100 text-gray-700',
  otros:        'bg-pink-100 text-pink-700',
};

export default function FinanzasAdmin() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  async function load() {
    setLoading(true);
    const [start, end] = [`${month}-01`, `${month}-31`];

    const [{ data: expData }, { data: payData }] = await Promise.all([
      supabase.from('expenses').select('*').gte('expense_date', start).lte('expense_date', end).order('expense_date', { ascending: false }),
      supabase.from('payments').select('amount').eq('status', 'completed').gte('paid_at', start).lte('paid_at', `${end}T23:59:59`),
    ]);

    setExpenses(expData || []);
    setRevenue((payData || []).reduce((s, p) => s + p.amount, 0));
    setLoading(false);
  }

  useEffect(() => { load(); }, [month]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = revenue - totalExpenses;

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">Periodo:</label>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-200"
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Ingresos</span>
          </div>
          <p className="text-2xl font-bold text-green-600">S/ {revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-sm font-medium text-gray-500">Gastos</span>
          </div>
          <p className="text-2xl font-bold text-red-500">S/ {totalExpenses.toLocaleString()}</p>
        </div>
        <div className={`rounded-2xl p-5 border shadow-sm ${profit >= 0 ? 'bg-navy-50 border-navy-100' : 'bg-red-50 border-red-100'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profit >= 0 ? 'bg-navy-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-5 h-5 ${profit >= 0 ? 'text-navy' : 'text-red-600'}`} />
            </div>
            <span className="text-sm font-medium text-gray-500">Utilidad Neta</span>
          </div>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-navy' : 'text-red-600'}`}>
            {profit >= 0 ? '+' : ''}S/ {profit.toLocaleString()}
          </p>
          {revenue > 0 && (
            <p className="text-xs text-gray-400 mt-1">Margen: {((profit / revenue) * 100).toFixed(1)}%</p>
          )}
        </div>
      </div>

      {/* By category */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Gastos por Categoria</h3>
          <div className="space-y-3">
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[cat as ExpenseCategory] || 'bg-gray-100 text-gray-700'}`}>
                    {categoryLabels[cat as ExpenseCategory] || cat}
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-800">S/ {amount.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 ml-2">{totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(0) : 0}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-navy rounded-full transition-all" style={{ width: `${totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gray-500" />
            Registro de Gastos
          </h3>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-navy hover:bg-navy-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo Gasto
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripcion</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Departamento</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}>{[...Array(5)].map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>)
              ) : expenses.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No hay gastos registrados en este periodo.</td></tr>
              ) : expenses.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{e.expense_date}</td>
                  <td className="px-4 py-3.5 font-medium text-gray-800">{e.description}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[e.category] || 'bg-gray-100 text-gray-700'}`}>
                      {categoryLabels[e.category] || e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 capitalize">{e.department || '—'}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-red-600">S/ {e.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <ExpenseFormModal onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); load(); }} />}
    </div>
  );
}
