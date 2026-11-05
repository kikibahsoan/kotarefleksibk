import React, { useEffect, useState } from 'react';

interface CloudTransitionProps {
  phase: 'idle' | 'closing' | 'opening';
  message?: string;
  onMidpoint?: () => void;
  onComplete?: () => void;
}

export const CloudTransition: React.FC<CloudTransitionProps> = ({
  phase,
  message,
  onMidpoint,
  onComplete,
}) => {
  const [internalPhase, setInternalPhase] = useState<'idle' | 'closing' | 'opening'>('idle');

  useEffect(() => {
    if (phase === 'closing') {
      setInternalPhase('closing');
      // After clouds close in (~550ms), trigger midpoint to switch page underneath
      const midTimer = setTimeout(() => {
        onMidpoint?.();
      }, 550);
      return () => clearTimeout(midTimer);
    } else if (phase === 'opening') {
      setInternalPhase('opening');
      // After clouds open up (~600ms), finish transition
      const endTimer = setTimeout(() => {
        setInternalPhase('idle');
        onComplete?.();
      }, 620);
      return () => clearTimeout(endTimer);
    } else {
      setInternalPhase('idle');
    }
  }, [phase, onMidpoint, onComplete]);

  if (internalPhase === 'idle' && phase === 'idle') {
    return null;
  }

  // Determine transform state for the two halves of clouds
  // 'closing' -> gliding towards center (transform: translateX(0))
  // 'opening' -> gliding away from center (left: translateX(-105%), right: translateX(105%))
  const isCovering = internalPhase === 'closing' || phase === 'closing';

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Soft sky backdrop veil that fades during transition */}
      <div
        className={`absolute inset-0 bg-sky-200/40 backdrop-blur-[2px] transition-opacity duration-500 ease-in-out ${
          isCovering ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* LEFT CLOUD CURTAIN */}
      <div
        className="absolute top-0 bottom-0 left-0 w-[58vw] min-w-[320px] transition-transform duration-[580ms] ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center"
        style={{
          transform: isCovering ? 'translateX(0%)' : 'translateX(-108%)',
        }}
      >
        <svg
          viewBox="0 0 600 1000"
          className="w-full h-full object-fill drop-shadow-[12px_0_24px_rgba(15,23,42,0.18)]"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="cloudGradLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="cloudPuffLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Base solid curtain */}
          <path
            d="M 0 0 L 420 0 
               Q 490 80, 440 160 
               Q 540 240, 480 340 
               Q 580 440, 500 540 
               Q 600 640, 490 740 
               Q 560 840, 450 920 
               Q 510 970, 400 1000 
               L 0 1000 Z"
            fill="url(#cloudGradLeft)"
          />

          {/* Puffy 3D Cloud Lobes */}
          <circle cx="440" cy="180" r="95" fill="url(#cloudPuffLeft)" />
          <circle cx="480" cy="360" r="115" fill="url(#cloudPuffLeft)" />
          <circle cx="510" cy="540" r="125" fill="url(#cloudPuffLeft)" />
          <circle cx="480" cy="730" r="110" fill="url(#cloudPuffLeft)" />
          <circle cx="430" cy="890" r="90" fill="url(#cloudPuffLeft)" />

          {/* Crisp highlight edge */}
          <circle cx="400" cy="160" r="75" fill="#ffffff" fillOpacity="0.75" />
          <circle cx="450" cy="340" r="90" fill="#ffffff" fillOpacity="0.75" />
          <circle cx="475" cy="520" r="100" fill="#ffffff" fillOpacity="0.75" />
          <circle cx="445" cy="710" r="90" fill="#ffffff" fillOpacity="0.75" />
        </svg>
      </div>

      {/* RIGHT CLOUD CURTAIN */}
      <div
        className="absolute top-0 bottom-0 right-0 w-[58vw] min-w-[320px] transition-transform duration-[580ms] ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-end"
        style={{
          transform: isCovering ? 'translateX(0%)' : 'translateX(108%)',
        }}
      >
        <svg
          viewBox="0 0 600 1000"
          className="w-full h-full object-fill drop-shadow-[-12px_0_24px_rgba(15,23,42,0.18)]"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="cloudGradRight" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="cloudPuffRight" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Base solid curtain */}
          <path
            d="M 600 0 L 180 0 
               Q 110 90, 160 170 
               Q 50 260, 120 360 
               Q 20 460, 90 560 
               Q 10 660, 110 760 
               Q 40 850, 140 930 
               Q 90 980, 200 1000 
               L 600 1000 Z"
            fill="url(#cloudGradRight)"
          />

          {/* Puffy 3D Cloud Lobes */}
          <circle cx="160" cy="190" r="100" fill="url(#cloudPuffRight)" />
          <circle cx="120" cy="380" r="120" fill="url(#cloudPuffRight)" />
          <circle cx="90" cy="560" r="125" fill="url(#cloudPuffRight)" />
          <circle cx="120" cy="740" r="115" fill="url(#cloudPuffRight)" />
          <circle cx="160" cy="900" r="95" fill="url(#cloudPuffRight)" />

          {/* Crisp highlight edge */}
          <circle cx="200" cy="170" r="80" fill="#ffffff" fillOpacity="0.75" />
          <circle cx="155" cy="360" r="95" fill="#ffffff" fillOpacity="0.75" />
          <circle cx="125" cy="540" r="100" fill="#ffffff" fillOpacity="0.75" />
          <circle cx="155" cy="720" r="95" fill="#ffffff" fillOpacity="0.75" />
        </svg>
      </div>

      {/* CENTER CLOUD PUFF (Floating in the middle when closed) */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ease-out pointer-events-none ${
          isCovering ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md shadow-lg border border-slate-100/60 text-slate-700 text-xs sm:text-sm font-extrabold tracking-wide">
          <span className="text-base sm:text-lg animate-pulse">☁️</span>
          <span className="bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
            {message || 'Memasuki Refleksia City...'}
          </span>
          <span className="text-base sm:text-lg animate-pulse">✨</span>
        </div>
      </div>
    </div>
  );
};
