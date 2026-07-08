'use client';

import { X, Package, Layers3, BookOpen, Warehouse, RotateCcw, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { InventoryItem } from '@/lib/supabase';

interface Meta {
  brand: string;
  type: string;
  flavor: string;
  container: string;
  presentation: string;
  color: string;
  size?: string;
  weight?: string;
  volume?: string;
  warehouse?: string;
  frequency?: string;
  quantityLabel: string;
  usedQuantityLabel: string;
  entryDate: string;
  expiryDate: string | null;
  useDate: string | null;
  unitValue: string;
  details: string;
  tags: string[];
  documents: string[];
  maintenanceHistory: string[];
  damageHistory: string[];
  movementHistory?: Array<{ date: string; type: string; quantity: string; document: string; reason: string; balance: string; }>;
  state: string;
  sku: string;
}

interface Props {
  item: InventoryItem;
  meta: Meta;
  categoryName: string;
  onClose: () => void;
  onMove: (item: InventoryItem) => void;
}

export default function InventoryDetailModal({ item, meta, categoryName, onClose, onMove }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Ficha de inventario</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{item.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{categoryName} · SKU {meta.sku}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50">
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Marca</span><p className="font-medium text-gray-800 mt-1">{meta.brand}</p></div>
                <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Tipo</span><p className="font-medium text-gray-800 mt-1">{meta.type}</p></div>
                <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Presentacion</span><p className="font-medium text-gray-800 mt-1">{meta.presentation}</p></div>
                <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Color</span><p className="font-medium text-gray-800 mt-1">{meta.color}</p></div>
                <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Tamano</span><p className="font-medium text-gray-800 mt-1">{meta.size || 'Variable'}</p></div>
                <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Peso</span><p className="font-medium text-gray-800 mt-1">{meta.weight || '—'}</p></div>
                <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Litros / gramos</span><p className="font-medium text-gray-800 mt-1">{meta.volume || '—'}</p></div>
                <div className="rounded-xl bg-gray-50 p-3"><span className="block text-gray-400 uppercase tracking-wider text-[10px]">Almacen</span><p className="font-medium text-gray-800 mt-1">{meta.warehouse || 'General'}</p></div>
              </div>
              <div className="grid md:grid-cols-2 gap-3 text-sm mt-4">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1 flex items-center gap-2"><Package className="w-3.5 h-3.5" /> Stock y rotacion</p>
                  <p className="text-gray-700">Cantidad: <strong>{meta.quantityLabel}</strong></p>
                  <p className="text-gray-700">Usado: <strong>{meta.usedQuantityLabel}</strong></p>
                  <p className="text-gray-700">Frecuencia: <strong>{meta.frequency || 'Mensual'}</strong></p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1 flex items-center gap-2"><Layers3 className="w-3.5 h-3.5" /> Fechas</p>
                  <p className="text-gray-700">Ingreso: <strong>{meta.entryDate}</strong></p>
                  <p className="text-gray-700">Vencimiento: <strong>{meta.expiryDate || 'No aplica'}</strong></p>
                  <p className="text-gray-700">Uso: <strong>{meta.useDate || 'No aplica'}</strong></p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Documentos y trazabilidad</p>
                <div className="grid md:grid-cols-2 gap-3 text-xs text-gray-600">
                  <div className="rounded-xl bg-gray-50 p-3"><p className="font-semibold text-gray-800 mb-1 flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> Documentos</p><p>{meta.documents.join(' · ')}</p></div>
                  <div className="rounded-xl bg-gray-50 p-3"><p className="font-semibold text-gray-800 mb-1 flex items-center gap-2"><Warehouse className="w-3.5 h-3.5" /> Estado</p><p>{meta.state}</p></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-3">Historial de movimientos</p>
              <div className="space-y-3">
                {meta.movementHistory?.map((entry, index) => (
                  <div key={`${meta.sku}-mv-${index}`} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                    <p className="font-semibold text-gray-900 flex items-center gap-2">{entry.type === 'Entrada' ? <ArrowDownCircle className="w-3.5 h-3.5 text-green-600" /> : entry.type === 'Salida' ? <ArrowUpCircle className="w-3.5 h-3.5 text-red-600" /> : <RotateCcw className="w-3.5 h-3.5 text-blue-600" />} {entry.date} · {entry.type}</p>
                    <p className="text-gray-600 mt-1">{entry.quantity}</p>
                    <p className="text-xs text-gray-500 mt-1">{entry.document}</p>
                    <p className="text-xs text-gray-500 mt-1">{entry.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">Saldo: {entry.balance}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-2">Mantenimiento</p>
              <ul className="space-y-1 text-sm text-gray-600">
                {meta.maintenanceHistory.map((entry, index) => <li key={`${meta.sku}-m-${index}`}>{entry}</li>)}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-2">Daños / observaciones</p>
              <ul className="space-y-1 text-sm text-gray-600">
                {meta.damageHistory.map((entry, index) => <li key={`${meta.sku}-d-${index}`}>{entry}</li>)}
              </ul>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={() => onMove(item)} className="flex-1 bg-navy hover:bg-navy-700 text-white font-semibold py-2.5 rounded-xl transition-colors">Registrar movimiento</button>
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
