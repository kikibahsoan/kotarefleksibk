import React, { useState, useEffect } from 'react';
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
import { calculateClassStats, generateCSVExport, getGoogleAppsScriptCode, parseSpreadsheetPastedText } from '../../utils/rules.ts';
import { StorageService } from '../../utils/storage.ts';
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
  RefreshCw,
  UploadCloud,
  ArrowDownToLine,
  Info,
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
  onSyncReflectionsAndMessages?: (
    reflections: Reflection[],
    feedbacks: MentorFeedback[],
    messages: Message[]
  ) => void;
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
  onSyncReflectionsAndMessages,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reflections' | 'materi' | 'messages' | 'settings'>('dashboard');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Teacher AI Summary State
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Synchronization State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ type: 'success' | 'error' | 'warning'; msg: string } | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  // In-App Deletion States (Replaces window.confirm blocked by iframes)
  const [reflectionToDelete, setReflectionToDelete] = useState<Reflection | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [selectedReflectionIds, setSelectedReflectionIds] = useState<string[]>([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [deleteSuccessNotice, setDeleteSuccessNotice] = useState<string | null>(null);

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

  // Auto-sync from Google Spreadsheet on modal open
  useEffect(() => {
    if (settings.gasWebAppUrl && onSyncReflectionsAndMessages) {
      handleSyncWithSpreadsheet();
    }
  }, []);

  const handleSyncWithSpreadsheet = async () => {
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const res = await StorageService.fetchFromGAS();
      if (res.success && res.reflections && res.feedbacks && res.messages) {
        if (onSyncReflectionsAndMessages) {
          onSyncReflectionsAndMessages(res.reflections, res.feedbacks, res.messages);
        }
        setSyncNotice({
          type: 'success',
          msg: `Berhasil menarik ${res.reflections.length} refleksi murid dan ${res.messages.length} pesan dari Google Spreadsheet "${res.spreadsheetName}"!`,
        });
        setTimeout(() => setSyncNotice(null), 8000);
      } else if (res.needsScriptUpdate) {
        setSyncNotice({
          type: 'warning',
          msg: `Terhubung ke Google Spreadsheet "${res.spreadsheetName}", namun skrip Google Apps Script masih versi 1.0 (belum memiliki fungsi pembacaan data).`,
        });
        setShowScriptModal(true);
      } else {
        setSyncNotice({
          type: 'error',
          msg: res.error || 'Gagal membaca data dari Google Spreadsheet.',
        });
      }
    } catch (e: any) {
      setSyncNotice({
        type: 'error',
        msg: e?.message || 'Terjadi kesalahan saat menghubungkan ke Google Apps Script.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportPastedData = () => {
    setPasteError(null);
    if (!pastedText.trim()) {
      setPasteError('Silakan tempel teks baris data dari Google Spreadsheet Anda.');
      return;
    }

    try {
      const parsed = parseSpreadsheetPastedText(pastedText);
      const totalParsed = parsed.reflections.length + parsed.messages.length;
      if (totalParsed === 0) {
        setPasteError('Format data tidak terdeteksi. Pastikan Anda menyalin langsung baris dari sheet Data_Refleksi_Siswa atau Pesan_Kantor_Pos.');
        return;
      }

      if (onSyncReflectionsAndMessages) {
        onSyncReflectionsAndMessages(parsed.reflections, parsed.feedbacks, parsed.messages);
      }
      setShowManualModal(false);
      setPastedText('');
      setSyncNotice({
        type: 'success',
        msg: `Sukses mengimpor ${parsed.reflections.length} data refleksi murid dan ${parsed.messages.length} pesan ke Ruang Guru!`,
      });
      setTimeout(() => setSyncNotice(null), 8000);
    } catch (err: any) {
      setPasteError('Gagal memproses data: ' + err.message);
    }
  };

  const stats = calculateClassStats(reflections, feedbacks, students, materis, selectedClass);

  // Filtered Reflections
  const filteredReflections = selectedClass === 'all'
    ? reflections
    : reflections.filter((r) => r.className === selectedClass);

  // In-App Deletion Handlers (Guaranteed to work in iframe)
  const handleConfirmSingleDelete = () => {
    if (!reflectionToDelete) return;
    const targetId = reflectionToDelete.id;
    const studentName = reflectionToDelete.studentName;
    if (onDeleteReflection) {
      onDeleteReflection(targetId);
    } else {
      StorageService.deleteReflection(targetId);
    }
    setSelectedReflectionIds((prev) => prev.filter((id) => id !== targetId));
    setReflectionToDelete(null);
    setDeleteSuccessNotice(`Refleksi dari "${studentName}" berhasil dihapus.`);
    setTimeout(() => setDeleteSuccessNotice(null), 4000);
  };

  const handleConfirmClearAll = () => {
    if (onClearAllReflections) {
      onClearAllReflections();
    } else {
      StorageService.clearReflections();
    }
    setSelectedReflectionIds([]);
    setIsClearAllModalOpen(false);
    setDeleteSuccessNotice('Semua data refleksi murid berhasil dikosongkan.');
    setTimeout(() => setDeleteSuccessNotice(null), 4000);
  };

  const handleConfirmBatchDelete = () => {
    if (selectedReflectionIds.length === 0) return;
    StorageService.deleteMultipleReflections(selectedReflectionIds);
    selectedReflectionIds.forEach((id) => {
      onDeleteReflection?.(id);
    });
    const count = selectedReflectionIds.length;
    setSelectedReflectionIds([]);
    setIsBatchDeleteModalOpen(false);
    setDeleteSuccessNotice(`${count} refleksi murid terpilih berhasil dihapus.`);
    setTimeout(() => setDeleteSuccessNotice(null), 4000);
  };

  const handleToggleSelectReflection = (id: string) => {
    setSelectedReflectionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedReflectionIds.length === filteredReflections.length) {
      setSelectedReflectionIds([]);
    } else {
      setSelectedReflectionIds(filteredReflections.map((r) => r.id));
    }
  };

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

        {/* Spreadsheet Sync Banner & Quick Action Bar */}
        <div className="bg-slate-900/95 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-200">Google Spreadsheet:</span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 truncate max-w-[180px] sm:max-w-xs">
              {settings.gasWebAppUrl ? 'Data Base Kota Refleksi' : 'Belum Terhubung'}
            </span>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              • {reflections.length} Refleksi • {messages.length} Pesan Tersimpan
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setShowManualModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold flex items-center gap-1.5 transition text-xs cursor-pointer shadow-sm"
              title="Salin dan tempel baris dari Google Spreadsheet Anda secara langsung"
            >
              <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
              <span>📥 Tempel Data</span>
            </button>

            <button
              type="button"
              onClick={handleSyncWithSpreadsheet}
              disabled={isSyncing}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition text-xs shadow-md cursor-pointer ${
                isSyncing
                  ? 'bg-indigo-700/60 text-indigo-300 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
              title="Ambil data refleksi dan pesan murid dari Google Spreadsheet secara otomatis"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menghubungkan...' : '🔄 Tarik dari Spreadsheet'}</span>
            </button>
          </div>
        </div>

        {/* Sync Notification Notice */}
        {syncNotice && (
          <div
            className={`px-4 sm:px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
              syncNotice.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800/60'
                : syncNotice.type === 'warning'
                ? 'bg-amber-950/90 text-amber-200 border-amber-800/60'
                : 'bg-rose-950/90 text-rose-200 border-rose-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {syncNotice.type === 'success' ? '✅' : syncNotice.type === 'warning' ? '⚠️' : '❌'}
              </span>
              <span>{syncNotice.msg}</span>
            </div>
            <div className="flex items-center gap-2">
              {syncNotice.type === 'warning' && (
                <button
                  type="button"
                  onClick={() => setShowScriptModal(true)}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg font-bold border border-amber-500/30 text-[11px] cursor-pointer"
                >
                  Perbarui Skrip (1 Menit) →
                </button>
              )}
              <button
                type="button"
                onClick={() => setSyncNotice(null)}
                className="text-slate-400 hover:text-white px-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

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
              {/* Success Notification Banner */}
              {deleteSuccessNotice && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-base">✅</span>
                    <span className="font-semibold">{deleteSuccessNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteSuccessNotice(null)}
                    className="text-slate-400 hover:text-white px-2 py-0.5 rounded text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Batch Action Bar if items selected */}
              {selectedReflectionIds.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/70 to-slate-900/90 border border-rose-600/50 flex flex-wrap items-center justify-between gap-3 shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold text-xs shadow">
                      {selectedReflectionIds.length} dipilih
                    </span>
                    <span className="text-xs text-slate-300">
                      dari {filteredReflections.length} refleksi yang ditampilkan
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBatchDeleteModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus ({selectedReflectionIds.length}) Terpilih</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReflectionIds([])}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
                    >
                      Batal Pilih
                    </button>
                  </div>
                </div>
              )}

              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Daftar Refleksi Murid ({filteredReflections.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Refleksi berbingkai merah menandakan siswa memerlukan bimbingan guru
                  </p>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  {filteredReflections.length > 0 && (
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
                    >
                      <span>
                        {selectedReflectionIds.length === filteredReflections.length
                          ? 'Batal Pilih Semua'
                          : 'Pilih Semua'}
                      </span>
                    </button>
                  )}

                  {reflections.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsClearAllModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 hover:border-rose-600 text-xs font-semibold transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Kosongkan Semua Refleksi</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {filteredReflections.map((r) => {
                  const fb = feedbacks.find((f) => f.reflectionId === r.id);
                  const isAttention = fb?.perlu_perhatian_guru || r.scale <= 2;
                  const isSelected = selectedReflectionIds.includes(r.id);

                  return (
                    <div
                      key={r.id}
                      className={`p-4 rounded-2xl border transition relative ${
                        isSelected
                          ? 'bg-rose-950/30 border-rose-500 shadow-md ring-1 ring-rose-500'
                          : isAttention
                          ? 'bg-rose-950/20 border-rose-600/60 shadow-sm'
                          : 'bg-slate-800/70 border-slate-700/70 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-700/50">
                        <div className="flex items-center gap-2.5">
                          {/* Checkbox for batch select */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectReflection(r.id)}
                            className="w-4 h-4 rounded text-rose-600 bg-slate-900 border-slate-700 focus:ring-rose-500 cursor-pointer shrink-0"
                            title="Pilih untuk hapus massal"
                          />

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

                        <div className="flex items-center gap-2.5 text-xs text-slate-400">
                          <span>{r.createdAt}</span>
                          <span className="text-amber-400 font-mono font-bold">
                            {'★'.repeat(r.scale)} ({r.scale}/5)
                          </span>
                          <span>{r.moodEmoji}</span>

                          {/* Explicit In-App Delete Button */}
                          <button
                            type="button"
                            onClick={() => setReflectionToDelete(r)}
                            title={`Hapus refleksi dari ${r.studentName}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 hover:border-rose-500 text-xs font-semibold transition cursor-pointer active:scale-95 shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Hapus</span>
                          </button>
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
                  <div className="text-center py-10 px-4 rounded-2xl bg-slate-800/40 border border-dashed border-slate-700/80 space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-2xl border border-indigo-500/20">
                      📊
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">Belum Ada Refleksi Murid yang Termuat di Layar Ini</p>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        Data refleksi murid yang tersimpan di Google Spreadsheet (<strong>Data Base Kota Refleksi</strong>) dapat langsung ditarik ke Ruang Guru dengan menekan tombol di bawah:
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleSyncWithSpreadsheet}
                        disabled={isSyncing}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Menghubungkan...' : '🔄 Tarik Data dari Spreadsheet'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowManualModal(true)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
                        <span>📥 Tempel / Impor Data Manual</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowScriptModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Panduan Skrip Versi 2.0</span>
                      </button>
                    </div>
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
                  <div className="text-center py-10 px-4 rounded-2xl bg-slate-800/40 border border-dashed border-slate-700/80 space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center text-2xl border border-red-500/20">
                      📬
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">Belum Ada Surat Masuk dari Murid di Layar Ini</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Pesan murid yang tersimpan di Google Spreadsheet (sheet <em>Pesan_Kantor_Pos</em>) dapat langsung ditarik ke sini:
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleSyncWithSpreadsheet}
                        disabled={isSyncing}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Menghubungkan...' : '🔄 Tarik Pesan dari Spreadsheet'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowManualModal(true)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
                        <span>📥 Tempel Data</span>
                      </button>
                    </div>
                  </div>
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
                  <li>Buka file <strong>Google Spreadsheet</strong> Anda (<em>Data Base Kota Refleksi</em>).</li>
                  <li>Buka menu <strong>Ekstensi &gt; Apps Script</strong>.</li>
                  <li>Hapus kode lama, lalu tempel kode Skrip Versi 2.0 yang disalin dengan tombol di atas.</li>
                  <li>Klik <strong>Terapkan (Deploy) &gt; Kelola Deployment</strong>, klik ikon pensil (Edit), pilih <strong>Versi Baru (New version)</strong>, dan klik <strong>Terapkan</strong>.</li>
                  <li>Selesai! Sekarang tombol <strong>Tarik dari Spreadsheet</strong> di Ruang Guru dapat otomatis membaca seluruh refleksi dan pesan murid.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: TEMPEL / IMPOR DATA DARI GOOGLE SPREADSHEET */}
      {showManualModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg border border-sky-500/30">
                  📥
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Impor / Tempel Data dari Spreadsheet</h3>
                  <p className="text-xs text-slate-400">Salin baris langsung dari Google Spreadsheet dan tempel di sini</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto">
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-indigo-300">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Cara Mudah:</span>
                </p>
                <ol className="list-decimal list-inside pl-1 space-y-1 text-slate-300">
                  <li>Buka spreadsheet Anda (sheet <strong>Data_Refleksi_Siswa</strong> atau <strong>Pesan_Kantor_Pos</strong>).</li>
                  <li>Blok baris data siswa yang sudah ada (dari kolom waktu sampai kolom terakhir), lalu tekan <strong>Ctrl + C</strong>.</li>
                  <li>Klik di kotak di bawah dan tekan <strong>Ctrl + V</strong> (Tempel).</li>
                </ol>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  setPasteError(null);
                }}
                rows={8}
                placeholder="Tempel baris data Google Spreadsheet Anda di sini (Ctrl + V)..."
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />

              {pasteError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{pasteError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportPastedData}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-600/20 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Proses & Tampilkan Data Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CARA UPDATE SKRIP GOOGLE APPS SCRIPT VERSI 2.0 */}
      {showScriptModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
                  📋
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Perbarui Skrip Google Apps Script (Versi 2.0)</h3>
                  <p className="text-xs text-slate-400">Hanya 1 menit agar tombol 'Tarik Data' dapat otomatis membaca spreadsheet</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <p className="font-bold text-white">Langkah Pembaruan di Google Spreadsheet:</p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed text-slate-300">
                  <li>Buka spreadsheet <strong>Data Base Kota Refleksi</strong> di tab browser Anda.</li>
                  <li>Klik menu <strong>Ekstensi &gt; Apps Script</strong>.</li>
                  <li>Tekan <strong>Ctrl + A</strong> pada editor skrip untuk memblok semua kode lama, lalu tekan <strong>Delete</strong>.</li>
                  <li>Tempelkan kode skrip Versi 2.0 yang sudah Anda salin di bawah.</li>
                  <li>Klik tombol biru <strong>Terapkan (Deploy)</strong> di kanan atas &gt; pilih <strong>Kelola Deployment</strong>.</li>
                  <li>Klik ikon <strong>Pensil (Edit)</strong> di sebelah deployment aktif Anda:
                    <div className="pl-4 pt-1 text-emerald-400 font-semibold space-y-0.5">
                      <p>• Versi: pilih <strong>Versi Baru (New version)</strong></p>
                      <p>• Siapa yang memiliki akses: tetap <strong>Siapa saja (Anyone)</strong></p>
                    </div>
                  </li>
                  <li>Klik <strong>Terapkan (Deploy)</strong>.</li>
                </ol>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                <span className="font-semibold text-emerald-200">Skrip Apps Script Versi 2.0 (Dua Arah: Simpan &amp; Tarik Data)</span>
                <button
                  type="button"
                  onClick={handleCopyGAS}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  {isCopiedGAS ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopiedGAS ? 'Kode Disalin!' : 'Salin Skrip Versi 2.0'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL 1: HAPUS SATU REFLEKSI */}
      {reflectionToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/50 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Hapus Refleksi Murid?</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Murid:</span>
                <span className="font-bold text-white">{reflectionToDelete.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kelas:</span>
                <span className="font-mono text-slate-200">{reflectionToDelete.className}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Materi:</span>
                <span className="font-medium text-indigo-300 text-right max-w-[200px] truncate">
                  {reflectionToDelete.materiTitle || 'Refleksi'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Skala Bintang:</span>
                <span className="text-amber-400 font-bold font-mono">
                  {'★'.repeat(reflectionToDelete.scale)} ({reflectionToDelete.scale}/5)
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Refleksi ini akan dihapus dari daftar Ruang Guru dan tidak akan dimuat kembali meskipun tombol Tarik Data Spreadsheet ditekan.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReflectionToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Refleksi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL 2: HAPUS REFLEKSI TERPILIH (BATCH DELETE) */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/50 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Hapus {selectedReflectionIds.length} Refleksi?</h3>
                <p className="text-xs text-slate-400">Hapus massal beberapa data sekaligus</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              Bapak/Ibu guru akan menghapus <strong>{selectedReflectionIds.length} data refleksi murid</strong> yang telah dipilih. Seluruh data tersebut akan disisihkan dari tampilan Ruang Guru.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus {selectedReflectionIds.length} Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL 3: KOSONGKAN SEMUA REFLEKSI */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/60 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/40 shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Kosongkan Semua Refleksi?</h3>
                <p className="text-xs text-rose-300">Peringatan: Seluruh data refleksi akan dihapus</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-800/60 space-y-2 text-xs text-rose-200">
              <p className="font-bold">Apakah Bapak/Ibu guru yakin ingin menghapus SEMUA ({reflections.length}) data refleksi murid?</p>
              <p className="text-slate-300">
                Pastikan Anda telah mendownload <strong>Ekspor CSV Rekap</strong> terlebih dahulu jika masih memerlukan arsip nilai dan laporan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-red-700/30 cursor-pointer transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Kosongkan Semua Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
