'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { getPosts, WpPost } from '@/lib/wp';

export default function BlogPage() {
  const [posts, setPosts] = useState<WpPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getPosts(30)
      .then(rows => { if (alive) { setPosts(rows || []); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="relative h-72 md:h-80">
        <img src="/hotel/real-13.webp" alt="Blog" className="w-full h-full object-cover" />
        <div className="absolute inset-0 hero-overlay flex items-end pb-10 justify-center text-center">
          <div>
            <p className="font-serif italic text-gold-300 text-xl mb-2">Novedades</p>
            <h1 className="font-serif text-4xl md:text-6xl text-white font-light">Blog Casa Grande</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-gray-600 leading-relaxed">
            Historias, guias y recomendaciones para descubrir Arequipa y vivir al maximo tu estancia en el
            corazon de Vallecito.
          </p>
          <div className="section-divider" />
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
                <div className="h-52 shimmer" />
                <div className="p-6 space-y-3">
                  <div className="h-4 w-24 shimmer rounded" />
                  <div className="h-6 w-full shimmer rounded" />
                  <div className="h-16 w-full shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Pronto publicaremos nuestras primeras historias. Vuelve pronto.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(p => (
              <Link
                key={p.id}
                href={`/blog/articulo?slug=${encodeURIComponent(p.slug)}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="h-52 overflow-hidden bg-gray-100 relative">
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
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {p.date_h}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {p.reading} min</span>
                  </div>
                  <h2 className="font-serif text-2xl text-gray-900 font-light leading-snug mb-3 group-hover:text-navy transition-colors line-clamp-2">
                    {p.title}
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">{p.excerpt}</p>
                  <span className="inline-flex items-center gap-1.5 text-navy font-semibold text-sm mt-auto">
                    Leer mas <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
