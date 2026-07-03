'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle } from 'lucide-react';

export default function ContactoPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    await new Promise(r => setTimeout(r, 1000));
    setSent(true);
    setSending(false);
  }

  return (
    <div>
      {/* Hero */}
      <div className="relative h-64 md:h-80">
        <img
          src="/hotel/real-42.webp"
          alt="Contacto"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay flex items-end pb-10 justify-center text-center">
          <div>
            <p className="font-serif italic text-gold-300 text-xl mb-2">Estamos aqui para ti</p>
            <h1 className="font-serif text-4xl md:text-6xl text-white font-light">Contactanos</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-12 items-start">
        {/* Contact info */}
        <div className="space-y-8">
          <div>
            <h2 className="font-serif text-3xl text-gray-900 font-light mb-2">Informacion de contacto</h2>
            <div className="section-divider mx-0" />
          </div>

          <p className="text-gray-600 leading-relaxed">
            El equipo del Hotel Boutique Casagrande esta disponible para ayudarte con tu reserva, 
            responder tus preguntas y asegurarse de que tu estancia sea perfecta.
          </p>

          <div className="space-y-5">
            {[
              { icon: Phone, title: 'Telefono', lines: ['54-214000', '942 330 137'] },
              { icon: Mail, title: 'Correo electronico', lines: ['reservas@hotelcasagrande.pe', 'info@hotelcasagrande.pe'] },
              { icon: MapPin, title: 'Direccion', lines: ['Av. Luna Pizarro 202, Vallecito', 'Arequipa, Peru'] },
              { icon: Clock, title: 'Horario de atencion', lines: ['Recepcion: 24 horas / 7 dias', 'Administracion: Lun-Vie 8am - 6pm'] },
            ].map(item => (
              <div key={item.title} className="flex gap-4">
                <div className="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-navy" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{item.title}</p>
                  {item.lines.map(l => (
                    <p key={l} className="text-gray-800 font-medium">{l}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp CTA */}
          <a
            href="https://wa.me/51942330137"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-[#25D366] hover:bg-[#1fb356] text-white font-semibold px-6 py-4 rounded-xl transition-colors shadow-md hover:shadow-lg w-fit"
          >
            <MessageCircle className="w-5 h-5" />
            Chatear por WhatsApp
          </a>

          {/* Mapa — enlaza a la ubicacion real en Google Maps */}
          <a
            href="https://maps.app.goo.gl/SnxbM6dird9A5Y2fA"
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl overflow-hidden h-48 bg-gray-100 relative"
            aria-label="Ver la ubicacion del hotel en Google Maps"
          >
            <img
              src="/hotel/real-63.webp"
              alt="Ubicacion del Hotel Boutique Casagrande"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
              <div className="bg-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg transition-transform group-hover:scale-105">
                <MapPin className="w-4 h-4 text-navy" />
                <span className="text-sm font-medium text-gray-800">Ver en Google Maps</span>
              </div>
            </div>
          </a>
        </div>

        {/* Contact form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {sent ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-olive-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-olive-600" />
              </div>
              <h3 className="font-serif text-2xl text-gray-900 font-light mb-2">Mensaje enviado</h3>
              <p className="text-gray-600">Nos pondremos en contacto contigo en menos de 24 horas.</p>
              <button
                onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                className="mt-6 text-navy font-medium hover:underline text-sm"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-2xl text-gray-900 font-light mb-6">Enviar un mensaje</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors bg-gray-50/50"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Correo *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors bg-gray-50/50"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Telefono</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors bg-gray-50/50"
                      placeholder="+51 900 000 000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Asunto *</label>
                    <select
                      required
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors bg-gray-50/50"
                    >
                      <option value="">Selecciona un asunto</option>
                      <option value="reserva">Consulta de reserva</option>
                      <option value="evento">Eventos y reuniones</option>
                      <option value="restaurante">Restaurante</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mensaje *</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors bg-gray-50/50 resize-none"
                    placeholder="Cuéntanos en que podemos ayudarte..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 bg-navy hover:bg-navy-700 disabled:opacity-70 text-white font-semibold py-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <><Send className="w-4 h-4" /> Enviar mensaje</>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
