import React, { useState } from 'react';
import { Message, Student } from '../../types/index.ts';
import { X, Send, Mail, MessageSquare, CheckCircle, Clock } from 'lucide-react';

interface KantorPosModalProps {
  onClose: () => void;
  messages: Message[];
  student: Student;
  onSendMessage: (content: string) => void;
}

export const KantorPosModal: React.FC<KantorPosModalProps> = ({
  onClose,
  messages,
  student,
  onSendMessage,
}) => {
  const [content, setContent] = useState('');
  const [isSent, setIsSent] = useState(false);

  const studentMessages = messages.filter((m) => m.studentId === student.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSendMessage(content.trim());
    setContent('');
    setIsSent(true);
    setTimeout(() => setIsSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
              📮
            </div>
            <div>
              <h2 className="text-xl font-extrabold font-display leading-tight">Kantor Pos Kota</h2>
              <p className="text-xs text-red-100 font-medium">Kirim Pertanyaan & Terima Balasan dari Guru</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Kantor Pos"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* New message form */}
          <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <label htmlFor="student-message-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-rose-400" />
              <span>Tulis Surat / Pertanyaan untuk Guru</span>
            </label>
            <textarea
              id="student-message-input"
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Contoh: Pak/Bu Guru, saya masih belum paham cara setting static routing di PC 2. Kapan ada waktu untuk konsultasi?"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">Pesan akan langsung masuk ke Ruang Guru.</span>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Surat</span>
              </button>
            </div>
            {isSent && (
              <p className="text-xs text-emerald-400 font-bold bg-emerald-950/60 p-2 rounded-lg border border-emerald-800">
                Surat berhasil dikirim ke guru!
              </p>
            )}
          </form>

          {/* Message History & Replies */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>Kotak Masuk Surat & Balasan Guru ({studentMessages.length})</span>
            </h3>

            <div className="space-y-3">
              {studentMessages.length > 0 ? (
                studentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-semibold text-slate-300">Pertanyaanmu:</span>
                        <span>{msg.createdAt}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        {msg.content}
                      </p>
                    </div>

                    {msg.teacherReply ? (
                      <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/50 space-y-1">
                        <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Balasan dari Guru:
                          </span>
                          <span className="font-normal text-[11px] text-emerald-400">{msg.repliedAt}</span>
                        </div>
                        <p className="text-xs text-slate-100 leading-relaxed pt-1">
                          "{msg.teacherReply}"
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-950/30 p-2.5 rounded-xl border border-amber-900/50">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Suratmu sedang menunggu dibaca dan dibalas oleh guru.</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Belum ada surat yang dikirim ke guru.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
