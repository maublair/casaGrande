export default function TourTeaser() {
  return (
    <section className="relative h-[380px] md:h-[440px] overflow-hidden">
      {/* Imagen de fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/hotel/real-13.webp)' }}
      />
      {/* Overlay navy degradado */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/70 via-navy-800/60 to-navy-900/85" />

      {/* Contenido */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
        <p className="text-gold-300 text-xs font-medium tracking-[0.4em] uppercase mb-4">
          Experiencia inmersiva
        </p>
        <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white mb-4">
          Recorre el hotel en <span className="italic text-gold-300">360°</span>
        </h2>
        <p className="text-white/75 max-w-xl mx-auto font-light mb-8">
          Explora nuestras suites, jardines y espacios desde donde estés, antes de reservar.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="/tour-virtual"
            className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-600 text-navy-900 font-semibold px-8 py-4 rounded-lg transition-all shadow-lg hover:shadow-xl text-sm tracking-wide uppercase"
          >
            Iniciar recorrido
          </a>
          <span className="inline-flex items-center justify-center border border-white/30 text-white/90 text-xs font-semibold tracking-widest px-3 py-1.5 rounded-full backdrop-blur-sm bg-white/10">
            360°
          </span>
        </div>
      </div>
    </section>
  );
}
