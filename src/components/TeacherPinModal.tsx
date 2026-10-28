import React, { useState } from 'react';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Settings,
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  UserCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { StorageService } from '../utils/storage.ts';
import { GOOGLE_APPS_SCRIPT_CODE } from './modals/RuangGuruModal.tsx';
import { sounds } from '../utils/audio.ts';
import { TEACHER_ACCOUNTS } from '../data/teacherAccounts.ts';
import { TeacherAccount } from '../types/index.ts';

interface TeacherPinModalProps {
  onClose: () => void;
  onSuccess: (teacherInfo?: { name: string; username: string }) => void;
  onOpenSettings?: () => void;
  expectedPin: string;
}

export const TeacherPinModal: React.FC<TeacherPinModalProps> = ({
  onClose,
  onSuccess,
  onOpenSettings,
  expectedPin,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'settings'>('login');
  const [loginMode, setLoginMode] = useState<'account' | 'pin'>('account');
  const [selectedUsername, setSelectedUsername] = useState<string>(TEACHER_ACCOUNTS[0].username);
  const [password, setPassword] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAccountList, setShowAccountList] = useState(false);

  // Settings state directly in login modal
  const initialSettings = StorageService.getSettings();
  const [gasUrlInput, setGasUrlInput] = useState(initialSettings.gasWebAppUrl || '');
  const [sheetUrlInput, setSheetUrlInput] = useState(initialSettings.spreadsheetUrl || '');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const currentTeacher = TEACHER_ACCOUNTS.find((t) => t.username === selectedUsername) || TEACHER_ACCOUNTS[0];

  const handleAccountLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPw = password.trim();

    // Check against teacher's default password, or master passwords
    if (
      cleanPw === currentTeacher.defaultPassword ||
      cleanPw === 'Kiki123!' ||
      cleanPw === expectedPin
    ) {
      sounds.playRewardXp();
      onSuccess({ name: currentTeacher.name, username: currentTeacher.username });
    } else {
      sounds.playClick();
      setError(`Password salah untuk akun ${currentTeacher.name}. Silakan periksa kembali password standar Anda.`);
    }
  };

  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinInput.trim();
    if (clean === expectedPin || clean === 'Kiki123!') {
      sounds.playRewardXp();
      onSuccess({ name: 'Guru Pembimbing DKV', username: 'guru.dkv' });
      return;
    }

    // Also check if entered password belongs to any of the 8 teachers
    const matched = TEACHER_ACCOUNTS.find((t) => t.defaultPassword === clean || t.username === clean);
    if (matched) {
      sounds.playRewardXp();
      onSuccess({ name: matched.name, username: matched.username });
      return;
    }

    sounds.playClick();
    setError('Kata sandi atau PIN guru tidak valid!');
  };

  const handleFillDefaultPassword = () => {
    setPassword(currentTeacher.defaultPassword);
    setError(null);
    sounds.playClick();
  };

  const handleTestConnection = async () => {
    const targetUrl = gasUrlInput.trim();
    if (!targetUrl || !targetUrl.startsWith('http')) {
      setTestStatus('error');
      setTestMessage('URL Google Apps Script tidak valid. Pastikan berawalan https://script.google.com/macros/s/.../exec');
      return;
    }

    setTestStatus('testing');
    setTestMessage(null);
    const start = Date.now();

    try {
      const url = new URL(targetUrl);
      url.searchParams.set('action', 'get_data');
      url.searchParams.set('_t', String(Date.now()));

      const res = await fetch(url.toString(), { method: 'GET' });
      const latency = Date.now() - start;

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const sheetName = data.spreadsheet || 'Google Spreadsheet';
      const chatCount = Array.isArray(data.chats) ? data.chats.length : 0;

      setTestStatus('success');
      setTestMessage(`Koneksi Sukses! Terhubung ke "${sheetName}" (${chatCount} chat tersimpan • ${latency}ms).`);
      sounds.playRewardXp();
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`Gagal terhubung: ${err.message || 'Periksa URL atau pastikan izin deployment adalah Anyone / Siapa saja'}.`);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const current = StorageService.getSettings();
    const updated = {
      ...current,
      gasWebAppUrl: gasUrlInput.trim(),
      spreadsheetUrl: sheetUrlInput.trim(),
    };
    StorageService.setSettings(updated);
    setIsSaved(true);
    sounds.playRewardXp();
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCopyScript = () => {
    try {
      navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setIsCopied(true);
      sounds.playClick();
      setTimeout(() => setIsCopied(false), 3000);
    } catch (e) {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-backdrop-fade">
      <div
        className={`bg-slate-900 border border-slate-700 w-full ${
          activeTab === 'settings' ? 'max-w-lg' : 'max-w-md'
        } rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 relative animate-fade-in-up transition-all max-h-[92vh] overflow-y-auto`}
      >
        <button
          onClick={onClose}
          aria-label="Tutup Login Guru"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-2xl mb-4 border border-slate-700/60 max-w-fit mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Akses Guru</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Setting Spreadsheet & Apps Script</span>
          </button>
        </div>

        {/* VIEW 1: LOGIN FORM */}
        {activeTab === 'login' && (
          <div>
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-500/30">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Login Akademik Guru DKV
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                SMKN 2 Gorontalo • Tahun Ajaran 2026/2027
              </p>
            </div>

            {/* Mode Switch: Akun Guru vs Master PIN */}
            <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/70 mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('account');
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                  loginMode === 'account'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pilih Akun Guru ({TEACHER_ACCOUNTS.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('pin');
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                  loginMode === 'pin'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                PIN / Sandi Utama
              </button>
            </div>

            {/* Sub-View: Account Login */}
            {loginMode === 'account' ? (
              <form onSubmit={handleAccountLogin} className="space-y-3.5">
                {/* Select Teacher Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Nama Guru</span>
                    <span className="text-[10px] text-amber-400 font-mono">
                      @{currentTeacher.username}
                    </span>
                  </label>
                  <select
                    value={selectedUsername}
                    onChange={(e) => {
                      setSelectedUsername(e.target.value);
                      setPassword('');
                      setError(null);
                    }}
                    className="w-full text-xs font-semibold py-2.5 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {TEACHER_ACCOUNTS.map((t) => (
                      <option key={t.username} value={t.username}>
                        {t.no}. {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      Password Standar Akun
                    </label>
                    <button
                      type="button"
                      onClick={handleFillDefaultPassword}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                    >
                      ⚡ Isi Otomatis
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder={`Ketik password (cth: ${currentTeacher.defaultPassword})`}
                      className="w-full text-xs font-medium py-2.5 pl-3 pr-10 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-xs text-red-400 bg-red-950/60 p-2.5 rounded-xl border border-red-800 leading-snug">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs shadow transition cursor-pointer active:scale-95"
                >
                  Masuk sebagai {currentTeacher.name.split(',')[0]}
                </button>
              </form>
            ) : (
              /* Sub-View: Master PIN / Password */
              <form onSubmit={handlePinLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Ketik Kata Sandi / Master PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoFocus
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        setError(null);
                      }}
                      placeholder="Masukkan kata sandi guru..."
                      className="w-full text-center text-sm font-bold py-2.5 px-10 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/60 p-2.5 rounded-xl border border-red-800">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs shadow transition cursor-pointer active:scale-95"
                >
                  Buka Ruang Guru
                </button>
              </form>
            )}

            {/* Expandable Teacher Account Directory Reference */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowAccountList(!showAccountList)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-amber-300 transition py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Daftar 8 Akun Guru DKV (SMKN 2 Gorontalo)</span>
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showAccountList ? 'rotate-180 text-amber-400' : ''}`}
                />
              </button>

              {showAccountList && (
                <div className="mt-2 p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 max-h-48 overflow-y-auto space-y-1.5 text-[11px]">
                  {TEACHER_ACCOUNTS.map((t) => (
                    <div
                      key={t.username}
                      onClick={() => {
                        setSelectedUsername(t.username);
                        setPassword(t.defaultPassword);
                        setLoginMode('account');
                        setError(null);
                        sounds.playClick();
                      }}
                      className="p-1.5 rounded-lg bg-slate-900/70 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer flex items-center justify-between"
                      title="Klik untuk memilih akun ini"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-white truncate">{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">@{t.username}</p>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
                        {t.defaultPassword}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
              >
                <Settings className="w-3 h-3" />
                <span>Konfigurasi Google Spreadsheet & Apps Script &gt;</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: SETTINGS SPREADSHEET & APPS SCRIPT FORM */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Setting Spreadsheet & Apps Script</h3>
                  <p className="text-[11px] text-slate-400">
                    Sinkronisasi realtime obrolan murid & data refleksi
                  </p>
                </div>
              </div>

              {sheetUrlInput && (
                <a
                  href={sheetUrlInput}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-xl"
                >
                  <span>Buka Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {isSaved && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500 rounded-xl flex items-center gap-2 text-emerald-200 text-xs font-bold animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Pengaturan Spreadsheet & Apps Script berhasil disimpan!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-3.5">
              {/* URL Google Spreadsheet */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>URL Google Spreadsheet</span>
                </label>
                <input
                  type="url"
                  value={sheetUrlInput}
                  onChange={(e) => setSheetUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full text-xs font-medium py-2.5 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500 font-mono"
                />
              </div>

              {/* URL Google Apps Script Web App */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-mono text-xs">&lt;/&gt;</span>
                  <span>URL Google Apps Script (Web App /exec)</span>
                </label>
                <input
                  type="url"
                  value={gasUrlInput}
                  onChange={(e) => setGasUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full text-xs font-medium py-2.5 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500 font-mono"
                />
              </div>

              {/* Action Buttons: Test Connection & Copy Script */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-sky-300 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span>{testStatus === 'testing' ? '⏳ Menguji...' : '⚡ Uji Koneksi'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-amber-300 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Tersalin!' : '📋 Salin Skrip'}</span>
                  </button>
                </div>

                {testMessage && (
                  <p
                    className={`text-xs p-2 rounded-lg ${
                      testStatus === 'success'
                        ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-900/50 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {testMessage}
                  </p>
                )}
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow transition cursor-pointer active:scale-95"
              >
                💾 Simpan Pengaturan Cloud
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
