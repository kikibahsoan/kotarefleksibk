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

export const FloatingWorldChat: React.FC<FloatingWorldChatProps> = ({
  messages,
  roomNumber,
  onSendMessage,
  onReportMessage,
  studentHandle,
}) => {
  // On mobile screens, collapse chat by default so the town map is visible
  const [isOpen, setIsOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 640 : false));
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
      {/* 1. BOTTOM-LEFT FLOATING CHAT PANEL (Matches Reference Image) */}
      {/* ------------------------------------------------------------- */}
      {isOpen ? (
        <div className="absolute bottom-16 sm:bottom-24 left-2.5 sm:left-6 z-30 w-[95vw] sm:w-[360px] max-h-[46vh] sm:h-80 bg-[#121c27]/95 backdrop-blur-md border border-slate-700/70 rounded-2xl shadow-[0_12px_40px_0_rgba(0,0,0,0.7)] flex flex-col overflow-hidden pointer-events-auto transition-all animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800/80 bg-slate-900/70 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <span className="font-bold text-white">Obrolan</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Ruang {roomNumber}</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-mono text-[11px]">{messages.length} pesan</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              title="Tutup obrolan"
              aria-label="Tutup obrolan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages list */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-3.5 py-2 space-y-2 text-xs scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
          >
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                Belum ada pesan. Sapa temanmu di bawah!
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderHandle === studentHandle;
                return (
                  <div
                    key={m.id}
                    className="flex items-baseline justify-between gap-2 py-0.5 group hover:bg-white/5 rounded px-1 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-1">
                      <span
                        className={`font-bold mr-1.5 cursor-pointer text-[12px] ${
                          isMe ? 'text-emerald-400' : 'text-teal-400'
                        }`}
                        title={m.senderName}
                      >
                        {m.senderHandle || '@warga'}
                      </span>
                      <span className="text-slate-100 font-normal break-words leading-relaxed">
                        {m.content}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                      {onReportMessage && !isMe && (
                        <button
                          onClick={() => onReportMessage(m.id)}
                          className="text-slate-500 hover:text-red-400 p-0.5 rounded transition"
                          title="Laporkan pesan"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {m.timestamp || '23.35'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Minimized Chat Pill matching screenshot */
        <button
          onClick={() => setIsOpen(true)}
          className="absolute bottom-6 left-4 sm:left-6 z-20 bg-[#121e2c]/95 hover:bg-[#1a293b] text-white border border-slate-700/60 px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 pointer-events-auto transition transform hover:scale-105 active:scale-95 text-xs font-bold"
          title="Buka Obrolan Warga"
        >
          <MessageSquare className="w-4 h-4 text-slate-200" />
          <span>Obrolan ({messages.length})</span>
        </button>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. BOTTOM-CENTER CHAT INPUT BAR (Matches Reference Image)     */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 w-[92vw] max-w-lg pointer-events-auto">
        <form
          onSubmit={handleSend}
          className="bg-[#121c27]/95 backdrop-blur-xl border border-slate-700/70 rounded-full px-4 py-2 sm:py-2.5 flex items-center gap-3 shadow-[0_12px_40px_0_rgba(0,0,0,0.65)] hover:border-emerald-500/50 transition-colors"
        >
          {/* Chat Icon */}
          <div className="text-emerald-400 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>

          {/* Input field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={120}
            placeholder="Ngobrol dengan warga di dekatmu"
            className="flex-1 bg-transparent text-white text-xs sm:text-sm font-medium placeholder-slate-400 outline-none min-w-0"
          />

          {/* Green Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition shadow-md shrink-0 ${
              inputText.trim()
                ? 'bg-[#10b981] hover:bg-[#059669] text-slate-950 active:scale-90 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
            title="Kirim Pesan (Enter)"
            aria-label="Kirim Pesan"
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 transform translate-x-px -translate-y-px" />
          </button>
        </form>
      </div>
    </>
  );
};
