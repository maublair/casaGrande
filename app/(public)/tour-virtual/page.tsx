"use client";

import { useState } from "react";
import Link from "next/link";
import { Maximize2, Minimize2, Hand, MousePointer2, MapPin } from "lucide-react";

// Tour 360 real del hotel (colección Kuula) — único tour del sitio.
const KUULA_SRC =
  "https://kuula.co/share/collection/7ctH8?logo=1&info=1&fs=1&vr=0&zoom=1&sd=1&thumbs=1&inst=es";

export default function TourVirtualPage() {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-black" : ""}>
      {!fullscreen && (
        <div className="relative h-64 md:h-80">
          <img
            src="/hotel/real-63.webp"
            alt="Tour Virtual 360 Hotel Casa Grande"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 hero-overlay flex items-end pb-10 justify-center text-center">
            <div>
              <p className="font-serif italic text-gold-300 text-xl mb-2">Explora nuestros espacios</p>
              <h1 className="font-serif text-4xl md:text-6xl text-white font-light tracking-wide">Tour Virtual 360°</h1>
              <p className="text-white/70 mt-3 text-sm md:text-base max-w-xl mx-auto px-4">
                Recorre el hotel en 360° desde tu pantalla. Arrastra para mirar alrededor y usa las miniaturas para cambiar de ambiente.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`${fullscreen ? "h-full p-4" : "max-w-7xl mx-auto px-4 py-10"} flex flex-col ${fullscreen ? "" : "gap-8"}`}>
        {/* Tour 360 — Kuula (único) */}
        <div className={`relative ${fullscreen ? "flex-1" : "rounded-2xl overflow-hidden shadow-2xl"} bg-black`}>
          <div className={`${fullscreen ? "h-full" : "h-[440px] md:h-[560px] lg:h-[640px]"} relative`}>
            <iframe
              src={KUULA_SRC}
              className="w-full h-full border-0"
              allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
              title="Tour Virtual 360° — Hotel Casa Grande"
            />
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-lg flex items-center justify-center backdrop-blur-md transition-all"
              title={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
              <span className="bg-gold text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">360°</span>
            </div>
          </div>
        </div>

        {!fullscreen && (
          <>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Hand, title: "Arrastra para mirar", body: "Mantén presionado y arrastra dentro del visor para girar la vista 360° en cualquier dirección." },
                { icon: MousePointer2, title: "Cambia de ambiente", body: "Usa las miniaturas y los puntos del tour para saltar entre habitaciones, lobby, restaurante y jardines." },
                { icon: Maximize2, title: "Pantalla completa", body: "Activa la pantalla completa para una experiencia inmersiva. En el celular puedes moverlo con el giroscopio." },
              ].map((card) => (
                <div key={card.title} className="flex gap-4 p-5 bg-cream rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 bg-navy/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <card.icon className="w-5 h-5 text-navy" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">{card.title}</h3>
                    <p className="text-gray-600 text-sm">{card.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4 text-navy" />
              <span>Av. Luna Pizarro 202, Vallecito — Arequipa</span>
            </div>

            <div className="text-center mt-2 bg-navy rounded-2xl p-10">
              <h3 className="font-serif text-3xl text-white font-light mb-3">¿Te gustó lo que viste?</h3>
              <p className="text-white/60 mb-6 max-w-lg mx-auto">Reserva ahora y vive la experiencia Casa Grande en persona.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/#reservar" className="bg-gold hover:bg-gold-600 text-navy-900 font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl">
                  Reservar Ahora
                </Link>
                <Link href="/habitaciones" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-3.5 rounded-xl transition-all backdrop-blur-sm">
                  Ver Habitaciones
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
