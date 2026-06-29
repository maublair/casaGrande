import { Utensils, Wifi, Car, Heart, CalendarCheck, Coffee, Sparkles, Shield } from 'lucide-react';

const services = [
  { icon: Utensils, title: 'Restaurante Boutique', desc: 'Cocina peruana contemporanea con ingredientes seleccionados. Desayuno, almuerzo y cena.' },
  { icon: Wifi, title: 'WiFi Fibra Optica', desc: 'Conexion de alta velocidad en todas las instalaciones, gratuita para todos nuestros huespedes.' },
  { icon: Heart, title: 'Spa & Bienestar', desc: 'Masajes relajantes, tratamientos faciales y corporales. Jacuzzi privado en suites.' },
  { icon: Car, title: 'Estacionamiento', desc: 'Estacionamiento privado y seguro con vigilancia 24 horas. Servicio de valet parking.' },
  { icon: CalendarCheck, title: 'Eventos & Bodas', desc: 'Jardines privados y salon para celebraciones intimas. Equipo de catering y coordinacion.' },
  { icon: Coffee, title: 'Room Service', desc: 'Servicio a la habitacion de 7 AM a 10 PM. Menu completo con opciones locales e internacionales.' },
  { icon: Sparkles, title: 'Housekeeping Diario', desc: 'Limpieza y cambio de sabanas todos los dias. Amenities premium de cortesia.' },
  { icon: Shield, title: 'Seguridad 24/7', desc: 'Personal de seguridad permanente, camaras y acceso controlado para tu tranquilidad.' },
];

export default function ServicesSection() {
  return (
    <section id="servicios" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-olive text-xs font-medium tracking-[0.4em] uppercase mb-3">Servicios & Comodidades</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-navy mb-4">
            Todo lo que <span className="italic text-gold">Necesitas</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Cada detalle pensado para hacer de tu estancia una experiencia memorable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map(service => (
            <div
              key={service.title}
              className="group p-6 rounded-2xl border border-gray-100 hover:border-navy-200 hover:bg-navy-50/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="w-12 h-12 bg-navy-50 group-hover:bg-navy rounded-xl flex items-center justify-center mb-4 transition-colors">
                <service.icon className="w-6 h-6 text-navy group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-semibold text-navy text-base mb-2">{service.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{service.desc}</p>
            </div>
          ))}
        </div>

        {/* Wedding banner */}
        <div className="mt-14 rounded-2xl overflow-hidden relative">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(https://deykard.com/uploads/imagenes/hotel-casagrande-5.jpg)' }}
          />
          <div className="absolute inset-0 bg-navy/70" />
          <div className="relative py-14 px-8 sm:px-16 text-center text-white">
            <p className="text-gold-300 text-xs tracking-[0.4em] uppercase mb-3">Eventos Especiales</p>
            <h3 className="font-serif text-3xl sm:text-4xl text-white mb-4">
              Tu Boda, Un Recuerdo <span className="italic text-gold-300">Eterno</span>
            </h3>
            <p className="text-white/75 max-w-xl mx-auto mb-8">
              Nuestros jardines privados y equipo de catering crean el marco perfecto para el dia mas especial de tu vida.
            </p>
            <a
              href="#contacto"
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold-600 text-navy-900 font-semibold px-8 py-3.5 rounded-lg transition-all"
            >
              Solicitar Cotizacion
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
