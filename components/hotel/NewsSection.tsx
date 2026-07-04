'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, Newspaper } from 'lucide-react';
import { getPosts, WpPost } from '@/lib/wp';

// Noticias del hotel: se administran desde WordPress (Entradas + mediateca).
// Si no hay posts publicados, la seccion no se muestra.
export default function NewsSection() {
  const [posts, setPosts] = useState<WpPost[]>([]);

  useEffect(() => {
    let alive = true;
    getPosts(3)
      .then(rows => { if (alive && rows) setPosts(rows.slice(0, 3)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <p className="text-gold-600 text-xs font-semibold tracking-[0.3em] uppercase mb-3 flex items-center gap-2">
              <Newspaper className="w-4 h-4" /> Noticias & Novedades
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-gray-900 font-light">
              Historias desde <span className="italic text-navy">Arequipa</span>
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-navy font-semibold text-sm hover:gap-3 transition-all"
          >
            Ver todas las noticias <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(p => (
            <Link
              key={p.id}
              href={`/blog/articulo?slug=${encodeURIComponent(p.slug)}`}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="h-48 overflow-hidden bg-gray-100 relative">
                <img
                  src={p.image || '/hotel/real-46.webp'}
                  alt={p.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-navy/90 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {p.category}
                </span>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <span className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                  <Calendar className="w-3.5 h-3.5" /> {p.date_h}
                </span>
                <h3 className="font-serif text-xl text-gray-900 font-light leading-snug mb-2 group-hover:text-navy transition-colors line-clamp-2">
                  {p.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{p.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
