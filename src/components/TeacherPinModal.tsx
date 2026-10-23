import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface TeacherPinModalProps {
  onClose: () => void;
  onSuccess: () => void;
  expectedPin: string;
}

export const TeacherPinModal: React.FC<TeacherPinModalProps> = ({
  onClose,
  onSuccess,
  expectedPin,
}) => {
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    // Validates against configured pin or master teacher password 'Kiki123!'
    if (cleanPin === expectedPin || cleanPin === 'Kiki123!') {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-backdrop-fade">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl shadow-2xl p-6 text-slate-100 relative animate-fade-in-up">
        <button
          onClick={onClose}
          aria-label="Tutup Login Guru"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Akses Ruang Guru</h3>
          <p className="text-xs text-slate-400 mt-1">
            Masukkan kata sandi guru untuk membuka panel pengelolaan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="Ketik kata sandi..."
              className="w-full text-center text-lg font-bold py-3 px-10 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/60 p-2.5 rounded-xl border border-red-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Kata sandi salah! Hanya guru yang memiliki izin akses.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-sm shadow transition"
          >
            Buka Ruang Guru
          </button>
        </form>
      </div>
    </div>
  );
};
