import React, { useState, useEffect, useRef } from 'react';
import { Student, PublicChatMessage } from '../../types/index.ts';
import { StorageService } from '../../utils/storage.ts';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Send,
  Flag,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageCircle,
  Users,
  Check,
  AlertCircle
} from 'lucide-react';

interface MonumenWargaChatModalProps {
  onClose: () => void;
  student: Student;
}

// Room metadata matching DKV classes
const ROOMS_CONFIG: { roomNumber: 1 | 2 | 3; name: string; memberCount: number; visitorCount: number }[] = [
  { roomNumber: 1, name: 'Ruang 1 (X DKV 1)', memberCount: 25, visitorCount: 14 },
  { roomNumber: 2, name: 'Ruang 2 (X DKV 2)', memberCount: 21, visitorCount: 11 },
  { roomNumber: 3, name: 'Ruang 3 (X DKV 3)', memberCount: 14, visitorCount: 8 },
];

// Web Audio chime generator (0 external assets required)
function playChimeAudio(enabled: boolean) {
  if (!enabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // safe fallback
  }
}

export const MonumenWargaChatModal: React.FC<MonumenWargaChatModalProps> = ({
  onClose,
  student,
}) => {
  // Determine initial room based on student class
  const initialRoomNumber = student.className.includes('DKV 2')
    ? 2
    : student.className.includes('DKV 3')
    ? 3
    : 1;

  const [activeRoom, setActiveRoom] = useState<1 | 2 | 3>(initialRoomNumber);
  const [messages, setMessages] = useState<PublicChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSoundOn, setIsSoundOn] = useState(() => {
    return localStorage.getItem('kota_monumen_sound') !== 'false';
  });
  const [isTrayExpanded, setIsTrayExpanded] = useState(true);
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);
  const [reportSuccessId, setReportSuccessId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load and subscribe to chat messages
  useEffect(() => {
    const loadMessages = () => {
      const all = StorageService.getPublicChatMessages();
      setMessages(all);
    };

    loadMessages();

    // Listen to storage events and custom events for multi-tab realtime sync
    const handleStorageUpdate = (e: any) => {
      loadMessages();
      if (isSoundOn) {
        playChimeAudio(true);
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('kota_refleksi_public_chat_updated', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('kota_refleksi_public_chat_updated', handleStorageUpdate);
    };
  }, [isSoundOn]);

  // Filter messages for current room
  const currentRoomMessages = messages
    .filter((m) => m.roomNumber === activeRoom && !m.isReported)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setHasNewMessagesBelow(false);
      } else {
        setHasNewMessagesBelow(true);
      }
    }
  }, [currentRoomMessages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHasNewMessagesBelow(false);
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 60;
      if (isNearBottom) {
        setHasNewMessagesBelow(false);
      }
    }
  };

  const handleToggleSound = () => {
    const nextState = !isSoundOn;
    setIsSoundOn(nextState);
    localStorage.setItem('kota_monumen_sound', String(nextState));
    if (nextState) {
      playChimeAudio(true);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${hours}.${minutes}`;

    // Clean user handle e.g. @budi_santoso
    const cleanHandle = `@${student.name.toLowerCase().replace(/\s+/g, '_')}`;

    const newMsg: PublicChatMessage = {
      id: `pchat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: student.id,
      senderName: student.name,
      senderHandle: cleanHandle,
      className: student.className,
      roomNumber: activeRoom,
      content: trimmed.slice(0, 120),
      timestamp,
      createdAt: now.toISOString(),
      avatarColor: '#38bdf8',
    };

    StorageService.addPublicChatMessage(newMsg);
    setMessages((prev) => [newMsg, ...prev]);
    setInputText('');
    playChimeAudio(isSoundOn);
    setTimeout(scrollToBottom, 60);
  };

  const handleReport = (msgId: string) => {
    StorageService.reportChatMessage(msgId);
    setReportSuccessId(msgId);
    setTimeout(() => {
      setReportSuccessId(null);
    }, 2500);
  };

  const activeRoomData = ROOMS_CONFIG.find((r) => r.roomNumber === activeRoom) || ROOMS_CONFIG[0];
  const latestMessage = currentRoomMessages[currentRoomMessages.length - 1];

  return (
    <div className="fixed inset-0 z-40 flex flex-col pointer-events-none select-none">
      {/* =========================================================================
          TOP BAR OVERLAY (Exact match to reference screenshot)
          ←  [🌸 Monumen Warga • Ruang 1 • 14 pengunjung • 15 warga]  [1 (25)] [2 (21)] [3 (14)]  🔊
         ========================================================================= */}
      <div className="p-3 sm:p-4 flex items-center justify-between gap-2 pointer-events-auto">
        {/* Left: Back Button */}
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 shadow-xl flex items-center justify-center transition active:scale-95"
          title="Kembali ke Peta Kota"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5 text-slate-100" />
        </button>

        {/* Center: Info Pill */}
        <div className="flex-1 max-w-xl mx-auto flex items-center justify-center">
          <div className="bg-slate-900/90 text-white border border-slate-700/80 px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs sm:text-sm font-semibold truncate">
            <span className="text-pink-400">🌸</span>
            <span className="font-bold text-white">Monumen Warga</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-200">Ruang {activeRoom}</span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline">{activeRoomData.visitorCount} pengunjung</span>
            <span className="text-slate-500 hidden md:inline">•</span>
            <span className="text-emerald-400 font-medium hidden md:inline">{activeRoomData.memberCount} warga</span>
          </div>
        </div>

        {/* Right: Room Switcher Pills & Sound Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Room Pills 1(25), 2(21), 3(14) */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 p-1 rounded-full shadow-xl gap-1">
            {ROOMS_CONFIG.map((r) => {
              const isActive = r.roomNumber === activeRoom;
              return (
                <button
                  key={r.roomNumber}
                  onClick={() => setActiveRoom(r.roomNumber)}
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`${r.name} - ${r.memberCount} Siswa`}
                >
                  <span>{r.roomNumber}</span>
                  <span className={`text-[10px] ${isActive ? 'text-slate-900 font-extrabold' : 'text-slate-400'}`}>
                    ({r.memberCount})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Audio toggle button */}
          <button
            onClick={handleToggleSound}
            className={`w-10 h-10 rounded-full border shadow-xl flex items-center justify-center transition active:scale-95 ${
              isSoundOn
                ? 'bg-slate-900/90 hover:bg-slate-800 text-teal-400 border-slate-700/80'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border-slate-700/80'
            }`}
            title={isSoundOn ? 'Suara Aktif (Klik untuk Matikan)' : 'Suara Mati (Klik untuk Nyalakan)'}
            aria-label="Toggle Sound"
          >
            {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* =========================================================================
          CENTER 3D VIEWPORT FLOATING SPEECH BUBBLE (Exact match to reference)
          White speech bubble with downward pointer arrow + @handle underneath
         ========================================================================= */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        {latestMessage && (
          <div className="pointer-events-auto transform transition-all duration-300 hover:scale-105 max-w-sm sm:max-w-md">
            {/* White Speech Bubble */}
            <div className="relative bg-white text-slate-900 px-5 py-3 rounded-2xl shadow-2xl border border-white/90 text-sm sm:text-base font-semibold leading-snug">
              <p className="break-words">{latestMessage.content}</p>

              {/* Speech bubble pointer arrow */}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white" />
            </div>

            {/* Handle tag underneath arrow */}
            <div className="mt-3 flex items-center justify-center">
              <span className="bg-slate-900/90 text-cyan-400 font-mono text-xs px-3 py-1 rounded-full border border-slate-700 shadow-lg font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {latestMessage.senderHandle}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          BOTTOM CHAT TRAY / DRAWER (Exact match to reference screenshot)
          - Header: "Obrolan • X pesan"
          - "Pesan baru ↓" notification button
          - Scrollable message rows with @cyan handle, text, flag report, timestamp
          - Bottom input: "Tulis pesan... (maks. 120 huruf)" and teal "Kirim" button
         ========================================================================= */}
      <div className="p-3 sm:p-4 max-w-2xl w-full mx-auto pointer-events-auto transition-all duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          {/* Tray Header */}
          <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-cyan-400" />
              <span className="font-extrabold text-xs sm:text-sm text-white">
                Obrolan • {currentRoomMessages.length} pesan
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Pesan Baru button when scrolled up */}
              {hasNewMessagesBelow && (
                <button
                  onClick={scrollToBottom}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-extrabold px-3 py-1 rounded-full shadow flex items-center gap-1 animate-bounce transition"
                >
                  <span>Pesan baru</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}

              {/* Minimize/Maximize Tray */}
              <button
                onClick={() => setIsTrayExpanded(!isTrayExpanded)}
                className="w-7 h-7 rounded-full bg-slate-700/70 hover:bg-slate-600 text-slate-200 flex items-center justify-center transition"
                title={isTrayExpanded ? 'Sembunyikan Obrolan' : 'Buka Obrolan'}
                aria-label="Toggle Tray"
              >
                {isTrayExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Message List (Collapsible) */}
          {isTrayExpanded && (
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="max-h-44 sm:max-h-56 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-slate-800/50"
            >
              {currentRoomMessages.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Belum ada pesan di Ruang {activeRoom}. Jadilah yang pertama menyapa teman-teman sekelasmu!
                </div>
              ) : (
                currentRoomMessages.map((msg) => (
                  <div key={msg.id} className="pt-2 first:pt-0 flex items-start justify-between gap-3 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Cyan Handle */}
                        <span className="text-cyan-400 font-mono text-xs font-bold shrink-0">
                          {msg.senderHandle}
                        </span>
                        {/* Message content */}
                        <span className="text-slate-200 text-xs sm:text-sm font-medium break-words leading-relaxed">
                          {msg.content}
                        </span>
                      </div>
                    </div>

                    {/* Right side: Report Flag & Timestamp */}
                    <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-400 pt-0.5">
                      {reportSuccessId === msg.id ? (
                        <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Dilaporkan
                        </span>
                      ) : (
                        <button
                          onClick={() => handleReport(msg.id)}
                          className="opacity-40 group-hover:opacity-100 hover:text-red-400 transition p-0.5"
                          title="Laporkan pesan tidak pantas ke Guru"
                          aria-label="Laporkan pesan"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      )}
                      <span className="font-mono text-slate-400">{msg.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Bottom Input Field */}
          <form
            onSubmit={handleSendMessage}
            className="p-2 sm:p-3 bg-slate-950/60 border-t border-slate-800 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value.slice(0, 120))}
                placeholder="Tulis pesan... (maks. 120 huruf)"
                maxLength={120}
                className="w-full bg-slate-800/90 text-white placeholder-slate-400 text-xs sm:text-sm rounded-2xl px-4 py-2.5 pr-14 focus:outline-none focus:ring-2 focus:ring-teal-500 border border-slate-700/80 font-medium"
              />
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono pointer-events-none ${
                  120 - inputText.length < 15 ? 'text-amber-400 font-bold' : 'text-slate-400'
                }`}
              >
                {120 - inputText.length}
              </span>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition active:scale-95 shrink-0"
            >
              <span>Kirim</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
