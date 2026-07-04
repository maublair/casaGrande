'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowLeft, User } from 'lucide-react';
import { getPost, WpPostFull } from '@/lib/wp';

export default function ArticuloPage() {
  const [post, setPost] = useState<WpPostFull | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading');

  useEffect(() => {
    // Sin useSearchParams (rompe el export estatico): se lee de window.location.
    const slug = new URLSearchParams(window.location.search).get('slug') || '';
    if (!slug) { setState('notfound'); return; }
    let alive = true;
    getPost(slug)
      .then(p => {
        if (!alive) return;
        if (p) { setPost(p); setState('ok'); } else { setState('notfound'); }
      })
      .catch(() => { if (alive) setState('notfound'); });
    return () => { alive = false; };
  }, []);

  if (state === 'loading') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24">
        <div className="h-8 w-3/4 shimmer rounded mb-4" />
        <div className="h-64 w-full shimmer rounded-2xl mb-6" />
        <div className="space-y-3">{[0,1,2,3,4].map(i => <div key={i} className="h-4 w-full shimmer rounded" />)}</div>
      </div>
    );
  }

  if (state === 'notfound' || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-32 text-center">
        <h1 className="font-serif text-4xl text-gray-900 font-light mb-4">Articulo no encontrado</h1>
        <p className="text-gray-600 mb-8">Es posible que la nota haya sido movida o ya no este disponible.</p>
        <Link href="/blog" className="inline-flex items-center gap-2 bg-navy hover:bg-navy-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al blog
        </Link>
      </div>
    );
  }

  return (
    <article>
      {/* Hero */}
      <div className="relative h-80 md:h-[26rem]">
        <img src={post.image || '/hotel/real-46.webp'} alt={post.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 hero-overlay flex items-end">
          <div className="max-w-3xl mx-auto px-4 pb-10 w-full">
            <span className="inline-block bg-gold text-navy-900 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              {post.category}
            </span>
            <h1 className="font-serif text-3xl md:text-5xl text-white font-light leading-tight">{post.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-5 text-sm text-gray-400 border-b border-gray-100 pb-6 mb-8">
          <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {post.author}</span>
          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {post.date_h}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {post.reading} min de lectura</span>
        </div>

        <div className="article-body" dangerouslySetInnerHTML={{ __html: post.content }} />

        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
          <Link href="/blog" className="inline-flex items-center gap-2 text-navy font-semibold hover:underline">
            <ArrowLeft className="w-4 h-4" /> Volver al blog
          </Link>
          <Link href="/#reservar" className="inline-flex items-center gap-2 bg-gold hover:bg-gold-600 text-navy-900 font-semibold px-6 py-3 rounded-lg transition-colors">
            Reservar tu estancia
          </Link>
        </div>
      </div>
    </article>
  );
}
