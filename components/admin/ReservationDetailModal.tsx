'use client';

import { useEffect, useState } from 'react';
import { X, Plus, CreditCard } from 'lucide-react';
import { supabase, Reservation, Payment } from '@/lib/supabase';

interface Props {
  reservation: Reservation;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ReservationDetailModal({ reservation: res, onClose, onUpdate }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash', reference: '' });
  const [saving, setSaving] = useState(false);

  const customer = res.customers as { first_name: string; last_name: string; email: string; phone: string } | undefined;
  const room = res.rooms as { room_number: string; room_types?: { name: string } } | undefined;

  useEffect(() => {
    supabase.from('payments').select('*').eq('reservation_id', res.id).order('paid_at', { ascending: false }).then(({ data }) => {
      setPayments(data || []);
    });
  }, [res.id]);

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payForm.amount) return;
    setSaving(true);
    const amount = Number(payForm.amount);
    await supabase.from('payments').insert({
      reservation_id: res.id,
      amount,
      method: payForm.method,
      status: 'completed',
      reference: payForm.reference || null,
    });
    const newPaid = (res.paid_amount || 0) + amount;
    await supabase.from('reservations').update({ paid_amount: newPaid }).eq('id', res.id);
    setPayments(prev => [{ id: Date.now().toString(), reservation_id: res.id, amount, method: payForm.method, status: 'completed', reference: payForm.reference, notes: null, paid_at: new Date().toISOString(), created_at: new Date().toISOString() }, ...prev]);
    setPayForm({ amount: '', method: 'cash', reference: '' });
    setSaving(false);
    onUpdate();
  }

  const remaining = Math.max(0, (res.total_amount || 0) - (res.paid_amount || 0));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
          <div>
            <h2 className="font-semibold text-gray-800">Detalle de Reserva</h2>
            <p className="font-mono text-xs text-gray-400 mt-0.5">{res.reservation_code}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Cliente</p>
              <p className="font-medium text-gray-800">{customer ? `${customer.first_name} ${customer.last_name}` : 'Sin asignar'}</p>
              {customer?.email && <p className="text-xs text-gray-500">{customer.email}</p>}
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Habitacion</p>
              <p className="font-medium text-gray-800">{room ? `Hab. ${room.room_number}` : '—'}</p>
              <p className="text-xs text-gray-500">{room?.room_types?.name || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Check-in</p>
              <p className="font-medium text-gray-800">{res.check_in}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Check-out</p>
              <p className="font-medium text-gray-800">{res.check_out}</p>
            </div>
          </div>

          {/* Financial */}
          <div className="bg-navy-50 rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Total reserva</span>
              <span className="font-bold text-navy">S/ {res.total_amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Pagado</span>
              <span className="font-semibold text-green-600">S/ {res.paid_amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-navy-100 pt-2">
              <span className="text-gray-500">Saldo pendiente</span>
              <span className={`font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>S/ {remaining.toFixed(2)}</span>
            </div>
          </div>

          {/* Add payment */}
          {remaining > 0 && (
            <form onSubmit={addPayment} className="space-y-3 border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Registrar Pago
              </p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Monto (S/)"
                  value={payForm.amount}
                  onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
                  required
                />
                <select
                  value={payForm.method}
                  onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
                >
                  <option value="izipay">Izipay</option>
                  <option value="yape">Yape</option>
                  <option value="plin">Plin</option>
                  <option value="transfer">Transferencia bancaria</option>
                  <option value="card">Tarjeta</option>
                  <option value="cash">Efectivo</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Referencia (opcional)"
                  value={payForm.reference}
                  onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
                />
                <button type="submit" disabled={saving} className="bg-navy hover:bg-navy-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </button>
              </div>
            </form>
          )}

          {/* Payments history */}
          {payments.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Historial de Pagos</p>
              <div className="space-y-2">
                {payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-medium text-gray-800">S/ {p.amount?.toFixed(2)}</span>
                      <span className="text-gray-400 ml-2 capitalize">{p.method}</span>
                      {p.reference && <span className="text-gray-400 ml-2 text-xs">Ref: {p.reference}</span>}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(p.paid_at).toLocaleDateString('es-PE')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {res.special_requests && (
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">Solicitudes especiales</p>
              <p className="text-sm text-amber-800">{res.special_requests}</p>
            </div>
          )}

          <button onClick={onClose} className="w-full border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors text-sm">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
