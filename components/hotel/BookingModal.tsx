'use client';

import { useState } from 'react';
import { X, ArrowRight, Check, Loader2, CalendarCheck, Users } from 'lucide-react';
import { createReservation } from '@/lib/wp';

interface BookingRoom { id?: string; name: string; base_price: number; capacity: number }
interface BookingModalProps {
  room: BookingRoom;
  onClose: () => void;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults?: number;
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const plusDays = (s: string, d: number) => new Date(new Date(s + 'T00:00:00').getTime() + d * 86400000).toISOString().slice(0, 10);
const money = (n: number) => 'S/ ' + n.toLocaleString('es-PE');

export default function BookingModal({ room, onClose, initialCheckIn, initialCheckOut, initialAdults }: BookingModalProps) {
  // Fechas iniciales de la búsqueda: solo si el rango es válido (checkOut > checkIn).
  const hasValidInitialDates = Boolean(initialCheckIn && initialCheckOut && initialCheckOut > initialCheckIn);
  const maxAdults = Math.max(2, room.capacity);
  const [checkIn, setCheckIn] = useState(hasValidInitialDates && initialCheckIn ? initialCheckIn : todayStr());
  const [checkOut, setCheckOut] = useState(hasValidInitialDates && initialCheckOut ? initialCheckOut : plusDays(todayStr(), 1));
  const [adults, setAdults] = useState(
    typeof initialAdults === 'number' && initialAdults >= 1
      ? Math.min(Math.max(1, Math.round(initialAdults)), maxAdults)
      : 2
  );
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '', payment_method: 'izipay', payment_reference: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [code, setCode] = useState('');

  const nights = Math.max(1, Math.round((+new Date(checkOut + 'T00:00:00') - +new Date(checkIn + 'T00:00:00')) / 86400000));
  const total = nights * room.base_price;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setErrMsg('Completa tu nombre y correo.'); setStatus('error'); return; }
    if (checkOut <= checkIn) { setErrMsg('La fecha de salida debe ser posterior a la de llegada.'); setStatus('error'); return; }
    setStatus('sending'); setErrMsg('');
    const res = await createReservation({
      name: form.name, email: form.email, phone: form.phone, room: room.name, room_id: room.id,
      check_in: checkIn, check_out: checkOut, adults, total, notes: form.notes, payment_method: form.payment_method, payment_reference: form.payment_reference,
    });
    if (res.ok && res.reservation_code) { setCode(res.reservation_code); setStatus('done'); }
    else if (res.error === 'no_availability') { setErrMsg('Esa habitacion ya no tiene disponibilidad para esas fechas. Prueba con otras fechas o escribenos por WhatsApp.'); setStatus('error'); }
    else { setErrMsg('No pudimos registrar la reserva. Intenta de nuevo o escribenos por WhatsApp.'); setStatus('error'); }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-300';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 bg-navy text-white rounded-t-2xl sticky top-0">
          <div>
            <p className="text-xs text-gold-300 uppercase tracking-widest">Reservar</p>
            <h3 className="font-serif text-xl">{room.name}</h3>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {status === 'done' ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-serif text-2xl text-navy mb-1">¡Reserva registrada!</h4>
            <p className="text-gray-500 text-sm mb-4">Codigo <span className="font-semibold text-navy">{code}</span></p>
            <p className="text-gray-500 text-sm">{room.name} · {nights} noche(s) · {money(total)}<br />Nuestra recepcion te contactara para confirmar el pago por Izipay, Yape, Plin o transferencia bancaria.</p>
            <button onClick={onClose} className="mt-6 bg-gold hover:bg-gold-600 text-navy-900 font-semibold px-6 py-2.5 rounded-lg text-sm">Listo</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1"><CalendarCheck className="w-3.5 h-3.5" /> Llegada</label>
                <input type="date" min={todayStr()} value={checkIn} onChange={e => { setCheckIn(e.target.value); if (checkOut <= e.target.value) setCheckOut(plusDays(e.target.value, 1)); }} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1"><CalendarCheck className="w-3.5 h-3.5" /> Salida</label>
                <input type="date" min={plusDays(checkIn, 1)} value={checkOut} onChange={e => setCheckOut(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1"><Users className="w-3.5 h-3.5" /> Huespedes</label>
              <select value={adults} onChange={e => setAdults(Number(e.target.value))} className={inputCls}>
                {Array.from({ length: maxAdults }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
                ))}
              </select>
            </div>
            <div className="border-t border-gray-100 pt-3 grid grid-cols-1 gap-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre y apellido *" className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Correo *" className={inputCls} />
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Telefono / WhatsApp" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Metodo de pago preferido</label>
                  <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} className={inputCls}>
                    <option value="izipay">Izipay</option>
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                    <option value="transferencia">Transferencia bancaria</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="efectivo">Efectivo</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Referencia / voucher</label>
                  <input value={form.payment_reference} onChange={e => setForm(f => ({ ...f, payment_reference: e.target.value }))} placeholder="Opcional" className={inputCls} />
                </div>
              </div>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Pedidos especiales (opcional)" className={inputCls + ' resize-none'} />
            </div>

            <div className="flex items-center justify-between bg-cream rounded-xl px-4 py-3">
              <div className="text-sm text-gray-600">{nights} noche(s) × {money(room.base_price)}</div>
              <div className="text-right"><span className="text-xs text-gray-400 block">Total</span><span className="text-xl font-bold text-navy">{money(total)}</span></div>
            </div>

            {status === 'error' && <p className="text-red-500 text-sm">{errMsg}</p>}

            <button type="submit" disabled={status === 'sending'} className="w-full bg-gold hover:bg-gold-600 disabled:opacity-60 text-navy-900 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              {status === 'sending' ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</> : <>Confirmar reserva <ArrowRight className="w-4 h-4" /></>}
            </button>
            <p className="text-[11px] text-gray-400 text-center">Reserva sin pago en linea. Recepcion confirma disponibilidad y pago.</p>
          </form>
        )}
      </div>
    </div>
  );
}
