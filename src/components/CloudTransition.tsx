import React, { useEffect, useRef, useState } from 'react';

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
  // Visual stage:
  // 'hidden': offscreen (-112% / +112%)
  // 'closed': tightly covering the screen (0% / 0%)
  // 'opening': gliding smoothly open back to offscreen (-112% / +112%)
  const [visualState, setVisualState] = useState<'hidden' | 'closed' | 'opening'>(() =>
    phase === 'opening' ? 'closed' : 'hidden'
  );
  const [progress, setProgress] = useState(0);

  const onMidpointRef = useRef(onMidpoint);
  onMidpointRef.current = onMidpoint;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (phase === 'closing') {
      // Start offscreen on the first frame, then animate smoothly to closed over 2200ms,
      // and hold closed for 400ms (total 2600ms before switching to the town view)
      setVisualState('hidden');
      setProgress(0);

      let raf1 = 0;
      let raf2 = 0;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setVisualState('closed');
          setProgress(52);
        });
      });

      const midTimer = window.setTimeout(() => {
        onMidpointRef.current?.();
      }, 2600);

      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
        clearTimeout(midTimer);
      };
    } else if (phase === 'opening') {
      // Start fully closed on the first frame so the newly mounted town view is covered,
      // then glide smoothly open over 2400ms (2600ms + 2400ms = 5000ms total 5-second process)
      setVisualState('closed');
      setProgress(52);

      let raf1 = 0;
      let raf2 = 0;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setVisualState('opening');
          setProgress(100);
        });
      });

      const endTimer = window.setTimeout(() => {
        setVisualState('hidden');
        setProgress(0);
        onCompleteRef.current?.();
      }, 2400);

      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
        clearTimeout(endTimer);
      };
    } else {
      setVisualState('hidden');
      setProgress(0);
    }
  }, [phase]);

  if (phase === 'idle' && visualState === 'hidden') {
    return null;
  }

  const isClosed = visualState === 'closed';
  const durationClass =
    phase === 'closing' ? 'duration-[2200ms]' : 'duration-[2350ms]';

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-auto overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Atmospheric sky veil that fades in smoothly when clouds close and fades out as they part */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-sky-200/75 via-sky-100/80 to-emerald-100/70 backdrop-blur-[4px] transition-opacity ${durationClass} ease-in-out ${
          isClosed ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Secondary soft parallax background cloud layer (Left) */}
      <div
        className={`absolute -top-[6vh] -bottom-[6vh] left-0 w-[68vw] min-w-[360px] transition-transform ${durationClass} ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform flex items-center`}
        style={{
          transform: isClosed ? 'translate3d(4%, 0, 0) scale(1.04)' : 'translate3d(-115%, 0, 0) scale(1)',
        }}
      >
        <svg
          viewBox="0 0 650 1000"
          className="w-full h-full object-fill opacity-75"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 0 L 470 0
               C 560 70, 520 170, 480 230
               C 590 310, 560 430, 510 510
               C 630 600, 580 730, 500 810
               C 570 890, 520 960, 450 1000
               L 0 1000 Z"
            fill="#e0f2fe"
          />
          <circle cx="490" cy="210" r="115" fill="#f0f9ff" />
          <circle cx="535" cy="480" r="140" fill="#f0f9ff" />
          <circle cx="515" cy="760" r="125" fill="#f0f9ff" />
        </svg>
      </div>

      {/* Secondary soft parallax background cloud layer (Right) */}
      <div
        className={`absolute -top-[6vh] -bottom-[6vh] right-0 w-[68vw] min-w-[360px] transition-transform ${durationClass} ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform flex items-center justify-end`}
        style={{
          transform: isClosed ? 'translate3d(-4%, 0, 0) scale(1.04)' : 'translate3d(115%, 0, 0) scale(1)',
        }}
      >
        <svg
          viewBox="0 0 650 1000"
          className="w-full h-full object-fill opacity-75"
          preserveAspectRatio="none"
        >
          <path
            d="M 650 0 L 180 0
               C 90 70, 130 170, 170 230
               C 60 310, 90 430, 140 510
               C 20 600, 70 730, 150 810
               C 80 890, 130 960, 200 1000
               L 650 1000 Z"
            fill="#e0f2fe"
          />
          <circle cx="160" cy="210" r="115" fill="#f0f9ff" />
          <circle cx="115" cy="480" r="140" fill="#f0f9ff" />
          <circle cx="135" cy="760" r="125" fill="#f0f9ff" />
        </svg>
      </div>

      {/* PRIMARY FOREGROUND LEFT CLOUD CURTAIN */}
      <div
        className={`absolute -top-[4vh] -bottom-[4vh] left-0 w-[64vw] min-w-[340px] transition-transform ${durationClass} ease-[cubic-bezier(0.33,1,0.68,1)] will-change-transform flex items-center`}
        style={{
          transform: isClosed ? 'translate3d(0%, 0, 0)' : 'translate3d(-112%, 0, 0)',
        }}
      >
        <svg
          viewBox="0 0 600 1000"
          className="w-full h-full object-fill drop-shadow-[16px_0_32px_rgba(15,23,42,0.16)]"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="cloudGradLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="75%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="cloudPuffLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.45" />
            </linearGradient>
          </defs>

          {/* Solid cloud body */}
          <path
            d="M 0 0 L 440 0 
               Q 510 80, 460 160 
               Q 560 240, 500 340 
               Q 600 440, 520 540 
               Q 610 640, 505 740 
               Q 575 840, 465 920 
               Q 525 970, 420 1000 
               L 0 1000 Z"
            fill="url(#cloudGradLeft)"
          />

          {/* Fluffy volumetric cloud lobes */}
          <circle cx="455" cy="175" r="105" fill="url(#cloudPuffLeft)" />
          <circle cx="495" cy="355" r="125" fill="url(#cloudPuffLeft)" />
          <circle cx="525" cy="540" r="135" fill="url(#cloudPuffLeft)" />
          <circle cx="495" cy="730" r="120" fill="url(#cloudPuffLeft)" />
          <circle cx="445" cy="895" r="100" fill="url(#cloudPuffLeft)" />

          {/* Soft sunlit inner highlights */}
          <circle cx="410" cy="160" r="82" fill="#ffffff" fillOpacity="0.85" />
          <circle cx="460" cy="340" r="98" fill="#ffffff" fillOpacity="0.85" />
          <circle cx="485" cy="525" r="108" fill="#ffffff" fillOpacity="0.85" />
          <circle cx="455" cy="715" r="96" fill="#ffffff" fillOpacity="0.85" />
          <circle cx="405" cy="880" r="80" fill="#ffffff" fillOpacity="0.85" />
        </svg>
      </div>

      {/* PRIMARY FOREGROUND RIGHT CLOUD CURTAIN */}
      <div
        className={`absolute -top-[4vh] -bottom-[4vh] right-0 w-[64vw] min-w-[340px] transition-transform ${durationClass} ease-[cubic-bezier(0.33,1,0.68,1)] will-change-transform flex items-center justify-end`}
        style={{
          transform: isClosed ? 'translate3d(0%, 0, 0)' : 'translate3d(112%, 0, 0)',
        }}
      >
        <svg
          viewBox="0 0 600 1000"
          className="w-full h-full object-fill drop-shadow-[-16px_0_32px_rgba(15,23,42,0.16)]"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="cloudGradRight" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="75%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="cloudPuffRight" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.45" />
            </linearGradient>
          </defs>

          {/* Solid cloud body */}
          <path
            d="M 600 0 L 160 0 
               Q 90 90, 140 170 
               Q 35 260, 100 360 
               Q 5 460, 75 560 
               Q -5 660, 95 760 
               Q 25 850, 130 930 
               Q 75 980, 180 1000 
               L 600 1000 Z"
            fill="url(#cloudGradRight)"
          />

          {/* Fluffy volumetric cloud lobes */}
          <circle cx="145" cy="185" r="108" fill="url(#cloudPuffRight)" />
          <circle cx="105" cy="375" r="128" fill="url(#cloudPuffRight)" />
          <circle cx="75" cy="560" r="135" fill="url(#cloudPuffRight)" />
          <circle cx="105" cy="740" r="122" fill="url(#cloudPuffRight)" />
          <circle cx="150" cy="900" r="102" fill="url(#cloudPuffRight)" />

          {/* Soft sunlit inner highlights */}
          <circle cx="190" cy="170" r="85" fill="#ffffff" fillOpacity="0.85" />
          <circle cx="145" cy="360" r="100" fill="#ffffff" fillOpacity="0.85" />
          <circle cx="115" cy="545" r="108" fill="#ffffff" fillOpacity="0.85" />
          <circle cx="145" cy="725" r="98" fill="#ffffff" fillOpacity="0.85" />
          <circle cx="195" cy="885" r="82" fill="#ffffff" fillOpacity="0.85" />
        </svg>
      </div>

      {/* CENTER CLOUD BADGE (Floating smoothly in the middle during the 5-second transition) */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ease-out pointer-events-none ${
          isClosed ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        }`}
      >
        <div className="flex flex-col items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl border border-sky-100 text-slate-700">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-extrabold tracking-wide">
            <span className="text-lg sm:text-xl animate-bounce">☁️</span>
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-transparent">
              {message || 'Memasuki Refleksia City...'}
            </span>
            <span className="text-base sm:text-lg animate-pulse">✨</span>
          </div>
          {/* Smooth 5-second progress bar */}
          <div className="w-44 sm:w-52 h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 transition-all duration-[2300ms] ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
