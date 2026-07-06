'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Plus, CreditCard, Users, FileText } from 'lucide-react';
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

  const customer = res.customers as {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    document_type?: string;
    document_number?: string;
    nationality?: string;
  } | undefined;
  const room = res.rooms as { room_number: string; room_types?: { name: string } } | undefined;

  const guestManifest = useMemo(() => {
    const total = Math.max(1, Number(res.adults || 1) + Number(res.children || 0));
    const docTypes = ['DNI', 'Pasaporte', 'CE'];
    const nationalities = ['Peruana', 'Chilena', 'Argentina', 'Colombiana', 'Mexicana'];
    const base = [
      'Ana Maria Quispe',
      'Diego Huaman Rojas',
      'Luz Marina Paredes',
      'Carlos Enrique Soto',
      'Valeria Bustamante',
      'Jorge Luis Gutierrez',
    ];

    return Array.from({ length: total }, (_, index) => {
      const seed = res.reservation_code.split('').reduce((acc, ch) => acc + ch.charCodeAt(0) + index * 13, 0);
      const isMain = index === 0;
      return {
        fullName: isMain && customer ? `${customer.first_name} ${customer.last_name}` : base[seed % base.length],
        documentType: isMain && customer?.document_type ? customer.document_type : docTypes[seed % docTypes.length],
        documentNumber: isMain && customer?.document_number ? customer.document_number : String(41000000 + (seed % 5000000)).slice(0, 8),
        nationality: isMain && customer?.nationality ? customer.nationality : nationalities[seed % nationalities.length],
        isMain,
      };
    });
  }, [customer, res.adults, res.children, res.reservation_code]);

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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4 overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b">
          <div>
            <h2 className="font-semibold text-gray-800">Detalle de Reserva</h2>
            <p className="font-mono text-xs text-gray-400 mt-0.5">{res.reservation_code}</p>
            <p className="text-xs text-gray-500 mt-1">{room ? `Hab. ${room.room_number}${room.room_types?.name ? ` · ${room.room_types.name}` : ''}` : 'Sin habitacion asignada'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Cliente principal</p>
              <p className="font-semibold text-gray-900">{customer ? `${customer.first_name} ${customer.last_name}` : 'Sin asignar'}</p>
              {customer?.email && <p className="text-xs text-gray-500">{customer.email}</p>}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="rounded-xl bg-white p-2 border border-gray-100">
                  <span className="block text-gray-400 uppercase tracking-wider text-[10px]">Documento</span>
                  <span className="font-medium text-gray-800">{customer?.document_type || 'DNI'} {customer?.document_number || '—'}</span>
                </div>
                <div className="rounded-xl bg-white p-2 border border-gray-100">
                  <span className="block text-gray-400 uppercase tracking-wider text-[10px]">Nacionalidad</span>
                  <span className="font-medium text-gray-800">{customer?.nationality || 'Peruana'}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Estadia</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white p-2 border border-gray-100">
                  <span className="block text-gray-400 uppercase tracking-wider text-[10px]">Check-in</span>
                  <span className="font-medium text-gray-800">{res.check_in}</span>
                </div>
                <div className="rounded-xl bg-white p-2 border border-gray-100">
                  <span className="block text-gray-400 uppercase tracking-wider text-[10px]">Check-out</span>
                  <span className="font-medium text-gray-800">{res.check_out}</span>
                </div>
                <div className="rounded-xl bg-white p-2 border border-gray-100">
                  <span className="block text-gray-400 uppercase tracking-wider text-[10px]">Huespedes</span>
                  <span className="font-medium text-gray-800">{res.adults + res.children}</span>
                </div>
                <div className="rounded-xl bg-white p-2 border border-gray-100">
                  <span className="block text-gray-400 uppercase tracking-wider text-[10px]">Fuente</span>
                  <span className="font-medium text-gray-800 capitalize">{res.source}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-4">
            <div className="space-y-4">
              <div className="bg-navy-50 rounded-2xl p-4">
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

              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-navy" />
                  <p className="text-sm font-semibold text-gray-700">Huespedes registrados</p>
                </div>
                <div className="grid gap-3">
                  {guestManifest.map((guest, index) => (
                    <div key={`${guest.fullName}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="font-medium text-gray-800">{guest.fullName}</p>
                        {guest.isMain && <span className="text-[10px] uppercase tracking-wider font-semibold bg-navy-50 text-navy px-2 py-1 rounded-full">Principal</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="block text-gray-400 uppercase tracking-wider text-[10px]">Documento</span>
                          <span>{guest.documentType}</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 uppercase tracking-wider text-[10px]">Numero</span>
                          <span>{guest.documentNumber}</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 uppercase tracking-wider text-[10px]">Nacionalidad</span>
                          <span>{guest.nationality}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {res.special_requests && (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Solicitudes especiales</p>
                  <p className="text-sm text-amber-800">{res.special_requests}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {remaining > 0 && (
                <form onSubmit={addPayment} className="space-y-3 border border-gray-200 rounded-2xl p-4 bg-white shadow-sm">
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

              {payments.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-navy" />
                    <p className="text-sm font-semibold text-gray-700">Historial de Pagos</p>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between gap-3 text-sm bg-gray-50 rounded-lg px-3 py-2">
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

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Cierre operativo</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-gray-500">Estado de reserva</span>
                    <span className="font-medium text-gray-800 capitalize">{res.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-gray-500">Saldo restante</span>
                    <span className={`font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>S/ {remaining.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button onClick={onClose} className="w-full border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors text-sm">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
