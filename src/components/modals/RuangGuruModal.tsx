import React, { useState } from 'react';
import {
  Materi,
  LearningObjective,
  Reflection,
  MentorFeedback,
  Message,
  Student,
  TownSettings,
  BuildingId,
} from '../../types/index.ts';
import { SMK_CLASSES } from '../../data/initialData.ts';
import { calculateClassStats, generateCSVExport, getGoogleAppsScriptCode } from '../../utils/rules.ts';
import {
  X,
  LayoutDashboard,
  Users,
  BookOpen,
  Mail,
  Settings,
  Sparkles,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  Send,
  Flag,
  FileSpreadsheet,
  KeyRound,
} from 'lucide-react';

interface RuangGuruModalProps {
  onClose: () => void;
  materis: Materi[];
  objectives: LearningObjective[];
  reflections: Reflection[];
  feedbacks: MentorFeedback[];
  messages: Message[];
  students: Student[];
  settings: TownSettings;
  onAddMateri: (materi: Materi) => void;
  onDeleteMateri: (materiId: string) => void;
  onAddObjective: (obj: LearningObjective) => void;
  onReplyMessage: (messageId: string, reply: string) => void;
  onUpdateSettings: (settings: TownSettings) => void;
  onDeleteReflection?: (reflectionId: string) => void;
  onClearAllReflections?: () => void;
}

export const RuangGuruModal: React.FC<RuangGuruModalProps> = ({
  onClose,
  materis,
  objectives,
  reflections,
  feedbacks,
  messages,
  students,
  settings,
  onAddMateri,
  onDeleteMateri,
  onAddObjective,
  onReplyMessage,
  onUpdateSettings,
  onDeleteReflection,
  onClearAllReflections,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reflections' | 'materi' | 'messages' | 'settings'>('dashboard');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Teacher AI Summary State
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // New Materi Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newTargetClass, setNewTargetClass] = useState(SMK_CLASSES[0]);
  const [newContent, setNewContent] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newLocation, setNewLocation] = useState<BuildingId>('perpustakaan');
  const [newCustomQuestion, setNewCustomQuestion] = useState('');

  // New Objective Form State
  const [newGoal, setNewGoal] = useState('');
  const [newIndicator, setNewIndicator] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [targetMateriId, setTargetMateriId] = useState(materis[0]?.id || '');

  // Reply Message State
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  // Settings State
  const [teacherPin, setTeacherPin] = useState(settings.teacherPin || 'Kiki123!');
  const [gasUrl, setGasUrl] = useState(settings.gasWebAppUrl || '');
  const [isCopiedGAS, setIsCopiedGAS] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const stats = calculateClassStats(reflections, feedbacks, students, materis, selectedClass);

  // Filtered Reflections
  const filteredReflections = selectedClass === 'all'
    ? reflections
    : reflections.filter((r) => r.className === selectedClass);

  // Generate AI Summary
  const handleGenerateSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await fetch('/api/gemini/teacher-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: selectedClass === 'all' ? 'Semua Kelas SMK' : selectedClass,
          reflections: filteredReflections,
          hardestTopic: stats.hardestTopic,
          averageScale: stats.averageScale,
        }),
      });
      const data = await response.json();
      setAiSummary(data.data);
    } catch (e) {
      console.error('Failed to generate teacher summary:', e);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Add Materi Handler
  const handleCreateMateri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSubject.trim()) return;

    const materi: Materi = {
      id: `materi-${Date.now().toString(36)}`,
      title: newTitle.trim(),
      subject: newSubject.trim(),
      targetClass: newTargetClass,
      content: newContent.trim(),
      link: newLink.trim() || undefined,
      videoUrl: newVideoUrl.trim() || undefined,
      location: newLocation,
      createdAt: new Date().toISOString().slice(0, 10),
      isNew: true,
      customQuestions: newCustomQuestion.trim() ? [newCustomQuestion.trim()] : undefined,
    };

    onAddMateri(materi);
    setNewTitle('');
    setNewSubject('');
    setNewContent('');
    setNewLink('');
    setNewVideoUrl('');
    setNewCustomQuestion('');
    alert('Materi baru berhasil ditambahkan dan langsung tampil di kota murid!');
  };

  // Add Objective Handler
  const handleCreateObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim() || !targetMateriId) return;

    const obj: LearningObjective = {
      id: `tp-${Date.now().toString(36)}`,
      materiId: targetMateriId,
      goalStatement: newGoal.trim(),
      indicator: newIndicator.trim() || 'Mampu mengimplementasikan praktik secara mandiri',
      deadline: newDeadline || new Date().toISOString().slice(0, 10),
    };

    onAddObjective(obj);
    setNewGoal('');
    setNewIndicator('');
    setNewDeadline('');
    alert('Tujuan Pembelajaran berhasil ditambahkan sebagai misi Balai Kota!');
  };

  // Send Teacher Reply
  const handleSendReply = (msgId: string) => {
    const text = replyTextMap[msgId];
    if (!text || !text.trim()) return;
    onReplyMessage(msgId, text.trim());
    setReplyTextMap((prev) => ({ ...prev, [msgId]: '' }));
  };

  // Download CSV
  const handleDownloadCSV = () => {
    const csvContent = generateCSVExport(reflections, feedbacks, materis);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap_refleksi_kota_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy GAS Code
  const handleCopyGAS = () => {
    navigator.clipboard.writeText(getGoogleAppsScriptCode());
    setIsCopiedGAS(true);
    setTimeout(() => setIsCopiedGAS(false), 2500);
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      teacherPin: teacherPin.trim() || 'Kiki123!',
      gasWebAppUrl: gasUrl.trim() || undefined,
    });
    setSaveSuccessMsg('Pengaturan & Integrasi Google Spreadsheet berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-500/30">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white font-display">Ruang Guru: Kota Refleksi</h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                  Panel Guru SMK
                </span>
              </div>
              <p className="text-xs text-slate-400">Pengelolaan Pembelajaran, Evaluasi Refleksi & Integrasi Data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Ruang Guru"
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition border border-slate-700"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/60 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-3.5 text-xs font-bold transition border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard & AI</span>
          </button>
          <button
            onClick={() => setActiveTab('reflections')}
            className={`py-3 px-3.5 text-xs font-bold transition border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'reflections'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Data Refleksi Murid ({filteredReflections.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('materi')}
            className={`py-3 px-3.5 text-xs font-bold transition border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'materi'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kelola Materi & Misi</span>
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-3 px-3.5 text-xs font-bold transition border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'messages'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Kotak Pesan ({messages.filter((m) => m.status === 'unread').length} Belum Dibalas)</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-3.5 text-xs font-bold transition border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Sheets & Pengaturan</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
          {/* TAB 1: DASHBOARD & AI PEDAGOGIC SUMMARY */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Class Filter Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Filter Kelas:</span>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Semua Kelas SMK</option>
                    {SMK_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadCSV}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ekspor CSV Rekap</span>
                  </button>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <p className="text-xs text-slate-400 font-medium">Refleksi Terkumpul</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{stats.totalReflections}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">dari {stats.studentCount} murid terdaftar</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <p className="text-xs text-slate-400 font-medium">Rata-Rata Pemahaman</p>
                  <p className="text-2xl font-extrabold text-amber-400 mt-1">
                    {stats.averageScale} <span className="text-xs text-slate-400">/ 5.0</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">skala bintang murid</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <p className="text-xs text-slate-400 font-medium">Topik Paling Sulit</p>
                  <p className="text-sm font-bold text-rose-300 mt-1 line-clamp-2">
                    {stats.hardestTopic?.title || 'Belum terdeteksi'}
                  </p>
                  {stats.hardestTopic && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Rata-rata: {stats.hardestTopic.avgScale}/5.0 ({stats.hardestTopic.count} ulasan)
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <p className="text-xs text-slate-400 font-medium">Perlu Perhatian Guru</p>
                  <p className="text-2xl font-extrabold text-red-400 mt-1">
                    {stats.attentionNeededCount}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">murid butuh pendampingan</p>
                </div>
              </div>

              {/* Gemini AI Pedagogic Summary Section */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <h3 className="font-extrabold text-base text-white">
                        Ringkasan AI untuk Guru (Gemini)
                      </h3>
                    </div>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      Analisis otomatis kesulitan umum kelas & usulan diferensiasi pembelajaran
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateSummary}
                    disabled={isLoadingSummary}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${isLoadingSummary ? 'animate-spin' : ''}`} />
                    <span>{isLoadingSummary ? 'Menganalisis Data Kelas...' : 'Buat Ringkasan AI Terbaru'}</span>
                  </button>
                </div>

                {aiSummary ? (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tema Kesulitan Umum */}
                      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Tema Kesulitan Umum yang Dialami Siswa</span>
                        </h4>
                        <ul className="space-y-1.5">
                          {aiSummary.tema_kesulitan_umum?.map((item: string, idx: number) => (
                            <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                              <span className="text-rose-400 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Pola Kekuatan Kelas */}
                      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>Pola Kekuatan & Konsep yang Sudah Dikuasai</span>
                        </h4>
                        <ul className="space-y-1.5">
                          {aiSummary.pola_kekuatan_kelas?.map((item: string, idx: number) => (
                            <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Usulan Tindak Lanjut Pedagogik */}
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/40">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>Rekomendasi Tindak Lanjut & Diferensiasi Pembelajaran</span>
                      </h4>
                      <div className="space-y-2">
                        {aiSummary.usulan_tindak_lanjut?.map((rec: string, idx: number) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs text-slate-200 flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-600/40 text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Klik tombol "Buat Ringkasan AI Terbaru" di atas untuk menganalisis data refleksi kelas terkini.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DATA REFLEKSI MURID */}
          {activeTab === 'reflections' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Daftar Refleksi Murid ({filteredReflections.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Refleksi ditandai merah memerlukan perhatian / bimbingan khusus
                  </p>
                </div>
                {onClearAllReflections && reflections.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Apakah Bapak/Ibu guru yakin ingin menghapus semua data refleksi murid?')) {
                        onClearAllReflections();
                      }
                    }}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-semibold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan Semua Refleksi</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {filteredReflections.map((r) => {
                  const fb = feedbacks.find((f) => f.reflectionId === r.id);
                  const isAttention = fb?.perlu_perhatian_guru || r.scale <= 2;

                  return (
                    <div
                      key={r.id}
                      className={`p-4 rounded-2xl border transition ${
                        isAttention
                          ? 'bg-rose-950/20 border-rose-600/60 shadow-sm'
                          : 'bg-slate-800/70 border-slate-700/70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white">{r.studentName}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                            {r.className}
                          </span>
                          {isAttention && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-600 text-white flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Perlu Perhatian Guru
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>{r.createdAt}</span>
                          <span className="text-amber-400 font-mono font-bold">
                            {'★'.repeat(r.scale)} ({r.scale}/5)
                          </span>
                          <span>{r.moodEmoji}</span>
                          {onDeleteReflection && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus refleksi dari ${r.studentName}?`)) {
                                  onDeleteReflection(r.id);
                                }
                              }}
                              title="Hapus refleksi ini"
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Materi Title */}
                      <p className="text-xs font-bold text-indigo-300 mb-2">
                        Materi: {r.materiTitle}
                      </p>

                      {/* Answers grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-200">
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                          <strong className="text-emerald-400 block mb-1">Yang Dipahami:</strong>
                          <p>{r.answers.understood}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                          <strong className="text-amber-400 block mb-1">Yang Masih Sulit:</strong>
                          <p>{r.answers.difficult}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                          <strong className="text-sky-400 block mb-1">Rencana Belajar:</strong>
                          <p>{r.answers.actionPlan}</p>
                        </div>
                      </div>

                      {/* AI Mentor Feedback Summary */}
                      {fb && (
                        <div className="mt-3 p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs">
                          <strong className="text-purple-300 block mb-0.5">Saran AI Mentor Kota:</strong>
                          <p className="text-slate-300 italic">"{fb.apresiasi}"</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredReflections.length === 0 && (
                  <div className="text-center py-12 px-4 rounded-2xl bg-slate-800/30 border border-dashed border-slate-700/60">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xl">
                      📝
                    </div>
                    <p className="text-sm font-bold text-slate-300">Belum Ada Refleksi Murid</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Data refleksi murid bersih dari data dummy. Refleksi baru akan otomatis muncul di sini dan tersinkronisasi ke Google Spreadsheet saat murid mengisi jurnal.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: KELOLA MATERI & TUJUAN PEMBELAJARAN */}
          {activeTab === 'materi' && (
            <div className="space-y-6">
              {/* Form Tambah Materi */}
              <form onSubmit={handleCreateMateri} className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Tambah Materi Pembelajaran Baru (Muncul di Dunia Murid)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Judul Materi *</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Contoh: Konfigurasi Virtual LAN (VLAN) di Cisco Packet Tracer"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Mata Pelajaran *</label>
                    <input
                      type="text"
                      required
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Contoh: Administrasi Infrastruktur Jaringan"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Kelas Sasaran</label>
                    <select
                      value={newTargetClass}
                      onChange={(e) => setNewTargetClass(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {SMK_CLASSES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Lokasi di Kota 3D</label>
                    <select
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value as BuildingId)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="perpustakaan">Perpustakaan (Koleksi Modul)</option>
                      <option value="bengkel_latihan">Bengkel Latihan (Praktik)</option>
                      <option value="balai_kota">Balai Kota (Pengumuman Khusus)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Isi Rangkuman / Penjelasan Materi *</label>
                  <textarea
                    required
                    rows={3}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Tuliskan rangkuman konsep kunci yang harus dipahami siswa..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Tautan Modul / Web (Opsional)</label>
                    <input
                      type="url"
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Tautan Video Penjelasan (Opsional)</label>
                    <input
                      type="url"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Pertanyaan Refleksi Khusus (Opsional)</label>
                  <input
                    type="text"
                    value={newCustomQuestion}
                    onChange={(e) => setNewCustomQuestion(e.target.value)}
                    placeholder="Misal: Ceritakan kendala saat mencoba routing di komputer lab!"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Materi & Tampilkan di Kota</span>
                </button>
              </form>

              {/* Form Tambah Tujuan Pembelajaran */}
              <form onSubmit={handleCreateObjective} className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Flag className="w-4 h-4 text-sky-400" />
                  <span>Tambah Tujuan Pembelajaran (Misi Balai Kota & Acuan AI)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Rumusan Tujuan Pembelajaran *</label>
                    <input
                      type="text"
                      required
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="Contoh: Murid mampu merancang subnetting VLSM sesuai kebutuhan topologi."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Materi Terkait</label>
                    <select
                      value={targetMateriId}
                      onChange={(e) => setTargetMateriId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {materis.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Indikator Ketercapaian</label>
                    <input
                      type="text"
                      value={newIndicator}
                      onChange={(e) => setNewIndicator(e.target.value)}
                      placeholder="Mampu menghitung alokasi IP tanpa tabrakan."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Tenggat Waktu</label>
                    <input
                      type="date"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 transition"
                >
                  <Flag className="w-4 h-4" />
                  <span>Tambahkan Tujuan Pembelajaran</span>
                </button>
              </form>

              {/* List of Existing Materials */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Daftar Materi Aktif ({materis.length})
                </h4>
                <div className="space-y-2.5">
                  {materis.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                            {m.subject}
                          </span>
                          <span className="text-xs font-bold text-white">{m.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {m.targetClass} • Gedung: {m.location}
                        </p>
                      </div>
                      <button
                        onClick={() => onDeleteMateri(m.id)}
                        title="Hapus materi ini"
                        className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KOTAK PESAN KANTOR POS */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Surat & Pertanyaan Masuk dari Siswa ({messages.length})
                </h3>
              </div>

              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{msg.studentName}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono text-[10px]">
                          {msg.className}
                        </span>
                      </div>
                      <span className="text-slate-400">{msg.createdAt}</span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      "{msg.content}"
                    </p>

                    {msg.teacherReply ? (
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/50 text-xs">
                        <strong className="text-emerald-400 block mb-0.5">Balasan Anda:</strong>
                        <p className="text-slate-200">"{msg.teacherReply}"</p>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={2}
                          value={replyTextMap[msg.id] || ''}
                          onChange={(e) =>
                            setReplyTextMap({ ...replyTextMap, [msg.id]: e.target.value })
                          }
                          placeholder="Tulis balasan untuk siswa ini..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button
                          onClick={() => handleSendReply(msg.id)}
                          className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Kirim Balasan ke Kantor Pos Siswa</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {messages.length === 0 && (
                  <p className="text-center text-xs text-slate-500 py-12">Belum ada surat masuk dari murid.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: GOOGLE SHEETS & PENGATURAN */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Status Integrasi Google Apps Script */}
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-600/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 text-lg">
                    📊
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Integrasi Google Spreadsheet Aktif</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-slate-950">
                        LIVE SINKRON
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-200 mt-0.5 break-all font-mono">
                      {settings.gasWebAppUrl || gasUrl}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Setiap refleksi, nilai skala bintang, dan pesan siswa dari Kota Refleksi otomatis tercatat di Google Spreadsheet guru.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Settings */}
              <form onSubmit={handleSaveSettings} className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Pengaturan Keamanan & Tautan Web App Google Apps Script</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Kata Sandi / PIN Guru
                    </label>
                    <input
                      type="text"
                      value={teacherPin}
                      onChange={(e) => setTeacherPin(e.target.value)}
                      placeholder="Kiki123!"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Kata sandi privat guru agar siswa tidak bisa masuk.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      URL Web App Google Apps Script (Tersambung ke Spreadsheet)
                    </label>
                    <input
                      type="url"
                      value={gasUrl}
                      onChange={(e) => setGasUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {saveSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-bold">
                    {saveSuccessMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                >
                  Simpan Perubahan Pengaturan
                </button>
              </form>

              {/* Panduan Google Spreadsheet & Apps Script */}
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">
                      Panduan Setup Google Spreadsheet (Buku Induk Guru)
                    </h4>
                  </div>
                  <button
                    onClick={handleCopyGAS}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    {isCopiedGAS ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopiedGAS ? 'Kode Disalin!' : 'Salin Kode Code.gs'}</span>
                  </button>
                </div>

                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <li>Buat satu file baru di <strong>Google Spreadsheet</strong> Anda (misal: "Kota Refleksi SMK").</li>
                  <li>Buka menu <strong>Ekstensi &gt; Apps Script</strong>.</li>
                  <li>Hapus kode bawaan, lalu tempel kode yang disalin dengan tombol di atas.</li>
                  <li>Jalankan fungsi <code>setupSpreadsheet()</code> satu kali untuk membuat 8 sheet otomatis (murid, kelas, materi, tp, refleksi, umpan_balik, pesan, pengaturan).</li>
                  <li>Klik <strong>Terapkan (Deploy) &gt; Deployment Baru</strong>, pilih jenis <strong>Aplikasi Web</strong>:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 text-slate-400">
                      <li>Jalankan sebagai: <em>Saya (akun Google guru)</em></li>
                      <li>Siapa yang memiliki akses: <em>Siapa saja (Anyone)</em></li>
                    </ul>
                  </li>
                  <li>Salin URL Web App yang dihasilkan, lalu tempelkan di kotak isian URL di atas. Semua refleksi murid akan otomatis tercatat di Google Spreadsheet Anda!</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
