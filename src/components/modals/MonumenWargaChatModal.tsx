import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface MonumenWargaChatModalProps {
  onClose: () => void;
  student: Student;
}

// Room metadata matching DKV classes
const ROOMS_CONFIG: { roomNumber: 2 | 3; name: string; memberCount: number; visitorCount: number }[] = [
  { roomNumber: 2, name: 'Ruang 2 (X DKV 2)', memberCount: 26, visitorCount: 14 },
  { roomNumber: 3, name: 'Ruang 3 (X DKV 3)', memberCount: 27, visitorCount: 12 },
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
  // Students are strictly locked to their own class room: Room 2 for X DKV 2, Room 3 for X DKV 3
  const isClassDkv3 = student.className.includes('DKV 3');
  const myClassShort = isClassDkv3 ? 'X DKV 3' : 'X DKV 2';
  const activeRoom: 2 | 3 = isClassDkv3 ? 3 : 2;
  const [messages, setMessages] = useState<PublicChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSoundOn, setIsSoundOn] = useState(() => {
    return localStorage.getItem('kota_monumen_sound') !== 'false';
  });
  const [isTrayExpanded, setIsTrayExpanded] = useState(true);
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);
  const [reportSuccessId, setReportSuccessId] = useState<string | null>(null);

  // Auto-sync and manual sync states
  const [isAutoSyncOn, setIsAutoSyncOn] = useState(() => {
    return localStorage.getItem('kota_monumen_autosync') !== 'false';
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Manual trigger to pull fresh chats from other devices
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const prevLength = messages.length;
      const shared = await StorageService.fetchPublicChatMessages();
      setMessages(shared);
      const diff = shared.length - prevLength;
      if (diff > 0) {
        setSyncFeedback(`+${diff} obrolan baru!`);
        if (isSoundOn) playChimeAudio(true);
      } else {
        setSyncFeedback('Obrolan terbaru');
      }
    } catch (e) {
      setSyncFeedback('Tersinkronisasi');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  // Load and subscribe to shared chat messages (with 24h automatic purge)
  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      // 1. Instantly read local messages (cleaned of expired >24h)
      const local = StorageService.getPublicChatMessages();
      if (isMounted) {
        setMessages((prev) => {
          const map = new Map<string, PublicChatMessage>();
          (local || []).forEach((m) => {
            if (m && m.id) map.set(m.id, m);
          });
          (prev || []).forEach((m) => {
            if (m && m.id && !map.has(m.id)) map.set(m.id, m);
          });
          return Array.from(map.values());
        });
      }

      // 2. Fetch shared messages from server API & Google Apps Script
      try {
        const shared = await StorageService.fetchPublicChatMessages();
        if (isMounted && shared && shared.length > 0) {
          setMessages((prev) => {
            const map = new Map<string, PublicChatMessage>();
            (shared || []).forEach((m) => {
              if (m && m.id) map.set(m.id, m);
            });
            (prev || []).forEach((m) => {
              if (m && m.id && !map.has(m.id)) map.set(m.id, m);
            });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        // safe fallback
      }
    };

    loadMessages();

    // Auto-poll every 4 seconds if isAutoSyncOn is enabled
    let pollInterval: any = null;
    if (isAutoSyncOn) {
      pollInterval = setInterval(() => {
        loadMessages();
      }, 4000);
    }

    // Listen to storage events and custom events for multi-tab realtime sync
    const handleStorageUpdate = () => {
      loadMessages();
      if (isSoundOn) {
        playChimeAudio(true);
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('kota_refleksi_public_chat_updated', handleStorageUpdate);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('kota_refleksi_public_chat_updated', handleStorageUpdate);
    };
  }, [isSoundOn, isAutoSyncOn]);

  // Filter messages for current room and deduplicate strictly by ID
  const currentRoomMessages = useMemo(() => {
    const map = new Map<string, PublicChatMessage>();
    (messages || []).forEach((m) => {
      if (m && m.id && m.roomNumber === activeRoom && !m.isReported) {
        map.set(m.id, m);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages, activeRoom]);

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
    setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [newMsg, ...prev]));
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
    <div className="fixed inset-0 z-40 flex flex-col justify-between pointer-events-none select-none overflow-hidden">
      {/* =========================================================================
          TOP BAR OVERLAY - Liquid Glass Design
          ←  [🌸 Monumen Warga • Khusus X DKV 2 ...]  [X DKV 2 (Ruang Saya)]  [Tarik]  🔊
         ========================================================================= */}
      <div className="pt-8 sm:pt-10 md:pt-12 px-3 sm:px-6 flex items-center justify-between gap-2 pointer-events-auto shrink-0 z-30">
        {/* Left: Back Button */}
        <button
          onClick={onClose}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-white/25 via-slate-900/70 to-slate-950/85 backdrop-blur-2xl text-white border border-white/30 hover:border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_1px_0_rgba(255,255,255,0.25)] flex items-center justify-center transition active:scale-95 shrink-0"
          title="Kembali ke Peta Kota"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5 text-slate-100" />
        </button>

        {/* Center: Info Pill - Liquid Glass */}
        <div className="flex-1 max-w-xl mx-auto flex items-center justify-center px-1 sm:px-2">
          <div className="bg-gradient-to-b from-white/20 via-slate-900/70 to-slate-950/85 backdrop-blur-2xl text-white border border-white/25 shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_1px_0_rgba(255,255,255,0.25)] px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full flex items-center gap-2 text-xs sm:text-sm font-semibold truncate">
            <span className="text-pink-400 text-sm">🌸</span>
            <span className="font-bold text-white">Monumen Warga</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-300 font-extrabold">{myClassShort}</span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-cyan-300 font-medium text-[11px] bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-500/30 hidden sm:inline" title="Sistem otomatis membatasi maksimal 25 pesan teranyar">
              💬 Maks 25 Chat
            </span>
            <span className="text-slate-500 hidden md:inline">•</span>
            <span className="text-teal-300 font-medium hidden md:inline">{activeRoomData.memberCount} Siswa</span>
          </div>
        </div>

        {/* Right: Class Locked Badge, Manual Sync & Sound Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Class Locked Badge - Liquid Glass */}
          <div className="flex items-center bg-gradient-to-b from-white/20 via-slate-900/70 to-slate-950/85 backdrop-blur-2xl border border-white/25 shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_1px_0_rgba(255,255,255,0.25)] px-3 py-1.5 rounded-full gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-extrabold text-emerald-300">{myClassShort}</span>
            <span className="text-[10px] text-slate-300 font-medium hidden sm:inline">(Ruang Saya)</span>
          </div>

          {/* Tombol Tarik / Sinkronkan Obrolan Baru */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_1px_0_rgba(255,255,255,0.25)] flex items-center justify-center transition active:scale-95 bg-gradient-to-b from-white/20 via-slate-900/70 to-slate-950/85 backdrop-blur-2xl border-white/25 hover:border-white/50 text-teal-300 disabled:opacity-50"
            title={isSyncing ? 'Sedang menarik obrolan baru...' : 'Tarik Obrolan Baru dari Teman di Device Lain'}
            aria-label="Tarik Obrolan"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-teal-300' : ''}`} />
          </button>

          {/* Audio toggle button */}
          <button
            onClick={handleToggleSound}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_1px_0_rgba(255,255,255,0.25)] flex items-center justify-center transition active:scale-95 backdrop-blur-2xl bg-gradient-to-b from-white/20 via-slate-900/70 to-slate-950/85 border-white/25 hover:border-white/50 ${
              isSoundOn ? 'text-teal-300' : 'text-slate-400'
            }`}
            title={isSoundOn ? 'Suara Aktif (Klik untuk Matikan)' : 'Suara Mati (Klik untuk Nyalakan)'}
            aria-label="Toggle Sound"
          >
            {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* =========================================================================
          CENTER 3D VIEWPORT FLOATING SPEECH BUBBLE - Liquid Glass
          - On laptop: centered in open space with clearance from right sidebar (md:mr-[430px])
          - On mobile: neat floating bubble constrained in middle without overlapping drawer
         ========================================================================= */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-3 pointer-events-auto md:mr-[430px] my-auto">
        {latestMessage && (
          <div className="transform transition-all duration-300 hover:scale-105 max-w-xs sm:max-w-md w-full animate-fade-in-up">
            {/* Liquid Crystal Speech Bubble */}
            <div className="relative bg-gradient-to-b from-white/95 via-white/85 to-slate-100/90 text-slate-900 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.6)] backdrop-blur-xl border border-white/80 text-xs sm:text-base font-semibold leading-snug max-h-24 sm:max-h-36 overflow-y-auto">
              <p className="break-words">{latestMessage.content}</p>

              {/* Speech bubble pointer arrow */}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white/95" />
            </div>

            {/* Handle tag underneath arrow */}
            <div className="mt-2.5 flex items-center justify-center">
              <span className="bg-gradient-to-b from-white/20 via-slate-900/80 to-slate-950/90 text-cyan-300 font-mono text-[11px] sm:text-xs px-3 py-1 rounded-full border border-white/25 shadow-xl font-bold flex items-center gap-1.5 backdrop-blur-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {latestMessage.senderHandle}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          CHAT FEATURE: Liquid Glass Container
          - ON LAPTOP (md:): Moves to right sidebar panel (md:fixed md:right-6 md:top-28 md:bottom-8 md:w-[410px])
          - ON MOBILE (phone): Stays elevated at bottom with clearance (mb-4 px-3) so nothing overlaps!
         ========================================================================= */}
      <div className="shrink-0 mb-4 sm:mb-6 px-3 sm:px-4 max-w-lg w-full mx-auto pointer-events-auto transition-all duration-300 md:fixed md:right-6 md:top-28 md:bottom-8 md:w-[410px] md:max-w-[420px] md:z-50 md:flex md:flex-col md:m-0 md:p-0 animate-fade-in-up">
        <div className="bg-gradient-to-b from-white/20 via-slate-900/75 to-slate-950/90 backdrop-blur-2xl backdrop-saturate-150 border border-white/25 shadow-[0_16px_48px_0_rgba(0,0,0,0.55),inset_0_1px_1px_0_rgba(255,255,255,0.25)] rounded-3xl overflow-hidden flex flex-col md:h-full">
          {/* Tray / Sidebar Header */}
          <div className="shrink-0 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white/5 border-b border-white/15 flex items-center justify-between gap-2 backdrop-blur-md">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <MessageCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-extrabold text-xs sm:text-sm text-white truncate">
                Obrolan {myClassShort} • {currentRoomMessages.length}/25
              </span>
              <span className="text-[10px] bg-white/10 text-cyan-200 px-2 py-0.5 rounded-full font-mono border border-white/15 hidden lg:inline">
                Maks 25 Chat
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Feedback toast */}
              {syncFeedback && (
                <span className="text-[10px] font-bold text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded-full border border-teal-500/40 animate-in fade-in truncate max-w-[110px] sm:max-w-[150px]">
                  {syncFeedback}
                </span>
              )}

              {/* Tombol Tarik Obrolan Baru */}
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-2.5 sm:px-3 py-1 rounded-full bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50 shadow-sm"
                title="Tarik & perbarui obrolan terbaru dari teman-teman di device lain"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-teal-400' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Menarik...' : 'Tarik'}</span>
              </button>

              {/* Tombol Toggle Auto-Sync */}
              <button
                type="button"
                onClick={() => {
                  const next = !isAutoSyncOn;
                  setIsAutoSyncOn(next);
                  localStorage.setItem('kota_monumen_autosync', String(next));
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-full text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  isAutoSyncOn
                    ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title={
                  isAutoSyncOn
                    ? 'Sinkron Otomatis AKTIF: Otomatis menarik pesan dari teman di device lain setiap 4 detik'
                    : 'Sinkron Otomatis MATI (klik untuk mengaktifkan)'
                }
              >
                <span className={`w-2 h-2 rounded-full ${isAutoSyncOn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className="hidden sm:inline">Auto</span>
              </button>

              {/* Pesan Baru button when scrolled up */}
              {hasNewMessagesBelow && (
                <button
                  onClick={scrollToBottom}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow flex items-center gap-1 animate-bounce transition"
                >
                  <span>Baru</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}

              {/* Minimize/Maximize Tray (active on mobile, optional on laptop) */}
              <button
                onClick={() => setIsTrayExpanded(!isTrayExpanded)}
                className="w-7 h-7 rounded-full bg-slate-700/70 hover:bg-slate-600 text-slate-200 flex items-center justify-center transition shrink-0"
                title={isTrayExpanded ? 'Sembunyikan Obrolan' : 'Buka Obrolan'}
                aria-label="Toggle Tray"
              >
                {isTrayExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Message List:
              - On mobile: max-h-40 sm:max-h-48 (elevated, never crowds screen)
              - On laptop: md:flex-1 md:max-h-none md:overflow-y-auto (fills sidebar)
          */}
          {isTrayExpanded && (
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="max-h-40 sm:max-h-48 md:max-h-none md:flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-slate-800/50 min-h-0"
            >
              {currentRoomMessages.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Belum ada pesan di Ruang {myClassShort}. Jadilah yang pertama menyapa teman-teman sekelasmu!
                </div>
              ) : (
                currentRoomMessages.map((msg, idx) => (
                  <div key={`${msg.id}-${idx}`} className="pt-2 first:pt-0 flex items-start justify-between gap-2.5 group">
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
                    <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-slate-400 pt-0.5">
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
                      <span className="font-mono text-slate-400 text-[10px] sm:text-xs">{msg.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Bottom Input Field (Pinned at bottom of sidebar or drawer) - Liquid Glass */}
          <form
            onSubmit={handleSendMessage}
            className="shrink-0 p-2.5 sm:p-3 bg-slate-950/60 backdrop-blur-xl border-t border-white/15 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value.slice(0, 120))}
                placeholder={`Tulis pesan untuk ${myClassShort}...`}
                maxLength={120}
                className="w-full bg-white/10 text-white placeholder-slate-400 text-xs sm:text-sm rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-teal-400/80 border border-white/20 backdrop-blur-md font-medium"
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
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition active:scale-95 shrink-0"
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
