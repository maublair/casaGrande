'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { sendContact } from '@/lib/wp';

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await sendContact({ name: form.name, email: form.email, phone: form.phone, message: form.message });
      if (res.ok) { setStatus('sent'); setForm({ name: '', email: '', phone: '', message: '' }); }
      else setStatus('error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section id="contacto" className="py-24 bg-navy">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-gold-300 text-xs font-medium tracking-[0.4em] uppercase mb-3">Estamos Para Ti</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-white mb-4">
            Contactanos <span className="italic text-gold-300">Ahora</span>
          </h2>
          <p className="text-white/60 max-w-xl mx-auto">
            Nuestro equipo de recepcion esta disponible las 24 horas para atender tus consultas y reservas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Info */}
          <div className="space-y-6">
            {[
              { icon: Phone, title: 'Telefono', lines: ['(054) 214000', '+51 942 330 137 (WhatsApp)'] },
              { icon: Mail, title: 'Email', lines: ['reservas@hotelcasagrande.pe'] },
              { icon: MapPin, title: 'Ubicacion', lines: ['Av. Luna Pizarro 202, Vallecito', 'Arequipa, Peru'], href: 'https://maps.app.goo.gl/SnxbM6dird9A5Y2fA' },
              { icon: Clock, title: 'Horario de Atencion', lines: ['Recepcion: 24 horas, 7 dias', 'Check-in: 2:00 PM | Check-out: 12:00 PM'] },
            ].map(item => {
              const inner = (
                <>
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-gold-300" />
                  </div>
                  <div>
                    <p className={`text-white font-semibold mb-1 ${item.href ? 'group-hover:text-gold-300 transition-colors' : ''}`}>{item.title}</p>
                    {item.lines.map(line => <p key={line} className="text-white/60 text-sm">{line}</p>)}
                  </div>
                </>
              );
              return item.href ? (
                <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer" className="flex gap-4 group cursor-pointer">
                  {inner}
                </a>
              ) : (
                <div key={item.title} className="flex gap-4">
                  {inner}
                </div>
              );
            })}

            <a
              href="https://wa.me/51942330137"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-4 rounded-xl transition-all mt-4 w-fit"
            >
              <MessageCircle className="w-5 h-5" />
              Chatear por WhatsApp
            </a>
          </div>

          {/* Form */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            {status === 'sent' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="font-serif text-2xl text-white mb-2">Mensaje Enviado</h3>
                <p className="text-white/60">Nos comunicaremos contigo en menos de 30 minutos.</p>
                <button onClick={() => setStatus('idle')} className="mt-6 text-gold-300 hover:text-gold-400 text-sm underline">
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/70 text-xs font-medium block mb-1.5">Nombre</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-gold-300 text-sm"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="text-white/70 text-xs font-medium block mb-1.5">Telefono</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-gold-300 text-sm"
                      placeholder="+51 ..."
                    />
                  </div>
                </div>
                <div>
                  <label className="text-white/70 text-xs font-medium block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-gold-300 text-sm"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-xs font-medium block mb-1.5">Mensaje</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    required
                    rows={4}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-gold-300 text-sm resize-none"
                    placeholder="Cuéntanos en que podemos ayudarte..."
                  />
                </div>
                {status === 'error' && <p className="text-red-400 text-sm">Hubo un error. Intentalo de nuevo.</p>}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-gold hover:bg-gold-600 disabled:opacity-60 text-navy-900 font-semibold py-3.5 rounded-xl transition-all"
                >
                  {status === 'sending' ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
