'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2 } from 'lucide-react';
import { getRooms, getSettings, getAvailability, createReservation } from '@/lib/wp';

interface Option { label: string; value: string }
interface Message { role: 'user' | 'assistant'; content: string; options?: Option[]; timestamp: Date }

type Step =
  | 'menu' | 'book_checkin' | 'book_checkout' | 'book_guests'
  | 'book_room' | 'book_name' | 'book_email' | 'book_phone'
  | 'book_confirm' | 'done' | 'handoff';

interface Draft {
  checkIn?: string; checkOut?: string; adults?: number;
  roomTypeId?: string; roomTypeName?: string; price?: number; nights?: number; total?: number;
  name?: string; email?: string; phone?: string;
}

const WA_DEFAULT = '51942330137';
const todayStr = () => new Date().toISOString().slice(0, 10);
const nightsBetween = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000));
const fmtDate = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
const money = (n: number) => 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const has = (t: string, ws: string[]) => ws.some(w => t.includes(w));

const MENU_OPTIONS: Option[] = [
  { label: 'Ver habitaciones y precios', value: 'rooms' },
  { label: 'Hacer una reserva', value: 'book' },
  { label: 'Servicios del hotel', value: 'services' },
  { label: 'Hablar con recepcion', value: 'handoff' },
];
const QUICK: Option[] = [
  { label: 'Habitaciones', value: 'rooms' },
  { label: 'Reservar', value: 'book' },
  { label: 'Recepcion', value: 'handoff' },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>('menu');
  const [inputMode, setInputMode] = useState<'text' | 'date'>('text');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [draft, setDraft] = useState<Draft>({});
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [waNumber, setWaNumber] = useState(WA_DEFAULT);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      botSay(
        'Hola! Soy el asistente del Hotel Boutique Casagrande. Escribeme tu consulta (horarios, ubicacion, servicios...) o elige una opcion. Tambien puedo ayudarte a reservar al instante.',
        MENU_OPTIONS
      );
      getSettings().then((s) => {
        setSettings(s || {});
        if (s.contact_whatsapp) setWaNumber(s.contact_whatsapp.replace(/\D/g, '') || WA_DEFAULT);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function botSay(content: string, options?: Option[]) {
    setMessages(prev => [...prev, { role: 'assistant', content, options, timestamp: new Date() }]);
  }
  function userSay(content: string) {
    setMessages(prev => [...prev, { role: 'user', content, timestamp: new Date() }]);
  }
  async function think(ms = 450) { setIsTyping(true); await new Promise(r => setTimeout(r, ms)); setIsTyping(false); }

  // ---------- Bot entrenado (sin LLM): respuestas por intencion ----------
  function s(key: string, fallback: string) { return settings[key] || fallback; }

  async function freeTextAnswer(raw: string) {
    userSay(raw);
    setInput('');
    const t = norm(raw);
    await think();

    if (has(t, ['asesor', 'humano', 'persona real', 'recepcion', 'agente', 'operador', 'hablar con alguien'])) return handoff();
    if (has(t, ['reservar', 'hacer una reserva', 'quiero reserva', 'reservacion', 'agendar', 'quiero una habitacion', 'disponibilidad', 'hay cupo', 'hay espacio'])) return startBooking();
    if (has(t, ['precio', 'tarifa', 'cuesta', 'cuanto', 'costo', 'habitacion', 'habitaciones', 'cuarto', 'cuartos', 'suite', 'room'])) return showRooms();
    if (has(t, ['desayuno'])) return botSay('Si, el desayuno buffet esta incluido en la tarifa de todas las habitaciones.', QUICK);
    if (has(t, ['restaurante', 'menu', 'carta', 'plato', 'comida', 'almuerzo', 'cena', 'gastronom', 'comer'])) return botSay('Nuestro restaurante ofrece cocina arequipena: rocoto relleno, chupe de camarones, adobo y mas. Puedes ver la carta y los platos se sirven en el hotel.', [{ label: 'Ver la carta', value: 'url:/restaurante' }, { label: 'Reservar', value: 'book' }]);
    if (has(t, ['check-in', 'checkin', 'check in', 'hora de entrada', 'hora de llegada', 'check-out', 'checkout', 'check out', 'hora de salida', 'horario', 'a que hora'])) return botSay(`Check-in desde las ${s('checkin_time', '2:00 p. m.')} y check-out hasta las ${s('checkout_time', '12:00 m.')}. Nuestra recepcion atiende las 24 horas.`, QUICK);
    if (has(t, ['donde', 'ubicacion', 'direccion', 'como llego', 'mapa', 'queda', 'ubicad', 'llegar', 'estan'])) return botSay(`Estamos en ${s('contact_address', 'Av. Luna Pizarro 202, Vallecito, Arequipa, Peru')}, una zona tranquila y central de la Ciudad Blanca.`, QUICK);
    if (has(t, ['wifi', 'internet', 'wi-fi', 'conexion'])) return botSay('Si, contamos con WiFi de alta velocidad gratis en todo el hotel.', QUICK);
    if (has(t, ['estacionamiento', 'cochera', 'parking', 'garaje', 'auto', 'carro'])) return botSay('Si, tenemos estacionamiento privado para huespedes (segun disponibilidad).', QUICK);
    if (has(t, ['mascota', 'perro', 'gato', 'pet'])) return botSay('Por politica no se admiten mascotas en las instalaciones; consulta con recepcion por excepciones.', QUICK);
    if (has(t, ['evento', 'boda', 'matrimonio', 'salon', 'reunion', 'conferencia', 'capacitacion', 'luna de miel', 'catering', 'banquete'])) return botSay('Ofrecemos salas para eventos y reuniones, paquetes de luna de miel y catering. Mira los detalles en la pagina de Servicios.', [{ label: 'Ver servicios', value: 'url:/servicios' }, { label: 'Hablar con recepcion', value: 'handoff' }]);
    if (has(t, ['servicio', 'servicios', 'amenidad', 'ofrecen', 'incluye', 'que tienen', 'comodidad'])) return showServices();
    if (has(t, ['pago', 'pagar', 'tarjeta', 'yape', 'plin', 'efectivo', 'transferencia', 'deposito', 'visa'])) return botSay('Aceptamos Izipay, Yape, Plin y transferencia bancaria. Las credenciales y enlaces se configuran desde WordPress; recepcion puede coordinar el cobro manual dentro de la ventana de 24 horas.', QUICK);
    if (has(t, ['cancel', 'politica', 'reembolso', 'anular', 'devolucion'])) return botSay('Cancelacion gratuita hasta 48 horas antes de la llegada; despues se aplica el cargo de 1 noche. Recepcion coordina los detalles.', QUICK);
    if (has(t, ['aeropuerto', 'transfer', 'traslado', 'recojo', 'pickup', 'movilidad'])) return botSay('Ofrecemos transfer al aeropuerto, a coordinar previamente con recepcion.', QUICK);
    if (has(t, ['telefono', 'numero', 'contacto', 'llamar', 'whatsapp', 'celular', 'correo', 'email', 'mail'])) return botSay(`Telefono: ${s('contact_phone', '(054) 214000')}\nWhatsApp: ${s('contact_whatsapp', '+51 942 330 137')}\nEmail: ${s('contact_email', 'reservas@hotelcasagrande.pe')}`, [{ label: 'Abrir WhatsApp', value: 'wa' }, ...QUICK]);
    if (has(t, ['gracias', 'genial', 'perfecto', 'muy amable', 'excelente'])) return botSay('Con gusto! ¿Algo mas en que ayudarte?', QUICK);
    if (has(t, ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'holi', 'hey'])) return botSay('Hola! ¿En que puedo ayudarte?', MENU_OPTIONS);

    return botSay('Puedo ayudarte con habitaciones y precios, horarios, ubicacion, servicios, el restaurante o una reserva. Tambien puedo conectarte con recepcion para consultas mas especificas.', [...QUICK, { label: 'Servicios', value: 'services' }]);
  }

  // ---------- Router de botones ----------
  async function handleOption(value: string, label: string) {
    userSay(label);
    if (value === 'menu') { await think(); setStep('menu'); botSay('¿En que mas puedo ayudarte?', MENU_OPTIONS); return; }
    if (value === 'rooms') return showRooms();
    if (value === 'services') return showServices();
    if (value === 'handoff') return handoff();
    if (value === 'book') return startBooking();
    if (value.startsWith('guests:')) return chooseGuests(parseInt(value.split(':')[1], 10));
    if (value.startsWith('type:')) return chooseType(value.split(':')[1]);
    if (value === 'confirm') return confirmReservation();
    if (value === 'cancel') { await think(); setDraft({}); setStep('menu'); botSay('Reserva cancelada. ¿Algo mas en que ayudarte?', MENU_OPTIONS); return; }
  }

  async function showRooms() {
    await think();
    const rows = await getRooms();
    if (!rows.length) { botSay('Por ahora no tengo habitaciones cargadas. Escribenos por WhatsApp y te ayudamos.', [{ label: 'WhatsApp recepcion', value: 'handoff' }]); return; }
    const list = rows.map(r => `• ${r.name} — ${money(r.base_price)}/noche (hasta ${r.capacity} pers.)`).join('\n');
    botSay(`Estas son nuestras habitaciones:\n\n${list}`, [
      { label: 'Reservar ahora', value: 'book' }, { label: 'Ver servicios', value: 'services' }, { label: 'Menu', value: 'menu' },
    ]);
  }

  async function showServices() {
    await think();
    botSay(
      'Servicios del hotel:\n• Desayuno buffet incluido\n• WiFi de alta velocidad gratis\n• Estacionamiento privado\n• Servicio al cuarto\n• Recepcion 24/7\n• Salas para eventos y reuniones\n• Paquetes de luna de miel y catering',
      [{ label: 'Ver pagina Servicios', value: 'url:/servicios' }, { label: 'Hacer una reserva', value: 'book' }, { label: 'Menu', value: 'menu' }]
    );
  }

  async function handoff() {
    await think();
    setStep('handoff');
    botSay(`Te conecto con nuestra recepcion. Escribenos por WhatsApp y un asesor te atendera personalmente.`, [
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
    setDraft(d => ({ ...d, adults }));
    await think();
    const avail = await getAvailability(draft.checkIn, draft.checkOut);
    const options = avail.filter(r => r.capacity >= adults && r.available > 0);
    if (!options.length) {
      setStep('handoff');
      botSay('No encuentro disponibilidad en linea para esas fechas y numero de huespedes. Te paso con recepcion para buscar opciones.', [{ label: 'WhatsApp recepcion', value: 'handoff' }, { label: 'Cambiar fechas', value: 'book' }]);
      return;
    }
    setStep('book_room');
    setInputMode('text');
    botSay('Estas habitaciones estan disponibles para tus fechas. Elige una:', options.map(r => ({ label: `${r.name} · ${money(r.base_price)}/noche · ${r.available} disp.`, value: `type:${r.id}` })));
  }

  async function chooseType(typeId: string) {
    const avail = await getAvailability(draft.checkIn, draft.checkOut);
    const tRoom = avail.find(r => r.id === typeId);
    if (!tRoom || !draft.checkIn || !draft.checkOut) { botSay('Hubo un problema, reiniciemos la reserva.', MENU_OPTIONS); setStep('menu'); return; }
    const nights = nightsBetween(draft.checkIn, draft.checkOut) || 1;
    const total = nights * Number(tRoom.base_price);
    setDraft(d => ({ ...d, roomTypeId: tRoom.id, roomTypeName: tRoom.name, price: Number(tRoom.base_price), nights, total }));
    await think();
    setStep('book_name');
    setInputMode('text');
    botSay(`Excelente eleccion: ${tRoom.name}. ${nights} noche(s) = ${money(total)}.\n\nPara confirmar, ¿a nombre de quien va la reserva? (nombre y apellido)`);
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const val = input.trim();
    if (!val) return;

    if (step === 'book_checkin') {
      if (val < todayStr()) { botSay('Esa fecha ya paso. Elige una fecha de llegada valida.'); return; }
      userSay(`Llegada: ${fmtDate(val)}`);
      setDraft(d => ({ ...d, checkIn: val }));
      setStep('book_checkout');
      setInput(new Date(new Date(val + 'T00:00:00').getTime() + 86400000).toISOString().slice(0, 10));
      await think();
      botSay('¿Y tu fecha de salida (check-out)?');
      return;
    }
    if (step === 'book_checkout') {
      if (!draft.checkIn || val <= draft.checkIn) { botSay('El check-out debe ser despues del check-in. Elige otra fecha.'); return; }
      userSay(`Salida: ${fmtDate(val)}`);
      setDraft(d => ({ ...d, checkOut: val }));
      setStep('book_guests');
      setInputMode('text');
      setInput('');
      await think();
      botSay('¿Cuantos huespedes seran?', [1, 2, 3, 4].map(n => ({ label: `${n} ${n === 1 ? 'persona' : 'personas'}`, value: `guests:${n}` })));
      return;
    }
    if (step === 'book_name') {
      userSay(val); setInput('');
      setDraft(d => ({ ...d, name: val }));
      setStep('book_email');
      await think();
      botSay('Gracias. ¿Cual es tu correo electronico?');
      return;
    }
    if (step === 'book_email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { botSay('Ese correo no parece valido. ¿Puedes escribirlo de nuevo?'); return; }
      userSay(val); setInput('');
      setDraft(d => ({ ...d, email: val }));
      setStep('book_phone');
      await think();
      botSay('Por ultimo, ¿un telefono o WhatsApp de contacto?');
      return;
    }
    if (step === 'book_phone') {
      userSay(val); setInput('');
      const d = { ...draft, phone: val };
      setDraft(d);
      setStep('book_confirm');
      await think();
      botSay(
        `Confirmemos tu reserva:\n• Habitacion: ${d.roomTypeName}\n• Check-in: ${fmtDate(d.checkIn!)}\n• Check-out: ${fmtDate(d.checkOut!)}\n• Huespedes: ${d.adults}\n• Noches: ${d.nights}\n• Total: ${money(d.total!)}\n• A nombre de: ${d.name}\n\n¿Confirmo la reserva?`,
        [{ label: 'Si, confirmar', value: 'confirm' }, { label: 'Cancelar', value: 'cancel' }]
      );
      return;
    }
    // Cualquier otro momento: consulta libre -> bot entrenado
    await freeTextAnswer(val);
  }

  async function confirmReservation() {
    userSay('Si, confirmar');
    setIsTyping(true);
    const res = await createReservation({
      name: draft.name || 'Huesped Web', email: draft.email, phone: draft.phone,
      room: draft.roomTypeName, room_id: draft.roomTypeId,
      check_in: draft.checkIn, check_out: draft.checkOut,
      adults: draft.adults || 1, total: draft.total || 0,
      notes: 'Reserva creada por el asistente web',
    });
    setIsTyping(false);
    if (res.ok && res.reservation_code) {
      setStep('done');
      botSay(
        `¡Reserva registrada! 🎉\n\nCodigo: ${res.reservation_code}\n${draft.roomTypeName} · ${fmtDate(draft.checkIn!)} → ${fmtDate(draft.checkOut!)}\nTotal estimado: ${money(draft.total!)}\n\nNuestra recepcion te contactara para confirmar el pago y los detalles. Si prefieres, puede ser por Izipay, Yape, Plin o transferencia bancaria. ¿Algo mas?`,
        [{ label: 'Hacer otra reserva', value: 'book' }, { label: 'WhatsApp recepcion', value: 'handoff' }, { label: 'Menu', value: 'menu' }]
      );
    } else if (res.error === 'no_availability') {
      setStep('menu');
      botSay('Justo se ocupo esa habitacion para esas fechas. ¿Probamos con otras fechas o te conecto con recepcion?', [{ label: 'Cambiar fechas', value: 'book' }, { label: 'WhatsApp recepcion', value: 'handoff' }]);
    } else {
      botSay('No pude registrar la reserva en este momento. Te conecto con recepcion para completarla por WhatsApp.', [{ label: 'WhatsApp recepcion', value: 'handoff' }, { label: 'Menu', value: 'menu' }]);
    }
  }

  function onOptionClick(o: Option) {
    if (o.value === 'wa') { window.open(`https://wa.me/${waNumber}`, '_blank'); return; }
    if (o.value.startsWith('url:')) { window.location.href = o.value.slice(4); return; }
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
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 bg-navy hover:bg-navy-700 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label="Abrir chat"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-gold text-navy-900 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">24h</span>
        </button>
      )}

      {isOpen && (
        <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[370px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[560px] max-h-[calc(100vh-2rem)]'}`}>
          <div className="flex items-center justify-between px-4 py-3 bg-navy rounded-t-2xl text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-navy-900" /></div>
              <div>
                <p className="text-sm font-semibold">Asistente Casagrande</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-white/70">En linea 24/7</span>
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

              {!isTyping && lastOptions.length > 0 && (
                <div className="px-3 py-2 border-t border-gray-100 flex flex-wrap gap-2 bg-white flex-shrink-0">
                  {lastOptions.map(o => (
                    <button key={o.value} onClick={() => onOptionClick(o)}
                      className="text-xs text-navy-700 border border-navy-200 rounded-full px-3 py-1.5 hover:bg-navy hover:text-white transition-colors">
                      {o.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Entrada de texto SIEMPRE disponible (consultas libres + flujo de reserva) */}
              <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 flex gap-2 bg-white rounded-b-2xl flex-shrink-0">
                <input
                  type={inputMode === 'date' ? 'date' : 'text'}
                  min={inputMode === 'date' ? todayStr() : undefined}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={inputMode === 'date' ? '' : (step.startsWith('book_') ? 'Escribe tu respuesta...' : 'Escribe tu consulta...')}
                  className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300 bg-gray-50"
                />
                <button type="submit" disabled={!input.trim()}
                  className="bg-navy disabled:opacity-40 hover:bg-navy-700 text-white w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
