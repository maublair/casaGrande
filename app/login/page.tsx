'use client';

import { useEffect } from 'react';

const WP_ADMIN = 'https://casagrande-cms.bcode.work/wp-admin';

export default function LoginRedirect() {
  useEffect(() => { window.location.href = WP_ADMIN; }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 text-white">
      <div className="text-center">
        <p className="font-serif text-2xl mb-2">Panel de administracion</p>
        <p className="text-white/60 text-sm">Redirigiendo a WordPress (WP-admin)...</p>
        <a href={WP_ADMIN} className="inline-block mt-4 text-gold-300 underline">Ir a WP-admin</a>
      </div>
    </div>
  );
}
