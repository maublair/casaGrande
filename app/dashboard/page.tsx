'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarCheck, BedDouble, Clock, Star, ArrowRight,
  User, Mail, Phone, FileText, MapPin, Edit2, CheckCircle,
  XCircle, LogIn, AlertCircle, Home
} from 'lucide-react';
import Navbar from '@/components/hotel/Navbar';
import Footer from '@/components/hotel/Footer';
import ChatWidget from '@/components/hotel/ChatWidget';
import { supabase, Customer, Reservation, RoomType } from '@/lib/supabase';

type ReservationWithRoom = Reservation & {
  rooms?: { room_number: string; room_types?: RoomType } | null;
};

const statusConfig: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pending:     { label: 'Pendiente',   cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  confirmed:   { label: 'Confirmada',  cls: 'bg-blue-100 text-blue-700 border-blue-200',       icon: CheckCircle },
  checked_in:  { label: 'En Casa',     cls: 'bg-green-100 text-green-700 border-green-200',    icon: Home },
  checked_out: { label: 'Completada',  cls: 'bg-gray-100 text-gray-600 border-gray-200',       icon: CheckCircle },
  cancelled:   { label: 'Cancelada',   cls: 'bg-red-100 text-red-600 border-red-200',          icon: XCircle },
  no_show:     { label: 'No Show',     cls: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
};

export default function CustomerDashboard() {
  const [email, setEmail] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [step, setStep] = useState<'login' | 'dashboard'>('login');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [reservations, setReservations] = useState<ReservationWithRoom[]>([]);
  const [activeTab, setActiveTab] = useState<'reservas' | 'perfil'>('reservas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ phone: '', address: '', city: '', preferences: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() && !docNumber.trim()) {
      setError('Ingresa tu email o numero de documento.');
      return;
    }
    setLoading(true);
    setError('');

    let query = supabase.from('customers').select('*');
    if (email.trim()) {
      query = query.eq('email', email.trim().toLowerCase());
    } else {
      query = query.eq('document_number', docNumber.trim());
    }

    const { data, error: err } = await query.maybeSingle();
    setLoading(false);

    if (err || !data) {
      setError('No encontramos una cuenta con esos datos. Verifica tu email o documento.');
      return;
    }

    setCustomer(data);
    setProfileForm({
      phone: data.phone || '',
      address: data.address || '',
      city: data.city || '',
      preferences: data.preferences || '',
    });

    // Load reservations
    const { data: resData } = await supabase
      .from('reservations')
      .select('*, rooms(room_number, room_types(*))')
      .eq('customer_id', data.id)
      .order('created_at', { ascending: false });

    setReservations((resData || []) as ReservationWithRoom[]);
    setStep('dashboard');
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    setSavingProfile(true);
    await supabase.from('customers').update({
      phone: profileForm.phone || null,
      address: profileForm.address || null,
      city: profileForm.city || null,
      preferences: profileForm.preferences || null,
      updated_at: new Date().toISOString(),
    }).eq('id', customer.id);
    setCustomer(prev => prev ? { ...prev, ...profileForm } : null);
    setSavingProfile(false);
    setEditingProfile(false);
  }

  const upcoming = reservations.filter(r =>
    ['pending', 'confirmed', 'checked_in'].includes(r.status) &&
    new Date(r.check_out) >= new Date()
  );
  const past = reservations.filter(r =>
    !['pending', 'confirmed', 'checked_in'].includes(r.status) ||
    new Date(r.check_out) < new Date()
  );

  function nightsFor(r: Reservation) {
    return Math.max(1, Math.ceil((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 86400000));
  }

  function formatDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />

      {step === 'login' ? (
        /* ── LOGIN ── */
        <div className="pt-28 pb-16 px-4">
          <div className="max-w-md mx-auto">
            {/* Hero */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-serif text-3xl text-navy mb-2">
                Portal del <span className="italic text-gold">Huesped</span>
              </h1>
              <p className="text-gray-500 text-sm">
                Accede con tu email o numero de documento para ver tus reservas y perfil.
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5"
            >
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Correo electronico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="tu@email.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <div className="flex-1 h-px bg-gray-200" />
                <span>o</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Numero de documento (DNI / Pasaporte)
                </label>
                <input
                  value={docNumber}
                  onChange={e => { setDocNumber(e.target.value); setError(''); }}
                  placeholder="12345678"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <><LogIn className="w-4 h-4" /> Acceder a mi cuenta</>
                )}
              </button>

              <p className="text-center text-xs text-gray-400 pt-2">
                ¿Primera vez?{' '}
                <Link href="/habitaciones" className="text-navy underline hover:no-underline">
                  Haz tu primera reserva
                </Link>{' '}
                y se creara tu cuenta automaticamente.
              </p>
            </form>

            {/* Info cards */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { icon: CalendarCheck, label: 'Ver reservas', desc: 'Actuales e historial' },
                { icon: BedDouble,     label: 'Detalles',     desc: 'Info de tu estancia' },
                { icon: User,          label: 'Tu perfil',    desc: 'Datos y preferencias' },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl p-3 border border-gray-100 text-center shadow-sm">
                  <card.icon className="w-5 h-5 text-navy mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-gray-700">{card.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── DASHBOARD ── */
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Welcome banner */}
            <div className="bg-navy rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/15 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {customer?.first_name?.[0]}{customer?.last_name?.[0]}
                </div>
                <div>
                  <p className="text-white/60 text-xs tracking-widest uppercase mb-1">Bienvenido de regreso</p>
                  <h1 className="font-serif text-2xl text-white">
                    {customer?.first_name} {customer?.last_name}
                  </h1>
                  <p className="text-white/50 text-sm mt-0.5">
                    {customer?.total_stays} estancia{customer?.total_stays !== 1 ? 's' : ''} &nbsp;·&nbsp;
                    S/ {customer?.total_spent?.toLocaleString()} total
                    {(customer?.total_stays ?? 0) >= 3 && (
                      <span className="ml-2 bg-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        VIP
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/habitaciones"
                  className="flex items-center gap-2 bg-gold hover:bg-gold-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all"
                >
                  <BedDouble className="w-4 h-4" /> Nueva Reserva
                </Link>
                <button
                  onClick={() => { setStep('login'); setCustomer(null); setEmail(''); setDocNumber(''); }}
                  className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all"
                >
                  Salir
                </button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Reservas activas', value: upcoming.length, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Historial total', value: reservations.length, color: 'text-navy', bg: 'bg-navy-50' },
                { label: 'Estancias', value: customer?.total_stays ?? 0, color: 'text-olive', bg: 'bg-olive-50' },
                { label: 'Total gastado', value: `S/ ${(customer?.total_spent ?? 0).toLocaleString()}`, color: 'text-gold', bg: 'bg-gold-50' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-white shadow-sm`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
              {(['reservas', 'perfil'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-white text-navy shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'reservas' ? 'Mis Reservas' : 'Mi Perfil'}
                </button>
              ))}
            </div>

            {/* ── RESERVAS TAB ── */}
            {activeTab === 'reservas' && (
              <div className="space-y-5">
                {/* Upcoming */}
                {upcoming.length > 0 && (
                  <div>
                    <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-green-600" />
                      Reservas Activas
                    </h2>
                    <div className="space-y-3">
                      {upcoming.map(r => <ReservationCard key={r.id} r={r} nightsFor={nightsFor} formatDate={formatDate} />)}
                    </div>
                  </div>
                )}

                {/* Past */}
                {past.length > 0 && (
                  <div>
                    <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      Historial de Estancias
                    </h2>
                    <div className="space-y-3">
                      {past.slice(0, 5).map(r => <ReservationCard key={r.id} r={r} nightsFor={nightsFor} formatDate={formatDate} muted />)}
                    </div>
                  </div>
                )}

                {reservations.length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <BedDouble className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="font-semibold text-gray-600 mb-1">Sin reservas aun</p>
                    <p className="text-gray-400 text-sm mb-6">Haz tu primera reserva y apareceran aqui.</p>
                    <Link
                      href="/habitaciones"
                      className="inline-flex items-center gap-2 bg-navy text-white font-semibold px-6 py-3 rounded-xl hover:bg-navy-700 transition-all"
                    >
                      Ver habitaciones <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ── PERFIL TAB ── */}
            {activeTab === 'perfil' && customer && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800">Mis Datos</h2>
                  <button
                    onClick={() => setEditingProfile(!editingProfile)}
                    className="flex items-center gap-1.5 text-sm text-navy hover:bg-navy-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {editingProfile ? 'Cancelar' : 'Editar'}
                  </button>
                </div>

                {editingProfile ? (
                  <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoRow icon={User}  label="Nombre" value={`${customer.first_name} ${customer.last_name}`} readOnly />
                      <InfoRow icon={Mail}  label="Email"  value={customer.email || '—'} readOnly />
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1.5 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Telefono
                        </label>
                        <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300" placeholder="+51 987 654 321" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Ciudad
                        </label>
                        <input value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300" placeholder="Lima" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-gray-500 block mb-1.5">Direccion</label>
                        <input value={profileForm.address} onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-gray-500 block mb-1.5">Preferencias y notas</label>
                        <textarea value={profileForm.preferences} onChange={e => setProfileForm(f => ({ ...f, preferences: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300 resize-none" rows={3} placeholder="Alergias, preferencias de habitacion, peticiones especiales..." />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setEditingProfile(false)} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors">Cancelar</button>
                      <button type="submit" disabled={savingProfile} className="flex-1 bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all">
                        {savingProfile ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                    <InfoRow icon={User}     label="Nombre completo"  value={`${customer.first_name} ${customer.last_name}`} />
                    <InfoRow icon={Mail}     label="Email"            value={customer.email || '—'} />
                    <InfoRow icon={Phone}    label="Telefono"         value={customer.phone || '—'} />
                    <InfoRow icon={FileText} label="Documento"        value={`${customer.document_type}: ${customer.document_number || '—'}`} />
                    <InfoRow icon={MapPin}   label="Ciudad"           value={customer.city ? `${customer.city}, ${customer.country}` : customer.country} />
                    <InfoRow icon={Star}     label="Estancias totales" value={`${customer.total_stays} estancia${customer.total_stays !== 1 ? 's' : ''}`} />
                    {customer.preferences && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-400 mb-1">Preferencias registradas</p>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">{customer.preferences}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Loyalty banner */}
                {(customer.total_stays ?? 0) >= 3 && (
                  <div className="mx-6 mb-6 bg-gold-50 border border-gold-200 rounded-xl p-4 flex items-center gap-3">
                    <Star className="w-5 h-5 text-gold flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gold-800 text-sm">Cliente VIP Casagrande</p>
                      <p className="text-xs text-gold-700 mt-0.5">Disfruta de beneficios exclusivos: upgrade de habitacion sujeto a disponibilidad, early check-in y atencion preferencial.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
      <ChatWidget />
    </main>
  );
}

function InfoRow({ icon: Icon, label, value, readOnly }: { icon: React.ElementType; label: string; value: string; readOnly?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className={`text-sm font-medium ${readOnly ? 'text-gray-400' : 'text-gray-800'}`}>{value}</p>
    </div>
  );
}

function ReservationCard({
  r, nightsFor, formatDate, muted,
}: {
  r: ReservationWithRoom;
  nightsFor: (r: Reservation) => number;
  formatDate: (d: string) => string;
  muted?: boolean;
}) {
  const cfg = statusConfig[r.status] ?? { label: r.status, cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock };
  const StatusIcon = cfg.icon;
  const nights = nightsFor(r);

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${muted ? 'opacity-75' : ''}`}>
      <div className="flex flex-col sm:flex-row">
        {/* Room image strip */}
        <div className="sm:w-36 h-28 sm:h-auto flex-shrink-0 bg-navy-50 overflow-hidden relative">
          <img
            src="https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?w=400"
            alt="Room"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-navy/30" />
          <div className="absolute bottom-2 left-2 text-white">
            <p className="text-xs font-bold">Hab. {r.rooms?.room_number ?? '—'}</p>
          </div>
        </div>

        <div className="flex-1 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-semibold text-gray-800 text-sm">{r.rooms?.room_types?.name ?? 'Habitacion'}</p>
              <p className="font-mono text-xs text-gray-400">{r.reservation_code}</p>
            </div>
            <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.cls}`}>
              <StatusIcon className="w-3 h-3" />
              {cfg.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <CalendarCheck className="w-3.5 h-3.5 text-gray-400" />
              <span>Entrada: <strong className="text-gray-700">{formatDate(r.check_in)}</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Salida: <strong className="text-gray-700">{formatDate(r.check_out)}</strong></span>
            </div>
            <span>{nights} {nights === 1 ? 'noche' : 'noches'} &middot; {r.adults} adulto{r.adults > 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400">Total: </span>
              <span className="font-bold text-navy">S/ {r.total_amount?.toFixed(0)}</span>
              {r.paid_amount > 0 && r.paid_amount < r.total_amount && (
                <span className="ml-2 text-xs text-orange-600">
                  (Pendiente: S/ {(r.total_amount - r.paid_amount).toFixed(0)})
                </span>
              )}
              {r.paid_amount >= r.total_amount && r.total_amount > 0 && (
                <span className="ml-2 text-xs text-green-600 font-medium">Pagado</span>
              )}
            </div>
            {r.breakfast_included && (
              <span className="text-xs text-olive-700 bg-olive-50 border border-olive-100 px-2 py-0.5 rounded-full">
                Desayuno incluido
              </span>
            )}
          </div>

          {r.special_requests && (
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-100">
              Solicitud especial: {r.special_requests}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
