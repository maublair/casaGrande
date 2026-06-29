'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, User, Bot, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase, ChatConversation, ChatMessage } from '@/lib/supabase';

const statusColors: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  resolved:  'bg-gray-100 text-gray-600',
  escalated: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  active: 'Activa',
  resolved: 'Resuelta',
  escalated: 'Escalada',
};

export default function ChatAdmin() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selected, setSelected] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');

  useEffect(() => {
    supabase
      .from('chat_conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setConversations(data || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', selected.id)
      .order('created_at')
      .then(({ data }) => setMessages(data || []));
  }, [selected]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !selected) return;
    await supabase.from('chat_messages').insert({ conversation_id: selected.id, role: 'staff', content: reply });
    setMessages(prev => [...prev, { id: Date.now().toString(), conversation_id: selected.id, role: 'staff', content: reply, metadata: {}, created_at: new Date().toISOString() }]);
    setReply('');
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('chat_conversations').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  }

  const stats = {
    active: conversations.filter(c => c.status === 'active').length,
    resolved: conversations.filter(c => c.status === 'resolved').length,
    escalated: conversations.filter(c => c.status === 'escalated').length,
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* Left panel */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Stats */}
        <div className="p-4 border-b border-gray-100 grid grid-cols-3 gap-2">
          {[
            { label: 'Activas', val: stats.active, color: 'text-green-600 bg-green-50' },
            { label: 'Resueltas', val: stats.resolved, color: 'text-gray-600 bg-gray-50' },
            { label: 'Escaladas', val: stats.escalated, color: 'text-red-600 bg-red-50' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-lg p-2 text-center`}>
              <p className={`text-lg font-bold ${s.color.split(' ')[0]}`}>{s.val}</p>
              <p className="text-[10px] font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              Sin conversaciones aun.
            </div>
          ) : conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelected(conv)}
              className={`w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.id === conv.id ? 'bg-navy-50 border-navy-100' : ''}`}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 bg-navy-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-medium text-gray-800 text-sm truncate">{conv.visitor_name || 'Visitante anonimo'}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusColors[conv.status]}`}>
                      {statusLabels[conv.status]}
                    </span>
                  </div>
                  {conv.visitor_email && <p className="text-xs text-gray-400 truncate">{conv.visitor_email}</p>}
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(conv.created_at).toLocaleDateString('es-PE')}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      {selected ? (
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{selected.visitor_name || 'Visitante'}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {selected.visitor_email && <span>{selected.visitor_email}</span>}
                {selected.visitor_phone && <span>{selected.visitor_phone}</span>}
                <span className={`px-2 py-0.5 rounded-full font-medium ${statusColors[selected.status]}`}>
                  {statusLabels[selected.status]}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateStatus(selected.id, 'resolved')} className="flex items-center gap-1 text-xs text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors">
                <CheckCircle className="w-3.5 h-3.5" /> Resolver
              </button>
              <button onClick={() => updateStatus(selected.id, 'escalated')} className="flex items-center gap-1 text-xs text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors">
                <AlertCircle className="w-3.5 h-3.5" /> Escalar
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                )}
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' ? 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm' :
                  msg.role === 'assistant' ? 'bg-navy text-white rounded-br-sm' :
                  'bg-olive text-white rounded-br-sm'
                }`}>
                  {msg.role !== 'user' && (
                    <p className="text-xs opacity-60 mb-1 flex items-center gap-1">
                      {msg.role === 'assistant' ? <><Bot className="w-3 h-3" /> Asistente IA</> : <><User className="w-3 h-3" /> Staff</>}
                    </p>
                  )}
                  {msg.content}
                </div>
                {msg.role !== 'user' && (
                  <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-navy" /> : <User className="w-3.5 h-3.5 text-navy" />}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Reply */}
          <form onSubmit={sendReply} className="p-4 border-t border-gray-100 flex gap-2">
            <input
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Responder como staff..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
            />
            <button type="submit" disabled={!reply.trim()} className="bg-navy hover:bg-navy-700 disabled:opacity-40 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
              Enviar
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center">
          <div className="text-center text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="font-medium">Selecciona una conversacion</p>
            <p className="text-sm mt-1">para ver los mensajes</p>
          </div>
        </div>
      )}
    </div>
  );
}
