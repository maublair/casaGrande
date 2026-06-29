'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Lock, Mail, ArrowRight, User, Shield, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/admin');
    });
  }, [router]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/admin');
    }
  }

  async function quickLogin(userEmail: string, userPass: string) {
    setEmail(userEmail);
    setPassword(userPass);
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: userEmail, password: userPass });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/admin');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-800 via-navy to-navy-900 p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gold rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-olive rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative h-24 w-[204px] mx-auto mb-3">
            <Image
              src="/Logo-Casagrande-1-2048x951.png"
              alt="Hotel Casagrande"
              fill
              className="object-contain"
              priority
            />
          </div>
          <p className="text-white/50 text-sm">Sistema de Gestion Hotelera</p>
        </div>

        {/* Login form */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8">
          <h1 className="text-2xl font-serif text-navy text-center mb-6">Iniciar Sesion</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={signIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Correo Electronico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy-300"
                  placeholder="admin@casagrande.pe"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contrasena</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy-300"
                  placeholder="demo1234"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Ingresar <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">Acceso Rapido Demo</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Demo cards */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => quickLogin('admin@casagrande.pe', 'demo1234')}
              disabled={loading}
              className="group relative bg-gradient-to-br from-navy to-navy-700 rounded-2xl p-4 text-left hover:scale-[1.03] transition-all shadow-md hover:shadow-xl disabled:opacity-50"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-xs font-bold uppercase tracking-wider">Admin</span>
              </div>
              <p className="text-white font-semibold text-sm">Administrador</p>
              <p className="text-white/60 text-xs mt-0.5">admin@casagrande.pe</p>
              <p className="text-white/40 text-[10px] mt-1">Clave: demo1234</p>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </button>

            <button
              onClick={() => quickLogin('cliente@casagrande.pe', 'demo1234')}
              disabled={loading}
              className="group relative bg-gradient-to-br from-olive to-olive-700 rounded-2xl p-4 text-left hover:scale-[1.03] transition-all shadow-md hover:shadow-xl disabled:opacity-50"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-xs font-bold uppercase tracking-wider">Cliente</span>
              </div>
              <p className="text-white font-semibold text-sm">Cliente Demo</p>
              <p className="text-white/60 text-xs mt-0.5">cliente@casagrande.pe</p>
              <p className="text-white/40 text-[10px] mt-1">Clave: demo1234</p>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </button>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Hotel Casagrande · Arequipa, Peru
        </p>
      </div>
    </div>
  );
}
