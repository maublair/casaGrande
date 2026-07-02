import { Star } from 'lucide-react';

const testimonials = [
  {
    quote:
      'El desayuno junto a la ventana fue el mejor comienzo de cada mañana. Todo fresco, todo casero, y con una vista preciosa al jardín.',
    name: 'María',
    origin: 'Lima, Perú',
  },
  {
    quote:
      'Los jardines son un oasis de tranquilidad en plena ciudad. Después de recorrer Arequipa todo el día, volver al hotel era un verdadero descanso.',
    name: 'Thomas',
    origin: 'Múnich, Alemania',
  },
  {
    quote:
      'La atención del personal marca la diferencia: nos recibieron por nuestro nombre y nos ayudaron a organizar cada excursión. Volveremos sin duda.',
    name: 'Valeria',
    origin: 'Santiago, Chile',
  },
];

export default function Testimonials() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-gold-600 text-xs font-medium tracking-[0.4em] uppercase mb-3">
            Nuestros huéspedes
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl text-navy-900 mb-4">
            Lo que dicen <span className="italic text-gold-600">de nosotros</span>
          </h2>
          <div className="section-divider" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map(t => (
            <figure
              key={t.name}
              className="relative bg-cream rounded-2xl border border-gray-100 p-8"
            >
              <span
                aria-hidden="true"
                className="font-serif text-7xl leading-none text-gold select-none absolute top-4 left-6"
              >
                &ldquo;
              </span>
              <div className="flex gap-1 mb-4 pt-8">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <blockquote className="text-navy-800/80 leading-relaxed mb-6">
                {t.quote}
              </blockquote>
              <figcaption className="font-semibold text-navy-900">
                {t.name} <span className="font-normal text-navy-900/50">— {t.origin}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
