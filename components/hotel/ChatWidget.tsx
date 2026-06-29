'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Option { label: string; value: string }
interface Message {
  role: 'user' | 'assistant';
  content: string;
  options?: Option[];
  timestamp: Date;
}

type Step =
  | 'menu' | 'book_checkin' | 'book_checkout' | 'book_guests'
  | 'book_room' | 'book_name' | 'book_email' | 'book_phone'
  | 'book_confirm' | 'done' | 'handoff';

interface RoomTypeRow { id: string; name: string; description: string | null; base_price: number; capacity: number }
interface Draft {
  checkIn?: string; checkOut?: string; adults?: number; children?: number;
  roomTypeId?: string; roomTypeName?: string; price?: number; nights?: number; total?: number;
  name?: string; email?: string; phone?: string;
}

const WA_DEFAULT = '51942330137';
const todayStr = () => new Date().toISOString().slice(0, 10);
const nightsBetween = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000));
const fmtDate = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
const money = (n: number) => 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const MENU_OPTIONS: Option[] = [
  { label: 'Ver habitaciones y precios', value: 'rooms' },
  { label: 'Hacer una reserva', value: 'book' },
  { label: 'Servicios del hotel', value: 'services' },
  { label: 'Hablar con recepcion', value: 'handoff' },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>('menu');
  const [inputMode, setInputMode] = useState<'none' | 'text' | 'date'>('none');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [draft, setDraft] = useState<Draft>({});
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [waNumber, setWaNumber] = useState(WA_DEFAULT);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  // Saludo inicial al abrir
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      botSay(
        'Hola! Soy el asistente del Hotel Boutique Casagrande. Puedo mostrarte habitaciones, informarte sobre servicios y ayudarte a reservar al instante. ¿Que deseas hacer?',
        MENU_OPTIONS
      );
      supabase.from('hotel_settings').select('value').eq('key', 'contact_whatsapp').single()
        .then(({ data }) => { if (data?.value) setWaNumber(data.value.replace(/\D/g, '') || WA_DEFAULT); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function botSay(content: string, options?: Option[]) {
    setMessages(prev => [...prev, { role: 'assistant', content, options, timestamp: new Date() }]);
    persist('assistant', content);
  }
  function userSay(content: string) {
    setMessages(prev => [...prev, { role: 'user', content, timestamp: new Date() }]);
    persist('user', content);
  }

  async function ensureConversation() {
    if (conversationId) return conversationId;
    const { data } = await supabase.from('chat_conversations')
      .insert({ status: 'active', channel: 'web', intent: 'asistente_web' }).select('id').single();
    if (data) { setConversationId(data.id); return data.id as string; }
    return null;
  }
  async function persist(role: string, content: string) {
    const id = await ensureConversation();
    if (id) await supabase.from('chat_messages').insert({ conversation_id: id, role, content });
  }

  async function think(ms = 500) { setIsTyping(true); await new Promise(r => setTimeout(r, ms)); setIsTyping(false); }

  // ---- Habitaciones disponibles (con conteo) ----
  async function loadRooms(minCapacity = 0): Promise<(RoomTypeRow & { available: number })[]> {
    const { data: types } = await supabase.from('room_types').select('id,name,description,base_price,capacity').order('base_price');
    const { data: rooms } = await supabase.from('rooms').select('room_type_id,status').eq('status', 'available');
    const counts: Record<string, number> = {};
    (rooms || []).forEach(r => { counts[r.room_type_id] = (counts[r.room_type_id] || 0) + 1; });
    return (types || [])
      .map(t => ({ ...t, available: counts[t.id] || 0 }))
      .filter(t => t.capacity >= minCapacity);
  }

  // ---- Router de acciones (botones) ----
  async function handleOption(value: string, label: string) {
    userSay(label);
    setInputMode('none');

    if (value === 'menu') { await think(); setStep('menu'); botSay('¿En que mas puedo ayudarte?', MENU_OPTIONS); return; }
    if (value === 'rooms') return showRooms();
    if (value === 'services') return showServices();
    if (value === 'handoff') return handoff();
    if (value === 'book') return startBooking();

    if (value.startsWith('guests:')) { return chooseGuests(parseInt(value.split(':')[1], 10)); }
    if (value.startsWith('type:')) { return chooseType(value.split(':')[1]); }
    if (value === 'confirm') return confirmReservation();
    if (value === 'cancel') { await think(); setDraft({}); setStep('menu'); botSay('Reserva cancelada. ¿Algo mas en que ayudarte?', MENU_OPTIONS); return; }
  }

  async function showRooms() {
    await think();
    const rows = await loadRooms();
    if (!rows.length) { botSay('Por ahora no tengo habitaciones cargadas. Escribenos por WhatsApp y te ayudamos.', [{ label: 'WhatsApp recepcion', value: 'handoff' }]); return; }
    const list = rows.map(r => `• ${r.name} — ${money(r.base_price)}/noche (hasta ${r.capacity} pers., ${r.available} disp.)`).join('\n');
    botSay(`Estas son nuestras habitaciones:\n\n${list}`, [
      { label: 'Reservar ahora', value: 'book' },
      { label: 'Ver servicios', value: 'services' },
      { label: 'Menu', value: 'menu' },
    ]);
  }

  async function showServices() {
    await think();
    botSay(
      'Servicios incluidos y disponibles:\n• Desayuno buffet incluido\n• WiFi de fibra optica gratis\n• Estacionamiento privado\n• Servicio al cuarto\n• Recepcion 24/7\n• Transfer al aeropuerto (a coordinar)\n• Salon para eventos y bodas',
      [{ label: 'Hacer una reserva', value: 'book' }, { label: 'Menu', value: 'menu' }]
    );
  }

  async function handoff() {
    await think();
    setStep('handoff');
    const url = `https://wa.me/${waNumber}`;
    botSay(`Te conecto con nuestra recepcion. Escribenos por WhatsApp y un asesor te atendera personalmente:\n${url}`, [
      { label: 'Abrir WhatsApp', value: 'wa' }, { label: 'Menu', value: 'menu' },
    ]);
  }

  async function startBooking() {
    await think();
    setDraft({});
    setStep('book_checkin');
    setInputMode('date');
    setInput(todayStr());
    botSay('Perfecto, hagamos tu reserva. ¿Cual es tu fecha de llegada (check-in)? Selecciona la fecha y envia.');
  }

  async function chooseGuests(adults: number) {
    const d = { ...draft, adults, children: 0 };
    setDraft(d);
    await think();
    const rows = await loadRooms(adults);
    const avail = rows.filter(r => r.available > 0);
    if (!avail.length) {
      setStep('handoff');
      botSay('No encuentro disponibilidad para esas fechas/huespedes en linea. Te paso con recepcion para buscar opciones.', [{ label: 'WhatsApp recepcion', value: 'handoff' }, { label: 'Menu', value: 'menu' }]);
      return;
    }
    setStep('book_room');
    const opts = avail.map(r => ({ label: `${r.name} · ${money(r.base_price)}/noche`, value: `type:${r.id}` }));
    botSay('Elige el tipo de habitacion:', opts);
  }

  async function chooseType(typeId: string) {
    const rows = await loadRooms();
    const t = rows.find(r => r.id === typeId);
    if (!t || !draft.checkIn || !draft.checkOut) { botSay('Hubo un problema, reiniciemos la reserva.', MENU_OPTIONS); setStep('menu'); return; }
    const nights = nightsBetween(draft.checkIn, draft.checkOut) || 1;
    const total = nights * Number(t.base_price);
    setDraft(d => ({ ...d, roomTypeId: t.id, roomTypeName: t.name, price: Number(t.base_price), nights, total }));
    await think();
    setStep('book_name');
    setInputMode('text');
    botSay(`Excelente eleccion: ${t.name}. ${nights} noche(s) = ${money(total)}.\n\nPara confirmar, ¿a nombre de quien va la reserva? (nombre y apellido)`);
  }

  // ---- Entrada de texto / fecha ----
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const val = input.trim();
    if (!val) return;

    if (step === 'book_checkin') {
      if (val < todayStr()) { botSay('Esa fecha ya paso. Elige una fecha de llegada valida.'); return; }
      userSay(`Llegada: ${fmtDate(val)}`);
      setDraft(d => ({ ...d, checkIn: val }));
      setStep('book_checkout');
      const next = new Date(new Date(val + 'T00:00:00').getTime() + 86400000).toISOString().slice(0, 10);
      setInput(next);
      await think();
      botSay('¿Y tu fecha de salida (check-out)?');
      return;
    }
    if (step === 'book_checkout') {
      if (!draft.checkIn || val <= draft.checkIn) { botSay('El check-out debe ser despues del check-in. Elige otra fecha.'); return; }
      userSay(`Salida: ${fmtDate(val)}`);
      setDraft(d => ({ ...d, checkOut: val }));
      setStep('book_guests');
      setInputMode('none');
      await think();
      botSay('¿Cuantos huespedes seran?', [1, 2, 3, 4].map(n => ({ label: `${n} ${n === 1 ? 'persona' : 'personas'}`, value: `guests:${n}` })));
      return;
    }
    if (step === 'book_name') {
      userSay(val);
      setDraft(d => ({ ...d, name: val }));
      setStep('book_email');
      await think();
      botSay('Gracias. ¿Cual es tu correo electronico?');
      return;
    }
    if (step === 'book_email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { botSay('Ese correo no parece valido. ¿Puedes escribirlo de nuevo?'); return; }
      userSay(val);
      setDraft(d => ({ ...d, email: val }));
      setStep('book_phone');
      await think();
      botSay('Por ultimo, ¿un telefono o WhatsApp de contacto?');
      return;
    }
    if (step === 'book_phone') {
      userSay(val);
      const d = { ...draft, phone: val };
      setDraft(d);
      setStep('book_confirm');
      setInputMode('none');
      await think();
      botSay(
        `Confirmemos tu reserva:\n• Habitacion: ${d.roomTypeName}\n• Check-in: ${fmtDate(d.checkIn!)}\n• Check-out: ${fmtDate(d.checkOut!)}\n• Huespedes: ${d.adults}\n• Noches: ${d.nights}\n• Total: ${money(d.total!)}\n• A nombre de: ${d.name}\n\n¿Confirmo la reserva?`,
        [{ label: 'Si, confirmar', value: 'confirm' }, { label: 'Cancelar', value: 'cancel' }]
      );
      return;
    }
    // fuera de flujo: texto libre -> derivar
    userSay(val);
    await think();
    botSay('Para esa consulta te atiende mejor nuestro equipo de recepcion. ¿Te conecto por WhatsApp?', [
      { label: 'WhatsApp recepcion', value: 'handoff' }, { label: 'Menu', value: 'menu' },
    ]);
  }

  async function confirmReservation() {
    userSay('Si, confirmar');
    setIsTyping(true);
    try {
      const [first, ...rest] = (draft.name || 'Huesped Web').split(' ');
      const last = rest.join(' ') || '-';
      const { data: customer } = await supabase.from('customers')
        .insert({ first_name: first, last_name: last, email: draft.email, phone: draft.phone, tags: ['chatbot'] })
        .select('id').single();

      const { data: room } = await supabase.from('rooms')
        .select('id').eq('room_type_id', draft.roomTypeId).eq('status', 'available').limit(1).single();

      const { data: reservation, error } = await supabase.from('reservations')
        .insert({
          customer_id: customer?.id ?? null,
          room_id: room?.id ?? null,
          check_in: draft.checkIn, check_out: draft.checkOut,
          adults: draft.adults || 1, children: 0,
          status: 'pending', total_amount: draft.total || 0, source: 'web',
          special_requests: 'Reserva creada por el asistente web',
        })
        .select('reservation_code').single();

      if (error) throw error;
      if (room?.id) await supabase.from('rooms').update({ status: 'reserved' }).eq('id', room.id);
      if (conversationId) await supabase.from('chat_conversations').update({
        visitor_name: draft.name, visitor_email: draft.email, visitor_phone: draft.phone,
        intent: 'reserva', status: 'resolved', resolution_notes: `Reserva ${reservation?.reservation_code}`,
      }).eq('id', conversationId);

      setIsTyping(false);
      setStep('done');
      botSay(
        `¡Reserva registrada! 🎉\n\nCodigo: ${reservation?.reservation_code}\n${draft.roomTypeName} · ${fmtDate(draft.checkIn!)} → ${fmtDate(draft.checkOut!)}\nTotal estimado: ${money(draft.total!)}\n\nNuestra recepcion te contactara para confirmar el pago y los detalles. ¿Algo mas?`,
        [{ label: 'Hacer otra reserva', value: 'book' }, { label: 'WhatsApp recepcion', value: 'handoff' }, { label: 'Menu', value: 'menu' }]
      );
    } catch (err) {
      setIsTyping(false);
      botSay('No pude registrar la reserva en este momento. Te conecto con recepcion para completarla por WhatsApp.', [
        { label: 'WhatsApp recepcion', value: 'handoff' }, { label: 'Menu', value: 'menu' },
      ]);
    }
  }

  function onOptionClick(o: Option) {
    if (o.value === 'wa') { window.open(`https://wa.me/${waNumber}`, '_blank'); return; }
    handleOption(o.value, o.label);
  }

  const lastOptions = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].options) return messages[i].options!;
      if (messages[i].role === 'user') break;
    }
    return [];
  })();

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-navy hover:bg-navy-700 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label="Abrir chat"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-gold text-navy-900 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">24h</span>
        </button>
      )}

      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 w-[370px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[560px] max-h-[calc(100vh-3rem)]'}`}>
          <div className="flex items-center justify-between px-4 py-3 bg-navy rounded-t-2xl text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-navy-900" />
              </div>
              <div>
                <p className="text-sm font-semibold">Asistente Casagrande</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-white/70">Reservas en linea 24/7</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Minimize2 className="w-4 h-4" /></button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0 mt-0.5"><Bot className="w-3.5 h-3.5 text-navy" /></div>
                    )}
                    <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === 'user' ? 'bg-navy text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm rounded-bl-sm border border-gray-100'
                    }`}>{msg.content}</div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-gold-100 flex items-center justify-center flex-shrink-0 mt-0.5"><User className="w-3.5 h-3.5 text-gold-600" /></div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2 items-center">
                    <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0"><Bot className="w-3.5 h-3.5 text-navy" /></div>
                    <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Opciones (botones) */}
              {!isTyping && lastOptions.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100 flex flex-wrap gap-2 bg-white flex-shrink-0">
                  {lastOptions.map(o => (
                    <button key={o.value} onClick={() => onOptionClick(o)}
                      className="text-xs text-navy-700 border border-navy-200 rounded-full px-3 py-1.5 hover:bg-navy hover:text-white transition-colors">
                      {o.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Entrada de texto / fecha (solo cuando aplica) */}
              {inputMode !== 'none' && (
                <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 flex gap-2 bg-white rounded-b-2xl flex-shrink-0">
                  <input
                    type={inputMode === 'date' ? 'date' : 'text'}
                    min={inputMode === 'date' ? todayStr() : undefined}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={inputMode === 'text' ? 'Escribe tu respuesta...' : ''}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300 bg-gray-50"
                  />
                  <button type="submit" disabled={!input.trim()}
                    className="bg-navy disabled:opacity-40 hover:bg-navy-700 text-white w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
