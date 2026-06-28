'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const HOTEL_KNOWLEDGE = {
  checkin: '2:00 PM',
  checkout: '12:00 PM',
  phone: '+51 1 234-5678',
  whatsapp: '+51 987 654 321',
  email: 'reservas@hotelcasagrande.pe',
  address: 'Av. Javier Prado Este 1150, San Isidro, Lima',
  wifi: 'Disponemos de WiFi de alta velocidad gratuito en todas las instalaciones.',
  parking: 'Contamos con estacionamiento privado y seguro para nuestros huespedes.',
  breakfast: 'El desayuno buffet se sirve de 7:00 AM a 10:30 AM. Precio: S/ 35 por persona.',
  pool: 'Tenemos piscina y jacuzzi disponibles para nuestros huespedes.',
  pets: 'Lamentablemente no aceptamos mascotas en las instalaciones.',
  cancellation: 'Cancelacion gratuita hasta 48 horas antes del check-in.',
};

function generateResponse(userMsg: string): string {
  const msg = userMsg.toLowerCase();

  if (msg.includes('reserv') || msg.includes('book') || msg.includes('disponib')) {
    return `Con gusto te ayudo con tu reserva. Puedes reservar directamente en nuestra web haciendo clic en "Reservar Ahora", llamarnos al ${HOTEL_KNOWLEDGE.phone} o escribirnos por WhatsApp al ${HOTEL_KNOWLEDGE.whatsapp}. ¿Para que fechas te interesa alojarte?`;
  }
  if (msg.includes('precio') || msg.includes('tarifa') || msg.includes('costo') || msg.includes('cuanto')) {
    return `Nuestras tarifas van desde S/ 180 por noche para habitacion Simple hasta S/ 520 para nuestra Suite Master. Los precios incluyen impuestos y puedes ver disponibilidad en tiempo real en nuestra pagina de Habitaciones. ¿Te gustaria que te explique que incluye cada tipo de habitacion?`;
  }
  if (msg.includes('check-in') || msg.includes('checkin') || msg.includes('llegada')) {
    return `El check-in es a partir de las ${HOTEL_KNOWLEDGE.checkin}. Si llegas antes, podemos guardar tu equipaje y en caso de disponibilidad podemos realizar un early check-in sin costo adicional. ¿Necesitas mas informacion?`;
  }
  if (msg.includes('check-out') || msg.includes('checkout') || msg.includes('salida')) {
    return `El check-out es hasta las ${HOTEL_KNOWLEDGE.checkout}. Si necesitas salir despues, ofrecemos late check-out hasta las 3:00 PM sujeto a disponibilidad, con un costo adicional. ¿Algo mas en que pueda ayudarte?`;
  }
  if (msg.includes('desayuno') || msg.includes('comida') || msg.includes('restaurante')) {
    return `${HOTEL_KNOWLEDGE.breakfast} Tambien tenemos servicio a la habitacion disponible de 7:00 AM a 10:00 PM. Nuestro restaurante ofrece cocina peruana contemporanea. ¿Deseas incluir el desayuno en tu reserva?`;
  }
  if (msg.includes('wifi') || msg.includes('internet')) {
    return `${HOTEL_KNOWLEDGE.wifi} La clave la encontraras en tu habitacion al momento del check-in. La velocidad es de fibra optica de 100 Mbps.`;
  }
  if (msg.includes('estacionamiento') || msg.includes('parking') || msg.includes('auto') || msg.includes('carro')) {
    return `${HOTEL_KNOWLEDGE.parking} El estacionamiento tiene un costo adicional de S/ 25 por noche. Por favor indicalo en tu reserva para asegurarte un espacio.`;
  }
  if (msg.includes('piscina') || msg.includes('spa') || msg.includes('jacuzzi')) {
    return `${HOTEL_KNOWLEDGE.pool} El horario es de 7:00 AM a 10:00 PM. Los huespedes tienen acceso sin costo adicional. El spa ofrece masajes y tratamientos con cita previa.`;
  }
  if (msg.includes('ubicacion') || msg.includes('donde') || msg.includes('direccion') || msg.includes('llegar')) {
    return `Estamos ubicados en ${HOTEL_KNOWLEDGE.address}. Estamos a 5 minutos del centro financiero de San Isidro y a 20 minutos del aeropuerto Jorge Chavez. Podemos coordinar transporte desde el aeropuerto por S/ 60.`;
  }
  if (msg.includes('cancelar') || msg.includes('cancelacion')) {
    return `Nuestra politica: ${HOTEL_KNOWLEDGE.cancellation}. Las cancelaciones tardias (menos de 48 horas) tienen un cargo equivalente a 1 noche. Para cancelar, escribenos a ${HOTEL_KNOWLEDGE.email} o llamanos al ${HOTEL_KNOWLEDGE.phone}.`;
  }
  if (msg.includes('mascota') || msg.includes('perro') || msg.includes('gato')) {
    return `${HOTEL_KNOWLEDGE.pets} Podemos recomendarte hoteles cercanos que si aceptan mascotas. Disculpa los inconvenientes.`;
  }
  if (msg.includes('boda') || msg.includes('evento') || msg.includes('reunion') || msg.includes('celebracion')) {
    return `Somos el escenario perfecto para bodas y eventos especiales. Contamos con jardines, salon privado y equipo de catering. Para cotizaciones de eventos, contacta a eventos@hotelcasagrande.pe o llamanos al ${HOTEL_KNOWLEDGE.phone}.`;
  }
  if (msg.includes('hola') || msg.includes('buenos') || msg.includes('buenas') || msg.includes('saludos')) {
    return `Hola! Bienvenido al Hotel Boutique Casagrande. Soy tu asistente virtual disponible las 24 horas. ¿En que puedo ayudarte hoy? Puedo informarte sobre disponibilidad, tarifas, servicios o hacer una reserva.`;
  }
  if (msg.includes('gracias') || msg.includes('ok') || msg.includes('perfecto') || msg.includes('genial')) {
    return `Un placer ayudarte. Recuerda que estamos disponibles las 24 horas para cualquier consulta. ¡Esperamos verte pronto en el Hotel Boutique Casagrande!`;
  }
  if (msg.includes('habitacion') || msg.includes('cuarto') || msg.includes('suite') || msg.includes('tipo')) {
    return `Contamos con 5 tipos de habitaciones:\n• Simple (1 pax) - S/ 180/noche\n• Doble (2 pax) - S/ 250/noche\n• Twin (2 camas) - S/ 260/noche\n• Suite Junior - S/ 380/noche\n• Suite Master (con terraza) - S/ 520/noche\n\nTodas incluyen WiFi, TV cable y aire acondicionado. ¿Te interesa alguna en particular?`;
  }

  return `Gracias por tu consulta. Para brindarte la mejor atencion, puedes:\n• Llamarnos: ${HOTEL_KNOWLEDGE.phone}\n• WhatsApp: ${HOTEL_KNOWLEDGE.whatsapp}\n• Email: ${HOTEL_KNOWLEDGE.email}\n\nNuestro equipo de recepcion responde en menos de 5 minutos. ¿Hay algo especifico en lo que pueda orientarte?`;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hola! Soy el asistente virtual del Hotel Boutique Casagrande. Estoy disponible las 24 horas para ayudarte con reservas, informacion de habitaciones, servicios y mas. ¿En que puedo ayudarte?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  async function initConversation() {
    if (conversationId) return conversationId;
    const { data } = await supabase
      .from('chat_conversations')
      .insert({ status: 'active', channel: 'web' })
      .select('id')
      .single();
    if (data) {
      setConversationId(data.id);
      return data.id;
    }
    return null;
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const convId = await initConversation();
    if (convId) {
      await supabase.from('chat_messages').insert({ conversation_id: convId, role: 'user', content: text });
    }

    await new Promise(r => setTimeout(r, 1000 + Math.random() * 800));

    const response = generateResponse(text);
    const assistantMsg: Message = { role: 'assistant', content: response, timestamp: new Date() };
    setMessages(prev => [...prev, assistantMsg]);
    setIsTyping(false);

    if (convId) {
      await supabase.from('chat_messages').insert({ conversation_id: convId, role: 'assistant', content: response });
    }
  }

  const quickReplies = ['Precios de habitaciones', 'Disponibilidad', 'Check-in/out', 'Ubicacion'];

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-navy-DEFAULT hover:bg-navy-700 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label="Abrir chat"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-gold-DEFAULT text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            24h
          </span>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[520px]'}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-navy-DEFAULT rounded-t-2xl text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold-DEFAULT flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Asistente Casagrande</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-white/70">Disponible 24/7</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <Minimize2 className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-navy-DEFAULT" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-navy-DEFAULT text-white rounded-br-sm'
                        : 'bg-white text-gray-800 shadow-sm rounded-bl-sm border border-gray-100'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-gold-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-gold-600" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2 items-center">
                    <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-navy-DEFAULT" />
                    </div>
                    <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick replies */}
              <div className="px-4 py-2 border-t border-gray-100 flex gap-2 overflow-x-auto bg-white flex-shrink-0">
                {quickReplies.map(q => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); }}
                    className="text-xs text-navy-600 border border-navy-200 rounded-full px-3 py-1 whitespace-nowrap hover:bg-navy-50 transition-colors flex-shrink-0"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2 bg-white rounded-b-2xl flex-shrink-0">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Escribe tu consulta..."
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300 bg-gray-50"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="bg-navy-DEFAULT disabled:opacity-40 hover:bg-navy-700 text-white w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                >
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
