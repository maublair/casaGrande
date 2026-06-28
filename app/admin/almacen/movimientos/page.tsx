'use client';

import { useEffect, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Movement {
  id: string;
  item_id: string;
  type: string;
  quantity: number;
  notes: string | null;
  performed_by: string | null;
  reference: string | null;
  created_at: string;
  inventory_items?: { name: string; unit: string };
}

export default function MovimientosPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      let q = supabase
        .from('inventory_movements')
        .select('*, inventory_items(name, unit)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (filterType) q = q.eq('type', filterType);
      const { data } = await q;
      setMovements((data || []) as Movement[]);
      setLoading(false);
    }
    load();
  }, [filterType]);

  const typeConfig: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    entrada: { label: 'Entrada', cls: 'bg-green-100 text-green-700', icon: ArrowDownCircle },
    salida: { label: 'Salida', cls: 'bg-red-100 text-red-700', icon: ArrowUpCircle },
    ajuste: { label: 'Ajuste', cls: 'bg-blue-100 text-blue-700', icon: RefreshCw },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Movimientos de Inventario</h1>
          <p className="text-sm text-gray-500 mt-0.5">Historial de entradas, salidas y ajustes</p>
        </div>
        <Link
          href="/admin/almacen"
          className="text-sm text-navy-DEFAULT hover:underline font-medium"
        >
          Ver inventario
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {['', 'entrada', 'salida', 'ajuste'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              filterType === type ? 'bg-navy-DEFAULT text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type === '' ? 'Todos' : typeConfig[type]?.label || type}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Insumo</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Notas</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="p-3"><div className="h-8 shimmer rounded" /></td></tr>
                ))
              ) : movements.length === 0 ? (
                <tr><td colSpan={5} className="py-14 text-center text-gray-400">No hay movimientos registrados.</td></tr>
              ) : (
                movements.map(mov => {
                  const cfg = typeConfig[mov.type] || typeConfig.ajuste;
                  const Icon = cfg.icon;
                  return (
                    <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-800">{mov.inventory_items?.name || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.cls}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-800">
                        {mov.quantity} <span className="text-gray-400 font-normal text-xs">{mov.inventory_items?.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{mov.notes || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">
                        {new Date(mov.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
