'use client';

import { useState } from 'react';
import { X, ChevronRight, User, Mail, Phone, FileText, Utensils, MessageSquare } from 'lucide-react';
import { supabase, RoomType, Room } from '@/lib/supabase';

interface BookingModalProps {
  roomType: RoomType;
  rooms: Room[];
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  nights: number;
  onClose: () => void;
  onSuccess: (code: string) => void;
}

export default function BookingModal({ roomType, rooms, checkIn, checkOut, adults, children, nights, onClose, onSuccess }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    docType: 'DNI', docNumber: '', nationality: 'Peruana',
    breakfast: false, specialRequests: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const baseTotal = roomType.base_price * nights;
  const breakfastTotal = form.breakfast ? 35 * adults * nights : 0;
  const total = baseTotal + breakfastTotal;

  async function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.email) {
      setError('Por favor completa los campos requeridos.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Upsert customer
      let customerId: string | null = null;
      if (form.email) {
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('email', form.email)
          .maybeSingle();

        if (existing) {
          customerId = existing.id;
          await supabase.from('customers').update({
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            document_type: form.docType,
            document_number: form.docNumber,
            nationality: form.nationality,
            updated_at: new Date().toISOString(),
          }).eq('id', customerId);
        } else {
          const { data: newCustomer } = await supabase
            .from('customers')
            .insert({
              first_name: form.firstName,
              last_name: form.lastName,
              email: form.email,
              phone: form.phone,
              document_type: form.docType,
              document_number: form.docNumber,
              nationality: form.nationality,
            })
            .select('id')
            .single();
          if (newCustomer) customerId = newCustomer.id;
        }
      }

      // Pick first available room of this type
      const room = rooms[0];

      // Create reservation
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .insert({
          customer_id: customerId,
          room_id: room?.id || null,
          check_in: checkIn,
          check_out: checkOut,
          adults,
          children,
          status: 'confirmed',
          total_amount: total,
          paid_amount: 0,
          source: 'web',
          breakfast_included: form.breakfast,
          special_requests: form.specialRequests || null,
        })
        .select('reservation_code')
        .single();

      if (resError) throw resError;

      // Update room status
      if (room) {
        await supabase.from('rooms').update({ status: 'reserved' }).eq('id', room.id);
      }

      // Update customer stats
      if (customerId) {
        const { data: cust } = await supabase.from('customers').select('total_stays, total_spent').eq('id', customerId).maybeSingle();
        if (cust) {
          await supabase.from('customers').update({ total_stays: cust.total_stays + 1, total_spent: cust.total_spent + total }).eq('id', customerId);
        }
      }

      onSuccess(reservation.reservation_code);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la reserva. Intentalo nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  function set(k: keyof typeof form, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }));
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white";
  const labelCls = "text-xs font-medium text-gray-600 block mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 relative animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-serif text-2xl text-navy">Reservar {roomType.name}</h2>
            <p className="text-gray-400 text-sm mt-0.5">{checkIn} al {checkOut} &mdash; {nights} {nights === 1 ? 'noche' : 'noches'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-0 px-6 py-4 border-b border-gray-50">
          {['Datos', 'Extras', 'Confirmar'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 text-sm ${step === i + 1 ? 'text-navy font-semibold' : step > i + 1 ? 'text-olive-600' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === i + 1 ? 'bg-navy text-white' : step > i + 1 ? 'bg-olive-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i + 1}
                </div>
                <span className="hidden sm:block">{s}</span>
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300 mx-2" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="p-6">
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}><User className="w-3 h-3 inline mr-1" />Nombre *</label>
                <input value={form.firstName} onChange={e => set('firstName', e.target.value)} className={inputCls} placeholder="Tu nombre" required />
              </div>
              <div>
                <label className={labelCls}>Apellido *</label>
                <input value={form.lastName} onChange={e => set('lastName', e.target.value)} className={inputCls} placeholder="Tu apellido" required />
              </div>
              <div>
                <label className={labelCls}><Mail className="w-3 h-3 inline mr-1" />Email *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} placeholder="tu@email.com" required />
              </div>
              <div>
                <label className={labelCls}><Phone className="w-3 h-3 inline mr-1" />Telefono</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} placeholder="+51 987 654 321" />
              </div>
              <div>
                <label className={labelCls}><FileText className="w-3 h-3 inline mr-1" />Tipo de documento</label>
                <select value={form.docType} onChange={e => set('docType', e.target.value)} className={inputCls}>
                  <option value="DNI">DNI</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="CE">Carnet de Extranjeria</option>
                  <option value="RUC">RUC</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Numero de documento</label>
                <input value={form.docNumber} onChange={e => set('docNumber', e.target.value)} className={inputCls} placeholder="12345678" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Nacionalidad</label>
                <input value={form.nationality} onChange={e => set('nationality', e.target.value)} className={inputCls} placeholder="Peruana" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 border rounded-xl border-gray-200 hover:border-navy-200 cursor-pointer transition-colors" onClick={() => set('breakfast', !form.breakfast)}>
                <div className="flex items-center gap-3">
                  <Utensils className="w-5 h-5 text-olive-600" />
                  <div>
                    <p className="font-medium text-navy">Desayuno Buffet incluido</p>
                    <p className="text-xs text-gray-400">7:00 AM - 10:30 AM | S/ 35 por persona por noche</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-navy">+ S/ {35 * adults * nights}</span>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.breakfast ? 'bg-navy border-navy' : 'border-gray-300'}`}>
                    {form.breakfast && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}><MessageSquare className="w-3 h-3 inline mr-1" />Solicitudes especiales</label>
                <textarea
                  value={form.specialRequests}
                  onChange={e => set('specialRequests', e.target.value)}
                  className={inputCls + ' resize-none'}
                  rows={4}
                  placeholder="Alergias alimentarias, preferencias de habitacion, decoracion especial, etc."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-cream rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-navy">Resumen de tu Reserva</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Huesped</span>
                    <span className="font-medium">{form.firstName} {form.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Habitacion</span>
                    <span className="font-medium">{roomType.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check-in</span>
                    <span className="font-medium">{checkIn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check-out</span>
                    <span className="font-medium">{checkOut}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Huespedes</span>
                    <span className="font-medium">{adults} adultos{children > 0 ? `, ${children} ninos` : ''}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{roomType.name} x {nights} noches</span>
                      <span>S/ {baseTotal.toFixed(0)}</span>
                    </div>
                    {form.breakfast && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Desayuno x {nights} noches</span>
                        <span>S/ {breakfastTotal.toFixed(0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-navy text-base pt-2 border-t border-gray-200 mt-2">
                      <span>Total</span>
                      <span>S/ {total.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">Cancelacion gratuita hasta 48 horas antes del check-in. El pago se realiza en el hotel.</p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 pb-6">
          <button
            onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
            className="flex-1 border-2 border-gray-200 text-gray-600 hover:border-gray-300 font-semibold py-3 rounded-xl transition-all"
          >
            {step === 1 ? 'Cancelar' : 'Atras'}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && (!form.firstName || !form.lastName || !form.email)}
              className="flex-1 bg-navy hover:bg-navy-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gold hover:bg-gold-600 disabled:opacity-60 text-navy-900 font-semibold py-3 rounded-xl transition-all"
            >
              {loading ? 'Reservando...' : 'Confirmar Reserva'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
