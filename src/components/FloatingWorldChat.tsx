import React, { useState, useRef, useEffect } from 'react';
import { PublicChatMessage } from '../types/index.ts';
import { Flag, X, MessageSquare, Send } from 'lucide-react';

interface FloatingWorldChatProps {
  messages: PublicChatMessage[];
  roomNumber: number;
  onSendMessage: (text: string) => void;
  onReportMessage?: (id: string) => void;
  studentHandle: string;
}

const formatChatTime = (timestamp?: string, createdAt?: string) => {
  if (timestamp && timestamp !== '23.35' && timestamp.includes('.')) {
    return timestamp;
  }
  if (createdAt) {
    try {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) {
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}.${m}`;
      }
    } catch {}
  }
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`;
};

export const FloatingWorldChat: React.FC<FloatingWorldChatProps> = ({
  messages,
  roomNumber,
  onSendMessage,
  onReportMessage,
  studentHandle,
}) => {
  // Open by default on all screen sizes so chat and typing board are immediately visible
  const [isOpen, setIsOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* 1. FLOATING CHAT PANEL (Positioned above input on mobile & desktop) */}
      {/* ------------------------------------------------------------- */}
      {isOpen ? (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute bottom-[calc(max(0.85rem,env(safe-area-inset-bottom))+3.5rem)] sm:bottom-24 left-2.5 right-2.5 sm:right-auto sm:left-6 z-40 sm:w-[380px] h-52 sm:h-80 max-h-[40vh] bg-[#121e2c]/80 backdrop-blur-md border border-slate-600/60 rounded-2xl shadow-[0_12px_32px_0_rgba(0,0,0,0.5)] flex flex-col overflow-hidden pointer-events-auto transition-all animate-fade-in-up"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-700/60 bg-[#0f172a]/60 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Obrolan Warga
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">X DKV {roomNumber}</span>
              <span className="text-slate-400">•</span>
              <span
                className="text-emerald-400 font-mono text-[11px] flex items-center gap-1"
                title="Tersimpan & sinkron otomatis antar-device. Terhapus otomatis setelah 24 jam."
              >
                <span>{messages.length} pesan</span>
                <span className="text-[9px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-1 rounded font-sans">
                  24 Jam
                </span>
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Sembunyikan obrolan"
              aria-label="Sembunyikan obrolan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages list */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 text-xs scrollbar-thin scrollbar-thumb-slate-600/70 scrollbar-track-transparent overscroll-contain"
          >
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-300/80 text-xs italic py-6">
                Belum ada pesan. Sapa teman sekelasmu di bawah!
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderHandle === studentHandle;
                const isTeacher = Boolean(
                  m.isTeacher ||
                  m.className?.includes('Guru') ||
                  m.senderHandle?.toLowerCase().includes('guru') ||
                  m.senderId?.includes('teacher')
                );
                return (
                  <div
                    key={m.id}
                    className={`rounded-xl p-2 transition-colors ${
                      isTeacher
                        ? 'bg-amber-950/40 border border-amber-500/40 shadow-sm'
                        : isMe
                        ? 'bg-emerald-950/40 border border-emerald-500/30'
                        : 'bg-slate-900/65 border border-slate-700/50 hover:border-slate-600/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isTeacher ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-amber-500/25 text-amber-300 border border-amber-400/50 shadow-sm shrink-0">
                            👨‍🏫 GURU DKV
                          </span>
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: m.avatarColor || '#38bdf8' }}
                          />
                        )}
                        <span
                          className={`font-bold text-xs truncate ${
                            isTeacher
                              ? 'text-amber-300'
                              : isMe
                              ? 'text-emerald-300'
                              : 'text-teal-300'
                          }`}
                          title={`${m.senderName} (${m.className || ''})`}
                        >
                          {m.senderHandle || (isTeacher ? '@guru_dkv' : '@warga')}
                        </span>
                        {m.className && (
                          <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                            ({m.className.includes('DKV 2') ? 'X DKV 2' : m.className.includes('DKV 3') ? 'X DKV 3' : 'DKV'})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatChatTime(m.timestamp, m.createdAt)}
                        </span>
                        {onReportMessage && !isMe && (
                          <button
                            onClick={() => onReportMessage(m.id)}
                            className="text-slate-500 hover:text-red-400 p-0.5 rounded transition cursor-pointer"
                            title="Laporkan pesan"
                          >
                            <Flag className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs sm:text-[13px] text-slate-100 font-normal break-words leading-relaxed pl-3.5">
                      {m.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Minimized Chat Pill: Placed on bottom-left, cleanly above bottom input on mobile */
        <button
          onClick={() => setIsOpen(true)}
          className="absolute bottom-[calc(max(0.85rem,env(safe-area-inset-bottom))+3.5rem)] sm:bottom-6 left-3 sm:left-6 z-40 bg-[#121e2c]/80 hover:bg-[#1a293b]/90 backdrop-blur-md text-white border border-slate-600/50 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-lg flex items-center gap-1.5 sm:gap-2 pointer-events-auto transition transform hover:scale-105 active:scale-95 text-xs font-bold cursor-pointer"
          title="Buka Obrolan Warga"
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>Obrolan Warga ({messages.length})</span>
        </button>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. BOTTOM CHAT INPUT BAR (Dedicated bottom bar on mobile & desktop) */}
      {/* ------------------------------------------------------------- */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="absolute bottom-[max(0.6rem,env(safe-area-inset-bottom))] sm:bottom-6 left-2.5 right-2.5 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-40 sm:w-[90vw] sm:max-w-lg pointer-events-auto"
      >
        <form
          onSubmit={handleSend}
          className="bg-[#121e2c]/80 backdrop-blur-md border border-slate-600/60 rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2.5 sm:gap-3 shadow-[0_10px_30px_0_rgba(0,0,0,0.5)] hover:border-emerald-500/60 focus-within:border-emerald-400/80 transition-colors w-full"
        >
          {/* Chat Icon */}
          <div className="text-emerald-400 shrink-0">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          {/* Input field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={120}
            placeholder="Tulis pesan obrolan kelas..."
            className="flex-1 bg-transparent text-white text-xs sm:text-sm font-medium placeholder-slate-400 outline-none min-w-0"
          />

          {/* Green Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition shadow-md shrink-0 ${
              inputText.trim()
                ? 'bg-[#10b981] hover:bg-[#059669] text-slate-950 active:scale-90 cursor-pointer shadow-emerald-950/40'
                : 'bg-slate-800/70 text-slate-400 cursor-not-allowed opacity-60'
            }`}
            title="Kirim Pesan (Enter)"
            aria-label="Kirim Pesan"
          >
            <Send className="w-3 h-3 sm:w-4 sm:h-4 transform translate-x-px -translate-y-px" />
          </button>
        </form>
      </div>
    </>
  );
};
